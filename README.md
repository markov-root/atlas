# AI Safety Atlas

An interactive, open-source textbook on **AI safety**, published at [ai-safety-atlas.com](https://ai-safety-atlas.com).

The chapters are co-authored by researchers at the [French Center for AI Safety (CeSIA)](https://cesia.org) and partners. The site is an [Astro](https://astro.build) static build with a custom content pipeline that pulls chapter prose from Google Docs.

## Quick start

```bash
git clone https://github.com/markov-root/atlas.git
cd atlas
pnpm install
pnpm dev
```

Open the URL pnpm prints (defaults to `http://localhost:4321`). **No `.env` file is required for local development** — chapter prose comes from the committed `.cache/docs/` snapshot.

## Commands

```bash
pnpm dev        # Start dev server
pnpm build      # Build to ./dist
pnpm check      # Fast loop: typecheck + tests (~10s)
pnpm verify     # Full pre-push gate: lint + typecheck + tests + build + smoke (~80s)
pnpm test       # Unit + integration tests only
```

See [`CONTRIBUTING.md`](./CONTRIBUTING.md) for the full command list, env-var reference, and contribution workflow.

## Documentation

| Doc                                                | What                                                           |
| -------------------------------------------------- | -------------------------------------------------------------- |
| [`CONTRIBUTING.md`](./CONTRIBUTING.md)             | Setup, workflow, env vars, commit conventions                  |
| [`TRANSLATING.md`](./TRANSLATING.md)               | How to contribute a translation into another language          |
| [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md)   | Build pipeline, BuildMode, repo layout, "why we chose this"    |
| [`docs/PRINCIPLES.md`](./docs/PRINCIPLES.md)       | Engineering principles with code references                    |
| [`docs/ROADMAP.md`](./docs/ROADMAP.md)             | Where the codebase is going (Now / Next / Later / Not planned) |
| [`docs/design-system.md`](./docs/design-system.md) | Visual patterns, component catalog, spacing tokens             |

## Contributing

External contributions welcome. See [`CONTRIBUTING.md`](./CONTRIBUTING.md) for setup and [`SECURITY.md`](./SECURITY.md) for reporting vulnerabilities privately.

## License

Code is MIT, textbook content is CC BY-SA 4.0 — both covered in [`LICENSE`](./LICENSE).

---

_AI Safety Atlas is maintained by Markov Grey and the French Center for AI Safety._
