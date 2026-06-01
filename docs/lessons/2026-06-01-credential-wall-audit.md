# 2026-06-01 — Credential-wall audit

## What did we try to do?

Figure out why external contributors couldn't build Atlas locally. Specifically: an external collaborator (Emily) had been blocked for ~2 months trying to contribute audio-playback work. She forked, ran `pnpm install && pnpm dev`, hit a credential error, asked for read-only creds, no resolution. We wanted to understand whether that block was incidental or structural.

## What did we learn?

The block is structural. The build is wired through Google Docs as the editorial source:

1. `astro.config.mjs` declared `GOOGLE_CREDENTIALS_BASE64` as required (no `optional: true`). Astro env validation crashes immediately if it's missing — before any site code runs.
2. `src/content.config.ts` calls `new TextbookLoader(GOOGLE_CREDENTIALS_BASE64, …).load()`. The loader instantiates a `DocsSDK` and tries to fetch each of 8 chapter docs.
3. Without creds the API call fails with a 403 or the client is `null` and throws.
4. The textbook content lives in 8 **private** Google Docs owned by the maintainers. A contributor who creates their own service account still can't access them — there's no mechanism to substitute their own documents.

But: the codebase was already 80% ready for a credential-free path.

- `DocsSDK` (`src/textbook-loader/gdocsdk.ts:18,48`) already accepted a `cacheOnly: boolean` parameter and could be constructed with `credentials: null`.
- `TextbookLoader` (`src/textbook-loader/loader.ts:25`) already accepted `googleCreds: string | null` and a `TextbookLoaderOptions { cacheOnly?: boolean }`.
- An on-disk cache at `.cache/docs/` (unstorage `fsDriver`) already serialised every fetched doc.
- `Figure.astro` already short-circuited the `<Image>` tag when the asset module wasn't on disk — no crash, no broken `<img>` reference.

The cache directory was just `.gitignore`d. Nobody had ever committed it. That was the entire structural fix needed for prose.

## Where did we get stuck and why?

Three concerns made us pause before just committing `.cache/docs/`:

1. **The image coupling.** When a doc is cached, its inline image URIs get rewritten to local asset paths (`/assets/uc/<sha256>.png`). The image *contents* are NOT in the cache JSON — they live in `src/assets/uc/`, which is also gitignored. Committing the cache without the images would mean broken `<img>` tags. We needed to verify the web rendering actually degraded gracefully (it does, via `Figure.astro`'s `import.meta.glob` lookup) and that PDF generation was the only real consumer of the actual image files.

2. **Stale-cache safety.** If we commit the cache and CI later fetches without re-running with creds, an out-of-sync cache would silently ship stale content. We needed a way to detect "cache references images that no longer exist on disk" and re-fetch in that case (the `imagesExist()` check that became Phase A.4).

3. **Search.** A first instinct was to hide search for contributors without Algolia credentials — but Algolia's search-only key is public-by-design (shipped in the deployed HTML already). There's no security reason to conditionally render search. That instinct would have added complexity for no benefit.

## How did we fix it (or what was added to `TODO.md`)?

Wrote the multi-phase plan that became Track A:

- **A.1** Extract `BuildMode` as the single source of truth for env-mode decisions.
- **A.2** Mark `GOOGLE_CREDENTIALS_BASE64` optional; commit public Algolia keys as `default:` in `astro.config.mjs`.
- **A.3** Wire `BuildMode` into `content.config.ts`; fail-loud cache-miss errors.
- **A.4** `imagesExist()` cache safety check.
- **A.5** Dev-mode hint when Figure asset is missing.
- **A.6** `.gitignore` carve-out + secret-scan + seed cache.
- **A.7** End-to-end verification.

Two side-decisions recorded in `TODO.md`:

- Captions-only is acceptable for contributors. Image hosting deferred to Track D.
- Committing `.cache/docs/` (~8.7MB) is the short-term unlock. Long-term plan (D.1) is to publish content as a versioned R2 artifact, consistent with the recent PDF/audio R2 migration (commit `695ec5b`).

## Related

- [2026-06-01-plan-critique](./2026-06-01-plan-critique.md) — what the first draft of this plan got wrong
- [`docs/TODO.md`](../TODO.md) — the canonical task list with phase-by-phase status
- [`docs/ARCHITECTURE.md`](../ARCHITECTURE.md) — current pipeline reference
