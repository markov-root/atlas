---
schema_version: 2
id: "0014"
uid: "task-20260921T203524270864Z-5a36f93a"
title: "Model language and edition through the whole stack"
role: task
status: todo
summary: "Plumb the existing version+language identity key through routing, search, timings, glossary and slugs so a translation can ship at all."
created: "2026-09-21"
updated: "2026-09-21"
owner: Markov Grey
supersedes: ""
superseded_by: ""
engineering_document:
  version: 1
  contract_tier: full
  role: task
  id: "0014"
  uid: task-20260921T203524270864Z-5a36f93a
  title: "Model language and edition through the whole stack"
  state: todo
  authority:
    kind: work-state
    owner: Markov Grey
    scope: BOUNDED ACCEPTANCE AND COMPLETION AUTHORITY - language/edition plumbing across URL routing, search indexing, audio timing keys, glossary loading, slugs and cross-language identity, bounded by the decisions in this record. src/ frozen until execution is authorised.
  created: "2026-09-21"
  updated: "2026-09-21"
  transition_history: unverified
  transitions: []
  relationships: []
  details:
    criteria: [criterion:AC-1, criterion:AC-2, criterion:AC-3, criterion:AC-4, criterion:AC-5, criterion:AC-6, criterion:AC-7, criterion:AC-8]
    size: l
    priority: p1
---

# Task 0014: Model language and edition through the whole stack

## Problem

Translators are blocked today. `TRANSLATING.md` promises that a registered translation "appears at
`/{lang}/chapters/v1/...` from the next deploy" (TRANSLATING.md:79), but the build cannot serve
one: every content route is keyed by edition only, the data-access layer is English-locked in
three places, and no subsystem downstream of the content collection carries a language dimension.
A translator who completes the documented workflow produces content the build silently drops
(`audit:0007` F1).

**The key insight - verified 2026-09-21: this is plumbing, not a model change.** The identity key
already exists: `src/content.config.ts:108` builds `id: `${textbook.version}-${textbook.language}``,
and `TextbookDefinition` (`src/textbook-loader/index.d.ts:9-13`) already carries `version` and
`language`. What breaks is that the key is **discarded** immediately after construction:

- `src/lib/textbooks.ts:8` resolves by hardcoded entry id `` `${version}-en` ``;
- `src/lib/textbooks.ts:24` (`getLatestTextbook`) and `:51` (`getTextbooks`) filter
  `t.data.language === 'en'` - and every page's `getStaticPaths` goes through `getTextbooks()`,
  so a registered non-English edition is invisible to the whole site;
- `<html lang="en">` is hardcoded in both layouts (`src/layouts/Default.astro:16`,
  `src/layouts/Reader.astro:49`).

Dropping three filters and one hardcoded id suffix would make a Spanish edition *buildable* - but
not *shippable*, because four downstream subsystems key content by chapter/section position or by
English prose, and one of them destroys data on first contact:

1. **Search** (`audit:0007` F2): `indexTextbook` deletes every record with
   `filters: `version:${textbook.version}`` then saves (`src/textbook-loader/algolia.ts:145-153`,
   deleteBy at :145-149). Records carry `version` but no `language` (`algolia.ts:99,121`). The
   first build that indexes a second language **wipes the English index**; whichever textbook
   indexes last wins.
2. **Read-along audio** (`audit:0007` F3): `chapterTimings` is
   `Record<number, Record<number, SectionTiming>>` - chapter → section only
   (`src/data/chapter-timing.ts:22`). `resolveSectionAudio(chapterNumber, sectionNumber, …)`
   (`src/lib/section-audio.ts:70`) prefers the locally staged English CBR file whenever it
   exists, so a Spanish v1 page silently resolves the English narration *and English word
   timings* - wrong audio, wrong sync, no error anywhere.
3. **Slugs** (`audit:0007` F6): heading/chapter/section slugs are `slugify` of prose
   (`transformer.ts:110`, `:233`, `loader.ts:161`), so no two languages share a URL for the same
   section and there is no language-stable content key - nothing can back hreflang alternates or
   translation cross-reference. The only redirect machinery is one static entry
   (`astro.config.mjs:9-11`).
4. **Glossary** (`audit:0007` F5): `loadGlossary` calls `readdir` with no existence guard
   (`loader.ts:97`), so registering an edition before its glossary directory exists fails the
   build with ENOENT; and the unconsumed `glossary` content collection
   (`src/content.config.ts:34-35`) globs all languages into one flattened query - it is a decoy
   interface for the multi-language corpus.
5. **"Latest edition wins" is baked into routes** (`audit:0007` F7): the bare `/chapters/...` and
   `/read` paths redirect into `sorted[0]` by string `localeCompare` (`textbooks.ts:25` - which
   also mis-sorts at v10). When v2 lands, published version-less URLs silently re-target to v2
   content with no edition marker at the point of redirect - currently implicit and undocumented.

The cost is not hypothetical demand: Edition 2 is being written and translations are in flight
(RiesgosIA Spanish, with more languages confirmed - PRINCIPLES §10 records the YAGNI
recalibration). Every week of delay is translator time producing unshippable content.

**Counter-case, recorded honestly.** Most of this gap is already known and scoped:
`ROADMAP.md` "Now - Locale-aware routing scaffold (English-only)" already names the `[lang?]`
segment, dynamic `<html lang>`, hreflang, dropping the `.filter(language === 'en')`, *and* -
after the audits - `algolia.ts` and `chapter-timing.ts` as code areas. This task does not
re-scope that work; it exists to force the **decisions** the scaffold cannot make for itself
(URL contract, partial shipping, search strategy, identity keys) into one place *before*
execution, because two of them are effectively irreversible once a translation ships and is
indexed (§13: the URL space is the public API). `audit:0007` F10 also records what does **not**
block this work: the Transformer per-textbook counter refactor (ROADMAP "Later") must not be
cited as a prerequisite - each edition already gets its own `TextbookLoader`
(`content.config.ts:100-104`), so counter state is isolated per edition and per-chapter figure
numbering is translation-stable.

## Decisions required before execution

### D1 - URL contract for translations, and what existing unprefixed URLs mean

**Question:** where does language live in the URL space, and what do today's English URLs mean
once v2 or a translation exists?

| Option | Consequence |
|---|---|
| **A.** `/{lang}/chapters/{version}/…` for non-English; English stays unprefixed | Matches `TRANSLATING.md:79` and the ROADMAP scaffold's stated assumption. Existing English URLs keep working with zero redirects. Non-English editions never get a "no-prefix" alias. |
| **B.** `/chapters/{version}/{lang}/…` | Version and language travel together; ugly for the common English case; every English URL changes shape relative to docs/promises - a §13 violation needing mass redirects. |
| **C.** Language as subdomain (`es.atlas…`) | Cleanest alternates semantics, but new DNS/TLS/deploy plumbing and a hosting decision this repo does not own today. |

**Recommendation:** A - consistent with `TRANSLATING.md`, the roadmap scaffold, and §13's
"don't break URLs already published". Sub-question folded into this decision (it is the same
contract): when v2 ships, do the version-less `/chapters/{n}/…` URLs keep meaning "latest
edition" (today's silent retarget, `audit:0007` F7), or freeze to the edition they served when
bookmarked? Recommendation: keep "latest wins" but **document it** in `ARCHITECTURE.md` and make
the redirect emit an explicit edition marker (toast/banner), because the current behaviour is
implicit and unreviewable.

**Irreversible if wrong:** §13 makes the URL space the public API. Once a translation ships and
search engines index `/{lang}/chapters/…`, changing the contract means mass 301s, hreflang
regeneration, and re-indexing - expensive, and the *published* URLs can never be unpublished.
Decided wrongly here, the cost compounds every later language added on the wrong shape.

### D2 - Partial-translation shipping policy

**Question:** can a half-translated edition exist? `audit:0007` F4: the edition is the only
shipping unit (`TextbookDefinition` = `{version, language, chapters[]}`; `loadChapter` hard-fails
on a missing tab), but translators will finish chapter 1 months before chapter 8.

| Option | Consequence |
|---|---|
| **A.** Block until the edition is complete | Simplest model; but the first language ships months late, translator motivation decays, and the documented per-chapter sign-off workflow (checkbox lists in GitHub issues) becomes a lie. |
| **B.** Ship partial, fall back to English per section | Translator sees real deployed output early; cost is a fallback semantics decision per section (and a discoverability decision: fallback pages must be `hreflang`-ed or `noindex`-ed correctly or they poison SEO for both languages). |
| **C.** Ship partial, hide untranslated sections entirely | No mixed-language pages; but navigation/TOC must then be language-aware, and readers hitting a hidden section from search get a worse 404. |

**Recommendation:** B - ship partial with per-section English fallback, with the fallback page
marked (visibly and via hreflang) so the mixed state is honest. **But implementation is deferred
until the first real translator deliverable exists** (`audit:0007` R8: do not restructure
`TextbookDefinition` into per-chapter language maps before any translator content passes
review - YAGNI, §10). The decision taken now is the *policy*; the mechanism lands with evidence
in hand.

**Irreversible if wrong:** the fallback semantics get baked into sitemaps and hreflang at the
first partial ship. "Noindex the fallback" vs "index it" is the expensive part - a language
indexed with English-fallback content is hard to un-index cleanly, and de-indexing a whole
language later forfeits its accumulated ranking.

### D3 - Search strategy for multiple languages

**Question:** one index with a language facet, or one index per language? This must be decided
*before any indexing run touches a second language*, because the naive run destroys the English
index (F2: `deleteBy` on `version` alone, `algolia.ts:145-149`).

| Option | Consequence |
|---|---|
| **A.** Single index; records gain `language`; `deleteBy` filter becomes `version + language`; `objectID` gains a language prefix | Smallest change (S, `audit:0007` R2); one search UI to wire; facet filtering keeps DocSearch simple. Index grows across languages but that is linear and cheap. |
| **B.** One index per language (index-name-per-locale env contract) | Clean isolation and per-language tuning; cost is env/schema plumbing, multi-index search UI, and a deploy that must keep N indexes in sync. |
| **C.** Accept the wipe and re-index English after Spanish each build | Rejected: the wipe is symmetric and order-dependent; a build that indexes only one language leaves the other empty - a silent search outage. |

**Recommendation:** A. The destructive window is the binding reason this decision cannot wait:
it gates the first indexing run of a second language, which is exactly the moment D1's routing
scaffold lands.

**Irreversible if wrong:** not very - index strategy can be changed later by re-indexing. But
the *destructive failure* is irreversible at run time: an English index wiped by a Spanish build
is empty until the next successful maintainer build, and users see "no results" as if the site
had no search (that failure ordering itself is task:0017's ground). Decide A before, not after,
the first multi-language indexing run.

### D4 - Glossary pipeline at five languages

**Question:** keep the hand-conversion asymmetry (translator works in a Google Doc; maintainer
converts to per-term JSON and commits - `TRANSLATING.md:114`) or move the glossary into the Docs
pipeline?

| Option | Consequence |
|---|---|
| **A.** Keep the asymmetry; fix the mechanics | Add an existence guard to `loadGlossary` (missing dir → `[]`, not ENOENT - `audit:0007` R4) and wire-or-delete the dead `glossary` collection (dead-code disposition belongs to audit 0004). Maintainer remains the sync bottleneck per language. |
| **B.** Move glossary into the Docs pipeline (task:0013 direction) | Translator-owned, no maintainer conversion step; but it couples glossary freshness to the Docs fetch and extends the loader surface before 0013's shape is known. |
| **C.** Keep as-is | At five languages the manual cost compounds (one Doc export + JSON conversion per language, per refresh) and ENOENT keeps turning "glossary not written yet" into a build break. |

**Recommendation:** A now (the guard is S and standalone-safe), with B revisited when task:0013
lands - do not pre-couple this to 0013's design. This is the lowest-stakes decision in the set;
its cost is linear, not structural.

**Irreversible if wrong:** nothing - either path is reversible; the guard in A is worth shipping
regardless.

### D5 - Timing table key for multi-language audio

**Question:** how does the read-along timing data address editions and languages?
`chapter-timing.ts:22` keys `[chapter][section]` only; F3 shows the consequence is silently
wrong narration on any non-English page once CBR files are staged.

| Option | **Consequence** |
|---|---|
| **A.** Re-key the table `[version][language][chapter][section]` | Explicit and greppable; but the table is hand-maintained in-repo and the change invalidates the external `atlas-podcast` `pipeline.py --check-remote` contract - that must be updated in the same change (`audit:0007` R6). |
| **B.** Per-section timing files named/found by a convention the resolver checks against the current textbook (the "per-section timings path" task:0016 already scopes) | Removes the hand-edited table entirely; aligns with the audio pipeline's own work - the two tasks meet at this exact point and must not build two competing conventions. |
| **C.** Stamp `.words.json` with the narration content hash and verify pairing (audit:0010 F3's fix) | Orthogonal safety property; does not by itself give language-addressing. |

**Recommendation:** B's mechanism *carrying* A's key - the per-section path owned by task:0016,
with `[version][language][chapter][section]` as its address. Coordinate the shape once with
0016 rather than letting each task pick a convention. S-to-M either way (F3).

**Irreversible if wrong:** the external contract: `atlas-podcast`'s expectations break at the
moment the key changes, so a wrong shape costs one coordinated migration across two repos -
annoying, bounded. The *silent wrong-audio* alternative (deciding nothing) is worse: readers
cannot detect it and no build error reports it.

### D6 - Canonical cross-language content key

**Question:** what is the stable key that says "this Spanish section is the same content as that
English section"? Today the only candidate is `(chapter.number, section.number)` - and
`chapter-timing.ts` already relies on it informally (F3, F6).

| Option | Consequence |
|---|---|
| **A.** Name `(chapter.number, section.number)` the canonical content key, stored on the Section at load time; URLs stay slug-based | Smallest change that unblocks hreflang alternates, translation-mapping diffs, and D5's audio pinning at once (F6: M). Renumbering an edition later invalidates stored cross-refs - but section numbering is already the de facto identity, so this makes an existing fact explicit rather than inventing one. |
| **B.** Introduce immutable content IDs through the Docs source | More robust long-term; but it reaches into the authoring surface and task:0013's source-Docs migration - too much coupling for the value today. |
| **C.** Keep deriving everything from slugs and add redirect machinery | Doesn't work across languages at all: slugs are per-language prose, so no cross-language mapping can ever exist (F6's core point). |

**Recommendation:** A.

**Irreversible if wrong:** moderately - the pair becomes the key hreflang alternates and errata
cross-references hang off. If a later edition renumbers sections, cross-refs need a mapping
table; that migration is real but writable after the fact, unlike the URL contract (D1).

**Explicitly not decisions.** The Transformer counter refactor is not a dependency (F10, ROADMAP
"Later" states this directly). The UI-string i18n extraction stays deferred per ROADMAP "Later"
(`src/i18n/strings/{lang}.ts` when hardcoded strings become a noticeable gap) - with the noted
exception that the search hierarchy label at `algolia.ts:84-90` is *indexed data*, not UI chrome,
so it belongs with D3's work. The stale `aisafetytextbook.com` domain in the `.md` endpoints
(`[section].md.ts:33`, `[chapter].md.ts:29`) is a standalone S bug fix independent of this task.

## Scope

In execution order; steps 1→2 are ordered by `audit:0007` R1 (routing first, then the
data-corrupting fixes as a fast-follow - before any non-English edition is registered, not
after):

1. **Routing scaffold** (per ROADMAP "Now", unchanged): introduce the `[lang?]` segment on
   chapter routes; dynamic `<html lang>` in both layouts; hreflang alternates in `BaseHead.astro`
   (built on D6's key); multi-language helpers in `src/lib/textbooks.ts` replacing the hardcoded
   `` `${version}-en` `` (line 8) and the two `language === 'en'` filters (lines 24, 51);
   replace `VersionSelector.astro` (edition-only today) with a language-aware switcher. English
   stays unprefixed (D1-A). Same change: parse version numbers instead of `localeCompare`
   (`textbooks.ts:25`) and store edition+language in the resume `localStorage` key (`audit:0007`
   F7).
2. **Search** (D3-A, gates the first multi-language indexing run): `algolia.ts` records carry
   `language`; `deleteBy` filter scoped to `version` + `language`; `objectID` de-conflicted by
   language prefix; the indexed hierarchy label gains the language (F9's `algolia.ts:84-90`
   belongs here, not with UI i18n).
3. **Timing key** (D5, coordinated with task:0016 - one convention across both tasks): per-section
   timings addressed by `[version][language][chapter][section]`; `resolveSectionAudio` resolves
   against the current textbook's edition+language and never falls back across languages; the
   `atlas-podcast` contract updated in the same change.
4. **Canonical content key** (D6-A): `(chapter.number, section.number)` stored on the Section;
   hreflang alternates keyed on it; no URL changes (slugs stay slug-based).
5. **Glossary mechanics** (D4-A): `loadGlossary` returns `[]` on a missing per-edition directory
   instead of throwing (`loader.ts:97`); the dead `glossary` collection wired or deleted per
   audit 0004's disposition.
6. **Partial-translation mechanism** (D2-B, only when the first translator content passes
   review): per-chapter shipping with per-section English fallback, marked per D2's
   discoverability choice. This step has a deliberate activation trigger, not a date.

Dependencies: 2 and 3 both depend on 1 (they key off the URL/routing shape). 4 feeds 1's hreflang.
5 is independent. 6 depends on 1 and on D2's policy decision, and on real translator content
existing.

## Out of scope

- **Transformer per-textbook counters** - roadmap "Later" hygiene; explicitly *not* a
  prerequisite (`audit:0007` F10). Citing it as one inflates this task's size for nothing.
- **UI-string i18n extraction** (`src/i18n/strings/{lang}.ts`) - deferred per ROADMAP "Later";
  only the Algolia hierarchy label is pulled into step 2, because it is indexed data.
- **TTS voice/economics and audio generation** - task:0016 / `audit:0009`. This task owns the
  *keying* of timings, not how audio is produced or priced.
- **R2/Algolia failure posture** - task:0017. The destructive-delete ordering (F2 vs 0010 F4)
  interacts with D3 only at the level of "the delete filter must be language-scoped"; the
  save-then-delete reordering is 0017's.
- **Discriminated-union AST refactor** - task:0015; not needed for any step here.
- **Docs-source migration** - task:0013; D4 revisits glossary ownership when it lands, but this
  task does not depend on it.
- **`.md` endpoint stale domain fix** - standalone S bug, can land independently at any time.
- **`src/` changes of any kind** until execution is authorised against the decisions above; this
  record is the gate.

## Done when

- **AC-1:** Registering a second edition/language pair in `TEXTBOOK_EDITIONS` produces served
  chapter pages under the D1-decided URL shape with the correct `<html lang>` value, while every
  URL that resolves today resolves identically after the change (English unprefixed behaviour
  unchanged; no 200→404 regressions).
- **AC-2:** Indexing two editions/languages in one build leaves the English index intact:
  records carry `language`, `deleteBy` is scoped `version`+`language`, `objectID`s do not collide
  across languages - verified by inspecting the index after a two-language indexing run
  (maintainer profile) or by an equivalent automated check.
- **AC-3:** A section whose `(version, language)` has no timing entry does not resolve an English
  CBR file or English word timings: it falls back to `publishedUrl` or ships with no player, and
  the resolution path is greppable as keyed on edition+language (`audit:0007` F3's silent path
  gone).
- **AC-4:** Every non-English section page emits hreflang alternates to its language counterparts,
  keyed via the D6 canonical pair, and the alternates resolve to live 200s.
- **AC-5:** A build with a missing per-edition glossary directory succeeds with an empty glossary
  (no ENOENT); the `glossary` collection is either consumed or removed, per a recorded
  wire-or-delete disposition.
- **AC-6:** "Latest edition" resolution parses version numbers (v10 > v2), and the reading-position
  `localStorage` entry stores edition and language alongside the URL.
- **AC-7:** The partial-translation policy decided in D2 is implemented as decided: shipping a
  partially translated edition produces the D2-chosen behaviour (fallback/marked or hidden), and
  a translator following `TRANSLATING.md` end-to-end sees their content live without any
  undocumented maintainer code change beyond the one-line `TEXTBOOK_EDITIONS` entry.
- **AC-8:** The bare-URL semantics for future editions ("latest wins" or frozen) is documented in
  `ARCHITECTURE.md` and behaves as documented, with an explicit edition marker at any retargeting
  redirect (D1's folded sub-decision).

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
| AC-8 | - |

## Authority and inputs

- `audit:0007` - Content-model fitness for multiple editions and languages (F1–F10; all
  findings this task rests on; recommendations R1/R2/R4/R6/R7/R8 shape the scope order).
- `docs/ROADMAP.md` - "Now - Locale-aware routing scaffold (English-only)" and "Cross-language
  quality answers" (this task executes their code areas and gates); "Later - Second-language
  edition", "Later - Refactor Transformer" (non-dependency, F10); "Not planned" (§14 alignment).
- `docs/PRINCIPLES.md` - §2 (fail loud: the silent wrong-audio and index-wipe paths violate it),
  §10 (YAGNI: defer D2's mechanism until content exists; the recalibration that un-deferred
  routing), §13 (the URL space is the public API - D1's irreversibility), §14 (explicit
  non-goals).
- `docs/ARCHITECTURE.md` - "Edition and language scope" section.
- `TRANSLATING.md` - the documented translator contract this task makes true (`:79` URL promise,
  `:114` glossary boundary).
- Code anchors (verified 2026-09-21 on `codebase-cleanup`): `src/content.config.ts:108`,
  `:34-35`, `:100-104`; `src/textbook-loader/index.d.ts:9-13`; `src/lib/textbooks.ts:8,24,25,51`;
  `src/textbook-loader/algolia.ts:99,121,145-153`; `src/data/chapter-timing.ts:22`;
  `src/lib/section-audio.ts:70`; `src/textbook-loader/loader.ts:97,161`;
  `src/textbook-loader/transformer.ts:110,233`; `src/layouts/Default.astro:16`,
  `Reader.astro:49`; `astro.config.mjs:9-11`; `src/components/VersionSelector.astro`;
  `src/pages/chapters/[version]/[chapter].md.ts:29`, `[section].md.ts:33`.
- Coordinated records: task:0013 (Docs migration; Algolia reindex scheduling), task:0016 (audio
  pipeline; timing-key shape), task:0015 (AST refactor; unrelated).
- `docs/lessons/0005-translation-architecture.md` - architectural conclusion stands; its line
  anchors are stale (F5), so cite the loader symbols, not the lesson's line numbers.
