---
standard:
  version: 1
  id: documentation
  summary: The content bar every governed document in this repo must meet — required sections, discriminating tests, and what automation does and does not check.
  status: current
  owner: Markov Grey
  updated: '2026-09-21'
---

# Documentation standard

The bar a document in this repo must meet in its **body**, not just its shape. A document can carry
perfect frontmatter, sit in the right folder, and still be inert — well-formed structure wrapped
around content that does not help anyone act, verify, or decide. This standard exists so that
anyone who clones this repo — with or without the `software-engineering` skill installed — can open
a document, find its role below, and judge whether it conforms.

Use it like this: find the document in [the roles table](#the-roles-this-repo-uses), read that
role's required sections and discriminating test, then open the document and apply the test. The
discriminating test is the load-bearing part of each role — it is the one question that separates a
document that helps a reader from one that merely looks complete.

## Issuer, adoption, and who this binds

**Issuer and maintaining authority:** the project owner (Markov Grey). The standard derives from
the `software-engineering` skill's documentation content standards, adopted into this repo by
`engineering.yaml` (full adoption, 2026-08-17) and made substantive by the living-document
restructure of 2026-09-21 (`task:0011`) under the governance model of `adr:0002` and
[`docs/PRINCIPLES.md`](../PRINCIPLES.md) §["How this standard works"](../PRINCIPLES.md#how-this-standard-works).
This file follows that same model rather than inventing a second one.

**Population:** the maintainer and every contributor — human or agent — who creates, edits, or
reviews any document listed in the roles table below. Agents are bound explicitly, with no lighter
obligation for automated contributors. Readers outside the project are not bound by it, but the
standard is written so a first-time contributor can apply it unaided.

**Scope:** the governed documents under `docs/` named in the roles table. Not governed here:
`README.md`, `CONTRIBUTING.md`, `AGENTS.md`, `docs/TODO.md` (gitignored scratch), and content
outside `docs/` — they serve different audiences and adopting roles for them is a separate
decision (`task:0011` §Out of scope).

**Exceptions** are granted only by the project owner, in advance, and recorded in the same change
that needs them — inline next to the affected requirement or as an ADR in `docs/adr/` for
consequential ones. An undocumented exception is a violation, not precedent.

**Changing this standard** happens through a normal PR decided by the project owner. A requirement
earns its place the way the rest of this repo's standards do: by pointing at a real file it governs
and a real failure it prevents. If a requirement is ambiguous for a recurring class of case, the
ambiguity is a defect here — fix the text; do not decide by hidden intent.

## The roles this repo uses

Two governance mechanisms run in parallel, on deliberately different terms (`adr:0002`):

| Document | Role | Checked by |
| --- | --- | --- |
| `docs/ARCHITECTURE.md` | specification | `atlas docs check` |
| `docs/PRINCIPLES.md` | standard | `atlas docs check` |
| `docs/DESIGN.md` | standard | `atlas docs check` |
| `docs/ROADMAP.md` | roadmap | `atlas docs check` |
| `docs/runbooks/*.md` | runbook | `atlas docs check` |
| `docs/standards/*.md` | standard | `atlas docs check` |
| `docs/tasks/*.md` | task | `engineering document validate` |
| `docs/adr/*.md` | adr | `engineering document validate` |
| `docs/audits/*.md` | audit | `engineering document validate` |
| `docs/handoffs/*.md` | handoff | `engineering document validate` |
| `docs/lessons/*.md` | lesson | `engineering document validate` (structure only; gitignored, not shipped) |

Living documents sit at stable, un-numbered paths and carry role frontmatter; record series are
append-only, numbered, and declared in `engineering.yaml`. The reasons are in
[`adr:0002`](../adr/0002-govern-living-documents-by-frontmatter-at-stable-paths-not-as-numbered-record-se.md)
and [the automation section below](#what-automation-can-and-cannot-check). The skill defines two
further record roles — `research` and `plan` — that this repo has not adopted; if the first such
record is created, the role is declared in `engineering.yaml` in the same change, and it inherits
the corresponding standard from the source skill.

## Living documents

These four roles describe what **currently** holds. Their shared failure mode is a well-formed body
that is inert: headings present, nothing decidable. Every required section below must contain real
content — a heading with filler does not pass.

### Specification — `docs/ARCHITECTURE.md`

**What the role owes the reader:** normative current behavior — how the build pipeline, BuildMode,
and the Astro layer fit together — stated precisely enough that two independent reviewers reach the
same verdict on how the system behaves in a given case.

Required sections, and what each must actually contain:

- **High-level flow and repo layout** — the pipeline end to end and the actual directory tree.
  The layout must match the real tree; `audit:0002` F1 caught a layout listing directories that do
  not exist and omitting `src/content/` (105 files). This is the section where that defect class
  lives.
- **BuildMode and configuration precedence** — the single decision point (`build-mode.ts`), every
  flag it resolves, and which source of configuration wins when two disagree. Not a tour of env
  vars: the precedence order itself.
- **Failure semantics by stage** — per pipeline stage: what fails, how loudly, with what exit
  code, and what the deployed site shows. "It throws" is not failure semantics; name the input in
  the error and what the reader should do.
- **Mode boundaries** — what each build mode may and may not do, stated as cases a reviewer can
  classify. The test material: a contributor build with no credentials, a maintainer build with
  all of them, and cache-only fallbacks in between.
- **Scope of editions and languages** — what the system currently covers and what is explicitly
  out of frame, so a reader does not assume more generality than exists.
- **Test layers** — which layer of the suite protects which class of regression, matching
  `PRINCIPLES.md` §7.
- **Design principles encoded** — pointers into `PRINCIPLES.md`, not a duplicate list. When the
  two documents would state the same rule, one points at the other; divergence between them is a
  defect in whichever is stale.

**Discriminating test:** can two independent reviewers classify the same boundary case alike —
e.g. "what happens to the audio player when `SKIP_AUDIO_DOWNLOAD` is set but R2 is reachable" —
and trace every material rule to a named need, without reading the code or asking the author?

### Standard — `docs/PRINCIPLES.md`, `docs/DESIGN.md`, `docs/standards/*.md`

**What the role owes the reader:** adjudicable rules — required practice for a stated population,
where a reviewer can decide a contested case from the text plus the cited evidence.

Required sections:

- **Scope** — who the rules bind (maintainer, contributors, agents) and what they cover
  (`src/` and build config for `PRINCIPLES.md`; visual practice for `DESIGN.md`). An unstated
  scope means the burden of the rules falls on parties who never agreed to it — that is the
  standard role's characteristic failure.
- **Rules** — each rule marked **binding** (settles a contested case: a reviewer can determine
  conformance from the text plus cited code) or **advisory** (informs judgment; needs the stated
  calibration plus the facts). Every binding rule carries a code anchor, using **symbol anchors**
  (`fetchDoc`, `formatSummary`) rather than `file:line`, which rot on the next edit —
  `audit:0002` F7 found four line citations that had drifted off their code while every symbol
  anchor in the same document survived. An advisory rule that pretends to be binding just moves
  the argument somewhere less visible; the honest marking matters.
- **Conformance and exceptions** — how a reviewer decides a contested case (the procedure), and
  the two kinds of authorized deviation: inline documented exceptions next to the rule they
  modify, and owner-granted waivers for a specific change. Record placement follows the
  `PRINCIPLES.md` model: consequential exceptions get an ADR; small ones live inline.
- **Governance** — who issued and maintains the document, the adoption basis, and how the
  standard itself changes. `PRINCIPLES.md` §"How this standard works" is the canonical shape;
  the other standards mirror it.
- **Reference** (where applicable) — the concrete vocabulary: components, tokens, patterns in
  actual use. Not aspirational inventory; a reader building a page should find here what exists,
  not what might someday.

**Discriminating test:** in a contested case, can a reviewer establish that the rule applies,
decide conformance, and determine whether an exception is authorized — from this text plus the
cited evidence, without hidden intent?

### Roadmap — `docs/ROADMAP.md`

**What the role owes the reader:** sequenced intent with calibrated commitment — what is committed
now, planned next, deferred, and rejected, with the evidence and dependencies behind each call.

Required sections:

- **How to read this roadmap** — what the bands mean and how strong a commitment each is. Without
  this, "Now" reads as a promise and "Later" reads as a plan, and neither is.
- **Dated commitment bands** — Now / Next / Later, each calibrated to a date. Every committed item
  states its reason, its code area, and its dependencies. An item with no date and no owning record
  is a wish, and a wish list is the roadmap role's characteristic failure.
- **Assumptions and break triggers** — per item or band: what the plan assumes, and the observable
  that would change the priority if it proves false. A break trigger must be an actual observable
  ("any chapter re-render before the voice decision"), not a hedge ("if priorities change").
- **Not planned** — explicit non-goals with the reason for rejection, so a rejected direction
  stays rejected until someone deliberately reopens it rather than rediscovering it.
- **Reconciliation with record state** — where the roadmap's claims are checked against
  `docs/tasks/`, `docs/adr/`, and `docs/audits/`, with discrepancies named rather than smoothed
  over.

**Discriminating test:** when reality diverges, can a reader tell which priority or commitment
changed and which evidence or dependency triggered the change — without reconstructing the history
from git log?

### Runbook — `docs/runbooks/*.md`

**What the role owes the operator:** a safe, closed-loop procedure for a recognizable operational
condition — usable under stress, honest about what is not known.

Required sections:

- **When to use** — entry conditions specific enough that an operator recognizes the situation
  from observation, not inference, and knows what authority (approvals, credentials) the procedure
  assumes.
- **Why this is risky** — the couplings that make the operation dangerous, stated before the
  steps, so the operator knows where to slow down before reaching the step.
- **Mutations and reversibility** — every step that changes persistent state, with its effect and
  whether and how it is reversible. An irreversible step that is not marked as such is the
  runbook role's worst defect.
- **Procedure** — the steps, with a **branch at the risky step**: what to check and what to do if
  the result is not what the clean path assumes. A procedure that only describes the clean path
  leaves the operator improvising exactly when improvisation is most dangerous.
- **Outcome evidence** — how the operator independently verifies the outcome worked, not just that
  the commands exited zero.
- **Not known** — what the procedure's author could not verify, stated so the operator does not
  paper over it. This section is the honesty valve; omitting it claims a certainty the document
  does not have.

**Discriminating test:** when the highest-risk step surprises the operator, can they reach a safe
disposition and preserve evidence of what did and did not happen — from this document alone?

## Record series

These five roles are append-only series declared in `engineering.yaml`: one numbered file per
event, registered in the series `INDEX.md`, validated by `engineering document validate`. A record
can be well-formed yet content-empty — the validator proves the structural contract, never the
content bar below.

### Task — `docs/tasks/*.md`

Defines a bounded work outcome and the acceptance contract by which completion is independently
verified.

- **Problem** — the actual defect or need, not a restatement of the planned solution.
- **Scope and out of scope** — both stated, so the work boundary is honest and creep is visible.
- **Done when** — objective criteria a reviewer can judge without the author. "Tests pass" is not
  a criterion; "no duplicate record under concurrent identical submissions, proven by the named
  integration test" is.
- **Completion evidence** — per criterion, a pointer to the artifact that proves it (PR, test
  run, document section), with an honest verification note where coverage was sampled rather than
  exhaustive.

**Discriminating test:** can a reviewer decide "done" from the criteria and evidence, without the
author present or undocumented proof?

### ADR — `docs/adr/*.md`

Preserves authorized counterfactual memory: why one consequential choice defeated credible
alternatives under named conditions.

- **Context** — the contestable premise set (requirements, constraints, risks, affected parties)
  that made the choice hard, not a curated backstory.
- **Decision** — one decision, at the altitude of its consequences, with named deciders and
  authority. A schedule wearing decision authority ("plan migration separately") is a deferral,
  not a decision.
- **Alternatives considered** — genuine rivals, each receiving the same criteria as the chosen
  option — including the rejected-without-extended-analysis ones, stated as such.
- **Consequences** — an obligation ledger (benefits, costs, transferred risks, accepted losses),
  not a victory paragraph.
- **Revisit condition** — the observable that would justify a different choice. A vague "if things
  change" is a deferral of the decision, not a bounded one.

**Discriminating test:** can a competent future reader trace the choice to contemporaneous
evidence, see the strongest rival and why it lost, and name a driver whose change would reopen the
decision?

### Audit — `docs/audits/*.md`

Establishes a dated, bounded evaluation against an objective baseline, including the limits of what
was examined.

- **Method and scope** — what was examined, over what population, by what procedure — stated
  before any finding, so findings can be derived rather than asserted.
- **Findings** — separate from recommendations, each traceable to observed evidence, with the
  proof boundary stated.
- **Limitations** — what was not tested, named explicitly. The honest reading, not the flattering
  one: findings selected to manufacture a clean result are the audit role's characteristic
  failure.

**Discriminating test:** can a reviewer derive the findings from the method and evidence, and see
exactly where the proof stops?

### Handoff — `docs/handoffs/*.md`

Transfers continuation state across a work boundary so a cold successor can resume safely from
evidence.

- **State of the work** — done, in progress, and blocked, separated, with owners and done-when
  conditions.
- **First action** — the next step, stated so it resolves from current state and is safe to take
  without context.
- **Evidence and authority links** — pointers to the records that own the state (task, ADR,
  audit), verified to resolve to live authority rather than stale or superseded state.

**Discriminating test:** can a cold reader take the first correct action without interviewing
anyone or trusting stale state?

### Lesson — `docs/lessons/*.md`

Turns experience into a bounded, retrievable change in future judgment. This series is
**gitignored** (`AGENTS.md`): candid working notes, governed for structure and queryability but
not shipped to the public repo.

- **Inference with a mechanism** — what to expect or do differently next time and _why_, beyond
  "X happened, then Y". A chronology is not a lesson.
- **Applicability boundary** — when to apply it, and the counter-signal: the similar-looking case
  where it must **not** be applied. A lesson broad enough to apply anywhere changes nothing.
- **Provenance** — the originating event and the lesson's maturity, so a reader can weigh it.

**Discriminating test:** does it change a competent reader's future judgment while preventing
transfer to a merely similar-looking case?

## What automation can and cannot check

The two mechanisms check **shape**, and deliberately different amounts of it:

- **`engineering document validate`** (record series) verifies the structural contract: role,
  numbering, lifecycle state, metadata, relationships, currentness, index registration. Its
  findings are real signals — but a clean report means the record is *well-formed*, not that it is
  *good*.
- **`atlas docs check`** (living documents) verifies that the required sections for the declared
  role exist and are substantive — a word floor per section, not more. It cannot verify that a
  section passes its discriminating test: no automated check can tell a failure-semantics table
  a reviewer can adjudicate from one that is fluent filler.

Note that `atlas docs check` itself is part of the `atlas` control surface designed in
`task:0010`; until that design lands, the living documents have no automated checker at all, which
is exactly the gap this standard and human review fill.

**The discriminating test is the review bar.** Structure is hard, warrant is loud: every proxy a
validator can measure (section present, word count met, date current, link resolves) is
necessary-but-not-sufficient. A reviewer applying this standard applies the role's discriminating
test and nothing less; passing the structural check is never semantic approval and never a reason
to skip that judgment.

## Why the living documents sit outside `engineering document validate`

This is not an oversight; it is `adr:0002`, and the reasoning is structural. Declaring a role in
`engineering.yaml`'s `docs.currency.roles` makes every matched file a numbered record in a series —
`id_prefix_digits` has schema minimum 1, so there is no opt-out. Conforming would mean renaming
`docs/ARCHITECTURE.md` to something like `docs/0001-architecture.md`, breaking every inbound link
from `AGENTS.md`, `README.md`, `CONTRIBUTING.md`, and the docs' cross-references, in exchange for
metadata enforcement on four files the maintainer reads constantly. The chosen alternative: living
documents keep their stable filenames and declare role, status, owner, and last-updated in
frontmatter, outside the validator.

The cost is real and accepted: nothing machine-checked reports a stale `updated:` date or a missing
section in a living document. `atlas docs check` exists to close precisely that gap. Until it
lands, substantive review against this standard is the only control — which is why this standard
states the required sections explicitly rather than trusting frontmatter to imply them.

## Provenance

The role taxonomy and the discriminating tests in this standard derive from the
**`software-engineering` skill**'s documentation content standards — specifically its
*living-document* and *record* content standards files (roles: specification, knowledge, reference,
standard, guide, roadmap, changelog, runbook; task, ADR, audit, research, lesson, handoff, plan).
This repo adopted the skill's governed workflow via `engineering.yaml` (2026-08-17) and its
documentation discipline in substance via `task:0011` under `adr:0002`.

This file is Atlas's own statement of that bar, written in this repo's terms — not a copy of the
skill's knowledge files. Two roles the skill defines (`research`, `plan`) are not yet adopted here;
two skill roles are unused here (`knowledge` documents, `changelog`) because no document currently
serves them. Where the source skill evolves, the owner decides whether to follow it, through the
change process above; this document, not the skill, is what conformance in this repo is measured
against.

This file is itself a living document of role **standard** and is bound by its own bar: its issuer
and adoption basis are stated above, its population and scope are stated, its exceptions are
authorized only by the project owner, and it changes through the process it describes.
