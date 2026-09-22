---
schema_version: 2
id: '0028'
uid: 'task-20260922T111217677076Z-fecfed0f'
title: 'Write resolved citations back into the research database'
role: task
status: todo
summary: 'Make every citation we resolve also populate the local corpus, so its coverage grows toward what the textbook actually cites.'
created: '2026-09-22'
updated: '2026-09-22'
owner: Markov Grey
supersedes: ''
superseded_by: ''
engineering_document:
  version: 1
  contract_tier: full
  role: task
  id: '0028'
  uid: task-20260922T111217677076Z-fecfed0f
  title: 'Write resolved citations back into the research database'
  state: todo
  authority:
    kind: work-state
    owner: Markov Grey
    scope: The research-db resolver and the resolve command; does not change the CSL store schema
  created: '2026-09-22'
  updated: '2026-09-22'
  transition_history: unverified
  transitions: []
  relationships: []
  details:
    criteria: [criterion:AC-1, criterion:AC-2, criterion:AC-3, criterion:AC-4, criterion:AC-5]
    parent: '0021'
    depends_on: ['0027']
    size: m
    priority: p2
---

# Task 0028: Write resolved citations back into the research database

## Problem

`task:0027` treats the local research-database corpus as a read-only resolver: ask it, and if it
does not know the URL, fall through to arXiv, Crossref, oEmbed or Open Graph. Measured coverage is
**7.9%** — 78 of 987 cited URLs.

That number never improves on its own. Every run asks the same questions, gets the same 78 answers,
and throws away everything the other resolvers learned.

**Owner's direction, 2026-09-22:** "every single time when we actually pull a link, we should store
it in the research db, so that it gradually covers more and more — and at the same time we get the
utility of the research db service fetching a bunch of the metadata that we need and formatting it
for us."

This inverts the relationship. The corpus stops being a lookup table and becomes a **write-back
cache**: a miss triggers an acquisition, so the next run — and every other consumer of that corpus —
hits. Coverage grows toward what is actually cited rather than toward what someone guessed to sweep.

### What is reachable, measured 2026-09-22

Probing `research fetch` with one real URL per domain (exit 0 = claimed, exit 5 = no scraper):

| Status                         | Sources | Domains                                                                                                                                                                |
| ------------------------------ | ------: | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Claimed** — write-back lands |     548 | arxiv.org (338), alignmentforum.org (79), lesswrong.com (45), openai.com (22), deepmind.google (20), anthropic.com (17), governance.ai (17), metr.org (6), iaps.ai (4) |
| **Exit 5** — no scraper        |     122 | epoch.ai (30), youtube.com (15), pubmed (11), intelligence.org (8), aisafetybook.com (7), ourworldindata.org (7), and 9 more                                           |

**548 of 948 sources are immediately acquirable.** The two largest wins are Alignment Forum and
LessWrong: the corpus currently holds **3 and 1 records** respectively, while this textbook cites
**79 and 45**. Those sweeps are effectively empty and the write-back would fill them with material
known to be worth citing.

## Scope

1. After a successful resolution from any non-corpus resolver, offer the URL to `research fetch`.
2. Make it **opt-in per run**, not automatic. This writes to a shared service; it must be a thing
   the operator asked for.
3. Record per-URL outcome — acquired, already held, or exit 5 unsupported — and report the tally.
4. Emit the exit-5 domains as a ranked list. That list is the evidence for scraper feature requests
   upstream, and it is generated as a by-product rather than by a special investigation.

## Out of scope

- **Making the Atlas build depend on this.** `task:0027` AC-6 stands: the bibliography must come out
  identical with the service unreachable. Write-back is an enrichment side effect, never a step the
  build waits on.
- **Changing the CSL store.** `task:0021` D1 and D2 are unaffected; this only changes where metadata
  is _sourced from_ over time.
- **Reviewing what gets acquired.** Records land as `unreviewed` by that corpus's own design, which
  is correct — provenance review is its owner's decision, not ours.

## Decisions required before execution

### D1 — Do we write back everything we cite, or only what is in that corpus's scope?

That corpus is explicitly for **frontier-AI and AI-safety source material**. This textbook also
cites Oxford Reference, MNIST, CIFAR, a Wikipedia image, IBM's Deep Blue history page and YouTube
lectures. Those are legitimate textbook citations and mostly **out of scope** for that corpus.

| Option                                                    | Consequence                                                                                                |
| --------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| **A.** Offer every cited URL                              | Maximum coverage growth. Pollutes a curated corpus with material outside its stated purpose.               |
| **B.** Offer only URLs on domains it already sweeps       | Safe and self-limiting. Also nearly pointless — those are the ones most likely already held.               |
| **C.** Offer everything it _claims_ (exit 0), skip exit 5 | The scraper set becomes the scope signal: if it claims the URL, its owner decided that domain is in scope. |

**Recommendation: C.** It respects the corpus's own scope judgement without us second-guessing it,
it needs no allow-list to maintain, and it self-corrects — when a scraper is added, the next run
picks that domain up automatically. It also means our exit-5 list is exactly the set of "would you
like to cover this?" questions, which is the feedback loop the owner asked for.

**Irreversible if wrong:** acquisitions land in a shared corpus, and deleting records is not offered
by that tool. Over-broad write-back is not cleanly undoable.

### D2 — Should resolution prefer the corpus after write-back?

Once a URL has been written back, the corpus holds it, so the next run resolves it locally. But the
metadata in the corpus came from _our_ fetch, which may be thinner than what arXiv or Crossref would
give directly.

**Recommendation: keep the current order** (corpus first) and rely on it being the same data. Revisit
only if measured quality drops; note that arXiv entries in that corpus already carry authors and
dates, which is the case that matters most by volume.

## Done when

- **AC-1:** A resolve run with write-back enabled acquires claimed URLs and reports a tally of
  acquired, already-held and unsupported.
- **AC-2:** Write-back is off by default and requires an explicit flag.
- **AC-3:** A failed or unsupported acquisition never fails the resolve run, and never alters the
  bibliography. `task:0027` AC-6 still passes with the service unreachable.
- **AC-4:** The run emits a ranked list of exit-5 domains with counts, suitable for filing upstream
  without further analysis.
- **AC-5:** Corpus coverage is re-measured after a full write-back run and recorded here, against the
  7.9% baseline. A number, not an impression.

## Completion evidence

_To be filled on completion. Each row must cite a criterion and durable evidence — a commit, a file
path, a test name, or a measured rate — not a narrative claim._

| Criterion | Evidence | Verified |
| --------- | -------- | -------- |
| AC-1      | —        | —        |
| AC-2      | —        | —        |
| AC-3      | —        | —        |
| AC-4      | —        | —        |
| AC-5      | —        | —        |

## Authority and inputs

- Owner direction, 2026-09-22, quoted in Problem.
- Coverage probe, 2026-09-22: one `research fetch` per domain over 10 representative domains; exit 0
  for alignmentforum, lesswrong, cdn.governance.ai; exit 5 for epoch.ai,
  forum.effectivealtruism.org, intelligence.org, nature.com, ourworldindata.org, pubmed, youtube.
  Reproducible.
- Domain histogram over the 948 entries in `data/citations/sources.yaml`.
- `task:0027` — the resolver this extends; AC-6 constrains it.
- Three feedback notes filed upstream 2026-09-22 (`skill-feedback`): scraper coverage with volume
  data, a batch/idempotent fetch request, and the absence of a "would you claim this URL?" probe —
  which is why the coverage data above cost 10 real acquisitions to obtain.
- **Full probe, 2026-09-22:** one real `research fetch` per domain across all 77 domains cited twice
  or more. 19 domains / 537 sources claimed; 57 domains / 233 sources exit 5; `openai.com` exit 1.
  The 156 domains cited once each were not probed.

- **Anomaly resolved, and the answer changes the picture.** The fetcher's claims are **path-scoped,
  not domain-scoped**, and the largest gaps are on publishers the corpus already sweeps:

  | URL                                            | Exit | Corpus records for that publisher |
  | ---------------------------------------------- | ---- | --------------------------------- |
  | `epoch.ai/blog/algorithmic-progress-in-…`      | 0    | 385                               |
  | `epoch.ai/benchmarks/eci`                      | 5    | 385                               |
  | `anthropic.com/research/alignment-faking`      | 0    | 177                               |
  | `anthropic.com/news/core-views-on-ai-safety`   | 5    | 177                               |
  | `deepmind.google/…`                            | 0    | 770                               |
  | `deepmind.com/blog`                            | 5    | 770                               |
  | `openai.com/index/chatgpt`                     | **1** | 13                               |

  So exit 5 does **not** mean "this publisher is out of scope" — it can mean "this path of an
  in-scope publisher is unclaimed". That weakens D1 option C's premise: using exit 5 as the scope
  signal would wrongly skip `anthropic.com/news/`, which is 12 of the 17 Anthropic URLs this
  textbook cites. **D1 should be decided knowing this**; the cleanest fix is upstream (widen the
  path claims) rather than an allow-list here.

  `openai.com` returning **exit 1** rather than 5 is a separate matter — exit 1 is "invalid input or
  internal failure", so something is erroring rather than declining. 22 sources are affected.
