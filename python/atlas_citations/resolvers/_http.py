"""Shared HTTP helpers for resolvers.

Small on purpose. Everything here exists because a run covers ~950 URLs on
other people's infrastructure, so every request is bounded in time and in the
number of bytes it is allowed to pull into this process.
"""

from __future__ import annotations

import httpx

from .base import ResolverContext

#: Read at most this much of an HTML body. 256 KiB comfortably covers the
#: ``<head>`` of anything sane; a multi-megabyte page must never reach memory.
MAX_HTML_BYTES = 262_144

#: Publisher pages carry more markup before their meta block than a blog does.
MAX_SCHOLAR_BYTES = 512 * 1024


def get_text_capped(
    ctx: ResolverContext,
    url: str,
    *,
    cap: int,
    timeout: float,
    headers: dict[str, str] | None = None,
    html_only: bool = False,
) -> str | None:
    """GET ``url`` and return at most ``cap`` characters of its body.

    Returns ``None`` for any outcome that is not a usable HTML body: an error
    status, a non-HTML content type when ``html_only``, or a transport failure.

    The body is streamed and abandoned at the cap rather than fetched whole and
    sliced — a sliced 50 MB response would still have been 50 MB in memory.
    """
    ctx.throttle()
    request_headers = {"User-Agent": ctx.user_agent, **(headers or {})}
    try:
        with ctx.client.stream(
            "GET", url, headers=request_headers, timeout=timeout, follow_redirects=True
        ) as response:
            if response.status_code >= 400:
                return None
            if html_only:
                content_type = response.headers.get("content-type", "")
                # A PDF or JSON blob has no meta tags; reading it would be waste.
                if "text/html" not in content_type and "application/xhtml+xml" not in content_type:
                    return None
            chunks: list[str] = []
            size = 0
            for chunk in response.iter_text():
                chunks.append(chunk)
                size += len(chunk)
                if size >= cap:
                    break
            return "".join(chunks)[:cap]
    except (httpx.HTTPError, ValueError, UnicodeDecodeError):
        # Unreachable, timed out, malformed URL, or an undecodable body. Rule 2
        # of the resolver contract: decline, never raise.
        return None


def get_json(
    ctx: ResolverContext,
    url: str,
    *,
    timeout: float,
    headers: dict[str, str] | None = None,
) -> object | None:
    """GET ``url`` and return its parsed JSON body, or ``None`` on any failure."""
    ctx.throttle()
    request_headers = {"User-Agent": ctx.user_agent, **(headers or {})}
    try:
        response = ctx.client.get(
            url, headers=request_headers, timeout=timeout, follow_redirects=True
        )
        if response.status_code >= 400:
            return None
        return response.json()
    except (httpx.HTTPError, ValueError):
        return None
