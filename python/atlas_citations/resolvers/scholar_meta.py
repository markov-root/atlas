"""Academic publisher pages: Highwire ``citation_*`` meta tags, then Crossref.

Added after the first full resolve run showed the gap. 43 cited sources sit on
publisher domains — Nature, IEEE, ACM, Wiley, OUP, SSRN, PNAS, PubMed — and none
of them reached Crossref, because :class:`CrossrefResolver` only claims
``doi.org/*`` and the whole corpus contains exactly **one** such URL. Those 43
fell through to Open Graph, which gave 18 of them a bare title and left 25 with
nothing.

The fix is to get a DOI out of the page and then ask Crossref, which returns the
authoritative record: real author names, journal, volume, pages, date.

Two routes, because publishers differ:

1. **Highwire meta tags** (``citation_doi``, ``citation_title``,
   ``citation_author``, …). A de-facto standard — it is what Google Scholar
   indexes — so most publishers emit it.
2. **PubMed** emits none of it: the page is JS-rendered and returns a stub to a
   plain fetch. But the URL carries a PMID, and NCBI's esummary API maps that to
   a DOI for free and without a key.

Either route ends at a DOI, at which point Crossref does the real work. When no
DOI is available the meta tags are mapped directly, which is still far better
than a bare title.

Ported from ``scholar-meta.ts`` under ``task:0029``, replacing regex meta-tag
extraction with a real parser. The trap that motivated the original's careful
matching is unchanged and still tested: a substring search for ``citation_doi``
also matches **inside** ``citation_reference`` tags, which carry the DOIs of the
paper's own bibliography — Nature emits dozens. Attributing a cited work's
metadata to the citing paper is worse than failing, so ``citation_reference`` is
skipped outright.
"""

from __future__ import annotations

import re
from typing import Any
from urllib.parse import urlsplit

from ._http import MAX_SCHOLAR_BYTES, get_json, get_text_capped
from .base import ResolverContext, ResolveResult
from .crossref import crossref_resolver

TIMEOUT_S = 15.0

#: Hosts this resolver claims.
#:
#: Deliberately an explicit list rather than "any URL". Claiming everything would
#: double the network load on the long tail — this resolver and Open Graph would
#: each fetch the same page — to serve a small minority. Adding a publisher is a
#: one-line change here.
ACADEMIC_HOSTS = (
    "pubmed.ncbi.nlm.nih.gov",
    "ncbi.nlm.nih.gov",
    "nature.com",
    "ieeexplore.ieee.org",
    "papers.ssrn.com",
    "ssrn.com",
    "sciencedirect.com",
    "onlinelibrary.wiley.com",
    "academic.oup.com",
    "dl.acm.org",
    "pnas.org",
    "tandfonline.com",
    "psycnet.apa.org",
    "link.springer.com",
    "springer.com",
    "jstor.org",
    "biorxiv.org",
    "medrxiv.org",
    "cell.com",
    "science.org",
    "plos.org",
    "journals.plos.org",
    "mdpi.com",
    "frontiersin.org",
)

_PMID_PATH = re.compile(r"^/(\d+)/?$")
_YEAR = re.compile(r"(\d{4})")


def host_of(url: str) -> str | None:
    try:
        host = urlsplit(url).hostname
    except ValueError:
        return None
    return re.sub(r"^www\.", "", host.lower()) if host else None


def citation_meta(html: str) -> dict[str, list[str]]:
    """Values of every ``<meta name="citation_x" content="...">`` on the page.

    ``citation_reference`` is skipped: it describes a DIFFERENT work — one of the
    paper's own references — and never this one.
    """
    from bs4 import BeautifulSoup

    out: dict[str, list[str]] = {}
    for tag in BeautifulSoup(html, "lxml").find_all("meta"):
        name = (tag.get("name") or "").strip().lower()
        if not name.startswith("citation_") or name == "citation_reference":
            continue
        content = tag.get("content")
        if content is None or content == "":
            continue
        out.setdefault(name, []).append(content)
    return out


def _parse_author(raw: str) -> dict[str, str]:
    """``citation_author`` is "Family, Given" or "Given Family" by publisher.

    A comma is the reliable signal: with one, the part before it is the family
    name. Without, the last whitespace-separated token is taken as the family
    name — wrong for "van den Berg" and for mononyms, which is why it is only
    used when no comma is present and never on a name we could preserve intact.
    """
    name = raw.strip()
    if "," in name:
        family, _, given = name.partition(",")
        given = given.strip()
        return {"family": family.strip(), "given": given} if given else {"family": family.strip()}
    parts = name.split()
    if len(parts) < 2:
        return {"literal": name}
    return {"family": parts[-1], "given": " ".join(parts[:-1])}


def _parse_date(raw: str) -> dict[str, Any] | None:
    """``2011/01``, ``2011-01-15`` and ``2011`` all reduce to a CSL year."""
    m = _YEAR.search(raw)
    return {"date-parts": [[int(m.group(1))]]} if m else None


def meta_to_csl(meta: dict[str, list[str]]) -> dict[str, Any]:
    """Map Highwire meta straight to CSL, for pages that expose no DOI."""

    def one(key: str) -> str | None:
        values = meta.get(key)
        return values[0] if values else None

    fields: dict[str, Any] = {}
    title = one("citation_title")
    if title:
        fields["title"] = title
    authors = meta.get("citation_author")
    if authors:
        fields["author"] = [_parse_author(a) for a in authors]
    journal = one("citation_journal_title")
    if journal:
        fields["container-title"] = journal
        fields["type"] = "article-journal"
    date = one("citation_publication_date") or one("citation_date") or one("citation_year")
    if date:
        issued = _parse_date(date)
        if issued:
            fields["issued"] = issued
    doi = one("citation_doi")
    if doi:
        fields["DOI"] = doi
    volume = one("citation_volume")
    if volume:
        fields["volume"] = volume
    first = one("citation_firstpage")
    last = one("citation_lastpage")
    if first:
        fields["page"] = f"{first}-{last}" if last else first
    publisher = one("citation_publisher")
    if publisher:
        fields["publisher"] = publisher
    return fields


def pubmed_id(url: str) -> str | None:
    """PubMed article id from a canonical PubMed URL, or ``None``."""
    host = host_of(url)
    if not host or "ncbi.nlm.nih.gov" not in host:
        return None
    m = _PMID_PATH.match(urlsplit(url).path)
    return m.group(1) if m else None


def _doi_from_pubmed(url: str, ctx: ResolverContext) -> str | None:
    pmid = pubmed_id(url)
    if not pmid:
        return None
    body = get_json(
        ctx,
        "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi"
        f"?db=pubmed&retmode=json&id={pmid}",
        timeout=TIMEOUT_S,
    )
    if not isinstance(body, dict):
        return None
    record = (body.get("result") or {}).get(pmid)
    if not isinstance(record, dict):
        return None
    for ident in record.get("articleids") or []:
        if isinstance(ident, dict) and ident.get("idtype") == "doi" and ident.get("value"):
            return str(ident["value"])
    return None


class ScholarMetaResolver:
    name = "scholar-meta"

    def claims(self, canonical_url: str) -> bool:
        host = host_of(canonical_url)
        if not host:
            return False
        return any(host == h or host.endswith("." + h) for h in ACADEMIC_HOSTS)

    def resolve(self, canonical_url: str, ctx: ResolverContext) -> ResolveResult | None:
        doi: str | None = None
        meta_fields: dict[str, Any] = {}

        if pubmed_id(canonical_url):
            # PubMed's own page is JS-rendered and yields nothing, so it is
            # never fetched — the PMID goes straight to esummary.
            doi = _doi_from_pubmed(canonical_url, ctx)
        else:
            html = get_text_capped(
                ctx,
                canonical_url,
                cap=MAX_SCHOLAR_BYTES,
                timeout=TIMEOUT_S,
                headers={"Accept": "text/html"},
            )
            if html is None:
                return None
            meta = citation_meta(html)
            if not meta:
                return None
            meta_fields = meta_to_csl(meta)
            values = meta.get("citation_doi")
            doi = values[0] if values else None

        # A DOI means Crossref can give the authoritative record — real author
        # names, journal, volume, pages — which is the whole point of this
        # resolver. Its output wins over the page's own meta where they overlap.
        if doi:
            via_crossref = crossref_resolver.resolve(f"https://doi.org/{doi}", ctx)
            if via_crossref:
                return ResolveResult(
                    fields={
                        **meta_fields,
                        **via_crossref.fields,
                        "URL": canonical_url,
                        "DOI": doi,
                    },
                    source="scholar-meta",
                    note="Resolved via publisher metadata and Crossref.",
                )

        # No DOI, or Crossref declined. The meta tags alone still beat a bare
        # title, so return them rather than falling through to Open Graph.
        if not meta_fields.get("title"):
            return None
        return ResolveResult(
            fields={**meta_fields, "URL": canonical_url},
            source="scholar-meta",
            note="Publisher metadata; Crossref had no record." if doi else None,
        )


scholar_meta_resolver = ScholarMetaResolver()
