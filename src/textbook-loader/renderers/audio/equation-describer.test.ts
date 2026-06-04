import { describe, it, expect, afterEach } from 'vitest';
import { existsSync, writeFileSync, unlinkSync, mkdirSync } from 'fs';
import { join } from 'path';
import { EquationDescriber } from './equation-describer';

const CACHE_DIR = join(process.cwd(), '.cache', 'equation-descriptions');

// Each test claims a unique latex string (using a high-entropy marker) so
// fixture writes don't collide with the real equation cache, and so parallel
// test runs don't interfere with each other.
const MARKER = '__eqdesc-test-2026-06-04__';
const testLatex = (name: string) => `${MARKER}::${name}`;

function tracked(latex: string, describer: EquationDescriber, paths: string[]): string {
  const hash = describer.hashLatex(latex);
  const path = join(CACHE_DIR, `${hash}.txt`);
  paths.push(path);
  return path;
}

// Manual overrides are the maintainer's escape hatch for equations whose
// LLM-generated descriptions sound wrong when read aloud. They MUST win
// over both the on-disk cache and any API call. If this breaks, a
// maintainer who fixed a mispronounced equation in code will hear the bad
// description return on the next audio build — and there's no surface
// signal that the override was ignored.
describe('EquationDescriber — manual overrides have priority over cache and API', () => {
  it('returns the manual override for known LaTeX strings, ignoring cache and API key state', () => {
    const d = new EquationDescriber(undefined);
    expect(d.getDescription('n L_n (w^)', 'display')).toBe('n times L sub n of w-hat');
    expect(d.getDescription('lambda log n', 'inline')).toBe('lambda times log n');
  });

  it('queue() resolves overrides immediately so batchFetch does not call the API for them', async () => {
    // batchFetch is rate-limited and costs money. Queueing an overridden
    // equation must NOT add it to the pending list, otherwise builds will
    // spend Gemini calls re-generating something we already overrode.
    const d = new EquationDescriber(undefined);
    d.queue('lambda log n', 'display');
    await d.batchFetch();
    expect(d.getDescription('lambda log n', 'display')).toBe('lambda times log n');
  });
});

// Equation descriptions are persisted to `.cache/equation-descriptions/`
// so that rebuilds don't burn Gemini quota on equations we've already
// described. If cache reads break, every build re-hits Gemini and either
// blows past quota mid-build (failing audio for half the textbook) or
// produces inconsistent descriptions for the same equation across builds.
describe('EquationDescriber — on-disk cache rehydration', () => {
  const writtenPaths: string[] = [];

  afterEach(() => {
    while (writtenPaths.length) {
      const p = writtenPaths.pop()!;
      if (existsSync(p)) unlinkSync(p);
    }
  });

  it('queue() picks up a previously cached description from disk without calling the API', () => {
    mkdirSync(CACHE_DIR, { recursive: true });
    const d = new EquationDescriber(undefined);
    const latex = testLatex('cache-hit');
    const path = tracked(latex, d, writtenPaths);
    writeFileSync(path, 'spoken description from cache', 'utf-8');

    d.queue(latex, 'inline');
    expect(d.getDescription(latex, 'inline')).toBe('spoken description from cache');
  });

  it('getDescription() reads the cache on demand even when queue() was skipped', () => {
    // The text-renderer may ask for a description for an equation that was
    // never queued (e.g., a late-arriving node). It should still find the
    // cached description if one exists — otherwise the renderer falls
    // back to reading raw LaTeX aloud.
    mkdirSync(CACHE_DIR, { recursive: true });
    const d = new EquationDescriber(undefined);
    const latex = testLatex('lazy-cache-read');
    const path = tracked(latex, d, writtenPaths);
    writeFileSync(path, 'lazily loaded', 'utf-8');

    expect(d.getDescription(latex, 'display')).toBe('lazily loaded');
  });
});

// In contributor mode (no API key) the build must still complete without
// crashing or stalling. The describer becomes a no-op that returns null,
// and the text-renderer falls back to a readable phrase. If this breaks,
// contributor builds will either hang or fail outright on any chapter
// that contains equations — i.e. most of the textbook.
describe('EquationDescriber — graceful no-op when no API key is configured', () => {
  it('returns null for any non-cached, non-overridden equation', () => {
    const d = new EquationDescriber(undefined);
    expect(d.getDescription(testLatex('totally-unknown'), 'inline')).toBeNull();
  });

  it('batchFetch() resolves without making API calls and leaves the description unset', async () => {
    const d = new EquationDescriber(undefined);
    const latex = testLatex('no-key');
    d.queue(latex, 'inline');
    await d.batchFetch();
    expect(d.getDescription(latex, 'inline')).toBeNull();
  });

  it('batchFetch() is safe to call on an empty queue', async () => {
    const d = new EquationDescriber(undefined);
    await expect(d.batchFetch()).resolves.toBeUndefined();
  });
});
