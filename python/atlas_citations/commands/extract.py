"""``atlas citations extract`` - fold the scanned citations into the CSL store.

Bank B5 of ``task:0021``, ported from ``extract-cmd.ts`` under ``task:0029``.
Offline and instant, deliberately separate from ``resolve``, which is networked
and slow - behind one verb the safe command would inherit the unsafe one's
caveats.

AC-1 idempotence is structural rather than an added check: ``serialize_store``
sorts keys and is clock-free, ``merge_entry`` union-sorts the anchor list, and
``upsert_entries`` re-derives the same store when fed the same scan it produced.
A second run with unchanged input writes identical bytes.
"""

from __future__ import annotations

from pathlib import Path

from ..aliases import ALIASES_PATH, fold_aliases, read_aliases
from ..overrides import OVERRIDES_PATH, apply_overrides, read_overrides
from ..scan import Scan, ScanError, read_scan
from ..store import (
    Store,
    StoreEntry,
    entry_from_anchor,
    fill_container_titles,
    parse_store,
    serialize_store,
    upsert_entries,
)

#: Where the store lives, relative to the repo root.
STORE_PATH = Path("data") / "citations" / "sources.yaml"


def extract_entries(scan: Scan) -> list[tuple[str, StoreEntry]]:
    """Entries to upsert. Pure.

    Only ``citation``-kind instances become entries: content links are prose, and
    unlinked citations have no URL to key on (they surface in the report
    instead). The same URL cited twice with different anchor spellings collapses
    to one entry whose anchor list records both spellings - that is
    ``merge_entry``'s job, applied by ``upsert_entries``.
    """
    out: list[tuple[str, StoreEntry]] = []
    for citation in scan.all_citations():
        if citation.kind != "citation" or not citation.key:
            continue
        out.append(
            (
                citation.key,
                entry_from_anchor(citation.key, citation.anchor_text, citation.author_year),
            )
        )
    return out


def read_store(root: Path) -> Store:
    """Read the store file if it exists; an empty store otherwise."""
    path = root / STORE_PATH
    if not path.exists():
        return {}
    return parse_store(path.read_text(encoding="utf-8"))


def write_store(root: Path, store: Store) -> None:
    path = root / STORE_PATH
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(serialize_store(store), encoding="utf-8")


def next_store(existing: Store, entries: list[tuple[str, StoreEntry]]) -> Store:
    """Build the next store from a previous one plus fresh extractions.

    Split out from file I/O so the idempotence test exercises exactly the
    transformation a second run performs, with no filesystem involved.
    """
    return upsert_entries(existing, entries)


def citations_extract(root: Path) -> int:
    """Run the command. Returns the process exit code.

    Merge-before-write, never overwrite: the file may hold resolved metadata from
    ``atlas citations resolve``, and clobbering it would throw away exactly the
    work the networked command exists to do.
    """
    try:
        scan = read_scan(root)
    except ScanError as exc:
        print(f"atlas: {exc}")
        return 1

    merged = next_store(read_store(root), extract_entries(scan))

    # Offline, and never overwriting: an entry whose URL names its container
    # ("arXiv", "LessWrong") gets one without a request. See task:0032 AC-7 for
    # why this is not a --redo.
    merged, filled = fill_container_titles(merged)

    # Reviewed metadata is applied last and unconditionally, because it is the
    # one input here a human wrote (task:0032 D4). Applying it on every extract
    # is what makes the store disposable: delete it, re-extract, re-resolve, and
    # the human judgement comes back.
    merged, unmatched = apply_overrides(merged, read_overrides(root))

    # Last, because `apply_override` rebuilds an entry from its reviewed fields
    # and would drop a `sameAs` written before it. Folding after also means an
    # override may still be written against an alias URL for one run - it is
    # then reported as unmatched, which is the signal to move it.
    aliases = read_aliases(root)
    merged, removed, stale = fold_aliases(merged, aliases)

    write_store(root, merged)

    resolved = sum(1 for e in merged.values() if e.get("resolvedBy") != "anchor")
    print(f"{len(merged)} sources in {STORE_PATH} ({resolved} already resolved and preserved)")
    if filled:
        print(f"{filled} entries given a container title derived from their URL")
    if unmatched:
        # Named rather than counted: an override pointing at nothing is a typo or
        # a citation edited out of the prose, and either way someone must look.
        print(f"{len(unmatched)} override(s) match no citation - check {OVERRIDES_PATH}:")
        for key in unmatched:
            print(f"  {key}")

    # task:0031 D1: a deletion inside a 1.2 MB generated YAML is invisible in
    # review, so every one is named here.
    if removed:
        print(f"{len(removed)} duplicate entr(ies) folded per {ALIASES_PATH}:")
        for alias, survivor in removed:
            print(f"  {alias}\n    -> {survivor}")
    # Only groups that match *nothing*. An alias with no entry is the normal
    # steady state - that is what folding it did - so reporting those would make
    # every run after the first one print the whole file back.
    if stale:
        print(f"{len(stale)} alias group(s) match no citation - check {ALIASES_PATH}:")
        for key in stale:
            print(f"  {key}")
    for alias, survivor in aliases.chains():
        # A survivor that is itself aliased away means the file disagrees with
        # itself, and resolution is single-step on purpose (see `Aliases.resolve`).
        print(f"alias chain in {ALIASES_PATH}: {alias} -> {survivor}, which is also an alias")
    return 0
