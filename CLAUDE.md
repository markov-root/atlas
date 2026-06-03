# AI Safety Atlas — agent operating context

This file is the agent-facing entry point. Project-facing docs live under `docs/`.

## Commands

- Use `pnpm` (not npm or yarn)
- `pnpm dev` — Start dev server (pass `--host 0.0.0.0` to bind beyond loopback)
- `pnpm build` — Build for production
- `pnpm test` — Unit + integration tests (~7s)
- `pnpm test:smoke` — End-to-end build smoke test (~33s)
- `pnpm typecheck` — `astro check`

## Where to look

| If you need to know... | Read |
|---|---|
| How the build pipeline, BuildMode, and Astro layer fit together | [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) |
| The engineering principles this project applies (with code references) | [`docs/PRINCIPLES.md`](./docs/PRINCIPLES.md) |
| How a contributor sets up and runs the project | [`CONTRIBUTING.md`](./CONTRIBUTING.md) |
| Visual patterns, components, spacing tokens, icons | [`docs/design-system.md`](./docs/design-system.md) |
| Where the codebase is going (Now / Next / Later / Not planned) | [`docs/ROADMAP.md`](./docs/ROADMAP.md) |
| Active task list (local-only) | `docs/TODO.md` |
| Internal process journal of past work sessions (local-only) | `docs/lessons/` |

`AGENTS.md` is a symlink to this file.

## Agent norms

- Prefer editing existing files to creating new ones. The doc set above is intentionally small and single-purpose; if you find yourself wanting a new doc, check whether the content belongs in an existing one first.
- Every principle in `docs/PRINCIPLES.md` has a code reference. When you change the code, check whether the matching principle needs updating in the same commit.
- `docs/TODO.md` and `docs/lessons/` are gitignored — write to them freely as working notes; they don't ship to the repo.
- Don't introduce ADRs or a separate decisions directory. Decision rationale lives inside `PRINCIPLES.md` and `ARCHITECTURE.md` "Why we chose this" subsections, and rejected directions go into `ROADMAP.md` "Not planned." We deliberately kept the doc taxonomy at three kinds (reference / strategy / process-journal).
