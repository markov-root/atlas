---
schema_version: 2
id: "0013"
uid: "task-20260921T191713981060Z-6382f806"
title: "Migrate the Google Docs sources the textbook is served from"
role: task
status: todo
summary: 'Repoint data.ts at new source Docs without orphaning the committed cache or silently desyncing the read-along.'
created: "2026-09-21"
updated: "2026-09-21"
owner: Markov Grey
supersedes: ""
superseded_by: ""
engineering_document:
  version: 1
  contract_tier: full
  role: task
  id: "0013"
  uid: task-20260921T191713981060Z-6382f806
  title: "Migrate the Google Docs sources the textbook is served from"
  state: todo
  authority:
    kind: work-state
    owner: Markov Grey
    scope: src/textbook-loader/data.ts, .cache/docs/, and the audio/timing artifacts a text change invalidates
  created: "2026-09-21"
  updated: "2026-09-21"
  transition_history: unverified
  transitions: []
  relationships: []
  details:
    criteria: [criterion:AC-1, criterion:AC-2, criterion:AC-3, criterion:AC-4, criterion:AC-5]
    size: m
    priority: p1
---

# Task 0013: Migrate the Google Docs sources the textbook is served from

## Problem

The owner needs to change which Google Docs the textbook is served from. Today
`src/textbook-loader/data.ts` maps each chapter to a `docId` and `tabId`; eight chapters, eight
`docId`s. Changing them is a two-line-per-chapter edit with consequences that are **not** visible at
the edit site and are not currently checked by anything.

**Consequence 1 — it orphans the committed cache.** `.cache/docs/` is a directory per `docId`
(verified: `.cache/docs/1hWdq25Nw…/t.0`), and `gdocsdk.ts:42` keys the cache `${docId}:${tabId}`. New
`docId`s mean every contributor build misses cache and, without credentials, **fails**. The
credential-free contributor build is the thing `lesson:0001` exists to protect; this change breaks it
until the cache is re-seeded and committed.

**Consequence 2 — if the prose changes at all, the read-along silently desynchronises.** Published
audio filenames hash the section *text* (`renderer.ts`), so identical text keeps its audio and its
71 committed `.words.json` timings. Any text change produces a new hash, a new published URL, and a
pinned timing file that now describes the old recording — served without error
(`audit:0010` F3, `audit:0009` F2). Audio is effectively frozen (`task:0005`), so this is not
cheaply recoverable.

**Consequence 3 — Algolia is rebuilt destructively.** `indexTextbook` deletes then saves with no
retry, inside the content-collection load (`audit:0010` F4): a failure mid-migration empties the live
search index.

## Scope

1. Establish whether the new Docs are a **pure move** (byte-identical prose) or a **move plus
   edit**. This single fact determines whether consequences 2 and 3 apply at all, and it should be
   determined before anything is repointed.
2. Repoint `data.ts` to the new `docId`/`tabId` pairs.
3. Re-seed and commit `.cache/docs/` for the new ids, and remove the orphaned directories.
4. If prose changed: identify affected sections, and follow
   `docs/runbooks/regenerate-chapter-audio.md` for audio and timings rather than improvising.
5. Verify the contributor build from a clean clone with an empty `.env` — that is the acceptance
   test that matters, and it is the one a maintainer's working copy will not catch
   (`lesson:0003`, the `pnpm-workspace.yaml` case).

## Out of scope

- Adding a second language or edition — that is the content-identity work; this task only changes
  *which* Docs the existing v1-en edition reads from.
- Restructuring `data.ts` itself.
- The Algolia destructive-reindex fix (`audit:0010` F4) — worth doing, but separately; note the
  exposure here rather than fixing it under this task.

## Done when

- **AC-1:** Whether prose changed is established and recorded before repointing, not inferred after.
- **AC-2:** `data.ts` points at the new Docs and no stale `docId` remains anywhere in the repo.
- **AC-3:** `.cache/docs/` contains exactly the new ids, is committed, and orphaned directories are
  gone.
- **AC-4:** A clean clone with an empty `.env` builds and serves prose — verified from a fresh
  checkout, not the working copy.
- **AC-5:** For any section whose text changed, audio and `.words.json` are either confirmed still
  valid or regenerated per the runbook; no section is left serving new audio with old timings.

## Completion evidence

| Criterion | Evidence | Verified |
| --------- | -------- | -------- |
| AC-1      | —        | —        |
| AC-2      | —        | —        |
| AC-3      | —        | —        |
| AC-4      | —        | —        |
| AC-5      | —        | —        |

## Authority and inputs

- `gdocsdk.ts:42` (cache key), `src/textbook-loader/data.ts` (the mapping).
- `audit:0009` F2, `audit:0010` F3 — the timings coupling; `docs/runbooks/regenerate-chapter-audio.md`.
- `audit:0010` F4 — the destructive Algolia reindex this migration will trigger.
- `lesson:0001` — why the credential-free contributor build must survive this.
