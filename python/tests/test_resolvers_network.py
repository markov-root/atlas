"""Crossref, oEmbed, Open Graph and the research-database corpus.

Grouped because they share one shape — claim a URL, map a response, decline
everything else — and because the contract test at the end applies to all of
them at once.
"""

from __future__ import annotations

import httpx
import pytest

from atlas_citations.resolvers import ALL_RESOLVERS
from atlas_citations.resolvers.crossref import crossref_resolver
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

    def test_an_unknown_type_falls_back_to_document(self) -> None:
        work = {"message": {"title": ["T"], "type": "database"}}
        out = crossref_resolver.resolve(
            "https://doi.org/10/x", make_ctx(lambda r: json_response(work))
        )
        assert out is not None
        assert out.fields["type"] == "document"

    def test_a_record_with_no_title_declines(self) -> None:
        out = crossref_resolver.resolve(
            "https://doi.org/10/x", make_ctx(lambda r: json_response({"message": {}}))
        )
        assert out is None

    def test_a_404_declines(self) -> None:
        out = crossref_resolver.resolve(
            "https://doi.org/10/x", make_ctx(lambda r: httpx.Response(404))
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

    def test_a_deleted_or_private_video_declines(self) -> None:
        """401/404 is YouTube's normal answer here, not an error."""
        out = oembed_resolver.resolve(
            "https://www.youtube.com/watch?v=abc", make_ctx(lambda r: httpx.Response(401))
        )
        assert out is None


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

    def test_a_page_with_no_title_at_all_declines(self) -> None:
        ctx = make_ctx(lambda r: html_response("<html><body>nothing</body></html>"))
        assert opengraph_resolver.resolve("https://example.org/x", ctx) is None

    def test_a_redirect_to_a_non_http_scheme_declines_rather_than_following(self) -> None:
        def handler(request: httpx.Request) -> httpx.Response:
            return httpx.Response(302, headers={"location": "file:///etc/passwd"})

        assert opengraph_resolver.resolve("https://example.org/x", make_ctx(handler)) is None


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
    """Rule 2: a resolver never raises for an unreachable service."""

    @pytest.mark.parametrize("resolver", ALL_RESOLVERS, ids=lambda r: r.name)
    def test_an_unreachable_service_yields_none(self, resolver, unreachable_ctx) -> None:
        for url in (
            "https://arxiv.org/abs/1911.01547",
            "https://doi.org/10.1038/x",
            "https://nature.com/articles/x",
            "https://www.youtube.com/watch?v=abc",
            "https://example.org/x",
        ):
            if resolver.claims(url):
                assert resolver.resolve(url, unreachable_ctx) is None

    @pytest.mark.parametrize("resolver", ALL_RESOLVERS, ids=lambda r: r.name)
    def test_claims_is_pure_and_makes_no_request(self, resolver) -> None:
        def handler(request: httpx.Request) -> httpx.Response:
            raise AssertionError(f"{resolver.name}.claims made a request")

        ctx = make_ctx(handler)
        assert ctx is not None
        for url in ("https://example.org/x", "https://arxiv.org/abs/1", "not a url"):
            resolver.claims(url)
