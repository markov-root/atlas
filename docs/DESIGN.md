# Design system

Visual patterns and reusable components used across the site. If you're building a new page or section, prefer composing the existing components below over inventing layout.

## Section layout pattern

The distinctive visual style uses **contained backgrounds with rounded corners**:

- Sections have `mx-4` margin (shows gray page background on sides)
- Sections have `mt-4` spacing between them
- Backgrounds have `rounded-3xl` corners
- Page background is `bg-gray-50` (set in Default layout)

## Split layout pattern

Most sections use a 50/50 grid split:

```astro
<section class="mx-4 mt-4 rounded-3xl overflow-hidden">
    <div class="grid lg:grid-cols-2">
        <!-- Left side -->
        <div class="bg-white flex justify-end">
            <div class="w-full max-w-[40rem] px-6 py-12 lg:px-8 lg:py-16">
                <!-- Content aligned to center -->
            </div>
        </div>

        <!-- Right side -->
        <div class="bg-black text-white">
            <div class="w-full max-w-[40rem] px-6 py-12 lg:px-8 lg:py-16">
                <!-- Content aligned to center -->
            </div>
        </div>
    </div>
</section>
```

Key points:
- Each half uses `max-w-[40rem]` (half of 7xl) for content
- Left side: `flex justify-end` pushes content toward center
- Right side: content naturally aligns left (toward center)
- Together forms a centered 7xl-wide content area
- Padding: `px-6 lg:px-8` to align with navbar

## Card links

Full-width clickable cards with arrow:

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

## Color patterns

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

## Icons

Uses `astro-icon` with Iconify icon sets:

- **Tabler Icons** (`@iconify-json/tabler`) — UI icons
- **CIB** (`@iconify-json/cib`) — Brand icons

```astro
import { Icon } from "astro-icon/components";

<Icon name="tabler:arrow-right" class="size-4" />
<Icon name="tabler:chevron-right" class="size-5" />
<Icon name="cib:github" class="size-6" />
```

Common icons:
- `tabler:arrow-right` — Link arrows (preferred for cards/CTAs)
- `tabler:chevron-right` / `tabler:chevron-left` — Navigation
- `tabler:chevron-down` — Expand/collapse
- `tabler:clock` — Time/duration
- `tabler:thumb-up` / `tabler:thumb-down` — Feedback
- `cib:github`, `cib:youtube` — Social links

---

## Components

### Layout

**Section** — Basic section wrapper with rounded corners and margins

```astro
<Section id="my-section" class="bg-white">
  <!-- content -->
</Section>
```

**SectionContent** — Content container with max-width and alignment

```astro
<SectionContent align="left|right|center" padding="normal|compact|hero">
  <!-- content -->
</SectionContent>
```

**SplitSection** — Two-column layout with heading and named slots

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

### Forms

All form components support `variant="light|dark"` for use on light or dark backgrounds.

**Button** — Multi-variant button/link

```astro
<Button variant="primary|gray|white|outline|dark|ghost" link="/optional-href" large>
  Label
</Button>
```

**Input** — Text input with label

```astro
<Input type="text" name="field" id="field" label="Field" variant="dark" placeholder="..." required />
```

**Textarea** — Multiline text input

```astro
<Textarea name="message" id="message" rows="3" variant="dark" placeholder="..." />
```

**InputLabel** — Form field label

```astro
<InputLabel for="field-id" variant="dark" required>Label</InputLabel>
```

**RadioGroup** — Radio button options

```astro
<RadioGroup
  name="choice"
  options={[{ value: "a", label: "Option A" }, { value: "b", label: "Option B" }]}
  variant="dark"
  required
/>
```

### Navigation

**CardLink** — Full-width link card with arrow

```astro
<CardLink href="/path" variant="light|dark">Link text</CardLink>
```

**VersionSelector** — Native select for textbook version

```astro
<VersionSelector variant="light|dark" currentVersion="v1" />
```

**CTAArrow** — Circular arrow button for CTAs

```astro
<CTAArrow direction="up-right|down|right" />
```

### Brand

**Lockup** — Logo with text

```astro
<Lockup variant="light|dark" mono />
```

**Logomark** — Logo icon only

```astro
<Logomark class="h-8 w-auto text-brand-600" />
```

### Page

**Header** — Site navigation header

```astro
<Header variant="light|dark" />
```

**Footer** — Site footer with contact form (always dark)

```astro
<Footer />
```

**FeatureCard** — Feature display with icon

```astro
<FeatureCard icon="tabler:icon-name" title="Feature" description="Description text" />
```

**GrainOverlay** — Grain texture for dark/blue backgrounds

```astro
<GrainOverlay opacity={0.5} />
```

### Content rendering (`nodes/`)

Components for rendering textbook content from the AST. `NodeRenderer` is the recursive dispatcher; the rest are leaf components.

- `NodeRenderer` — Main recursive renderer
- `Heading`, `Paragraph`, `List`, `ListItem`, `NumberedList`
- `Link`, `Span`, `SpanGroup`
- `Figure`, `Video`, `Iframe`
- `Callout`, `Quote`, `NoteBox`, `Definition`, `GlossaryDefinition`
- `InlineEquation`, `DisplayEquation`
- `Footnote`

## Spacing reference

- Section margin: `mx-4`
- Section gap: `mt-4`
- Content padding: `px-6 py-12 lg:px-8 lg:py-16`
- Card padding: `px-3 py-2`
- Card gap: `gap-2`
