---
schema_version: 2
id: '0011'
uid: 'audit-20260921T212222983606Z-7f656739'
title: 'Incidental findings log: bugs, edge cases and optimizations found in passing'
role: audit
status: draft
summary: 'Append-only log of defects and improvements discovered during unrelated work, so they are not lost or silently fixed.'
created: '2026-09-21'
updated: '2026-09-21'
owner: Markov Grey
supersedes: ''
superseded_by: ''
engineering_document:
  version: 1
  contract_tier: full
  role: audit
  id: '0011'
  uid: audit-20260921T212222983606Z-7f656739
  title: 'Incidental findings log: bugs, edge cases and optimizations found in passing'
  state: draft
  authority:
    kind: point-in-time-evidence
    owner: Markov Grey
    scope: Findings discovered incidentally during other work, repo-wide
  created: '2026-09-21'
  updated: '2026-09-21'
  transition_history: unverified
  transitions: []
  relationships: []
  details:
    as_of: '2026-09-21'
    subjects: ['cli/**', '.cache/**', 'src/content.config.ts', 'src/textbook-loader/renderers/audio/renderer.ts', 'package.json']
    method: Findings recorded opportunistically as they surface during unrelated work; each entry states whether it was reproduced or merely observed
    limitations:
      [
        Not a sweep - absence from this log means nobody tripped over it and never that the codebase is clean,
        Evidence depth varies by entry because the cost of recording must stay near zero,
        Severity is a first impression assigned at discovery without triage,
      ]
---

# Audit 0011: Incidental findings log: bugs, edge cases and optimizations found in passing

## Scope

`audit:0002`–`0010` are **scoped sweeps**: a dimension was chosen, the codebase examined against it,
and the record closed. This record is deliberately different. It is **append-only and never closes**.
It exists to catch the findings that surface while doing something else — a defect noticed while
running a build, an edge case hit while testing an unrelated feature, an optimization spotted in
passing.

Without a home, those findings have exactly two fates: forgotten, or silently fixed inside an
unrelated commit where no reviewer can see them. Both are bad. This record is the cheap third option.

**What belongs here:** anything real, observed, and not worth interrupting current work for.

**What does not:** anything urgent or dangerous enough to need its own record with acceptance
criteria and a decision trail. Those get a `task` — `task:0022` is the worked example, promoted out
of this log on the day it was found because it could destroy irreplaceable data.

**Boundary — this log does not authorize fixes.** An entry is an observation with evidence, not a
decision to act. Promotion to a `task` is what authorizes work. Entries may be batched into
`task:0020` (standalone hygiene fixes) when several small ones accumulate.

## Method

Entries are recorded when found, with whatever evidence was to hand at that moment. That is the
point — the cost of an entry has to stay near zero or it will not get written.

## Limitations

- **Not a sweep.** Absence from this log means nobody tripped over it, never that it is absent from
  the codebase. Do not cite this record as coverage of anything.
- **Evidence depth varies.** Some entries carry a reproduction and a file:line; others carry an
  observation and a hypothesis. Each entry states which it is.
- **Severity is a first impression**, assigned at discovery without triage, and may be wrong in
  either direction.

## Findings

### F1 — `cli/` is not typechecked, and `@types/node` is undeclared

**Severity:** low · **Evidence:** reproduced · **Found:** 2026-09-21, while preparing `task:0021`

`@types/node` is not a declared dependency. `pnpm exec tsc --noEmit cli/index.ts` reports **7 errors**
(`Cannot find module 'node:fs'`, `Cannot find name 'process'`, two implicit-`any` parameters in
`cli/commands/docs-check.ts:123-124`), while `pnpm typecheck` passes clean. `tsconfig.json` includes
`**/*`, so the exclusion is not from configuration — `astro check` simply does not surface these.

The consequence is that `cli/`, which `pnpm verify` now depends on, has no type coverage. This will
widen as `atlas` grows; `task:0021` alone would add substantially more code there.

**Disposition: RESOLVED 2026-09-21.** `@types/node` declared as a dev dependency, and
`cli/tsconfig.json` plus a `typecheck:cli` script chained into `pnpm typecheck`. All 7 errors were
knock-on effects of the missing types — once declared, the two implicit-`any` parameters resolved on
their own, because `readdirSync` became typed. The gate was verified by introducing a deliberate type
error and confirming it fails; a check that cannot fail is not a check.

### F2 — `.cache/uc/` holds 1.9 GB of irreplaceable audio, gitignored and unbacked

**Severity:** high · **Evidence:** reproduced · **Found:** 2026-09-21, while probing R2 access

88 MP3 files (71 section, 17 chapter) totalling 1.9 GB sit in `.cache/uc/`, which `.gitignore:32`
excludes. This VM has crashed twice in two days. The audio cannot be regenerated cheaply
(`[[atlas-audio-is-frozen]]`), and no backup exists.

**Disposition:** promoted to `task:0023` AC-1. Recorded here because the general lesson is broader
than one directory — gitignored working caches can hold assets whose value nobody has assessed.

### F3 — Stale `.env` values give false confidence about which safety switches are active

**Severity:** medium · **Evidence:** reproduced · **Found:** 2026-09-21, during the pre-merge gate

`.env` contains `SKIP_AUDIO_DOWNLOAD=1`, which has no effect: the variable is declared in neither
`astro.config.mjs`'s env schema nor bridged in `src/content.config.ts:80-90`, so it must be exported
into the shell to do anything. A maintainer reading `.env` reasonably concludes a safety switch is on
when it is not.

This is the proximate cause of the `task:0022` incident and is recorded separately because the
_class_ of problem is broader: `.env` is not validated against the set of variables the code actually
reads, so any typo or retired variable name fails silently and looks configured.

**Disposition:** the specific instance is `task:0022` AC-4. The general case — validating `.env` keys
against a declared set and warning on unknown or ineffective ones — is an unowned improvement.

### F4 — `pnpm verify` peaks at 94% memory commit

**Severity:** medium · **Evidence:** measured · **Found:** 2026-09-21

Sampling `Committed_AS / (MemTotal + SwapTotal)` at 20-second intervals through a full `pnpm verify`
on an otherwise idle VM gave a peak of **94%**, against a standing 90% caution threshold. Ten samples;
the peak fell during the build phase.

This is consistent with the two prior VM crashes and confirms that `verify` alone, with no agent
fleet running, approaches the failure boundary.

**Disposition:** `task:0024`.

## Recommendations

1. **Close F1 before `task:0021` adds `cli/` code.** Declaring `@types/node` and getting `cli/` into
   a typechecked path is a few lines and prevents a growing blind spot in code that `verify` already
   trusts.
2. **Treat F2's general form as a standing question**, not just a one-off backup: for each gitignored
   cache directory, state whether its contents are regenerable. `.cache/docs/` is committed precisely
   because it is not cheaply regenerable; `.cache/uc/` has the same property and the opposite
   treatment.
3. **Keep F3's general case unowned until someone hits it again.** One instance is not yet evidence
   that `.env` validation earns its complexity, and `PRINCIPLES.md` §10 (YAGNI) applies. Recorded so
   that a second instance is recognised as a pattern rather than another one-off.

## Disposition

This record stays in `draft` indefinitely, by design. The audit schema offers `draft`, `final` and
`superseded`; an append-only log is never `final`, and calling it so would assert a completeness it
explicitly disclaims. `draft` is the honest choice, not a pending action.

New findings append to **Findings**. Entries are struck through with a pointer when promoted to a
task or fixed, rather than deleted, so the log stays a history of what was noticed and what came of
it.
