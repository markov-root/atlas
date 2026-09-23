---
schema_version: 2
id: '0003'
uid: 'handoff-20260922T111333679155Z-76850c1e'
title: 'Bibliography phase 1 complete; phase 2 and the write-back pending'
role: handoff
status: current
summary: 'The bibliography exists as files and five atlas commands; rendering and the corpus write-back are not started.'
created: '2026-09-22'
updated: '2026-09-22'
owner: Markov Grey
supersedes: ''
superseded_by: ''
engineering_document:
  version: 1
  contract_tier: full
  role: handoff
  id: '0003'
  uid: handoff-20260922T111333679155Z-76850c1e
  title: 'Bibliography phase 1 complete; phase 2 and the write-back pending'
  state: current
  authority:
    kind: continuation-state
    owner: Markov Grey
    scope: The bibliography branch only
  created: '2026-09-22'
  updated: '2026-09-22'
  transition_history: unverified
  transitions: []
  relationships: []
  details:
    captured_at: '2026-09-22T11:15:00Z'
    repository: 'AI Safety Atlas (markov-root/atlas, GitHub)'
    revision: 'branch bibliography, 21 commits ahead of main; one uncommitted sources.yaml change from a killed resolve run'
    objective: 'Derive a bibliography from the citation links already in the Google Docs, delivering a file-based artifact before any rendering.'
    completed: [task:0025, task:0026, task:0027]
    open_work: [task:0029, task:0021, task:0028, task:0022, task:0023, task:0013]
    blockers: []
    authority_refs:
      [
        AGENTS.md,
        engineering.yaml,
        'docs/tasks/0021-derive-a-bibliography-from-google-docs-citation-links.md',
      ]
    resume: 'engineering document validate && ./bin/atlas citations report'
---

# Handoff 0003: Bibliography phase 1 complete; phase 2 and the write-back pending

## Outcome

**Phase 1 of `task:0021` is done: the bibliography exists as files, built from the documents, with
no rendering and no reader-facing change.** That was the owner's stated goal - "before getting it to
appear on site, the first set is to actually just have the full bibliography across the book
exportable into a sensible file."

Five commands work end to end:

| Command                   | Does                                          | Network |
| ------------------------- | --------------------------------------------- | ------- |
| `atlas citations scan`    | AST → `citations.json` (the language boundary) | none    |
| `atlas citations extract` | `citations.json` → CSL store (948 sources)    | none    |
| `atlas citations report`  | what needs human attention, as a durable file | none    |
| `atlas citations export`  | BibTeX + CSL-JSON                             | none    |
| `atlas citations resolve` | fill metadata, incremental and resumable      | yes     |
| `atlas citations urls`    | per-section Markdown for the ed-2 authors     | none    |
| `atlas citations render`  | 945 sources × 5 CSL styles → `rendered.json`  | none    |

Over the committed corpus: **1,770 citation instances, 948 unique sources, 817 resolved (86%),
131 unresolved, 76 cited with inconsistent spellings, 47 links whose anchor text is prose rather
than author-year, 0 malformed.**

Gate at handoff: both linters clean, typecheck 0 errors, **500 tests** - 299 TypeScript and 201
Python (was 195 at the start of this work). `pnpm verify` green end to end.

## Completed work

| Commit    | What                                                                      |
| --------- | ------------------------------------------------------------------------- |
| `e693014` | `/teach` country metric - derived figure replaced with a sourced snapshot |
| `eb1432b` | merge of `codebase-cleanup` into `main`                                   |
| `e94521b` | `task:0021` bibliography design, `task:0022` R2 upload defect             |
| `f08cbaa` | `task:0023` asset custody, `task:0024` build resources, `audit:0011` log  |
| `1ce6012` | `task:0021` decomposed into 9 banks across 3 child tasks                  |
| `c17dfdb` | `cli/` type coverage - B1                                                 |
| `4be3f30` | extraction, canonical URL identity, CSL store - B2/B3/B4                  |
| `36dacc3` | the resolver contract - B8's interface                                    |
| `8dbad6f` | `atlas citations urls` - the interim shareable file                       |
| `1c6c4a7` | the CLI and five resolvers - B5/B6/B7/B8/B9                               |
| `43767a6` | `task:0028` write-back design                                             |

**Nothing is pushed.** The branch is 10 commits ahead of `origin/main`.

## What the owner is waiting on

1. **`docs/cited-sources.md` is ready to share** - 2,996 lines, per chapter and section, `Title (url)`
   form, plus a deduplicated master list and the 47 unrecognised links. Built for the edition-2
   authors, who are the stated customer of this whole task.
8. **`task:0028` D1** decides what we may write back into a shared corpus that offers no delete.
   My recommended option C was **withdrawn on 2026-09-22**: it rested on exit 5 meaning
   "out of scope", and it does not. The corpus exposes no way to ask what it covers, so this task
   probably waits on that upstream fix rather than encoding a workaround.

## Open work

0. **`task:0029` - the Python port. DONE, awaiting owner acceptance.** All six criteria have
   completion evidence in the record. The pipeline is now two languages: TypeScript extracts
   citations from the AST and writes `data/citations/citations.json`; Python owns the resolvers, the
   CSL store, BibTeX and every report. `atlas citations <verb>` is unchanged for all five original
   verbs, plus a new `scan`. 424 tests (247 TS + 177 Python), both suites in `pnpm verify`. The 789
   resolved entries survived with **zero semantic change**. Left at `todo` because accepting work is
   the owner's call, matching `task:0025`–`0027`.

   Three more defects surfaced while porting, all of the same shape - a property stated only in a
   comment, which no test ever checked. `audit:0011` **F8** (a BibTeX key stability claim the
   algorithm does not honour; documentation corrected, behaviour kept so no `\cite` key moves),
   **F9** (the all-sources index could not show within-section spelling inconsistencies, the very
   thing it exists to surface; fixed) and **F10** (`--redo` re-fetched every entry because
   `research-db` claims all URLs, so "would another resolver claim this?" always answered yes;
   fixed, 539 targets → 191). F10 is almost certainly why the first redo run was killed by a
   timeout.

   The redo then ran to completion: **60 newly resolved, 19 of them through `scholar-meta`** - the
   publisher pages that resolver was written for, now carrying journal, volume, pages, DOI and real
   author names instead of a bare title or nothing.

1. **`audit:0011` F12 - a transient network failure is recorded as a permanent verdict.** Found
   2026-09-23 while repairing F11. A resolver returns `None` both for "this does not exist" and for
   "the service just failed", so one flaky request hands an entry to a worse resolver *forever* -
   observed live: arXiv briefly failed and Open Graph recorded the entry with 0 authors where arXiv
   gives 1,158. **386 entries currently sit on `opengraph` and nothing distinguishes a genuine
   long-tail page from a transient failure.** The minimal fix is to separate declined from
   unreachable in the resolver contract and retry once; worth a task, deliberately not designed
   inside a bug-fix session.

2. **`task:0028`** - the write-back. Owner asked for it explicitly, but it is now **blocked on an
   upstream capability**: the research corpus has no queryable coverage, so we cannot tell which of
   948 URLs are worth offering without fetching each one. Four feedback notes filed; the coverage
   one is the blocker.
2. **`task:0030` - CSL rendering and the reader-facing control panel. PARTLY BUILT.**

   Shipped: `atlas citations render` produces `data/citations/rendered.json` (945 sources × 5 styles,
   ~49s, deterministic) via `citeproc-py` over CSL styles vendored under `vendor/csl/` (CC-BY-SA 3.0,
   attribution in that directory's README). The site offers **Basic** (house style, the default),
   APA, Chicago, MLA, Nature and IEEE; every style is in the DOM and the selector toggles visibility,
   persisting the choice in `localStorage`. Numeric styles have their index stripped, because our
   list is alphabetical and the prose cites by author-year.

   **Not built, and recorded in the task rather than half-done:** one control panel with filters by
   author / source / year / type, sort by source, and a **group-by chapter-and-section versus flat**
   toggle. Only a single search box and a sort dropdown exist today. `~/Images/Icons` has 206 SVGs;
   the choice between those and the existing `astro-icon` has not been made.

   **D6 is a standing rule, not a one-off:** no reader-facing surface reports metadata completeness.
   The first cut showed "132 awaiting full metadata" and a filter on it; both were removed. The site
   will not ship until every source is resolved, so that instrumentation belongs in
   `atlas citations report`, which is read by maintainers.

7. **`task:0031` - collapse duplicate sources through an alias file. NOT STARTED.**
   The same work appears under several URLs - `keepthefuturehuman.ai`/`.com`, `deepmind.com`/
   `deepmind.google`, AlignmentForum/LessWrong cross-posts, arXiv beside a publisher page.
   **Detection is shipped**: `atlas citations report` lists 7 groups, matched on first author, year
   and a title fingerprint. Domain is not a usable signal - the AI Safety textbook alone has eight
   different chapters under one author, year and site. Merging is a reviewed human decision, because
   collapsing two identities on a heuristic silently loses a citation.

6. **`task:0021` phase 2** - rendering. **All three D5 surfaces are live** as of 2026-09-23:
   section-level after `#footnotes`, chapter-level at `/bibliography/<version>/<chapter>` linked from
   the resources panel, and site-wide `/bibliography` with all 948 sources. `src/lib/bibliography.ts`
   reads the committed store; no new build step, no credentials, warn-never-block on a missing store.

   Chapter bibliographies are **not** at `/chapters/<version>/<chapter>/bibliography` on purpose -
   that path shares a namespace with section slugs and Astro prefers a static segment, so a section
   called "Bibliography" would be silently shadowed. The url-stability snapshot caught it.

   What phase 2 has NOT done: no citation-number superscripts in the prose (the anchors are still
   author-year links), no back-links from a reference to the paragraphs citing it, no per-style
   formatting (the format is one hand-rolled author-date, not CSL styles), and no copy/export button.
   Those are the obvious next asks and none is decomposed yet.
3. **`task:0022`** - p1, and the only one that can destroy something. A plain `pnpm typecheck` tried
   to PUT a 96 MB MP3 to production R2; only revoked credentials stopped it. **Must land before any
   working R2 credentials exist.**
4. **`task:0023`** - asset custody. `.cache/uc/` holds 1.9 GB of irreplaceable audio, gitignored and
   unbacked, on a VM that has crashed twice. Backing it up is minutes of work.
5. **`task:0013`** - Google Docs migration, now including the credential steps.

## Resume

```bash
export SKIP_AUDIO_DOWNLOAD=1          # mandatory - see below
uv sync                                # the Python half (task:0029); once per checkout
engineering document validate          # expect 1 finding: current-multiple
./bin/atlas citations report           # what still needs human attention
git log --oneline main..HEAD           # unpushed commits
```

`pnpm test`, `pnpm test:py` and `pnpm typecheck:cli` are cheap and safe. `pnpm verify` is not - see
below.

## A standing instruction from the owner

Recorded verbatim because it governs how work in this repository is judged, and because the agent
that wrote this handoff got it wrong once:

> "I never ever want to hear the words sunk cost again when working in this repo. We only do it
> right. I will not live with something that I know is wrong or things that can be improved just
> because of sunk cost."

Applied: code written five minutes ago has no more claim to survival than code written five years
ago. "It already works", "the tests pass" and "it would be a rewrite" are not arguments for keeping
a design that is wrong. `task:0029` exists because that rule was applied to work finished the same
afternoon.

## Where this stopped, 2026-09-23 (second session)

**Pushed.** `origin/bibliography` is at `ec38b11`; the branch is no longer local-only. The push runs
`pnpm verify` as a pre-push hook and it passes **only with `SKIP_AUDIO_DOWNLOAD=1` exported** - without
it the build reaches R2 with revoked credentials and the hook dies on ETIMEDOUT. Note what the log
says while failing: `[r2-cache] Failed to list R2 for push`. That is `task:0022` (p1), still real, and
still stopped only by the credentials being dead.

### Citation metadata: 813 -> 888 of 945 resolved

`task:0032` is the record. Five resolve passes took the unresolved tail from **132 to 57**, and
`container-title` from **191 to 684**, which is what makes `task:0030`'s source filter possible at all.

New capability, all under `task:0032`: `Unreachable(reason)` in the resolver contract (a decline and a
failure are different answers - `audit:0011` F12), `Accept` headers, Crossref from a DOI anywhere in a
URL, a ForumMagnum resolver for LessWrong/EA Forum/Alignment Forum, an Internet Archive resolver, a
reviewed `data/citations/overrides.yaml`, and `atlas citations propose` to gather evidence for it.

**Four measured negatives, recorded so they are not retried:** PDF `/Title` metadata (0 of 12), a
largest-font title heuristic (~5 of 16 clean), Crossref title search (returns a different paper,
ranked first, at a score indistinguishable from a correct hit), and a headless browser against a WAF
(Cloudflare refuses Playwright exactly as it refuses httpx; PsycNet was *worse* under a browser).
`audit:0011` F15 and F17.

**The remaining 57 are human work**, and the worklist is built:
`data/citations/overrides.proposed.yaml` (gitignored), grouped by what each entry needs - 34 with no
readable metadata (PDF first pages already extracted), 12 behind a paywall, 9 flaky, 2 genuinely gone.

### Reader-facing

`task:0030` AC-7 is done: one control panel on `/bibliography` and the chapter pages with search
scoped to a field, filters on source/type/year, five sorts, and grouping by chapter or
chapter-and-section. State syncs to the query string, so a filtered view is linkable. Both pages now
sit on the house rounded-white surface; controls use the `VersionSelector` style on a six-column grid.

The bibliography is now **reachable**: section reference lists link onward to the chapter and
site-wide pages, and the footer carries one. It was previously built and unlinked.

### A standing rule added this session

**No em dashes anywhere.** 3,053 removed across 171 files; `tests/no-em-dash.test.ts` enforces it in
`pnpm test` and names offenders. Quoted source data, three functional literals and upstream text are
exempt **by path with a stated reason**: a cited work's title is that work's title (Turing 1950 is
printed with one), and rewriting it would falsify the citation. Stated in `AGENTS.md`.

### Open, with records

- **`task:0032` AC-7** - 57 entries, human work, worklist generated.
- **`task:0033`** - a styled listbox. A native select's popup is drawn by the OS and ignores every
  site style, so the control looks like the Atlas until it opens. Three inconsistent select styles
  exist today.
- **`task:0034`** - the bibliography in the chapter PDF. Every input exists; the Typst renderer never
  asked.
- **`task:0031`** - duplicate aliasing, now **9** groups (more entries resolved, so more detected).

### Things that will bite the next person, added

- **A local dev build shows no PDF or audio link in the resources panel.** `chapter.pdfLink` and
  `audioLink` are only set when the build generates them, which needs credentials this machine does
  not have. Nothing is broken and nothing was displaced.
- **`atlas citations resolve` is slow now** - roughly 45 minutes for 90 entries, because a failing
  entry costs the live chain, a `www.` retry and an archive lookup. It saves every 20 and handles
  SIGTERM, so stopping it is safe and cheap.

## Where this stopped, 2026-09-23 (first session)

Everything below is committed and green. The branch is **44 commits ahead of `main`, nothing
pushed.** A dev server may still be running in tmux as session `dev`; `tmux kill-session -t dev`.

Reader-visible state: `/bibliography` (945 sources, search + sort + style switcher),
`/bibliography/<version>/<chapter>`, and a reference list after every section's footnotes.

The next piece of work is `task:0030`'s control panel - it is specified in that record, including
the open questions, and deliberately not begun.

## Things that will bite the next person

- **Always `export SKIP_AUDIO_DOWNLOAD=1`.** Without it, anything that loads a chapter runs the audio
  renderer, whose phases 7 and 8 push to production R2. `.env` sets this variable but **it has no
  effect there** - it is declared in neither the astro env schema nor bridged in `content.config.ts`,
  so it must be exported into the shell. This is `audit:0011` F3 and the cause of `task:0022`.
- **`pnpm verify` peaks at 94% memory commit** on this 4 GB VM with nothing else running. Do not run
  it alongside anything. `pnpm test` and `pnpm typecheck:cli` are cheap.
- **Node content lives in two places in the AST.** `Figure.caption`, `Iframe.caption`,
  `Video.caption`, `Quote.sourceUrl` and `Definition.source` hold a `SpanGroup` node in an
  **attribute**, not in `children`. A `children`-only walk misses 20% of citations. `utils.ts:15`
  `traverseNodes` has this blind spot; `citations/extract.ts` has `allChildNodes()` as the local
  remedy. `audit:0011` F5.
- **`data/citations/sources.yaml` is committed; every derived output is gitignored**, including
  `citations.json`, the TypeScript→Python handoff file. The store accumulates resolver metadata that
  costs real time and other people's rate limits to rebuild. It holds **817 of 948 resolved**; the
  789 that predated the port survived it unchanged.
- **The store is now emitted by a different YAML writer.** `ruamel.yaml` wraps and quotes
  differently from the npm `yaml` package, so the port produced a one-time whole-file reformat with
  no data change. Do not read that diff as content churn - `task:0029` D4 records why a byte
  comparison was never obtainable and what was proven instead.
- **`atlas citations` shells out to `uv`.** If a verb dies with "uv is not on PATH", run `uv sync`.
  The site build is unaffected; only the citation verbs and `pnpm verify` need Python.
- **Resolution is sticky, and that cuts both ways.** A resolved entry is never re-fetched, which is
  what makes the long tail tractable - but a *bad* resolution is equally permanent. Use
  `atlas citations resolve --redo=<resolver>` to give an improved resolver another turn.
- **`atlas citations render` takes ~49 seconds and must be re-run after `resolve`.** Nothing
  enforces that ordering: a stale `rendered.json` silently shows the previous run's text. The site
  falls back to the Basic style if the file is missing, but a *stale* file is not detected.
- **`rendered.json` is committed** (`task:0030` D5), against this repo's usual rule for derived
  outputs. Gitignoring it would put Python on the critical path of `pnpm build`, which `task:0029`
  states it is not. 911 KB, changing only when the store changes.
- **A resolve run takes ~75 minutes** at the polite 3s interval. Run it in tmux, and commit the
  store as it goes: the command saves to disk every 20 entries but git does not follow on its own,
  and 193 entries of work were once left uncommitted on a machine that has crashed twice.

## Method notes worth carrying forward

Three measurement errors were made and caught during this work. Each is recorded because each would
otherwise have shipped as a confident, wrong claim:

- **Three times, a reproducible measurement of that corpus was still wrong.** Coverage was reported
  at 24% (it is 7.9%), then epoch.ai as an unsupported domain (it is swept, with path-scoped claims),
  then planned-obsolescence and aisi as uncovered (both fully scraped). Each time the command output
  was accurate and the conclusion was not, because `research fetch`'s exit 5 answers "can the ad-hoc
  fetcher claim this URL" while the question being asked was "is this publisher in the corpus". When
  a tool cannot answer the question you actually have, a confident answer to the adjacent question is
  the dangerous outcome - the owner caught all three, not the data.
- **The 45-URL coverage probe specifically:** The probe
  sampled arXiv plus Alignment Forum, LessWrong, Epoch, Anthropic, DeepMind, METR and GovAI -
  precisely the organisations that corpus is built to cover. Sampling from the covered population
  estimates nothing about the whole.
- **The corpus was said to contain 9 unlinked footnote citations. It contains zero.** All 9 are
  hyperlinked; the original scan matched parentheses without checking for a co-located anchor.
- **A joining space in span reconstruction broke citation matching** while every unit test passed,
  because fixtures put a citation in one span and Google Docs splits sentences across many. A fixture
  tidier than the real data tests the fixture. The real-corpus reconciliation test is what caught it.

On delegation: three pi agents built `task:0026` and `task:0027` in parallel, but the two things that
fix a contract - entry identity (B4) and the resolver interface - were written first, alone. One
agent reported another's tests as failing; running them directly showed 51 passing, because it had
read them mid-write. **Verify handbacks against disk, not against the report.**

## Blockers

None.

## Evidence and authority

- `docs/tasks/0021` - the parent design, six recorded decisions, the dependency graph.
- `docs/tasks/0025`, `0026`, `0027` - completion evidence tables, all criteria met.
- `docs/audits/0011` - the incidental findings log, F1–F7.
- Three `skill-feedback` notes filed to `research-database` on 2026-09-22: scraper coverage ranked by
  real citation volume, a batch/idempotent fetch request, and the absence of a "would you claim this
  URL?" probe.
