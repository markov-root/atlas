# Atlas Foreview Website

## Commands

- Use `pnpm` (not npm or yarn)
- `pnpm dev` - Start dev server
- `pnpm build` - Build for production

## Design System

### Section Layout Pattern

The distinctive visual style uses **contained backgrounds with rounded corners**:

- Sections have `mx-4` margin (shows gray page background on sides)
- Sections have `mt-4` spacing between them
- Backgrounds have `rounded-3xl` corners
- Page background is `bg-gray-50` (set in Default layout)

### Split Layout Pattern

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

### Card Links

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

### Color Patterns

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

Common icons:
- `tabler:arrow-right` - Link arrows (preferred for cards/CTAs)
- `tabler:chevron-right` / `tabler:chevron-left` - Navigation
- `tabler:chevron-down` - Expand/collapse
- `tabler:clock` - Time/duration
- `tabler:thumb-up` / `tabler:thumb-down` - Feedback
- `cib:github`, `cib:youtube` - Social links

### Component Variants

**Header:** Supports `variant="dark"` for dark backgrounds (white text/logo)

**Lockup (logo):** Supports `variant="dark"` for dark backgrounds

### Spacing Reference

- Section margin: `mx-4`
- Section gap: `mt-4`
- Content padding: `px-6 py-12 lg:px-8 lg:py-16`
- Card padding: `px-3 py-2`
- Card gap: `gap-2`
