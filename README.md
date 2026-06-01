# Atlas Foreview

An interactive, open-source textbook on **AI safety**, published at [ai-safety-atlas.com](https://ai-safety-atlas.com).

The chapters are co-authored by researchers at the [French Center for AI Safety (CeSIA)](https://cesia.org) and partners. The site is an [Astro](https://astro.build) static build with a custom content pipeline that pulls chapter prose from Google Docs, transforms it to a structured AST, and renders web pages, PDFs, and audio.

## Quick start

```bash
git clone https://github.com/markov-root/atlas.git
cd atlas
pnpm install
pnpm dev
```

Open the URL pnpm prints (defaults to `http://localhost:4321`). **No `.env` file is required for local development.**

## Contributor vs. maintainer builds

The same `pnpm dev` / `pnpm build` works in two modes, decided automatically by which environment variables are set:

|  | Contributor mode | Maintainer mode |
|---|---|---|
| `.env` required | No | Yes (`GOOGLE_CREDENTIALS_BASE64`) |
| Chapter text | ✓ from committed cache | ✓ fresh from Google Docs |
| Figure images | Captions only | ✓ downloaded fresh |
| Algolia search | ✓ works (public keys baked in) | ✓ works + indexes fresh content |
| PDF generation | Skipped | ✓ via Typst |
| Audio generation | Skipped | ✓ via ElevenLabs + Gemini |
| R2 upload | Skipped | ✓ for PDFs and audio |

A startup banner declares the resolved mode:

```
[atlas] BuildMode: contributor, cache-only, no PDF, no audio, no R2 audio pull, no Algolia indexing, search enabled
```

See [`ARCHITECTURE.md`](./ARCHITECTURE.md) for how the mode detection works.

## Commands

```bash
pnpm dev          # Start dev server on http://localhost:4321
pnpm build        # Build to ./dist
pnpm preview      # Serve the built dist/

pnpm test         # Run the unit + integration test suite (~7s)
pnpm test:smoke   # Run end-to-end build smoke test (~33s)
pnpm test:watch   # Vitest in watch mode
pnpm typecheck    # astro check
```

## Environment variables

All env vars are optional. Copy `.env.example` to `.env` and fill in the ones you need.

| Variable | Required for | Notes |
|---|---|---|
| `GOOGLE_CREDENTIALS_BASE64` | Refreshing textbook content | Maintainer only |
| `ALGOLIA_WRITE_KEY` | Re-indexing search | Maintainer only |
| `ELEVENLABS_API_KEY` | TTS audio rendering | Maintainer only |
| `GEMINI_API_KEY` | Equation descriptions for audio | Maintainer only |
| `R2_ENDPOINT`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET` | Uploading PDFs/audio | Maintainer only |
| `PUBLIC_ALGOLIA_APP_ID`, `PUBLIC_ALGOLIA_SEARCH_KEY` | — | Defaults committed in `astro.config.mjs`; leave blank to use them |
| `SKIP_PDF`, `SKIP_AUDIO`, `SKIP_AUDIO_DOWNLOAD` | Speeding up local iteration | Bypass expensive stages even when creds are present |

## Project structure

```
atlas/
├── src/
│   ├── pages/             # Astro routes (.astro files become pages)
│   ├── components/        # Astro components (nodes/, navigation/, etc.)
│   ├── layouts/           # Page layouts
│   ├── content.config.ts  # Astro content collection: textbooks + organizations
│   ├── lib/
│   │   ├── build-mode.ts  # Env-mode detection (single source of truth)
│   │   ├── reader.ts      # Reader-page helpers
│   │   └── ...
│   ├── textbook-loader/   # Content pipeline (Google Docs → AST → web/PDF/audio)
│   │   ├── data.ts        # Edition + chapter definitions (docIds, authors)
│   │   ├── loader.ts      # TextbookLoader.load()
│   │   ├── gdocsdk.ts     # Google Docs API + caching layer
│   │   ├── transformer.ts # Doc JSON → custom AST
│   │   └── renderers/     # pdf/ (Typst) and audio/ (ElevenLabs + R2)
│   ├── styles/            # Global Tailwind setup
│   └── assets/uc/         # Downloaded chapter images (gitignored, regenerated)
├── .cache/
│   └── docs/              # COMMITTED snapshot of parsed Google Docs (~8.7MB)
├── tests/
│   └── smoke/             # End-to-end build smoke tests (opt-in)
├── astro.config.mjs       # Astro config + env schema
├── vitest.config.ts       # Test runner config
└── pnpm-workspace.yaml    # pnpm build-script allow-list
```

For deeper detail (build pipeline, AST shape, test layers, R2 layout) see [`ARCHITECTURE.md`](./ARCHITECTURE.md).

## Contributing

External contributions are welcome. The contributor build path was designed to remove the credential barrier — if you hit one, that's a bug, please file an issue.

A more complete contribution guide will land as part of Track C of the OSS-readiness work (see `docs/TODO.md` if you have access).

## License

To be added (planned: MIT for code, CC BY-SA 4.0 for textbook prose — see `docs/TODO.md` Track C.1).

---

*Atlas Foreview is maintained by Markov Grey and the French Center for AI Safety.*
