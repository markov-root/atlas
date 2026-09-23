"""BibTeX and CSL-JSON export.

``task:0029`` AC-2. The first test class is the one that matters: the TypeScript
serializer emitted ``author = {A} and {B}``, which terminates the field value at
the first closing brace, and it shipped that way across 303 arXiv entries. The
fix went in at ``6c4263e``; these tests pin it, and the port hands the mechanics
to ``bibtexparser`` so the class of bug cannot recur by hand.

The parse-back tests are deliberate: asserting on emitted *text* is how the
original bug survived review - a pre-existing test asserted
``author = {Giattino et al.}`` and thereby encoded the very defect its own
comment described. Reading the output back with a parser asks the question that
actually matters, which is whether a reference manager recovers the authors.
"""

from __future__ import annotations

import json

import bibtexparser
import pytest

from atlas_citations.commands.export import (
    assign_bibtex_keys,
    base_bibtex_key,
    bibtex_entry,
    bibtex_name,
    serialize_bibtex,
    serialize_csl_json,
)


def entry(item: dict, resolved_by: str = "arxiv") -> dict:
    return {"item": item, "resolvedBy": resolved_by, "anchors": []}


def one_entry_bib(item: dict) -> str:
    return serialize_bibtex({item["id"]: entry(item)})


HOFFMANN = {
    "id": "https://arxiv.org/abs/2203.15556",
    "type": "article",
    "title": "Training Compute-Optimal Large Language Models",
    "URL": "https://arxiv.org/abs/2203.15556",
    "author": [
        {"family": "Hoffmann", "given": "Jordan"},
        {"family": "Borgeaud", "given": "Sebastian"},
        {"family": "Mensch", "given": "Arthur"},
    ],
    "issued": {"date-parts": [[2022]]},
}


class TestMultiAuthorRegression:
    """The defect ``6c4263e`` fixed. It affected all 303 arXiv entries."""

    def test_all_authors_survive_a_parse_round_trip(self) -> None:
        library = bibtexparser.parse_string(one_entry_bib(HOFFMANN))
        assert len(library.entries) == 1
        authors = library.entries[0]["author"]
        assert "Hoffmann, Jordan" in authors
        assert "Borgeaud, Sebastian" in authors
        assert "Mensch, Arthur" in authors

    def test_the_author_field_is_not_terminated_at_the_first_brace(self) -> None:
        bib = one_entry_bib(HOFFMANN)
        assert "{Hoffmann, Jordan} and" not in bib, (
            "per-name braces terminate the field value - this is the 6c4263e bug"
        )

    def test_names_are_separated_by_the_bibtex_keyword(self) -> None:
        library = bibtexparser.parse_string(one_entry_bib(HOFFMANN))
        assert library.entries[0]["author"].count(" and ") == 2

    def test_a_whole_store_of_multi_author_entries_reparses(self) -> None:
        """The corpus-scale version: 303 entries had real author lists."""
        store = {
            f"https://arxiv.org/abs/{n}": entry({**HOFFMANN, "id": f"https://arxiv.org/abs/{n}"})
            for n in range(20)
        }
        library = bibtexparser.parse_string(serialize_bibtex(store))
        assert len(library.entries) == 20
        assert all(e["author"].count(" and ") == 2 for e in library.entries)
        assert library.failed_blocks == []


class TestBibtexName:
    def test_a_structured_name_is_emitted_bare_so_bibtex_can_split_it(self) -> None:
        assert bibtex_name({"family": "Hoffmann", "given": "Jordan"}) == "Hoffmann, Jordan"

    def test_a_family_only_name_is_bare(self) -> None:
        assert bibtex_name({"family": "Chollet"}) == "Chollet"

    def test_a_literal_name_is_braced_so_bibtex_does_not_split_it(self) -> None:
        """``task:0025`` keeps unparseable names unparsed; the braces carry that decision."""
        assert bibtex_name({"literal": "Giattino et al."}) == "{Giattino et al.}"

    def test_an_empty_name_yields_nothing_to_join(self) -> None:
        assert bibtex_name({}) == ""


class TestKeys:
    def test_a_key_is_content_derived(self) -> None:
        assert base_bibtex_key(HOFFMANN) == "hoffmann2022training"

    def test_the_title_word_is_dropped_when_it_repeats_the_name(self) -> None:
        """An unresolved entry's title is its anchor text - 'chollet2019chollet' is absurd."""
        item = {
            "id": "u",
            "type": "webpage",
            "title": "Chollet, 2019",
            "author": [{"literal": "Chollet"}],
            "issued": {"date-parts": [[2019]]},
        }
        assert base_bibtex_key(item) == "chollet2019"

    def test_an_authorless_entry_still_gets_a_key(self) -> None:
        assert base_bibtex_key({"id": "u", "type": "webpage", "title": "Something"}).startswith(
            "anonymous"
        )

    def test_keys_are_unique_within_a_store(self) -> None:
        store = {
            f"https://a.org/{n}": entry({**HOFFMANN, "id": f"https://a.org/{n}"}) for n in range(5)
        }
        keys = assign_bibtex_keys(store)
        assert len(set(keys.values())) == 5

    def test_a_non_colliding_key_is_unaffected_by_the_rest_of_the_store(self) -> None:
        """The guarantee that actually holds - keys are written into every ``\\cite``."""
        alone = {"https://a.org/1": entry({**HOFFMANN, "id": "https://a.org/1"})}
        crowded = {
            "https://a.org/1": entry({**HOFFMANN, "id": "https://a.org/1"}),
            "https://b.org/x": entry(
                {
                    "id": "https://b.org/x",
                    "type": "webpage",
                    "title": "Something Else",
                    "author": [{"family": "Other"}],
                    "issued": {"date-parts": [[2020]]},
                }
            ),
        }
        assert (
            assign_bibtex_keys(alone)["https://a.org/1"]
            == assign_bibtex_keys(crowded)["https://a.org/1"]
        )

    def test_a_colliding_sibling_can_move_a_bare_key(self) -> None:
        """The narrower truth, pinned so it is a decision and not a surprise.

        Within a colliding group the earliest-sorting URL keeps the bare key. The
        TypeScript claimed adding an entry "cannot renumber anyone"; it can, for
        collisions only. See ``assign_bibtex_keys`` and ``audit:0011`` F8.
        """
        alone = {"https://a.org/1": entry({**HOFFMANN, "id": "https://a.org/1"})}
        with_earlier = {
            "https://a.org/1": entry({**HOFFMANN, "id": "https://a.org/1"}),
            "https://a.org/0": entry({**HOFFMANN, "id": "https://a.org/0"}),
        }
        assert assign_bibtex_keys(alone)["https://a.org/1"] == "hoffmann2022training"
        assert assign_bibtex_keys(with_earlier)["https://a.org/0"] == "hoffmann2022training"
        assert assign_bibtex_keys(with_earlier)["https://a.org/1"] != "hoffmann2022training"

    def test_collision_suffixes_are_deterministic(self) -> None:
        store = {
            "https://a.org/1": entry({**HOFFMANN, "id": "https://a.org/1"}),
            "https://a.org/0": entry({**HOFFMANN, "id": "https://a.org/0"}),
        }
        assert assign_bibtex_keys(store) == assign_bibtex_keys(store)


class TestFieldMapping:
    def test_a_journal_article_gets_a_journal_field(self) -> None:
        e = bibtex_entry("k", {"id": "u", "type": "article-journal", "container-title": "Nature"})
        assert e.entry_type == "article"
        assert e["journal"] == "Nature"

    def test_a_conference_paper_gets_a_booktitle(self) -> None:
        e = bibtex_entry("k", {"id": "u", "type": "paper-conference", "container-title": "NeurIPS"})
        assert e.entry_type == "inproceedings"
        assert e["booktitle"] == "NeurIPS"

    def test_a_webpage_carries_its_url_as_howpublished(self) -> None:
        e = bibtex_entry("k", {"id": "u", "type": "webpage", "URL": "https://a.org/x"})
        assert e.entry_type == "misc"
        assert e["howpublished"] == "https://a.org/x"

    def test_an_unknown_type_falls_back_to_misc(self) -> None:
        assert bibtex_entry("k", {"id": "u", "type": "nonsense"}).entry_type == "misc"


class TestSpecialCharacters:
    @pytest.mark.parametrize(
        "title",
        [
            "Cost & Scale: 100% of the Problem",
            "A {braced} title",
            "Back\\slash and #hash and _underscore",
            "Unicode - em dash, é, 中文",
        ],
    )
    def test_a_difficult_title_survives_a_parse_round_trip(self, title: str) -> None:
        item = {"id": "https://a.org/x", "type": "webpage", "title": title}
        library = bibtexparser.parse_string(one_entry_bib(item))
        assert library.failed_blocks == [], f"{title!r} produced an unparseable entry"
        assert len(library.entries) == 1


class TestWholeFile:
    def test_output_is_stable_across_runs(self) -> None:
        store = {"https://a.org/x": entry({**HOFFMANN, "id": "https://a.org/x"})}
        assert serialize_bibtex(store) == serialize_bibtex(store)

    def test_an_empty_store_still_produces_a_valid_file(self) -> None:
        assert bibtexparser.parse_string(serialize_bibtex({})).entries == []

    def test_csl_json_is_valid_json_in_key_order(self) -> None:
        store = {
            "https://b.org/x": entry({"id": "https://b.org/x", "type": "webpage"}),
            "https://a.org/x": entry({"id": "https://a.org/x", "type": "webpage"}),
        }
        items = json.loads(serialize_csl_json(store))
        assert [i["id"] for i in items] == ["https://a.org/x", "https://b.org/x"]
