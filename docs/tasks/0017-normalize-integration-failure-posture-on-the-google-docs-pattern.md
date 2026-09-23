---
schema_version: 2
id: "0017"
uid: "task-20260921T203526293659Z-30761264"
title: "Normalize integration failure posture on the Google Docs pattern"
role: task
status: todo
summary: "Make every delivery-critical integration failure fail the build loudly or degrade visibly, on the Google Docs pattern."
created: "2026-09-21"
updated: "2026-09-21"
owner: Markov Grey
supersedes: ""
superseded_by: ""
engineering_document:
  version: 1
  contract_tier: full
  role: task
  id: "0017"
  uid: task-20260921T203526293659Z-30761264
  title: "Normalize integration failure posture on the Google Docs pattern"
  state: todo
  authority:
    kind: work-state
    owner: Markov Grey
    scope: BOUNDED ACCEPTANCE AND COMPLETION AUTHORITY - failure-semantics normalization for R2 transfer, Algolia indexing, and the logos loader, bounded by the decisions in this record. src/ frozen until execution is authorised.
  created: "2026-09-21"
  updated: "2026-09-21"
  transition_history: unverified
  transitions: []
  relationships: []
  details:
    criteria: [criterion:AC-1, criterion:AC-2, criterion:AC-3, criterion:AC-4, criterion:AC-5, criterion:AC-6, criterion:AC-7]
    size: m
    priority: p1
---

# Task 0017: Normalize integration failure posture on the Google Docs pattern

## Problem

`PRINCIPLES.md` §2 is binding: "fail loud, not silent - the error names the specific input and a
remediation path." The codebase already contains an integration that meets the bar and is
load-bearing precisely where a partial failure is hardest to notice: Google Docs ingestion
retries transient failures, throws *before caching a partial result*, and names the failing
docId (`gdocsdk.ts` cache-miss throw, 5xx retries, throw-before-cache - `audit:0010` F9;
`ARCHITECTURE.md` "Google Docs fetch and image download - the reference posture"). The gap is not
a missing capability; it is an inconsistently applied known pattern. Three integrations fall
short, and the shortfall ships wrong sites, not failed builds:

1. **R2 - every failure path is warn-and-continue** (`audit:0010` F2). No function in
   `r2-cache.ts` throws (`pushToR2`, `pushFinalAudioFiles`, `pushPublicFiles` all `console.warn`
   and skip - warn sites at `r2-cache.ts:141`, `:203`, `:239`, `:260`; `pullFinalAudioBatch`'s
   docstring says outright "Silently skips files that don't exist in R2", `:150`). Meanwhile the
   renderers assign CDN links *before* any R2 outcome is known: the audio renderer sets
   `section.audioLink = ${CDN_BASE}/audio/…` unconditionally
   (`renderers/audio/renderer.ts:101`) and the PDF renderer returns the CDN URL whether or not
   the upload ran (`renderers/pdf/renderer.ts:77,97`). With wrong R2 config or a mid-batch put
   failure, the build exits 0, deploys, and live pages render "Listen" / "Download PDF" links
   whose targets 404 - invisible at build time, wrong at read time. This is the clearest §2
   violation in the codebase (`ARCHITECTURE.md`, R2 row of the failure-semantics table).
2. **Algolia - destructive delete-then-save with no retry, inside the content-collection load**
   (`audit:0010` F4). `indexTextbook` runs `deleteBy({filters: 'version:<v>'})` then
   `saveObjects` (`src/textbook-loader/algolia.ts:145-153`), gated to maintainer builds
   (`build-mode.ts:47`). If the save fails after the delete succeeded - network blip, key
   rotation, provider outage - the build fails *and* the production index for that version is
   already empty. Nothing rolls back; search stays silently broken until the next successful
   maintainer build, indistinguishable from "no results found".
3. **Logos loader - two halves with opposite behaviour** (`audit:0010` F6). A failed index fetch
   from a third-party GitHub Pages site throws and fails the build with an obscure error naming
   a logos index, not a content source (`loader.js:76-79`); an individual logo download failure
   is warn-and-continue and the page silently lacks the logo (`loader.js:17-30,120-131`). The
   output lands uncommitted in `public/logos/` (`loader.js:73`), so every build re-bets on
   someone else's uptime - with none of the committed-cache treatment `.cache/docs/` gets.

Who it affects: every reader hits the degraded states (404 audio/PDF, empty search, missing
logos); every maintainer pays in debugging time, because none of these failures surface where
anyone is looking. And the blast radius grows with the scaling now underway: 2 editions × 5
languages multiplies records per build and failure surface per deploy (F4), and task:0013's Docs
migration will trigger another destructive reindex on top.

**Counter-case.** Not every failure path *should* go loud. `pullFromR2` for chunk/eq caches is
correctly soft: a cache miss is a legitimate expected state that falls back to synthesis
(F2 notes the contrast inside the same file). `ARCHITECTURE.md`'s failure-semantics table also
records degradations that are deliberate product choices - TTS partial failure aborts the
section and ships no player; `Figure.astro` short-circuits to a caption-only figure; the OWID
iframe spinner. §2 does not mandate "always throw"; it mandates that the *delivery-critical*
paths be loud and that degradation be a decision, not a default. This task normalizes the
posture; it does not convert every warn into a throw.

## Decisions required before execution

### D1 - Per-integration failure contract: which paths throw, which stay soft

**Question:** for each integration stage, is failure a build error or a tolerated degradation?

| Option | Consequence |
|---|---|
| **A.** Adopt the gdocsdk bar for delivery-critical paths only: R2 pushes and final-audio pulls throw; chunk-cache pulls stay soft; Algolia save failure throws (after save-first reorder, D3); logos index fetch throws as today but from a committed snapshot (D4) | Matches `audit:0010` recs 1/4/6 and the ARCHITECTURE table's own recommendation. Deploys become stricter - they fail more often until R2 config is trusted, "and that is the point." |
| **B.** Everything loud | Converts legitimate cache misses (chunk caches) into build failures and blocks deploys on problems the site can absorb; the warn-and-continue paths exist for reasons. |
| **C.** Everything soft with better logging | Cheapest, but preserves the core defect: a `console.warn` among hundreds is not signal, and a build that exits 0 while shipping 404s is still a successful build. |

**Recommendation:** A - it is exactly the distinction the code already half-knows
(delivery-critical push vs. expected-miss pull) made explicit.

**Irreversible if wrong:** nothing structural - a failure posture is cheap to tighten or loosen
per path. The *cost* of deciding wrongly is operational, not architectural: A-too-strict blocks
deploys on trivial trouble (mitigated by D2), C keeps shipping 404s. Decide by contract table,
revisit per stage if a path proves miscalibrated.

### D2 - May an R2 failure block a prose deploy? (product judgement, not engineering)

**Question:** deploys run on every push to `main` (`.github/workflows/deploy.yml:3-6`). If R2
trouble fails the deploy build (per D1-A), prose changes that had nothing to do with audio stop
shipping too. Is that acceptable?

| Option | Consequence |
|---|---|
| **A.** Yes - all-or-nothing per deploy | A failed CI deploy leaves the *last good* site live (GitHub Actions semantics), so the trade is "old-but-correct site" vs "new-but-404ing site". Consistent with how prose deploys already work: a build failure anywhere stops everything. |
| **B.** No - ship prose without audio when R2 fails, loudly | Content changes always land; audio degrades visibly (link omitted rather than 404ing - the renderer must then *not* assign `audioLink`/`pdfLink` on failed upload). Requires the renderers to consume upload outcomes, which they currently cannot (`renderer.ts:101`, `pdf/renderer.ts:97`). |
| **C.** Ship with 404 links but alarm loudly post-deploy | Status quo plus a smoke check after deploy. Still ships the broken state; detection shifts from build to runtime. |

**Recommendation:** B for deploy-profile builds (`SKIP_AUDIO=1`: audio is *pulled*, not
generated, so a pull failure means "audio missing", which the site can honestly represent by
omitting the link), A for maintainer/full builds where the pipeline that *produced* the audio
should refuse to declare success with links it did not deliver. This splits the decision by
build mode rather than by taste - deploy builds degrade honestly, producing builds fail loudly.

**Irreversible if wrong:** a wrongly-strict posture (A everywhere) can hold a content deploy
hostage to an audio problem for days - the failure mode the owner explicitly worries about. But
it errs in the visible direction: blocked deploys are loud, wrong-404 sites are not. The
reversible-by-reconfiguration property makes this a low-regret decision either way.

### D3 - Algolia ordering: save-then-delete, alias swap, or accept the window

**Question:** how does reindexing avoid leaving the live index empty on a save failure?

| Option | Consequence |
|---|---|
| **A.** Save first, delete after (delete stale records by a distinguishing marker, e.g. a build-timestamp field) | S, idempotent upserts by `objectID`, transiently doubled record count during a build - negligible at current scale (`audit:0010` rec 4). On save failure: old records intact, build fails, next build heals. |
| **B.** Stage into a temp index and swap (index aliasing) | Strongest isolation (atomic switch, zero window); costs per-version temp-index plumbing and a swapped-index rollout; overkill for the current record count. |
| **C.** Accept the window; retry the save with backoff only | Cheapest code change; still leaves a version's search empty from save-failure until next good build if retries exhaust. |

**Recommendation:** A. B is the right tool if/when per-language indexes (task:0014 D3-B) or
record counts make the doubled-count window material; revisit then.

**Irreversible if wrong:** none - all three are reorderings of the same two calls.

**Scheduling constraint, the real teeth:** task:0013's Docs migration triggers a destructive
reindex *by design*, and its record already notes the Algolia fix belongs separately-but-before
(0013, "Consequence 3 - Algolia is rebuilt destructively"). This reordering must land **before
or with** 0013, or the migration's first mistake empties live search during an already-risky
change.

### D4 - Logos index: vendor the third-party index, and what per-logo failure does

**Question:** the build currently bets on `foreview.github.io` uptime on every deploy (F6). Do
we cache/vendor the index the way `.cache/docs/` is committed, and does a single logo failure
stay silent?

| Option | Consequence |
|---|---|
| **A.** Commit a snapshot under `.cache/`, point the loader at it, refresh via an explicit command; keep per-logo warn-and-continue | Builds survive third-party outages; logo staleness bounded by the refresh command (`audit:0010` rec 6). A missing single logo on a shipped page remains possible - acceptable for a decorative element. |
| **B.** Per-logo failures go loud too | Strictest; turns one dead URL among four orgs into a deploy blocker - disproportionate. |
| **C.** Resolve the whole question in task:0006 (independence posture for the logos package) | Cleaner ownership, but 0006 is a decision record about *who provides logos*, not a fix for this build-path fragility; the snapshot fix is safe and standalone either way. |

**Recommendation:** A now, coordinated with 0006 (if 0006 later replaces the logos source
entirely, the snapshot mechanism transfers).

**Irreversible if wrong:** nothing - worst case is stale logos until a refresh.

### D5 - Does the failure-semantics table become an enforced contract, or stay documentation?

**Question:** `ARCHITECTURE.md` "Failure semantics by stage" now records per-stage behaviour as
normative. Documentation-only contracts drift the moment someone adds a `console.warn`; an
enforced contract catches the drift.

| Option | Consequence |
|---|---|
| **A.** Codify the delivery-critical subset: a build-time/test-time check that a delivery-critical path can still swallow a failure fails the change | The table becomes load-bearing; future integrations are forced to make the D1 choice explicitly. Cost: one more test to maintain, and occasional false-positive churn when refactoring error handling. |
| **B.** Documentation only, updated in the same change as the fixes | Zero maintenance cost; relies on review to notice a new warn-and-continue - the exact failure mode that produced this task. |
| **C.** Enforce everything (all stages) | Constrains deliberate degradations (TTS section-abort, caption-only figures) that are product choices, not lapses - over-reach. |

**Recommendation:** A, scoped to the delivery-critical paths D1 names (R2 pushes/pull-final,
Algolia index-write, Docs throw-before-cache). The subset is small and its semantics are
stable; that is what makes it enforceable without fighting deliberate degradations.

**Irreversible if wrong:** an enforcement check constrains future code by design - that is its
point and also its cost. Over-broad enforcement (C) would push contributors to work around the
check; the delivery-critical subset avoids that failure mode.

## Scope

In execution order:

1. **R2 delivery-critical paths go loud** (D1-A): `pushToR2`, `pushFinalAudioFiles`,
   `pushPublicFiles`, and the final-audio pull used by builds that assign public links throw
   (or return a tally the renderer verifies) on non-`NoSuchKey` errors; `pullFromR2` for chunk
   caches stays soft as today. Error messages name the bucket/key and the remediation path (§2
   binding form - pattern to copy is `gdocsdk.ts:63-73`).
2. **Renderers consume R2 outcomes** (D2): in deploy-profile builds, a failed final-audio
   pull/PDF upload means `audioLink`/`pdfLink` are *not assigned* (the existing
   `audioLink = undefined` degradation path, `renderer.ts:94,170,182`) rather than assigned to
   URLs that 404; in maintainer/producing builds, the failure fails the build.
3. **Algolia save-then-delete** (D3-A): upsert records first, delete the superseded generation
   only after the save succeeds, keyed by a build-timestamp (or equivalent) marker; no other
   index-strategy change here (language scoping of the delete filter is task:0014 D3's).
   Sequenced before or with task:0013.
4. **Logos index snapshot** (D4-A): commit a `.cache/` snapshot of the logos index, point the
   loader at it with remote as refresh, document the refresh command; per-logo
   warn-and-continue stays.
5. **Codify the contract** (D5-A): a test/build check covering the delivery-critical subset of
   D1; `ARCHITECTURE.md`'s failure-semantics table updated in the same change to record the new
   posture (its own rule: the document describes actual behaviour, defects marked as defects -
   after this task, R2/Algolia rows flip from defect to conformance).

Dependencies: 2 depends on 1 (consumes its outcomes). 3 and 4 are independent of 1–2. 5 depends
on 1–4 being decided (it encodes the D1 table as landed).

## Out of scope

- **TTS adapter divergence** (ElevenLabs aborts the section, dormant Gemini concatenates around
  gaps - `audit:0010` F10): decided and unified in task:0016 before a second provider is
  enabled; noted here only because D1's contract table must not silently claim the ElevenLabs
  contract is universal.
- **Algolia record language-scoping** (`audit:0007` F2): task:0014 D3. This task changes the
  *ordering* of delete/save; 0014 changes the *filter scope* and record shape. Landing order
  matters only in that the first multi-language indexing run needs both.
- **Logos independence posture** (who provides the logos package/index at all): task:0006.
- **Docs-source migration**: task:0013; only the scheduling constraint in D3 touches it.
- **Deliberate degradations stay as they are**: TTS section-abort (no player), caption-only
  figures, OWID iframe spinner (roadmap owns OWID replacement), transform warn-and-skip. §2 is
  about delivery-critical paths; this task does not relitigate product degradations.
- **Raw env vars outside the typed schema** (`audit:0010` F5): separate safe-standalone fix,
  not a failure-posture question.
- **`src/` changes of any kind** until execution is authorised against the decisions above.

## Done when

- **AC-1:** A simulated R2 outage (wrong endpoint/bucket or a put failure) in a
  deploy-profile build exits with `audioLink`/`pdfLink` unassigned for the affected sections -
  no build exits 0 with CDN links assigned to files that were not delivered (inspect the built
  pages or the renderer's outcome handling).
- **AC-2:** A maintainer-profile build with the same simulated outage exits non-zero, and the
  error names the failing bucket/key and a remediation path (§2 binding form).
- **AC-3:** Chunk/eq cache pulls (`pullFromR2`) still tolerate misses silently - the soft paths
  D1-A deliberately preserves are unchanged (inspectable by test or code read).
- **AC-4:** An injected `saveObjects` failure during indexing leaves the previous index state
  intact: delete runs only after a successful save, verified by a two-run simulation (good
  build, then build with save forced to fail → index still serves the old records).
- **AC-5:** A build with `foreview.github.io` unreachable succeeds from the committed logos
  snapshot; the refresh command that updates the snapshot is documented in the repo.
- **AC-6:** Every error thrown by a delivery-critical integration path names the specific
  failing input (bucket/key, index, URL) and a remediation path - a grep-level or test-level
  audit of the throw sites confirms the §2 form.
- **AC-7:** The D5 check exists and passes: a delivery-critical path that regresses to
  warn-and-continue fails it; `ARCHITECTURE.md`'s failure-semantics table matches observed
  behaviour for R2, Algolia, and logos rows as of the change.

## Completion evidence

| AC | Evidence |
| --- | --- |
| AC-1 | - |
| AC-2 | - |
| AC-3 | - |
| AC-4 | - |
| AC-5 | - |
| AC-6 | - |
| AC-7 | - |

## Authority and inputs

- `audit:0010` - External integration boundaries (F2 R2 warn-and-continue, F4 Algolia
  delete-then-save, F6 logos loader split behaviour, F9 gdocsdk as the reference posture;
  recommendations 1/4/6 shape the fixes).
- `docs/ARCHITECTURE.md` - "Failure semantics by stage" (normative per-stage table - used as
  recorded, not re-derived; the R2/Algolia/logos rows are this task's object) and "Google Docs
  fetch and image download - the reference posture" (the pattern to copy).
- `docs/PRINCIPLES.md` - §2 (fail loud, not silent; binding), §14 (this is not a licence to
  re-decide deliberate degradations).
- Code anchors (verified 2026-09-21 on `codebase-cleanup`): `src/textbook-loader/renderers/audio/r2-cache.ts:44,101,150-152,186,213` (warn sites `:141,:203,:239,:260`);
  `src/textbook-loader/renderers/audio/renderer.ts:94,101,170,182`;
  `src/textbook-loader/renderers/pdf/renderer.ts:77,97`;
  `src/textbook-loader/algolia.ts:145-153`; `src/lib/build-mode.ts:47`;
  `src/content.config.ts:20-28` (logos wiring), `:99-107` (indexing in the collection loader);
  `.github/workflows/deploy.yml:3-6`; `node_modules/@foreview/ais-logos-astro/dist/loader.js`
  (as installed - `:4-5,:17-30,:73,:76-79,:120-131`; version-bump caveat in audit:0010
  limitations).
- Coordinated records: task:0013 (Docs migration - D3 scheduling constraint), task:0006 (logos
  independence posture - D4), task:0016 (TTS adapter semantics - out of scope), task:0014
  (Algolia filter scope - D3 boundary).
- `docs/PRINCIPLES.md` §2's own standard for what "loud" means: the error names the specific
  input and a remediation path - `gdocsdk.ts` is the in-repo exemplar (audit:0010 F9).
