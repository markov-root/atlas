---
schema_version: 2
id: '0002'
uid: 'task-20260817T200613724764Z-f38211ae'
title: 'Migrate R2 assets to our own Cloudflare account and repoint config'
role: task
status: todo
summary: 'Task record: Migrate R2 assets to our own Cloudflare account and repoint config.'
created: '2026-08-17'
updated: '2026-08-17'
owner: Markov Grey
supersedes: ''
superseded_by: ''
engineering_document:
  version: 1
  role: task
  id: '0002'
  uid: task-20260817T200613724764Z-f38211ae
  title: 'Migrate R2 assets to our own Cloudflare account and repoint config'
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
    criteria: [criterion:AC-1, criterion:AC-2, criterion:AC-3, criterion:AC-4]
---

# Task 0002: Migrate R2 assets to our own Cloudflare account and repoint config

## Problem

The PDFs and audio the live site serves live in the freelancer's Cloudflare R2 bucket `atlas-cache`
(account `c4f04943…`), fronted by `atlas.foreviewusercontent.com`. We now hold a verified local
backup (`~/atlas-r2-backup`, 3229 objects / 5.8 GB) but not independent hosting, and the temp read
key will be revoked. Until the assets live in our own account, the live site depends on the
freelancer's infrastructure. See `audit:0001` finding #2.

## Scope

- Create an R2 bucket in Markov's own Cloudflare account.
- Push the backed-up objects (extend `dumps/r2-backup.mjs` with an upload/`PutObject` mode).
- Keep the `atlas.foreviewusercontent.com` hostname if it can be moved, otherwise change it in all
  three places it is hardcoded:
  - `src/textbook-loader/renderers/pdf/renderer.ts` — `CDN_BASE` (1 occurrence).
  - `src/textbook-loader/renderers/audio/renderer.ts` — `CDN_BASE` (1 occurrence).
  - `src/data/chapter-timing.ts` — **71 occurrences**, one `publishedUrl` per narrated section.
    Added by the read-along work (PR #12). These are pinned full URLs rather than a derived
    constant, deliberately: they let a clone with no credentials play the exact recording the
    committed word timings were measured against. A migration that only repoints `CDN_BASE` will
    leave every read-along page pointing at the old host. See `task:0008`.
- Repoint the four `R2_*` values in `.env` and in the GitHub Actions secrets.

## Out of scope

- Regenerating the assets (they are backed up and largely deterministic — audio is `task:0005`).
- The imagegen runtime dependency (`task:0001`) and credential rotation mechanics (`task:0004`).

## Done when

- AC-1: All 3229 objects exist in the Markov-owned bucket (object count + size match the backup).
- AC-2: `R2_*` in `.env` and GitHub Actions secrets point at the new account and a deploy succeeds.
- AC-3: A built page's PDF and audio links resolve (HTTP 200) from the new hosting.
- AC-4: The freelancer's temp R2 key is revoked after cutover.

## Completion evidence

Keep empty until evidence exists. Before changing state to `done`, link the implementation, checks,
records, and limitations that satisfy each criterion.
