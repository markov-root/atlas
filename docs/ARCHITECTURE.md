# Architecture

AI Safety Atlas is an Astro static site whose content is generated from Google Docs at build time. This document explains the pipeline.

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
       │ - detects mode      │       │     Transformer.        │
       │ - prints banner     │       │       transformChapter() │
       │ - calls loader      │       │   linkSections()         │
       │ - indexes Algolia   │       │   ChapterPdfRenderer     │
       └─────────────────────┘       │   AudioRenderer          │
                                     └─────────────┬───────────┘
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

## Editorial surface — why Google Docs

The textbook prose lives in 8 private Google Docs. The build authenticates with a service-account key (`GOOGLE_CREDENTIALS_BASE64`), fetches each tab as a structured document, and transforms it into our AST.

**Why Google Docs specifically:**

- The authors (researchers across CeSIA, partners, occasional external contributors) are comfortable in Google Docs. Inline comments, real-time co-editing, suggested-edits review, and the comment-thread workflow are all already familiar.
- The structured-document API gives us paragraph spans, headings, tables, footnotes, equations, and inline images without us having to define an editor.
- Versioning and access control come for free (revision history, share-link permissions, view-only mode for reviewers).

**Alternatives considered and rejected:**

- **MDX / markdown files in the repo.** Cheapest infrastructure but requires every contributing author to learn Git + markdown + a markup dialect for callouts/footnotes/equations. We'd lose comment threads. Hard rejection — would slow the editorial loop.
- **A headless CMS (Sanity, Notion).** Worth re-evaluating in 12+ months, but for 8 chapters and ~4 authors the additional service is unjustified.
- **Self-hosted CMS.** Adds an ops surface we don't want.

This decision is load-bearing on the contributor-mode work — because the editorial source isn't in the repo, contributors need *some* representation of the textbook (the committed cache) to build the site. See "The committed cache" below.

## Content pipeline

### `src/textbook-loader/data.ts`

Declares `TEXTBOOK_EDITIONS`: an array of `TextbookDefinition`s, each with a `version`, `language`, and a list of `ChapterDefinition`s. A `ChapterDefinition` holds the `docId`, `tabId`, `authors`, and ancillary metadata (lecture URL, paper URL, facilitation guide). The docId+tabId pair is the cache key.

### `src/textbook-loader/gdocsdk.ts` — DocsSDK

Wraps the Google Docs API and the on-disk cache. Constructed with optional credentials and a `cacheOnly` flag.

```ts
new DocsSDK(credentials, assetsPath, urlGenerator, cacheOnly)
```

`fetchDoc(docId, tabId)` decision tree:

1. **Cache hit + maintainer mode + all images present on disk** → return cached.
2. **Cache hit + maintainer mode + images missing on disk** → log a warning, re-fetch fresh (re-downloads images too).
3. **Cache hit + contributor (no creds) or explicit cacheOnly** → return cached even if images are missing — contributors get caption-only figures.
4. **Cache miss + cacheOnly or no creds** → throw a fail-loud error naming the missing docId and pointing at both recovery paths (add creds, or refresh cache).
5. **Cache miss + maintainer** → real API call, store to cache, download images.

The cache is `unstorage` with the filesystem driver, rooted at `./.cache/docs/`. Files are JSON, one per `docId/tabId` pair. The `imagesExist()` helper checks every local-asset `contentUri` in the cached doc against `src/assets/uc/`.

### `src/textbook-loader/transformer.ts` — Transformer

Takes the raw Google Docs `Schema$DocumentTab` and walks the document tree, producing a custom AST. Output is a `RawChapter`:

```ts
{ title, description, number, sections: Section[] }
```

Each `Section.nodes` is a tree of typed `Node`s: `Paragraph`, `Span`, `Heading`, `List`, `ListItem`, `Figure`, `Footnote`, `Callout`, `Definition`, `InlineEquation`, `DisplayEquation`, `Iframe`, `Video`, `Quote`, `NoteBox`, `Link`, `GlossaryDefinition`, etc. The same set is what `src/components/nodes/` renders.

**State to be aware of:** the Transformer accumulates per-textbook counters (figure numbers, section indices) on the `TextbookLoader` instance. This is intentional — "Figure 3.2" requires knowing what chapter and figure we're up to — but it means `loadChapter(X)` is NOT idempotent on a reused loader. Test invariant: same source + *fresh* loader → same content hash.

### `src/textbook-loader/loader.ts` — TextbookLoader

Orchestrates the per-chapter pipeline:

```ts
new TextbookLoader(creds, edition, { cacheOnly })
  .load()
```

`load()`:
1. For each chapter definition, call `loadChapter` → fetch → transform.
2. Run `linkSections` to populate `prevSection`/`nextSection` cross-references.
3. Compute total reading time.
4. Optionally run `ChapterPdfRenderer` (gated by `process.env.SKIP_PDF`).
5. Always construct `AudioRenderer` (it has its own internal gating via `SKIP_AUDIO` / `SKIP_AUDIO_DOWNLOAD`).
6. Return the assembled `Textbook`.

### Renderers

- **`renderers/pdf/`** — Typst-based chapter PDFs. Slow (~seconds per chapter), gated by `SKIP_PDF`. Output goes to `.cache/uc/` and is uploaded to R2 with maintainer creds.
- **`renderers/audio/`** — TTS via ElevenLabs (voice) and Gemini (equation descriptions). Multi-phase: fetch equation descriptions for stable content hashes, then generate audio per section, then upload to R2. Three escape hatches:
  - `SKIP_AUDIO=1` → skipGeneration mode (still pulls existing audio from R2 unless...)
  - `SKIP_AUDIO_DOWNLOAD=1` → bails out entirely before any R2 traffic (combine with `SKIP_AUDIO=1` for fully offline)
  - No `ELEVENLABS_API_KEY` → constructed with `undefined` API key, generation phases no-op

## Astro layer

### `src/content.config.ts`

Defines two Astro content collections:

- **`textbooks`** — loader returns the array of `Textbook` objects from `TextbookLoader.load()`.
- **`organizations`** — partner-org logos via `@foreview/ais-logos-astro`.

This file is also where `detectBuildMode` runs and where `process.env.SKIP_PDF` / `SKIP_AUDIO` get set as defense-in-depth so renderers downstream see the right flags.

### Routing — `src/pages/`

`src/pages/chapters/[...slug].astro` and similar dynamic routes consume the `textbooks` collection and render chapter pages. Each chapter's sections are passed through `NodeRenderer.astro`, which dispatches to one of the components under `src/components/nodes/`.

The `read/[...version].astro` route is the top-level table of contents.

### Components — `src/components/nodes/`

One Astro component per AST node type. `NodeRenderer.astro` is the recursive dispatcher: given a `Node`, it picks the component by `node.name` and recurses into `node.children`.

`Figure.astro` is the one to watch for contributor mode — it uses `import.meta.glob` to look up the image module from `src/assets/uc/`, and short-circuits the `<Image>` tag when the module isn't found. In dev mode it also renders a small italic note explaining the missing asset.

### Search — Algolia + DocSearch

`src/components/AlgoliaSearch.astro` and `DocSearchProvider.astro` import the public app ID + search key from `astro:env/client` (not from `import.meta.env` — the two are different env systems in Astro). The schema in `astro.config.mjs` declares `default:` values for both, so the search UI works without a `.env`.

The Algolia *write* key is only used when `BuildMode.indexAlgolia === true`, gated in `content.config.ts`.

## The committed cache (`.cache/docs/`)

`.cache/docs/` is the **only** part of `.cache/` that is checked in. Layout: `.cache/docs/<docId>/<tabId>` — one file per Google Doc tab, JSON-serialized.

The cache files have their `inlineObject.contentUri` values rewritten to local asset paths (e.g., `/assets/uc/<sha256>.png`). The image *contents* are NOT committed — only the references. Contributors building without creds get the references but no files, which is why figures degrade to caption-only.

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

PDFs and audio are served from `https://atlas.foreviewusercontent.com` (Cloudflare R2 fronted by a custom domain). The audio renderer pushes:

- `equation-descriptions/<sha256>.txt` — Gemini-generated alt text for math, keyed by LaTeX hash
- `audio/<sha256>.mp3` — TTS output keyed by content hash
- `final/<chapter>/<section>.mp3` — concatenated final audio
- `public/<chapter>.pdf` — chapter PDFs

The PDF and audio links on each Section / Chapter object point at these URLs. Contributors don't generate or upload anything; their builds simply have `pdfLink` / `audioLink` undefined.

## Test layers

| Layer | File | Asserts |
|---|---|---|
| Pure unit | `src/lib/build-mode.test.ts` (16) | Every env permutation → expected `BuildMode` |
| Storage | `src/textbook-loader/gdocsdk.test.ts` (13) | `imagesExist` + `fetchDoc` decision tree + error contents |
| Integration | `src/textbook-loader/loader.test.ts` (6) | `loadChapter`, `loadGlossary`, full `load()`, content-hash determinism, `linkSections` |
| Snapshot | `src/textbook-loader/transformer.test.ts` (10) | Per-chapter AST digest snapshot |
| End-to-end | `tests/smoke/contributor-build.smoke.test.ts` (1, opt-in) | `pnpm build` produces real chapter HTML with prose and search wiring |

Default `pnpm test`: 45 tests, ~7s, no network, no build.
Opt-in `pnpm test:smoke`: spawns `pnpm build`, ~33s.

## Design principles encoded

- **Single source of truth for env-mode decisions** (`build-mode.ts`).
- **Fail loud, not silent** — cache misses, missing assets, and bad config produce specific error messages naming what's wrong and how to fix it.
- **Defence in depth** — both `cacheOnly` flag and `SKIP_PDF`/`SKIP_AUDIO` are set when no creds; either one alone would suffice.
- **Reproducibility** — same source + fresh loader produces deterministic content hashes; tests assert this.
- **Observability** — one startup banner declares the build mode; no spelunking required.
- **No conditional UI for missing infrastructure** — search renders the same for contributors and maintainers because the search-only key is public-by-design.

## Where to start reading

If you're new to the codebase:

1. Read this file.
2. Skim `src/lib/build-mode.ts` (~80 lines) to see the mode object.
3. Read `src/content.config.ts` (~70 lines) to see the entry point.
4. Read `src/textbook-loader/loader.ts` (~150 lines) for the orchestration.
5. Skim `src/textbook-loader/transformer.ts` (large file) — most regressions in chapter rendering are caused by changes here.

If you're picking up Track B/C/D of the OSS-readiness work, `docs/TODO.md` is the canonical task list (local-only, in the maintainer's working copy).
