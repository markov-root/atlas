---
schema_version: 2
id: '0004'
uid: 'task-20260817T200614882228Z-f797cd14'
title: 'Rotate all freelancer-held credentials and reset GitHub Actions secrets'
role: task
status: todo
summary: 'Task record: Rotate all freelancer-held credentials and reset GitHub Actions secrets.'
created: '2026-08-17'
updated: '2026-08-17'
owner: Markov Grey
supersedes: ''
superseded_by: ''
engineering_document:
  version: 1
  role: task
  id: '0004'
  uid: task-20260817T200614882228Z-f797cd14
  title: 'Rotate all freelancer-held credentials and reset GitHub Actions secrets'
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

# Task 0004: Rotate all freelancer-held credentials and reset GitHub Actions secrets

## Problem

The freelancer has held every secret this project uses — the Google service account, the four
`R2_*` keys, `ALGOLIA_WRITE_KEY`, `GEMINI_API_KEY`, and `ELEVENLABS_API_KEY` — all present in their
`.env` and in the 10 GitHub Actions secrets they populated (`deploy.yml`). Per `adr:0001`, obtaining
copies is not independence; the credentials must be re-minted under our own accounts and the old ones
revoked. See `audit:0001` findings #4–#6.

## Scope

- Re-mint each credential under Markov-owned accounts: `GOOGLE_CREDENTIALS_BASE64` (via `task:0003`),
  `R2_*` (via `task:0002`), `ALGOLIA_WRITE_KEY`, `GEMINI_API_KEY`, `ELEVENLABS_API_KEY`.
- Update local `.env` and reset all 10 GitHub Actions secrets with the new values.
- Fix the current `.env` R2 mismatch (access-key-id `400344…` does not pair with the pasted secret).
- Revoke every old freelancer-issued credential and confirm it no longer works.

## Out of scope

- The R2 bucket migration itself (`task:0002`) and the Google Docs service-account setup (`task:0003`);
  this task owns the cross-cutting rotation + GitHub-secret reset + revocation.

## Done when

- AC-1: Every credential is re-minted under a Markov-owned account; none is freelancer-issued.
- AC-2: All 10 GitHub Actions secrets are reset with own values and a deploy succeeds.
- AC-3: Local `.env` is internally consistent (R2 id/secret pair matches) and remains gitignored.
- AC-4: Old freelancer-held credentials are revoked and verified inert.

## Completion evidence

Keep empty until evidence exists. Before changing state to `done`, link the implementation, checks,
records, and limitations that satisfy each criterion.
