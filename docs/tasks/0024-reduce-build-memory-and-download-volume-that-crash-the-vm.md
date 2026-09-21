---
schema_version: 2
id: '0024'
uid: 'task-20260921T212222349203Z-38760235'
title: 'Reduce build memory and download volume that crash the VM'
role: task
status: todo
summary: 'A full verify peaks at 94% memory commit on an idle VM, and audio handling moves gigabytes that mostly need not move.'
created: '2026-09-21'
updated: '2026-09-21'
owner: Markov Grey
supersedes: ''
superseded_by: ''
engineering_document:
  version: 1
  contract_tier: full
  role: task
  id: '0024'
  uid: task-20260921T212222349203Z-38760235
  title: 'Reduce build memory and download volume that crash the VM'
  state: todo
  authority:
    kind: work-state
    owner: Markov Grey
    scope: Build-time resource consumption; excludes shipped page weight
  created: '2026-09-21'
  updated: '2026-09-21'
  transition_history: unverified
  transitions: []
  relationships: []
  details:
    criteria: [criterion:AC-1, criterion:AC-2, criterion:AC-3, criterion:AC-4]
    size: m
    priority: p2
---

# Task 0024: Reduce build memory and download volume that crash the VM

## Problem

The development VM (2 vCPU, 4 GB RAM) has crashed twice in two days, and both crashes were traced to
memory pressure from this project's own build and test commands rather than to agent count.

**Measured 2026-09-21:** a full `pnpm verify` on an otherwise idle VM, sampling
`Committed_AS / (MemTotal + SwapTotal)` every 20 seconds, peaked at **94%** against a standing 90%
caution threshold. That is with nothing else running. It leaves no headroom for a parallel task, an
editor, or a second agent — which is precisely the condition both crashes occurred under.

Three separate contributors, which should not be conflated:

1. **Peak memory in a single phase.** `pnpm typecheck` already carries
   `NODE_OPTIONS=--max-old-space-size=3584` (`package.json:14`) — a 3.5 GB ceiling on a 4 GB machine,
   which is a workaround rather than a fix and one that guarantees the machine is at the edge.
2. **Serial phases that each re-pay startup.** `verify` runs eight phases sequentially; each Node
   process re-imports and re-transforms. The unit suite alone reports `import 12.35s` against
   `tests 2.46s` — import dominates execution by 5×.
3. **Gigabyte-scale audio movement.** `.cache/uc/` is 1.9 GB. The R2 pull/push paths move whole MP3s,
   and Phase 8 of the audio renderer re-uploads every MP3 present on disk regardless of whether it
   changed (`task:0022`). Most of that traffic is avoidable.

The owner's framing is "just to keep in mind passively", so this is not urgent work. It is filed at
the lowest priority the schema allows (p2) rather than at a priority that would misrepresent that
intent. Note only that it is not cost-free to defer: it directly bounds how much parallel work this
machine can hold, which is the constraint every other task runs into.

## Scope

- Establish where the peak actually is, per phase, rather than inferring it. Measurement first: the
  3584 MB ceiling suggests typecheck, but `verify`'s peak fell during the build phase, and those are
  different problems with different fixes.
- Reduce peak memory in whichever phase dominates.
- Reduce redundant work across phases, where doing so does not weaken the gate.
- Reduce avoidable audio traffic — which overlaps with `task:0022` and should not be done twice.

## Out of scope

- **Shipped page weight and repository clone size** — `task:0019`. This task is about what the build
  consumes, not what the reader downloads.
- **Weakening `verify`.** Dropping checks would reduce memory and is not the goal. Any change must
  preserve what the gate catches.
- **Moving CI to a larger machine.** A legitimate answer for CI, but it does not help the local
  development loop, which is where the crashes happened.

## Decisions required before execution

### D1 — Is the target a smaller peak, or a gate that does not need one machine to hold it all?

| Option                                                   | Consequence                                                                    |
| -------------------------------------------------------- | ------------------------------------------------------------------------------ |
| **A.** Reduce peak memory in place                       | `pnpm verify` stays one command. Bounded gains; the ceiling is structural.     |
| **B.** Split `verify` into independently runnable phases | Each phase fits comfortably; the pre-push hook chains them. More moving parts. |
| **C.** Accept it and document the constraint             | Zero work. The VM stays one parallel task away from crashing.                  |

**Recommendation: measure, then B.** The pre-push hook does not need a single process; it needs all
phases to pass. Splitting is the change that actually removes the ceiling rather than moving it.

## Done when

- **AC-1:** Peak memory commit is measured **per `verify` phase**, not just overall, and the
  dominant phase is named with its figure.
- **AC-2:** A full `verify` completes below 85% peak commit on the 4 GB VM with no other load, or a
  recorded decision accepts a documented higher bound with its rationale.
- **AC-3:** The `--max-old-space-size=3584` workaround is either removed as unnecessary or justified
  in a comment at the point of use, stating what fails without it.
- **AC-4:** Avoidable audio traffic is quantified before and after, and the change is coordinated
  with `task:0022` so the upload path is touched once.

## Completion evidence

_To be filled on completion. Each row must cite a criterion and durable evidence — a measurement, a
commit, or a recorded decision — not a narrative claim._

| Criterion | Evidence | Verified |
| --------- | -------- | -------- |
| AC-1      | —        | —        |
| AC-2      | —        | —        |
| AC-3      | —        | —        |
| AC-4      | —        | —        |

## Authority and inputs

- Measurement, 2026-09-21: 10 samples at 20s intervals across a full `pnpm verify`; peak 94%, second
  83%. Method is `Committed_AS / (MemTotal + SwapTotal)`, which matches `sar`'s `%commit` and is the
  metric that tracked both crashes — `free -h` does not.
- `package.json:14` — the existing memory ceiling workaround.
- Unit suite timing, same run: `import 12.35s` versus `tests 2.46s`.
- `audit:0011` F4 — the finding this task owns.
- `task:0022` — the ungated upload path; overlapping surface.
- `task:0019` — page and repo weight; explicitly separate.
- `[[atlas-dont-crash-this-vm]]` — the operational rules derived from both crashes.
