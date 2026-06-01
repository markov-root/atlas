# Textbook content cache (committed)

This directory holds a snapshot of the parsed Google Docs that back the
Atlas textbook. It is committed to the repository so contributors can run
`pnpm dev` and `pnpm build` without Google credentials.

The rest of `.cache/` is git-ignored — only `.cache/docs/` is checked in
(see the carve-out in `.gitignore`).

## Format

One file per Google Doc tab, named `<documentId>:<tabId>` (no extension).
The body is the JSON-serialized `docs_v1.Schema$DocumentTab` returned by
the Google Docs API, with inline-image `contentUri` values rewritten to
local paths under `/assets/uc/<sha256>.<ext>`.

The image assets themselves are NOT committed (`src/assets/uc/` is
ignored). Contributors get caption-only figures; maintainers regenerate
the assets when refreshing the cache.

## Refreshing the cache

```bash
# Maintainer with .env containing GOOGLE_CREDENTIALS_BASE64
rm -rf .cache/docs/*           # optional — forces a clean rebuild
pnpm build                     # repopulates the cache
git diff --stat .cache/docs/   # inspect the delta
```

The CI workflow `.github/workflows/content-refresh.yml` does this
nightly and opens a PR with any changes (Track B work — not yet in
place at time of seeding).

## Secret-scan procedure (MANDATORY before committing the cache)

Before committing the contents of this directory, scan for accidentally
pasted secrets (authors sometimes paste API keys, internal URLs, or
draft notes into Google Docs):

```bash
rg -iIn 'api[_-]?key|secret|token|password|bearer|aws_access|aws_secret|-----BEGIN' .cache/docs/
```

Manually review every hit. Most matches will be benign (the word
"secret" appearing in textbook prose) but anything that looks like an
actual credential MUST be removed at the source (the Google Doc) before
the cache is committed. Re-run the build and re-scan to confirm.

## Why this approach

This is a deliberate short-term unlock so external contributors aren't
blocked on credential access. The longer-term plan is to publish content
as a versioned R2 artifact and have `pnpm install` fetch it (see Track
D.1 in `docs/TODO.md`).
