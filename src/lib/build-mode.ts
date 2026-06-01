/**
 * Single source of truth for environment-dependent build behaviour.
 *
 * Every module that needs to know "are we in maintainer mode or contributor
 * mode" consumes a typed BuildMode object from here. No other module should
 * read process.env or astro:env for these decisions.
 */

export interface BuildMode {
  hasGoogleCreds: boolean;
  hasAlgoliaWrite: boolean;
  hasR2Creds: boolean;
  generatePdf: boolean;
  generateAudio: boolean;
  downloadAudio: boolean;
  uploadAudio: boolean;
  indexAlgolia: boolean;
  fetchFromGoogleDocs: boolean;
  summary: string;
}

export interface EnvSnapshot {
  GOOGLE_CREDENTIALS_BASE64?: string;
  ALGOLIA_WRITE_KEY?: string;
  R2_ENDPOINT?: string;
  R2_ACCESS_KEY_ID?: string;
  R2_SECRET_ACCESS_KEY?: string;
  R2_BUCKET?: string;
  SKIP_PDF?: string;
  SKIP_AUDIO?: string;
  NODE_ENV?: string;
}

export function detectBuildMode(env: EnvSnapshot): BuildMode {
  const hasGoogleCreds = !!env.GOOGLE_CREDENTIALS_BASE64;
  const hasAlgoliaWrite = !!env.ALGOLIA_WRITE_KEY;
  const hasR2Creds = !!(
    env.R2_ENDPOINT &&
    env.R2_ACCESS_KEY_ID &&
    env.R2_SECRET_ACCESS_KEY &&
    env.R2_BUCKET
  );
  const isDev = env.NODE_ENV === "development";
  const skipPdf = !!env.SKIP_PDF || !hasGoogleCreds;
  const skipAudio = !!env.SKIP_AUDIO || !hasGoogleCreds;

  const mode: BuildMode = {
    hasGoogleCreds,
    hasAlgoliaWrite,
    hasR2Creds,
    generatePdf: !skipPdf,
    generateAudio: !skipAudio,
    // R2 audio traffic only makes sense in a real build with creds.
    // Dev mode never pulls/pushes — prevents the "SKIP_AUDIO=1 still
    // downloads N MP3s" footgun.
    downloadAudio: hasR2Creds && !isDev,
    uploadAudio: hasR2Creds && !isDev && !skipAudio,
    indexAlgolia: hasGoogleCreds && hasAlgoliaWrite,
    fetchFromGoogleDocs: hasGoogleCreds,
    summary: "",
  };

  mode.summary = formatSummary(mode);
  return mode;
}

function formatSummary(m: BuildMode): string {
  const role = m.hasGoogleCreds ? "maintainer" : "contributor";
  const parts: string[] = [role];
  if (!m.fetchFromGoogleDocs) parts.push("cache-only");
  if (!m.generatePdf) parts.push("no PDF");
  if (!m.generateAudio) parts.push("no audio");
  if (!m.downloadAudio) parts.push("no R2 audio pull");
  if (!m.indexAlgolia) parts.push("no Algolia indexing");
  parts.push("search enabled");
  return `[atlas] BuildMode: ${parts.join(", ")}`;
}
