---
schema_version: 2
id: '0035'
uid: 'task-20260924T131222228564Z-89fca846'
title: 'Upstream Google Doc citation corrections: wrong links and wrong anchor text'
role: task
status: todo
summary: 'Citation defects that live in the Google Docs source and cannot be fixed in this repository.'
created: '2026-09-24'
updated: '2026-09-24'
owner: Markov Grey
supersedes: ''
superseded_by: ''
engineering_document:
  version: 1
  contract_tier: full
  role: task
  id: '0035'
  uid: task-20260924T131222228564Z-89fca846
  title: 'Upstream Google Doc citation corrections: wrong links and wrong anchor text'
  state: todo
  authority:
    kind: work-state
    owner: Markov Grey
    scope: BOUNDED ACCEPTANCE AND COMPLETION AUTHORITY
  created: '2026-09-24'
  updated: '2026-09-24'
  transition_history: unverified
  transitions: []
  relationships: []
  details:
    criteria: [criterion:AC-1, criterion:AC-2, criterion:AC-3, criterion:AC-4, criterion:AC-5]
    depends_on: ['0032']
    size: s
    priority: p2
---

# Task 0035: Upstream Google Doc citation corrections: wrong links and wrong anchor text

## Problem

Some citation defects cannot be fixed in this repository at all. The pipeline treats a citation's
URL as its identity (`task:0021` D1), so `overrides.yaml` deliberately refuses to rewrite `id` or
`URL`: an override that could change them would let a typo silently detach an entry from the prose
citing it. The same holds for the in-text citation the reader sees, which is the authors' own anchor
text and is never re-rendered.

That is the right design, and it means a wrong link or wrong anchor can only be corrected **in the
Google Doc**. Until it is, the reader gets a 404, or a reference that disagrees with the citation
pointing at it, and nothing in the build can tell.

Twenty-four such defects were found while closing the metadata tail (`task:0032` AC-7). They fall
into four kinds. This record is the list, so they are fixed once at the source rather than
rediscovered by whoever next reads the bibliography.

**Standing preference, owner-stated 2026-09-24: cite arXiv, a DOI, or the publisher wherever the
work exists there.** This is not tidiness. Those addresses have an API behind them, so an entry
cited that way resolves automatically and stops needing a hand-written block in `overrides.yaml`
forever. Every mirror below cost a human a block; the arXiv address of the same paper would have
cost nothing. Eight of the entries in this record are that one mistake.

## Scope

Edits to the Google Docs chapter sources: link targets and citation anchor text. After the Doc
changes, a content refresh plus `atlas citations extract` and `atlas citations render`, and removal
of any `overrides.yaml` block that the fix makes unnecessary.

## Out of scope

Everything in the store. No entry here is a metadata gap: all eleven already carry correct metadata
recorded in `overrides.yaml`, which is why the site reads correctly today even where the link does
not work. `task:0031` owns the duplicate-alias half of the same problem.

## The corrections

### Broken links: the reader gets a 404 today

| Doc link                                            | Defect                                    | Correct target                       |
| --------------------------------------------------- | ----------------------------------------- | ------------------------------------ |
| `arxiv.org/abs/2307.15217'`                         | Trailing apostrophe in the URL            | `https://arxiv.org/abs/2307.15217`   |
| `onlinelibrary.wiley.com/doi/abs/10.1111/jofi.1249` | Truncated DOI; `jofi.1249` does not exist | `https://doi.org/10.1111/jofi.12498` |

Both resolve automatically once fixed: `crossref.doi_from_url` reads a DOI from anywhere in a URL
path, and the arXiv resolver keys on the bare identifier. Neither needs an override afterwards.

### Anchor text that disagrees with the document

| Cited as | Links to | Defect |
| --- | --- | --- |
| Shevlane et al., 2023 | `intelligence.org/.../AI-Governance-to-Avoid-Extinction.pdf` | The document is Barnett and Scher, May 2025. Either the link or the anchor is wrong; the store records the document actually linked |
| AI Impacts, 2022 | `aiimpacts.org/.../Thousands_of_AI_authors_on_the_future_of_AI.pdf` | The linked paper is Grace et al., published 2024 on arXiv and 2025 in JAIR. "AI Impacts, 2022" is a different survey |
| Hai et al, 2024 | `hai.stanford.edu/.../Response-NTIA-RFC-Open-Foundation-Models.pdf` | "HAI" is an acronym parsed as a surname. The work is a Stanford HAI comment letter |
| Cheng, 2024 | `researchgate.net/publication/387399002_...` | The author's family name is Chang; "Cheng-chi" is the given name |
| Feldstein, 2021 | `carnegie-production-assets.s3.amazonaws.com/.../WP-Feldstein-AISurveillance_final1.pdf` | The report is 2019 |
| Dafoe, 2022 | `academic.oup.com/edited-volume/41989/chapter-abstract/408516484` | The chapter is dated 2024 |

### A mirror cited instead of the work of record

| Doc link | Work of record |
| --- | --- |
| `researchgate.net/publication/367010605_...` | `https://doi.org/10.1080/25741292.2022.2162252` (Policy Design and Practice) |
| `researchgate.net/publication/382885035_...` | `https://arxiv.org/abs/2408.02565` |
| `researchgate.net/publication/385353725_...` | `https://arxiv.org/abs/2410.21572` |
| `researchgate.net/publication/387399002_...` | `https://doi.org/10.2139/ssrn.5069335` |
| `researchgate.net/publication/387730260_...` | `https://doi.org/10.1007/s42001-024-00346-8` (J. Computational Social Science) |
| `books.google.se/books/about/AI.html?id=V3XsEAAAQBAJ` | A publisher or DOI address for Yampolskiy 2024 |
| `aiimpacts.org/.../Thousands_of_AI_authors_on_the_future_of_AI.pdf` | `https://doi.org/10.1613/jair.1.19087` or `arXiv:2401.02843` |
| `arcprize.org/media/arc-prize-2024-technical-report.pdf` | `https://arxiv.org/abs/2412.04604` |
| `assets.ctfassets.net/.../o1_system_card.pdf` | `https://arxiv.org/abs/2412.16720` |

A ResearchGate mirror is not the published article, is frequently removed on publisher request, and
is what forces these entries through a hand-written override in the first place. The same argument
applies to a CDN path: `assets.ctfassets.net` is a Contentful asset URL that no resolver can read
and that OpenAI can rotate without notice.

### A page revised in place under a new address

| Doc link                                                                  | Current canonical address                                                          |
| ------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| `metr.github.io/autonomy-evals-guide`                                     | `https://metr.org/blog/2024-03-13-autonomy-evaluation-resources/`                  |
| `metr.org/blog/2025-03-26-common-elements-of-frontier-ai-safety-policies` | `https://metr.org/blog/2025-12-09-common-elements-of-frontier-ai-safety-policies/` |

The second matters for more than tidiness: the page now carries a December 2025 update, so the
citation and the content a reader finds are a different revision of the argument.

### A dead or worse address for a live document

| Doc link | Better address |
| --- | --- |
| `fhi.ox.ac.uk/wp-content/uploads/Deciphering_Chinas_AI-Dream.pdf` | `https://cdn.governance.ai/Deciphering_Chinas_AI-Dream.pdf` (FHI is closed; GovAI hosts it) |
| `carnegie-production-assets.s3.amazonaws.com/static/files/WP-Feldstein-AISurveillance_final1.pdf` | `https://carnegieendowment.org/research/2019/09/the-global-expansion-of-ai-surveillance` |
| `cartercenter.org/resources/pdfs/peace/china/finding-firmer-ground-...pdf` | `https://www.cartercenter.org/publication/finding-firmer-ground-the-role-of-high-technology-in-u-s-china-relations/` |
| `digitalcommons.law.villanova.edu/cgi/viewcontent.cgi?article=3670&context=vlr` | `https://digitalcommons.law.villanova.edu/vlr/vol69/iss5/4` |

## Done when

- AC-1: The two broken links resolve. `atlas citations report` shows both entries resolved with no
  override block, and neither appears in the dead-link section.
- AC-2: The three anchor-text defects are corrected in the Doc, so each in-text citation names the
  author and year of the document it links to.
- AC-3: The nine mirror links point at the work of record, and the corresponding `overrides.yaml`
  blocks are removed where the resolvers now answer without them.
- AC-4: Both METR links point at METR's canonical addresses.
- AC-5: The four documents cited at a dead or unreadable address are cited at a readable one.

## Completion evidence

None yet. Each criterion is evidenced by a content refresh plus `atlas citations extract` and
`atlas citations render`, with the `citation-report.md` diff showing the entry resolved without an
override.
