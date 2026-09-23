"""Publisher citation metadata, and the trap it exists to avoid."""

from __future__ import annotations

import httpx
import pytest

from atlas_citations.resolvers.base import Unreachable
from atlas_citations.resolvers.scholar_meta import (
    citation_meta,
    meta_to_csl,
    pubmed_id,
    scholar_meta_resolver,
)

from .helpers import html_response, json_response, make_ctx

# Trimmed from the real Nature page for nature09659, keeping the shape that
# matters: the article's own citation_doi alongside citation_reference tags that
# carry OTHER papers' DOIs.
NATURE = """<html><head>
<meta name="citation_journal_title" content="Nature"/>
<meta name="citation_title" content="Systemic risk in banking ecosystems"/>
<meta name="citation_author" content="Haldane, Andrew G."/>
<meta name="citation_author" content="May, Robert M."/>
<meta name="citation_publication_date" content="2011/01"/>
<meta name="citation_volume" content="469"/>
<meta name="citation_firstpage" content="351"/>
<meta name="citation_lastpage" content="355"/>
<meta name="citation_publisher" content="Nature Publishing Group"/>
<meta name="citation_doi" content="10.1038/nature09659"/>
<meta name="citation_reference" content="citation_title=Homage to Santa Rosalia; \
citation_doi=10.1086/282070; citation_id=CR1"/>
<meta name="citation_reference" content="citation_title=Will a large complex system be stable?; \
citation_doi=10.1038/238413a0; citation_id=CR4"/>
</head></html>"""


class TestCitationMeta:
    def test_collects_citation_meta_keeping_repeats(self) -> None:
        meta = citation_meta(NATURE)
        assert meta["citation_title"] == ["Systemic risk in banking ecosystems"]
        assert meta["citation_author"] == ["Haldane, Andrew G.", "May, Robert M."]

    def test_takes_the_article_doi_never_one_from_a_citation_reference(self) -> None:
        """The trap this resolver exists to avoid.

        Nature emits dozens of ``citation_reference`` tags carrying the DOIs of
        the paper's OWN bibliography. A substring search for ``citation_doi``
        finds those too, and would silently attribute a cited work's metadata to
        the citing paper.
        """
        assert citation_meta(NATURE)["citation_doi"] == ["10.1038/nature09659"]

    def test_ignores_citation_reference_entirely(self) -> None:
        assert "citation_reference" not in citation_meta(NATURE)

    def test_returns_empty_for_a_page_with_no_citation_meta(self) -> None:
        assert citation_meta("<html><head><title>x</title></head></html>") == {}

    def test_decodes_html_entities_in_meta_content(self) -> None:
        meta = citation_meta(
            '<meta name="citation_title" content="Cats &amp; Dogs &#8212; A Study"/>'
        )
        assert meta["citation_title"][0] == "Cats & Dogs — A Study"

    def test_reads_unquoted_attributes_the_regex_version_could_not(self) -> None:
        """A parser handles what the TypeScript's regex documented as unhandled."""
        meta = citation_meta("<meta name=citation_title content=Untitled>")
        assert meta["citation_title"] == ["Untitled"]


class TestMetaToCsl:
    def test_maps_a_full_highwire_set(self) -> None:
        csl = meta_to_csl(citation_meta(NATURE))
        assert csl["title"] == "Systemic risk in banking ecosystems"
        assert csl["container-title"] == "Nature"
        assert csl["type"] == "article-journal"
        assert csl["issued"] == {"date-parts": [[2011]]}
        assert csl["volume"] == "469"
        assert csl["page"] == "351-355"
        assert csl["DOI"] == "10.1038/nature09659"

    def test_splits_family_given_on_the_comma(self) -> None:
        assert meta_to_csl(citation_meta(NATURE))["author"][0] == {
            "family": "Haldane",
            "given": "Andrew G.",
        }

    def test_treats_a_comma_free_name_as_given_family(self) -> None:
        meta = citation_meta('<meta name="citation_author" content="Robert May"/>')
        assert meta_to_csl(meta)["author"][0] == {"family": "May", "given": "Robert"}

    def test_keeps_a_mononym_literal_rather_than_guessing(self) -> None:
        meta = citation_meta('<meta name="citation_author" content="OpenAI"/>')
        assert meta_to_csl(meta)["author"][0] == {"literal": "OpenAI"}


class TestPubmedId:
    def test_extracts_the_pmid_from_a_canonical_pubmed_url(self) -> None:
        assert pubmed_id("https://pubmed.ncbi.nlm.nih.gov/13233369") == "13233369"

    @pytest.mark.parametrize(
        "url", ["https://nature.com/articles/nature09659", "https://arxiv.org/abs/1911.01547"]
    )
    def test_returns_none_for_a_non_pubmed_url(self, url: str) -> None:
        assert pubmed_id(url) is None


class TestClaims:
    @pytest.mark.parametrize(
        "url",
        [
            "https://nature.com/articles/nature09659",
            "https://pubmed.ncbi.nlm.nih.gov/13233369",
            "https://dl.acm.org/doi/10.1145/3442188",
            "https://onlinelibrary.wiley.com/doi/10.1111/x",
        ],
    )
    def test_claims_academic_publisher_hosts_including_subdomains(self, url: str) -> None:
        assert scholar_meta_resolver.claims(url)

    @pytest.mark.parametrize(
        "url",
        [
            "https://epoch.ai/blog/x",
            "https://lesswrong.com/posts/x",
            "https://arxiv.org/abs/1911.01547",
        ],
    )
    def test_does_not_claim_the_long_tail(self, url: str) -> None:
        """Claiming everything would make this and Open Graph both fetch each page."""
        assert not scholar_meta_resolver.claims(url)


class TestResolve:
    def test_hands_the_doi_to_crossref_and_prefers_its_record(self) -> None:
        calls: list[str] = []

        def handler(request: httpx.Request) -> httpx.Response:
            url = str(request.url)
            calls.append(url)
            if "api.crossref.org" in url:
                return json_response(
                    {
                        "message": {
                            "title": ["Systemic risk in banking ecosystems"],
                            "DOI": "10.1038/nature09659",
                            "container-title": ["Nature"],
                            "type": "journal-article",
                            "author": [{"family": "Haldane", "given": "Andrew G."}],
                            "issued": {"date-parts": [[2011, 1, 20]]},
                        }
                    }
                )
            return html_response(NATURE)

        out = scholar_meta_resolver.resolve(
            "https://nature.com/articles/nature09659", make_ctx(handler)
        )
        assert out is not None
        assert out.source == "scholar-meta"
        assert out.fields["DOI"] == "10.1038/nature09659"
        assert out.fields["container-title"] == "Nature"
        assert any("api.crossref.org" in c for c in calls)
        # URL must stay the cited one, not doi.org — the entry's identity.
        assert out.fields["URL"] == "https://nature.com/articles/nature09659"

    def test_falls_back_to_page_metadata_when_crossref_has_no_record(self) -> None:
        def handler(request: httpx.Request) -> httpx.Response:
            if "api.crossref.org" in str(request.url):
                return httpx.Response(404)
            return html_response(NATURE)

        out = scholar_meta_resolver.resolve(
            "https://nature.com/articles/nature09659", make_ctx(handler)
        )
        assert out is not None
        assert out.fields["title"] == "Systemic risk in banking ecosystems"
        assert out.fields["page"] == "351-355"
        assert out.note is not None
        assert "Crossref had no record" in out.note

    def test_resolves_pubmed_through_the_esummary_doi_lookup(self) -> None:
        calls: list[str] = []

        def handler(request: httpx.Request) -> httpx.Response:
            url = str(request.url)
            calls.append(url)
            if "eutils.ncbi" in url:
                return json_response(
                    {
                        "result": {
                            "13233369": {"articleids": [{"idtype": "doi", "value": "10.1038/x"}]}
                        }
                    }
                )
            return json_response({"message": {"title": ["A Paper"], "DOI": "10.1038/x"}})

        out = scholar_meta_resolver.resolve(
            "https://pubmed.ncbi.nlm.nih.gov/13233369", make_ctx(handler)
        )
        assert out is not None
        assert out.fields["title"] == "A Paper"
        # PubMed's page is JS-rendered and yields nothing, so it must never be fetched.
        assert not any("pubmed.ncbi.nlm.nih.gov" in c for c in calls)

    def test_declines_a_page_with_no_citation_meta_rather_than_guessing(self) -> None:
        ctx = make_ctx(lambda r: html_response("<html><head><title>Nothing</title></head></html>"))
        assert scholar_meta_resolver.resolve("https://nature.com/x", ctx) is None

    def test_an_unreachable_host_reports_unreachable_without_raising(self, unreachable_ctx) -> None:
        out = scholar_meta_resolver.resolve("https://nature.com/x", unreachable_ctx)
        assert out == Unreachable("unavailable")

    def test_a_publisher_waf_is_refused_not_declined(self) -> None:
        """The most common outcome on these hosts: 57 of the corpus's 132.

        A 403 says nothing whatever about the paper — only that we were not
        allowed to look. Recording it as a decline let Open Graph write the
        bot-check page's title into the bibliography (``audit:0011`` F13).
        """
        ctx = make_ctx(lambda r: httpx.Response(403))
        assert scholar_meta_resolver.resolve("https://nature.com/x", ctx) == Unreachable("refused")
