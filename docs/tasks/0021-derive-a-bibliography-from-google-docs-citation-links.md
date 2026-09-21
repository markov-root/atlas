---
schema_version: 2
id: '0021'
uid: 'task-20260921T210518128882Z-6703b7f9'
title: 'Derive a bibliography from Google Docs citation links'
role: task
status: todo
summary: 'Turn the 1792 hyperlinked citations already in the Google Docs into a maintained bibliography with no hand-authored list.'
created: '2026-09-21'
updated: '2026-09-21'
owner: Markov Grey
supersedes: ''
superseded_by: ''
engineering_document:
  version: 1
  contract_tier: full
  role: task
  id: '0021'
  uid: task-20260921T210518128882Z-6703b7f9
  title: 'Derive a bibliography from Google Docs citation links'
  state: todo
  authority:
    kind: work-state
    owner: Markov Grey
    scope: Citation extraction, metadata enrichment, and bibliography rendering
  created: '2026-09-21'
  updated: '2026-09-21'
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
      ]
    size: m
    priority: p2
---

# Task 0021: Derive a bibliography from Google Docs citation links

## Problem

The textbook cites heavily and has no bibliography. A reader cannot see what a chapter draws on, and
there is no way to answer "what does the Atlas cite?" — which for a textbook is a basic expectation,
not a nicety.

The obvious fix — hand-maintaining a reference list — is the wrong one. It would immediately drift
from the prose, and it would multiply by edition and by language.

**The data needed to avoid that is already present and already cached.** Measured across the eight
chapters in `.cache/docs/` on 2026-09-21:

| Measure                             | Count             |
| ----------------------------------- | ----------------- |
| Citation link instances             | **1,792**         |
| Unique URLs                         | **1,001**         |
| URLs cited more than once           | 336               |
| URLs cited in more than one chapter | 98                |
| Anchor texts in author-year form    | **1,735** (96.8%) |

Every one of these is already parsed into a `Link` node carrying `{href, content}`
(`src/textbook-loader/transformer.ts:554`). Extraction therefore needs **no change to the Google Docs
fetch path** and no new credentials.

Resolvability of the 1,001 unique URLs:

| Source                                                   | Unique | Automatic metadata       |
| -------------------------------------------------------- | -----: | ------------------------ |
| arXiv                                                    |    347 | arXiv API                |
| DOI-bearing (PubMed, Nature, IEEE, SSRN, …)              |     35 | Crossref                 |
| YouTube                                                  |     15 | oEmbed                   |
| Other web (Alignment Forum, LessWrong, Epoch, lab blogs) |    604 | Open Graph + anchor text |

Because 96.8% of anchor texts already carry author and year, a useful bibliography is achievable with
**zero network calls**. Enrichment upgrades quality; it is not a precondition.

No chapter currently contains a `Bibliography` or `References` heading, so nothing conflicts and
nothing needs migrating.

## Scope

Three layers, deliberately mirroring the `.cache/docs/` pattern this repo already proves —
credentialed maintainer refresh, committed cache, credential-free contributor build.

1. **Extract** — build time, pure, no network. Walk `Link` nodes, classify citation versus content
   link, normalize the URL to a canonical form, and emit citation instances keyed by
   `(edition, language, chapter, section)`. A pure function over the AST, unit-testable with no I/O.

2. **Enrich** — out of band, via `atlas bib sync`. Resolve unseen URLs against arXiv, Crossref and
   oEmbed; write the result to a committed store. Never runs in CI or a contributor build, exactly
   as audio and Docs fetching do not.

3. **Render** — build time. Join extraction against the store to produce per-section references, a
   per-chapter bibliography, and a site-wide index.

### Format

Use **CSL-JSON** as the data model, stored as **CSL-YAML** for hand-editing.

CSL (Citation Style Language) is the interchange format Zotero, Pandoc and Crossref already speak.
Adopting it rather than inventing a schema buys, at no cost: any citation style rendered from the
same data via `citeproc`; BibTeX export so readers can cite our sources in their own work; Zotero
round-trip so a contributor can repair entries in a GUI; and zero mapping code for the 382 entries
whose upstreams already emit CSL. A bespoke `{author, title, year, url}` schema looks simpler for
about a week, then needs `editor`, `container-title`, `accessed` and `version`, at which point it is
a worse CSL. YAML for the files (comments, readable diffs); CSL-JSON as the compiled artifact.

## Out of scope

- **Changing how authors write citations in Google Docs.** The feature must work against the docs as
  they are. The scan did surface source inconsistencies (`Burns et. al. 2023`, `Chen et al., 2024)`
  with a stray paren, missing-comma variants); the build should **report** these, not require them
  fixed first.
- **Rendering the textbook's own citation in other formats.** Different feature.
- **Replacing OWID iframes with self-hosted datasets.** Related in spirit — both are about owning
  our data — but a separate concern with its own decisions.
- **Automatic archival of cited URLs**, unless D3 is answered yes.

## Preconditions

- **`cli/` is not typechecked.** `@types/node` is not a declared dependency and `astro check` does
  not surface errors in `cli/`, so `pnpm exec tsc` on `cli/index.ts` reports 7 errors while
  `pnpm typecheck` passes. Since this task adds substantially more `cli/` code, that gap should close
  first or it will silently widen. Small, standalone, and a natural addition to `task:0020`.

## Decisions required before execution

### D1 — Is a bibliography entry global, or scoped to edition and language?

| Option                                                                       | Consequence                                                                                               |
| ---------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| **A.** Global entries, per-`(edition, language, chapter, section)` instances | A source is a source; the URL does not translate. One store, reused across all editions and translations. |
| **B.** Entries scoped per edition/language                                   | Allows a translated title per entry. Duplicates 1,001 entries per language and guarantees drift.          |

**Recommendation: A.** URLs do not translate; anchor text does. This splits cleanly along the same
seam as `task:0014`'s content identity key and reinforces it rather than competing with it. If a
translated title is wanted later, it is a per-locale overlay on a global entry, not a second store.

**Irreversible if wrong:** entry identity is what every citation instance points at. Changing the
key later rewrites every reference across every chapter and language.

### D2 — CSL, or a project-specific schema?

| Option               | Consequence                                                                                     |
| -------------------- | ----------------------------------------------------------------------------------------------- |
| **A.** CSL-JSON/YAML | Free style switching, BibTeX export, Zotero round-trip, no mapping for arXiv/Crossref. One dep. |
| **B.** Custom schema | Smaller today. Re-derives CSL badly over time; no export or interchange.                        |

**Recommendation: A**, per the reasoning in Scope.

### D3 — Archive cited URLs against link rot?

| Option                                     | Consequence                                                                               |
| ------------------------------------------ | ----------------------------------------------------------------------------------------- |
| **A.** No archival                         | Simplest. 1,001 open-web URLs decay; a textbook's citations rot fastest where it matters. |
| **B.** Record an existing Wayback snapshot | Cheap, read-only, no submission. Coverage is partial.                                     |
| **C.** Submit to Wayback on sync           | Best durability. Outward-facing writes to a third party on our behalf.                    |

**Recommendation: B**, with C as an explicit later opt-in. B costs almost nothing and materially
helps readers; C publishes on our behalf and should be a deliberate decision, not a side effect.

### D4 — What happens when a citation cannot be resolved?

| Option                                                      | Consequence                                                                     |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------- |
| **A.** Fail the build                                       | Guarantees quality; blocks a prose deploy on a third-party API being reachable. |
| **B.** Warn and degrade to anchor text                      | Always ships. Risks silently shipping thin entries.                             |
| **C.** Fail only if a _previously resolved_ entry regresses | Ratchet: new gaps degrade, known-good never silently worsens.                   |

**Recommendation: C.** This is the same question as `task:0017` D2 and should get a consistent
answer; note that `audit:0010` F2 found the existing R2 warn-and-continue posture already ships 404s,
which is the failure mode B invites.

### D5 — Where does it render?

| Option                          | Consequence                                                         |
| ------------------------------- | ------------------------------------------------------------------- |
| **A.** Per-section references   | Closest to the prose; most useful while reading.                    |
| **B.** Per-chapter bibliography | Matches textbook convention; one place per chapter.                 |
| **C.** Site-wide index          | Answers "what does the Atlas cite?"; a genuine research artifact.   |
| **D.** All three                | Most value; largest surface, and page weight matters (`task:0019`). |

**Recommendation: B then C**, with A deferred. B is the conventional expectation and the cheapest
win; C is the distinctive one. A adds per-page weight to the reader view, which `task:0019` is
actively trying to reduce.

## Done when

- **AC-1:** Extraction is a pure function over the AST with no I/O, unit-tested against fixtures
  covering author-year anchors, non-citation content links, and the malformed variants observed in
  the corpus.
- **AC-2:** A build with no credentials and no network produces a bibliography for all cached
  chapters, from the committed store alone.
- **AC-3:** URL canonicalization is tested, with `arxiv.org/abs/X` and `arxiv.org/pdf/X` proven to
  resolve to one entry. Deduplication counts are reported.
- **AC-4:** `atlas bib sync` resolves arXiv, DOI and oEmbed sources, writes CSL-YAML, and is the
  only path that touches the network. Running it is never required to build.
- **AC-5:** The build emits a report of citations it could not classify or resolve, usable as a
  to-fix list against the Google Docs.
- **AC-6:** D1–D5 are recorded with the owner's choice before implementation begins.

## Completion evidence

_To be filled on completion. Each row must cite a criterion and durable evidence — a commit, a file
path, or a recorded owner decision — not a narrative claim._

| Criterion | Evidence | Verified |
| --------- | -------- | -------- |
| AC-1      | —        | —        |
| AC-2      | —        | —        |
| AC-3      | —        | —        |
| AC-4      | —        | —        |
| AC-5      | —        | —        |
| AC-6      | —        | —        |

## Authority and inputs

- Corpus measurement, 2026-09-21, over the eight tabs in `.cache/docs/`. Counts in Problem are
  reproducible from those files; the anchor-shape classification used
  `(?:^|\s)[A-Z][^,]{0,60}(?:et al\.)?,?\s?\d{4}[a-z]?$` and is approximate at the margin.
- `src/textbook-loader/transformer.ts:554` — `Link` nodes already carry `{href, content}`.
- `src/textbook-loader/renderers/audio/text-renderer.ts:6` — `stripCitations` already encodes an
  author-year regex for the audio path; extraction should not invent a second, divergent one.
- `src/textbook-loader/gdocsdk.ts:41` — the cache pattern this design mirrors.
- `task:0014` — content identity key; D1 must stay consistent with it.
- `task:0015` — discriminated-union AST. Extraction is a good first consumer: small, read-only, and
  a low-risk proof of that design before larger content types depend on it.
- `task:0010` — the `atlas` control surface; `atlas bib sync` is its natural second command and fits
  the "expensive out-of-band maintainer operation" shape that task already defines.
- `task:0017`, `audit:0010` F2 — failure posture; D4 should match.
- `task:0019` — page weight; bounds D5.
