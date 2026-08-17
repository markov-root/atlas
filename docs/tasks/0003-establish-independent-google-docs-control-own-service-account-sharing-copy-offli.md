---
schema_version: 2
id: '0003'
uid: 'task-20260817T200614306861Z-83831634'
title: 'Establish independent Google Docs control (own service account, sharing/copy, offline backups)'
role: task
status: todo
summary: 'Task record: Establish independent Google Docs control (own service account, sharing/copy, offline backups).'
created: '2026-08-17'
updated: '2026-08-17'
owner: Markov Grey
supersedes: ''
superseded_by: ''
engineering_document:
  version: 1
  role: task
  id: '0003'
  uid: task-20260817T200614306861Z-83831634
  title: 'Establish independent Google Docs control (own service account, sharing/copy, offline backups)'
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
    criteria: [criterion:AC-1, criterion:AC-2, criterion:AC-3, criterion:AC-4, criterion:AC-5]
---

# Task 0003: Establish independent Google Docs control (own service account, sharing/copy, offline backups)

## Problem

The 8 chapter docs (`src/textbook-loader/data.ts`, fetched by `docId`+`tabId`) live in the
freelancer's Google Workspace and are read at build time via a service account the freelancer
controls. Google blocks cross-Workspace ownership transfer. Until we have our own read credential
(and, for durability, our own copies), the content pipeline depends on the freelancer's Google
account. See `audit:0001` finding #1 and the strategy in `adr:0001`.

## Scope

- Mint a Google Cloud service account with `documents.readonly` → `GOOGLE_CREDENTIALS_BASE64`.
- Share the 8 chapter docs (and the 7 facilitation-guide docs) with the new service account and with
  `markov@cesia.org`.
- Export offline backups of all 8 docs (insurance before any cutover).
- For durable ownership: copy the docs into the CeSIA Workspace and update the 8 `docId`/`tabId`
  entries in `data.ts`, then refresh `.cache/docs/` (run the secret-scan). Or record a decision to
  defer and rely on read-sharing for now.

## Out of scope

- Editing textbook content; the imagegen migration (`task:0001`).
- The GitHub-secret reset + old-key revocation mechanics, tracked centrally in `task:0004`.

## Done when

- AC-1: Own service account exists (`documents.readonly`), base64 key in `.env` and the GitHub
  Actions secret.
- AC-2: A maintainer `pnpm build` fetches all 8 chapters fresh with the new key (no cache-miss).
- AC-3: Offline backups of all 8 docs are stored.
- AC-4: Either `data.ts` docIds/tabIds updated to CeSIA-owned copies (+ cache refreshed, secret-scan
  run), or a recorded decision to defer the copy.
- AC-5: The freelancer's old service account access is revoked.

## Completion evidence

Keep empty until evidence exists. Before changing state to `done`, link the implementation, checks,
records, and limitations that satisfy each criterion.
