---
schema_version: 2
id: '0001'
uid: 'adr-20260817T200613132516Z-24d8e592'
title: 'Independence strategy: own or back up every external dependency, then rotate freelancer-held credentials'
role: adr
status: proposed
summary: 'ADR: own or back up every external dependency, then rotate every freelancer-held credential.'
created: '2026-08-17'
updated: '2026-08-17'
owner: Markov Grey
supersedes: ''
superseded_by: ''
engineering_document:
  version: 1
  role: adr
  id: '0001'
  uid: adr-20260817T200613132516Z-24d8e592
  title: 'Independence strategy: own or back up every external dependency, then rotate freelancer-held credentials'
  state: proposed
  authority:
    kind: decision-record
    owner: Markov Grey
    scope: DECISION BOUNDARY
  created: '2026-08-17'
  updated: '2026-08-17'
  transition_history: unverified
  transitions: []
  relationships: []
  details:
    decision_date: '2026-08-17'
    deciders: [markov-grey]
---

# ADR 0001: Independence strategy: own or back up every external dependency, then rotate freelancer-held credentials

Once accepted, preserve this decision body. Change direction with a superseding ADR and metadata
transition rather than rewriting the earlier rationale.

## Context

AI Safety Atlas was built and operated by a freelancer who held every external credential and hosted
one runtime service (`imagegen.foreview.org`). Handing the project to Markov/CeSIA requires making it
self-sustaining. The full dependency surface is in `audit:0001`. A handoff done as "get copies of the
keys" leaves every secret live in a departing party's hands and leaves runtime dependencies on
infrastructure we don't control - that is not independence.

## Decision

Adopt a two-part standard for the whole handoff:

1. **Own or back up every external dependency.** Either bring the asset under our own account
   (Cloudflare R2, Google Docs, Algolia, GitHub Actions secrets) or, where migration lags, take a
   verified local backup first (done for R2 → `~/atlas-r2-backup`). Eliminate or self-host any
   external _runtime_ dependency (`imagegen.foreview.org` → `task:0001`).
2. **Then rotate every credential the freelancer ever held** - not just obtain copies. Getting
   access unblocks work; rotation is what actually closes the door (`task:0004`).

Scope: the freelancer handoff and the independence work tracked in `task:0001`–`task:0006` under
umbrella `handoff:0001`. This ADR also records adoption of the software-engineering skill's governed
document workflow (`engineering.yaml`) as the mechanism for tracking that work.

## Consequences

- **Benefits:** no single external party can revoke access or take the site's link previews / content
  pipeline down; a lost R2 copy no longer means lost audio; work is tracked in durable governed records.
- **Costs:** duplicated setup effort (new accounts/keys), a one-time migration per service, and
  ongoing ownership of infrastructure the freelancer previously ran.
- **Responsibilities:** Markov owns the accounts and rotation; each service has a tracking task.
- **Revisit triggers:** if a dependency proves impractical to own (e.g. `@foreview` logos - see
  `task:0006`), record an explicit accept-as-external decision rather than silently depending on it.

## Alternatives considered

- **Copy credentials, skip rotation.** Rejected - leaves secrets in a departing party's control.
- **Keep using freelancer-hosted infrastructure (imagegen, their R2/Cloudflare).** Rejected as the
  steady state - it is exactly the dependency we are removing; acceptable only as a temporary bridge.
- **Do nothing / treat the repo as the whole handoff.** Rejected - misses the runtime and credential
  surface entirely (the original Slack list omitted `imagegen` and all credential rotation).
