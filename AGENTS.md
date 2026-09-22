# AI Safety Atlas — agent operating context

This file is the agent-facing entry point. Project-facing docs live under `docs/`.

## Commands

- Use `pnpm` (not npm or yarn)
- `pnpm dev` — Start dev server (pass `--host 0.0.0.0` to bind beyond loopback)
- `pnpm build` — Build for production
- `pnpm test` — TypeScript unit + integration tests (~10s)
- `pnpm test:py` — Python unit tests, the citation half (`uv run pytest`, ~11s)
- `pnpm test:smoke` — End-to-end build smoke test (~33s)
- `pnpm typecheck` — `astro check` + `tsc -p cli/tsconfig.json`
- `pnpm lint` — ESLint (warnings tolerated; errors fail)
- `pnpm lint:py` — `ruff check` + `ruff format --check` over `python/`
- `pnpm lint:actions` — Validate `.github/workflows/*.yml`
- `pnpm check` — Fast pre-commit gate: typecheck + both test suites (~25s)
- `pnpm verify` — Full pre-push gate: both linters + typecheck + both test suites + docs:check + build + smoke + a11y (~100s)

The `pnpm verify` chain is enforced automatically as a `pre-push` git hook (`.githooks/pre-push`, activated by `pnpm install`'s `prepare` script). Use `git push --no-verify` only when fixing a genuine emergency.

**The project is two languages since `task:0029`.** The site and the document pipeline are TypeScript; the citation resolvers, CSL store and bibliography exports are Python under `python/atlas_citations/`, run through `uv`. The boundary is `data/citations/citations.json`, written by `atlas citations scan`. Nothing in the site build needs Python — only `pnpm verify` and the `atlas citations` verbs do. Run `uv sync` once.

## Where to look

| If you need to know...                                                 | Read                                             |
| ---------------------------------------------------------------------- | ------------------------------------------------ |
| How the build pipeline, BuildMode, and Astro layer fit together        | [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) |
| The engineering principles this project applies (with code references) | [`docs/PRINCIPLES.md`](./docs/PRINCIPLES.md)     |
| How a contributor sets up and runs the project                         | [`CONTRIBUTING.md`](./CONTRIBUTING.md)           |
| Visual patterns, components, spacing tokens, icons                     | [`docs/DESIGN.md`](./docs/DESIGN.md)             |
| Where the codebase is going (Now / Next / Later / Not planned)         | [`docs/ROADMAP.md`](./docs/ROADMAP.md)           |
| Active engineering tasks & continuation handoffs (governed records)    | `docs/tasks/`, `docs/handoffs/`                  |
| Adopted engineering policy (checks, path signals, document roles)      | [`engineering.yaml`](./engineering.yaml)         |
| Historical OSS-readiness plan (local-only)                             | `docs/TODO.md`                                   |
| Internal process journal of past work sessions (local-only)            | `docs/lessons/`                                  |

`CLAUDE.md` is a symlink to this file (`AGENTS.md` is the canonical instruction file).

## Agent norms

- Prefer editing existing files to creating new ones. The doc set above is intentionally small and single-purpose; if you find yourself wanting a new doc, check whether the content belongs in an existing one first.
- Every principle in `docs/PRINCIPLES.md` has a code reference. When you change the code, check whether the matching principle needs updating in the same commit.
- `docs/TODO.md` and `docs/lessons/` are gitignored — write to them freely as working notes; they don't ship to the repo.
- **This repo has adopted the software-engineering skill (`engineering.yaml`).** Track non-trivial work as governed **task** records under `docs/tasks/` and continuation state as **handoff** records under `docs/handoffs/`. Allocate records with `engineering document new <role> --title "..."` (never hand-mint IDs, UIDs, or dates), fill the template body, register them in the role `INDEX.md`, and run `engineering document validate` before completion. Query open work with `engineering document query --role task --compact`.
- Decision records: use the governed **`adr`** role for consequential standalone decisions; smaller rationale may still live inline in `PRINCIPLES.md`/`ARCHITECTURE.md` "Why we chose this" subsections, with rejected directions in `ROADMAP.md` "Not planned." (This supersedes the earlier rule that forbade ADRs and fixed a three-kind taxonomy — the project now aligns with the skill's document roles.)
