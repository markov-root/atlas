---
runbook:
  version: 1
  id: regenerate-chapter-audio
  summary: Regenerate, stage, or re-publish a chapter's audio without silently desyncing the read-along or baking a mixed-voice cache.
  status: current
  owner: Markov Grey
  updated: '2026-09-21'
---

# Runbook: Regenerate chapter audio

Source of truth for this procedure is `docs/audits/0009` (mechanism) and
`docs/audits/0010` F2/F3 (R2 failure posture, timing pairing). As of this version, the operational
knowledge also lives in the header comments of `scripts/copy-chapter-audio.sh` and
`scripts/swap-cbr-audio.ts`; `docs/tasks/0010` will retire those scripts in favour of a `bin/atlas`
CLI, and this runbook is where the reasoning survives them. When the scripts and this runbook
disagree, fix one of them - don't let both drift.

## When to use

You are in one of these situations:

- **E1 - A prose edit changed a section's narration.** The section's text hash changed, so its
  published URL changes on the next audio render. You need new audio *and* you must not ship the
  old word timings against it (see Risky step 1).
- **E2 - You are changing the ElevenLabs voice or model.** The chunk cache is keyed on
  **paragraph text alone** (`hashText` in `src/textbook-loader/renderers/audio/elevenlabs-tts.ts`;
  R2 keys `audio-chunks/<sha256(text)>.mp3|.pcm`) - with no voice/model dimension, a voice change
  silently no-ops on every cached paragraph (`audit:0009` F3). You must purge before you render,
  not after.
- **E3 - Seeking is imprecise on read-along pages.** The published MP3s are variable-bitrate; a
  seek lands near the word, not on it. The fix is the CBR swap (Risky step 2).
- **E4 - You need audio locally to develop against.** A fresh clone has timings but no MP3s
  (they're large and gitignored); pages fall back to streaming the published file.

Do **not** use this runbook to "fix the audible cut-offs" - their mechanism is not adjudicated
(§Not known). A re-render will not necessarily improve them.

**Entry conditions.** You have: an `ELEVENLABS_API_KEY` (only for E1/E2 renders); R2 credentials
`R2_ENDPOINT`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET` (only for steps that touch
R2); `ffmpeg` and `curl` on PATH; and a working tree on `codebase-cleanup` or later. You know
whether the voice/model decision (E2) has been made - if you don't know, treat it as not made.

**Authority.** Renders and cache purges are maintainer operations: run them only with the owner's
sign-off, because the R2 copy is the frozen source of the site's audio (§Why this is risky). The
CBR swap additionally overwrites live published files - it needs explicit owner approval each time.

## Why this is risky - the two couplings

Everything below exists because of two facts the build will never warn you about:

1. **Word timings are welded to the audio bytes.** The committed
   `public/audio/ch*/*.words.json` files were measured against one specific recording - the one at
   the URL pinned in `src/data/chapter-timing.ts` (`chapter-timing.ts` header comment). When a
   section's bytes change, its timings are silently wrong: `section-audio.ts` serves the new audio
   with the old word times, and no build-time check links the two (`audit:0010` F3). The drift
   detector lives in the external `atlas-podcast` repo (`pipeline.py --check-remote`), not here.
2. **The chunk cache is keyed on text only.** Voice, model, provider, and format are not in the
   key. Any synthesis run that isn't preceded by a purge re-serves old-voice chunks as cache hits,
   including pre-ElevenLabs-switch Gemini/Kore `.pcm` chunks that get converted to MP3 on the fly
   (`elevenlabs-tts.ts` legacy-`.pcm` fallback; `audit:0009` F3).

Compounding both: **CI never generates audio** - `.github/workflows/deploy.yml` runs with
`SKIP_AUDIO=1` - and no end-to-end regeneration has been verified against the live corpus
(`docs/tasks/0005` AC-2 is still open; the 3,229-object / 5.8 GB R2 backup from
`docs/handoffs/0001` is the only recovery source). Treat your first render as a verification run,
not a routine one.

## Mutations and reversibility

Every step, what it changes, and whether you can undo it:

| Step mutates | Effect | Reversible? |
| --- | --- | --- |
| `.cache/audio-chunks/*` (local) | Adds/replaces cached paragraph chunks | Delete-and-resynthesize costs real credits; backup copies exist on R2 until purged |
| R2 `audio-chunks/*` | Adds chunks; a **purge deletes ~3,000 objects** | Not reversible without re-synthesis; recoverable only from the 2026-08-17 backup (`~/atlas-r2-backup`), which itself predates any chunks created since |
| R2 `final-audio/atlas-chN-sM-<hash>.mp3` | **Adds** new keys; old-hash keys are left in place | Yes - old objects remain until explicitly deleted |
| R2 `audio/atlas-chN-sM-<hash>.mp3` (CBR swap) | **Overwrites a live, publicly served object in place** | Only if you saved the previous bytes first (the swap script does not) |
| `public/audio/ch*/chN-sM.mp3` (local CBR files) | Stages gitignored local copies | Fully - delete and re-stage |
| `src/data/chapter-timing.ts`, committed `.words.json` | **Must never change as a side effect.** Timings refresh only on purpose, via `atlas-podcast` | `git checkout` if you caught an accidental touch |

## Procedure

### A. Stage audio locally (E4, and precondition for E3)

```bash
scripts/copy-chapter-audio.sh 4          # every section of chapter 4
scripts/copy-chapter-audio.sh 4 1 2      # just sections 4.1 and 4.2
scripts/copy-chapter-audio.sh --fetch 4  # download + re-encode instead of copying
```

Two routes, in the script's own preference order:

1. **Pipeline copy** (default, if `~/atlas-podcast/output/<slug>` exists): byte-identical to what
   the timings were measured against. The script picks the newest `…_cbr*.mp3` per section and
   **fails loudly** rather than silently copying a stale one.
2. **`--fetch`**: downloads the published audio pinned in `chapter-timing.ts` and re-encodes it to
   96 kbps mono CBR with `-write_xing 0` - same recording, seek-precise, at the bitrate the
   renderer publishes at, so these files can also be uploaded as-is.

The script deliberately **does not touch the committed `.words.json`** - a pipeline output
directory can hold timings from a different transcription run, and timings must be refreshed only
on purpose (§Mutations). If you ever find a change to a `.words.json` in your `git status` after
staging, that is a bug: restore it (`git checkout -- public/audio/…`) before continuing.

**Verification:** `ls -la public/audio/ch<N>/` shows one MP3 per staged section; playback of a
staged file seeks to an exact word, not near it. MP3s are gitignored - don't commit them.

### B. Re-render a section or chapter after a text edit (E1)

**Before rendering, capture evidence.** For each section you are about to change, record:

```bash
rg "atlas-ch<N>-s<M>" src/data/chapter-timing.ts   # the pinned published URL + hash
sha256sum public/audio/ch<N>/ch<N>-s<M>.words.json 2>/dev/null || true
```

These are your before-state: if anything goes wrong, this is what "what did and did not happen"
looks like.

Then run the maintainer build with audio enabled (credentials + `SKIP_AUDIO` unset):

```bash
ELEVENLABS_API_KEY=... R2_ENDPOINT=... R2_ACCESS_KEY_ID=... \
R2_SECRET_ACCESS_KEY=... R2_BUCKET=... pnpm build
```

What happens, per `src/textbook-loader/renderers/audio/renderer.ts`: only paragraphs whose text
hash is not in the chunk cache get synthesized (the cheap path - a one-paragraph edit costs a few
hundred credits, `audit:0009` F6); sections are concatenated, loudness-normalized, uploaded to R2
`final-audio/`, and each edited section gets a **new** content-hashed URL.

**Branches at the risky step - this is where it goes wrong:**

- **Branch B1: the build shows far fewer TTS calls than you expected after a voice/model change.**
  Unchanged paragraphs were cache hits - you are baking a mixed-voice corpus. **Stop.** Do not
  deploy. Purge the chunk cache (§C) and re-run. There is no way to un-bake it except purging and
  re-synthesizing, which is the ~$99-per-corpus event `audit:0009` R7 exists to do only once.
  Signal to watch: cache-hit counts in the render logs, or `.cache/audio-chunks/` mtimes older than
  this run.
- **Branch B2: the build logs `N paragraphs failed, returning incomplete result`, or a section
  link is cleared.** Failed paragraphs are silently skipped after 3 attempts
  (`elevenlabs-tts.ts`); a fully failed section aborts and the renderer clears its audio link.
  **Stop.** Do not deploy a section with a hole in its narration. Re-run after fixing the API
  error; the text-only cache makes the retry free for everything that succeeded.
- **Branch B3: the render succeeded and the section's hash changed (normal for E1).** The
  committed `.words.json` for that section now describes the *old* recording and nothing in this
  repo will tell you. Before this new audio reaches readers, you must regenerate that section's
  timings in `atlas-podcast` (fresh `.words.json` measured against the new recording, then update
  the pinned `publishedUrl` in `chapter-timing.ts`), or hold the deploy. **If the timings
  regeneration cannot happen in this session, the safe disposition is to hold the deploy** -
  shipping new audio with old timings is a silently wrong read-along, which is worse than old
  audio.

If R2 is unreachable or misconfigured, the build still exits 0: every R2 failure path is
warn-and-continue (`r2-cache.ts`; `audit:0010` F2), and the page will link CDN URLs that 404.
After any render that should have uploaded, verify R2 actually received the files (§Evidence).

### C. Purge the chunk cache (E2 - before a voice change, never after)

Decide the voice **first** (the owner's call - `ELEVENLABS_VOICE_ID`, default "George",
`ELEVENLABS_MODEL_ID`, default `eleven_turbo_v2_5` are bare `process.env` reads with hardcoded
defaults; neither appears in the `astro.config.mjs` env schema, so a typo'd variable name
**silently** narrates with the defaults). Then, in one session:

1. Delete local chunks: `rm -rf .cache/audio-chunks/`
2. Delete the R2 `audio-chunks/` prefix (all ~3,000 objects). Use the S3 client/R2 console with
   the same credentials as the build; `docs/handoffs/0001` records the backup that covers this
   prefix as of 2026-08-17.
3. Render with the new voice (§B) - the verification run then seeds the cache with the intended
   voice instead of perpetuating the mix.

**Why purge-and-render must be one session:** a purge followed by *no* render is the worst
disposition - you have deleted objects that cost real money to re-synthesize and gained nothing.
If you must abort between the two, stop and record it: the cache is empty, the next render will
pay for full re-synthesis of whatever it touches, and the owner should know that before anyone
else runs a build.

**Never** purge `final-audio/` or `audio/` - those are published outputs, not cache.

### D. Publish CBR audio in place (E3)

Prerequisite: §A staged the sections locally (`public/audio/ch<N>/`).

```bash
# Dry run first - the printed job list is your contract:
R2_ENDPOINT=... R2_ACCESS_KEY_ID=... R2_SECRET_ACCESS_KEY=... R2_BUCKET=... \
  pnpm tsx scripts/swap-cbr-audio.ts            # list only
  pnpm tsx scripts/swap-cbr-audio.ts 4          # chapter 4 only
# Then, with owner approval:
  pnpm tsx scripts/swap-cbr-audio.ts --yes 4    # actually overwrite
```

**Save the output of the dry run.** It is the only record of exactly which keys were (and were
not) touched - the script skips sections with no staged local file **silently**
(`existsSync … continue`), so a missing stage shows up only as an absent line.

Why this works at all: the published filename is hashed on the section **text**, not the audio
bytes, so overwriting bytes at the same key changes no URL, no code, no table
(`swap-cbr-audio.ts` header). A plain `pnpm build` will never do this swap - `pushPublicFiles`
deliberately skips keys that already exist on R2 - which is why the script is deliberate and
manual.

**Branches at the risky step:**

- **Branch D1: an upload fails partway through `--yes`.** Jobs are independent one-key
  `PutObjectCommand` calls; the log prints `done: <key>` per success. **Safe disposition:**
  re-run the same command with the same chapter filter - completed keys are idempotent
  overwrites, the rest complete. If failures persist, stop and record which keys from the dry-run
  list remain un-swapped; do not leave the corpus half-swapped without a note, since readers of
  different sections then get different seek behaviour.
- **Branch D2: reads look stale after a successful swap.** Published objects carry long-lived
  immutable `Cache-Control`, so an edge cache may keep serving old bytes at that URL. Purge
  `/audio/*` at the CDN (Cloudflare or wherever the bucket is fronted) per its config, then
  re-verify (§Evidence). This is expected, not a failure of the swap.
- **Branch D3: you suspect the staged file is not the recorded audio** (e.g. it came from a
  pipeline output directory whose provenance is unclear). Re-stage with `--fetch` (§A route 2),
  which derives from the exact published bytes, and re-run. Never upload a file you cannot say
  where it came from - the timings were measured against one specific recording.

### E. After any published change - update the record

If published URLs changed (§B) or the voice changed (§C), the paper trail must move with the
audio: update the pinned `publishedUrl`/`cbr` entries in `src/data/chapter-timing.ts` **as part of
the same change as the regenerated timings** (never the audio alone), and note the voice/model
used in the run somewhere durable (task or handoff record) - the repo records "which voice
produced the published audio" nowhere else.

## Outcome evidence

Independent checks, not build success:

- **Render (§B):** the new `final-audio/atlas-chN-sM-<hash>.mp3` objects exist on R2 (count before
  and after); the section page plays the new URL; build log shows no `paragraphs failed` line; and
  - for E1 - the timings regeneration for every touched section is either done or the deploy is
  being held. Old-hash objects remaining on R2 is expected and fine.
- **Cache purge (§C):** the R2 `audio-chunks/` prefix lists as empty (or quarantined, if you
  chose to move rather than delete); `.cache/audio-chunks/` is absent locally; the post-purge
  render log shows full-cache-miss synthesis counts consistent with the sections rendered.
- **CBR swap (§D):** for each swapped section,
  `curl -sI <published-url>` returns 200 with a `Content-Length` matching the local staged file's
  byte size, and click-to-seek in the player lands on the word. After a CDN purge, the same curl
  must show the new byte size *through* the edge, not just origin.
- **Staging (§A):** `git status` shows no change under `public/audio/*.words.json` or
  `src/data/chapter-timing.ts`.

## Not known - read before you improvise

- **The audible cut-offs are not explained.** `audit:0009` F4 lists four candidate mechanisms
  (prosodic hard restarts at paragraph joins, mixed-rate `-c copy` concat of legacy `.pcm` chunks,
  silently skipped failed paragraphs, loudnorm/encoder boundary artefacts) and adjudicates **none**
  of them. A re-render is not known to fix them; a voice change is not known to cause or cure
  them. Do not spend a full re-voice on this hypothesis.
- **No verified end-to-end regeneration path exists yet.** `docs/tasks/0005` AC-2 (one chapter,
  end-to-end, verified) is open. The code path exists; it has not been proven against the live
  corpus. First run = verification run, and only after the voice decision.
- **Full-corpus regeneration cost is approximate.** Order 450–550k ElevenLabs credits ≈ one Pro
  tier month (~$99), from a measured 163,569 timed words / 1,212 minutes of narration and a
  page-level 0.5–1 credit/char rate for Turbo-class models (`audit:0009` F6). Treat as a factor-
  of-2 estimate, and get an authenticated quote before committing to it.
- **The timings-refresh mechanics live outside this repo.** Everything about regenerating
  `.words.json` (cost, per-section feasibility, `CHAPTER_META`) is inferred from this repo's
  comments about `atlas-podcast`'s `pipeline.py`; that repo has not been examined here.
- **Live R2 contents are unverified.** Whether the live bucket still holds pre-switch `.pcm`
  chunks - and how many - is unconfirmed; the backup inventory (2,995 `audio-chunks/` objects,
  2026-08-17) is the only count on record.
- **`scripts/*` are retiring.** `docs/tasks/0010` decides they become `atlas audio stage` /
  `atlas audio publish-cbr`. When that lands, update this runbook's commands; until then the
  scripts above are the only invocation.
