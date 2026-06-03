# Security policy

## Reporting a vulnerability

If you've found a security issue in AI Safety Atlas, please report it privately rather than opening a public GitHub issue.

**Email:** open a GitHub issue marked `[SECURITY — private]` and a maintainer will reach out for a private channel, or contact the maintainer directly through their GitHub profile.

Please include:

- A description of the issue and the impact you're concerned about
- Steps to reproduce (or a proof-of-concept if you have one)
- The version / commit SHA you're testing against
- Whether you've shared the report with anyone else

We'll acknowledge receipt within a few days and let you know our planned timeline for a fix. For straightforward issues we'll aim for a fix within 14 days; for more involved issues we'll keep you posted on progress.

## What's in scope

The project's security surface is small but non-zero:

- **The deployed site** at https://ai-safety-atlas.com — XSS, SSRF, content-injection, malformed-input handling
- **The build pipeline** — secret leakage via committed cache (see `.cache/docs/README.md` for the secret-scan procedure), supply-chain risks via `package.json` dependencies
- **Cloudflare R2 distribution** — accidental write-access leakage, public-bucket misconfiguration

## What's out of scope

- **Reports against the live Google Docs source.** Editorial-content access is controlled by Google's sharing model; we can't act on those reports here.
- **Denial-of-service against the static CDN.** Cloudflare handles this; reports about static-site DoS aren't actionable for us.
- **Reports requiring physical access to the maintainer's machine** or pre-existing compromise of credentials.
- **Algolia public search-only key disclosure** — that key is public-by-design (see `docs/PRINCIPLES.md` §6). It cannot modify the search index.

## Coordinated disclosure

We prefer coordinated disclosure: please give us a chance to ship a fix before publishing details. Once a fix is deployed we'll credit you in the commit message and any related notes (unless you'd rather stay anonymous — just tell us).

## What this policy does not promise

This is a small open-source project with one primary maintainer. We don't have a paid bug-bounty program. We can't guarantee response times shorter than what's stated above. We'll treat your report with care; we just want to set expectations honestly.
