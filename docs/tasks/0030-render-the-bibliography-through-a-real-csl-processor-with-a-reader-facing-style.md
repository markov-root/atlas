---
schema_version: 2
id: '0030'
uid: 'task-20260923T162121693301Z-cd14d224'
title: 'Render the bibliography through a real CSL processor with a reader-facing style switcher'
role: task
status: todo
summary: 'Replace the hand-rolled reference formatter with citeproc and vendored CSL styles, and let the reader pick one.'
created: '2026-09-23'
updated: '2026-09-23'
owner: Markov Grey
supersedes: ''
superseded_by: ''
engineering_document:
  version: 1
  contract_tier: full
  role: task
  id: '0030'
  uid: task-20260923T162121693301Z-cd14d224
  title: 'Render the bibliography through a real CSL processor with a reader-facing style switcher'
  state: todo
  authority:
    kind: work-state
    owner: Markov Grey
    scope: Reference rendering only - the store, extraction and resolvers are unchanged
  created: '2026-09-23'
  updated: '2026-09-23'
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
        criterion:AC-7,
      ]
    parent: '0021'
    depends_on: ['0029']
    size: m
    priority: p2
---

# Task 0030: Render the bibliography through a real CSL processor with a reader-facing style switcher

## Problem

`task:0021` phase 2 renders references with a formatter written by hand in
`src/lib/bibliography.ts` - `formatName`, `formatAuthors`, `formatYear` and a template that joins
them with periods. It produces one format, and that format is nobody's: it resembles APA without
being it.

**This is the same mistake `task:0029` existed to undo**, one layer up. Citation styles are a solved
problem with a specification (CSL), a public repository of ~2,600 curated style definitions, and
processors that implement them. Hand-rolling one means reimplementing name particles, disambiguation,
et-al thresholds, date precision and punctuation rules - badly, and only for the single style we
happened to write.

The owner asked to compare formats on 2026-09-23. Rendering the real store through `citeproc-py`
took minutes and needed **no adapter at all**, because `task:0021` D2 chose CSL for the store
precisely so this would be free. It also immediately exposed two data defects the hand-rolled
formatter had been hiding:

- **`Driessche, G. van . den .`** - the arXiv resolver puts "George van den" in `given`, so a real
  processor initialises the particles. The multi-word-family-name limitation `arxiv.py` documents,
  now visible in output.
- **A stray "Edition." in Chicago, and `Goodhart 1984` typed `document`** when it is a book chapter.
  CSL `type` drives style behaviour, and several entries carry a type that is merely plausible.

The owner's decision, 2026-09-23: **render several styles and let the reader switch.**

## Scope

Precompute every reference in every offered style at build time; ship a selector.

```
Python   sources.yaml + vendored .csl → data/citations/rendered.json
TypeScript   rendered.json → <Bibliography> with a style selector
```

This keeps `task:0029` D1's boundary exactly as it is - **Python owns metadata and output** - and
adds no runtime dependency to the site. The selector swaps pre-rendered strings; it does not run a
citation processor in the browser.

## Out of scope

- **Changing the in-text citation anchors.** They are `(Author, Year)` links in the prose, and a
  numeric style implies `[1]` markers, citation-order numbering, and a non-alphabetical list. That
  is a separate, larger change, and is the reason author-date styles are the default.
- **Merging duplicate sources.** Detection lives in the report; acting on it is `task:0031`.
- **Surfacing metadata completeness to readers.** See D6.

## Decisions

### D1 - Which styles? - **decided: APA, Chicago author-date, MLA, Nature, IEEE**

Two author-date (APA, Chicago), one humanities (MLA), two numeric (Nature, IEEE). The numeric two are
offered because a reader may want a reference to paste into a numeric-style paper, and are marked in
the UI as not matching the in-text anchors. Adding another is one `.csl` file.

### D2 - Vendor the styles or fetch them? - **decided: vendor**

Under `vendor/csl/`, with the upstream licence and attribution beside them. A build that reaches the
network is neither reproducible nor credential-free, and `CONTRIBUTING.md` promises a clone builds
offline. Zotero and Pandoc both vendor for the same reason.

CSL styles are **CC-BY-SA 3.0**. They remain separate works under their own licence, aggregated with
this repository rather than derived from it; `vendor/csl/README.md` carries the attribution and a
pointer upstream. This does not affect the licence of the Atlas itself.

### D3 - Where does the reader's choice live? - **decided: client-side, persisted**

The selector is a small client script that toggles which pre-rendered variant is visible, with the
choice in `localStorage` so it survives navigation. No server round trip, no build variant per
style, and the page works with JavaScript off by showing the default style.

### D5 - Is `rendered.json` committed? - **decided: yes**

This repository's rule is that derived outputs are gitignored, because
`data/citations/sources.yaml` is committed only for costing "real time and other people's rate
limits to rebuild" while the rest regenerate in seconds. By that rule `rendered.json` should be
ignored: it is deterministic, offline, and takes 49 seconds.

It is committed anyway, because the alternative breaks a promise made elsewhere. The site *serves*
this file, so gitignoring it means `pnpm build` must run `atlas citations render` - which puts
Python on the critical path of a build that `CONTRIBUTING.md` and `task:0029` both state does not
need it. Trading a documented, load-bearing property for 911 KB of infrequent churn is the wrong way
round.

It changes only when the store changes, which is when `sources.yaml` already produces a far larger
diff.

### D6 - Does the site show how complete its metadata is? - **decided: no**

Owner decision, 2026-09-23, correcting a design error in the first implementation.

The first cut surfaced resolution state to readers: a "945 of 945 sources · 132 awaiting full
metadata" line, a "Full metadata only" filter, and a note explaining that a bare address meant the
title had not been looked up. All of it was removed.

The reasoning is that **metadata completeness is a pre-publication condition, not a product
feature**. The site will not ship until every source is resolved, so a control that filters on it is
scaffolding that would be dead on the day it went live - and a note explaining the gap advertises a
defect to a reader who cannot act on it. Where the gap is genuinely useful is in
`atlas citations report`, which is for maintainers and already carries it.

The general form, worth stating because it recurs: **a measurement that helps the people building a
thing does not belong in the thing.** The completeness figure is real and useful; its audience is
the maintainer, not the reader.

### D4 - What happens to the hand-rolled formatter? - **decided: deleted**

`formatName`, `formatAuthors`, `formatYear` and the container/terminal-punctuation trimming go.
What stays is the part that is this project's judgement rather than bibliographic style: which
entries a section cites, dedup by canonical URL, sort order, the unresolved-entry fallback to a URL,
and the `implausibleName` guard from `audit:0011` F11 - a guard against corrupt _data_ still earns
its place regardless of who formats it.

## Still to build

Shipped so far: the render command, the vendored styles, the switcher, and a first search box with a
sort dropdown. The control surface the owner asked for is larger than that, and is deliberately
recorded here rather than half-built.

### One control panel, not scattered inputs

Search, sort, filter and grouping belong in a single panel rather than as separate widgets accreted
over the list.

- **Search** - currently one box matching any term against a concatenated blob. It should be
  explicit about what it matches, and match per field.
- **Filter** - not yet built. By **author**, **publication/source** (the container - arXiv, Nature,
  LessWrong), **year range**, and **type** (paper, blog post, video, book). These are facets, so
  each should show how many entries it would leave.
- **Sort** - author, year, title exist. Add source/publication.
- **Group by** - not yet built, and the most requested. A reader should be able to see the list
  **grouped by chapter and section** - mirroring how they met the citations - or **flat across the
  whole book**. Flat is the current behaviour and stays the default on `/bibliography`.
- **Icons** - `~/Images/Icons` holds 206 SVGs; use them rather than adding an icon dependency.
  The project already has `astro-icon` for its existing UI, so whichever is used should be one
  choice, not both.

### Open questions for that work

- Does grouping by chapter change the URL, so a grouped view is linkable?
- With 945 entries, does faceting stay client-side? It is display-only today, which is what keeps it
  instant; a facet count per option is more work per keystroke.
- Does the section-level list get any of this, or does it stay a plain list? (Probably plain - a
  30-entry list does not need a control panel.)

## Done when

- **AC-1:** `atlas citations render` writes `data/citations/rendered.json` holding every store entry
  in every style in D1, produced by `citeproc-py` against vendored `.csl` files. Deterministic: the
  same store and styles give byte-identical output.
- **AC-2:** The three surfaces from `task:0021` D5 render from that file, and a selector switches
  style without a page load. The choice persists across navigation.
- **AC-3:** The hand-rolled formatter is gone per D4, and no test asserts on a format string this
  repository produces by hand.
- **AC-4:** A missing or stale `rendered.json` degrades to the store-derived fallback rather than
  failing the build, per `task:0021` D4. A contributor who has not run the command still gets a
  working site.
- **AC-5:** `vendor/csl/` carries the upstream licence and attribution, and `pnpm verify` passes with
  no network access.
- **AC-6:** No reader-facing surface reports metadata completeness, per D6.
- **AC-7:** `/bibliography` and the chapter pages carry one control panel providing search, filter
  (author, source, year, type), sort, and a group-by-chapter/flat toggle.

## Completion evidence

_To be filled on completion. Each row must cite a criterion and durable evidence - a commit, a file
path, or a test name - not a narrative claim._

| Criterion | Evidence | Verified |
| --------- | -------- | -------- |
| AC-1      | -        | -        |
| AC-2      | -        | -        |
| AC-3      | -        | -        |
| AC-4      | -        | -        |
| AC-5      | -        | -        |
| AC-6      | -        | -        |
| AC-7      | -        | -        |

## Authority and inputs

- Owner decision, 2026-09-23, after comparing seven styles rendered from the real store.
- `task:0021` D2 - CSL as the store schema. This task is the payoff that choice was made for.
- `task:0029` D1 - the language boundary this work sits inside, unchanged.
- `audit:0011` F11 - why the `implausibleName` guard survives D4's deletion.
- `src/lib/bibliography.ts` - the formatter being replaced.
- CSL styles repository, CC-BY-SA 3.0: https://github.com/citation-style-language/styles

## Note on why this is worth doing

The hand-rolled formatter works. It is also 60 lines reimplementing a specification, in a repository
that has already paid once for exactly that - `6c4263e`, a BibTeX serializer that shipped a
structural bug across 303 entries. The store was designed in CSL so that a processor could be dropped
in without an adapter, and that turned out to be true on the first attempt.
