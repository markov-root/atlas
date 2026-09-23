---
schema_version: 2
id: '0006'
uid: 'audit-20260921T134858000000Z-6f1c2ab4'
title: 'Developer ergonomics and the case for an `atlas` control surface'
role: audit
status: draft
summary: 'The two highest-value maintainer operations have no direct invocation; operator knowledge lives in file headers rather than a discoverable surface.'
created: '2026-09-21'
updated: '2026-09-21'
owner: Markov Grey
supersedes: ''
superseded_by: ''
engineering_document:
  version: 1
  contract_tier: full
  role: audit
  id: '0006'
  uid: audit-20260921T134858000000Z-6f1c2ab4
  title: 'Developer ergonomics and the case for an `atlas` control surface'
  state: draft
  authority:
    kind: point-in-time-evidence
    owner: Markov Grey
    scope: 'Command surface, env surface, and operator scripts at commit 05cca32; no operation was executed'
  created: '2026-09-21'
  updated: '2026-09-21'
  transition_history: unverified
  transitions: []
  relationships: []
  details:
    as_of: '2026-09-21'
    subjects:
      [
        'AI Safety Atlas command and env surface at 05cca32',
        'CoP Dataset bin/cop + utility/ as comparison reference',
      ]
    method: 'Static inspection of package.json, scripts/, .github/workflows/, astro.config.mjs, and process.env reads; no command executed'
    limitations:
      - 'No operation was run end to end; friction is inferred from invocation shape, not measured'
      - 'No timing data - "expensive" claims come from code comments, not measurement'
      - 'Single-maintainer workflow was not observed directly; inferred from docs and script headers'
---

# Audit 0006: Developer ergonomics and the case for an `atlas` control surface

## Scope

The developer and maintainer command surface of AI Safety Atlas at commit `05cca32`
(branch `codebase-cleanup`, 2026-09-21): `package.json` scripts, `scripts/`, `.github/workflows/`,
the environment-variable surface in `astro.config.mjs`, and every `process.env` read in `src/`.

`~/Git/CoP Dataset` (`bin/cop` + `utility/`, governed by its ADR-0119) was read as the comparison
reference the owner named.

**Not examined:** editor/IDE setup, CI runtime or cost, the contributor onboarding path in
`CONTRIBUTING.md` beyond its command references, and anything requiring credentials to exercise.

## Method

Read-only static inspection. No command was executed and no operation was run:

```bash
jq -r '.scripts | to_entries[]' package.json                     # command surface
rg -o '^\s+([A-Z_0-9]+): envField' astro.config.mjs -r '$1'      # declared env
rg -o 'process\.env\.([A-Z_0-9]+)' -r '$1' src scripts           # actual env reads
rg -n 'SKIP_AUDIO|SKIP_PDF' src/textbook-loader/loader.ts        # invocation gating
```

`docs/PRINCIPLES.md` §10 (YAGNI) and §14 (Explicit non-goals), and `docs/ROADMAP.md` §Next and
§Not planned, were read first, because a control surface is exactly the kind of speculative
infrastructure §10 warns against and a recommendation has to engage with that.

## Findings

### F1 - The two highest-value maintainer operations have no direct invocation

_Observation._ Refreshing content from Google Docs and generating audio are both reachable **only**
as side effects of a full `astro build`, gated by environment variables:

- `src/content.config.ts:89-90` bridges `BuildMode` onto `process.env.SKIP_PDF` / `SKIP_AUDIO`.
- `src/textbook-loader/loader.ts:77` gates the PDF renderer; `:82` sets the audio renderer's
  `skipGeneration`.
- The audio renderer is constructed inside `TextbookLoader.load()`. There is no module that renders
  audio without going through a build.

There is no `package.json` script, no binary, and no entry point for "pull the latest chapter text"
or "regenerate audio for chapter 4". The procedure is: set the right combination of up to 13
environment variables, then run `pnpm build` and wait for the whole site.

_Inference._ This is the single strongest ergonomic finding in the audit, and it is precisely the gap
the owner's envisaged `atlas pull --chapter *` and `atlas generate audio --chapter *` would close.
The operations already exist as code; what is missing is an addressable name for them. Note the
consequence for blast radius: because the only invocation is "whole build", a maintainer who wants
one chapter's audio has no way to ask for less.

### F2 - Operator knowledge lives in file headers, not in a discoverable surface

_Observation._ The two files in `scripts/` are unusually well documented - and entirely by prose
comment:

- `scripts/copy-chapter-audio.sh` (146 lines) opens with a ~30-line header explaining two acquisition
  routes, why it does _not_ touch committed `.words.json` files, and the `ATLAS_AUDIO_SRC` override.
- `scripts/swap-cbr-audio.ts` (112 lines) opens with a ~25-line header including a `Usage:` block
  documenting a dry-run default, a `--yes` confirmation flag, and an optional chapter-number filter.

`pnpm run` lists the 16 `package.json` scripts. Neither of these two operations appears in that list.
Discovering them requires `ls scripts/`, and understanding them requires opening the file.

_Inference._ `swap-cbr-audio.ts` has already independently invented the conventions of a CLI -
dry-run by default, explicit `--yes` to act, positional filter argument. The shape of the control
surface is not hypothetical; it is already present, just not addressable or discoverable. The quality
of these headers is a point in the project's favour, but prose in a file the reader has to already
know about is the least discoverable place for it.

### F3 - The env surface is larger than the schema declares

_Observation._ `astro.config.mjs` declares 13 fields via `envField`. Four further variables are read
directly from `process.env` in `src/` and never appear in that schema:

| Variable              | Read at                                | Declared? |
| --------------------- | -------------------------------------- | --------- |
| `SKIP_AUDIO_DOWNLOAD` | `renderers/audio/renderer.ts:53`       | no        |
| `ELEVENLABS_VOICE_ID` | `renderers/audio/elevenlabs-tts.ts:9`  | no        |
| `ELEVENLABS_MODEL_ID` | `renderers/audio/elevenlabs-tts.ts:10` | no        |
| `GEMINI_TTS_MODEL`    | `renderers/audio/gemini-tts.ts:9`      | no        |

A fifth, `ATLAS_AUDIO_SRC`, is read only by `scripts/copy-chapter-audio.sh`.

_Inference._ `SKIP_AUDIO_DOWNLOAD` is **not** an oversight - `docs/PRINCIPLES.md:29` names it
explicitly as a sanctioned local-dev escape hatch, and `CONTRIBUTING.md:72` and
`docs/ARCHITECTURE.md:208` both document it. The other three are undocumented model/voice overrides
with hardcoded defaults. The finding is not "these are wrong" but that the schema is no longer a
complete inventory, so `astro.config.mjs` cannot be used as the one place to learn what is tunable.

### F4 - `lint:actions` embeds shell logic in a JSON string

_Observation._ `package.json`:

```json
"lint:actions": "for f in .github/workflows/*.yml; do action-validator \"$f\" || exit 1; done"
```

This is the only script containing control flow. The remaining 15 are a single command or a `&&`
chain.

_Inference._ Shell inside a JSON string is unquotable, untestable, and unreadable at the point of
use. It is a small instance of the general pattern: when an operation outgrows one command, the
`package.json` scripts field has nowhere for it to go, so it gets crammed in anyway. It is a
one-line example of the pressure a control surface would relieve.

### F5 - The `atlas lint` the owner envisages has no existing home

_Observation._ The owner's envisaged surface includes prose/voice quality checks and dead-link
checking. Neither exists. `docs/ROADMAP.md` §Next already plans a "Link checker (lychee, scheduled)";
there is no plan of record for prose or voice checks.

_Inference._ These are net-new capabilities rather than renamings of existing ones, which makes them
weaker justification for the control surface than F1 and F2. They are better read as evidence about
_direction_ - the owner expects the operation count to grow - than as present need.

### F6 - The comparison reference is more separated than Atlas needs

_Observation._ `~/Git/CoP Dataset/bin/cop` is 6 lines: `cd` to the repo root and
`exec uv run python -m utility "$@"`. Its header states the adapter is deliberately logic-free and
that the checkout-local script, the installed console script, and `python -m utility` all enter the
same function. `bin/README.md` records that "The former `scripts/` tree is retired."

_Inference._ The valuable, transferable part of that pattern is the **separation**: a trivial
launcher whose only job is to exist at a stable path, with all logic in a real, testable package.
The three-equivalent-entry-points property is driven by Python packaging and installed console
scripts; Atlas is a pnpm/TypeScript repo where the equivalent is a `tsx` entry point, and copying the
Python shape literally would be cargo-culting.

### F7 - The current surface is not, on its own evidence, broken

_Observation._ 16 `package.json` scripts, of which 4 are thin Astro pass-throughs (`dev`, `build`,
`preview`, `astro`) and 2 are documented composites (`check`, `verify`). They use `:` as informal
namespacing (`test:smoke`, `test:a11y`, `lint:actions`, `format:check`). Two CI workflows exist.
`docs/PRINCIPLES.md:123` states YAGNI: "don't speculate, but build when demand is real."

_Inference._ Recorded deliberately as the counter-case. A day-to-day contributor's loop - `pnpm dev`,
`pnpm check`, `pnpm verify` - is well served today, and nothing in this audit shows that loop failing.
The case for a control surface rests entirely on the **maintainer** operations in F1 and F2, not on
the contributor loop. An audit that ignored this would be advocacy rather than evidence.

## Limitations

- **Nothing was executed.** Every friction claim is inferred from the shape of an invocation, not
  measured. No content refresh, audio render, or R2 operation was run.
- **No timing data.** Words like "expensive" are taken from code comments (for example
  `r2-cache.ts`'s note about avoiding re-uploading 100+ MB), not from measurement.
- **The maintainer workflow was not observed.** F1's claim that refreshing content means a full build
  comes from reading the call path, not from watching the operation. If an undocumented shortcut
  exists, this audit would not have seen it.
- **The CoP Dataset comparison is structural only.** Its CLI was not run, and no evidence was
  gathered about whether that surface is actually pleasant to use in practice.
- **`atlas lint`'s feasibility is unassessed.** Whether prose/voice checking against a writing
  standard is tractable was not investigated at all.

## Recommendations

The owner stated a lean toward the `bin/` approach and asked the audit for evidence. **The evidence
supports it, but narrowly and for a specific reason** - not because 16 scripts is too many, but
because F1 shows two significant operations have _no_ invocation at all, and F2 shows a third already
CLI-shaped but undiscoverable.

1. **Adopt a control surface, scoped initially to the operations that exist but cannot be named
   (F1, F2). Size M.** The minimum viable set is exactly the gap this audit evidenced:

   | Command                              | Status today                              |
   | ------------------------------------ | ----------------------------------------- |
   | `atlas pull [--chapter N]`           | no invocation; full build + env vars      |
   | `atlas generate audio [--chapter N]` | no invocation; full build + env vars      |
   | `atlas audio stage [--fetch] N [S]`  | exists as `scripts/copy-chapter-audio.sh` |
   | `atlas audio publish-cbr [--yes] N`  | exists as `scripts/swap-cbr-audio.ts`     |

   Risk: this is new infrastructure in a repo whose §10 is YAGNI. The mitigation is that three of
   these four wrap code that already exists, so the first version is an addressing layer rather than
   new capability. **Do not build `atlas lint` in the first pass** (F5) - it is net-new capability,
   and bundling it would convert a justified refactor into a speculative one.

2. **Keep `bin/atlas` logic-free; put the logic in a testable TypeScript module (F6). Size S,
   inside 1.** Follow the _separation_ from `bin/cop`, not its Python shape: a short shell adapter
   that `exec`s a `tsx` entry point, with commands as ordinary importable functions. This is what
   makes the surface testable - the current `scripts/` operations have no tests, and a CLI that is
   mostly `process.argv` parsing around imported functions can have them. Risk: low.

3. **Leave `package.json` scripts alone (F7). Size zero.** `dev`, `build`, `check`, `verify` are the
   contributor-facing loop, they are referenced by `CONTRIBUTING.md`, `AGENTS.md`, the pre-push hook,
   and CI, and this audit found no problem with them. Two surfaces with distinct audiences -
   contributor lifecycle in `package.json`, maintainer operations in `atlas` - is the honest split.
   Risk of ignoring this: a migration that moves `pnpm verify` into `atlas verify` breaks the git
   hook and both workflows for no gain.

4. **Move `lint:actions` into the control surface once it exists (F4). Size S.** Small, but it is the
   one script that demonstrably does not fit its container. Risk: none.

5. **Record the env surface as part of the CLI, not separately (F3). Size S.** If `atlas` becomes the
   way operations are invoked, the four undeclared variables become flags with defaults, and the
   question of whether `astro.config.mjs` is a complete inventory stops mattering for the operations
   that move. Risk: partial migration leaves two places to look, which is worse than one; sequence
   this after 1.

**Not recommended:** retiring `scripts/` the way CoP Dataset did, at least initially. Its two files
carry substantial documented rationale in their headers; that prose should migrate into the new
commands' own documentation before the files are deleted, or the reasoning is lost. Deleting them in
the same change that adds the CLI risks discarding the most valuable thing they contain.

## Disposition

**Pending owner decision. No implementation is authorised by this audit.**

The owner asked for the audit's evidence before committing to the `bin/` approach. That evidence is
in F1, F2, and F4 (supporting), and F5 and F7 (limiting). The recommended shape is narrower than the
surface the owner sketched: build the addressing layer for operations that already exist; defer
`atlas lint` until there is a concrete check to run.

Per `handoff:0002` §Constraints, a design task record should be written and agreed before any code is
written. Recommendation 1's command table is the proposed starting scope for that record.

If the owner prefers, declining entirely is defensible on F7 alone - but it leaves F1 unaddressed,
and F1 is a real gap rather than a matter of taste.
