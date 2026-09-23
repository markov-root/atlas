---
schema_version: 2
id: '0032'
uid: 'task-20260923T172119019240Z-513d7b75'
title: 'Close the citation metadata tail to complete coverage'
role: task
status: todo
summary: 'Resolve the 132 sources no resolver could reach, and give the residual a reviewed override path.'
created: '2026-09-23'
updated: '2026-09-23'
owner: Markov Grey
supersedes: ''
superseded_by: ''
engineering_document:
  version: 1
  contract_tier: full
  role: task
  id: '0032'
  uid: task-20260923T172119019240Z-513d7b75
  title: 'Close the citation metadata tail to complete coverage'
  state: todo
  authority:
    kind: work-state
    owner: Markov Grey
    scope: Metadata acquisition and its store representation — rendering and the site are unchanged
  created: '2026-09-23'
  updated: '2026-09-23'
  transition_history: unverified
  transitions: []
  relationships: []
  details:
    criteria:
      [
        criterion:AC-1,
        criterion:AC-2,
        criterion:AC-3,
        criterion:AC-4,
        criterion:AC-5,
        criterion:AC-6,
        criterion:AC-7,
      ]
    parent: '0021'
    depends_on: ['0029']
    size: l
    priority: p1
---

# Task 0032: Close the citation metadata tail to complete coverage

## Problem

**132 of 945 sources carry no metadata beyond their anchor text**, and the owner has stated the site
does not ship until that number is zero. A second, quieter gap sits behind it: of the 813 entries
that _are_ resolved, only **191 carry a `container-title`** — so the "filter by source" facet
`task:0030` AC-7 promises has nothing to filter on for three quarters of the corpus.

Both are the same problem — the store knows less than it needs to — which is why they are one task.

`atlas citations resolve` has been run to exhaustion. Re-running it changes nothing, because every
one of the 132 has already been declined by all six resolvers. **What is missing is capability, not
another pass.**

### What the 132 actually are

Measured 2026-09-23 by fetching each one and recording the outcome
(`docs/audits/0011` F14). The categories are what the work is shaped around:

| Outcome                 |   n | What it means                                                       |
| ----------------------- | --: | ------------------------------------------------------------------- |
| HTTP 403 / 401 / 402    |  57 | Publisher WAF, paywall, or bot check — no document was ever reached |
| PDF, fetched fine       |  29 | Nothing for an HTML scraper to read                                 |
| Connect error / timeout |  15 | Transient or infrastructure — expired cert, slow origin             |
| HTTP 404 / 410          |  11 | **The cited page is gone.** A content defect, not a resolver gap    |
| HTML 200, usable title  |   8 | Would resolve today. The earlier attempt failed transiently         |
| HTML 200, no/bad title  |  11 | JS-rendered, or a bot-check page behind a 200                       |
| Other (202, 429)        |   1 | —                                                                   |

The single most important row is the one that is not a category at all: **8 entries resolve
perfectly right now and are permanently marked unresolvable**, because `audit:0011` F12 is real and
load-bearing. A resolver returns `None` for "this does not exist" and for "the network hiccuped"
alike, so one bad moment is recorded as a permanent verdict.

## Scope

Five capabilities, one contract change, and an honest floor under what no API can answer.

### Automated — authoritative sources only

1. **Request headers.** The client sends no `Accept` or `Accept-Language`. Adding the ordinary
   browser-shaped values turns **7 of 32 blocked hosts into 200s** — `rand.org` (4 entries),
   `metaculus.com` (2), `openreview.net`, `oxfordreference.com`, `ft.com`, `elibrary.imf.org`,
   `arbital.greaterwrong.com`.
2. **Declined versus unreachable** (`audit:0011` F12). The resolver contract gains a third outcome.
   Unreachable does not set `resolvedBy`, so the entry is retried on the next run instead of being
   handed permanently to a worse resolver. One in-run retry for the genuinely transient case.
3. **Crossref from a DOI in the URL.** The resolver claims only `doi.org` today. **12 blocked
   entries carry a DOI in their path** — `dl.acm.org/doi/10.1145/…`, `tandfonline.com/doi/full/…`,
   `pnas.org/doi/…`, `science.org/doi/…`. A DOI printed in the URL is an identity claim made by the
   publisher, not a guess, so this is free coverage of exactly the hosts that block scraping.
4. **A ForumMagnum resolver.** LessWrong, the EA Forum and the Alignment Forum run the same
   software and expose the same public GraphQL API; the post ID is already in the URL path.
   Verified returning title, author display name, coauthors and `postedAt` for both hosts. This also
   fixes the shortform and comment permalinks, which are JS-rendered and will never scrape.
5. **A Wayback resolver, last before manual.** For the 11 dead links, `archive.org/wayback/available`
   gives the closest snapshot, whose HTML the Open Graph reader can then read. Coverage is partial —
   2 of 4 sampled had a snapshot — so this reduces the manual set rather than closing it.

### Human-completed, tool-assisted

6. **`data/citations/overrides.yaml`** — reviewed CSL fields, highest precedence, never overwritten
   by any resolver, committed as input rather than output. This is the same posture `task:0031`
   takes for aliases and `task:0021` D1 takes for identity: where a machine cannot know, a human
   records the answer and the tool stops guessing.
7. **`atlas citations propose`** — writes commented-out override stubs carrying whatever evidence
   was gathered for each still-unresolved entry: the first lines of a PDF's page 1, the page title,
   the Wayback snapshot URL, the anchor text and where it is cited. The human confirms or corrects
   rather than researching from nothing.

### Metadata shape

8. **`container-title` on every entry that has a source.** arXiv preprints get `arXiv`; a resolved
   page with an `og:site_name` already gets one; the rest fall back to the publisher the URL names.
   This is what makes `task:0030` AC-7's source facet possible, and it is metadata work, so it lives
   here.
9. **A dead-link section in `atlas citations report`.** An HTTP 410 or a 404 is not a resolver
   failure, it is a citation pointing at nothing, and the edition-2 authors are the only people who
   can fix it.

## Out of scope

- **Rendering and the site.** `task:0030` owns the control panel; this task only makes the fields it
  needs exist.
- **Merging duplicates.** `task:0031`.
- **Changing canonical-URL identity.** `task:0021` D1 stands.

## Decisions

### D1 — Do we send a browser User-Agent to get past WAFs? — **decided: no**

Measured, because the assumption was that it would help: a full Chrome UA string moved **32 blocked
hosts to 9 unblocked, against 7 for our own honest UA** with the same `Accept` headers. Two hosts,
for a misrepresentation that would sit in every request this project makes.

The headers are the part that actually worked, and they are honest: `Accept: text/html…` states what
we can parse, which is true. The UA continues to say who we are and how to contact us
(`task:0027` AC-5). Sites that block a self-identifying bibliographic fetcher at 3-second intervals
have made a decision we will respect rather than route around.

### D2 — Do we read metadata out of PDFs? — **decided: no, propose instead**

Two extraction strategies were built and measured against real corpus PDFs before being rejected:

- **The Info dictionary** (`/Title`, `/Author`): **0 of 12 carried a title.** Not a weak signal, an
  absent one.
- **Largest-font run on page 1**: about **5 of 16 came out clean.** The rest bled into body text,
  because a report set in one size has no largest font — "The American Enterprise Institute (AEI) is
  a nonpartisan, nonprofit, 501(c)(3)…" is what that method returns for a real corpus entry.

A 70%-correct title is worse than no title, because nothing downstream can tell which 70%. Page-1
text is genuinely good _evidence_, so it goes to `propose` for a human to confirm — which is the
same distinction the duplicate report already draws between detecting and deciding.

### D3 — Do we search Crossref by title to find a DOI? — **decided: no**

Also measured. Crossref's `query.bibliographic` returns a score that is neither normalised nor
calibrated: searching **"Safety cases for frontier AI"** returns **"Safety Framework Cards: A
Standardized Specification…"** at score 25.7 — a different paper, ranked first, with a score
indistinguishable from a correct hit's.

Accepting that would attach a real DOI, real authors and a real journal to the wrong work, and the
result looks _more_ trustworthy than an unresolved entry. This is the failure `task:0021` D1 is
written to avoid, and the reason a DOI-in-URL (D-3 above, an identity the publisher asserts) is
accepted while a title search is not.

### D4 — Where does an override live and what wins? — **decided: a separate committed file, above everything**

Not hand-edits to `sources.yaml`. The store is 1.2 MB of generated YAML; a hand-written entry in it
is invisible in review, indistinguishable from resolver output, and lost the first time someone
runs `--redo`. A separate file makes human judgement reviewable as a diff and lets the store stay
disposable.

Precedence is override → resolver → anchor, applied at read time, so an override never has to be
re-applied and never decays.

## Done when

- **AC-1:** The resolver contract distinguishes _declined_ from _unreachable_; an unreachable
  outcome leaves `resolvedBy` untouched so the entry is retried, and a test proves a transient
  failure does not become a permanent verdict.
- **AC-2:** `Accept` and `Accept-Language` are sent on every outbound resolver request, and the
  User-Agent still self-identifies per D1.
- **AC-3:** The Crossref resolver claims any URL whose path carries a DOI, and resolves the 12
  corpus entries that do.
- **AC-4:** A ForumMagnum resolver resolves LessWrong, EA Forum and Alignment Forum posts —
  including shortform and comment permalinks — from the public GraphQL API.
- **AC-5:** `data/citations/overrides.yaml` exists, is documented as reviewed input, takes
  precedence over every resolver, and survives `--redo`. `atlas citations propose` emits stubs
  carrying gathered evidence.
- **AC-6:** `atlas citations report` lists dead links (HTTP 404/410) as their own section, separate
  from unresolved entries.
- **AC-7:** Every store entry carries a `container-title` or a recorded reason it cannot, and
  **zero entries remain `resolvedBy: anchor`.**

## Completion evidence

_To be filled on completion. Each row must cite a criterion and durable evidence — a commit, a file
path, or a test name — not a narrative claim._

| Criterion | Evidence | Verified |
| --------- | -------- | -------- |
| AC-1      | —        | —        |
| AC-2      | —        | —        |
| AC-3      | —        | —        |
| AC-4      | —        | —        |
| AC-5      | —        | —        |
| AC-6      | —        | —        |
| AC-7      | —        | —        |

## Authority and inputs

- Owner instruction, 2026-09-23: complete the citation engine, metadata first.
- `docs/audits/0011` F12 — declined versus unreachable, the defect AC-1 closes.
- `docs/audits/0011` F14 — the 132-URL diagnostic probe this task is shaped around.
- `task:0021` D1 (identity), D4 (warn-never-block); `task:0027` AC-5 (polite identification).
- `task:0030` AC-7 — the control panel whose source facet depends on AC-7 here.

## Note on why the manual floor is the right answer

It would be possible to close all 132 automatically. Doing so would mean accepting a title-search
match, a largest-font guess, or a scraped bot-check page — each of which produces an entry that
_looks_ resolved and is wrong, in a published textbook's bibliography, with no signal to anyone
downstream that it should be doubted.

The cheaper failure is the honest one: the tool resolves what can be known, states plainly what it
cannot, and hands a human the evidence to finish. That is a few dozen entries of real work, once,
for a book that will carry these citations for years.
