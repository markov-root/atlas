"""Read the handoff file that TypeScript writes.

``task:0029`` D1 puts the language boundary at ``data/citations/citations.json``:
TypeScript walks the AST and emits every citation instance with its location;
everything downstream of that is Python. This module is the Python side of that
contract and the only place that knows the file's shape.

The dataclasses here mirror ``cli/commands/citations/scan.ts``. Keeping them
explicit rather than passing raw dicts around is what makes a shape change fail
loudly at the boundary instead of quietly producing an empty bibliography three
commands later.
"""

from __future__ import annotations

import json
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

#: Relative to the repo root.
SCAN_PATH = Path("data") / "citations" / "citations.json"

#: The only schema this reader understands. TypeScript bumps it on a shape change.
SCHEMA_VERSION = 1


class ScanError(RuntimeError):
    """The handoff file is missing, unreadable, or of an unknown schema version."""


@dataclass(frozen=True)
class Citation:
    """One citation instance, as extracted from the documents."""

    #: Canonical URL — the bibliography entry identity. ``None`` for ``unlinked``.
    key: str | None
    #: The URL exactly as it appeared, kept so a report can show the original.
    raw_url: str | None
    #: The link text, or the matched text for an unlinked citation.
    anchor_text: str
    #: ``citation`` | ``content-link`` | ``asset`` | ``unlinked``
    kind: str
    #: ``inline`` | ``footnote``
    origin: str
    footnote_number: str | None
    chapter_number: int
    section_number: int
    section_slug: str
    #: Parsed anchor text, or ``None`` when it does not split into author and year.
    #:
    #: Computed on the TypeScript side deliberately: ``author-year.ts`` holds the
    #: single definition of a citation anchor, shared with the audio renderer so
    #: the two cannot drift (``task:0025`` AC-6). Reimplementing that pattern here
    #: would fork it.
    author_year: dict[str, str] | None

    @property
    def location(self) -> str:
        """``ch1.2`` plus the footnote number when there is one."""
        where = f", footnote {self.footnote_number}" if self.origin == "footnote" else ""
        return f"ch{self.chapter_number}.{self.section_number}{where}"

    @classmethod
    def from_json(cls, raw: dict[str, Any]) -> Citation:
        return cls(
            key=raw.get("key"),
            raw_url=raw.get("rawUrl"),
            anchor_text=raw.get("anchorText", ""),
            kind=raw.get("kind", "content-link"),
            origin=raw.get("origin", "inline"),
            footnote_number=raw.get("footnoteNumber"),
            chapter_number=raw.get("chapterNumber", 0),
            section_number=raw.get("sectionNumber", 0),
            section_slug=raw.get("sectionSlug", ""),
            author_year=raw.get("authorYear"),
        )


@dataclass(frozen=True)
class Section:
    number: int
    title: str
    slug: str
    citations: list[Citation] = field(default_factory=list)


@dataclass(frozen=True)
class Chapter:
    number: int
    title: str
    slug: str
    sections: list[Section] = field(default_factory=list)


@dataclass(frozen=True)
class Scan:
    chapters: list[Chapter]

    def all_citations(self) -> list[Citation]:
        return [c for ch in self.chapters for s in ch.sections for c in s.citations]


def parse_scan(text: str) -> Scan:
    """Parse the handoff file. Raises :class:`ScanError` on anything unexpected."""
    try:
        raw = json.loads(text)
    except json.JSONDecodeError as exc:
        raise ScanError(f"citations.json is not valid JSON: {exc}") from exc
    if not isinstance(raw, dict):
        raise ScanError("citations.json must contain an object")

    version = raw.get("schemaVersion")
    if version != SCHEMA_VERSION:
        raise ScanError(
            f"citations.json is schema version {version!r}, expected {SCHEMA_VERSION} — "
            "re-run `atlas citations scan`"
        )

    return Scan(
        chapters=[
            Chapter(
                number=ch.get("number", 0),
                title=ch.get("title", ""),
                slug=ch.get("slug", ""),
                sections=[
                    Section(
                        number=sec.get("number", 0),
                        title=sec.get("title", ""),
                        slug=sec.get("slug", ""),
                        citations=[Citation.from_json(c) for c in sec.get("citations", [])],
                    )
                    for sec in ch.get("sections", [])
                ],
            )
            for ch in raw.get("chapters", [])
        ]
    )


def read_scan(root: Path) -> Scan:
    """Read the handoff file from a checkout root."""
    path = root / SCAN_PATH
    if not path.exists():
        raise ScanError(f"no citation scan at {SCAN_PATH} — run `atlas citations scan` first")
    return parse_scan(path.read_text(encoding="utf-8"))
