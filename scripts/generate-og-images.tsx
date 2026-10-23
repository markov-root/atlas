/** @jsxImportSource satori/jsx */

import { createHash } from 'node:crypto';
import { existsSync } from 'node:fs';
import { copyFile, mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import pLimit from 'p-limit';
import { parse } from 'parse5';
import satori from 'satori';
import sharp from 'sharp';
import { ogImagePath, type OgCard } from '../src/lib/og';
import atlasTemplate from './og/atlas-template';

type HtmlNode = {
  nodeName: string;
  childNodes?: HtmlNode[];
  attrs?: { name: string; value: string }[];
};

type Card = {
  title: string;
  description: string;
  pathname: string;
  imageName: string;
  card: OgCard;
};

const root = process.cwd();
const distDir = join(root, 'dist');
const imageDir = join(distDir, 'og');
const cacheDir = join(root, '.cache', 'og-images');

function findNode(node: HtmlNode, name: string): HtmlNode | undefined {
  if (node.nodeName === name) return node;
  for (const child of node.childNodes ?? []) {
    const found = findNode(child, name);
    if (found) return found;
  }
  return undefined;
}

function attribute(node: HtmlNode, name: string): string | undefined {
  return node.attrs?.find((attr) => attr.name === name)?.value;
}

function pageCard(html: string): Card | undefined {
  const head = findNode(parse(html) as HtmlNode, 'head');
  if (!head) return undefined;

  const meta = new Map<string, string>();
  for (const node of head.childNodes ?? []) {
    if (node.nodeName !== 'meta') continue;
    const name = attribute(node, 'property') ?? attribute(node, 'name');
    const content = attribute(node, 'content');
    if (name && content !== undefined) meta.set(name, content);
  }

  const title = meta.get('og:title');
  const description = meta.get('og:description');
  const canonical = meta.get('og:url');
  const image = meta.get('og:image');
  const cardJson = meta.get('atlas:og-card');
  if (!title || description === undefined || !canonical || !image) return undefined;
  if (!cardJson) throw new Error(`Missing Atlas OG card data at ${canonical}`);

  const card = JSON.parse(cardJson) as OgCard;
  if (card.kind !== 'og' && card.kind !== 'section') {
    throw new Error(`Unknown OG card template at ${canonical}`);
  }

  const pathname = new URL(canonical).pathname;
  const expected = new URL(ogImagePath({ title, description, pathname, card }), canonical).href;
  if (image !== expected || meta.get('twitter:image') !== image) {
    throw new Error(`Social image metadata does not match ${canonical}`);
  }
  const imageName = new URL(image).pathname.split('/').at(-1);
  if (!imageName || !/^[a-f0-9]{20}\.png$/.test(imageName)) {
    throw new Error(`Unexpected social image URL: ${image}`);
  }
  return { title, description, pathname, imageName, card };
}

async function htmlFiles(dir: string): Promise<string[]> {
  const files: string[] = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) files.push(...await htmlFiles(path));
    else if (entry.isFile() && entry.name.endsWith('.html')) files.push(path);
  }
  return files;
}

const [bgBytes, markBytes, righteous, jostRegular, jostMedium, scriptBytes, templateBytes] = await Promise.all([
  readFile(new URL('./og/atlas-bg.png', import.meta.url)),
  readFile(new URL('./og/atlas-mark-white.svg', import.meta.url)),
  readFile(new URL('../node_modules/@fontsource/righteous/files/righteous-latin-400-normal.woff', import.meta.url)),
  readFile(new URL('../node_modules/@fontsource/jost/files/jost-latin-400-normal.woff', import.meta.url)),
  readFile(new URL('../node_modules/@fontsource/jost/files/jost-latin-500-normal.woff', import.meta.url)),
  readFile(new URL(import.meta.url)),
  readFile(new URL('./og/atlas-template.tsx', import.meta.url)),
]);

const bg = `data:image/png;base64,${bgBytes.toString('base64')}`;
const mark = `data:image/svg+xml;base64,${markBytes.toString('base64')}`;
const fingerprint = createHash('sha256')
  .update(scriptBytes)
  .update(templateBytes)
  .update(bgBytes)
  .update(markBytes)
  .update(righteous)
  .update(jostRegular)
  .update(jostMedium)
  .digest('hex');

const files = await htmlFiles(distDir);
const cards = new Map<string, Card>();
for (const file of files) {
  const card = pageCard(await readFile(file, 'utf8'));
  if (!card) continue;
  const previous = cards.get(card.imageName);
  if (previous && JSON.stringify(previous) !== JSON.stringify(card)) {
    throw new Error(`Two pages request different cards at ${card.imageName}`);
  }
  cards.set(card.imageName, card);
}

await Promise.all([mkdir(imageDir, { recursive: true }), mkdir(cacheDir, { recursive: true })]);
const limit = pLimit(4);
let rendered = 0;
let cached = 0;
await Promise.all([...cards.values()].map((card) => limit(async () => {
  const target = join(imageDir, card.imageName);
  const cacheKey = createHash('sha256').update(fingerprint).update(JSON.stringify(card)).digest('hex');
  const cacheFile = join(cacheDir, `${cacheKey}.png`);
  if (existsSync(cacheFile)) {
    await copyFile(cacheFile, target);
    cached++;
    return;
  }

  const assets = { bg, mark };
  const element = card.card.kind === 'section'
    ? atlasTemplate.templates.section.render(card.card, assets)
    : atlasTemplate.templates.og.render(card.card, assets);
  const svg = await satori(element, {
    width: 1200,
    height: 630,
    fonts: [
      { name: 'Righteous', data: righteous, weight: 400, style: 'normal' },
      { name: 'Jost', data: jostRegular, weight: 400, style: 'normal' },
      { name: 'Jost', data: jostMedium, weight: 500, style: 'normal' },
    ],
  });
  const png = await sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toBuffer();
  await writeFile(cacheFile, png);
  await copyFile(cacheFile, target);
  rendered++;
})));

console.log(`OG cards: ${cards.size} images for ${files.length} HTML pages (${rendered} rendered, ${cached} cached).`);
