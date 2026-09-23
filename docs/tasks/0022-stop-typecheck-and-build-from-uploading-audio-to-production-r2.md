---
schema_version: 2
id: '0022'
uid: 'task-20260921T210522747094Z-bc863ed1'
title: 'Stop typecheck and build from uploading audio to production R2'
role: task
status: todo
summary: 'A plain pnpm typecheck attempts to PUT chapter audio to production R2, and only dead credentials prevented it.'
created: '2026-09-21'
updated: '2026-09-21'
owner: Markov Grey
supersedes: ''
superseded_by: ''
engineering_document:
  version: 1
  contract_tier: full
  role: task
  id: '0022'
  uid: task-20260921T210522747094Z-bc863ed1
  title: 'Stop typecheck and build from uploading audio to production R2'
  state: todo
  authority:
    kind: work-state
    owner: Markov Grey
    scope: The audio renderer upload phases and the BuildMode contract that should gate them
  created: '2026-09-21'
  updated: '2026-09-21'
  transition_history: unverified
  transitions: []
  relationships: []
  details:
    criteria: [criterion:AC-1, criterion:AC-2, criterion:AC-3, criterion:AC-4, criterion:AC-5]
    size: s
    priority: p1
---

# Task 0022: Stop typecheck and build from uploading audio to production R2

## Problem

On 2026-09-21, a plain `pnpm typecheck` on a maintainer machine attempted an S3 `PutObject` of a
**96 MB chapter MP3** (`content-length: 96596397`, key `/audio/atlas-chapter5-audio-<hash>.mp3`) to
the production R2 bucket. The write failed only because the R2 credentials in `.env` are stale and
the signature was rejected - the request then died with `write ETIMEDOUT` on the TLS socket, which
presents as a confusing typecheck failure rather than as what it is.

**A typecheck performed a mutating, outward-facing side effect on production storage.** The audio in
R2 is frozen and effectively irreplaceable (there is no CI regeneration path), so a successful
version of this upload could overwrite good published audio with whatever happened to be on the local
disk.

Three defects combine to produce this:

1. **`BuildMode.uploadAudio` is dead configuration.** `src/lib/build-mode.ts:57` computes
   `uploadAudio: hasR2Creds && !isDev && !skipAudio`, and `build-mode.test.ts` asserts it in five
   cases - but **no production module reads it**. The stated contract in `build-mode.ts:1-6` is that
   it is the "single source of truth for environment-dependent build behaviour" and that "no other
   module should read process.env for these decisions". For uploads, that contract is not honoured.

2. **The upload phases are ungated.** `renderers/audio/renderer.ts:232`, `:250` and `:268` call
   `pushToR2()`, `pushFinalAudioFiles()` and `pushPublicFiles()` unconditionally at the end of the
   render. The only guard is an early return at `:53`, which requires **both** `skipGeneration` and
   `process.env.SKIP_AUDIO_DOWNLOAD`.

3. **`SKIP_AUDIO_DOWNLOAD` cannot be set from `.env`.** It is declared in neither
   `astro.config.mjs`'s env schema nor bridged to `process.env` in `src/content.config.ts:80-90`
   (which does bridge `ELEVENLABS_API_KEY`, `GEMINI_API_KEY`, the four `R2_*` vars, `SKIP_PDF` and
   `SKIP_AUDIO`). A maintainer who writes `SKIP_AUDIO_DOWNLOAD=1` in `.env` - as the current `.env`
   does - gets no effect at all; it must be `export`ed into the shell. The guard silently does not
   apply in the exact configuration a maintainer is most likely to be in.

Phase 8 is additionally broader than its own intent. `finalToUpload` is correctly restricted to
synthesized sections and chapters, but `publicAudio` is built by scanning `existsSync(s.mp3Path)`
over **all** sections, so every MP3 present on disk is re-uploaded to the public CDN prefix on every
run regardless of whether anything changed.

## Scope

- Make `BuildMode.uploadAudio` the single consulted gate for all three upload phases, so the flag
  that is already computed and tested is the flag that actually decides.
- Either declare and bridge `SKIP_AUDIO_DOWNLOAD` the way `SKIP_AUDIO` is, or remove it in favour of
  the `BuildMode` gate. Two mechanisms with different reach is the root confusion.
- Narrow Phase 8 to files this run actually produced.
- Record the `.env`-versus-`export` trap wherever the audio workflow is documented, or remove the
  trap.

## Out of scope

- **Rotating the R2 credentials.** They are stale, which is the only reason this was not destructive.
  Rotation is tracked separately and must not happen before this task lands, because working
  credentials plus the current code is the dangerous combination.
- **Any change to audio synthesis, voice, or cache keys.** That is `task:0016`.
- **The `pnpm typecheck` non-hermeticity finding** (`audit:0005` F7) more broadly. This task fixes
  the destructive half; the general question of whether `astro check` should reach the network at all
  stays with `task:0017`.

## Decisions required before execution

### D1 - Should a credentialed build upload audio by default at all?

| Option                                                    | Consequence                                                                                                      |
| --------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| **A.** Gate on `BuildMode.uploadAudio` (current intent)   | A credentialed non-dev build with `SKIP_AUDIO` unset still uploads. Preserves today's CI/deploy behaviour.       |
| **B.** Require an explicit opt-in (`ATLAS_PUBLISH_AUDIO`) | Uploading becomes a deliberate act. Safer given the audio is irreplaceable; changes the deploy contract.         |
| **C.** Move uploading out of the build entirely           | Only `atlas` publishes audio. Cleanest separation, largest change, depends on `task:0010`'s command set landing. |

**Recommendation: B now, C later.** The audio is irreplaceable and there is no regeneration path, so
the default should be that a build cannot overwrite it. B is a small change that removes the whole
class of accident; C is the right end state but should not block the fix.

**Irreversible if wrong:** an upload that succeeds overwrites published audio in place. There is no
version history on the bucket and no way to regenerate the original (see `[[atlas-audio-is-frozen]]`).

### D2 - Keep `SKIP_AUDIO_DOWNLOAD` or fold it into `BuildMode`?

| Option                       | Consequence                                                                               |
| ---------------------------- | ----------------------------------------------------------------------------------------- |
| **A.** Declare and bridge it | The documented escape hatch starts working from `.env`. Keeps two overlapping mechanisms. |
| **B.** Fold into `BuildMode` | One mechanism. Breaks any existing muscle memory and scripts that export it.              |

**Recommendation: B**, with the variable kept as a recognized alias for one release so existing
workflows do not silently change behaviour. `PRINCIPLES.md` already commits to `BuildMode` being the
single source of truth; two mechanisms is the thing that produced this defect.

## Done when

- **AC-1:** With R2 credentials present and `SKIP_AUDIO` set, `pnpm typecheck` and `pnpm build`
  issue **zero** S3 write requests. Demonstrated by a test that fails against the current code.
- **AC-2:** `BuildMode.uploadAudio` is read by the audio renderer, and removing it from
  `build-mode.ts` causes a compile error rather than a silent behaviour change.
- **AC-3:** Phase 8 uploads only files produced by the current run; a run that synthesizes nothing
  uploads nothing.
- **AC-4:** The `.env`-versus-`export` asymmetry is either gone or documented at the point of
  temptation, in `.env.example` and in `docs/runbooks/regenerate-chapter-audio.md`.
- **AC-5:** The decisions in D1 and D2 are recorded with the owner's choice before implementation
  begins.

## Completion evidence

_To be filled on completion. Each row must cite a criterion and durable evidence - a commit, a file
path, or a recorded owner decision - not a narrative claim._

| Criterion | Evidence | Verified |
| --------- | -------- | -------- |
| AC-1      | -        | -        |
| AC-2      | -        | -        |
| AC-3      | -        | -        |
| AC-4      | -        | -        |
| AC-5      | -        | -        |

## Authority and inputs

- Observed failure: `pnpm typecheck` on 2026-09-21, branch `codebase-cleanup` at `e693014`. The
  canonical request in the error output names `PutObject`, the 96 MB content length, and the
  production bucket host.
- `src/lib/build-mode.ts:1-6` - the contract this violates. `:57` - the unused flag.
- `src/textbook-loader/renderers/audio/renderer.ts:53,232,250,268` - the guard and the three
  ungated upload calls.
- `src/content.config.ts:80-90` - the bridge that omits `SKIP_AUDIO_DOWNLOAD`.
- `docs/PRINCIPLES.md` - the single-source-of-truth principle for build-mode decisions.
- `audit:0005` F7 - the earlier, narrower finding that `typecheck` is not hermetic. This task
  supersedes its severity assessment: the problem is not only non-hermeticity but mutation.
- `audit:0009` - audio pipeline economics; `task:0016` owns the cache-key work this must not disturb.
