"""Turning a store item into something a CSL processor renders correctly.

``task:0030`` builds the rendered file; this covers the normalisation that
happens on the way in, which had no tests until `audit:0011` F20 showed 12
entries in the committed corpus rendering a visibly broken author initial.
"""

from __future__ import annotations

from atlas_citations.commands.render import _csl_item, _name_for_processor


class TestNamesTheProcessorCanInitialise:
    """A style abbreviates a given name, and citeproc-py only initialises a
    capitalised segment. Both shapes below rendered as garbage before F20."""

    def test_a_trailing_particle_moves_out_of_the_given_name(self) -> None:
        """`given: "Christiaan van"` rendered as "Merwijk, C. van ."."""
        out = _name_for_processor({"family": "Merwijk", "given": "Christiaan van"})
        assert out["given"] == "Christiaan"
        assert out["non-dropping-particle"] == "van"

    def test_a_multiword_particle_moves_as_one_unit(self) -> None:
        out = _name_for_processor({"family": "Witt", "given": "Christian Schroeder de"})
        assert out["given"] == "Christian Schroeder"
        assert out["non-dropping-particle"] == "de"

    def test_a_hyphenated_given_name_capitalises_each_segment(self) -> None:
        """`given: "Jen-tse"` rendered as "Huang, J.-. tse ."."""
        assert _name_for_processor({"family": "Huang", "given": "Jen-tse"})["given"] == "Jen-Tse"

    def test_an_already_correct_name_is_untouched(self) -> None:
        name = {"family": "Hoffmann", "given": "Jordan"}
        assert _name_for_processor(name) == name

    def test_a_wholly_lowercase_given_name_survives(self) -> None:
        """The particle rule keeps at least one token, so "danah boyd" is safe.

        There is no word list to consult: particles are lowercase and given
        names are capitalised. That heuristic must not eat the whole name when
        someone genuinely writes theirs in lowercase.
        """
        out = _name_for_processor({"family": "boyd", "given": "danah"})
        assert out["given"] == "danah"
        assert "non-dropping-particle" not in out

    def test_an_explicit_particle_is_not_overwritten(self) -> None:
        name = {"family": "Merwijk", "given": "Christiaan van", "non-dropping-particle": "van der"}
        assert _name_for_processor(name)["non-dropping-particle"] == "van der"

    def test_an_organisation_name_has_no_given_to_normalise(self) -> None:
        name = {"literal": "OpenAI"}
        assert _name_for_processor(name) == name


class TestItemsTheProcessorAccepts:
    def test_every_name_field_is_normalised_not_just_author(self) -> None:
        """CSL defines a dozen name variables; the pass is duck-typed, not listed."""
        out = _csl_item(
            "https://example.org/x",
            {
                "id": "x",
                "author": [{"family": "Merwijk", "given": "Christiaan van"}],
                "editor": [{"family": "Arx", "given": "Stefano von"}],
            },
        )
        assert out["author"][0]["non-dropping-particle"] == "van"
        assert out["editor"][0]["non-dropping-particle"] == "von"

    def test_a_null_field_is_dropped(self) -> None:
        """A resolver writes `volume: null`; citeproc-py calls int() on it."""
        assert "volume" not in _csl_item("k", {"id": "k", "volume": None})

    def test_a_date_with_no_usable_parts_is_dropped_rather_than_passed_on(self) -> None:
        """Crossref sends `{"date-parts": [[null]]}` for a record it cannot date."""
        assert "issued" not in _csl_item("k", {"id": "k", "issued": {"date-parts": [[None]]}})

    def test_the_key_wins_over_a_stored_id(self) -> None:
        assert _csl_item("https://example.org/x", {"id": "stale"})["id"] == "https://example.org/x"

    def test_a_non_name_list_is_left_alone(self) -> None:
        """`date-parts` holds lists of ints, not name dicts."""
        item = {"id": "k", "issued": {"date-parts": [[2024, 5]]}}
        assert _csl_item("k", item)["issued"] == {"date-parts": [[2024, 5]]}
