"""The resolver contract: ordering, declining, and failure isolation."""

from __future__ import annotations

import time

import httpx
import pytest

from atlas_citations.resolvers.base import (
    RESOLVER_ORDER,
    ResolverContext,
    ResolveResult,
    Throttle,
    resolve_with,
)

from .helpers import make_ctx


class Stub:
    def __init__(self, name: str, claims: bool, result: ResolveResult | None) -> None:
        self.name = name
        self._claims = claims
        self._result = result
        self.called = False

    def claims(self, url: str) -> bool:
        return self._claims

    def resolve(self, url: str, ctx: ResolverContext) -> ResolveResult | None:
        self.called = True
        return self._result


class Exploding:
    name = "research-db"

    def claims(self, url: str) -> bool:
        return True

    def resolve(self, url: str, ctx: ResolverContext) -> ResolveResult | None:
        raise RuntimeError("boom")


@pytest.fixture
def ctx() -> ResolverContext:
    def handler(request: httpx.Request) -> httpx.Response:
        raise AssertionError("no network in tests")

    return make_ctx(handler)


def result(source: str, title: str = "t") -> ResolveResult:
    return ResolveResult(fields={"title": title}, source=source)


class TestOrdering:
    def test_prefers_the_local_corpus_over_networked_resolvers(self, ctx) -> None:
        out = resolve_with(
            [
                Stub("arxiv", True, result("arxiv", "from arxiv")),
                Stub("research-db", True, result("research-db", "from corpus")),
            ],
            "https://arxiv.org/abs/1",
            ctx,
        )
        assert out is not None
        assert out.source == "research-db"

    def test_falls_through_when_a_resolver_declines(self, ctx) -> None:
        out = resolve_with(
            [Stub("research-db", True, None), Stub("arxiv", True, result("arxiv"))],
            "https://arxiv.org/abs/1",
            ctx,
        )
        assert out is not None
        assert out.source == "arxiv"

    def test_skips_resolvers_that_do_not_claim_without_calling_them(self, ctx) -> None:
        nosy = Stub("crossref", False, result("crossref"))
        resolve_with([nosy], "https://arxiv.org/abs/1", ctx)
        assert nosy.called is False

    def test_returns_none_when_nothing_resolves(self, ctx) -> None:
        assert resolve_with([Stub("arxiv", True, None)], "https://arxiv.org/abs/1", ctx) is None

    def test_unknown_resolvers_run_after_the_known_order(self, ctx) -> None:
        out = resolve_with(
            [Stub("novel", True, result("novel")), Stub("opengraph", True, result("opengraph"))],
            "https://example.org/x",
            ctx,
        )
        assert out is not None
        assert out.source == "opengraph"

    def test_scholar_meta_is_tried_before_opengraph(self) -> None:
        """The whole point of adding it: publisher pages must not fall to Open Graph."""
        assert RESOLVER_ORDER.index("scholar-meta") < RESOLVER_ORDER.index("opengraph")


class TestFailureIsolation:
    def test_a_raising_resolver_is_treated_as_a_decline(self, ctx) -> None:
        """One misbehaving resolver must not abort a run over ~950 URLs."""
        out = resolve_with(
            [Exploding(), Stub("arxiv", True, result("arxiv", "ok"))],
            "https://arxiv.org/abs/1",
            ctx,
        )
        assert out is not None
        assert out.source == "arxiv"

    def test_a_raising_resolver_alone_yields_none_not_an_exception(self, ctx) -> None:
        assert resolve_with([Exploding()], "https://arxiv.org/abs/1", ctx) is None


class TestThrottle:
    def test_paces_successive_requests(self) -> None:
        throttle = Throttle(0.04)
        start = time.monotonic()
        throttle()
        throttle()
        assert time.monotonic() - start >= 0.035

    def test_a_zero_interval_does_not_sleep(self) -> None:
        throttle = Throttle(0)
        start = time.monotonic()
        for _ in range(5):
            throttle()
        assert time.monotonic() - start < 0.05
