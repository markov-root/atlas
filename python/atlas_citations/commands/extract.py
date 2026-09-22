"""``atlas citations extract`` — fold the scanned citations into the CSL store.

Bank B5 of ``task:0021``, ported from ``extract-cmd.ts`` under ``task:0029``.
Offline and instant, deliberately separate from ``resolve``, which is networked
and slow — behind one verb the safe command would inherit the unsafe one's
caveats.

AC-1 idempotence is structural rather than an added check: ``serialize_store``
sorts keys and is clock-free, ``merge_entry`` union-sorts the anchor list, and
``upsert_entries`` re-derives the same store when fed the same scan it produced.
A second run with unchanged input writes identical bytes.
"""

from __future__ import annotations

from pathlib import Path

from ..scan import Scan, ScanError, read_scan
from ..store import (
    Store,
    StoreEntry,
    entry_from_anchor,
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
    to one entry whose anchor list records both spellings — that is
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
    write_store(root, merged)

    resolved = sum(1 for e in merged.values() if e.get("resolvedBy") != "anchor")
    print(f"{len(merged)} sources in {STORE_PATH} ({resolved} already resolved and preserved)")
    return 0
