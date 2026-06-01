import { docs_v1 } from "googleapis";
import { google, Auth } from "googleapis";
import { createHash } from "crypto";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
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
      return cached
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
        `  See docs/CONTRIBUTING.md for details.`,
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

  private async downloadImages(objects: Record<string, docs_v1.Schema$InlineObject>): Promise<void> {
    // Ensure assets directory exists
    await mkdir(this.assetsPath, { recursive: true });

    const limit = pLimit(5)

    const downloadTasks = Object.values(objects).map(obj => limit(async() => {
      if (!obj.inlineObjectProperties?.embeddedObject?.imageProperties?.contentUri) {
        return
      }

      let url = obj.inlineObjectProperties?.embeddedObject?.imageProperties?.contentUri

      try {
        const response = await fetch(url)
        if (!response.ok) {
          console.error(`Failed to download image HTTP ${response.status} for ${url}`)
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
        console.error(`Failed to download image: ${e}`)
        return
      }
    }))
    await Promise.all(downloadTasks)
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
