# Contributing

External contributions are welcome. If you hit a friction point that isn't covered here, that's a bug — please file an issue.

## Setup

```bash
git clone https://github.com/markov-root/atlas.git
cd atlas
pnpm install
pnpm dev
```

That's it. No `.env` file is needed for a contributor build. You should get a working dev server with the full textbook prose served from the committed `.cache/docs/` snapshot. Figures show captions but not images (intentional — see [ARCHITECTURE.md](./docs/ARCHITECTURE.md)).

If `pnpm dev` doesn't bind to an address you can reach (it defaults to `127.0.0.1`), pass `--host` explicitly:

```bash
pnpm dev --host 0.0.0.0
```

## What works without credentials

| Feature                               | Contributor build | Notes                                    |
| ------------------------------------- | ----------------- | ---------------------------------------- |
| Chapter text                          | ✓                 | From committed cache                     |
| Search                                | ✓                 | Public Algolia keys baked into the build |
| Inline equations, footnotes, callouts | ✓                 | All rendered from the cache              |
| Figures                               | Caption only      | Image assets are not committed           |
| PDF / audio                           | Skipped           | Maintainer-only, gated by `BuildMode`    |

The build prints which mode it resolved at startup:

```
[atlas] BuildMode: contributor, cache-only, no PDF, no audio, no R2 audio pull, no Algolia indexing, search enabled
```

## Environment variables

All env vars are optional. Copy `.env.example` to `.env` and fill in only the ones you need.

| Variable                                                               | Required for                    | Notes                                                             |
| ---------------------------------------------------------------------- | ------------------------------- | ----------------------------------------------------------------- |
| `GOOGLE_CREDENTIALS_BASE64`                                            | Refreshing textbook content     | Maintainer only                                                   |
| `ALGOLIA_WRITE_KEY`                                                    | Re-indexing search              | Maintainer only                                                   |
| `ELEVENLABS_API_KEY`                                                   | TTS audio rendering             | Maintainer only                                                   |
| `GEMINI_API_KEY`                                                       | Equation descriptions for audio | Maintainer only                                                   |
| `R2_ENDPOINT`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET` | Uploading PDFs/audio            | Maintainer only                                                   |
| `PUBLIC_ALGOLIA_APP_ID`, `PUBLIC_ALGOLIA_SEARCH_KEY`                   | —                               | Defaults committed in `astro.config.mjs`; leave blank to use them |
| `SKIP_PDF`, `SKIP_AUDIO`, `SKIP_AUDIO_DOWNLOAD`                        | Speeding up local iteration     | Bypass expensive stages even when creds are present               |

## Project map

For a tour of the code, see [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md). In particular:

- `src/lib/build-mode.ts` — single source of truth for env-mode decisions
- `src/content.config.ts` — Astro content collection entry point
- `src/textbook-loader/` — the Google Docs → AST → renderers pipeline
- `src/components/nodes/` — one Astro component per AST node type

## Where to make changes

Most likely contribution areas:

| Area                  | What lives here                        | Files                                                             |
| --------------------- | -------------------------------------- | ----------------------------------------------------------------- |
| Page layouts / styles | Astro pages and components             | `src/pages/`, `src/layouts/`, `src/components/`                   |
| Textbook rendering    | Per-node-type components               | `src/components/nodes/`                                           |
| Reader UX             | Section navigation, audio player, etc. | `src/lib/reader.ts`, `src/lib/audio-player.ts`, `src/components/` |
| Build pipeline        | Loader, transformer, renderers         | `src/textbook-loader/`                                            |
| Tests                 | All test layers                        | `src/**/*.test.ts`, `tests/smoke/`                                |

Editorial changes (chapter prose) happen in the Google Docs themselves, not in this repo. Contributors don't have access to the source docs by design; the workflow is "build a feature that improves how the textbook is rendered, not what it says."

## Translations

If you want to translate the Atlas into another language, see [`TRANSLATING.md`](./TRANSLATING.md). The workflow is Docs-first — translators don't need to touch Git or the Astro code. Open a `[Translation] {Language}` issue to get started.

## Workflow

1. **Branch off `main`** (the default branch).
2. **Run tests before you start** so you have a clean baseline:

   ```bash
   pnpm test
   ```

3. **Make the change.** Single-purpose commits, please. If you find yourself wanting to title a commit "feat: X and Y and Z", make three commits.
4. **Use `pnpm check` for fast feedback during iteration:**

   ```bash
   pnpm check           # typecheck + 45 unit/integration tests, ~10s
   ```

5. **`pnpm verify` is the full pre-push gate** (runs automatically via the `pre-push` git hook on every `git push`):

   ```bash
   pnpm verify          # lint + lint:actions + typecheck + test + build + test:smoke, ~80s
   ```

   If the hook blocks your push, fix the failure instead of bypassing with `--no-verify`. The hook runs the same chain CI runs on the PR — passing locally means passing in CI.

6. **Open a PR** with a description that says _what_ changed and _why_. The diff says _how_. CI will run `pnpm verify` again automatically.

## Commit conventions

Type prefixes used in this repo:

- `feat:` new functionality
- `fix:` bug fix
- `refactor:` no behaviour change
- `test:` test additions or changes
- `chore:` build, deps, config, infra
- `docs:` documentation only

No strict body format. One-paragraph "why" beats a templated body.

## Tests we expect for new code

**The behavioral-justification rule.** Every `describe`/`it` block in this repo has a 1–2 sentence comment above it that names the user-observable consequence of failure ("if this fails, readers see X / the build does Y"). New tests you add must include this. If you can't write the comment in two sentences — or the comment would describe implementation rather than a user — the test probably doesn't earn its place; either rewrite it at a higher level or skip it. Read any test file under `src/textbook-loader/` for examples, and see [`docs/PRINCIPLES.md`](./docs/PRINCIPLES.md) §16 for the full rationale (including how the 7 ISTQB testing principles apply here).

**Common cases:**

- If you add a new branch in `BuildMode`, add a permutation to `src/lib/build-mode.test.ts`.
- If you change the Transformer or add a new node type, update the snapshots:

  ```bash
  pnpm test -u
  ```

  …and review the snapshot diff carefully — it's the only thing that catches "Transformer drops `Footnote` nodes" class of regression. Snapshot files live next to their test in `__snapshots__/`.

- If you change the contributor build path (anything in `BuildMode` ↔ `gdocsdk` ↔ `content.config.ts`), run `pnpm test:smoke` locally and include the test output in the PR if there's any uncertainty.
- If you change URL routing or chapter/section slugs, the URL-stability snapshot in `tests/smoke/url-stability.smoke.test.ts` will diff. Update it deliberately and mention the redirect plan in the PR.

## Principles

We follow a small set of project-specific engineering principles documented in [`docs/PRINCIPLES.md`](./docs/PRINCIPLES.md). The two that matter most for day-to-day contribution:

- **Single source of truth for build behaviour** — env-mode decisions only happen in `src/lib/build-mode.ts`. If you find yourself writing `if (process.env.SKIP_X)` in some other file, you're probably about to make the code harder to maintain.
- **Fail loud, not silent** — when something can't work, throw an error that names the input and points at a fix.

## Where to ask

- **For a question about the codebase or a contribution proposal** — open a GitHub issue.
- **For a maintainer-side question (credentials, content workflow, etc.)** — open an issue and tag the maintainer.
- **For a bug in the contributor build path** — that's the most important class of bug we have right now; please file with steps to reproduce.

## License

Code is MIT, textbook content is CC BY-SA 4.0 — both covered in [`LICENSE`](./LICENSE). The same file names what counts as code vs. content.
