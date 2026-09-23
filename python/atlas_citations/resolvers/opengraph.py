"""Open Graph resolver — the long tail, last in ``RESOLVER_ORDER``.

It only runs when everything else declined, and it will resolve worst. That is
expected: no API describes these pages. ``task:0027`` says plainly that some
entries will honestly end as "Author, Year, URL". What this buys is titles (and,
where a page bothers, site name and date) for entries that would otherwise carry
only anchor text.

Ported from ``opengraph.ts`` under ``task:0029``, and this is one of the two
files the port exists for. The TypeScript version matched ``<meta>`` tags with a
regular expression under a "do not add an HTML parser dependency" rule, and
listed in its own header what that could not handle: unquoted attributes,
duplicate keys in differing case, and anything below the read cap. Real pages are
not well-formed, and a regex over other people's HTML is a standing invitation to
silently wrong metadata. BeautifulSoup handles the messy cases, including entity
decoding — which the TypeScript replaced with a hand-maintained table of
nineteen named entities found by sampling.

Two behaviours are deliberately kept from the original: the byte cap, and
scheme-checked redirects. httpx refuses to follow a redirect to a non-HTTP scheme
by raising, which the caller turns into a decline — the same outcome the
TypeScript reached by hand-walking each hop.
"""

from __future__ import annotations

import re
from typing import Any

from ..store import infer_csl_type
from ._http import MAX_HTML_BYTES, get_text_capped
from .base import ResolverContext, ResolveResult

#: Short, because one hung page must not stall a 948-URL run.
TIMEOUT_S = 10.0

_ISO_DATE = re.compile(r"^(\d{4})-(\d{2})-(\d{2})")

#: Titles that mean the fetch did not reach the document.
#:
#: A bot check, a redirect interstitial or an error page all return HTTP 200 with
#: a perfectly well-formed ``<title>``, so nothing upstream notices. Recording one
#: is worse than recording nothing: the entry is marked resolved, so it is never
#: retried, and the bibliography shows "METR (2025). Redirecting…" where the
#: anchor text alone would at least have been accurate. Found in the corpus:
#: "Checking your browser - reCAPTCHA", "Redirecting...", "Redirecting…".
#: See ``audit:0011`` F13.
#: Generic words that are only a signal when they are the *entire* title.
#: "Error Correction in Quantum Computing" and "Loading the Dice: Scaling Laws"
#: are real titles in this field, so a prefix match would eat them.
_NON_TITLE_EXACT = re.compile(
    r"^(redirecting|just a moment|please wait|one moment|loading|untitled|error|"
    r"not found|forbidden|page not found)[\s.…!|-]*$",
    re.IGNORECASE,
)

#: Phrases distinctive enough that a suffix is allowed — no real work is titled
#: "Attention Required! | Cloudflare".
_NON_TITLE_PREFIX = re.compile(
    r"^(checking your browser|attention required|access denied|are you a robot|"
    r"bot verification|security check|verify you are human|access to this page has been denied|"
    r"403 forbidden|404 not found|redirecting\s*\.{3}|redirecting\s*…)\b",
    re.IGNORECASE,
)

#: A title shorter than this carries no information a reader could use.
#: The corpus held one: a Google Books page titled "AI".
_MIN_TITLE_CHARS = 4


def usable_title(title: str) -> bool:
    """Whether a scraped title is worth recording.

    Declining leaves the entry unresolved, which is honest and — because
    ``resolve`` retries unresolved entries — recoverable. Recording a bot-check
    page is neither.
    """
    text = title.strip()
    if len(text) < _MIN_TITLE_CHARS:
        return False
    if _NON_TITLE_EXACT.match(text) or _NON_TITLE_PREFIX.match(text):
        return False
    return "recaptcha" not in text.lower()


def _soup(html: str):
    from bs4 import BeautifulSoup

    # lxml's HTML parser is lenient in the way real pages require and is
    # markedly faster than html.parser over a 256 KiB head.
    return BeautifulSoup(html, "lxml")


def meta_content(soup, key: str) -> str | None:
    """``content`` of the first ``<meta>`` whose ``property`` or ``name`` equals ``key``.

    Both attributes are matched because ``og:*`` uses ``property`` while
    ``twitter:*``, sometimes aliased to the same keys, uses ``name``.
    """
    for tag in soup.find_all("meta"):
        label = tag.get("property") or tag.get("name") or ""
        if label.strip().lower() == key:
            content = tag.get("content")
            if content and content.strip():
                return content.strip()
    return None


def title_tag(soup) -> str | None:
    """``<title>`` fallback for pages with no ``og:title`` (surprisingly many)."""
    if not soup.title or not soup.title.string:
        return None
    title = re.sub(r"\s+", " ", soup.title.string).strip()
    return title or None


class OpengraphResolver:
    name = "opengraph"
    #: Claims every HTTP URL — it is the last-resort fallback.
    selective = False

    def claims(self, canonical_url: str) -> bool:
        return canonical_url.startswith(("http://", "https://"))

    def resolve(self, canonical_url: str, ctx: ResolverContext) -> ResolveResult | None:
        html = get_text_capped(
            ctx, canonical_url, cap=MAX_HTML_BYTES, timeout=TIMEOUT_S, html_only=True
        )
        if not html:
            return None

        soup = _soup(html)
        og_title = meta_content(soup, "og:title")
        title = og_title or title_tag(soup)
        if not title or not usable_title(title):
            # Nothing to add beyond what the anchor gives — or worse than it.
            return None

        fields: dict[str, Any] = {
            # Webpage vs post-weblog is decided by the URL's domain — the same
            # decision store.py already made at extraction; reuse it, never fork it.
            "type": infer_csl_type(canonical_url),
            "title": title,
        }
        site_name = meta_content(soup, "og:site_name")
        if site_name:
            fields["container-title"] = site_name
        description = meta_content(soup, "og:description")
        if description:
            fields["abstract"] = description

        published = meta_content(soup, "article:published_time") or ""
        date = _ISO_DATE.match(published)
        if date:
            # An ISO timestamp is a full date; keep day precision, styles trim.
            fields["issued"] = {"date-parts": [[int(p) for p in date.groups()]]}

        return ResolveResult(
            fields=fields,
            source="opengraph",
            note=(
                None
                if og_title
                else "Title read from the <title> tag; the page had no Open Graph metadata."
            ),
        )


opengraph_resolver = OpengraphResolver()
