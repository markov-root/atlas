"""oEmbed resolver — YouTube videos.

YouTube's oEmbed endpoint needs no API key, which is why it is the whole
integration; a Data API key would buy upload date and view counts, but the date
would tempt inventing a publication year the metadata source does not actually
speak for. See the note in :meth:`OembedResolver.resolve`.

Ported from ``oembed.ts`` under ``task:0029``.
"""

from __future__ import annotations

from typing import Any
from urllib.parse import quote

from ..store import literal_name
from ._http import get_json
from .base import ResolverContext, ResolveResult

ENDPOINT = "https://www.youtube.com/oembed"
TIMEOUT_S = 30.0


class OembedResolver:
    name = "oembed"
    #: Claims only canonical YouTube watch URLs.
    selective = True

    def claims(self, canonical_url: str) -> bool:
        # Canonicalization (task:0025) has already folded youtu.be and mobile
        # forms into this exact shape; the resolver only needs to recognise it.
        return canonical_url.startswith("https://www.youtube.com/watch?v=")

    def resolve(self, canonical_url: str, ctx: ResolverContext) -> ResolveResult | None:
        # 401/404 here is YouTube's answer for deleted or private videos — a
        # normal outcome, not an error. get_json returns None for both.
        body = get_json(
            ctx,
            f"{ENDPOINT}?url={quote(canonical_url, safe='')}&format=json",
            timeout=TIMEOUT_S,
        )
        if not isinstance(body, dict):
            return None

        title = body.get("title")
        if not isinstance(title, str) or not title:
            return None

        fields: dict[str, Any] = {
            # CSL has no "video" type; motion_picture is what the citation
            # styles expect for one.
            "type": "motion_picture",
            "title": title,
        }
        author = body.get("author_name")
        if isinstance(author, str) and author:
            fields["author"] = [literal_name(author)]
        fields["container-title"] = "YouTube"
        fields["URL"] = canonical_url

        return ResolveResult(
            fields=fields,
            source="oembed",
            # Honest in the store, not just in a comment: hand-curation will see
            # that this entry has no year and must not guess one from the channel.
            note="Metadata from YouTube oEmbed, which does not provide a publication date.",
        )


oembed_resolver = OembedResolver()
