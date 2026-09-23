"""Shared HTTP helpers for resolvers.

Small on purpose. Everything here exists because a run covers ~950 URLs on
other people's infrastructure, so every request is bounded in time and in the
number of bytes it is allowed to pull into this process.

``task:0032`` gave these helpers one more job: deciding whether a failed request
was an *answer* or an *absence of one*. Resolvers should not each reimplement
"is a 403 a verdict?", and the classification is the same everywhere.
"""

from __future__ import annotations

import time

import httpx

from .base import DEFAULT_HEADERS, UNREACHABLE, ResolverContext, Unreachable

#: Read at most this much of an HTML body. 256 KiB comfortably covers the
#: ``<head>`` of anything sane; a multi-megabyte page must never reach memory.
MAX_HTML_BYTES = 262_144

#: Publisher pages carry more markup before their meta block than a blog does.
MAX_SCHOLAR_BYTES = 512 * 1024

#: Statuses where the server told us the document is not there. A verdict, and
#: one no retry will change.
GONE_STATUSES = frozenset({404, 410})

#: Statuses where we were refused. The document may be perfectly healthy; a
#: paywall or a bot check simply did not let us look, which is not a fact about
#: the document and must not be recorded as one.
REFUSED_STATUSES = frozenset({401, 402, 403, 451})

#: One retry, and only for the statuses that mean "ask again later". Retrying a
#: 403 just annoys a WAF that has already made its decision.
RETRY_STATUSES = frozenset({408, 425, 429, 500, 502, 503, 504})


def classify_status(status: int) -> Unreachable | None:
    """Whether an HTTP status means "nothing was learned", and why.

    ``None`` means the status is a usable answer — including a 200 whose body
    turns out to be useless, which is the caller's problem rather than this
    function's.
    """
    if status in GONE_STATUSES:
        return Unreachable("gone")
    if status in REFUSED_STATUSES:
        return Unreachable("refused")
    if status >= 400:
        return Unreachable("unavailable")
    return None


def get_text_capped(
    ctx: ResolverContext,
    url: str,
    *,
    cap: int,
    timeout: float,
    headers: dict[str, str] | None = None,
    html_only: bool = False,
) -> str | Unreachable | None:
    """GET ``url`` and return at most ``cap`` characters of its body.

    Three outcomes, per the resolver contract: the body, :class:`Unreachable`
    when the request failed or was refused, and ``None`` when the request
    succeeded but there was nothing here to read — a non-HTML content type under
    ``html_only``, or an empty body.

    The body is streamed and abandoned at the cap rather than fetched whole and
    sliced — a sliced 50 MB response would still have been 50 MB in memory.
    """
    request_headers = {"User-Agent": ctx.user_agent, **DEFAULT_HEADERS, **(headers or {})}

    for attempt in (1, 2):
        ctx.throttle()
        try:
            with ctx.client.stream(
                "GET", url, headers=request_headers, timeout=timeout, follow_redirects=True
            ) as response:
                if response.status_code in RETRY_STATUSES and attempt == 1:
                    time.sleep(ctx.retry_backoff_s)
                    continue
                verdict = classify_status(response.status_code)
                if verdict:
                    return verdict
                if html_only:
                    content_type = response.headers.get("content-type", "")
                    # A PDF or JSON blob has no meta tags; reading it would be
                    # waste, and it is an answer: this is not an HTML document.
                    if (
                        "text/html" not in content_type
                        and "application/xhtml+xml" not in content_type
                    ):
                        return None
                chunks: list[str] = []
                size = 0
                for chunk in response.iter_text():
                    chunks.append(chunk)
                    size += len(chunk)
                    if size >= cap:
                        break
                return "".join(chunks)[:cap] or None
        except (httpx.HTTPError, ValueError, UnicodeDecodeError):
            # Unreachable, timed out, malformed URL, or an undecodable body.
            # Rule 2 of the resolver contract: decline, never raise.
            if attempt == 1:
                time.sleep(ctx.retry_backoff_s)
                continue
            return UNREACHABLE
    return UNREACHABLE


def get_json(
    ctx: ResolverContext,
    url: str,
    *,
    timeout: float,
    headers: dict[str, str] | None = None,
    json_body: object | None = None,
) -> object | Unreachable | None:
    """GET (or POST, given ``json_body``) ``url`` and return its parsed JSON body.

    Same three outcomes as :func:`get_text_capped`. ``None`` is reserved for a
    successful response whose body was not JSON — a login page served with a 200,
    typically, which is an answer of sorts.
    """
    request_headers = {"User-Agent": ctx.user_agent, **DEFAULT_HEADERS, **(headers or {})}
    method = "GET" if json_body is None else "POST"

    for attempt in (1, 2):
        ctx.throttle()
        try:
            response = ctx.client.request(
                method,
                url,
                headers=request_headers,
                timeout=timeout,
                follow_redirects=True,
                json=json_body,
            )
            if response.status_code in RETRY_STATUSES and attempt == 1:
                time.sleep(ctx.retry_backoff_s)
                continue
            verdict = classify_status(response.status_code)
            if verdict:
                return verdict
            return response.json()
        except ValueError:
            # Not JSON. The server answered; it just answered with something else.
            return None
        except httpx.HTTPError:
            if attempt == 1:
                time.sleep(ctx.retry_backoff_s)
                continue
            return UNREACHABLE
    return UNREACHABLE
