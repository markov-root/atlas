# Translating the Atlas

We want translations. This doc is what you need to start one.

## What you're translating

The reference for translators is **Edition 1** — the current state of the English textbook. There's no minor-version ceremony to track; readers see "Edition 1" and that's the unit you translate against. The maintainer will let you know if and when Edition 1 changes enough that you'd want to incorporate the delta.

## Before you start

Open a GitHub issue titled `[Translation] {Language}` (e.g. `[Translation] Spanish`) with:

- **Target language code** in [BCP 47](https://www.rfc-editor.org/info/bcp47) form (e.g. `es`, `fr`, `pt-BR`)
- **Brief introduction** — your background, why you're interested, links if relevant
- **Solo or team** — roughly how many people
- **Rough timeline** — weeks, months, etc. (no commitment, just so we can plan)

The maintainer will:

1. Confirm there isn't already an in-flight translation for your language
2. Set up your working Google Docs (one per chapter — described below) and share them with you
3. Help connect you to adjacent translators if relevant

You never need to touch Git, Astro, or any code. The whole translator workflow happens in Google Docs.

## How the working Docs are organized

For each translation, the maintainer creates **8 new Google Docs** — one per chapter — by copying the canonical English Docs. These copies are yours to work in; the canonical English Docs are never touched by translators.

Each of your 8 chapter Docs has **two tabs**:

| Tab                             | Purpose                                                                       | Edit it?                     |
| ------------------------------- | ----------------------------------------------------------------------------- | ---------------------------- |
| `English (Edition 1 reference)` | A frozen snapshot of the English chapter at the time your translation started | No — read-only by convention |
| `{Your-language} translation`   | Where you do the work                                                         | Yes — this is your tab       |

The reference tab sits in the same Doc as your translation, so you can flip between them when checking nuance or context. The reference is **frozen** — if the canonical English Doc gets edited after your translation starts, the reference tab doesn't auto-update. The maintainer will flag substantive deltas in your registration issue; minor edits don't propagate.

If the maintainer eventually refreshes your reference snapshot (e.g. before you start a new chapter, or after an Edition 1 update you choose to incorporate), they'll do it deliberately, in conversation with you.

## The workflow

### 1. Get a sanity-check partner

Before you start translating, identify a **second person fluent in the target language with some ML / AI-safety background**. They review your translation for both linguistic and technical accuracy. This is non-negotiable — solo translations don't get merged, because we can't independently verify accuracy. If you can't find one, say so in the issue thread; we'll help connect you to the community.

### 2. Confirm your Docs are set up

After the maintainer creates your 8 chapter Docs, they'll share them with you (edit access) and post the list in your registration issue. Skim them, confirm the reference tabs read correctly, and flag any obvious copy errors.

### 3. Establish your glossary

Technical terms — alignment, RLHF, deceptive alignment, mesa-optimizer, capability overhang, etc. — need consistent translations across the whole textbook. Create a separate Google Doc titled `Atlas Glossary [your language]`. Add terms as you encounter them; decide once, use the decision everywhere.

If a translation in your language is already in progress, ask the existing translator(s) for their glossary doc and inherit those decisions. Each language has its own glossary.

Glossary terms eventually get added to the repo (see "How the glossary lands in the site" below), but you don't need to do that yourself — the maintainer handles it.

### 4. Translate

Chapter by chapter. Track your progress in the GitHub issue (a simple checkbox list per chapter works). Your sanity-check partner reads each chapter and either signs off or sends back comments. Iterate.

Don't ship a chapter that hasn't been reviewed.

### 5. Register the translated chapters

When a chapter (or the whole edition) is ready to publish, comment on the issue with:

- Confirmation that each chapter has been sanity-checked, and by whom
- Pointer to the glossary doc

The maintainer:

1. Grabs the `tabId` of your `{Your-language} translation` tab in each Doc (from the Google Docs URL)
2. Exports your glossary doc into the repo's per-language glossary directory
3. Adds a new `TextbookDefinition` entry to `src/textbook-loader/data.ts` with your language code, the 8 `docId`s, and the 8 `tabId`s
4. Opens a PR and merges it

From the next deploy, your translation appears at `/{lang}/chapters/v1/...` on the live site.

## What stays in English (don't translate)

| Content                                      | Why                                                            |
| -------------------------------------------- | -------------------------------------------------------------- |
| Code blocks                                  | Code is universal; translating breaks meaning                  |
| Math symbols and variable names in equations | Same                                                           |
| URLs in citations                            | They're addresses, not text                                    |
| Citation titles                              | Translate only if the paper has an official translated version |
| Figure images (the visuals themselves)       | The captions translate; the images stay                        |

Translate everything else — chapter prose, headings, figure captions, footnotes, callouts, sidebars, definitions, alt text on figures.

### Alt text specifically

Each figure has an alt-text field for accessibility (screen readers). Please translate alt text directly in your tabs alongside the figure captions. **Don't rely on automated alt-text generation in your language** — quality varies a lot, and we want translated editions to read consistently.

## What the site provides for a translated edition

| Feature                                | Status                                                                                                                                                                                                                             |
| -------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Web pages at `/{lang}/chapters/v1/...` | ✓                                                                                                                                                                                                                                  |
| Search (Algolia, per-language index)   | ✓ once content is indexed                                                                                                                                                                                                          |
| Per-chapter PDFs (via Typst)           | ✓ for Latin-script European languages (Spanish, French, German, Portuguese, Italian, etc.). Non-Latin scripts (CJK, Arabic, Hebrew, Cyrillic, Devanagari, etc.) need the Typst template extended — flag in your registration issue |
| Audio narration (TTS)                  | Per-language voice selection. Quality varies by language and provider. May lag behind text publication; we coordinate per language                                                                                                 |
| Glossary hover-on definitions          | ✓ — uses your translated glossary                                                                                                                                                                                                  |

### Known limitations

- **Right-to-left languages** (Arabic, Hebrew, Persian, Urdu): the Typst PDF template and some CSS layouts don't yet support RTL rendering. If you're translating into an RTL language, flag it in your issue — we'll prioritize the template work alongside your translation.
- **Audio quality** varies significantly by language and TTS provider. We're actively working on this; for some languages, audio may ship later than the text.

## How the glossary lands in the site

The per-language glossary lives in the repo as an Astro content collection: one JSON file per term at `src/content/glossary/{version}-{language}/{term-slug}.json`. When you register your translation, the maintainer converts your glossary doc into per-term JSON files and commits them. You don't write JSON — that's our side of the boundary.

## Credit

By default, translators are credited on the site (name, optional link, which chapters you translated). If you'd prefer to remain anonymous, say so in the registration issue and we'll honor it.

The textbook content license is [CC BY-SA 4.0](./LICENSE). By submitting a translation, you license your translated text under the same terms. The same license that lets us share the English original lets others share your translation.

## What happens when Edition 1 changes

The English Atlas continues evolving. Here's how that flows back to translations:

| Change                                                        | What happens for translators                                                                                                                                                      |
| ------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Small edits (typos, sentence polishing, minor clarifications) | Maintainer doesn't flag; pick up at your leisure if you notice                                                                                                                    |
| Substantive section rewrites or additions                     | Maintainer comments on your translation issue with the delta; you decide whether to incorporate. If you do, the maintainer refreshes your reference tab for the affected chapters |
| Whole-textbook restructure (Edition 2)                        | Rare. New URL tree at `/chapters/v2/...`; your existing translation stays at `/{lang}/chapters/v1/...` indefinitely. You can choose to translate Edition 2 when you have time     |

Readers never see minor version numbers. Internally, the maintainer tracks what's been translated against what state of the English source.

## Where to ask

Use the registration issue as your home base — questions about specific terms, structural decisions, status updates, and review requests all happen there.

For unrelated questions or proposals to change this process itself, open a new issue.

---

_Translations are how this work reaches the people who most need it. Thanks for being one of them._
