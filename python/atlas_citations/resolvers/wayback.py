"""The Internet Archive - last resort, for citations whose page is gone.

``task:0032``, scope item 5. Eleven of this corpus's citations point at pages
that answer HTTP 404 or 410: four `planned-obsolescence.org` posts, a Defense
Innovation Unit page, the CIFAR dataset page, an Our World in Data chart. The
works existed - the authors read them - and the addresses no longer resolve.

Citing an archived copy is the standard scholarly answer to that, and it is
strictly better than the alternatives: dropping the citation loses the evidence,
and leaving a dead link asks every reader to discover the rot for themselves.

Runs **after Open Graph**, which is what makes it cheap: by the time this is
reached, the live page has already failed. It is not selective, so it never
blocks anything, and it resolves nothing that the live web could have answered.

Two properties this deliberately keeps:

- **The entry's URL stays the dead original.** That is its identity
  (``task:0021`` D1), and it is also what the prose links to. The snapshot goes
  in CSL's ``archive_location``, which is the field that exists for exactly this.
- **A wayback resolution still counts as a dead link in the report.** The page
  being gone is a fact about the citation; having found a copy is a fact about
  our metadata. Recording the second must not hide the first from the authors,
  who are the only people who can decide whether to re-cite or replace.
"""

from __future__ import annotations

from typing import Any

from ._http import MAX_HTML_BYTES, get_json, get_text_capped
from .base import ResolverContext, ResolveResult, Unreachable
from .opengraph import _soup, clean_title, meta_content, title_tag, usable_title

#: The availability API: one URL in, the closest snapshot out.
AVAILABILITY_API = "https://archive.org/wayback/available"

#: The Archive is generous but not fast, and it is a charity's infrastructure.
TIMEOUT_S = 30.0


def snapshot_for(canonical_url: str, ctx: ResolverContext) -> tuple[str, str] | Unreachable | None:
    """The closest archived snapshot's URL and timestamp, or ``None``.

    Coverage is genuinely partial - 2 of 4 sampled corpus dead links had a
    snapshot - so this reduces the set a human must finish rather than closing
    it. That is worth saying plainly: a resolver that half works is still worth
    having when the alternative is hand-writing every entry.
    """
    body = get_json(ctx, f"{AVAILABILITY_API}?url={canonical_url}", timeout=TIMEOUT_S)
    # The Archive being down is not evidence that no snapshot exists. Reported so
    # the entry is retried rather than written off - the same distinction the
    # rest of the contract turns on (audit:0011 F12).
    if isinstance(body, Unreachable):
        return body
    if not isinstance(body, dict):
        return None
    closest = (body.get("archived_snapshots") or {}).get("closest")
    if not isinstance(closest, dict) or not closest.get("available"):
        return None
    url, timestamp = closest.get("url"), closest.get("timestamp")
    if not isinstance(url, str) or not isinstance(timestamp, str):
        return None
    # The API answers over http even for https snapshots; ask for the secure one.
    return url.replace("http://web.archive.org", "https://web.archive.org", 1), timestamp


def _issued_from_timestamp(timestamp: str) -> dict[str, Any] | None:
    """``20210804125857`` → CSL date-parts.

    This is the date the page was *captured*, which is not its publication date
    and must never be recorded as one. It is returned separately so the caller
    can put it where it belongs.
    """
    if len(timestamp) < 8 or not timestamp[:8].isdigit():
        return None
    return {"date-parts": [[int(timestamp[:4]), int(timestamp[4:6]), int(timestamp[6:8])]]}


class WaybackResolver:
    name = "wayback"
    #: Claims every HTTP URL, like Open Graph - but runs after it, so in practice
    #: it only ever sees what the live web could not answer.
    selective = False

    def claims(self, canonical_url: str) -> bool:
        return canonical_url.startswith(("http://", "https://"))

    def resolve(
        self, canonical_url: str, ctx: ResolverContext
    ) -> ResolveResult | Unreachable | None:
        found = snapshot_for(canonical_url, ctx)
        if isinstance(found, Unreachable):
            return found
        if not found:
            return None
        snapshot_url, timestamp = found

        html = get_text_capped(
            ctx, snapshot_url, cap=MAX_HTML_BYTES, timeout=TIMEOUT_S, html_only=True
        )
        if isinstance(html, Unreachable) or not html:
            return None

        soup = _soup(html)
        title = clean_title(meta_content(soup, "og:title") or title_tag(soup) or "")
        if not title or not usable_title(title):
            return None

        fields: dict[str, Any] = {
            "title": title,
            # CSL's archive fields exist for precisely this, and using them keeps
            # the information in a form Zotero and Pandoc already understand
            # rather than in a note nothing can read.
            "archive": "Internet Archive",
            "archive_location": snapshot_url,
            "URL": canonical_url,
        }
        site_name = meta_content(soup, "og:site_name")
        if site_name:
            fields["container-title"] = site_name
        accessed = _issued_from_timestamp(timestamp)
        if accessed:
            # `accessed`, never `issued`. When the snapshot was taken says
            # nothing about when the work was published, and a bibliography that
            # conflated the two would date every archived source to whenever a
            # crawler happened to pass.
            fields["accessed"] = accessed

        return ResolveResult(
            fields=fields,
            source="wayback",
            note=(
                "The cited page no longer exists; this metadata comes from the "
                "Internet Archive's copy."
            ),
        )


wayback_resolver = WaybackResolver()
