---
schema_version: 2
id: '0006'
uid: 'task-20260817T200616059591Z-e7186051'
title: 'Decide independence posture for the @foreview logos package'
role: task
status: todo
summary: 'Task record: Decide independence posture for the @foreview logos package.'
created: '2026-08-17'
updated: '2026-08-17'
owner: Markov Grey
supersedes: ''
superseded_by: ''
engineering_document:
  version: 1
  role: task
  id: '0006'
  uid: task-20260817T200616059591Z-e7186051
  title: 'Decide independence posture for the @foreview logos package'
  state: todo
  authority:
    kind: work-state
    owner: Markov Grey
    scope: BOUNDED ACCEPTANCE AND COMPLETION AUTHORITY
  created: '2026-08-17'
  updated: '2026-08-17'
  transition_history: unverified
  transitions: []
  relationships: []
  details:
    criteria: [criterion:AC-1, criterion:AC-2]
---

# Task 0006: Decide independence posture for the @foreview logos package

## Problem

The partner-org logos come from `@foreview/ais-logos-astro`, a **public** npm package sourced from
`github.com/foreview/aisafety-logos` and controlled by the foreview entity (`audit:0001` #7). The
build works today without any private access, so this is **non-blocking and low priority** — but
updating a logo, or surviving an unpublish, requires access we don't formally hold. `adr:0001`'s
revisit trigger says to record an explicit decision rather than silently depend on it.

## Scope

- Choose and record one posture: (a) accept it as an external public dependency (pin the version),
  (b) obtain access to the `@foreview` npm scope + source repo, or (c) fork/vendor the package under
  our own scope.
- Implement the chosen option if it is (b) or (c).

## Out of scope

- Redesigning the logos or the partner-org list.

## Done when

- AC-1: A recorded decision (accept / obtain-access / fork) with rationale.
- AC-2: If fork/vendor or access is chosen, it is implemented and `pnpm build` still resolves the
  organization logos.

## Completion evidence

Keep empty until evidence exists. Before changing state to `done`, link the implementation, checks,
records, and limitations that satisfy each criterion.
