---
roadmap:
  version: 1
  id: roadmap
  summary: Where the codebase is going: Now, Next, Later, and explicitly Not planned.
  status: current
  owner: Markov Grey
  updated: '2026-09-21'
---

# Roadmap

Where this codebase wants to be, and why. This complements [`TODO.md`](./TODO.md) (tactical, local, checkbox-driven) with strategic direction.

Items are bucketed by horizon, not by priority within a bucket. Each item names the principle, code area, or constraint that motivates it.

## How to read this roadmap

This file is sequenced intent, not a task list. Three conventions make it usable when reality diverges:

- **Commitment bands.** Now, Next (1–3 months), and Later (3–12 months) are horizons, not deadlines. "Now" items are the active commitment set; "Next" and "Later" items are planned intent whose resourcing is not yet confirmed. Moving an item between bands is expected and unremarkable — each item's break trigger says when to do it.
- **Record links.** `task:NNNN` → `docs/tasks/`, `adr:NNNN` → `docs/adr/`, `audit:NNNN` → `docs/audits/`. A linked task record is the bounded, acceptance-tested unit of work behind an item; a linked audit is the evidence for its sequencing. The live state of those records is reconciled at the bottom of this file, so a reader can tell what has actually moved.
- **Assumptions and break triggers.** Significant items state what is being assumed and the observation that would change the plan. When reality diverges, the trigger names which commitment to revisit — and updating this file is the first act after one fires.

**Calibration.** The bands were last calibrated 2026-09-21. The Now items were drafted in the 2026-06 sweep and several have not landed: the format pass is not in the verify chain (`pnpm verify` runs lint → lint:actions → typecheck → test → build → test:smoke → test:a11y, no `format:check`), and the locale routing scaffold is not built (`getTextbooks` in `src/lib/textbooks.ts` still filters `language === 'en'`). That staleness is why the reconciliation section exists — check it before treating any item as in-flight.

---

## Context — the 2026-06 re-engagement sweep

After several quiet months, a stack of signals accumulated that justifies a coordinated burst of work rather than picking items off one at a time:

- Translators waiting to contribute (Spanish via RiesgosIA confirmed; the maintainer reports "a lot" of other interest)
- ~24 unprocessed cohort submissions in Formspree (Feb 2026 → May 2026)
- ~25 contact-form messages including detailed errata, chapter-rework offers, a Chrome/Safari interactive-graphics bug, an audio-glitch report, donation interest, and ≥6 unsolicited certification-program requests
- The hero metric on `/teach` undercounts students by ~390 because the page sums `participants` only, ignoring `estimatedParticipants` (real documented total is ~1,142; backlog adds another ~500+)
- Maintainer wants the glossary refactored to make adding new terms easy; the auto-linker is also over-aggressive (Rieke: "attention" matched to the ML definition in a non-ML context)
- Existing audio output quality is flagged as poor; a fork exists that adds CBR re-encoding + AssemblyAI word-level timestamps + synced transcript highlighting

The common pattern: **work that should have flowed through self-serve mechanisms accumulated in the maintainer's inbox instead**. The fix is partly catch-up (process the backlog, ship the bug fixes, answer the asks), partly mechanism-building (errata widget, cohort intake script, role-based contribution docs) so the next 12 months don't require another sweep.

**Since the sweep (2026-09-21):** the deep scaling audits (`audit:0007`–`audit:0010`) traced the four axes this roadmap now has to serve — multiple editions and languages, new content types, audio regeneration economics, and external-integration failure modes. Their findings are baked into the dependency and break-trigger notes below rather than restated. The audits are point-in-time evidence with all recommendations pending owner decision: an audit supplies sequencing evidence; the owner's decision converts it into a commitment.

The items below reflect that direction. Items dated earlier than this sweep are preserved with their original framing.

---

## Now — committed focus (calibrated 2026-09-21)

### Format-the-codebase pass (then re-enable format:check in verify)

`prettier --write .` against the existing codebase as a single formatting-only commit, then add `pnpm format:check` to `pnpm verify`. Currently `pnpm format` exists as a manual tool but format enforcement is deferred because (a) the bulk reformat hasn't happened and (b) `prettier-plugin-astro` can't parse one `.astro` file (HTML comment inside what it parses as JSX).

This should land before any big refactor (discriminated AST, courses migration) so we don't fight prettier mid-PR.

_Motivated by:_ finishing the bulletproof pass cleanly — verify currently covers lint + typecheck + tests + build + smoke, but not formatting.
_Code area:_ big format-only commit across `src/`, then a one-line addition to `pnpm verify` in `package.json`.
_Depends on:_ nothing. _Blocks:_ the discriminated-union AST refactor (Next) and any other broad multi-file change.
_Assumes:_ no in-flight branch needs a semantic diff against unformatted code. _Break trigger:_ if a large refactor must land first for external reasons, reformat immediately after it — the failure this item exists to prevent is prettier churn inside a semantic PR.

### Locale-aware routing scaffold (English-only)

Build the `[lang]` URL segment, dynamic `<html lang>`, hreflang alternates, and multi-language helpers in `src/lib/textbooks.ts` **now**, with English as the only available language. English stays at `/chapters/v1/...` (no locale prefix — principle #13: don't break URLs already published); new languages get `/es/chapters/v1/...`, `/fr/chapters/v1/...`, etc. Adding a new language becomes a one-line `TEXTBOOK_EDITIONS` entry in `data.ts`.

The visible language switcher does **not** exist yet, in any form. The only selector component today, `src/components/VersionSelector.astro`, lists editions (`getTextbooks()` → `Edition {n}`) and navigates to `/read/{version}` — it has no language dimension at all (`audit:0007` F1). Building this scaffold includes **replacing** that component with a language-aware one; nothing is being toggled on.

_Motivated by:_ translator demand is real, not hypothetical. Building this layer once now is cheaper than refactoring routing each time a language lands.
_Code area:_ `src/pages/chapters/[version]/[chapter]/[section].astro` (introduce `[lang?]` segment), `src/lib/textbooks.ts` (drop the `.filter(t => t.data.language === 'en')`), `src/layouts/Reader.astro` and `Default.astro` (dynamic lang attr), `src/components/BaseHead.astro` (hreflang). The original code-area list missed two subsystems the audits added: `src/textbook-loader/algolia.ts` (`audit:0007` F2 — indexing a second language under the current version-only delete filter would wipe the English index) and `src/data/chapter-timing.ts` (`audit:0007` F3 — `chapterTimings` is keyed chapter/section only, so a Spanish page would resolve English narration and word timings via `resolveSectionAudio`).
_Depends on:_ nothing in flight. _Blocks:_ effectively all translation work — `audit:0007` F1 calls this gap "the dependency root" for F2 (search), F3 (audio), F4 (a partial translation cannot ship; the edition is the only shipping unit), and F6 (slug collisions). Sequencing per `audit:0007` R1: land routing-only first, then the F2/F3 fixes as a fast-follow — before any non-English edition is registered.
_Assumes:_ the URL contract promised in `TRANSLATING.md` (`/{lang}/chapters/v1/...`) stays the target. _Break trigger:_ the first committed translation arriving before the scaffold lands — at that point this jumps every other Now item, because the documented translator workflow produces content the build cannot serve.

### Cross-language quality answers (precondition for any non-English edition shipping)

Before a non-English edition ships, the following must have documented answers (in `TRANSLATING.md` and/or `ARCHITECTURE.md`), so quality doesn't degrade silently across languages:

- **Audio**: ElevenLabs voice selection per language; cost implications of re-renders; whether the audio pipeline upgrade (below) should precede multi-language audio
- **PDF**: Typst font coverage for Latin-script European languages (probably fine), and the known limitation for non-Latin scripts (defer with documentation)
- **Alt text**: translated alt text flows from the translated Google Docs; Gemini auto-alt-text is a fallback only, not the primary path (would otherwise create per-language drift)
- **Glossary**: per-language, each translator establishes their own glossary doc (already partially supported via `loadGlossary()` using `${version}-${language}` path)
- **Code blocks and equations**: stay in English by convention; document explicitly
- **Right-to-left languages**: out of scope for the MVP; documented as a known limitation

_Motivated by:_ the maintainer's stated requirement that quality should not be significantly degraded across languages.
_Depends on:_ the routing scaffold for ordering only. Note the audio answer here and the audio upgrade below are the same decision made twice if they drift — resolve them together.
_Assumes:_ quality requirements are uniform across languages. _Break trigger:_ a second language being committed before these answers are documented turns this from prep work into a launch blocker.

### Cohort verification follow-through (ongoing, low-touch)

A standing maintainer practice rather than a one-off task. As the 14 Formspree-derived cohorts marked `verified: true` on 2026-06-03 actually conclude, circle back to record `actualParticipants` (and any meaningful `endDate` if useful in future). Same for new submissions as they come in. The site auto-recomputes the hero metric on every push, so each verification edit is a tiny commit with immediate visible impact.

Three cohorts from the 2026-06 backlog are still pending verification: `national-bank-ethiopia-1` (organizational venue concern), `finevals-1` (commercial entity), `independent-1` (Candace Black). Revisit when there's signal about whether these cohorts actually ran.

_Standing practice — no dependencies or break trigger; it is bounded only by submissions arriving._

### In-page errata widget per section

Extend the existing `SectionFeedback.astro` to a per-section errata form that posts to a Formspree endpoint. Reduces the cost-per-feedback-loop from "write a long email" to "click a button" — converting one-off contributions into a recurring stream.

_Motivated by:_ multiple readers (Rieke, Geoffrey, Mark) sent detailed errata via email. The next twenty Riekes should click a button instead.
_Code area:_ `src/components/SectionFeedback.astro`, Formspree endpoint configured separately.
_Depends on:_ the Formspree endpoint being configured. Note the "Suggest Correction" wiring (Next) should reuse this same sink — build the sink once.
_Assumes:_ the email errata stream keeps arriving at the current rate. _Break trigger:_ if Formspree deliverability or spam handling degrades, the sink moves — and the move affects the cohort intake and suggest-correction wiring too, so decide it once for all Formspree surfaces.

### Funding flow (research → page → button)

Multi-step: (1) research donation platforms (every.org, ko.fi, OpenCollective, Liberapay, GitHub Sponsors, Stripe direct via CeSIA, PayPal Giving Fund) on dimensions of fees, French tax-deductibility, recurring-vs-one-time, transparency. (2) Conversation with CeSIA finance contact — see questions list in `TODO.md`. (3) Donation page (`/donate` or `/support`) explaining where money goes, who CeSIA is (French 1901 association, public-interest status, 66% French tax deduction), and the funding model. (4) Optional transparency page showing rough income + spend categories. (5) Donate button in header/footer.

Don't ship the button before the research and the page — donor context matters more than the click target.

_Motivated by:_ Patryk's donation inquiry; long-term project sustainability; the project explicitly wants to "pay open-source contributors, hire support when needed."
_Code area:_ `docs/funding-platforms.md` (new, output of research), `src/pages/donate.astro` (new), header/footer link.
_Depends on:_ step 2 (the CeSIA finance conversation) gates steps 3–5; step 1 is unblocked.
_Assumes:_ one donation inquiry generalises into a real funding channel. _Break trigger:_ if the research finds no platform clearing fees + French tax-deductibility + recurring-giving requirements, the flow drops to an explicit "revisit" and the inquiry is closed honestly rather than left open.

### Audio pipeline upgrade (TTS decision + verified regeneration + read-along)

Two related workstreams, now sequenced by `audit:0009` — a costed, ordered plan. Its recommendations are pending owner decision; the ordering below is evidence, the owner's go is the commitment.

1. **Cache-key provenance + voice decision (do first; `audit:0009` R1–R2, small).** The chunk cache is keyed on text alone (`hashText` in `src/textbook-loader/renderers/audio/elevenlabs-tts.ts`) — no voice, model, or provider dimension — so a voice switch silently no-ops: unchanged paragraphs stay old-voice, and pre-switch Gemini/Kore (`.pcm`) chunks still count as hits (`audit:0009` F3). Pick one voice, change the key to carry `voice|model|provider`, purge legacy chunks once. **Order matters:** a regeneration run before the purge bakes the wrong voice into thousands of cache objects (`audit:0009` F7).
2. **One-chapter verification with the chosen voice (`audit:0009` R6).** Execute `task:0005` AC-2 end-to-end (own ElevenLabs key, verified regeneration, `-c copy` concat), folding AC-3 into the same session. This is the first proof that an edited section can produce new published audio at all — today CI always deploys with `SKIP_AUDIO: "1"` and nothing regenerates the frozen corpus.
3. **Close the timings hole (`audit:0009` R4).** Two parts: (a) a guard that fails loudly when a section's current text hash differs from the hash pinned in `chapter-timing.ts`; (b) a documented per-section path through the external `atlas-podcast` pipeline. Today a one-typo edit is ~$0.10 of TTS (`audit:0009` F6) but still effectively costs a full timings re-run (`audit:0009` F2) — word timings are welded to the audio bytes, and that, not TTS cost, is what makes an edit expensive.
4. **Read-along merge** — an existing fork adds VBR→CBR re-encoding (accurate browser seeking), AssemblyAI word-level timestamps, and synchronized transcript highlighting in the player. Output: SRT + words JSON per chapter, consumed by the player component. `task:0008` (read-along timing-drift hardening) and `task:0009` (narrated list-item wrapping) are `in_progress` awaiting owner acceptance — land or reject them as part of this stream, not separately.
5. **TTS provider evaluation** — current ElevenLabs output is flagged as poor quality. Evaluate alternatives (newer ElevenLabs multilingual voices, OpenAI TTS, Google Cloud TTS Studio, PlayHT, Microsoft Neural). This is the same decision as (1)'s voice choice — make it once, with the comparison, before any regeneration.

The full re-voice (`audit:0009` R7, large: ~one Pro-tier month ≈ $99 for the whole 1,212-minute corpus) comes **after** 1–4, as one batched migration — not chapter-by-chapter ad hoc over weeks, which maximises the mixed-cache window the key change exists to close.

_Motivated by:_ current audio quality is poor (maintainer assessment); the fork exists and the feature is concretely useful for accessibility and engagement.
_Code area:_ `src/textbook-loader/renderers/audio/`, the player component, `src/data/chapter-timing.ts`, the external `atlas-podcast` pipeline.
_Records:_ `task:0005`, `task:0008`, `task:0009`, `audit:0009`.
_Assumes:_ the corpus stays frozen during steps 1–2. _Break trigger:_ **any chapter re-render or content edit that re-synthesizes audio before the voice decision and purge** — it perpetuates the mixed cache and partially undoes step 1. Secondary triggers: ElevenLabs pricing or quality shifting enough to change the comparison outcome, or the `atlas-podcast` pipeline becoming unmaintained (step 3b would then need to be brought in-repo before it can land).

### Bug fixes from contact-form signals

- Chapter 4 audio glitch at 19:00 (Peter Drotos) — pipeline re-render, not code
- Interactive graphics broken on Chrome/Safari (matt pagett) — investigate first; could be a small fix
- Content errata batch (Rieke: 1.7, 1.11, 2.3, 2.4, 2.10; Geoffrey: 1.6; Mark: 4.3.3 missing bullets) — Google Docs edits, not code

Note the Chapter 4 audio re-render interacts with the audio workstream above: re-rendering before the voice decision + purge re-mixes the cache (`audit:0009` F7). Sequence accordingly.

### Formspree autoresponders

Configure built-in Formspree autoresponders for the facilitation-guides form and the general contact form. Each includes a brief FAQ, links to relevant docs (`TRANSLATING.md`, the cohorts form, etc.), and a "reply to this if you have follow-up questions" footer. Set-once configuration, immediate inbox-load reduction.

_Motivated by:_ maintainer reports every-other-day facilitation-guide emails requiring manual reply.

### Make Formspree cohort-submission fields mandatory

The cohort-submission form (Formspree, served from `/teach` "Become an affiliate") currently treats `cohort_size`, `start_date`, and `location` as optional. Processing the 2026-06 backlog forced rejection of otherwise-real submissions purely because of missing required signal (Marco Guzman / AI Safety CUGDL — no start_date; others had empty `cohort_size`). Mark these three fields as `required` on the form input. Won't fix existing backlog but prevents the same review-friction next round.

_Motivated by:_ ~4 of 24 submissions in the 2026-06 backlog were rejected solely for missing required-feeling info, when the underlying person was real and contactable.
_Code area:_ `src/pages/teach.astro` (form input attrs), plus matching Formspree field config.

---

## Next — planned (1–3 months)

Intent with reasons and dependencies; resourcing not yet confirmed. Ordering within the band is by dependency, not priority.

### R2-published content artifact (replaces the git-committed cache)

The cache lives at `content.foreview.org/atlas-v1-en.tar.gz` as a versioned artifact signed by SHA256. A postinstall script downloads it to `.cache/docs/`. `.gitignore` reverts to ignoring all of `.cache/`. The git history stops growing with every content edit.

_Motivated by:_ [`ARCHITECTURE.md`](./ARCHITECTURE.md) "Why a committed cache" explicitly names this as the planned exit path. The current arrangement is acceptable short-term but the git bloat is unbounded over time. Architecturally consistent with the existing PDF/audio R2 distribution (commit `695ec5b`).
_Code area:_ new postinstall script in `package.json`, `.gitignore` revert, `.cache/docs/README.md` updated, the scheduled refresh workflow republishes to R2 instead of opening a PR.
_Records:_ `task:0002` (migrate R2 assets to our own Cloudflare account and repoint config — `todo`, not started).
_Depends on:_ the account migration in `task:0002`; publishing our own artifact to a rented third-party bucket would recreate the dependency this exists to remove.
_Assumes:_ our own Cloudflare access is durable once migrated. _Break trigger:_ if `task:0002` stalls, this stays deferred — and the cost of the delay is concrete and growing: every content edit bloats git history meanwhile.

### Accessibility remediation (automated gate landed; close the backlog)

State update (2026-09-21): the automated a11y check this item called for has landed since the 2026-06 draft — `tests/a11y/` runs axe-core via Playwright against the built site, with accepted violations recorded in `baseline.json`, and `pnpm test:a11y` is part of `pnpm verify` and CI. What remains is remediation, not gate-building:

- Thread real `alt` text from Google Docs image properties through to `Figure.astro`
- Audit keyboard navigation in `Header`, `Reader`, search modal
- Fix the named issues from the 2026-06-03 PageSpeed run: version selector lacks an associated `<label>`; no `<main>` landmark on the homepage; two "Read the textbook" links with identical text pointing to different hrefs (`/chapters/v1/capabilities/introduction` vs `/read`); ENS Paris Saclay logo missing explicit `width`/`height` (CLS risk)

_Motivated by:_ principle #12 (accessibility) — explicitly aspirational in PRINCIPLES with named gaps; the gate exists, this closes the loop.
_Code area:_ `src/components/nodes/Figure.astro`, `src/components/Header.astro`, `src/lib/reader.ts`.
_Assumes:_ `baseline.json` stays an honest snapshot of accepted violations that shrinks over time. _Break trigger:_ if the baseline grows instead of shrinking, the approach needs a ratchet (new violations fail, accepted ones expire) — a growing baseline is the same goodharting failure `task:0011` was created to fix.

### Page-load performance pass

Page speed was a primary motivation for choosing Astro; we should hold ourselves to it. A 2026-06-03 PageSpeed run on the deployed homepage scored 92 Performance (LCP 0.6s desktop, FCP 0.4s) — solid but with named regressions:

- **LCP image lazy-loaded** — `reader-screenshot.webp` (the hero) has `loading="lazy"`; should be eager with `fetchpriority="high"` since it's the LCP element
- **Oversized images** — `reader-screenshot.webp` ships at 1200×754 but displays at 556×349; `www-enais-co-white.png` ships at 1029×217 but displays at 114×24 (~35 KiB saving); `ens-paris-saclay.BCyJ3KCb.png` 1334×305 vs 122×28. Use Astro's `<Image>` component with explicit sizing, or pre-shrink the source assets
- **Render-blocking CSS** — `brand.3V93pehS.css` (13 KiB) blocks first paint
- **Unused JS from jsdelivr** — `umd/index.min.js` ships 36 KiB with ~30 KiB unused; identify the package and trim or self-host
- **Long main-thread tasks** — same jsdelivr UMD bundle drives a 260ms task during load
- **Best-practices headers** — no CSP, no HSTS `includeSubDomains`/`preload`, no COOP, no XFO/frame-ancestors directive, no Trusted Types CSP. These are deploy-side headers (Cloudflare Pages / wherever the site is hosted), not code

Bundle this with the a11y remediation; same shape (audit deployed site → fix issues → hold the gate).

_Motivated by:_ a textbook is its reading experience; load time is part of that. Astro was chosen specifically for static-site speed and we should measure it.
_Code area:_ `src/components/` (hero image priority hints, image dimensions), `src/layouts/` (CSS loading strategy), `astro.config.mjs` (image optimization config), deploy config (headers). Run pagespeed.web.dev manually after each pass; add a Lighthouse CI workflow step if regressions stabilize.
_Dependency direction:_ this pass establishes the JS/CSS budget that the OWID dataset replacement (Later) must fit — chart-library client JS on a performance-sensitive site is the named risk (`audit:0008` R4). Run it before that work, not after.

### Discriminated-union AST node types

Currently `Node = { name: string, attributes: Record<string, unknown>, children: Node[] }`. The looseness costs us TypeScript safety at the boundary between `Transformer` output and `NodeRenderer` dispatch. Refactor to a discriminated union: `Node = ParagraphNode | HeadingNode | FigureNode | ...` so consumers can type-narrow on `node.name`.

_Motivated by:_ principle 11 (type safety where it catches bugs) — currently honest debt; this is the fix.
_Code area:_ `src/textbook-loader/transformer.ts` (Node type definition), `src/components/NodeRenderer.astro` (the dispatcher that would benefit most), every file under `src/components/nodes/` (typed props).
_Records:_ `audit:0008` R1 — this refactor is the prerequisite for any new content type; the audit explicitly declines to hand-write quiz branches on the current stringly-typed `Node` (that would reproduce its silent-drop failure class for the first new kind). It pairs with `audit:0008` R2: a per-kind renderability contract (`render | summarize | skip | label`) co-located with the node vocabulary, validated against the four existing renderer disagreements (Video/Iframe/NoteBox/Callout), so renderers stop re-deciding skip-policy ad hoc.
_Depends on:_ the format pass (Now). _Blocks:_ the quizzes/flashcards item (below) and the OWID replacement (Later).
_Assumes:_ snapshot churn in `transformer.test.ts` is the main review cost. _Break trigger:_ if a new content type is needed before this lands, the choice is to delay the content type — not to skip the union (`audit:0008` "what I would not do").

### Quizzes and flashcards as inline content types

The owner wants quizzes and flashcards as content types — inline self-check material inside chapters (confirmed 2026-09). This is deliberately distinct from the rejected certification program (see Not planned): no accounts, no scoring backend, no anti-gaming, no credentials. The deliverable is prose-adjacent interactive content rendered through the same pipeline as everything else.

First step is a decision, not code (`audit:0008` R3): the authoring surface. Two viable paths (`audit:0008` F8):

- **Google Docs component-table component** — fits position-in-text (a quiz between paragraph 3 and 4 is just a table there), inherits the editorial workflow authors already use; costs a stringly-typed cell schema validated only at build time.
- **Astro content collection** (`src/content/quiz/v1-en/...` with zod schemas, like the existing glossary) — fits typing, validation, and the per-edition/per-language directory convention; needs a positioning mechanism (an id referenced from a Doc table, or section-level ordering) because collections have no document order.

The Doc-table path is the smaller change and reuses the transformer's component-table mechanism verbatim; the collection path fits if quizzes get reused across editions or rendered outside chapter flow (a standalone practice page). The decision is standalone-safe — record it before the AST refactor lands.

_Records:_ `audit:0008` F8, R1–R3.
_Depends on:_ the discriminated-union `Node` refactor and the per-kind renderability contract (above) for implementation; the authoring-surface decision has no dependency.
_Constraint:_ no answer-hiding or server-side scoring — that re-opens the rejected certification scope (PRINCIPLES §14). Read-along exclusion (`UNSPOKEN_SELECTOR` in `word-highlight.ts`) must include the new kinds in the same change (`audit:0008` R5).
_Assumes:_ demand here is owner-driven, not reader-pulled — readers asked for certification, not quizzes; this item exists because the owner judges inline self-checking worth having. _Break trigger:_ if the authoring-surface decision still can't be made when the AST refactor lands, the item defers to Later rather than forcing a bespoke bypass of the transformer — authoring quizzes outside the Doc-source pipeline forks the editorial surface (`audit:0008`).

### Link checker (lychee, scheduled)

A nightly GitHub Actions workflow runs `lychee` against `dist/**/*.html` to detect broken external citations, dead arXiv links, bad internal anchors. Failures open a deduplicated issue rather than blocking PRs (external links break independently of code changes — failing PRs because arxiv.org is slow is the wrong tradeoff).

_Motivated by:_ a textbook with hundreds of external citations rots silently; a nightly check catches it before readers do.
_Code area:_ `.github/workflows/links.yml` (new), `lychee.toml` (new).

### Expanded contributor onboarding (role-based CONTRIBUTING + issue templates)

`CONTRIBUTING.md` gets role-based sections: code contributor, translator, course host, errata reporter, content collaborator. Each section explains what to read, what to use (issue template / form / PR), and what to expect.

`.github/ISSUE_TEMPLATE/` expanded from the current bug/feature pair to include: errata report, translation registration, course submission (or pointer to the form), and content rework proposal (Arne-Tillmann-style).

_Motivated by:_ lower friction for non-code contributions. Today, a translator with no GitHub experience and a reading-group organizer with course submission both end up in the same Formspree-or-email funnel — the maintainer triages.
_Depends on:_ the translation-registration section should match reality: `TRANSLATING.md` currently promises a URL space (`/{lang}/chapters/...`) the routing scaffold (Now) has to deliver first. Write the docs to the target contract only once the scaffold is landing, or mark the promise as pending in the meantime.

### Suggest-correction wiring on courses

The "Suggest Correction" buttons on `/teach` exist in the UI but currently go nowhere. Wire them to the same Formspree errata sink as the per-section errata widget (Now).

_Motivated by:_ cheap to make real; lets course hosts self-correct.
_Code area:_ `src/pages/teach.astro` and any related course-card component.
_Depends on:_ the errata widget's Formspree sink (Now) — one sink, two surfaces; don't stand up a second endpoint.

### Unified whole-book PDF download

Extend the existing typst pipeline to produce one full-book PDF in addition to the per-chapter PDFs. Hosts e-reader users (Artyom's request) without committing to EPUB/MOBI generation.

_Code area:_ `src/textbook-loader/renderers/pdf/renderer.ts`.

---

## Later — deferred with reasons (3–12 months)

Presence here is a placeholder with reasons and dependencies, not a promise. Items move up when their trigger fires.

### Refactor `Transformer` to remove per-textbook shared state

`loadChapter(X)` produces a different content hash on a reused loader vs a fresh one, because the Transformer accumulates figure/equation counters as instance state. The test currently asserts the "fresh loader" invariant, which is correct but surprising. The Transformer could compute counters as a deterministic pass over the assembled chapter list rather than incrementing during traversal.

_Motivated by:_ principle 4 (reproducibility) — currently "reproducibility holds _if_ you use a fresh loader" which is a footnote we'd rather not have. Lower-priority because the test catches the actual bug class.
_Code area:_ `src/textbook-loader/transformer.ts`, `src/textbook-loader/loader.ts`.
_Priority calibration (2026-09-21, `audit:0007` F10): this item does **not** block multi-edition or translation work, and must not be cited as a prerequisite for it. Each edition gets its own `TextbookLoader` (constructed per edition in `content.config.ts`), so per-textbook counter state is already isolated between editions, and per-chapter figure numbering is translation-stable. It stays here as hygiene — including removing the unused `inTextbook`/`inSection` counter halves, which are dead weight carried into serialized nodes and the audio/markdown renderers. In practice it is demoted below edition-2 and translation work, despite sitting in the same band.

### First-class image hosting for contributors (probably R2)

When the R2 content artifact lands (Next), extend it to include image assets so contributors get real figures, not just captions. The current "captions only" experience is acceptable but is a friction point for visual/layout contributors. Should follow the same pattern: published versioned artifact, postinstall fetches, no LFS.

_Motivated by:_ contributor experience for visual work. Currently a Track A trade-off accepted explicitly in [`CONTRIBUTING.md`](../CONTRIBUTING.md).
_Code area:_ postinstall script extension, possibly new `src/assets/uc/` carve-out treatment.
_Depends on:_ the R2 content artifact (Next) landing first, and `task:0002` (own Cloudflare account) before that.

### Second-language edition (content)

Once a translator's docIds for a non-English edition are ready, register them in `TEXTBOOK_EDITIONS` (`src/textbook-loader/data.ts`) — the routing scaffold (Now) means no other code changes are required for a new language edition to start appearing at `/es/chapters/v1/...` (or wherever). The language switcher built by the Now scaffold (replacing `VersionSelector.astro`, which today has no language dimension — `audit:0007` F1) starts rendering once `getTextbooks()` returns more than one language; that is an activation condition for a component built earlier, not an existing implementation. UI string i18n (`src/i18n/strings/{lang}.ts`) may need extraction at this point if the in-component hardcoded strings become a noticeable gap.

_Motivated by:_ anticipated Spanish edition (RiesgosIA), possibly French (CeSIA collaborators), German and others on the request queue.
_Code area:_ one-line entry in `data.ts`; possibly `src/i18n/strings/`; possibly visible-switcher activation.
_Depends on:_ the locale routing scaffold **plus** its fast-follows — the Algolia per-language keying (`audit:0007` F2) and the chapter-timing key (`audit:0007` F3) — because registering a Spanish edition before those lands would corrupt the English search index and serve English narration on Spanish pages. Also the cross-language quality answers (Now).
_Assumes:_ the RiesgosIA translation actually reaches a registerable state with per-chapter sign-off. _Break trigger:_ if the translator's docIds aren't materialising by the time the Next band clears, the edition slips — acceptable, since nothing else is gated on it once the scaffold exists.

### Self-hosted OWID datasets and interactive layers

The current edition embeds 28 OWID iframes — external runtime dependencies loading third-party JS and data at read time. Plan: replace with self-hosted datasets plus an interactive layer, by **extending the `Iframe` node with a dataset variant** rather than minting a new node kind (`audit:0008` F5/R4), with a build-time grapher-fetch step beside the existing asset-pipeline precedent (`pushPublicFiles`).

_Records:_ `audit:0008` F5, R4, R5.
_Depends on:_ the discriminated-union refactor + renderability contract (Next) so the node-kind change is cheap; the page-load performance budget (Next) — chart-library client JS is the named risk on a performance-sensitive site.
_Open question flagged by the audit, resolve before building:_ OWID licence terms for self-hosting their chart data are unverified (`audit:0008` R4).
_Same-change rule:_ any new interactive node kind must be added to the read-along exclusion mechanism (`UNSPOKEN_SELECTOR` in `word-highlight.ts`) in the same change (`audit:0008` R5) — trivial alone, annoying to debug if forgotten.
_Break trigger:_ if the licence question resolves against self-hosting, this item dies and the iframes stay — with the external-dependency risk remaining documented in `audit:0001` instead of being retired.

---

## Not planned (explicit non-goals)

These are deliberate rejections, with the reasoning documented so they don't get re-litigated. The same list also appears in PRINCIPLES.md §14 in short form; this is the long-form explanation.

### No certification program

Multiple readers (Pavel Apostolskiy, James Nyamukusa, Utsav Singh, Ben K, Victoria Aponte, James — at least six asks over the period) have requested a certification program. The engineering scope is monolithic: account system with Google/GitHub auth, quiz authoring tooling, quiz delivery, anti-gaming protections (proctoring? rate limits? IP checks?), score persistence, credential issuance, verifier endpoint, and the ongoing content authorship for the quizzes themselves. The demand signal is real but small (~6 individuals over months); the scope vastly exceeds it.

Track the interest count here. Revisit when a real product decision is made with dedicated resourcing — not before. Don't create an interest-list page either: collecting emails commits the project to follow-up work that can't yet be fulfilled.

_Scope note (2026-09-21):_ what this entry rejects is **credential infrastructure** — accounts, proctoring, score persistence, certificate issuance, a verifier endpoint. It does not reject quizzes or flashcards as **content types**. The owner has since confirmed inline self-check quizzes and flashcards are wanted (see Next), which is a different deliverable rendered through the normal pipeline with no accounts and no scoring backend. Both facts stand: six readers asked for certification (rejected, scope unchanged); the owner asked for inline quizzes (accepted, new Next item). Neither re-opens the other — don't cite this entry to block the quiz work, and don't cite the quiz work to re-open certification. If PRINCIPLES §14's short form still reads as a blanket quiz rejection, that is a drift to fix there.

### No MDX/markdown migration of the textbook source

Authors edit in Google Docs because real-time co-editing, inline comments, and suggestion-mode review are already familiar workflows. Migrating to MDX would require every contributing author to learn Git + markdown + a custom dialect for footnotes/callouts/equations. The infrastructure burden of Google Docs auth is real but smaller than that author-onboarding cost. See [`ARCHITECTURE.md`](./ARCHITECTURE.md) "Editorial surface — why Google Docs."

### No microservices split

The site is a static build behind a CDN. The maintainer-side pipeline is a single Node process that runs ~once per content change. Splitting it into services would add operational overhead with no payoff. Stays a monolith.

### No public JS/TS API

The deliverable is the website. We don't ship a library. If someone wants to consume the parsed AST programmatically, they can fork the textbook-loader module — but the project's contract with consumers is the URL space (principle 13), not exports.

### No authentication, user accounts, comments

Readers are anonymous. Comments and editorial input happen in the Google Docs source, not on the deployed site. Adding auth would create a security surface (sessions, tokens, password reset flows) and a moderation responsibility that isn't justified by the project's goals.

### No EPUB/MOBI/LaTeX exports (for now)

Single asks per format (Artyom, Facundo). The existing per-chapter PDFs plus the planned whole-book PDF (Next) cover the e-reader use case for most readers. Revisit if repeated demand surfaces. LaTeX export specifically conflicts with the Google Docs source-of-truth — declined; offer the existing PDF instead.

### No hosting of external curricula on the Atlas platform

Inquiries have come in (Natalia Fernandez, Cooperative AI Foundation) about hosting other organizations' curricula on Atlas-style infrastructure. This is an architectural change (multi-tenancy, namespace isolation, possibly per-org branding) that's much larger than the request implies. Defer until a concrete partnership decision is made and resourced. Today the Atlas platform is for the Atlas textbook.

### No CHANGELOG.md or SemVer until we tag versions

The site is continuously deployed from `main`. There's no versioned release to changelog against. When we cut a first real release (e.g. when content publishing moves to R2 with versioned artifacts), CHANGELOG and SemVer-style versioning become useful. Until then they'd be ceremonial.

### No CODEOWNERS file

One maintainer with optional contributors. CODEOWNERS becomes useful when there's review routing to do across multiple owners; we're not there.

### No `PRIVACY.md` in the repo

The deployed site DOES collect visitor data (IP + user agent via Plausible analytics) and DOES have GDPR obligations. The canonical privacy policy lives at https://ai-safety-atlas.com/privacy-policy/ on the deployed site, written by the legal data controller. Mirroring that policy into a `PRIVACY.md` in the repo would either (a) duplicate it (drift risk: the website is the source of truth) or (b) be a stripped-down stub that confuses readers. The codebase itself does not collect data — running the code locally does not implicate any privacy obligations. `SECURITY.md` links to the canonical policy for visitors who land here looking for it.

### No scheduled content-refresh workflow

A nightly cron that pulls fresh chapter prose from Google Docs and opens a PR would close a real ergonomic gap (the cache goes stale unless the maintainer remembers to refresh it). But chapters in Google Docs are continuously edited in suggestion-mode; not every save is publishable. Pulling on a schedule would mean either (a) requiring author discipline that contradicts the editorial workflow, or (b) gating with a manual approval step that's effectively what we have today via `pnpm build` locally. Decision: keep content refresh manual. The maintainer runs `pnpm build` when chapters are ready to ship and commits the resulting `.cache/docs/` diff.

### No automated Formspree-to-data-layer pipeline

The cohort intake script (Now) deliberately stops at producing a review queue; it never writes to `src/content/cohorts/` directly. Some Formspree submissions are spam, dupes, mistyped, or not serious. Auto-writing would either corrupt the data layer or require so much heuristic filtering that the heuristics become a maintenance burden of their own. Manual (or agent-assisted) review of the queue is the right cost.

### No right-to-left language support in the MVP

Documented as a known limitation in `TRANSLATING.md`. Revisit if/when an Arabic or Hebrew translator is ready to start work. The Typst template would also need extension at that point.

---

## Reconciliation with task, ADR, and audit state (2026-09-21)

Roadmap items link to governed records; those records have their own states, and a roadmap reader should be able to tell what has actually moved without opening each one:

- **`task:0001`–`task:0007`** — all `todo`. This is the independence and publication-remediation backlog (OG-image dependency, R2 migration, Google Docs control, credential rotation, audio de-risk, logos-package posture, publication security). None has started. `task:0005` is the one the audio workstream (Now) sequences its verification step around; `task:0002` gates the R2 content artifact (Next).
- **`task:0008`, `task:0009`** — both `in_progress`: all acceptance criteria met, awaiting owner acceptance. They appear inside the audio workstream (Now) as land-or-reject decisions, not as open items.
- **`task:0010`** — `todo`, design agreement only: no implementation is authorised yet. The control surface is deliberately absent from the roadmap bands until that design is agreed; when it lands, `atlas` commands become the natural entry points for several operational items here (e.g. `atlas generate audio --chapter N`, `audit:0006`).
- **`task:0011`** — `todo`; this document's restructure is part of it.
- **`adr:0001`** (`proposed`) — the independence strategy that underpins the entire `task:0001`–`0007` backlog; the tasks are its execution arm.
- **`adr:0002`** (`proposed`) — living-document governance: why these four documents keep stable filenames and sit outside the validator, and therefore why substance — not a green validator — is the only control on this file.
- **`audit:0001`–`audit:0010`** — point-in-time evidence, all `draft`. Every recommendation in them is pending owner decision; none authorises a code change. When a roadmap item cites an audit, the audit supplies the sequencing evidence, and the owner's decision converts it into the commitment the band reflects. If an audit recommendation is declined, the roadmap item citing it should be updated or removed in the same decision — a roadmap item pointing at superseded audit evidence is exactly the staleness this file now guards against.

---

## How this doc relates to TODO.md

`TODO.md` (local-only) is the active checkbox list — "do these phases in this order, here are the commits." It changes daily.

This file (`ROADMAP.md`) is strategic — "here's where we want to be, here's what we'd do if we had a free week." It changes when direction changes, not when work happens. One amendment to the old rule ("if you finished a task, update TODO instead"): you also update this file when a **break trigger fires** — that is a direction change, and this is where the new commitment gets recorded.

---

_Last updated: 2026-09-21 (commitment bands, dependencies, break triggers, and record reconciliation added; language-switcher claim corrected; quizzes/flashcards distinguished from the rejected certification program)._
