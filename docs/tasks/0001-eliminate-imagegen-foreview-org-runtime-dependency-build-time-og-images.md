---
schema_version: 2
id: '0001'
uid: 'task-20260817T191632220967Z-62a10846'
title: 'Eliminate imagegen.foreview.org runtime dependency (build-time OG images)'
role: task
status: todo
summary: 'Replace freelancer-hosted imagegen.foreview.org OG rendering with self-hosted build-time OG image generation.'
created: '2026-08-17'
updated: '2026-08-17'
owner: Markov Grey
supersedes: ''
superseded_by: ''
engineering_document:
  version: 1
  role: task
  id: '0001'
  uid: task-20260817T191632220967Z-62a10846
  title: 'Eliminate imagegen.foreview.org runtime dependency (build-time OG images)'
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
    criteria:
      [
        criterion:AC-1,
        criterion:AC-2,
        criterion:AC-3,
        criterion:AC-4,
        criterion:AC-5,
        criterion:AC-6,
      ]
---

# Task 0001: Eliminate imagegen.foreview.org runtime dependency (build-time OG images)

## Problem

Every page's `og:image` / `twitter:image` meta tag (set in `src/components/BaseHead.astro`) points
at `https://imagegen.foreview.org/atlas/...`, built in `src/lib/og.ts` (`IMAGEGEN_BASE`). That is a
freelancer-hosted service, not in this repo, on a domain we do not control. Link-preview images are
rendered on demand by that server when a crawler (Twitter/Slack/LinkedIn/…) fetches a shared Atlas
URL. If the service goes down or Foreview stops hosting it, **every social/link preview across the
whole site breaks silently.** It is the last external runtime dependency in the stack and the only
handoff item that requires code changes in this repo.

Consumers to migrate (every page passing an `image` prop): `src/pages/index.astro`,
`read/[...version].astro`, `teach.astro`, `get-certified.astro`, `privacy-policy.astro`,
`404.astro`, `brand.astro`, and the high-cardinality `chapters/[version]/[chapter]/[section].astro`.

## Scope

- `src/lib/og.ts` — return self-hosted URLs; keep the `ogImageUrl` / `sectionOgImageUrl` signatures
  stable so call sites are untouched.
- New build-time OG render module (Satori → SVG, rasterized to PNG with `sharp`, already a
  dependency) + Astro static image endpoint routes (e.g. `src/pages/**/og.png.ts` via
  `getStaticPaths`) that prerender the PNGs into `dist/`.
- Embed the already-installed brand fonts (`@fontsource-variable/jost`, `@fontsource/righteous`).
- Content-hash caching so unchanged cards are not re-rendered each build.
- `package.json` — add `satori` (and `@resvg/resvg-js` only if `sharp` proves insufficient).

**Recommended first step:** obtain the imagegen service source from the freelancer so the new cards
match the current design exactly (this is a blocker on visual parity — AC-4).

## Out of scope

- Redesigning the OG cards (parity with the current design is the target, not a redesign).
- The rest of the freelancer handoff — R2 bucket migration, Google Docs ownership cutover, and
  credential rotation — tracked separately (see the handoff record).
- **Alternative not chosen:** self-hosting the _same_ imagegen service on our own infra (e.g. a
  Cloudflare Worker under `ai-safety-atlas.com`) and changing only `IMAGEGEN_BASE`. This is the
  fallback if build-time cost or design parity proves unacceptable; reconsider before abandoning
  the build-time approach.

## Done when

- AC-1: No source references `imagegen.foreview.org` (`rg -n 'imagegen|foreview\.org' src/` clean
  except an intentional explanatory comment, if any).
- AC-2: Every page emits an `og:image` absolute URL under `https://ai-safety-atlas.com` pointing at
  a PNG that is present in `dist/` after `pnpm build`.
- AC-3: The contributor build (no `.env`) generates OG images successfully — OG generation requires
  no credentials.
- AC-4: Generated cards reach visual parity with the current design (spot-check old vs new; validate
  one URL in a link-preview inspector).
- AC-5: OG PNGs are cached by content hash — a second consecutive build re-renders nothing.
- AC-6: `pnpm verify` is green and the build-time delta is measured and recorded.

## Completion evidence

Keep empty until evidence exists. Before changing state to `done`, link the implementation, checks,
records, and limitations that satisfy each criterion.
