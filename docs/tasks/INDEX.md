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

Governed `task` records for AI Safety Atlas - bounded, acceptance-tested units of work.
Records are allocated with `engineering document new task --title "..."` and live beside this
index as numbered files (e.g. `0001-title.md`).

## Entries

- [task:0001](./0001-eliminate-imagegen-foreview-org-runtime-dependency-build-time-og-images.md) -
  Eliminate the `imagegen.foreview.org` runtime dependency via build-time OG images (todo).
- [task:0002](./0002-migrate-r2-assets-to-our-own-cloudflare-account-and-repoint-config.md) -
  Migrate R2 assets to our own Cloudflare account and repoint config (todo).
- [task:0003](./0003-establish-independent-google-docs-control-own-service-account-sharing-copy-offli.md) -
  Establish independent Google Docs control (own service account, sharing/copy, offline backups) (todo).
- [task:0004](./0004-rotate-all-freelancer-held-credentials-and-reset-github-actions-secrets.md) -
  Rotate all freelancer-held credentials and reset GitHub Actions secrets (todo).
- [task:0005](./0005-de-risk-frozen-audio-own-elevenlabs-key-verified-regeneration-ffmpeg-c-copy-conc.md) -
  De-risk frozen audio: own ElevenLabs key, verified regeneration, ffmpeg -c copy concat (todo).
- [task:0006](./0006-decide-independence-posture-for-the-foreview-logos-package.md) -
  Decide independence posture for the @foreview logos package (todo, low priority).
- [task:0007](./0007-publication-security-and-privacy-remediation-git-author-email-exif-stale-untrack.md) -
  Publication security & privacy remediation: git author email, EXIF, stale untracked files, dependency CVEs (todo).
- [task:0008](./0008-harden-the-read-along-against-silent-timing-drift-and-stale-encoder-paths.md) -
  Harden the read-along against silent timing drift and stale encoder paths (in_progress - all criteria met, awaiting owner acceptance).
- [task:0009](./0009-wrap-narrated-list-items-so-the-read-along-covers-them.md) -
  Wrap narrated list items so the read-along covers them (in_progress - all criteria met, awaiting owner acceptance).
- [task:0010](./0010-design-the-atlas-control-surface-for-maintainer-operations.md) -
  Design the `atlas` control surface for maintainer operations (todo - design agreement only, no implementation authorised).
- [task:0011](./0011-adopt-the-documentation-content-standards-in-substance-not-just-frontmatter.md) -
  Adopt the documentation content standards in substance, not just frontmatter (todo - the goodharting fix).
- [task:0012](./0012-position-atlas-docs-check-as-a-portable-floor-under-the-software-engineering-ski.md) -
  Position `atlas docs check` as a portable floor under the software-engineering skill (todo).
- [task:0013](./0013-migrate-the-google-docs-sources-the-textbook-is-served-from.md) -
  Migrate the Google Docs sources the textbook is served from (todo - blocks nothing, but orphans the committed cache if done naively).
### Refactor programme (2026-09, from the audit sweep)

Seven records covering the six root decisions the 46 audit findings collapse into, plus the
standalone fixes. Each carries a **Decisions required before execution** section - 29 decisions
in total, each with options, a recommendation, and what is irreversible if decided wrongly.
**None of these is authorised to execute; the decisions come first.**


- [task:0014](./0014-model-language-and-edition-through-the-whole-stack.md) -
  Model language and edition through the whole stack (todo - plumbing, not a model change; six decisions gate execution; translators are blocked today).
- [task:0017](./0017-normalize-integration-failure-posture-on-the-google-docs-pattern.md) -
  Normalize integration failure posture on the Google Docs pattern (todo - R2/Algolia/logos failure semantics; five decisions gate execution; coordinates with 0013's destructive reindex).
- [task:0015](./0015-discriminated-union-ast-and-per-renderer-applicability-for-new-content-types.md) -
  Discriminated union AST and per-renderer applicability for new content types (todo - eight decisions total across 0015/0019 recorded by their author).
- [task:0016](./0016-audio-cache-key-provenance-voice-unification-and-a-per-section-timings-path.md) -
  Audio cache key, provenance, voice unification and a per-section timings path (todo - paragraph regen near-free; chunk cache key and welded word timings are the blockers; voice decision gates all spend).
- [task:0018](./0018-separate-browser-modules-from-build-time-code-and-test-the-dom-layer.md) -
  Separate browser modules from build-time code and test the DOM layer (todo - test-first, jsdom+Playwright hybrid; completes the extraction pattern follow-scroll.ts:4 began).
- [task:0019](./0019-reduce-repository-and-page-weight.md) -
  Reduce repository and page weight (todo - 1.59 GiB clone, oversized images, eager .words.json, per-push rebuilds; history-rewrite decision surfaced first).
- [task:0020](./0020-standalone-code-quality-and-hygiene-fixes-from-the-audit-sweep.md) -
  Standalone code quality and hygiene fixes from the audit sweep (todo - seven size-S fixes bundled; two gitignore guards kept; typecheck hermeticity gated on a maintainer-mode diff check).
- [task:0021](./0021-derive-a-bibliography-from-google-docs-citation-links.md) -
  Derive a bibliography from Google Docs citation links (todo - 1,792 citations already hyperlinked and cached; CSL model, three-layer extract/enrich/render; five decisions surfaced).
- [task:0022](./0022-stop-typecheck-and-build-from-uploading-audio-to-production-r2.md) -
  Stop typecheck and build from uploading audio to production R2 (todo - p1; a typecheck attempted a 96 MB PutObject against production, stopped only by stale credentials).
- [task:0023](./0023-take-custody-of-the-r2-assets-before-access-is-lost.md) -
  Take custody of the R2 assets before access is lost (todo - p1; bucket is freelancer-owned, S3 credentials revoked, 1.9 GB of irreplaceable audio sits gitignored and unbacked on one VM).
- [task:0024](./0024-reduce-build-memory-and-download-volume-that-crash-the-vm.md) -
  Reduce build memory and download volume that crash the VM (todo - p3; verify peaks at 94% commit on an idle 4 GB VM).
- [task:0025](./0025-citation-extraction-canonical-url-identity-and-the-csl-store.md) -
  Citation extraction, canonical URL identity and the CSL store (todo - child of 0021; banks B2-B4, the pure core; B4 fixes the irreversible entry identity and is not parallelizable).
- [task:0026](./0026-the-atlas-citations-cli-extract-report-and-export.md) -
  The atlas citations CLI: extract, report and export (todo - child of 0021; banks B5-B7; depends on 0025; delivers the edition-2 authors' report and the whole-book export file).
- [task:0027](./0027-metadata-resolvers-and-incremental-citation-resolution.md) -
  Metadata resolvers and incremental citation resolution (todo - child of 0021; banks B8-B9; depends on 0025; four independent resolvers, the most parallelizable unit).
- [task:0028](./0028-write-resolved-citations-back-into-the-research-database.md) -
  Write resolved citations back into the research database (todo - child of 0021; turns the corpus from a lookup table into a write-back cache; 548 of 948 sources immediately acquirable, D1 decides scope).
- [task:0029](./0029-port-the-citation-resolution-half-to-python-behind-a-json-boundary.md) -
  Port the citation resolution half to Python behind a JSON boundary (todo - p1; 3,243 of 3,810 lines are language-agnostic; hand-rolled BibTeX already shipped a structural bug).
- [task:0030](./0030-render-the-bibliography-through-a-real-csl-processor-with-a-reader-facing-style.md) -
  Render the bibliography through a real CSL processor with a reader-facing style switcher (todo - child of 0021; replaces the hand-rolled formatter; styles shipped, control panel and grouping still to build).
- [task:0031](./0031-collapse-duplicate-sources-through-an-alias-file.md) -
  Collapse duplicate sources through an alias file (todo - child of 0021; detection shipped in the report, 7 groups; merging is a reviewed human decision).
- [task:0032](./0032-close-the-citation-metadata-tail-to-complete-coverage.md) -
  Close the citation metadata tail to complete coverage (todo - child of 0021, p1; 132 unresolved sources classified by fetching all of them; new resolvers plus a reviewed override file for what no API describes).
- [task:0033](./0033-replace-native-select-dropdowns-with-a-styled-listbox-component.md) -
  Replace native select dropdowns with a styled listbox component (todo - p2; a native select's popup is drawn by the OS and ignores every site style; three inconsistent select styles exist today).
- [task:0034](./0034-include-the-bibliography-in-the-chapter-pdf.md) -
  Include the bibliography in the chapter PDF (todo - child of 0021, p2; every input exists, the Typst renderer never asked).
