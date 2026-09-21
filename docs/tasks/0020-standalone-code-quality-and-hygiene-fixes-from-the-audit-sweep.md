---
schema_version: 2
id: "0020"
uid: "task-20260921T203528447929Z-0ff6970e"
title: "Standalone code quality and hygiene fixes from the audit sweep"
role: task
status: todo
summary: "Bundle the sweep's size-S standalone fixes: route-prop types, unknown catches, unused imports, devDependencies, gitignore residue, hermetic typecheck."
created: "2026-09-21"
updated: "2026-09-21"
owner: Markov Grey
supersedes: ""
superseded_by: ""
engineering_document:
  version: 1
  contract_tier: full
  role: task
  id: "0020"
  uid: task-20260921T203528447929Z-0ff6970e
  title: "Standalone code quality and hygiene fixes from the audit sweep"
  state: todo
  authority:
    kind: work-state
    owner: Markov Grey
    scope: Decision-ready work order; src/ is frozen — execution requires the owner's decisions D1–D2 below
  created: "2026-09-21"
  updated: "2026-09-21"
  transition_history: unverified
  transitions: []
  relationships: []
  details:
    criteria: [criterion:AC-1, criterion:AC-2, criterion:AC-3, criterion:AC-4, criterion:AC-5, criterion:AC-6, criterion:AC-7]
    size: s
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

# Task 0020: Standalone code quality and hygiene fixes from the audit sweep

## Problem

Seven small, independent, low-risk fixes surfaced by two audits (`audit:0004` F3/F4, `audit:0005`
F2/F3/F4/F7) that are individually trivial but collectively easy to lose among the structural work.
They are collected here so each is one reviewable commit with no dependency on any other task.
Each is size S and none depends on another (verified below); the only sequencing constraint is the
one D1 records.

- **Two `props as any` casts at route boundaries** (`src/pages/chapters/[version]/[chapter].md.ts:28`,
  `src/pages/chapters/[version]/[chapter]/[section].md.ts:32`; verified). The most consequential of
  the seven: they discard typing exactly where a wrong shape produces a broken page rather than a
  caught error (`audit:0005` F3, kind 2).
- **Five `catch (err|error: any)` annotations** (`elevenlabs-tts.ts:124`, `gemini-tts.ts:111`,
  `r2-cache.ts:89`, `r2-cache.ts:175`, `pdf/renderer.ts:87`; verified). `astro/tsconfigs/strict`
  already enables `useUnknownInCatchVariables`, so each annotation explicitly opts out of a
  protection the project turned on (`audit:0005` F3, kind 1). `unknown` plus narrowing is the
  modern idiom.
- **11 unused imports/args, all in `src/textbook-loader/`** — 9 unused type imports and 2 unused
  args; re-verified live: `npx eslint src/textbook-loader` reports exactly 11 warnings, all
  `@typescript-eslint/no-unused-vars` (`audit:0005` F2). Refactor residue; `lesson:0003` shows the
  deferral was deliberate, not overlooked.
- **`@astrojs/check` and `typescript` declared in `dependencies`** though both are used only by
  `pnpm typecheck` and neither is imported by any module in `src/` (`audit:0004` F3). Cosmetic for a
  statically built site — the cost is the manifest's accuracy as documentation.
- **Four `.gitignore` entries resolve to nothing** (`audit:0004` F4): two are dead residue
  (`convert.js`, `previous-version-w-docusaurus` — both verified absent, remnants of a completed
  migration) and two are **defensive guards that must be kept** (`service-account.json`,
  `public/uc/`): their value is precisely that they fire before the file exists, and deleting a
  defensive ignore rule to tidy a list is a net loss. Note `src/assets/uc/` exists, so only
  `public/uc/` is in the defensive pair.
- **`reader.ts:203`'s unguarded DOM non-null assertion** (`audit:0005` F4) — overlaps `task:0018`,
  which owns the DOM-test layer; cross-referenced there rather than duplicated (see Scope step 2).
- **`pnpm typecheck` is not hermetic** (`audit:0005` F7): it loads `content.config.ts`, which
  constructs `TextbookLoader`; with `GOOGLE_CREDENTIALS_BASE64` set the first run failed with a TLS
  `ETIMEDOUT` — a network error surfacing where a type error is expected, with nothing in the output
  saying a remote fetch was attempted. A maintainer offline cannot run the repo's own verify gate.

**Counter-case — reasons recorded against acting:** the unused imports were *consciously deferred*
(`lesson:0003`: "Left as-is — not Track A scope"), so clearing them now is a deliberate reopening,
not a fix of an oversight. `audit:0005` explicitly declines two adjacent items — AST node types
(F5, already planned in ROADMAP "Next" and the §11 exception) and formatting enforcement (F6,
deliberately deferred) — and this task must not absorb either. `audit:0004` F3 notes the
dependencies issue is cosmetic since nothing installs this package as a library. And `audit:0005`
rec 1 warns the typecheck fix would stop typechecking whatever differs in maintainer mode, which
must be verified to be nothing before adopting (D2).

## Decisions required before execution

### D1 — Sequence the `src/textbook-loader/` cleanup against the Prettier pass

- **Question:** do the unused-import clearings land before, after, or inside the bulk
  format-the-codebase pass (ROADMAP "Now", which blocks all broad multi-file changes)?
- **Options:** (a) land the Prettier pass first, then all `src/` hygiene on top — each semantic fix
  is a clean semantic diff against freshly formatted files; (b) fix imports now, before the pass —
  semantic changes land first, but the pass then re-churns the same five files in its bulk diff;
  (c) fold the import deletions into the format commit — one commit doing both, polluting a
  "formatting-only" commit with semantic changes.
- **Recommendation:** (a). `audit:0005` rec 4 names the trap directly: done separately, the same
  files get churned twice; ROADMAP's break trigger exists to prevent format churn inside semantic
  PRs, and (b)/(c) create the mirror-image failure. The pass depends on nothing and blocks this
  work, so it should land first. Items outside `src/` (package.json, `.gitignore`) have no such
  constraint and can go anytime.
- **Irreversible if wrong:** nothing irreversible; the cost is double churn on the same files and
  muddier review diffs — real but bounded, and self-inflicted by ordering alone.

### D2 — Force contributor mode in `pnpm typecheck` (hermeticity), or leave it network-coupled?

- **Question:** should the repo's own typecheck gate be made independent of live Google Docs
  availability, at the price of no longer typechecking whatever differs in maintainer mode?
- **Options:** (a) force contributor mode in the `typecheck` script (e.g. unset
  `GOOGLE_CREDENTIALS_BASE64` for the check) after **verifying the maintainer-mode diff is empty** —
  `audit:0005` rec 1 conditions adoption on exactly that check; (b) leave as-is and document the
  coupling in ARCHITECTURE alongside the build's; (c) force hermeticity without the verification —
  rejected: it silently narrows what the gate covers.
- **Recommendation:** (a), gated on the verification. Run one maintainer-mode and one
  contributor-mode `astro check` over the same tree and diff the error/hint sets; if they match,
  hermeticity is free. If they differ, the difference *is* the decision — record what the
  maintainer mode was catching before giving it up.
- **Irreversible if wrong:** a hermetic gate can mask live-Docs ↔ committed-cache drift
  indefinitely — content that would have failed a maintainer-mode check surfaces later, at build or
  deploy time, where diagnosis is more expensive. That silent narrowing, not the script edit, is the
  expensive-to-undo part.

## Scope

None of these items depends on another; the stated order is by interaction risk, not dependency.
All changes require the `src/` freeze lifted; the owner's D1/D2 outcomes gate the corresponding
steps.

1. **Manifest and ignore hygiene (no `src/` churn; independent of D1).** Move `@astrojs/check` and
   `typescript` to `devDependencies` (`audit:0004` rec 3) — CI continues to typecheck since no
   workflow installs with `--prod`. Remove `convert.js` and `previous-version-w-docusaurus` from
   `.gitignore`; **keep `service-account.json` and `public/uc/`**, adding a one-line comment on the
   defensive rationale (`audit:0004` rec 4) so a future tidy-up does not remove them.
2. **`reader.ts:203` disposition (with `task:0018`).** Decide which record executes it — the guard
   here (`audit:0005` rec 5: null check with a loud error per PRINCIPLES §2) or coverage under
   `task:0018`'s DOM tests — record the choice in both, execute it in one.
3. **Route-prop and catch typing (after the Prettier pass per D1).** Replace the two `props as any`
   casts with typed route props (`audit:0005` rec 2); convert the five `catch (err|error: any)` to
   `unknown` with narrowing at the same five error paths (`audit:0005` rec 3) — run the existing
   renderer tests rather than assuming the error paths still behave.
4. **Unused imports (immediately after step 3, same post-pass window).** Clear the 11 warnings in
   `src/textbook-loader/` (`audit:0005` rec 4; manual or organize-imports — `eslint --fix` does not
   remove unused imports). Bundled with step 3 so the files churn once in the post-pass window.
5. **Typecheck hermeticity per D2.** First the two-mode verification, then adopt the script change
   or record the declined decision with what maintainer mode was catching.

## Out of scope

- **AST `Node` typing** — the documented PRINCIPLES §11 exception; already scoped in ROADMAP "Next"
  (`task:0015`). Explicitly not recommended by `audit:0005`.
- **Formatting enforcement / the Prettier pass itself** — `audit:0005` F6 is a recorded decision;
  this task sequences *against* the pass (D1), it does not perform or accelerate it.
- **Read-along DOM tests and module moves** — `task:0018`'s scope; only the `reader.ts:203`
  cross-reference touches that boundary here.
- **Image optimization and git-history rewrite** (`audit:0004` F1/F2) — larger, separately-decided
  items from the same audit; not bundled into a hygiene task to keep this one size S.
- **The 49 typecheck hints** (`audit:0005` Limitations) — noted as unreviewed; this task fixes the
  named escape hatches, not the hint backlog.

## Done when

- **AC-1:** Both route handlers destructure typed props — `props as any` appears nowhere under
  `src/pages/`, and `pnpm typecheck` passes (implementer-run).
- **AC-2:** No `catch (err: any)`/`catch (error: any)` annotation remains in `src/` (verified by
  search), the five error paths keep their existing behaviour (renderer/audio tests green), and
  narrowing is explicit at each catch site.
- **AC-3:** `npx eslint src/textbook-loader` reports 0 warnings, and the clearing was executed in
  the post-format window per D1 (not interleaved with the bulk reformat).
- **AC-4:** `package.json` lists `@astrojs/check` and `typescript` under `devDependencies`, and the
  deploy workflow still typechecks (its install step does not use `--prod`).
- **AC-5:** `.gitignore` no longer contains `convert.js` or `previous-version-w-docusaurus`; both
  `service-account.json` and `public/uc/` remain, with the defensive rationale commented at least on
  `service-account.json`.
- **AC-6:** The `reader.ts:203` item is executed in exactly one of the two records, with the choice
  recorded in both — no duplicate fix, no orphaned item.
- **AC-7:** The D2 outcome is recorded; if hermeticity was adopted, `pnpm typecheck` completes with
  no network access (e.g. credentials unset / offline run observed), and the maintainer-vs-
  contributor check result is recorded here.

## Completion evidence

| AC | Evidence |
| --- | --- |
| AC-1 | — |
| AC-2 | — |
| AC-3 | — |
| AC-4 | — |
| AC-5 | — |
| AC-6 | — |
| AC-7 | — |

## Authority and inputs

- `docs/audits/0005-code-quality-patterns-and-typescript-idiom.md` — F2 (unused imports + deliberate
  deferral via `lesson:0003`), F3 (the seven `any` escape hatches, two kinds), F4 (non-null
  assertions), F7 (typecheck network coupling), recs 1–5, Limitations (hints unreviewed).
- `docs/audits/0004-cruft-dead-code-and-dependency-hygiene.md` — F3 (dependencies placement), F4
  (the four `.gitignore` entries and the defensive/dead distinction), recs 3–4.
- `docs/tasks/0018` — the cross-referenced owner of the DOM-test layer and the `reader.ts:203`
  alternative home.
- `docs/tasks/0015`, ROADMAP "Next" — the discriminated-union AST work this task must not absorb.
- `docs/PRINCIPLES.md` — §2 (fail loud), §11 (type safety; the documented AST exception), §8 (no
  cruft — the principle the gitignore cleanup serves).
- Code anchors (all verified 2026-09-21): `src/pages/chapters/[version]/[chapter].md.ts:28`,
  `src/pages/chapters/[version]/[chapter]/[section].md.ts:32`, the five catch sites listed above,
  `src/lib/reader.ts:203`, `package.json` (dependencies/devDependencies), `.gitignore`,
  `vitest.config.ts`.
