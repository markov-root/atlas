/**
 * `atlas citations extract` — populate the bibliography store from the cached
 * chapters. Bank B5 of `task:0021`.
 *
 * Pure core, thin I/O wrapper: the store semantics (entry identity, merge
 * rules, YAML shape) live in `src/textbook-loader/citations/store.ts`, and this
 * file only decides what to feed it and where the file goes. Everything here is
 * offline and instant — deliberately separate from `resolve` (task:0027), which
 * is networked and slow, so the safe command never inherits the unsafe one's
 * caveats.
 *
 * AC-1 idempotence is structural, not an added check: `serializeStore` sorts
 * keys and is clock-free, `mergeEntry` union-sorts the anchor list, and
 * `upsertEntries` re-derives the same store when fed the same chapters it
 * produced. A second run with unchanged input writes identical bytes. The test
 * proves this by round-tripping the serialization, not by asserting it.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import type { Chapter } from '../../../src/textbook-loader/index.js';
import { splitAuthorYear } from '../../../src/textbook-loader/citations/author-year.js';
import { summarizeCitations } from '../../../src/textbook-loader/citations/extract.js';
import {
  entryFromAnchor,
  parseStore,
  serializeStore,
  upsertEntries,
  type Store,
  type StoreEntry,
} from '../../../src/textbook-loader/citations/store.js';
import { loadChaptersFromCache } from './load.js';

/** Where the store lives, relative to the repo root. */
export const STORE_PATH = join('data', 'citations', 'sources.yaml');

/**
 * Entries to upsert, from constructed or real chapters. Pure.
 *
 * Only `citation`-kind instances become entries: content links are prose, and
 * unlinked citations have no URL to key on (they surface in the report
 * instead). Same URL cited twice with different anchor spellings collapses to
 * one entry whose anchor list records both spellings — that is `mergeEntry`'s
 * job, applied by `upsertEntries`.
 */
export function extractEntries(chapters: Chapter[]): Array<[string, StoreEntry]> {
  const summary = summarizeCitations(chapters.flatMap((c) => c.sections));
  const out: Array<[string, StoreEntry]> = [];
  for (const c of summary.citations) {
    if (!c.key) continue;
    out.push([c.key, entryFromAnchor(c.key, c.anchorText, splitAuthorYear(c.anchorText))]);
  }
  return out;
}

/** Read the store file if it exists; an empty object otherwise. */
export function readStore(root: string): Store {
  const path = join(root, STORE_PATH);
  return existsSync(path) ? parseStore(readFileSync(path, 'utf8')) : {};
}

/**
 * Build the next store from a previous one plus fresh extractions.
 *
 * Split out from file I/O so the idempotence test can exercise exactly the
 * transformation a second run performs, with no filesystem involved.
 */
export function nextStore(existing: Store, entries: Array<[string, StoreEntry]>): Store {
  return upsertEntries(existing, entries);
}

/**
 * Run the command. Returns the process exit code.
 *
 * Merge-before-write, never overwrite: the file may hold resolved metadata
 * from `atlas citations resolve`, and clobbering it would throw away exactly
 * the work the networked command exists to do.
 */
export async function citationsExtract(root: string): Promise<number> {
  const chapters = await loadChaptersFromCache();
  const entries = extractEntries(chapters);
  const merged = nextStore(readStore(root), entries);

  const path = join(root, STORE_PATH);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, serializeStore(merged), 'utf8');

  const resolved = Object.values(merged).filter((e) => e.resolvedBy !== 'anchor').length;
  console.log(
    `${Object.keys(merged).length} sources in ${STORE_PATH} ` +
      `(${resolved} already resolved and preserved)`,
  );
  return 0;
}