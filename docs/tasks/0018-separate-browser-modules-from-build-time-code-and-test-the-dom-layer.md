---
schema_version: 2
id: "0018"
uid: "task-20260921T203527011228Z-20d23c71"
title: "Separate browser modules from build time code and test the DOM layer"
role: task
status: todo
summary: "Separate src/lib's browser-runtime modules from build-time code and test the DOM layer, completing the extraction pattern follow-scroll.ts began."
created: "2026-09-21"
updated: "2026-09-21"
owner: Markov Grey
supersedes: ""
superseded_by: ""
engineering_document:
  version: 1
  contract_tier: full
  role: task
  id: "0018"
  uid: task-20260921T203527011228Z-20d23c71
  title: "Separate browser modules from build time code and test the DOM layer"
  state: todo
  authority:
    kind: work-state
    owner: Markov Grey
    scope: Decision-ready work order; src/ is frozen — execution requires the owner's decisions D1–D3 below
  created: "2026-09-21"
  updated: "2026-09-21"
  transition_history: unverified
  transitions: []
  relationships: []
  details:
    criteria: [criterion:AC-1, criterion:AC-2, criterion:AC-3, criterion:AC-4, criterion:AC-5]
    size: m
    priority: p1
    # Optional scheduling hints:
    # depends_on: ["0042"]
    # parent: "0090"
    # touches: ["software-engineering/public/**", "software-engineering/dev/tests/**"]
    # Under the agent_scheduling profile, an oversized task warns (advisory) and prompts a split.
    # Justify legitimately atomic large work with an exception that suppresses the prompt:
    # atomic_large:
    #   rationale: "why this cannot be split into vertical slices"
    #   rollback: "how to revert / verify if it goes wrong"
    #   checkpoints: ["intermediate checkpoint 1", "intermediate checkpoint 2"]
---

# Task 0018: Separate browser modules from build time code and test the DOM layer

## Problem

Three audits reach the same corner of `src/lib/` from different sides, which is why they belong in
one task: `audit:0002` F2 (no build-time/browser marker), `audit:0003` F1 (the DOM half is the
untested half), and `audit:0005` F4 (the one risky non-null assertion sits in that untested half).

- **No marker on the boundary.** `src/lib/` holds 11 non-test modules that split cleanly into
  build-time (4 modules, 206 lines: `build-mode.ts` 77, `textbooks.ts` 52, `sentences.ts` 53,
  `og.ts` 24) and browser-runtime (7 modules, 2,097 lines), with nothing in a filename, directory,
  or export signalling which is which (`audit:0002` F2). A contributor cannot tell from the tree
  whether adding a Node import to a `lib/` module is safe.
- **Pure logic is tested; DOM code is not** (`audit:0003` F1): `word-align.ts` 327 lines/17 tests,
  `follow-scroll.ts` 90/14, `section-audio.ts` 106/11 — against `word-highlight.ts` 724/**0**,
  `audio-player.ts` 484/**0**, `reader.ts` 256/**0**, `audio-source-switch.ts` 110/**0**. 523 lines
  of pure logic carry 42 tests; 1,574 lines of DOM-touching code carry none.
- **The one runtime-risky non-null assertion** — `reader.ts:203` (`progressBar!.style.width`), a DOM
  lookup in browser code — sits in that untested set (`audit:0005` F4). If the element is absent the
  page throws at runtime.

**The pattern already exists in the repo, and that is the strongest argument for this task.**
`follow-scroll.ts:4` states it was "Kept separate from the DOM wiring in word-highlight.ts so the
decisions -- when to scroll and how far -- can be checked directly." The technique — extract the
decision from the wiring, test the decision, leave a thin shell — was applied to scroll geometry and
to alignment and then not completed; `word-highlight.ts` is the 724-line residue. The cost is
demonstrated, not hypothetical: two defects in that module shipped on 2026-09-20 (list items not
wrapped; a `contain: paint` regression clipping list markers) and were caught by the owner viewing
pages by eye, with `pnpm verify` green throughout (`audit:0003` F2; `task:0009`). The adjacent risk
was guarded (`task:0008` added the chapter-timing structural tests), but nothing covers the
DOM-wrapping behaviour where both defects actually were.

Who it affects: the maintainer, who is currently the test suite for read-along regressions on the
newest, least settled subsystem; contributors, who can misjudge `src/lib/` import safety; and
readers, who absorb the regressions the gate misses.

**Counter-case — reasons recorded against acting:** (1) PRINCIPLES §7 deliberately weights the test
budget toward rendered-output layers, not unit tests of internal helpers — a jsdom suite could read
as contradicting that; the resolution is that these tests target demonstrated failures, not
speculative helpers (see D3 for the layer split). (2) `audit:0002` rec 4 warns that churn in the
least settled code competes with stability and recommends deferring the read-along colocation until
`task:0002`'s R2 migration has landed. (3) `audit:0002`'s disposition warns that its recs 3–4 move
the same `src/lib/` files and must be decided together. (4) Adding jsdom is a new dev dependency
(none exists today — verified in `package.json`), justified only because demand is demonstrated
(PRINCIPLES §10). None of these argue against the tests; all argue about order and harness, which
is what the decision section fixes.

## Decisions required before execution

### D1 — Regression tests against the current DOM shell now, or after extraction?

- **Question:** do the tests for the two shipped defect classes get written against today's
  `word-highlight.ts` shell, or only after the decisions are extracted from it?
- **Options:** (a) write them now, additive, touching no production code — `audit:0003` rec 2 calls
  this "the highest value-to-risk item in the audit" and presses for it; (b) extract first, tests
  attach to the extracted seams (rec 1) — cleanest target, but it needs design agreement under the
  `handoff:0002` constraint and restructures the least settled module with no net under it; (c) one
  combined change — couples an additive win to a design discussion, delaying it.
- **Recommendation:** (a). Shell-level tests assert observable wrapping, not internals, so an
  extraction that is truly an extraction leaves them passing. Extraction-first means moving 724
  untested lines before anything pins their behaviour.
- **Irreversible if wrong:** nothing is technically irreversible; the cost of the wrong order is
  that the demonstrated failure class stays unguarded during the move. Worst case for (a) is
  rewriting a few tests if the extraction changes observable behaviour — which it should not.

### D2 — Move the browser modules now (`src/lib/client/`), or defer all moves until `task:0002`'s R2 migration lands?

- **Question:** create a `src/lib/client/` subdirectory for the seven browser modules now
  (`audit:0002` rec 3), or leave the tree as-is until the read-along colocation (rec 4) can be
  decided in the same move?
- **Options:** (a) rec 3 now — 7 file moves plus import updates in `Reader.astro` (the read-along's
  single wiring point) and the section page; mechanical, `pnpm typecheck`-verified; colocation later;
  (b) defer both moves until after `task:0002`'s R2 migration, then decide 3 and 4 together — rec 4
  explicitly recommends this, and the disposition warns that taking 3 and 4 separately moves the
  same files twice; (c) do both now — maximum churn in the least settled code, against rec 4.
- **Recommendation:** (b), with (a) as the fallback if `task:0002` slips. Three work streams
  converge on one small module: rec 4's colocation wants `chapter-timing.ts` relocated, `task:0002`
  rewrites its 71 pinned CDN URLs, and `task:0014`'s edition keying touches the same file
  (`audit:0007` F3). That is exactly when to sequence moves, not make them. Nothing here blocks D1's
  tests, which are location-independent.
- **Irreversible if wrong:** no move is irreversible (`git mv` back), but moving twice wastes review
  and risks re-breaking the single wiring point; a move landing mid-`task:0014` edition work would
  churn the same import sites again.

### D3 — jsdom, Playwright, or both, for the DOM regression tests?

- **Question:** which harness asserts the two defect classes — a jsdom unit test in the fast
  `pnpm test` loop, or assertions in the existing Playwright layer that drives built pages
  (`tests/a11y/`, `tests/smoke/`)?
- **Options:** (a) jsdom only; (b) Playwright only; (c) hybrid — jsdom for the wrapping decision,
  Playwright for the containment/clip outcome.
- **Recommendation:** (c). The split is dictated by what each defect class actually is: the
  2026-09-20 wrapping regression (`95fdfd9` — list items' words not wrapped) is fully assertable in
  jsdom; the containment regression (`6286d39` — `contain: paint` clipping list markers) is a
  **layout** outcome, and jsdom does not perform layout, so a jsdom test can only assert the CSS is
  applied, never that the marker is visible — only a real browser sees the clip. (b) alone would put
  the cheap regression check in the `test:smoke`/`test:a11y` lanes, which are excluded from the
  default `pnpm test` run (`vitest.config.ts`) and need a full build first.
- **Irreversible if wrong:** little — jsdom is a removable dev dependency. The real cost of (a)
  alone is a green suite that still misses the demonstrated clip class; the real cost of (b) alone
  is gating regression detection behind a build.

## Scope

In execution order; steps 1–2 are independent of steps 3–4.

1. **Regression tests for the two shipped defect classes (D1, D3).** A jsdom test asserting list
   items' words are wrapped (the `95fdfd9` class) in the default `pnpm test` run, plus a
   real-browser assertion for the containment class (the `6286d39` class) per D3's outcome.
   Additive; no production code changes. Requires the `src/` freeze lifted for the new test files.
2. **`reader.ts:203` guard (`audit:0005` rec 5).** Null check with a loud error per PRINCIPLES §2,
   or coverage via step 1 — cross-referenced with `task:0020`, which carries the same item; the
   owner picks one home for it so it is not duplicated.
3. **Boundary move per D2.** Likely deferred: record the D2 outcome here, and if deferred, name the
   sequencing condition (`task:0002` R2 landed, `task:0014` keying settled) under which the
   `src/lib/client/` move and the rec-4 colocation are taken together.
4. **Extract decision seams from `word-highlight.ts` (`audit:0003` rec 1).** Candidate seams named
   by the audit: which elements are wrappable, whether an element is skipped as nested or unspoken,
   and how a word index maps to a span. Follows the `follow-scroll.ts` pattern and its header
   rationale. Requires owner design agreement before any `src/` change (`handoff:0002`), and is
   sequenced with step 3's colocation decision so the same files are not restructured twice.

## Out of scope

- **`transformer.ts` refactor** — `audit:0002` explicitly declines to re-raise it; already scoped in
  ROADMAP "Later" with recorded reasoning.
- **`src/components/` grouping** (`audit:0002` rec 5) — separate, purely cosmetic churn decision.
- **`chapter-timing.ts` URL/host migration** (`task:0002`) and **edition/language keying**
  (`task:0014`) — this task sequences around them, it does not do them.
- **a11y gate building or remediation** — landed separately (ROADMAP "Now", a11y state update); this
  task adds at most one assertion to the existing layer.
- **Audio-subsystem behaviour changes** — `audio-player.ts`/`audio-source-switch.ts` only move with
  step 3 if D2 decides a move; their behaviour is untouched.

## Done when

- **AC-1:** A test in the default `pnpm test` run asserts that list-item words are wrapped in the
  read-along spans, and demonstrably fails when the wrapping behaviour is removed (reintroducing the
  `95fdfd9` defect class makes `pnpm test` red).
- **AC-2:** The containment defect class is asserted in the real-browser layer against built output,
  demonstrably failing when the containment style is removed (the `6286d39` class) — or D3 was
  decided jsdom-only and this record carries that limitation explicitly.
- **AC-3:** `reader.ts:203` no longer unguardedly asserts a DOM lookup: either a null check with a
  loud error, or an explicit test covers the lookup path; the chosen home for the item (this task vs
  `task:0020`) is recorded in both records.
- **AC-4:** The D2 outcome is recorded; if a move was decided, a reader of the tree can tell which
  modules run in the browser (e.g. `src/lib/client/` holds exactly the seven browser modules), all
  import sites are updated, and `pnpm typecheck` passes.
- **AC-5:** At least one decision seam from `word-highlight.ts` (`audit:0003` rec 1) is extracted
  with its own test and a `follow-scroll.ts`-style header — or the deferral is recorded with the
  owner's design-agreement status stated.

## Completion evidence

| AC | Evidence |
| --- | --- |
| AC-1 | — |
| AC-2 | — |
| AC-3 | — |
| AC-4 | — |
| AC-5 | — |

## Authority and inputs

- `docs/audits/0002-structure-modularity-and-file-tree-coherence.md` — F2 (no boundary marker), F3
  (read-along scatter; `Reader.astro` wiring point), rec 3 (`src/lib/client/`), rec 4 (colocation,
  deferred until `task:0002` R2), disposition warning that recs 3–4 must be decided together.
- `docs/audits/0003-test-suite-depth-gaps-and-architectural-fitness.md` — F1 (tested/untested
  split), F2 (the two shipped regressions, verify-blind), rec 1 (extract the seams), rec 2 (the
  regression tests; "highest value-to-risk item in the audit").
- `docs/audits/0005-code-quality-patterns-and-typescript-idiom.md` — F4 (the four non-null
  assertions; `reader.ts:203` named), rec 5 (guard or test it).
- `docs/tasks/0009` — the regression evidence record; `docs/tasks/0008` — the adjacent timing guard;
  `docs/tasks/0002` — R2 migration that gates the D2 sequencing; `docs/tasks/0014` — edition keying
  that touches the same module.
- `docs/handoffs/0002` §Constraints — design agreement required before `src/` changes.
- `docs/PRINCIPLES.md` — §2 (fail loud), §7 (layered testing), §9 (cohesion), §10 (YAGNI).
- Code anchors: `src/lib/follow-scroll.ts:4` (the stated pattern), `src/lib/reader.ts:203`,
  `src/lib/word-highlight.ts`, `src/layouts/Reader.astro`, `vitest.config.ts` (test-lane split).
