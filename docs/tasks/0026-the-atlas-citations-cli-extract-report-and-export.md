---
schema_version: 2
id: '0026'
uid: 'task-20260921T214512585242Z-e903df50'
title: 'The atlas citations CLI extract report and export'
role: task
status: todo
summary: 'Expose extraction as commands, and deliver the report the edition-2 authors actually asked for plus a whole-book export file.'
created: '2026-09-21'
updated: '2026-09-22'
owner: Markov Grey
supersedes: ''
superseded_by: ''
engineering_document:
  version: 1
  contract_tier: full
  role: task
  id: '0026'
  uid: task-20260921T214512585242Z-e903df50
  title: 'The atlas citations CLI extract report and export'
  state: todo
  authority:
    kind: work-state
    owner: Markov Grey
    scope: Banks B5, B6, B7 of task:0021 — CLI surface only, no network and no rendering
  created: '2026-09-21'
  updated: '2026-09-22'
  transition_history: unverified
  transitions: []
  relationships: []
  details:
    criteria: [criterion:AC-1, criterion:AC-2, criterion:AC-3, criterion:AC-4, criterion:AC-5]
    parent: '0021'
    depends_on: ['0025']
    size: m
    priority: p2
---

# Task 0026: The atlas citations CLI extract report and export

## Problem

`task:0025` produces importable functions. This task gives them an invocation, and delivers the two
artifacts the work is actually for.

**The report is the point.** The edition-2 authors asked for a bibliography; what helps them _while
writing_ is not a rendered list but an answer to "which of my citations are broken, unresolved, or
malformed". The corpus already contains `Burns et. al. 2023`, `Chen et al., 2024)` with a stray
paren, and missing-comma variants. That report is useful the day it exists, before anything renders.

**The export is the owner's stated phase-1 goal:** "the full bibliography across the book exportable
into a sensible file."

## Scope

Three commands, under the plural noun fixed by `task:0021` D6.

| Command                   | Job                                                         | Network |
| ------------------------- | ----------------------------------------------------------- | ------- |
| `atlas citations extract` | Job 1 — walk the AST, write URL-keyed stubs to the store    | none    |
| `atlas citations report`  | Unresolved, malformed, unclassifiable; counts and locations | none    |
| `atlas citations export`  | Whole-book bibliography as BibTeX and CSL-JSON              | none    |

**`extract` and `resolve` are deliberately separate commands, not two jobs behind one verb.**
`extract` is pure, offline, instant and deterministic; `resolve` (`task:0027`) is networked, slow,
rate-limited and partially-failing. Merging them would make the safe command inherit the unsafe one's
caveats, so that running the fast one always requires thinking about the slow one.

### The D4 obligation

`task:0021` D4 chose warn-never-block, and records why that is only real if the warning survives the
build: `audit:0010` F2 found this repository's existing warn-and-continue posture already ships 404s
because warnings scroll past in a log. So the report must be a **durable artifact**, not log output,
and the build must emit a one-line count pointing at it.

## Out of scope

- **Any network call.** All three commands work from the committed store. `task:0027` owns the
  network.
- **`atlas citations archive`** — `task:0021` D3, later. When it lands it writes to a third party and
  must be dry-run by default with `--yes` to act, per `task:0010`'s convention.
- **All rendering** — phase 2.
- **Wiring `extract` into the build.** Phase 1 changes no build output. Running it is a maintainer
  action until phase 2 needs it.

## Done when

- **AC-1:** `atlas citations extract` populates the store from the eight cached chapters with no
  credentials and no network, and is idempotent — a second run with unchanged input changes no file.
- **AC-2:** `atlas citations report` lists every unresolved, malformed and unclassifiable citation
  with enough location information for an author to find it in the Google Doc. Includes the 9
  unlinked footnote citations.
- **AC-3:** The report is written as a durable artifact, not only printed. A build that would warn
  emits a one-line count naming the artifact.
- **AC-4:** `atlas citations export` produces the whole book's bibliography as both BibTeX and
  CSL-JSON, from the committed store, with no credentials and no network. The BibTeX file imports
  into a reference manager without error.
- **AC-5:** Command logic is importable and unit-tested — functions, not script bodies — matching the
  separation `task:0010` AC-2 requires and `cli/commands/docs-check.ts` already demonstrates.

## Completion evidence

All five criteria met. Built by a delegated agent; every claim below was re-verified against disk by
the coordinator, not accepted from the report.

| Criterion | Evidence                                                                                                                                                                                                       | Verified   |
| --------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- |
| AC-1      | `cli/commands/citations/extract-cmd.ts`. Idempotence proven twice: a test, and two real corpus runs producing byte-identical `sources.yaml` (md5 `54af5a44…` both times). 948 sources, no credentials, no network. | 2026-09-22 |
| AC-2      | `report.ts` — 948 unresolved · 0 malformed · 47 content links · 0 unlinked · **76 inconsistent spellings**, each with chapter, section and anchor text.                                                            | 2026-09-22 |
| AC-3      | Report written to `data/citations/citation-report.md` (110 KB) as a durable file; the command prints a one-line summary naming it. Not log output.                                                                | 2026-09-22 |
| AC-4      | `export.ts` → 948-entry `bibliography.bib` and `bibliography.json` from the committed store, offline. BibTeX keys are content-derived, so adding an entry never renumbers another.                                 | 2026-09-22 |
| AC-5      | All logic is importable and unit-tested: 37 tests across four files, exercising pure functions with constructed input.                                                                                            | 2026-09-22 |

**A real defect was caught by running the command rather than only its tests:** the first BibTeX
export emitted field lines with no trailing comma, which strict parsers reject. Fixed, with a
regression test named for the behaviour.

## Authority and inputs

- `task:0021` — parent; D4 and D6 bind this task.
- `task:0025` — supplies extraction, canonicalization and the store. Hard dependency.
- `task:0010` — the `atlas` control surface design; command conventions and the logic/adapter split.
- `cli/commands/docs-check.ts` — the working precedent for a pure, unit-tested command.
- `audit:0010` F2 — why AC-3 exists.
- `audit:0011` F1 — `cli/` has no type coverage; B1 should land before this task adds to `cli/`.
