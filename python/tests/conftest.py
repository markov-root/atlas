"""Shared fixtures. Helpers live in :mod:`tests.helpers`."""

from __future__ import annotations

from pathlib import Path

import httpx
import pytest

from atlas_citations.resolvers.base import ResolverContext

from .helpers import make_ctx

REPO_ROOT = Path(__file__).resolve().parents[2]


@pytest.fixture
def unreachable_ctx() -> ResolverContext:
    """A context whose every request fails, for the never-raise contract tests."""

    def handler(request: httpx.Request) -> httpx.Response:
        raise httpx.ConnectError("ECONNREFUSED", request=request)

    return make_ctx(handler)


@pytest.fixture(scope="session")
def repo_root() -> Path:
    return REPO_ROOT
