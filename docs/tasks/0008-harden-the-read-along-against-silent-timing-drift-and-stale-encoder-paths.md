---
schema_version: 2
id: '0008'
uid: 'task-20260920T201208154634Z-bd0f64f7'
title: 'Harden the read-along against silent timing drift and stale encoder paths'
role: task
status: in_progress
summary: 'Task record: Harden the read-along against silent timing drift and stale encoder paths.'
created: '2026-09-20'
updated: '2026-09-20'
owner: Markov Grey
supersedes: ''
superseded_by: ''
engineering_document:
  version: 1
  contract_tier: full
  role: task
  id: '0008'
  uid: task-20260920T201208154634Z-bd0f64f7
  title: 'Harden the read-along against silent timing drift and stale encoder paths'
  state: in_progress
  authority:
    kind: work-state
    owner: Markov Grey
    scope: BOUNDED ACCEPTANCE AND COMPLETION AUTHORITY
  created: '2026-09-20'
  updated: '2026-09-20'
  transition_history: complete
  transitions:
    - from: todo
      to: in_progress
      at: '2026-09-20'
      reason: 'Implemented AC-1 through AC-6 on integration/read-along; evidence recorded. Held at
        in_progress rather than done because acceptance authority rests with the owner and the
        criteria were authored by the implementer.'
  # No formal graph edge: this task neither depends on nor refines task:0002 /
  # task:0005. AC-5 amends 0002's inventory and the audio overlap with 0005 is
  # noted in prose; inventing a typed edge would overstate the coupling.
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
    size: s
    priority: p2
---

# Task 0008: Harden the read-along against silent timing drift and stale encoder paths

## Problem

PR #12 shipped word-level read-along for all eight chapters: 71 committed `.words.json` files plus a
`src/data/chapter-timing.ts` table pinning, per section, a local audio path, a timings path, and the
published CDN URL the timings were measured against. Three gaps in that arrangement fail silently
rather than loudly, and all three bite a maintainer who was not the author.

1. **Nothing ties the table to the files.** No check asserts that every entry in `chapter-timing.ts`
   has its committed `.words.json`, or the reverse. A dropped file, a renumbered section after a
   content refresh, or a typo in a path yields a page that quietly renders no read-along — or fetches
   a 404 and swallows it, because `word-highlight.ts` ends in a bare `.catch()` that deliberately
   leaves the text as rendered. Nothing in `pnpm verify` notices.

2. **A dead code path still publishes variable-bitrate audio.**
   `src/textbook-loader/renderers/audio/gemini-tts.ts` carries a `mp3ToNormalizedMp3` that is a near
   copy of the ElevenLabs one, still encoding at `-q:a 4`. PR #13 fixed only the ElevenLabs path. The
   Gemini class is imported nowhere today (it predates the ElevenLabs switch in `e004c0c`) so it is
   inert, but it is an undocumented, untested, and now _divergent_ copy of the exact defect #13 set
   out to remove. Reviving it would reintroduce the imprecise seeking the read-along depends on
   being fixed.

3. **The CDN hostname gained 71 new hardcode sites, uninventoried.** `task:0002` enumerates where
   `atlas.foreviewusercontent.com` is hardcoded so the R2 migration can repoint it, and lists two
   files. `chapter-timing.ts` now pins the hostname 71 more times. A migration that follows
   `task:0002`'s inventory would repoint the renderers and leave every read-along page pointing at
   the old host.

Audience: whoever does the next content refresh (~12–18 weeks out per the maintainer) or the R2
migration in `task:0002`. Both are the moments these gaps surface, and at that point the author of
PR #12 is unlikely to be available.

## Scope

- Add an offline test over `src/data/chapter-timing.ts` and `public/audio/ch*/` asserting structural
  integrity: table↔file correspondence both ways, well-formed timing payloads, and published URLs
  whose filenames agree with their table coordinates.
- Bring `gemini-tts.ts`'s encoder settings into line with `elevenlabs-tts.ts`, or remove the file if
  it is confirmed dead, and record which was chosen and why.
- Extend `task:0002`'s inventory to name `src/data/chapter-timing.ts` and its occurrence count.

## Out of scope

- **Detecting that the upstream audio bytes moved.** The published filename is
  `atlas-ch{N}-s{M}-{sha256(narration paragraphs)}.mp3`, and reproducing that hash offline is not
  possible: the narration text includes Gemini-generated equation descriptions that a contributor
  build pulls from R2. Genuine remote-drift detection stays a credentialed, manual step
  (`pipeline.py --check-remote` in `atlas-podcast`, per the note in `chapter-timing.ts`). This task
  buys structural integrity, not freshness — see Limitations.
- Regenerating any timings or audio (`task:0005` owns audio regeneration).
- Performing the R2 migration itself (`task:0002`).
- The duplicate-render / duplicate-`id` issue the read-along works around
  (`pickArticle`, `pickHeadings`); tracked separately.
- Tests for `word-highlight.ts`'s DOM behaviour. Its testable logic was already extracted into
  `word-align.ts`, `sentences.ts`, and `follow-scroll.ts`, which PR #12 covers.

## Done when

- **AC-1:** A test fails if any `chapter-timing.ts` entry names a `wordsUrl` with no committed file
  under `public/audio/`, and fails if any committed `public/audio/ch*/*.words.json` has no
  corresponding table entry. Both directions are asserted; the failure message names the offending
  chapter/section.
- **AC-2:** A test fails if any committed `.words.json` is not a non-empty array of `{w, s, e}`
  objects with numeric, non-negative, non-decreasing start times and `e >= s` per entry.
- **AC-3:** A test fails if any `publishedUrl` is not a parseable absolute URL whose filename
  encodes the same chapter and section number as its position in the table (i.e. entry `[4][2]`
  must point at a filename matching `atlas-ch4-s2-`).
- **AC-4:** No encoder call that writes a **final, published** MP3 passes `-q:a 4`; every such call
  passes `-b:a 96k -write_xing 0`. The intermediate per-paragraph chunk encoder
  (`elevenlabs-tts.ts:150`, piping to `pipe:1`) is explicitly exempt — PR #13 left it variable on
  purpose because the normalization pass re-encodes it, and forcing CBR there would cost size for
  no seek benefit. The reason the Gemini path was aligned rather than deleted (or vice versa) is
  recorded in this task's evidence.
- **AC-5:** `docs/tasks/0002-migrate-r2-assets-to-our-own-cloudflare-account-and-repoint-config.md`
  names `src/data/chapter-timing.ts` and the number of hostname occurrences in it, in its Scope.
- **AC-6:** `pnpm verify` passes on the branch carrying this work, with no new baseline failures.

## Limitations

AC-1 through AC-3 are _structural_ guards. They prove the committed artifacts are mutually
consistent and well-shaped. They cannot prove the timings still match the audio a reader hears: if a
Google Doc edit changes a section's narration text, the published hash moves, and a credentialed
build will serve new audio against old timings. The read-along degrades gracefully (it drifts rather
than crashing), which is precisely why it needs the manual remote check named in Out of scope rather
than a false sense of coverage from this test file.

## Completion evidence

Implemented on `integration/read-along` (branched from `main` after the governance merge, carrying
PRs #11, #13, #12).

**State is `in_progress`, not `done`, deliberately.** All six criteria below are met and evidenced,
but this record's authority block places acceptance with the owner, and the criteria were drafted by
the same agent that implemented them — self-certifying that pairing would be exactly the failure the
authority model exists to prevent. The branch is also unmerged. The owner flips this to `done` on
accepting the evidence.

| Criterion | Evidence                                                                                                                                                                                                                                            |
| --------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| AC-1      | `src/data/chapter-timing.test.ts` — "has a committed .words.json for every entry" and "has a table entry for every committed .words.json" (commit `2f5bff7`).                                                                                       |
| AC-2      | Same file — "parses every file as a non-empty array", "gives every word a string and a finite, non-negative span", "orders every file by non-decreasing start time".                                                                                |
| AC-3      | Same file — "points each entry at URLs bearing its own chapter and section", plus an https assertion.                                                                                                                                               |
| AC-4      | `901b05c`. `rg -n 'q:a 4' src/textbook-loader/renderers/audio/` now matches only `elevenlabs-tts.ts:150` (the exempt intermediate chunk encoder) and a comment at `:221`. Both final-output paths in `gemini-tts.ts` pass `-b:a 96k -write_xing 0`. |
| AC-5      | `7c23e39` — `task:0002` Scope now names `src/data/chapter-timing.ts` with its 71 occurrences and why they are pinned rather than derived.                                                                                                           |
| AC-6      | `pnpm verify` on `7c23e39`: lint 0 errors / 11 pre-existing warnings, `astro check` 0 errors, **18 test files / 181 unit tests** (was 17 / 173), build complete, smoke 3/3, a11y 6/6.                                                               |

**Mutation evidence for AC-1 to AC-3.** A passing guard proves nothing unless it fails on the defect
it targets, so each was checked against an injected fault, then reverted:

| Injected fault                               | Result                                                              |
| -------------------------------------------- | ------------------------------------------------------------------- |
| removed `public/audio/ch3/ch3-s5.words.json` | AC-1 forward fails, reporting `3.5 -> /audio/ch3/ch3-s5.words.json` |
| added orphan `ch3-s99.words.json`            | AC-1 reverse fails; 7 others still pass                             |
| repointed a `publishedUrl` from `s2` to `s7` | AC-3 fails; 7 others still pass                                     |
| swapped two word entries out of time order   | AC-2 ordering fails; 7 others still pass                            |
| set one entry's `e` below its `s`            | AC-2 span fails; 7 others still pass                                |
| replaced a file's contents with `not json`   | AC-2 array check fails; collection does not abort                   |

The first run of the missing-file case exposed a defect in the guard itself: the eager
`readFileSync` at `describe` scope threw during collection, so the suite reported "no tests" instead
of naming the section — failing AC-1's own wording. Fixed before commit by folding absent and
unparseable files into the result set.

**AC-4 decision.** The Gemini path was **aligned, not deleted.** It is imported nowhere, undocumented
and untested, so removal is defensible; but whether Atlas wants a second TTS provider is a product
decision rather than a defect fix, and outside this task's authority. Matching the encoder settings
makes the invariant hold under either later choice. Deletion remains open for the owner.

**Residual risk.** Everything in the Limitations section still stands: these guards are structural,
and a content refresh that moves the published audio hash will still desync the read-along without
failing any check here. `task:0005` (audio regeneration) and the next content refresh are the
moments to run `pipeline.py --check-remote`.
