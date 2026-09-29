---
schema_version: 2
id: "0037"
uid: "task-20260929T175827057765Z-41c918a3"
title: "Repair the Our World in Data figure embeds the upstream charts retired"
role: task
status: todo
summary: "Eleven chart embeds render a 404 page or a whole article because OWID retired the charts; nine still return HTTP 200."
created: "2026-09-29"
updated: "2026-09-29"
owner: Markov Grey
supersedes: ""
superseded_by: ""
engineering_document:
  version: 1
  contract_tier: full
  role: task
  id: "0037"
  uid: task-20260929T175827057765Z-41c918a3
  title: "Repair the Our World in Data figure embeds the upstream charts retired"
  state: todo
  authority:
    kind: work-state
    owner: Markov Grey
    scope: BOUNDED ACCEPTANCE AND COMPLETION AUTHORITY
  created: "2026-09-29"
  updated: "2026-09-29"
  transition_history: unverified
  transitions: []
  relationships: []
  details:
    criteria: [criterion:AC-1, criterion:AC-2, criterion:AC-3, criterion:AC-4]
    size: m
    priority: p2
    # Optional scheduling hints:
    # depends_on: ["0042"]
    # parent: "0090"
    # touches: ["software-engineering/public/**", "software-engineering/dev/tests/**"]
    # size: m
    # priority: p1
    # Under the agent_scheduling profile, an oversized task warns (advisory) and prompts a split.
    # Justify legitimately atomic large work with an exception that suppresses the prompt:
    # atomic_large:
    #   rationale: "why this cannot be split into vertical slices"
    #   rollback: "how to revert / verify if it goes wrong"
    #   checkpoints: ["intermediate checkpoint 1", "intermediate checkpoint 2"]
---

# Task 0037: Repair the Our World in Data figure embeds the upstream charts retired

## Problem

Owner report, 2026-09-24, from reading `/chapters/v1/governance/compute-governance`: an interactive
figure was rendering Our World in Data's **"Sorry, this page doesn't exist!"** screen, complete with
their navigation bar, search box and cookie-consent banner, inside the Atlas figure frame.

OWID retired or renamed a batch of charts and now serves a 302 from the old slug to an article, a
data insight, or their 404 page. An `<iframe>` faithfully displays whatever it lands on, so the reader
gets a whole third-party web page where a chart should be.

**Nine of the eleven return HTTP 200.** That is why this survived every link check: only two are
404s. A status-code sweep reports this corpus as healthy.

### Scope of the rot, measured

Every `Iframe` node in every section of every chapter, including footnotes and caption-held nodes,
across the one edition that exists (`v1`):

| | Count |
| --- | ---: |
| Iframes in the textbook | **28** on 14 pages |
| Our World in Data | 26 |
| Metaculus | 2 - both render correctly, checked in a browser |
| **Broken** | **11 iframes, 8 pages, 4 chapters** |
| Working | 17 |

Three distinct failure modes, which matter because only the first looks like a failure:

| What the reader sees | Iframes | Charts |
| --- | ---: | --- |
| OWID's 404 page, nav and cookie banner included | 2 | `views-ai-impact-society-next-20-years`, `market-share-logic-chip-production-manufacturing-stage` |
| A whole OWID article scrolled inside the frame | 7 | `cumulative-number-of-large-scale-ai-models-by-domain` (x2), `number-of-large-scale-ai-systems-released-per-year`, `hardware-and-energy-cost-to-train-notable-ai-systems`, `annual-reported-ai-incidents-controversies`, `ai-performance-knowledge-tests-vs-training-computation`, `artificial-intelligence-patents-submitted` |
| A chart, but not the captioned one | 2 | `electricity-generation` (renamed, same data), `ai-performance-coding-math-knowledge-tests` (redirects to the chart section 5.2 **already** embeds, so it shows the same figure twice) |

Chapters 3, 6, 7 and 8 are unaffected. Chapter 1 carries six of the eleven.

## Scope

Replacing the `src` of each broken figure embed **and its caption** in the Google Docs source, and
deciding what to do with the four charts OWID has no replacement for.

**Each fix is two edits, not one.** The caption is authored in the Doc beside the embed. Swapping only
the URL leaves figure 4.2 captioned "Market share for logic chip production, by manufacturing stage"
above a chart of TSMC revenue, which is worse than the 404 because it reads as correct.

## Out of scope

- **A link checker in CI.** Tempting, and it would not have caught this: nine of eleven are HTTP 200.
  Detecting it needs a redirect-target check ("does the final URL still name a grapher?"), which is a
  separate piece of work with its own false-positive profile. Recorded here as a finding, not built.
- **`Video` nodes.** YouTube embeds go through a different component and were not audited. Unknown,
  not clean.
- **Rehosting the charts.** OWID data is CC BY and their charts are designed to be embedded; taking
  local copies would trade a broken embed for a stale one.

## The corrections

### Verified swaps

Every replacement below was checked twice: the slug resolves to a live grapher with no redirect, and
it was rendered in a real iframe on the running site to confirm it draws a bare chart rather than a
page.

| Section | Current `src` | Change to | Caption becomes |
| --- | --- | --- | --- |
| 1.8 Appendix: Forecasting | `grapher/electricity-generation` | `grapher/electricity-mix?frequency=annual&metric=generation&source=total` | unchanged - same data, renamed chart |
| 1.8 Appendix: Forecasting | `grapher/hardware-and-energy-cost-to-train-notable-ai-systems` | `grapher/monthly-spending-data-center-us` | "Monthly spending on data center construction in the United States, adjusted for inflation." |
| 4.3 Compute Governance | `grapher/ai-performance-knowledge-tests-vs-training-computation` | `grapher/computation-used-to-train-notable-artificial-intelligence-systems` | "Computation used to train notable AI systems, in total petaFLOP." |
| 4.3 Compute Governance | `grapher/market-share-logic-chip-production-manufacturing-stage` | `grapher/tsmc-annual-revenue` | "TSMC's annual revenue. TSMC manufactures advanced chips for other companies, including the processors used in AI." |
| 4.4 Systemic Challenges | `grapher/artificial-intelligence-patents-submitted` | `grapher/annual-scholarly-publications-on-artificial-intelligence` | "Annual scholarly publications on artificial intelligence." |
| 5.2 Benchmarks | `grapher/ai-performance-coding-math-knowledge-tests` | `grapher/ai-frontiermath-over-time` | "Share of FrontierMath problems solved correctly by AI models." |

**The TSMC swap is the weakest and should not be taken on autopilot.** The original supported a
concentration argument - a small number of firms control chip production. TSMC revenue is a proxy for
that at best. If the surrounding sentence leans on the chokepoint claim, a citation may serve it
better than a chart, and the figure should go.

### No replacement exists

OWID retired the series, not just the URL. Their current AI catalogue is 35 charts and none covers
these, so each needs an authorial decision: drop the figure, or make a different point.

| Section | Current `src` | What the caption claims |
| --- | --- | --- |
| 1.2 Current Capabilities | `grapher/cumulative-number-of-large-scale-ai-models-by-domain` | an explosion in language models, by domain |
| 1.3 Foundation Models | `grapher/number-of-large-scale-ai-systems-released-per-year` | systems released per year |
| 1.3 Foundation Models | `grapher/cumulative-number-of-large-scale-ai-models-by-domain` | the same chart again |
| 1.10 Appendix: Expert Surveys | `grapher/views-ai-impact-society-next-20-years` | "Will AI help or harm people in the next 20 years?" |
| 2.2 Risk Decomposition | `grapher/annual-reported-ai-incidents-controversies` | reported AI incidents and controversies |

The nearest live chart for 1.2 and 1.3 is `cumulative-number-of-large-scale-ai-systems-by-country`,
but that is a different claim and sections 4.4 and 4.5 already use it.

### Two prose links, same cause

| Section | Current link | State |
| --- | --- | --- |
| 1.2 Current Capabilities | `grapher/cumulative-number-of-large-scale-ai-models-by-domain` | retired |
| 4.3 Compute Governance | `grapher/market-share-logic-chip-production-manufacturing-stage?tab=chart` | 404 |

The other 24 OWID links point at `ourworldindata.org/artificial-intelligence` or at live graphers and
are fine.

## Done when

- **AC-1:** The six verified swaps are applied in the Doc, URL **and** caption together, and each
  figure renders a bare chart on the built site.
- **AC-2:** The five figures with no replacement are resolved by an authorial decision, recorded here,
  and the Doc reflects it.
- **AC-3:** The two stale prose links point at a live address.
- **AC-4:** A re-run of the audit over every `Iframe` node reports no embed whose final URL is not the
  grapher it names.

## Completion evidence

_To be filled on completion._

| Criterion | Evidence | Verified |
| --------- | -------- | -------- |
| AC-1      | -        | -        |
| AC-2      | -        | -        |
| AC-3      | -        | -        |
| AC-4      | -        | -        |

## Authority and inputs

- Owner report, 2026-09-24, from the rendered `governance/compute-governance` page.
- The audit itself: every `Iframe` node in `TEXTBOOK_EDITIONS`, each URL followed with redirects and
  classified by whether its final address is still the grapher it names.
- `https://ourworldindata.org/artificial-intelligence` and `/scaling-up-ai` - the live catalogue of 35
  AI charts the replacements were drawn from.
- `task:0035` - the sibling record for upstream *citation* corrections. Kept separate deliberately: a
  figure embed is not a citation, and folding these in would make that record's criteria untrue.

## How to re-run the audit

Walk every `Iframe` node in every section (including footnotes and caption-held nodes, which
`allChildNodes` reaches and a `children`-only walk does not - `audit:0011` F5), follow each `src` with
redirects, and compare the final path against the requested one. A bare status code is not enough:
**the signal is the redirect target, not the code.**
