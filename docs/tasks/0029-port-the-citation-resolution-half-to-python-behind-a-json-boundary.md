---
schema_version: 2
id: '0029'
uid: 'task-20260922T211637904484Z-e092b037'
title: 'Port the citation resolution half to Python behind a JSON boundary'
role: task
status: todo
summary: 'Move the language-agnostic 3,243 lines of citation resolution to Python, where the bibliography libraries already exist.'
created: '2026-09-22'
updated: '2026-09-22'
owner: Markov Grey
supersedes: ''
superseded_by: ''
engineering_document:
  version: 1
  contract_tier: full
  role: task
  id: '0029'
  uid: task-20260922T211637904484Z-e092b037
  title: 'Port the citation resolution half to Python behind a JSON boundary'
  state: todo
  authority:
    kind: work-state
    owner: Markov Grey
    scope: The resolution half only — resolvers, store, serialization and their commands
  created: '2026-09-22'
  updated: '2026-09-22'
  transition_history: unverified
  transitions: []
  relationships: []
  details:
    criteria:
      [
        criterion:AC-1,
        criterion:AC-2,
        criterion:AC-3,
        criterion:AC-4,
        criterion:AC-5,
        criterion:AC-6,
      ]
    parent: '0021'
    size: l
    priority: p1
---

# Task 0029: Port the citation resolution half to Python behind a JSON boundary

## Problem

The citation pipeline was written entirely in TypeScript. That was never argued for — it was
inherited from the repository's existing language and from `cli/` already existing under
`task:0010`. The choice was not surfaced as a decision, and it should have been.

**Most of what was built has nothing to do with the web layer or the textbook.** Measured:

| Part                                                      |     Lines | Language-locked?                      |
| --------------------------------------------------------- | --------: | ------------------------------------- |
| Resolution — resolvers, CSL store, BibTeX, their commands | **3,243** | **No.** Takes a URL, returns metadata |
| Extraction — walks the parsed AST                         |       567 | Yes — consumes `Node`/`Section`       |
| The Docs→AST pipeline extraction calls                    |     1,123 | Yes — not callable from outside TS    |

Only the 567-line extraction step is genuinely tied to TypeScript, and only because it reads an AST
produced by 1,123 lines of existing loader code. Everything else is ordinary scraping and
bibliography work.

### The cost is already visible, not hypothetical

Writing this in TypeScript meant reimplementing solved problems, and the reimplementations were
wrong:

- **A hand-rolled BibTeX serializer shipped a structural bug.** Every multi-author entry emitted
  `author = {A} and {B}`, which terminates the field value at the first brace. 303 arXiv entries —
  precisely the ones with real author lists — were malformed. `bibtexparser` or `pybtex` would not
  have had that bug. Fixed in `6c4263e`, but it should never have been ours to get wrong.
- **HTML metadata is parsed with regular expressions**, in both `opengraph.ts` and
  `scholar-meta.ts`, under a "do not add an HTML parser dependency" constraint that was
  self-imposed. `beautifulsoup4` is one line and handles the cases the regex documents as
  unhandled.
- **The Crossref and arXiv clients are hand-written.** `habanero` and `arxiv` exist, are
  maintained, and handle pagination, rate limits and error shapes this code rediscovers.

The owner's position, recorded because it governs how this task is judged: **work is kept because it
is right, not because it exists.** Age is not an argument. "It already works" is not an argument.

## Scope

Port the resolution half to Python, with an explicit file boundary between the two languages.

```
TypeScript   Google Docs → AST → extract → citations.json     (already exists)
Python       citations.json → resolve → sources.yaml
                                      → bibliography.bib, .json
                                      → reports, per-chapter Markdown
TypeScript   sources.yaml → render on the site                (phase 2; Astro)
```

**What moves to Python** — every file whose only import is `../store`:

- `resolvers/` — arxiv, crossref, oembed, opengraph, research-db, scholar-meta, types, index
- `store.ts` — the CSL model and YAML serialization
- `cli/commands/citations/` — resolve, export, report, extract-cmd, urls

**What stays in TypeScript:**

- `extract.ts` — consumes the AST; this is the one genuine tie
- `author-year.ts` — shared with the audio renderer (`text-renderer.ts:8`), so it cannot leave
- `canonical-url.ts` — see the correction below
- `load.ts` — drives `TextbookLoader`
- Whatever phase 2 needs to read `sources.yaml` at build time

### Correction made during execution: `canonical-url.ts` stays

This task originally listed URL canonicalization as moving. It does not, and the reason is worth
recording because it sharpens what the boundary actually is.

Canonicalization **mints entry identity** (`task:0021` D1), and identity is minted at extraction —
`extract.ts` calls it to produce each instance's `key`. Extraction stays in TypeScript, so
canonicalization has to. Python only ever receives URLs that are already canonical and never
re-derives one: the resolvers' `claims()` methods pattern-match an already-canonical string, and the
research-database resolver's `www.` retry is a one-line host edit, not a canonicalization.

A Python port of it was written and then deleted. It had passed a strong test — it reproduced all 948
committed keys exactly — but that only proved the two implementations agreed _on the day_. Keeping a
second implementation of the rule that defines entry identity, with no runtime caller, is a pure
drift liability: the next person to fix a canonicalization edge case would fix one of them.

The sharper statement of the boundary: **TypeScript owns identity and extraction; Python owns
metadata and output.**

**Use the ecosystem rather than rebuilding it.** At minimum: `bibtexparser` or `pybtex` for BibTeX,
`beautifulsoup4` or `lxml` for HTML metadata, `habanero` for Crossref, `arxiv` for arXiv, `httpx` or
`requests` for transport, `ruamel.yaml` or `PyYAML` for the store. Tooling follows the machine
standard: `uv`, `ruff`, `pytest`.

## Out of scope

- **Rewriting extraction.** It reads the AST and belongs where the AST is.
- **Phase 2 rendering.** Still deferred, still TypeScript, still reads `sources.yaml`.
- **Changing the CSL model or entry identity.** `task:0021` D1 and D2 stand. The store's _format_ is
  unchanged; only what writes it moves.
- **Re-resolving everything.** The committed store holds 786 resolved entries. The port must read
  and write the same file so that work carries over untouched.

## Decisions

Settled by the owner on 2026-09-22, before execution.

### D1 — Where exactly does the boundary sit? — **decided: A**

| Option                                                   | Consequence                                                                                       |
| -------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| **A.** TS emits `citations.json` (instances + locations) | One clean handoff file. Python owns the store entirely. Two commands to run in sequence.          |
| **B.** TS keeps the store, Python only resolves          | Smaller change; leaves BibTeX and YAML in TypeScript, which is where the bug was.                 |
| **C.** Python shells out to `tsx` for extraction         | One command. Couples the two toolchains at runtime and makes the Python side need Node installed. |

**A.** It puts the whole hand-rolled-format surface in Python, which is the part that has already
gone wrong, and the handoff file is inspectable — a contributor can see exactly what crosses the
line. B leaves the BibTeX serializer where it is, which does not address the motivating defect.

### D2 — How does the Python side join `pnpm verify`? — **decided: a `pnpm` script**

The pre-push hook runs `pnpm verify`. A Python test suite has to be reachable from it, or it will
rot. `pnpm test:py` shells to `uv run pytest` and is chained into `verify`. A check outside the gate
is a check that stops running, and `audit:0011` F1 is this repository's own worked example.

### D3 — Does `atlas` stay the single entry point? — **decided: yes**

`task:0010` established `atlas` as the maintainer control surface and `bin/atlas` as a logic-free
adapter. It dispatches to Python as easily as to `tsx`. The user-facing contract does not fracture
because the implementation language did.

### D4 — What counts as proof that the resolved store survived? — **decided: semantic equality**

Raised during execution, because AC-4 was originally written as "proven by a byte comparison" and
that is not achievable. The store is emitted by the npm `yaml` package in a style no Python emitter
reproduces: folded scalars wrapped at width 100 with continuation indent, `- - 2023` nested block
sequences, and quoting applied only where the value demands it. A byte-identical Python emitter
would mean reimplementing `yaml`'s serializer — which is the same hand-rolled-format mistake this
task exists to undo.

So the proof changes shape, not strength:

- **Semantic equality is the criterion.** Parse the pre-port store and the post-port store, compare
  the resulting structures entry by entry, and require every one of the 789 resolved entries to be
  identical in data. A test asserts this against the real committed file, not a fixture.
- **The reformat lands in its own commit**, touching no logic, so the one-time whitespace churn is
  reviewable as whitespace rather than hidden inside a port.

This preserves what AC-4 was actually protecting — no re-resolution, no silent data loss — and drops
only a form of evidence that was never obtainable.

## Done when

- **AC-1:** Every file listed under "what moves" is gone from TypeScript, and no TypeScript module
  outside `extract.ts`, `author-year.ts`, `canonical-url.ts`, `load.ts` and the `scan` command
  imports anything citation-related.
- **AC-2:** BibTeX and CSL-JSON are produced by a maintained library, not hand-written
  serialization. A test proves the multi-author case that `6c4263e` fixed stays fixed.
- **AC-3:** HTML metadata is parsed with a real parser. The `citation_reference` trap — where a
  page's own bibliography carries other works' DOIs — is still covered by a test.
- **AC-4:** The existing `data/citations/sources.yaml` is read and rewritten with every resolved
  entry semantically identical, per D4. A test parses the committed store and asserts entry-by-entry
  equality across the port; no entry is re-resolved to satisfy it. The one-time reformat is its own
  commit.
- **AC-5:** The Python suite runs inside `pnpm verify` per D2, and fails the gate when it fails.
- **AC-6:** `atlas citations <verb>` still works for every verb that exists today, per D3.

## Completion evidence

| Criterion | Evidence                                                                                                                                                                                                                                                                                                                                       | Verified   |
| --------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- |
| AC-1      | 16 TypeScript files deleted (`resolvers/` entire, `store.ts`, and the five `cli/commands/citations/` commands with their tests). `src/textbook-loader/citations/` now holds only `author-year.ts`, `canonical-url.ts`, `extract.ts`; `cli/commands/citations/` holds `load.ts`, `scan.ts`, `python.ts`. `pnpm typecheck` passes with 0 errors. | 2026-09-22 |
| AC-2      | `bibtexparser` 2.0.1 builds the entry model and writes the file. `python/tests/test_export.py::TestMultiAuthorRegression` — four tests, including a 20-entry store — pins the `6c4263e` defect by **parsing the output back**, not by matching emitted text. Real export: 948 entries, **0 failed blocks**, 335 multi-author entries intact.   | 2026-09-22 |
| AC-3      | `beautifulsoup4` + `lxml` replace regex parsing in `opengraph.py` and `scholar_meta.py`. The `citation_reference` trap is still covered by `test_takes_the_article_doi_never_one_from_a_citation_reference`, and `test_reads_unquoted_attributes_the_regex_version_could_not` shows a case the old matcher could not handle.                   | 2026-09-22 |
| AC-4      | Direct before/after comparison of the real store: 948 entries both sides, key sets identical, **0 entries semantically changed**, 789 resolved preserved (opengraph 380, arxiv 303, research-db 92, oembed 13, crossref 1). Nothing re-resolved. Pinned by `test_store.py::TestCommittedCorpus`, which runs against the committed file.        | 2026-09-22 |
| AC-5      | `pnpm test:py` → `uv run pytest`, chained into both `pnpm check` and `pnpm verify`; `pnpm lint:py` likewise. The pre-push hook runs `verify` unchanged, so the Python suite is inside the gate per D2.                                                                                                                                         | 2026-09-22 |
| AC-6      | All five original verbs run end to end through `./bin/atlas`: `extract` (948 sources, 789 preserved), `export` (948), `report` (159 unresolved · 0 malformed · 47 content links · 0 unlinked · 76 inconsistent), `urls` (9 files), `resolve` (dispatches). `scan` is added, and runs automatically before the verbs that read the documents.   | 2026-09-22 |

**Test counts:** 389 before the port → **424 after** (247 TypeScript + 177 Python). The drop in the
TypeScript count is the 150 tests that moved; the Python suite carries 177 because the port added
coverage rather than transcribing it.

**Two defects found by writing the tests**, both in the original and both recorded rather than
silently carried across or silently fixed: `audit:0011` F8 (a BibTeX key comment claimed a stability
guarantee the algorithm does not give) and F9 (the all-sources index could not show within-section
spelling inconsistencies, which is the thing it exists to surface). F9 is fixed; F8 is a
documentation correction, because changing the behaviour would move existing `\cite` keys.

## Authority and inputs

- Line counts measured 2026-09-22 against branch `bibliography`; reproducible with `wc -l`.
- `6c4263e` — the BibTeX author-field bug and its fix. The concrete cost of hand-rolling a format.
- `src/textbook-loader/citations/resolvers/opengraph.ts`, `scholar-meta.ts` — regex HTML parsing,
  with their own comments naming what they do not handle.
- `src/textbook-loader/citations/extract.ts` — the single module with a genuine AST dependency.
- `src/textbook-loader/renderers/audio/text-renderer.ts:8` — why `author-year.ts` stays.
- `task:0010` — `atlas` as the control surface; D3 follows from it.
- `task:0018` — the build-time versus maintainer-only boundary this port makes physical.
- `audit:0011` F1 — the precedent for D2: a check outside the gate stops running.

## Note on why this is being done at all

This task exists because the language was never chosen deliberately. The port is not a correction of
a judgement call that went the other way; it is the first time the call is being made. Recorded so
that a future reader does not mistake it for churn.
