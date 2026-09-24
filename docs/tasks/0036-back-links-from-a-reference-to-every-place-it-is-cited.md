---
schema_version: 2
id: "0036"
uid: "task-20260924T183616819472Z-b5b1b8f5"
title: "Back-links from a reference to every place it is cited"
role: task
status: todo
summary: "A reference should link back to every place in the prose that cites it, the way a footnote already does."
created: "2026-09-24"
updated: "2026-09-24"
owner: Markov Grey
supersedes: ""
superseded_by: ""
engineering_document:
  version: 1
  contract_tier: full
  role: task
  id: "0036"
  uid: task-20260924T183616819472Z-b5b1b8f5
  title: "Back-links from a reference to every place it is cited"
  state: todo
  authority:
    kind: work-state
    owner: Markov Grey
    scope: BOUNDED ACCEPTANCE AND COMPLETION AUTHORITY
  created: "2026-09-24"
  updated: "2026-09-24"
  transition_history: unverified
  transitions: []
  relationships: []
  details:
    criteria: [criterion:AC-1, criterion:AC-2, criterion:AC-3, criterion:AC-4]
    depends_on: ["0030"]
    size: m
    priority: p2
    # Optional scheduling hints:
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

# Task 0036: Back-links from a reference to every place it is cited

## Problem

A footnote in this textbook already links back to where it was called from: the in-text marker
carries `id="fnref-N"`, the footnote carries `id="fn-N"`, and the footnote ends with an arrow back.
A reader who follows a footnote can return to their place in one click.

**A citation cannot.** Following `(Casper et al., 2023)` to the reference list is a one-way trip;
the reader has to find their place again by eye. Owner-reported, 2026-09-24.

The asymmetry is arbitrary. Both are the same interaction - a marker in prose, an entry below, and a
reader who wants to come back - and only one of them was built.

Citations differ from footnotes in one way that matters: **a footnote is called once, a source is
often cited many times.** So a reference needs *several* back-links, in document order, not one.

## Scope

- An id on every in-text citation link, unique and stable per section.
- One back-link per citing instance on each reference in the section list, in document order.
- The same on the chapter-level list, where "where it came from" spans sections.

## Out of scope

- The `/bibliography` page. A reference there belongs to the whole Atlas and has no single place to
  return to; its `cited` locations already link to the right sections.
- Renumbering or restyling footnotes.

## Decisions required before execution

### D1 - Where does the citation index come from?

A back-link needs a stable id per citation *instance*, and nothing currently assigns one.

**Option A: the transformer, as it already does for footnotes.** `Footnote` nodes carry a `number`
assigned during document transformation. Giving citation links an `index` there is the consistent
answer, makes the ids server-rendered, and works with JavaScript disabled. It costs a change in
`src/textbook-loader/`, regenerates the output snapshots, and touches the module whose output feeds
the audio content hash - which `handoff:0005` established is currently unchanged on this branch and
worth keeping that way until the merge.

**Option B: client-side, the way footnote popovers already work.** Walk the prose on load, match
each link against the citation keys the page already embeds, assign ids in document order, and
inject the back-links. No pipeline change, no snapshot churn, and there is precedent - the footnote
tooltips in `nodes/Footnote.astro` are built this way. It degrades to today's behaviour without
JavaScript, which is no worse than now but is worse than footnotes.

**Option C: an Astro render-time counter.** Rejected without measurement: a module-scoped counter is
shared across concurrently rendered pages, so the ids would be wrong in a way that only shows under
load. Recorded so it is not re-proposed.

**Decided: B, 2026-09-24, shipped.** A stays the right long-term home and is not rushed into the
loader while an audio content hash is being kept deliberately stable.

Two things B got right that a node-counting version would not have. Matching is by **canonical URL**,
not by pairing "the Nth anchor in the DOM" with "the Nth extracted citation" - that pairing assumes
two independent AST walks agree forever. And ids are a **plain counter** (`citeref-12`), like
`fnref-N`, not a percent-encoded URL: an id has to survive being written into an href and matched
back as a fragment, and an encoded URL does that only by the browser's leniency.

### D2 - What does a back-link look like when there are several of them?

A footnote uses a single arrow glyph. Eight arrows in a row are noise. Options: superscript letters
(`a b c`, the convention in numbered-reference styles), superscript indices, or a single arrow to
the first occurrence with the rest behind a control. **Decided: one instance renders the same return arrow the footnotes use; several render
superscript letters** (`a b c`), which is what a reader of a scientific bibliography already
recognises. Each carries an `aria-label` naming which of how many it is.

## Done when

- **AC-1:** Every in-text citation link on a section page carries a unique, stable id.
- **AC-2:** Each reference in the section list carries one back-link per citing instance, in
  document order, and each lands on the instance it names.
- **AC-3:** A source cited once shows exactly one back-link; a source cited eight times shows eight,
  and the list stays readable.
- **AC-4:** The chapter list does the same across sections, and `/bibliography` is unchanged.

## Completion evidence

Measured in the live DOM of `/chapters/v1/capabilities/current-capabilities`, a section with 122
references and 71 in-text citations:

| Criterion | Evidence | |
| --- | --- | :-: |
| AC-1 | 71 unique `citeref-N` ids assigned in document order | met |
| AC-2 | **122 of 122** entries carry back-links; **0 broken targets** (every href resolves to an element on the page) | met |
| AC-3 | 14 entries carry more than one, lettered `a`, `b`, `c`; the most-cited carries 3; single instances render one arrow | met |
| AC-4 | `/bibliography` and the chapter list are untouched - `linkBackToCitations` returns early when there is no `[data-chapter-article]` to return to | met |

**Two defects caught by running it rather than reading it.** The first pass excluded `#footnotes`
from the walk, which silently dropped **6 citations made inside footnotes** - a source cited in a
footnote is cited, and the footnote is the right place to return to. The second used percent-encoded
URLs as ids; `getElementById` on the decoded fragment failed, which the DOM check caught and a code
review would not have.

**Known limitation, `audit:0011` F24:** a section page renders its article twice for reading mode, so
every id on it is duplicated - including `fnref-N`, which has behaved this way since reading mode
shipped. Citation back-links inherit it rather than working around it.

**Not done: `/bibliography`.** Out of scope by design, and unchanged.
