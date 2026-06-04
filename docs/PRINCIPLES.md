# Principles

The engineering principles this project actually applies, with the code that demonstrates each one. If something here doesn't match the codebase, the code or the doc is wrong — fix one or the other in the same change.

Generic principles (SOLID, GRASP, coupling/cohesion vocabulary, etc.) are not repeated here. Read a textbook for those.

---

## 1. Single source of truth for build behaviour

Every env-mode _decision_ is made in `src/lib/build-mode.ts`. No other module is allowed to interpret raw env vars to decide what to fetch, skip, or render.

There's one carefully-scoped exception: `content.config.ts` is the only file that may _bridge_ `BuildMode` flags onto `process.env.SKIP_PDF` / `SKIP_AUDIO`. This bridge exists because the PDF and audio renderers are constructed several layers deep (inside `TextbookLoader.load()`), where threading a `BuildMode` argument through would be invasive. The bridge keeps the decision-making in one place even though the _consumption_ happens further down the call tree.

Modules that legitimately consume the bridged values:

- `src/textbook-loader/loader.ts:59` reads `process.env.SKIP_PDF` to gate `ChapterPdfRenderer`
- `src/textbook-loader/loader.ts:66` reads `process.env.SKIP_AUDIO` for the audio renderer's `skipGeneration` flag
- `src/textbook-loader/renderers/audio/renderer.ts:53` reads `process.env.SKIP_AUDIO_DOWNLOAD` as a local-dev escape hatch

These reads don't _decide_ anything — they apply a decision already made upstream. If a new module needs to gate on creds, it must consume `BuildMode`, not probe env.

**Why:** before this principle was applied, the same env probe (`if (!process.env.SKIP_PDF)`) appeared in five files, each drifting independently. Extracting `BuildMode` collapsed five decisions into one. Three concrete benefits this purchases:

- One place to test. `build-mode.test.ts` covers every env permutation in 16 unit tests; adding a new flag means adding one test, not five.
- One place to read. A new contributor wanting to understand what gates the PDF render finds the answer in `build-mode.ts`, not by grepping `process.env.SKIP_PDF` across the codebase.
- One place to change. Adding a new mode (e.g. "contributor-with-image-hosting") is a switch case in `detectBuildMode`, not a parallel edit across 5+ files.

The bridge is a pragmatic compromise; the alternative (passing `BuildMode` through `TextbookLoader.load()` to the renderers) is on the table if the renderers grow more mode-dependent behaviour.

**Reference:** `src/lib/build-mode.ts`, `src/content.config.ts` lines 22–46, `src/textbook-loader/loader.ts:59-66`.

## 2. Fail loud, not silent

When the build can't do the thing it's being asked to do, it throws an error that names the specific input and tells the user how to fix it. Generic "something went wrong" messages are a bug.

**Why:** the original cache-miss error was `"cacheOnly mode is enabled"` — true but useless. The new one names the docId, distinguishes "cacheOnly" vs "no creds", and points at `CONTRIBUTING.md`. Contributors who hit it can self-serve.

**Reference:** `src/textbook-loader/gdocsdk.ts:48-58` (`fetchDoc` cache-miss error).

## 3. Defence in depth

A skip behaviour reachable through multiple paths is harder to break by accident. Both `BuildMode.fetchFromGoogleDocs` (passed as `cacheOnly` to the loader) AND `process.env.SKIP_PDF` / `SKIP_AUDIO` (read by the renderers) are set when credentials are absent. Either one alone would suffice; together, no renderer can silently start hitting Google or R2 just because someone removed a single guard.

**Reference:** `src/content.config.ts:44-46` (sets `process.env.SKIP_PDF`/`SKIP_AUDIO` from `BuildMode`).

## 4. Reproducibility

Same source + fresh tooling should always produce the same artifacts. This is asserted as a test invariant.

**Reference:** `src/textbook-loader/loader.test.ts` — "contentHash is deterministic across fresh loader instances".

**Where it does NOT hold (and why):** `loadChapter(X)` called twice on the _same_ loader produces different hashes because the `Transformer` accumulates per-textbook counters (figure numbers etc.) as instance state. This is intentional — "Figure 3.2" requires global context — and documented in [`ARCHITECTURE.md`](./ARCHITECTURE.md) under "Content pipeline / Transformer".

## 5. Observability — one banner, no spelunking

The build prints exactly one structured line at startup declaring the resolved mode:

```
[atlas] BuildMode: contributor, cache-only, no PDF, no audio, no R2 audio pull, no Algolia indexing, search enabled
```

If you want to know what the build is doing, the first line of output tells you. No need to grep env vars or check 3 different files.

**Reference:** `src/lib/build-mode.ts` `formatSummary`, `src/content.config.ts:34`.

## 6. No conditional UI for missing infrastructure

When infra has a public-by-design surface (Algolia search-only key, public CDN URLs), the UI renders the same for everyone. Conditionally hiding features for contributors creates rendering complexity and a worse contributor experience without solving any real problem.

**Why:** an early plan proposed `if (hasAlgoliaConfig) <SearchBox />` to hide search for contributors without `.env`. But the Algolia keys needed are public-by-design — they're already shipped in the deployed HTML. Hiding the box was solving a problem that didn't exist. Instead, the public keys are committed as `default:` values in `astro.config.mjs`.

**Reference:** `astro.config.mjs:24-27`, `src/components/DocSearchProvider.astro` (no conditional rendering).

## 7. Layered testing

Each test layer catches a specific class of regression. The default `pnpm test` runs four pure layers in ~7s; a separate `pnpm test:smoke` runs the heavy end-to-end build.

| Layer          | What it protects                                            |
| -------------- | ----------------------------------------------------------- |
| Pure unit      | Env decision logic — every permutation has an expected mode |
| Storage        | Cache-hit/miss decision tree and error contents             |
| Integration    | Loader correctness against real cache fixtures              |
| Snapshot       | Transformer AST structural drift                            |
| Smoke (opt-in) | The whole pipeline produces real chapter HTML               |

**Reference:** `docs/ARCHITECTURE.md` "Test layers", and the `test` files under `src/` and `tests/`.

## 8. No backwards-compatibility cruft

When we change behaviour, we change it atomically. No `if (process.env.NEW_BEHAVIOR)` toggles, no compatibility wrappers for "the old way", no commented-out dead code. The repository is small enough and the contributors few enough that the cost of a cleanup commit is lower than the cost of carrying scar tissue.

**Reference:** check `git log` — the Track A commits delete or rewrite, they don't accumulate.

## 9. High cohesion within modules, loose coupling between

Each module has one job, and only the smallest possible surface crosses module boundaries.

- `src/lib/build-mode.ts` is a pure-function module — zero imports from anywhere else in the codebase, no I/O, no side effects. It's testable in isolation because it doesn't _do_ anything except return a typed decision object.
- `src/textbook-loader/` is its own module. Only `content.config.ts` imports from it (consuming `TextbookLoader`), and `loader.ts` itself only crosses to `src/lib/build-mode.ts` for the `BuildMode` type. The renderers (`pdf/`, `audio/`) are submodules within textbook-loader and don't reach outside it.
- `src/components/nodes/` is one component per AST node type, dispatched by `NodeRenderer.astro`. Each component handles its node and recurses through `NodeRenderer` for children. No node component knows about any other node component.

**Why:** this is what makes the test suite tractable. The layered tests (unit / storage / integration / snapshot) only work because the module boundaries are actually clean — you can test the loader against committed cache fixtures without standing up the Astro layer, because the loader doesn't depend on Astro. If `loader.ts` started importing components, that property breaks.

**Failure mode to watch for:** "I just need one thing from `src/components/` in the loader." Don't. Either lift the type into `src/textbook-loader/index.d.ts` or rethink the design.

**Reference:** `src/lib/build-mode.ts` (zero internal imports), `src/textbook-loader/index.d.ts` (the module's public types), `src/components/nodes/` directory structure.

## 10. YAGNI — don't speculate, but build when demand is real

We build what's needed for the current task. Not what might be needed someday. **But also:** when demand is real and recurring, build the layer before the next demand event so the project doesn't have to be retrofitted under pressure.

Concrete examples from Track A where the YAGNI side saved us complexity:

- The original plan proposed conditional rendering for the search box "in case Algolia isn't configured." We dropped it — Algolia's public keys are committed as defaults, so the case being designed-around doesn't exist.
- Image hosting for contributors was discussed and deferred. Captions-only is acceptable today; building R2-served image distribution before anyone has asked for it would have added a service surface for hypothetical demand.
- The `BuildMode` interface has exactly the flags the current code needs. No `enableExperimentalFoo` placeholders.
- A certification program (auth, quizzes, anti-gaming, credentials) has been requested by ~6 readers. We didn't even create an interest-list page: that commits the project to a follow-up obligation we can't fulfill. The demand-vs-scope ratio is wrong.

Concrete examples where the "build when demand is real" side won:

- Locale-aware URL routing was originally deferred under YAGNI ("wait until the first non-English textbook is ready"). When real, recurring translator demand surfaced (Spanish via RiesgosIA + maintainer confirmed many more), we recalibrated. Building the routing scaffold with English-only is cheaper than refactoring routing every time a language lands. The trigger isn't "could someone want this someday" — it's "have multiple people asked, are they actively waiting, will the next ask come within months."

**Why:** every speculative abstraction has a non-zero maintenance cost and a non-zero chance of being wrong about future requirements. Three duplicated lines are cheaper than the wrong abstraction. When demand actually shows up, the refactor is informed by real constraints. The calibration is: **named users with concrete needs flip YAGNI from "defer" to "build now"**.

**Failure mode to watch for (over-build):** "while I'm in here let me add an extension point." The extension point is YAGNI debt unless the next concrete user is already named.

**Failure mode to watch for (under-build):** ignoring a clear pattern of demand because no single requester is "blocking." If 5+ people have asked the same question over 6 months, the next person isn't hypothetical — they're already in the queue.

**Reference:** the Track A trade-offs documented in `docs/ARCHITECTURE.md` (image hosting deferred; conditional Algolia rendering deleted). The locale-routing scaffold call documented in `docs/ROADMAP.md` "Now — Locale-aware routing scaffold."

## 11. Type safety where it actually catches bugs

TypeScript strict mode is on. Most of the codebase uses precise types — `BuildMode`, `Textbook`, `Chapter`, `Section`, `ChapterDefinition`, etc. are all named structural types.

The exception is the AST `Node`:

```ts
export type Node = {
  name: string;
  attributes: Record<string, unknown>;
  children: Node[];
};
```

`name` is `string` (not a union of the actual node names) and `attributes` is `Record<string, unknown>`. This is acknowledged debt — see `docs/ROADMAP.md` "Next" for the discriminated-union refactor that would let `NodeRenderer.astro` type-narrow on `node.name` and access strongly-typed attributes.

**Why honest about debt rather than pretending it's intentional:** TypeScript's value is catching the class of bug where you read a field that doesn't exist or pass the wrong shape. We currently lose that protection at the AST boundary. The cost of the looseness shows up as runtime checks and TODO/FIXME-style comments in node components. It's the right cost to defer (the Transformer produces dozens of node kinds; a discriminated union is a meaningful refactor) but it's a real cost.

**Reference:** `src/textbook-loader/transformer.ts:5-9` (loose Node type), `src/components/NodeRenderer.astro` (where the looseness shows up).

## 12. Accessibility is non-optional for a public textbook

The target audience is educators and students — many of whom rely on assistive technology. Semantic HTML, keyboard navigation, alt text on figures, sufficient color contrast, and screen-reader-friendly equation rendering all matter.

We haven't done a formal accessibility audit yet. Known gaps:

- `Figure.astro` currently passes `alt=""` to `<Image>` — the actual alt text from the Google Doc isn't threaded through.
- The dev-mode "image not available" hint is rendered as a styled `<div>`, not announced to screen readers.
- No automated accessibility tests (e.g. axe-core in CI).

This principle is stated _aspirationally_ — we want the codebase to follow it, and we know it doesn't fully yet. The audit and remediation are tracked in `docs/ROADMAP.md` "Next". The point of putting the principle here despite the gaps is to prevent future PRs from making the situation worse without a deliberate decision.

**Reference:** `src/components/nodes/Figure.astro` (the `alt=""` gap).

## 13. The public API is the URL space

This project has no exported JS/TS API. The "public contract" with users and the wider web is the URL structure:

- `/chapters/v{version}/{chapter-slug}/{section-slug}` — canonical chapter URL
- `/read` — top-level table of contents
- `/chapters/{chapter-slug}/` and `/chapters/{N}/` — redirect aliases (set up in `astro.config.mjs`)
- Asset URLs under `/_astro/` — Astro-managed, not stable

Breaking any of these breaks every external link to the textbook (course syllabi, social-media shares, the deployed search index pointing at old slugs). Treat changes to these the way a library would treat changes to its exported types.

**Practical implication:** if you rename a chapter slug or restructure the URL space, add a redirect. Don't just change the route handler.

**Reference:** `src/pages/chapters/` route handlers, `astro.config.mjs` `redirects` block, `src/textbook-loader/utils.ts:25` `slugify`.

## 14. Explicit non-goals

Some choices are easier to defend if you say them out loud. The current explicit non-goals:

- **No MDX/markdown migration of the textbook source.** Google Docs is the editorial surface — see `docs/ARCHITECTURE.md` "Editorial surface — why Google Docs."
- **No image hosting for contributor builds in v1.** Captions-only is the accepted contributor experience. Track D could revisit if image rendering becomes a common contributor need.
- **No microservices split.** The site is a static build; the maintainer-side pipeline is a single Node process. It stays a monolith.
- **No public JS/TS API.** The site is the deliverable; library extraction is not in scope.
- **No authentication / user accounts.** Readers are anonymous; comments and editing happen in the Google Docs source.
- **No certification program.** Multiple requests (~6 over months) for a certification with quizzes, accounts, anti-gaming, and credential issuance. Demand-vs-scope ratio doesn't justify the engineering. Track the interest count in ROADMAP; don't even create an interest-list page (that creates a follow-up obligation we can't yet fulfill).
- **No automated Formspree-to-data-layer pipeline.** Submissions are reviewed in a queue before any data lands. Some are spam, dupes, or not serious; auto-write would either corrupt the data layer or require unmaintainable heuristics.
- **No EPUB/MOBI/LaTeX exports for now.** Single asks. The per-chapter PDFs + the planned whole-book PDF cover most e-reader use cases. LaTeX specifically conflicts with the Google Docs source-of-truth.
- **No hosting of external curricula on the Atlas platform.** Inquiries exist (CAIF); architectural change is much bigger than the request implies. Defer until a concrete partnership decision.

**Why:** non-goals get re-litigated otherwise. Without this list, every refactor proposal that touches one of these areas spawns a "should we also...?" debate. Writing the list down means re-opening one of these is a deliberate act with a documented previous decision to argue against.

**Reference:** `docs/ROADMAP.md` "Not planned" section restates the same non-goals with longer-form rationale.

## 15. Cache content is a public artifact (privacy)

`.cache/docs/` is committed to the repo as the contributor-build unlock (see [`ARCHITECTURE.md`](./ARCHITECTURE.md) "Why a committed cache"). Authors sometimes paste API keys, internal URLs, or draft notes into Google Docs while editing — the cache is about to become a public artifact, so every cache-content commit MUST be preceded by a secret-scan.

The scan procedure lives in `.cache/docs/README.md`. It runs a small list of high-signal credential patterns (AWS keys, OpenAI/Anthropic/GitHub tokens, PEM private keys, JWT shapes) rather than fuzzy keyword matching — the latter produces too many false positives on a textbook about AI safety, where the words "secret", "token", and "API key" appear as concepts dozens of times. The scheduled content-refresh workflow (Track B.6, pending) will automate this scan.

**Why this principle exists:** it's the only privacy-bearing rule in the project right now. The service account scope is already `documents.readonly` (minimum necessary). The R2 keys never touch the public repo. The Algolia search-only key is public-by-design. The single risk surface is "what shows up in a Google Doc and gets committed via the cache" — so we make that scan procedure mandatory and explicit, and bake it into the automation that will run on every refresh.

**Reference:** `.cache/docs/README.md`.

---

## 16. Tests reflect user outcomes, not implementation

Tests exist so a contributor running `pnpm test` before opening a PR can tell whether their change broke a user-observable behavior — and, when something does break, the failure message tells them what reader, contributor, translator, or maintainer is affected. Tests are not for sanity-checking code we already wrote against itself; that is true by construction (the code does what the code does) and the resulting tests rot the moment the implementation is refactored.

Two practical consequences flow from this stance, and both are enforced in the test files themselves rather than living only in this document:

1. **Every `describe`/`it` block in this repo has a 1–2 sentence comment above it that names the user-observable consequence of failure.** If you can't write such a comment in two sentences, the test is too broad, too coupled to implementation, or genuinely not earning its place — delete it instead of annotating it. Read any test file under `src/textbook-loader/` or `tests/` for examples.
2. **Prefer snapshot tests for stable output formats** (HTML, markdown, Typst, JSON shapes consumed by external systems). One snapshot per format gives the same regression signal as dozens of literal-string unit tests, and refactors regenerate it in one place. See `src/textbook-loader/renderers/output-snapshots.test.ts` and `tests/smoke/url-stability.smoke.test.ts`.

### The 7 ISTQB testing principles, applied to this project

The ISTQB Foundation Level identifies seven principles that hold across most software testing. They're useful here because they make the contextual choices above defensible rather than arbitrary. Each is restated in one sentence, then applied to this project's specific context.

1. **Testing shows the presence of defects, not their absence.** A green suite tells us we didn't find regressions with the tests we have, not that the site is correct. So we design tests to _find_ defects — boundary cases, silent-failure modes, contracts with external systems — rather than to mirror code we already wrote. The clearest example is `src/textbook-loader/transformer.edge-cases.test.ts`, which deliberately exercises malformed Google Docs inputs (wrong title separators, missing SUBTITLE, appendix-style titles) to pin down silent fallbacks that would otherwise ship as broken metadata.

2. **Exhaustive testing is impossible — prioritize.** We can't test every input combination, so we explicitly weight the test budget toward (a) external-system contracts that drift without notice (Google Docs, Algolia, ElevenLabs/Gemini, R2, axe-core), and (b) failure modes that are silent in the rendered output. We don't write a test per AST node type or per Typst function name; we write one snapshot per output format that catches the whole class of changes in one diff.

3. **Early testing.** Most code in this repo predates its tests, so "shift left" is not the operative framing. Instead, the equivalent here is: when _adding_ new features, the test that justifies the feature should be written together with it, framed in terms of the user-observable behavior it enables — not "the code does what the code does."

4. **Defect clustering.** Defects concentrate in a few modules. In this project the cluster is the Google Docs → AST transformation: parser brittleness, format-contract violations, slug derivation. That's why `transformer.edge-cases.test.ts` is the highest-effort test file in the repo and `markdown-renderer.test.ts` no longer exists — pure functions over a stable AST have low defect density and earn one snapshot, not 38 unit tests.

5. **Pesticide paradox.** Tests that pin literal output strings (specific markdown wrappers, Typst function names, intro phrases) lose value fast: any deliberate refactor breaks them all simultaneously, training a "rubber-stamp the diff" reflex that defeats the suite. We avoid this by preferring snapshot tests for output formats (one intentional regeneration covers the whole change) and by _not_ asserting on copy text, intro phrases, or arbitrary thresholds.

6. **Testing is context-dependent.** This is the load-bearing principle for the shape of our test suite. The project is a static-content site with no concurrent state, no auth, no live mutations. Failure modes that matter are: build crashes, pages render incorrectly, URLs change silently, search/audio/PDF break, accessibility regresses. Almost all of these are observable in built output, so the test budget weights toward snapshot tests of rendered output (`output-snapshots.test.ts`), URL stability (`tests/smoke/url-stability.smoke.test.ts`), and axe-core a11y (`tests/a11y/`) — not unit tests of internal helpers. An enterprise SaaS would invert this; we are not that.

7. **Absence-of-errors fallacy.** A 100% green suite doesn't mean the textbook is good. It means we haven't broken the things we know how to test. Reader experience — does the prose actually read coherently, is the audio listenable, does the search return useful results — is not, and should not be, expressed as a unit test. That layer lives in maintainer review, beta-reader feedback, and axe-core + manual a11y checks. The test suite's job is to catch _regressions in things we already decided about_; deciding whether the things themselves are good is a different activity.

### What makes a test belong in this repo

- It has a 1–2 sentence justification comment above it that names the user-observable consequence of failure. Without this, the test is either too broad or doesn't earn its place. New PRs adding tests must include this comment.
- Prefer snapshot tests for stable output formats; one signal, one acknowledgment when the change is intentional.
- Prefer behavioral/contract tests for boundaries with external systems (Google Docs format, ElevenLabs/Gemini, R2, Algolia, axe-core rule IDs).
- Don't assert on literal copy text, intro phrases, arbitrary thresholds, or the invocation shape of mocked external calls. These encode preferences or test the mocks rather than the system.
- Don't write tests whose justification comment is "this verifies that `foo` returns what `foo` currently returns." That's the implementation-coupling smell — delete the test.

**Reference:** [`docs/ARCHITECTURE.md`](./ARCHITECTURE.md) "Test layers" describes _where_ tests live; principle 7 above describes the layer structure; this principle describes _what makes a test belong at any layer_. The behavioral-justification rule is also restated in [`CONTRIBUTING.md`](../CONTRIBUTING.md) so first-time PR authors see it in context.

---

## What we deliberately don't worry about (and why)

The classical SE curriculum covers many things that genuinely don't apply to this codebase. Listing them here so the omissions look deliberate rather than accidental:

| Concern                                                    | Why we skip                                                                                                                                                                                                    |
| ---------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Liskov substitution / deep inheritance hierarchies**     | We have almost no inheritance. The two renderers (`pdf/`, `audio/`) are sibling classes with no shared base. Adding LSP discipline to a codebase without subclasses is theatre.                                |
| **Concurrency, locking, race conditions**                  | The build is a single-threaded Node process; the deployed site is static HTML behind a CDN. No shared mutable state across requests.                                                                           |
| **CAP / distributed-system trade-offs**                    | Cloudflare R2 is the only external service. Writes happen from one machine (the maintainer's local build or one CI worker). Not a distributed system.                                                          |
| **SemVer / API versioning**                                | No public JS/TS API. URL versioning uses `/v1/` path segments (principle 13).                                                                                                                                  |
| **Microservices / SOA boundaries**                         | Static site monolith. Stays one.                                                                                                                                                                               |
| **Database transactions, migrations, indexing strategies** | No database.                                                                                                                                                                                                   |
| **Performance budgets, scalability**                       | Static site behind a CDN handles essentially any read traffic. Build time matters (~30s contributor / minutes maintainer with PDFs+audio) but isn't a daily concern; if it becomes one, we'll add a principle. |
| **Internationalization framework**                         | `language: 'en'` is in the data model; v1 is English-only. When a second language is actually being written, we'll add policy then. (Principle 10 — YAGNI.)                                                    |

If one of these stops being skippable, add it as a principle here with a code reference.

---

## What this document is not

- Not a SOLID/GRASP primer. Read a textbook.
- Not a list of every coding convention. The codebase isn't large enough to need one.
- Not a place to copy generic principles you might want someday. Each entry above earned its place by removing real complexity from the actual code OR being load-bearing for the project's audience (e.g. accessibility for a public textbook).

If you want to add a principle here, the test is: can you point at the _specific_ code that exemplifies it, and the _specific_ problem it solves in _this_ project? An aspirational principle (like §12 accessibility) is fine, but it has to name the gap honestly.
