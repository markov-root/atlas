---
schema_version: 2
id: "0007"
uid: "audit-20260921T150312924712Z-a7d1e2c4"
title: "Content-model fitness for multiple editions and languages"
role: audit
status: draft
summary: "Traces one chapter from data.ts to rendered page and inventories what breaks at 2 editions x 5 languages."
created: "2026-09-21"
updated: "2026-09-21"
owner: Markov Grey
supersedes: ""
superseded_by: ""
engineering_document:
  version: 1
  contract_tier: full
  role: audit
  id: "0007"
  uid: audit-20260921T150312924712Z-a7d1e2c4
  title: "Content-model fitness for multiple editions and languages"
  state: draft
  authority:
    kind: point-in-time-evidence
    owner: Markov Grey
    scope: "Content model and loader pipeline (data.ts, gdocsdk.ts, transformer.ts, loader.ts, content.config.ts, chapter routing pages, algolia.ts, section-audio, glossary) on branch codebase-cleanup as of 2026-09-21."
  created: "2026-09-21"
  updated: "2026-09-21"
  transition_history: unverified
  transitions: []
  relationships: []
  details:
    as_of: "2026-09-21"
    subjects: ["src/textbook-loader/{data,gdocsdk,transformer,loader,algolia}.ts", "src/content.config.ts", "src/lib/{textbooks,section-audio}.ts", "src/data/chapter-timing.ts", "src/pages/chapters/**", "src/pages/read/[...version].astro", "src/content/{glossary,cohorts,organizations}/"]
    method: "Causal-chain trace of one chapter (data.ts edition definition -> gdocsdk fetch/cache -> transformer -> loader -> content collection -> chapter routing pages -> rendered page), plus targeted greps for version/language literals and reads of TRANSLATING.md, docs/lessons/0005, ROADMAP.md, PRINCIPLES.md, and audits 0002-0006 for overlap."
    limitations: ["Static analysis only; no build or runtime execution permitted on this VM", "Single chapter not followed into NodeRenderer component internals (out of scope, covered by audit 0008)"]
---

# Audit 0007: Content-model fitness for multiple editions and languages

## Scope

Examined: the content pipeline from edition definition to rendered page —
`src/textbook-loader/data.ts`, `gdocsdk.ts`, `transformer.ts` (counters and glossary matching),
`loader.ts`, `src/content.config.ts`, `src/lib/textbooks.ts`, `src/lib/section-audio.ts`,
`src/data/chapter-timing.ts`, `src/textbook-loader/algolia.ts`, the chapter routing pages
(`src/pages/chapters/**`, `src/pages/read/[...version].astro`), the `.md` endpoints, the glossary
directory layout, `VersionSelector.astro`, and the workflow docs (`TRANSLATING.md`,
`docs/lessons/0005-translation-architecture.md`, `ROADMAP.md` Now/Later/Not-planned,
`PRINCIPLES.md` §13). Audits 0002–0006 were skimmed to avoid repetition.

Not examined: `NodeRenderer.astro` and node component internals (audit 0008's scope), the audio
pipeline's generation economics (audit 0009's scope), R2/upload integration (audit 0010's scope),
PDF renderer internals, the courses/teach pipeline beyond collection consumption.

## Method

1. Read the causal chain in source order: `data.ts` → `gdocsdk.ts` → `transformer.ts` →
   `loader.ts` → `content.config.ts` → `textbooks.ts` → chapter/read routing pages →
   `algolia.ts` / `section-audio.ts` / `chapter-timing.ts`.
2. At each hop, asked: what does a second edition (v2) and a second language (v1-es) require
   here? Answered with `file:line` evidence, not inference.
3. Targeted greps for hardcoded literals: `rg "'en'|\"en\"|-en|\bv1\b"` across `src`; checked
   each hit for whether it is an edition/language assumption or a false positive (e.g.
   `gdocsdk.ts:28` `version: "v1"` is the Google Docs API version, not an edition).
4. Read the project's own decisions first (`TRANSLATING.md`, `docs/lessons/0005`,
   `ROADMAP.md`, `PRINCIPLES.md` §13) and checked each roadmap claim against the code.
5. No builds, no tests, no git state changes. Read-only except this record.

## Findings

### F1 — Language does not exist in the URL space or the content layer; a translation has nowhere to live today

_Observation._ Every route that serves chapter content is keyed by edition version only:
`/chapters/{version}/{chapter}/{section}` (`src/pages/chapters/[version]/[chapter]/[section].astro:20-45`,
`[...version].astro` in `src/pages/read/`). No route carries a language segment. The data-access
layer is English-locked in three places: `src/lib/textbooks.ts:8` resolves by hardcoded entry id
`` `${version}-en` ``, `src/lib/textbooks.ts:24` (`getLatestTextbook`) and
`src/lib/textbooks.ts:51` (`getTextbooks`) both filter `t.data.language === 'en'` — and every
page's `getStaticPaths` goes through `getTextbooks()`, so a non-English edition registered in
`TEXTBOOK_EDITIONS` would be silently invisible to the whole site. Both layouts hardcode
`<html lang="en">` (`src/layouts/Default.astro:16`, `src/layouts/Reader.astro:49`).
Meanwhile the documented translator contract promises the opposite: `TRANSLATING.md` (root,
"Register the translated chapters", step 4) states "From the next deploy, your translation appears
at `/{lang}/chapters/v1/...`".

_Inference._ The gap between the documented workflow and the code is the single largest blocker in
this scope: a translator who completes the documented process produces content the build cannot
serve. `ROADMAP.md` "Now — Locale-aware routing scaffold (English-only)" already scopes the
`[lang?]` segment, dynamic `<html lang>`, hreflang, and dropping the `.filter(language === 'en')`,
so the core routing gap is _known_ — I flag it as the dependency root for F2, F3, F4 and F6 rather
than as news. One roadmap claim does not match the code: the scaffold section says the language
switcher is "already implemented dormant", but the only selector component,
`src/components/VersionSelector.astro`, lists editions (`versions` from `getTextbooks()`, display
`Edition {n}`) and navigates to `/read/{version}` — it has no language dimension at all. When the
scaffold lands, that component needs replacing, not toggling.

### F2 — Search is single-language by construction, and indexing a second language would destroy the English index

_Observation._ Algolia indexing uses one index name from env
(`src/content.config.ts:90-97`, `PUBLIC_ALGOLIA_INDEX_NAME`), and records carry no language
field: `textbookToRecords` sets only `version: textbook.version`
(`src/textbook-loader/algolia.ts:80-91,109-116`) and `objectID`/`url` are the bare section URL
(`/chapters/{version}/{chapter}/{section}`, `algolia.ts:73-80`) — which has no language segment
(F1). `indexTextbook` first deletes existing records for the _version_, then saves:
`client.deleteBy({ filters: `version:${textbook.version}` })`
(`src/textbook-loader/algolia.ts:145-149`).

_Inference._ Register `v1-es` and the first build that indexes it deletes _every_ record with
`version:v1` — the English records — then writes only the Spanish ones. The wipe is symmetric and
whichever textbook indexes last wins. Even without the wipe, a Spanish section whose slug
collides with an English slug (same `objectID`) would silently overwrite it. The "Now" routing
scaffold's code-area list (`ROADMAP.md` line 54) names routing, `textbooks.ts`, layouts, and
`BaseHead.astro` — it does not name `algolia.ts`. Following the roadmap literally would ship a
scaffold that makes Spanish buildable and search-corrupting in the same commit. Smallest fix:
make the record carry `language`, key the deleteBy filter on `version` + `language`, and include
language in the objectID (or per-language index names) — S-sized, but it must be decided with the
routing scaffold, not after it.

### F3 — The word-timing audio pin is keyed by chapter and section number only, so any second edition or language silently gets English narration

_Observation._ `src/data/chapter-timing.ts:19` declares
`chapterTimings: Record<number, Record<number, SectionTiming>>` — chapter number → section
number → {local CBR mp3, words json, published mp3}. No version or language dimension.
`resolveSectionAudio(chapterNumber, sectionNumber, publishedAudioUrl)`
(`src/lib/section-audio.ts:60-77`) is called with exactly those two numbers from the section page
(`[section].astro:41`) and _prefers_ the locally staged CBR file (`timing.audioUrl`, e.g.
`/audio/ch1/ch1-s1.mp3`) whenever it exists on disk. Chapter 1 section 1 of a v2 edition or a
Spanish edition resolves to the same `/audio/ch1/ch1-s1.mp3` with the same English word timings.

_Inference._ The English page's read-along would silently play on Spanish v1 pages the moment a
Spanish chapter exists and a contributor/maintainer build has the CBR files staged — wrong
narration, wrong sync offsets, no error anywhere. The `publishedUrl` fallback is text-hash-keyed
(so a build with credentials would resolve the Spanish `section.audioLink` correctly), but the
CBR preference path never consults language. This is the (chapter number, section number) pair
acting as the de facto global content identity — the only key in the codebase that is stable
across editions and languages (F6 shows slugs are not). Audit 0009 owns audio economics; the
multi-edition dimension of the timing table belongs here. Smallest fix is a table key of
`[version][language][chapter][section]` or a filename convention the resolver checks against the
current textbook — S to M.

### F4 — The edition is the only unit of shipping, so a partial translation cannot exist

_Observation._ `TextbookDefinition` is `{ version, language, chapters[] }`
(`src/textbook-loader/index.d.ts:16-20`) — language and chapter set are properties of one
monolithic entry. `loadChapter` hard-fails on a missing tab:
`throw new Error("Could not find tab ...")` (`src/textbook-loader/gdocsdk.ts:81-83`), and
`loader.ts:57-61` iterates the full chapter list. Nothing in the model can express "v1-es has
chapters 1–3 translated, 4–8 not yet". `TRANSLATING.md`'s workflow is chapter-by-chapter with
per-chapter sign-off ("Track your progress in the GitHub issue (a simple checkbox list per
chapter works)"), but its registration step assumes the whole edition lands as one
`TextbookDefinition`.

_Inference._ Translation is a long-tail human process — a translator will have chapter 1 ready
months before chapter 8 — but the content model forces an all-or-nothing launch per language.
The workaround today would be registering `v1-es` with a hand-trimmed `chapters` array, which
misstates the semantics (that entry _is_ "edition v1 in Spanish", complete or not) and collides
with `getTextbook`'s id scheme when the rest lands. This is the clearest case where the edition
is the _wrong_ unit: the natural unit for partial-translation shipping is the chapter with a
per-chapter language/fallback, i.e. exactly the discriminated-union/lazy-loading direction the
roadmap's "Later" already gestures at for AST nodes. Re-pointing `getStaticPaths` to skip
missing chapters would be enough for a first partial ship — but only after F1's routing exists.

### F5 — The glossary exists twice, and only the version nobody consumes is language-ready

_Observation._ There are two glossary systems. (a) The Astro content collection
`glossary` (`src/content.config.ts:44-52`) globs `**/*.json` over `./src/content/glossary` —
which today contains only `v1-en/` (directory listing). A repo-wide search finds **no** consumer
of `getCollection('glossary')` or `getEntry('glossary', ...)` anywhere in `src/`. (b) The loader
reads the same files directly from disk with the edition-scoped path
`src/content/glossary/${version}-${language}/` (`src/textbook-loader/loader.ts:96-105`), and the
result is passed into the `Transformer` for term matching (`loader.ts:142`,
`transformer.ts:599-650`). Two consequences with evidence: `loadGlossary` calls `readdir`
with no existence guard (`loader.ts:99`), so registering a new edition before its glossary
directory is committed fails the build with `ENOENT`; and the collection definition, if ever
consumed (the roadmap's planned refactor), would return terms from _all_ languages flattened
with path-derived ids, mixing Spanish and English terms in one query result.

_Inference._ The dead collection is a decoy: it looks like the glossary's public interface but
isn't wired to anything, and its unscoped glob is wrong for a multi-language corpus. The working
path (b) is per-edition correctly, but has two frictions at 5 languages: the hard ENOENT failure
turns "translator hasn't produced a glossary yet" into a build break rather than an empty
glossary; and `docs/lessons/0005-translation-architecture.md` still describes the path as
`src/data/${version}-${language}/glossary/*.json` and the loader lines as `loader.ts:72-105` —
the refactor moved the directory and shifted the lines, so the lesson's anchors are stale (the
architectural conclusion stands; the evidence pointers don't). Smallest fix: guard
`loadGlossary` to return `[]` on a missing directory, and either wire or delete the collection
definition — S.

### F6 — Slugs are derived from prose, so the URL space has no language-stable content key, and there is no redirect machinery to absorb the churn

_Observation._ Every content slug is derived from the document text at transform time:
heading slugs are `slugify` of the heading text (`src/textbook-loader/transformer.ts:110`),
chapter and section slugs are `slugify` of the title (`transformer.ts:233`, `loader.ts:161`).
Titles are prose — which means they are exactly what a translator rewrites and what an author
edits mid-lifecycle. The whole URL space (`/chapters/{version}/{chapter}/{section}`, plus
anchors) is therefore keyed on mutable, per-language prose. The only redirect machinery in the
project is a single static entry `'/chapters': '/read'` (`astro.config.mjs:9-11`); PRINCIPLES
§13 says "if you rename a chapter slug or restructure the URL space, add a redirect", but there
is no mechanism that would notice or record a slug change.

_Inference._ Two distinct costs. (1) Per edition: every title or heading edit can silently move
published URLs and break inbound links/anchors with no detection — today this is latent; with
Edition 2 being written while Edition 1 is published, it becomes live. (2) Across languages: no
two languages share a URL for "the same section", so nothing can express "this anchor in the
Spanish edition corresponds to that anchor in English" — yet such correspondence is needed for
hreflang alternates (roadmap Now), translator review diffs, and errata cross-reference. The only
key stable across editions and languages is `(chapter.number, section.number)` — and F3 shows
`chapter-timing.ts` already relies on exactly that, informally. Naming that pair as the canonical
content key (URLs stay slug-based; the pair becomes the cross-reference key stored on the
Section) is the smallest change that unblocks hreflang, translation mapping, and audio pinning
at once — M.

### F7 — "Latest edition wins" is silently baked into several routes; v2 landing will re-target published URLs and mis-sort at v10

_Observation._ Three places resolve to "the latest textbook" by sorting version strings:
`getLatestTextbook` sorts by `b.data.version.localeCompare(a.data.version)`
(`src/lib/textbooks.ts:25`); the legacy chapter routes `/{chapter}` and `/{chapter}/{section}`
are built _only_ from `sorted[0]` — the latest edition — and 301-redirect into it
(`src/pages/chapters/[chapter]/index.astro:14-33`); `getFirstChapterUrl` uses latest
(`textbooks.ts:37-48`). The version-less `/read` path serves latest
(`src/pages/read/[...version].astro:19-32`). Separately, the resume feature persists a raw URL
in `localStorage['atlas-reading-position']` (`src/lib/reader.ts:176-178`, applied by the script
in `read/[...version].astro`) with no edition awareness.

_Inference._ When v2 ships, the bare `/chapters/1/...` routes that are published today (the
non-versioned path variants exist for a reason: people bookmark them) will silently start
redirecting to v2's chapter 1 — the reader asked for a URL that used to mean v1 and gets v2
content with no edition marker at the point of the redirect. Whether that is _desired_ ("bare
URLs always mean current edition") is a product decision, but it is currently implicit and
undocumented. Secondary: string `localeCompare` breaks at two-digit versions — `"v10" <
"v2"` — so the day a v10 exists, `getLatestTextbook` returns v2..v9-era logic errors; trivial
today, but the sort should parse the number when v2 lands (S, fix with F6's canonical work).
The resume key should at minimum store edition+language alongside the URL so a reader resuming
after a language switch doesn't get silently dropped into the other language's last page (S).

### F8 — The committed doc cache scales linearly and refresh is a manual maintainer ritual; each added language multiplies the sync bottleneck

_Observation._ `.cache/docs/` holds one JSON file per chapter tab — 8 tabs, 8.7 MB, committed
(git ls-files: 9 entries incl. README). Size is ~1.1 MB per chapter tab, so 2 editions × 5
languages ≈ 40 tabs ≈ ~44 MB of committed JSON, with a git-diff blob per content refresh. The
cache key is `docId:tabId` (`src/textbook-loader/gdocsdk.ts:27`) with **no freshness metadata**
(no timestamp/source rev), and `fetchDoc` returns a cached document unconditionally when present
(`gdocsdk.ts:30-47`) — the only invalidation is the maintainer running
`rm -rf .cache/docs/* && pnpm build` (`.cache/docs/README.md`, "Refreshing the cache"), and the
planned nightly `content-refresh.yml` CI is recorded in that README as "not yet in place". The
README also mandates a manual secret-scan over the cache before every commit.

_Inference._ At v1-en this is a manageable ritual; at 2×5 the maintainer becomes the only
synchronization point for 40 live Google Docs plus per-language glossary conversion, and the
cost of the cache being stale is a _wrong_ published edition (content silently lags the Doc),
not a failed build. Note what _does_ scale fine, for balance: image assets are content-hashed
into a flat shared `src/assets/uc/` (203 MB, uncommitted — regenerated by maintainer builds),
so editions and languages share deduplicated images with no changes needed. The smallest real
mitigations are the already-planned nightly refresh CI (Track B) and stamping each cached tab
with a fetch timestamp so staleness becomes observable rather than ritual-dependent — both S
once someone owns them; neither is blocked on anything else in this audit.

### F9 — A stale domain is hardcoded into the machine-readable markdown export, and the English UI-string layer is scattered

_Observation._ The `.md` endpoints that produce the site's public markdown contract hardcode the
canonical base URL `https://aisafetytextbook.com` (`src/pages/chapters/[version]/[chapter]/[section].md.ts:35`,
`[chapter].md.ts:29`) while the site config and astro.config agree the live domain is
`ai-safety-atlas.com` (`src/config/site.ts:2-3`, `astro.config.mjs:6`). Separately, English
surface strings are hardcoded across the render layer: search hierarchy labels
(`"Chapter ${chapter.number}: ..."` at `src/textbook-loader/algolia.ts:84-90`), the edition
selector (`"Edition ${num}"`, `VersionSelector.astro:31-33`), and page templates
(`"Chapter"`, `"Written by"`, `"Acknowledgements"` in `[section].astro:122-127,340`, the entire
TOC/read chrome in `read/[...version].astro`).

_Inference._ The stale domain is a plain bug in the export/citation contract — every
machine-consumed markdown file advertises a dead canonical URL; fix is S and independent of
everything else here. The UI strings are a known, deferred cost: `ROADMAP.md` "Later — Second-
language edition" explicitly defers `src/i18n/strings/{lang}.ts` extraction "if the in-component
hardcoded strings become a noticeable gap" — that calibration is reasonable and I do not
countermand it; the only adjustment worth making is that `algolia.ts:84` is not UI chrome but
_indexed data_ (the lvl0 hierarchy label stored on every search record), so it belongs with F2's
search work, not with the Later i18n extraction.

### F10 — The Transformer's per-textbook counters do NOT block multi-edition work; the roadmap's Later item is cleanliness, not a prerequisite

_Observation._ `content.config.ts:84-88` constructs a **separate `TextbookLoader` per edition**
inside the collection loader, and each loader owns its own `textbookCounts` map
(`src/textbook-loader/loader.ts:25,37`); chapters within one edition share that map via a new
`Transformer` per chapter (`loader.ts:142`). So two editions (or two languages) loading in one
build each get independent counter state — no cross-edition interference is possible in the
current structure. The counters' consumers confirm the per-chapter scope is what matters:
rendered labels use `chapterNumber` + `inChapter` only (`Figure.astro:25`, `Definition.astro:15`,
`markdown-renderer.ts:8-14`, `audio/text-renderer.ts:51-56`); `inTextbook` and `inSection` are
computed and carried on every node but consumed by no label path.

_Inference._ The audit brief asked whether the mutable state blocks multi-edition/multi-language
work specifically: it does not — the per-edition instance boundary already provides isolation,
and figure numbering per chapter is translation-stable (a Spanish chapter renumbers its own
figures). The roadmap "Later" item (remove per-textbook mutable state) remains worth doing as
hygiene, and the unused `inTextbook`/`inSection` halves of `InstanceCount` are dead weight
carried into serialized nodes and the audio/markdown renderers — but nothing here should gate
Edition 2 or translations. Stated explicitly so its priority is not inflated by this audit's
theme.

## Limitations

1. **Static analysis only.** No build or runtime execution was permitted on this VM, so nothing
   here was observed running: the Algolia cross-language wipe (F2) and the wrong-language audio
   pin (F3) are code-path deductions, not reproduced incidents. Both are high-confidence from
   the code, but a reviewer should treat them as "will happen on first contact", verified only
   by construction.
2. **One chapter was traced, not eight.** The causal chain was followed end to end for the
   pipeline generally, with `data.ts` read fully; I did not verify chapter-by-chapter that all 8
   chapters' `tabId`s behave identically (7 use `t.0`, one uses `t.2iafmf6rj9gc` —
   `data.ts:30,71`). Chapter 3's non-default tab is the only structural outlier and I did not
   probe why.
3. **Line anchors drift.** I checked every cited anchor against the working tree at write time,
   but this branch is under active multi-agent audit; line numbers may shift before review.
   Function/identifier names in each anchor are the durable reference.
4. **I could not establish** how the R2 audio CDN resolves `section.audioLink` per language
   (`loader.ts:73-82` runs the audio renderer per textbook, so a Spanish edition gets its own
   render pass — but whether the published URL namespace collides across languages is audit
   0009's ground, and I stopped at the boundary).
5. **Method flaw noticed late:** my first pass over hardcoded literals filtered grep hits with a
   hand-written noise regex (`listen`, `content:`, …), which could have silently eaten a real
   finding. A second pass over the remaining hits (`rg "'en'|-en\b"`) surfaced the ones reported
   in F1/F9; a third-plausible class I did _not_ exhaustively check is non-Latin language codes
   appearing as substrings (e.g. `de`, `fr`) inside unrelated identifiers — so absence of other
   language literals is claimed only for `en`/`v1`, not for all codes.
6. **`contentHash` semantics unverified** for cross-edition use: the report form and
   `SectionFeedback` carry `chapter.contentHash` (whole-chapter hash, `loader.ts:164`), which is
   edition-specific by construction; whether the feedback backend keys on it correctly across
   editions was out of reach without the backend (audit 0010's scope).

## Recommendations

Priority order; sizes: S < 1 session, M 1–2, L multi-session. "Risk" = what the change could
break if rushed.

1. **(M, do first, decide with #2)** Land the locale-aware routing scaffold exactly as scoped in
   `ROADMAP.md` "Now", _plus_ the two subsystems its code-area list omits: `algolia.ts` (F2) and
   the chapter-timing key (F3). Risk: routing changes touch every chapter page's
   `getStaticPaths`; landing search/audio fixes in the same PR keeps the first Spanish build
   from corrupting the index or playing English audio, but makes the PR bigger — the split
   point is routing-only first, then F2/F3 in a fast-follow _before_ any non-English edition is
   registered, not after.
2. **(S, ship with #1)** Add `language` to Algolia records, scope the `deleteBy` filter to
   `version` + `language`, and de-conflict `objectID` (language prefix or per-language index).
   Risk: low; a re-index from the next build repopulates everything.
3. **(S, standalone-safe)** Fix the hardcoded `aisafetytextbook.com` domain in both `.md`
   endpoints (F9) to use `siteConfig`. Risk: none; independent.
4. **(S, standalone-safe)** Guard `loadGlossary` to return `[]` when the per-edition glossary
   directory is missing (F5). Risk: none; converts a build break into an empty glossary, which
   is the correct semantics for a translation in progress. Do NOT delete the dead `glossary`
   collection in the same change — decide wire-vs-delete separately (audit 0004 owns dead-code
   disposition).
5. **(S, standalone-safe)** Stamp each `.cache/docs/` entry with a fetch timestamp, and get the
   planned nightly content-refresh CI unstuck (F8). Risk: cache format change forces one
   re-fetch; coordinate with the maintainer's next refresh.
6. **(M, decide with #1)** Name `(chapter.number, section.number)` the canonical cross-language
   content key and re-key `chapter-timing.ts` on `[version][language][chapter][section]` (F3,
   F6). Risk: touching the timing table's shape invalidates `pipeline.py --check-remote`
   expectations in the external `atlas-podcast` repo — that contract must be updated in the
   same change.
7. **(S, standalone-safe)** Parse version numbers instead of `localeCompare` for "latest"
   resolution, and store edition+language in the resume `localStorage` key (F7). Risk: trivial.
8. **(Do not do now)** Do not pre-build the UI-strings i18n layer, do not restructure
   `TextbookDefinition` into per-chapter language maps before any translator content exists
   (F4's partial-ship need is real but the discriminated-union direction in ROADMAP "Later" is
   the right vehicle — revisit when a translator's first chapters actually pass review), and do
   not remove the Transformer counters (F10) as part of this work — all three have explicitly
   deferred homes in the roadmap and forcing them now is YAGNI against PRINCIPLES §10.

## Disposition

Pending owner decision.

- Safe standalone: #3, #4, #5, #7 (and #2 if #1's routing already landed).
- Must be decided together: #1 + #2 + #6 (routing, search, and content-keying are one contract
  change to the URL/content identity), with F4's partial-translation model deliberately deferred
  until a real translator deliverable exists.
- Roadmap updates this audit implies (per the shared brief's known tension): the "Locale-aware
  routing scaffold" code-area list should gain `algolia.ts` and `chapter-timing.ts`; the claim
  that a language switcher is "already implemented dormant" should be corrected
  (`VersionSelector.astro` is edition-only); "Later — Second-language edition" should note the
  partial-edition gap (F4); "Not planned — No certification program" needs no change for
  quizzes/flashcards as _content types_, but the roadmap entry should be revisited when those
  types are scoped (that tension is audit 0008's ground, noted here only for completeness).
