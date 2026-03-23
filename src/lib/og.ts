const IMAGEGEN_BASE = "https://imagegen.foreview.org/atlas";

export function ogImageUrl(params: { title: string; description?: string }): string {
  const url = new URL(`${IMAGEGEN_BASE}/og.png`);
  url.searchParams.set("title", params.title);
  if (params.description) url.searchParams.set("description", params.description);
  return url.toString();
}

export function sectionOgImageUrl(params: {
  eyebrow: string;
  title: string;
  description?: string;
  audio?: boolean;
  edition?: string;
}): string {
  const url = new URL(`${IMAGEGEN_BASE}/section.png`);
  url.searchParams.set("eyebrow", params.eyebrow);
  url.searchParams.set("title", params.title);
  if (params.description) url.searchParams.set("description", params.description);
  if (params.audio) url.searchParams.set("audio", "true");
  if (params.edition) url.searchParams.set("edition", params.edition);
  return url.toString();
}
