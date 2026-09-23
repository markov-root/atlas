---
schema_version: 2
id: "0016"
uid: "task-20260921T203525638698Z-7d3af3a8"
title: "Audio cache key provenance voice unification and a per section timings path"
role: task
status: todo
summary: "Make voice changes take effect: provenance-carrying chunk keys, one purge decision, env schema, timings guard, per-section timings path."
created: "2026-09-21"
updated: "2026-09-21"
owner: Markov Grey
supersedes: ""
superseded_by: ""
engineering_document:
  version: 1
  contract_tier: full
  role: task
  id: "0016"
  uid: task-20260921T203525638698Z-7d3af3a8
  title: "Audio cache key provenance voice unification and a per section timings path"
  state: todo
  authority:
    kind: work-state
    owner: Markov Grey
    scope: BOUNDED ACCEPTANCE AND COMPLETION AUTHORITY
  created: "2026-09-21"
  updated: "2026-09-21"
  transition_history: unverified
  transitions: []
  relationships: []
  details:
    criteria: [criterion:AC-1, criterion:AC-2, criterion:AC-3, criterion:AC-4, criterion:AC-5, criterion:AC-6, criterion:AC-7]
    size: m
    priority: p1
---

# Task 0016: Audio cache key provenance voice unification and a per section timings path

## Problem

**The reframe first: the expensive part the owner fears is already cheap, and the cheap-seeming part is what is actually broken.** The owner's standing picture of this work is "regenerating audio on writing updates" as a costly batch job competing with voice unification for the same spend. `audit:0009` shows the opposite split:

- **Paragraph-level incremental regeneration already works.** Paragraph chunks are keyed `sha256(paragraph text)` (`hashText`, `src/textbook-loader/renderers/audio/elevenlabs-tts.ts:26-28`), so a one-typo edit bills exactly one paragraph of TTS - order 250–350 credits, well under $0.10 - while every unchanged paragraph resolves from cache (`audit:0009` F1, F6). The cost fear is wrong about the *edit* case.
- **What actually makes an edit expensive is that word timings are welded to the audio bytes** (`audit:0009` F2). The committed `public/audio/ch*/*.words.json` files were measured against one specific recording - the one pinned in `src/data/chapter-timing.ts`. The moment a section's bytes change, `src/lib/section-audio.ts` serves the *new* audio with the *old* word times and nothing in this repo errors or warns (`audit:0010` F3; the drift detector lives in the external `atlas-podcast` pipeline). So "regenerate after an edit" is gated not by TTS cost but by a transcription re-run - which is why the owner still rationally treats an audio edit as expensive.
- **The "random mix" is mechanistic, not random** (`audit:0009` F3). The chunk cache key has no voice/model/provider dimension, so setting a better voice **silently no-ops** on every cached paragraph - and ~2,995 `audio-chunks/` objects on R2 (`docs/handoffs/0001:62`) include pre-switch Gemini/Kore audio at 24 kHz mono, converted on the fly and concatenated into 44.1 kHz sections with `-c copy` (`elevenlabs-tts.ts:60-66`, `:150-160`). The mix is the cache remembering two eras of the pipeline.
- **The cut-offs are not adjudicated** (`audit:0009` F4, Limitation 1). Four candidate mechanisms exist with distinguishing tests; none is confirmed. This task does not promise to fix them (`docs/runbooks/regenerate-chapter-audio.md` §Not known: "Do not spend a full re-voice on this hypothesis").

Who it affects: the maintainer, every time a chapter is edited or a voice improvement is attempted, on a live public site whose entire audio corpus is frozen (CI deploys with `SKIP_AUDIO=1`, `.github/workflows/deploy.yml:55`; no verified regeneration path exists - `audit:0009` F7, `task:0005`).

**Counter-case - reasons recorded against acting:** the corpus is frozen, backed up (3,229 objects / 5.8 GB, 2026-08-17), and currently plays fine; doing nothing costs nothing today. Against that: any *attempt* at the owner's stated goals (better speaker, one consistent voice, cheap post-edit regeneration) silently fails or backfires under the current text-only cache key - a naive verification render bakes more wrong-voice chunks into the cache (`audit:0009` F7), making the eventual fix larger. Acting is therefore not optional for the owner's goals; it is only a question of order, which this task fixes. This is not new scope: the work is already sequenced in `docs/ROADMAP.md` "Now - Audio pipeline upgrade", steps 1–3 plus the gated re-voice.

A minor same-class defect rides along: the chapter cache key hashes filesystem paths rather than content keys (`src/textbook-loader/renderers/audio/renderer.ts:196-199`; `audit:0009` F8), so a change to `outputDir` or cwd silently invalidates every chapter key at once. Cheap to fix while touching key construction anyway.

## Decisions required before execution

### D1 - Which voice (decide first; everything else waits on it)

- **Question:** which ElevenLabs voice (and model) becomes the single narrator of the corpus?
- **Options:** (a) Audition 3–5 stock ElevenLabs voices on one representative paragraph - a few hundred credits total, one afternoon; (b) run the full TTS provider evaluation (ROADMAP step 5: OpenAI, Google, PlayHT, …) before deciding - weeks of delay to everything downstream; (c) keep "George" and only fix the machinery - leaves the owner's stated complaint ("better speakers") unresolved while spending the same one-time migration.
- **Recommendation:** (a). Auditioning is cheap and reversible; a full re-voice is not. The provider evaluation is a separate ROADMAP item that need not block the machinery - but if it ever overturns the provider choice, that is a second re-voice, so record the decision boundary here.
- **Irreversible if wrong:** a re-voice (or even the one-chapter verification render, R6) performed before the voice is decided seeds the provenance-keyed cache with the wrong voice and spends part of the ~$99 corpus budget; undoing it means a second purge-and-re-voice. Cheap-first ordering makes the wrong choice nearly free to reverse *before* any render.

### D2 - Purge the ~3,000 R2 `audio-chunks/` objects, or leave them orphaned?

- **Question:** once keys carry provenance, what happens to the legacy chunk objects that can no longer match any key?
- **Options:** (a) delete the R2 `audio-chunks/` prefix outright - irreversible without re-synthesis; the 2026-08-17 backup predates every chunk created since (`docs/handoffs/0001`, runbook §C); (b) quarantine (move to e.g. `audio-chunks-legacy/`) - reversible, keeps a recovery path, slight clutter; (c) leave them orphaned in place - they can never be cache hits under the new key, so they cost only storage.
- **Recommendation:** (c) by default, (b) if the owner wants tidiness. The key change alone eliminates the mixed-voice and mixed-rate-concat hazards (F3, F4 candidate 2) because legacy chunks stop matching; deletion buys no correctness and destroys the only copies of objects that cost real money to synthesize. This **supersedes the runbook's "purge before render" step (§C) for the post-R1 world** - that instruction exists for the pre-key-change failure mode and the runbook must be updated to say so (Scope step 3).
- **Irreversible if wrong:** only option (a) is irreversible - deletion of irreplaceable synthesised audio for no correctness gain.

### D3 - Whether to chase the cut-offs at all before the re-voice

- **Question:** do we spend anything on diagnosing/fixing the audible cut-offs (`audit:0009` F4) before or during the re-voice?
- **Options:** (a) adjudicate F4's four candidates first (R2 chunk inventory + controlled listening test) before any render; (b) proceed with the machinery - R1's provenance key mechanically eliminates candidate 2 (mixed-rate `-c copy` concat of legacy `.pcm` chunks) and the R6 verification chapter provides a controlled, freshly-conditioned sample - then re-assess whether cut-offs persist; (c) promise a cut-off fix inside this task.
- **Recommendation:** (b). (c) is ruled out by the runbook §Not known and `audit:0009` Limitation 1. (a) is unnecessary front-loading: R1–R2 eliminate one candidate mechanically for free, and the one-chapter render is itself the controlled experiment.
- **Irreversible if wrong:** spending the full re-voice (~$99) on the unadjudicated cut-off hypothesis is the exact failure the runbook warns against; a wrong (a) only costs some sequencing time.

### D4 - Does the per-section timings path live in this repo or in `atlas-podcast`?

- **Question:** where does the timings-refresh capability that unblocks cheap edits get built - documented as an external procedure, or implemented in-repo?
- **Options:** (a) keep transcription in the external `atlas-podcast` pipeline and document a per-section path through it (R4b as specified); (b) bring timings generation in-repo (transcription dependencies, storage, maintenance - a materially larger task); (c) build only the in-repo guard (R4a) now and defer (b) until the external pipeline proves unusable.
- **Recommendation:** (c) with (a)'s documentation: the guard (hash-mismatch fails the build loudly) is safe, standalone, and in-repo; the per-section refresh is documented as an `atlas-podcast` procedure because its real mechanics and cost have never been examined (`audit:0009` Limitation 4). Promote to (b) only on the ROADMAP break trigger - `atlas-podcast` becoming unmaintained, or per-section refresh proving infeasible there.
- **Irreversible if wrong:** little is irreversible, but building in-repo transcription before demand/provenance is established is YAGNI debt (PRINCIPLES §10); choosing (a) without examining `atlas-podcast` risks documenting a procedure that does not work as inferred.

### D5 - Big-bang vs chapter-by-chapter re-voice

- **Question:** if the full re-voice (R7) is approved, is it one batched migration or spread across weeks?
- **Options:** (a) big-bang in one batched session - one ~$99 spend, one bulk timings refresh, one reviewable event; concentrated risk on a frozen, irreplaceable corpus; (b) chapter-by-chapter over weeks - smaller spends, but readers hear a mixed old/new-voice corpus for the whole window, and timings refreshes interleave with content edits; (c) defer the re-voice indefinitely and re-voice lazily as chapters are edited - the mixed-voice corpus persists indefinitely, and the edit path (cheap as its TTS is) still requires the timings refresh per touched section.
- **Recommendation:** (a), per `audit:0009` R7: **do not** spread it over weeks. Note the original rationale ("maximises the mixed-cache window") is partially superseded by R1 - the *cache* can no longer mix eras - but the *published corpus* still mixes voices across sections during a staggered migration, which is reader-visible and confusing. The R6 one-chapter verification plus the R2 backup are the rollback story for the big-bang.
- **Irreversible if wrong:** the spend itself (~$99, factor-of-2 estimate per F6 - get an authenticated quote first); a botched big-bang without the R6 verification done first has no verified recovery path (F7).

## Scope

Execution order follows `audit:0009` R1–R7; dependencies are stated per step. `src/` changes are authorised only under the agreed decisions gate.

1. **R1 - Make the chunk cache key carry its provenance (small, do first, standalone).** Change key construction (`hashText` / the R2 key build at `renderer.ts:153-155`) from `sha256(text)` to hash `voice|model|provider|text` - and, once step 4 lands, the conditioning inputs. Also fix the same-class F8 defect while there: hash section content keys, not filesystem paths, for the chapter key (`renderer.ts:196-199`). No purge is required for correctness - old entries simply stop matching (see D2). Depends on nothing.
2. **R5 - Declare `ELEVENLABS_VOICE_ID` and `ELEVENLABS_MODEL_ID` in the `astro.config.mjs` env schema (small, with step 1).** They are currently bare `process.env` reads with hardcoded defaults (`elevenlabs-tts.ts:10-11`), invisible to config review and to a typo (`audit:0006`). Derive the `stableKey` fallback names to include them.
3. **R2 - Voice decision (D1), then legacy-chunk disposition (D2).** Owner auditions candidates (cheap, before any render); record the chosen voice/model in this record and the runbook's durable "which voice produced the published audio" note. Disposition of the ~2,995 R2 `audio-chunks/` objects per D2 (leave orphaned or quarantine; deletion only on explicit owner instruction). Update `docs/runbooks/regenerate-chapter-audio.md` §C so it no longer mandates a pre-render purge in the post-R1 world. Depends on step 1 (otherwise the purge mandate is still load-bearing).
4. **R3 - Adopt `previous_text`/`next_text` conditioning in `callTtsApi` (medium, depends on step 1).** Pass trailing/leading neighbour text at synthesis time (verified API surface, `audit:0009` F5); include the conditioning inputs in the cache key per step 1. Carry the honest caveat: conditioning improves join prosody but does not make a spliced replacement paragraph cadence-match the take already in the file. Gate: confirm the exact per-model conditioning behaviour during the R6 verification render before relying on it.
5. **R4a - Build-time timings guard (medium, independent).** Fail the build loudly when a timed section's current text hash differs from the hash pinned in `src/data/chapter-timing.ts` - the in-repo half of what `pipeline.py --check-remote` does externally (`audit:0009` F2, `audit:0010` F3). Timed sections whose pinned URL goes stale must not silently ship new audio with old word times.
6. **R4b - Document the per-section timings path (medium, depends on D4).** Document, in `docs/runbooks/regenerate-chapter-audio.md`, the procedure to regenerate one section's `.words.json` through `atlas-podcast` - or, if D4 lands elsewhere, record that decision and the reason. Until this exists, every cheap paragraph fix still effectively costs a full timings re-run (F2). **Address convention (coordinated with `task:0014` D5, one convention across both tasks):** the path must address timings by `[version][language][chapter][section]` - the key `task:0014` D5 assigns to this mechanism - not by bare `[chapter][section]` (`chapter-timing.ts:22`), and any change to it is a coordinated migration of the external `atlas-podcast` contract in the same change. Today (English-only) that key degenerates to `[chapter][section]`; record it in its full form so the shape does not change under the pipeline later.
7. **R6 - One-chapter verification with the chosen voice (small, depends on steps 1–6).** Execute `task:0005` AC-2 end-to-end for one chapter - own key, real TTS, `-c copy` section concat (folding `task:0005` AC-3), R2 layout, playback check - with the chosen voice so the verification run seeds the cache with the intended voice (F7). Spends real credits (~one chapter ≈ 8–12% of the corpus); that spend is the point. Timings disposition for the rendered chapter per runbook branch B3 (regenerate or hold the deploy). Treat the result as the D3 experiment: does the cut-off behaviour persist in a fully provenance-clean, conditioned render?
8. **R7 - Full re-voice migration (large, decide last, gated on D5 and R6 success).** One batched regeneration of the whole corpus in the chosen voice with conditioned joins, followed by a bulk timings refresh through the step-6 path and a `swap-cbr-audio.ts`-style in-place byte swap where read-along exists. Requires owner sign-off as a maintainer operation (runbook §Authority). Given its size and its dependence on every prior step, this step may warrant its own task record at execution time; this task is not done until R6 is verified and this step is either executed or explicitly deferred with the owner's decision recorded.

## Out of scope

- **Fixing the cut-offs.** Not adjudicated (`audit:0009` F4); this task's machinery removes one candidate and produces the controlled sample that would adjudicate others. No promise is made beyond that.
- **Read-along merge and player work** (ROADMAP step 4; fork with VBR→CBR + AssemblyAI timestamps + synced highlighting), and the land-or-reject of `task:0008`/`task:0009` - separate stream.
- **TTS provider evaluation** beyond auditioning ElevenLabs stock voices (ROADMAP step 5) - a separate decision with its own comparison; if it overturns the provider, that is a second re-voice by design.
- **Sentence-level cache granularity or a custom stitching layer** - rejected in `audit:0009` R7's not-do list: paragraph is the right unit; conditioning + `-c copy` concat cover the join problem.
- **`scripts/` → `bin/atlas` CLI migration** - decided in `task:0010`; this task uses the runbook's current invocations as they are.
- **Multi-language / edition audio** - no second-language audio exists; per-language voice selection is a ROADMAP translation-axis decision (`audit:0007` F3).
- **`final-audio/` or `audio/` deletion** - published outputs, never purged (runbook §C).

## Done when

- **AC-1:** The chunk cache key is derived from voice, model, provider, and text (plus conditioning inputs once step 4 lands) - demonstrated by two paragraphs of identical text hashing to different keys under two different voice IDs; the chapter key is derived from section content keys, not filesystem paths (F8 fixed).
- **AC-2:** The disposition of the ~2,995 R2 `audio-chunks/` legacy objects is executed as decided in D2 (left orphaned, quarantined, or deleted on explicit instruction), the runbook §C no longer mandates a pre-render purge in the post-R1 world, and the chosen voice/model is recorded in the runbook's durable note.
- **AC-3:** `ELEVENLABS_VOICE_ID` and `ELEVENLABS_MODEL_ID` are declared in the `astro.config.mjs` env schema, and the `stableKey` fallback is derived from them.
- **AC-4:** A build with a timed section whose current text hash differs from the hash pinned in `src/data/chapter-timing.ts` fails loudly with an error naming the section - observed, not inferred.
- **AC-5:** A per-section timings-refresh path is documented in `docs/runbooks/regenerate-chapter-audio.md` (with its `atlas-podcast` provenance stated), or D4's alternative location is recorded there with the reason.
- **AC-6:** `previous_text`/`next_text` conditioning is implemented with conditioning inputs in the cache key, or is explicitly declined in this record with the reason (e.g. observed no-effect or model incompatibility in the R6 render).
- **AC-7:** One chapter's audio is regenerated end-to-end with the chosen voice (`task:0005` AC-2, with AC-3's `-c copy` concat folded in), verified playable, with render-log evidence of full-miss synthesis counts, no "paragraphs failed" line, the R2 `final-audio/` keys confirmed present, and the chapter's timings disposition executed per runbook branch B3.

## Completion evidence

| AC | Evidence |
| --- | --- |
| AC-1 | - |
| AC-2 | - |
| AC-3 | - |
| AC-4 | - |
| AC-5 | - |
| AC-6 | - |
| AC-7 | - |

## Authority and inputs

- `docs/audits/0009-audio-pipeline-economics-incremental-regeneration-and-voice-unification.md` - findings F1–F8, recommendations R1–R7, cost model (F6), limitations (1: cut-offs unadjudicated; 4: `atlas-podcast` unexamined; 5: live R2 unverified).
- `docs/runbooks/regenerate-chapter-audio.md` - the two couplings, purge procedure §C, branch B3 timings disposition, §Not known, maintainer authority.
- `docs/tasks/0005` - frozen-audio de-risk; AC-2 (verified regeneration) and AC-3 (`-c copy` concat) are executed by this task's step 7.
- `docs/handoffs/0001` - R2 backup inventory (3,229 objects / 5.8 GB; `audio-chunks/` 2,995) and the 2026-08-17 backup boundary.
- `docs/ROADMAP.md` - "Now - Audio pipeline upgrade" (this task = steps 1–3 + gated re-voice), the break trigger against pre-decision re-renders, and "Later" placement.
- `docs/PRINCIPLES.md` - §10 YAGNI (D4 option b deferred), §14 explicit non-goals (nothing here re-opens one).
- `docs/audits/0006` - undeclared env vars (`ELEVENLABS_VOICE_ID`/`ELEVENLABS_MODEL_ID`) and the `atlas generate audio --chapter N` CLI surface.
- `docs/audits/0010` - F2/F3: R2 warn-and-continue failure posture; no build-time link between `chapter-timing.ts` and the audio files.
- `docs/audits/0001` - the freeze; `docs/tasks/0010` - `scripts/*` retirement decision (out of scope here).
- `docs/tasks/0014` D5 + D6 - timing-table key for multi-language audio: this task's per-section timings path is the mechanism that carries its `[version][language][chapter][section]` address; one convention across both tasks (see Scope step 6).
- Code: `src/textbook-loader/renderers/audio/elevenlabs-tts.ts` (`hashText` :26-28, legacy `.pcm` fallback :60-66, concat :117-160, `callTtsApi` :170-184, CBR re-encode :212-266), `src/textbook-loader/renderers/audio/renderer.ts` (section/chapter keys :63-71, :117, :151-156, :196-199, `stableKey` :130-140), `src/data/chapter-timing.ts` (pinned URLs/header), `src/lib/section-audio.ts:74-88`, `astro.config.mjs:32-33`, `.github/workflows/deploy.yml:55`.
