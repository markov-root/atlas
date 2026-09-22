"""The arXiv resolver — the biggest single win in the corpus (303 of 948 sources).

The arXiv API (``export.arxiv.org/api/query``) answers one id with an Atom feed
of title, authors as full-name strings, a published timestamp, a summary, and —
for papers that already have one — the published DOI.

Ported from ``arxiv.ts`` under ``task:0029``, and the port removes a stated
limitation rather than carrying it across. The TypeScript version extracted
fields by regular expression against the raw Atom document, under a self-imposed
"no XML parser dependency" rule, and documented in its own header what that
could not handle: nested elements inside ``<title>``, namespaces, CDATA, and any
character entity outside a hand-written table. ``feedparser`` handles all of it
and is what the ``arxiv`` package itself uses internally.

Transport stays ours rather than moving to the ``arxiv`` package. That package
owns its own HTTP session, which would cost the injected-client property the
test suite depends on (``task:0027`` AC-1: no test makes a live request). The
parsing is where the risk was, and that is what has been handed to a library.

Two response shapes are still answered ``None`` rather than mapped, because both
would otherwise fabricate a bibliography entry: an empty feed (HTTP 200, zero
entries — a nonexistent id) and the *error entry* — a malformed id still returns
HTTP 200 with a single entry titled "Error" authored by "arXiv api core".
"""

from __future__ import annotations

import re
from typing import Any
from urllib.parse import unquote

import feedparser

from ..store import CslName
from ._http import get_text_capped
from .base import ResolverContext, ResolveResult

#: Remote service, so more slack than the LAN corpus — but never unbounded.
TIMEOUT_S = 10.0

#: An Atom feed for a single entry is small; this is a sanity bound, not a filter.
MAX_BYTES = 512 * 1024

_ABS_URL = re.compile(r"^https://arxiv\.org/abs/(.+)$", re.IGNORECASE)
_DATE = re.compile(r"^(\d{4})(?:-(\d{2}))?(?:-(\d{2}))?")


def arxiv_id_from_url(canonical_url: str) -> str | None:
    """The arXiv id from a canonical ``/abs/`` URL, or ``None``.

    Canonicalization has already collapsed ``/pdf``, ``/html`` and version
    suffixes, so this only has to recognise the one remaining shape.
    """
    m = _ABS_URL.match(canonical_url)
    return unquote(m.group(1)) if m else None


def _split_name(full: str) -> CslName:
    """arXiv gives full names as single strings; split on the last space.

    This puts most Western names into family/given correctly. Multi-word family
    names ("van der Berg", transliterated East Asian orders) come out wrong — the
    given part absorbs the extra words. Accepted over a ``literal`` name because
    the split is right for the large majority and wrong for almost none of this
    corpus's authors, while ``literal`` degrades every inverted-name style for
    all of them. Single-word names (organisations) stay ``literal``.
    """
    full = full.strip()
    given, sep, family = full.rpartition(" ")
    if not sep:
        return {"literal": full}
    return {"given": given.strip(), "family": family.strip()}


def _parse_published(raw: str) -> dict[str, Any] | None:
    """``2023-10-30T17:44:09Z`` → CSL date-parts. arXiv always sends UTC."""
    m = _DATE.match(raw)
    if not m:
        return None
    parts = [int(g) for g in m.groups() if g is not None]
    return {"date-parts": [parts]}


def _collapse(text: str) -> str:
    """Titles and abstracts wrap in the feed; newlines and runs of spaces are layout."""
    return re.sub(r"\s+", " ", text).strip()


class ArxivResolver:
    name = "arxiv"
    #: Claims only canonical ``/abs/`` URLs.
    selective = True

    def claims(self, canonical_url: str) -> bool:
        return arxiv_id_from_url(canonical_url) is not None

    def resolve(self, canonical_url: str, ctx: ResolverContext) -> ResolveResult | None:
        arxiv_id = arxiv_id_from_url(canonical_url)
        if not arxiv_id:
            return None

        # Protocol-level etiquette (task:0027 AC-5): identify ourselves via the
        # context's user agent, and let the runner pace the requests.
        text = get_text_capped(
            ctx,
            f"https://export.arxiv.org/api/query?id_list={arxiv_id}",
            cap=MAX_BYTES,
            timeout=TIMEOUT_S,
        )
        if not text:
            return None

        feed = feedparser.parse(text)
        if not feed.entries:
            return None
        entry = feed.entries[0]

        # The malformed-id shape: a 200 response whose only entry is the API's
        # own error record. Detected by its id, not its title — the title is
        # prose that could change.
        if "arxiv.org/api/errors" in entry.get("id", ""):
            return None

        title = entry.get("title")
        published = entry.get("published")
        if not title or not published:
            return None

        # Preprint: the published version, if any, is a different entry keyed by
        # its DOI (task:0021 edge case 2 — duplicates are accepted in phase 1).
        fields: dict[str, Any] = {
            "type": "article",
            "title": _collapse(title),
            "URL": canonical_url,
        }

        issued = _parse_published(published)
        if issued:
            fields["issued"] = issued

        authors = [a.get("name", "").strip() for a in entry.get("authors", [])]
        authors = [a for a in authors if a]
        if authors:
            fields["author"] = [_split_name(a) for a in authors]

        summary = entry.get("summary")
        if summary:
            fields["abstract"] = _collapse(summary)

        doi = entry.get("arxiv_doi")
        if doi:
            fields["DOI"] = doi.strip()

        return ResolveResult(fields=fields, source="arxiv")


arxiv_resolver = ArxivResolver()
