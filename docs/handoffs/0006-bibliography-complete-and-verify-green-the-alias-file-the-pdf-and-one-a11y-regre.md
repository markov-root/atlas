---
schema_version: 2
id: "0006"
uid: "handoff-20260924T210851586839Z-a728e8c0"
title: "Bibliography complete and verify green; the alias file, the PDF and one a11y regression"
role: handoff
status: current
summary: "The bibliography feature is finished on all four surfaces and pnpm verify passes end to end."
created: "2026-09-24"
updated: "2026-09-29"
owner: Markov Grey
supersedes: ""
superseded_by: ""
engineering_document:
  version: 1
  contract_tier: full
  role: handoff
  id: "0006"
  uid: handoff-20260924T210851586839Z-a728e8c0
  title: "Bibliography complete and verify green; the alias file, the PDF and one a11y regression"
  state: current
  authority:
    kind: continuation-state
    owner: Markov Grey
    scope: NEXT-SESSION CONTINUATION ONLY
  created: "2026-09-24"
  updated: "2026-09-29"
  transition_history: unverified
  transitions: []
  relationships: []
  details:
    captured_at: "2026-09-24T21:08:51Z"
    repository: markov-root/atlas (branch bibliography)
    revision: a523ffb, clean
    objective: Finish the bibliography feature, then decide on merging to main
    completed: [task:0031, task:0034, task:0036]
    open_work: [task:0037, task:0035, task:0033, task:0022, task:0028]
    blockers: [merge-to-main-is-a-deploy]
    authority_refs: [AGENTS.md, docs/handoffs/0005-citation-metadata-complete-duplicates-identified-and-decided-alias-file-not-yet.md, docs/tasks/0031-collapse-duplicate-sources-through-an-alias-file.md, docs/audits/0011-incidental-findings-log-bugs-edge-cases-and-optimizations-found-in-passing.md]
    resume: export SKIP_AUDIO_DOWNLOAD=1 && pnpm check
---

# Handoff 0006: Bibliography complete and verify green; the alias file, the PDF and one a11y regression

**Continues `handoff:0005`.** Read 0004 and 0005 for the standing warnings; this is what changed
since.

`handoff:0005` said its predecessors had to stay `current` because
`transition_history: unverified` blocks a supersession transition. That is true of the marker, not of
the records: replacing it with a real `complete` history and a `superseded-by` relationship is all it
takes, and **all five earlier handoffs are now `superseded`**. `engineering document validate` reports
`passed` for the first time - it had been carrying a multiple-current-handoff finding since 0002.

## Shipped

**The citations and bibliography feature is live.** Merged to `main` and deployed 2026-09-29
(`69e4d5c`, Deploy green). `Test` is green too, for the first time since `task:0029` - see below.

Three things were found in the hour after the merge and are fixed:

| Commit | What |
| --- | --- |
| `10c580a` | CI never installed `uv`, so `lint:py` and `test:py` had been unreachable since the port. The whole Python half was invisible to CI, which is also why a lint error survived on this branch. |
| `ba3c661` | The pre-push hook livelocked the VM. Three guards: skip a re-verify of the same commit, refuse to start below 3 GiB available, and export `SKIP_AUDIO_DOWNLOAD=1` itself. |
| `69e4d5c` | `task:0037`, the 11 broken Our World in Data figure embeds. |

**`task:0022` nearly fired for real.** Running the hook from a shell without
`SKIP_AUDIO_DOWNLOAD=1` exported sent an 11 MB `PutObject` at the production R2 bucket. It failed on
a stale signature. The protection had been "a human remembers to export a variable"; the hook sets it
now.

## Outcome

**The bibliography feature is finished on all four reader-facing surfaces, and `pnpm verify` passes
end to end** - both linters, typecheck, 323 TypeScript and 335 Python tests, `docs:check`, a
392-page build, smoke and a11y. That gate had **never passed on this branch**: it was last claimed
green before `a168f55`, which introduced a line-length failure, and the back-links introduced an
accessibility failure after that.

The store is **912 sources**, down from 945, because 33 addresses were folded onto the 29 entries
that survive them. The report ends at **0 probable duplicates**, down from 17.

## Completed work

| Commit | What |
| --- | --- |
| `67b80af` | `task:0031` - the reviewed alias file, applied in both halves |
| `c0cbd2f` | `task:0034` - the chapter PDF ends with its bibliography |
| `98808a5` | `audit:0011` F25 - 56 titles were carrying their own site name |
| `a523ffb` | The back-link failed WCAG 1.4.1; `pnpm verify` is green |

`task:0031` and `task:0034` are the first two records in this repository transitioned to `done`, with
real `transitions` entries rather than `transition_history: unverified`. That is the mechanism the
other finished records need - see **Open work**.

### What `task:0031` settled that was not settled before

`handoff:0005` left one implementation question open: citation *instances* carry the aliased URL, so
folding only at the store upsert would leave the site rendering bare URLs. The answer is **one
integration point per half**, at the boundary where a URL becomes an entry identity - `read_scan` in
Python, `citedKeys` in TypeScript - and the browser gets the map as `data-aliases` for its back-links.
The TypeScript side inverts the store's own `sameAs` rather than reading `aliases.yaml` a second time,
which makes `aliases.yaml` to `sources.yaml` exactly the relationship `overrides.yaml` already has.

Two things were found by building it and are worth not re-deriving:

- **D2 applied literally loses citations.** If the prose cites only the mirror, extraction mints a
  fresh anchor-only entry at the surviving address, so "the survivor keeps its own metadata" keeps a
  placeholder and deletes the record that knew the title. An **unresolved** survivor now adopts a
  resolved alias's description; identity stays its own.
- **The detector's 17 groups were about half the real count**, as 0005 predicted. A fingerprint-only
  pass found 24 more: 14 aliased, 10 recorded in a new `not-duplicates` section that stops the report
  repeating a rejected finding. Matched by **subset**, so "these four comments are four different
  comments" survives the detector regrouping them.

## Open work

1. **`task:0037`** - the Our World in Data figure embeds. **11 of the 28 iframes in the textbook
   render a 404 page or a whole third-party article**, on 8 pages across 4 chapters, and **9 of the 11
   still return HTTP 200** because OWID 302s a retired chart to an article. Six verified swaps are
   written out; five charts have no replacement and need an authorial decision. Found by the owner
   reading a page, not by any check this repository runs.
2. **`task:0035`** - p1, and the only bibliography *citation* item left. ~24 upstream Google Doc corrections
   that cannot be fixed here because URL is identity and anchor text is never re-rendered. Needs the
   authors, not the pipeline. Includes one wrong-document citation and the `arxiv.org/abs/2307.15217'`
   trailing apostrophe, which is now aliased but should be fixed at source.
3. **`task:0033`** - the styled listbox. Site-wide design-system work rather than bibliography work,
   and D1 is unanswered: buy a headless library or hand-roll. The bibliography's source facet is
   **255 options**, which makes type-ahead and virtualisation real rather than theoretical.
4. **`task:0022`** - p1, unchanged. `deploy.yml` passes real R2 credentials and `SKIP_AUDIO=1` does
   not gate `pushPublicFiles`.
5. **`task:0028`**, **`task:0023`**, **`task:0013`**.
6. **Records finished in substance but still `todo`:** `0021`, `0025`, `0026`, `0027`, `0029`,
   `0030`, `0032`, `0036`. Each carries a filled evidence table; `0025` states outright that it stays
   `todo` because "acceptance is the owner's". They were **deliberately not transitioned here** -
   that is the owner's call, not a cleanup. The mechanism now exists: replace
   `transition_history: unverified` / `transitions: []` with a real `complete` history, as `0031`
   does, or `engineering document validate` rejects a non-initial state.

## Blockers

- **Nothing is blocked on an answer.** Every decision this work needed was already recorded in
  `handoff:0005` or taken against evidence and written into the task record.
- **Merging to `main` deploys.** Done, 2026-09-29. `deploy.yml` fired and succeeded.
- **`task:0035` needs the authors.** No amount of engineering fixes a citation that points at the
  wrong document.

## Things that will bite the next person

Everything in `handoff:0004` and `handoff:0005` still applies. New since:

- **`pnpm verify` was silently broken on this branch for two commits.** `a168f55` shipped an
  over-long line that `lint:py` rejects, and the back-links shipped an axe `link-in-text-block`
  failure. Both were invisible because only `pnpm check` was being run. **Run `verify`, not `check`,
  before claiming a branch is mergeable.**
- **`verify` needs headroom on this VM.** Swap was fully consumed with the dev server up. Stopping
  the dev server freed ~1.3 GB and the run was comfortable. `pkill -f "astro dev"` does not work from
  an agent shell - the pattern matches the agent's own wrapper - so find the listener with
  `ss -ltnp | grep 4321` and kill that PID.
- **Two resolver defects are recorded and unowned**, `audit:0011` F26 and F27. F27 is the one to
  watch: `forum-magnum` is returning `None` for EA Forum URLs it claims, so the archive answers in
  its place, and the EA Forum share of this corpus will grow.
- **A status-code sweep will tell you these embeds are healthy.** Nine of the eleven broken Our
  World in Data figures answer HTTP 200; the signal is the *redirect target*, not the code. Any future
  link check over this corpus has to ask "does the final URL still name the thing it asked for".
- **The pre-push hook runs the whole `verify` chain on every push.** One push is one full verify;
  two branches at the same commit was two, on top of one run by hand, and that is what took the VM
  down on 2026-09-29. `ba3c661` now skips a verify of a commit that already passed. Count them anyway.
- **`earlyoom` is installed as of 2026-09-29** and is the reason a future overrun should kill a build
  rather than hang every pane on the box. Note its condition is an **AND**: it fires when memory *and*
  swap are both low. Swap on this VM sits at ~0% free permanently, so the swap half is always true and
  it behaves as a memory-only guard - which is what is wanted, but it is accidental. `-s 100,100` in
  `/etc/default/earlyoom` makes it explicit.
- **A dev server is not running.** It was stopped to free memory for the release and not restarted.

## Resume

```bash
export SKIP_AUDIO_DOWNLOAD=1
pnpm check                        # ~25s; verify is ~100s and wants the dev server stopped
```

Then either `task:0035` with the authors, or the merge decision. Nothing in the repository is
half-built: the working tree is clean and every commit on this branch passes `verify` as of
`a523ffb`.

## Evidence and authority

- `docs/tasks/0031` - the alias design, D1 to D4, and the wider pass.
- `docs/tasks/0034` - the PDF reference list, D1 and D2.
- `docs/audits/0011` F25 to F27 - found while verifying the two above.
- `data/citations/aliases.yaml` - the reviewed decisions, with the rules they apply in its header.
