/**
 * Reduce the many URL spellings of one source to a single key.
 *
 * This is bank B3 of `task:0021`, and it is load-bearing: the canonical URL IS
 * the bibliography entry's identity (`task:0021` D1). Every citation instance
 * in every chapter and every future language points at it, so a change here
 * after entries exist rewrites all of them.
 *
 * Deliberately conservative. Two URLs are merged only when they are the same
 * document by construction - a different path on the same host is a different
 * document until proven otherwise. Over-merging silently loses a citation;
 * under-merging leaves a visible duplicate somebody can fix. The second failure
 * is much cheaper, so the rules below prefer it.
 *
 * What this explicitly does NOT do: merge an arXiv preprint with its published
 * journal DOI. Those are different URLs for one work, and detecting it reliably
 * needs metadata we do not have at this stage (`task:0021` edge case 2). Phase 1
 * accepts the duplicate; a manual alias file is the intended answer.
 */

/** Query parameters that never identify a document. */
const TRACKING_PARAMS = [
  /^utm_/i,
  /^fbclid$/i,
  /^gclid$/i,
  /^mc_(cid|eid)$/i,
  /^ref$/i,
  /^source$/i,
  /^__s$/i,
];

function stripTracking(url: URL): void {
  for (const key of [...url.searchParams.keys()]) {
    if (TRACKING_PARAMS.some((re) => re.test(key))) url.searchParams.delete(key);
  }
}

/**
 * arXiv: `/abs/ID`, `/pdf/ID`, `/pdf/ID.pdf` and `/html/ID` are the same paper.
 *
 * The version suffix is dropped deliberately. `task:0021` treats a source as one
 * bibliography entry; v1 and v3 of a preprint are the same work for citation
 * purposes even though they are different bytes. (The research-database corpus
 * makes the opposite choice - there a revision is part of the identity - because
 * it is answering "what exactly was published", not "what is being cited".)
 */
function canonicalizeArxiv(url: URL): string | null {
  if (!/(^|\.)arxiv\.org$/i.test(url.hostname)) return null;
  const m = /^\/(?:abs|pdf|html|format)\/(.+?)(?:\.pdf)?$/i.exec(url.pathname);
  if (!m) return null;
  const id = m[1].replace(/v\d+$/i, '');
  return `https://arxiv.org/abs/${id}`;
}

/** DOIs: every resolver prefix denotes the same record; the DOI itself is the id. */
function canonicalizeDoi(url: URL): string | null {
  const host = url.hostname.toLowerCase();
  if (host === 'doi.org' || host === 'dx.doi.org' || host === 'www.doi.org') {
    const doi = url.pathname.replace(/^\/+/, '');
    if (!doi) return null;
    return `https://doi.org/${doi.toLowerCase()}`;
  }
  return null;
}

/** YouTube: `youtu.be/ID` and `watch?v=ID` are one video; playlist position is not identity. */
function canonicalizeYouTube(url: URL): string | null {
  const host = url.hostname.toLowerCase().replace(/^www\./, '');
  if (host === 'youtu.be') {
    const id = url.pathname.replace(/^\/+/, '');
    return id ? `https://www.youtube.com/watch?v=${id}` : null;
  }
  if (host === 'youtube.com' || host === 'm.youtube.com') {
    const id = url.searchParams.get('v');
    return id ? `https://www.youtube.com/watch?v=${id}` : null;
  }
  return null;
}

/**
 * The canonical form of a citation URL, or null if it is not a usable URL.
 *
 * General rules applied to everything: https, lowercase host, no `www.`, no
 * fragment, no tracking parameters, no trailing slash on a non-root path.
 *
 * The fragment is dropped because `#section-3` addresses a place *within* one
 * document, not a different document - two citations to different parts of the
 * same paper are two instances of one entry.
 */
export function canonicalizeUrl(raw: string): string | null {
  let url: URL;
  try {
    url = new URL(raw.trim());
  } catch {
    return null;
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;

  // A hostname with no dot cannot be a public document. `new URL()` happily
  // accepts `https://in` - hostname "in" - so a truncated or malformed href in
  // the Google Doc ("https://in", "https://li", "https://perez") became a
  // bibliography entry that rendered as `Cihon. (2019). https://in`. Three were
  // in the corpus. Rejecting them here means no entry is minted; the citation
  // still surfaces in the report as a broken link target, which is what an
  // author needs in order to fix the Doc. See `audit:0011` F13.
  if (!url.hostname.includes('.') || url.hostname.endsWith('.')) return null;

  const special = canonicalizeArxiv(url) ?? canonicalizeDoi(url) ?? canonicalizeYouTube(url);
  if (special) return special;

  url.protocol = 'https:';
  url.hostname = url.hostname.toLowerCase().replace(/^www\./, '');
  url.hash = '';
  url.port = '';
  stripTracking(url);

  if (url.pathname !== '/' && url.pathname.endsWith('/')) {
    url.pathname = url.pathname.replace(/\/+$/, '');
  }

  url.searchParams.sort();

  let out = url.toString();
  if (out.endsWith('?')) out = out.slice(0, -1);
  if (url.pathname === '/' && out.endsWith('/')) out = out.slice(0, -1);
  return out;
}

/** File extensions that mean a link points at an asset, not a citable document. */
const ASSET_EXTENSIONS = /\.(png|jpe?g|gif|webp|svg|ico|css|js|woff2?)$/i;

/** True when the URL addresses an image or other asset rather than a document. */
export function isAssetUrl(raw: string): boolean {
  try {
    return ASSET_EXTENSIONS.test(new URL(raw).pathname);
  } catch {
    return false;
  }
}
