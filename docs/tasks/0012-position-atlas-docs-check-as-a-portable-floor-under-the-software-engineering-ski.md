---
schema_version: 2
id: "0012"
uid: "task-20260921T165753835040Z-1a81e1b4"
title: "Position atlas docs check as a portable floor under the software-engineering skill"
role: task
status: todo
summary: 'Make the skill the authority and atlas docs check the portable floor, with drift controlled and record-series coverage decided.'
created: "2026-09-21"
updated: "2026-09-21"
owner: Markov Grey
supersedes: ""
superseded_by: ""
engineering_document:
  version: 1
  contract_tier: full
  role: task
  id: "0012"
  uid: task-20260921T165753835040Z-1a81e1b4
  title: "Position atlas docs check as a portable floor under the software-engineering skill"
  state: todo
  authority:
    kind: work-state
    owner: Markov Grey
    scope: The atlas docs check command, cli/doc-rules.ts, and docs/standards/documentation.md
  created: "2026-09-21"
  updated: "2026-09-21"
  transition_history: unverified
  transitions: []
  relationships: []
  details:
    criteria: [criterion:AC-1, criterion:AC-2, criterion:AC-3, criterion:AC-4, criterion:AC-5]
    size: s
    priority: p2
---

# Task 0012: Position atlas docs check as a portable floor under the software-engineering skill

## Problem

`atlas docs check` shipped (`301634e`) to answer "can a cloner verify documentation conformance
without a locally-installed skill?" It does that. But its relationship to the
`software-engineering` skill was never stated, and two things follow from that silence.

**It reads as a competing standard.** Nothing in the repo says the skill is the authority and this
command is a floor. A contributor who runs it and sees "All 6 governed documents conform" can
reasonably conclude the documentation is to standard. It is not the same claim: the command checks
3 things (role declared, section present and substantive, pattern count) where
`engineering document validate` checks 16 (lifecycle state, transitions, relationships, index
registration, supersession, criteria-to-evidence linkage, and more).

**`cli/doc-rules.ts` is a second copy of the skill's knowledge.** The checker itself does not
duplicate the skill - the two tools cover **disjoint file sets** (verified: zero overlap; the skill
covers the numbered record series, this covers the living documents the skill structurally cannot).
The duplication is in the *rules table*, which encodes one author's reading of what the
specification, standard, roadmap and runbook roles require. When the skill's content standards
change, nothing will notice.

Owner's position, 2026-09-21: _"if you are here on my local machine the goal is to have the standard
be the SE skill docs, and not the minimal version we have going here."_

## Scope

1. **State the authority relationship** in `docs/standards/documentation.md` and in the command's
   own output: the skill's content standards are the standard; `atlas docs check` is a portable
   floor for environments without it. Link the skill source (https://github.com/markov-root/skills)
   so a cloner can reach the real bar.
2. **Control the drift** between `cli/doc-rules.ts` and the skill's
   `knowledge/documentation-*-content-standards.md`. Options to evaluate, cheapest first: cite the
   skill section each rule derives from (so a reader can diff by hand); record the skill
   version/commit the rules were derived from; or a check that fails when the skill is present and
   its standards have moved. Pick one and say why the others were rejected.
3. **Decide record-series coverage.** A cloner cannot currently check `docs/tasks`, `docs/adr`,
   `docs/audits`, `docs/handoffs` at all. Either extend the floor to them, or state deliberately
   that record conformance requires the skill and say so in `CONTRIBUTING.md`. **Do not reimplement
   the skill's 16 checks** - that is the replication to avoid.
4. **Make the command's own output honest** about what it did not check.

## Out of scope

- Reimplementing `engineering document validate`.
- Vendoring the skill's knowledge files into this repo (creates the drift problem in a worse form).
- Any change to the six living documents themselves.

## Done when

- **AC-1:** `docs/standards/documentation.md` names the skill as the authority, `atlas docs check`
  as the floor, and links the skill source.
- **AC-2:** `atlas docs check` output states what it does not check and points at the authority.
- **AC-3:** Each rule in `cli/doc-rules.ts` cites the skill section it derives from, and the
  chosen drift control is implemented with the rejected alternatives recorded.
- **AC-4:** Record-series coverage is decided either way, and the decision is written where a
  contributor will meet it.
- **AC-5:** No check in `atlas docs check` duplicates one `engineering document validate` already
  performs on the same file.

## Completion evidence

| Criterion | Evidence | Verified |
| --------- | -------- | -------- |
| AC-1      | -        | -        |
| AC-2      | -        | -        |
| AC-3      | -        | -        |
| AC-4      | -        | -        |
| AC-5      | -        | -        |

## Authority and inputs

- `task:0010` (control surface), `task:0011` (the substance adoption this floor protects).
- `adr:0002` - why the living documents cannot be covered by the skill's own mechanism.
- Coverage comparison, 2026-09-21: 16 finding types vs 3; zero file overlap.
