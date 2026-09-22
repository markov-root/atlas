"""Incremental resolution and the redo path."""

from __future__ import annotations

from atlas_citations.commands.resolve import apply_resolution, unresolved_keys
from atlas_citations.store import entry_from_anchor


def anchor(key: str, text: str, author: str = "A", year: str = "2020") -> dict:
    return entry_from_anchor(key, text, {"author": author, "year": year})


def resolved(key: str, text: str, by: str) -> dict:
    return {**anchor(key, text), "resolvedBy": by}


class TestUnresolvedKeys:
    def test_selects_only_entries_still_holding_anchor_text(self) -> None:
        store = {
            "https://a.org/x": anchor("https://a.org/x", "A, 2020"),
            "https://b.org/y": resolved("https://b.org/y", "B, 2021", "arxiv"),
        }
        assert unresolved_keys(store) == ["https://a.org/x"]

    def test_is_empty_once_everything_is_resolved_so_a_second_run_does_no_work(self) -> None:
        store = {"https://a.org/x": resolved("https://a.org/x", "A, 2020", "crossref")}
        assert unresolved_keys(store) == []

    def test_is_sorted_so_a_run_is_reproducible(self) -> None:
        store = {
            "https://z.org/x": anchor("https://z.org/x", "Z, 2020"),
            "https://a.org/x": anchor("https://a.org/x", "A, 2020"),
        }
        assert unresolved_keys(store) == ["https://a.org/x", "https://z.org/x"]


class TestRedo:
    """Making an improved resolver reachable for entries a weaker one already claimed."""

    store = {
        "https://nature.com/a": resolved("https://nature.com/a", "A, 2020", "opengraph"),
        "https://lesswrong.com/b": resolved("https://lesswrong.com/b", "B, 2021", "opengraph"),
        "https://arxiv.org/abs/1": resolved("https://arxiv.org/abs/1", "C, 2022", "arxiv"),
        "https://x.org/d": anchor("https://x.org/d", "D, 2023"),
    }

    def test_leaves_everything_resolved_when_no_redo_is_asked_for(self) -> None:
        assert unresolved_keys(self.store) == ["https://x.org/d"]

    def test_includes_entries_from_a_redone_resolver(self) -> None:
        assert "https://nature.com/a" in unresolved_keys(self.store, ["opengraph"])

    def test_redoes_only_urls_another_resolver_would_now_claim(self) -> None:
        """After adding a publisher resolver, redo the Nature page — not 600 blog posts."""
        out = unresolved_keys(self.store, ["opengraph"], lambda u: "nature.com" in u)
        assert "https://nature.com/a" in out
        assert "https://lesswrong.com/b" not in out

    def test_never_drops_anchor_only_entries_whatever_the_redo_asks_for(self) -> None:
        assert "https://x.org/d" in unresolved_keys(self.store, ["opengraph"], lambda u: False)

    def test_does_not_touch_resolvers_outside_the_redo_list(self) -> None:
        assert "https://arxiv.org/abs/1" not in unresolved_keys(self.store, ["opengraph"])


class TestApplyResolution:
    def test_resolved_metadata_wins_over_anchor_derived_guesses(self) -> None:
        e = anchor("https://arxiv.org/abs/1911.01547", "Chollet, 2019", "Chollet", "2019")
        assert e["item"]["title"] == "Chollet, 2019"
        out = apply_resolution(
            e,
            {"title": "On the Measure of Intelligence", "author": [{"family": "Chollet"}]},
            "arxiv",
        )
        assert out["item"]["title"] == "On the Measure of Intelligence"
        assert out["resolvedBy"] == "arxiv"

    def test_keeps_fields_the_resolver_did_not_return(self) -> None:
        """A partial result is an improvement, not a replacement."""
        e = anchor("https://a.org/x", "Smith, 2020", "Smith", "2020")
        out = apply_resolution(e, {"title": "A Real Title"}, "opengraph")
        assert out["item"]["issued"] == {"date-parts": [[2020]]}

    def test_drops_the_unresolved_note_once_an_entry_is_resolved(self) -> None:
        e = anchor("https://a.org/x", "Smith, 2020")
        assert "Unresolved" in e["item"]["note"]
        assert "note" not in apply_resolution(e, {"title": "T"}, "opengraph")["item"]

    def test_a_resolver_note_replaces_the_unresolved_one(self) -> None:
        e = anchor("https://a.org/x", "Smith, 2020")
        out = apply_resolution(e, {"title": "T"}, "oembed", "No publication date.")
        assert out["item"]["note"] == "No publication date."

    def test_never_lets_a_resolver_change_an_entry_id(self) -> None:
        """Identity is the URL (task:0021 D1)."""
        e = anchor("https://a.org/x", "Smith, 2020")
        out = apply_resolution(e, {"id": "https://evil.org/other", "title": "T"}, "opengraph")
        assert out["item"]["id"] == "https://a.org/x"

    def test_preserves_the_observed_anchor_spellings(self) -> None:
        e = anchor("https://a.org/x", "Smith, 2020")
        assert apply_resolution(e, {"title": "T"}, "arxiv")["anchors"] == ["Smith, 2020"]

    def test_does_not_mutate_the_entry_it_was_given(self) -> None:
        e = anchor("https://a.org/x", "Smith, 2020")
        apply_resolution(e, {"title": "T"}, "arxiv")
        assert e["item"]["title"] == "Smith, 2020"
        assert e["resolvedBy"] == "anchor"
