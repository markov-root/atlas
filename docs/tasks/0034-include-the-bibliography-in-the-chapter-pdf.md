---
schema_version: 2
id: "0034"
uid: "task-20260923T210607192129Z-1be77430"
title: "Include the bibliography in the chapter PDF"
role: task
status: todo
summary: "The chapter PDF ends without a reference list, so the offline artifact cannot be checked against its sources."
created: "2026-09-23"
updated: "2026-09-23"
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
  state: todo
  authority:
    kind: work-state
    owner: Markov Grey
    scope: The Typst chapter PDF renderer only
  created: "2026-09-23"
  updated: "2026-09-23"
  transition_history: unverified
  transitions: []
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

### D1 - Which style does a PDF use?

The web offers six and lets the reader choose (`task:0030` D3). A PDF cannot: it is rendered once.
**Recommend the house Basic style**, matching the site's default, unless the owner wants a PDF to
look like a paper rather than like the Atlas - in which case APA is the obvious alternative and is
already rendered.

### D2 - Does a PDF link out?

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

_To be filled on completion._

| Criterion | Evidence | Verified |
| --------- | -------- | -------- |
| AC-1      | -        | -        |
| AC-2      | -        | -        |
| AC-3      | -        | -        |

## Authority and inputs

- Owner instruction, 2026-09-23.
- `src/lib/bibliography.ts` - `chapterReferences()`, already used by the chapter page.
- `data/citations/rendered.json` - the pre-rendered styles, from `atlas citations render`.
- `task:0021` D5 (the reader-facing surfaces), D4 (warn-never-block).
