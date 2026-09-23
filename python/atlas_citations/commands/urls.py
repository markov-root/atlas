"""``atlas citations urls`` - cited sources as copy-pasteable Markdown, per chapter.

The crude slice of ``task:0026``, shipped ahead of any rendering because the
edition-2 authors can paste it into a Google Doc and work from it today.

Three properties came from the authors actually trying to use it, and each one is
the difference between a list and a usable list:

- **One file per chapter.** A single 3,000-line document is not something anyone
  pastes into a Doc and reviews.
- **Deduplicated within a section.** A source cited three times in one section is
  one entry there. The repetition is real in the prose and meaningless in a
  reference list.
- **Titles, not URLs, as the link text.** "Sutton, 2019" next to a bare URL tells
  a reader nothing they did not already know; the resolved title is the thing
  that identifies the work.

Titles come from the CSL store, so this output gets better as ``atlas citations
resolve`` fills it in. Entries not yet resolved fall back to the raw URL rather
than being hidden, so what is missing stays visible.

Ported from ``urls.ts`` under ``task:0029``.
"""

from __future__ import annotations

import re
from dataclasses import dataclass
from pathlib import Path

from ..scan import Chapter, Citation, Scan, ScanError, read_scan
from ..store import Store
from .extract import read_store

_MD_BRACKETS = re.compile(r"([\[\]])")


@dataclass(frozen=True)
class ChapterFile:
    filename: str
    markdown: str
    citations: int
    unique: int


@dataclass(frozen=True)
class UrlReport:
    files: list[ChapterFile]
    total_citations: int
    unique_sources: int
    unrecognised: int
    resolved_titles: int


def _escape_md(text: str) -> str:
    """Markdown link text cannot contain unescaped brackets."""
    return _MD_BRACKETS.sub(r"\\\1", text)


def _resolved_title(store: Store, key: str | None) -> str | None:
    """The store's title for a key, but only once something resolved it.

    An unresolved entry's title is the anchor text, which is already the label -
    showing it as the link text would say the same thing twice and hide the fact
    that nothing has been looked up.
    """
    if not key:
        return None
    entry = store.get(key)
    if not entry or entry.get("resolvedBy") == "anchor":
        return None
    title = entry.get("item", {}).get("title")
    return str(title) if title else None


def _bullet(c: Citation, store: Store) -> str:
    """``Author, Year ([Title](url))``.

    Where the store has no title yet, the URL is shown bare so the gap is obvious
    rather than papered over.
    """
    label = c.anchor_text.strip() or "(no link text)"
    where = f" [fn {c.footnote_number}]" if c.origin == "footnote" else ""
    if not c.key:
        return f"- {label}{where} (no URL)"
    title = _resolved_title(store, c.key)
    if title:
        return f"- {label}{where} ([{_escape_md(title)}]({c.key}))"
    return f"- {label}{where} ({c.key})"


def _dedupe(citations: list[Citation]) -> list[Citation]:
    """Deduplicate within one section by canonical URL.

    The first occurrence wins, so the order follows the prose. Citations with no
    URL (an unlinked footnote citation) are keyed by their text instead, since
    they have nothing else to be distinguished by.
    """
    seen: set[str] = set()
    out: list[Citation] = []
    for c in citations:
        key = c.key or f"text:{c.anchor_text.strip()}"
        if key in seen:
            continue
        seen.add(key)
        out.append(c)
    return out


def format_chapter_markdown(
    chapter: Chapter, store: Store
) -> tuple[str, list[Citation], list[Citation]]:
    """One chapter's file. Pure: chapter and store in, markdown out."""
    kept: list[Citation] = []
    unrecognised: list[Citation] = []
    body: list[str] = []

    for section in chapter.sections:
        unrecognised.extend(c for c in section.citations if c.kind == "content-link")
        cites = _dedupe([c for c in section.citations if c.kind in ("citation", "unlinked")])
        kept.extend(cites)

        body.append(f"## {chapter.number}.{section.number} {section.title}")
        body.append("")
        if not cites:
            body.append("_No citations in this section._")
        else:
            body.extend(_bullet(c, store) for c in cites)
        body.append("")

    unique_in_chapter = len({c.key for c in kept if c.key})
    with_titles = sum(1 for c in kept if _resolved_title(store, c.key))

    lines = [
        f"# Chapter {chapter.number} - {chapter.title}: cited sources",
        "",
        f"_{len(kept)} citations · {unique_in_chapter} unique sources · "
        f"{with_titles} with a resolved title._",
        "",
        "Read straight out of the Google Doc, so it cannot drift from the prose. Duplicates "
        "within a",
        "section are collapsed. An entry showing a bare URL has not had its title looked up yet.",
        "",
        *body,
    ]

    if unrecognised:
        lines.extend(
            [
                "---",
                "",
                f"## Links not recognised as citations ({len(unrecognised)})",
                "",
                "Hyperlinks whose text is prose rather than an author and year. Anything here that",
                'should be a citation needs its link text changed in the Doc to "Author, Year" '
                "form.",
                "",
            ]
        )
        for c in _dedupe(unrecognised):
            target = c.key or c.raw_url
            lines.append(
                f'- {chapter.number}.{c.section_number} - "{c.anchor_text.strip()}" ({target})'
            )
        lines.append("")

    return "\n".join(lines), kept, unrecognised


def format_url_files(scan: Scan, store: Store) -> UrlReport:
    """All chapter files plus a whole-book index.

    The index answers "what does the Atlas cite", which the per-chapter files
    cannot - and it is the question a bibliography exists for.
    """
    files: list[ChapterFile] = []
    everything: list[Citation] = []
    unrecognised_total = 0

    for chapter in scan.chapters:
        markdown, citations, unrecognised = format_chapter_markdown(chapter, store)
        everything.extend(citations)
        unrecognised_total += len(unrecognised)
        slug = chapter.slug or f"chapter-{chapter.number}"
        files.append(
            ChapterFile(
                filename=f"chapter-{chapter.number:02d}-{slug}.md",
                markdown=markdown,
                citations=len(citations),
                unique=len({c.key for c in citations if c.key}),
            )
        )

    # Spellings are collected from EVERY instance in the scan, not from the
    # per-section display lists. Those are deduplicated by URL, so a source cited
    # twice in one section under two spellings contributes only the first - and
    # the index below promises that "every spelling is shown", which is how
    # inconsistent citation text gets found. Reading the deduplicated lists here
    # made that promise false for precisely the within-section case it exists to
    # catch. (The TypeScript original had this defect; see `audit:0011` F9.)
    by_key: dict[str, list[str]] = {}
    for c in scan.all_citations():
        if not c.key or c.kind not in ("citation", "unlinked"):
            continue
        labels = by_key.setdefault(c.key, [])
        label = c.anchor_text.strip()
        if label and label not in labels:
            labels.append(label)

    keys = sorted(by_key)
    index = [
        "# AI Safety Atlas - all cited sources",
        "",
        f"_{len(keys)} unique sources across {len(scan.chapters)} chapters._",
        "",
        "One file per chapter sits beside this one. Where a source is cited under more than one",
        "spelling, every spelling is shown - that is how inconsistent citation text gets found.",
        "",
    ]
    resolved_titles = 0
    for key in keys:
        title = _resolved_title(store, key)
        if title:
            resolved_titles += 1
        spellings = " / ".join(by_key[key]) or "(no link text)"
        index.append(
            f"- {spellings} ([{_escape_md(title)}]({key}))" if title else f"- {spellings} ({key})"
        )
    index.append("")

    files.append(
        ChapterFile(
            filename="all-sources.md",
            markdown="\n".join(index),
            citations=len(everything),
            unique=len(keys),
        )
    )

    return UrlReport(
        files=files,
        total_citations=len(everything),
        unique_sources=len(keys),
        unrecognised=unrecognised_total,
        resolved_titles=resolved_titles,
    )


def citations_urls(root: Path, out_dir: Path | None = None) -> int:
    try:
        scan = read_scan(root)
    except ScanError as exc:
        print(f"atlas: {exc}")
        return 1

    # Titles come from the store, so this output improves as `resolve` fills it
    # in. A missing store is not an error: the files still build, showing URLs.
    store = read_store(root)
    if not store:
        print("[atlas] no citation store yet - run `atlas citations extract`; showing URLs only")

    report = format_url_files(scan, store)
    dest = out_dir or (root / "data" / "citations" / "chapters")
    dest.mkdir(parents=True, exist_ok=True)
    for f in report.files:
        (dest / f.filename).write_text(f.markdown, encoding="utf-8")

    print(
        f"{report.total_citations} citations · {report.unique_sources} unique sources · "
        f"{report.resolved_titles} with a resolved title · "
        f"{report.unrecognised} links not recognised as citations"
    )
    print(f"wrote {len(report.files)} files to {dest}")
    return 0
