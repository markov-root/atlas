"""The research-database resolver — the local, free, try-first accelerator.

The homelab corpus answers by exact URL with CSL-grade metadata and no
third-party etiquette to observe, so it is tried before any networked resolver.
It is still only an accelerator, never a dependency: coverage is a minority of
the corpus (measured 2026-09-21 at 7.9% of cited URLs), and ``task:0021`` D4
requires the bibliography to build identically with the service down.

Three traps this file exists to handle, all discovered against the live service:

1. **Admission scope.** Records default to ``admitted`` and many relevant ones
   are ``unreviewed``, so every request widens with ``include_unreviewed=true``.
   Without it, resolution quietly misses records the corpus holds.
2. **URL spelling.** The corpus stores scraped URLs verbatim (modulo scheme/host
   case) and matching is exact string equality. Roughly 39% of stored URLs carry
   ``www.`` while our canonical form drops it, which silently loses cited URLs —
   so a miss retries once with ``www.`` inserted. Trailing-slash differences are
   handled server-side; nothing else is aliased, and inventing more variants
   would be guessing at corpus state.
3. **Authorship shape.** ``authors[]`` entries are ``{kind, label, resolved}``
   bylines, not family/given — and a *resolved organisation* author has no
   ``label`` at all. Labels map to CSL ``literal`` names and nulls are dropped;
   guessing a split here would produce confidently wrong output in every
   rendered style.

AC-6 is structural: an unreachable service, a non-200 response, or an unusable
body all return ``None`` — never a raise, never a hang — so a resolver that
accelerates a minority of sources cannot become a single point of failure for the
rest.

Ported from ``research-db.ts`` under ``task:0029``.
"""

from __future__ import annotations

import os
import re
from typing import Any
from urllib.parse import quote

from ..store import literal_name, with_www
from ._http import get_json
from .base import ResolverContext, ResolveResult

#: Generous for a LAN service, short enough that a stalled one never wedges a run.
TIMEOUT_S = 5.0

#: ``source_type`` is a provenance-first label, not a CSL type. The corpus's types
#: are organisations (anthropic, deepmind, epoch…) plus a few formats. Only the
#: mappings that are actually distinctive are made here; everything else renders
#: as a webpage, which is what an org landing page is.
SOURCE_TYPE_TO_CSL = {
    "arxiv": "article",
    "substack": "post-weblog",
    "alignmentforum": "post-weblog",
    "lesswrong": "post-weblog",
    "youtube": "motion_picture",
}

_DATE = re.compile(r"^(\d{4})(?:-(\d{2}))?(?:-(\d{2}))?")


def api_base() -> str:
    """Same variable the ``research`` CLI honours, so one setting controls both."""
    return os.environ.get("RESEARCH_API") or "http://localhost:8551"


def _parse_date(raw: Any) -> dict[str, Any] | None:
    """``2024-08-15T17:23:10Z`` (or a bare date) → CSL date-parts, or ``None``."""
    if not isinstance(raw, str):
        return None
    m = _DATE.match(raw)
    if not m:
        return None
    return {"date-parts": [[int(g) for g in m.groups() if g is not None]]}


def _map_authors(authors: Any) -> list[dict[str, str]]:
    """Captured bylines → CSL literal names.

    A resolved-organisation author (null label) is not a name.
    """
    if not isinstance(authors, list):
        return []
    out = []
    for author in authors:
        if isinstance(author, dict):
            label = author.get("label")
            if isinstance(label, str) and label.strip():
                out.append(literal_name(label))
    return out


def _attempt(ref_url: str, ctx: ResolverContext) -> ResolveResult | None:
    """One request, one verdict.

    Returns ``None`` for every "tried, found nothing" outcome: network error,
    non-200, non-JSON body, ``success`` false, or a record too empty to improve
    the entry. It does not raise, which is what makes the two-variant retry safe.

    Deliberately flattens ``task:0032``'s unreachable signal back to ``None``:
    this corpus is a local accelerator, and ``task:0027`` AC-6 requires the
    bibliography to come out identical when it is down. An outage here must be
    invisible, not a verdict — which is also why the resolver is ``selective =
    False`` and so cannot block the fallback chain.
    """
    url = f"{api_base()}/api/records/citation?ref={quote(ref_url, safe='')}&include_unreviewed=true"
    payload = get_json(ctx, url, timeout=TIMEOUT_S)
    if not isinstance(payload, dict) or not payload.get("success"):
        return None

    fields: dict[str, Any] = {}
    title = payload.get("title")
    if isinstance(title, str) and title.strip():
        fields["title"] = title
    authors = _map_authors(payload.get("authors"))
    if authors:
        fields["author"] = authors
    issued = _parse_date(payload.get("publication_date"))
    if issued:
        fields["issued"] = issued
    abstract = payload.get("abstract")
    if isinstance(abstract, str) and abstract.strip():
        fields["abstract"] = abstract
    source_type = payload.get("source_type")
    if source_type in SOURCE_TYPE_TO_CSL:
        fields["type"] = SOURCE_TYPE_TO_CSL[source_type]

    if not fields:
        return None

    missing = []
    if not authors:
        missing.append("no author labels")
    if not issued:
        missing.append("no publication date")
    # Deliberately factual, in the store's note voice: what is absent, not a
    # warranty about what is present. The corpus leaves attribution
    # `legacy_unknown` until reviewed; the labels it returns are the captured
    # byline, which is more than the anchor text knew but not more than that.
    note = f"Research-database record found, but {' and '.join(missing)}." if missing else None
    return ResolveResult(fields=fields, source="research-db", note=note)


class ResearchDbResolver:
    name = "research-db"
    #: Claims every HTTP URL — a free local lookup, not a signal of coverage.
    selective = False

    def claims(self, canonical_url: str) -> bool:
        # Broadly true by design: the corpus spans many domains, so almost any
        # URL is worth one local request before the networked resolvers are
        # paid for.
        return canonical_url.startswith(("http://", "https://"))

    def resolve(self, canonical_url: str, ctx: ResolverContext) -> ResolveResult | None:
        result = _attempt(canonical_url, ctx)
        if result:
            return result
        www = with_www(canonical_url)
        return _attempt(www, ctx) if www else None


research_db_resolver = ResearchDbResolver()
