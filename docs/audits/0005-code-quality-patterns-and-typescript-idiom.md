---
schema_version: 2
id: '0005'
uid: 'audit-20260921T134857000000Z-5c7a93f0'
title: 'Code quality, patterns and TypeScript idiom'
role: audit
status: draft
summary: 'Strict TS config and zero lint errors, with the only gaps being 11 unused type imports and 7 localized type-escape hatches.'
created: '2026-09-21'
updated: '2026-09-21'
owner: Markov Grey
supersedes: ''
superseded_by: ''
engineering_document:
  version: 1
  contract_tier: full
  role: audit
  id: '0005'
  uid: audit-20260921T134857000000Z-5c7a93f0
  title: 'Code quality, patterns and TypeScript idiom'
  state: draft
  authority:
    kind: point-in-time-evidence
    owner: Markov Grey
    scope: 'TypeScript and Astro sources at commit 7e4dc36; pnpm lint executed, pnpm typecheck executed 2026-09-21 in contributor mode'
  created: '2026-09-21'
  updated: '2026-09-21'
  transition_history: unverified
  transitions: []
  relationships: []
  details:
    as_of: '2026-09-21'
    subjects: ['AI Safety Atlas TypeScript and Astro sources at 7e4dc36']
    method: 'Ran pnpm lint; grepped for any/non-null assertions/eslint-disable; read tsconfig.json and eslint.config.js'
    limitations:
      - 'pnpm typecheck run 2026-09-21 in contributor mode: 0 errors, 119 files; its 49 hints were not individually reviewed'
      - 'Astro template code was only grepped, not analysed'
      - 'No complexity, duplication, or cyclomatic metrics were computed'
---

# Audit 0005: Code quality, patterns and TypeScript idiom

## Scope

TypeScript and Astro sources of AI Safety Atlas at commit `7e4dc36` (branch `codebase-cleanup`,
2026-09-21): 49 `.ts` and 57 `.astro` files, plus `tsconfig.json` and `eslint.config.js`.

**Examined:** lint results, compiler strictness configuration, type-escape hatches (`any`, non-null
assertions, `eslint-disable`), and the stated intent of the lint configuration.

**Not examined:** code duplication, cyclomatic complexity, Astro template logic, CSS, and runtime
error handling behaviour. (`pnpm typecheck` was originally out of scope on VM-memory grounds; it was
run on 2026-09-21 once headroom allowed — see F7 and Limitations.)

## Method

```bash
pnpm lint                                        # 11 problems, 0 errors, 11 warnings
rg -n ': any\b|as any\b' src --glob '!*.test.ts'  # 7 occurrences
rg -n '\w!\.' src --glob '!*.test.ts'             # non-null assertions
rg -n 'eslint-disable|@ts-ignore|@ts-expect-error' src
cat tsconfig.json eslint.config.js
```

`pnpm lint` was run to completion. `pnpm typecheck` was **not** run: it sets
`NODE_OPTIONS=--max-old-space-size=3584`, and `handoff:0002` §Constraints forbids heavy commands on
this VM after two memory crashes. `docs/PRINCIPLES.md` §11 (Type safety where it actually catches
bugs) and `docs/ROADMAP.md` §Next were read first.

## Findings

### F1 — The configured baseline is strict and its choices are documented

_Observation._ `tsconfig.json` extends `astro/tsconfigs/strict` and adds a `@/*` → `src/*` path
alias. `eslint.config.js` opens with a comment stating the intent: _"The point isn't to enforce a
style — it's to catch genuine bugs and code smells without drowning agents/contributors in noise …
prefer 'warn' over 'error' for non-bug issues."_ It composes `js.configs.recommended`,
`astroPlugin.configs.recommended`, and `tseslint.configs.recommended`, then disables specific rules
with a written reason at each site — for example `no-undef` off because "TS already catches undefined
identifiers more accurately than ESLint", and `no-unused-expressions` off for `.astro` because the
plugin flags `<MyComponent />` as an unused expression.

_Inference._ No finding. Every deviation is deliberate and justified in place. `pnpm lint` reports
**0 errors**. An audit of "code quality patterns" that did not lead with this would be misleading:
the configuration is above the norm for a project this size.

### F2 — All 11 lint warnings are unused imports, concentrated in one directory

_Observation._ Every warning is `@typescript-eslint/no-unused-vars`, and every one is in
`src/textbook-loader/`:

| File                                        | Unused symbol(s)                            |
| ------------------------------------------- | ------------------------------------------- |
| `algolia.ts:2`                              | `Chapter`, `Section` (types)                |
| `loader.ts:10,14,15`                        | `SectionRef`, `Node` (types), `getNodeText` |
| `transformer.ts:3`                          | `FootnoteData`, `TocEntry` (types)          |
| `renderers/markdown-renderer.ts:2`          | `Section` (type)                            |
| `renderers/pdf/renderer.ts:9,303`           | `Section` (type), `ctx` (arg)               |
| `renderers/audio/equation-describer.ts:133` | `type` (arg)                                |
| **Total**                                   | 9 unused type imports, 2 unused args        |

_Inference._ These are refactor residue — imports whose last use was deleted. `lesson:0003` records
the same class of warning being consciously deferred ("Pre-existing unused imports flagged by
`astro check` … Left as-is — not Track A scope"), so the deferral is deliberate and recorded, not
overlooked. The concentration in `textbook-loader/` is consistent with that being the most-refactored
area. They are warnings by design, since the config reserves `error` for build-failing problems.

### F3 — Seven `any` escape hatches, of two distinct kinds

_Observation._ `@typescript-eslint/no-explicit-any` is explicitly `'off'` in the config. Seven
occurrences exist in non-test code:

**Kind 1 — `catch (err: any)`, 5 occurrences:** `elevenlabs-tts.ts:124`, `gemini-tts.ts:111`,
`r2-cache.ts:89`, `r2-cache.ts:175`, `pdf/renderer.ts:87`.

**Kind 2 — `props as any`, 2 occurrences:** `src/pages/chapters/[version]/[chapter].md.ts:28` and
`src/pages/chapters/[version]/[chapter]/[section].md.ts:32`, both destructuring route props.

_Inference._ The two kinds differ in what they cost. `astro/tsconfigs/strict` enables
`useUnknownInCatchVariables`, so the five `catch (err: any)` annotations are explicitly opting _out_
of a protection the project otherwise turned on; `unknown` plus narrowing is the modern idiom and
these predate or ignore it. The two `props as any` casts are more consequential: they discard typing
at a route boundary, which is where a wrong shape produces a broken page rather than a caught error.
Both are single-line and localized.

### F4 — Four non-null assertions, one on a DOM lookup

_Observation._ `src/lib/reader.ts:203` (`progressBar!.style.width`),
`src/textbook-loader/transformer.ts:182` (`el.paragraph!.paragraphStyle?.…`), and two in
`src/pages/chapters/[version]/[chapter]/[section].astro:259-260` (`lecture!.url`, `lecture!.status`).

_Inference._ `reader.ts:203` is the one worth naming: it asserts a DOM element exists in browser code
that, per audit:0003 F1, has no tests. If the element is absent the page throws at runtime. The other
three are guarded by surrounding logic or by Astro's build-time rendering. Note the interaction with
`docs/PRINCIPLES.md` §2 ("Fail loud, not silent") — a non-null assertion does fail loudly, so this is
a mild tension rather than a contradiction.

### F5 — The main available typing improvement is already planned

_Observation._ `src/textbook-loader/transformer.ts:5` defines `export type Node = {` as a single wide
object type covering all AST node kinds. `docs/ROADMAP.md` §Next already contains "Discriminated-union
AST node types".

_Inference._ No new finding. The single largest type-safety improvement available in this codebase is
already identified, scoped, and queued by the project. Recorded so this audit's silence is not read
as the opportunity having been missed.

### F6 — Formatting is deliberately unenforced

_Observation._ `format` and `format:check` (Prettier) exist as scripts but `format:check` is excluded
from `pnpm verify`, with an explicit comment in `engineering.yaml:56-57`: _"`format:check` (prettier)
is intentionally NOT adopted — the project defers a bulk reformat (see docs/ROADMAP.md)."_
`docs/ROADMAP.md` §Now lists "Format-the-codebase pass (then re-enable format:check in verify)".

_Inference._ No finding. A decision, its reason, and its exit condition are all recorded in two
places. Re-raising it would be re-litigating a documented choice.

### F7 — `pnpm typecheck` is not hermetic: it needs network and, with credentials present, live Google Docs

_Observation._ Added 2026-09-21 after this audit's recommendation 1 was executed. `pnpm typecheck`
(`astro check`) loads `src/content.config.ts`, which constructs `TextbookLoader`. With
`GOOGLE_CREDENTIALS_BASE64` set in `.env`, the first run failed with a TLS `ETIMEDOUT` — a network
error, not a type error, and with no message indicating that typechecking had attempted a remote
fetch. Re-running with `GOOGLE_CREDENTIALS_BASE64=` (contributor mode, committed cache) completed:
**119 files, 0 errors, 0 warnings, 49 hints.**

_Inference._ A maintainer's typecheck depends on live Google Docs availability; a contributor's does
not, because `BuildMode` routes them to the committed cache. This is the same coupling
`docs/ARCHITECTURE.md` now records for the build, but it is surprising in a *typechecker*, where the
reasonable expectation is a pure static analysis. It also means a maintainer offline or behind a slow
link cannot run the repo's own `verify` gate. The failure is loud (non-zero exit, stack trace) but
not diagnostic — nothing in the output says "this was a content fetch".

## Limitations

- ~~**`pnpm typecheck` was not run.**~~ **Resolved 2026-09-21** — run in contributor mode: 119 files,
  0 errors, 0 warnings, 49 hints. The attempt also produced F7. The 49 hints were not individually
  reviewed, so "0 errors" is not a claim that every hint is benign.
- **Astro templates were grepped, not analysed.** 57 `.astro` files contributed only their `any` and
  non-null-assertion counts; their logic was not reviewed.
- **No duplication or complexity metrics.** Statements about quality rest on escape-hatch counts and
  configuration review, which say nothing about whether the code is well-factored internally.
- **`any` counting is syntactic.** Implicit `any` from untyped third-party surfaces would not appear;
  only explicit annotations were counted.

## Recommendations

1. ~~**Run `pnpm typecheck` and record the result.**~~ **Done 2026-09-21** (see Limitations and F7):
   0 errors across 119 files. The type-safety picture is no longer incomplete. Follow-on from F7:
   consider making `typecheck` hermetic by forcing contributor mode, so the repo's own gate does not
   depend on a third party's uptime. Size S; risk: it would stop typechecking whatever differs in
   maintainer mode, which may be nothing — verify before adopting.

2. **Replace the two `props as any` casts with typed route props (F3, kind 2). Size S.** These are at
   a route boundary where a wrong shape breaks a page. Risk: low; two single-line changes, and
   `pnpm typecheck` verifies them directly.

3. **Convert the five `catch (err: any)` to `catch (err: unknown)` with narrowing (F3, kind 1).
   Size S.** Restores a protection `strict` already enables. Risk: low but touches five error paths
   in the audio and PDF renderers, which audit:0003 shows are moderately tested — worth running the
   suite rather than assuming.

4. **Clear the 11 unused imports (F2). Size S.** Mechanical; `eslint --fix` does not remove unused
   imports, so this is manual or via an organize-imports pass. Risk: essentially none, but note this
   is exactly the change a bulk Prettier pass (ROADMAP §Now) would collide with — **sequence it with
   that pass rather than separately**, or the same files get churned twice.

5. **Guard or test `reader.ts:203`'s non-null assertion (F4). Size S.** Either a null check with a
   loud error per §2, or coverage via audit:0003 recommendation 2. Risk: none.

**Not recommended:** any change to the AST node types (F5) or to formatting enforcement (F6). Both
are documented decisions with recorded reasoning and a place in the queue.

## Disposition

**Pending owner decision. No code change is authorised by this audit.**

Recommendation 1 is a prerequisite for trusting the rest and involves no code change — it should
happen regardless of what is decided about the others.

Recommendations 2–5 are all size S, low risk, and mutually independent; unlike audit:0002's
structural recommendations they do not require an agreed tree and could be taken as a single small
change once the owner lifts the `src/` freeze. Recommendation 4 has a stated sequencing dependency
on the planned format pass.

No correctness defect was found. The baseline (F1) is strong, and three of the six findings are
records of decisions the project already made correctly.
