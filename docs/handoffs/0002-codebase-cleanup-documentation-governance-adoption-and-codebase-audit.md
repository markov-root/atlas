---
schema_version: 2
id: "0002"
uid: "handoff-20260921T141252887674Z-af2be434"
title: "Codebase cleanup: documentation governance adoption and codebase audit"
role: handoff
status: current
summary: "Handoff record: Codebase cleanup: documentation governance adoption and codebase audit."
created: "2026-09-21"
updated: "2026-09-21"
owner: HANDOFF OWNER
supersedes: ""
superseded_by: ""
engineering_document:
  version: 1
  contract_tier: full
  role: handoff
  id: "0002"
  uid: handoff-20260921T141252887674Z-af2be434
  title: "Codebase cleanup: documentation governance adoption and codebase audit"
  state: current
  authority:
    kind: continuation-state
    owner: HANDOFF OWNER
    scope: NEXT-SESSION CONTINUATION ONLY
  created: "2026-09-21"
  updated: "2026-09-21"
  transition_history: unverified
  transitions: []
  relationships: []
  details:
    captured_at: "2026-09-21T14:12:52Z"
    repository: 'AI Safety Atlas (markov-root/atlas)'
    revision: 'branch codebase-cleanup at 8f89a78; dirty: engineering.yaml modified, 5 untracked audit templates, plus a pre-existing uncommitted src/pages/teach.astro edit owned by Markov'
    objective: 'Adopt the software-engineering documentation discipline in full (manifest + migration of every legacy doc into the typed schema), then audit the codebase across quality dimensions and agree a refactor plan before changing any code.'
    completed: []
    open_work: [audit:0002, audit:0003, audit:0004, audit:0005, audit:0006]
    blockers: []
    authority_refs: [AGENTS.md, engineering.yaml, docs/PRINCIPLES.md, docs/ROADMAP.md]
    resume: 'engineering document validate'
---

# Handoff 0002: Codebase cleanup: documentation governance adoption and codebase audit

## Outcome

Partial. The branch `codebase-cleanup` exists off `main` with one committed change (`8f89a78`,
gitignoring Playwright MCP scratch). Documentation-governance adoption is **half-applied and
currently uncommitted**: `engineering.yaml` has been extended with four new document roles but no
document has been migrated yet, and the extension is unverified beyond `engineering inspect`
reporting the manifest valid. A five-agent audit fleet was dispatched and produced **nothing** — it
crashed the VM before writing a single finding.

Nothing in `src/` has been touched. That is deliberate and must stay true: the owner has explicitly
reserved all code changes until a design is agreed (see Constraints).

## Completed work

- `8f89a78` — `.gitignore` now covers `.playwright-mcp/`, verified against a real file before commit.
- Branch hygiene: `main` realigned to `origin/main`; `chore/engineering-governance-and-independence`
  merged and deleted; `pr-11/12/13`, `integration/read-along`, `release/read-along-set` deleted after
  `git cherry` confirmed no unique patches; both scratch worktrees removed.
- Five audit records allocated with valid frontmatter and registered nowhere yet:
  `audit:0002` structure/modularity, `audit:0003` testing, `audit:0004` cruft, `audit:0005` code
  quality, `audit:0006` ergonomics + `bin/atlas` control surface. **All five are empty templates.**

## Current state

**Uncommitted in `engineering.yaml`** — four role declarations added to `docs.currency.roles`:

- `lesson` → `docs/lessons/*.md`, index `docs/lessons/INDEX.md`
- `specification` → `docs/ARCHITECTURE.md`, index `docs/INDEX.md`
- `standard` → `docs/PRINCIPLES.md`, `docs/DESIGN.md`, index `docs/INDEX.md`
- `roadmap` → `docs/ROADMAP.md`, index `docs/INDEX.md`

`engineering inspect` reports `manifest: valid (4 declared path(s) missing)` — the two INDEX files do
not exist yet. **`engineering document backfill` still fails with `document: invalid` for every
target**, and the cause is not yet isolated. Established so far by reading
`assets/schemas/engineering-v2.schema.json`:

- `document_contract.role` **does** accept all ten living roles, and `document_role.name` is a
  free-form lowercase string — so declaring living roles is schema-legal, not a hack.
- `document_role` requires `index` and `id_prefix_digits` even for living documents, where nothing
  allocates against them. They are declared as nominal values with a comment saying so.
- `engineering document new index --title …` also returns `document: invalid`, so the INDEX files
  likely have to be hand-authored on the pattern of the existing `docs/tasks/INDEX.md` (whose UID
  `index-20260817T000000000000Z-atlastsk` has a zeroed timestamp and was itself clearly hand-made).

The next person should resolve whether the missing INDEX files are the whole cause before assuming
the living-role approach is wrong.

## Open work

1. Create `docs/INDEX.md` and `docs/lessons/INDEX.md` (model on `docs/tasks/INDEX.md`), then retry
   `engineering document backfill docs/DESIGN.md --role standard --title … --summary …`. If it still
   fails, get a real error — the CLI's `document: invalid` is uninformative; try `--json`.
2. Backfill the four living documents: `ARCHITECTURE.md` → specification, `PRINCIPLES.md` and
   `DESIGN.md` → standard, `ROADMAP.md` → roadmap. Backfill preserves body bytes; only frontmatter is
   added.
3. Migrate `docs/lessons/` (6 dated notes + a README) and `docs/TODO.md` into `lesson` records.
   **They stay gitignored** — the owner chose "govern but keep gitignored"; do not commit them.
4. Re-run the audit — see Constraints for how, and read [[atlas-dont-crash-this-vm]] first.
5. Write the `bin/atlas` control-surface design as a task record. The owner leans toward the
   CoP Dataset pattern (`~/Git/CoP Dataset/bin/cop` — a logic-free bash adapter into a namespaced
   `utility/` CLI, governed by ADR-0119) but wants the audit's evidence first. Envisaged surface:
   `atlas generate audio --chapter *`, `atlas pull --chapter *`, `atlas lint` for prose/voice checks
   against the writing skill and dead-link checking.
6. Two task records from the previous session sit at `in_progress` awaiting the owner's acceptance:
   `task:0008` and `task:0009`. Their evidence tables cite pre-cherry-pick SHAs that no longer exist
   on `main` (`2f5bff7`, `901b05c`, `7c23e39`); a `(cherry picked from …)` trail exists in each
   commit message. Correcting those citations is a small docs-only fix.

## Resume

First safe command — it is read-only and reports the exact state described above:

```bash
engineering document validate
```

Expect ~11 `frontmatter-missing` findings. Five are the untouched audit templates
(`docs/audits/0002`–`0006`); the rest are the living documents and `docs/lessons/*` that the new
manifest roles now cover but which have not been backfilled yet. That output IS the to-do list for
Open work items 1-3; when it is empty, documentation adoption is done.

Do **not** start by running `pnpm verify`, `pnpm build`, or spawning agents — read Constraints first.

## Constraints — do not violate

- **No code changes.** The owner's exact position: documentation may be executed because it does not
  change the codebase; the `bin/atlas` design doc may be written; but for `src/` "we will need to do
  a lot of back and forth before we agree on the final design and tree and relationships". Audits
  produce findings and recommendations only.
- **The VM has crashed twice in two days**, both times from load this agent added — a triple
  `pnpm verify` on 2026-09-20 and a five-agent fleet on 2026-09-21. Before any fleet or build loop:
  read [[atlas-dont-crash-this-vm]], watch `%commit` from `sar -r` (not `free -h` available, which
  overstates headroom), keep the `homelab-management` skill's monitor running, and admit agents one
  at a time with a measurement between each. The owner asked for the monitor explicitly.
- If the audit is re-run with agents, brief them to **write a skeleton to their record first and fill
  it incrementally**. All five previous agents died holding their findings in context, so a 16-minute
  run salvaged nothing.
- `docs/lessons/` and `docs/TODO.md` are gitignored by deliberate policy stated in `AGENTS.md`.

## Blockers

- `engineering document backfill` returns `document: invalid` for every attempted target. Unblocking
  this gates next actions 1-3. Not yet isolated; the missing INDEX files are the leading hypothesis.

## Known validation findings (deliberate, not defects to "fix" blindly)

`engineering document validate` currently reports ~32 findings. They are expected and each has a
cause recorded here; do not silence any of them by weakening a record.

- **`current-multiple` on `docs/handoffs/INDEX.md`.** The validator permits one `current` handoff per
  *role*; this repo has two genuinely live continuation threads — `handoff:0001` (freelancer
  independence, whose `task:0001`-`0007` are all still `todo`) and this one. Marking either
  `superseded` would be false. This needs an owner decision: either scope handoffs per-area in the
  manifest, or accept the finding. **Do not resolve it by superseding a live handoff.**
- **`frontmatter-missing` ×11** on the living documents and `docs/lessons/*` — these are exactly the
  files Open work items 1-3 will backfill. The count going to zero is the completion signal.
- **Five audit records are valid-but-empty templates.** Their IDs are committed so they are not
  re-allocated; the fleet that was to fill them crashed the VM first.

## Evidence and authority

- `AGENTS.md` (`CLAUDE.md` is a symlink to it) — agent norms and the governed-record policy.
- `engineering.yaml` — adopted checks, classifiers, profiles, document roles.
- `docs/PRINCIPLES.md` — the project's chosen principles, each with a code reference. An audit
  recommendation that contradicts one of these must engage with it rather than ignore it.
- `docs/ROADMAP.md` "Not planned" — explicitly rejected directions, including a certification
  program with quizzes.
- Crash forensics: `journalctl -b -1 | tail` and `sar -r -f /var/log/sysstat/sa21`.
