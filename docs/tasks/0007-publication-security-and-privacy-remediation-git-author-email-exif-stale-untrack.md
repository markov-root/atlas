---
schema_version: 2
id: '0007'
uid: 'task-20260817T201917208095Z-e121c83f'
title: 'Publication security and privacy remediation (git author email, EXIF, stale untracked files, dependency CVEs)'
role: task
status: todo
summary: 'Task record: Publication security and privacy remediation (git author email, EXIF, stale untracked files, dependency CVEs).'
created: '2026-08-17'
updated: '2026-08-17'
owner: Markov Grey
supersedes: ''
superseded_by: ''
engineering_document:
  version: 1
  role: task
  id: '0007'
  uid: task-20260817T201917208095Z-e121c83f
  title: 'Publication security and privacy remediation (git author email, EXIF, stale untracked files, dependency CVEs)'
  state: todo
  authority:
    kind: work-state
    owner: Markov Grey
    scope: BOUNDED ACCEPTANCE AND COMPLETION AUTHORITY
  created: '2026-08-17'
  updated: '2026-08-17'
  transition_history: unverified
  transitions: []
  relationships: []
  details:
    criteria: [criterion:AC-1, criterion:AC-2, criterion:AC-3, criterion:AC-4]
---

# Task 0007: Publication security and privacy remediation (git author email, EXIF, stale untracked files, dependency CVEs)

## Problem

`engineering inspect publication --target github` (run 2026-08-17) fails. Triage: **no secret is in
any tracked/committable file** — all 86 gitleaks hits are in gitignored `.env` and `dist/`, so no API
key is published. The remaining failures are genuine but privacy/maintenance, and should be tracked
so they aren't rediscovered:

1. **Git history author/committer email not privacy-safe for GitHub.** Commits carry a non-noreply
   email (likely `markov@cesia.org`), which contradicts the global rule to use
   `183495292+markov-root@users.noreply.github.com` on GitHub.
2. **EXIF metadata in tracked portraits.** `src/assets/static/portraits/*.jpg` (Hassabis, Tegmark,
   Sutton, von der Leyen, Bengio) carry `Creator` / `OwnerName` / `SerialNumber` — photographer/camera
   PII that would publish.
3. **Stale files that are neither tracked nor gitignored.** Leftovers from the old Docusaurus era
   (`src/theme/`, `src/data/courses*`, `scripts/preprocessed/`, `static/img/`, `docs/chapters/`, some
   `src/components/Homepage/`) contain contact emails / user-home paths and would be swept in by a
   `git add .`.
4. **46 known dependency CVEs** (osv-scanner, `pnpm-lock.yaml`).
5. A user-home path candidate inside committed `.cache/docs/1Z5…/t.0` (benign but should be scrubbed
   at the next cache refresh — the secret-scan step in `.cache/docs/README.md`).

Public-by-design org/course contact emails in `src/content/organizations/*.json` are acceptable and
out of scope.

## Scope

- Configure a git author/committer email that is privacy-safe for GitHub; decide whether to rewrite
  existing history or accept it going forward (record the decision).
- Strip EXIF from the tracked portrait JPGs (`exiftool -all= …` or `vips`).
- Delete or `.gitignore` the stale untracked files after confirming they are not intended WIP.
- Triage the 46 dependency advisories (`pnpm audit` / osv-scanner) and bump or accept with rationale.
- Fold the `.cache/docs` user-home path into the next secret-scan/refresh.

## Out of scope

- The independence work items (`task:0001`–`task:0006`).
- Public-by-design contact emails in partner-org listings.

## Done when

- AC-1: `git config user.email` is GitHub-privacy-safe; a decision on history rewrite is recorded.
- AC-2: `exiftool` reports no Creator/OwnerName/SerialNumber on the tracked portraits.
- AC-3: The stale untracked files are removed or gitignored (a `git status` shows no PII-bearing
  untracked files stageable by `git add .`).
- AC-4: The 46 dependency advisories are triaged (bumped or explicitly accepted with rationale), and
  `engineering inspect publication --target github` findings are all either resolved or recorded as
  accepted.

## Completion evidence

Keep empty until evidence exists. Before changing state to `done`, link the implementation, checks,
records, and limitations that satisfy each criterion.
