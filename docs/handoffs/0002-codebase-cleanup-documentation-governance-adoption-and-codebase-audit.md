---
schema_version: 2
id: '0002'
uid: 'handoff-20260921T141252887674Z-af2be434'
title: 'Codebase cleanup: documentation governance adoption and codebase audit'
role: handoff
status: current
summary: 'Documentation governance is fully adopted and the five-audit sweep is complete; everything now waits on owner decisions.'
created: '2026-09-21'
updated: '2026-09-22'
owner: Markov Grey
supersedes: ''
superseded_by: ''
engineering_document:
  version: 1
  contract_tier: full
  role: handoff
  id: '0002'
  uid: handoff-20260921T141252887674Z-af2be434
  title: 'Codebase cleanup: documentation governance adoption and codebase audit'
  state: current
  authority:
    kind: continuation-state
    owner: Markov Grey
    scope: Continuation of the codebase-cleanup branch only
  created: '2026-09-21'
  updated: '2026-09-22'
  transition_history: unverified
  transitions: []
  relationships: []
  details:
    captured_at: '2026-09-21T14:50:00Z'
    repository: 'AI Safety Atlas (markov-root/atlas)'
    revision: 'branch codebase-cleanup at 7a66041; clean except a pre-existing uncommitted src/pages/teach.astro edit owned by Markov (a 2026-09-03 /teach hero-metric fix, never committed)'
    objective: 'Adopt the software-engineering documentation discipline in full, then audit the codebase across quality dimensions and agree a refactor plan before changing any code.'
    completed:
      [
        adr:0002,
        audit:0002,
        audit:0003,
        audit:0004,
        audit:0005,
        audit:0006,
        audit:0007,
        audit:0008,
        audit:0009,
        audit:0010,
        task:0011,
      ]
    open_work: [task:0008, task:0009, task:0010, task:0012]
    blockers: []
    authority_refs: [AGENTS.md, engineering.yaml, docs/PRINCIPLES.md, docs/ROADMAP.md]
    resume: 'engineering document validate'
---

# Handoff 0002: Codebase cleanup: documentation governance adoption and codebase audit

## Outcome

**Continuation moved to `handoff:0003` on 2026-09-22.** The branch this record covers,
`codebase-cleanup`, was merged to `main` at `eb1432b`. This record is deliberately NOT marked
superseded: its transition history is unverified, so the schema requires it to stay in its initial
state, and faking a transition to silence a validator would put a false claim in the record. It
stays `current` alongside `handoff:0001` and `handoff:0003` — which is the `current-multiple` finding
the owner still needs to decide, exactly as this record's own Open Work says.

**Documentation and audit phases are complete; the codebase refactor has not started.**

Since this record was first written: a second, deeper audit sweep (`audit:0007`-`0010`, 36 findings,
scoped by causal chain) established the scaling picture; `task:0011` corrected the documentation
goodharting by restructuring the four living documents to their role content standards in substance;
`atlas docs check` shipped (`301634e`) as the first `atlas` command, giving a skill-free conformance
floor wired into `pnpm verify`; and `pnpm typecheck` finally ran clean (119 files, 0 errors).

**Complete for everything that did not require an owner decision.** Documentation governance is fully
adopted, all six legacy lesson notes are migrated, the four living documents carry role frontmatter,
the five-audit sweep is written, and the `atlas` control-surface design record exists.

`engineering document validate` went from **32 findings to 1**, and the remaining one is a modelling
question for the owner, not a defect.

**Nothing in `src/` has been touched.** That was the standing constraint and it held.

## Completed work

| Commit    | What                                                                           |
| --------- | ------------------------------------------------------------------------------ |
| `8f89a78` | `.gitignore` covers `.playwright-mcp/`                                         |
| `3b8ef1d` | Initial role declarations + this handoff                                       |
| `22c56a1` | Documentation governance completed — lessons migrated, living docs, `adr:0002` |
| `68912e8` | `audit:0002` structure and file-tree coherence                                 |
| `05cca32` | `audit:0002` F7 — stale `file:line` citations in `PRINCIPLES.md`               |
| `7e4dc36` | `audit:0006` ergonomics and the control-surface case                           |
| `0bd0cbb` | `audit:0003` testing, `audit:0004` cruft, `audit:0005` code quality            |
| `d397b6f` | `task:0010` control-surface design record                                      |
| `7332d95` | `audit:0007`-`0010` deep scaling sweep — 36 findings across four causal chains |
| `091282e` | `task:0011` — living documents restructured to their role content standards    |
| `301634e` | `atlas docs check` — skill-free conformance floor, wired into `pnpm verify`    |
| `a7ffb68` | `audit:0005` typecheck run (0 errors, 119 files) + F7 on its non-hermeticity   |
| `e87f1f5` | `task:0012` — position the floor under the skill                               |

**The blocker recorded in the previous version of this handoff is resolved, and its stated hypothesis
was wrong.** The cause was not missing INDEX files. `docs.currency.roles` requires a 4-digit filename
prefix on every file its globs match (`id_prefix_digits` has schema minimum 1; the `id_pattern`
repair the CLI suggests does not exist in the schema). It can therefore only govern append-only
numbered record series. `adr:0002` records the decision and the rejected alternatives; the reasoning
is summarised in a comment in `engineering.yaml` at the point of temptation.

`docs/lessons/` is a genuine record series, so it was renamed to `NNNN-topic.md` and now carries the
full lesson contract — sections, boundary, and all. The original journal prose is preserved verbatim
under "Original session notes" in each record. **These files stay gitignored** and so appear in no
commit above.

## Current state

Branch `codebase-cleanup` at `7a66041`, working tree clean apart from Markov's own uncommitted
`src/pages/teach.astro` edit, which has been left untouched throughout.

A memory-commit monitor is running at `~/.local/var/atlas-monitor/memwatch.sh`, logging to
`memwatch.log` every 15s. It samples `Committed_AS / (MemTotal + SwapTotal)`, which matches `sar`'s
`%commit` — the metric that tracked both VM crashes. It held at 69–70% throughout this session.
**Kill it when the branch is done:** `pkill -f memwatch.sh`.

## Open work

All remaining items are owner decisions. None is blocked on engineering.

1. **Decide the `current-multiple` validation finding.** Two handoffs are `current`: `handoff:0001`
   (freelancer independence, `task:0001`–`0007` all still `todo`) and this one. Both are genuinely
   live. Either scope handoffs per-area in the manifest, or accept the finding permanently.
   **Do not resolve it by superseding a live handoff** — that would put a false statement in the
   record.
2. **Accept or reject `adr:0002`.** It is `proposed`. It governs how documentation roles are declared
   and is the reason four documents keep their filenames.
3. **Decide the audit recommendations.** 30 findings across five records, every recommendation
   pending. Each audit's Disposition states which items are safe standalone and which must be decided
   together. The three highest-value, by the audits' own reckoning:
   - `audit:0003` rec 2 — a jsdom test for the two read-along regressions that shipped on
     2026-09-20. Small, additive, targets demonstrated failures rather than a hypothesis.
   - `audit:0004` rec 1 — the 1.59 GiB git pack. Framed as an owner call because history rewriting
     affects a public repo with outside contributors; a `--depth 1` documentation change is the
     no-risk partial.
   - `audit:0002` rec 2 — repair four stale `file:line` citations in `PRINCIPLES.md`.
     Documentation-only, and it restores a norm `AGENTS.md` sets for itself.
4. **Accept or reject `task:0010`** (the `atlas` control surface). AC-6 makes rejection a legitimate
   completion, since `audit:0006` F7 records a real counter-case.
5. **`task:0008` and `task:0009`** remain `in_progress` awaiting acceptance. Their evidence tables
   cite pre-cherry-pick SHAs (`2f5bff7`, `901b05c`, `7c23e39`) that no longer exist on `main`; each
   commit message carries a `(cherry picked from …)` trail. Correcting those citations is a small
   docs-only fix — and note `audit:0002` F7 found the same class of decay in `PRINCIPLES.md`.

## Resume

```bash
engineering document validate          # expect exactly 1 finding: current-multiple
engineering document query --role task --compact
```

`pnpm typecheck` has since been run (119 files, 0 errors) — but **only in contributor mode**. With
credentials present it reaches live Google Docs and can fail on a network timeout rather than a type
error (`audit:0005` F7). Use `GOOGLE_CREDENTIALS_BASE64= pnpm typecheck` for a hermetic run.

**The next thread is the codebase refactor**, which has not started. `src/` is still untouched. The
46 audit findings collapse into six root decisions — see `docs/audits/INDEX.md` and the
cross-cutting note there.

## Constraints — do not violate

- **No code changes.** The owner's position: documentation may be executed; the `bin/atlas` design
  doc may be written; but `src/` needs "a lot of back and forth before we agree on the final design
  and tree and relationships". Audits produce findings and recommendations only. This held for the
  whole session and should keep holding until the owner lifts it explicitly.
- **The VM has crashed twice in two days**, both times from load this agent added. Before any fleet
  or build loop: read `[[atlas-dont-crash-this-vm]]`, watch `%commit` (not `free -h` available), and
  keep the monitor running. Admit agents one at a time with a measurement between each.
- If the audits are ever re-run with agents, brief them to **write a skeleton to their record first
  and fill it incrementally**. The five agents that died on 2026-09-21 were all holding their
  findings in context, so a 16-minute run salvaged nothing.
- `docs/lessons/` and `docs/TODO.md` are gitignored by deliberate policy stated in `AGENTS.md`.

## Method notes worth carrying forward

Three measurement errors were made and caught during this session. They are recorded because each
would otherwise have produced a confident, wrong finding:

- **`rg -r` is replace, not recursive.** It silently rewrote every match to `n`, which briefly looked
  like a real finding about undeclared env vars. `rg` is recursive by default.
- **Import fan-in by `from '…'` misses side-effect imports.** `word-highlight.ts` measured as
  zero-fan-in; it is imported at `src/layouts/Reader.astro:388`.
- **Dependency usage by package-name grep misses string-referenced packages.** `@iconify-json/cib`
  looked unused; icons are referenced as `cib:github`, not by package name.

Each is stated in the Limitations section of the audit it affected.

## Blockers

None.

## Evidence and authority

- `AGENTS.md` (`CLAUDE.md` is a symlink to it) — agent norms and the governed-record policy.
- `engineering.yaml` — adopted checks, classifiers, profiles, document roles.
- `docs/PRINCIPLES.md` — the project's chosen principles. An audit recommendation that contradicts
  one must engage with it; each audit does so explicitly where relevant.
- `docs/ROADMAP.md` "Not planned" — explicitly rejected directions.
- Crash forensics: `journalctl -b -1 | tail` and `sar -r -f /var/log/sysstat/sa21`.
