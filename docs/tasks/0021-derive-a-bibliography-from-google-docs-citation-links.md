---
schema_version: 2
id: '0021'
uid: 'task-20260921T210518128882Z-6703b7f9'
title: 'Derive a bibliography from Google Docs citation links'
role: task
status: todo
summary: 'Parent record: turn the 1792 hyperlinked citations already in the Google Docs into a derived bibliography, decomposed into banked changes.'
created: '2026-09-21'
updated: '2026-09-21'
owner: Markov Grey
supersedes: ''
superseded_by: ''
engineering_document:
  version: 1
  contract_tier: full
  role: task
  id: '0021'
  uid: task-20260921T210518128882Z-6703b7f9
  title: 'Derive a bibliography from Google Docs citation links'
  state: todo
  authority:
    kind: work-state
    owner: Markov Grey
    scope: Parent design record; implementation is delegated to child tasks 0025-0027
  created: '2026-09-21'
  updated: '2026-09-21'
  transition_history: unverified
  transitions: []
  relationships: []
  details:
    criteria: [criterion:AC-1, criterion:AC-2, criterion:AC-3, criterion:AC-4]
    size: l
    priority: p2
    atomic_large:
      rationale: 'Parent epic. Implementation is split into child tasks 0025-0027; this record holds the design, the decisions, and the dependency graph that binds them.'
      rollback: 'Each child bank lands independently and is revertible on its own; nothing in phase 1 changes rendered output.'
      checkpoints:
        [
          '0025 pure core lands',
          '0026 CLI and report land',
          '0027 resolvers land',
          'phase 2 decomposed separately',
        ]
---

# Task 0021: Derive a bibliography from Google Docs citation links

## Problem

The textbook cites heavily and has no bibliography. **The people writing edition 2 want one** - that
is the reason this work exists, and it makes the authors, not readers, the first customer.

Hand-maintaining a reference list is the wrong fix: it drifts from the prose immediately, and it
multiplies by edition and by language.

**The data needed to avoid that is already present and already cached.** Measured across the eight
chapters in `.cache/docs/` on 2026-09-21:

| Measure                             | Count             |
| ----------------------------------- | ----------------- |
| Citation link instances             | **1,792**         |
| Unique URLs                         | **1,001**         |
| URLs cited more than once           | 336               |
| URLs cited in more than one chapter | 98                |
| Anchor texts in author-year form    | **1,735** (96.8%) |

Every one is already parsed into a `Link` node carrying `{href, content}`
(`src/textbook-loader/transformer.ts:554`). Extraction needs **no change to the Google Docs fetch
path** and no new credentials.

Footnotes carry citations too: **36 footnotes, 16 containing links.**

**Correction, 2026-09-21.** An earlier version of this record claimed 9 of those were "plain-text
author-year citations with no link at all". That was a measurement error - the original scan counted
parenthesised author-year patterns in footnote text without checking whether a hyperlink covered the
same span. Verified anchor-by-anchor during `task:0025`: **all 9 are hyperlinked**
(`(METR, 2024)`, `(Ewing, 2017)`, `(Critch, 2023)`, `(Piper, 2023)`, `(Prime Intellect, 2025)`,
`(Wang and Gleave et al., 2022)`, `(Anthropic, 2024)`, `(Anthropic, 2025)`, `(Rodriguez, 2020)`).
There is no unlinked-citation population in the current corpus. The handling is still built, because
it is cheap and the alternative is silently dropping the first one an author writes - but it is a
guard, not a backlog.

Resolvability of the 1,001 unique URLs:

| Source                                                   | Unique | Automatic metadata       |
| -------------------------------------------------------- | -----: | ------------------------ |
| arXiv                                                    |    347 | arXiv API                |
| DOI-bearing (PubMed, Nature, IEEE, SSRN, …)              |     35 | Crossref                 |
| YouTube                                                  |     15 | oEmbed                   |
| Other web (Alignment Forum, LessWrong, Epoch, lab blogs) |    604 | Open Graph + anchor text |

Because 96.8% of anchor texts already carry author and year, a useful bibliography is achievable with
**zero network calls**. Enrichment upgrades quality; it is not a precondition.

No chapter contains a `Bibliography` or `References` heading today, so nothing conflicts.

## Decisions - recorded 2026-09-21

All six are settled by the owner. They are recorded here rather than left open, and child tasks
inherit them.

| #   | Question               | Decision                                                                                                              |
| --- | ---------------------- | --------------------------------------------------------------------------------------------------------------------- |
| D1  | Entry identity         | **Global entry per source**, with per-`(edition, language, chapter, section)` instances. A URL does not translate.    |
| D2  | Data format            | **CSL** - CSL-YAML for storage, CSL-JSON compiled. No bespoke schema.                                                 |
| D3  | Archival               | **Separate concern**, exposed as `atlas citations archive`. Not in phase 1.                                           |
| D4  | Unresolvable citations | **Warn, never block a deploy.**                                                                                       |
| D5  | Placement              | Section-level after `#footnotes`; chapter-level on the introduction page's download panel; site-wide `/bibliography`. |
| D6  | Command naming         | **Plural** - `atlas citations <verb>`.                                                                                |

### D4 carries an implementation obligation

`audit:0010` F2 established that this repository's existing warn-and-continue posture **already ships
404s to production**, because warnings scroll past in a build log and nobody reads them. "Warn" is
therefore only a real decision if the warning survives the build: a committed report artifact, a
one-line count in build output, and a command that prints it. Warning into a log stream is
indistinguishable from silence, and choosing D4 is not choosing that.

### D5 - why not the auto-injected table-of-contents entry

The alternative considered was injecting a bibliography as a pseudo-section at the end of the ToC,
skipped by previous/next navigation. **Rejected.** Previous/next is derived from `allSections`
(`src/layouts/Reader.astro:41-42`), so a virtual section must be special-cased there _and_ in every
other system keyed by section: audio filenames, committed `.words.json` timings, the Algolia index,
reading time, OG image generation, markdown export, and the URL space. It also collides directly with
the content identity key in `task:0014`. That is a large blast radius to solve a placement question
that the existing download panel on the introduction page
(`src/pages/chapters/[version]/[chapter]/[section].astro:222-260`) already answers.

## Scope

### Phase 1 - a bibliography that exists as a file

**Owner's direction: "before getting it to appear on site, the first set is to actually just have the
full bibliography across the book exportable into a sensible file. All the UI/UX stuff is later."**

Phase 1 changes **no rendered output**. That is its safety property: nothing a reader sees can break,
so it can land while `src/` questions remain open.

### Phase 2 - rendering

Deferred, and deliberately not decomposed yet. Covers the three D5 surfaces. Decompose it only once
phase 1 has produced real data, because the shape of that data should inform the rendering, not the
reverse.

## Decomposition into banked changes

Each bank is independently landable, independently revertible, and independently verifiable. Banks
are grouped into three child tasks.

| Bank   | Change                                                             | Depends on | Child task  |
| ------ | ------------------------------------------------------------------ | ---------- | ----------- |
| **B1** | Declare `@types/node`; bring `cli/` into a typechecked path        | -          | `task:0020` |
| **B2** | Citation extraction: pure function over AST nodes                  | -          | `task:0025` |
| **B3** | URL canonicalization: pure                                         | -          | `task:0025` |
| **B4** | CSL-YAML store, entry identity, read/write                         | B3         | `task:0025` |
| **B5** | `atlas citations extract` - job 1, offline, writes URL-keyed stubs | B2, B4     | `task:0026` |
| **B6** | `atlas citations report` - unresolved, malformed, unclassifiable   | B5         | `task:0026` |
| **B7** | `atlas citations export` - BibTeX and CSL-JSON                     | B4         | `task:0026` |
| **B8** | Resolvers: arXiv, Crossref, oEmbed, Open Graph - one interface     | B4         | `task:0027` |
| **B9** | `atlas citations resolve` - job 2, incremental, idempotent         | B4, B8     | `task:0027` |

### Causal dependency graph

```
B1 (precondition - cli/ typecheck)
      │
      ├── B2 ─────────────┐
      │                   ├──> B5 ──> B6
      └── B3 ──> B4 ──────┤
                          ├──> B7
                          └──> B8 ──> B9
```

**Critical path:** B1 → B3 → B4 → B5 → B6. Everything else hangs off B4.

**What can genuinely run in parallel:** B2 alongside B3 once B1 lands; B7 alongside B5/B6 once B4
lands; and the four resolvers inside B8 are independent of one another, which is the single most
parallelizable unit in the whole task.

**What must not be parallelized:** B4. It fixes entry identity, which D1 flags as the one
irreversible choice - every citation instance points at it, and changing it later rewrites every
reference in every chapter and language. One author, reviewed, before anything depends on it.

## Interaction with other work

- **`task:0013` (Google Docs migration) - no conflict, and this is a genuine benefit of deriving
  rather than authoring.** New documents mean extraction re-runs and the bibliography is correct.
  There is no list to migrate.
- **`task:0023` (R2 custody) - no interaction.** Phase 1 touches no audio, no R2, no CDN. This is one
  of the few pieces of work not blocked by the custody problem, which is an argument for doing it now.
- **`task:0014` (language and edition)** - D1 must stay consistent with the content identity key. The
  split is clean: entries are global, instances carry the key.
- **`task:0015` (discriminated-union AST)** - B2 is a good first consumer: read-only, small, and a
  low-risk proof of that design before larger content types depend on it.
- **`task:0018` (lib boundary)** - B2 and B3 are build-time, not browser, code. They should land on
  the correct side of that boundary from the start rather than being moved later.
- **`task:0024` (build resources)** - phase 1 adds no build-time network calls and no per-page weight.

## Out of scope

- **Changing how authors write citations in Google Docs.** This must work against the docs as they
  are. The scan found real inconsistencies (`Burns et. al. 2023`, `Chen et al., 2024)` with a stray
  paren, missing-comma variants); the report **surfaces** these, it does not require them fixed first.
- **Archival** - D3, later, as `atlas citations archive`.
- **All rendering** - phase 2.
- **Replacing OWID iframes with self-hosted datasets.** Related in spirit, separate work.

## Known edge cases

Recorded so they are not mistaken for defects later.

1. **Messy anchor text stops mattering.** Entries are keyed by canonical URL and displayed from
   resolved metadata, so `Chollet, 2019`, `Chollet 2019` and `Burns et. al. 2023` collapse to one
   consistently-rendered entry. Inconsistent input, consistent output.
2. **Preprint versus published version is a real duplicate.** Canonicalization handles
   `arxiv.org/abs/X` versus `/pdf/X`. It does **not** handle one chapter citing an arXiv preprint and
   another citing the journal DOI for the same work - different URLs, one paper. Accept as duplicates
   in phase 1 and add a manual alias file; automatic detection would be wrong often enough to be
   worse than the duplicate.
3. **A footnote citation with no hyperlink would have no URL to key on.** The corpus currently has
   zero of these (see the correction above), but the state exists so that the first one is reported
   rather than dropped.
4. **Node content lives in two places in this AST.** `children` holds the obvious case, but
   `Figure.caption`, `Iframe.caption`, `Video.caption`, `Quote.sourceUrl` and `Definition.source` put
   a `SpanGroup` **node inside an attribute** (`transformer.ts:288-345`). A `children`-only traversal
   silently misses 20% of all citations. Found the hard way in `task:0025`; see `audit:0011` F5.

## Done when

This parent record is complete when its children are, and when phase 2 has been decomposed on the
evidence phase 1 produces.

- **AC-1:** `task:0025`, `task:0026` and `task:0027` are complete, each against its own criteria.
- **AC-2:** A single command produces the whole book's bibliography as a file, from the committed
  store, with no credentials and no network - the owner's stated phase-1 goal.
- **AC-3:** The edition-2 authors have used the report at least once, and their feedback is recorded
  here. They are the stated customer; shipping without checking with them would make this record's
  own premise unverified.
- **AC-4:** Phase 2 is decomposed into banks against the three D5 surfaces, informed by phase 1's
  actual data rather than by this record's assumptions.

## Completion evidence

_To be filled on completion. Each row must cite a criterion and durable evidence - a commit, a file
path, or a recorded owner decision - not a narrative claim._

| Criterion | Evidence | Verified |
| --------- | -------- | -------- |
| AC-1      | -        | -        |
| AC-2      | -        | -        |
| AC-3      | -        | -        |
| AC-4      | -        | -        |

## Authority and inputs

- Corpus measurement, 2026-09-21, over the eight tabs in `.cache/docs/`. Counts are reproducible from
  those files; the anchor-shape classification is approximate at the margin.
- Footnote measurement, same date: 36 footnotes, 16 with links, 9 unlinked author-year citations.
- `src/textbook-loader/transformer.ts:554` - `Link` nodes carry `{href, content}`.
- `src/textbook-loader/renderers/audio/text-renderer.ts:6` - `stripCitations` already encodes an
  author-year regex for the audio path. Extraction must not invent a second, divergent one.
- `src/textbook-loader/gdocsdk.ts:41` - the cache pattern this design mirrors.
- `src/layouts/Reader.astro:41-42` - previous/next derivation; the reason D5 rejects a virtual section.
- `src/pages/chapters/[version]/[chapter]/[section].astro:222-260,316` - the download panel and the
  `#footnotes` block; the two surfaces D5 selects.
- `src/pages/chapters/[chapter]/index.astro:36` - chapter index is a 301 redirect, so no chapter
  landing page exists to hold a chapter bibliography.
- `audit:0010` F2 - why D4 carries an implementation obligation.
- `audit:0011` F1 - the `cli/` typecheck gap that B1 closes.
