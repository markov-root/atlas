---
schema_version: 2
id: 'index-0003'
uid: 'index-20260817T000000000000Z-atlasaud'
title: Audit index
role: index
status: current
summary: Point to the governed audit records for AI Safety Atlas.
created: '2026-08-17'
updated: '2026-08-17'
owner: Markov Grey
supersedes: ''
superseded_by: ''
---

# Index: Audits

## Purpose

Governed `audit` records — dated observations, methods, and evidence limits. Allocated with
`engineering document new audit --title "..."`.

## Entries

- [audit:0001](./0001-external-service-dependency-audit-for-independence.md) —
  External-service dependency audit for independence (draft, 2026-08-17).

### Codebase cleanup sweep (2026-09)

Five audits scoped to one dimension each, allocated together so their findings can be read as one
sweep. IDs are reserved and committed; a record that is still a template has not been run yet.

- [audit:0002](./0002-structure-modularity-and-file-tree-coherence.md) —
  Structure, modularity, and file-tree coherence (draft, 2026-09-21; 7 findings).
- [audit:0003](./0003-test-suite-depth-gaps-and-architectural-fitness.md) —
  Test-suite depth, gaps, and architectural fitness (template, not yet run).
- [audit:0004](./0004-cruft-dead-code-and-dependency-hygiene.md) —
  Cruft, dead code, and dependency hygiene (template, not yet run).
- [audit:0005](./0005-code-quality-patterns-and-typescript-idiom.md) —
  Code quality, patterns, and TypeScript idiom (template, not yet run).
- [audit:0006](./0006-developer-ergonomics-and-the-case-for-an-atlas-control-surface.md) —
  Developer ergonomics and the case for an `atlas` control surface (draft, 2026-09-21; 7 findings).
