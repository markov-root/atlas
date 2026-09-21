---
schema_version: 2
id: '0025'
uid: 'task-20260921T214511939752Z-5b969e58'
title: 'Citation extraction canonical URL identity and the CSL store'
role: task
status: todo
summary: 'The pure core of the bibliography: extract citations from the AST, canonicalize URLs, and define the CSL entry identity everything else points at.'
created: '2026-09-21'
updated: '2026-09-21'
owner: Markov Grey
supersedes: ''
superseded_by: ''
engineering_document:
  version: 1
  contract_tier: full
  role: task
  id: '0025'
  uid: task-20260921T214511939752Z-5b969e58
  title: 'Citation extraction canonical URL identity and the CSL store'
  state: todo
  authority:
    kind: work-state
    owner: Markov Grey
    scope: Banks B2, B3, B4 of task:0021 — pure logic and the storage schema, no CLI and no rendering
  created: '2026-09-21'
  updated: '2026-09-21'
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
    size: m
    priority: p2
---

# Task 0025: Citation extraction canonical URL identity and the CSL store

## Problem

`task:0021` establishes that 1,792 citations already exist as `Link` nodes in the parsed AST, and
that a bibliography should be derived from them rather than authored. This task builds the part that
everything else depends on: turning those nodes into citation instances, reducing many URL spellings
of one source to one identity, and defining where entries live.

**B4 is the irreversible piece.** `task:0021` D1 fixes entry identity as a global entry per source.
Every citation instance in every chapter and every future language points at it. Changing the key
later rewrites all of them. It therefore gets written once, by one author, and reviewed before
anything depends on it — it is explicitly excluded from parallelization.

## Scope

### B2 — extraction

A pure function from AST nodes to citation instances. No file I/O, no network.

It must classify, because not every link is a citation: the corpus contains content links
(`available here`, `Biological Weapons Convention`) and at least one image URL
(`upload.wikimedia.org/…MNIST_dataset_example.png`) alongside the 1,735 author-year citations.

It must also cover **footnotes**, which the inline path does not reach: 36 footnotes, 16 with links,
and **9 plain-text author-year citations with no URL at all**. The last group cannot be keyed by URL
and must surface as an explicit unresolved state, never be silently dropped.

**Reuse, do not duplicate, the existing author-year pattern.**
`src/textbook-loader/renderers/audio/text-renderer.ts:6` already encodes one for `stripCitations`.
Two divergent regexes for "what a citation looks like" is a defect waiting to happen; either share
one or record why they must differ.

### B3 — canonical URL identity

A pure function reducing URL spellings to one key. At minimum: `arxiv.org/abs/X` versus `/pdf/X`
versus versioned `vN`; `doi.org` prefix variants; scheme and trailing-slash normalization; tracking
parameter removal.

### B4 — the CSL store

CSL-YAML files, keyed by canonical URL, holding whatever metadata is known — which for a
freshly-extracted entry is only the URL and the observed anchor text.

## Out of scope

- **Any CLI command** — `task:0026`. This task ships importable functions and their tests.
- **Any network call or resolver** — `task:0027`.
- **All rendering** — phase 2 of `task:0021`.
- **Resolving the preprint-versus-published duplicate** (`task:0021` edge case 2). Accept duplicates;
  leave a documented place for a manual alias file.

## Placement

Extraction and canonicalization are **build-time content-pipeline code, not browser code**. They
belong beside the other loader logic (`src/textbook-loader/`), not in `cli/`, because phase 2 will
need them inside the build and a later move would be gratuitous churn. `task:0018` is drawing exactly
this boundary; this code should land on the correct side of it the first time.

This is the only part of phase 1 that adds files under `src/`. It adds new modules and changes no
existing behaviour.

## Done when

- **AC-1:** Extraction is a pure function with no I/O, unit-tested against fixtures covering: an
  author-year citation, a non-citation content link, an image URL, a footnote citation with a link,
  and a footnote citation without one.
- **AC-2:** Run over the eight cached chapters, extraction reports counts reconcilable with
  `task:0021`'s measurements — approximately 1,792 instances over approximately 1,001 unique URLs.
  Divergence is explained, not silently accepted.
- **AC-3:** Canonicalization is unit-tested, and `arxiv.org/abs/X`, `arxiv.org/pdf/X` and
  `arxiv.org/abs/Xv2` provably resolve to one key. The deduplication effect is reported as a number.
- **AC-4:** The store round-trips: an entry written as CSL-YAML and read back is unchanged, and the
  file is legible and hand-editable in a diff.
- **AC-5:** The 9 unlinked footnote citations produce an explicit unresolved state that a later
  report can surface. A test asserts they are not dropped.
- **AC-6:** Exactly one author-year pattern exists in the codebase, or the reason two must differ is
  recorded at both sites.

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

- `task:0021` — parent; decisions D1, D2 and D6 bind this task.
- `src/textbook-loader/transformer.ts:554` — `Link` node shape.
- `src/textbook-loader/renderers/audio/text-renderer.ts:6` — the existing author-year pattern.
- `src/textbook-loader/index.d.ts` — `Section`, `FootnoteData`, `Node` types.
- `task:0018` — the build-time versus browser boundary this code must respect.
- CSL specification — the entry schema; do not invent fields it already defines.
