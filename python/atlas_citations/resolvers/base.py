"""The resolver contract - bank B8 of ``task:0021``, per ``task:0027``.

A resolver turns a canonical URL into CSL fields, or declines. Eight exist: the
local research-database corpus, arXiv, Crossref, ForumMagnum (LessWrong, the EA
Forum and the Alignment Forum), publisher citation metadata, oEmbed, Open Graph,
and the Internet Archive for pages that no longer exist. They are independent of
one another; this module is the only thing they share, which is what lets them be
written and changed in parallel.

Four rules the interface enforces by shape rather than by convention:

1. **Declining is normal, not an error.** ``claims()`` is how a resolver says a
   URL is not its business. Returning ``None`` from ``resolve()`` says it tried
   and found nothing. Neither is a failure, and neither should log alarm.

2. **A resolver never raises for an unreachable service.** ``task:0021`` D4 is
   warn-never-block, and ``task:0027`` AC-6 requires the bibliography to come out
   identical when the research-database service is down. A resolver that raised
   on a network error would turn an accelerator into a dependency. Catch, return
   :data:`UNREACHABLE`, and let the runner decide.

3. **"I found nothing" and "I could not ask" are different answers.** This is
   ``audit:0011`` F12, and it is the reason :class:`Unreachable` exists - see its
   docstring for what conflating them cost.

4. **Partial metadata is worth returning.** An entry with a title and no author
   beats no entry. Return what was found.

Ported from ``resolvers/types.ts`` under ``task:0029``; the third rule was added
by ``task:0032``.
"""

from __future__ import annotations

import time
from collections.abc import Callable, Iterable, Sequence
from dataclasses import dataclass, field
from typing import Any, Protocol, runtime_checkable

import httpx


@dataclass(frozen=True)
class Unreachable:
    """Not an answer: the service could not be asked, so nothing was learned.

    ``audit:0011`` F12. Before this existed, a resolver returned ``None`` both for
    "this document is not mine to describe" and for "the request failed", and the
    difference is the whole story: **a decline is a verdict, a failure is a
    missing verdict.** Recording the second as the first is what made one bad
    moment permanent - arXiv briefly failed for a paper it holds 1,158 authors
    for, Open Graph answered instead with zero, and because resolution is sticky
    the entry kept that answer forever.

    Measured over the corpus on 2026-09-23: **8 of the 132 entries marked
    unresolvable resolve perfectly on a retry**, and 15 more failed with a
    transport error rather than a verdict.

    ``reason`` is recorded on the entry so the report can separate a dead citation
    from a blocked one:

    - ``gone`` - HTTP 404 or 410. The cited page does not exist. A content defect
      for the authors, not a resolver gap.
    - ``refused`` - HTTP 401/402/403. A paywall or bot check. The document may be
      perfectly alive; we were not allowed to look.
    - ``unavailable`` - transport failure, timeout, 429 or 5xx, after one retry.
    """

    reason: str = "unavailable"


#: The ordinary transient case, when no more specific reason is known.
UNREACHABLE = Unreachable()


@dataclass(frozen=True)
class ResolveResult:
    """What a resolver found."""

    #: CSL fields discovered. Partial by design - merged over the existing item.
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
    #: Identifies this project to the services it queries. ``task:0027`` AC-5 -
    #: an anonymous scraper hammering Crossref is how a project gets blocked,
    #: and these are other people's free infrastructure.
    user_agent: str
    #: Called before each outbound request so the runner can rate-limit.
    throttle: Callable[[], None] = lambda: None
    #: Seconds to wait before the single retry a transient failure gets.
    #: Injected for the same reason the client is: a suite that slept two real
    #: seconds per failure case would stop being run.
    retry_backoff_s: float = 2.0


@runtime_checkable
class Resolver(Protocol):
    """A source of citation metadata for some subset of URLs."""

    #: Stable identifier, e.g. ``arxiv``. Written into the store as ``resolvedBy``.
    name: str

    #: Whether this resolver claims a *recognisable subset* of URLs.
    #:
    #: ``arxiv``, ``crossref``, ``forum-magnum``, ``oembed`` and ``scholar-meta``
    #: are selective:
    #: they answer only for hosts or URL shapes they know, so "this resolver
    #: claims the URL" is real evidence that it has something specific to say.
    #: ``research-db`` and ``opengraph`` claim *every* HTTP URL - one because a
    #: local lookup is free, the other because it is the last-resort fallback -
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

    def resolve(
        self, canonical_url: str, ctx: ResolverContext
    ) -> ResolveResult | Unreachable | None:
        """Attempt resolution.

        Returns ``None`` when the service answered and had nothing,
        :data:`UNREACHABLE` when it could not be asked, and a
        :class:`ResolveResult` otherwise. **Must not raise.**
        """
        ...


#: The order resolvers are tried. Local and free first, networked after.
RESOLVER_ORDER = (
    "research-db",
    "arxiv",
    "crossref",
    "forum-magnum",
    "scholar-meta",
    "oembed",
    "opengraph",
    # Last, and only ever reached for a page the live web could not answer.
    "wayback",
)


def resolve_with(
    resolvers: Sequence[Resolver],
    canonical_url: str,
    ctx: ResolverContext,
) -> ResolveResult | Unreachable | None:
    """First usable answer, trying only resolvers that claim the URL.

    Order matters and is fixed by :data:`RESOLVER_ORDER`: the local corpus
    answers part of this project's URLs with no network call at all, so asking it
    first is free. A resolver that raises despite rule 2 is caught here and
    treated as a decline - one misbehaving resolver must not abort a run over
    948 URLs.

    **A selective resolver that could not be reached stops the fallback chain.**
    That is the whole of ``audit:0011`` F12's fix and it needs stating plainly:
    when ``arxiv`` claims a URL, arXiv is the authority on that paper, so arXiv
    timing out is not permission for Open Graph to answer in its place. Returning
    :data:`UNREACHABLE` leaves the entry unresolved and therefore *retried*, which
    is the outcome a transient failure deserves.

    Only ``selective`` resolvers get this veto, and the distinction is the same
    one ``--redo`` relies on: ``research-db`` and ``opengraph`` claim every HTTP
    URL, so their claim is not evidence of authority. A research-database outage
    must leave the bibliography identical (``task:0027`` AC-6) - it would not if a
    universal claimant could block the chain.
    """
    blocked: Unreachable | None = None
    for resolver in _ordered(resolvers):
        if not resolver.claims(canonical_url):
            continue
        try:
            result = resolver.resolve(canonical_url, ctx)
        except Exception:
            # Rule 2 says resolvers do not raise; this is the backstop for when
            # one does anyway. Swallowed deliberately - a single bad resolver
            # must not take down a run over 948 URLs.
            continue
        if isinstance(result, Unreachable):
            if resolver.selective:
                return result
            # A universal claimant's outage is not evidence about this URL, but
            # it is worth reporting if nothing better turns up.
            blocked = blocked or result
            continue
        if result:
            return result
    return blocked


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


#: Sent on every outbound request alongside the User-Agent.
#:
#: ``task:0032`` D1: adding these turned **7 of 32 blocked hosts into 200s** -
#: rand.org, metaculus, OpenReview, Oxford Reference, the FT and the IMF library
#: among them. A full Chrome User-Agent string, measured against the same 32,
#: bought two more and was rejected: these headers are *true* (they state what
#: this client can parse), while that string is not.
DEFAULT_HEADERS = {
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
}


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
            headers={"User-Agent": user_agent, **DEFAULT_HEADERS},
        ),
        user_agent=user_agent,
        throttle=Throttle(interval_s),
    )
