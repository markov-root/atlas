/**
 * Structural guard over the read-along's committed artifacts.
 *
 * `chapter-timing.ts` and the 71 `.words.json` files beside it are two halves
 * of one fact, kept in sync by hand. Nothing else in the build notices when
 * they drift apart: `word-highlight.ts` ends in a bare `.catch()` that leaves
 * the prose exactly as rendered, so a missing or malformed timings file
 * produces a page that simply never highlights. Silent degradation is the
 * right runtime behaviour and the wrong build-time one -- hence these checks.
 *
 * What this CANNOT prove: that the timings still match the audio a reader
 * hears. The published filename embeds a sha256 of the narration text, and
 * that text contains Gemini-written equation descriptions which a contributor
 * build pulls from R2 -- so the hash is not reproducible offline. A TTS
 * re-render or a Google Doc edit moves the real audio without breaking
 * anything asserted here. That check is credentialed and manual
 * (`pipeline.py --check-remote` in `atlas-podcast`). See task:0008.
 */

import { describe, it, expect } from 'vitest';
import { readdirSync, existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import chapterTimings from './chapter-timing';

const PUBLIC_DIR = join(process.cwd(), 'public');
const AUDIO_DIR = join(PUBLIC_DIR, 'audio');

type Entry = {
  chapter: number;
  section: number;
  audioUrl: string;
  wordsUrl: string;
  publishedUrl: string;
};

/** Every (chapter, section) pair the timing table declares. */
const entries: Entry[] = Object.entries(chapterTimings).flatMap(([chapter, sections]) =>
  Object.entries(sections).map(([section, timing]) => ({
    chapter: Number(chapter),
    section: Number(section),
    ...timing,
  })),
);

/** Every committed `.words.json`, as a `/public`-relative URL. */
function committedWordFiles(): string[] {
  if (!existsSync(AUDIO_DIR)) return [];
  return readdirSync(AUDIO_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .flatMap((dir) =>
      readdirSync(join(AUDIO_DIR, dir.name))
        .filter((f) => f.endsWith('.words.json'))
        .map((f) => `/audio/${dir.name}/${f}`),
    );
}

describe('chapter timing table', () => {
  it('declares at least one section, so an empty table cannot pass silently', () => {
    expect(entries.length).toBeGreaterThan(0);
  });

  // AC-1 (forward): a table entry with no file renders no read-along.
  it('has a committed .words.json for every entry', () => {
    const missing = entries
      .filter((e) => !existsSync(join(PUBLIC_DIR, e.wordsUrl)))
      .map((e) => `${e.chapter}.${e.section} -> ${e.wordsUrl}`);
    expect(missing).toEqual([]);
  });

  // AC-1 (reverse): an orphan file is 100-300kB of dead weight in the repo,
  // and usually the fingerprint of a half-finished chapter.
  it('has a table entry for every committed .words.json', () => {
    const declared = new Set(entries.map((e) => e.wordsUrl));
    const orphans = committedWordFiles().filter((f) => !declared.has(f));
    expect(orphans).toEqual([]);
  });

  // AC-3: catches a copy-paste that points section 4.2 at 4.1's recording --
  // which plays perfectly and highlights the wrong words.
  it('points each entry at URLs bearing its own chapter and section', () => {
    const wrong = entries
      .filter((e) => {
        const published = URL.canParse(e.publishedUrl) ? new URL(e.publishedUrl) : null;
        return (
          !published ||
          !published.pathname.split('/').pop()?.startsWith(`atlas-ch${e.chapter}-s${e.section}-`) ||
          e.audioUrl !== `/audio/ch${e.chapter}/ch${e.chapter}-s${e.section}.mp3` ||
          e.wordsUrl !== `/audio/ch${e.chapter}/ch${e.chapter}-s${e.section}.words.json`
        );
      })
      .map((e) => `${e.chapter}.${e.section}`);
    expect(wrong).toEqual([]);
  });

  it('serves every published URL over https', () => {
    const insecure = entries
      .filter((e) => !e.publishedUrl.startsWith('https://'))
      .map((e) => `${e.chapter}.${e.section} -> ${e.publishedUrl}`);
    expect(insecure).toEqual([]);
  });
});

// AC-2. Read once and shared: 5.8 MiB across 71 files, and re-reading per
// assertion made this the slowest file in the unit suite.
//
// Absent and unparseable files are folded into the result rather than thrown:
// reading at describe-scope runs during collection, so a raw throw here takes
// the whole file down with "no tests" and buries which section was at fault.
// A missing file is already AC-1's finding, so it is skipped below rather
// than reported twice.
describe('committed word timings', () => {
  const parsed = entries.map((e) => {
    const path = join(PUBLIC_DIR, e.wordsUrl);
    const label = `${e.chapter}.${e.section}`;
    if (!existsSync(path)) return { label, words: undefined, missing: true };
    try {
      return { label, words: JSON.parse(readFileSync(path, 'utf-8')) as unknown, missing: false };
    } catch (error) {
      return { label: `${label} (unparseable: ${String(error)})`, words: null, missing: false };
    }
  });
  const present = parsed.filter((p) => !p.missing);
  // The two assertions below index into the payload, so they only consider
  // files already known to be arrays; a non-array is the first test's finding.
  const arrays = present.filter((p): p is { label: string; words: unknown[]; missing: boolean } =>
    Array.isArray(p.words),
  );

  it('parses every file as a non-empty array', () => {
    const bad = present
      .filter(({ words }) => !Array.isArray(words) || words.length === 0)
      .map(({ label }) => label);
    expect(bad).toEqual([]);
  });

  it('gives every word a string and a finite, non-negative span', () => {
    const bad: string[] = [];
    for (const { label, words } of arrays) {
      const entry = (words as { w?: unknown; s?: unknown; e?: unknown }[]).find(
        (w) =>
          typeof w?.w !== 'string' ||
          typeof w?.s !== 'number' ||
          typeof w?.e !== 'number' ||
          !Number.isFinite(w.s) ||
          !Number.isFinite(w.e) ||
          w.s < 0 ||
          w.e < w.s,
      );
      if (entry) bad.push(`${label}: ${JSON.stringify(entry)}`);
    }
    expect(bad).toEqual([]);
  });

  // The player binary-searches these by time, which silently returns the
  // wrong word if the sequence is not sorted.
  it('orders every file by non-decreasing start time', () => {
    const bad: string[] = [];
    for (const { label, words } of arrays) {
      const list = words as { s: number }[];
      const at = list.findIndex((w, i) => i > 0 && w.s < list[i - 1].s);
      if (at > 0) bad.push(`${label}: index ${at} starts before ${at - 1}`);
    }
    expect(bad).toEqual([]);
  });
});
