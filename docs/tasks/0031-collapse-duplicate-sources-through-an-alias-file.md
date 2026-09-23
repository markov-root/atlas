---
schema_version: 2
id: "0031"
uid: "task-20260923T164947970652Z-51c1ef6d"
title: "Collapse duplicate sources through an alias file"
role: task
status: todo
summary: "Let a reviewed alias file fold several URLs for one work onto a single bibliography entry."
created: "2026-09-23"
updated: "2026-09-23"
owner: Markov Grey
supersedes: ""
superseded_by: ""
engineering_document:
  version: 1
  contract_tier: full
  role: task
  id: "0031"
  uid: task-20260923T164947970652Z-51c1ef6d
  title: "Collapse duplicate sources through an alias file"
  state: todo
  authority:
    kind: work-state
    owner: Markov Grey
    scope: Entry identity aliasing only — canonicalization itself is unchanged
  created: "2026-09-23"
  updated: "2026-09-23"
  transition_history: unverified
  transitions: []
  relationships: []
  details:
    criteria: [criterion:AC-1, criterion:AC-2, criterion:AC-3, criterion:AC-4]
    parent: "0021"
    depends_on: ["0029"]
    size: s
    priority: p2
---


# Task 0031: Collapse duplicate sources through an alias file

## Problem

The same work appears in the bibliography under several addresses:

| Work                    | URLs                                                            |
| ----------------------- | --------------------------------------------------------------- |
| Keep The Future Human   | `keepthefuturehuman.ai/…pdf` and `keepthefuturehuman.com/essay` |
| Specification gaming    | `deepmind.com/blog/…` and `deepmind.google/discover/blog/…`     |
| The case for ensuring … | `alignmentforum.org/…` and `lesswrong.com/…`                    |
| OpenAI o1 System Card   | `arxiv.org/abs/2412.16720` and `openai.com/index/…`             |
| Superintelligence       | Google Books and Goodreads                                      |

`task:0021` D1 makes the canonical URL the entry's identity, and canonicalization is deliberately
conservative: it merges two URLs only when they are the same document _by construction_ (an arXiv
`/abs` and `/pdf`, a DOI resolver prefix). None of the pairs above is mechanically derivable from
the other, and `task:0021` edge case 2 already anticipated this — "a manual alias file is the
intended answer".

**Detection now exists** (`atlas citations report`, shipped 2026-09-23): the report lists 7 groups
matched on first author, year and a title fingerprint. What is missing is the ability to act on it.

## Scope

A reviewed file mapping duplicate URLs onto the one to keep, applied at extraction so citation
instances land on a single entry.

```yaml
# data/citations/aliases.yaml
https://deepmind.google/discover/blog/specification-gaming-the-flip-side-of-ai-ingenuity:
  - https://deepmind.com/blog/specification-gaming-the-flip-side-of-ai-ingenuity
```

The key is the surviving entry; the list is what folds into it. Applied in `extract`, after
canonicalization and before the store upsert, so every downstream consumer — report, export, urls,
render, the site — sees one entry with the union of the anchor texts.

## Out of scope

- **Automatic merging.** Detection is a heuristic over a title fingerprint; identity is not. A wrong
  merge silently loses a citation, which is the failure canonicalization is written to avoid. The
  file is reviewed input, and the report proposes rather than decides.
- **Changing canonicalization.** The rules in `canonical-url.ts` stay as they are.

## Decisions required before execution

### D1 — What happens to an aliased entry already in the store?

Options: delete it on the next extract; keep it and mark it superseded; or leave the store alone and
alias only at read time. Deleting is simplest and matches "one work, one entry", but the store is
committed and a deletion is invisible in a 900-entry YAML diff. **Recommend deleting, with the
extract command naming each removal on stdout** — the same posture `task:0021` D4 takes elsewhere.

### D2 — Does the surviving entry keep both sets of metadata?

Two resolutions may disagree — the arXiv record and the publisher's page for the o1 System Card have
different types and containers. **Recommend keeping the surviving entry's own metadata and recording
the alias URLs in a `sameAs` field**, so nothing is invented by merging and the alternative address
is still available to a reader.

## Done when

- **AC-1:** `data/citations/aliases.yaml` exists, is committed, and is documented as reviewed input
  rather than generated output.
- **AC-2:** `atlas citations extract` folds aliased URLs onto the surviving key, the store holds one
  entry per group, and the union of anchor texts is preserved.
- **AC-3:** A citation in the prose pointing at an aliased URL still resolves to the surviving entry
  on every surface — section, chapter, `/bibliography`, BibTeX, CSL-JSON.
- **AC-4:** The report stops listing a group once it is aliased, so the list is a worklist rather
  than a standing complaint.

## Completion evidence

_To be filled on completion._

| Criterion | Evidence | Verified |
| --------- | -------- | -------- |
| AC-1      | —        | —        |
| AC-2      | —        | —        |
| AC-3      | —        | —        |
| AC-4      | —        | —        |

## Authority and inputs

- Owner report, 2026-09-23, from reading the rendered bibliography.
- `task:0021` D1 (identity is the canonical URL) and edge case 2 (an alias file is the intended
  answer).
- `python/atlas_citations/commands/report.py`, `duplicate_groups` — the detection, with the measured
  reason domain is not a usable signal.
- `data/citations/citation-report.md` — the current list of 7 groups.

## Note on the limit of detection

Groups are only found among **resolved** entries, because an unresolved entry's title is its anchor
text and every unresolved work by one author in one year would fingerprint identically. Some real
duplicates are therefore still invisible — the `keepthefuturehuman` pair among them, since one side
is unresolved. The list grows as resolution does, which is an argument for re-running the report
after each resolve rather than treating it as a one-off.
