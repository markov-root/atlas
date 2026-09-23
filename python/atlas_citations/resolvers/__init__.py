"""Citation metadata resolvers.

See :mod:`atlas_citations.resolvers.base` for the contract they share.
"""

from __future__ import annotations

from .arxiv import arxiv_resolver
from .base import (
    RESOLVER_ORDER,
    UNREACHABLE,
    Resolver,
    ResolverContext,
    ResolveResult,
    Throttle,
    Unreachable,
    make_context,
    resolve_with,
)
from .crossref import crossref_resolver
from .forum_magnum import forum_magnum_resolver
from .oembed import oembed_resolver
from .opengraph import opengraph_resolver
from .research_db import research_db_resolver
from .scholar_meta import scholar_meta_resolver
from .wayback import wayback_resolver

#: Every resolver, in no particular order - :func:`resolve_with` sorts them by
#: :data:`RESOLVER_ORDER`.
ALL_RESOLVERS: list[Resolver] = [
    research_db_resolver,
    arxiv_resolver,
    crossref_resolver,
    forum_magnum_resolver,
    scholar_meta_resolver,
    oembed_resolver,
    opengraph_resolver,
    wayback_resolver,
]

__all__ = [
    "ALL_RESOLVERS",
    "RESOLVER_ORDER",
    "UNREACHABLE",
    "ResolveResult",
    "Resolver",
    "ResolverContext",
    "Throttle",
    "Unreachable",
    "arxiv_resolver",
    "crossref_resolver",
    "forum_magnum_resolver",
    "make_context",
    "oembed_resolver",
    "opengraph_resolver",
    "research_db_resolver",
    "resolve_with",
    "scholar_meta_resolver",
    "wayback_resolver",
]
