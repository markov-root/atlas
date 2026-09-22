"""``atlas citations`` — the Python half of the maintainer control surface.

``task:0021`` D6 fixes the plural noun. Verbs are deliberately separate rather
than modes of one command: ``urls``, ``extract``, ``report`` and ``export`` are
pure and offline, while ``resolve`` is networked and slow. Behind one verb, the
fast safe command would inherit the slow one's caveats.

``task:0029`` D3 keeps ``atlas`` as the single entry point. ``bin/atlas``
dispatches here for these verbs and to ``tsx`` for the rest; the user-facing
contract does not fracture because the implementation language did.

Dispatch only — every command is an importable function so it can be unit-tested
without going through argv.
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

from .commands.export import citations_export
from .commands.extract import citations_extract
from .commands.report import citations_report
from .commands.resolve import ResolveOptions, citations_resolve
from .commands.urls import citations_urls


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog="atlas citations",
        description="Bibliography commands for the AI Safety Atlas.",
    )
    parser.add_argument(
        "--root",
        type=Path,
        default=Path.cwd(),
        help="checkout root (defaults to the working directory)",
    )
    subs = parser.add_subparsers(dest="verb", required=True)

    extract = subs.add_parser("extract", help="fold the scanned citations into the CSL store")
    extract.set_defaults(run=lambda a: citations_extract(a.root))

    report = subs.add_parser("report", help="list citations needing attention")
    report.add_argument("out", nargs="?", type=Path, default=None)
    report.set_defaults(run=lambda a: citations_report(a.root, a.out))

    export = subs.add_parser("export", help="write the bibliography as BibTeX and CSL-JSON")
    export.add_argument("out", nargs="?", type=Path, default=None)
    export.set_defaults(run=lambda a: citations_export(a.root, a.out))

    urls = subs.add_parser("urls", help="write cited sources per chapter as Markdown")
    urls.add_argument("out", nargs="?", type=Path, default=None)
    urls.set_defaults(run=lambda a: citations_urls(a.root, a.out))

    resolve = subs.add_parser("resolve", help="fill in metadata over the network")
    resolve.add_argument("--limit", type=int, default=None, help="stop after this many entries")
    resolve.add_argument(
        "--interval", type=float, default=None, help="seconds between outbound requests"
    )
    resolve.add_argument(
        "--redo",
        default=None,
        help="comma-separated resolvers whose entries should be re-resolved",
    )
    resolve.set_defaults(
        run=lambda a: citations_resolve(
            a.root,
            ResolveOptions(
                limit=a.limit,
                redo=[r for r in (a.redo or "").split(",") if r],
                **({"interval_s": a.interval} if a.interval is not None else {}),
            ),
        )
    )
    return parser


def main(argv: list[str] | None = None) -> int:
    args = build_parser().parse_args(argv if argv is not None else sys.argv[1:])
    return args.run(args)


if __name__ == "__main__":
    raise SystemExit(main())
