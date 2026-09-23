"""``atlas citations propose`` — gathers evidence, decides nothing. ``task:0032`` AC-5."""

from __future__ import annotations

import httpx

from atlas_citations.commands.propose import (
    _evidence_for_html,
    _evidence_for_pdf,
    _stub,
    gather_evidence,
)
from atlas_citations.store import entry_from_anchor

from .helpers import html_response, make_ctx

KEY = "https://papers.ssrn.com/sol3/papers.cfm?abstract_id=4424123"


def anchor_entry(key: str = KEY) -> dict:
    return entry_from_anchor(key, "Reuel, 2024", {"author": "Reuel", "year": "2024"})


class TestHtmlEvidence:
    def test_reports_every_title_the_page_offers(self) -> None:
        page = """<html><head>
        <meta property="og:title" content="Open Graph Title">
        <meta name="citation_title" content="Publisher Title">
        <meta property="og:site_name" content="SSRN">
        <title>Tab Title</title></head></html>"""
        found = _evidence_for_html(page)
        assert any("og:title: Open Graph Title" in line for line in found)
        assert any("citation_title: Publisher Title" in line for line in found)
        assert any("<title>: Tab Title" in line for line in found)
        assert any("og:site_name: SSRN" in line for line in found)

    def test_a_bot_check_titles_is_shown_rather_than_filtered(self) -> None:
        """Deliberate. The resolver rejects these; a human reading the worklist
        needs to see *why* the entry is here, and "the page says Just a moment…"
        is the most useful thing we can tell them."""
        found = _evidence_for_html("<html><head><title>Just a moment...</title></head></html>")
        assert found == ["<title>: Just a moment..."]

    def test_a_page_with_nothing_to_say_says_so(self) -> None:
        ctx = make_ctx(lambda r: html_response("<html><body>rendered client-side</body></html>"))
        assert gather_evidence("https://example.org/x", ctx) == [
            "(the page carries no title metadata)"
        ]


class TestPdfEvidence:
    def test_a_non_pdf_body_is_reported_not_guessed_at(self) -> None:
        def handler(request: httpx.Request) -> httpx.Response:
            return httpx.Response(
                200, content=b"not a pdf", headers={"content-type": "application/octet-stream"}
            )

        assert gather_evidence("https://example.org/x", make_ctx(handler)) == [
            "(not HTML and not a PDF)"
        ]

    def test_an_unreadable_pdf_reports_the_failure_rather_than_raising(self) -> None:
        assert _evidence_for_pdf(b"%PDF-1.7 truncated")[0].startswith("(could not read the PDF")

    def test_a_refusal_is_reported_in_words_a_human_can_act_on(self) -> None:
        ctx = make_ctx(lambda r: httpx.Response(403))
        assert gather_evidence("https://example.org/x", ctx) == [
            "(fetch failed: a paywall or bot check refused us)"
        ]


class TestTheStub:
    def test_every_line_is_commented_out(self) -> None:
        """Nothing here is an answer, so nothing here may be applied by accident.

        ``task:0032`` D2: a 70%-correct title is worse than no title, because
        nothing downstream can tell which 70%. A human uncommenting a line is the
        check that makes the evidence safe to gather at all.
        """
        lines = _stub(KEY, {KEY: anchor_entry()}, [], ["og:title: Something"])
        assert all(line == "" or line.startswith("#") for line in lines)

    def test_carries_the_anchor_text_the_authors_wrote(self) -> None:
        lines = _stub(KEY, {KEY: anchor_entry()}, [], [])
        assert any("Reuel, 2024" in line for line in lines)

    def test_explains_why_the_last_attempt_failed(self) -> None:
        entry = {**anchor_entry(), "unreachable": "gone"}
        lines = _stub(KEY, {KEY: entry}, [], [])
        assert any("the page no longer exists" in line for line in lines)

    def test_offers_the_csl_fields_that_actually_need_filling(self) -> None:
        text = "\n".join(_stub(KEY, {KEY: anchor_entry()}, [], []))
        for field in ("title:", "author:", "issued:", "type:", "container-title:"):
            assert field in text


class TestALargePdfIsNotTruncatedIntoGarbage:
    """A PDF's cross-reference table is at the *end* of the file.

    A body cut at a byte cap is not a smaller document, it is a broken one —
    found on the 28 MB DALL-E 3 paper, which an 8 MB cap turned into a
    PdfStreamError that read as "this PDF is unreadable".
    """

    def test_reports_the_size_rather_than_parsing_a_fragment(self) -> None:
        from atlas_citations.commands.propose import MAX_PDF_BYTES

        oversized = b"%PDF-1.7" + b"\0" * (MAX_PDF_BYTES + 1)

        def handler(request: httpx.Request) -> httpx.Response:
            return httpx.Response(
                200, content=oversized, headers={"content-type": "application/pdf"}
            )

        out = gather_evidence("https://example.org/big.pdf", make_ctx(handler))
        assert len(out) == 1
        assert "too large to read here" in out[0]
        assert "open it by hand" in out[0]
