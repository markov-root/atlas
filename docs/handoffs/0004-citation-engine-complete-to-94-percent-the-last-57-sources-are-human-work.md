---
schema_version: 2
id: "0004"
uid: "handoff-20260923T214446527953Z-0baf3d01"
title: "Citation engine complete to 94 percent; the last 57 sources are human work"
role: handoff
status: current
summary: "The resolvers, store and reader-facing panel are built and pushed; 57 sources need a human, and the worklist for them is committed."
created: "2026-09-23"
updated: "2026-09-23"
owner: Markov Grey
supersedes: ""
superseded_by: ""
engineering_document:
  version: 1
  contract_tier: full
  role: handoff
  id: "0004"
  uid: handoff-20260923T214446527953Z-0baf3d01
  title: "Citation engine complete to 94 percent; the last 57 sources are human work"
  state: current
  authority:
    kind: continuation-state
    owner: Markov Grey
    scope: NEXT-SESSION CONTINUATION ONLY
  created: "2026-09-23"
  updated: "2026-09-23"
  transition_history: unverified
  transitions: []
  relationships: []
  details:
    captured_at: "2026-09-23T21:44:46Z"
    repository: 'AI Safety Atlas (markov-root/atlas, GitHub)'
    revision: 'branch bibliography, pushed to origin, 64 commits ahead of main; main has not moved'
    objective: 'Finish the bibliography: resolve the last 57 sources by hand, then decide whether to merge.'
    completed: [task:0029, task:0030]
    open_work: [task:0032, task:0031, task:0033, task:0034, task:0022, task:0023, task:0013]
    blockers: ['task:0032 AC-7 needs human metadata for 57 sources', 'merging main auto-deploys']
    authority_refs:
      [
        AGENTS.md,
        'docs/tasks/0032-close-the-citation-metadata-tail-to-complete-coverage.md',
        'docs/tasks/0030-render-the-bibliography-through-a-real-csl-processor-with-a-reader-facing-style.md',
        'docs/audits/0011-incidental-findings-log-bugs-edge-cases-and-optimizations-found-in-passing.md',
      ]
    resume: 'export SKIP_AUDIO_DOWNLOAD=1 && uv sync && ./bin/atlas citations report'
---

# Handoff 0004: Citation engine complete to 94 percent; the last 57 sources are human work

**Continues `handoff:0003`**, which stays `current` because this repository's handoffs carry
`transition_history: unverified`, and the validator does not allow a supersession transition from
that state. Read 0003 for phase-1 context and the standing warnings; this record is what changed
since, and where the work stands now.

## Outcome

The citation engine is built and pushed. **888 of 945 sources carry real metadata (94%)**, up from
813, and **684 carry a source** for the bibliography's filter, up from 191. The reader-facing
bibliography is live at three surfaces with one control panel, and it is reachable, which it was not.

What remains is not engineering. The last 57 sources sit behind publisher paywalls, inside PDFs with
no metadata, or on pages that no longer exist, and `task:0032` D2 and D3 record the two ways of
closing that automatically that were built, measured, and rejected for producing entries that look
resolved and are wrong.

Gate at handoff: `pnpm verify` green end to end, **310 TypeScript + 297 Python tests**, `docs:check`
conformant, pushed to `origin/bibliography`.

## The 57 sources, and how to work on them

**The worklist is `data/citations/overrides.proposed.yaml`, and it is committed** (deliberately,
against this repo's usual rule for derived files: rebuilding it costs ~7 minutes of network against
57 third-party sites, which is the same test that keeps `sources.yaml` committed).

Each entry carries the anchor text the authors wrote, the sections citing it, why the last attempt
failed, and whatever evidence could be gathered - for a PDF, the first six lines of page 1, which
usually contain the title and byline. Everything is commented out on purpose. Fill a block in, move
it to `data/citations/overrides.yaml`, and run `./bin/atlas citations extract`.

| Group                         | Count | What it needs                                            |
| ----------------------------- | ----: | -------------------------------------------------------- |
| No metadata to read           |    34 | Open the PDF, confirm the title and authors               |
| Behind a paywall or bot check |    12 | Institutional access, or the archived copy already linked |
| Site would not answer         |     9 | Worth one more `resolve` pass before doing by hand        |
| The page is gone              |     2 | A decision about what to cite instead                     |

Two are quick wins rather than research:

- **`https://arxiv.org/abs/2307.15217'`** has a trailing apostrophe. It is a typo in the Google Doc,
  and the paper resolves instantly once the character is removed at the source. Fix it in the Doc,
  not in the store.
- **`keepthefuturehuman.ai/...pdf` and `keepthefuturehuman.com/essay`** are the same work under two
  addresses, which is `task:0031` rather than missing metadata.

An override never expires and is never re-fetched: `resolve --redo` refuses to target one, and
`extract` re-applies the file every run, so the store stays disposable.

## Completed work

| Commit    | What                                                                       |
| --------- | -------------------------------------------------------------------------- |
| `37ee16e` | Declined vs unreachable in the resolver contract; Accept headers; Crossref by DOI-in-URL; the ForumMagnum resolver |
| `25941ba` | `overrides.yaml`, `atlas citations propose`, the dead-link report section   |
| `0df1bb1` | The Internet Archive resolver; Crossref footnote markers stripped from names |
| `222dd20` | Container titles derived from the URL, backfilling 450 entries offline      |
| `1e8ec47` | The archive's own viewer chrome rejected as a title; dead-link keying fixed  |
| `27d3565` | Re-extraction no longer wipes what the last resolve attempt learned         |
| `469b107` | Scraped titles cleaned, not just judged                                     |
| `195d852` | One control panel; em dashes forbidden repo-wide with a test                |
| `0049018` | The bibliography made reachable from sections and the footer                |
| `ec38b11` | `task:0033` and `task:0034` recorded                                        |

`task:0029` and `task:0030` are done and evidenced; both sit at `todo` because accepting work is the
owner's call, matching `task:0025`-`0027`.

## What was built

| Capability                                   | Where                                   |
| -------------------------------------------- | --------------------------------------- |
| Declined vs unreachable, with a resolver veto | `resolvers/base.py`, `audit:0011` F12   |
| `Accept` headers (7 of 32 blocked hosts)      | `resolvers/base.py` `DEFAULT_HEADERS`   |
| Crossref from a DOI anywhere in a URL         | `resolvers/crossref.py` `doi_from_url`  |
| LessWrong / EA Forum / Alignment Forum        | `resolvers/forum_magnum.py`             |
| The Internet Archive, last resort             | `resolvers/wayback.py`                  |
| Reviewed human metadata                       | `overrides.py`, `commands/propose.py`   |
| Container titles without re-fetching          | `store.py` `fill_container_titles`      |
| The reader-facing control panel               | `src/components/Bibliography.astro`     |

**Measured and rejected, so they are not retried** (`audit:0011` F15, F17): PDF `/Title` metadata
(0 of 12 had one), a largest-font title heuristic (~5 of 16 clean), Crossref title search (returns a
*different* paper ranked first at an indistinguishable score), and a headless browser against a WAF
(Cloudflare refuses Playwright exactly as it refuses httpx; PsycNet was worse under a browser).

## Open work

1. **`task:0032` AC-7** - the 57 above. Owner work; the tool has done what it honestly can.
2. **`task:0031`** - duplicate aliasing, now **9** groups. More entries resolved means more detected.
3. **`task:0033`** - a styled listbox. A native select's popup is drawn by the operating system and
   ignores every site style, so a dropdown looks like the Atlas until it opens. Three inconsistent
   select styles exist today. Owner-reported.
4. **`task:0034`** - the bibliography in the chapter PDF. Every input exists; the renderer never asked.
5. **`task:0022`** - p1, unchanged and still real. While pushing, the build logged
   `[r2-cache] Failed to list R2 for push`: a build attempting to upload to production R2, stopped
   only by the credentials being dead. **Must land before any working R2 credentials exist.**
6. **`task:0023`** (asset custody), **`task:0013`** (Google Docs migration), **`task:0028`**
   (write-back, blocked upstream).

## The merge decision

`main` has **not moved**, so this merges clean today and only gets riskier: the diff is 182 files and
the em-dash purge touches 171 of them.

**But `main` auto-deploys** (`.github/workflows/deploy.yml` fires on push to `main`), so merging is
shipping. The owner's standing position is that the site does not ship until metadata is complete, and
57 sources are bare. If that holds, the merge is blocked on the worklist above rather than on code.

The middle option, if the pages should wait: merge the Python engine, the store, the resolvers and the
em-dash rule - none of which a reader sees, and all of which other branches will conflict with - and
hold back the three Astro surfaces.

## Blockers

- **`task:0032` AC-7** needs human metadata for 57 sources. Nothing in the tool is waiting on itself.
- **Merging is deploying.** A decision, not an obstacle, but it must be made deliberately.

## Things that will bite the next person

Everything in `handoff:0003` still applies. New since:

- **`git push` runs `pnpm verify` and fails without `SKIP_AUDIO_DOWNLOAD=1` exported.** The build
  reaches R2 with revoked credentials and dies on ETIMEDOUT. Export it, do not reach for
  `--no-verify`.
- **A local dev build shows no PDF or audio in the resources panel.** `chapter.pdfLink` and
  `audioLink` are only set when the build generates them, which needs credentials this machine does
  not have. Nothing is broken and nothing was displaced by the bibliography link.
- **`atlas citations resolve` takes ~45 minutes for 90 entries now.** A failing entry costs the live
  chain, a `www.` retry and an archive lookup. It saves every 20 entries and handles SIGTERM, so
  stopping it is safe.
- **No em dashes, anywhere.** `tests/no-em-dash.test.ts` enforces it and names offenders. Exemptions
  are by path with a stated reason; a cited work's title is data, and rewriting it falsifies the
  citation.
- **Re-run `./bin/atlas citations render` after any `resolve`.** Nothing detects a stale
  `rendered.json`; the site silently shows the previous run's text.

## Resume

```bash
export SKIP_AUDIO_DOWNLOAD=1          # mandatory; see handoff:0003
uv sync                                # the Python half, once per checkout
./bin/atlas citations report           # what still needs human attention
$EDITOR data/citations/overrides.proposed.yaml   # the 57, grouped by what they need
```

After editing an entry into `data/citations/overrides.yaml`:

```bash
./bin/atlas citations extract          # applies overrides, names any that match nothing
./bin/atlas citations render           # MUST follow; nothing detects a stale rendered.json
pnpm check                             # typecheck + both suites, ~25s
```

`pnpm verify` is heavy and is what `git push` runs; export `SKIP_AUDIO_DOWNLOAD=1` before either.

## Evidence and authority

- `docs/tasks/0032` - the metadata tail, with D1-D5 and the completion evidence table.
- `docs/tasks/0030` - CSL rendering and the control panel, AC-7 now evidenced.
- `docs/tasks/0033`, `0034` - the two owner-reported gaps recorded this session.
- `docs/audits/0011` F12, F14-F17 - the defects and the measured negatives.
- `data/citations/overrides.proposed.yaml` - the worklist.
