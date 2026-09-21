import { describe, it, expect } from 'vitest';
import { isAuthorYearAnchor, splitAuthorYear, parentheticalCitations } from './author-year';

describe('isAuthorYearAnchor (task:0025 AC-1, AC-6)', () => {
  // Every string here was taken from the real corpus scan on 2026-09-21.
  it('accepts the anchor forms the textbook actually uses', () => {
    for (const anchor of [
      'Chollet, 2019',
      'Giattino et al., 2023',
      'Oxford Reference, 2016',
      'Anthropic, 2024',
      'Wang et al., 2018',
      'LeCun, 1998',
    ]) {
      expect(isAuthorYearAnchor(anchor), anchor).toBe(true);
    }
  });

  // These are malformed in the source documents. Extraction must still find
  // them — the report tells an author to fix the prose, but dropping the
  // citation because its punctuation is wrong would lose real data.
  it('accepts the malformed variants observed in the source documents', () => {
    for (const anchor of [
      'Andreas 2022', // no comma
      'Bengio et al. 2025', // no comma
      'Burns et. al. 2023', // stray period in "et. al."
      'Belfield & Hua 2022',
      ' Anderljung et al. 2024', // leading space
      '(Anderljung et al., 2023)', // parens inside the anchor
    ]) {
      expect(isAuthorYearAnchor(anchor), anchor).toBe(true);
    }
  });

  it('rejects anchor text that is prose, not a citation', () => {
    for (const anchor of [
      'available here',
      'Biological Weapons Convention',
      'agents',
      'AI research and development tasks',
      'MNIST database - Wikipedia',
      '',
      '.',
    ]) {
      expect(isAuthorYearAnchor(anchor), anchor).toBe(false);
    }
  });

  // A bare year is ambiguous — it appears in the corpus as link text for
  // things that are not citations. Requiring an author part is what keeps
  // "1985" out of the bibliography.
  it('rejects a bare year with no author', () => {
    expect(isAuthorYearAnchor('1985')).toBe(false);
  });
});

describe('splitAuthorYear', () => {
  it('separates author from year without inventing name structure', () => {
    expect(splitAuthorYear('Giattino et al., 2023')).toEqual({
      author: 'Giattino et al.',
      year: '2023',
    });
    expect(splitAuthorYear('Chollet, 2019')).toEqual({ author: 'Chollet', year: '2019' });
    expect(splitAuthorYear('Andreas 2022')).toEqual({ author: 'Andreas', year: '2022' });
  });

  it('handles a disambiguating year suffix', () => {
    expect(splitAuthorYear('Smith, 2020a')).toEqual({ author: 'Smith', year: '2020' });
  });

  it('returns null when there is no year or no author', () => {
    expect(splitAuthorYear('available here')).toBeNull();
    expect(splitAuthorYear('2019')).toBeNull();
  });
});

describe('parentheticalCitations — shared with the audio renderer (AC-6)', () => {
  it('matches citations embedded in running prose', () => {
    const prose =
      'Collapse has been argued to be possible (Rodriguez, 2020), though others disagree (Smith et al., 2021).';
    expect(prose.match(parentheticalCitations())).toEqual([
      '(Rodriguez, 2020)',
      '(Smith et al., 2021)',
    ]);
  });

  // The behaviour the audio renderer depends on: stripping must not eat
  // ordinary parenthetical asides.
  it('leaves non-citation parentheses alone', () => {
    const prose = 'The model (a transformer) was trained on text.';
    expect(prose.match(parentheticalCitations())).toBeNull();
  });
});
