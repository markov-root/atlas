---
schema_version: 2
id: '0002'
uid: 'task-20260817T200613724764Z-f38211ae'
title: 'Migrate R2 assets to our own Cloudflare account and repoint config'
role: task
status: done
summary: 'Copied the complete Atlas R2 cache to CeSIA Cloudflare, switched build credentials and public links, deployed, and revoked the old key.'
created: '2026-08-17'
updated: '2026-10-23'
owner: Markov Grey
supersedes: ''
superseded_by: ''
engineering_document:
  version: 1
  role: task
  id: '0002'
  uid: task-20260817T200613724764Z-f38211ae
  title: 'Migrate R2 assets to our own Cloudflare account and repoint config'
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
      reason: Full R2 copy verified, live Pages deployment checked, and old Atlas R2 key revoked.
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
  - `src/textbook-loader/renderers/pdf/renderer.ts` - `CDN_BASE` (1 occurrence).
  - `src/textbook-loader/renderers/audio/renderer.ts` - `CDN_BASE` (1 occurrence).
  - `src/data/chapter-timing.ts` - **71 occurrences**, one `publishedUrl` per narrated section.
    Added by the read-along work (PR #12). These are pinned full URLs rather than a derived
    constant, deliberately: they let a clone with no credentials play the exact recording the
    committed word timings were measured against. A migration that only repoints `CDN_BASE` will
    leave every read-along page pointing at the old host. See `task:0008`.
- Repoint the four `R2_*` values in `.env` and in the GitHub Actions secrets.

## Out of scope

- Regenerating the assets (they are backed up and largely deterministic - audio is `task:0005`).
- The imagegen runtime dependency (`task:0001`) and credential rotation mechanics (`task:0004`).

## Done when

- AC-1: All 3229 objects exist in the Markov-owned bucket (object count + size match the backup).
- AC-2: `R2_*` in `.env` and GitHub Actions secrets point at the new account and a deploy succeeds.
- AC-3: A built page's PDF and audio links resolve (HTTP 200) from the new hosting.
- AC-4: The freelancer's temp R2 key is revoked after cutover.

## Completion evidence

Completed 2026-10-23.

- **AC-1:** Copied the current source bucket to the new `atlas-cache` bucket in CeSIA's Cloudflare
  account. The source snapshot contained 3,260 objects (7,315,880,568 bytes), 31 more than the
  3,229-object backup cited above. The final one-way `rclone check` found **0
  differences and 3,260 matching files** after the deploy.
- **AC-2:** Updated the four local `.env` `R2_*` values and the four GitHub Actions secrets to the new
  scoped bucket credentials. [PR #14](https://github.com/markov-root/atlas/pull/14) changed all
  public asset URLs and passed the [verify run](https://github.com/markov-root/atlas/actions/runs/39964737248).
  The merged commit was `64c4199`; the [Pages deployment](https://github.com/markov-root/atlas/actions/runs/39965292083)
  completed successfully.
- **AC-3:** The [live chapter](https://ai-safety-atlas.com/chapters/v1/capabilities/introduction/)
  contains eight `atlas-media.cesia.org` references and no `atlas.foreviewusercontent.com` references.
  Its PDF and chapter audio both returned HTTP 200 from the new hostname with valid HTTPS.
- **AC-4:** Revoked the old `atlas-cache-r2` access token that was configured in `.env` before the
  cutover. Also revoked the short-lived source read and destination migration tokens created for
  this copy. The old public bucket and hostname remain available for previously published links.
