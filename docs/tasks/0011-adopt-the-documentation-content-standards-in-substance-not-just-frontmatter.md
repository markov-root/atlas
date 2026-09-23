---
schema_version: 2
id: "0011"
uid: "task-20260921T153341176939Z-834bf15c"
title: "Adopt the documentation content standards in substance not just frontmatter"
role: task
status: in_progress
summary: 'Make the four living documents satisfy their role content standards in body, not only carry role frontmatter.'
created: "2026-09-21"
updated: "2026-09-21"
owner: Markov Grey
supersedes: ""
superseded_by: ""
engineering_document:
  version: 1
  contract_tier: full
  role: task
  id: "0011"
  uid: task-20260921T153341176939Z-834bf15c
  title: "Adopt the documentation content standards in substance not just frontmatter"
  state: in_progress
  authority:
    kind: work-state
    owner: Markov Grey
    scope: Documentation only; no src/ changes
  created: "2026-09-21"
  updated: "2026-09-21"
  transition_history: complete
  transitions:
    - from: todo
      to: in_progress
      at: '2026-09-21'
      reason: Four parallel agents restructured the living documents to their role content standards.
  relationships: []
  details:
    criteria: [criterion:AC-1, criterion:AC-2, criterion:AC-3, criterion:AC-4, criterion:AC-5, criterion:AC-6]
    size: m
    priority: p1
---

# Task 0011: Adopt the documentation content standards in substance not just frontmatter

## Problem

The 2026-09-21 governance adoption added role frontmatter to `ARCHITECTURE.md`, `PRINCIPLES.md`,
`DESIGN.md`, and `ROADMAP.md`, and reported the adoption complete because
`engineering document validate` went to one finding. That was goodharting. The owner's words:

> _"Being compliant doesn't mean passing a test by injecting front matter... it has to actually adopt
> all the best practices in intention and spirit across the board. That's the entire point of best
> practices."_

The documents declare roles whose content standards they do not meet. `ARCHITECTURE.md` declares
`specification` but states no failure semantics, no boundary cases, no precedence rules, and no
divergence owners. `PRINCIPLES.md` declares `standard` but names no issuer, no applicability warrant,
and no waiver classification - so a contested case cannot be adjudicated from the text.
`ROADMAP.md` declares `roadmap` but has no dated commitment bands, no break triggers, and no links
from committed items to owning tasks or ADRs.

Compounding this, `adr:0002` deliberately keeps these four documents **outside** the validator, so
nothing will ever report the gap. Substance is the only control available.

Three known factual defects also survive in them, found by the audit sweep:

- `docs/ARCHITECTURE.md:56-85` repo layout omits `src/content/` (105 files), `src/data/`,
  `src/config/`, `src/fonts/`, and shows a `components/navigation/` that does not exist (`audit:0002` F1).
- Four `file:line` citations in `PRINCIPLES.md` resolve to blank lines or moved code (`audit:0002` F7).
- `ROADMAP.md` claims the language switcher is "already implemented dormant"; the only selector
  component has no language dimension at all (`audit:0007` F1). Separately, "Not planned" rejects
  quizzes, which the owner now wants as a content type.

## Scope

Bring each document up to its declared role's content standard, judged by that role's discriminating
test (`knowledge/documentation-living-content-standards.md`):

| Document               | Role            | Discriminating test it must pass                                                               |
| ---------------------- | --------------- | ---------------------------------------------------------------------------------------------- |
| `docs/ARCHITECTURE.md` | `specification` | Can two reviewers classify the same boundary case alike, tracing each rule to a need?          |
| `docs/PRINCIPLES.md`   | `standard`      | In a contested case, can a reviewer decide conformance and whether an exception is authorized? |
| `docs/DESIGN.md`       | `standard`      | Same, for visual/component practice.                                                           |
| `docs/ROADMAP.md`      | `roadmap`       | When reality diverges, can a reader tell what changed and which evidence triggered it?         |

Plus: extract the operational knowledge currently trapped in `scripts/` header comments and
`audit:0009` into a governed `runbook` record, since `task:0010` will delete those files.

Fix the three factual defects above as part of the same work.

## Out of scope

- **Any `src/` change.** Documentation only.
- **Rewriting content that is already correct.** This is restructure-and-fill, not replace. Every
  substantive fact currently in these documents must survive unless it is demonstrably wrong.
- **Re-litigating `adr:0002`.** The four documents keep their filenames and stay outside
  `docs.currency.roles`.
- **Governing `README.md` / `CONTRIBUTING.md` / `AGENTS.md`.** Deferred; they serve different
  audiences and adopting roles for them is a separate decision.
- **Acting on audit recommendations** beyond the three documentation defects named above.

## Done when

- **AC-1:** `ARCHITECTURE.md` states failure semantics, boundary cases, precedence between
  conflicting rules, and who owns divergence - and its repo-layout block matches the actual tree.
- **AC-2:** `PRINCIPLES.md` names its issuer and adoption basis, the population and scope it binds,
  how an exception is authorized and recorded, and how the standard itself changes. Its four stale
  citations are repaired, preferring symbol anchors over line numbers.
- **AC-3:** `DESIGN.md` meets the same standard bar for visual and component practice, including
  which rules are binding versus advisory.
- **AC-4:** `ROADMAP.md` carries dated commitment bands, per-phase reasons and dependencies, stated
  assumptions with break triggers, and links from committed items to owning task or ADR records. The
  false language-switcher claim and the quizzes contradiction are resolved.
- **AC-5:** A governed `runbook` record exists covering the audio and R2 operational procedures,
  with entry conditions, reversibility, a branch at the risky step, and outcome evidence.
- **AC-6:** No fact is asserted in any of these documents that is not either verifiable against code
  at a cited anchor or explicitly marked as intent rather than current behaviour.

## Completion evidence

| Criterion | Evidence | Verified |
| --------- | -------- | -------- |
| AC-1      | `docs/ARCHITECTURE.md` - new `## Failure semantics by stage` (per-stage table: on-failure, exit code, live-site effect), `## Mode boundaries`, `## Configuration precedence`, `## Edition and language scope`. Repo-layout block corrected: `components/navigation/` removed, `src/content/`, `src/data/`, `src/config/`, `src/fonts/` added. | yes - sections present and evidence-anchored; `navigation/` absent from file |
| AC-2      | `docs/PRINCIPLES.md` - new `## How this standard works` (issuer, adoption, governed population, exception authorization, change governance). Every principle now tagged `(binding)` or `(advisory)`, with carve-outs named. Stale citations `loader.ts:59`, `loader.ts:66`, and the `content.config.ts` bridge range repaired. | yes - 37 binding/advisory markers, 18 waiver/exception references, zero stale citations remain |
| AC-3      | `docs/DESIGN.md` - new `## Scope`, `## Rules`, `## Conformance and exceptions`, `## Reference`; binding vs advisory distinguished. | yes - sections present |
| AC-4      | `docs/ROADMAP.md` - `## How to read this roadmap`, dated commitment band (`Now - committed focus (calibrated 2026-09-21)`), 17 break triggers, 61 links to `task:`/`adr:`/`audit:` records, `## Reconciliation with task, ADR, and audit state`. False "language switcher already implemented dormant" claim removed; quizzes/flashcards separated from the certification-program rejection. | yes - counts verified by grep; false claim absent |
| AC-5      | `docs/runbooks/regenerate-chapter-audio.md` (270 lines) - `When to use`, `Why this is risky - the two couplings`, `Mutations and reversibility` (per-step reversibility table), `Procedure`, `Outcome evidence`, `Not known - read before you improvise`. | yes - branch at risky step present; unknowns stated rather than papered over |
| AC-6      | Spot-review of the failure-semantics table, reversibility table, and unknowns section found claims anchored to symbols (`fetchDoc`, `downloadImages`, `synthesizeParagraphs`) or to audit findings, with cost figures explicitly marked factor-of-2 estimates. | partial - reviewed by sampling, not line by line; see Limitations |

### Limitations of this verification

The review was structural plus sampled-substance: every required section was confirmed present and four
of them read in full, but not every paragraph of 681 added lines was checked against code. `AC-6` is
therefore evidenced by sampling. A reviewer wanting full assurance should re-verify the citations in
`ARCHITECTURE.md`'s failure table independently.

## Authority and inputs

- `knowledge/documentation-living-content-standards.md` - the four role standards and their
  discriminating tests.
- `adr:0002` - why these documents sit outside the validator, and hence why substance is the only control.
- `audit:0002` F1/F7, `audit:0007` F1 - the three factual defects to repair.
- `audit:0009` - source material for the audio runbook.
