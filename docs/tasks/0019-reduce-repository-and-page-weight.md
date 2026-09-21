---
schema_version: 2
id: "0019"
uid: "task-20260921T203527686466Z-fbc92ebd"
title: "Reduce repository and page weight"
role: task
status: todo
summary: "Cut the 1.59 GiB clone, oversized images, eager .words.json fetch and per-push PDF/image rebuilds — with the history-rewrite decision surfaced first."
created: "2026-09-21"
updated: "2026-09-21"
owner: Markov Grey
supersedes: ""
superseded_by: ""
engineering_document:
  version: 1
  contract_tier: full
  role: task
  id: "0019"
  uid: task-20260921T203527686466Z-fbc92ebd
  title: "Reduce repository and page weight"
  state: todo
  authority:
    kind: work-state
    owner: Markov Grey
    scope: "CONTRIBUTING.md clone documentation, committed images under src/assets/, the .words.json fetch path in src/lib/word-highlight.ts, deploy.yml CI caching, and the history-rewrite decision recorded here — any rewrite command itself gated on D1"
  created: "2026-09-21"
  updated: "2026-09-21"
  transition_history: unverified
  transitions: []
  relationships: []
  details:
    criteria: [criterion:AC-1, criterion:AC-2, criterion:AC-3, criterion:AC-4, criterion:AC-5]
    size: m
    priority: p2
---

# Task 0019: Reduce repository and page weight

## Problem

Two weight problems, deliberately one task because they trade off against each other.

**Repository weight.** The git pack is **1.59 GiB against under 30 MB of live payload**
(`audit:0004` F1): 27 `.mp3`, 18 `.zip` and 9 `.pdf` paths added and later removed under the
pre-Astro Docusaurus layout, all still in history. Every clone — including every new contributor's,
on the exact onboarding path `lesson:0001` exists to protect — pays ~1.6 GB for files no branch
contains. On top sits 16.9 MB of committed images under `src/assets/`, twelve of them over 500 KB
(portrait photographs at 1.5–1.7 MB; `audit:0004` F2) — not reader-facing page weight (Astro's
image pipeline optimizes at build time), but repo weight paid on every clone, compounding F1.

**Page and build weight.** The largest measured reader-facing cost per timed section page is the
**eager `.words.json` fetch** (`audit:0010` F1): 71 committed word-timing payloads totalling
6,084,574 bytes raw (measured on this working copy: ~6.08 MB, mean 85.7 KB; ~22 KB average on the
wire if the host compresses JSON, ~86 KB if not) — fetched unconditionally on page load
(`word-highlight.ts:598-607`) for every visitor, while the audio itself is correctly
`preload="none"` (`Reader.astro:376`). The audio index is eager; the audio is not. On the build
side, the deploy profile re-renders **all 8 PDFs** (Typst; `SKIP_PDF` unset in `deploy.yml`,
`loader.ts:77-79`) and reprocesses **~200 MB of images** (344 gitignored files under
`src/assets/uc/` with no CI cache) on every push (`audit:0010` F7) — costs that grow linearly as
Edition 2 and translations roughly double the chapters.

**⚠️ The irreversible part — read before executing.** The only fix that shrinks the *existing*
pack is a **git history rewrite on a public repository with outside contributors**: it rewrites
every commit SHA, breaks existing clones and forks, invalidates every SHA cited in project records
(`lesson:0003` cites `5c2aeba`…`b2646b9`; `lesson:0006` cites `9251406`, `d6011ca`, `133866a`), and
invalidates any external link to a commit. **It cannot be undone for anyone who has already built
on the rewritten history** — you can force-push back, but every clone made in between is stranded.
`audit:0004` rec 1 is explicit: this is an owner decision, not an engineering one, and a no-risk
partial (documenting `git clone --depth 1` in `CONTRIBUTING.md`) captures most of the onboarding
benefit at near-zero risk. That decision is D1 and nothing in this task runs a rewrite command
before it is decided and recorded.

## Decisions required before execution

### D1 — History rewrite: yes, no, or later

**Question:** do we rewrite history to drop the pre-Astro binaries, at the cost of rewriting every
SHA in a public repo?

- **Yes now:** ~50× clone reduction (1.59 GiB → ~30 MB payload); benefits every future clone
  immediately. **Irreversible and coordination-heavy** (see ⚠️ above): every contributor must
  re-clone or carefully rebase, every fork diverges permanently, every SHA citation in `docs/` and
  any external link to a commit breaks, and the coordination must reach outside contributors whose
  list we do not fully control.
- **No — adopt the no-risk partial:** document the expected clone size and `git clone --depth 1`
  in `CONTRIBUTING.md` (`audit:0004` rec 1's recommendation). Captures most of the onboarding
  benefit for new contributors at near-zero risk; the pack keeps growing slowly with content edits
  (bounded once the R2 content-artifact item — ROADMAP "Next" — stops committing `.cache/docs/`).
- **Later:** defer the decision while doing the partial now; the rewrite option stays open but the
  pack grows in the meantime.

**Recommendation:** **No, for now — take the partial.** The onboarding constituency `lesson:0001`
describes is served almost entirely by `--depth 1` documentation; the rewrite's coordination cost
falls on a public repository whose contributor base and fork graph we cannot fully enumerate, and
`audit:0004` explicitly recommends the cheap alternative first. Revisit only if the pack becomes a
measured blocker, and before any rewrite: verify no outside forks/PRs are active, publish a
rewrite-coordination notice, and decide what happens to the `docs/lessons/` SHA citations (dead
SHA links are a known, acceptable cost *if* recorded).

**Irreversible if decided wrongly:** a rewrite cannot be rolled back for other people's clones.
Decided wrongly in the *other* direction (never rewriting) is recoverable at any later time — which
is exactly why "no for now" is the cheap side of this decision.

### D2 — Image optimisation with or without the rewrite

**Question:** is re-encoding the 12 oversized committed images worth doing if history is not being
rewritten (new blobs are *added*; nothing shrinks)?

- **Do it regardless:** size S, `sharp` is already a dependency; prevents the live-tree weight
  from growing and cuts fresh-clone checkout size even though the pack barely moves.
- **Only with a rewrite:** purist position — reclaiming 16.9 MB inside a 1.59 GiB pack is noise;
  don't churn image assets for a rounding error.

**Recommendation:** do it regardless (size S, near-zero risk) — the twelve portraits at 1.5–1.7 MB
are one to two orders of magnitude above rendered need (`audit:0004` F2), and "stop growing" has
value independent of "shrink what exists". Not worth gating on D1 in either direction.

**Irreversible if decided wrongly:** nothing — image re-encoding is reversible in the live tree
(originals can be restored), though once re-encoded commits exist, the old blobs remain in history
either way.

### D3 — Lazy vs eager `.words.json`

**Question:** should the read-along timings fetch on page load, or only on playback intent?

- **Gate on first play/seek** (`audit:0010` rec 2): visitors who never listen stop paying ~22–86 KB
  per timed page; highlight readiness lags play-start by one round-trip on first play.
- **Gate on idle** (`requestIdleCallback`): keeps highlight instantly ready when play happens
  later; visitors still pay the transfer, just later and off the critical path.
- **Keep eager:** zero UX risk; keeps the largest measured eager transfer on every timed page.

**Recommendation:** gate on first play/seek intent, keeping the eager path only if a page
preloads its audio (none currently do — audio is `preload="none"` everywhere). The round-trip lag
on first play is the honest trade-off; the audio player's own first-play path already pays a
network wait, so the timing fetch joins a wait that exists. Small client-side change in
`word-highlight.ts`; fully reversible (no pipeline change).

**Irreversible if decided wrongly:** nothing material — the fetch gate is a client behaviour, and
the committed `.words.json` table design (71 files, ~6 MB per content refresh, growing linearly
with sections × languages per `audit:0010` F1) is itself acceptable and unchanged by this decision.

### D4 — Deploy-build costs: cache or stop rendering?

**Question:** does the deploy build keep re-rendering all 8 PDFs and reprocessing 200 MB of images
per push, and if not, is the fix CI caching (fix the cost) or a build-profile change (remove the
work — e.g. publish PDFs from a maintainer run instead)?

- **CI caching** (`audit:0010` rec 7): cache `.cache/uc` and Typst outputs keyed on content hash
  (the artifacts already carry content-hash keys). Fix the repeated cost without changing what the
  deploy produces. Risk: cache-invalidation bugs; mitigate by keying on content hash.
- **Profile change** (deploy stops rendering PDFs): removes the work entirely, but changes the
  deploy contract — PDFs then come from a maintainer build, adding a manual step and a staleness
  window to PDF publication.

**Recommendation:** CI caching now (contained, no contract change); treat the deeper question —
should deploy render PDFs at all — as part of the Edition 2 scaling plan rather than piecemeal, per
`audit:0010`'s own disposition of F7.

**Irreversible if decided wrongly:** nothing in this band — both options are CI configuration.
The one real hazard is a stale-cache bug shipping outdated PDFs or images silently; the content-hash
keying and the existing artifact-hash design are the guardrails.

## Scope

In execution order; steps 1–4 are safe standalone and independent of D1's answer:

1. **Record decisions D1–D4** (this record or successor ADRs). D1 gates everything rewrite-related;
   nothing below executes a rewrite before it is decided.
2. **No-risk partial:** document expected clone size and `git clone --depth 1` as the suggested
   contributor command in `CONTRIBUTING.md`, regardless of D1.
3. **Image optimisation:** re-encode the twelve >500 KB committed images (sharp; sanity resolution
   for rendered size), verify rendered output unchanged to the eye and the build pipeline still
   consumes them.
4. **Lazy `.words.json`:** gate `fetch(wordsUrl)` (`word-highlight.ts:598-607`) on first
   play/seek intent per D3; verify highlight still works on play and that page load without play
   issues no `.words.json` request.
5. **CI caching:** add cache for `.cache/uc` and Typst outputs to `deploy.yml`, keyed on content
   hash (D4's recommended band).
6. **History rewrite — only if D1 decides yes:** a separate, explicitly coordinated execution
   (contributor notice, re-clone instructions, SHA-citation reconciliation in `docs/lessons/`) —
   not part of steps 1–5's change set.

## Out of scope

- **The R2 content-artifact migration** (ROADMAP "Next", depends on task:0002) — the actual exit
  path for the *growing* cache commits; this task only documents the clone mitigation for the
  *existing* pack.
- **audit:0004 F3/F4 fixes** (dependency placement, dead `.gitignore` entries) — trivial but
  separate hygiene, not weight.
- **Unscanned history blob types** — `audit:0004`'s history scan covered `.mp3/.zip/.pdf/.mp4`
  only; F1 attributes a *sufficient* cause, not the complete one. A rewrite decision would warrant
  a full blob census first.
- **Bundle/client-JS weight** (DocSearch, analytics) — `audit:0010` F8, belongs to the ROADMAP
  page-load performance pass.
- **The contributor-images gap** (`src/assets/uc/` gitignored → contributor builds ship
  caption-only figures, `audit:0010` F7) — a Roadmap "Later" image-hosting item, not this task.

## Done when

- **AC-1:** D1–D4 are each decided and recorded; the D1 entry states the irreversibility
  consequences in its own words (SHA rewrites, fork divergence, `docs/lessons/` SHA citations)
  before any rewrite command is authorised.
- **AC-2:** `CONTRIBUTING.md` states the expected clone size and gives `git clone --depth 1` as
  the suggested contributor command, regardless of D1's outcome.
- **AC-3:** No committed image under `src/assets/` exceeds 500 KB (or each remaining exception is
  documented with a reason); the twelve audited files re-encoded with rendered output verified
  visually unchanged.
- **AC-4:** A timed section page issues no `.words.json` request on load without playback; playing
  the read-along fetches timings once and highlighting works; verified by observing the network
  requests, not by code inspection alone.
- **AC-5:** `deploy.yml` caches `.cache/uc` and Typst outputs keyed on content hash, and a run with
  unchanged content shows cache hits in the workflow log; a run with changed content produces
  correct, current PDFs and images (no stale-cache ship).

## Completion evidence

| Criterion | Evidence | Verified |
| --------- | -------- | -------- |
| AC-1      | —        | —        |
| AC-2      | —        | —        |
| AC-3      | —        | —        |
| AC-4      | —        | —        |
| AC-5      | —        | —        |

## Authority and inputs

- `audit:0004` F1 (1.59 GiB pack vs <30 MB payload; removed `.mp3`/`.zip`/`.pdf` history) and F2
  (16.9 MB committed images, twelve >500 KB); rec 1 (the no-risk `--depth 1` partial; the rewrite
  as owner decision) and rec 2 (image optimisation size S).
- `audit:0010` F1 (eager `.words.json` fetch measured: 71 files, 6,084,574 bytes raw, ~22 KB gzipped
  average; `word-highlight.ts:598-607`; audio `preload="none"` contrast) and F7 (deploy profile
  re-renders all PDFs and reprocesses ~200 MB images per push; `deploy.yml`/`loader.ts:77-79`); recs
  2 and 7.
- `lesson:0001` — the contributor-onboarding constituency this weight lands on.
- `docs/lessons/0003` (`5c2aeba`…`b2646b9`) and `0006` (`9251406`, `d6011ca`, `133866a`) — the
  cited commit SHAs a history rewrite would invalidate.
- `docs/ROADMAP.md` — "Next": R2-published content artifact (the exit path for growing cache
  commits; out of scope here); page-load performance pass (owns client-JS weight).
- Code anchors: `src/lib/word-highlight.ts:57,598-607`; `.github/workflows/deploy.yml` (SKIP_AUDIO,
  no SKIP_PDF); `src/textbook-loader/loader.ts:77-79`; `src/assets/static/portraits/` (the audited
  oversized portraits).
