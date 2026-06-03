import { docs_v1 } from "googleapis";
import { google } from "googleapis";
import { createHash } from "crypto";
import { writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import { basename, join } from "path";
import pLimit from "p-limit";
import { createStorage } from "unstorage";
import fsDriver from "unstorage/drivers/fs";

const docCache = createStorage<docs_v1.Schema$DocumentTab>({
  driver: fsDriver({ base: "./.cache/docs" }),
});

export class DocsSDK {
  client: docs_v1.Docs | null
  assetsPath: string;
  assetURLGenerator: (filename: string) => string;
  cacheOnly: boolean;

  constructor(credentials: string | null, assetsPath: string, assetURLGenerator: (filename: string) => string = (f) => f, cacheOnly: boolean = false) {
    this.cacheOnly = cacheOnly;
    this.assetsPath = assetsPath
    this.assetURLGenerator = assetURLGenerator

    if (credentials) {
      this.client = google.docs({
        version: "v1",
        auth: new google.auth.GoogleAuth({
          credentials: JSON.parse(
            Buffer.from(credentials, "base64").toString("utf-8")
          ),
          scopes: ["https://www.googleapis.com/auth/documents.readonly"],
        })
      })
    } else {
      this.client = null;
    }
  }

  async fetchDoc(docId: string, tabId: string): Promise<docs_v1.Schema$DocumentTab> {
    const cacheKey = `${docId}:${tabId}`;

    const cached = await docCache.getItem(cacheKey);
    if (cached) {
      // Safety: if the cached doc references images that no longer exist
      // on disk AND we have creds, ignore the cache and re-fetch. This
      // protects against the "stale CI cache hides missing images" footgun.
      // Contributors (cacheOnly / no client) keep the cache hit even with
      // missing images — they get caption-only figures by design.
      if (this.client && !this.cacheOnly && !this.imagesExist(cached)) {
        console.warn(`[atlas] Cached doc ${cacheKey} references missing image assets — re-fetching.`);
      } else {
        return cached;
      }
    }

    if (this.cacheOnly || !this.client) {
      const reason = this.cacheOnly
        ? "cacheOnly mode is enabled"
        : "no Google credentials configured";
      throw new Error(
        `[atlas] Cache miss for document ${docId}:${tabId} (${reason}).\n` +
        `  Either:\n` +
        `    (a) Add GOOGLE_CREDENTIALS_BASE64 to .env (maintainer only), or\n` +
        `    (b) Refresh .cache/docs/ with the latest seed.\n` +
        `  See CONTRIBUTING.md for details.`,
      );
    }

    const response = await this.client.documents.get({
      documentId: docId,
      includeTabsContent: true,
      suggestionsViewMode: "PREVIEW_WITHOUT_SUGGESTIONS",
    });

    const doc = response.data;

    let tab: docs_v1.Schema$DocumentTab | undefined;

    for (const maybeTab of doc.tabs ?? []) {
      if (maybeTab.documentTab && maybeTab.tabProperties?.tabId === tabId) {
        tab = maybeTab.documentTab;
        break;
      }
    }

    if (tab === undefined) {
      throw new Error(`Could not find tab ${tabId} in doc ${docId}`);
    }

    if (tab.inlineObjects) {
      await this.downloadImages(tab.inlineObjects)
    }

    await docCache.setItem(cacheKey, tab);

    return tab
  }

  /**
   * Returns true if every image referenced by the cached doc still exists on
   * disk. A cached doc's inlineObjects have their `contentUri` rewritten by
   * downloadImages to the assetURLGenerator output (e.g., "/assets/uc/<hash>.png").
   */
  imagesExist(tab: docs_v1.Schema$DocumentTab): boolean {
    const objects = tab.inlineObjects;
    if (!objects) return true;
    for (const obj of Object.values(objects)) {
      const uri = obj.inlineObjectProperties?.embeddedObject?.imageProperties?.contentUri;
      if (!uri) continue;
      // Only check local asset paths; remote URIs (http/https) live in cached
      // docs that were never image-rewritten and are out of scope.
      if (/^https?:\/\//i.test(uri)) continue;
      const filename = basename(uri);
      if (!existsSync(join(this.assetsPath, filename))) return false;
    }
    return true;
  }

  // Google's signed image URLs (lh*.googleusercontent.com) intermittently
  // return HTTP 500. Retry transient failures with exponential backoff before
  // giving up. 4xx responses are permanent and not retried.
  private async fetchWithRetry(url: string, attempts = 3): Promise<Response> {
    let lastError: unknown;
    for (let i = 0; i < attempts; i++) {
      try {
        const response = await fetch(url);
        if (response.ok) return response;
        if (response.status < 500) return response;
        lastError = new Error(`HTTP ${response.status}`);
      } catch (e) {
        lastError = e;
      }
      if (i < attempts - 1) {
        await new Promise(r => setTimeout(r, 1000 * Math.pow(2, i)));
      }
    }
    throw lastError instanceof Error ? lastError : new Error(String(lastError));
  }

  private async downloadImages(objects: Record<string, docs_v1.Schema$InlineObject>): Promise<void> {
    await mkdir(this.assetsPath, { recursive: true });

    const limit = pLimit(5)
    const failed: string[] = [];

    const downloadTasks = Object.values(objects).map(obj => limit(async() => {
      if (!obj.inlineObjectProperties?.embeddedObject?.imageProperties?.contentUri) {
        return
      }

      const url = obj.inlineObjectProperties.embeddedObject.imageProperties.contentUri

      try {
        const response = await this.fetchWithRetry(url)
        if (!response.ok) {
          console.error(`Failed to download image HTTP ${response.status} for ${url}`)
          failed.push(url)
          return
        }

        const buffer = Buffer.from(await response.arrayBuffer());
        const hash = createHash("sha256").update(buffer).digest("hex");

        const ext = this.getExtensionFromContentType(response.headers.get("content-type") || "");

        const filename = `${hash}.${ext}`
        const filepath = join(this.assetsPath, filename);

        await writeFile(filepath, buffer);

        obj.inlineObjectProperties.embeddedObject.imageProperties.contentUri = this["assetURLGenerator"](filename)
      } catch (e) {
        console.error(`Failed to download image after retries for ${url}: ${e}`)
        failed.push(url)
      }
    }))
    await Promise.all(downloadTasks)

    // Fail loud BEFORE the partial result is cached. Previously, partial
    // failures left a mix of local paths and original Google URLs in the
    // tab, which silently poisoned the cache and surfaced as confusing
    // Typst "file not found" errors during PDF rendering.
    if (failed.length > 0) {
      throw new Error(
        `[atlas] ${failed.length} image download(s) failed after retries. ` +
        `Refusing to cache the partial result.\n` +
        failed.map(u => `  - ${u}`).join('\n'),
      );
    }
  }

  getExtensionFromContentType(contentType: string): string {
    const map: Record<string, string> = {
      "image/png": "png",
      "image/jpeg": "jpg",
      "image/jpg": "jpg",
      "image/gif": "gif",
      "image/webp": "webp",
      "image/svg+xml": "svg",
    };
    return map[contentType.split(";")[0].trim()] || "png";
  }

}
