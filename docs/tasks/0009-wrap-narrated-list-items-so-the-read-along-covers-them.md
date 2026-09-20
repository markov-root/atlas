---
schema_version: 2
id: "0009"
uid: "task-20260920T205237511024Z-21153236"
title: "Wrap narrated list items so the read-along covers them"
role: task
status: in_progress
summary: "Task record: Wrap narrated list items so the read-along covers them."
created: "2026-09-20"
updated: "2026-09-20"
owner: Markov Grey
supersedes: ""
superseded_by: ""
engineering_document:
  version: 1
  contract_tier: full
  role: task
  id: "0009"
  uid: task-20260920T205237511024Z-21153236
  title: "Wrap narrated list items so the read-along covers them"
  state: in_progress
  authority:
    kind: work-state
    owner: Markov Grey
    scope: BOUNDED ACCEPTANCE AND COMPLETION AUTHORITY
  created: "2026-09-20"
  updated: "2026-09-20"
  transition_history: complete
  transitions:
    - from: todo
      to: in_progress
      at: '2026-09-20'
      reason: 'Fixed and evidenced by browser measurement; held short of done because acceptance authority rests with the owner.'
  relationships: []
  details:
    criteria: [criterion:AC-1, criterion:AC-2, criterion:AC-3, criterion:AC-4, criterion:AC-5]
    size: s
    priority: p1
    # Optional scheduling hints:
    # depends_on: ["0042"]
    # parent: "0090"
    # touches: ["software-engineering/public/**", "software-engineering/dev/tests/**"]
    # size: m
    # priority: p1
    # Under the agent_scheduling profile, an oversized task warns (advisory) and prompts a split.
    # Justify legitimately atomic large work with an exception that suppresses the prompt:
    # atomic_large:
    #   rationale: "why this cannot be split into vertical slices"
    #   rollback: "how to revert / verify if it goes wrong"
    #   checkpoints: ["intermediate checkpoint 1", "intermediate checkpoint 2"]
---

# Task 0009: Wrap narrated list items so the read-along covers them

## Problem

The narration reads list content. `text-renderer.ts:140` turns a `List` node into narration script
(`"- item"` / `"1. item"`), so the voice speaks every bullet. But the read-along's
`WRAPPABLE_SELECTOR` was `"p, figcaption, h2, h3, h4"` and a prose `ListItem` renders as a bare
`<li><slot/></li>` with no inner `<p>` (`src/components/nodes/ListItem.astro`). So no list text was
wrapped in a `.word-span`.

Three consequences, in increasing severity:

1. **Clicking a word in a list did nothing** — the reported symptom. `onArticleClick` resolves a
   click through `spanIndex`, and unwrapped text has no span to resolve.
2. **List text never highlighted.**
3. **The aligner's two streams disagreed.** Those words are present in the spoken stream and absent
   from the written one, so every list became a long unmatched run. `alignWords` parks the highlight
   on the last matched word for the duration. Measured on `6.5 learning-from-feedback`: the
   highlight sat frozen on the caption "Figure 6.14" from 185s to at least 218s while the narration
   read a 30-item list, recovering only incidentally at ~243s.

Scale, measured across eight list-bearing sections: **4117 narrated words** had no counterpart on
the page. On `6.5` alone that is 1209 words against 4212 spoken — 29% of the section.

Footnote `<li>`s were unaffected because `[section].astro` builds them as `<li><p>…</p></li>`, and
the inner `<p>` already matched. That is also why the defect was easy to miss: the first pages
inspected had lists only inside footnotes or `.notebox-content`, both of which are correctly
excluded.

## Scope

- Add `li` to `WRAPPABLE_SELECTOR` in `src/lib/word-highlight.ts`.
- Skip nested wrappable elements so `<li><p>` is wrapped once, not twice.
- Add `li` to the `contain: paint` rule in `src/styles/global.css`, for the repaint-cost reason the
  existing rule documents.

## Out of scope

- **Unit tests for the wrapping itself.** `word-highlight.ts` is the DOM shell the project
  deliberately left untested — its testable logic was extracted into `word-align.ts`,
  `sentences.ts`, and `follow-scroll.ts`. Testing selection would require a DOM environment
  (`jsdom`/`happy-dom`); neither is installed, and adding a dev dependency is a project decision,
  not this fix's to make. Evidence here is browser measurement instead. See Limitations.
- `dt`/`dd` (17 words across the sample) and the `div` residue (~1072 words), which inspection shows
  is almost entirely correct exclusions: contributor-build image placeholders, note-box titles the
  narration announces-and-skips, quote attributions, and page chrome.
- Whether the footnote list should be wrapped at all. It is narrated only as a skip-over, so its
  words dilute the written stream slightly. Pre-existing, unchanged by this task.

## Done when

- **AC-1:** On a section with prose lists, every narrated `<li>` word is wrapped in a `.word-span`.
- **AC-2:** No word is wrapped twice. On a page whose footnotes render `<li><p>`, span count per
  footnote stays proportional to its word count, and no `.word-span` element appears twice in the
  document-order list.
- **AC-3:** With the narration playing over a list, the highlighted word matches the word being
  spoken, rather than parking on the preceding block.
- **AC-4:** Clicking a word inside a list item seeks the audio to that word.
- **AC-5:** `pnpm verify` passes, including the axe-core a11y suite — the fix adds thousands of
  inline spans, so accessibility is a real regression surface.

## Limitations

Verified by direct browser measurement against the running dev server, not by an automated test. A
future regression in `WRAPPABLE_SELECTOR` would not be caught by `pnpm verify`. Closing that needs a
DOM test environment — recorded here as a known, deliberate gap rather than an oversight.

## Completion evidence

| Criterion | Evidence |
| --- | --- |
| AC-1 | `6.5 learning-from-feedback`: wrapped spans **3025 -> 4244**, and words wrapped inside list items **0 -> 1219**, matching the 1209-word measured list content. Across the 8-section sample, unreachable list words **4117 -> 0**. |
| AC-2 | Same page: `spans.length === new Set(spans).size` (4244 both). On `1.2 current-capabilities` (which has `<li><p>` footnotes): total unchanged at 2912, zero repeated elements, footnote spans 68/36 against 66/32 raw words — proportionate, not doubled (doubling would show ~132). |
| AC-3 | Probes at 185s / 194s / 218s during the 30-item list. Before: `"Figure 6.14"` at all three. After: `learn` -> `learn`, `reward` -> `reward`, `not` -> `not`, each inside a list item. |
| AC-4 | Clicked the wrapped word `"always"` inside a list item with narration playing; `audio.currentTime` moved 243s -> 997s. |
| AC-5 | `pnpm verify`: lint 0 errors / 11 pre-existing warnings, `astro check` 0 errors, 18 files / 181 tests, build complete, smoke 3/3, **a11y 6/6 with no new baseline violations**. |

**Held at `in_progress`, not `done`**, for the same reason as `task:0008`: acceptance authority rests
with the owner, and the criteria were authored by the implementer.
