---
schema_version: 2
id: '0004'
uid: 'audit-20260921T134855000000Z-4b8e01d3'
title: 'Cruft, dead code and dependency hygiene'
role: audit
status: draft
summary: 'Source is clean with no dead exports or TODO markers; the cruft is a 1.59 GiB git pack against 17 MB of live images.'
created: '2026-09-21'
updated: '2026-09-21'
owner: Markov Grey
supersedes: ''
superseded_by: ''
engineering_document:
  version: 1
  contract_tier: full
  role: audit
  id: '0004'
  uid: audit-20260921T134855000000Z-4b8e01d3
  title: 'Cruft, dead code and dependency hygiene'
  state: draft
  authority:
    kind: point-in-time-evidence
    owner: Markov Grey
    scope: 'Source tree, dependency manifest, .gitignore and git object store at commit 7e4dc36'
  created: '2026-09-21'
  updated: '2026-09-21'
  transition_history: unverified
  transitions: []
  relationships: []
  details:
    as_of: '2026-09-21'
    subjects: ['AI Safety Atlas source, package.json and git object store at 7e4dc36']
    method: 'Export-reference scan, dependency cross-reference, .gitignore path resolution, git count-objects and history file-type scan'
    limitations:
      - 'Dependency usage checked by name grep; packages referenced by string prefix are missed unless hand-checked'
      - 'No bundle analysis; unused code shipped to the browser is unestablished'
      - 'History scan covered .mp3/.zip/.pdf/.mp4 only, not all large blob types'
---

# Audit 0004: Cruft, dead code and dependency hygiene

## Scope

The source tree, `package.json`, `.gitignore`, and the git object store of AI Safety Atlas at commit
`7e4dc36` (branch `codebase-cleanup`, 2026-09-21).

**Examined:** unreferenced exports, unused dependencies, dependency placement (prod vs dev),
`.gitignore` entries resolving to nothing, committed artifact weight, and the size and composition of
the git pack.

**Not examined:** bundle contents, CSS dead rules, unused Tailwind classes, transitive dependency
health, or security advisories (`pnpm audit` was not run).

## Method

```bash
# unreferenced exports: for each exported symbol, count references outside its own file
rg -o '^export (?:async )?(?:function|const|class) (\w+)' -r '$1' <file>
rg -l "\b<symbol>\b" src --glob '!<own-file>' | wc -l

rg -n 'TODO|FIXME|HACK|XXX' src scripts       # abandonment markers
git count-objects -vH                          # object store size
git log --all --diff-filter=A --name-only -- '*.mp3' '*.zip' '*.pdf'   # historical blobs
git ls-files -z 'src/assets/**' | xargs -0 du -k                        # live artifact weight
```

Dependency usage was checked by grepping each package name across `src/` and `astro.config.mjs`.
**This method produced one false positive that was caught and corrected** - see Limitations.

## Findings

### F1 - The git pack is 1.59 GiB; the live tree accounts for under 30 MB of it

_Observation._

```
git count-objects -vH
  size-pack: 1.59 GiB       packs: 2       in-pack: 4636
```

Against that, the current committed payload is small: 16.9 MB of images under `src/assets/`, 8.7 MB
of `.cache/docs/`, 6.0 MB under `public/audio/` (71 `.words.json`; zero committed `.mp3`).

History accounts for the difference. Files added and later removed include 27 `.mp3` paths, 18
`.zip`, and 9 `.pdf`, under paths such as `docs/chapters/05/tts/01.mp3` - the pre-Astro Docusaurus
layout, which `.gitignore` still references as `previous-version-w-docusaurus`.

_Inference._ Every `git clone` of this repository transfers ~1.6 GB, almost all of it audio and
archives that no longer exist in any branch. This is the largest single piece of cruft found, and it
falls directly on the constituency the project is trying to serve: `lesson:0001` records an external
contributor blocked for two months by build friction, and `CONTRIBUTING.md` targets exactly that
onboarding path. Note that removing it is not a normal cleanup - it requires history rewriting, with
consequences covered under Recommendations.

### F2 - Committed images are unoptimized

_Observation._ Twelve committed files exceed 500 KB, all images:

| File                                             |   Size |
| ------------------------------------------------ | -----: |
| `src/assets/static/portraits/ajeya_cotra.png`    | 1.7 MB |
| `src/assets/static/portraits/demis_hassabis.jpg` | 1.6 MB |
| `src/assets/static/portraits/kamala_harris.png`  | 1.5 MB |
| `src/assets/reader-screenshot.png`               | 1.2 MB |
| 8 more between 0.5 and 0.8 MB                    |      - |

Total committed image weight under `src/assets/`: 16.9 MB. The project already depends on `sharp`,
and `astro.config.mjs` configures `svgoOptimizer`.

_Inference._ Portrait photographs at 1.5–1.7 MB are one to two orders of magnitude larger than their
rendered size requires. Astro's image pipeline optimizes these at build time, so this is not a
page-weight defect for readers - it is repo weight, paid on every clone, and it compounds F1.

### F3 - Two build-time packages are declared as runtime dependencies

_Observation._ `package.json` lists 26 `dependencies` and 14 `devDependencies`. `@astrojs/check` and
`typescript` are in `dependencies`. Both are used only by `pnpm typecheck` (`astro check`); neither
is imported by any module in `src/`.

_Inference._ Cosmetic for a statically-built site that ships no `node_modules`, since nothing
installs this package as a library. The cost is accuracy of the manifest as documentation rather than
install weight.

### F4 - Four `.gitignore` entries resolve to nothing

_Observation._ Of the paths named in `.gitignore`, four do not exist in the working tree:
`convert.js`, `previous-version-w-docusaurus`, `public/uc/`, `service-account.json`.

_Inference._ `service-account.json` should **stay** regardless - it is a defensive guard against
committing a credential file, and its value is precisely that it fires before the file exists. The
same defensive reading arguably applies to `public/uc/`. `convert.js` and
`previous-version-w-docusaurus` are residue of a migration that completed; they guard against
nothing. Distinguishing the two kinds matters more than the cleanup itself: deleting a defensive
ignore rule to tidy a list is a net loss.

### F5 - The source tree itself is clean

_Observation._ Scanning every non-test `.ts` module in `src/`:

- **Zero** exported symbols with no reference outside their defining file.
- **Zero** `TODO`, `FIXME`, `HACK`, or `XXX` markers.
- Two `/* eslint-disable */` blocks, both wrapping vendored third-party analytics snippets
  (`src/layouts/Default.astro:26`, `src/layouts/Reader.astro:61`).

_Inference._ This is a genuinely tidy source tree, and unusually so for a project of this age. The
finding is recorded affirmatively because the audit's brief was to look for cruft, and reporting only
the four items above without stating that the source scan came back empty would misrepresent the
result.

## Limitations

- **The dependency check produced a false positive.** Grepping for `@iconify-json/cib` returned zero
  references, suggesting an unused dependency. It is used - icons are referenced by prefix string
  (`<Icon name="cib:github" />` at `src/components/Footer.astro:31`), not by package name. Every
  "unused dependency" claim from a name grep is unreliable for this class of package; only the two
  in F3 are asserted, and both were confirmed by their absence from any import.
- **No bundle analysis.** Whether unused JavaScript reaches the browser is unestablished.
- **No `pnpm audit`** or transitive dependency review was run; this audit says nothing about
  vulnerabilities or stale versions.
- **The history scan was type-limited** to `.mp3`, `.zip`, `.pdf`, `.mp4`. Other large blob types in
  history would not have been seen, so F1's attribution is partial - it identifies a sufficient
  cause for the pack size, not necessarily the complete one.
- **No per-blob history sizing.** `git count-objects` gives the total; individual historical blob
  sizes were not enumerated, because doing so on a 1.6 GiB pack is expensive and this VM is
  memory-constrained.

## Recommendations

1. **Decide whether to rewrite history to drop the pre-Astro binaries (F1). Size L, high risk -
   owner decision, not an engineering one.** This would cut clone size by roughly 50×. It is listed
   first because it is the largest effect, _not_ because it is recommended lightly. It rewrites every
   commit SHA, which breaks: existing clones and forks, any SHA referenced in `docs/` records
   (`lesson:0003` and `lesson:0006` cite commit SHAs), and any external link to a commit. Given that
   this is a public repository with outside contributors, the coordination cost is real. A cheaper
   partial alternative is to leave history alone and document the clone size in `CONTRIBUTING.md`,
   with `git clone --depth 1` as the suggested contributor command - that captures most of the
   onboarding benefit at near-zero risk. **Recommend the cheap alternative first.**

2. **Optimize the twelve oversized committed images (F2). Size S.** `sharp` is already a dependency.
   Re-encoding portraits at a sane resolution would reclaim most of the 16.9 MB going forward. Risk:
   low, but note it _adds_ to history rather than shrinking it - the old blobs remain. Worth doing
   only alongside a decision on 1, or accepted as preventing further growth.

3. **Move `@astrojs/check` and `typescript` to `devDependencies` (F3). Size S.** Risk: near-zero;
   verify CI still typechecks, since `pnpm install --prod` is not used anywhere in the workflows.

4. **Remove the two dead `.gitignore` entries; keep the two defensive ones (F4). Size S.** Delete
   `convert.js` and `previous-version-w-docusaurus`. **Keep `service-account.json`** and add a
   comment saying why, so a future tidy-up does not remove it.

5. **No action on the source tree (F5).**

## Disposition

**Pending owner decision. No change is authorised by this audit.**

Recommendations 3 and 4 are trivial and independent; they can be taken without any design discussion.

Recommendation 1 is the consequential one and is explicitly framed as the owner's call: the
engineering trade-off is clear, but the coordination cost falls on a public repository with outside
contributors, which is not a decision this audit should make. The `--depth 1` documentation
alternative is available as a no-risk partial.

Recommendation 2 is only worth doing as part of a decision on 1; on its own it prevents future growth
without reclaiming anything.
