"""``atlas citations report`` — what needs human attention.

Bank B6 of ``task:0021``, and the point of the whole citation pipeline: the
edition-2 authors asked for a bibliography, but what helps them *while writing*
is an answer to "which of my citations are broken, unresolved, or malformed".

The report is a durable artifact, not log output. ``audit:0010`` F2 found that
this repo's existing warn-and-continue posture already ships 404s to production,
because warnings scroll past in a build log and nobody reads them. Printing a
count to stdout is exactly that failure; writing the file and naming it in one
line is the fix (``task:0021`` D4's implementation obligation).

Output is deterministic — no timestamp — so re-running after doc edits produces a
diff of what changed, not a whole-file rewrite.

Ported from ``report.ts`` under ``task:0029``.
"""

from __future__ import annotations

import re
from dataclasses import dataclass
from pathlib import Path

from ..scan import Citation, Scan, ScanError, read_scan
from ..store import Store
from .extract import STORE_PATH, read_store

#: Where the report artifact is written, relative to the repo root.
REPORT_PATH = Path("data") / "citations" / "citation-report.md"


#: Trailing site name on a scraped title: " — Google DeepMind", " | LessWrong".
_TITLE_SUFFIX = re.compile(r"\s*[-\u2013\u2014|:]\s*[^-\u2013\u2014|:]{1,40}$")


def _title_fingerprint(title: str | None) -> str:
    """A title reduced to what two spellings of the same work share.

    Strips a trailing site name — the same post cross-published to the Alignment
    Forum and LessWrong differs only in that suffix — then removes punctuation
    and case. Truncated, because a mirror sometimes appends a subtitle.
    """
    stripped = _TITLE_SUFFIX.sub("", title or "")
    return re.sub(r"[^a-z0-9]+", "", stripped.lower())[:60]


def _first_author(item: dict) -> str:
    authors = item.get("author") or [{}]
    return (authors[0].get("family") or authors[0].get("literal") or "").strip().lower()


def _year(item: dict) -> str:
    parts = (item.get("issued") or {}).get("date-parts") or []
    return str(parts[0][0]) if parts and parts[0] else ""


def duplicate_groups(store: Store) -> list[list[str]]:
    """Entries that are probably one work under several URLs.

    Matched on **first author + year + title fingerprint**, and deliberately not
    on domain. Measured over this corpus: author-and-year alone flags 98 groups
    and domain-and-author-and-year flags 73, but most of both are legitimate —
    the AI Safety textbook contributes eight *different chapters* under one
    author, year and site. Adding the title cuts it to 12 groups of genuine
    duplicates: cross-posts, mirrors, and an arXiv preprint beside its
    publisher's page.

    This reports; it never merges. ``task:0021`` D1 makes the canonical URL the
    entry's identity, and collapsing two identities on a heuristic would silently
    lose a citation — the failure mode canonicalization is written to avoid.
    Acting on this list is a human decision recorded in an alias file.
    """
    groups: dict[tuple[str, str, str], list[str]] = {}
    for key in sorted(store):
        entry = store[key]
        # Unresolved entries are excluded, and this is the difference between a
        # usable list and a misleading one. An unresolved entry's title IS its
        # anchor text — "Christiano, 2016" — so every unresolved work by one
        # author in one year fingerprints identically. That produced three false
        # groups on this corpus: two different ai-alignment.com posts, two
        # different Metaculus questions, two different LessWrong comments.
        # A title we did not resolve is not evidence about which work it is.
        if entry.get("resolvedBy") == "anchor":
            continue
        item = entry.get("item", {})
        author, year = _first_author(item), _year(item)
        fingerprint = _title_fingerprint(item.get("title"))
        if not (author and year and fingerprint):
            continue
        groups.setdefault((author, year, fingerprint), []).append(key)
    return [keys for keys in groups.values() if len(keys) > 1]


@dataclass(frozen=True)
class ReportCounts:
    #: Store entries whose only metadata is the anchor text.
    unresolved: int
    #: Anchor texts classified as citations that split into no author+year.
    malformed: int
    #: Prose-anchored links that might be citations.
    content_links: int
    #: Footnote citations with no hyperlink.
    unlinked: int
    #: Sources cited with more than one anchor spelling.
    inconsistent: int
    #: Groups of entries that are probably one work under several URLs.
    duplicates: int


@dataclass(frozen=True)
class CitationReport:
    markdown: str
    counts: ReportCounts


def _locations(instances: list[Citation]) -> str:
    """Sorted, deduplicated locations: the same section cited twice is listed once."""
    unique = sorted({c.location for c in instances})
    return ", ".join(f"`{loc}`" for loc in unique) or "no citation instance found"


def _heading(lines: list[str], title: str, count: int, explanation: str) -> None:
    lines.append(f"## {title} ({count})")
    lines.append("")
    lines.append(explanation)
    lines.append("")


def build_citation_report(scan: Scan, store: Store) -> CitationReport:
    """Build the report. Pure: scan and store in, Markdown out.

    Sections with zero findings are omitted entirely — an author scanning the
    file should meet only the sections that need them, and a count of zero in a
    heading is noise that trains people to stop reading headings.
    """
    instances = scan.all_citations()
    citations = [c for c in instances if c.kind == "citation"]

    # Anchor spellings per canonical URL, so inconsistent citation text is
    # visible without comparing URLs by hand.
    anchors_by_key: dict[str, set[str]] = {}
    instances_by_key: dict[str, list[Citation]] = {}
    for c in citations:
        if not c.key:
            continue
        trimmed = c.anchor_text.strip()
        if trimmed:
            anchors_by_key.setdefault(c.key, set()).add(trimmed)
        anchors_by_key.setdefault(c.key, set())
        instances_by_key.setdefault(c.key, []).append(c)

    malformed = [c for c in citations if c.author_year is None]
    content_links = [c for c in instances if c.kind == "content-link"]
    unlinked = [c for c in instances if c.kind == "unlinked"]
    inconsistent = sorted((k, v) for k, v in anchors_by_key.items() if len(v) > 1)
    unresolved_keys = sorted(k for k, e in store.items() if e.get("resolvedBy") == "anchor")
    duplicates = duplicate_groups(store)

    lines: list[str] = [
        "# Citation report — citations needing human attention",
        "",
        "Generated by `atlas citations report` from the Google Docs source and the citation store.",
        "Re-run after editing the documents; nothing here is hand-maintained, so it cannot drift.",
        "",
    ]

    if unresolved_keys:
        _heading(
            lines,
            "Unresolved entries",
            len(unresolved_keys),
            "Only the anchor text is known for these — no metadata has been resolved and nothing "
            "beyond author/year can be rendered. `atlas citations resolve` fills them from arXiv, "
            "Crossref and page metadata; hand edits to this store file are also preserved.",
        )
        for key in unresolved_keys:
            anchors = " / ".join(f"`{a}`" for a in store[key].get("anchors", []))
            where = _locations(instances_by_key.get(key, []))
            lines.append(f"- {anchors or '(no anchor text)'} — {where} — {key}")
        lines.append("")

    if malformed:
        _heading(
            lines,
            "Malformed anchor text",
            len(malformed),
            "These look like citations but could not be split into an author and a year, so no "
            "bibliography entry can name them. Fix the link text in the Google Doc — the corpus "
            "shows real cases: `Burns et. al. 2023` (missing comma), a stray closing paren.",
        )
        for c in malformed:
            target = c.key or c.raw_url or "no URL"
            lines.append(f"- `{c.location}` — `{c.anchor_text.strip()}` ({target})")
        lines.append("")

    if content_links:
        _heading(
            lines,
            "Content links — prose anchors that might be citations",
            len(content_links),
            'Hyperlinks whose text is prose ("available here") rather than an author and year. '
            "Many are ordinary links; anything that *should* be cited needs its link text changed "
            'to "Author, Year" form in the Google Doc.',
        )
        for c in content_links:
            target = c.key or c.raw_url or "no URL"
            lines.append(f"- `{c.location}` — `{c.anchor_text.strip()}` ({target})")
        lines.append("")

    if unlinked:
        _heading(
            lines,
            "Unlinked footnote citations",
            len(unlinked),
            "Author-year text in a footnote with no hyperlink, so there is no URL to key an entry "
            "on. The corpus currently has none — this section exists so the first one an author "
            "writes is reported rather than silently dropped.",
        )
        for c in unlinked:
            lines.append(f"- `{c.location}` — `{c.anchor_text.strip()}`")
        lines.append("")

    if inconsistent:
        _heading(
            lines,
            "Inconsistent citation spelling",
            len(inconsistent),
            "One source cited with more than one anchor spelling. Rendering collapses these to one "
            "entry, but the inconsistent input is worth fixing at the source while it is cheap.",
        )
        for key, spellings in inconsistent:
            shown = " / ".join(f"`{a}`" for a in sorted(spellings))
            lines.append(f"- {shown} — {_locations(instances_by_key.get(key, []))} — {key}")
        lines.append("")

    if duplicates:
        _heading(
            lines,
            "Probable duplicates — one work under several URLs",
            len(duplicates),
            "Same first author, same year, and effectively the same title. Usually a cross-post "
            "(Alignment Forum and LessWrong), a mirror (`deepmind.com` and `deepmind.google`), "
            "or a preprint beside its published page. Entry identity is the canonical URL "
            "(`task:0021` D1), so these are **reported, never merged** — collapsing two identities "
            "on a heuristic would silently lose a citation. Pick the URL to keep and record the "
            "others as aliases.",
        )
        for group in duplicates:
            title = store[group[0]]["item"].get("title") or "(no title)"
            lines.append(f"- **{title}**")
            for key in group:
                lines.append(f"  - {key}")
        lines.append("")

    counts = ReportCounts(
        unresolved=len(unresolved_keys),
        malformed=len(malformed),
        content_links=len(content_links),
        unlinked=len(unlinked),
        inconsistent=len(inconsistent),
        duplicates=len(duplicates),
    )
    return CitationReport(markdown="\n".join(lines), counts=counts)


def citations_report(root: Path, out_path: Path | None = None) -> int:
    """Write the artifact, print one line naming it.

    The store is required because "unresolved" is a property of the store, not
    the documents. An empty store is legitimate (nothing resolved yet); a missing
    one almost certainly means extract has not run.
    """
    if not (root / STORE_PATH).exists():
        print(f"no citation store at {STORE_PATH} — run `atlas citations extract` first")
        return 1
    try:
        scan = read_scan(root)
    except ScanError as exc:
        print(f"atlas: {exc}")
        return 1

    report = build_citation_report(scan, read_store(root))
    dest = out_path or (root / REPORT_PATH)
    dest.parent.mkdir(parents=True, exist_ok=True)
    dest.write_text(report.markdown, encoding="utf-8")

    c = report.counts
    print(
        f"{c.unresolved} unresolved · {c.malformed} malformed · "
        f"{c.content_links} content links · {c.unlinked} unlinked · "
        f"{c.inconsistent} inconsistent spellings · {c.duplicates} probable duplicates "
        f"— wrote {dest}"
    )
    return 0
