/**
 * House rule: no em dashes anywhere in the repository.
 *
 * Owner instruction, 2026-09-23, stated as a standing rule rather than a
 * one-off correction. Asserted as a test because a convention nobody enforces
 * is a convention that drifts back: 3,053 em dashes had accumulated across 171
 * files before this existed, and every one of them arrived while someone
 * believed they were following house style.
 *
 * Runs in `pnpm test`, so it is checked on every commit rather than at review.
 *
 * ## What is deliberately exempt
 *
 * **Quoted source data.** `data/citations/` holds titles as their publishers
 * printed them, and Turing's 1950 paper really is titled
 * "I.—COMPUTING MACHINERY AND INTELLIGENCE". Rewriting a cited work's title
 * would falsify the citation, which is a worse fault than the punctuation.
 * `.cache/docs/` is the same argument for the authors' own prose.
 *
 * **Functional literals.** Two places match an em dash rather than printing
 * one: the container-suffix pattern in `src/lib/bibliography.ts` and a
 * normalisation fixture in `src/lib/word-align.test.ts`. Both are listed by
 * path, so adding a third is a deliberate act with a reason attached.
 *
 * **Vendored files.** `vendor/csl/` is upstream CC-BY-SA work; this repo's
 * style does not govern it.
 */
import { describe, it, expect } from 'vitest';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

const ROOT = fileURLToPath(new URL('..', import.meta.url));

const EM_DASH = '—';

/** Files that legitimately contain one, each for a stated reason. */
const EXEMPT = new Set([
  // Matches an em dash used as a title/site separator by other people's pages.
  'src/lib/bibliography.ts',
  // Asserts that an em dash normalises away during read-along alignment.
  'src/lib/word-align.test.ts',
  // Its whole subject is a TITLE written with an em dash, which must not parse.
  'src/textbook-loader/transformer.edge-cases.test.ts',
  // Upstream legal text. This repo's house style does not govern a licence.
  'LICENSE',
  // Quotes Turing 1950's printed title, "I.—COMPUTING MACHINERY AND INTELLIGENCE".
  'docs/tasks/0032-close-the-citation-metadata-tail-to-complete-coverage.md',
  // This file names the character in order to forbid it.
  'tests/no-em-dash.test.ts',
]);

/**
 * Trees holding quoted source data, generated output, or upstream work.
 *
 * `__snapshots__` is derived from the authors' own prose in `.cache/docs`, so
 * rewriting a snapshot would only make it disagree with the content it pins.
 */
const EXEMPT_PREFIXES = ['data/citations/', '.cache/', 'vendor/'];
const EXEMPT_SEGMENTS = ['__snapshots__/'];

function trackedFilesContainingEmDash(): string[] {
  // `git grep` over tracked files only: it respects .gitignore for free and
  // never walks node_modules, which a manual recursion has to remember to skip.
  let out: string;
  try {
    // -I skips binary files: an image whose bytes happen to contain the UTF-8
    // sequence is not a style violation.
    out = execFileSync('git', ['grep', '-l', '-I', '-F', EM_DASH, '--', '.'], {
      cwd: ROOT,
      encoding: 'utf8',
    });
  } catch (error) {
    // git grep exits 1 with no output when nothing matches, which is the
    // passing case and not an error.
    const status = (error as { status?: number }).status;
    if (status === 1) return [];
    throw error;
  }
  return out
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((path) => !EXEMPT.has(path))
    .filter((path) => !EXEMPT_PREFIXES.some((prefix) => path.startsWith(prefix)))
    .filter((path) => !EXEMPT_SEGMENTS.some((segment) => path.includes(segment)));
}

describe('no em dashes in the repository', () => {
  it('finds none outside the stated exemptions', () => {
    const offenders = trackedFilesContainingEmDash();
    // The message carries the fix, because a failing check that does not tell
    // you what to do is noise.
    expect(
      offenders,
      offenders.length
        ? `Em dashes are forbidden in this repository. Replace them (a spaced ` +
            `hyphen, a comma, or a colon usually reads better anyway) in:\n  ` +
            offenders.join('\n  ')
        : '',
    ).toEqual([]);
  });

  it('still guards the trees it exempts, so the exemption cannot quietly widen', () => {
    // A prefix exemption is a blank cheque unless someone checks it still names
    // what it was written for.
    expect(EXEMPT_PREFIXES).toEqual(['data/citations/', '.cache/', 'vendor/']);
    expect(EXEMPT_SEGMENTS).toEqual(['__snapshots__/']);
    expect(join(ROOT, 'data', 'citations')).toContain('citations');
  });
});
