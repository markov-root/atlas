# Roadmap

Where this codebase wants to be, and why. This complements [`TODO.md`](./TODO.md) (tactical, local, checkbox-driven) with strategic direction.

Items are bucketed by horizon, not by priority within a bucket. Each item names the principle, code area, or constraint that motivates it.

---

## Now (current 1-month focus)

The credential-free contributor build is shipped (see [`ARCHITECTURE.md`](./ARCHITECTURE.md) "BuildMode") and the bulletproof-repo pass is shipped (ESLint, `pnpm verify`, pre-push hook, CI test workflow, Node 24 action bumps, branch renamed to `main`). The remaining "now" item is the format-the-codebase pass.

### Format-the-codebase pass (then re-enable format:check in verify)

`prettier --write .` against the existing codebase as a single formatting-only commit, then add `pnpm format:check` to `pnpm verify`. Currently `pnpm format` exists as a manual tool but format enforcement is deferred because (a) the bulk reformat hasn't happened and (b) `prettier-plugin-astro` can't parse one `.astro` file (HTML comment inside what it parses as JSX).

*Motivated by:* finishing the bulletproof pass cleanly — verify currently covers lint + typecheck + tests + build + smoke, but not formatting. Bug-class issues are covered; style isn't.
*Code area:* big format-only commit across `src/`, then a one-line addition to `pnpm verify` in `package.json`.

---

## Next (1–3 months)

### R2-published content artifact (replaces the git-committed cache)

The cache lives at `content.foreview.org/atlas-v1-en.tar.gz` as a versioned artifact signed by SHA256. A postinstall script downloads it to `.cache/docs/`. `.gitignore` reverts to ignoring all of `.cache/`. The git history stops growing with every content edit.

*Motivated by:* [`ARCHITECTURE.md`](./ARCHITECTURE.md) "Why a committed cache" explicitly names this as the planned exit path. The current arrangement is acceptable short-term but the git bloat is unbounded over time. Architecturally consistent with the existing PDF/audio R2 distribution (commit `695ec5b`).
*Code area:* new postinstall script in `package.json`, `.gitignore` revert, removal of `docs/lessons/` (already gone), `.cache/docs/README.md` updated, the scheduled refresh workflow republishes to R2 instead of opening a PR.

### Discriminated-union AST node types

Currently `Node = { name: string, attributes: Record<string, unknown>, children: Node[] }`. The looseness costs us TypeScript safety at the boundary between `Transformer` output and `NodeRenderer` dispatch. Refactor to a discriminated union: `Node = ParagraphNode | HeadingNode | FigureNode | ...` so consumers can type-narrow on `node.name`.

*Motivated by:* principle 11 (type safety where it catches bugs) — currently honest debt; this is the fix.
*Code area:* `src/textbook-loader/transformer.ts` (Node type definition), `src/components/NodeRenderer.astro` (the dispatcher that would benefit most), every file under `src/components/nodes/` (typed props).

### Accessibility audit and remediation

Run axe-core / Lighthouse against the deployed site. Thread real `alt` text from Google Docs image properties through to `Figure.astro`. Audit keyboard navigation in `Header`, `Reader`, search modal. Add automated a11y check to CI (axe-core via Playwright is the standard option).

*Motivated by:* principle 12 (accessibility) — explicitly aspirational in PRINCIPLES with named gaps; this closes the loop.
*Code area:* `src/components/nodes/Figure.astro`, `src/components/Header.astro`, `src/lib/reader.ts`, possibly new `tests/a11y/`.

---

## Later (3–12 months)

### Refactor `Transformer` to remove per-textbook shared state

`loadChapter(X)` produces a different content hash on a reused loader vs a fresh one, because the Transformer accumulates figure/equation counters as instance state. The test currently asserts the "fresh loader" invariant, which is correct but surprising. The Transformer could compute counters as a deterministic pass over the assembled chapter list rather than incrementing during traversal.

*Motivated by:* principle 4 (reproducibility) — currently "reproducibility holds *if* you use a fresh loader" which is a footnote we'd rather not have. Lower-priority because the test catches the actual bug class.
*Code area:* `src/textbook-loader/transformer.ts`, `src/textbook-loader/loader.ts`.

### First-class image hosting for contributors (probably R2)

When the R2 content artifact lands (Next), extend it to include image assets so contributors get real figures, not just captions. The current "captions only" experience is acceptable but is a friction point for visual/layout contributors. Should follow the same pattern: published versioned artifact, postinstall fetches, no LFS.

*Motivated by:* contributor experience for visual work. Currently a Track A trade-off accepted explicitly in [`CONTRIBUTING.md`](../CONTRIBUTING.md).
*Code area:* postinstall script extension, possibly new `src/assets/uc/` carve-out treatment.

### Second-language edition (only when actually being written)

The data model already supports it (`language: 'en'` field on `TextbookDefinition`, IDs like `v1-en`/`v1-fr`). The infrastructure to handle it (i18n routing, language switcher, per-edition glossaries) is not built. We deliberately defer until a real translation is in progress — see principle 10 (YAGNI).

*Motivated by:* anticipated French edition from CeSIA collaborators, but not started.
*Code area:* `src/pages/` (locale routing), `src/components/` (language switcher), `src/textbook-loader/data.ts`.

---

## Not planned (explicit non-goals)

These are deliberate rejections, with the reasoning documented so they don't get re-litigated. The same list also appears in PRINCIPLES.md §14 in short form; this is the long-form explanation.

### No MDX/markdown migration of the textbook source

Authors edit in Google Docs because real-time co-editing, inline comments, and suggestion-mode review are already familiar workflows. Migrating to MDX would require every contributing author to learn Git + markdown + a custom dialect for footnotes/callouts/equations. The infrastructure burden of Google Docs auth is real but smaller than that author-onboarding cost. See [`ARCHITECTURE.md`](./ARCHITECTURE.md) "Editorial surface — why Google Docs."

### No microservices split

The site is a static build behind a CDN. The maintainer-side pipeline is a single Node process that runs ~once per content change. Splitting it into services would add operational overhead with no payoff. Stays a monolith.

### No public JS/TS API

The deliverable is the website. We don't ship a library. If someone wants to consume the parsed AST programmatically, they can fork the textbook-loader module — but the project's contract with consumers is the URL space (principle 13), not exports.

### No authentication, user accounts, comments

Readers are anonymous. Comments and editorial input happen in the Google Docs source, not on the deployed site. Adding auth would create a security surface (sessions, tokens, password reset flows) and a moderation responsibility that isn't justified by the project's goals.

### No CHANGELOG.md or SemVer until we tag versions

The site is continuously deployed from `main`. There's no versioned release to changelog against. When we cut a first real release (e.g. when content publishing moves to R2 with versioned artifacts), CHANGELOG and SemVer-style versioning become useful. Until then they'd be ceremonial.

### No CODEOWNERS file

One maintainer with optional contributors. CODEOWNERS becomes useful when there's review routing to do across multiple owners; we're not there.

### No scheduled content-refresh workflow

A nightly cron that pulls fresh chapter prose from Google Docs and opens a PR would close a real ergonomic gap (the cache goes stale unless the maintainer remembers to refresh it). But chapters in Google Docs are continuously edited in suggestion-mode; not every save is publishable. Pulling on a schedule would mean either (a) requiring author discipline that contradicts the editorial workflow, or (b) gating with a manual approval step that's effectively what we have today via `pnpm build` locally. Decision: keep content refresh manual. The maintainer runs `pnpm build` when chapters are ready to ship and commits the resulting `.cache/docs/` diff.

---

## How this doc relates to TODO.md

`TODO.md` (local-only) is the active checkbox list — "do these phases in this order, here are the commits." It changes daily.

This file (`ROADMAP.md`) is strategic — "here's where we want to be, here's what we'd do if we had a free week." It changes when direction changes, not when work happens. If you find yourself updating ROADMAP because you finished a task, you should be updating TODO instead.

---

*Last updated: 2026-06-01.*
