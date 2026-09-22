"""Crossref resolver — DOI-bearing sources.

Crossref speaks CSL natively (``api.crossref.org/works/<doi>`` returns the same
field names a CSL-JSON item uses), so this is deliberately a thin pass-through of
the fields we populate, not a hand-rolled mapping. Where Crossref and CSL differ,
they differ in shape, not meaning: titles and container titles are arrays
(CSL-JSON keeps the first), and ``issued`` arrives exactly in CSL ``date-parts``
form.

Ported from ``crossref.ts`` under ``task:0029``. ``habanero`` was considered and
not adopted: what it buys — pagination, query building, the polite-pool header —
is either unused here (we do single-record lookups by DOI) or one line. What it
would cost is the injected HTTP client that keeps the test suite offline. The
libraries this port does adopt were chosen where they replace something
hand-rolled and wrong; this call is a thin one and stays ours.
"""

from __future__ import annotations

from typing import Any
from urllib.parse import quote, unquote, urlsplit

from ._http import get_json
from .base import ResolverContext, ResolveResult

API = "https://api.crossref.org/works/"

#: Generous but bounded: Crossref is usually fast, and a hung request must not
#: stall a run over 948 URLs.
TIMEOUT_S = 30.0

#: Crossref ``type`` values onto the CSL types this project emits. Unknown values
#: fall back to ``document`` rather than to a guessed near-miss.
TYPE_MAP = {
    "journal-article": "article-journal",
    "proceedings-article": "paper-conference",
    # Crossref uses posted-content for preprints and working papers alike; CSL
    # 'article' is this project's preprint type (see store.py).
    "posted-content": "article",
    "report": "report",
}


def _first(value: Any) -> str | None:
    """First element of a Crossref string-array field (``title``, ``container-title``)."""
    if isinstance(value, list) and value and isinstance(value[0], str):
        return value[0]
    return None


def _map_authors(value: Any) -> list[dict[str, str]] | None:
    """Crossref gives real given/family splits — unlike the anchor text.

    That is why this resolver is allowed to produce structured names.
    Organisation authors arrive as ``name`` and stay literal: inventing a split
    for "DeepMind" is exactly what the store's ``literal`` exists to avoid.
    """
    if not isinstance(value, list):
        return None
    names: list[dict[str, str]] = []
    for author in value:
        if not isinstance(author, dict):
            continue
        family = author.get("family")
        given = author.get("given")
        if isinstance(family, str):
            names.append(
                {"family": family, "given": given} if isinstance(given, str) else {"family": family}
            )
        elif isinstance(author.get("name"), str):
            names.append({"literal": author["name"]})
    return names or None


def _map_issued(value: Any) -> dict[str, Any] | None:
    """Crossref hands ``issued`` over already in CSL ``date-parts`` shape."""
    if isinstance(value, dict):
        parts = value.get("date-parts")
        if isinstance(parts, list) and parts and isinstance(parts[0], list):
            return {"date-parts": parts}
    return None


class CrossrefResolver:
    name = "crossref"

    def claims(self, canonical_url: str) -> bool:
        return canonical_url.startswith("https://doi.org/")

    def resolve(self, canonical_url: str, ctx: ResolverContext) -> ResolveResult | None:
        doi = unquote(urlsplit(canonical_url).path.lstrip("/"))
        if not doi:
            return None

        # ctx.user_agent carries the mailto that puts us in Crossref's polite
        # pool; sending it is the whole price of the free API (task:0027 AC-5).
        body = get_json(ctx, API + quote(doi, safe=""), timeout=TIMEOUT_S)
        if not isinstance(body, dict):
            return None
        work = body.get("message")
        if not isinstance(work, dict):
            return None

        title = _first(work.get("title"))
        if not title:
            return None

        fields: dict[str, Any] = {"title": title}
        if isinstance(work.get("DOI"), str):
            fields["DOI"] = work["DOI"]
        # Crossref's URL points at doi.org, which is the canonical URL itself.
        if isinstance(work.get("URL"), str):
            fields["URL"] = work["URL"]
        container = _first(work.get("container-title"))
        if container:
            fields["container-title"] = container
        if isinstance(work.get("type"), str):
            fields["type"] = TYPE_MAP.get(work["type"], "document")
        authors = _map_authors(work.get("author"))
        if authors:
            fields["author"] = authors
        issued = _map_issued(work.get("issued"))
        if issued:
            fields["issued"] = issued

        return ResolveResult(fields=fields, source="crossref")


crossref_resolver = CrossrefResolver()
