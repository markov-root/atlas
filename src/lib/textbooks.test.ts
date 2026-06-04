import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock the astro:content virtual module. The lib/textbooks.ts file is a thin
// wrapper around getEntry/getCollection — tests verify the sorting, filtering,
// and URL-building logic on top of those calls.

const getEntryMock = vi.fn();
const getCollectionMock = vi.fn();

vi.mock('astro:content', () => ({
  getEntry: (...args: unknown[]) => getEntryMock(...args),
  getCollection: (...args: unknown[]) => getCollectionMock(...args),
}));

const { getTextbook, getLatestTextbook, getFirstChapterUrl, getTextbooks } =
  await import('./textbooks');

beforeEach(() => {
  getEntryMock.mockReset();
  getCollectionMock.mockReset();
});

function tb(version: string, language: string, chapters: any[] = []) {
  return {
    data: { version, language, chapters, readingTimeInSeconds: 0 },
  };
}

// getTextbook is what every chapter page calls to look up its content.
// If lookup breaks, readers see a build error or, worse, the wrong
// chapter rendered under a URL — both immediately visible regressions.
describe('getTextbook(version)', () => {
  it('requests the `${version}-en` entry from the textbooks collection', async () => {
    getEntryMock.mockResolvedValueOnce(tb('v1', 'en'));
    const data = await getTextbook('v1');
    expect(getEntryMock).toHaveBeenCalledWith('textbooks', 'v1-en');
    expect(data.version).toBe('v1');
  });

  it('throws when the entry is not found', async () => {
    getEntryMock.mockResolvedValueOnce(undefined);
    await expect(getTextbook('v99')).rejects.toThrow(/v99/);
  });
});

// "Latest version" is the default the homepage and reader landing pages
// resolve to. If the wrong version wins, every visitor lands on the
// wrong content. Today the filter hard-codes English, which is documented
// in TODO Entry A as the i18n unblock — these tests pin the current
// behavior so the change is deliberate and visible.
describe('getLatestTextbook()', () => {
  it('filters to English textbooks and returns the highest-version one', async () => {
    getCollectionMock.mockResolvedValueOnce([
      tb('v1', 'en'),
      tb('v2', 'en'),
      tb('v3', 'es'), // higher version but Spanish — filtered out
    ]);
    const t = await getLatestTextbook();
    expect(t.version).toBe('v2');
    expect(t.language).toBe('en');
  });

  it('sorts versions lexicographically via localeCompare (descending)', async () => {
    // Documents current sort behavior: "v10" < "v2" lexicographically.
    // This is a FOOTGUN once we ship double-digit versions, but pins the
    // current behavior so the multi-version refactor in TODO Entry A is visible.
    getCollectionMock.mockResolvedValueOnce([tb('v2', 'en'), tb('v10', 'en')]);
    const t = await getLatestTextbook();
    expect(t.version).toBe('v2');
  });

  it('throws when no English textbooks exist', async () => {
    getCollectionMock.mockResolvedValueOnce([tb('v1', 'es'), tb('v1', 'fr')]);
    await expect(getLatestTextbook()).rejects.toThrow();
  });

  it('throws when the collection is empty', async () => {
    getCollectionMock.mockResolvedValueOnce([]);
    await expect(getLatestTextbook()).rejects.toThrow();
  });
});

// /read on the homepage redirects to this URL. If it returns the wrong
// path, the primary "start reading" CTA on the site lands on a 404.
// The /read fallback ensures the link never breaks, even mid-content-edit
// when the loader briefly produces a chapter with no sections.
describe('getFirstChapterUrl()', () => {
  it('builds /chapters/<version>/<chapter-slug>/<section-slug> for the latest textbook', async () => {
    getCollectionMock.mockResolvedValueOnce([
      tb('v1', 'en', [
        { slug: 'intro', sections: [{ slug: 'welcome' }] },
        { slug: 'second', sections: [{ slug: 'alpha' }] },
      ]),
    ]);
    expect(await getFirstChapterUrl()).toBe('/chapters/v1/intro/welcome');
  });

  it('falls back to /read when the first chapter is missing', async () => {
    getCollectionMock.mockResolvedValueOnce([tb('v1', 'en', [])]);
    expect(await getFirstChapterUrl()).toBe('/read');
  });

  it('falls back to /read when the first chapter has no sections', async () => {
    getCollectionMock.mockResolvedValueOnce([tb('v1', 'en', [{ slug: 'empty', sections: [] }])]);
    expect(await getFirstChapterUrl()).toBe('/read');
  });
});

// Listing all textbooks drives the version switcher and the build's
// per-version page generation. A broken filter would either generate
// no version-switcher options (readers can't move between versions) or
// generate pages for languages we haven't shipped yet (404-prone URLs).
describe('getTextbooks()', () => {
  it('returns only English-language entries', async () => {
    getCollectionMock.mockResolvedValueOnce([
      tb('v1', 'en'),
      tb('v1', 'es'),
      tb('v2', 'en'),
      tb('v2', 'fr'),
    ]);
    const entries = await getTextbooks();
    expect(entries.length).toBe(2);
    expect(entries.every((e: any) => e.data.language === 'en')).toBe(true);
  });

  it('returns an empty array when no English textbooks exist', async () => {
    getCollectionMock.mockResolvedValueOnce([tb('v1', 'es')]);
    expect(await getTextbooks()).toEqual([]);
  });
});
