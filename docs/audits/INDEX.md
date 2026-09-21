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
sweep. All five were written on 2026-09-21 against commits `22c56a1`–`7e4dc36`. Every recommendation
in the sweep is **pending owner decision**; none authorises a code change, per `handoff:0002`
§Constraints.

Cross-cutting note: audits 0002, 0003, and 0005 each reach the same boundary from a different side —
`src/lib/`'s browser modules are simultaneously the least structurally marked (0002 F2), the least
tested (0003 F1), and the location of the only runtime-risky assertion (0005 F4). Recommendations
that move those files should be decided together rather than audit by audit.

- [audit:0002](./0002-structure-modularity-and-file-tree-coherence.md) —
  Structure, modularity, and file-tree coherence (draft, 2026-09-21; 7 findings).
- [audit:0003](./0003-test-suite-depth-gaps-and-architectural-fitness.md) —
  Test-suite depth, gaps, and architectural fitness (draft, 2026-09-21; 5 findings).
- [audit:0004](./0004-cruft-dead-code-and-dependency-hygiene.md) —
  Cruft, dead code, and dependency hygiene (draft, 2026-09-21; 5 findings).
- [audit:0005](./0005-code-quality-patterns-and-typescript-idiom.md) —
  Code quality, patterns, and TypeScript idiom (draft, 2026-09-21; 6 findings).
- [audit:0006](./0006-developer-ergonomics-and-the-case-for-an-atlas-control-surface.md) —
  Developer ergonomics and the case for an `atlas` control surface (draft, 2026-09-21; 7 findings).

### Deep scaling audit (2026-09)

A second, deeper sweep commissioned because the project is scaling along several axes at once —
edition 2 in progress, translations in flight, new content types wanted, and an unsolved audio
regeneration-cost problem. Scoped by causal chain rather than by file, one auditor per chain.

- [audit:0007](./0007-content-model-fitness-for-multiple-editions-and-languages.md) —
  Content-model fitness for multiple editions and languages (draft, 2026-09-21; 10 findings).
- [audit:0008](./0008-extensibility-of-the-ast-and-renderers-for-new-content-types.md) —
  Extensibility of the AST and renderers for new content types (draft, 2026-09-21; 8 findings).
- [audit:0009](./0009-audio-pipeline-economics-incremental-regeneration-and-voice-unification.md) —
  Audio pipeline economics, incremental regeneration, and voice unification (draft, 2026-09-21; 8 findings).
- [audit:0010](./0010-external-integration-boundaries-failure-modes-and-site-performance.md) —
  External integration boundaries, failure modes, and site performance (draft, 2026-09-21; 10 findings).
