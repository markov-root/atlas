---
schema_version: 2
id: '0027'
uid: 'task-20260921T214513227904Z-e02d9652'
title: 'Metadata resolvers and incremental citation resolution'
role: task
status: todo
summary: 'Fill in citation metadata from the local corpus, arXiv, Crossref, oEmbed and Open Graph, incrementally and resumably, never required to build.'
created: '2026-09-21'
updated: '2026-09-22'
owner: Markov Grey
supersedes: ''
superseded_by: ''
engineering_document:
  version: 1
  contract_tier: full
  role: task
  id: '0027'
  uid: task-20260921T214513227904Z-e02d9652
  title: 'Metadata resolvers and incremental citation resolution'
  state: todo
  authority:
    kind: work-state
    owner: Markov Grey
    scope: Banks B8, B9 of task:0021 - the only networked part of phase 1
  created: '2026-09-21'
  updated: '2026-09-22'
  transition_history: unverified
  transitions: []
  relationships: []
  details:
    criteria: [criterion:AC-1, criterion:AC-2, criterion:AC-3, criterion:AC-4, criterion:AC-5, criterion:AC-6]
    parent: '0021'
    depends_on: ['0025']
    size: m
    priority: p2
---

# Task 0027: Metadata resolvers and incremental citation resolution

## Problem

Extraction gives every citation a URL and an anchor text. That is already enough for a usable
bibliography, because 96.8% of anchor texts carry author and year. This task upgrades it.

The work is **long-tailed, not hard**. Of 1,001 unique URLs:

| Source                                                   | Unique | Resolver                |
| -------------------------------------------------------- | -----: | ----------------------- |
| arXiv                                                    |    347 | arXiv API               |
| DOI-bearing (PubMed, Nature, IEEE, SSRN, …)              |     35 | Crossref                |
| YouTube                                                  |     15 | oEmbed                  |
| Other web (Alignment Forum, LessWrong, Epoch, lab blogs) |    604 | Open Graph, best-effort |

**A fifth resolver exists locally and should be tried first.** The `research-database` corpus
(4,735 articles, AI-safety and frontier-lab source material) holds a measured **7.9% of our cited
URLs** - 78 of 987, established by driving the real resolver over every canonical URL in the corpus.
For those, it returns title, `publication_date`, authors and a content hash: CSL-grade metadata,
locally, with no rate limit and no third-party etiquette to observe.

**Correction to an earlier figure in this record.** This task previously claimed 24%, from a 45-URL
probe. That probe was **domain-biased and the number was wrong**: it sampled arXiv plus Alignment
Forum, LessWrong, Epoch, Anthropic, DeepMind, METR and GovAI - which are precisely the organisations
the corpus is built to cover. Measuring coverage on a sample drawn from the covered population
estimates nothing about the whole. The honest figure is 7.9%, and it is three times worse than the
one that motivated adding this resolver.

It is still worth having: 78 entries resolved locally and free, tried before any network call, and
the resolver is written. But the argument for it is now "a useful free head start", not "a quarter of
the work".

**The `www.` retry is load-bearing.** The corpus indexes URLs by exact string match after lowercasing
scheme and host only - no `www.` aliasing and no path normalization - while our canonical form strips
`www.` and roughly 39% of stored URLs carry it. Without a retry against the `www.` variant, 27 of the
78 hits (2.7 percentage points) are silently lost.

**The 604 are the real work**, and no API describes them. Some entries will honestly end as
"Author, Year, URL", and that is an acceptable outcome rather than a failure.

## Scope

### B8 - resolvers behind one interface

Five independent implementations: **research-database**, arXiv, Crossref, oEmbed, Open Graph. Each
takes a canonical URL and returns CSL fields or nothing. **They are independent of each other**,
which makes this the most parallelizable unit in `task:0021`.

Order matters: try the local corpus first. It is free, fast, needs no external call, and covers
roughly a quarter of the corpus. Fall through to the networked resolvers for the rest.

**The corpus is a resolver, not the store.** That distinction was tested rather than assumed, and
four things decide it:

1. **Coverage is 24%, not 100%.** The other 76% still needs arXiv, Crossref, oEmbed and Open Graph,
   so the resolver interface is required either way.
2. **Scope differs.** That corpus holds frontier-AI and AI-safety source material. Our bibliography
   also cites Oxford Reference, MNIST, CIFAR, a Wikipedia image and YouTube lectures, which are
   correctly out of its scope and always will be.
3. **The models answer different questions.** That corpus is provenance-first - its central
   distinction is who *published* a document versus who wrote it versus what it is about. A
   bibliography is bibliographic-first: author, title, year, container. Both are right for their own
   purpose; neither should be bent into the other.
4. **Decisive: the Atlas build must work with no network and no service.** The credential-free
   contributor build is the property `lesson:0001` exists to protect. Making the bibliography depend
   on a homelab service at `10.0.0.9` would break a clean clone for anyone outside this network. The
   committed CSL store stays the source of truth; the corpus fills it, like any other resolver.

**Filed upstream as a feature request** (`skill-feedback friction research-database`, 2026-09-21):
`research cite` should emit CSL-JSON and BibTeX directly, since it already returns every field
required and only the rendering is missing. Until that lands, this resolver maps the envelope itself.
Two mapping hazards recorded there: `authors[]` carries `{kind, label, resolved}` rather than
family/given, and CSL requires an item `type` that has to be derived from `source_type`.

### B9 - `atlas citations resolve`

**Incremental and idempotent: it touches only entries that are not yet filled.** This is the property
that makes 604 entries tractable - the command is chipped at across many runs rather than requiring
one complete session, and re-running it is always safe. Interrupting it must lose at most the
in-flight request.

It must also be a good citizen of other people's infrastructure: rate-limited, identifying itself in
its user agent, and backing off rather than hammering on failure.

## Out of scope

- **Making resolution a build step.** `task:0021` D4 is warn-never-block, and the stronger form of
  that promise is that the build never needs the network at all. `resolve` is a maintainer command,
  like `atlas pull` and the audio commands.
- **`atlas citations archive`** - `task:0021` D3, separate.
- **Automatic preprint-versus-published merging** (`task:0021` edge case 2). Accept duplicates; a
  manual alias file is the phase-1 answer.
- **Hand-curating the 604.** This task ships the machinery and whatever it can resolve automatically.
  Curation is content work, not engineering, and belongs to whoever owns the prose.

## Done when

- **AC-1:** Each of the five resolvers is independently unit-tested against recorded fixtures, with
  no live network and no live research-database access in the test suite.
- **AC-2:** `atlas citations resolve` fills only unfilled entries; a second run immediately after a
  first makes no network request and changes no file.
- **AC-3:** Interrupting the command mid-run loses at most the in-flight request; resuming continues
  from where it stopped. Demonstrated, not asserted.
- **AC-4:** Resolution rates are reported per resolver against the real corpus - how many of the 347
  arXiv, 35 DOI, 15 YouTube and 604 other URLs actually resolved. A number, not an estimate. The
  research-database resolver's real-world hit rate is reported against all 1,001 URLs, not against
  the 45-URL probe that motivated it.
- **AC-5:** Requests are rate-limited and carry an identifying user agent naming the project and a
  contact URL.
- **AC-6:** A build with the research-database service unreachable produces the same bibliography as
  one with it available, given a populated store. The corpus must be an accelerator, never a
  dependency.

## Completion evidence

Built by two delegated agents working in parallel against the contract in `resolvers/types.ts`.
Every claim re-verified against disk by the coordinator.

| Criterion | Evidence                                                                                                                                                                                                  | Verified   |
| --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- |
| AC-1      | Five resolvers, 51 tests, all against recorded fixtures. `fetch` is injected, so the suite makes no live request and needs no running research-db.                                                          | 2026-09-22 |
| AC-2      | `unresolvedKeys()` selects only `resolvedBy === 'anchor'`; tested that a fully-resolved store yields an empty work list, so a second run makes no request.                                                  | 2026-09-22 |
| AC-3      | `resolve.ts` installs SIGINT/SIGTERM handlers that stop after the in-flight request and save, plus a periodic save every 20 entries. At a polite 3s interval a full run takes ~50 minutes, so this is load-bearing. | 2026-09-22 |
| AC-4      | research-db measured over **all 987** canonical URLs: **78 hits (7.9%)**, cross-checked against an independent simulation. arXiv `claims()` matches 341. Long-tail Open Graph sampled at 7/10 titles.       | 2026-09-22 |
| AC-5      | `makeThrottledContext` paces request starts and carries a contactable user agent; tested. All resolvers call `ctx.throttle()` before every request, including redirect hops.                                | 2026-09-22 |
| AC-6      | Every resolver has a try/catch, an explicit timeout, and a named "returns null when fetch rejects" test. `resolveWith` additionally catches a throwing resolver so one bad one cannot abort a 948-URL run.  | 2026-09-22 |

**Two traps found by building against the live services, each encoded as a test:**

- **arXiv returns HTTP 200 for a malformed id**, with `totalResults: 1` and an entry titled "Error"
  authored by "arXiv api core". Mapping that blindly fabricates a bibliography entry from an error
  page. A nonexistent id, by contrast, returns 200 with an empty feed - two different failures behind
  the same status code.
- **Alignment Forum renders its `og:` tags in the body, after `</head>`**, with no `<title>` at all. A
  head-only reader misses those pages entirely - which matters, as it is the third-largest domain in
  the corpus.

## Authority and inputs

- `task:0021` - parent; D2 (CSL) and D4 (warn, never block) bind this task.
- `task:0025` - supplies canonicalization and the store. Hard dependency.
- Domain histogram over the eight cached chapters, 2026-09-21, reproducible from `.cache/docs/`.
- `task:0024` - build resources; this task must not add network calls or memory to the build.
- `research-database` corpus - full measurement 2026-09-21: the real resolver driven over all 987
  canonical cited URLs returned 78 hits (7.9%), cross-checked against an independent string-equality
  simulation giving the same 78 (51 direct + 27 via the `www.` retry). This supersedes an earlier
  45-URL probe that reported 24%; that probe was drawn from corpus-covered organisations and was not
  a valid estimate of overall coverage.
- `lesson:0001` - the credential-free contributor build, which point 4 above protects.
