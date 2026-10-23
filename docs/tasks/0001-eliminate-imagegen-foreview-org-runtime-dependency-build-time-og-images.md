---
schema_version: 2
id: '0001'
uid: 'task-20260817T191632220967Z-62a10846'
title: 'Eliminate imagegen.foreview.org runtime dependency'
role: task
status: todo
summary: 'Remove Atlas social images so published pages no longer depend on imagegen.foreview.org.'
created: '2026-08-17'
updated: '2026-10-23'
owner: Markov Grey
supersedes: ''
superseded_by: ''
engineering_document:
  version: 1
  role: task
  id: '0001'
  uid: task-20260817T191632220967Z-62a10846
  title: 'Eliminate imagegen.foreview.org runtime dependency'
  state: todo
  authority:
    kind: work-state
    owner: Markov Grey
    scope: BOUNDED ACCEPTANCE AND COMPLETION AUTHORITY
  created: '2026-08-17'
  updated: '2026-10-23'
  transition_history: unverified
  transitions: []
  relationships: []
  details:
    criteria: [criterion:AC-1, criterion:AC-2, criterion:AC-3]
---

# Task 0001: Eliminate imagegen.foreview.org runtime dependency

## Problem

Atlas pages previously advertised `https://imagegen.foreview.org/atlas/...` as their social image.
That made link previews depend on a service outside Atlas. The earlier plan was to generate matching
PNGs during the build. On 2026-10-23, the site owner chose text-only previews instead.

## Scope

- Remove `og:image` and `twitter:image` from the shared head component.
- Use a text-only Twitter card, retaining the page title, description, and canonical URL.
- Remove OG image helpers and their call sites from all page layouts and routes.

## Out of scope

- Retiring the shared Imagegen infrastructure, which may serve other websites.
- Other Atlas hosting and credential changes, tracked in separate tasks.

## Done when

- AC-1: No site source references `imagegen.foreview.org`.
- AC-2: Built pages emit no `og:image` or `twitter:image` and use `twitter:card=summary`.
- AC-3: The Atlas verification gate passes and representative live pages serve text-only previews.

## Completion evidence

Pending deployment and live verification.
