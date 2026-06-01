# 2026-06-01 — Plan critique

## What did we try to do?

Before executing the credential-wall plan, validate it. The first draft (in an earlier `LESSONS.md` / `TODO.md`) had been written by an agent and approved on a quick read. We wanted to subject it to a deliberate adversarial review — *not* taking existing planning docs as gospel just because someone wrote them down.

## What did we learn?

A good plan can still be subtly wrong. Nine weaknesses surfaced (W1–W9 in the critique notes). The ones that mattered most:

- **W1 — Committing generated content is an anti-pattern.** The plan committed `.cache/docs/` to `main` with no exit strategy. Git history would bloat over years of textbook edits. Long-term we want the cache as a versioned artifact (R2 download at install time), consistent with how PDFs/audio already work. Accepted short-term commit as the simplest unlock; documented Track D.1 as the exit.

- **W3 — Hiding search for contributors is unnecessary.** The plan added conditional rendering in `DocSearchProvider`, `Header`, and `Reader` to handle "Algolia not configured". But the *search-only* key is public-by-design; it's already in the deployed HTML. There was no security reason for the conditional — it was complexity invented to handle a problem that didn't need to exist. Fix: commit the public keys as `default:` values in the env schema, delete all the conditional rendering work.

- **W4 — Mode-decision logic was scattered across 5+ files.** Each call site re-derived "are we in contributor mode?" by re-checking env vars. Hard to test, hard to change. Refinement: extract a typed `BuildMode` module as the single decision point. Every consumer reads `mode.x` instead of probing env directly. This became the keystone refactor — everything else got cleaner because of it.

- **W5 — Verification was too narrow.** Original plan checked "build succeeds, text renders." Didn't check: cache hit = fresh fetch parity, browser console clean, cache files free of accidentally-pasted secrets, cross-platform paths, hot reload. Refinement: layered test plan (unit → integration → contributor-flow smoke).

- **W6 — Security/privacy wasn't surfaced.** Committed cache files would become public artifacts. Authors sometimes paste API keys or internal URLs into Google Docs while editing. Refinement: mandatory secret-scan procedure (documented in `.cache/docs/README.md`) run before every cache-content commit.

- **W7 — Plan didn't unblock the contributor today.** Even if implementation started immediately, the contributor would stay blocked until Tracks A.1–A.6 landed. Refinement: out-of-band cache zip via secure channel (Phase A.0) as a parallel hotfix. As it turned out the actual implementation moved fast enough that A.0 became "just pull the branch."

Three weaknesses were explicit trade-offs accepted rather than refinements:

- **W2 — Captions-only figures.** Image hosting deferred entirely. `Figure.astro` already degrades cleanly.
- **W8 — Manual cache refresh.** Track B.6 will add a scheduled GitHub Action; until then, maintainer-driven refresh is fine.
- **W9 — `CLAUDE.md` ↔ `AGENTS.md` symlink.** Acknowledged as a known duplication, not worth churning.

## Where did we get stuck and why?

The critique itself wasn't blocked, but two meta-lessons emerged:

1. **The first instinct ("hide the feature") was the wrong abstraction.** When a feature seems hard to enable for some users, the question is whether it *should* be conditional at all — not how to gate it cleanly. The Algolia case is a clear example: the answer was "always render search; the keys are public."

2. **"Single source of truth" cuts more complexity than any other principle here.** Before W4 was applied, every phase of the plan had its own little env-mode branch. After extracting `BuildMode`, phases collapsed: A.2 became "make env optional, commit defaults"; A.3 became "wire `BuildMode` into one file"; phases that were previously about conditional rendering disappeared entirely.

## How did we fix it (or what was added to `TODO.md`)?

Rewrote `docs/TODO.md` with:

- A new §1 listing the explicit software-engineering principles the plan would encode (SRP via BuildMode; fail-loud cache misses; defence in depth; reproducibility; observability via startup banner; no backwards-compat cruft).
- A new §3 layered test plan.
- A new §4 security/privacy section including the mandatory secret-scan procedure.
- The original 7-phase plan restructured into Tracks A/B/C/D with explicit ⏸ pause checkpoints.

This restructured plan is what Track A executed against.

## Related

- [2026-06-01-credential-wall-audit](./2026-06-01-credential-wall-audit.md) — the original analysis the plan was responding to
- [2026-06-01-track-a-implementation](./2026-06-01-track-a-implementation.md) — what the refined plan actually shipped as
- [`docs/PRINCIPLES.md`](../PRINCIPLES.md) — the principles that survived this critique and are now project-canon
