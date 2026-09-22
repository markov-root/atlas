"""``atlas citations export`` — the whole-book bibliography as BibTeX and CSL-JSON.

Bank B7 of ``task:0021``, and the owner's stated phase-1 goal: "the full
bibliography across the book exportable into a sensible file". Read from the
committed store; no network, no credentials.

Ported from ``export.ts`` under ``task:0029``, and **this file is the reason the
port exists.** The TypeScript version hand-rolled BibTeX serialization and got it
structurally wrong: every multi-author entry emitted ``author = {A} and {B}``,
which terminates the field value at the first closing brace. 303 arXiv entries —
precisely the ones with real author lists — were malformed. It was fixed in
``6c4263e``, but it was never ours to get wrong: ``bibtexparser`` builds the
entry model and writes the file, and field separation, brace balance and escaping
are its problem.

What stays hand-written is the part that is genuinely this project's judgement,
not BibTeX mechanics:

- **Entry keys.** They are visible in a reference manager and in every ``\\cite``
  an author writes, so they are content-derived and stable across runs.
- **The CSL → BibTeX type and field mapping.** Which CSL field becomes
  ``journal`` versus ``booktitle`` versus ``howpublished`` is a bibliographic
  decision this project makes.
- **Structured versus literal names**, which is a decision ``task:0025`` made
  about honesty and which must survive into the output.
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

import bibtexparser
from bibtexparser.model import Entry, Field

from ..store import CslItem, Store, to_csl_json
from .extract import STORE_PATH, read_store

#: CSL type → BibTeX entry type.
BIBTEX_TYPES = {
    "article-journal": "article",
    "paper-conference": "inproceedings",
    "report": "techreport",
    # Preprints, pages, blog posts, video and the last-resort type all land on
    # @misc: standard BibTeX has no better home for them, and Zotero/BibLaTeX map
    # howpublished back to a URL without complaint.
    "article": "misc",
    "webpage": "misc",
    "post-weblog": "misc",
    "motion_picture": "misc",
    "document": "misc",
}


def _slug(text: str, max_len: int = 20) -> str:
    """Lowercase alphanumerics only — safe in every BibTeX key parser."""
    return "".join(c for c in text.lower() if c.isalnum() and c.isascii())[:max_len]


def _short_hash(text: str) -> str:
    """Short deterministic digest of a URL, used only to break key collisions.

    djb2, reproduced from the TypeScript so that existing keys do not change
    under the port — a key that moves invalidates every ``\\cite`` written
    against it. Not a security hash and not used as one.
    """
    h = 5381
    for char in text:
        h = ((h << 5) + h + ord(char)) & 0xFFFFFFFF
    return _base36(h)


def _base36(n: int) -> str:
    if n == 0:
        return "0"
    digits = "0123456789abcdefghijklmnopqrstuvwxyz"
    out = ""
    while n:
        n, rem = divmod(n, 36)
        out = digits[rem] + out
    return out


def _year_of(item: CslItem) -> Any:
    parts = (item.get("issued") or {}).get("date-parts") or []
    if parts and parts[0]:
        return parts[0][0]
    return None


def base_bibtex_key(item: CslItem) -> str:
    """The key an entry would have if the store contained nothing else.

    Deliberately content-derived (``name+year+title-word``). The title word is
    dropped when it repeats the name — unresolved entries carry the anchor text
    as their title, which would otherwise give "Chollet, 2019" the absurd key
    ``chollet2019chollet``.
    """
    authors = item.get("author") or []
    first = authors[0] if authors else {}
    raw_name = (first.get("family") or first.get("literal") or "anonymous").strip()
    name = _slug(raw_name) or "anonymous"
    year = _year_of(item)
    title_words = str(item.get("title") or "").split()
    title_word = _slug(title_words[0]) if title_words else ""
    suffix = title_word if title_word and title_word != name else ""
    return f"{name}{year if year is not None else ''}{suffix}" or "source"


def assign_bibtex_keys(store: Store) -> dict[str, str]:
    """One key per store entry, deterministic for a given store.

    Collisions — two Anthropic 2024 pages, say — are broken with a digest of the
    entry's own canonical URL rather than a counter, so the suffix does not
    depend on how many entries precede it.

    **The guarantee is narrower than the TypeScript original claimed**, and the
    difference is worth stating because keys are what authors write in every
    ``\\cite``:

    - An entry whose base key is unique in the store keeps that bare key,
      whatever else is added. This is the overwhelming majority.
    - Within a *colliding* group, the URL that sorts first keeps the bare key and
      the rest take a suffix. So adding a new entry that collides with an
      existing bare key can move that key — if the newcomer's URL sorts earlier.

    Making both properties true at once is not possible: "bare key when unique"
    and "never changes when a colliding sibling appears" contradict each other
    the moment a second entry wants the same base. The bare key is worth more,
    because collisions are rare and readable keys are read constantly. Recorded
    as ``audit:0011`` F8 rather than silently carried across.
    """
    out: dict[str, str] = {}
    used: set[str] = set()
    for url in sorted(store):
        base = base_bibtex_key(store[url]["item"])
        key = base
        if key in used:
            key = f"{base}-{_short_hash(url)}"
        # The digest itself could collide with an existing key; degenerate but
        # cheap to defend against, and deterministic so retrying it is too.
        while key in used:
            key = f"{base}-{_short_hash(key)}x"
        used.add(key)
        out[url] = key
    return out


def bibtex_name(name: dict[str, str]) -> str:
    """One CSL name as it appears *inside* a BibTeX author field.

    The two cases need opposite treatment, and getting it backwards is the easy
    mistake:

    - A **structured** name is emitted bare — ``Hoffmann, Jordan``. BibTeX parses
      the comma as the family/given boundary. Wrapping it in braces would make it
      one unbreakable literal, so a reference manager would render the author as
      "Hoffmann, Jordan" rather than "J. Hoffmann".
    - A **literal** name is braced — ``{Giattino et al.}`` — precisely so BibTeX
      does NOT try to split it into First Last. ``task:0025`` keeps such names
      unparsed because guessing their structure is confidently wrong in every
      citation style; the braces carry that decision into the output.

    The caller joins these with ``" and "``.
    """
    if "literal" in name:
        return "{" + name["literal"] + "}"
    family = name.get("family")
    if family is not None:
        given = name.get("given")
        return f"{family}, {given}" if given is not None else family
    return ""


def bibtex_entry(key: str, item: CslItem) -> Entry:
    """One ``bibtexparser`` entry, with fields in a fixed order.

    Field *separation* is bibtexparser's job — the bug this port exists to
    prevent. What is decided here is only which CSL field becomes which BibTeX
    field.
    """
    entry_type = BIBTEX_TYPES.get(str(item.get("type")), "misc")
    fields: list[Field] = []

    def add(name: str, value: Any) -> None:
        if value is not None and value != "":
            fields.append(Field(key=name, value=str(value)))

    authors = item.get("author") or []
    if authors:
        names = [n for n in (bibtex_name(a) for a in authors) if n]
        if names:
            # One field, names joined with " and ". bibtexparser wraps the value
            # once; emitting "{A} and {B}" by hand is what broke 303 entries.
            add("author", " and ".join(names))

    add("title", item.get("title"))
    add("year", _year_of(item))

    container = item.get("container-title")
    if entry_type == "article" and container:
        add("journal", container)
    elif entry_type == "inproceedings" and container:
        add("booktitle", container)
    elif entry_type == "techreport" and container:
        add("institution", container)
    elif entry_type == "misc" and item.get("URL"):
        # @misc has no journal/booktitle slot; howpublished is where a reference
        # manager expects the address of a web source to arrive.
        add("howpublished", item["URL"])

    add("doi", item.get("DOI"))
    if entry_type != "misc":
        add("url", item.get("URL"))
    add("note", item.get("note"))

    return Entry(entry_type=entry_type, key=key, fields=fields)


def serialize_bibtex(store: Store) -> str:
    """The whole store as one ``.bib`` file.

    Entries are ordered by their assigned BibTeX keys so the output is stable
    regardless of store insertion order, and regenerating gives a reviewable
    diff.
    """
    keys = assign_bibtex_keys(store)
    library = bibtexparser.Library()
    for url, key in sorted(keys.items(), key=lambda kv: kv[1]):
        library.add(bibtex_entry(key, store[url]["item"]))

    header = (
        "% Bibliography for the AI Safety Atlas.\n"
        "% Generated by `atlas citations export` from data/citations/sources.yaml.\n"
        "% Do not hand-edit: changes here are lost on the next export. Fix the store.\n\n"
    )
    return header + bibtexparser.write_string(library)


def serialize_csl_json(store: Store) -> str:
    """The CSL-JSON half of the export — a straight compile of the store."""
    return json.dumps(to_csl_json(store), indent=2, ensure_ascii=False) + "\n"


def citations_export(root: Path, out_dir: Path | None = None) -> int:
    """Write both files, print one line naming them.

    The store must exist before this is meaningful — exporting an empty
    bibliography and calling it success would be the exact warn-into-a-log
    failure AC-3 exists to prevent, so a missing store is a hard stop with a
    pointer to the command that creates it.
    """
    if not (root / STORE_PATH).exists():
        print(f"no citation store at {STORE_PATH} — run `atlas citations extract` first")
        return 1

    store = read_store(root)
    dest = out_dir or (root / "data" / "citations")
    dest.mkdir(parents=True, exist_ok=True)
    (dest / "bibliography.bib").write_text(serialize_bibtex(store), encoding="utf-8")
    (dest / "bibliography.json").write_text(serialize_csl_json(store), encoding="utf-8")

    print(f"{len(store)} sources exported to {dest}/bibliography.{{bib,json}}")
    return 0
