---
schema_version: 2
id: '0011'
uid: 'audit-20260921T212222983606Z-7f656739'
title: 'Incidental findings log: bugs, edge cases and optimizations found in passing'
role: audit
status: draft
summary: 'Append-only log of defects and improvements discovered during unrelated work, so they are not lost or silently fixed.'
created: '2026-09-21'
updated: '2026-09-23'
owner: Markov Grey
supersedes: ''
superseded_by: ''
engineering_document:
  version: 1
  contract_tier: full
  role: audit
  id: '0011'
  uid: audit-20260921T212222983606Z-7f656739
  title: 'Incidental findings log: bugs, edge cases and optimizations found in passing'
  state: draft
  authority:
    kind: point-in-time-evidence
    owner: Markov Grey
    scope: Findings discovered incidentally during other work, repo-wide
  created: '2026-09-21'
  updated: '2026-09-23'
  transition_history: unverified
  transitions: []
  relationships: []
  details:
    as_of: '2026-09-21'
    subjects:
      [
        'cli/**',
        '.cache/**',
        'src/content.config.ts',
        'src/textbook-loader/renderers/audio/renderer.ts',
        'package.json',
      ]
    method: Findings recorded opportunistically as they surface during unrelated work; each entry states whether it was reproduced or merely observed
    limitations:
      [
        Not a sweep - absence from this log means nobody tripped over it and never that the codebase is clean,
        Evidence depth varies by entry because the cost of recording must stay near zero,
        Severity is a first impression assigned at discovery without triage,
      ]
---

# Audit 0011: Incidental findings log: bugs, edge cases and optimizations found in passing

## Scope

`audit:0002`–`0010` are **scoped sweeps**: a dimension was chosen, the codebase examined against it,
and the record closed. This record is deliberately different. It is **append-only and never closes**.
It exists to catch the findings that surface while doing something else — a defect noticed while
running a build, an edge case hit while testing an unrelated feature, an optimization spotted in
passing.

Without a home, those findings have exactly two fates: forgotten, or silently fixed inside an
unrelated commit where no reviewer can see them. Both are bad. This record is the cheap third option.

**What belongs here:** anything real, observed, and not worth interrupting current work for.

**What does not:** anything urgent or dangerous enough to need its own record with acceptance
criteria and a decision trail. Those get a `task` — `task:0022` is the worked example, promoted out
of this log on the day it was found because it could destroy irreplaceable data.

**Boundary — this log does not authorize fixes.** An entry is an observation with evidence, not a
decision to act. Promotion to a `task` is what authorizes work. Entries may be batched into
`task:0020` (standalone hygiene fixes) when several small ones accumulate.

## Method

Entries are recorded when found, with whatever evidence was to hand at that moment. That is the
point — the cost of an entry has to stay near zero or it will not get written.

## Limitations

- **Not a sweep.** Absence from this log means nobody tripped over it, never that it is absent from
  the codebase. Do not cite this record as coverage of anything.
- **Evidence depth varies.** Some entries carry a reproduction and a file:line; others carry an
  observation and a hypothesis. Each entry states which it is.
- **Severity is a first impression**, assigned at discovery without triage, and may be wrong in
  either direction.

## Findings

### F1 — `cli/` is not typechecked, and `@types/node` is undeclared

**Severity:** low · **Evidence:** reproduced · **Found:** 2026-09-21, while preparing `task:0021`

`@types/node` is not a declared dependency. `pnpm exec tsc --noEmit cli/index.ts` reports **7 errors**
(`Cannot find module 'node:fs'`, `Cannot find name 'process'`, two implicit-`any` parameters in
`cli/commands/docs-check.ts:123-124`), while `pnpm typecheck` passes clean. `tsconfig.json` includes
`**/*`, so the exclusion is not from configuration — `astro check` simply does not surface these.

The consequence is that `cli/`, which `pnpm verify` now depends on, has no type coverage. This will
widen as `atlas` grows; `task:0021` alone would add substantially more code there.

**Disposition: RESOLVED 2026-09-21.** `@types/node` declared as a dev dependency, and
`cli/tsconfig.json` plus a `typecheck:cli` script chained into `pnpm typecheck`. All 7 errors were
knock-on effects of the missing types — once declared, the two implicit-`any` parameters resolved on
their own, because `readdirSync` became typed. The gate was verified by introducing a deliberate type
error and confirming it fails; a check that cannot fail is not a check.

### F2 — `.cache/uc/` holds 1.9 GB of irreplaceable audio, gitignored and unbacked

**Severity:** high · **Evidence:** reproduced · **Found:** 2026-09-21, while probing R2 access

88 MP3 files (71 section, 17 chapter) totalling 1.9 GB sit in `.cache/uc/`, which `.gitignore:32`
excludes. This VM has crashed twice in two days. The audio cannot be regenerated cheaply
(`[[atlas-audio-is-frozen]]`), and no backup exists.

**Disposition:** promoted to `task:0023` AC-1. Recorded here because the general lesson is broader
than one directory — gitignored working caches can hold assets whose value nobody has assessed.

### F3 — Stale `.env` values give false confidence about which safety switches are active

**Severity:** medium · **Evidence:** reproduced · **Found:** 2026-09-21, during the pre-merge gate

`.env` contains `SKIP_AUDIO_DOWNLOAD=1`, which has no effect: the variable is declared in neither
`astro.config.mjs`'s env schema nor bridged in `src/content.config.ts:80-90`, so it must be exported
into the shell to do anything. A maintainer reading `.env` reasonably concludes a safety switch is on
when it is not.

This is the proximate cause of the `task:0022` incident and is recorded separately because the
_class_ of problem is broader: `.env` is not validated against the set of variables the code actually
reads, so any typo or retired variable name fails silently and looks configured.

**Disposition:** the specific instance is `task:0022` AC-4. The general case — validating `.env` keys
against a declared set and warning on unknown or ineffective ones — is an unowned improvement.

### F4 — `pnpm verify` peaks at 94% memory commit

**Severity:** medium · **Evidence:** measured · **Found:** 2026-09-21

Sampling `Committed_AS / (MemTotal + SwapTotal)` at 20-second intervals through a full `pnpm verify`
on an otherwise idle VM gave a peak of **94%**, against a standing 90% caution threshold. Ten samples;
the peak fell during the build phase.

This is consistent with the two prior VM crashes and confirms that `verify` alone, with no agent
fleet running, approaches the failure boundary.

**Disposition:** `task:0024`.

### F5 — AST node content lives in `children` _and_ in attributes, with no type-level distinction

**Severity:** medium · **Evidence:** reproduced and measured · **Found:** 2026-09-21, while building `task:0025`

`createNode(name, attributes, children)` suggests children are the only place content lives. They are
not. Five component types put a `SpanGroup` **node inside an attribute**: `Figure.caption`,
`Iframe.caption`, `Video.caption` (`transformer.ts:288,314,340`), `Quote.sourceUrl` (`:294`) and
`Definition.source` (`:321`).

Nothing in the `Node` type — `{name, attributes: Record<string, unknown>, children: Node[]}` — signals
this, so the obvious traversal is wrong. **Measured cost: a `children`-only walk found 1,414 of 1,778
links. 364 citations, 20% of the corpus, were invisible**, overwhelmingly in figure captions, which is
exactly where a textbook cites its sources.

Any code that walks this AST and does not know about attribute-held nodes is silently incomplete. That
includes the existing `traverseNodes` helper in `utils.ts:15`.

**Disposition:** `task:0025` added `allChildNodes()` in `citations/extract.ts` as a local remedy. The
real fix is `task:0015` (discriminated-union AST), and this is concrete evidence for it — a measured
20% miss rate, not a stylistic preference. Worth auditing every other `traverseNodes` caller for the
same defect before then.

### F6 — hyperlinks inside flattened component fields are discarded entirely

**Severity:** low · **Evidence:** hypothesis with a measured residual · **Found:** 2026-09-21

After F5 was fixed, extraction saw 1,770 of 1,778 substantive links. The residual 8 are unexplained by
any traversal bug. The probable cause is `getTrimmedString`, which flattens a table cell to plain text
for `SectionDescription.content`, `Quote.speaker/position/date`, `Video.source` and `Iframe.src` — a
hyperlink in such a field loses its URL before any node is built, so it is unrecoverable downstream.

Stated as a hypothesis: the residual is consistent with it, but the specific 8 have not been located.

**Disposition:** unowned. At 0.45% it does not justify work on its own, and the remedy overlaps
`task:0015`. Recorded so the number is explained rather than mysterious.

### F7 — a joining separator in text reconstruction silently broke pattern matching

**Severity:** low · **Evidence:** reproduced · **Found:** 2026-09-21

While building `task:0025`, a helper concatenating span text inserted a space between spans. Because
Google Docs routinely splits one sentence across several spans, `(Rodriguez, 2020)` became
`( Rodriguez, 2020 )` and matched no citation pattern. **Every unit test passed**, because constructed
fixtures put the citation in a single span; only the real-corpus check exposed it.

**Disposition:** fixed in `citations/extract.ts`, with a regression test using multi-span input. The
transferable lesson is the one worth keeping: a fixture that is tidier than the real data tests the
fixture. The real-corpus reconciliation test is what caught this, and is worth the cost for that
reason alone.

### F8 — A BibTeX key comment claimed a stability guarantee the algorithm does not give

**Severity:** low · **Evidence:** reproduced by test · **Found:** 2026-09-22

`assignBibtexKeys` in `export.ts` documented itself as breaking collisions with a URL digest "so
adding an unrelated entry cannot renumber anyone". The digest does remove the counter dependency, but
the claim is still too strong: within a colliding group the earliest-sorting URL keeps the **bare**
key and the others take a suffix. Adding an entry whose URL sorts earlier than an existing one with
the same base key therefore moves that existing key — and BibTeX keys are what authors type in every
`\cite`.

Found while porting the file under `task:0029`, by a test written to assert the documented property.
The test failed; the algorithm was right and the comment was wrong.

**Disposition:** behaviour deliberately unchanged, so no existing key moves under the port. The two
properties are mutually exclusive: "bare key when unique" and "never changes when a colliding sibling
appears" cannot both hold once two entries want the same base. The bare key is worth more, because
collisions are rare and readable keys are read constantly. The docstring in `commands/export.py` now
states the real guarantee, and both properties are pinned by test — the one that holds, and the
narrower one that does not.

The transferable point: a comment asserting an invariant is not evidence of it. This one survived
because no test ever asked. Where a docstring claims a property, the cheap move is to write the test
that would fail if it were false.

### F9 — The all-sources index could not show the spelling inconsistencies it exists to surface

**Severity:** low · **Evidence:** reproduced by test · **Found:** 2026-09-22

`atlas citations urls` writes an `all-sources.md` index whose own preamble says: "Where a source is
cited under more than one spelling, every spelling is shown — that is how inconsistent citation text
gets found."

It built that list from the per-chapter display lists, which are **deduplicated by URL within each
section**. So a source cited twice in one section as `Chollet, 2019` and `Chollet 2019` contributed
only the first spelling, and the index showed one — hiding exactly the inconsistency it promised to
reveal. Cross-section inconsistencies were shown correctly, which is why it looked like it worked.

Found while porting `urls.ts` under `task:0029`, by a test asserting the documented behaviour.

**Disposition:** fixed in `commands/urls.py`. Spellings are now collected from every instance in the
scan; the section body still deduplicates, because showing one source three times in a reference list
helps nobody. Two tests pin both halves. `citation-report.md` was never affected — it reads the
undeduplicated instances — so no inconsistency was lost overall, only under-reported in the file the
edition-2 authors were actually given.

Same shape as F8, found the same way: a claim in prose that no test asked about.

### F10 — `--redo` re-fetched everything, because a universal claim counted as evidence

**Severity:** medium · **Evidence:** measured · **Found:** 2026-09-22

`atlas citations resolve --redo=<resolver>` exists so that adding a better resolver can be given a
turn at entries a weaker one already answered. Its filter asks "would some _other_ resolver claim
this URL?", and `resolve.ts` excluded `opengraph` by name from that question.

It did not exclude `research-db`, whose `claims()` returns true for **every** HTTP URL — deliberately,
because a local lookup is free. So the question answered yes for everything, and `--redo=opengraph`
targeted **all 380** Open Graph entries rather than the publisher pages `scholar-meta` was written
for. The file's own comment promised the opposite: "retries only the pages that resolver can actually
help with, instead of re-fetching hundreds of blog posts that Open Graph already handled correctly."

Measured on the committed store: 539 targets under the old filter, **191 under the corrected one**
(159 never-resolved, plus 32 that a selective resolver genuinely claims — 20 publisher pages and 12
arXiv papers that had fallen through to Open Graph). At the polite 3-second interval that is roughly
27 minutes against 10, over other people's free infrastructure.

This is the likely reason the first `--redo=opengraph` run was killed by a timeout rather than
finishing.

**Disposition:** fixed in `python/atlas_citations/resolvers/base.py` and `commands/resolve.py`.
Resolvers now declare `selective`, and only selective ones count as evidence that a redo is
worthwhile. Four tests pin it, including one asserting that the unselective resolvers really do claim
everything — the property the flag records, rather than a restatement of the flag.

Third finding in this cluster, all found by writing a test for a claim made in prose (see F8, F9).
The pattern is worth naming: **this codebase's comments are unusually detailed, and that made them
unusually load-bearing.** A detailed comment reads as specification, so a reviewer checks the code
against it and stops. Where a comment states a property, the test that would fail if it were false is
cheap and is the only thing that keeps the comment honest.

### F11 — The TypeScript arXiv resolver swallowed whole author blocks as one name

**Severity:** medium · **Evidence:** reproduced, 3 entries affected · **Found:** 2026-09-23, by the owner reading the rendered page

The rendered bibliography showed entries like:

> Pokorny, O. &lt;. &lt;. &lt;. &lt;. A. &lt;. &lt;. &lt;. &lt;. A. &lt;. &lt;. &lt;. &lt;. A. … (several hundred more)

The cause was in `arxiv.ts`, which extracted authors with
`/<author>\s*<name>([\s\S]*?)<\/name>\s*<\/author>/g`. arXiv emits
`<arxiv:affiliation>` between `</name>` and `</author>`, so that pattern could not match the first
author — and the lazy quantifier therefore ran on until it found a `</name></author>` pair with
nothing between them, swallowing every author in between into a single `given` field. One entry's
`given` was **96,295 characters** of raw Atom XML. The render layer then abbreviated each
whitespace-separated token to an initial, producing hundreds of `<.` fragments.

Three entries were affected — `2501.14249` (1,158 authors), `2206.04615` (451), `2303.08774` (281) —
which is to say the three with the largest author lists, because a long list is what makes the
regex's failure mode visible.

This is precisely the class of defect `task:0029` moved to a library to eliminate. `feedparser`
parses all three correctly; the ported resolver was already immune when the bug was found.

**Disposition:** all three entries re-resolved and clean. A regression test
(`test_resolver_arxiv.py::TestAffiliations`) pins the affiliation shape and asserts that no author
field contains markup or exceeds a plausible length. A second guard was added at the render layer
(`src/lib/bibliography.ts`, `implausibleName`), because `sources.yaml` is committed and hand-editable
— a bad value can arrive with no resolver involved, and no data defect should be able to disfigure a
page. A corrupt `given` now drops while its `family` survives, so the entry degrades rather than
disappearing.

A fourth entry, a PubMed record, carried Crossref's inline markup in its title
(`the game of <i>Diplomacy</i>`). CSL fields are plain text and a template escapes tags rather than
interpreting them, so they reached the reader. Fixed at the resolver (`crossref.py`, `_clean`) and
again at the render layer.

**The lesson is not "regex cannot parse XML"** — everyone already says that, and the original author
knew it and wrote the constraint down. It is that the file's own header listed what its parsing could
not handle and this case was not on the list, because the limitation was reasoned about rather than
tested against real feeds. The three worst-affected entries were in the corpus the whole time.

### F12 — A transient network failure is recorded as a permanent resolver verdict

**Severity:** medium · **Evidence:** reproduced · **Found:** 2026-09-23, while repairing F11

While re-resolving the F11 entries, arXiv briefly failed under three rapid requests. The resolver
treated that exactly as it treats "this paper does not exist": it returned `None`, the chain fell
through, and Open Graph answered instead — giving the entry a bare title and **zero authors** where
arXiv would have given 1,158. The same fetch succeeded on the next attempt, three times in a row.

Because resolution is sticky by design, that verdict would have been permanent. Nothing distinguishes
it in the store from a legitimate Open Graph result.

The concerning implication is about data already collected: **386 entries are currently attributed to
`opengraph`**, and there is no way to tell how many of those are genuine long-tail pages versus
entries where a better resolver happened to fail transiently during the ~75-minute run. The
`--redo` mechanism (F10) is the repair tool, but nothing signals that a repair is warranted.

**Disposition:** unfixed, recorded. The minimal fix is to distinguish _declined_ from _unreachable_
in the resolver contract — `ResolveResult | None` cannot express the difference today — and to retry
an unreachable service once or twice before falling through. A larger version would record the
failure in the entry so `--redo` could target exactly the entries that deserve another attempt. Worth
a task; not worth inventing a design inside a bug-fix session.

## Recommendations

1. **Close F1 before `task:0021` adds `cli/` code.** Declaring `@types/node` and getting `cli/` into
   a typechecked path is a few lines and prevents a growing blind spot in code that `verify` already
   trusts.
2. **Treat F2's general form as a standing question**, not just a one-off backup: for each gitignored
   cache directory, state whether its contents are regenerable. `.cache/docs/` is committed precisely
   because it is not cheaply regenerable; `.cache/uc/` has the same property and the opposite
   treatment.
3. **F5 is the strongest available argument for `task:0015`.** It converts "a discriminated union
   would be tidier" into "the current shape caused a measured 20% data loss in the first consumer that
   walked it". Any prioritisation of `task:0015` should cite this number.
4. **Audit the other `traverseNodes` callers for the F5 defect** before `task:0015` lands. The helper
   at `utils.ts:15` recurses through `children` only, so every caller inherits the blind spot.
5. **Keep F3's general case unowned until someone hits it again.** One instance is not yet evidence
   that `.env` validation earns its complexity, and `PRINCIPLES.md` §10 (YAGNI) applies. Recorded so
   that a second instance is recognised as a pattern rather than another one-off.

## Disposition

This record stays in `draft` indefinitely, by design. The audit schema offers `draft`, `final` and
`superseded`; an append-only log is never `final`, and calling it so would assert a completeness it
explicitly disclaims. `draft` is the honest choice, not a pending action.

New findings append to **Findings**. Entries are struck through with a pointer when promoted to a
task or fixed, rather than deleted, so the log stays a history of what was noticed and what came of
it.
