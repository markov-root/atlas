---
schema_version: 2
id: '0001'
uid: 'task-20260817T191632220967Z-62a10846'
title: 'Eliminate imagegen.foreview.org runtime dependency'
role: task
status: done
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
  state: done
  authority:
    kind: work-state
    owner: Markov Grey
    scope: BOUNDED ACCEPTANCE AND COMPLETION AUTHORITY
  created: '2026-08-17'
  updated: '2026-10-23'
  transition_history: complete
  transitions:
    - from: todo
      to: done
      at: '2026-10-23'
      reason: Text-only metadata passed verification and was checked on live Atlas pages.
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

- AC-1: `rg -n 'imagegen\.foreview\.org|ogImageUrl|sectionOgImageUrl' src` found no matches after
  removing the helper and every call site in commit `9f5779c`.
- AC-2: The built homepage, `/teach/`, and a chapter page have `twitter:card=summary` and no
  `og:image` or `twitter:image`. All three retain `og:title` and `og:description`.
- AC-3: `pnpm verify` passed with `SKIP_AUDIO=1 SKIP_AUDIO_DOWNLOAD=1`, including 323 TypeScript
  tests, 364 Python tests, the static build, smoke tests, and accessibility tests. GitHub Pages
  [run 39991570988](https://github.com/markov-root/atlas/actions/runs/39991570988) deployed the
  change. The same three [live pages](https://ai-safety-atlas.com/) returned text-only metadata.
