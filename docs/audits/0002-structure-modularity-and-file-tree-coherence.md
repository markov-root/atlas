---
schema_version: 2
id: '0002'
uid: 'audit-20260921T134851414008Z-73a91c78'
title: 'Structure, modularity and file-tree coherence'
role: audit
status: draft
summary: 'Layout docs have drifted, src/lib mixes build-time and browser code, and the read-along feature has no module boundary.'
created: '2026-09-21'
updated: '2026-09-21'
owner: Markov Grey
supersedes: ''
superseded_by: ''
engineering_document:
  version: 1
  contract_tier: full
  role: audit
  id: '0002'
  uid: audit-20260921T134851414008Z-73a91c78
  title: 'Structure, modularity and file-tree coherence'
  state: draft
  authority:
    kind: point-in-time-evidence
    owner: Markov Grey
    scope: 'src/ and scripts/ file tree at branch codebase-cleanup, commit 22c56a1; no runtime behaviour observed'
  created: '2026-09-21'
  updated: '2026-09-21'
  transition_history: unverified
  transitions: []
  relationships: []
  details:
    as_of: '2026-09-21'
    subjects: ['AI Safety Atlas src/ and scripts/ at 22c56a1 (branch codebase-cleanup)']
    method: 'Static file-tree inspection, line counts, and import-graph grep; no build or runtime execution'
    limitations:
      - "Import fan-in measured by grep on `from '...'` only; side-effect imports are undercounted"
      - 'No runtime, bundle-size, or dependency-cycle analysis performed'
      - 'Astro component coupling not measured; only .ts module imports were traced'
---

# Audit 0002: Structure, modularity and file-tree coherence

## Scope

The `src/` and `scripts/` trees of AI Safety Atlas at commit `22c56a1` on branch `codebase-cleanup`
(2026-09-21). 14,135 lines across 49 `.ts` and 57 `.astro` files.

**Examined:** directory shape, file sizes, module placement, import relationships between `.ts`
modules, and agreement between the tree and the layout documented in `docs/ARCHITECTURE.md`.

**Not examined:** runtime behaviour, bundle size, CSS structure, the `.cache/docs/` content snapshot,
`public/` assets, test quality (that is audit:0003), dependency hygiene (audit:0004), and
within-file code style (audit:0005). Astro component-to-component coupling was not traced.

## Method

All commands run from the repository root, read-only:

```bash
fdfind -e ts -e astro -e tsx . src scripts | xargs wc -l | sort -rn   # sizes
fdfind -t d . src --max-depth 2                                        # tree shape
rg -l "from ['\"].*<module>['\"]" src | wc -l                          # import fan-in
rg -n '<module-name>' src --glob '!*.test.ts'                          # reference tracing
```

Fan-in counts were cross-checked by grepping each module's bare name, which is how the
`word-highlight` result below was corrected. `docs/ARCHITECTURE.md` (§Repo layout, lines 56–85),
`docs/PRINCIPLES.md` (§9 High cohesion, §14 Explicit non-goals), and `docs/ROADMAP.md` (§Later,
§Not planned) were read before forming any recommendation.

## Findings

### F1 — The documented repo layout no longer matches the tree

_Observation._ `docs/ARCHITECTURE.md:56-85` documents a tree containing
`src/components/ # Astro components (nodes/, navigation/, etc.)`. There is no
`src/components/navigation/` directory. Four top-level source directories exist but appear nowhere
in the documented layout:

| Directory      | Files | Contents                                              |
| -------------- | ----- | ----------------------------------------------------- |
| `src/data/`    | 2     | `chapter-timing.ts` (396 lines) and its test          |
| `src/config/`  | 1     | `site.ts`                                             |
| `src/content/` | 105   | `cohorts/`, `glossary/`, `organizations/` collections |
| `src/fonts/`   | 5     | `.ttf` files                                          |

_Inference._ `src/content/` at 105 files is a substantial, load-bearing part of the Astro content
layer, and its absence from the layout diagram is the most consequential of the four. This is
ordinary documentation drift rather than a structural defect, but `AGENTS.md` names
`docs/ARCHITECTURE.md` as the answer to "how the build pipeline and Astro layer fit together", so a
reader following the project's own routing gets an incomplete map.

### F2 — `src/lib/` mixes build-time and browser-runtime modules with no marker

_Observation._ `src/lib/` holds 11 non-test modules totalling ~1,900 lines (3,160 including tests).
They split cleanly into two groups that never interact:

| Runs in Node at build time                                                   | Runs in the browser                                                                                                                                                             |
| ---------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `build-mode.ts` (77), `textbooks.ts` (52), `og.ts` (24), `sentences.ts` (53) | `word-highlight.ts` (724), `audio-player.ts` (484), `word-align.ts` (327), `reader.ts` (256), `audio-source-switch.ts` (110), `section-audio.ts` (106), `follow-scroll.ts` (90) |

Nothing in a filename, directory, or export signals which group a module belongs to.

_Inference._ The browser group is 2,097 lines — about 10× the build-time group — and carries
different constraints (no Node APIs, ships to users, affects page weight). `docs/PRINCIPLES.md:109`
states "High cohesion within modules, loose coupling between"; the cohesion within each group is
high, but `src/lib/` as a container has none. A contributor cannot tell from the tree whether adding
a Node import to a `lib/` module is safe.

### F3 — The read-along feature has no module boundary

_Observation._ The word-level read-along shipped 2026-09-20 and its implementation is distributed
across four locations with no shared directory:

- `src/lib/word-highlight.ts` (724) — DOM wrapping and highlight state
- `src/lib/word-align.ts` (327) — alignment and anchor resync
- `src/lib/follow-scroll.ts` (90) — scroll behaviour, deliberately split out
- `src/data/chapter-timing.ts` (396) — the timing table, 71 pinned CDN URLs
- `src/layouts/Reader.astro:388` — the only wiring point (`import '../lib/word-highlight'`)
- `public/audio/ch*/*.words.json` — 71 committed timing payloads

_Inference._ This is the newest and, per `handoff:0002`, least settled subsystem, and it is also the
most spread out. `follow-scroll.ts:4` explicitly documents being "kept separate from the DOM wiring
in word-highlight.ts", which shows the split was deliberate at the file level — but the feature has
no enclosing boundary, so the deliberate split reads as scatter to anyone who does not already know
the history.

### F4 — `src/data/` is a directory named for data that contains only code

_Observation._ `src/data/` contains exactly two files: `chapter-timing.ts` (396 lines, 19 KB) and
its test. The module is a generated lookup table embedding 71 absolute CDN URLs on the
`atlas.foreviewusercontent.com` host. The actual data files it indexes live under
`public/audio/ch*/*.words.json`.

_Inference._ The name misdirects: a reader looking for content data finds `src/content/`; a reader
looking for the timing payloads finds `public/audio/`. `task:0002` already tracks the 71 pinned
hostnames as migration surface, so this module is a known coupling point independent of where it
sits.

### F5 — `transformer.ts` is the largest module and the highest-coupled

_Observation._ `src/textbook-loader/transformer.ts` is 750 lines, the largest file in the repo, and
the `transformer` name resolves in 18 files. `docs/ROADMAP.md:195` ("Later") already commits to
"Refactor `Transformer` to remove per-textbook shared state", and `lesson:0003` and `lesson:0004`
both record that its mutable per-textbook counters caused test failures.

_Inference._ No new finding is warranted here — the project has already identified the defect, its
mechanism, and its position in the queue. Recorded so this audit's silence is not read as absence.

### F6 — `src/components/` groups two categories and leaves 23 files flat

_Observation._ 23 `.astro` files sit directly in `src/components/`; `nodes/` (19 files) and `brand/`
(2 files) are the only groupings. The flat set mixes primitives (`Button.astro`, `Input.astro`,
`Textarea.astro`, `RadioGroup.astro`, `InputLabel.astro`), page furniture (`Header.astro`,
`Footer.astro`), and search (`AlgoliaSearch.astro`, `DocSearchProvider.astro`, `SearchTrigger.astro`).

_Inference._ At 23 files this is navigable but at the point where a flat list stops being an
advantage. The grouping that exists (`nodes/`, `brand/`) shows the project already reaches for
subdirectories when a set coheres; three further coherent sets are visible in the flat list.

## Limitations

- **Import fan-in is undercounted.** The `from '...'` grep reported `word-highlight` as imported by
  0 files. It is in fact side-effect imported at `src/layouts/Reader.astro:388`. Every fan-in number
  above should be read as a lower bound; only `word-highlight` was individually corrected.
- **No dependency-cycle detection** was run. Whether `src/lib/` or `src/textbook-loader/` contains
  import cycles is unestablished.
- **Astro component coupling was not traced at all.** 57 `.astro` files are outside the import
  analysis, so any statement about component modularity rests on directory shape alone.
- **No runtime or bundle evidence.** The claim in F2 that the browser group "ships to users" is from
  file placement and `Reader.astro` imports, not from inspecting a build output.
- **Single point in time, single branch.** Nothing here establishes whether these are recent drifts
  or long-standing.

## Recommendations

Priority order. Sizes are S (< 1 session), M (1–2 sessions), L (multi-session). The owner decides
what to act on; nothing here should be executed without that decision.

1. **Update the `docs/ARCHITECTURE.md` repo-layout block (F1). Size S.** Remove `navigation/`, add
   `src/content/`, `src/data/`, `src/config/`, `src/fonts/`. Risk: none — documentation-only, and it
   restores the accuracy of the file `AGENTS.md` points readers to first.

2. **Separate browser modules from build-time modules in `src/lib/` (F2). Size S–M.** The cheapest
   version is a `src/lib/client/` subdirectory for the seven browser modules, leaving the four
   build-time ones in place. Risk: touches import paths in `Reader.astro` and the section page;
   mechanical, caught by `pnpm typecheck`. This is the recommendation with the best
   effort-to-clarity ratio in this audit.

3. **Give the read-along a single home (F3, F4). Size M.** Colocating `word-highlight.ts`,
   `word-align.ts`, `follow-scroll.ts`, and `chapter-timing.ts` under one directory would make the
   newest subsystem legible as a unit and would empty `src/data/` of its misnamed contents. Risk:
   moderate — it is the least settled code, so churn here competes with stability; it also touches
   `task:0002`'s migration surface, so sequencing matters. **Recommend deferring until the R2
   migration in `task:0002` has landed**, to avoid moving the same file twice.

4. **Group the flat `src/components/` set (F6). Size S.** Three coherent groups are already visible:
   form primitives, page furniture, search. Risk: low but purely cosmetic churn across many import
   sites; lowest value of the four and easy to justify declining.

**Explicitly not recommended:** any change to `transformer.ts` (F5) as part of this cleanup. The
project has already scoped it, placed it in "Later", and recorded why. Re-raising it here would add
nothing.

## Disposition

**Pending owner decision. No code change is authorised by this audit.**

The owner has reserved all `src/` changes until a tree and sequencing are agreed
(`handoff:0002` §Constraints). This record exists to inform that decision, not to pre-empt it.

Only recommendation 1 (documentation-only) is safe to action without further design discussion.
Recommendations 2–4 change import paths across the tree and should be decided together, since doing
2 and 3 separately would move `src/lib/` files twice. Recommendation 3 additionally has a stated
sequencing dependency on `task:0002`.

No finding in this audit is a correctness defect; all are legibility and organisation observations.
Declining all four in full is a defensible outcome.
