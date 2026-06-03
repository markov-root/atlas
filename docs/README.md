# Documentation

Each file in this directory has a single purpose. The doc set is intentionally small — three kinds of writing (reference / strategy / process journal), each with a clear destination.

## Reference (current state + rationale)

| File | Audience | Purpose |
|---|---|---|
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Anyone working on the code | How the build pipeline, content loader, and Astro layer fit together. Includes "Why we chose this" subsections for the major architectural decisions. |
| [PRINCIPLES.md](./PRINCIPLES.md) | Anyone making design decisions | The 15 engineering principles this project applies, each with a code reference and rationale. Includes a closing list of classical SE concerns we deliberately don't worry about (and why). |
| [design-system.md](./design-system.md) | Anyone building UI | Visual patterns, component catalog, color tokens, icons, spacing reference |

## Strategy (direction of travel)

| File | Audience | Purpose |
|---|---|---|
| [ROADMAP.md](./ROADMAP.md) | Maintainer + interested public | Where the codebase is going: Now (1 month) / Next (1–3 months) / Later (3–12 months) / Not planned. Each item names the principle, code area, or constraint that motivates it. |

## Process journal (local-only)

| File | Audience | Purpose |
|---|---|---|
| `lessons/` *(gitignored)* | Maintainer + their agents | Per-session journal of what was tried, learned, where things got stuck, how they were fixed. Verbose by design — agent working memory, not public reference. Decision rationale lives in ARCHITECTURE/PRINCIPLES/ROADMAP, not here. |
| `TODO.md` *(gitignored)* | The maintainer | Active task tracker. Checkbox-driven, tactical, changes daily. ROADMAP is the strategic complement. |

## Conventions for all docs

- **Single purpose per file.** If a document is starting to serve two purposes, split it.
- **Code references where possible.** A principle without a pointer to the line that demonstrates it is just a slogan.
- **Decision rationale lives next to the thing it explains.** No separate `decisions/` or ADR directory — reasoning for principle-level choices goes in PRINCIPLES.md "Why" sections; reasoning for architectural choices goes in ARCHITECTURE.md "Why we chose this" subsections; reasoning for rejected directions goes in ROADMAP.md "Not planned."
- **Update the doc in the same change as the code.** A diff that says "behavior changed but no docs touched" is incomplete.

## Root-level files (GitHub-recognized)

GitHub auto-detects certain filenames at the repo root and surfaces them in its UI: `README.md` renders on the homepage; `LICENSE` is parsed for the licensing badge; `SECURITY.md` links from the security tab; `CODE_OF_CONDUCT.md` and `CONTRIBUTING.md` are surfaced from the PR-creation and community-standards flows. Keeping these at root (not under `docs/`) is what unlocks that behavior. Anything else — pipeline architecture, principles, design system, roadmap — is project-specific and lives in `docs/`.

| File | Purpose |
|---|---|
| [`../README.md`](../README.md) | Project entry point |
| [`../CONTRIBUTING.md`](../CONTRIBUTING.md) | Setup, workflow, where to make changes, what tests to run, commit conventions |
| [`../LICENSE`](../LICENSE) | MIT — covers code |
| [`../LICENSE-CONTENT`](../LICENSE-CONTENT) | CC BY-SA 4.0 — covers textbook prose |
| [`../SECURITY.md`](../SECURITY.md) | Vulnerability reporting policy |
| [`../CODE_OF_CONDUCT.md`](../CODE_OF_CONDUCT.md) | Contributor Covenant 2.1 by reference |
| [`../CLAUDE.md`](../CLAUDE.md) | Agent operating context (`AGENTS.md` symlinks here) |
| [`../.github/ISSUE_TEMPLATE/`](../.github/ISSUE_TEMPLATE) | Bug + feature templates |
| [`../.github/PULL_REQUEST_TEMPLATE.md`](../.github/PULL_REQUEST_TEMPLATE.md) | PR template with test-plan checklist |

## What's still missing

- No CI workflow for `pnpm test` yet (ROADMAP Now).
- No nightly content-refresh automation yet (ROADMAP Now).
- No accessibility audit yet (ROADMAP Next; PRINCIPLES §12 names the known gap).
- No discriminated-union AST types yet (ROADMAP Next; PRINCIPLES §11 names the debt).

See [ROADMAP.md](./ROADMAP.md) for full direction; the local TODO.md is the active task tracker.
