# 2026-06-01 — Test suite

## What did we try to do?

Add tests strong enough that a maintainer can change code with confidence the contributor build still works. Track B's original plan had three test phases (B.1 BuildMode unit tests, B.2 Transformer snapshots, B.3 smoke test). After shipping Track A we realised that wasn't enough — the surprises in A.7 hadn't been caught by unit tests, only by manual integration. So we expanded the suite before declaring Track A done.

## What did we learn?

Four layers, each protecting a specific class of regression:

| Layer | File | Tests | Catches |
|---|---|---|---|
| Pure unit (env logic) | `src/lib/build-mode.test.ts` | 16 | "Setting `SKIP_AUDIO` no longer disables audio when R2 creds present" — every env permutation has an expected mode |
| Storage layer | `src/textbook-loader/gdocsdk.test.ts` | 13 | "Cache hit no longer returns when images missing in contributor mode" / "Error stops naming the missing docId" |
| Integration | `src/textbook-loader/loader.test.ts` | 6 | "loadChapter drops sections" / "Glossary breaks" / "linkSections drops `prev/next` pointers" / "Same source no longer deterministic" |
| Snapshot (transformer) | `src/textbook-loader/transformer.test.ts` + `__snapshots__/` | 10 | "Transformer renames `Figure` to `Image`" / "Drops `Footnote` nodes" / structural drift across all 8 chapters |
| End-to-end (opt-in) | `tests/smoke/contributor-build.smoke.test.ts` | 1 | "Astro config break that crashes contributor build" / "Algolia keys stop reaching HTML" / "Figure.astro starts emitting broken `<img>`" |

Default `pnpm test`: 45 tests, ~7s, no network, no build. Smoke test gated behind `pnpm test:smoke` (~33s, runs full `pnpm build` in the same dir).

Two things that made the suite actually useful:

1. **Real fixtures over mocks.** The storage and integration layers use the committed `.cache/docs/` files as fixtures, not handcrafted stubs. Tests fail when *real* breakage happens, not when a mock contract drifts. The cost is that these tests are slower than pure unit tests, but they catch integration bugs no pure unit test can see.

2. **Structural snapshots, not full snapshots.** Each chapter's Transformer output is millions of characters of JSON — pointlessly large to snapshot. The test snapshots a *digest*: title, section count, per-section node-name histogram, slug shape, reading time. ~1200 lines total across 8 chapters. Reviewable, diffable, and a snapshot diff still flags the right class of regression (Transformer drops a node type, renames one, miscounts figures).

## Where did we get stuck and why?

### The hash-determinism test that wasn't

First version of the integration test asserted:

```ts
// loader.test.ts (first draft)
const a = await loader.loadChapter(FIRST_CHAPTER);
const b = await loader.loadChapter(FIRST_CHAPTER);
expect(a.contentHash).toBe(b.contentHash);  // failed
```

Failed immediately. Cause: `Transformer` carries per-textbook counters (figure numbers, equation indices) as mutable state on the `TextbookLoader` instance. The second `loadChapter` sees counters incremented by the first call, produces different output, different hash.

This is actually intentional — `"Figure 3.2"` requires knowing what chapter and figure we're up to. The bug was in the test's invariant: "same loader called twice" is not the right comparison. The real invariant is "same cached source + *fresh* loader → same hash" (so CI rebuilds are reproducible).

Fix:

```ts
const a = await new TextbookLoader(null, EDITION, { cacheOnly: true }).loadChapter(FIRST_CHAPTER);
const b = await new TextbookLoader(null, EDITION, { cacheOnly: true }).loadChapter(FIRST_CHAPTER);
expect(a.contentHash).toBe(b.contentHash);  // passes
```

This is a small case but it generalises: writing the test wrong can teach you something about the system's actual contracts. The Transformer's state model is now explicitly documented in `docs/ARCHITECTURE.md` so the next person doesn't trip on it.

### The smoke test that grabbed the wrong page

First version of the smoke test asserted Algolia keys appeared in `candidates[0]`. That happened to be `dist/chapters/index.html` — a 100-byte HTML redirect to `/read`. The test failed claiming Algolia was broken, but Algolia was fine — the test was checking a redirect stub.

Fix: sort candidate pages by word count and check the largest one. Redirects are tiny by construction; real chapter pages are 20K–60K words.

### The vitest.config.ts that already existed

While trying to add a smoke-test exclude pattern, `Write` errored: "File has not been read yet." Cause: the repo already had a 7-line `vitest.config.ts` (with just `globals: true`) that nobody had mentioned. The harness's safety check correctly refused to overwrite an existing file blindly. Read it first, then `Edit` to add the exclude pattern.

## How did we fix it (or what was added to `TODO.md`)?

All four layers landed in one commit (`68733aa test: comprehensive suite for contributor build (45 unit + 1 smoke)`). The smoke-test exclude went into the existing `vitest.config.ts`. `package.json` gained `test`, `test:watch`, `test:smoke`, and `typecheck` scripts.

Track B status in `TODO.md`:

- B.1 / B.2 / B.3 ✅ done in this commit
- B.4 — partial: `test`/`typecheck` scripts in place; lint/format not added yet
- B.5 — CI test workflow still pending
- B.6 — scheduled content-refresh workflow still pending

What we explicitly chose NOT to test:

- `Transformer` state model (per-textbook counters). Documented in ARCHITECTURE, fresh-loader determinism asserted, not a regression risk in practice.
- PDF generation. Skipped in contributor mode and out of test scope; would require Typst installed.
- Real audio generation. Same reason — requires ElevenLabs API.
- R2 upload/download paths. Requires real R2 creds.

## Related

- [2026-06-01-track-a-implementation](./2026-06-01-track-a-implementation.md) — what these tests are protecting
- [`docs/ARCHITECTURE.md`](../ARCHITECTURE.md) — "Test layers" table is the canonical reference
- [`docs/PRINCIPLES.md`](../PRINCIPLES.md) — layered testing is one of the documented principles
