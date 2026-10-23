import { createHash } from 'node:crypto';

// Bump this when the card design changes so social caches request the new image.
const CARD_VERSION = 1;

export type OgCard =
  | { kind: 'og'; title: string; description: string }
  | {
      kind: 'section';
      eyebrow: string;
      title: string;
      description: string;
      audio: boolean;
      edition: string;
    };

export function ogImagePath({
  title,
  description,
  pathname,
  card,
}: {
  title: string;
  description: string;
  pathname: string;
  card: OgCard;
}): string {
  const hash = createHash('sha256')
    .update(JSON.stringify([CARD_VERSION, title, description, pathname, card]))
    .digest('hex')
    .slice(0, 20);
  return `/og/${hash}.png`;
}
