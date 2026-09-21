---
schema_version: 2
id: '0027'
uid: 'task-20260921T214513227904Z-e02d9652'
title: 'Metadata resolvers and incremental citation resolution'
role: task
status: todo
summary: 'Fill in citation metadata from the local corpus, arXiv, Crossref, oEmbed and Open Graph, incrementally and resumably, never required to build.'
created: '2026-09-21'
updated: '2026-09-21'
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
    scope: Banks B8, B9 of task:0021 — the only networked part of phase 1
  created: '2026-09-21'
  updated: '2026-09-21'
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
(4,735 articles, AI-safety and frontier-lab source material) already holds a measured **24% of our
cited URLs** — 11 of a 45-URL probe on 2026-09-21, sampling arXiv plus Alignment Forum, LessWrong,
Epoch, Anthropic, DeepMind, METR and GovAI. For those, `research cite <url> --include-unreviewed`
returns title, `publication_date`, authors, and a content hash: CSL-grade metadata, available
locally, with no rate limit and no third-party etiquette to observe.

**The 604 are the real work**, and no API describes them. Some entries will honestly end as
"Author, Year, URL", and that is an acceptable outcome rather than a failure.

## Scope

### B8 — resolvers behind one interface

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
3. **The models answer different questions.** That corpus is provenance-first — its central
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

### B9 — `atlas citations resolve`

**Incremental and idempotent: it touches only entries that are not yet filled.** This is the property
that makes 604 entries tractable — the command is chipped at across many runs rather than requiring
one complete session, and re-running it is always safe. Interrupting it must lose at most the
in-flight request.

It must also be a good citizen of other people's infrastructure: rate-limited, identifying itself in
its user agent, and backing off rather than hammering on failure.

## Out of scope

- **Making resolution a build step.** `task:0021` D4 is warn-never-block, and the stronger form of
  that promise is that the build never needs the network at all. `resolve` is a maintainer command,
  like `atlas pull` and the audio commands.
- **`atlas citations archive`** — `task:0021` D3, separate.
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
- **AC-4:** Resolution rates are reported per resolver against the real corpus — how many of the 347
  arXiv, 35 DOI, 15 YouTube and 604 other URLs actually resolved. A number, not an estimate. The
  research-database resolver's real-world hit rate is reported against all 1,001 URLs, not against
  the 45-URL probe that motivated it.
- **AC-5:** Requests are rate-limited and carry an identifying user agent naming the project and a
  contact URL.
- **AC-6:** A build with the research-database service unreachable produces the same bibliography as
  one with it available, given a populated store. The corpus must be an accelerator, never a
  dependency.

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
| AC-6      | —        | —        |

## Authority and inputs

- `task:0021` — parent; D2 (CSL) and D4 (warn, never block) bind this task.
- `task:0025` — supplies canonicalization and the store. Hard dependency.
- Domain histogram over the eight cached chapters, 2026-09-21, reproducible from `.cache/docs/`.
- `task:0024` — build resources; this task must not add network calls or memory to the build.
- `research-database` skill and corpus — overlap probe of 45 cited URLs on 2026-09-21 returned 11
  hits (24%); `research overview` reported 4,735 articles. Both reproducible.
- `lesson:0001` — the credential-free contributor build, which point 4 above protects.
