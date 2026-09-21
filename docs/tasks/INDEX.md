---
schema_version: 2
id: 'index-0001'
uid: 'index-20260817T000000000000Z-atlastsk'
title: Task index
role: index
status: current
summary: Point to the governed task records for AI Safety Atlas.
created: '2026-08-17'
updated: '2026-08-17'
owner: Markov Grey
supersedes: ''
superseded_by: ''
---

# Index: Tasks

## Purpose

Governed `task` records for AI Safety Atlas — bounded, acceptance-tested units of work.
Records are allocated with `engineering document new task --title "..."` and live beside this
index as numbered files (e.g. `0001-title.md`).

## Entries

- [task:0001](./0001-eliminate-imagegen-foreview-org-runtime-dependency-build-time-og-images.md) —
  Eliminate the `imagegen.foreview.org` runtime dependency via build-time OG images (todo).
- [task:0002](./0002-migrate-r2-assets-to-our-own-cloudflare-account-and-repoint-config.md) —
  Migrate R2 assets to our own Cloudflare account and repoint config (todo).
- [task:0003](./0003-establish-independent-google-docs-control-own-service-account-sharing-copy-offli.md) —
  Establish independent Google Docs control (own service account, sharing/copy, offline backups) (todo).
- [task:0004](./0004-rotate-all-freelancer-held-credentials-and-reset-github-actions-secrets.md) —
  Rotate all freelancer-held credentials and reset GitHub Actions secrets (todo).
- [task:0005](./0005-de-risk-frozen-audio-own-elevenlabs-key-verified-regeneration-ffmpeg-c-copy-conc.md) —
  De-risk frozen audio: own ElevenLabs key, verified regeneration, ffmpeg -c copy concat (todo).
- [task:0006](./0006-decide-independence-posture-for-the-foreview-logos-package.md) —
  Decide independence posture for the @foreview logos package (todo, low priority).
- [task:0007](./0007-publication-security-and-privacy-remediation-git-author-email-exif-stale-untrack.md) —
  Publication security & privacy remediation: git author email, EXIF, stale untracked files, dependency CVEs (todo).
- [task:0008](./0008-harden-the-read-along-against-silent-timing-drift-and-stale-encoder-paths.md) —
  Harden the read-along against silent timing drift and stale encoder paths (in_progress — all criteria met, awaiting owner acceptance).
- [task:0009](./0009-wrap-narrated-list-items-so-the-read-along-covers-them.md) —
  Wrap narrated list items so the read-along covers them (in_progress — all criteria met, awaiting owner acceptance).
- [task:0010](./0010-design-the-atlas-control-surface-for-maintainer-operations.md) —
  Design the `atlas` control surface for maintainer operations (todo — design agreement only, no implementation authorised).
- [task:0011](./0011-adopt-the-documentation-content-standards-in-substance-not-just-frontmatter.md) —
  Adopt the documentation content standards in substance, not just frontmatter (todo — the goodharting fix).
- [task:0012](./0012-position-atlas-docs-check-as-a-portable-floor-under-the-software-engineering-ski.md) —
  Position `atlas docs check` as a portable floor under the software-engineering skill (todo).
- [task:0013](./0013-migrate-the-google-docs-sources-the-textbook-is-served-from.md) —
  Migrate the Google Docs sources the textbook is served from (todo — blocks nothing, but orphans the committed cache if done naively).
- [task:0014](./0014-model-language-and-edition-through-the-whole-stack.md) —
  Model language and edition through the whole stack (todo — plumbing, not a model change; six decisions gate execution; translators are blocked today).
- [task:0017](./0017-normalize-integration-failure-posture-on-the-google-docs-pattern.md) —
  Normalize integration failure posture on the Google Docs pattern (todo — R2/Algolia/logos failure semantics; five decisions gate execution; coordinates with 0013's destructive reindex).
- [task:0015](./0015-discriminated-union-ast-and-per-renderer-applicability-for-new-content-types.md) —
  Discriminated union AST and per-renderer applicability for new content types (todo — eight decisions total across 0015/0019 recorded by their author).
- [task:0016](./0016-audio-cache-key-provenance-voice-unification-and-a-per-section-timings-path.md) —
  Audio cache key, provenance, voice unification and a per-section timings path (todo — paragraph regen near-free; chunk cache key and welded word timings are the blockers; voice decision gates all spend).
- [task:0018](./0018-separate-browser-modules-from-build-time-code-and-test-the-dom-layer.md) —
  Separate browser modules from build-time code and test the DOM layer (todo — test-first, jsdom+Playwright hybrid; completes the extraction pattern follow-scroll.ts:4 began).
- [task:0019](./0019-reduce-repository-and-page-weight.md) —
  Reduce repository and page weight (todo — 1.59 GiB clone, oversized images, eager .words.json, per-push rebuilds; history-rewrite decision surfaced first).
- [task:0020](./0020-standalone-code-quality-and-hygiene-fixes-from-the-audit-sweep.md) —
  Standalone code quality and hygiene fixes from the audit sweep (todo — seven size-S fixes bundled; two gitignore guards kept; typecheck hermeticity gated on a maintainer-mode diff check).


### Refactor programme (2026-09, from the audit sweep)

Seven records covering the six root decisions the 46 audit findings collapse into, plus the
standalone fixes. Each carries a **Decisions required before execution** section — 29 decisions
in total, each with options, a recommendation, and what is irreversible if decided wrongly.
**None of these is authorised to execute; the decisions come first.**

- [task:0014](./0014-model-language-and-edition-through-the-whole-stack.md) —
  Model language and edition through the whole stack (todo — 6 decisions — translators blocked today).
- [task:0015](./0015-discriminated-union-ast-and-per-renderer-applicability-for-new-content-types.md) —
  Discriminated-union AST and per-renderer applicability (todo — 4 decisions — unblocks quizzes, flashcards, self-hosted OWID).
- [task:0016](./0016-audio-cache-key-provenance-voice-unification-and-a-per-section-timings-path.md) —
  Audio cache-key provenance, voice unification, per-section timings (todo — 5 decisions — voice choice gates the rest).
- [task:0017](./0017-normalize-integration-failure-posture-on-the-google-docs-pattern.md) —
  Normalize integration failure posture on the Google Docs pattern (todo — 5 decisions).
- [task:0018](./0018-separate-browser-modules-from-build-time-code-and-test-the-dom-layer.md) —
  Separate browser modules from build-time code and test the DOM layer (todo — 3 decisions).
- [task:0019](./0019-reduce-repository-and-page-weight.md) —
  Reduce repository and page weight (todo — 4 decisions — includes an irreversible history rewrite).
- [task:0020](./0020-standalone-code-quality-and-hygiene-fixes-from-the-audit-sweep.md) —
  Standalone code-quality and hygiene fixes from the audit sweep (todo — 2 decisions — all size S).
