---
schema_version: 2
id: "0034"
uid: "task-20260923T210607192129Z-1be77430"
title: "Include the bibliography in the chapter PDF"
role: task
status: done
summary: "The chapter PDF ends without a reference list, so the offline artifact cannot be checked against its sources."
created: "2026-09-23"
updated: '2026-09-24'
owner: Markov Grey
supersedes: ""
superseded_by: ""
engineering_document:
  version: 1
  contract_tier: full
  role: task
  id: "0034"
  uid: task-20260923T210607192129Z-1be77430
  title: "Include the bibliography in the chapter PDF"
  state: done
  authority:
    kind: work-state
    owner: Markov Grey
    scope: The Typst chapter PDF renderer only
  created: "2026-09-23"
  updated: '2026-09-24'
  transition_history: complete
  transitions:
    - from: todo
      to: done
      at: '2026-09-24'
      reason: References section built, compiled and read; every input already existed.
  relationships: []
  details:
    criteria: [criterion:AC-1, criterion:AC-2, criterion:AC-3]
    parent: "0021"
    depends_on: ["0030"]
    size: s
    priority: p2
    # depends_on: ["0042"]
    # parent: "0090"
    # touches: ["software-engineering/public/**", "software-engineering/dev/tests/**"]
    # size: m
    # priority: p1
    # Under the agent_scheduling profile, an oversized task warns (advisory) and prompts a split.
    # Justify legitimately atomic large work with an exception that suppresses the prompt:
    # atomic_large:
    #   rationale: "why this cannot be split into vertical slices"
    #   rollback: "how to revert / verify if it goes wrong"
    #   checkpoints: ["intermediate checkpoint 1", "intermediate checkpoint 2"]
---

# Task 0034: Include the bibliography in the chapter PDF

## Problem

Owner instruction, 2026-09-23: "the pdf should contain the bibliography proper now."

`task:0021` D5 named three reader-facing surfaces and all three are web pages. The chapter PDF is the
fourth, and it is the one where a missing reference list matters most: a PDF is what someone reads on
a plane, prints for a reading group, or cites from. It currently ends after the last section, with
in-text citations pointing at nothing the document contains.

Every input already exists. `chapterReferences()` returns the chapter's sources, deduplicated and
alphabetised; `data/citations/rendered.json` holds each of them pre-rendered in five CSL styles. The
Typst renderer simply never asked.

## Scope

A references section appended to each chapter PDF by the Typst renderer
(`src/textbook-loader/renderers/pdf/`), built from `chapterReferences()`.

## Out of scope

- **Numbered in-text citations.** The prose cites by author and year, and switching to `[1]` markers
  is `task:0030`'s recorded non-goal for the same reason it is one here.
- **A whole-book PDF.** No such artifact exists today.

## Decisions required before execution

### D1 - Which style does a PDF use? **Decided: the house Basic style.**

The web offers six and lets the reader choose (`task:0030` D3). A PDF cannot: it is rendered once.
**Recommend the house Basic style**, matching the site's default, unless the owner wants a PDF to
look like a paper rather than like the Atlas - in which case APA is the obvious alternative and is
already rendered.

**Taken as recommended, 2026-09-24.** It is also the only style that needs no `rendered.json`, so
AC-3 comes out true with one code path instead of two: a contributor who has never run
`atlas citations render` still gets a full reference list rather than a degraded one.

### D2 - Does a PDF link out? **Decided: both, always.**

Typst can make a URL clickable. A printed page cannot, so the address has to be visible text as well
for the reference to be usable on paper.

## Done when

- **AC-1:** Every chapter PDF ends with a references section listing that chapter's sources, in the
  style D1 selects.
- **AC-2:** A chapter citing nothing renders no empty heading, matching the web component's rule that
  a heading over an empty list reads as a broken page.
- **AC-3:** The renderer degrades per `task:0021` D4: a missing or stale `rendered.json` costs the PDF
  its reference list, never the build.

## Completion evidence

Completed 2026-09-24.

| Criterion | Evidence | Verified |
| --------- | -------- | -------- |
| AC-1      | Chapter 1 compiles to **111 pages ending in a References section**, 7 pages of it, in the Basic style. Rendered to PNG and read: hanging indent, linked titles, grey addresses beneath. Covered by `renderer.test.ts`, `the chapter bibliography (task:0034)`. | yes |
| AC-2      | `renders no heading for a chapter that cites nothing (AC-2)` - the same rule the Acknowledgements block beside it already follows. | yes |
| AC-3      | `renderReferences` catches and returns an empty string, so a missing or unreadable store costs the PDF its list and never the build (`task:0021` D4). The Basic style is computed from the store's structured fields, so a stale or absent `rendered.json` changes nothing here. | yes |

Verified end to end rather than only in a unit test: the generated Typst was compiled with the same
`typst compile --font-path src/fonts --root src -` invocation the renderer uses, and the resulting
pages were read as images.

### Where it sits, and one thing to know

References come **after** Acknowledgements, on their own page, and are outlined so they appear in the
table of contents. A source cited in three sections is listed once - `chapterReferences()` already
deduplicates, which is why this task needed no new bibliography logic at all.

**The PDF filename is keyed on `chapter.contentHash`, which is derived from the chapter's content and
not from the renderer's output format.** Changing this renderer therefore mints no new filename: CI
regenerates anyway because `.cache/uc` starts empty, and `pushPublicFiles` overwrites the CDN copy
under the same name, so readers get the new file. A developer with a warm `.cache/uc` will keep the
old PDF until they clear it. That is a pre-existing property of every renderer change, noted here
because this is the first one to add a whole section.

## Authority and inputs

- Owner instruction, 2026-09-23.
- `src/lib/bibliography.ts` - `chapterReferences()`, already used by the chapter page.
- `data/citations/rendered.json` - the pre-rendered styles, from `atlas citations render`.
- `task:0021` D5 (the reader-facing surfaces), D4 (warn-never-block).
