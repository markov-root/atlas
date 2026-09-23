"""``atlas citations resolve`` — bank B9 of ``task:0021``, per ``task:0027``.

Fills in metadata for entries the store holds only as anchor text. This is the
one citation command that touches the network, and it is never required:
``extract``, ``report``, ``export`` and ``urls`` all work from the committed
store with no credentials and no connection (``task:0021`` D4).

The design is shaped by one fact — roughly 600 of the ~950 sources have no API
that describes them, so this job is long-tailed rather than hard. It is built to
be **chipped at**: run it, interrupt it, run it again tomorrow. That is why it
resolves only unfilled entries and saves as it goes.

Ported from ``resolve.ts`` under ``task:0029``.
"""

from __future__ import annotations

import signal
from collections.abc import Callable
from dataclasses import dataclass
from pathlib import Path
from types import FrameType

from ..overrides import OVERRIDE_SOURCE
from ..resolvers import ALL_RESOLVERS, ResolveResult, Unreachable, make_context, resolve_with
from ..store import Store, StoreEntry, with_www
from .extract import STORE_PATH, read_store, write_store

#: Contactable user agent. ``task:0027`` AC-5 — Crossref's polite pool wants one.
USER_AGENT = (
    "AISafetyAtlas-citations/1.0 "
    "(+https://github.com/markov-root/atlas; mailto:contact@aisafety.info)"
)

#: arXiv asks for roughly this much space between requests.
DEFAULT_INTERVAL_S = 3.0

#: Save this often. A crash then costs at most this many entries, not the run.
SAVE_EVERY = 20


def unresolved_keys(
    store: Store,
    redo: list[str] | None = None,
    claimed_by: Callable[[str], bool] | None = None,
) -> list[str]:
    """Entries to attempt: anchor-only, plus any whose resolver is being redone.

    ``redo`` also filters by ``claimed_by``, so ``--redo=opengraph`` after adding
    a publisher resolver retries only the pages that resolver can actually help
    with, instead of re-fetching hundreds of blog posts Open Graph already
    handled correctly. The caller supplies the predicate; see
    :func:`citations_resolve` for the one that makes that promise true.
    """
    redo = redo or []
    out = []
    for key in sorted(store):
        by = store[key].get("resolvedBy")
        if by == "anchor":
            out.append(key)
            continue
        if by not in redo:
            continue
        if claimed_by is None or claimed_by(key):
            out.append(key)
    return out


def apply_resolution(
    entry: StoreEntry,
    fields: dict,
    source: str,
    note: str | None = None,
) -> StoreEntry:
    """Fold a resolver's fields into an entry.

    Resolver fields win over anchor-derived ones — a real title beats "Chollet,
    2019" — but anything the resolver did not return is kept, so a partial result
    is an improvement rather than a replacement. The unresolved ``note`` is
    dropped: it exists to mark an entry as needing work, and it no longer does.
    """
    item = {**entry["item"], **fields, "id": entry["item"]["id"]}
    item.pop("note", None)
    if note:
        item["note"] = note
    resolved: StoreEntry = {
        "item": item,
        "resolvedBy": source,
        "anchors": entry.get("anchors", []),
    }
    # Whatever stopped the last attempt did not stop this one — unless the
    # answer came from an archive, which only ever runs *because* the live URL
    # failed. Then the reason is still true and still the authors' to act on:
    # having found a copy is a fact about our metadata, the address being dead
    # is a fact about the citation.
    if source == "wayback" and entry.get("unreachable"):
        resolved["unreachable"] = entry["unreachable"]
    return resolved


def apply_unreachable(entry: StoreEntry, reason: str) -> StoreEntry:
    """Record *why* an entry could not be resolved, without claiming it was.

    ``task:0032`` AC-1. ``resolvedBy`` is deliberately left alone, so the entry
    stays in the retry set — that is the entire difference between a transient
    failure and a permanent verdict, and it is what ``audit:0011`` F12 cost.

    No timestamp. The report is a durable artifact whose diff should show what
    changed about the *corpus*, and a stamped attempt time would rewrite ~130
    lines on every run.
    """
    updated = {**entry, "unreachable": reason}
    return updated


def _retry_on_www(
    result: ResolveResult | Unreachable | None,
    key: str,
    ctx,
) -> ResolveResult | Unreachable | None:
    """Try the ``www.`` host once when the canonical one answered nothing.

    Canonicalization strips ``www.``, which is correct for identity and wrong for
    *reachability* on the handful of hosts that serve only the prefixed form —
    seven in this corpus, four of them one Substack custom domain. See
    :func:`atlas_citations.store.with_www`.

    Run here rather than inside each resolver so one retry covers all eight, and
    only after the canonical URL has failed, so it costs nothing for the 900-odd
    entries where the bare host is fine.

    The recovered address is written to the entry's ``URL`` — which is what the
    bibliography renders as a link — while the key, and therefore the entry's
    identity, stays canonical (``task:0021`` D1).
    """
    if isinstance(result, ResolveResult):
        return result
    alternative = with_www(key)
    if not alternative:
        return result
    retried = resolve_with(ALL_RESOLVERS, alternative, ctx)
    if not isinstance(retried, ResolveResult):
        return result
    return ResolveResult(
        fields={**retried.fields, "URL": alternative},
        source=retried.source,
        note=retried.note,
    )


def effective_redo(redo: list[str] | None) -> list[str]:
    """The resolvers a ``--redo`` may actually target.

    An override is a human's decision, not a resolver's guess, so no amount of
    ``--redo`` may overwrite one (``task:0032`` D4). Filtered here rather than
    trusted to the caller: the whole value of that file is that it stays put.
    """
    return [name for name in (redo or []) if name != OVERRIDE_SOURCE]


@dataclass
class ResolveOptions:
    #: Stop after this many entries. The way a long tail gets chipped at.
    limit: int | None = None
    #: Seconds between outbound requests.
    interval_s: float = DEFAULT_INTERVAL_S
    #: Re-resolve entries previously answered by these resolvers.
    #:
    #: Resolution is sticky by design — a resolved entry is never re-fetched,
    #: which is what makes the long tail tractable. That works against you when a
    #: resolver *improves*: entries a weaker one already claimed would keep their
    #: thin metadata forever. This resets them so a better resolver gets a turn.
    redo: list[str] | None = None


def citations_resolve(root: Path, opts: ResolveOptions | None = None) -> int:
    opts = opts or ResolveOptions()
    if not (root / STORE_PATH).exists():
        print(f"atlas: no store at {STORE_PATH} — run `atlas citations extract` first")
        return 1
    store = read_store(root)

    # A redo only targets entries a more *specific* resolver would now claim —
    # the point is to give newly-added coverage a turn, not to re-fetch the
    # world.
    #
    # `selective` is what makes that true, and it is not a detail. `research-db`
    # and `opengraph` both claim every HTTP URL, so a plain "does any other
    # resolver claim this?" test answers yes for everything and `--redo` degrades
    # into "re-fetch all of it". That is exactly what the TypeScript version did:
    # it excluded `opengraph` by name but not `research-db`, so a redo of 380
    # Open Graph entries targeted all 380 rather than the 43 publisher pages it
    # was added for. See `audit:0011` F10.
    redo = effective_redo(opts.redo)

    def claimed_by_newer(url: str) -> bool:
        return any(r.selective and r.name not in redo and r.claims(url) for r in ALL_RESOLVERS)

    pending = unresolved_keys(store, redo, claimed_by_newer if redo else None)
    if not pending:
        print("Nothing to resolve: every entry already carries resolved metadata.")
        return 0

    targets = pending[: opts.limit] if opts.limit else pending
    ctx = make_context(opts.interval_s, USER_AGENT)

    redo_note = f" (including a redo of: {', '.join(redo)})" if redo else ""
    print(f"{len(pending)} to attempt of {len(store)}{redo_note}; attempting {len(targets)}.")

    # Interrupt handling is what makes AC-3 true rather than aspirational. A run
    # over ~950 URLs at a polite 3s interval takes close to an hour, so it WILL
    # be interrupted. Ctrl-C stops after the in-flight request and saves, rather
    # than discarding everything resolved so far.
    state = {"stopping": False}

    def on_signal(signum: int, frame: FrameType | None) -> None:
        if state["stopping"]:
            raise SystemExit(130)
        state["stopping"] = True
        print("\nStopping after the current request; progress will be saved.")

    previous = {
        signal.SIGINT: signal.signal(signal.SIGINT, on_signal),
        signal.SIGTERM: signal.signal(signal.SIGTERM, on_signal),
    }

    counts: dict[str, int] = {}
    blocked_counts: dict[str, int] = {}
    resolved = 0
    attempted = 0
    dirty = False

    def save() -> None:
        nonlocal dirty
        if dirty:
            write_store(root, store)
            dirty = False

    try:
        for key in targets:
            if state["stopping"]:
                break
            attempted += 1
            result = resolve_with(ALL_RESOLVERS, key, ctx)
            result = _retry_on_www(result, key, ctx)
            if isinstance(result, Unreachable):
                # Not resolved, and deliberately still not marked as such — but
                # the reason is worth keeping, because "the page is gone" is a
                # defect only the authors can fix and "we were refused" is one
                # only a human with a browser can.
                store[key] = apply_unreachable(store[key], result.reason)
                blocked_counts[result.reason] = blocked_counts.get(result.reason, 0) + 1
                dirty = True
            elif result:
                store[key] = apply_resolution(store[key], result.fields, result.source, result.note)
                counts[result.source] = counts.get(result.source, 0) + 1
                resolved += 1
                dirty = True
            if attempted % SAVE_EVERY == 0:
                save()
            if attempted % 50 == 0:
                print(f"  {attempted}/{len(targets)} attempted · {resolved} resolved")
    finally:
        save()
        for sig, handler in previous.items():
            signal.signal(sig, handler)
        ctx.client.close()

    by_resolver = " · ".join(
        f"{name} {n}" for name, n in sorted(counts.items(), key=lambda kv: -kv[1])
    )
    suffix = f" ({by_resolver})" if by_resolver else ""
    print(f"{resolved} of {attempted} attempted resolved{suffix}.")
    if blocked_counts:
        blocked = " · ".join(f"{reason} {n}" for reason, n in sorted(blocked_counts.items()))
        print(f"{sum(blocked_counts.values())} learned nothing ({blocked}) — see the report.")
    print(f"{len(unresolved_keys(store))} still unresolved. Re-run to continue.")
    return 0
