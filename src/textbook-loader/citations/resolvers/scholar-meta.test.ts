import { describe, it, expect } from 'vitest';
import { scholarMetaResolver, citationMeta, metaToCsl, pubmedId } from './scholar-meta';
import type { ResolverContext } from './types';

const ctx = (fetchImpl: unknown): ResolverContext => ({
  fetch: fetchImpl as typeof globalThis.fetch,
  userAgent: 'test (mailto:test@example.org)',
  throttle: async () => {},
});

const html = (body: string) => ({
  ok: true,
  status: 200,
  body: null,
  text: async () => body,
});

// Trimmed from the real Nature page for nature09659, keeping the shape that
// matters: the article's own citation_doi alongside citation_reference tags
// that carry OTHER papers' DOIs.
const NATURE = `<html><head>
<meta name="citation_journal_title" content="Nature"/>
<meta name="citation_title" content="Systemic risk in banking ecosystems"/>
<meta name="citation_author" content="Haldane, Andrew G."/>
<meta name="citation_author" content="May, Robert M."/>
<meta name="citation_publication_date" content="2011/01"/>
<meta name="citation_volume" content="469"/>
<meta name="citation_firstpage" content="351"/>
<meta name="citation_lastpage" content="355"/>
<meta name="citation_publisher" content="Nature Publishing Group"/>
<meta name="citation_doi" content="10.1038/nature09659"/>
<meta name="citation_reference" content="citation_title=Homage to Santa Rosalia; citation_doi=10.1086/282070; citation_id=CR1"/>
<meta name="citation_reference" content="citation_title=Will a large complex system be stable?; citation_doi=10.1038/238413a0; citation_id=CR4"/>
</head></html>`;

describe('citationMeta — parsing', () => {
  it('collects citation_* meta tags, keeping repeats', () => {
    const meta = citationMeta(NATURE);
    expect(meta.get('citation_title')).toEqual(['Systemic risk in banking ecosystems']);
    expect(meta.get('citation_author')).toEqual(['Haldane, Andrew G.', 'May, Robert M.']);
  });

  // The trap this resolver exists to avoid. Nature emits dozens of
  // citation_reference tags carrying the DOIs of the paper's OWN bibliography.
  // A substring search for "citation_doi" finds those too, and would silently
  // attribute a cited work's metadata to the citing paper.
  it('takes the article DOI, never one from a citation_reference', () => {
    expect(citationMeta(NATURE).get('citation_doi')).toEqual(['10.1038/nature09659']);
  });

  it('ignores citation_reference entirely', () => {
    expect(citationMeta(NATURE).has('citation_reference')).toBe(false);
  });

  it('returns empty for a page with no citation meta', () => {
    expect(citationMeta('<html><head><title>x</title></head></html>').size).toBe(0);
  });

  it('decodes HTML entities in meta content', () => {
    const m = citationMeta(
      '<meta name="citation_title" content="Cats &amp; Dogs &#8212; A Study"/>',
    );
    expect(m.get('citation_title')?.[0]).toBe('Cats & Dogs — A Study');
  });
});

describe('metaToCsl — mapping', () => {
  it('maps a full Highwire set to CSL', () => {
    const csl = metaToCsl(citationMeta(NATURE));
    expect(csl).toMatchObject({
      title: 'Systemic risk in banking ecosystems',
      'container-title': 'Nature',
      type: 'article-journal',
      issued: { 'date-parts': [[2011]] },
      volume: '469',
      page: '351-355',
      DOI: '10.1038/nature09659',
    });
  });

  it('splits "Family, Given" on the comma', () => {
    expect(metaToCsl(citationMeta(NATURE)).author?.[0]).toEqual({
      family: 'Haldane',
      given: 'Andrew G.',
    });
  });

  it('treats a comma-free name as Given Family', () => {
    const m = citationMeta('<meta name="citation_author" content="Robert May"/>');
    expect(metaToCsl(m).author?.[0]).toEqual({ family: 'May', given: 'Robert' });
  });

  // A single token cannot be split without inventing structure, so it stays
  // literal — same rule the rest of the pipeline follows.
  it('keeps a mononym literal rather than guessing', () => {
    const m = citationMeta('<meta name="citation_author" content="OpenAI"/>');
    expect(metaToCsl(m).author?.[0]).toEqual({ literal: 'OpenAI' });
  });
});

describe('pubmedId', () => {
  it('extracts the PMID from a canonical PubMed URL', () => {
    expect(pubmedId('https://pubmed.ncbi.nlm.nih.gov/13233369')).toBe('13233369');
  });

  it('returns null for a non-PubMed URL', () => {
    expect(pubmedId('https://nature.com/articles/nature09659')).toBeNull();
    expect(pubmedId('https://arxiv.org/abs/1911.01547')).toBeNull();
  });
});

describe('scholarMetaResolver — claims', () => {
  it('claims academic publisher hosts, including subdomains', () => {
    for (const u of [
      'https://nature.com/articles/nature09659',
      'https://pubmed.ncbi.nlm.nih.gov/13233369',
      'https://dl.acm.org/doi/10.1145/3442188',
      'https://onlinelibrary.wiley.com/doi/10.1111/x',
    ]) {
      expect(scholarMetaResolver.claims(u), u).toBe(true);
    }
  });

  // Claiming everything would make this and Open Graph both fetch each of the
  // 604 long-tail pages, for no benefit.
  it('does not claim the long tail', () => {
    for (const u of [
      'https://epoch.ai/blog/x',
      'https://lesswrong.com/posts/x',
      'https://arxiv.org/abs/1911.01547',
    ]) {
      expect(scholarMetaResolver.claims(u), u).toBe(false);
    }
  });
});

describe('scholarMetaResolver — resolve', () => {
  it('hands the DOI to Crossref and prefers its record', async () => {
    const calls: string[] = [];
    const fetchImpl = async (url: string) => {
      calls.push(String(url));
      if (String(url).includes('api.crossref.org')) {
        return {
          ok: true,
          json: async () => ({
            message: {
              title: ['Systemic risk in banking ecosystems'],
              DOI: '10.1038/nature09659',
              'container-title': ['Nature'],
              type: 'journal-article',
              author: [{ family: 'Haldane', given: 'Andrew G.' }],
              issued: { 'date-parts': [[2011, 1, 20]] },
            },
          }),
        };
      }
      return html(NATURE);
    };
    const out = await scholarMetaResolver.resolve(
      'https://nature.com/articles/nature09659',
      ctx(fetchImpl),
    );
    expect(out?.source).toBe('scholar-meta');
    expect(out?.fields.DOI).toBe('10.1038/nature09659');
    expect(out?.fields['container-title']).toBe('Nature');
    expect(calls.some((c) => c.includes('api.crossref.org'))).toBe(true);
    // URL must stay the cited one, not doi.org — the entry's identity.
    expect(out?.fields.URL).toBe('https://nature.com/articles/nature09659');
  });

  it('falls back to page metadata when Crossref has no record', async () => {
    const fetchImpl = async (url: string) =>
      String(url).includes('api.crossref.org') ? { ok: false, status: 404 } : html(NATURE);
    const out = await scholarMetaResolver.resolve(
      'https://nature.com/articles/nature09659',
      ctx(fetchImpl),
    );
    expect(out?.fields.title).toBe('Systemic risk in banking ecosystems');
    expect(out?.fields.page).toBe('351-355');
    expect(out?.note).toMatch(/Crossref had no record/);
  });

  it('resolves PubMed through the esummary DOI lookup', async () => {
    const calls: string[] = [];
    const fetchImpl = async (url: string) => {
      calls.push(String(url));
      if (String(url).includes('eutils.ncbi')) {
        return {
          ok: true,
          json: async () => ({
            result: { '13233369': { articleids: [{ idtype: 'doi', value: '10.1038/x' }] } },
          }),
        };
      }
      return {
        ok: true,
        json: async () => ({ message: { title: ['A Paper'], DOI: '10.1038/x' } }),
      };
    };
    const out = await scholarMetaResolver.resolve(
      'https://pubmed.ncbi.nlm.nih.gov/13233369',
      ctx(fetchImpl),
    );
    expect(out?.fields.title).toBe('A Paper');
    // PubMed's page is JS-rendered and yields nothing, so it must never be fetched.
    expect(calls.some((c) => c.includes('pubmed.ncbi.nlm.nih.gov'))).toBe(false);
  });

  it('declines a page with no citation meta rather than guessing', async () => {
    const out = await scholarMetaResolver.resolve(
      'https://nature.com/x',
      ctx(async () => html('<html><head><title>Nothing</title></head></html>')),
    );
    expect(out).toBeNull();
  });

  it('returns null when the host is unreachable, without throwing (AC-6)', async () => {
    const out = await scholarMetaResolver.resolve(
      'https://nature.com/x',
      ctx(async () => {
        throw new Error('ECONNREFUSED');
      }),
    );
    expect(out).toBeNull();
  });

  it('returns null on a non-2xx response', async () => {
    const out = await scholarMetaResolver.resolve(
      'https://nature.com/x',
      ctx(async () => ({ ok: false, status: 403 })),
    );
    expect(out).toBeNull();
  });
});
