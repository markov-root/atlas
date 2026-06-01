# 2026-06-01 — Track A implementation

## What did we try to do?

Execute the refined Track A plan in one focused session: ship a credential-free contributor build. Nine numbered phases (A.0–A.7) with explicit pause checkpoints. Each phase ends in a commit. Goal: a fresh `git clone` + empty `.env` + `pnpm install && pnpm dev` should serve the textbook prose with no error.

## What did we learn?

It worked end-to-end in 9 commits on `astro-rewrite` (~2 hours including test verification):

| Commit | Phase | What |
|---|---|---|
| `5c2aeba` | A.1 | `src/lib/build-mode.ts` + 10 unit tests — single source of truth |
| `af944f5` | A.2 | `GOOGLE_CREDENTIALS_BASE64` optional; Algolia public keys as `default:` |
| `182b6b0` | A.3 | content.config.ts driven by `BuildMode`; startup banner; fail-loud cache miss |
| `24b996f` | A.4 | `DocsSDK.imagesExist()` + 5 tests |
| `b869364` | A.5 | Dev-mode hint in `Figure.astro` |
| `303201d` | A.6 | `.gitignore` carve-out + secret-scan procedure docs |
| `b954261` | A.6 | Seeded `.cache/docs/` (8 chapter tabs, ~8.7MB) |
| `b2646b9` | A.7 (extra) | `pnpm-workspace.yaml` build allow-list |
| `77200db` | A.7 (extra) | DocSearch `astro:env/client` migration |

Final contributor build: 395 pages in ~30s, no `.env`, search HTML wired with the public keys.

Three concrete surprises along the way, each documented below.

## Where did we get stuck and why?

### Surprise 1 — Two Astro env systems in one project

`src/components/DocSearchProvider.astro` and `AlgoliaSearch.astro` read keys via `import.meta.env.PUBLIC_ALGOLIA_*`. The committed defaults in `astro.config.mjs`'s env schema didn't flow through, so the contributor build silently produced search containers wired to `undefined` keys.

Cause: Astro has two parallel env systems. `import.meta.env.*` is Vite's, which only reads `.env` files. `astro:env/client` is the schema-driven one that respects the `default:` field. They look similar but are not the same. Mixing them silently breaks defaults.

Caught by: the smoke test grepping for `W6WTQ7JBP1` in the built HTML and finding zero matches.

### Surprise 2 — `pnpm-workspace.yaml` was load-bearing-but-untracked

A fresh `/tmp` clone failed `pnpm test` with `[ERR_PNPM_IGNORED_BUILDS]`. Cause: pnpm v10+ refuses to run install-time build scripts unless they're listed in `pnpm.onlyBuiltDependencies`. The repo had a `pnpm-workspace.yaml` with `sharp`/`esbuild`/`protobufjs` allow-listed — but it had never been committed. Every fresh clone regenerated a blank template.

`pnpm install` initially succeeds (just warns), but every *subsequent* pnpm command (including `pnpm test`) re-runs dependency check and exits non-zero. The contributor experience was broken in a way no maintainer would notice — local dev was fine because the file existed locally.

### Surprise 3 — `.cache/` carve-out gotcha

First gitignore attempt:

```
.cache/
!.cache/docs/
```

Git refused to add `.cache/docs/<file>` — "ignored by one of your .gitignore files". Cause: when a directory is itself ignored (`.cache/`), children can't be un-ignored. Pattern must be `.cache/*` (ignores everything INSIDE) plus `!.cache/docs/` (un-ignores the docs subdir).

### Smaller things

- `Transformer` accumulates per-textbook counters (figure numbers, etc.) on the `TextbookLoader` instance. `loadChapter(X)` twice on the same loader produces different content hashes. Surfaced by an integration test that asserted "same source → same hash" without thinking about it. Fixed the test to use fresh loaders; left the Transformer state model untouched (it's intentional, and out-of-scope to refactor).
- Pre-existing unused imports flagged by `astro check` (`Auth` in `gdocsdk.ts`, `z` in `content.config.ts`). Left as-is — not Track A scope.

## How did we fix it (or what was added to `TODO.md`)?

Each surprise became a commit:

- Surprise 1 → `77200db fix: read public Algolia keys from astro:env/client`
- Surprise 2 → `b2646b9 chore: commit pnpm-workspace.yaml with build allow-list`
- Surprise 3 → fixed in the gitignore commit `303201d` after debugging

Updated `docs/TODO.md` Track A status: all 7 phases ✅ plus the two A.7 extras called out by commit hash. The remaining open items moved into Track B (CI workflow, lint/format) and Track C (licenses, README, CONTRIBUTING).

The first two surprises would have remained latent bugs without the contributor-flow verification step. They were not caught by `pnpm test` or `pnpm typecheck`. The lesson: smoke-test the actual contributor flow in a fresh clone, not just the maintainer's working copy. A.7 paid for itself the first time it ran.

## Related

- [2026-06-01-plan-critique](./2026-06-01-plan-critique.md) — the plan that was executed here
- [2026-06-01-test-suite](./2026-06-01-test-suite.md) — what we built to prevent regressions
- [`docs/ARCHITECTURE.md`](../ARCHITECTURE.md) — current pipeline reference
