---
schema_version: 2
id: '0001'
uid: 'audit-20260817T200612545914Z-c774dc83'
title: 'External-service dependency audit for independence'
role: audit
status: draft
summary: 'Audit record: External-service dependency audit for independence.'
created: '2026-08-17'
updated: '2026-08-17'
owner: Markov Grey
supersedes: ''
superseded_by: ''
engineering_document:
  version: 1
  role: audit
  id: '0001'
  uid: audit-20260817T200612545914Z-c774dc83
  title: 'External-service dependency audit for independence'
  state: draft
  authority:
    kind: point-in-time-evidence
    owner: Markov Grey
    scope: SUBJECTS AND AS-OF BOUNDARY
  created: '2026-08-17'
  updated: '2026-08-17'
  transition_history: unverified
  transitions: []
  relationships: []
  details:
    as_of: '2026-08-17'
    subjects:
      [
        google-docs-pipeline,
        cloudflare-r2,
        algolia,
        elevenlabs,
        gemini,
        imagegen.foreview.org,
        foreview-logos,
        github-actions-secrets,
        domain-dns,
      ]
    method: source-and-config-inspection
    limitations: []
---

# Audit 0001: External-service dependency audit for independence

## Scope

Every external service, credential, and hosted dependency the Atlas build/site relies on, as of
2026-08-17, to determine what must be owned, backed up, or rotated for the project to be
self-sustaining after the freelancer handoff. Boundary: this repo (`markov-root/atlas`) plus the
freelancer's Slack list (Google Docs, Cloudflare, images).

## Method

Read `package.json`, `.env`/`.env.example`, `astro.config.mjs`, `.github/workflows/*`,
`src/textbook-loader/**` (loader, `gdocsdk.ts`, renderers), `src/lib/og.ts`, and `docs/ARCHITECTURE.md`;
cross-checked declared env schema against CI secrets and against what each renderer actually calls.
Inference is separated from observed facts below.

## Findings

**Owned/held by Markov already (confirmed with user):** Algolia account; the `markov-root/atlas`
GitHub repo + GitHub Pages deploy; the `ai-safety-atlas.com` domain and DNS. Gemini + ElevenLabs
keys are trivially rotatable.

**External dependencies and their state:**

1. **Google Docs (8 chapter docs).** `src/textbook-loader/data.ts` — fetched by `docId`+`tabId`
   via a service account (`GOOGLE_CREDENTIALS_BASE64`, `documents.readonly`). Also 7 facilitation-guide
   docs referenced as URLs. → `task:0003`.
2. **Cloudflare R2.** Bucket `atlas-cache` on account `c4f04943…`, fronted by
   `atlas.foreviewusercontent.com` (`CDN_BASE` hardcoded in `renderers/pdf/renderer.ts` and
   `renderers/audio/renderer.ts`). Prefixes: `final-audio/` (79), `audio/` (95), `audio-chunks/` (2995),
   `pdf/` (28), `equation-descriptions/` (32) = 3229 objects / 5.7 GB. Backed up to `~/atlas-r2-backup`
   (verified 3229 files, 5.8 GB). Migration to own account → `task:0002`.
3. **imagegen.foreview.org** — NOT on the freelancer's list. `src/lib/og.ts` points every page's
   `og:image`/`twitter:image` at this freelancer-hosted on-demand renderer. Sole remaining external
   _runtime_ dependency; link previews break silently if it dies. → `task:0001`.
4. **ElevenLabs + Gemini** — audio TTS (stock voice "George" `JBFqnCBsd6RMkjVDRZzb`) and equation
   alt-text (`gemini-2.5-flash`). Audio is FROZEN: CI runs `SKIP_AUDIO=1`, no `ELEVENLABS_API_KEY` in
   CI, so nothing regenerates the MP3s — the R2 copy is the only one. → `task:0005`.
5. **Algolia** — public app `W6WTQ7JBP1`/index `atlas-foreview` committed as defaults in
   `astro.config.mjs` (search works for everyone); `ALGOLIA_WRITE_KEY` (secret) needed to reindex.
   Rotation → `task:0004`.
6. **GitHub Actions secrets** — `deploy.yml` reads 10 secrets (`GOOGLE_CREDENTIALS_BASE64`, 3×
   `PUBLIC_ALGOLIA_*`, `ALGOLIA_WRITE_KEY`, `GEMINI_API_KEY`, 4× `R2_*`). Populated by the freelancer;
   must be reset with own credentials. → `task:0004`.
7. **`@foreview/ais-logos-astro`** — partner-org logos. Published _public_ on npm (source
   `github.com/foreview/aisafety-logos`); build needs no private access. Non-blocking. → `task:0006`.

## Limitations

Not observed: the actual contents of the freelancer's Cloudflare/Algolia/Google Cloud dashboards
(no access); whether the R2 temp key is read-only or read-write; the `imagegen.foreview.org` service
source (not in repo). Findings on ownership reflect the user's statements, not independent verification.

## Disposition

Follow-up tracked as `task:0001`–`task:0006` and umbrella `handoff:0001` (owner: Markov Grey). No
item is a no-action. The single highest-fragility finding (frozen audio, #4) is de-risked immediately
by the verified R2 backup and durably by `task:0005`.
