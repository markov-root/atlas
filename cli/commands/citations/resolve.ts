/**
 * `atlas citations resolve` — bank B9 of `task:0021`, per `task:0027`.
 *
 * Fills in metadata for entries the store holds only as anchor text. This is
 * the one citation command that touches the network, and it is never required:
 * `extract`, `report`, `export` and `urls` all work from the committed store
 * with no credentials and no connection (`task:0021` D4).
 *
 * The design is shaped by one fact — roughly 600 of the ~950 sources have no
 * API that describes them, so this job is long-tailed rather than hard. It is
 * built to be **chipped at**: run it, interrupt it, run it again tomorrow. That
 * is why it resolves only unfilled entries and saves as it goes.
 */
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  serializeStore,
  type Store,
  type StoreEntry,
} from '../../../src/textbook-loader/citations/store.js';
import {
  ALL_RESOLVERS,
  makeThrottledContext,
  resolveWith,
} from '../../../src/textbook-loader/citations/resolvers/index.js';
import { readStore, STORE_PATH } from './extract-cmd.js';

/** Contactable user agent. `task:0027` AC-5 — Crossref's polite pool wants one. */
const USER_AGENT =
  'AISafetyAtlas-citations/1.0 (+https://github.com/markov-root/atlas; mailto:contact@aisafety.info)';

/** arXiv asks for roughly this much space between requests. */
const DEFAULT_INTERVAL_MS = 3000;

/**
 * Entries to attempt: anchor-only, plus any whose resolver is being redone.
 *
 * `redo` also filters by whether a resolver would now *claim* the URL, so
 * `--redo=opengraph` after adding a publisher resolver retries only the pages
 * that resolver can actually help with, instead of re-fetching hundreds of blog
 * posts that Open Graph already handled correctly.
 */
export function unresolvedKeys(
  store: Store,
  redo: string[] = [],
  claimedBy?: (url: string) => boolean,
): string[] {
  return Object.keys(store)
    .filter((k) => {
      const by = store[k].resolvedBy;
      if (by === 'anchor') return true;
      if (!redo.includes(by)) return false;
      return claimedBy ? claimedBy(k) : true;
    })
    .sort();
}

/**
 * Fold a resolver's fields into an entry.
 *
 * Resolver fields win over anchor-derived ones — a real title beats
 * "Chollet, 2019" — but anything the resolver did not return is kept, so a
 * partial result is an improvement rather than a replacement. The unresolved
 * `note` is dropped: it exists to mark an entry as needing work, and it no
 * longer does.
 */
export function applyResolution(
  entry: StoreEntry,
  fields: Partial<StoreEntry['item']>,
  source: string,
  note?: string,
): StoreEntry {
  const item = { ...entry.item, ...fields, id: entry.item.id };
  delete item.note;
  if (note) item.note = note;
  return { item, resolvedBy: source, anchors: entry.anchors };
}

export type ResolveOptions = {
  /** Stop after this many entries. The way a long tail gets chipped at. */
  limit?: number;
  /** Milliseconds between outbound requests. */
  intervalMs?: number;
  /**
   * Re-resolve entries previously answered by these resolvers.
   *
   * Resolution is sticky by design — a resolved entry is never re-fetched, which
   * is what makes the long tail tractable. That works against you when a
   * resolver *improves*: entries a weaker one already claimed would keep their
   * thin metadata forever. This resets them so a better resolver gets a turn.
   *
   * It is the repeatable half of the workflow: add a resolver, redo the
   * entries the old one answered, keep everything else.
   */
  redo?: string[];
};

export async function citationsResolve(root: string, opts: ResolveOptions = {}): Promise<number> {
  const path = join(root, STORE_PATH);
  let store: Store;
  try {
    store = readStore(root);
  } catch {
    console.error(`atlas: no store at ${STORE_PATH} — run \`atlas citations extract\` first`);
    return 1;
  }

  // A redo only targets entries some *other* resolver would now claim — the
  // point is to give newly-added coverage a turn, not to re-fetch the world.
  const redo = opts.redo ?? [];
  const claimedByNewer = (url: string) =>
    ALL_RESOLVERS.some((r) => !redo.includes(r.name) && r.name !== 'opengraph' && r.claims(url));
  const pending = unresolvedKeys(store, redo, redo.length ? claimedByNewer : undefined);
  if (pending.length === 0) {
    console.log('Nothing to resolve: every entry already carries resolved metadata.');
    return 0;
  }

  const targets = opts.limit ? pending.slice(0, opts.limit) : pending;
  const ctx = makeThrottledContext(opts.intervalMs ?? DEFAULT_INTERVAL_MS, USER_AGENT);

  console.log(
    `${pending.length} to attempt of ${Object.keys(store).length}` +
      (redo.length ? ` (including a redo of: ${redo.join(', ')})` : '') +
      `; attempting ${targets.length}.`,
  );

  // Interrupt handling is what makes AC-3 true rather than aspirational. A run
  // over ~950 URLs at a polite 3s interval takes close to an hour, so it WILL
  // be interrupted. Ctrl-C stops after the in-flight request and saves, rather
  // than discarding everything resolved so far.
  let stopping = false;
  const onSignal = () => {
    if (stopping) process.exit(130);
    stopping = true;
    console.log('\nStopping after the current request; progress will be saved.');
  };
  process.on('SIGINT', onSignal);
  process.on('SIGTERM', onSignal);

  const counts = new Map<string, number>();
  let resolved = 0;
  let attempted = 0;
  let dirty = false;

  const save = () => {
    if (!dirty) return;
    writeFileSync(path, serializeStore(store), 'utf8');
    dirty = false;
  };

  try {
    for (const key of targets) {
      if (stopping) break;
      attempted++;
      const result = await resolveWith(ALL_RESOLVERS, key, ctx);
      if (result) {
        store[key] = applyResolution(store[key], result.fields, result.source, result.note);
        counts.set(result.source, (counts.get(result.source) ?? 0) + 1);
        resolved++;
        dirty = true;
      }
      // Save periodically rather than only at the end. A crash — or a kill that
      // outruns the signal handler — then costs at most the last few entries
      // instead of the whole run.
      if (attempted % 20 === 0) save();
      if (attempted % 50 === 0) {
        console.log(`  ${attempted}/${targets.length} attempted · ${resolved} resolved`);
      }
    }
  } finally {
    save();
    process.off('SIGINT', onSignal);
    process.off('SIGTERM', onSignal);
  }

  const byResolver = [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([name, n]) => `${name} ${n}`)
    .join(' · ');
  console.log(
    `${resolved} of ${attempted} attempted resolved${byResolver ? ` (${byResolver})` : ''}.`,
  );
  console.log(`${unresolvedKeys(store).length} still unresolved. Re-run to continue.`);
  return 0;
}
