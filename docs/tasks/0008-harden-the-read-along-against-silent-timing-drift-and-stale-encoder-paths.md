---
schema_version: 2
id: '0008'
uid: 'task-20260920T201208154634Z-bd0f64f7'
title: 'Harden the read-along against silent timing drift and stale encoder paths'
role: task
status: todo
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
  state: todo
  authority:
    kind: work-state
    owner: Markov Grey
    scope: BOUNDED ACCEPTANCE AND COMPLETION AUTHORITY
  created: '2026-09-20'
  updated: '2026-09-20'
  transition_history: unverified
  transitions: []
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
- **AC-4:** `rg -n 'q:a 4' src/textbook-loader/renderers/audio/` returns no match, and the reason the
  Gemini path was aligned rather than deleted (or vice versa) is recorded in this task's evidence.
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

Keep empty until evidence exists. Before changing state to `done`, link the implementation, checks,
records, and limitations that satisfy each criterion.
