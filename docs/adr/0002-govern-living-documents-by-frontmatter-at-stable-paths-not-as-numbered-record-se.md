---
schema_version: 2
id: '0002'
uid: 'adr-20260921T142811698836Z-2c4de83a'
title: 'Govern living documents by frontmatter at stable paths, not as numbered record series'
role: adr
status: proposed
summary: 'Living docs keep stable filenames and carry role frontmatter; only append-only record series are declared in docs.currency.roles.'
created: '2026-09-21'
updated: '2026-09-21'
owner: Markov Grey
supersedes: ''
superseded_by: ''
engineering_document:
  version: 1
  contract_tier: full
  role: adr
  id: '0002'
  uid: adr-20260921T142811698836Z-2c4de83a
  title: 'Govern living documents by frontmatter at stable paths, not as numbered record series'
  state: proposed
  authority:
    kind: decision-record
    owner: Markov Grey
    scope: How documentation roles are declared in engineering.yaml and how docs/ filenames are chosen
  created: '2026-09-21'
  updated: '2026-09-21'
  transition_history: unverified
  transitions: []
  relationships: []
  details:
    decision_date: '2026-09-21'
    deciders: [Markov Grey]
---

# ADR 0002: Govern living documents by frontmatter at stable paths, not as numbered record series

## Context

The project adopted the software-engineering skill's documentation discipline (`engineering.yaml`,
`docs.currency.roles`) for `task`, `handoff`, `audit`, and `adr` records. The remaining documentation
falls into two groups:

- **Record series** — append-only, one file per event, already numbered: `docs/tasks/`,
  `docs/handoffs/`, `docs/audits/`, `docs/adr/`, plus `docs/lessons/` (a process journal, gitignored).
- **Living documents** — single, continuously-revised files at conventional names:
  `docs/ARCHITECTURE.md`, `docs/PRINCIPLES.md`, `docs/DESIGN.md`, `docs/ROADMAP.md`.

The skill defines content standards for both kinds: seven record roles and eight living roles
(`specification`, `knowledge`, `reference`, `standard`, `guide`, `roadmap`, `changelog`, `runbook`).
The intent was to bring all of them under `docs.currency.roles` so `engineering document validate`
would enforce currentness and supersession metadata on every document.

**That does not work, and the reason is structural rather than incidental.** Declaring a role in
`docs.currency.roles` makes every file matched by its `include` globs a _record_ in a numbered series:

- `document_role` requires `id_prefix_digits`, whose schema minimum is `1`
  (`assets/schemas/engineering-v2.schema.json`). There is no opt-out value.
- `document backfill docs/DESIGN.md --role standard` fails with
  `document filename must start with a 4-digit 'standard' ID`.
- `document validate` independently reports `document.currency.record-id-missing` —
  _"role 'specification' requires a 4-digit filename prefix"_ — for each of the four living documents.
- The finding's `repair` hint suggests _"repair the role id_pattern"_, but `document_role` sets
  `additionalProperties: false` and defines no `id_pattern` property. The hint is not actionable.

Conforming would therefore require renaming `docs/ARCHITECTURE.md` to something like
`docs/0001-architecture.md`.

Two further observations bounded the decision. First, the skill does not do this to its own living
documents: `knowledge/*.md` in the skill sit at stable, un-numbered paths and carry a lightweight
role-named frontmatter block (`knowledge: {version, id, summary, routes, sources}`), and the skill
ships no `engineering.yaml` governing them. Second, `docs/lessons/` genuinely _is_ a record series —
it is append-only and gitignored, so renaming its files costs nothing.

## Decision

**Declare only append-only record series in `docs.currency.roles`. Govern living documents with role
frontmatter at their existing stable filenames, outside the currency mechanism.**

Concretely:

1. `task`, `handoff`, `audit`, `adr`, and `lesson` are declared roles with numbered filenames.
   `docs/lessons/` was migrated from `YYYY-MM-DD-topic.md` to `NNNN-topic.md` on 2026-09-21 and its
   six records now carry the full contract.
2. `ARCHITECTURE.md`, `PRINCIPLES.md`, `DESIGN.md`, and `ROADMAP.md` keep their filenames and carry a
   role-named frontmatter block declaring role, status, owner, and last-updated date, following the
   skill's own convention for its living documents.
3. `engineering.yaml` carries a comment at the point of temptation explaining why those four are
   absent, so the next reader does not "fix" it by adding them back.

## Consequences

**Positive.** Inbound links keep working — `AGENTS.md`'s orientation table, `README.md`,
`CONTRIBUTING.md`, cross-references between the docs themselves, and any external link to a
conventionally-named `ARCHITECTURE.md`. Contributors find the documents where the ecosystem trains
them to look. `engineering document validate` reaches zero findings for the governed series, so a
non-empty report is a real signal rather than four permanent warnings that teach readers to skim past
it.

**Negative.** The four living documents are _not_ machine-validated. Their frontmatter can go stale —
an `updated:` date can drift from reality — and nothing will report it. This is a genuine loss of
enforcement relative to the original intent, accepted because the alternative costs more.

**Neutral.** The two groups are now governed by visibly different mechanisms, which is a concept a
newcomer has to learn. The `engineering.yaml` comment and this record are the mitigation. If the
skill later grows a way to declare a living role without filename numbering, this decision should be
revisited — that is the trigger to reopen it.

## Alternatives considered

**Rename the living documents to numbered filenames** (`docs/0001-architecture.md`). Rejected. It
satisfies the validator by breaking every inbound link, and it makes the most-read documents in the
repository harder to find, in exchange for metadata enforcement on four files that a maintainer reads
constantly and would notice going stale. This is the tool dictating the shape of the artifact it
exists to describe.

**Declare the roles anyway and accept four permanent warnings.** Rejected. A validator whose baseline
output is non-empty stops being read. The cost is not the four lines; it is losing "validate is clean"
as a completion signal — which is exactly the signal that made the lessons migration verifiable.

**Leave the living documents with no frontmatter at all.** Rejected, though it was closest to the
status quo. The owner's explicit ask was currentness and supersession tracking on these four. The
chosen option delivers the metadata; only the automated enforcement is given up.

**Move living documents into a numbered series behind stable-named pointer files.** Rejected without
extended analysis: it preserves links at the cost of doubling the file count and introducing
indirection on every documentation read, which is worse than either honest option.
