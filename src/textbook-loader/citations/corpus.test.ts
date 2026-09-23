/**
 * Reconciliation against the real committed corpus — `task:0025` AC-2 and AC-3.
 *
 * The unit tests above prove extraction behaves correctly on constructed input.
 * This file proves it behaves correctly on the actual textbook, by checking the
 * counts against the independent `jq` measurement recorded in `task:0021`:
 * 1,792 link instances over 1,001 unique URLs, 1,735 author-year anchors.
 *
 * Bounds are ranges, not equalities, and the reason matters. The `jq` scan
 * counted every hyperlinked text run; extraction counts classified citations,
 * excluding assets and content links and adding unlinked footnote citations the
 * scan could not see. The two should be close but must not be identical — an
 * exact match would mean the classifier is doing nothing.
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { TextbookLoader } from '../loader';
import { TEXTBOOK_EDITIONS } from '../data';
import { summarizeCitations } from './extract';
import { canonicalizeUrl } from './canonical-url';
import type { Section } from '..';

const EDITION = TEXTBOOK_EDITIONS[0];

describe('citation extraction over the committed corpus', () => {
  const prev = {
    pdf: process.env.SKIP_PDF,
    audio: process.env.SKIP_AUDIO,
    dl: process.env.SKIP_AUDIO_DOWNLOAD,
  };
  let sections: Section[] = [];

  beforeAll(async () => {
    // No typst, no ElevenLabs, and above all no R2 traffic (task:0022).
    process.env.SKIP_PDF = '1';
    process.env.SKIP_AUDIO = '1';
    process.env.SKIP_AUDIO_DOWNLOAD = '1';

    const loader = new TextbookLoader(null, EDITION, { cacheOnly: true });
    for (const meta of EDITION.chapters) {
      const chapter = await loader.loadChapter(meta);
      sections.push(...chapter.sections);
    }
  }, 120_000);

  afterAll(() => {
    for (const [k, v] of [
      ['SKIP_PDF', prev.pdf],
      ['SKIP_AUDIO', prev.audio],
      ['SKIP_AUDIO_DOWNLOAD', prev.dl],
    ] as const) {
      if (v === undefined) delete process.env[k];
      else process.env[k] = v;
    }
  });

  it('loads every cached chapter', () => {
    expect(sections.length).toBeGreaterThan(50);
  });

  // Reconciliation, measured 2026-09-21 (AC-2):
  //
  //   jq, raw document           1792 linked text runs
  //   less whitespace-only runs  -14  (transformer.ts:528,548 drop these)
  //   = substantive              1778
  //   extraction sees            1770   (99.6%)
  //
  // The residual 8 are not yet proven, but the probable cause is identified:
  // several component fields are flattened to plain strings by
  // `getTrimmedString` (SectionDescription.content, Quote.speaker/position/date,
  // Iframe.src), which discards a hyperlink's URL before any AST node exists.
  // Recorded as a hypothesis, not a fact — see audit:0011.
  it('sees essentially every substantive link in the real corpus (AC-2)', () => {
    const { instances } = summarizeCitations(sections);
    const linked = instances.filter((i) => i.kind !== 'unlinked');
    expect(linked.length).toBeGreaterThanOrEqual(1760);
    expect(linked.length).toBeLessThanOrEqual(1778);
  });

  it('classifies rather than accepting everything (AC-2)', () => {
    const { counts, citations } = summarizeCitations(sections);
    expect(citations.length).toBeGreaterThan(1650);
    // The classifier must actually reject things, or it is not classifying.
    expect(counts['content-link']).toBeGreaterThan(20);
    expect(counts.asset).toBeGreaterThan(0);
  });

  it('finds a unique-URL count reconcilable with the jq measurement (AC-2)', () => {
    const { uniqueKeys } = summarizeCitations(sections);
    // Below jq's 1,001, which counted every link kind; this counts citations only.
    expect(uniqueKeys.length).toBeGreaterThan(900);
    expect(uniqueKeys.length).toBeLessThanOrEqual(1001);
  });

  it('canonicalization measurably deduplicates the real corpus (AC-3)', () => {
    const { citations } = summarizeCitations(sections);
    const rawUnique = new Set(citations.map((c) => c.rawUrl)).size;
    const canonUnique = new Set(citations.map((c) => c.key)).size;
    // Fewer entries after canonicalization than before, and never more.
    expect(canonUnique).toBeLessThanOrEqual(rawUnique);
    // Canonicalization must be doing real work on this corpus, not merely
    // passing URLs through: 959 raw -> 948 canonical when last measured.
    expect(rawUnique - canonUnique).toBeGreaterThan(0);
  });

  it('every keyed citation agrees with the canonicalizer, and carries a location', () => {
    const { citations } = summarizeCitations(sections);
    for (const c of citations) {
      expect(c.key).toBe(canonicalizeUrl(c.rawUrl!));
      expect(typeof c.chapterNumber).toBe('number');
      expect(c.sectionSlug).toBeTruthy();
    }
  });

  // A citation whose href is broken gets no key, deliberately: minting one put
  // `https://in`, `https://li` and `https://perez` into the bibliography as
  // real sources (`audit:0011` F13). They are reported instead, so an author
  // can fix the Doc.
  it('the only unkeyed citations are the ones with a broken link target', () => {
    const { citations } = summarizeCitations(sections);
    const unkeyed = citations.filter((c) => !c.key);
    for (const c of unkeyed) {
      let host: string;
      try {
        host = new URL(c.rawUrl!).hostname;
      } catch {
        host = '';
      }
      expect(host.includes('.'), `${c.rawUrl} should have been keyed`).toBe(false);
    }
    // Pinned so that a regression which starts dropping good URLs is visible as
    // a number rather than as a quietly shorter bibliography.
    expect(unkeyed.length).toBeLessThanOrEqual(5);
  });

  // AC-5. Correcting an earlier measurement error recorded in task:0021: the
  // corpus was said to hold "9 plain-text author-year citations with no link".
  // It does not. All 9 parenthetical citations in footnote text are ALSO
  // hyperlinked, verified anchor-by-anchor against the raw documents — the
  // original count matched parentheses without checking for a co-located link.
  //
  // So the correct expectation is zero, and the unlinked path is a guard for
  // prose that has not been written yet rather than a backlog. It stays because
  // it is cheap, tested, and the alternative is silently dropping such a
  // citation the first time an author writes one.
  it('reports zero unlinked footnote citations, and would surface any (AC-5)', () => {
    const { instances } = summarizeCitations(sections);
    const unlinked = instances.filter((i) => i.kind === 'unlinked');
    expect(unlinked).toHaveLength(0);
    for (const u of unlinked) {
      expect(u.key).toBeNull();
      expect(u.footnoteNumber).toBeTruthy();
    }
  });
});
