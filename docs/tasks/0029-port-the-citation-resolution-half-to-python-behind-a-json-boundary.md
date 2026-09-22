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
- `canonical-url.ts` — URL canonicalization
- `cli/commands/citations/` — resolve, export, report, extract-cmd, urls

**What stays in TypeScript:**

- `extract.ts` — consumes the AST; this is the one genuine tie
- `author-year.ts` — shared with the audio renderer (`text-renderer.ts:8`), so it cannot leave
- `load.ts` — drives `TextbookLoader`
- Whatever phase 2 needs to read `sources.yaml` at build time

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

## Decisions required before execution

### D1 — Where exactly does the boundary sit?

| Option                                                   | Consequence                                                                                       |
| -------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| **A.** TS emits `citations.json` (instances + locations) | One clean handoff file. Python owns the store entirely. Two commands to run in sequence.          |
| **B.** TS keeps the store, Python only resolves          | Smaller change; leaves BibTeX and YAML in TypeScript, which is where the bug was.                 |
| **C.** Python shells out to `tsx` for extraction         | One command. Couples the two toolchains at runtime and makes the Python side need Node installed. |

**Recommendation: A.** It puts the whole hand-rolled-format surface in Python, which is the part
that has already gone wrong, and the handoff file is inspectable — a contributor can see exactly
what crosses the line. B leaves the BibTeX serializer where it is, which does not address the
motivating defect.

### D2 — How does the Python side join `pnpm verify`?

The pre-push hook runs `pnpm verify`. A Python test suite has to be reachable from it, or it will
rot. Options: a `pnpm` script that shells to `uv run pytest`; a separate CI job; or leaving it out
of the gate. **Recommendation: a `pnpm` script in the chain** — a check outside the gate is a check
that stops running, and `audit:0011` F1 is this repository's own worked example of exactly that.

### D3 — Does `atlas` stay the single entry point?

`task:0010` established `atlas` as the maintainer control surface and `bin/atlas` as a logic-free
adapter. It can dispatch to Python as easily as to `tsx`. **Recommendation: yes** — the user-facing
contract should not fracture because the implementation language did.

## Done when

- **AC-1:** Every file listed under "what moves" is gone from TypeScript, and no TypeScript module
  outside `extract.ts`, `author-year.ts` and `load.ts` imports anything citation-related.
- **AC-2:** BibTeX and CSL-JSON are produced by a maintained library, not hand-written
  serialization. A test proves the multi-author case that `6c4263e` fixed stays fixed.
- **AC-3:** HTML metadata is parsed with a real parser. The `citation_reference` trap — where a
  page's own bibliography carries other works' DOIs — is still covered by a test.
- **AC-4:** The existing `data/citations/sources.yaml` is read and written unchanged in shape; the
  786 already-resolved entries survive the port without re-resolution, proven by a byte comparison
  of the untouched entries.
- **AC-5:** The Python suite runs inside `pnpm verify` per D2, and fails the gate when it fails.
- **AC-6:** `atlas citations <verb>` still works for every verb that exists today, per D3.

## Completion evidence

_To be filled on completion. Each row must cite a criterion and durable evidence — a commit, a file
path, or a test name — not a narrative claim._

| Criterion | Evidence | Verified |
| --------- | -------- | -------- |
| AC-1      | —        | —        |
| AC-2      | —        | —        |
| AC-3      | —        | —        |
| AC-4      | —        | —        |
| AC-5      | —        | —        |
| AC-6      | —        | —        |

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
