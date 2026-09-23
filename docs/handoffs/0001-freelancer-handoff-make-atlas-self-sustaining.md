---
schema_version: 2
id: '0001'
uid: 'handoff-20260817T191858113220Z-13ec890e'
title: 'Freelancer handoff: make Atlas self-sustaining'
role: handoff
status: current
summary: 'Handoff to CeSIA/Markov: audit + R2 backup + engineering adoption done; imagegen migration, R2/gdocs cutover, credential rotation open.'
created: '2026-08-17'
updated: '2026-08-17'
owner: Markov Grey
supersedes: ''
superseded_by: ''
engineering_document:
  version: 1
  role: handoff
  id: '0001'
  uid: handoff-20260817T191858113220Z-13ec890e
  title: 'Freelancer handoff: make Atlas self-sustaining'
  state: current
  authority:
    kind: continuation-state
    owner: Markov Grey
    scope: NEXT-SESSION CONTINUATION ONLY
  created: '2026-08-17'
  updated: '2026-08-17'
  transition_history: unverified
  transitions: []
  relationships: []
  details:
    captured_at: '2026-08-17T19:18:58Z'
    repository: 'AI Safety Atlas (markov-root/atlas)'
    revision: 'dirty working tree on main (engineering-skill adoption + independence task set created)'
    objective: 'Make Atlas fully self-sustaining after the freelancer handoff: own or back up every external dependency, then rotate every credential the freelancer held.'
    completed: [audit:0001, adr:0001]
    open_work: [task:0001, task:0002, task:0003, task:0004, task:0005, task:0006, task:0007]
    blockers: []
    authority_refs:
      [
        AGENTS.md,
        engineering.yaml,
        docs/tasks/0001-eliminate-imagegen-foreview-org-runtime-dependency-build-time-og-images.md,
      ]
    resume: 'Read this handoff + task:0001; verify ~/atlas-r2-backup completed (3229 objects); then run engineering document query --role task --compact'
---

# Handoff 0001: Freelancer handoff: make Atlas self-sustaining

## Outcome

Atlas was built by a freelancer and is being handed to Markov Grey / CeSIA. The external-service
surface has been audited and the most fragile asset (R2, incl. the frozen chapter audio) is being
backed up. Ownership already held by Markov: Algolia account, the `markov-root/atlas` repo + GitHub
Pages, the `ai-safety-atlas.com` domain/DNS. Gemini + ElevenLabs keys are trivially rotatable.

## Completed work

- **`audit:0001`** - full external-service dependency audit (the durable context record). Surfaced
  `imagegen.foreview.org`, a runtime dependency absent from the freelancer's Slack list.
- **`adr:0001`** - recorded the independence strategy (own-or-back-up, then rotate).
- **R2 backup complete and verified** - `dumps/r2-backup.mjs` pulled all **3229 objects / 5.8 GB** of
  bucket `atlas-cache` to `~/atlas-r2-backup/` (`final-audio/` 79, `audio/` 95, `audio-chunks/` 2995,
  `pdf/` 28, `equation-descriptions/` 32).
- Adopted `engineering.yaml` (checks mirror `pnpm verify`; task/handoff/audit/adr roles) and created
  the full independence task set below.

## Open work

Each item is a governed task. Rough dependency order:

1. **`task:0003`** - independent Google Docs control (own service account, share/copy, offline backups).
2. **`task:0002`** - migrate R2 to our own Cloudflare account and repoint config (backup already done).
3. **`task:0005`** - de-risk frozen audio (own ElevenLabs key, verified regeneration, `ffmpeg -c copy`).
4. **`task:0004`** - rotate every freelancer-held credential and reset the 10 GitHub Actions secrets
   (depends on 0002/0003 having minted the new creds).
5. **`task:0001`** - eliminate `imagegen.foreview.org` (build-time OG images). See Blockers.
6. **`task:0006`** - decide the `@foreview` logos posture (low priority, non-blocking).
7. **`task:0007`** - publication security & privacy remediation (git author email, EXIF, stale
   untracked files, dependency CVEs). Independent of the above; found via `inspect publication`.

## Blockers

- **imagegen service source + deployment details** must come from the freelancer before `task:0001`
  can reach visual parity. Everything else Markov can drive independently.

## Resume

1. Read this handoff, `audit:0001`, and `adr:0001` for full context.
2. R2 backup is complete (verified 3229 files / 5.8 GB in `~/atlas-r2-backup`).
3. `uv run --script ~/.agents/skills/software-engineering/scripts/engineering.py document query --role task --compact`
4. Before starting any task, run `engineering start --intent "..."` (manifest is adopted).
