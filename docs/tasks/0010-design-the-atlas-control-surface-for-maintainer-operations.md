---
schema_version: 2
id: '0010'
uid: 'task-20260921T144446607784Z-b381e965'
title: 'Design the atlas control surface for maintainer operations'
role: task
status: todo
summary: 'Give the maintainer operations that today have no invocation a named, discoverable, testable entry point.'
created: '2026-09-21'
updated: '2026-09-21'
owner: Markov Grey
supersedes: ''
superseded_by: ''
engineering_document:
  version: 1
  contract_tier: full
  role: task
  id: '0010'
  uid: task-20260921T144446607784Z-b381e965
  title: 'Design the atlas control surface for maintainer operations'
  state: todo
  authority:
    kind: work-state
    owner: Markov Grey
    scope: Design agreement only; implementation requires a separate owner decision to lift the src/ freeze
  created: '2026-09-21'
  updated: '2026-09-21'
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
      ]
    size: m
    priority: p2
---

# Task 0010: Design the atlas control surface for maintainer operations

## Problem

Two significant maintainer operations have no invocation at all. Refreshing chapter content from
Google Docs and regenerating audio are reachable **only** as side effects of a full `astro build`,
gated by up to 13 environment variables (`audit:0006` F1; `src/content.config.ts:89-90`,
`src/textbook-loader/loader.ts:77,82`). A maintainer who wants one chapter's audio has no way to ask
for less than the whole site.

Two more operations exist but are undiscoverable. `scripts/copy-chapter-audio.sh` and
`scripts/swap-cbr-audio.ts` do not appear in `pnpm run`; finding them requires `ls scripts/`, and
understanding them requires opening the file and reading a 25–30 line header comment
(`audit:0006` F2). `swap-cbr-audio.ts` has already independently invented CLI conventions — dry-run
by default, `--yes` to act, an optional positional chapter filter — which is evidence that the shape
is needed, not hypothetical.

This matters now because the operation count is growing, not static: the owner expects to add prose
and voice checks, dead-link checking, and further utilities as the textbook develops.

**The counter-case is recorded in `audit:0006` F7 and must not be ignored:** the 16 `package.json`
scripts serve the day-to-day contributor loop well, and `docs/PRINCIPLES.md` §10 (YAGNI) warns
against exactly this kind of speculative infrastructure. The justification for this task rests on
F1 and F2 — operations that exist but cannot be named — not on a general claim that the current
surface is bad.

## Scope

Design agreement on a maintainer control surface, to the point where implementation is a mechanical
follow-on. Specifically:

1. **Command set.** The initial surface is the four operations evidenced in `audit:0006`:

   | Command                              | Wraps                           | Status today           |
   | ------------------------------------ | ------------------------------- | ---------------------- |
   | `atlas pull [--chapter N]`           | `TextbookLoader` content fetch  | no invocation          |
   | `atlas generate audio [--chapter N]` | the audio renderer path         | no invocation          |
   | `atlas audio stage [--fetch] N [S]`  | `scripts/copy-chapter-audio.sh` | exists, undiscoverable |
   | `atlas audio publish-cbr [--yes] N`  | `scripts/swap-cbr-audio.ts`     | exists, undiscoverable |

2. **Shape.** `bin/atlas` as a logic-free adapter, following the _separation_ in
   `~/Git/CoP Dataset/bin/cop` (6 lines: `cd` to root, `exec` the real entry point) but not its
   Python packaging shape. All logic in importable TypeScript modules invoked via `tsx`, so commands
   are ordinary functions that can be unit-tested — which the current `scripts/` cannot be.

3. **Conventions**, adopted from what `swap-cbr-audio.ts` already does: dry-run by default for
   anything that writes to R2 or mutates published state; `--yes` to act; `--chapter` / positional
   filters to narrow blast radius.

4. **Relationship to `package.json`.** Explicitly decide and document the split: contributor
   lifecycle (`dev`, `build`, `check`, `verify`) stays in `package.json`; maintainer operations live
   in `atlas`.

5. **Migration of rationale.** The two `scripts/` headers contain substantial documented reasoning
   (why `copy-chapter-audio.sh` must not touch committed `.words.json`; why `swap-cbr-audio.ts` works
   at all, given filenames are hashed on section text). That prose must land in the new commands'
   documentation before the scripts are removed.

## Out of scope

- **`atlas lint`** — prose/voice quality checks and dead-link checking. `audit:0006` F5 establishes
  these are net-new capability, not renamings. Including them would convert a justified addressing
  layer into the speculative infrastructure §10 warns against. Dead-link checking additionally has a
  plan of record already (`docs/ROADMAP.md` §Next, "Link checker (lychee, scheduled)"); `atlas lint`
  should not pre-empt it.
- **Changing `package.json` scripts.** `pnpm verify` is referenced by `.githooks/pre-push`,
  `.github/workflows/test.yml`, `CONTRIBUTING.md`, and `AGENTS.md`. Moving it breaks all four for no
  gain (`audit:0006` recommendation 3).
- **Deleting `scripts/`** in the same change that adds the CLI (`audit:0006`, "Not recommended").
- **Implementation.** This task is design agreement only. Per `handoff:0002` §Constraints, `src/`
  changes need a separate owner decision.
- **Env-var consolidation** (`audit:0006` F3, recommendation 5) — sequenced after this, because a
  partial migration leaves two places to look, which is worse than one.

## Done when

- **AC-1:** A written design names every command in the initial set, its flags, its default
  (dry-run where it mutates published state), and the existing code path it wraps.
- **AC-2:** The design states where logic lives versus where the adapter lives, and demonstrates
  that each command is an importable function rather than a script body — i.e. that it is unit
  testable. Testability is the point of the separation, not tidiness.
- **AC-3:** The `package.json` / `atlas` split is stated explicitly, with the four references to
  `pnpm verify` enumerated and confirmed unbroken.
- **AC-4:** The design says what happens to `scripts/`: which prose migrates where, and the
  condition under which the files are deleted.
- **AC-5:** The design engages with `docs/PRINCIPLES.md` §10 (YAGNI) directly, stating which
  commands are addressing layers over existing code and which (if any) are new capability.
- **AC-6:** The owner has accepted the design, or recorded a decision not to proceed. A rejection
  that cites `audit:0006` F7 is a legitimate completion of this task, not a failure of it.

## Completion evidence

_To be filled on completion. Each row must cite a criterion and durable evidence (a commit, a file
path, or a recorded owner decision) — not a narrative claim._

| Criterion | Evidence | Verified |
| --------- | -------- | -------- |
| AC-1      | —        | —        |
| AC-2      | —        | —        |
| AC-3      | —        | —        |
| AC-4      | —        | —        |
| AC-5      | —        | —        |
| AC-6      | —        | —        |

## Authority and inputs

- `audit:0006` — the evidence base. F1 and F2 justify the task; F5 and F7 bound it.
- `audit:0002` recommendation 2 notes a citation-checking command as a possible later subcommand;
  `audit:0005` recommendation 1 notes `pnpm typecheck` needs a headroom-aware invocation. Both are
  candidate _future_ subcommands and are deliberately excluded from the initial set.
- `~/Git/CoP Dataset/bin/cop` and its `bin/README.md` — the structural reference, governed there by
  ADR-0119.
- `docs/PRINCIPLES.md` §10 (YAGNI), §14 (Explicit non-goals); `docs/ROADMAP.md` §Next, §Not planned.
