---
schema_version: 2
id: "0033"
uid: "task-20260923T210606516086Z-77675e1c"
title: "Replace native select dropdowns with a styled listbox component"
role: task
status: todo
summary: "Native selects cannot style their popup; a listbox component would make every dropdown on the site match the house style."
created: "2026-09-23"
updated: "2026-09-23"
owner: Markov Grey
supersedes: ""
superseded_by: ""
engineering_document:
  version: 1
  contract_tier: full
  role: task
  id: "0033"
  uid: task-20260923T210606516086Z-77675e1c
  title: "Replace native select dropdowns with a styled listbox component"
  state: todo
  authority:
    kind: work-state
    owner: Markov Grey
    scope: Dropdown controls sitewide - no change to what any control does
  created: "2026-09-23"
  updated: "2026-09-23"
  transition_history: unverified
  transitions: []
  relationships: []
  details:
    criteria: [criterion:AC-1, criterion:AC-2, criterion:AC-3, criterion:AC-4]
    size: m
    priority: p2
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

# Task 0033: Replace native select dropdowns with a styled listbox component

## Problem

Owner report, 2026-09-23: "the actual drop down element still is generic and not styled; the entire
house style across the website for dropdown elements is kind of bad and needs to be updated."

The closed state of a `<select>` was restyled under `task:0030` - borderless, `bg-gray-100`, a tabler
chevron replacing the native arrow. **The open state cannot be styled at all.** A native select's
popup is drawn by the operating system, outside the page's CSS, so it ignores the site's typeface,
colours, spacing and rounding on every platform. No amount of CSS reaches it.

That is the whole gap: the control looks like the Atlas until you click it, and then it looks like
Windows, or macOS, or Android.

Three places carry selects today, and they do not agree with one another:

| Where                              | Style                                             |
| ---------------------------------- | ------------------------------------------------- |
| `VersionSelector` (site header)    | `bg-gray-100`, borderless, native arrow           |
| `Bibliography` control panel       | `bg-white` on a gray panel, custom chevron        |
| Anything added next                | whatever its author copies                        |

## Scope

One `Listbox` component under `src/components/`, and every `<select>` in `src/` moved onto it.

It must be a real listbox, not a div that looks like one: a button with `aria-haspopup="listbox"`
and `aria-expanded`, a popup with `role="listbox"`, options with `role="option"` and
`aria-selected`, roving focus, Home/End/Escape and type-ahead. The site already tests accessibility
(`pnpm test:a11y`), and a custom control is exactly where that regresses.

## Out of scope

- **The bibliography panel's behaviour.** Filtering, sorting and grouping are `task:0030` and do not
  change; only the control they are driven by does.
- **The header search.** It is an Algolia surface with its own interaction model.

## Decisions required before execution

### D1 - Custom component, or a library?

A listbox is one of the controls most often got subtly wrong: focus management, screen-reader
announcements, touch behaviour, and what happens when the list is longer than the viewport. The
bibliography's source facet has **256 options**, which makes scrolling, type-ahead and virtualisation
real rather than theoretical.

Worth pricing a headless library (Ark UI, Headless UI, Radix primitives) against the
capability-scaling prior in `AGENTS.md`: buy commodity behaviour, own the styling. A hand-rolled
listbox is exactly the "reimplement a solved specification" shape `task:0029` and `task:0030` were
both written to undo.

### D2 - Does a 256-option list stay a listbox?

A dropdown listing every source is a poor control at that length whatever it is made of. A combobox
with type-ahead filtering may be the right answer for that one facet even if a plain listbox serves
the rest.

## Done when

- **AC-1:** One component owns every dropdown in `src/`; no `<select>` remains outside it.
- **AC-2:** The open state matches the house style on Linux, macOS and Windows, which the native
  control cannot.
- **AC-3:** Keyboard and screen-reader behaviour is covered by tests, and `pnpm test:a11y` passes.
- **AC-4:** `docs/DESIGN.md` documents the component, so the next dropdown does not invent a fourth
  style.

## Completion evidence

_To be filled on completion._

| Criterion | Evidence | Verified |
| --------- | -------- | -------- |
| AC-1      | -        | -        |
| AC-2      | -        | -        |
| AC-3      | -        | -        |
| AC-4      | -        | -        |

## Authority and inputs

- Owner report, 2026-09-23.
- `src/components/VersionSelector.astro`, `src/components/Bibliography.astro` - the current selects.
- `docs/DESIGN.md` - the house style the open state has to match.
