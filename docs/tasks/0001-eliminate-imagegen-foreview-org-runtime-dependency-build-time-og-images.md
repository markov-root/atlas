---
schema_version: 2
id: '0001'
uid: 'task-20260817T191632220967Z-62a10846'
title: 'Eliminate imagegen.foreview.org runtime dependency with build-time OG images'
role: task
status: done
summary: 'Generate Atlas social images during the static build using the original Atlas Satori templates.'
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
  title: 'Eliminate imagegen.foreview.org runtime dependency with build-time OG images'
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
    - from: done
      to: in_progress
      at: '2026-10-23'
      reason: The site owner requested build-time images using the original card templates.
    - from: in_progress
      to: done
      at: '2026-10-23'
      reason: The original cards passed verification and were served from Atlas after deployment.
  relationships: []
  details:
    criteria: [criterion:AC-1, criterion:AC-2, criterion:AC-3, criterion:AC-4]
---

# Task 0001: Eliminate imagegen.foreview.org runtime dependency with build-time OG images

## Problem

Atlas pages previously advertised `https://imagegen.foreview.org/atlas/...` as their social image.
That made link previews depend on a service outside Atlas. The initial text-only replacement removed
the dependency but also removed image previews. The site owner then requested static images generated
during each build from the original Atlas card templates.

## Scope

- Copy the original `og` and `section` Satori layouts and their image assets into Atlas.
- Generate 1200 by 630 PNGs after the Astro static build using page metadata and the original card fields.
- Give each image a content-derived URL and reuse unchanged renderings across builds.
- Advertise own-domain images with wide Open Graph and Twitter card metadata.
- Keep the credential-free contributor build working.

## Out of scope

- Retiring the shared Imagegen infrastructure, which may serve other websites.
- Other Atlas hosting and credential changes, tracked in separate tasks.

## Done when

- AC-1: No site source references `imagegen.foreview.org`.
- AC-2: Built pages advertise local PNGs that exist at their URLs, use `twitter:card=summary_large_image`, and specify 1200 by 630 dimensions.
- AC-3: The original general and chapter Satori layouts render with their original text and image assets.
- AC-4: The contributor build and full Atlas verification gate pass, and representative live pages serve the images.

## Completion evidence

- AC-1: `rg -n 'imagegen\.foreview\.org|ogImageUrl|sectionOgImageUrl' src` found no matches.
- AC-2: The static build generated 88 PNGs for 393 HTML pages. The homepage, `/teach/`, and a
  chapter page advertise own-domain images with 1200 by 630 metadata and `summary_large_image`.
  Each advertised live PNG returned HTTP 200 as `image/png` in under half a second in the check.
- AC-3: The original Atlas `og` and `section` Satori templates and both original image assets
  are copied into `scripts/og/`. The generator passes each chapter's original eyebrow, title,
  description, audio state, and edition. Visual checks covered the homepage and chapter cards.
- AC-4: `pnpm verify` passed in contributor mode with 323 TypeScript tests, 364 Python tests,
  the static build, smoke tests, and accessibility tests. The generator reused all 88 cached
  images on a second run. GitHub Pages [run 39996520279](https://github.com/markov-root/atlas/actions/runs/39996520279)
  deployed commit `5514869`, and the same three [live pages](https://ai-safety-atlas.com/)
  served the expected images.
