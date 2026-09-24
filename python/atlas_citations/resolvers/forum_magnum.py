"""LessWrong, the EA Forum and the Alignment Forum - one API for all three.

``task:0032`` AC-4. These three sites run the same open-source software
(ForumMagnum) and expose the same public GraphQL endpoint, so one resolver
answers all of them. The post id is already in the URL path - ``/posts/<id>/<slug>``
- which means identity comes from the address rather than from a search, the
same standard ``crossref.py`` holds itself to.

This resolver exists because scraping these sites does not work and cannot be
made to. The pages are client-rendered: a plain fetch of a shortform or comment
permalink returns HTTP 200 with no title at all, which the ``task:0032`` probe
found for every LessWrong entry in the unresolved set. Open Graph has no way to
succeed there, and no amount of retrying changes that.

They are also a large and *growing* share of this corpus - the AI safety
literature these chapters cite lives on these three sites as much as on arXiv -
so leaving them to a last-resort scraper was always going to age badly.
"""

from __future__ import annotations

import re
from typing import Any
from urllib.parse import parse_qs, urlsplit

from ..store import literal_name
from ._http import get_json
from .base import ResolverContext, ResolveResult, Unreachable

#: Short: these are responsive sites, and one hung request must not stall a run.
TIMEOUT_S = 15.0

#: Host → the GraphQL endpoint and the container title to record for it.
#:
#: Alignment Forum posts are cross-posted from LessWrong and share post ids, but
#: each site answers for its own, so each is asked at its own endpoint.
SITES = {
    "lesswrong.com": ("https://www.lesswrong.com/graphql", "LessWrong"),
    "alignmentforum.org": ("https://www.alignmentforum.org/graphql", "AI Alignment Forum"),
    "forum.effectivealtruism.org": (
        "https://forum.effectivealtruism.org/graphql",
        "EA Forum",
    ),
}

#: ``/posts/<id>`` and ``/posts/<id>/<slug>``; also ``/s/<seq>/p/<id>`` (sequences).
_POST_PATH = re.compile(r"^/(?:posts|s/[^/]+/p)/([A-Za-z0-9]{13,20})(?:/|$)")

#: One request, one post. ``coauthors`` matters: a jointly written post that
#: credits only its submitter is a citation error we would be introducing.
_QUERY = """
query AtlasCitation($id: String!) {
  post(input: {selector: {_id: $id}}) {
    result {
      _id
      title
      pageUrl
      postedAt
      user { displayName }
      coauthors { displayName }
    }
  }
}
"""

#: A comment carries no title of its own, so the parent post's title is fetched
#: to build one. Everything else - author, date - is the comment's.
_COMMENT_QUERY = """
query AtlasComment($id: String!) {
  comment(input: {selector: {_id: $id}}) {
    result {
      _id
      postedAt
      user { displayName }
      post { title }
    }
  }
}
"""


def site_for(canonical_url: str) -> tuple[str, str] | None:
    """The GraphQL endpoint and container title for a URL's host, or ``None``."""
    host = (urlsplit(canonical_url).hostname or "").lower()
    if not host:
        return None
    for suffix, site in SITES.items():
        if host == suffix or host.endswith("." + suffix):
            return site
    return None


def post_id(canonical_url: str) -> str | None:
    """The ForumMagnum post id in a URL path, or ``None``.

    A comment permalink (``?commentId=…``) keeps its post id, because the
    comment query needs neither - but the post id alone is **not** the whole
    answer for such a URL. See ``comment_id`` and ``audit:0011`` F22.
    """
    match = _POST_PATH.match(urlsplit(canonical_url).path)
    return match.group(1) if match else None


def comment_id(canonical_url: str) -> str | None:
    """The ``commentId`` a permalink points at, or ``None`` for a plain post.

    ``audit:0011`` F22. This resolver used to drop the parameter and return the
    containing post, on the stated premise that "a comment has no title or
    author record of its own to render". The premise is false: the API returns a
    comment's author and date, and only its title is genuinely absent.

    Dropping it was not a cosmetic loss. Four citations in this corpus point at
    a conversation in one shortform thread, written by **three different
    people**, and all four were credited to the thread's owner. The authors' own
    anchor text said "Segerie, 2025" and "Hernandez, 2025" while the
    bibliography said johnswentworth. A citation that names the wrong author is
    worse than one with no author at all.
    """
    values = parse_qs(urlsplit(canonical_url).query).get("commentId") or []
    value = values[0].strip() if values else ""
    return value or None


def _authors(result: dict[str, Any]) -> list[dict[str, str]] | None:
    """Submitter plus coauthors, as CSL literal names.

    ``literal`` and not a family/given split, deliberately: a display name on
    these sites is a chosen handle - "johnswentworth", "So8res", "Zvi" - and
    splitting one on its last space invents a surname that does not exist. This
    is exactly the case ``store.literal_name`` was written for.
    """
    names: list[dict[str, str]] = []
    user = result.get("user")
    if isinstance(user, dict) and isinstance(user.get("displayName"), str):
        names.append(literal_name(user["displayName"].strip()))
    for coauthor in result.get("coauthors") or []:
        if isinstance(coauthor, dict) and isinstance(coauthor.get("displayName"), str):
            name = literal_name(coauthor["displayName"].strip())
            if name not in names:
                names.append(name)
    return [n for n in names if n["literal"]] or None


def _title_for(result: dict[str, Any], *, is_comment: bool) -> str | None:
    """The title to record, or ``None`` when the API gave nothing usable.

    A post states its own title. A comment does not have one, so it is named by
    what it is: a comment on the thread that contains it. That is editorial, and
    it is the smallest honest thing to write - the alternative is to reuse the
    post's title, which reads as though the commenter wrote the post.
    """
    if not is_comment:
        title = result.get("title")
        return title.strip() if isinstance(title, str) and title.strip() else None
    post = result.get("post")
    parent = post.get("title") if isinstance(post, dict) else None
    if not isinstance(parent, str) or not parent.strip():
        return None
    return f"Comment on “{parent.strip()}”"


def _issued(posted_at: Any) -> dict[str, Any] | None:
    """``2020-02-27T19:04:55.108Z`` → CSL date-parts. Always ISO-8601 UTC."""
    if not isinstance(posted_at, str):
        return None
    match = re.match(r"^(\d{4})-(\d{2})-(\d{2})", posted_at)
    if not match:
        return None
    return {"date-parts": [[int(part) for part in match.groups()]]}


class ForumMagnumResolver:
    name = "forum-magnum"
    #: Claims only the three known hosts, and only URLs carrying a post id.
    selective = True

    def claims(self, canonical_url: str) -> bool:
        return site_for(canonical_url) is not None and post_id(canonical_url) is not None

    def resolve(
        self, canonical_url: str, ctx: ResolverContext
    ) -> ResolveResult | Unreachable | None:
        site = site_for(canonical_url)
        identifier = post_id(canonical_url)
        if not site or not identifier:
            return None
        endpoint, container = site

        # A comment permalink is answered by the comment, not its container.
        comment = comment_id(canonical_url)
        query, variable, node = (
            (_COMMENT_QUERY, comment, "comment") if comment else (_QUERY, identifier, "post")
        )

        body = get_json(
            ctx,
            endpoint,
            timeout=TIMEOUT_S,
            headers={"Content-Type": "application/json", "Accept": "application/json"},
            json_body={"query": query, "variables": {"id": variable}},
        )
        if isinstance(body, Unreachable):
            return body
        if not isinstance(body, dict):
            return None

        # GraphQL reports "no such post" as a 200 with `data.post.result: null`,
        # which is an answer - the id in the URL is wrong or the post was
        # deleted - and not something a retry would change.
        result = ((body.get("data") or {}).get(node) or {}).get("result")
        if not isinstance(result, dict):
            return None
        title = _title_for(result, is_comment=bool(comment))
        if not title:
            return None

        fields: dict[str, Any] = {
            "type": "post-weblog",
            "title": title,
            "container-title": container,
            # The entry's identity is its canonical URL (task:0021 D1), so the
            # site's own `pageUrl` is not written over it even when it differs
            # by a slug.
            "URL": canonical_url,
        }
        authors = _authors(result)
        if authors:
            fields["author"] = authors
        issued = _issued(result.get("postedAt"))
        if issued:
            fields["issued"] = issued

        return ResolveResult(fields=fields, source="forum-magnum")


forum_magnum_resolver = ForumMagnumResolver()
