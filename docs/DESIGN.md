---
standard:
  version: 1
  id: design-system
  summary: Visual practice for the site - which rules are binding, which are advisory, and how a reviewer adjudicates a contested change.
  status: current
  owner: Markov Grey
  updated: '2026-09-21'
---

# Design system

Visual practice for the site: the layout patterns, components, spacing tokens, and icons in actual
use, plus the governance frame that makes them adjudicable. If you're building a new page or
section, prefer composing the existing components below over inventing layout - that preference is
rule **B1**, and it is binding.

This document is a **standard**, not a tour. Each rule below is marked **Binding** or **Advisory**;
§Scope says who and what it binds; §Conformance and exceptions says how a reviewer decides a
contested case and how an exception is authorized. Every factual claim about how the site is built
is anchored to the code that exhibits it, so a reviewer can verify it without trusting this file.

## Scope

**What this document binds:**

- **Surfaces:** all user-facing markup in `src/pages/`, `src/layouts/`, `src/components/`
  (including `src/components/nodes/`), and the hand-written CSS in `src/styles/global.css`.
- **People:** human contributors and agents adding or changing any of the above. Reviewers settling
  a contested PR apply this document to exactly that diff.

**What it does not govern** (with pointers to where those live):

- Content authoring - what the textbook says, and how the AST is produced from Google Docs - is
  covered by `docs/ARCHITECTURE.md` and the content-model/extensibility audits `docs/audits/0007`
  and `docs/audits/0008`.
- Accessibility conformance and performance are engineering properties, not visual ones; see
  `docs/PRINCIPLES.md` and the audit records under `docs/audits/`.

**Issuer and adoption.** The owner (Markov Grey) issued this standard as part of the documentation
governance adoption (`docs/tasks/0011`). Its rules deliberately describe practice that already
exists in the code - this is codification, not new policy - so the burden it places on contributors
is proportionate: follow the patterns you would find by imitation anyway. Changing this standard
means changing this file; a change to a **Binding** rule needs the owner's review of the PR that
changes it.

## Rules

The binding rules are numbered **B1–B4** so a review comment can cite them. Advisory guidance is
numbered **A1–A2**; it informs, it does not gate.

### B1 - Compose existing components over inventing layout (Binding)

Build a new page or section out of `Section`, `SectionContent`, `SplitSection`, and the components
listed under §Components before writing bespoke markup. The patterns in §Reference are the
house style: contained rounded-corner surfaces, 50/50 splits, centered `max-w-[40rem]` content.

**Why binding:** the site's coherence comes from these few patterns repeating across ~30 pages.
One-off layouts are how that coherence erodes, and they are also more work.

**How to conform:** use the components; pass their existing props (`align`, `padding`, `variant`,
`leftBg`/`rightBg`) instead of overriding classes. If none fits, first check whether an existing
component plus a `class` prop gets there - `Section`, `SectionContent`, and `SplitSection` all
accept a `class` pass-through for exactly this.

**When you may break it:** a genuinely new visual pattern that no composition achieves. See
§Conformance and exceptions for the authorization path.

### B2 - Use the spacing tokens (Binding)

The spacing values in §Spacing reference - section margin (`sm:mx-4`), section gap (`mt-4`),
content padding (`px-6 py-12 lg:px-8 lg:py-16`), card padding (`px-3 py-2`), card gap (`gap-2`) -
are the only values for those roles. Don't invent a new section margin or a new content padding for
one page. (`SectionContent`'s `padding="compact"` and `padding="hero"` variants exist for the two
known deviations - use them rather than hand-rolling their classes.)

**Why binding:** these values are what makes sections, cards, and page gutters line up everywhere;
arbitrary one-offs are visible misalignment.

### B3 - Stay inside the surface palette (Binding on the class set, Advisory on the choice)

Light surfaces are `bg-white` and `bg-gray-100` on `bg-gray-200` page background; dark surfaces are
`bg-black`; the single accent is `bg-blue-600` (hero); brand-tinted surfaces use the `brand` scale
defined in `src/styles/global.css` (`@theme`, `--color-brand-50` … `--color-brand-950`).

- **Binding:** new backgrounds use these classes - not arbitrary hex, not new grays. If you need a
  colour that isn't here, that is a B1-class exception (below), because a new colour is a new
  design token whether or not a component comes with it.
- **Advisory:** which surface a given section gets is a judgement call. The existing corpus's
  tendencies: light (`white`/`gray-100`) is the default reading surface; `bg-black` marks feature
  or closing sections; `bg-blue-600` appears only in hero contexts (`SplitSection`'s `blue` side
  and the homepage hero).

### B4 - Icons come from Tabler and CIB via astro-icon (Binding)

Two sets only: **Tabler** (`@iconify-json/tabler`) for UI icons, **CIB** (`@iconify-json/cib`) for
brand/social icons, rendered through `astro-icon`'s `<Icon>` (`astro-icon/components`). Don't
introduce inline SVGs, a second icon library, or emoji where an icon is wanted.

**Advisory:** which Tabler icon - prefer one already in use (see §Icons for the common set) over a
synonym.

### A1 - Match the light/dark text hierarchy (Advisory)

On light surfaces: `text-gray-900` headings, `text-gray-600` body. On dark surfaces:
`text-white` headings, `text-white/80` or `text-white/70` body, `divide-white/10` /
`border-white/10` dividers. These pairings are what the components emit (e.g. `SplitSection`'s
`textClasses`/`descriptionClasses` maps), so following them is mostly automatic when you use B1.

### A2 - Cards are full-width link rows with a trailing arrow (Advisory as a pattern, B2/B3 bind the classes)

The card idiom - a full-width clickable row with `tabler:arrow-right` on the right - is implemented
by `CardLink` for light and dark variants. Prefer it over designing a new card shape.

## Conformance and exceptions

A reviewer settling a contested PR works like this:

1. **Applicability.** Does the diff touch a surface in §Scope? If not (e.g. build config, tests),
   this standard doesn't apply.
2. **Conformance.** For each visual choice in the diff, find the rule (B1–B4) it falls under and
   check the anchor in §Reference or the cited component source. If the diff reuses the
   components/tokens, it conforms; no further judgement is needed.
3. **Exceptions.** A departure from a **Binding** rule is authorized when **both** hold:
   - It is recorded in the PR description - what was done instead, and why no composition of
     existing components achieves it.
   - The owner (Markov Grey) approves it in that PR. For a one-page need, that PR record is the
     whole authorization. For a pattern likely to be reused, the approval also commits the author
     to adding the new component to §Components in the same change - an unrecorded new pattern is
     a future B1 violation.
   - A departure from an **Advisory** item needs no authorization, only a defensible reason in
     review.

Nothing here waives correctness: accessibility and performance requirements in
`docs/PRINCIPLES.md` apply regardless of how a surface is styled.

## Reference

Concrete patterns and inventory, each anchored so a reviewer can verify a claim against the code.
Anchors are symbol-level (`file` + the class or export that exhibits the claim) rather than line
numbers, so they survive edits above them.

### Section layout pattern

The distinctive visual style uses **contained backgrounds with rounded corners**:

- Sections have `sm:mx-4` margin (shows the page background on the sides; `sm:` because the gutter
  is dropped on the smallest screens) - `Section.astro` `class:list`.
- Sections have `mt-4` spacing between them - same anchor.
- Backgrounds have `rounded-3xl` corners and `overflow-hidden` - same anchor.
- The page background is `bg-gray-200` with a `noise-bg` grain texture, set on `<body>` in
  `src/layouts/Default.astro`.

`Section` (`src/components/Section.astro`) is the minimal wrapper carrying exactly those classes;
`SplitSection` (`src/components/SplitSection.astro`) repeats them for the two-column pattern.

### Split layout pattern

Most sections use a 50/50 grid split:

```astro
<section class="sm:mx-4 mt-4 rounded-3xl overflow-hidden">
    <div class="grid lg:grid-cols-2">
        <!-- Left side -->
        <div class="bg-white flex justify-end">
            <div class="w-full max-w-[40rem] px-6 py-12 lg:px-8 lg:py-16">
                <!-- Content aligned toward center -->
            </div>
        </div>

        <!-- Right side -->
        <div class="bg-black text-white">
            <div class="w-full max-w-[40rem] px-6 py-12 lg:px-8 lg:py-16">
                <!-- Content aligned toward center -->
            </div>
        </div>
    </div>
</section>
```

Key points (all visible in `SplitSection.astro`):

- Each half uses `max-w-[40rem]` (half of 7xl) for content - `SectionContent.astro` `class:list`.
- Left side: `flex justify-end` pushes content toward center.
- Right side: content naturally aligns left (toward center).
- Together they form a centered 7xl-wide content area.
- Padding: `px-6 lg:px-8` to align with navbar - `SectionContent.astro` `paddingClasses.normal`.
- Backgrounds come from `SplitSection.astro`'s `bgClasses` map (`white|black|blue|gray`) with
  matching `textClasses`/`descriptionClasses`; `black` and `blue` backgrounds automatically get
  `GrainOverlay` (`needsGrain`), `gray` at reduced opacity (`grainOpacity`).

`SplitSection` composes all of this - use it rather than hand-writing the grid.

### Card links

Full-width clickable cards with arrow (`CardLink.astro`; markup below is the expanded idiom it
renders):

```astro
<div class="flex flex-col gap-2">
    <a href="/link" class="flex items-center justify-between px-3 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 hover:text-gray-900 transition-colors">
        <span>Link text</span>
        <Icon name="tabler:arrow-right" class="size-4 text-gray-400" />
    </a>
</div>
```

For dark backgrounds:

```astro
<a class="flex items-center justify-between px-3 py-2 text-sm text-white bg-white/10 rounded-lg hover:bg-white/20 transition-colors">
    <span>Link text</span>
    <Icon name="tabler:arrow-right" class="size-4 text-white/50" />
</a>
```

### Colour patterns

**Light sections:**
- Background: `bg-white` or `bg-gray-100`
- Text: `text-gray-900` (headings), `text-gray-600` (body)
- Cards: `bg-gray-100 hover:bg-gray-200`

**Dark sections:**
- Background: `bg-black`
- Text: `text-white` (headings), `text-white/80` or `text-white/70` (body)
- Cards: `bg-white/10 hover:bg-white/20`
- Dividers: `divide-white/10` or `border-white/10`

**Accent (hero):**
- Background: `bg-blue-600`
- Text: `text-white`, `text-white/80`

These pairings are canonicalized in `SplitSection.astro`'s `textClasses`/`descriptionClasses` and
in `Header.astro`'s dark/light nav classes.

### Icons

Uses `astro-icon` with Iconify icon sets:

- **Tabler Icons** (`@iconify-json/tabler`) - UI icons
- **CIB** (`@iconify-json/cib`) - Brand icons

```astro
import { Icon } from "astro-icon/components";

<Icon name="tabler:arrow-right" class="size-4" />
<Icon name="tabler:chevron-right" class="size-5" />
<Icon name="cib:github" class="size-6" />
```

Common icons (each in use today - verified across `src/components/`, `src/layouts/`, and
`src/pages/`):

- `tabler:arrow-right` - Link arrows (preferred for cards/CTAs; `CardLink.astro`)
- `tabler:chevron-right` / `tabler:chevron-left` - Navigation (`Reader.astro`, section pages)
- `tabler:chevron-down` - Expand/collapse (`Reader.astro`, `teach.astro`)
- `tabler:clock` - Time/duration (chapter/read pages)
- `tabler:thumb-up` / `tabler:thumb-down` - Feedback (`SectionFeedback.astro`)
- `tabler:search` - Search triggers (`Header.astro`, `AlgoliaSearch.astro`)
- `cib:github`, `cib:youtube` - Social links (`Footer.astro`)

### Components

Component inventory under `src/components/` unless noted. Props shown are the ones that exist in
the component's `Props` interface - check the source for the full set.

#### Layout

**Section** - Basic section wrapper with rounded corners and margins (`sm:mx-4 mt-4 rounded-3xl
overflow-hidden`, plus a `class` pass-through)

```astro
<Section id="my-section" class="bg-white">
  <!-- content -->
</Section>
```

**SectionContent** - Content container with max-width and alignment
(`align="left|right|center"`, `padding="normal|compact|hero"`)

```astro
<SectionContent align="left" padding="normal">
  <!-- content -->
</SectionContent>
```

**SplitSection** - Two-column layout with heading and named slots

```astro
<SplitSection
  heading="Section Title"
  headingDescription="Optional description"
  leftBg="white|black|blue|gray"
  rightBg="white|black|blue|gray"
>
  <div slot="left">Left content</div>
  <div slot="right">Right content</div>
</SplitSection>
```

#### Forms

All form components support `variant="light|dark"` (`Input.astro`, `InputLabel.astro`,
`RadioGroup.astro`; `Textarea` follows the same pattern).

**Button** - Multi-variant button/link (`variant="primary|gray|white|outline|dark|ghost"`,
optional `link` href, `large` flag)

```astro
<Button variant="primary" link="/optional-href" large>
  Label
</Button>
```

**Input** - Text input with label

```astro
<Input type="text" name="field" id="field" label="Field" variant="dark" placeholder="..." required />
```

**Textarea** - Multiline text input

```astro
<Textarea name="message" id="message" rows="3" variant="dark" placeholder="..." />
```

**InputLabel** - Form field label

```astro
<InputLabel for="field-id" variant="dark" required>Label</InputLabel>
```

**RadioGroup** - Radio button options

```astro
<RadioGroup
  name="choice"
  options={[{ value: "a", label: "Option A" }, { value: "b", label: "Option B" }]}
  variant="dark"
  required
/>
```

#### Navigation

**CardLink** - Full-width link card with arrow (`variant="light|dark"`)

```astro
<CardLink href="/path" variant="light">Link text</CardLink>
```

**VersionSelector** - Native select for textbook version (`variant="light|dark"`, reads/accepts
the current version)

```astro
<VersionSelector variant="light" currentVersion="v1" />
```

**CTAArrow** - Circular arrow button for CTAs (`direction="up-right|down|right"`)

```astro
<CTAArrow direction="up-right" />
```

#### Brand

**Lockup** - Logo with text (`variant="light|dark"`, `mono`)

```astro
<Lockup variant="light" mono />
```

**Logomark** - Logo icon only (renders `currentColor` fills, so colour it via a text class such as
`text-brand-600`)

```astro
<Logomark class="h-8 w-auto text-brand-600" />
```

#### Page

**Header** - Site navigation header (`variant="light|dark"`)

```astro
<Header variant="light" />
```

**Footer** - Site footer with contact form (always dark)

```astro
<Footer />
```

**FeatureCard** - Feature display with icon

```astro
<FeatureCard icon="tabler:icon-name" title="Feature" description="Description text" />
```

**GrainOverlay** - Grain texture for dark/blue backgrounds (`opacity`, default 0.5)

```astro
<GrainOverlay opacity={0.5} />
```

**OrgLogo** - Partner organisation logo (loads from `public/logos/`, populated at build time by
the logos loader - see `docs/audits/0010` F6 for that pipeline's failure modes)

**CopyMarkdownButton** - Copies the current page as Markdown

**SectionFeedback** - Thumb-up/down feedback row for section pages (the `tabler:thumb-up` /
`tabler:thumb-down` pair)

**SearchTrigger / AlgoliaSearch / DocSearchProvider** - The search surface: trigger button in the
header, DocSearch modal provider in `Default.astro`, and the Algolia-backed result view.

#### Content rendering (`nodes/`)

Components for rendering textbook content from the AST, under `src/components/nodes/`.
`NodeRenderer` (`src/components/NodeRenderer.astro`) is the recursive dispatcher; the rest are leaf
components.

- `NodeRenderer` - Main recursive renderer
- `Heading`, `Paragraph`, `List`, `ListItem`, `NumberedList`
- `Link`, `Span`, `SpanGroup`
- `Figure`, `Video`, `Iframe`
- `Callout`, `Quote`, `NoteBox`, `Definition`, `GlossaryDefinition`
- `InlineEquation`, `DisplayEquation`
- `Footnote`

## Spacing reference

Each value is binding (B2) and anchored where it is defined:

- Section margin: `sm:mx-4` (`Section.astro`, `SplitSection.astro`)
- Section gap: `mt-4` (same anchors)
- Content padding: `px-6 py-12 lg:px-8 lg:py-16` (`SectionContent.astro` `paddingClasses.normal`;
  `compact` → `px-6 py-8 lg:px-8 lg:py-12`, `hero` → adds `lg:pt-24`)
- Card padding: `px-3 py-2` (`CardLink.astro`, `Header.astro` nav pills)
- Card gap: `gap-2` (`CardLink.astro` usage context)

Not covered here but defined in `src/styles/global.css`: the `brand` colour scale (`@theme` block),
the `noise-bg` utility, and reader-specific classes (footnotes, callouts, code blocks).
