"""Crossref, oEmbed, Open Graph and the research-database corpus.

Grouped because they share one shape — claim a URL, map a response, decline
everything else — and because the contract test at the end applies to all of
them at once.
"""

from __future__ import annotations

import httpx
import pytest

from atlas_citations.resolvers import ALL_RESOLVERS, ResolveResult, Unreachable
from atlas_citations.resolvers.crossref import crossref_resolver, doi_from_url
from atlas_citations.resolvers.oembed import oembed_resolver
from atlas_citations.resolvers.opengraph import opengraph_resolver
from atlas_citations.resolvers.research_db import research_db_resolver

from .helpers import html_response, json_response, make_ctx

CROSSREF_WORK = {
    "message": {
        "title": ["Systemic risk in banking ecosystems"],
        "DOI": "10.1038/nature09659",
        "URL": "https://doi.org/10.1038/nature09659",
        "container-title": ["Nature"],
        "type": "journal-article",
        "author": [
            {"family": "Haldane", "given": "Andrew G."},
            {"name": "DeepMind"},
        ],
        "issued": {"date-parts": [[2011, 1, 20]]},
    }
}


class TestCrossref:
    def test_claims_only_doi_urls(self) -> None:
        assert crossref_resolver.claims("https://doi.org/10.1038/x")
        assert not crossref_resolver.claims("https://nature.com/articles/x")

    # task:0032 AC-3. These hosts block scraping outright — 12 of the corpus's
    # 132 unresolved entries sit on them — but every one prints its DOI in the
    # URL, which is an identity the publisher asserts rather than one we infer.
    # See task:0032 D3 for the title-search alternative and why it was measured
    # and rejected.
    @pytest.mark.parametrize(
        ("url", "doi"),
        [
            ("https://dl.acm.org/doi/10.1145/3278721.3278780", "10.1145/3278721.3278780"),
            ("https://pnas.org/doi/10.1073/pnas.1208087109", "10.1073/pnas.1208087109"),
            ("https://science.org/doi/10.1126/science.ade9097", "10.1126/science.ade9097"),
            (
                "https://onlinelibrary.wiley.com/doi/10.1111/jofi.1249",
                "10.1111/jofi.1249",
            ),
            # The publisher's own view suffix is not part of the DOI.
            (
                "https://tandfonline.com/doi/full/10.1080/13523260.2019.1576464",
                "10.1080/13523260.2019.1576464",
            ),
            ("https://doi.org/10.1038/nature09659", "10.1038/nature09659"),
        ],
    )
    def test_reads_a_doi_out_of_a_publisher_url(self, url: str, doi: str) -> None:
        assert doi_from_url(url) == doi
        assert crossref_resolver.claims(url)

    @pytest.mark.parametrize(
        "url",
        [
            "https://academic.oup.com/ia/article/100/3/1275/7641064",
            "https://papers.ssrn.com/sol3/papers.cfm?abstract_id=4424123",
            "https://researchgate.net/publication/385353725_Safety_cases_for_frontier_AI",
            "https://example.org/10/x",
            "https://example.org/2024/10/03/a-post",
        ],
    )
    def test_declines_a_url_with_no_doi_in_it(self, url: str) -> None:
        """No guessing. A URL that merely contains digits is not a DOI.

        These five are real corpus entries that stay unresolved rather than
        acquiring a plausible wrong identity — ``task:0032`` D3.
        """
        assert doi_from_url(url) is None
        assert not crossref_resolver.claims(url)

    def test_the_entrys_url_is_not_replaced_by_crossrefs_doi_link(self) -> None:
        """``task:0021`` D1: the key is the identity, and Crossref does not get a vote.

        Crossref's ``URL`` is always a ``doi.org`` link. Writing it over a
        publisher-keyed entry would leave the entry claiming an address that is
        not its own.
        """
        cited = "https://pnas.org/doi/10.1073/pnas.1208087109"
        out = crossref_resolver.resolve(cited, make_ctx(lambda r: json_response(CROSSREF_WORK)))
        assert out is not None and not isinstance(out, Unreachable)
        assert out.fields["URL"] == cited
        assert out.fields["DOI"] == "10.1038/nature09659"

    def test_passes_crossref_fields_through_to_csl(self) -> None:
        out = crossref_resolver.resolve(
            "https://doi.org/10.1038/nature09659", make_ctx(lambda r: json_response(CROSSREF_WORK))
        )
        assert out is not None
        assert out.fields["title"] == "Systemic risk in banking ecosystems"
        assert out.fields["container-title"] == "Nature"
        assert out.fields["type"] == "article-journal"
        assert out.fields["issued"] == {"date-parts": [[2011, 1, 20]]}

    def test_structured_authors_stay_structured_and_organisations_stay_literal(self) -> None:
        out = crossref_resolver.resolve(
            "https://doi.org/10.1038/nature09659", make_ctx(lambda r: json_response(CROSSREF_WORK))
        )
        assert out is not None
        assert out.fields["author"] == [
            {"family": "Haldane", "given": "Andrew G."},
            {"literal": "DeepMind"},
        ]

    def test_a_footnote_marker_is_not_part_of_an_authors_name(self) -> None:
        """Real corpus record: the Diplomacy paper's corresponding-author dagger.

        It is typography lifted out of the PDF, and it renders in every style.
        """
        work = {
            "message": {
                "title": ["T"],
                "author": [
                    {"name": "Meta Fundamental AI Research Diplomacy Team (FAIR)\u2020"},
                    {"family": "Stewart\u2021", "given": "Alexander J. *"},
                ],
            }
        }
        out = crossref_resolver.resolve(
            "https://doi.org/10.1038/x", make_ctx(lambda r: json_response(work))
        )
        assert out is not None and not isinstance(out, Unreachable)
        assert out.fields["author"] == [
            {"literal": "Meta Fundamental AI Research Diplomacy Team (FAIR)"},
            {"family": "Stewart", "given": "Alexander J."},
        ]

    def test_an_unknown_type_falls_back_to_document(self) -> None:
        work = {"message": {"title": ["T"], "type": "database"}}
        out = crossref_resolver.resolve(
            "https://doi.org/10.1038/x", make_ctx(lambda r: json_response(work))
        )
        assert out is not None
        assert out.fields["type"] == "document"

    def test_a_record_with_no_title_declines(self) -> None:
        out = crossref_resolver.resolve(
            "https://doi.org/10.1038/x", make_ctx(lambda r: json_response({"message": {}}))
        )
        assert out is None

    def test_a_404_declines(self) -> None:
        out = crossref_resolver.resolve(
            "https://doi.org/10.1038/x", make_ctx(lambda r: httpx.Response(404))
        )
        assert out is None


class TestOembed:
    def test_claims_only_canonical_youtube_watch_urls(self) -> None:
        assert oembed_resolver.claims("https://www.youtube.com/watch?v=abc")
        assert not oembed_resolver.claims("https://youtu.be/abc")

    def test_maps_a_video(self) -> None:
        payload = {"title": "A Talk", "author_name": "Some Channel"}
        out = oembed_resolver.resolve(
            "https://www.youtube.com/watch?v=abc", make_ctx(lambda r: json_response(payload))
        )
        assert out is not None
        assert out.fields["type"] == "motion_picture"
        assert out.fields["title"] == "A Talk"
        assert out.fields["author"] == [{"literal": "Some Channel"}]
        assert out.fields["container-title"] == "YouTube"

    def test_records_that_oembed_gives_no_date(self) -> None:
        """Honest in the store, so hand-curation does not guess a year from the channel."""
        out = oembed_resolver.resolve(
            "https://www.youtube.com/watch?v=abc",
            make_ctx(lambda r: json_response({"title": "A Talk"})),
        )
        assert out is not None
        assert "issued" not in out.fields
        assert out.note is not None
        assert "publication date" in out.note

    def test_a_deleted_or_private_video_is_reported_not_invented(self) -> None:
        """401/404 is YouTube's answer for a video that is gone or private.

        Since ``task:0032`` that is surfaced rather than flattened to a decline,
        and the difference is visible to a reader: the entry stays unresolved and
        the report lists it, instead of Open Graph quietly recording the title of
        YouTube's consent wall. A citation pointing at a deleted video is a
        content defect only the authors can fix.
        """
        out = oembed_resolver.resolve(
            "https://www.youtube.com/watch?v=abc", make_ctx(lambda r: httpx.Response(401))
        )
        assert out == Unreachable("refused")


OG_PAGE = """<html><head>
<meta property="og:title" content="SIMA 2: A Gemini-Powered Agent"/>
<meta property="og:site_name" content="Google DeepMind"/>
<meta property="og:description" content="An agent for 3D virtual worlds."/>
<meta property="article:published_time" content="2025-11-13T09:00:00Z"/>
<title>Ignored when og:title is present</title>
</head></html>"""


class TestOpengraph:
    def test_claims_any_http_url(self) -> None:
        assert opengraph_resolver.claims("https://example.org/x")
        assert not opengraph_resolver.claims("mailto:a@b.org")

    def test_maps_open_graph_metadata(self) -> None:
        out = opengraph_resolver.resolve(
            "https://deepmind.google/blog/sima-2", make_ctx(lambda r: html_response(OG_PAGE))
        )
        assert out is not None
        assert out.fields["title"] == "SIMA 2: A Gemini-Powered Agent"
        assert out.fields["container-title"] == "Google DeepMind"
        assert out.fields["abstract"] == "An agent for 3D virtual worlds."
        assert out.fields["issued"] == {"date-parts": [[2025, 11, 13]]}
        assert out.note is None

    def test_falls_back_to_the_title_tag_and_says_so(self) -> None:
        page = "<html><head><title>  A  Plain   Page  </title></head></html>"
        out = opengraph_resolver.resolve(
            "https://example.org/x", make_ctx(lambda r: html_response(page))
        )
        assert out is not None
        assert out.fields["title"] == "A Plain Page"
        assert out.note is not None
        assert "no Open Graph metadata" in out.note

    def test_reads_twitter_style_name_attributes_too(self) -> None:
        page = '<html><head><meta name="og:title" content="Via name"></head></html>'
        out = opengraph_resolver.resolve(
            "https://example.org/x", make_ctx(lambda r: html_response(page))
        )
        assert out is not None
        assert out.fields["title"] == "Via name"

    def test_the_type_comes_from_the_url_not_the_page(self) -> None:
        """Reuse the decision the store already made; never fork it."""
        out = opengraph_resolver.resolve(
            "https://lesswrong.com/posts/x", make_ctx(lambda r: html_response(OG_PAGE))
        )
        assert out is not None
        assert out.fields["type"] == "post-weblog"

    def test_a_non_html_response_is_not_read(self) -> None:
        """A PDF or JSON blob has no meta tags; reading it would be waste."""
        ctx = make_ctx(
            lambda r: httpx.Response(
                200, content=b"%PDF-1.7", headers={"content-type": "application/pdf"}
            )
        )
        assert opengraph_resolver.resolve("https://example.org/x.pdf", ctx) is None

    # audit:0011 F13 — a bot check or redirect stub returns HTTP 200 with a
    # well-formed <title>, so nothing upstream notices. Recording one is worse
    # than recording nothing: the entry is marked resolved and never retried.
    @pytest.mark.parametrize(
        "title",
        [
            "Redirecting...",
            "Redirecting\u2026",
            "Checking your browser - reCAPTCHA",
            "Just a moment...",
            "Attention Required! | Cloudflare",
            "Access denied",
            "404 Not Found",
            "AI",
        ],
    )
    def test_declines_a_title_that_means_the_fetch_never_reached_the_document(
        self, title: str
    ) -> None:
        page = f"<html><head><title>{title}</title></head></html>"
        ctx = make_ctx(lambda r: html_response(page))
        assert opengraph_resolver.resolve("https://example.org/x", ctx) is None

    @pytest.mark.parametrize(
        "title",
        [
            "Redirecting to the new home of our research",
            "Error Correction in Quantum Computing",
            "Loading the Dice: Scaling Laws and Chance",
        ],
    )
    def test_keeps_a_real_title_that_merely_starts_with_a_suspect_word(self, title: str) -> None:
        """The guard is anchored and word-bounded, so it must not eat real titles."""
        page = f"<html><head><title>{title}</title></head></html>"
        ctx = make_ctx(lambda r: html_response(page))
        out = opengraph_resolver.resolve("https://example.org/x", ctx)
        assert out is not None
        assert out.fields["title"] == title

    def test_a_page_with_no_title_at_all_declines(self) -> None:
        ctx = make_ctx(lambda r: html_response("<html><body>nothing</body></html>"))
        assert opengraph_resolver.resolve("https://example.org/x", ctx) is None

    def test_a_redirect_to_a_non_http_scheme_declines_rather_than_following(self) -> None:
        def handler(request: httpx.Request) -> httpx.Response:
            return httpx.Response(302, headers={"location": "file:///etc/passwd"})

        out = opengraph_resolver.resolve("https://example.org/x", make_ctx(handler))
        # httpx refuses the hop by raising, which the resolver turns into "we
        # learned nothing" — never into a bibliography entry sourced from disk.
        assert not isinstance(out, ResolveResult)


class TestResearchDb:
    def test_claims_broadly_because_the_local_lookup_is_free(self) -> None:
        assert research_db_resolver.claims("https://anything.org/x")

    def test_maps_a_corpus_record(self) -> None:
        payload = {
            "success": True,
            "title": "A Real Title",
            "publication_date": "2024-08-15T17:23:10Z",
            "abstract": "Some abstract.",
            "source_type": "lesswrong",
            "authors": [{"label": "Ngo"}, {"label": None}],
        }
        out = research_db_resolver.resolve(
            "https://lesswrong.com/posts/x", make_ctx(lambda r: json_response(payload))
        )
        assert out is not None
        assert out.fields["title"] == "A Real Title"
        assert out.fields["author"] == [{"literal": "Ngo"}]
        assert out.fields["issued"] == {"date-parts": [[2024, 8, 15]]}
        assert out.fields["type"] == "post-weblog"
        assert out.note is None

    def test_notes_what_the_record_is_missing(self) -> None:
        payload = {"success": True, "title": "A Title", "authors": []}
        out = research_db_resolver.resolve(
            "https://example.org/x", make_ctx(lambda r: json_response(payload))
        )
        assert out is not None
        assert out.note is not None
        assert "no author labels" in out.note
        assert "no publication date" in out.note

    def test_retries_once_with_www_because_the_corpus_stores_urls_verbatim(self) -> None:
        seen: list[str] = []

        def handler(request: httpx.Request) -> httpx.Response:
            ref = request.url.params.get("ref", "")
            seen.append(ref)
            if ref.startswith("https://www."):
                return json_response({"success": True, "title": "Found via www"})
            return json_response({"success": False})

        out = research_db_resolver.resolve("https://example.org/x", make_ctx(handler))
        assert out is not None
        assert out.fields["title"] == "Found via www"
        assert len(seen) == 2

    def test_widens_to_unreviewed_records(self) -> None:
        """Records default to `admitted`; many relevant ones are `unreviewed`."""
        seen: list[str] = []

        def handler(request: httpx.Request) -> httpx.Response:
            seen.append(str(request.url))
            return json_response({"success": True, "title": "T"})

        research_db_resolver.resolve("https://example.org/x", make_ctx(handler))
        assert all("include_unreviewed=true" in url for url in seen)

    def test_an_unsuccessful_payload_declines(self) -> None:
        out = research_db_resolver.resolve(
            "https://example.org/x", make_ctx(lambda r: json_response({"success": False}))
        )
        assert out is None

    def test_a_down_service_declines_without_raising(self, unreachable_ctx) -> None:
        """AC-6: an accelerator for a minority of sources is never a dependency."""
        assert research_db_resolver.resolve("https://example.org/x", unreachable_ctx) is None


class TestEveryResolverHonoursTheContract:
    """Rules 2 and 3: never raise, and never call a failure a verdict."""

    CLAIMABLE_URLS = (
        "https://arxiv.org/abs/1911.01547",
        "https://doi.org/10.1038/x",
        "https://www.lesswrong.com/posts/puv8fRDCH9jx5yhbX/shortform",
        "https://nature.com/articles/x",
        "https://www.youtube.com/watch?v=abc",
        "https://example.org/x",
    )

    @pytest.mark.parametrize("resolver", ALL_RESOLVERS, ids=lambda r: r.name)
    def test_an_unreachable_service_never_raises(self, resolver, unreachable_ctx) -> None:
        for url in self.CLAIMABLE_URLS:
            if resolver.claims(url):
                # Whatever comes back, it must not be an exception and must not
                # be a ResolveResult — nothing was learned, so nothing may be
                # claimed.
                outcome = resolver.resolve(url, unreachable_ctx)
                assert not isinstance(outcome, ResolveResult)

    @pytest.mark.parametrize("resolver", ALL_RESOLVERS, ids=lambda r: r.name)
    def test_a_networked_resolver_reports_unreachable_rather_than_declining(
        self, resolver, unreachable_ctx
    ) -> None:
        """``task:0032`` AC-1, stated as a property rather than per resolver.

        ``research-db`` is the documented exception: ``task:0027`` AC-6 requires
        its outage to be invisible, so it flattens the signal back to a decline.
        """
        if resolver.name == "research-db":
            pytest.skip("task:0027 AC-6 — a corpus outage must leave the bibliography identical")
        for url in self.CLAIMABLE_URLS:
            if resolver.claims(url):
                assert isinstance(resolver.resolve(url, unreachable_ctx), Unreachable)

    @pytest.mark.parametrize("resolver", ALL_RESOLVERS, ids=lambda r: r.name)
    def test_claims_is_pure_and_makes_no_request(self, resolver) -> None:
        def handler(request: httpx.Request) -> httpx.Response:
            raise AssertionError(f"{resolver.name}.claims made a request")

        ctx = make_ctx(handler)
        assert ctx is not None
        for url in ("https://example.org/x", "https://arxiv.org/abs/1", "not a url"):
            resolver.claims(url)


class TestTheArchivesOwnChromeIsNotATitle:
    """The Internet Archive's snapshot of a PDF is an HTML wrapper titled
    "Wayback Machine" — well-formed, HTTP 200, and not the document.

    17 of the first 25 archived entries took it before the guard covered it. The
    same shape as ``audit:0011`` F13, from a source that did not exist then.
    """

    @pytest.mark.parametrize("title", ["Wayback Machine", "Internet Archive", "wayback machine"])
    def test_rejected(self, title: str) -> None:
        page = f"<html><head><title>{title}</title></head></html>"
        out = opengraph_resolver.resolve(
            "https://web.archive.org/web/1/https://x/y.pdf", make_ctx(lambda r: html_response(page))
        )
        assert out is None

    def test_a_real_title_mentioning_an_archive_survives(self) -> None:
        page = "<html><head><title>The Internet Archive as a Research Corpus</title></head></html>"
        out = opengraph_resolver.resolve(
            "https://example.org/x", make_ctx(lambda r: html_response(page))
        )
        assert out is not None


class TestScrapedTitlesAreCleanedNotJustJudged:
    def test_markup_inside_a_title_is_stripped(self) -> None:
        """SSRN's Open Graph title for a corpus entry is literally
        "<span>A Three-Layered Framework…". CSL fields are plain text, so a
        template escapes the tag and the reader sees angle brackets — the
        scraping half of ``audit:0011`` F11."""
        page = (
            "<html><head>"
            '<meta property="og:title" content="&lt;span&gt;A Real Title">'
            "</head></html>"
        )
        out = opengraph_resolver.resolve(
            "https://papers.ssrn.com/x", make_ctx(lambda r: html_response(page))
        )
        assert out is not None
        assert out.fields["title"] == "A Real Title"

    def test_a_directory_listing_is_not_a_document(self) -> None:
        """`yann.lecun.com/exdb/mnist` serves a web server's default index page."""
        page = "<html><head><title>Index of /exdb/mnist</title></head></html>"
        out = opengraph_resolver.resolve(
            "https://yann.lecun.com/exdb/mnist", make_ctx(lambda r: html_response(page))
        )
        assert out is None
