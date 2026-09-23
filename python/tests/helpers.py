"""Test helpers.

The one rule these exist to enforce: **no test makes a live network request**
(``task:0027`` AC-1). Every resolver takes its HTTP client from the context, so a
test supplies an ``httpx.MockTransport`` and the resolver cannot reach the
network even by mistake.
"""

from __future__ import annotations

from collections.abc import Callable

import httpx

from atlas_citations.resolvers.base import ResolverContext


def make_ctx(handler: Callable[[httpx.Request], httpx.Response]) -> ResolverContext:
    """A resolver context wired to a mock transport, a no-op throttle, no backoff.

    ``retry_backoff_s=0`` keeps the suite fast while still exercising the retry:
    a failure case still makes both attempts, it just does not sleep two real
    seconds between them.
    """
    return ResolverContext(
        client=httpx.Client(transport=httpx.MockTransport(handler), follow_redirects=True),
        user_agent="test (mailto:test@example.org)",
        throttle=lambda: None,
        retry_backoff_s=0.0,
    )


def html_response(body: str, status: int = 200) -> httpx.Response:
    return httpx.Response(status, text=body, headers={"content-type": "text/html; charset=utf-8"})


def json_response(payload: object, status: int = 200) -> httpx.Response:
    return httpx.Response(status, json=payload)
