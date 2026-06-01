# Principles

The engineering principles this project actually applies, with the code that demonstrates each one. If something here doesn't match the codebase, the code or the doc is wrong — fix one or the other in the same change.

Generic principles (SOLID, GRASP, coupling/cohesion vocabulary, etc.) are not repeated here. Read a textbook for those.

---

## 1. Single source of truth for build behaviour

Every env-mode *decision* is made in `src/lib/build-mode.ts`. No other module is allowed to interpret raw env vars to decide what to fetch, skip, or render.

There's one carefully-scoped exception: `content.config.ts` is the only file that may *bridge* `BuildMode` flags onto `process.env.SKIP_PDF` / `SKIP_AUDIO`. This bridge exists because the PDF and audio renderers are constructed several layers deep (inside `TextbookLoader.load()`), where threading a `BuildMode` argument through would be invasive. The bridge keeps the decision-making in one place even though the *consumption* happens further down the call tree.

Modules that legitimately consume the bridged values:

- `src/textbook-loader/loader.ts:59` reads `process.env.SKIP_PDF` to gate `ChapterPdfRenderer`
- `src/textbook-loader/loader.ts:66` reads `process.env.SKIP_AUDIO` for the audio renderer's `skipGeneration` flag
- `src/textbook-loader/renderers/audio/renderer.ts:53` reads `process.env.SKIP_AUDIO_DOWNLOAD` as a local-dev escape hatch

These reads don't *decide* anything — they apply a decision already made upstream. If a new module needs to gate on creds, it must consume `BuildMode`, not probe env.

**Why:** before this principle was applied, the same env probe (`if (!process.env.SKIP_PDF)`) appeared in five files, each drifting independently. Extracting `BuildMode` collapsed five decisions into one. Three concrete benefits this purchases:

- One place to test. `build-mode.test.ts` covers every env permutation in 16 unit tests; adding a new flag means adding one test, not five.
- One place to read. A new contributor wanting to understand what gates the PDF render finds the answer in `build-mode.ts`, not by grepping `process.env.SKIP_PDF` across the codebase.
- One place to change. Adding a new mode (e.g. "contributor-with-image-hosting") is a switch case in `detectBuildMode`, not a parallel edit across 5+ files.

The bridge is a pragmatic compromise; the alternative (passing `BuildMode` through `TextbookLoader.load()` to the renderers) is on the table if the renderers grow more mode-dependent behaviour.

**Reference:** `src/lib/build-mode.ts`, `src/content.config.ts` lines 22–46, `src/textbook-loader/loader.ts:59-66`.

## 2. Fail loud, not silent

When the build can't do the thing it's being asked to do, it throws an error that names the specific input and tells the user how to fix it. Generic "something went wrong" messages are a bug.

**Why:** the original cache-miss error was `"cacheOnly mode is enabled"` — true but useless. The new one names the docId, distinguishes "cacheOnly" vs "no creds", and points at `CONTRIBUTING.md`. Contributors who hit it can self-serve.

**Reference:** `src/textbook-loader/gdocsdk.ts:48-58` (`fetchDoc` cache-miss error).

## 3. Defence in depth

A skip behaviour reachable through multiple paths is harder to break by accident. Both `BuildMode.fetchFromGoogleDocs` (passed as `cacheOnly` to the loader) AND `process.env.SKIP_PDF` / `SKIP_AUDIO` (read by the renderers) are set when credentials are absent. Either one alone would suffice; together, no renderer can silently start hitting Google or R2 just because someone removed a single guard.

**Reference:** `src/content.config.ts:44-46` (sets `process.env.SKIP_PDF`/`SKIP_AUDIO` from `BuildMode`).

## 4. Reproducibility

Same source + fresh tooling should always produce the same artifacts. This is asserted as a test invariant.

**Reference:** `src/textbook-loader/loader.test.ts` — "contentHash is deterministic across fresh loader instances".

**Where it does NOT hold (and why):** `loadChapter(X)` called twice on the *same* loader produces different hashes because the `Transformer` accumulates per-textbook counters (figure numbers etc.) as instance state. This is intentional — "Figure 3.2" requires global context — and documented in [`ARCHITECTURE.md`](./ARCHITECTURE.md) under "Content pipeline / Transformer".

## 5. Observability — one banner, no spelunking

The build prints exactly one structured line at startup declaring the resolved mode:

```
[atlas] BuildMode: contributor, cache-only, no PDF, no audio, no R2 audio pull, no Algolia indexing, search enabled
```

If you want to know what the build is doing, the first line of output tells you. No need to grep env vars or check 3 different files.

**Reference:** `src/lib/build-mode.ts` `formatSummary`, `src/content.config.ts:34`.

## 6. No conditional UI for missing infrastructure

When infra has a public-by-design surface (Algolia search-only key, public CDN URLs), the UI renders the same for everyone. Conditionally hiding features for contributors creates rendering complexity and a worse contributor experience without solving any real problem.

**Why:** an early plan proposed `if (hasAlgoliaConfig) <SearchBox />` to hide search for contributors without `.env`. But the Algolia keys needed are public-by-design — they're already shipped in the deployed HTML. Hiding the box was solving a problem that didn't exist. Instead, the public keys are committed as `default:` values in `astro.config.mjs`.

**Reference:** `astro.config.mjs:24-27`, `src/components/DocSearchProvider.astro` (no conditional rendering).

## 7. Layered testing

Each test layer catches a specific class of regression. The default `pnpm test` runs four pure layers in ~7s; a separate `pnpm test:smoke` runs the heavy end-to-end build.

| Layer | What it protects |
|---|---|
| Pure unit | Env decision logic — every permutation has an expected mode |
| Storage | Cache-hit/miss decision tree and error contents |
| Integration | Loader correctness against real cache fixtures |
| Snapshot | Transformer AST structural drift |
| Smoke (opt-in) | The whole pipeline produces real chapter HTML |

**Reference:** `docs/ARCHITECTURE.md` "Test layers", and the `test` files under `src/` and `tests/`.

## 8. No backwards-compatibility cruft

When we change behaviour, we change it atomically. No `if (process.env.NEW_BEHAVIOR)` toggles, no compatibility wrappers for "the old way", no commented-out dead code. The repository is small enough and the contributors few enough that the cost of a cleanup commit is lower than the cost of carrying scar tissue.

**Reference:** check `git log` — the Track A commits delete or rewrite, they don't accumulate.

## 9. Cache content is a public artifact (privacy)

`.cache/docs/` is committed to the repo as the contributor-build unlock (see [`ARCHITECTURE.md`](./ARCHITECTURE.md) "Why a committed cache"). Authors sometimes paste API keys, internal URLs, or draft notes into Google Docs while editing — the cache is about to become a public artifact, so every cache-content commit MUST be preceded by a secret-scan.

The scan procedure lives in `.cache/docs/README.md`. It runs a small list of high-signal credential patterns (AWS keys, OpenAI/Anthropic/GitHub tokens, PEM private keys, JWT shapes) rather than fuzzy keyword matching — the latter produces too many false positives on a textbook about AI safety, where the words "secret", "token", and "API key" appear as concepts dozens of times. The scheduled content-refresh workflow (Track B.6, pending) will automate this scan.

**Why this principle exists:** it's the only privacy-bearing rule in the project right now. The service account scope is already `documents.readonly` (minimum necessary). The R2 keys never touch the public repo. The Algolia search-only key is public-by-design. The single risk surface is "what shows up in a Google Doc and gets committed via the cache" — so we make that scan procedure mandatory and explicit, and bake it into the automation that will run on every refresh.

**Reference:** `.cache/docs/README.md`.

---

## What this document is not

- Not a SOLID/GRASP primer. Read a textbook.
- Not a list of every coding convention. The codebase isn't large enough to need one.
- Not a place to copy generic principles you might want someday. Each entry above earned its place by removing real complexity from the actual code.

If you want to add a principle here, the test is: can you point at the *specific* code that exemplifies it, and the *specific* problem it solves in *this* project?
