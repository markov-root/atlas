"""The offline commands: scan reading, extract, report, urls.

All four are pure given their inputs, so these tests build a small scan by hand
rather than touching the filesystem or the cached documents.
"""

from __future__ import annotations

import json

import pytest

from atlas_citations.commands.extract import extract_entries, next_store
from atlas_citations.commands.report import build_citation_report, duplicate_groups
from atlas_citations.commands.urls import format_url_files
from atlas_citations.scan import Scan, ScanError, parse_scan
from atlas_citations.store import entry_from_anchor


def citation(
    key: str | None,
    anchor_text: str,
    *,
    kind: str = "citation",
    author_year: dict | None = None,
    origin: str = "inline",
    footnote: str | None = None,
    section: int = 1,
    chapter: int = 1,
) -> dict:
    return {
        "key": key,
        "rawUrl": key,
        "anchorText": anchor_text,
        "kind": kind,
        "origin": origin,
        "footnoteNumber": footnote,
        "chapterNumber": chapter,
        "sectionNumber": section,
        "sectionSlug": f"s{section}",
        "authorYear": author_year,
    }


def scan_of(*sections: list[dict], title: str = "Introduction") -> Scan:
    return parse_scan(
        json.dumps(
            {
                "schemaVersion": 1,
                "chapters": [
                    {
                        "number": 1,
                        "title": title,
                        "slug": "introduction",
                        "sections": [
                            {
                                "number": i + 1,
                                "title": f"Section {i + 1}",
                                "slug": f"s{i + 1}",
                                "citations": cits,
                            }
                            for i, cits in enumerate(sections)
                        ],
                    }
                ],
            }
        )
    )


AY = {"author": "Chollet", "year": "2019"}


class TestScanParsing:
    def test_rejects_an_unknown_schema_version(self) -> None:
        with pytest.raises(ScanError, match="schema version"):
            parse_scan(json.dumps({"schemaVersion": 99, "chapters": []}))

    def test_rejects_invalid_json(self) -> None:
        with pytest.raises(ScanError, match="not valid JSON"):
            parse_scan("{not json")

    def test_reads_locations_and_the_author_year_parse(self) -> None:
        scan = scan_of([citation("https://a.org/x", "Chollet, 2019", author_year=AY)])
        c = scan.all_citations()[0]
        assert c.key == "https://a.org/x"
        assert c.author_year == AY
        assert c.location == "ch1.1"

    def test_a_footnote_location_names_the_footnote(self) -> None:
        scan = scan_of([citation("https://a.org/x", "A, 2019", origin="footnote", footnote="12")])
        assert scan.all_citations()[0].location == "ch1.1, footnote 12"


class TestExtract:
    def test_only_citations_become_entries(self) -> None:
        scan = scan_of(
            [
                citation("https://a.org/x", "Chollet, 2019", author_year=AY),
                citation("https://b.org/y", "available here", kind="content-link"),
                citation("https://c.org/z.png", "img", kind="asset"),
                citation(None, "Smith, 2020", kind="unlinked"),
            ]
        )
        assert [k for k, _ in extract_entries(scan)] == ["https://a.org/x"]

    def test_the_same_url_twice_collapses_with_both_spellings(self) -> None:
        scan = scan_of(
            [
                citation("https://a.org/x", "Chollet, 2019", author_year=AY),
                citation("https://a.org/x", "Chollet 2019", author_year=AY, section=1),
            ]
        )
        store = next_store({}, extract_entries(scan))
        assert list(store) == ["https://a.org/x"]
        assert store["https://a.org/x"]["anchors"] == ["Chollet 2019", "Chollet, 2019"]

    def test_re_extraction_preserves_resolved_metadata(self) -> None:
        """The whole point of merge-before-write."""
        existing = {
            "https://a.org/x": {
                "item": {"id": "https://a.org/x", "type": "article", "title": "The Real Title"},
                "resolvedBy": "arxiv",
                "anchors": ["Chollet, 2019"],
            }
        }
        scan = scan_of([citation("https://a.org/x", "Chollet, 2019", author_year=AY)])
        store = next_store(existing, extract_entries(scan))
        assert store["https://a.org/x"]["item"]["title"] == "The Real Title"
        assert store["https://a.org/x"]["resolvedBy"] == "arxiv"

    def test_extraction_is_idempotent(self) -> None:
        scan = scan_of([citation("https://a.org/x", "Chollet, 2019", author_year=AY)])
        once = next_store({}, extract_entries(scan))
        assert next_store(once, extract_entries(scan)) == once


class TestReport:
    def test_omits_sections_with_no_findings(self) -> None:
        """A heading that is always there trains authors to stop reading headings."""
        scan = scan_of([citation("https://a.org/x", "Chollet, 2019", author_year=AY)])
        store = next_store({}, [])
        report = build_citation_report(scan, store)
        assert "Malformed anchor text" not in report.markdown
        assert "Content links" not in report.markdown

    def test_reports_malformed_anchor_text(self) -> None:
        scan = scan_of([citation("https://a.org/x", "Burns et. al. 2023", author_year=None)])
        report = build_citation_report(scan, {})
        assert report.counts.malformed == 1
        assert "Burns et. al. 2023" in report.markdown

    def test_reports_unresolved_store_entries_with_their_locations(self) -> None:
        scan = scan_of([citation("https://a.org/x", "Chollet, 2019", author_year=AY)])
        store = {"https://a.org/x": entry_from_anchor("https://a.org/x", "Chollet, 2019", AY)}
        report = build_citation_report(scan, store)
        assert report.counts.unresolved == 1
        assert "`ch1.1`" in report.markdown

    def test_reports_inconsistent_spelling_of_one_source(self) -> None:
        scan = scan_of(
            [
                citation("https://a.org/x", "Chollet, 2019", author_year=AY),
                citation("https://a.org/x", "Chollet 2019", author_year=AY),
            ]
        )
        report = build_citation_report(scan, {})
        assert report.counts.inconsistent == 1

    def test_one_spelling_is_not_inconsistent(self) -> None:
        scan = scan_of(
            [
                citation("https://a.org/x", "Chollet, 2019", author_year=AY),
                citation("https://a.org/x", "Chollet, 2019", author_year=AY),
            ]
        )
        assert build_citation_report(scan, {}).counts.inconsistent == 0

    def test_output_is_deterministic(self) -> None:
        """No timestamp, so re-running produces a diff of what changed."""
        scan = scan_of([citation("https://a.org/x", "Chollet, 2019", author_year=AY)])
        assert build_citation_report(scan, {}).markdown == build_citation_report(scan, {}).markdown


class TestUrls:
    def resolved_store(self) -> dict:
        return {
            "https://a.org/x": {
                "item": {
                    "id": "https://a.org/x",
                    "type": "article",
                    "title": "On the Measure of Intelligence",
                },
                "resolvedBy": "arxiv",
                "anchors": ["Chollet, 2019"],
            }
        }

    def test_one_file_per_chapter_plus_an_index(self) -> None:
        scan = scan_of([citation("https://a.org/x", "Chollet, 2019", author_year=AY)])
        report = format_url_files(scan, {})
        assert [f.filename for f in report.files] == [
            "chapter-01-introduction.md",
            "all-sources.md",
        ]

    def test_a_resolved_title_becomes_the_link_text(self) -> None:
        scan = scan_of([citation("https://a.org/x", "Chollet, 2019", author_year=AY)])
        report = format_url_files(scan, self.resolved_store())
        assert (
            "- Chollet, 2019 ([On the Measure of Intelligence](https://a.org/x))"
            in report.files[0].markdown
        )
        assert report.resolved_titles == 1

    def test_an_unresolved_entry_shows_a_bare_url_so_the_gap_stays_visible(self) -> None:
        scan = scan_of([citation("https://a.org/x", "Chollet, 2019", author_year=AY)])
        store = {"https://a.org/x": entry_from_anchor("https://a.org/x", "Chollet, 2019", AY)}
        report = format_url_files(scan, store)
        assert "- Chollet, 2019 (https://a.org/x)" in report.files[0].markdown
        assert report.resolved_titles == 0

    def test_duplicates_within_a_section_are_collapsed(self) -> None:
        scan = scan_of(
            [
                citation("https://a.org/x", "Chollet, 2019", author_year=AY),
                citation("https://a.org/x", "Chollet, 2019", author_year=AY),
            ]
        )
        report = format_url_files(scan, {})
        assert report.files[0].markdown.count("https://a.org/x") == 1

    def test_the_same_source_in_two_sections_appears_in_both(self) -> None:
        scan = scan_of(
            [citation("https://a.org/x", "Chollet, 2019", author_year=AY, section=1)],
            [citation("https://a.org/x", "Chollet, 2019", author_year=AY, section=2)],
        )
        report = format_url_files(scan, {})
        assert report.files[0].markdown.count("https://a.org/x") == 2
        assert report.unique_sources == 1

    def test_brackets_in_a_title_are_escaped(self) -> None:
        """arXiv titles routinely start '[2305.16291] …'."""
        store = {
            "https://a.org/x": {
                "item": {
                    "id": "https://a.org/x",
                    "type": "article",
                    "title": "[2305.16291] Voyager",
                },
                "resolvedBy": "arxiv",
                "anchors": [],
            }
        }
        scan = scan_of([citation("https://a.org/x", "Wang, 2023", author_year=AY)])
        assert r"\[2305.16291\] Voyager" in format_url_files(scan, store).files[0].markdown

    def test_content_links_are_listed_separately_not_dropped(self) -> None:
        scan = scan_of([citation("https://b.org/y", "available here", kind="content-link")])
        report = format_url_files(scan, {})
        assert report.unrecognised == 1
        assert "Links not recognised as citations (1)" in report.files[0].markdown

    def test_a_section_with_no_citations_says_so(self) -> None:
        scan = scan_of([])
        assert "_No citations in this section._" in format_url_files(scan, {}).files[0].markdown

    def test_the_index_shows_every_spelling_across_sections(self) -> None:
        scan = scan_of(
            [citation("https://a.org/x", "Chollet, 2019", author_year=AY, section=1)],
            [citation("https://a.org/x", "Chollet 2019", author_year=AY, section=2)],
        )
        index = format_url_files(scan, {}).files[-1].markdown
        assert "Chollet, 2019 / Chollet 2019" in index

    def test_the_index_shows_both_spellings_from_within_one_section(self) -> None:
        """The case the per-section dedupe used to hide. See ``audit:0011`` F9.

        The section body still shows the source once — that is what the dedupe is
        for — but the index must see both spellings, because finding inconsistent
        citation text is the reason it lists them.
        """
        scan = scan_of(
            [
                citation("https://a.org/x", "Chollet, 2019", author_year=AY),
                citation("https://a.org/x", "Chollet 2019", author_year=AY),
            ]
        )
        files = format_url_files(scan, {}).files
        assert "Chollet, 2019 / Chollet 2019" in files[-1].markdown
        assert files[0].markdown.count("https://a.org/x") == 1


def resolved(key: str, title: str, author: str, year: int, by: str = "opengraph") -> dict:
    return {
        "item": {
            "id": key,
            "type": "webpage",
            "URL": key,
            "title": title,
            "author": [{"literal": author}],
            "issued": {"date-parts": [[year]]},
        },
        "resolvedBy": by,
        "anchors": [],
    }


class TestDuplicateGroups:
    """One work under several URLs. Reported, never merged."""

    def test_finds_a_cross_post_whose_titles_differ_only_by_site_suffix(self) -> None:
        store = {
            "https://alignmentforum.org/posts/x": resolved(
                "https://alignmentforum.org/posts/x",
                "The case for ensuring that powerful AIs are controlled — AI Alignment Forum",
                "Greenblatt",
                2024,
            ),
            "https://lesswrong.com/posts/x": resolved(
                "https://lesswrong.com/posts/x",
                "The case for ensuring that powerful AIs are controlled — LessWrong",
                "Greenblatt",
                2024,
            ),
        }
        assert duplicate_groups(store) == [sorted(store)]

    def test_finds_a_mirror_on_a_different_domain(self) -> None:
        store = {
            "https://deepmind.com/blog/x": resolved(
                "https://deepmind.com/blog/x", "Specification gaming", "Krakovna", 2020
            ),
            "https://deepmind.google/discover/blog/x": resolved(
                "https://deepmind.google/discover/blog/x", "Specification gaming", "Krakovna", 2020
            ),
        }
        assert len(duplicate_groups(store)) == 1

    def test_different_works_by_one_author_in_one_year_are_not_duplicates(self) -> None:
        """The textbook case: eight chapters, one author, one year, one site."""
        store = {
            f"https://aisafetybook.com/textbook/ch{n}": resolved(
                f"https://aisafetybook.com/textbook/ch{n}",
                f"{n}.1: A Distinct Chapter Title | AI Safety Textbook",
                "Hendrycks",
                2024,
            )
            for n in range(1, 6)
        }
        assert duplicate_groups(store) == []

    def test_unresolved_entries_are_never_grouped(self) -> None:
        """Their title IS the anchor text, so every one by an author in a year matches.

        Including them produced three false groups on the real corpus.
        """
        store = {
            "https://ai-alignment.com/reliability": {
                **resolved(
                    "https://ai-alignment.com/reliability", "Christiano, 2016", "Christiano", 2016
                ),
                "resolvedBy": "anchor",
            },
            "https://ai-alignment.com/security": {
                **resolved(
                    "https://ai-alignment.com/security", "Christiano, 2016", "Christiano", 2016
                ),
                "resolvedBy": "anchor",
            },
        }
        assert duplicate_groups(store) == []

    def test_a_different_year_is_a_different_work(self) -> None:
        store = {
            "https://a.org/1": resolved("https://a.org/1", "Annual Report", "Org", 2023),
            "https://a.org/2": resolved("https://a.org/2", "Annual Report", "Org", 2024),
        }
        assert duplicate_groups(store) == []

    def test_groups_are_reported_in_a_stable_order(self) -> None:
        store = {
            "https://b.org/x": resolved("https://b.org/x", "Same Title", "Author", 2024),
            "https://a.org/x": resolved("https://a.org/x", "Same Title", "Author", 2024),
        }
        assert duplicate_groups(store) == [["https://a.org/x", "https://b.org/x"]]

    def test_the_report_lists_them(self) -> None:
        store = {
            "https://a.org/x": resolved("https://a.org/x", "Same Title", "Author", 2024),
            "https://b.org/x": resolved("https://b.org/x", "Same Title", "Author", 2024),
        }
        report = build_citation_report(scan_of([]), store)
        assert report.counts.duplicates == 1
        assert "Probable duplicates" in report.markdown
        assert "https://a.org/x" in report.markdown
