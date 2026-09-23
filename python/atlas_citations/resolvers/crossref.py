"""Crossref resolver - DOI-bearing sources.

Crossref speaks CSL natively (``api.crossref.org/works/<doi>`` returns the same
field names a CSL-JSON item uses), so this is deliberately a thin pass-through of
the fields we populate, not a hand-rolled mapping. Where Crossref and CSL differ,
they differ in shape, not meaning: titles and container titles are arrays
(CSL-JSON keeps the first), and ``issued`` arrives exactly in CSL ``date-parts``
form.

Ported from ``crossref.ts`` under ``task:0029``. ``habanero`` was considered and
not adopted: what it buys - pagination, query building, the polite-pool header -
is either unused here (we do single-record lookups by DOI) or one line. What it
would cost is the injected HTTP client that keeps the test suite offline. The
libraries this port does adopt were chosen where they replace something
hand-rolled and wrong; this call is a thin one and stays ours.
"""

from __future__ import annotations

import re
from typing import Any
from urllib.parse import quote, unquote, urlsplit

from ._http import get_json
from .base import ResolverContext, ResolveResult, Unreachable

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


_TAG = re.compile(r"<[^>]+>")


def _clean(text: str) -> str:
    """Strip inline markup and collapse whitespace.

    Crossref embeds presentational markup in titles - the real record for
    "Human-level play in the game of <i>Diplomacy</i>" carries those tags and
    the newlines around them verbatim - and CSL fields are plain text. A
    template escapes the tags rather than interpreting them, so they reached the
    reader. See ``audit:0011`` F11.
    """
    return " ".join(_TAG.sub("", text).split())


def _first(value: Any) -> str | None:
    """First element of a Crossref string-array field (``title``, ``container-title``)."""
    if isinstance(value, list) and value and isinstance(value[0], str):
        return _clean(value[0]) or None
    return None


#: Footnote markers a publisher carries into the author field - affiliation and
#: corresponding-author daggers, mostly. Observed in this corpus on the
#: Diplomacy paper, whose Crossref record credits "Meta Fundamental AI Research
#: Diplomacy Team (FAIR)†". A marker is typography from the PDF, not part of
#: anyone's name, and it renders in every citation style.
_NAME_MARKERS = "†‡*¶§ ,"


def _clean_name(text: str) -> str:
    return _clean(text).strip(_NAME_MARKERS)


def _map_authors(value: Any) -> list[dict[str, str]] | None:
    """Crossref gives real given/family splits - unlike the anchor text.

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
        if isinstance(family, str) and _clean_name(family):
            name = {"family": _clean_name(family)}
            if isinstance(given, str) and _clean_name(given):
                name["given"] = _clean_name(given)
            names.append(name)
        elif isinstance(author.get("name"), str) and _clean_name(author["name"]):
            names.append({"literal": _clean_name(author["name"])})
    return names or None


def _map_issued(value: Any) -> dict[str, Any] | None:
    """Crossref hands ``issued`` over already in CSL ``date-parts`` shape.

    With one trap: for a record it holds no date for, Crossref sends
    ``{"date-parts": [[null]]}`` rather than omitting the field. That is a date
    whose year is unknown, which is not a date - storing it produces an entry
    that claims to have a publication date and cannot render one, and a CSL
    processor reading it calls ``int(None)`` and raises.
    """
    if not isinstance(value, dict):
        return None
    parts = value.get("date-parts")
    if not (isinstance(parts, list) and parts and isinstance(parts[0], list)):
        return None
    clean = [[p for p in part if isinstance(p, int)] for part in parts]
    clean = [part for part in clean if part]
    return {"date-parts": clean} if clean else None


#: A DOI as it appears inside a publisher's URL path.
#:
#: Trailing punctuation is excluded from the character class because a DOI at the
#: end of a path routinely picks up a ``/full``, ``/pdf`` or ``?download=true``
#: that is not part of it; :func:`doi_from_url` trims what remains.
_DOI_IN_PATH = re.compile(r"(10\.\d{4,9}/[^\s?#]+)")

#: Path segments publishers append after a DOI. Cutting at these is safe because
#: a DOI suffix is publisher-assigned and none of these is a real one.
_DOI_TRAILING_SEGMENTS = ("/full", "/abs", "/pdf", "/epdf", "/abstract", "/html", "/meta")


def doi_from_url(canonical_url: str) -> str | None:
    """The DOI a URL carries, whether it is a ``doi.org`` link or a publisher's.

    ``task:0032`` D-3. This is deliberately the *only* way this resolver learns
    an identity. A DOI printed in the URL is an assertion the publisher itself
    made about which work this is; a title search is a guess, and D3 records the
    measurement that rejected one.

    Handles the shapes the corpus actually contains:
    ``dl.acm.org/doi/10.1145/…``, ``tandfonline.com/doi/full/10.1080/…``,
    ``pnas.org/doi/10.1073/…``, ``science.org/doi/10.1126/…``,
    ``onlinelibrary.wiley.com/doi/10.1002/…``.
    """
    match = _DOI_IN_PATH.search(unquote(urlsplit(canonical_url).path))
    if not match:
        return None
    doi = match.group(1).rstrip(".,;)")
    for segment in _DOI_TRAILING_SEGMENTS:
        if doi.lower().endswith(segment):
            doi = doi[: -len(segment)]
    # A DOI has a prefix and a non-empty suffix; anything else is a path that
    # merely began with something DOI-shaped.
    return doi if "/" in doi and doi.split("/", 1)[1] else None


class CrossrefResolver:
    name = "crossref"
    #: Claims any URL carrying a DOI, on ``doi.org`` or in a publisher's path.
    selective = True

    def claims(self, canonical_url: str) -> bool:
        return doi_from_url(canonical_url) is not None

    def resolve(
        self, canonical_url: str, ctx: ResolverContext
    ) -> ResolveResult | Unreachable | None:
        doi = doi_from_url(canonical_url)
        if not doi:
            return None

        # ctx.user_agent carries the mailto that puts us in Crossref's polite
        # pool; sending it is the whole price of the free API (task:0027 AC-5).
        body = get_json(ctx, API + quote(doi, safe=""), timeout=TIMEOUT_S)
        if isinstance(body, Unreachable):
            # A 404 here means Crossref has no record of a DOI the publisher
            # printed, which is a fact about Crossref, not about the document.
            return body if body.reason != "gone" else None
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
        # Crossref's own `URL` is the doi.org resolver link. That *is* the
        # canonical URL when the citation linked to doi.org, but since
        # ``task:0032`` this resolver also answers publisher URLs, where
        # overwriting would leave the entry claiming an address that is not its
        # identity (task:0021 D1). The key always wins; the DOI is recorded
        # separately and is what a reader needs anyway.
        fields["URL"] = canonical_url
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
