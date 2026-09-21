import { describe, it, expect } from 'vitest';
import { canonicalizeUrl, isAssetUrl } from './canonical-url';

describe('canonicalizeUrl — arXiv (task:0025 AC-3)', () => {
  // The headline case: the corpus cites the same paper as /abs and /pdf, and
  // without this they would be two bibliography entries for one work.
  it('collapses /abs, /pdf, /pdf.pdf and /html to one key', () => {
    const want = 'https://arxiv.org/abs/1911.01547';
    for (const variant of [
      'https://arxiv.org/abs/1911.01547',
      'https://arxiv.org/pdf/1911.01547',
      'https://arxiv.org/pdf/1911.01547.pdf',
      'https://arxiv.org/html/1911.01547',
      'http://www.arxiv.org/abs/1911.01547',
    ]) {
      expect(canonicalizeUrl(variant)).toBe(want);
    }
  });

  it('drops the version suffix, so v1 and v2 are one entry', () => {
    expect(canonicalizeUrl('https://arxiv.org/abs/1911.01547v2')).toBe(
      'https://arxiv.org/abs/1911.01547',
    );
    expect(canonicalizeUrl('https://arxiv.org/pdf/1911.01547v13')).toBe(
      'https://arxiv.org/abs/1911.01547',
    );
  });

  it('keeps old-style category identifiers intact', () => {
    expect(canonicalizeUrl('https://arxiv.org/abs/cs/0701001')).toBe(
      'https://arxiv.org/abs/cs/0701001',
    );
  });

  it('does not merge two different papers', () => {
    expect(canonicalizeUrl('https://arxiv.org/abs/1911.01547')).not.toBe(
      canonicalizeUrl('https://arxiv.org/abs/1804.07461'),
    );
  });
});

describe('canonicalizeUrl — DOI and YouTube', () => {
  it('normalizes DOI resolver prefixes and case', () => {
    const want = 'https://doi.org/10.1038/s41586-021-03819-2';
    for (const v of [
      'https://doi.org/10.1038/s41586-021-03819-2',
      'http://dx.doi.org/10.1038/s41586-021-03819-2',
      'https://www.doi.org/10.1038/S41586-021-03819-2',
    ]) {
      expect(canonicalizeUrl(v)).toBe(want);
    }
  });

  it('collapses youtu.be and watch?v= to one key', () => {
    const want = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
    expect(canonicalizeUrl('https://youtu.be/dQw4w9WgXcQ')).toBe(want);
    expect(canonicalizeUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=42s')).toBe(want);
  });
});

describe('canonicalizeUrl — general rules', () => {
  it('upgrades scheme, lowercases host, strips www and trailing slash', () => {
    expect(canonicalizeUrl('http://WWW.Epoch.AI/blog/some-post/')).toBe(
      'https://epoch.ai/blog/some-post',
    );
  });

  it('drops the fragment, because it addresses a place inside one document', () => {
    expect(canonicalizeUrl('https://epoch.ai/blog/post#section-3')).toBe(
      'https://epoch.ai/blog/post',
    );
  });

  it('strips tracking parameters but keeps meaningful ones', () => {
    expect(canonicalizeUrl('https://example.org/a?utm_source=x&id=7&fbclid=y')).toBe(
      'https://example.org/a?id=7',
    );
  });

  it('sorts query parameters so order is not identity', () => {
    expect(canonicalizeUrl('https://example.org/a?b=2&a=1')).toBe(
      canonicalizeUrl('https://example.org/a?a=1&b=2'),
    );
  });

  it('does not merge different paths on one host', () => {
    expect(canonicalizeUrl('https://epoch.ai/a')).not.toBe(canonicalizeUrl('https://epoch.ai/b'));
  });

  it('returns null for unusable input', () => {
    for (const bad of ['', 'not a url', 'mailto:x@y.z', 'javascript:alert(1)', '/relative/path']) {
      expect(canonicalizeUrl(bad)).toBeNull();
    }
  });
});

describe('isAssetUrl', () => {
  // The corpus contains a Wikipedia image URL sitting among real citations.
  it('recognises the image link found in the real corpus', () => {
    expect(
      isAssetUrl('https://upload.wikimedia.org/wikipedia/commons/b/b1/MNIST_dataset_example.png'),
    ).toBe(true);
  });

  it('does not treat ordinary documents as assets', () => {
    expect(isAssetUrl('https://arxiv.org/abs/1911.01547')).toBe(false);
    expect(isAssetUrl('https://epoch.ai/blog/post')).toBe(false);
  });

  it('treats a PDF as a document, not an asset', () => {
    expect(isAssetUrl('https://example.org/paper.pdf')).toBe(false);
  });
});
