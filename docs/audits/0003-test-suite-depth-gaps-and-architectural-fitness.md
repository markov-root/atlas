---
schema_version: 2
id: '0003'
uid: 'audit-20260921T134853000000Z-9d2e77b1'
title: 'Test-suite depth, gaps and architectural fitness'
role: audit
status: draft
summary: 'Pure logic is well tested and DOM-touching code is not; 1,574 lines of browser shell carry zero tests.'
created: '2026-09-21'
updated: '2026-09-21'
owner: Markov Grey
supersedes: ''
superseded_by: ''
engineering_document:
  version: 1
  contract_tier: full
  role: audit
  id: '0003'
  uid: audit-20260921T134853000000Z-9d2e77b1
  title: 'Test-suite depth, gaps and architectural fitness'
  state: draft
  authority:
    kind: point-in-time-evidence
    owner: Markov Grey
    scope: 'Unit, smoke and a11y suites at commit 7e4dc36; pnpm test executed, build-dependent suites were not'
  created: '2026-09-21'
  updated: '2026-09-21'
  transition_history: unverified
  transitions: []
  relationships: []
  details:
    as_of: '2026-09-21'
    subjects: ['AI Safety Atlas test suites at 7e4dc36 (181 unit tests, 18 files)']
    method: 'Ran pnpm test; counted per-file test cases by regex; cross-referenced modules against sibling test files'
    limitations:
      - 'No coverage instrumentation was run; "untested" means no sibling test file, not zero covered lines'
      - 'test:smoke, test:a11y and build were NOT executed (VM memory constraint)'
      - 'Test quality was not assessed beyond counts and the modules under test'
---

# Audit 0003: Test-suite depth, gaps and architectural fitness

## Scope

The test suites of AI Safety Atlas at commit `7e4dc36` (branch `codebase-cleanup`, 2026-09-21):
18 unit-test files under `src/`, 2 smoke tests under `tests/smoke/`, and 1 accessibility suite under
`tests/a11y/`.

**Examined:** which modules have tests, how many cases each file contains, the relationship between
tested and untested modules, and agreement with the layering `docs/PRINCIPLES.md` §7 claims.

**Not examined:** assertion quality, mutation resistance, flakiness, CI duration, and the content of
the smoke and a11y suites beyond their structure. No coverage instrumentation was run.

## Method

```bash
pnpm test                                             # 181 passed, 18 files, 7.81s
rg -c '^\s*(it|test)\(' <each test file>              # per-file case counts
fdfind -e ts . src | rg -v '\.test\.ts$'              # modules, then check for a sibling test
```

`pnpm test` was run and completed in 7.81s; memory commit was sampled before and after and held at
69%. **`pnpm test:smoke`, `pnpm test:a11y`, and `pnpm build` were deliberately not run** — this VM
has crashed twice under build load, and `handoff:0002` §Constraints forbids them. Findings about
those suites therefore rest on reading them, not on running them.

`docs/PRINCIPLES.md` §7 (Layered testing) and §16 (Tests reflect user outcomes) were read before
forming conclusions.

## Findings

### F1 — Pure logic is tested; DOM-touching code is not

_Observation._ The seven browser-runtime modules in `src/lib/` split exactly along whether they touch
the DOM:

| Module                   | Lines | Tests | Touches DOM directly   |
| ------------------------ | ----: | ----: | ---------------------- |
| `word-align.ts`          |   327 |    17 | no — alignment math    |
| `follow-scroll.ts`       |    90 |    14 | no — scroll geometry   |
| `section-audio.ts`       |   106 |    11 | no — source resolution |
| `word-highlight.ts`      |   724 | **0** | yes                    |
| `audio-player.ts`        |   484 | **0** | yes                    |
| `reader.ts`              |   256 | **0** | yes                    |
| `audio-source-switch.ts` |   110 | **0** | yes                    |

523 lines of pure logic carry 42 tests. 1,574 lines of DOM-touching code carry none.

_Inference._ This is not neglect — it is a deliberate pattern that was applied and then stopped.
`src/lib/follow-scroll.ts:4` states it is "Kept separate from the DOM wiring in word-highlight.ts so
the decisions -- when to scroll and how far -- can be checked directly." The project already knows
the technique: extract the decision from the wiring, test the decision, leave a thin shell. It was
applied to scroll geometry and to alignment, and `word-highlight.ts` is the 724-line residue where
it was not completed. The gap is therefore _shaped_ rather than uniform, which makes it far more
tractable than a bare "no tests on the browser code" would suggest.

### F2 — The largest and newest module is the least tested

_Observation._ `src/lib/word-highlight.ts` is 724 lines, the second-largest file in the repo, shipped
2026-09-20, and has no test file. Two defects in it were found and fixed within 24 hours of shipping,
both by the owner viewing pages by eye rather than by any automated check:
`task:0009` records list items not being wrapped, and a `contain: paint` regression that clipped list
markers (`95fdfd9`, `6286d39`). `pnpm verify` passed throughout both.

_Inference._ The evidence that the current gate cannot see this module's defects is not theoretical;
it is two shipped regressions in one day. `task:0008` responded by adding
`src/data/chapter-timing.test.ts` (8 tests) as a structural guard over the _timing data_, which is
the adjacent risk, but nothing covers the DOM-wrapping behaviour where both defects actually were.

### F3 — Node-side pipeline coverage is proportionate, with one thin spot

_Observation._ The content pipeline is well covered relative to size, except `transformer.ts`:

| Module              | Lines |                                                                   Tests |
| ------------------- | ----: | ----------------------------------------------------------------------: |
| `transformer.ts`    |   750 | 22 (3 in `transformer.test.ts`, 19 in `transformer.edge-cases.test.ts`) |
| `gdocsdk.ts`        |     — |                                                                      13 |
| `renderers/audio/*` |     — |                                                       28 across 4 files |
| `loader.ts`         |     — |                                                                       6 |
| `algolia.ts`        |     — |                                                                       6 |

_Inference._ 22 cases for the repo's largest module is the thinnest ratio on the Node side, and
`transformer.ts` is also the module `docs/ROADMAP.md` §Later already targets for a state refactor.
Those two facts compound: a refactor of the least-tested large module is the riskiest kind. This is
an argument for strengthening its tests _before_ that refactor, not for doing either now.

### F4 — The layering claimed in PRINCIPLES §7 holds

_Observation._ `docs/PRINCIPLES.md` §7 describes layered testing; the tree matches it — pure unit
tests beside their modules, storage/integration tests in `textbook-loader/`, snapshot tests
(`output-snapshots.test.ts`, `__snapshots__/`), a build smoke suite (`tests/smoke/`), and an
accessibility suite (`tests/a11y/`). `pnpm verify` chains all of them, enforced by a `pre-push` hook.

_Inference._ No finding. Recorded because an audit that lists only gaps misrepresents a suite whose
architecture is sound; the issue in F1/F2 is coverage of one region, not the design of the layering.

### F5 — The a11y suite generates its cases from build output

_Observation._ `tests/a11y/a11y.test.ts` contains no literal `it(`/`test(` calls at the top level. It
walks `dist/` (`readdirSync` over version → chapter → section at lines 47–55) and generates cases
inside `describe('axe-core accessibility scan')`, with a `baseline.json` alongside.

_Inference._ A naive count reports this file as having zero tests — it does not; the count is a
measurement artifact of the regex used in this audit's method. The real property worth noting is that
this suite's case count is a function of built output, so it cannot run without a prior build, and
its coverage silently tracks however many sections `dist/` happens to contain.

## Limitations

- **No coverage instrumentation.** "Untested" throughout means "has no sibling `.test.ts`". A module
  may still be exercised indirectly — `word-highlight.ts` is certainly touched by the a11y suite via
  rendered pages. Line or branch coverage is entirely unestablished.
- **Three suites were not executed.** `test:smoke`, `test:a11y`, and `build` were not run, per the
  VM constraint. Statements about them come from reading their source.
- **Test _quality_ was not assessed.** A file with 17 cases is not necessarily better tested than one
  with 6; no assertion strength or mutation testing was performed. F3's "thin spot" claim rests on
  a count-to-size ratio, which is a weak proxy.
- **The DOM/non-DOM classification in F1 is the auditor's**, from reading each module's imports and
  purpose. It is not derived from a tool.

## Recommendations

1. **Extract the decisions out of `word-highlight.ts` and test them, following the pattern the
   project already established (F1, F2). Size M.** `follow-scroll.ts` is the worked example and its
   header states the rationale. Candidate seams visible in `word-highlight.ts`: which elements are
   wrappable, whether an element should be skipped as nested or unspoken, and how a word index maps
   to a span. Each is a pure decision currently embedded in DOM traversal. Risk: this is a refactor
   of the least settled module, so it should be sequenced with audit:0002's recommendation 4 rather
   than done independently — and per `handoff:0002` it needs design agreement first.

2. **Add a DOM-level test for the two defect classes that actually shipped (F2). Size S.** A jsdom
   test asserting that a list item's words get wrapped, and that a wrapped element's computed
   containment does not clip its marker, would have caught both 2026-09-20 regressions. Risk: low;
   this is additive and touches no production code. **This is the highest value-to-risk item in the
   audit** — it is small, additive, and targets two demonstrated failures rather than a hypothesis.

3. **Strengthen `transformer.ts` coverage before the ROADMAP state refactor, not now (F3). Size M.**
   Risk of acting now: spending effort on tests that the refactor will rewrite. Risk of not acting:
   the refactor lands on the thinnest-tested large module. Recommend explicitly attaching this to the
   refactor's own task record when that is written, so it is not lost.

4. **No action on the a11y count artifact (F5).** Worth a one-line comment in the file noting that
   cases are generated, to spare the next reader the same confusion. Size S, risk none.

## Disposition

**Pending owner decision. No code change is authorised by this audit.**

Recommendation 2 is the one this audit would press for: it is additive, small, needs no structural
agreement, and addresses two regressions that demonstrably escaped the existing gate.

Recommendations 1 and 3 are refactors and fall squarely under the `handoff:0002` constraint requiring
design agreement before `src/` changes. Recommendation 1 should be decided together with audit:0002's
structural recommendations, since both move the same files.

The suite's architecture needs no change (F4); every recommendation here is about coverage of a
specific region.
