---
schema_version: 2
id: "0009"
uid: "audit-20260921T150312614621Z-7709e535"
title: "Audio pipeline economics incremental regeneration and voice unification"
role: audit
status: draft
summary: "Audit of audio pipeline cache granularity, regeneration economics, and voice consistency."
created: "2026-09-21"
updated: "2026-09-21"
owner: Markov Grey
supersedes: ""
superseded_by: ""
engineering_document:
  version: 1
  contract_tier: full
  role: audit
  id: "0009"
  uid: audit-20260921T150312614621Z-7709e535
  title: "Audio pipeline economics incremental regeneration and voice unification"
  state: draft
  authority:
    kind: point-in-time-evidence
    owner: Markov Grey
    scope: src/renderers/audio/* and adjacent audio wiring on branch codebase-cleanup, as of this audit run
  created: "2026-09-21"
  updated: "2026-09-21"
  transition_history: unverified
  transitions: []
  relationships: []
  details:
    as_of: "2026-09-21"
    subjects: ["audio pipeline: loader, audio renderer, text renderer, ElevenLabs/Gemini TTS, R2 cache, chapter timings, section-audio selection (branch codebase-cleanup, 2026-09-21)"]
    method: Read-only source trace of the audio causal chain; no builds run; cost figures reconstructed from code and public pricing where stated
    limitations: []
---

# Audit 0009: Audio pipeline economics incremental regeneration and voice unification

## Scope

**Examined** (read-only, branch `codebase-cleanup`, working tree as of 2026-09-21, HEAD `57996be`):

- The audio renderer chain end to end: `src/textbook-loader/loader.ts` (audio renderer
  construction), `src/textbook-loader/renderers/audio/renderer.ts` (orchestration, hashing,
  phases), `text-renderer.ts` (AST → speakable paragraphs), `elevenlabs-tts.ts`, `gemini-tts.ts`,
  `equation-describer.ts`, `r2-cache.ts`.
- The browser-facing audio selection: `src/lib/section-audio.ts`, `src/data/chapter-timing.ts`,
  `public/audio/ch*/**` (71 committed `.words.json` files; no MP3s are committed).
- The audio tooling: `scripts/copy-chapter-audio.sh`, `scripts/swap-cbr-audio.ts` (header
  commentary read as project knowledge).
- Governance: `docs/tasks/0005`, `docs/tasks/0008`, `docs/handoffs/0001`,
  `.github/workflows/deploy.yml` (SKIP_AUDIO wiring), `astro.config.mjs` env schema.
- External ground truth fetched live on 2026-09-21: ElevenLabs `text-to-speech/convert` API docs
  (stitching parameters) and `elevenlabs.io/pricing` + models docs (credit costs).

**Not examined**:

- The external `atlas-podcast` repository (transcription/timings pipeline referenced by
  `chapter-timing.ts` and `copy-chapter-audio.sh`). Its interface is inferred from this repo's
  comments only.
- The R2 bucket's live contents (figures come from `docs/handoffs/0001`'s backup inventory).
- Runtime behaviour: no build, no TTS call, no `pnpm verify`-family command was run (VM constraint).
- Astro client-side player internals beyond `section-audio.ts` (`word-highlight.ts`,
  `audio-player.ts` skimmed only where another file's comments referenced them).
- Translation/multi-edition audio strategy (no second edition/language audio exists yet).

## Method

1. Read the audio causal chain files listed in Scope, in dispatch order, tracing one journey: a
   section's text from loader → speakable paragraphs → hash → cache lookup → synthesis → concat →
   normalization → R2 → CDN URL → `section-audio.ts` source choice → word-timing read-along.
2. For every hop, recorded what is assumed, mutated, cached, and hardcoded, with `file:line`.
3. Verified external claims live rather than from memory:
   `curl https://elevenlabs.io/docs/api-reference/text-to-speech/convert` (stitching parameters,
   fetched 2026-09-21) and `curl https://elevenlabs.io/pricing` (credit costs, same date).
4. Counted corpus audio facts from committed files:
   `jq -r '.|length' public/audio/ch*/*.words.json | jq -s 'add'` → 163,569 timed words across
   71 sections; `jq -r '.[-1].e' ... | jq -s 'add/60'` → 1,212 minutes of narration.
5. Confirmed CI regeneration posture via `rg SKIP_AUDIO .github/workflows/`.

No code was modified; the only written file is this record. No git state changed.

## Findings

### F1 — The cache key is section-grained for output, but paragraph-grained for cost; the crux is that paragraph chunks are keyed on text alone

_Observation._ The renderer computes one sha256 per **section** over the newline-joined speakable
paragraphs, including the spoken preamble: `renderer.ts:63-66` builds `paragraphs` as
`["Chapter N: <title>" (section 0 only), "Section N.M: <title>", ...renderNodes(section.nodes)]`
and hashes `paragraphs.join('\n')` (`renderer.ts:68-71`). That hash is the filename
(`atlas-chN-sM-<hash>.mp3`, `renderer.ts:69`) and the R2 key (`final-audio/chN-sM-<hash>.mp3`,
`renderer.ts:117`). Below that, `text-renderer.ts:120-124` documents that each block-level AST node
becomes one string, and `text-renderer.ts:117`'s doc comment calls this "the caching unit for TTS".
Chunk keys are `sha256(paragraph text)` (`elevenlabs-tts.ts:26-28`, `hashText`), stored as
`.cache/audio-chunks/<hash>.mp3` locally and `audio-chunks/<hash>.mp3` / `.pcm` on R2
(`renderer.ts:151-156`). Phase 5 pulls chunk keys from R2 only for sections needing synthesis
(`renderer.ts:150-159`) and `synthesizeParagraphs` reuses every cached chunk, synthesizing only the
`needed` remainder (`elevenlabs-tts.ts:55-84`).

_Inference._ **The owner's incremental-regeneration question is already 80% answered by the code.**
Fix one typo in one sentence of one paragraph: the section hash changes, so the section MP3 gets a
new URL and a new R2 key — but the *only* ElevenLabs call that is billed is the one edited
paragraph. Unchanged paragraphs resolve from the text-keyed chunk cache. The join mechanics are
already a buffer concat (`elevenlabs-tts.ts:117-160`, ffmpeg concat demuxer with `-c copy`), and
`task:0005` AC-3 already plans to switch the section→chapter concat to `-c copy` as well. So the
smallest regenerable unit is one paragraph, and a one-typo edit costs one paragraph of TTS plus
re-concat/re-encode of the section, re-concat of the chapter, and new uploads. What the text-only
chunk key *cannot* do is covered in F3 (it is also why a voice switch silently no-ops).

### F2 — Word timings are welded to the audio bytes; this, not cost, is what makes an edit expensive today

_Observation._ `chapter-timing.ts` pins, per section, a local CBR path, a committed
`chN-sM.words.json`, and the published CDN URL measured against those bytes
(`chapter-timing.ts:1-19` header: "A TTS re-render invalidates the whole file at once…").
`section-audio.ts:74-88` prefers the staged CBR file (`cbr`), else the published CDN URL (`cdn`),
and attaches `words.json` to either. The word timings themselves are produced by the external
`atlas-podcast` pipeline (`pipeline.py --check-remote` detects moved audio; `copy-chapter-audio.sh:8-19`
documents that timings track one specific recording and must be regenerated on purpose). 71 of the
71 timed sections' timings are committed; a section whose hash changes gets a **new** published URL
and the pinned one stays stale.

_Inference._ A cheap one-paragraph re-synthesis already exists, but the moment a section's bytes
change, the read-along for that section is silently wrong: the committed timings describe the old
recording, and `section-audio.ts` will happily serve the *new* CDN audio with the *old* word times
(there is no check that a section's `publishedUrl` matches the current text hash — the drift check
lives in the external podcast pipeline, and `task:0008` gap #1 notes nothing ties the table to the
files). So "regenerate after an edit" is not gated by TTS cost but by the transcription step that
produces fresh `.words.json`. Any recommendation that makes editing cheaper must include a
per-section timings-refresh path, or the owner will still rationally treat an audio edit as
"regenerate the chapter's timing pipeline".

### F3 — The "random mix" is mechanistic: the chunk cache is keyed on text only, so voice/model changes are invisible to it, and Gemini-era (Kore) chunks still count as cache hits

_Observation._ The chunk cache key is `sha256(text)` with **no** voice, model, provider, or format
dimension (`elevenlabs-tts.ts:26-28`; R2 keys `audio-chunks/<h>.mp3|.pcm`, `renderer.ts:153-155`).
`synthesizeParagraphs` explicitly falls back to a legacy `.pcm` chunk — raw 16-bit 24 kHz mono PCM
written by the Gemini path (`gemini-tts.ts:60`, 24 kHz `pcmToMp3`) — converts it to MP3 once, and
serves it (`elevenlabs-tts.ts:60-66`). `gemini-tts.ts:159-163` states the class "is currently
imported nowhere: it predates the ElevenLabs switch", and `docs/handoffs/0001:62` records the R2
backup inventory: **`audio-chunks/` = 2,995 objects** on the live bucket. `gemini-tts.ts:47` shows
the old Gemini voice was `Kore`; `elevenlabs-tts.ts:10-11` shows the current defaults are voice
`JBFqnCBsd6RMkjVDRZzb` ("George") and model `eleven_turbo_v2_5`. Neither `ELEVENLABS_VOICE_ID` nor
`ELEVENLABS_MODEL_ID` appears in the `astro.config.mjs` env schema (`astro.config.mjs:32-33`
declares only the API keys) — both are bare `process.env` reads with hardcoded defaults.

_Inference._ The owner's complaint has two concrete mechanisms here. (1) **Voice switching silently
does nothing.** If the owner sets a better `ELEVENLABS_VOICE_ID` and re-runs, every unchanged
paragraph — the vast majority — is a cache hit on text alone and is *not* re-synthesized: the new
build publishes sections that are mostly old-voice George with a sprinkle of new voice. Unifying
the voice therefore requires an explicit cache invalidation (local `.cache/audio-chunks/` plus the
~3,000 `audio-chunks/` objects on R2), which no runbook or code flag currently performs. (2) **The
corpus can already be mixed at the chunk level**: any paragraph whose chunk predates the ElevenLabs
switch is served as Gemini/Kore audio, converted at 24 kHz mono, inside an otherwise 44.1 kHz
George section (see F4 for why mixed-rate `-c copy` concat is also an artifact source). The
"random mix" is thus not random at all: it is the cache's text-only key remembering two eras of the
pipeline. This also answers "which content goes through which backend": today, in-code, *all*
synthesis goes through ElevenLabs (`renderer.ts:37-39` constructs only `ElevenLabsTTS`); Gemini TTS
is dead code, and Gemini in the live path is only equation descriptions (`renderer.ts:31-32`), so
any Gemini voice in the published corpus arrived via the frozen chunk cache, not via a routing rule.

### F4 — Cut-off mechanisms: no smoking gun, but four evidenced candidates, two of which are testable from the repo

_Observation._ Each paragraph is an independent, unconditioned API call: `callTtsApi`
(`elevenlabs-tts.ts:170-184`) sends only `text`, `modelId`, and `outputFormat: 'mp3_44100_128'` —
no `previous_text`, no `next_text`, no seed. Failed paragraphs are not retried past 3 attempts and
propagate as a skipped buffer in the assembly step (`elevenlabs-tts.ts:117-122` skips null/empty
buffers silently); a *section*-level failure aborts the whole section (`elevenlabs-tts.ts:104-107`
returns an empty buffer, and `renderer.ts:166-170` then clears the link). Two chunk formats can end
up in the same concat: fresh ElevenLabs chunks are 44.1 kHz stereo (`outputFormat`
`mp3_44100_128`), while legacy `.pcm` chunks are converted at 24 kHz mono VBR `-q:a 4`
(`elevenlabs-tts.ts:150-155`) — and `concatenateBuffers` joins them with the concat demuxer and
`-c copy` (`elevenlabs-tts.ts:157-160`), which does not resample or re-encode. The published file is
then re-encoded CBR 96k with `-write_xing 0` (`elevenlabs-tts.ts:212-266`), a pass whose own comment
says it exists for seek precision, and whose VBR/CBR history `task:0008` documents.

_Inference._ Four candidates for the audible cut-offs, with what would distinguish them:

1. **Prosodic hard restarts** — each unconditioned call begins and ends its own prosodic arc, so
   paragraph joins sound clipped even though no audio is missing. Distinguishing test: cut-offs sit
   exactly at paragraph boundaries and affect every join, including freshly generated ones.
2. **Mixed-rate `-c copy` concat** — a 24 kHz mono legacy chunk joined to 44.1 kHz chunks without
   re-encode is undefined-ish playback behaviour (timestamp discontinuities, glitches). This one is
   mechanistically coupled to F3: it can only bite sections that contain pre-switch chunks.
   Distinguishing test: whether artifacts cluster in sections whose paragraphs include `.pcm`-era
   cache hits (auditable from the R2 `audio-chunks/` objects' ages/formats).
3. **Silently skipped failed paragraphs** — a paragraph that exhausted retries leaves a content
   gap mid-narration. Distinguishable in build logs (`"N paragraphs failed, returning incomplete
   result"`) and by a words.json whose text doesn't match the narration.
4. **Encoder/boundary artefacts of the loudnorm re-encode** — TP=-1 limiting and CBR re-encode
   could truncate decaying tails at section edges. Least likely to explain pervasive cut-offs, and
   already partly litigated by `task:0008`; noting for completeness.

I cannot adjudicate 1 vs 2 vs 3 without either the R2 chunk inventory or a listening test; this is
a stated limitation, not a resolved finding. What *is* established: the code takes no step to make
a paragraph *join* sound continuous — continuity is left to chance.

### F5 — The ElevenLabs stitching features exist and are unused; adopting them is a small change that directly serves the join-continuity problem

_Observation._ The live API reference (fetched 2026-09-21) documents, on
`text-to-speech/convert`: `previous_text` — "can be used to improve the speech's continuity when
concatenating together multiple generations"; `next_text` — same for the text after; and
`previous_request_ids` — request IDs of earlier generations for continuity across split tasks, with
the note that results are best when the same model is used across generations. The codebase passes
none of these (`elevenlabs-tts.ts:170-184`). The chunk cache (`F1`) is keyed on text alone, so a
conditioned re-synthesis of one paragraph is a *cache miss with no side effects on neighbours* —
the join text is known at synthesis time (`synthesizeParagraphs` holds the full paragraph array,
`elevenlabs-tts.ts:55-84`).

_Inference._ Because the cache unit is the paragraph, conditioning on the *actual neighbour text*
is nearly free to adopt: pass `previous_text` = the final sentence(s) of the preceding paragraph and
`next_text` = the first sentence(s) of the following one. This makes the normal (full-corpus and
one-paragraph-fix) path better, and it is the same mechanism that would make a spliced single
paragraph sit naturally in its section. Caveats the recommendation must carry: (a) `previous_text`
conditioning improves prosody at the join but does not guarantee the *spliced* paragraph's cadence
matches the take already in the file — regenerating paragraph *k* with conditioning is not the same
voice-take as the original run; (b) adding conditioning means the effective cache key must include
the conditioning inputs or two different neighbourhoods would share one chunk (see R1); (c)
`previous_request_ids` is the stronger continuity tool for full-chapter runs but requires capturing
request IDs from the API and a cache shape change — a deliberate, larger step.

### F6 — Cost model: a full re-voice is a Pro-tier month; a one-paragraph fix is effectively free; the blocking number is timings, not TTS

_Observation._ Corpus size, measured from the committed timing files: 163,569 timed words across 71
sections and 8 chapters (Method step 4), totalling 1,212 minutes of narration. Converting words to
invoiceable characters: at a typical ~5.5–6.5 characters/word of spoken text (including spaces,
plus the renderer's spoken preambles and intros) the speakable corpus is **order 0.9–1.1 M chars**.
Pricing, fetched live 2026-09-21 from `elevenlabs.io/pricing` and the models docs: Turbo/V2.5-class
models bill **0.5–1 credit per character** for API usage; tiers are Free 10,000 credits,
Starter $6/30,000, Creator $22/121,000, Pro $99/600,000, Scale $299/1,800,000. The renderer's
default model is `eleven_turbo_v2_5` (`elevenlabs-tts.ts:11`), i.e. the discounted class.

_Inference._ Orders of magnitude, at 0.5 credits/char: **full-corpus regeneration ≈ 450–550k
credits ≈ one Pro tier ($99) month** — or ~4 Creator months of credits. A **one-paragraph fix** is
~500–700 chars ≈ 250–350 credits ≈ **well under $0.10**, comfortably inside even the free tier's
monthly 10k credits for dozens of edits. Two structural consequences: (1) the owner's cost fear is
right about the *voice switch* (full corpus, unavoidable once, ~$99) and wrong about the *edit*
case — the incremental path already exists (F1) and its TTS cost is negligible; (2) what actually
makes an edit expensive is re-running the external timings pipeline (F2). I could not verify the
0.5 vs 1 credit/char split for `eleven_turbo_v2_5` specifically beyond the pricing page's "between
0.5 and 1" statement; treat the full-regeneration figure as accurate to a factor of ~2.

### F7 — The freeze is real: CI never generates audio, and regeneration ability is still an open task

_Observation._ CI deploys with `SKIP_AUDIO: "1"` (`.github/workflows/deploy.yml:55`); `task:0005`
(state `todo`, created 2026-08-17) exists precisely because "nothing regenerates it … the R2 copy
(now backed up) is the only source"; `docs/handoffs/0001` records the 3,229-object / 5.8 GB R2
backup, including 2,995 `audio-chunks/` and 79 `final-audio/` objects. The `stableKey` fallback
(`renderer.ts:130-140`, `chN-sM` without hash) deliberately serves *stale* audio on
`SKIP_AUDIO=1` builds, which is how a credential-less build still plays something.

_Inference._ Every recommendation below is bounded by this: there is currently **no verified,
credentialled, documented path from an edited section to new published audio** — the code path
exists but has not been proven against today's corpus, and a naive verification run would
dangerously bake more old-voice chunks into the cache unless the voice decision (F3) is made
first. The first practical step of any audio work is therefore executing `task:0005`'s AC-2 (one
chapter, end-to-end, verified) *with the voice already decided* — otherwise the verification run
perpetuates the mixed cache.

### F8 — Minor: the chapter cache key hashes filesystem paths, not content

_Observation._ `renderer.ts:196-199` computes the chapter hash over `chapterSectionPaths.join('\n')`
— local paths of the form `<outputDir>/atlas-chN-sM-<sectionhash>.mp3`, where `outputDir` is
`join(process.cwd(), '.cache', 'uc')` (`loader.ts:77`).

_Inference._ The section hashes embedded in the filenames make this *effectively*
content-derived, so it works today — but the key also encodes the cwd-relative directory prefix,
so any change to `outputDir` or to the working directory changes every chapter cache key at once
(silent full re-concat and duplicate R2 keys). A one-line fix is to hash the section content keys
(`s.contentKey`) instead of paths. Low priority; noted because it is the same class of bug as the
text-only chunk key in F3: keys that accidentally include or exclude what matters.

## Limitations

1. **Cut-off cause not adjudicated.** F4 lists four candidates with distinguishing tests but this
   audit cannot pick between them without either the R2 `audio-chunks/` inventory (ages, formats,
   sample rates per object) or a controlled listening test. Nothing here should be read as having
   fixed the cut-off mechanism.
2. **Corpus character count is an estimate.** The 163,569 words / 1,212 minutes are measured from
   committed `words.json`; the character conversion (~0.9–1.1 M chars) uses a generic words-to-chars
   ratio, not the renderer's actual paragraph strings, which would require running the loader
   against live Google Docs content (not permitted here). Cost figures are order-of-magnitude.
3. **Pricing verified only at the page level.** The 0.5–1 credit/char range for Turbo-class models
   comes from the pricing page's summary; the exact rate for `eleven_turbo_v2_5` (and whether a
   different tier's rate applies) was not verifiable without an authenticated API quote.
4. **The external `atlas-podcast` pipeline was not examined.** Everything about timings
   regeneration (F2) is inferred from this repo's comments and interface — `pipeline.py
   --check-remote`, `CHAPTER_META`, the committed `.words.json`. The real cost and mechanics of a
   per-section timings refresh live in that repo.
5. **Live R2 contents unverified.** Object counts (2,995 chunks, 79 `final-audio`) come from
   `docs/handoffs/0001`'s backup inventory, not from listing the bucket. Whether the live bucket
   still holds pre-switch `.pcm` chunks, and how many, is unconfirmed — though the local-cache
   fallback path in `elevenlabs-tts.ts:60-66` makes their reuse mechanism certain even if the R2
   copies were purged only partially.
6. **No runtime verification.** No TTS call, no build, no render was executed (VM constraint plus
   read-only mandate). All claims about behaviour are from code reading; the renderer's tests
   (`renderer.test.ts`, `r2-cache.test.ts`) were not read for this record — F1–F3 rest on the
   production code, not on tests confirming it.
7. **Method note:** some supporting files (r2-cache details, prior-audit cross-checks) were read
   after the F1–F3 checkpoint; all findings were written to disk before the next checkpoint. The
   skeleton-first rule was followed; the "append immediately on discovery" rule was followed at
   finding granularity, not line granularity.
8. **Cross-reference to prior audits:** `audit:0006` already records the undeclared
   `ELEVENLABS_VOICE_ID`/`ELEVENLABS_MODEL_ID` env vars and the no-single-chapter-render ergonomics
   gap; `audit:0001` already records the freeze and the backup inventory; `audit:0003` records the
   player-side test gaps. This record deliberately does not re-find those; it builds on them. The
   text-only chunk-cache key (F1/F3) appears in no earlier audit and is this record's core
   contribution.

## Recommendations

Priority order. Sizes: S < 1 session, M 1–2, L multi-session.

**R1 (S, do first, standalone) — Make the chunk cache key carry its provenance.** Change
`hashText` (or the key construction at `renderer.ts:153-155`) to hash `voice|model|provider|text`
(and, if F5 conditioning is adopted, the conditioning inputs). Add a `--purge-audio-cache` flag or
runbook step that deletes `.cache/audio-chunks/*` and the R2 `audio-chunks/*` prefix. _Risk:_
low — a key change orphans old entries (they stay on R2 until explicitly purged; negligible
storage cost). _What it unblocks:_ every other recommendation; without it a voice switch silently
produces a mixed corpus (F3).

**R2 (S, with R1) — Decide the voice, then purge legacy chunks.** Pick one voice (the owner's
ElevenLabs choice — outside this audit's scope) and delete or quarantine the pre-switch `.pcm`
chunks rather than letting `elevenlabs-tts.ts:60-66` keep converting them. This removes the Kore
component of the "random mix" and the mixed-rate concat hazard (F4 candidate 2) in one act.
_Risk:_ destroying cache objects that are free to keep but cost real money to re-synthesize in
bulk — hence: decide voice first, purge once, re-voice once.

**R3 (M, depends on R1) — Adopt `previous_text`/`next_text` conditioning in `callTtsApi`.** Pass
the trailing sentence(s) of the previous paragraph and leading sentence(s) of the next (verified
API surface, F5). Include the conditioning in the cache key per R1. _Risk:_ cache invalidation
blowup if forgotten (mitigated by R1 ordering); negligible API cost. _What it does not do:_ it does
not make a spliced replacement paragraph cadence-match an existing take — see R7's honest shape.

**R4 (M, independent) — Close the timings hole for single-section edits.** Two parts: (a) a guard
that fails loudly when a section's current text hash ≠ the hash pinned in `chapter-timing.ts`
`publishedUrl` for timed chapters (the in-repo half of what `pipeline.py --check-remote` does
externally); (b) a documented per-section path through `atlas-podcast` to regenerate one
`words.json`. Without this, every cheap paragraph fix still costs a full timings re-run in practice
(F2). _Risk:_ touching `atlas-podcast` (external); part (a) alone is safe and standalone.

**R5 (S, independent) — Declare `ELEVENLABS_VOICE_ID` and `ELEVENLABS_MODEL_ID` in the astro env
schema** and derive the `stableKey` fallback names to include them, so a voice change is visible in
config review and in the stale-fallback key. Built on `audit:0006`'s env inventory; do not
re-inventory. _Risk:_ none beyond schema churn.

**R6 (S, after R1–R2) — Execute `task:0005` AC-2 (verify one chapter end-to-end) with the chosen
voice,** so the verification run seeds the cache with the intended voice instead of perpetuating
the mix (F7). Fold its AC-3 (`-c copy` chapter concat) into the same session — `concatenateMp3s`
(`elevenlabs-tts.ts:270-285`) still re-encodes via `filter_complex`. _Risk:_ spends real credits
(~one chapter ≈ 8–12% of corpus ≈ tens of dollars at Pro-tier effective rates); that spend is the
point.

**R7 (L, decide last, with the owner) — The full re-voice migration.** One Pro-tier month (~$99,
F6) regenerates the entire corpus in one consistent voice with conditioned joins and fresh chunk
entries. Sequence: R1 → R2 → voice choice → per-chapter regeneration with `previous_text`
conditioning (chapter *k+1* conditioned on chapter *k*'s tail for cross-section continuity) →
bulk timings refresh through `atlas-podcast` → `swap-cbr-audio.ts`-style in-place byte swap where
read-along exists. **Do not** regenerate chapter-by-chapter ad hoc over weeks: that maximizes the
mixed-cache window R1 exists to close. **What I would not do:** (a) sentence-level cache granularity
— paragraph is the right unit; finer granularity multiplies API requests, worsens conditioning, and
saves credits the edit path doesn't need (F6); (b) a custom stitching layer beyond ffmpeg —
ElevenLabs' own conditioning plus `-c copy` concat already cover the join problem; (c) re-litigate
`scripts/` → `bin/atlas` (decided, `task:0010`) — but note `atlas generate audio --chapter N`
(`audit:0006`) is the natural CLI surface for R4/R6.

## Disposition

Pending owner decision. The strategic question this audit exists for — *how to regenerate after a
writing edit without regenerating the chapter, with one consistent voice* — has a concrete answer:
**the incremental machinery already exists (F1) and its cost is negligible; the two real blockers
are the text-only chunk cache fighting any voice change (F3) and the word-timings coupling (F2).**

- Safe standalone: R1, R2 (as a pair), R4 part (a), R5.
- Must be decided together: voice choice + R2 purge + R6 verification + R7 migration (order
  matters; a verification run before the purge bakes the wrong voice into thousands of cache
  objects).
- R3 and R4 part (b) should be decided with R7 (conditioning and timings-refresh shape the
  migration).
- The cut-off question stays open pending the R2 inventory / listening test (Limitation 1); it does
  not block R1–R2, which eliminate two of the four candidates mechanically.
