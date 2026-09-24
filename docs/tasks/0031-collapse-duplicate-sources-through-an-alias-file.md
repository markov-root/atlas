---
schema_version: 2
id: '0031'
uid: 'task-20260923T164947970652Z-51c1ef6d'
title: 'Collapse duplicate sources through an alias file'
role: task
status: done
summary: 'Let a reviewed alias file fold several URLs for one work onto a single bibliography entry.'
created: '2026-09-23'
updated: '2026-09-24'
owner: Markov Grey
supersedes: ''
superseded_by: ''
engineering_document:
  version: 1
  contract_tier: full
  role: task
  id: '0031'
  uid: task-20260923T164947970652Z-51c1ef6d
  title: 'Collapse duplicate sources through an alias file'
  state: done
  authority:
    kind: work-state
    owner: Markov Grey
    scope: Entry identity aliasing only - canonicalization itself is unchanged
  created: '2026-09-23'
  updated: '2026-09-24'
  transition_history: complete
  transitions:
    - from: todo
      to: in_progress
      at: '2026-09-24'
      reason: Duplicate groups identified and the five owner decisions recorded in handoff:0005.
    - from: in_progress
      to: done
      at: '2026-09-24'
      reason: Alias file written and applied end to end; the report ends at 0 probable duplicates.
  relationships: []
  details:
    criteria: [criterion:AC-1, criterion:AC-2, criterion:AC-3, criterion:AC-4]
    parent: '0021'
    depends_on: ['0029']
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
the other, and `task:0021` edge case 2 already anticipated this - "a manual alias file is the
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
canonicalization and before the store upsert, so every downstream consumer - report, export, urls,
render, the site - sees one entry with the union of the anchor texts.

## Out of scope

- **Automatic merging.** Detection is a heuristic over a title fingerprint; identity is not. A wrong
  merge silently loses a citation, which is the failure canonicalization is written to avoid. The
  file is reviewed input, and the report proposes rather than decides.
- **Changing canonicalization.** The rules in `canonical-url.ts` stay as they are.

## Decisions required before execution

### D1 - What happens to an aliased entry already in the store? **Decided: delete.**

Options: delete it on the next extract; keep it and mark it superseded; or leave the store alone and
alias only at read time. Deleting is simplest and matches "one work, one entry", but the store is
committed and a deletion is invisible in a 900-entry YAML diff. **Recommend deleting, with the
extract command naming each removal on stdout** - the same posture `task:0021` D4 takes elsewhere.

**Taken as recommended, 2026-09-24.** The survivor's new `sameAs` line is the half of the diff a
reviewer can see; the printed list is the other half. Extract named all 33 removals on the run that
produced them.

### D2 - Does the surviving entry keep both sets of metadata? **Decided: no, with one exception.**

Two resolutions may disagree - the arXiv record and the publisher's page for the o1 System Card have
different types and containers. **Recommend keeping the surviving entry's own metadata and recording
the alias URLs in a `sameAs` field**, so nothing is invented by merging and the alternative address
is still available to a reader.

**Taken as recommended, 2026-09-24, with an exception found while building it.** Applied literally,
D2 loses citations. If the prose cites only the mirror, `read_scan` rewrites that citation onto the
surviving address and extraction mints a _fresh anchor-only entry_ for it - so "keep the survivor's
own metadata" would keep the placeholder "Bostrom, 2014" and delete the record that knew the title.
So: an **unresolved** survivor adopts a resolved alias's description, rewriting `id` and `URL` to its
own (`task:0021` D1). A resolved survivor is never overwritten. Covered by
`TestAnUnresolvedSurvivor` in `python/tests/test_aliases.py`.

### D3 - Where does an alias apply? **Decided: at the scan boundary, and only there.**

Raised by `handoff:0005` as the unresolved implementation question: citation _instances_ also carry
the aliased URL, so aliasing only at the store upsert would leave the site's per-section lists
looking up a key that no longer exists and rendering a bare URL beside the real reference.

Two places name the entry an instance belongs to, and each gets exactly one integration point:

| Half       | Where                                     | Effect                                             |
| ---------- | ----------------------------------------- | -------------------------------------------------- |
| Python     | `scan.apply_aliases`, in `read_scan`      | extract, report, urls and propose all see one work |
| TypeScript | `bibliography.resolveKey`, in `citedKeys` | section, chapter and `/bibliography` all agree     |

**The TypeScript side reads the store, not the YAML.** `aliasMap()` inverts the `sameAs` fields
`extract` compiled into `sources.yaml`. A second reader of `aliases.yaml` would be a second place for
the two halves to disagree about identity, which is the failure `task:0021` D1 exists to prevent -
and it makes `aliases.yaml` to `sources.yaml` exactly the relationship `overrides.yaml` already has.

The browser needs the same map for `task:0036`'s back-links, and gets it as `data-aliases` on each
rendered entry rather than as a third copy of the file.

### D4 - How does a rejected group stop being reported? **Decided: a `not-duplicates` section.**

AC-4 asks the report to stop listing a group once it is handled, and "handled" has two outcomes, not
one. Four LessWrong comments on a single shortform thread are four different comments; two OpenReview
papers share a scraped "Verifying your browser" title that is not a title at all. Neither is a merge,
and a heuristic this cheap will keep flagging them.

So `aliases.yaml` carries a second section of groups a human has checked and rejected. Matched by
**subset**, not equality: "these four are four different comments" stays true of any pair among them,
whereas an equality test would stop suppressing the moment one entry gained an author and the
detector split the group.

## Done when

- **AC-1:** `data/citations/aliases.yaml` exists, is committed, and is documented as reviewed input
  rather than generated output.
- **AC-2:** `atlas citations extract` folds aliased URLs onto the surviving key, the store holds one
  entry per group, and the union of anchor texts is preserved.
- **AC-3:** A citation in the prose pointing at an aliased URL still resolves to the surviving entry
  on every surface - section, chapter, `/bibliography`, BibTeX, CSL-JSON.
- **AC-4:** The report stops listing a group once it is aliased, so the list is a worklist rather
  than a standing complaint.

## Completion evidence

Completed 2026-09-24. **945 sources became 912**: 33 addresses folded onto 29 surviving entries.

| Criterion | Evidence                                                                                                                                                                                                                                               | Verified |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------- |
| AC-1      | `data/citations/aliases.yaml`, committed, header states it is hand-written and never generated. 23 alias groups and 9 rejected groups, each carrying the reason it was decided that way.                                                               | yes      |
| AC-2      | `atlas citations extract` named all 33 removals; store went 945 → 912 with 908 resolved (the same 4 unresolved as before, so nothing regressed to an anchor). A second run wrote **byte-identical** output. `python/tests/test_aliases.py`, 31 tests.  | yes      |
| AC-3      | Section page `strategies/agi-safety-strategies` cites both the LessWrong and the sequence copy of one post: **one entry, two back-links**, 0 broken, 0 entries rendering a bare URL. `/bibliography` shows 912 entries, 29 carrying 33 `data-aliases`. | yes      |
| AC-4      | `atlas citations report` now ends **`0 probable duplicates`**, down from 17.                                                                                                                                                                           | yes      |

### The wider pass

The shipped detector keys on first author **and** year, and a preprint routinely disagrees with its
publisher page on both - `handoff:0005` recorded that the 17 reported groups were about half the real
count. A fingerprint-only pass over the store found **24 more candidates**, each checked by hand
against the two pages:

| Outcome                    | Count | Examples                                                              |
| -------------------------- | ----: | --------------------------------------------------------------------- |
| Aliased                    |    14 | GovAI landing pages beside their arXiv preprints; four DeepMind paths |
| Rejected as distinct works |    10 | See the `not-duplicates` section                                      |

The rules the file applies, in the order they decide, are written into its header so the next person
adding a group does not re-derive them: an Alignment Forum cross-post wins (owner, 2026-09-24); a
preprint beats a publisher landing page or a CDN copy; a landing page beats a bare asset path; the
live path wins where one site serves two. **A lab's announcement post about a paper is not a copy of
that paper**, and is never aliased onto it - three such pairs are recorded as rejected rather than
folded, because the prose cites them for different things.

### Two entries fixed rather than aliased

`handoff:0005` recorded "fix the two OpenReview junk titles" as a decision never carried out. Both
entries had scraped OpenReview's bot-check page, so both were titled "Verifying your browser |
OpenReview". The ids in the URLs identify them: `oycEeFXX74` is _Shell Games: Control Protocols for
Adversarial AI Agents_ and `BZ5a1r-kVsf` is LeCun's _A Path Towards Autonomous Machine Intelligence_.
Both are now in `overrides.yaml`. Shell Games keeps `literal: Bhatt et al.` as its author, because a
full list could only be copied from a successor paper and `task:0032` D6 does not let a search
confirm what an identifier has not.

_Superintelligence_ also got an override: the surviving PsycNET record is a catalogue page, so a
scrape typed it `webpage`, and every CSL style renders a book differently.

### Two findings recorded, not fixed

Both are outside this task and neither blocks it:

- **`--redo` of a wayback entry rewrites `accessed` and nothing else.** A 17-entry redo run produced
  five "resolved" entries whose only change was today's date, dirtying the store for no information.
  The run was reverted.
- **`forum-magnum` does not win the three EA Forum URLs it claims.** `RESOLVER_ORDER` puts it well
  ahead of `wayback`, so it is returning `None` and the archive is answering in its place. The
  visible cost is a scraped title carrying the site name as a suffix, on an entry aliasing just
  promoted to survivor.

## Authority and inputs

- Owner report, 2026-09-23, from reading the rendered bibliography.
- `task:0021` D1 (identity is the canonical URL) and edge case 2 (an alias file is the intended
  answer).
- `python/atlas_citations/commands/report.py`, `duplicate_groups` - the detection, with the measured
  reason domain is not a usable signal.
- `data/citations/citation-report.md` - the current list of 7 groups.

## Note on the limit of detection

Groups are only found among **resolved** entries, because an unresolved entry's title is its anchor
text and every unresolved work by one author in one year would fingerprint identically. Some real
duplicates are therefore still invisible - the `keepthefuturehuman` pair among them, since one side
is unresolved. The list grows as resolution does, which is an argument for re-running the report
after each resolve rather than treating it as a one-off.
