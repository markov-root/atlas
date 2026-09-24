"""Reviewed identity decisions: several URLs, one work. ``task:0031``."""

from __future__ import annotations

from atlas_citations.aliases import Aliases, fold_aliases, parse_aliases, serialize_aliases
from atlas_citations.commands.report import duplicate_groups
from atlas_citations.scan import Chapter, Citation, Scan, Section, apply_aliases
from atlas_citations.store import entry_from_anchor

KEEP = "https://deepmind.google/discover/blog/specification-gaming"
DROP = "https://deepmind.com/blog/specification-gaming"

FILE = f"""
aliases:
  {KEEP}:
    - {DROP}
not-duplicates:
  - - https://example.org/a
    - https://example.org/b
"""


def resolved(key: str, title: str, anchors: list[str], by: str = "opengraph") -> dict:
    entry = entry_from_anchor(key, anchors[0], {"author": "Krakovna", "year": "2020"})
    entry["item"]["title"] = title
    entry["item"].pop("note", None)
    entry["resolvedBy"] = by
    entry["anchors"] = anchors
    return entry


class TestParsing:
    def test_reads_both_sections(self) -> None:
        aliases = parse_aliases(FILE)
        assert aliases.groups == {KEEP: [DROP]}
        assert aliases.of == {DROP: KEEP}
        assert aliases.not_duplicates == [["https://example.org/a", "https://example.org/b"]]

    def test_an_empty_or_comment_only_file_aliases_nothing(self) -> None:
        assert parse_aliases("# nothing here\n").groups == {}
        assert parse_aliases("").groups == {}

    def test_a_url_cannot_be_its_own_alias(self) -> None:
        """Self-aliasing would delete the entry it was meant to keep."""
        assert parse_aliases(f"aliases:\n  {KEEP}:\n    - {KEEP}\n").groups == {}

    def test_a_group_of_one_is_not_a_rejected_duplicate(self) -> None:
        assert parse_aliases("not-duplicates:\n  - - https://a.org/x\n").not_duplicates == []

    def test_round_trips_through_serialization(self) -> None:
        aliases = parse_aliases(FILE)
        assert parse_aliases(serialize_aliases(aliases)).groups == aliases.groups

    def test_resolution_is_single_step(self) -> None:
        """A chain would make the file's effect depend on its own ordering."""
        aliases = parse_aliases(
            "aliases:\n  https://a.org/1:\n    - https://b.org/2\n"
            "  https://b.org/2:\n    - https://c.org/3\n"
        )
        assert aliases.resolve("https://c.org/3") == "https://b.org/2"
        assert aliases.chains() == [("https://c.org/3", "https://b.org/2")]

    def test_a_file_with_no_chain_reports_none(self) -> None:
        assert parse_aliases(FILE).chains() == []


class TestFolding:
    def test_the_aliased_entry_is_deleted(self) -> None:
        store = {
            KEEP: resolved(KEEP, "Specification gaming", ["Krakovna, 2020"]),
            DROP: resolved(DROP, "Specification gaming", ["Krakovna et al., 2020"]),
        }
        out, removed, stale = fold_aliases(store, parse_aliases(FILE))
        assert DROP not in out
        assert removed == [(DROP, KEEP)]
        assert stale == []

    def test_the_survivor_keeps_its_own_metadata(self) -> None:
        """``task:0031`` D2. A merged description is one neither source stated."""
        store = {
            KEEP: resolved(KEEP, "The kept title", ["a"]),
            DROP: resolved(DROP, "The dropped title", ["b"]),
        }
        out, _, _ = fold_aliases(store, parse_aliases(FILE))
        assert out[KEEP]["item"]["title"] == "The kept title"

    def test_the_anchor_spellings_transfer(self) -> None:
        """A spelling belongs to the work, not to the address it was linked at."""
        store = {
            KEEP: resolved(KEEP, "T", ["Krakovna, 2020"]),
            DROP: resolved(DROP, "T", ["Krakovna et al., 2020"]),
        }
        out, _, _ = fold_aliases(store, parse_aliases(FILE))
        assert out[KEEP]["anchors"] == ["Krakovna et al., 2020", "Krakovna, 2020"]

    def test_the_survivor_records_where_else_the_work_lives(self) -> None:
        store = {KEEP: resolved(KEEP, "T", ["a"]), DROP: resolved(DROP, "T", ["b"])}
        out, _, _ = fold_aliases(store, parse_aliases(FILE))
        assert out[KEEP]["sameAs"] == [DROP]

    def test_sameAs_is_outside_the_csl_item(self) -> None:
        """CSL has no such field, and `item` is what BibTeX and CSL-JSON compile."""
        store = {KEEP: resolved(KEEP, "T", ["a"]), DROP: resolved(DROP, "T", ["b"])}
        out, _, _ = fold_aliases(store, parse_aliases(FILE))
        assert "sameAs" not in out[KEEP]["item"]

    def test_an_address_the_corpus_does_not_cite_is_still_recorded(self) -> None:
        store = {KEEP: resolved(KEEP, "T", ["a"])}
        out, removed, _ = fold_aliases(store, parse_aliases(FILE))
        assert out[KEEP]["sameAs"] == [DROP]
        assert removed == []

    def test_a_second_fold_changes_nothing(self) -> None:
        store = {KEEP: resolved(KEEP, "T", ["a"]), DROP: resolved(DROP, "T", ["b"])}
        once, _, _ = fold_aliases(store, parse_aliases(FILE))
        twice, removed, stale = fold_aliases(once, parse_aliases(FILE))
        assert twice == once
        assert (removed, stale) == ([], [])

    def test_a_group_matching_nothing_is_reported(self) -> None:
        """A citation edited out of the prose leaves the file naming a ghost."""
        _, _, stale = fold_aliases({}, parse_aliases(FILE))
        assert stale == [KEEP]

    def test_a_group_whose_alias_is_already_folded_is_not_reported(self) -> None:
        """The steady state after one fold; reporting it would print the file back."""
        store = {KEEP: resolved(KEEP, "T", ["a"])}
        _, _, stale = fold_aliases(store, parse_aliases(FILE))
        assert stale == []

    def test_never_mints_an_entry_for_a_survivor_that_has_none(self) -> None:
        """The alias file decides identity; it is not a source of bibliography entries."""
        store = {DROP: resolved(DROP, "T", ["b"])}
        out, removed, _ = fold_aliases(store, parse_aliases(FILE))
        assert KEEP not in out
        assert out[DROP] == store[DROP]
        assert removed == []

    def test_does_not_mutate_the_store_it_was_given(self) -> None:
        store = {KEEP: resolved(KEEP, "T", ["a"]), DROP: resolved(DROP, "T", ["b"])}
        fold_aliases(store, parse_aliases(FILE))
        assert DROP in store


class TestAnUnresolvedSurvivor:
    """The case that silently loses a citation if D2 is applied literally.

    When the prose cites only the mirror, `read_scan` rewrites that citation
    onto the surviving address and extraction mints a fresh anchor-only entry -
    so "keep the survivor's own metadata" would keep a placeholder and delete
    the record that knew the title.
    """

    def store(self) -> dict:
        return {
            KEEP: entry_from_anchor(KEEP, "Krakovna, 2020", {"author": "Krakovna", "year": "2020"}),
            DROP: resolved(DROP, "Specification gaming", ["Krakovna, 2020"]),
        }

    def test_a_resolved_alias_hands_its_description_to_the_kept_address(self) -> None:
        out, _, _ = fold_aliases(self.store(), parse_aliases(FILE))
        assert out[KEEP]["item"]["title"] == "Specification gaming"
        assert out[KEEP]["resolvedBy"] == "opengraph"

    def test_identity_is_still_the_survivor_s(self) -> None:
        """``task:0021`` D1 - or the entry detaches from the citations naming it."""
        out, _, _ = fold_aliases(self.store(), parse_aliases(FILE))
        assert out[KEEP]["item"]["id"] == KEEP
        assert out[KEEP]["item"]["URL"] == KEEP

    def test_the_unresolved_note_goes_with_the_placeholder(self) -> None:
        out, _, _ = fold_aliases(self.store(), parse_aliases(FILE))
        assert "note" not in out[KEEP]["item"]

    def test_a_resolved_survivor_is_never_overwritten_by_an_alias(self) -> None:
        store = {
            KEEP: resolved(KEEP, "The kept title", ["a"], by="arxiv"),
            DROP: resolved(DROP, "The dropped title", ["b"]),
        }
        out, _, _ = fold_aliases(store, parse_aliases(FILE))
        assert out[KEEP]["item"]["title"] == "The kept title"
        assert out[KEEP]["resolvedBy"] == "arxiv"


class TestTheScanBoundary:
    """Aliases apply where a citation's key becomes an entry identity."""

    def scan(self, key: str) -> Scan:
        citation = Citation(
            key=key,
            raw_url=key,
            anchor_text="Krakovna, 2020",
            kind="citation",
            origin="inline",
            footnote_number=None,
            chapter_number=1,
            section_number=2,
            section_slug="s",
            author_year={"author": "Krakovna", "year": "2020"},
        )
        return Scan(chapters=[Chapter(1, "C", "c", [Section(2, "S", "s", [citation])])])

    def test_a_citation_at_a_mirror_lands_on_the_surviving_entry(self) -> None:
        out = apply_aliases(self.scan(DROP), parse_aliases(FILE))
        assert out.all_citations()[0].key == KEEP

    def test_the_url_the_document_wrote_is_left_alone(self) -> None:
        """A report telling an author to fix a link must show the link they wrote."""
        out = apply_aliases(self.scan(DROP), parse_aliases(FILE))
        assert out.all_citations()[0].raw_url == DROP

    def test_an_unaliased_citation_is_untouched(self) -> None:
        out = apply_aliases(self.scan("https://other.org/x"), parse_aliases(FILE))
        assert out.all_citations()[0].key == "https://other.org/x"

    def test_an_unlinked_citation_has_no_key_to_alias(self) -> None:
        scan = self.scan(DROP)
        unlinked = Scan(
            chapters=[
                Chapter(
                    1,
                    "C",
                    "c",
                    [
                        Section(
                            2,
                            "S",
                            "s",
                            [
                                scan.all_citations()[0].__class__(
                                    **{
                                        **scan.all_citations()[0].__dict__,
                                        "key": None,
                                        "kind": "unlinked",
                                    }
                                )
                            ],
                        )
                    ],
                )
            ]
        )
        assert apply_aliases(unlinked, parse_aliases(FILE)).all_citations()[0].key is None

    def test_an_empty_alias_file_returns_the_scan_unchanged(self) -> None:
        scan = self.scan(DROP)
        assert apply_aliases(scan, Aliases()) is scan


class TestSuppressingRejectedGroups:
    """``task:0031`` AC-4: the duplicates list is a worklist, not a complaint."""

    A, B, C = "https://lw.org/a", "https://lw.org/b", "https://lw.org/c"

    def store(self, *keys: str) -> dict:
        return {k: resolved(k, "Comment on a thread", ["X, 2025"], by="forum-magnum") for k in keys}

    def test_a_group_is_reported_when_nothing_rejects_it(self) -> None:
        assert duplicate_groups(self.store(self.A, self.B)) == [[self.A, self.B]]

    def test_a_reviewed_group_is_not_reported_again(self) -> None:
        aliases = Aliases(not_duplicates=[[self.A, self.B]])
        assert duplicate_groups(self.store(self.A, self.B), aliases) == []

    def test_a_subset_of_a_reviewed_group_is_also_rejected(self) -> None:
        """ "These three are different comments" stays true of any two of them.

        Matching on equality instead would stop suppressing the moment one of
        the three gained an author and the detector split the group.
        """
        aliases = Aliases(not_duplicates=[[self.A, self.B, self.C]])
        assert duplicate_groups(self.store(self.A, self.B), aliases) == []

    def test_a_group_reaching_beyond_the_reviewed_one_is_still_reported(self) -> None:
        """A third URL nobody has looked at is a new finding, not a repeat."""
        aliases = Aliases(not_duplicates=[[self.A, self.B]])
        assert duplicate_groups(self.store(self.A, self.B, self.C), aliases) == [
            [self.A, self.B, self.C]
        ]
