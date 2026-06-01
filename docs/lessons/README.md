# Lessons

Chronological journal of what we tried, what surprised us, and how we resolved it. One file per event. Each entry answers four questions:

- **What did we try to do?**
- **What did we learn?**
- **Where did we get stuck and why?**
- **How did we fix it (or what did we add to `TODO.md`)?**

## Index

| Date | Topic | One-line takeaway |
|---|---|---|
| 2026-06-01 | [credential-wall-audit](./2026-06-01-credential-wall-audit.md) | The build needs Google credentials because of a single, removable coupling — and the existing cache layer already does 80% of the work. |
| 2026-06-01 | [plan-critique](./2026-06-01-plan-critique.md) | The first plan was good but scattered env-mode decisions across 5+ files; extracting `BuildMode` was the keystone refinement. |
| 2026-06-01 | [track-a-implementation](./2026-06-01-track-a-implementation.md) | Shipped contributor-free builds in 9 commits; two extras (pnpm workspace, Astro env-system mismatch) only surfaced via the smoke test. |
| 2026-06-01 | [test-suite](./2026-06-01-test-suite.md) | 45 unit tests + 1 smoke test, each layer protecting a specific class of regression — and the first iteration caught a real Transformer state issue. |

## How to add a new entry

1. Pick a focused topic, not a whole sprint. If a session covered three distinct learnings, write three entries.
2. Filename: `YYYY-MM-DD-short-topic.md` (lowercase, dashed). If multiple entries share a date, the topic suffix disambiguates.
3. Use the four-question template above as your section headers.
4. Add a row to the index in this file with a one-line takeaway.
5. Link related entries with relative paths.
