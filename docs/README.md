# Documentation

Each file in this directory has a single purpose. Cross-references are by relative link.

| File | Audience | Purpose |
|---|---|---|
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Anyone working on the code | How the build pipeline, content loader, and Astro layer fit together |
| [CONTRIBUTING.md](./CONTRIBUTING.md) | External contributors | Setup, workflow, where to make changes, what tests to run |
| [PRINCIPLES.md](./PRINCIPLES.md) | Anyone making design decisions | The small set of engineering principles this project actually applies, with code references |
| [lessons/](./lessons/) | Maintainers + future agents | Chronological journal of what we tried, learned, and fixed (one file per event) |
| TODO.md *(local, not in repo)* | The maintainer | Active task tracker for OSS-readiness work |

## Conventions for these docs

- **Single purpose per file.** If a document is starting to serve two purposes, split it.
- **Code references where possible.** A principle without a pointer to the line that demonstrates it is just a slogan.
- **Date-stamped lessons, one event per file.** Format: `lessons/YYYY-MM-DD-short-topic.md`. Each entry answers four questions (see [lessons/README.md](./lessons/README.md)).
- **Update the doc in the same change as the code.** A diff that says "behavior changed but no docs touched" is incomplete.

## What's missing

- No `LICENSE` / `LICENSE-CONTENT` yet (planned: MIT for code, CC BY-SA 4.0 for textbook prose).
- No CI workflow for `pnpm test` yet (planned as Track B.5).
- No nightly content-refresh automation yet (Track B.6).

See `TODO.md` (local) for the canonical task list with phase-by-phase status.
