"""Reviewed metadata for sources no API describes. ``task:0032`` AC-5."""

from __future__ import annotations

from atlas_citations.commands.resolve import effective_redo, unresolved_keys
from atlas_citations.overrides import (
    OVERRIDE_SOURCE,
    apply_override,
    apply_overrides,
    parse_overrides,
    serialize_overrides,
)
from atlas_citations.store import entry_from_anchor

KEY = "https://rand.org/pubs/research_reports/RR2703.html"


def anchor_entry(key: str = KEY) -> dict:
    return entry_from_anchor(key, "Geist & Lohn, 2018", {"author": "Geist & Lohn", "year": "2018"})


class TestApplyingOneOverride:
    def test_reviewed_fields_win_over_the_anchor(self) -> None:
        out = apply_override(
            anchor_entry(),
            {
                "title": "How Might Artificial Intelligence Affect the Risk of Nuclear War?",
                "type": "report",
                "container-title": "RAND Corporation",
            },
        )
        assert out["item"]["title"].startswith("How Might Artificial Intelligence")
        assert out["item"]["type"] == "report"
        assert out["resolvedBy"] == OVERRIDE_SOURCE

    def test_the_unresolved_note_is_dropped(self) -> None:
        """It marks an entry as needing work, and this one no longer does."""
        assert "note" not in apply_override(anchor_entry(), {"title": "T"})["item"]

    def test_identity_is_not_overridable(self) -> None:
        """``task:0021`` D1. A typo here would silently detach an entry from its citations."""
        out = apply_override(
            anchor_entry(), {"title": "T", "id": "something-else", "URL": "https://elsewhere/"}
        )
        assert out["item"]["id"] == KEY
        assert out["item"]["URL"] == KEY

    def test_anchors_survive(self) -> None:
        """The report needs them to say how a source is cited in the prose."""
        assert apply_override(anchor_entry(), {"title": "T"})["anchors"] == ["Geist & Lohn, 2018"]

    def test_fields_not_given_fall_back_to_what_was_there(self) -> None:
        entry = anchor_entry()
        out = apply_override(entry, {"title": "T"})
        assert out["item"]["issued"] == entry["item"]["issued"]


class TestApplyingAFile:
    def test_an_override_for_an_unknown_url_is_reported_not_ignored(self) -> None:
        """A file like this rots the moment a stale line stops being visible.

        Almost always a typo, or a citation edited out of the prose since.
        """
        store = {KEY: anchor_entry()}
        out, unmatched = apply_overrides(
            store, {KEY: {"title": "T"}, "https://typo.example/x": {"title": "U"}}
        )
        assert out[KEY]["resolvedBy"] == OVERRIDE_SOURCE
        assert unmatched == ["https://typo.example/x"]

    def test_an_empty_block_is_a_stub_not_an_instruction_to_blank_the_entry(self) -> None:
        parsed = parse_overrides(f"{KEY}:\nhttps://other.example/x:\n  title: Real\n")
        assert KEY not in parsed
        assert parsed["https://other.example/x"] == {"title": "Real"}

    def test_a_comment_only_file_yields_no_overrides(self) -> None:
        assert parse_overrides("# nothing here yet\n") == {}

    def test_round_trips(self) -> None:
        overrides = {KEY: {"title": "T", "author": [{"literal": "RAND"}]}}
        assert parse_overrides(serialize_overrides(overrides)) == overrides

    def test_serialization_is_sorted_so_diffs_stay_reviewable(self) -> None:
        text = serialize_overrides(
            {"https://b.example/": {"title": "B"}, "https://a.example/": {"title": "A"}}
        )
        assert text.index("https://a.example/") < text.index("https://b.example/")


class TestOverridesAreNeverReFetched:
    def test_an_overridden_entry_is_not_in_the_resolve_worklist(self) -> None:
        store = {KEY: apply_override(anchor_entry(), {"title": "T"})}
        assert unresolved_keys(store) == []

    def test_redo_cannot_target_an_override(self) -> None:
        """``task:0032`` D4 - the whole value of the file is that it stays put.

        The guard is in ``effective_redo``, which is what the command passes to
        ``unresolved_keys``; asserted as that composition rather than on either
        half, because either half alone would still let the other be bypassed.
        """
        store = {KEY: apply_override(anchor_entry(), {"title": "T"})}
        assert effective_redo([OVERRIDE_SOURCE, "opengraph"]) == ["opengraph"]
        assert unresolved_keys(store, redo=effective_redo([OVERRIDE_SOURCE])) == []
