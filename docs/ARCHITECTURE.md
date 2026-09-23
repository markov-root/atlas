---
specification:
  version: 2
  id: architecture
  summary: >-
    How the build pipeline, BuildMode, and the Astro layer fit together — including
    configuration precedence, per-stage failure semantics, mode boundaries, and edition scope.
  status: current
  owner: Markov Grey
  updated: '2026-09-21'
---

# Architecture

AI Safety Atlas is an Astro static site whose content is generated from Google Docs at build time. This document explains the pipeline.

**How to read this document.** Most sections are explanatory — they describe how the pieces fit and why they are built this way. Four sections are normative and state behaviour precisely enough that two reviewers should reach the same conformance verdict on any boundary case: **Configuration precedence**, **Failure semantics by stage**, **Mode boundaries**, and **Edition and language scope**. Every behavioural claim carries a symbol anchor (`fetchDoc`, `detectBuildMode`, …) so it can be checked against the code directly. Where current behaviour is flagged as a defect in `docs/audits/`, this document says so rather than describing the intended behaviour as if it were the real one.

## High-level flow

```
                                   ┌─────────────────────────┐
                                   │  TEXTBOOK_EDITIONS       │
                                   │  (src/textbook-loader/   │
                                   │  data.ts)                │
                                   └─────────────┬───────────┘
                                                 │
       ┌─────────────────────┐                   │
       │  detectBuildMode()  │◄──── env vars     │
       │  src/lib/           │                   │
       │  build-mode.ts      │                   │
       └─────────────────────┘                   │
                  │                              │
                  │ BuildMode                    ▼
                  ▼                  ┌─────────────────────────┐
       ┌─────────────────────┐       │   TextbookLoader.load()  │
       │ content.config.ts   │──────▶│                          │
       │                     │       │   for each chapter:      │
       │ - reads env         │       │     DocsSDK.fetchDoc()   │
       │ - detects mode      │       │     Transformer.         │
       │ - prints banner     │       │       transformChapter() │
       │ - bridges env       │       │   linkSections()         │
       │ - calls loader      │       │   ChapterPdfRenderer     │
       │ - indexes Algolia   │       │   AudioRenderer          │
       └─────────────────────┘       └─────────────┬───────────┘
                                                   │
                                          Textbook (AST)
                                                   │
                                                   ▼
                                     ┌─────────────────────────┐
                                     │  Astro page templates    │
                                     │  src/pages/chapters/     │
                                     │  + components/nodes/     │
                                     └─────────────┬───────────┘
                                                   │
                                                   ▼
                                                  dist/
```

## Repo layout

```
atlas/
├── src/
│   ├── pages/             # Astro routes (.astro files become pages)
│   │   ├── chapters/      # [version]/[chapter]/[section] + unversioned [chapter]/...
│   │   └── read/          # [...version].astro — top-level table of contents
│   ├── components/        # Astro components (nodes/, brand/, AlgoliaSearch, ...)
│   ├── layouts/           # Page layouts (Default, Reader)
│   ├── content.config.ts  # Astro content collections + BuildMode entry point
│   ├── content/           # Static content collections: cohorts/, glossary/, organizations/
│   ├── config/            # site.ts — site-wide constants
│   ├── data/              # chapter-timing.ts — read-along audio/timing pins (English-only today)
│   ├── fonts/             # Self-hosted TTFs (Jost, Righteous) used by Typst
│   ├── lib/
│   │   ├── build-mode.ts  # Env-mode detection (single source of truth)
│   │   ├── textbooks.ts   # Data access over the textbooks collection (build-time)
│   │   ├── section-audio.ts, follow-scroll.ts, sentences.ts, og.ts, ...   # mixed — see note below
│   │   └── word-highlight.ts, audio-player.ts, word-align.ts, reader.ts, ...  # Browser-runtime modules
│   ├── textbook-loader/   # Content pipeline (Google Docs → AST → web/PDF/audio)
│   │   ├── data.ts        # Edition + chapter definitions (docIds, authors)
│   │   ├── loader.ts      # TextbookLoader.load()
│   │   ├── gdocsdk.ts     # Google Docs API + caching layer
│   │   ├── transformer.ts # Doc JSON → custom AST
│   │   ├── algolia.ts     # DocSearch record extraction + indexing
│   │   └── renderers/     # pdf/ (Typst), audio/ (ElevenLabs + R2), markdown-renderer
│   │   └── citations/     # Citation extraction — the TypeScript half (see below)
│   ├── styles/            # Global Tailwind setup
│   └── assets/uc/         # Downloaded chapter images (gitignored, regenerated)
├── cli/                   # `atlas` maintainer commands (docs check, citations scan, dispatch)
├── python/
│   ├── atlas_citations/   # Citation resolvers, CSL store, BibTeX/report export
│   └── tests/             # pytest suite, run by `pnpm test:py` inside `pnpm verify`
├── data/citations/        # sources.yaml is COMMITTED; every other output is derived
├── .cache/
│   ├── docs/              # COMMITTED snapshot of parsed Google Docs (~8.7MB)
│   └── uc/, audio-chunks/, equation-descriptions/   # Build artifacts (gitignored)
├── tests/
│   ├── smoke/             # End-to-end build smoke tests (opt-in)
│   └── a11y/              # Accessibility tests (opt-in, excluded from default run)
├── astro.config.mjs       # Astro config + env schema
├── vitest.config.ts       # Test runner config
└── pnpm-workspace.yaml    # pnpm build-script allow-list
```

### The bibliography is two languages

The citation pipeline is the one part of this repo that is not TypeScript, and the split is
deliberate rather than accidental (`task:0029`). The boundary is a file:

```
TypeScript   Google Docs → AST → `atlas citations scan` → data/citations/citations.json
Python       citations.json ─┬→ resolve ─→ data/citations/sources.yaml
                             └→ overrides.yaml (reviewed, hand-written, wins)
                                          → bibliography.bib / .json, reports, per-chapter Markdown
                                          → rendered.json (945 sources × 5 CSL styles)
```

**TypeScript owns identity and extraction; Python owns metadata and output.** Extraction walks the
AST, so it has to live where the AST is, and URL canonicalization goes with it because that is where
entry identity is minted (`task:0021` D1). Everything downstream — resolvers, the CSL model, BibTeX —
takes a URL and returns metadata, and has no tie to either language; it sits in Python because that
is where the bibliography libraries are. The cost of pretending otherwise was a hand-rolled BibTeX
serializer that shipped a structural bug across 303 entries.

### Where citation metadata comes from

Eight resolvers, tried in a fixed order (`resolvers/base.py`, `RESOLVER_ORDER`): the local
research-database corpus, arXiv, Crossref, ForumMagnum (LessWrong / EA Forum / Alignment Forum),
publisher `citation_*` meta tags, YouTube oEmbed, Open Graph, and the Internet Archive last of all.
Local and free first, networked after; each declines what is not its business.

Two properties of that chain are load-bearing and easy to break:

- **A decline and a failure are different answers** (`audit:0011` F12, `task:0032` AC-1). A resolver
  returns `Unreachable(reason)` when it could not ask, and a _selective_ resolver that could not be
  reached stops the chain rather than letting a weaker one answer in its place. Conflating the two is
  what let one transient arXiv failure permanently record a 1,158-author paper with zero authors.
- **`research-db` and `opengraph` claim every URL**, so their claim carries no authority and they get
  no veto. That is exactly what keeps `task:0027` AC-6 true: the bibliography is identical when the
  research-database service is down.

**Where no API can answer, a human does.** `data/citations/overrides.yaml` is reviewed, hand-written,
committed, and outranks every resolver; `atlas citations propose` gathers the evidence for filling it
(a PDF's first page, a page's meta tags, the sections citing it). `task:0032` D2 and D3 record the
two ways of closing that gap automatically that were built, measured and rejected — both produce
entries that look resolved and are wrong.

None of this is in the site build's path. `pnpm dev`, `pnpm build` and `pnpm test` never touch
Python; only `pnpm verify` and the `atlas citations` verbs do. `bin/atlas` stays a logic-free
adapter — `cli/index.ts` dispatches to `uv`, so the split is invisible at the command line.

Note that `src/lib/` mixes build-time modules (`build-mode.ts`, `textbooks.ts`) and browser-runtime modules (`word-highlight.ts`, `audio-player.ts`, …) with no marker separating them — flagged in `audit:0002` F2; nothing in the tree yet signals which constraint a module runs under.

## BuildMode — the single source of truth

`src/lib/build-mode.ts` exports a pure function `detectBuildMode(env)` that returns a typed object:

```ts
export interface BuildMode {
  hasGoogleCreds: boolean;
  hasAlgoliaWrite: boolean;
  hasR2Creds: boolean;
  generatePdf: boolean;
  generateAudio: boolean;
  downloadAudio: boolean;
  uploadAudio: boolean;
  indexAlgolia: boolean;
  fetchFromGoogleDocs: boolean;
  summary: string;
}
```

This is the **only** place that interprets env vars to decide what the build should do. `content.config.ts` calls `detectBuildMode` once at startup, prints the resolved mode as a banner, and either passes the flags to downstream code or bridges them to `process.env` for renderers that haven't migrated to receiving the mode directly.

Why this matters: if you want to change build behaviour based on credentials, you change `build-mode.ts`. You do not grep for `process.env.SKIP_PDF` across 12 files.

### The two modes in practice

- **Contributor** — no `GOOGLE_CREDENTIALS_BASE64`. Loader runs in `cacheOnly` mode and reads from `.cache/docs/`. PDF and audio generation are skipped. Algolia search renders (using committed public keys) but the index is not refreshed.
- **Maintainer** — credentials present. Loader fetches fresh content from Google Docs, downloads images, regenerates PDFs and audio, uploads to R2, re-indexes Algolia.

The transition between modes is automatic. There is no `--contributor` flag.

|                  | Contributor mode               | Maintainer mode                   |
| ---------------- | ------------------------------ | --------------------------------- |
| `.env` required  | No                             | Yes (`GOOGLE_CREDENTIALS_BASE64`) |
| Chapter text     | ✓ from committed cache         | ✓ fresh from Google Docs          |
| Figure images    | Captions only                  | ✓ downloaded fresh                |
| Algolia search   | ✓ works (public keys baked in) | ✓ works + indexes fresh content   |
| PDF generation   | Skipped                        | ✓ via Typst                       |
| Audio generation | Skipped                        | ✓ via ElevenLabs + Gemini         |
| R2 upload        | Skipped                        | ✓ for PDFs and audio              |

A startup banner declares the resolved mode:

```
[atlas] BuildMode: contributor, cache-only, no PDF, no audio, no R2 audio pull, no Algolia indexing, search enabled
```

There is a third, implicit profile: a **maintainer dev build** (`NODE_ENV=development` with credentials present). `detectBuildMode` forces `downloadAudio` and `uploadAudio` to false in dev regardless of R2 creds, which prevents the "started a dev server and it pulled N MP3s from R2" footgun; `skipPdf`/`skipAudio` still respect `SKIP_PDF`/`SKIP_AUDIO`.

## Configuration precedence

Normative. Four layers read configuration; when they disagree, the following rules decide.

1. **The typed env schema is the declared surface.** `astro.config.mjs` `env.schema` declares 13 variables. All secrets are `optional: true` (absent → `undefined`, which is how contributor mode falls out); the three public Algolia variables have committed defaults, so the search UI works with no `.env` at all.
2. **`detectBuildMode` is the only decision-maker.** `content.config.ts` imports the schema values, runs `detectBuildMode` once, prints `mode.summary` as the banner, and hands the mode to the loader (`cacheOnly: !mode.fetchFromGoogleDocs`) and the Algolia gate (`mode.indexAlgolia`). No other module is permitted to interpret credentials to decide build behaviour — this is stated in the `build-mode.ts` docstring.
3. **Bridging is one-way and additive.** `content.config.ts` copies `ELEVENLABS_API_KEY`, `GEMINI_API_KEY`, and the four R2 variables from the schema scope into `process.env`, because the audio renderer and `r2-cache.ts` still read raw `process.env` (`getR2Config`, audio `Renderer` constructor). It sets a variable only when the schema value is present and never clears one. `SKIP_PDF` and `SKIP_AUDIO` are the inverse case: `content.config.ts` **writes** them (as `'1'`) whenever BuildMode disables PDF/audio generation. For these two flags, BuildMode's decision overrides any pre-set raw value and is the effective source — the `process.env` reads in `loader.ts` are downstream echoes, not independent inputs.
4. **Four variables bypass both the schema and BuildMode** (`audit:0010` F5): `ELEVENLABS_VOICE_ID` and `ELEVENLABS_MODEL_ID` (read at module load in `elevenlabs-tts.ts`, with hardcoded defaults `'JBFqnCBsd6RMkjVDRZzb'` = "George" and `'eleven_turbo_v2_5'`), `GEMINI_TTS_MODEL` (read in the dormant `gemini-tts.ts`), and `SKIP_AUDIO_DOWNLOAD` (read in the audio `Renderer.render`). A typo in any of these names silently falls back to the default, and nothing in the banner reports the effective voice/model.

Reviewer rule of thumb: to determine what a build will do, read the banner first — `BuildMode.summary` is authoritative for everything except the four bypassing variables in rule 4, which are the one place it is not.

## Editorial surface — why Google Docs

The textbook prose lives in eight private Google Docs — one per chapter; the `docId`+`tabId` pair in each `ChapterDefinition` is the cache key. The build authenticates with a service-account key (`GOOGLE_CREDENTIALS_BASE64`), fetches each tab as a structured document, and transforms it into our AST.

**Why Google Docs specifically:**

- The authors (researchers across CeSIA, partners, occasional external contributors) are comfortable in Google Docs. Inline comments, real-time co-editing, suggested-edits review, and the comment-thread workflow are all already familiar.
- The structured-document API gives us paragraph spans, headings, tables, footnotes, equations, and inline images without us having to define an editor.
- Versioning and access control come for free (revision history, share-link permissions, view-only mode for reviewers).

**Alternatives considered and rejected:**

- **MDX / markdown files in the repo.** Cheapest infrastructure but requires every contributing author to learn Git + markdown + a markup dialect for callouts/footnotes/equations. We'd lose comment threads. Hard rejection — would slow the editorial loop.
- **A headless CMS (Sanity, Notion).** Worth re-evaluating in 12+ months, but for 8 chapters and ~4 authors the additional service is unjustified.
- **Self-hosted CMS.** Adds an ops surface we don't want.

This decision is load-bearing on the contributor-mode work — because the editorial source isn't in the repo, contributors need _some_ representation of the textbook (the committed cache) to build the site. See "The committed cache" below.

## Content pipeline

### `src/textbook-loader/data.ts`

Declares `TEXTBOOK_EDITIONS`: an array of `TextbookDefinition`s, each with a `version`, `language`, and a list of `ChapterDefinition`s. A `ChapterDefinition` holds the `docId`, `tabId`, `authors`, and ancillary metadata (lecture URL, paper URL, facilitation guide). The docId+tabId pair is the cache key. Today the array holds exactly one entry: edition `v1`, language `en`, eight chapters (see "Edition and language scope").

### `src/textbook-loader/gdocsdk.ts` — DocsSDK

Wraps the Google Docs API and the on-disk cache. Constructed with optional credentials and a `cacheOnly` flag.

```ts
new DocsSDK(credentials, assetsPath, urlGenerator, cacheOnly);
```

`fetchDoc(docId, tabId)` decision tree:

1. **Cache hit + maintainer mode + all images present on disk** → return cached.
2. **Cache hit + maintainer mode + images missing on disk** → log a warning, re-fetch fresh (re-downloads images too).
3. **Cache hit + contributor (no creds) or explicit cacheOnly** → return cached even if images are missing — contributors get caption-only figures.
4. **Cache miss + cacheOnly or no creds** → throw a fail-loud error naming the missing docId and pointing at both recovery paths (add creds, or refresh cache).
5. **Cache miss + maintainer** → real API call, store to cache, download images.

The cache is `unstorage` with the filesystem driver, rooted at `./.cache/docs/`. The logical key is `docId:tabId`, stored as `.cache/docs/<docId>/<tabId>` — one JSON file per Google Doc tab. The `imagesExist()` helper checks every local-asset `contentUri` in the cached doc against `src/assets/uc/`.

### `src/textbook-loader/transformer.ts` — Transformer

Takes the raw Google Docs `Schema$DocumentTab` and walks the document tree, producing a custom AST. Output is a `RawChapter`:

```ts
{ title, description, number, sections: Section[] }
```

Each `Section.nodes` is a tree of typed `Node`s: `Paragraph`, `Span`, `Heading`, `List`, `ListItem`, `Figure`, `Footnote`, `Callout`, `Definition`, `InlineEquation`, `DisplayEquation`, `Iframe`, `Video`, `Quote`, `NoteBox`, `Link`, `GlossaryDefinition`, etc. The same set is what `src/components/nodes/` renders.

**State to be aware of:** the Transformer accumulates per-textbook counters (figure numbers, section indices) on the `TextbookLoader` instance. This is intentional — "Figure 3.2" requires knowing what chapter and figure we're up to — but it means `loadChapter(X)` is NOT idempotent on a reused loader. Test invariant: same source + _fresh_ loader → same content hash.

### `src/textbook-loader/loader.ts` — TextbookLoader

Orchestrates the per-chapter pipeline:

```ts
new TextbookLoader(creds, edition, { cacheOnly }).load();
```

`load()`:

1. For each chapter definition, call `loadChapter` → fetch → transform.
2. Run `linkSections` to populate `prevSection`/`nextSection` cross-references.
3. Compute total reading time.
4. Run `ChapterPdfRenderer` unless `process.env.SKIP_PDF` is set.
5. Always construct `AudioRenderer` (it has its own internal gating via `SKIP_AUDIO` / `SKIP_AUDIO_DOWNLOAD`).
6. Return the assembled `Textbook`.

Glossary entries are loaded per edition from `src/content/glossary/{version}-{language}/` by `loadGlossary` and matched during transformation.

### Renderers

- **`renderers/pdf/`** — Typst-based chapter PDFs. Slow (~seconds per chapter), gated by `SKIP_PDF`. Output goes to `.cache/uc/` and is uploaded to R2 with maintainer creds. Filenames are content-hash-keyed (`atlas-chapter{N}-{contentHash}.pdf`), so an unchanged chapter short-circuits compilation in `renderChapter`.
- **`renderers/audio/`** — TTS via ElevenLabs (voice) and Gemini (equation descriptions). Multi-phase in `Renderer.render`: fetch equation descriptions for stable content hashes → compute per-section narration + content hash → pull content-hashed final audio from R2 → (skip-generation only) fall back to stable-key files, which can serve stale audio by design → synthesize what's still missing → concatenate chapter audio → upload to R2. Three escape hatches:
  - `SKIP_AUDIO=1` → skipGeneration mode (still pulls existing audio from R2 unless...)
  - `SKIP_AUDIO_DOWNLOAD=1` → bails out entirely before any R2 traffic (combine with `SKIP_AUDIO=1` for fully offline)
  - No `ELEVENLABS_API_KEY` → constructed with `undefined` API key, generation phases no-op

## Failure semantics by stage

Normative. For every stage that touches something that can fail, this section states what happens: does the build exit non-zero, or continue degraded — and if it continues, what ships. `PRINCIPLES.md` §2 states "fail loud, not silent" as a principle; this section is where you check whether it actually holds. Today the bar is met for Google Docs ingestion, Typst compilation, and content-collection schemas, and **not** met for R2 delivery or the Algolia delete/save ordering (`audit:0010` F2/F4/F6 are the evidence base). This document records current behaviour; closing the gaps is audit work, not a licence to describe the gaps as if they were closed.

| Stage                                              | On failure                            | Build exits  | Live-site effect                         |
| -------------------------------------------------- | ------------------------------------- | ------------ | ---------------------------------------- |
| Docs fetch + images (`fetchDoc`, `downloadImages`) | throw (after retries)                 | non-zero     | nothing ships                            |
| Transform (`transformChapter`)                     | warn-and-skip                         | 0            | silently missing prose                   |
| Glossary load (`loadGlossary`)                     | throw (missing dir)                   | non-zero     | nothing ships                            |
| Logos index (`logosLoader`)                        | throw (index fetch) / warn (per logo) | non-zero / 0 | build error, or page missing a logo      |
| Typst compile (`renderChapter`)                    | throw                                 | non-zero     | nothing ships                            |
| TTS synthesis (`synthesizeParagraphs`)             | abort section, warn                   | 0            | section ships with no player             |
| R2 transfer (`r2-cache.ts`)                        | warn-and-continue                     | 0            | **404 audio/PDF links**                  |
| Algolia (`indexTextbook`)                          | throw after destructive delete        | non-zero     | search index empty until next good build |
| Figure render (`Figure.astro`)                     | short-circuit                         | 0            | caption-only figure                      |
| OWID iframe (`Iframe.astro`)                       | spinner, no timeout                   | 0 (build)    | infinite spinner at read time            |

### Google Docs fetch and image download — the reference posture

`fetchDoc` and `downloadImages` are the one integration that meets §2 (`audit:0010` F9):

- A cache miss without credentials **throws** with an actionable message naming the docId and both remediation paths (add creds, or refresh the cache).
- Image downloads retry HTTP 5xx three times with exponential backoff (`fetchWithRetry`); 4xx is treated as terminal.
- After any image failure, `downloadImages` **throws before the partial result is cached**, naming every failed URL — this exists because partial failures used to silently poison the cache with mixed local/remote URIs and surface later as Typst "file not found" errors.
- A maintainer build whose cache references missing images warns and re-fetches rather than shipping broken figures.

When normalizing any other integration's failure posture, this is the pattern to copy.

### Transform — warn-and-skip

`transformChapter` is pure in-process code with no external dependency, but it does have a degradation path: an unrecognised element type is logged (`Unknown component type: [...]`) and skipped, and content appearing before the first section heading is likewise warned and dropped. The build succeeds; prose is silently absent from the shipped chapter. There is no hard-failure path for unrecognised _content_.

### Content collections — mixed

The glob collections (`glossary`, `organizations`, `cohorts`) and `loadGlossary` fail loud: a missing glossary directory makes `readdir` throw and fails the build; schema violations fail collection validation. The logos loader (`logosLoader` from `@foreview/ais-logos-astro`) has two halves with opposite behaviour (`audit:0010` F6): a failure fetching the third-party index (`foreview.github.io/aisafety-logos/index.json`) **throws and fails the build**, with an obscure error naming a logos index rather than a content source; an individual logo download failure is **warn-and-continue**, and the shipped page silently lacks that logo. Logo output lands in `public/logos/` uncommitted and uncached, so every build re-downloads from third-party uptime.

### Typst PDF — fail loud at compile, silent at upload

A Typst compilation failure in `renderChapter` throws with the Google Doc URL and the exact cache-clear command in the message — good, loud, actionable. But the upload of the finished PDF via `pushPublicFiles` is warn-and-continue (see R2 below), and `chapter.pdfLink` is assigned the CDN URL **unconditionally** — `renderChapter` returns `https://atlas.foreviewusercontent.com/pdf/...` whether or not the upload succeeded. A failed R2 upload therefore produces a successful build whose "Download PDF" link 404s.

### TTS audio — all-or-nothing per section, stale fallback by design

Per section, the renderer tries, in order: local cache → R2 content-hashed key → (skip-generation only) R2 stable key → synthesis. The stable-key fallback exists so a deploy build (`SKIP_AUDIO=1`) can serve audio whose narration text has drifted; the code comment says outright that it "serves stale audio".

During synthesis, partial failure aborts the **whole section**: `synthesizeParagraphs` returns an empty buffer if any paragraph failed, and the renderer responds by setting `section.audioLink = undefined`. The build continues and the section simply ships with no player. The dormant Gemini adapter (`gemini-tts.ts`) encodes the opposite contract — it concatenates around failed paragraphs, silently shortening the narration — which changes the content hash and would desynchronise word timings with no error anywhere (`audit:0010` F10). Until a second TTS provider is actually enabled, the ElevenLabs contract is the operative one.

### R2 — warn-and-continue everywhere, including delivery-critical paths

No function in `r2-cache.ts` throws. Concretely:

- **Downloads** (`pullFromR2`, `pullFinalAudioBatch`): `NoSuchKey` is swallowed as expected (new content legitimately isn't there yet); any other error is `console.warn`ed and the file is skipped. The build continues without the audio it believed it had.
- **Uploads** (`pushToR2`, `pushFinalAudioFiles`, `pushPublicFiles`): a failed `ListObjectsV2Command` means every local file is treated as new and re-uploaded (harmless, wasted work); a failed `PutObjectCommand` is warned about and skipped.
- Because `section.audioLink` / `chapter.pdfLink` are assigned **before** any R2 outcome is known, a degraded or misconfigured R2 yields an exit-0 build that ships 404 "Listen" / "Download PDF" links — invisible at build time, wrong at read time (`audit:0010` F2). This is the clearest violation of §2 in the codebase. The distinction that should exist — soft pulls for chunk caches (legitimate misses), loud pushes for delivery-critical files — is recommended in `audit:0010` rec. 1 but not yet implemented.

### Algolia — destructive delete-then-save

`indexTextbook` first runs `deleteBy({ filters: 'version:<v>' })`, then `saveObjects`, with no retry of either. If the save fails after the delete succeeded — network blip, key rotation, provider outage — the build fails **and** the production index for that version is already empty; search stays broken on the live site until the next successful maintainer build, with no rollback anywhere (`audit:0010` F4). The save-first reordering recommended in `audit:0010` rec. 4 is not yet implemented. The records also carry only `version` (no `language`), so indexing a second language under the current filter would wipe the English index (`audit:0007` F2).

### Reader-facing render — degrade silently by design, mostly

`Figure.astro` short-circuits the `<Image>` tag when the image module isn't found in `src/assets/uc/`; the explanatory italic note renders **only in dev**, so a prerendered contributor build silently ships caption-only figures (`audit:0010` F7 flags this for owner confirmation — it is currently intended). `Iframe.astro` (OWID charts) renders an endless spinner on failure, with no timeout or fallback (`audit:0010` F8; replacement is owned by the roadmap, not this document). The search UI always renders because the public Algolia keys have committed schema defaults.

## Mode boundaries

Normative. "The two modes" above is the summary; these are the boundary cases a reviewer will actually be asked to classify.

- **Contributor build, doc in committed cache, images absent.** `src/assets/uc/` is gitignored (344 files, ~200 MB when populated), so a fresh clone has cached docs but no images. Branch 3 of the `fetchDoc` decision tree deliberately keeps the cache hit; figures render caption-only, silently in a prerendered production build (the dev-only note does not ship).
- **Contributor build, doc NOT in committed cache.** Branch 4 of `fetchDoc` throws — hard failure naming the docId and both recovery paths. This is the one contributor-mode case that fails the build.
- **Maintainer build, cache hit, images missing on disk.** Branch 2: warn, then re-fetch the doc and re-download images. The stale cache never ships broken figures.
- **Maintainer build, partial image fetch.** Refused: `downloadImages` throws before caching anything, so a partially-downloaded doc is never written to `.cache/docs/`.
- **Audio resolution per section** (`resolveSectionAudio`): the read-along prefers a locally staged CBR file if `chapterTimings` has an entry and the file exists on disk; otherwise it plays the build's own `section.audioLink` (content-hashed, resolved only in a build with credentials) or the timing table's pinned `publishedUrl`; with neither, the page renders no player at all — a deliberate fail-soft, on the reasoning that "a player that loads a 404 is worse than no player".
- **Deploy build (GitHub Actions `deploy.yml`).** Full secrets, `SKIP_AUDIO="1"`, **no** `SKIP_PDF` — so every push runs the Typst renderer for all 8 chapters (content-hash short-circuits don't help CI, which has no cache for `.cache/uc` or the Typst outputs — `audit:0010` F7), pulls final audio from R2 with stale-stable-key fallback, re-pushes public audio, and re-indexes Algolia.
- **Maintainer dev build.** `detectBuildMode` forces `downloadAudio`/`uploadAudio` false under `NODE_ENV=development`, so a dev server with creds present never touches R2 audio.

Conformance rule a reviewer can apply: a build either (a) exits non-zero with an error naming the failed dependency and a remediation, or (b) exits 0 with degraded output **omitted** (no player, caption-only figure, missing logo). It should never exit 0 with links that 404 — the R2 stage above is the known violation.

## Astro layer

### `src/content.config.ts`

Defines five Astro content collections:

- **`textbooks`** — loader returns the array of `Textbook` objects from `TextbookLoader.load()`.
- **`glossary`** — JSON entries from `src/content/glossary/`.
- **`organizations`** — partner-org metadata from `src/content/organizations/`.
- **`cohorts`** — teaching-cohort records from `src/content/cohorts/`.
- **`orgLogos`** — partner-org logos via the `logosLoader` of `@foreview/ais-logos-astro`.

This file is also where `detectBuildMode` runs, where the banner is printed, and where schema env vars are bridged to `process.env` for the renderers — see "Configuration precedence" for the exact rules.

### Routing — `src/pages/`

Chapter content is served by `src/pages/chapters/[version]/[chapter]/[section].astro` (edition-scoped) and its unversioned variants under `src/pages/chapters/[chapter]/`; `src/pages/read/[...version].astro` is the top-level table of contents. Dynamic routes consume the `textbooks` collection via `getStaticPaths`; every section's nodes are passed through `NodeRenderer.astro`, which dispatches to one of the components under `src/components/nodes/`.

No route carries a language segment, and the data-access layer (`textbooks.ts`) filters `language === 'en'` — see "Edition and language scope".

### Components — `src/components/nodes/`

One Astro component per AST node type. `NodeRenderer.astro` is the recursive dispatcher: given a `Node`, it picks the component by `node.name` and recurses into `node.children`.

`Figure.astro` is the one to watch for contributor mode — it uses `import.meta.glob` to look up the image module from `src/assets/uc/`, and short-circuits the `<Image>` tag when the module isn't found. In dev mode it also renders a small italic note explaining the missing asset; in a prerendered build it ships caption-only, silently (see "Failure semantics by stage").

### Search — Algolia + DocSearch

`src/components/AlgoliaSearch.astro` and `DocSearchProvider.astro` import the public app ID + search key from `astro:env/client` (not from `import.meta.env` — the two are different env systems in Astro). The schema in `astro.config.mjs` declares `default:` values for both, so the search UI works without a `.env`.

The Algolia _write_ path (`indexTextbook` in `src/textbook-loader/algolia.ts`) runs from the `textbooks` collection loader, gated on `BuildMode.indexAlgolia` — its failure semantics are in "Failure semantics by stage".

## The committed cache (`.cache/docs/`)

`.cache/docs/` is the **only** part of `.cache/` that is checked in. Layout: `.cache/docs/<docId>/<tabId>` — one JSON file per Google Doc tab (the logical cache key is `docId:tabId`).

The cache files have their `inlineObject.contentUri` values rewritten to local asset paths (e.g., `/assets/uc/<sha256>.png`). The image _contents_ are NOT committed — only the references. Contributors building without creds get the references but no files, which is why figures degrade to caption-only.

Refreshing the cache (maintainer):

```bash
rm -rf .cache/docs/*       # optional clean rebuild
pnpm build                 # repopulates everything
git diff --stat .cache/docs/
```

Before committing the diff, run the secret-scan (`.cache/docs/README.md` has the command). Authors sometimes paste API keys or internal URLs into Google Docs; we do not want them in the public repo.

### Why a committed cache (and what would replace it)

This is a deliberately short-term solution. The current arrangement was chosen because it's the simplest thing that unblocks contributor builds — `git clone` already has the cache, no extra install step, no infrastructure to maintain.

**Alternatives considered:**

- **R2-published content artifact** (`atlas-content-vN.tar.gz` downloaded by a postinstall script). Versioned, signed by SHA256, no git involvement. This is the planned exit — see `docs/ROADMAP.md` "Next". Architecturally consistent with how PDFs and audio already live on R2 (commit `695ec5b`).
- **Content branch** (cache lives on an orphan `content` branch, fetched via `git archive` postinstall). Avoids `main` bloat but adds a fragile install step. Inferior to R2.
- **Submodule pointing at a private content repo.** Wrong direction — defeats the "public OSS repo" framing and adds setup friction.

**The cost we're paying with the current approach:**

- Git history bloat: ~8.7MB now, growing with every textbook edit. Manageable today (8 chapters, infrequent edits) but unbounded.
- Coupling: a content edit becomes a code PR.
- No signal that the cache lags the live Google Docs.

We accept these costs because the alternative requires standing up a content-publishing pipeline before we've shipped the contributor unblock. R2 migration happens after Tracks B + C land.

## R2 layout (maintainer-only)

PDFs and audio are served from `https://atlas.foreviewusercontent.com` (Cloudflare R2 fronted by a custom domain; the CDN base is hardcoded as `CDN_BASE` in both renderers). Everything is uploaded to one bucket under distinct prefixes:

- `audio-chunks/<sha256>.mp3` and `.pcm` — per-paragraph TTS chunk cache, keyed by paragraph text hash
- `equation-descriptions/<sha256>.txt` — Gemini-generated alt text for math, keyed by LaTeX hash
- `final-audio/<key>.mp3` — assembled section and chapter audio under two key shapes: content-hashed (`ch{N}-s{M}-{hash}`, `chapter{N}-{hash}`) and stable (`ch{N}-s{M}`, `chapter{N}`, the skip-generation stale fallback)
- `audio/atlas-ch{N}-s{M}-{hash}.mp3`, `audio/atlas-chapter{N}-audio-{hash}.mp3` — public CDN serving (the `CDN_BASE/audio/...` links)
- `pdf/atlas-chapter{N}-{contentHash}.pdf` — public CDN serving (the `CDN_BASE/pdf/...` links)

The PDF and audio links on each Section / Chapter object point at these URLs. Contributors don't generate or upload anything; their builds resolve audio through `resolveSectionAudio` (pinned `publishedUrl` for timed sections, `undefined` elsewhere) and have `pdfLink` undefined.

All R2 transfers are warn-and-continue — see "Failure semantics by stage" for what that means when the bucket is degraded.

## Edition and language scope

Normative. This document describes edition `v1`, language `en` behaviour — that is the only case that exists today: `TEXTBOOK_EDITIONS` (`src/textbook-loader/data.ts`) holds exactly one entry. Edition 2 and translations into several languages are in flight, so the scope boundaries matter now.

The data model already carries the dimension — `TextbookDefinition` is `{ version, language, chapters[] }`, and `content.config.ts` keys the collection entry `${version}-${language}` — but much of the downstream is single-edition or single-language by construction:

| Concern                                | Scope today                                                                                                                                | Anchor                                                                                    |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------- |
| Chapter sources (docId+tabId), authors | per edition (`v1`)                                                                                                                         | `TEXTBOOK_EDITIONS`                                                                       |
| URL space                              | version-only, no language segment                                                                                                          | `/chapters/{version}/...` routes                                                          |
| Data access                            | English-locked: resolves `${version}-en`, filters `language === 'en'`                                                                      | `getTextbooks`, `getLatestTextbook` in `src/lib/textbooks.ts`                             |
| `<html lang>`                          | hardcoded `en` in both layouts                                                                                                             | `Default.astro`, `Reader.astro`                                                           |
| Glossary                               | per edition **and** language directory                                                                                                     | `loadGlossary` → `src/content/glossary/{version}-{language}/`                             |
| Search records                         | carry `version` only — a second language would collide with / wipe English records                                                         | `textbookToRecords`, `indexTextbook` (`audit:0007` F2)                                    |
| Read-along timings + audio             | keyed by chapter and section **number only** — no version or language dimension; a second edition/language resolves the same English files | `chapterTimings` in `src/data/chapter-timing.ts`, `resolveSectionAudio` (`audit:0007` F3) |
| TTS narration, audio content hashes    | derived from English text; per-language narration would be distinct hashes                                                                 | audio `Renderer` Phase 2                                                                  |

Because of the `textbooks.ts` filter, a non-English edition registered in `TEXTBOOK_EDITIONS` today would be built by the loader but silently invisible to every route — the build succeeds, the content is unreachable.

**Divergence owners.** The locale-aware routing scaffold (language segments, dynamic `<html lang>`, dropping the English filter) is owned by `docs/ROADMAP.md` "Now". The content-model findings for multi-edition/multi-language are owned by `audit:0007`; the audio/timing coupling by `audit:0009` and `audit:0010` F3, together with the external `atlas-podcast` pipeline that generates the timings. When the routing scaffold lands, the table above is the checklist of places that must change, and this section stops being a description of a single edition.

## Test layers

Default `pnpm test`: 181 tests across 18 files, ~7s, no network, no build (vitest excludes `tests/smoke/` and `tests/a11y/`). As of this revision:

| Area                     | Files (tests)                                                                                                                                                                     | Asserts                                                                                |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| Build mode               | `build-mode.test.ts` (16)                                                                                                                                                         | Every env permutation → expected `BuildMode`                                           |
| Docs SDK                 | `gdocsdk.test.ts` (13)                                                                                                                                                            | `imagesExist` + `fetchDoc` decision tree + error contents                              |
| Loader                   | `loader.test.ts` (6)                                                                                                                                                              | `loadChapter`, `loadGlossary`, full `load()`, content-hash determinism, `linkSections` |
| Transformer              | `transformer.test.ts` (10), `transformer.edge-cases.test.ts` (19)                                                                                                                 | Per-chapter AST digest snapshot; edge-case handling                                    |
| Renderers                | `pdf/renderer.test.ts` (7), `audio/renderer.test.ts` (7), `text-renderer.test.ts` (11), `equation-describer.test.ts` (7), `r2-cache.test.ts` (11), `output-snapshots.test.ts` (2) | PDF/audio renderer units, R2 cache behaviour, output snapshots                         |
| Search                   | `algolia.test.ts` (6)                                                                                                                                                             | Record extraction from textbooks                                                       |
| Audio resolution         | `section-audio.test.ts` (11), `chapter-timing.test.ts` (8)                                                                                                                        | Source resolution + timing table shape                                                 |
| Data access & text utils | `textbooks.test.ts` (11), `sentences.test.ts` (5)                                                                                                                                 | Collection access, sentence splitting                                                  |
| Browser runtime          | `word-align.test.ts` (17), `follow-scroll.test.ts` (14)                                                                                                                           | Reader-page helpers                                                                    |
| End-to-end               | `tests/smoke/contributor-build.smoke.test.ts` (1, opt-in)                                                                                                                         | `pnpm build` produces real chapter HTML with prose and search wiring                   |
| Accessibility            | `tests/a11y/a11y.test.ts` (opt-in)                                                                                                                                                | Against `baseline.json`                                                                |

The counts above are point-in-time; treat the shape (what each layer asserts) as the stable claim and `pnpm test` output as the live number. Opt-in `pnpm test:smoke` spawns `pnpm build`, ~33s.

## Design principles encoded

- **Single source of truth for env-mode decisions** (`build-mode.ts`) — with the documented exceptions in "Configuration precedence" rule 4.
- **Fail loud, not silent** — honoured for Google Docs ingestion, Typst compilation, and content-collection schemas; **not yet** honoured for R2 delivery and the Algolia delete/save ordering (`audit:0010` F2/F4). "Failure semantics by stage" is the per-stage truth.
- **Defence in depth** — both `cacheOnly` flag and `SKIP_PDF`/`SKIP_AUDIO` are set when no creds; either one alone would suffice.
- **Reproducibility** — same source + fresh loader produces deterministic content hashes; PDF and audio filenames are content-hash-keyed; tests assert this.
- **Observability** — one startup banner declares the build mode; no spelunking required. Known blind spot: the four bypassing env variables never appear in the banner.
- **No conditional UI for missing infrastructure** — search renders the same for contributors and maintainers because the search-only key is public-by-design.

## Where to start reading

If you're new to the codebase:

1. Read this file.
2. Skim `src/lib/build-mode.ts` (~80 lines) to see the mode object.
3. Read `src/content.config.ts` (~70 lines) to see the entry point.
4. Read `src/textbook-loader/loader.ts` (~150 lines) for the orchestration.
5. Skim `src/textbook-loader/transformer.ts` (large file) — most regressions in chapter rendering are caused by changes here.

If you're picking up Track B/C/D of the OSS-readiness work, `docs/TODO.md` is the canonical task list (local-only, in the maintainer's working copy).
