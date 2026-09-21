---
schema_version: 2
id: "0008"
uid: "audit-20260921T150311924712Z-3f4cabfe"
title: "Extensibility of the AST and renderers for new content types"
role: audit
status: draft
summary: "Traces one node kind through four renderers to count the edit sites a new content type would need."
created: "2026-09-21"
updated: "2026-09-21"
owner: Markov Grey
supersedes: ""
superseded_by: ""
engineering_document:
  version: 1
  contract_tier: full
  role: audit
  id: "0008"
  uid: audit-20260921T150311924712Z-3f4cabfe
  title: "Extensibility of the AST and renderers for new content types"
  state: draft
  authority:
    kind: point-in-time-evidence
    owner: Markov Grey
    scope: "AST `Node` type, node vocabulary, NodeRenderer.astro, the 19 node components, and the markdown/PDF/audio renderers, on branch codebase-cleanup as of 2026-09-21."
  created: "2026-09-21"
  updated: "2026-09-21"
  transition_history: unverified
  transitions: []
  relationships: []
  details:
    as_of: "2026-09-21"
    subjects: ["transformer.ts and Node AST", "src/components/NodeRenderer.astro", "src/components/nodes/*.astro", "src/renderers/{markdown-renderer.ts,pdf/renderer.ts,audio/text-renderer.ts}"]
    method: "Static read of transformer.ts, NodeRenderer.astro, node components, and the three non-web renderers; trace of one existing node kind through all four renderers; corpus-wide grep for iframe usage."
    limitations: ["Static analysis only; no build or runtime execution permitted on this VM"]
---

# Audit 0008: Extensibility of the AST and renderers for new content types

## Scope

Examined (branch `codebase-cleanup`, working tree as of 2026-09-21):

- `src/textbook-loader/transformer.ts` (750 lines) — the Google Docs JSON → `Node` AST conversion, the component-type dispatch (`processComponent`), and reading-time accounting.
- `src/components/NodeRenderer.astro` (57 lines) — the web dispatcher.
- All 19 files under `src/components/nodes/*.astro` (line counts checked; Callout, Figure, Iframe, Definition, GlossaryDefinition read in full).
- `src/textbook-loader/renderers/markdown-renderer.ts` (234), `renderers/pdf/renderer.ts` (330), `renderers/audio/text-renderer.ts` (246), and `renderers/audio/renderer.ts` (270, skimmed for node-name coupling).
- Cross-cuts that consume the AST: `src/textbook-loader/algolia.ts` (search indexing), `src/layouts/Reader.astro` and `Reader.astro` script blocks (client-JS story).
- Project decision docs: `docs/ARCHITECTURE.md`, `docs/PRINCIPLES.md`, `docs/ROADMAP.md` (esp. "Next" and "Not planned").

Not examined: the audio TTS/R2-upload pipeline beyond the node coupling (`renderers/audio/renderer.ts` non-node logic), `src/lib/*` client scripts other than to establish the interactivity mechanism, `src/content/*` collections beyond `glossary`, build/deploy config. Scope A (multi-edition/multi-language) owns translation coupling; I note cross-scope interactions only.

## Method

Static reading only; no build, typecheck, or test execution (per brief; the only permitted test run, `pnpm test`, was not needed because all findings are structural). Exact commands: direct `read` of the five files named above; `grep -rn "node.name"` / `.name ===` across `src/` to find every dispatch site; `grep -n` on `docs/ROADMAP.md` for already-scoped work.

The central trace was **Callout** (a table component) plus **Figure**/**Iframe** (media components) followed from Google Docs table → `Transformer.processComponent` → `Section.nodes` → each of the four renderers. For each hop I recorded: how the node kind is decided, what happens to a node kind a renderer doesn't know, and what per-kind bookkeeping (instance counts, reading time, media labels) is attached where.

To answer "how many places does one new content type touch", I enumerated every code location that currently contains per-node-kind logic, by name, from the grep above plus full-file reads. Observation and inference are separated per finding.

## Findings

### F1 — The `Node` type is a wide stringly-typed object; no renderer can be made exhaustive, and the roadmap has already scoped the fix

_Observation._ `Node` is defined at `src/textbook-loader/transformer.ts:5-9` as `export type Node = { name: string; attributes: Record<string, unknown>; children: Node[] }`. Every consumer dispatches on `node.name`, a bare string: the web renderer at `src/components/NodeRenderer.astro:29` (`const components: Record<string, any> = {...}`), markdown at `renderers/markdown-renderer.ts:13` and `:146` (chains of `if (node.name === ...)`), PDF at `renderers/pdf/renderer.ts:177` (same pattern plus a `BLOCK_NODES` string array at `:14-28`), audio at `renderers/audio/text-renderer.ts:65` and `:119` (same), and search indexing at `src/textbook-loader/algolia.ts:33-54`. Node attributes are untyped everywhere (`node.attributes.level as number`, `node.attributes.flavor as string | undefined` …).

_Inference._ With `name: string`, TypeScript cannot express "every renderer handles every node kind": a switch/if-chain over a string is not exhaustive, so adding a `QuizNode` type and forgetting it in one of the four renderers compiles clean. This is not a style nit — it is the reason F2's silent-drop behaviour is reachable at all. `docs/ROADMAP.md:156-163` already scopes the discriminated-union refactor and names `NodeRenderer.astro` as "the dispatcher that would benefit most"; per the shared brief, the correct position is: **do that refactor first**, because the edit-site count in F4 only gets type-checkable enforcement after it. Note one caveat: even a discriminated union does not by itself force renderers to handle new kinds unless combined with an exhaustiveness check (e.g. a `satisfies Record<NodeKind, Handler>` table or a `default: never` arm) — the refactor alone buys narrowing, not completeness.

### F2 — A node kind unknown to a renderer is dropped with severity depending on renderer: silent on web, text-soup in markdown/audio, warn-and-continue in PDF

_Observation._ Four different failure modes for an unhandled node kind:

- **Web, fully silent:** `NodeRenderer.astro:50-55` does `const Tag = components[node.name]` then renders `{Tag && (<Tag …>)}`. A missing key yields `Tag === undefined` and the node (and, via `Astro.self`, its subtree) renders nothing — no error, no warning, no build log.
- **Markdown, content leak:** `markdown-renderer.ts:146-147` ends `renderBlockNode` with an unknown-block fallback that recurses into children and inlines them (`renderBlockChildren(node.children)`); the same file's inline path at `:45-46` recurses unknown inline nodes' children. A structured new node would therefore emit flattened child text with none of its semantics.
- **Audio, content leak into speech:** `text-renderer.ts:238-244` ends `renderBlockNode` with an unknown-container fallback that recurses into children and joins them with spaces. For a quiz this means the question, every option, and the correct answer are all read aloud flat — for a flashcard, front and back are spoken in one breath, defeating the purpose.
- **PDF, warn-and-continue:** `pdf/renderer.ts:299-300` logs `console.warn("Unknown node type: …")` and returns `''` — the only renderer that even notices. But note the PDF renderer *throws* on a known-but-unhandled variant (`renderer.ts:263`, `Unknown flavor for Callout`): the error policy is inconsistent within one file — a new Callout flavor fails the build loudly while a new node type is silently omitted from the PDF.

_Inference._ The brief's central worry is confirmed with evidence: adding a content type and wiring only the web renderer produces **no failure signal anywhere**. A quiz would appear on the live site and vanish from the markdown export (which `CopyMarkdownButton.astro` serves to readers), from the PDF, and from the audio — and the transformer-side would be the only place a mistake is caught at all, and there only for table components (`transformer.ts:271-272`, `console.warn("Unknown component type …")`). The cheapest durable fix is not better warnings but a renderability contract per node kind (see F3 and Recommendations R2).

### F3 — There is no existing notion of "node some renderers skip"; skipping is ad-hoc per renderer

_Observation._ The four renderers already disagree about which nodes are renderable today: `Video` renders on web (`nodes/Video.astro`) and is described in audio (`text-renderer.ts:196-203`) but returns `''` in PDF (`pdf/renderer.ts:178-180`) and degrades to a caption-only label in markdown (`markdown-renderer.ts:118-124`). `Iframe` renders a still image in PDF (`pdf/renderer.ts:284-297`), an intros line in audio (`text-renderer.ts:204-215`), a label in markdown (`markdown-renderer.ts:126-135`), and a real embed on web. `NoteBox` is explicitly skipped in audio with a canned sentence (`text-renderer.ts:169-176`). Media labels are implemented twice, near-identically: `markdown-renderer.ts:6-11` and `text-renderer.ts:50-55`.

_Inference._ A quiz/flashcard will want *exactly* the Callout/Iframe pattern: rendered on web, summarized in audio, still-or-skip in PDF, label in markdown. The capability to express "this node is web-only" exists nowhere as a concept — it is re-decided, differently, inside each renderer's if-chain. That is the crux for new content types: today a new kind's per-renderer behaviour must be re-implemented in all four places even when three of them are "skip". A per-kind capability table (e.g. `{ web: 'render', audio: 'summary', pdf: 'skip', markdown: 'label' }` co-located with the node definition) would make the 20th kind declare its renderability once instead of four renderer edits guessing at it.

### F4 — Concrete edit-site count for one new table component (the extensibility number)

_Observation._ Tracing the existing `Callout`/`Figure` table components, adding a new `type: quiz` component today touches, concretely:

1. `src/textbook-loader/transformer.ts` — one entry in the `converter` map (`:261-277`) plus a new `convertQuiz` method (~20-40 lines); plus `getComponentReadingTime` (`:729-745`) if quiz text should count toward section reading time (its attribute-key list `caption/source/sourceUrl` is hardcoded at `:736`), plus `getSpansWordCount`/`getNodeTreeWordCount` (`:698-727`) if quiz words should count for search/word-count purposes.
2. `src/components/NodeRenderer.astro` — import (`:2-19`) and `components` record entry (`:29-49`) — two sites in one file.
3. `src/components/nodes/Quiz.astro` — the new component itself (plus its client script if interactive).
4. `src/textbook-loader/renderers/markdown-renderer.ts` — a branch in `renderBlockNode` (`:146+`), or accept the F2 text-soup fallback.
5. `src/textbook-loader/renderers/pdf/renderer.ts` — a branch in `renderNode` (`:177+`), possibly plus `BLOCK_NODES` (`:14-28`) so spacing is right.
6. `src/textbook-loader/renderers/audio/text-renderer.ts` — a branch in `renderBlockNode` (`:119+`) deciding spoken-vs-skip, or accept the F2 read-the-answers fallback.
7. `src/textbook-loader/algolia.ts` — only if quiz text should be searchable (`:33-54` walks node trees for indexing).
8. Tests/snapshots — `transformer.test.ts` snapshot coverage and renderer tests update automatically as new nodes appear in fixtures.

Minimum to ship safely: **7 code files, ~9 edit sites**; the count is per renderer ×2 (decide + spacing/wordcount bookkeeping) which is exactly the fan-out the brief predicted.

_Inference._ That number is not catastrophic, but its *shape* is the problem: sites 4–7 are all "don't leak content" guards, and forgetting one produces no error (F2). After the F1 union + F3 capability-table refactor, the same feature would be: 1 transformer converter, 1 component file, 1 dispatch entry that the compiler checks for exhaustiveness, and 1 row in a capability table — with forgetting a renderer becoming a compile error instead of a silent omission.

### F5 — The OWID iframe surface is 28 embeds in 4 of 8 chapters (v1-EN), 24 unique grapher slugs; the AST shape already anticipates a hosted-interactive replacement

_Observation._ Counting Iframe component cells in the local Google Docs cache (`.cache/docs/<docId>/t.0`, all 8 chapters of `TEXTBOOK_EDITIONS`, `src/textbook-loader/data.ts:14-76`): chapter counts are 13 (`1hWdq25N`), 7 (`1TzouUrIM`), 6 (`16Dk4IRy`), 2 (`165SypJtK`), 0 elsewhere — **28 Iframe components total**. Of their `src` values, **24 unique `ourworldindata.org/grapher/<slug>` URLs** (several slugs reused across chapters; some with `?tab=` / `?country=` query params baked into the Doc text). One non-OWID embed exists: `convergenceanalysis.org/ai-regulatory-landscape/home` (`16Dk4IRy`, 12 URL mentions in that doc, most of them citation links). Mentions of `ourworldindata.org/artificial-intelligence` (11) are ordinary citation links, not iframes.

In the AST an Iframe node is `{ src, stillImage, caption }` (`transformer.ts:339-346`) plus the shared `instanceCount`/`sectionNumber`/`chapterNumber` stamping. The still image is already a separate author-supplied attribute and is what PDF (`pdf/renderer.ts:284-297`) and the label-renderers fall back to.

_Inference._ Replacing OWID iframes with downloaded datasets + a self-hosted interactive layer decomposes into: (a) a **build-time data fetch** — OWID grapher slugs map to their public grapher API/CSV endpoints; a fetcher would slot beside the existing audio R2-cache push (`pushPublicFiles`, `pdf/renderer.ts:5,67`) as another asset pipeline; (b) a **client-side chart runtime** — none exists today (see F6); 24 distinct slugs × 2 editions × 5 languages means the chart library should be one shared bundle, not per-chart islands; (c) a **node-kind decision** — the smallest change is keeping `Iframe` and making `src` optional in favour of a `dataset` attribute, because `Iframe` already has the exact capability profile a self-hosted chart needs (web-interactive, audio-summarized, PDF-still-image, markdown-label — F3); a new `Chart` kind would re-declare the same four-way behaviour. The corpus is small (28 embeds), so migration is mechanical. Licensing/attribution: OWID publishes its data under a permissive attribution licence (verify exact terms at migration time); the existing `caption` field is the natural attribution surface, and `figcaption` renders it today (`nodes/Iframe.astro:42-49`). I make no legal conclusion.

### F6 — Client-JS story: build-time rendering + tiny per-component scripts; no interactive-runtime precedent beyond DOM scripts

_Observation._ The site ships almost no client JS today. Equations are compiled to SVG at build time by a Typst node compiler (`nodes/DisplayEquation.astro:1-19` — `@myriaddreamin/typst-ts-node-compiler`, zero runtime cost). Interactive behaviour is a set of small Astro-processed `<script>` blocks — `Definition.astro:39-98`, `Footnote.astro:13-45`, `GlossaryDefinition.astro:22-56`, plus `Reader.astro:379-388` pulling `lib/audio-source-switch`, `lib/reader`, `lib/word-highlight`, and a handful of `is:inline` scripts (`Reader.astro:51,60`, `BaseHead.astro:29`, search components). The only heavyweight third-party script is the Algolia DocSearch UMD bundle from jsdelivr (`AlgoliaSearch.astro:63`, `DocSearchProvider.astro:27` — the ~36 KiB bundle flagged in `docs/ROADMAP.md`'s perf pass). There is no framework island, no chart library, no state store.

_Inference._ A quiz is the first genuinely stateful content type: selection state, per-option feedback, possibly score. This fits the existing pattern (one `<script>` inside `Quiz.astro`, plain DOM) **if** answers stay in the page — but that means correct answers are visible in view-source, which is fine for a textbook-as-learning-aid and wrong for any scored use; the moment answers must be hidden, a server round-trip (Astro Action/endpoint) enters, which is exactly the certification-program machinery `docs/ROADMAP.md:224` and `docs/PRINCIPLES.md:204,132` rejected. The roadmap tension the shared brief asks to flag is: **"Not planned" rejects a certification program with quizzes and anti-gaming; the owner now wants quizzes as content.** These are different scopes — inline self-check quizzes vs scored certification — and `ROADMAP.md` "Not planned" and "Later" need updating to say so; it does not forbid the work. Also note the word-alignment layer: `lib/word-highlight.ts:57` maintains `UNSPOKEN_SELECTOR = '.footnote-ref, .inline-equation, .notebox-content, .if-js'` — page chrome that is never spoken — and a quiz's interactive elements would need the same treatment (or the read-along highlight will try to sync into quiz text).

### F7 — The 19 node components share a loose but real contract; the 20th is cheap on web but has three sidecar costs

_Observation._ Contract as observed: each component in `nodes/` receives the node's attributes spread via `<Tag {...node.attributes}>` (`NodeRenderer.astro:56`) and renders children by recursing through `<NodeRenderer node={child} />` (`nodes/Figure.astro:41`). Components range from 4-line pass-throughs (`Paragraph.astro`, `ListItem.astro`, `NumberedList.astro`, `SpanGroup.astro`) to bespoke 87-108-line files (`Footnote`, `GlossaryDefinition`, `Definition`). Numbered-media components each re-implement the same label pattern: `` `Figure ${chapterNumber}.${instanceCount.inChapter}` `` (`Figure.astro:25`), the same for `Definition.astro:15` and `Iframe.astro:17`. There is no shared `interface` or helper for this. Attribute typing never flows end-to-end: the transformer writes untyped `Record<string, unknown>` (`transformer.ts:363`), and each component re-declares its `Props` — a transformer/component attribute-name mismatch is not caught by the compiler because the spread's source is untyped.

The `Callout` flavor example shows per-kind knowledge spread across four files today: the Doc cell (`transformer.ts:303-306`), web styles keyed `Record<string, {box, icon}>` with a silent default fallback (`Callout.astro:8-19`), PDF which **throws** on unknown flavor (`pdf/renderer.ts:263`), audio which special-cases `warning` (`text-renderer.ts:177-186`). Adding a `tip` flavor is a fourth of the four-renderer fan-out in miniature.

_Inference._ The contract is consistent enough that a 20th web component is a small, well-understood job (that half of the answer to the brief's Q6 is positive). The residual risks are (a) untyped attribute flow — the discriminated-union refactor (F1) is the fix, and it should include typed `Props` per component as ROADMAP already notes; (b) per-kind bookkeeping leaking into ad-hoc lists — reading-time attribute keys hardcoded in `transformer.ts:736` (`caption/source/sourceUrl`), `BLOCK_NODES` in `pdf/renderer.ts:14-28`, `UNSPOKEN_SELECTOR` in `word-highlight.ts:57`; each new kind silently has to audit all of them.

### F8 — Authoring surface for quizzes/flashcards: Doc table components fit position-in-text; content collections fit typing and translation; the transformer's component-table mechanism is the natural extension either way

_Observation._ The editorial surface is Google Docs (`docs/ARCHITECTURE.md`, §Editorial surface); every non-prose node today enters through the 2-column component-table mechanism (`transformer.ts:74-82` table-cell handling, `processComponent` at `:243`, converter map `:261-277`) and lands **in document order** inside `section.nodes`. Separately, structured data already uses Astro content collections with zod schemas and per-language directories: `src/content/glossary/v1-en/*.json` with a typed schema (`src/content.config.ts:34-44`), loaded as `GlossaryEntry[]` and consumed *by* the transformer (`transformer.ts:32-37`).

_Inference._ Both sources are viable for a quiz, with a clean trade-off: **Doc tables** inherit the authoring workflow translators/writers already use and give free inline positioning (a quiz between paragraph 3 and 4 is just a table there), at the cost of a stringly-typed cell schema validated only by `convertQuiz` at build time; **a content collection** (e.g. `src/content/quiz/v1-en/chapter3-q2.json`) inherits zod validation, the per-edition/per-language directory convention (exactly the multi-edition/multi-language axis Scope A is auditing — cross-scope), and non-Doc authoring, but needs a positioning mechanism (an `id` referenced from a Doc table, or section-level ordering) because collections have no document position. The Doc-table path is the smaller change and reuses F4's machinery verbatim; the collection path is the better fit if quizzes are reused across editions or rendered outside chapter flow (e.g. a standalone practice page). This is the one genuine design decision to make first; everything in F4 follows from it.

## Limitations

- All counts derive from the **local `.cache/docs` corpus** (v1-EN, 8 chapters). The deployed site may embed more (e.g. if the Google Docs have changed since last cache); I did not fetch remote Docs. Slug counts (24 unique OWID) are therefore a floor for the current edition.
- I counted "OWID URL mentions" with text greps over doc JSON; a URL appearing both as an iframe `src` and a citation link is counted once per mention, so mention-counts ≠ embed-counts. The 28 Iframe-component count comes from the `iframe\n` cell markers and is robust; the 24-slug count is exact per unique string but cannot tell me whether the same slug is used twice as two embeds vs once plus a citation.
- I did not execute `pnpm test` (the one permitted command), because every finding is structural and verifiable by reading; running tests would not have changed any count.
- I could not verify TypeScript's exact reaction to `{...node.attributes}` spreading `Record<string, unknown>` into typed `Props` without running `astro check` (forbidden on this VM). I claim only that the transformer-side attributes are untyped at the boundary; I do not claim the web build would or wouldn't error on a mismatch.
- Method flaw noticed mid-audit: F4's edit-site count was assembled from grep + full-file reads after the fact rather than by literally adding a throwaway `Quiz` kind; the count should be re-verified during implementation (it may be off by ±1 for tests/snapshots).

## Recommendations

Priority order; sizes are S < 1 session, M 1–2, L multi-session.

**R1 (M) — Land the discriminated-union `Node` refactor from `docs/ROADMAP.md:156-163` before any new content type, with an exhaustiveness mechanism, not just the union.** Concretely: union of typed nodes + either a `satisfies Record<NodeName, Component>` in `NodeRenderer.astro` or a `default: never` arm per renderer. Risk: touches every consumer of `Node`; snapshot churn in `transformer.test.ts`. What I would _not_ do: skip it and hand-write the quiz branches in the current stringly-typed chains — that reproduces F2's silent drops for the very first new content type. Pairs with R2; standalone-safe as a refactor (behaviour-preserving), but its payoff is only realized with R2.

**R2 (M) — Introduce a per-kind renderability contract** (the capability table of F3) co-located with the node vocabulary: per renderer values (`render | summarize | skip | label`), with renderers consuming the table instead of re-deciding skip-policy ad hoc. Start with the four existing disagreements (Video/Iframe/NoteBox/Callout) so the table is validated against current behaviour. Risk: behaviour changes if the table disagrees with today's ad-hoc choices — mitigate by snapshotting current renderer outputs first. Must be decided together with R1 (same vocabulary change) and informs R4.

**R3 (S) — Decide the quiz/flashcard authoring surface first (Doc table vs content collection), and update `ROADMAP.md` "Not planned"/"Later"** to distinguish inline self-check quizzes from the rejected certification program, per the shared brief's known tension. The AST/renderers accommodate either (F8); nothing in the code blocks this decision. Standalone-safe (docs + a decision record).

**R4 (M) — For the OWID replacement, extend `Iframe` (dataset variant) rather than minting a new node kind** (F5), and add a build-time grapher-fetch step beside the existing asset-pipeline precedent (`pushPublicFiles`). Risks: chart-library client-JS budget on a performance-sensitive site (ROADMAP perf pass); OWID licence terms verification (flagged, not concluded). Depends on R1/R2 for the node-kind change to be cheap.

**R5 (S) — Add the new interactive node kinds to the read-along exclusion mechanism** (`word-highlight.ts:57` `UNSPOKEN_SELECTOR`) in the same change as the component, not as a follow-up (F6). Trivial alone, annoying to debug if forgotten.

**What I would not do:** (a) build answer-hiding/server-side scoring now — it re-opens the rejected certification scope (`PRINCIPLES.md:204`); (b) mint separate `Chart`, `Quiz`, `Flashcard` kinds with bespoke renderer branches without R1/R2 — that is four new silent-drop surfaces; (c) author quizzes anywhere that bypasses the transformer's component mechanism while prose remains Doc-sourced — it forks the editorial surface.

## Disposition

Pending owner decision. R1 and R2 are the coupled pair (vocabulary change) and should be decided together; R3 is a decision record, safe standalone, and should come first chronologically; R4 and R5 depend on R1/R2 landing. R1/R2 are behaviour-preserving only if landed behind the snapshot baseline recommended in R2; otherwise they must ride the same review as the first content-type addition. The edit-site count in F4 should be re-verified when the first quiz is actually added (see Limitations).

