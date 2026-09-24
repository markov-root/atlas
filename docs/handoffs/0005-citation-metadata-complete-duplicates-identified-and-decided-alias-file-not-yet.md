---
schema_version: 2
id: "0005"
uid: "handoff-20260924T181652526356Z-e8899b41"
title: "Citation metadata complete; duplicates identified and decided, alias file not yet built"
role: handoff
status: current
summary: "Metadata is at 99.6 percent and verify is green; the duplicate work is identified and decided but the alias file is not written."
created: "2026-09-24"
updated: "2026-09-24"
owner: HANDOFF OWNER
supersedes: ""
superseded_by: ""
engineering_document:
  version: 1
  contract_tier: full
  role: handoff
  id: "0005"
  uid: handoff-20260924T181652526356Z-e8899b41
  title: "Citation metadata complete; duplicates identified and decided, alias file not yet built"
  state: current
  authority:
    kind: continuation-state
    owner: HANDOFF OWNER
    scope: NEXT-SESSION CONTINUATION ONLY
  created: "2026-09-24"
  updated: "2026-09-24"
  transition_history: unverified
  transitions: []
  relationships: []
  details:
    captured_at: "2026-09-24T18:16:52Z"
    repository: REPOSITORY IDENTITY
    revision: COMMIT OR DIRTY-STATE IDENTITY
    objective: CURRENT OBJECTIVE
    completed: []
    open_work: [task:NNNN]
    blockers: []
    authority_refs: [AGENTS.md, docs/tasks/NNNN-title.md]
    resume: FIRST SAFE COMMAND
---

# Handoff 0005: Citation metadata complete; duplicates identified and decided, alias file not yet built

**Continues `handoff:0004`**, which stays `current` because this repository's handoffs carry
`transition_history: unverified` and the validator does not allow a supersession transition from
that state. Read 0004 for the standing warnings; this is what changed since.

## Outcome

**941 of 945 sources carry real metadata (99.6%)**, up from 888. `pnpm verify` passes end to end -
392 pages, 312 TypeScript and 310 Python tests, smoke, a11y, both linters, `docs:check` - and that
gate had never been run on this branch before.

The four remaining are not lookup work: two dead pages needing an author's choice of replacement,
one duplicate address (`task:0031`), and one directory index.

**`task:0031` is identified and decided but not built.** That is the one thing in flight.

## Completed work

| Commit | What |
| --- | --- |
| `d43f7c7` | An override can remove a field; the source facet reads `publisher` |
| `6268f4c` | 22 sources resolved, 96.3%; `task:0035` opened |
| `49a415d` | Twelve entries were rendering a broken author initial |
| `8ac0f40` | 15 more resolved, 97.9% |
| `ccf0550` | 16 more via verified search, 99.6% |
| _uncommitted_ | The duplicate-detector, comment-permalink and `--redo` fixes below |

## What is uncommitted and why it matters

Three defects found while starting `task:0031`, all fixed, none yet committed:

- **`audit:0011` F21** - the duplicate detector read the hyphen in "GPT-4" as a site-name separator,
  so "GPT-4 Technical Report" and "GPT-4 System Card" both fingerprinted as `gpt`. We were one step
  from aliasing a technical report together with its system card.
- **`audit:0011` F22** - a LessWrong comment permalink resolved to its containing post, so four
  citations by **three different people** were all credited to the thread owner. Fixed in
  `resolvers/forum_magnum.py`; six citations corrected.
- **`audit:0011` F23** - `--redo <resolver>` silently refused to redo that resolver's own entries.
  Fixing it reached **75 Alignment Forum and LessWrong posts** that predate the forum-magnum
  resolver and had been carrying scraped Open Graph metadata, unreachable by any redo since.

Run `./bin/atlas citations render` and `pnpm check` before committing these; the store has moved.

## Open work

1. **`task:0031`** - the alias file. Identified and decided, not written. See below.
2. **`task:0036`** - back-links from a reference to every place it cites, owner-requested
   2026-09-24. D1 is the live question: the citation index belongs in the transformer where
   footnote numbers already live, but putting it there now would churn the output snapshots and the
   module feeding the audio content hash, which this branch is deliberately keeping stable until the
   merge. Recommendation recorded: client-side first, transformer after.
3. **`task:0035`** - p1, 24 upstream Doc corrections including one wrong-document citation.
4. **`task:0022`** - p1, unchanged. `deploy.yml` passes real R2 credentials and `SKIP_AUDIO=1` does
   not gate `pushPublicFiles`, so a deploy re-uploads all audio. Verified **not** destructive on this
   branch: the audio content hashes are unchanged, so nothing is re-synthesised.
5. **`task:0033`**, **`task:0034`**, **`task:0023`**, **`task:0013`**, **`task:0028`**.

## `task:0031`: what is known, so it is not re-derived

**The detector reports 17 groups. The true count is about 37.** It keys on first author *and* year,
and a preprint routinely disagrees with its publisher page on both. The wider scan is a fingerprint-
only pass over `sources.yaml`; it found 24 more, of which ~21 are genuine.

**Decisions taken by the owner, 2026-09-24:**

| Question | Decision |
| --- | --- |
| Cross-posts (Alignment Forum / LessWrong / EA Forum) | **Alignment Forum wins where it exists** |
| `johnswentworth's Shortform` x4 | **Not duplicates.** Four comments by three people; resolver fixed |
| *Superintelligence* (Google Books / Goodreads / PsycNet) | **Keep the PsycNet record** |
| AI Succession (slides / YouTube) | **Keep both** - different media of one talk |
| The two OpenReview junk titles | **Fix them** (both read "Verifying your browser") |

**Do not alias these three false positives:** `aima.cs.berkeley.edu` with OWID's "Artificial
Intelligence" page, and Dafoe's OUP chapter with GovAI's "AI Governance: Opportunity and Theory of
Impact" - both collide only because the fingerprint strips subtitles. The two OpenReview URLs are
different papers sharing a scraped junk title.

**Design already settled in the task record:** `data/citations/aliases.yaml` keyed by the surviving
URL, applied in `extract` after canonicalisation. D1 recommends deleting the aliased entry and naming
each removal on stdout; D2 recommends keeping the survivor's own metadata and recording the alias
URLs in `sameAs`.

**Unresolved implementation question:** citation *instances* also carry the aliased URL. If aliasing
happens only in the store, the site's per-section lists will look up a key that no longer exists and
fall back to rendering a bare URL. The alias has to apply where instances are mapped to store keys,
not only at the store upsert.

## The pipeline-versus-upstream line

Recorded here because it decides where future fixes go:

> **The pipeline may describe a work. Only an author may choose one.**

Describing (title, author, date, venue) is machine work. Choosing (which document, and what the
in-text citation claims) is authorial, and the pipeline already refuses it - URL is identity, anchor
text is never re-rendered.

The cost asymmetry is measured: **17 of 53 override blocks exist only because the Doc cites a mirror
or a CDN path**, and 31 of 53 carry a `GDOC FIX` note. A pipeline fix is permanent maintenance; an
upstream fix is permanent deletion. But detection must never move upstream, because a Google Doc has
no CI.

## The merge decision

`main` is unmoved: 69 commits behind, 0 ahead, 186 files, +73k/-1.6k. It merges clean and only gets
riskier. `pnpm verify` is green. **Merging auto-deploys** (`deploy.yml` on push to `main`), so it is
shipping.

Recommendation given: merge after `task:0031`, because that is the only open item this branch made
*worse* - seven duplicate groups that were previously visible anchor stubs now render as two
authoritative-looking twins, one with a dead link.

## Blockers

- **Nothing is blocked on an answer.** `task:0031`'s five decisions are taken and recorded above;
  what remains is implementation.
- **Merging is deploying.** A decision, not an obstacle, but it must be made deliberately.
- **`task:0035` needs the authors**, not the pipeline: a wrong-document citation, four anchor-text
  errors and 76 inconsistent spellings can only be fixed in the Google Docs source.

## Things that will bite the next person

Everything in `handoff:0004` still applies. New since:

- **`--redo opengraph` now targets far more than it did**, because F23's fix widened the filter
  correctly. It is a ~90-entry, ~7-minute run. That is right, not a regression.
- **`overcommit_memory=0` on this VM**, so `Committed_AS` exceeding `CommitLimit` is not itself
  dangerous and is the wrong thing to gate on. Watch **swap** and available memory instead. Stale
  Playwright Chrome from a subagent held ~700 MB; reclaiming it made `pnpm verify` comfortable.
- **A dev server is running** on `0.0.0.0:4321` from this session. Stop it when done.

## Resume

```bash
export SKIP_AUDIO_DOWNLOAD=1
./bin/atlas citations render      # the store moved; rendered.json is stale
pnpm check
git add -A && git commit          # F21/F22/F23 are uncommitted
```

Then `task:0031`: write `data/citations/aliases.yaml` from the decision table above, apply it where
citation instances are mapped to store keys, and re-run `extract` / `render` / `report` until the
duplicate section shrinks to the false positives only.

## Evidence and authority

- `docs/tasks/0031` - the alias design, D1 and D2.
- `docs/tasks/0032` - D6, and the metadata tail closed to 99.6%.
- `docs/tasks/0035` - the 24 upstream corrections.
- `docs/audits/0011` F18-F23 - the defects fixed across this session.
- `data/citations/citation-report.md` - the live duplicate list (gitignored).
