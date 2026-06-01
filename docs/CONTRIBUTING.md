# Contributing

External contributions are welcome. If you hit a friction point that isn't covered here, that's a bug — please file an issue.

## Setup

```bash
git clone https://github.com/markov-root/atlas.git
cd atlas
pnpm install
pnpm dev
```

That's it. No `.env` file is needed for a contributor build. You should get a working dev server with the full textbook prose served from the committed `.cache/docs/` snapshot. Figures show captions but not images (intentional — see [ARCHITECTURE.md](./ARCHITECTURE.md)).

If `pnpm dev` doesn't bind to an address you can reach (it defaults to `127.0.0.1`), pass `--host` explicitly:

```bash
pnpm dev --host 0.0.0.0
```

## What works without credentials

| Feature | Contributor build | Notes |
|---|---|---|
| Chapter text | ✓ | From committed cache |
| Search | ✓ | Public Algolia keys baked into the build |
| Inline equations, footnotes, callouts | ✓ | All rendered from the cache |
| Figures | Caption only | Image assets are not committed |
| PDF / audio | Skipped | Maintainer-only, gated by `BuildMode` |

The build prints which mode it resolved at startup:

```
[atlas] BuildMode: contributor, cache-only, no PDF, no audio, no R2 audio pull, no Algolia indexing, search enabled
```

## Project map

For a tour of the code, see [`ARCHITECTURE.md`](./ARCHITECTURE.md). In particular:

- `src/lib/build-mode.ts` — single source of truth for env-mode decisions
- `src/content.config.ts` — Astro content collection entry point
- `src/textbook-loader/` — the Google Docs → AST → renderers pipeline
- `src/components/nodes/` — one Astro component per AST node type

## Where to make changes

Most likely contribution areas:

| Area | What lives here | Files |
|---|---|---|
| Page layouts / styles | Astro pages and components | `src/pages/`, `src/layouts/`, `src/components/` |
| Textbook rendering | Per-node-type components | `src/components/nodes/` |
| Reader UX | Section navigation, audio player, etc. | `src/lib/reader.ts`, `src/lib/audio-player.ts`, `src/components/` |
| Build pipeline | Loader, transformer, renderers | `src/textbook-loader/` |
| Tests | All test layers | `src/**/*.test.ts`, `tests/smoke/` |

Editorial changes (chapter prose) happen in the Google Docs themselves, not in this repo. Contributors don't have access to the source docs by design; the workflow is "build a feature that improves how the textbook is rendered, not what it says."

## Workflow

1. **Branch off `astro-rewrite`** (currently the default branch — this will change once the rewrite is merged).
2. **Run tests before you start** so you have a clean baseline:

   ```bash
   pnpm test
   ```

3. **Make the change.** Single-purpose commits, please. If you find yourself wanting to title a commit "feat: X and Y and Z", make three commits.
4. **Re-run tests:**

   ```bash
   pnpm test            # 45 unit + integration tests, ~7s
   pnpm typecheck       # astro check
   pnpm test:smoke      # opt-in, runs full build (~33s) — recommended before opening a PR
   ```

5. **Open a PR** with a description that says *what* changed and *why*. The diff says *how*.

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

If you add a new branch in `BuildMode`, add a permutation to `src/lib/build-mode.test.ts`.

If you change the Transformer or add a new node type, update the snapshot:

```bash
pnpm test -u
```

…and review the snapshot diff carefully — it's the only thing that catches "Transformer drops `Footnote` nodes" class of regression.

If you change the contributor build path (anything in `BuildMode` ↔ `gdocsdk` ↔ `content.config.ts`), run `pnpm test:smoke` locally and include the test output in the PR if there's any uncertainty.

## Principles

We follow a small set of project-specific engineering principles documented in [`PRINCIPLES.md`](./PRINCIPLES.md). The two that matter most for day-to-day contribution:

- **Single source of truth for build behaviour** — env-mode decisions only happen in `src/lib/build-mode.ts`. If you find yourself writing `if (process.env.SKIP_X)` in some other file, you're probably about to make the code harder to maintain.
- **Fail loud, not silent** — when something can't work, throw an error that names the input and points at a fix.

## Where to ask

- **For a question about the codebase or a contribution proposal** — open a GitHub issue.
- **For a maintainer-side question (credentials, content workflow, etc.)** — open an issue and tag the maintainer.
- **For a bug in the contributor build path** — that's the most important class of bug we have right now; please file with steps to reproduce.

## License

Code is intended to be MIT-licensed; textbook prose is CC BY-SA 4.0. These licenses haven't been added to the repo yet (planned). Don't submit a PR depending on a permissive interpretation of "no license = public domain" — it doesn't, and the eventual licenses will be applied retroactively.
