"""The resolver contract — bank B8 of ``task:0021``, per ``task:0027``.

A resolver turns a canonical URL into CSL fields, or declines. Six exist: the
local research-database corpus, arXiv, Crossref, publisher citation metadata,
oEmbed and Open Graph. They are independent of one another; this module is the
only thing they share, which is what lets them be written and changed in
parallel.

Three rules the interface enforces by shape rather than by convention:

1. **Declining is normal, not an error.** ``claims()`` is how a resolver says a
   URL is not its business. Returning ``None`` from ``resolve()`` says it tried
   and found nothing. Neither is a failure, and neither should log alarm.

2. **A resolver never raises for an unreachable service.** ``task:0021`` D4 is
   warn-never-block, and ``task:0027`` AC-6 requires the bibliography to come out
   identical when the research-database service is down. A resolver that raised
   on a network error would turn an accelerator into a dependency. Catch, return
   ``None``, and record the reason in ``ResolveResult.note``.

3. **Partial metadata is worth returning.** An entry with a title and no author
   beats no entry. Return what was found.

Ported from ``resolvers/types.ts`` under ``task:0029``.
"""

from __future__ import annotations

import time
from collections.abc import Callable, Iterable, Sequence
from dataclasses import dataclass, field
from typing import Any, Protocol, runtime_checkable

import httpx


@dataclass(frozen=True)
class ResolveResult:
    """What a resolver found."""

    #: CSL fields discovered. Partial by design — merged over the existing item.
    fields: dict[str, Any]
    #: Resolver name, stored as the entry's ``resolvedBy``.
    source: str
    #: Optional human-readable note, e.g. why only partial data was found.
    note: str | None = None


@dataclass
class ResolverContext:
    """Everything a resolver needs from the outside world.

    The HTTP client is injected rather than constructed inside each resolver so
    the test suite runs against ``httpx.MockTransport`` and makes no live
    request (``task:0027`` AC-1). That property is worth more than it looks: it
    is what lets the suite run in CI, offline, and in under a second.
    """

    client: httpx.Client
    #: Identifies this project to the services it queries. ``task:0027`` AC-5 —
    #: an anonymous scraper hammering Crossref is how a project gets blocked,
    #: and these are other people's free infrastructure.
    user_agent: str
    #: Called before each outbound request so the runner can rate-limit.
    throttle: Callable[[], None] = lambda: None


@runtime_checkable
class Resolver(Protocol):
    """A source of citation metadata for some subset of URLs."""

    #: Stable identifier, e.g. ``arxiv``. Written into the store as ``resolvedBy``.
    name: str

    #: Whether this resolver claims a *recognisable subset* of URLs.
    #:
    #: ``arxiv``, ``crossref``, ``oembed`` and ``scholar-meta`` are selective:
    #: they answer only for hosts or URL shapes they know, so "this resolver
    #: claims the URL" is real evidence that it has something specific to say.
    #: ``research-db`` and ``opengraph`` claim *every* HTTP URL — one because a
    #: local lookup is free, the other because it is the last-resort fallback —
    #: so their claim carries no such information.
    #:
    #: Only ``--redo`` uses this, and it needs it: see ``unresolved_keys``.
    selective: bool

    def claims(self, canonical_url: str) -> bool:
        """Whether this resolver handles the URL at all.

        Pure and offline: it must decide from the URL alone, so the runner can
        skip resolvers without paying a request to find out.
        """
        ...

    def resolve(self, canonical_url: str, ctx: ResolverContext) -> ResolveResult | None:
        """Attempt resolution.

        Returns ``None`` when nothing was found, the service was unreachable, or
        the response was unusable. **Must not raise.**
        """
        ...


#: The order resolvers are tried. Local and free first, networked after.
RESOLVER_ORDER = (
    "research-db",
    "arxiv",
    "crossref",
    "scholar-meta",
    "oembed",
    "opengraph",
)


def resolve_with(
    resolvers: Sequence[Resolver],
    canonical_url: str,
    ctx: ResolverContext,
) -> ResolveResult | None:
    """First non-``None`` result, trying only resolvers that claim the URL.

    Order matters and is fixed by :data:`RESOLVER_ORDER`: the local corpus
    answers part of this project's URLs with no network call at all, so asking it
    first is free. A resolver that raises despite rule 2 is caught here and
    treated as a decline — one misbehaving resolver must not abort a run over
    948 URLs.
    """
    for resolver in _ordered(resolvers):
        if not resolver.claims(canonical_url):
            continue
        try:
            result = resolver.resolve(canonical_url, ctx)
        except Exception:
            # Rule 2 says resolvers do not raise; this is the backstop for when
            # one does anyway. Swallowed deliberately — a single bad resolver
            # must not take down a run over 948 URLs.
            continue
        if result:
            return result
    return None


def _ordered(resolvers: Iterable[Resolver]) -> list[Resolver]:
    """Known resolvers in :data:`RESOLVER_ORDER`, then any others as given."""
    by_name = {r.name: r for r in resolvers}
    ordered = [by_name[n] for n in RESOLVER_ORDER if n in by_name]
    ordered += [r for r in resolvers if r.name not in RESOLVER_ORDER]
    return ordered


@dataclass
class Throttle:
    """Paces outbound requests to a minimum interval.

    Sleeps only for the remainder of the interval, so time already spent waiting
    on a slow response counts towards it.
    """

    interval_s: float
    _last: float = field(default=0.0, repr=False)

    def __call__(self) -> None:
        if self.interval_s <= 0:
            return
        elapsed = time.monotonic() - self._last
        if self._last and elapsed < self.interval_s:
            time.sleep(self.interval_s - elapsed)
        self._last = time.monotonic()


def make_context(
    interval_s: float,
    user_agent: str,
    client: httpx.Client | None = None,
) -> ResolverContext:
    """A context with a real HTTP client and a throttle. Used by the CLI, not by tests."""
    return ResolverContext(
        client=client
        or httpx.Client(
            follow_redirects=True,
            timeout=httpx.Timeout(20.0),
            headers={"User-Agent": user_agent},
        ),
        user_agent=user_agent,
        throttle=Throttle(interval_s),
    )
