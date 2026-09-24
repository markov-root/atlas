"""``atlas citations render`` - every reference, in every offered style.

``task:0030``. The store is CSL (``task:0021`` D2), so a CSL processor reads it
with no adapter - which is the whole reason that schema was chosen. This command
runs ``citeproc-py`` over the vendored styles and writes one file the site reads
at build time.

Rendering happens here rather than in the browser or in Astro for two reasons.
It keeps ``task:0029`` D1's boundary intact - Python owns metadata and output -
and it means the page ships strings, not a citation engine: the reader's style
selector swaps pre-rendered text.

The output is deterministic. Styles are vendored and pinned, the store is sorted,
and nothing here reads a clock, so the same inputs give byte-identical output and
a regenerated file diffs cleanly.
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from ..store import Store
from .extract import STORE_PATH, read_store

#: Where the rendered output goes, relative to the repo root.
RENDERED_PATH = Path("data") / "citations" / "rendered.json"

#: Where the vendored `.csl` files live. See `vendor/csl/README.md` for licence.
STYLES_DIR = Path("vendor") / "csl"

#: The styles offered, in the order the selector shows them (`task:0030` D1).
#:
#: ``numeric`` marks a style whose in-text form is ``[1]`` rather than
#: ``(Author, Year)``. The Atlas's prose uses author-year links, so a numeric
#: style is offered for copying a reference out, not for matching the page -
#: the UI says so rather than letting a reader infer it.
STYLES: list[dict[str, Any]] = [
    {"id": "apa", "label": "APA", "file": "apa.csl", "numeric": False},
    {
        "id": "chicago",
        "label": "Chicago",
        "file": "chicago-author-date.csl",
        "numeric": False,
    },
    {
        "id": "mla",
        "label": "MLA",
        "file": "modern-language-association.csl",
        "numeric": False,
    },
    {"id": "nature", "label": "Nature", "file": "nature.csl", "numeric": True},
    {"id": "ieee", "label": "IEEE", "file": "ieee.csl", "numeric": True},
]

#: Rendered with the first style unless the reader has chosen another.
DEFAULT_STYLE = "apa"

#: Bumped when the file's shape changes, so a stale one is ignored rather than
#: misread. The site falls back to its own formatting when this does not match.
SCHEMA_VERSION = 1


class RenderError(RuntimeError):
    """A style file is missing, or the processor could not be loaded."""


def _numeric_prefix_stripped(text: str) -> str:
    """Drop a leading ``1.`` / ``[1]`` that numeric styles emit.

    The number belongs to a citation-order list. Our list is alphabetical and the
    prose carries author-year anchors, so a number here would be actively
    misleading - it would not correspond to anything. The style is still worth
    offering for its *formatting*; the false index is not.
    """
    stripped = text.lstrip()
    for opener, closer in (("[", "]"),):
        if stripped.startswith(opener) and closer in stripped[:8]:
            return stripped[stripped.index(closer) + 1 :].lstrip()
    head, dot, tail = stripped.partition(".")
    if dot and head.isdigit():
        return tail.lstrip()
    return stripped


def _name_for_processor(name: dict[str, Any]) -> dict[str, Any]:
    """One CSL name in the shape a processor initialises correctly.

    ``audit:0011`` F20. A style abbreviates a given name to its initials, and
    ``citeproc-py`` only initialises a capitalised segment. Two shapes the
    resolvers produce therefore render as visible garbage:

    ======================================  ==========================
    Stored                                  APA output
    ======================================  ==========================
    ``given: "Christiaan van"``             ``Merwijk, C. van .``
    ``given: "Jen-tse"``                    ``Huang, J.-. tse .``
    ======================================  ==========================

    Both have a correct CSL spelling: a name particle belongs in
    ``non-dropping-particle``, and a hyphenated given name capitalises each
    segment. This normalises to those on the way to the processor rather than in
    the store, because **the store records the name as its source printed it**.
    A person who writes "Cheng-chi" writes it that way, and rewriting the stored
    value to satisfy a renderer would put a rendering concern in the archive.

    The particle rule needs no word list: particles are lowercase and given
    names are capitalised, so trailing lowercase tokens are the particle. At
    least one token is always kept, so a wholly lowercase given name such as
    "danah" survives untouched.
    """
    given = name.get("given")
    if not isinstance(given, str) or not given.strip():
        return name
    out = dict(name)

    tokens = given.split()
    particles: list[str] = []
    while len(tokens) > 1 and tokens[-1].islower():
        particles.insert(0, tokens.pop())
    if particles and not out.get("non-dropping-particle"):
        out["non-dropping-particle"] = " ".join(particles)
        tokens = tokens or [given]

    given = " ".join(tokens)
    if "-" in given:
        segments = given.split("-")
        if segments[0][:1].isupper():
            given = "-".join(s[:1].upper() + s[1:] if s else s for s in segments)
    out["given"] = given
    return out


def _csl_item(key: str, item: dict[str, Any]) -> dict[str, Any]:
    """One store item as input a CSL processor will accept.

    Null-valued fields are dropped. A resolver that found no volume writes
    ``volume: null`` rather than omitting the key, and a processor reading the
    CSL spec reasonably assumes a present key holds a value - ``citeproc-py``
    calls ``int()`` on it and raises. A null CSL field carries no information in
    any case, so removing it loses nothing.
    """
    out = {k: v for k, v in item.items() if v is not None}

    # Name fields, whichever they are. Duck-typed rather than listed, because
    # CSL defines a dozen name variables and a resolver that learns to fill
    # `editor` or `translator` should not need a change here - the same reason
    # `StoreEntry` is a plain dict.
    for field, value in out.items():
        if isinstance(value, list) and value and all(isinstance(n, dict) for n in value):
            out[field] = [_name_for_processor(n) for n in value]

    # Nulls nest, too. Crossref sends `{"date-parts": [[null]]}` for a record it
    # has no date for, and one such entry is in the committed store. The
    # resolver now rejects it at the source; this is the same guard here, because
    # the store is committed and hand-editable and one bad entry must not take
    # down the rendering of the other 947.
    issued = out.get("issued")
    if isinstance(issued, dict):
        parts = [[p for p in part if isinstance(p, int)] for part in issued.get("date-parts") or []]
        parts = [part for part in parts if part]
        if parts:
            out["issued"] = {"date-parts": parts}
        else:
            del out["issued"]

    out["id"] = key
    return out


def render_store(store: Store, root: Path) -> dict[str, Any]:
    """Render every entry in every style.

    Entries are registered one bibliography at a time rather than all at once:
    a processor given the whole corpus applies cross-entry disambiguation (adding
    ``2022a`` / ``2022b`` suffixes) that depends on which *other* works are
    present. Our three surfaces show different subsets of the same store, so a
    suffix computed over all 948 would be wrong on a section page and the
    per-page result would not match the per-chapter one.
    """
    try:
        from citeproc import (
            Citation,
            CitationItem,
            CitationStylesBibliography,
            CitationStylesStyle,
            formatter,
        )
        from citeproc.source.json import CiteProcJSON
    except ImportError as exc:  # pragma: no cover - dependency is declared
        raise RenderError(f"citeproc-py is not available: {exc}") from exc

    keys = sorted(store)
    items = [_csl_item(key, store[key]["item"]) for key in keys]

    rendered: dict[str, dict[str, str]] = {key: {} for key in keys}

    for style_def in STYLES:
        path = root / STYLES_DIR / style_def["file"]
        if not path.exists():
            raise RenderError(f"missing CSL style {path} - see vendor/csl/README.md")
        style = CitationStylesStyle(str(path), validate=False)
        source = CiteProcJSON(json.loads(json.dumps(items)))
        bib = CitationStylesBibliography(style, source, formatter.plain)
        for key in keys:
            bib.register(Citation([CitationItem(key)]))
        for key, entry in zip(keys, bib.bibliography(), strict=True):
            text = str(entry).strip()
            if style_def["numeric"]:
                text = _numeric_prefix_stripped(text)
            rendered[key][style_def["id"]] = text

    return {
        "schemaVersion": SCHEMA_VERSION,
        "defaultStyle": DEFAULT_STYLE,
        "styles": [{"id": s["id"], "label": s["label"], "numeric": s["numeric"]} for s in STYLES],
        "entries": rendered,
    }


def citations_render(root: Path, out_path: Path | None = None) -> int:
    if not (root / STORE_PATH).exists():
        print(f"no citation store at {STORE_PATH} - run `atlas citations extract` first")
        return 1

    store = read_store(root)
    try:
        payload = render_store(store, root)
    except RenderError as exc:
        print(f"atlas: {exc}")
        return 1

    dest = out_path or (root / RENDERED_PATH)
    dest.parent.mkdir(parents=True, exist_ok=True)
    dest.write_text(
        json.dumps(payload, indent=2, ensure_ascii=False, sort_keys=False) + "\n",
        encoding="utf-8",
    )

    print(f"{len(payload['entries'])} sources rendered in {len(payload['styles'])} styles → {dest}")
    return 0
