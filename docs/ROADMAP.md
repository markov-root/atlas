# Roadmap

Where this codebase wants to be, and why. This complements [`TODO.md`](./TODO.md) (tactical, local, checkbox-driven) with strategic direction.

Items are bucketed by horizon, not by priority within a bucket. Each item names the principle, code area, or constraint that motivates it.

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

The items below reflect that direction. Items dated earlier than this sweep are preserved with their original framing.

---

## Now (current 1-month focus)

### Format-the-codebase pass (then re-enable format:check in verify)

`prettier --write .` against the existing codebase as a single formatting-only commit, then add `pnpm format:check` to `pnpm verify`. Currently `pnpm format` exists as a manual tool but format enforcement is deferred because (a) the bulk reformat hasn't happened and (b) `prettier-plugin-astro` can't parse one `.astro` file (HTML comment inside what it parses as JSX).

This should land before any big refactor (discriminated AST, courses migration) so we don't fight prettier mid-PR.

_Motivated by:_ finishing the bulletproof pass cleanly — verify currently covers lint + typecheck + tests + build + smoke, but not formatting.
_Code area:_ big format-only commit across `src/`, then a one-line addition to `pnpm verify` in `package.json`.

### Locale-aware routing scaffold (English-only)

Build the `[lang]` URL segment, dynamic `<html lang>`, hreflang alternates, and multi-language helpers in `src/lib/textbooks.ts` **now**, with English as the only available language. English stays at `/chapters/v1/...` (no locale prefix — principle #13: don't break URLs already published); new languages get `/es/chapters/v1/...`, `/fr/chapters/v1/...`, etc. Adding a new language becomes a one-line `TEXTBOOK_EDITIONS` entry in `data.ts`.

The visible language switcher component renders only when more than one language exists; ships dormant until a second edition is committed.

_Motivated by:_ translator demand is real, not hypothetical. Building this layer once now is cheaper than refactoring routing each time a language lands.
_Code area:_ `src/pages/chapters/[version]/[chapter]/[section].astro` (introduce `[lang?]` segment), `src/lib/textbooks.ts` (drop the `.filter(t => t.data.language === 'en')`), `src/layouts/Reader.astro` and `Default.astro` (dynamic lang attr), `src/components/BaseHead.astro` (hreflang).

### Cross-language quality answers (precondition for any non-English edition shipping)

Before a non-English edition ships, the following must have documented answers (in `TRANSLATING.md` and/or `ARCHITECTURE.md`), so quality doesn't degrade silently across languages:

- **Audio**: ElevenLabs voice selection per language; cost implications of re-renders; whether the audio pipeline upgrade (below) should precede multi-language audio
- **PDF**: Typst font coverage for Latin-script European languages (probably fine), and the known limitation for non-Latin scripts (defer with documentation)
- **Alt text**: translated alt text flows from the translated Google Docs; Gemini auto-alt-text is a fallback only, not the primary path (would otherwise create per-language drift)
- **Glossary**: per-language, each translator establishes their own glossary doc (already partially supported via `loadGlossary()` using `${version}-${language}` path)
- **Code blocks and equations**: stay in English by convention; document explicitly
- **Right-to-left languages**: out of scope for the MVP; documented as a known limitation

_Motivated by:_ the maintainer's stated requirement that quality should not be significantly degraded across languages.

### Cohort verification follow-through (ongoing, low-touch)

A standing maintainer practice rather than a one-off task. As the 14 Formspree-derived cohorts marked `verified: true` on 2026-06-03 actually conclude, circle back to record `actualParticipants` (and any meaningful `endDate` if useful in future). Same for new submissions as they come in. The site auto-recomputes the hero metric on every push, so each verification edit is a tiny commit with immediate visible impact.

Three cohorts from the 2026-06 backlog are still pending verification: `national-bank-ethiopia-1` (organizational venue concern), `finevals-1` (commercial entity), `independent-1` (Candace Black). Revisit when there's signal about whether these cohorts actually ran.

### In-page errata widget per section

Extend the existing `SectionFeedback.astro` to a per-section errata form that posts to a Formspree endpoint. Reduces the cost-per-feedback-loop from "write a long email" to "click a button" — converting one-off contributions into a recurring stream.

_Motivated by:_ multiple readers (Rieke, Geoffrey, Mark) sent detailed errata via email. The next twenty Riekes should click a button instead.
_Code area:_ `src/components/SectionFeedback.astro`, Formspree endpoint configured separately.

### Funding flow (research → page → button)

Multi-step: (1) research donation platforms (every.org, ko.fi, OpenCollective, Liberapay, GitHub Sponsors, Stripe direct via CeSIA, PayPal Giving Fund) on dimensions of fees, French tax-deductibility, recurring-vs-one-time, transparency. (2) Conversation with CeSIA finance contact — see questions list in `TODO.md`. (3) Donation page (`/donate` or `/support`) explaining where money goes, who CeSIA is (French 1901 association, public-interest status, 66% French tax deduction), and the funding model. (4) Optional transparency page showing rough income + spend categories. (5) Donate button in header/footer.

Don't ship the button before the research and the page — donor context matters more than the click target.

_Motivated by:_ Patryk's donation inquiry; long-term project sustainability; the project explicitly wants to "pay open-source contributors, hire support when needed."
_Code area:_ `docs/funding-platforms.md` (new, output of research), `src/pages/donate.astro` (new), header/footer link.

### Audio pipeline upgrade (TTS investigation + read-along feature)

Two related workstreams to bundle:

1. **TTS investigation** — current ElevenLabs output is flagged as poor quality. Evaluate alternatives (newer ElevenLabs multilingual voices, OpenAI TTS, Google Cloud TTS Studio, PlayHT, Microsoft Neural). Decide before merging the read-along fork, so the quality jump and the synced-playback feature ship together.
2. **Read-along merge** — an existing fork adds VBR→CBR re-encoding (accurate browser seeking), AssemblyAI word-level timestamps, and synchronized transcript highlighting in the player. Output: SRT + words JSON per chapter, consumed by the player component.

_Motivated by:_ current audio quality is poor (maintainer assessment); the fork exists and the feature is concretely useful for accessibility and engagement.
_Code area:_ `src/textbook-loader/renderers/audio/`, the player component, possibly a new TTS provider integration.

### Bug fixes from contact-form signals

- Chapter 4 audio glitch at 19:00 (Peter Drotos) — pipeline re-render, not code
- Interactive graphics broken on Chrome/Safari (matt pagett) — investigate first; could be a small fix
- Content errata batch (Rieke: 1.7, 1.11, 2.3, 2.4, 2.10; Geoffrey: 1.6; Mark: 4.3.3 missing bullets) — Google Docs edits, not code

### Formspree autoresponders

Configure built-in Formspree autoresponders for the facilitation-guides form and the general contact form. Each includes a brief FAQ, links to relevant docs (`TRANSLATING.md`, the cohorts form, etc.), and a "reply to this if you have follow-up questions" footer. Set-once configuration, immediate inbox-load reduction.

_Motivated by:_ maintainer reports every-other-day facilitation-guide emails requiring manual reply.

### Make Formspree cohort-submission fields mandatory

The cohort-submission form (Formspree, served from `/teach` "Become an affiliate") currently treats `cohort_size`, `start_date`, and `location` as optional. Processing the 2026-06 backlog forced rejection of otherwise-real submissions purely because of missing required signal (Marco Guzman / AI Safety CUGDL — no start_date; others had empty `cohort_size`). Mark these three fields as `required` on the form input. Won't fix existing backlog but prevents the same review-friction next round.

_Motivated by:_ ~4 of 24 submissions in the 2026-06 backlog were rejected solely for missing required-feeling info, when the underlying person was real and contactable.
_Code area:_ `src/pages/teach.astro` (form input attrs), plus matching Formspree field config.

---

## Next (1–3 months)

### R2-published content artifact (replaces the git-committed cache)

The cache lives at `content.foreview.org/atlas-v1-en.tar.gz` as a versioned artifact signed by SHA256. A postinstall script downloads it to `.cache/docs/`. `.gitignore` reverts to ignoring all of `.cache/`. The git history stops growing with every content edit.

_Motivated by:_ [`ARCHITECTURE.md`](./ARCHITECTURE.md) "Why a committed cache" explicitly names this as the planned exit path. The current arrangement is acceptable short-term but the git bloat is unbounded over time. Architecturally consistent with the existing PDF/audio R2 distribution (commit `695ec5b`).
_Code area:_ new postinstall script in `package.json`, `.gitignore` revert, `.cache/docs/README.md` updated, the scheduled refresh workflow republishes to R2 instead of opening a PR.

### Accessibility audit and remediation (axe-core CI gate)

Run axe-core / Lighthouse against the deployed site. Thread real `alt` text from Google Docs image properties through to `Figure.astro`. Audit keyboard navigation in `Header`, `Reader`, search modal. Add automated a11y check to CI — either via `@axe-core/cli` against the built `dist/`, or via a minimal Playwright setup (Playwright earns its keep here as the host for axe; otherwise a sprawling E2E suite is marginal value for a static site of this size).

Known issues already surfaced by a 2026-06-03 PageSpeed run: version selector lacks an associated `<label>`; no `<main>` landmark on the homepage; two "Read the textbook" links with identical text point to different hrefs (`/chapters/v1/capabilities/introduction` vs `/read`); ENS Paris Saclay logo missing explicit `width`/`height` (CLS risk).

_Motivated by:_ principle #12 (accessibility) — explicitly aspirational in PRINCIPLES with named gaps; this closes the loop.
_Code area:_ `src/components/nodes/Figure.astro`, `src/components/Header.astro`, `src/lib/reader.ts`, possibly new `tests/a11y/`, new CI workflow step.

### Page-load performance pass

Page speed was a primary motivation for choosing Astro; we should hold ourselves to it. A 2026-06-03 PageSpeed run on the deployed homepage scored 92 Performance (LCP 0.6s desktop, FCP 0.4s) — solid but with named regressions:

- **LCP image lazy-loaded** — `reader-screenshot.webp` (the hero) has `loading="lazy"`; should be eager with `fetchpriority="high"` since it's the LCP element
- **Oversized images** — `reader-screenshot.webp` ships at 1200×754 but displays at 556×349; `www-enais-co-white.png` ships at 1029×217 but displays at 114×24 (~35 KiB saving); `ens-paris-saclay.BCyJ3KCb.png` 1334×305 vs 122×28. Use Astro's `<Image>` component with explicit sizing, or pre-shrink the source assets
- **Render-blocking CSS** — `brand.3V93pehS.css` (13 KiB) blocks first paint
- **Unused JS from jsdelivr** — `umd/index.min.js` ships 36 KiB with ~30 KiB unused; identify the package and trim or self-host
- **Long main-thread tasks** — same jsdelivr UMD bundle drives a 260ms task during load
- **Best-practices headers** — no CSP, no HSTS `includeSubDomains`/`preload`, no COOP, no XFO/frame-ancestors directive, no Trusted Types CSP. These are deploy-side headers (Cloudflare Pages / wherever the site is hosted), not code

Bundle this with the axe-core a11y audit work; same shape (audit deployed site → fix issues → add CI gate).

_Motivated by:_ a textbook is its reading experience; load time is part of that. Astro was chosen specifically for static-site speed and we should measure it.
_Code area:_ `src/components/` (hero image priority hints, image dimensions), `src/layouts/` (CSS loading strategy), `astro.config.mjs` (image optimization config), deploy config (headers). Run pagespeed.web.dev manually after each pass; add a Lighthouse CI workflow step if regressions stabilize.

### Discriminated-union AST node types

Currently `Node = { name: string, attributes: Record<string, unknown>, children: Node[] }`. The looseness costs us TypeScript safety at the boundary between `Transformer` output and `NodeRenderer` dispatch. Refactor to a discriminated union: `Node = ParagraphNode | HeadingNode | FigureNode | ...` so consumers can type-narrow on `node.name`.

_Motivated by:_ principle 11 (type safety where it catches bugs) — currently honest debt; this is the fix.
_Code area:_ `src/textbook-loader/transformer.ts` (Node type definition), `src/components/NodeRenderer.astro` (the dispatcher that would benefit most), every file under `src/components/nodes/` (typed props).

### Link checker (lychee, scheduled)

A nightly GitHub Actions workflow runs `lychee` against `dist/**/*.html` to detect broken external citations, dead arXiv links, bad internal anchors. Failures open a deduplicated issue rather than blocking PRs (external links break independently of code changes — failing PRs because arxiv.org is slow is the wrong tradeoff).

_Motivated by:_ a textbook with hundreds of external citations rots silently; a nightly check catches it before readers do.
_Code area:_ `.github/workflows/links.yml` (new), `lychee.toml` (new).

### Expanded contributor onboarding (role-based CONTRIBUTING + issue templates)

`CONTRIBUTING.md` gets role-based sections: code contributor, translator, course host, errata reporter, content collaborator. Each section explains what to read, what to use (issue template / form / PR), and what to expect.

`.github/ISSUE_TEMPLATE/` expanded from the current bug/feature pair to include: errata report, translation registration, course submission (or pointer to the form), and content rework proposal (Arne-Tillmann-style).

_Motivated by:_ lower friction for non-code contributions. Today, a translator with no GitHub experience and a reading-group organizer with course submission both end up in the same Formspree-or-email funnel — the maintainer triages.

### Suggest-correction wiring on courses

The "Suggest Correction" buttons on `/teach` exist in the UI but currently go nowhere. Wire them to the same Formspree errata sink as the per-section errata widget.

_Motivated by:_ cheap to make real; lets course hosts self-correct.
_Code area:_ `src/pages/teach.astro` and any related course-card component.

### Unified whole-book PDF download

Extend the existing typst pipeline to produce one full-book PDF in addition to the per-chapter PDFs. Hosts e-reader users (Artyom's request) without committing to EPUB/MOBI generation.

_Code area:_ `src/textbook-loader/renderers/pdf/renderer.ts`.

---

## Later (3–12 months)

### Refactor `Transformer` to remove per-textbook shared state

`loadChapter(X)` produces a different content hash on a reused loader vs a fresh one, because the Transformer accumulates figure/equation counters as instance state. The test currently asserts the "fresh loader" invariant, which is correct but surprising. The Transformer could compute counters as a deterministic pass over the assembled chapter list rather than incrementing during traversal.

_Motivated by:_ principle 4 (reproducibility) — currently "reproducibility holds _if_ you use a fresh loader" which is a footnote we'd rather not have. Lower-priority because the test catches the actual bug class.
_Code area:_ `src/textbook-loader/transformer.ts`, `src/textbook-loader/loader.ts`.

### First-class image hosting for contributors (probably R2)

When the R2 content artifact lands (Next), extend it to include image assets so contributors get real figures, not just captions. The current "captions only" experience is acceptable but is a friction point for visual/layout contributors. Should follow the same pattern: published versioned artifact, postinstall fetches, no LFS.

_Motivated by:_ contributor experience for visual work. Currently a Track A trade-off accepted explicitly in [`CONTRIBUTING.md`](../CONTRIBUTING.md).
_Code area:_ postinstall script extension, possibly new `src/assets/uc/` carve-out treatment.

### Second-language edition (content)

Once a translator's docIds for a non-English edition are ready, register them in `TEXTBOOK_EDITIONS` (`src/textbook-loader/data.ts`) — the routing scaffold (Now) means no other code changes are required for a new language edition to start appearing at `/es/chapters/v1/...` (or wherever). The visible language switcher component (already implemented dormant) starts rendering once `getAllTextbooks()` returns more than one language. UI string i18n (`src/i18n/strings/{lang}.ts`) may need extraction at this point if the in-component hardcoded strings become a noticeable gap.

_Motivated by:_ anticipated Spanish edition (RiesgosIA), possibly French (CeSIA collaborators), German and others on the request queue.
_Code area:_ one-line entry in `data.ts`; possibly `src/i18n/strings/`; possibly visible-switcher activation.

---

## Not planned (explicit non-goals)

These are deliberate rejections, with the reasoning documented so they don't get re-litigated. The same list also appears in PRINCIPLES.md §14 in short form; this is the long-form explanation.

### No certification program

Multiple readers (Pavel Apostolskiy, James Nyamukusa, Utsav Singh, Ben K, Victoria Aponte, James — at least six asks over the period) have requested a certification program. The engineering scope is monolithic: account system with Google/GitHub auth, quiz authoring tooling, quiz delivery, anti-gaming protections (proctoring? rate limits? IP checks?), score persistence, credential issuance, verifier endpoint, and the ongoing content authorship for the quizzes themselves. The demand signal is real but small (~6 individuals over months); the scope vastly exceeds it.

Track the interest count here. Revisit when a real product decision is made with dedicated resourcing — not before. Don't create an interest-list page either: collecting emails commits the project to follow-up work that can't yet be fulfilled.

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

## How this doc relates to TODO.md

`TODO.md` (local-only) is the active checkbox list — "do these phases in this order, here are the commits." It changes daily.

This file (`ROADMAP.md`) is strategic — "here's where we want to be, here's what we'd do if we had a free week." It changes when direction changes, not when work happens. If you find yourself updating ROADMAP because you finished a task, you should be updating TODO instead.

---

_Last updated: 2026-06-03._
