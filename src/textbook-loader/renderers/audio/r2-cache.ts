import { S3Client, GetObjectCommand, PutObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { existsSync, readFileSync, writeFileSync, readdirSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import pLimit from 'p-limit';

interface R2Config {
  endpoint: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
}

function getR2Config(): R2Config | null {
  const endpoint = process.env.R2_ENDPOINT;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const bucket = process.env.R2_BUCKET;

  if (!endpoint || !accessKeyId || !secretAccessKey || !bucket) return null;
  return { endpoint, accessKeyId, secretAccessKey, bucket };
}

function makeS3Client(config: R2Config): S3Client {
  return new S3Client({
    region: 'auto',
    endpoint: config.endpoint,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
  });
}

const LOCAL_CACHE_DIRS = {
  'audio-chunks': join(process.cwd(), '.cache', 'audio-chunks'),
  'equation-descriptions': join(process.cwd(), '.cache', 'equation-descriptions'),
};

/**
 * Download specific R2 cache objects into the local .cache/ directory.
 * Only downloads files from `neededKeys` that aren't already cached locally.
 * @param neededKeys - full R2 keys like `audio-chunks/abc123.pcm`, `equation-descriptions/def456.txt`
 */
export async function pullFromR2(neededKeys: Set<string>): Promise<void> {
  const config = getR2Config();
  if (!config) {
    console.log('[r2-cache] R2 env vars not set, using local cache only.');
    return;
  }

  // Ensure cache directories exist
  for (const localDir of Object.values(LOCAL_CACHE_DIRS)) {
    mkdirSync(localDir, { recursive: true });
  }

  const client = makeS3Client(config);

  // Filter to only keys not already cached locally
  const toDownload: { key: string; localPath: string }[] = [];
  for (const key of neededKeys) {
    const localPath = join(process.cwd(), '.cache', key);
    if (!existsSync(localPath)) {
      toDownload.push({ key, localPath });
    }
  }

  if (toDownload.length === 0) {
    console.log(`[r2-cache] All ${neededKeys.size} needed files already cached locally.`);
    return;
  }

  console.log(`[r2-cache] Downloading ${toDownload.length} of ${neededKeys.size} needed files from R2...`);

  const limit = pLimit(50);
  await Promise.all(toDownload.map(({ key, localPath }) => limit(async () => {
    try {
      const response = await client.send(new GetObjectCommand({
        Bucket: config.bucket,
        Key: key,
      }));

      if (!response.Body) return;
      const chunks: Uint8Array[] = [];
      for await (const chunk of response.Body as AsyncIterable<Uint8Array>) {
        chunks.push(chunk);
      }
      mkdirSync(dirname(localPath), { recursive: true });
      writeFileSync(localPath, Buffer.concat(chunks));
    } catch (err: any) {
      // NoSuchKey is expected for new content — not an error
      if (err?.name === 'NoSuchKey') return;
      console.warn(`[r2-cache] Failed to download ${key}:`, err);
    }
  })));
}

/**
 * Upload any local cache files that are new (not yet in R2).
 * Tracks which files exist in R2 by listing before uploading.
 */
export async function pushToR2(): Promise<void> {
  const config = getR2Config();
  if (!config) return;

  const client = makeS3Client(config);

  for (const [prefix, localDir] of Object.entries(LOCAL_CACHE_DIRS)) {
    if (!existsSync(localDir)) continue;

    // List what's already in R2
    let existingKeys: Set<string> = new Set();
    try {
      const list = await client.send(new ListObjectsV2Command({
        Bucket: config.bucket,
        Prefix: `${prefix}/`,
      }));
      for (const obj of list.Contents ?? []) {
        if (obj.Key) existingKeys.add(obj.Key);
      }
    } catch (err) {
      console.warn(`[r2-cache] Failed to list R2 for push:`, err);
    }

    const localFiles = readdirSync(localDir);
    const toUpload = localFiles.filter(f => !existingKeys.has(`${prefix}/${f}`));

    if (toUpload.length === 0) continue;
    console.log(`[r2-cache] Uploading ${toUpload.length} new files to R2 prefix "${prefix}/"`);

    const limit = pLimit(50);
    await Promise.all(toUpload.map((filename) => limit(async () => {
      const localPath = join(localDir, filename);
      const key = `${prefix}/${filename}`;
      try {
        await client.send(new PutObjectCommand({
          Bucket: config.bucket,
          Key: key,
          Body: readFileSync(localPath),
        }));
      } catch (err) {
        console.warn(`[r2-cache] Failed to upload ${key}:`, err);
      }
    })));
  }
}

/**
 * Batch-download final audio files from R2.
 * Each entry maps an R2 key (under `final-audio/`) to a local destination path.
 * Silently skips files that don't exist in R2.
 */
export async function pullFinalAudioBatch(
  files: { key: string; destPath: string }[],
): Promise<void> {
  const config = getR2Config();
  if (!config || files.length === 0) return;

  const client = makeS3Client(config);
  const limit = pLimit(50);

  await Promise.all(files.map(({ key, destPath }) => limit(async () => {
    try {
      const response = await client.send(new GetObjectCommand({
        Bucket: config.bucket,
        Key: key,
      }));

      if (!response.Body) return;
      const chunks: Uint8Array[] = [];
      for await (const chunk of response.Body as AsyncIterable<Uint8Array>) {
        chunks.push(chunk);
      }
      mkdirSync(dirname(destPath), { recursive: true });
      writeFileSync(destPath, Buffer.concat(chunks));
    } catch (err: any) {
      if (err?.name === 'NoSuchKey') return;
      console.warn(`[r2-cache] Failed to download ${key}:`, err);
    }
  })));
}

/**
 * Upload final assembled MP3s to R2 under the `final-audio/` prefix.
 * Always overwrites — these are "latest" snapshots.
 */
export async function pushFinalAudioFiles(files: Map<string, string>): Promise<void> {
  const config = getR2Config();
  if (!config || files.size === 0) return;

  const client = makeS3Client(config);
  console.log(`[r2-cache] Uploading ${files.size} final audio files to R2...`);

  const limit = pLimit(50);
  await Promise.all([...files.entries()].map(([stableKey, localPath]) => limit(async () => {
    const key = `final-audio/${stableKey}.mp3`;
    try {
      await client.send(new PutObjectCommand({
        Bucket: config.bucket,
        Key: key,
        Body: readFileSync(localPath),
      }));
    } catch (err) {
      console.warn(`[r2-cache] Failed to upload final audio ${key}:`, err);
    }
  })));
}
