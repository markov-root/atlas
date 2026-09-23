---
schema_version: 2
id: '0023'
uid: 'task-20260921T212221707802Z-196beca4'
title: 'Take custody of the R2 assets before access is lost'
role: task
status: todo
summary: 'The irreplaceable audio lives in a freelancer-owned bucket whose API credentials are already revoked.'
created: '2026-09-21'
updated: '2026-09-21'
owner: Markov Grey
supersedes: ''
superseded_by: ''
engineering_document:
  version: 1
  contract_tier: full
  role: task
  id: '0023'
  uid: task-20260921T212221707802Z-196beca4
  title: 'Take custody of the R2 assets before access is lost'
  state: todo
  authority:
    kind: work-state
    owner: Markov Grey
    scope: Custody and migration of R2-hosted audio and PDF assets; does not cover regeneration
  created: '2026-09-21'
  updated: '2026-09-21'
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
    size: m
    priority: p1
---

# Task 0023: Take custody of the R2 assets before access is lost

## Problem

The textbook's audio and PDFs are served from `atlas.foreviewusercontent.com`, a domain and Cloudflare
R2 bucket (`atlas-cache`) owned by the **freelance developer, not by the project**. The project has no
Cloudflare account of its own. Two separate risks follow, and they are not equally urgent.

**Measured on 2026-09-21:**

| Prefix                   | Reachable via | Status                                |
| ------------------------ | ------------- | ------------------------------------- |
| `audio/`                 | public HTTPS  | **readable now** (HTTP 200 verified)  |
| `pdf/`                   | public HTTPS  | readable now                          |
| `audio-chunks/`          | S3 API only   | **unreachable - credentials revoked** |
| `equation-descriptions/` | S3 API only   | **unreachable - credentials revoked** |
| `final-audio/`           | S3 API only   | **unreachable - credentials revoked** |

The `R2_*` credentials in `.env` are well-formed (32-character access key ID, 64-character secret,
valid account endpoint) but every request - read **and** write, across all five prefixes - returns
`SignatureDoesNotMatch`. Well-formed plus universally rejected means the token was **revoked or
deleted**, not mistyped. There is no credential fix available on our side.

### What this costs, concretely

`audit:0009` and `task:0016` establish that per-paragraph regeneration is near-free _because_ a cache
of synthesized chunks exists, so editing one paragraph re-synthesizes one paragraph rather than a
whole chapter. That cache is `audio-chunks/`. **It is currently unreachable, and the local
`.cache/audio-chunks/` directory is empty (0 files).**

So the cheap-incremental-regeneration capability those records describe is, today, **not actually
available to this project**. Any edit to narrated prose currently implies re-synthesizing at full
ElevenLabs cost. That should be stated plainly rather than discovered later.

### What is already safe

Better news than expected. `.cache/uc/` on the development VM holds **88 MP3 files, 1.9 GB** - 71
section files and 17 chapter files. Of the 71 URLs the built site references, **70 already have a
local copy**; the one exception,
`atlas-ch2-s6-3015ad6eb1fd8a1b4580c7597150bd8d95c983e21d4dfbe7d5183bd8f395db09.mp3`, returns HTTP 200
from the CDN and can simply be fetched.

That directory is **gitignored** (`.gitignore:32`, `.cache/*`) and sits on a VM that **crashed twice
in two days**. The published audio is therefore one disk event away from being gone, and nobody would
notice until a build needed it. This is the most urgent item in this task and the cheapest to fix.

## Scope

1. **Back up what we already hold.** Copy `.cache/uc/` (1.9 GB, 88 files) off this VM to durable
   storage with a checksum manifest, before anything else. This is minutes of work and removes the
   largest immediate risk.
2. **Fetch the gap.** Download the one missing section MP3, and sweep the CDN for any `pdf/` object
   the built site references.
3. **Ask the freelancer for a fresh R2 API token**, scoped read-only if possible, for the sole
   purpose of copying `audio-chunks/`, `equation-descriptions/` and `final-audio/` out. This is the
   only path to that data; it cannot be recovered from the public CDN, and it cannot be regenerated
   without paying full synthesis cost. **Treat this as time-critical** - it depends on a third party's
   account remaining active and their willingness to help.
4. **Stand up a project-owned Cloudflare account and R2 bucket**, and a project-owned domain to front
   it, replacing `atlas.foreviewusercontent.com`.
5. **Re-upload and cut over**, keeping the old CDN live until the new one is verified.

## Out of scope

- **Regenerating any audio.** If `audio-chunks/` proves unrecoverable, the decision about whether to
  re-synthesize belongs to `task:0016`, together with the voice-unification decision - doing it twice
  would be wasteful.
- **Fixing the upload gating defect.** That is `task:0022`, which must land **before** working
  credentials exist again, since working credentials plus current code is the destructive combination.
- **Google Docs migration.** Same class of problem, tracked in `task:0013`.

## Decisions required before execution

### D1 - Do we ask the freelancer for a new token, and how hard do we push?

| Option                                     | Consequence                                                                                 |
| ------------------------------------------ | ------------------------------------------------------------------------------------------- |
| **A.** Ask for a read-only token, promptly | Recovers the chunk cache and cheap regeneration. Depends on goodwill and an active account. |
| **B.** Ask him to run an export himself    | Lower trust burden on him; slower, and he must follow instructions correctly.               |
| **C.** Write it off                        | Accept full re-synthesis cost on the next prose edit. No third-party dependency.            |

**Recommendation: A, this week.** The asset is unrecoverable by any other route and the window
depends on someone else's account staying open. Even if `task:0016` later decides to re-voice
everything, having the old chunks makes that a comparison rather than a leap.

**Irreversible if wrong:** if the account lapses or the bucket is deleted, `audio-chunks/` is gone
permanently, and `atlas.foreviewusercontent.com` going dark also breaks audio on the live site.

### D2 - New domain for the CDN

| Option                                | Consequence                                                               |
| ------------------------------------- | ------------------------------------------------------------------------- |
| **A.** Subdomain of the existing site | One domain to own and renew; clear provenance.                            |
| **B.** Dedicated asset domain         | Cookie-free asset serving, marginal performance benefit; another renewal. |

**Recommendation: A.** Fewer things to lose custody of is the lesson this task exists to record.

### D3 - Do the 71 pinned CDN URLs move to the new domain in the same change?

`src/data/chapter-timing.ts` hardcodes 71 absolute URLs on the freelancer's domain. They must be
rewritten at cutover. Decide whether to rewrite them to the new absolute domain, or make them
relative to a single configured base so the next move is a one-line change.

**Recommendation: a single configured base.** This task exists because assets were addressed by
someone else's domain in 71 places; repeating that shape guarantees repeating this task.

## Done when

- **AC-1:** `.cache/uc/` is backed up off this VM, with a checksum manifest, and a restore has been
  verified by checksum on at least one file.
- **AC-2:** Every CDN asset referenced by a production build has a verified local copy; the count is
  recorded and the previously-missing chapter-2 file is among them.
- **AC-3:** A recorded decision exists on D1, and if the answer was to ask, the outcome is recorded -
  including "he declined" or "no response by <date>", which are legitimate outcomes.
- **AC-4:** A project-owned R2 bucket exists under a project-owned Cloudflare account, holding the
  assets from AC-1 and AC-2.
- **AC-5:** The site serves audio and PDFs from the project-owned domain, with `task:0022` landed
  first so no build can overwrite them.
- **AC-6:** The old bucket and domain are documented as decommissioned, and no code references them.

## Completion evidence

_To be filled on completion. Each row must cite a criterion and durable evidence - a commit, a file
path, a checksum manifest, or a recorded decision - not a narrative claim._

| Criterion | Evidence | Verified |
| --------- | -------- | -------- |
| AC-1      | -        | -        |
| AC-2      | -        | -        |
| AC-3      | -        | -        |
| AC-4      | -        | -        |
| AC-5      | -        | -        |
| AC-6      | -        | -        |

## Authority and inputs

- Access probe, 2026-09-21: `ListObjectsV2` against all five prefixes with the `.env` credentials
  returned `SignatureDoesNotMatch` in every case; a `HEAD` against a pinned `audio/` URL returned
  HTTP 200. Both are reproducible.
- Credential shape check: access key ID 32 chars, secret 64 chars, endpoint
  `c4f04943ecf145d310709d02fe56f780.r2.cloudflarestorage.com`, bucket `atlas-cache`.
- `src/textbook-loader/renderers/audio/renderer.ts:10` and `renderers/pdf/renderer.ts:12` -
  `CDN_BASE` hardcoded to the freelancer's domain.
- `src/data/chapter-timing.ts` - 71 absolute URLs on that domain.
- `src/textbook-loader/renderers/audio/r2-cache.ts:35,183,195` - the private prefixes.
- `task:0022` - must land before credentials work again.
- `task:0016`, `audit:0009` - the regeneration economics this task's outcome determines.
- `handoff:0001` - freelancer independence; this is the concrete asset-custody half of it.
