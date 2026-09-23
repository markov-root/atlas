---
schema_version: 2
id: "0015"
uid: "task-20260921T203524999267Z-68814dee"
title: "Discriminated union AST and per renderer applicability for new content types"
role: task
status: todo
summary: "Refactor the AST to a discriminated union with a per-renderer applicability contract, unblocking quizzes, flashcards and self-hosted OWID charts."
created: "2026-09-21"
updated: "2026-09-21"
owner: Markov Grey
supersedes: ""
superseded_by: ""
engineering_document:
  version: 1
  contract_tier: full
  role: task
  id: "0015"
  uid: task-20260921T203524999267Z-68814dee
  title: "Discriminated union AST and per renderer applicability for new content types"
  state: todo
  authority:
    kind: work-state
    owner: Markov Grey
    scope: "transformer.ts Node type and node vocabulary, NodeRenderer.astro dispatch, typed Props under src/components/nodes/, the markdown/PDF/audio renderers' node handling, and the per-kind renderability contract - gated on the decisions in this record"
  created: "2026-09-21"
  updated: "2026-09-21"
  transition_history: unverified
  transitions: []
  relationships: []
  details:
    criteria: [criterion:AC-1, criterion:AC-2, criterion:AC-3, criterion:AC-4, criterion:AC-5, criterion:AC-6]
    size: l
    priority: p1
    atomic_large:
      rationale: "The union refactor, applicability contract, and pilot content kind share one vocabulary change - splitting them means migrating the same files twice (the failure D4 exists to prevent)."
      rollback: "Refactor lands behind a snapshot baseline of current renderer outputs (AC-5); a revert restores the stringly-typed Node and the baseline still passes."
      checkpoints: ["snapshot baseline recorded", "union + exhaustiveness compiles clean", "renderability table matches baseline", "pilot kind renders in all four renderers"]
---

# Task 0015: Discriminated union AST and per renderer applicability for new content types

## Problem

This is the one task that unblocks three things the owner has asked for at once: **inline
quizzes**, **flashcards**, and **replacing the 28 OWID iframes with self-hosted datasets and an
interactive layer** (ROADMAP "Next" already contains "Discriminated-union AST node types" and
"Quizzes and flashcards as inline content types", and "Later" contains the OWID item - this record
is the concrete form of the first plus the applicability model, not new scope).

The gap it fixes is in the AST itself. `Node` is defined at
`src/textbook-loader/transformer.ts:5-9` as `{ name: string; attributes: Record<string, unknown>;
children: Node[] }` - one wide, stringly-typed object (`audit:0008` F1). Every consumer dispatches
on the bare string `node.name`, so TypeScript cannot express "every renderer handles every node
kind", and a node kind unknown to a renderer is dropped with severity that varies by renderer
(`audit:0008` F2): **fully silent on web** (`NodeRenderer.astro:50-55` renders nothing for a missing
key), **text-soup in markdown and audio** (unknown-node fallbacks inline the flattened children -
for a quiz, that means the question, every option and the correct answer read aloud flat),
**warn-and-continue in PDF** - the only renderer that even notices. There is no existing notion of
"a node some renderers skip" (`audit:0008` F3): skipping is re-decided, differently, inside each of
the four renderers' if-chains, which is exactly the pattern a quiz needs (meaningful on web,
meaningless in narration).

The concrete cost of the status quo is `audit:0008` F4's edit-site count: adding one table
component today touches **7 code files, ~9 edit sites**, of which four are pure "don't leak content"
guards - and forgetting one produces no error anywhere. The OWID side is already anticipated by the
AST shape (`audit:0008` F5): 28 embeds across 4 of 8 chapters, 24 unique grapher slugs, and the
`Iframe` node's `{ src, stillImage, caption }` already carries the still-image fallback the
non-web renderers need.

**Who it affects:** authors (cannot add quizzes/flashcards at all today), translators (new content
types multiply the edition/language axis), and readers (OWID iframes are external runtime
dependencies whose failure state is an infinite spinner - `audit:0010` F8).

**Counter-case recorded:** the refactor is not free. `audit:0008` F1 and ROADMAP both note that a
discriminated union *alone* buys narrowing, not completeness - it must ship with an exhaustiveness
mechanism (`satisfies Record<NodeKind, Handler>` or a `default: never` arm) or the silent-drop
failure class survives. ROADMAP's break trigger also applies: if a content type is needed before
this lands, the choice is to delay the content type, not to skip the union - `audit:0008`'s
"what I would not do" explicitly declines hand-writing quiz branches on the stringly-typed `Node`.

## Decisions required before execution

### D1 - Authoring surface for quizzes and flashcards

**Question:** do quizzes/flashcards enter through a Google Docs component-table component or an
Astro content collection?

- **Doc table** (`audit:0008` F8): inherits the editorial workflow authors and translators already
  use; inline position in the prose is free (a quiz between paragraph 3 and 4 is just a table
  there); costs a stringly-typed cell schema validated only by `convertQuiz` at build time.
- **Content collection** (like the existing glossary, `src/content.config.ts:34-44`): zod
  validation, the per-edition/per-language directory convention, non-Doc authoring; but collections
  have no document position, so a positioning mechanism (id referenced from a Doc table, or
  section-level ordering) is needed, and translation needs its own story.

**Recommendation:** Doc table. It is the smaller change, reuses the transformer's component-table
mechanism verbatim (`transformer.ts:74-82`, `processComponent` at `:243`, converter map `:261-277`),
and keeps quizzes in prose position where authors already work. Revisit the collection path only if
quizzes get reused across editions or rendered outside chapter flow (a standalone practice page).

**Irreversible / expensive to undo:** whichever surface is chosen, authored quiz content -
including its **translatable strings and its correct answer** - accumulates there. This interacts
with task:0014 (language and edition through the whole stack): a collection gives a per-language
directory for free; a Doc table rides the edition's Doc translation flow, where a quiz's answer key
is embedded in the translated document. Migrating authored quizzes between surfaces after either
pile grows means re-keying content per edition and per language - that migration cost, not the
code, is the lock-in. Decide before the first quiz is authored, not before the refactor lands.

### D2 - What a renderer does with an inapplicable node

**Question:** when a node kind does not apply to a renderer (a quiz in the PDF; a chart in
narration), is it skipped silently, replaced with a placeholder, or a build failure?

- **Skip silently:** cheapest, but recreates `audit:0008` F2 for *known* kinds - a missing quiz in
  the PDF becomes indistinguishable from a wiring bug. Consequence: content gaps ship invisibly.
- **Declared placeholder** (e.g. "(interactive version on website)", already the markdown pattern
  for Iframe at `markdown-renderer.ts` label rendering): the absence is a *design choice* visible to
  the reader, not a defect. Small per-kind cost: each kind declares its non-web fallback text once.
- **Refuse to build** for web-only kinds: turns every PDF export into an all-or-nothing gate on
  content that was never meant for PDF. Too blunt for a textbook where interactivity is expected to
  degrade.

**Recommendation:** the renderability contract from `audit:0008` R2 - a per-kind capability table
(`render | summarize | skip | label` per renderer) co-located with the node vocabulary, with
renderers consuming the table instead of re-deciding ad hoc. Validate it against the four existing
renderer disagreements (Video/Iframe/NoteBox/Callout, F3) behind a snapshot baseline. An *unknown*
node kind stays a compile error (D2 overlaps D1's exhaustiveness mechanism, not a policy choice).

**Irreversible / expensive to undo:** not the code - the contract is cheap to change - but the
**policy silence** is: if silent-skip ships, readers may hold or print a PDF missing interactive
content with no defect recorded anywhere, and the gap is discovered by accident. Choosing the
contract before the first web-only kind exists is what keeps "is the missing quiz a defect or a
design choice?" answerable by inspection.

### D3 - OWID replacement scope, chart library, and licensing

**Question:** self-host all 24 unique grapher slugs or start with a subset; which chart library;
and are we allowed to?

- **All 24 slugs** in one migration: consistent reader experience, one migration to review; largest
  single change to the interactive layer.
- **Pilot the most-used slugs first** (the slug reuse across chapters means a few slugs cover many
  embeds): validates the fetch pipeline cheaply; leaves mixed iframe/self-hosted states to explain.

**Recommendation:** extend the `Iframe` node with a **dataset variant** rather than minting a new
node kind (`audit:0008` F5/R4) - `Iframe` already has the exact capability profile needed
(web-interactive, audio-summarized, PDF-still-image, markdown-label); a new `Chart` kind would
re-declare the same four-way behaviour. Pilot with a small slug subset to validate the build-time
grapher-fetch step (beside the existing `pushPublicFiles` asset-pipeline precedent), then batch the
rest. The chart library must fit the client-JS budget the ROADMAP page-load performance pass
establishes - that pass runs **before** this work, not after (ROADMAP dependency direction).

**Licensing:** `audit:0008` F5 observes OWID publishes its data under a permissive attribution
licence (attribution naturally riding the existing `caption`/`figcaption` surface), but the exact
terms are **unverified and this record makes no legal conclusion** - ROADMAP's Later item already
flags this as the open question to resolve before building, with a break trigger: if the licence
resolves against self-hosting, this piece dies and the iframes stay. **The owner must verify the
licence terms; that check is not delegated to implementation.**

**Irreversible / expensive to undo:** the licence determination (a "no" kills the item per the
ROADMAP break trigger) and, more mundanely, the authoring surface - once Docs drop the iframe embeds
for dataset references, the `src`/`stillImage` attribute habit is retired and reverting means
re-authoring 28 embed cells across 4 chapter Docs.

### D4 - Sequencing against task:0014

**Question:** task:0014 (model language and edition through the whole stack) and this task both
change `transformer.ts` and all four renderers. Which lands first?

- **This task first** (`audit:0008` R1 order, ROADMAP's dependency direction): the union makes
  0014's changes type-narrowed and compiler-checked; 0014 rides typed nodes instead of stringly
  dispatch.
- **0014 first:** edition modelling lands sooner on the current code; but every file it touches is
  migrated again by the union refactor afterwards - the same files churn twice, and any 0014-era
  renderer branches written in the old style must be rewritten.
- **Merged:** one coordinated sequence landing both; loses the behaviour-preserving safety of a
  standalone refactor review (snapshot churn from two sources mixed in one diff).

**Recommendation:** this task first, as ROADMAP already states ("Depends on: the format pass;
Blocks: the quizzes/flashcards item and the OWID replacement") - but coordinate with 0014's owner so
0014 does not start touching the renderers concurrently. The snapshot baseline (AC-5) is what keeps
this task reviewable at all; do not begin until the baseline is recorded.

**Irreversible / expensive to undo:** nothing in the code, but the *review cost* is: overlapping
refactors to the same files produce diffs that cannot be attributed to one change, and the
behaviour-preserving guarantee of the union refactor (the thing that makes AC-5 checkable) is
voided by interleaving. The double-migration of the same files is the concrete expense of deciding
wrongly.

*A decision with an obvious answer was deliberately not padded into this list: the exhaustiveness
mechanism (`satisfies` table vs `default: never`) is an implementation detail settled at PR review,
not an owner decision.*

## Scope

In execution order; each step gates the next:

1. **Record decisions D1–D4** (this record or successor ADRs). D1 and D2 are the shape-givers: D1
   determines the pilot kind's node attributes, D2 determines the capability table's vocabulary.
   D3's licence check runs independently and in parallel.
2. **Snapshot baseline:** capture current renderer outputs (web fixture render, markdown, PDF,
   audio text) for existing content before any type change, so AC-5 is judgeable.
3. **Discriminated-union refactor** (`audit:0008` R1): `Node` becomes a union of typed kinds;
   attributes typed per kind; typed `Props` for all 19 components under `src/components/nodes/`;
   exhaustiveness enforced in `NodeRenderer.astro` and the three non-web renderers. Behaviour
   preserving against the baseline.
4. **Renderability contract** (`audit:0008` R2): the per-kind capability table, validated against
   the existing Video/Iframe/NoteBox/Callout disagreements; renderers consume it. Declared
   behaviour changes from the baseline are enumerated, not silent.
5. **Pilot content kind** (per D1): the first quiz or flashcard - transformer converter, web
   component with its client script, one dispatch entry the compiler checks, one capability-table
   row, reading-time/word-count bookkeeping (`transformer.ts:729-745`), Algolia indexing if wanted
   (`algolia.ts:33-54`), and the read-along exclusion (`UNSPOKEN_SELECTOR`, `word-highlight.ts:57`)
   **in the same change** (`audit:0008` R5).
6. **Re-verify the F4 edit-site count** against the actual pilot diff and record it (AC-6).

The OWID dataset migration itself is *unblocked* by steps 3–5 but executes under the ROADMAP
"Later" item once D3 is decided.

## Out of scope

- **The OWID migration's data-fetch pipeline and chart runtime** - tracked in ROADMAP "Later"
  (self-hosted OWID datasets); this task only makes its node-kind change cheap.
- **Certification machinery** - accounts, answer-hiding, server-side scoring, anti-gaming. Explicit
  non-goal (PRINCIPLES §14; ROADMAP "Not planned" scope note). Quizzes here are inline self-check
  content with answers visible in the page source; that is a feature of the scope, not an oversight.
- **task:0014's edition/language modelling** - coordinated for sequencing (D4) but executed as its
  own record.
- **The rejected authoring surface** (whichever of D1's options is not chosen) - do not build both.
- **Editing `docs/PRINCIPLES.md` or `docs/ROADMAP.md`** - both already carry the quiz-vs-
  certification scope note; no drift to fix there.

## Done when

- **AC-1:** D1–D4 are each decided and recorded (in this record or a successor ADR), with the
  owner's licence verification for D3 either completed or explicitly marked unresolved-and-blocking
  before any OWID fetch code is written.
- **AC-2:** `Node` is a discriminated union; adding a node kind to the union without a handler in
  `NodeRenderer.astro` or any of the three non-web renderers fails compilation (demonstrated once
  during development by a deliberately incomplete commit that fails `astro check`, then completed).
- **AC-3:** A per-kind renderability table exists co-located with the node vocabulary, covers every
  existing kind, and its `Video`/`Iframe`/`NoteBox`/`Callout` rows match pre-refactor renderer
  behaviour as captured in the snapshot baseline.
- **AC-4:** The pilot content kind (per D1) renders on web and has declared, table-driven behaviour
  in markdown, PDF and audio - a reviewer can point at the capability-table row and the rendered
  output in each format; `UNSPOKEN_SELECTOR` includes the pilot kind's DOM in the same diff.
- **AC-5:** Renderer outputs for all pre-existing content are unchanged from the snapshot baseline
  except for behaviour changes enumerated and accepted in the renderability-table review.
- **AC-6:** The F4 edit-site count is re-verified from the actual pilot diff and this record is
  updated with the real number and any delta from the audit's estimate.

## Completion evidence

| Criterion | Evidence | Verified |
| --------- | -------- | -------- |
| AC-1      | -        | -        |
| AC-2      | -        | -        |
| AC-3      | -        | -        |
| AC-4      | -        | -        |
| AC-5      | -        | -        |
| AC-6      | -        | -        |

## Authority and inputs

- `audit:0008` - all findings F1–F8 and recommendations R1–R5; this record's F4 edit-site count,
  F5 OWID surface count, F8 authoring-surface trade-off, and F2 failure-mode severity carry over by
  citation.
- `docs/ROADMAP.md` - "Next": Discriminated-union AST node types (this task's R1 half, already
  scoped there); Quizzes and flashcards as inline content types (the authoring-surface decision and
  its break trigger); "Later": Self-hosted OWID datasets (D3's downstream execution and licence
  break trigger); "Not planned": certification-program scope note distinguishing inline quizzes.
- `docs/PRINCIPLES.md` - §10 (YAGNI: demand is real and named - the owner wants quizzes/flashcards
  and OWID independence), §11 (type safety where it catches bugs - the union is its fix), §14
  (explicit non-goals: certification machinery stays rejected).
- task:0014 - the concurrent-file-touch constraint sequenced in D4.
- Code anchors: `src/textbook-loader/transformer.ts:5-9` (Node type), `:243-277` (component-table
  mechanism), `:729-745` (reading-time bookkeeping); `src/components/NodeRenderer.astro:29-55`
  (dispatch and silent drop); `src/textbook-loader/renderers/markdown-renderer.ts:146-147`,
  `renderers/pdf/renderer.ts:299-300`, `renderers/audio/text-renderer.ts:238-244` (unknown-node
  fallbacks); `src/lib/word-highlight.ts:57` (UNSPOKEN_SELECTOR); `src/content.config.ts:34-44`
  (the glossary collection precedent); `src/textbook-loader/algolia.ts:33-54` (indexing walk).
