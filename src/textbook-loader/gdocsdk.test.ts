import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { mkdtempSync, rmSync, writeFileSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { DocsSDK } from "./gdocsdk";
import { TEXTBOOK_EDITIONS } from "./data";

// A real docId/tabId that exists in the committed .cache/docs/ snapshot.
// Picking dynamically so tests stay correct if data.ts is reordered.
const KNOWN_DOC = TEXTBOOK_EDITIONS[0].chapters[0];

// Valid-looking but inert service-account JSON. Lets the GoogleAuth
// client construct without crashing; never used because cache hits
// short-circuit before any real API call.
const FAKE_CREDS = Buffer.from(JSON.stringify({
  type: "service_account",
  project_id: "fake",
  client_email: "fake@example.iam.gserviceaccount.com",
  private_key: "-----BEGIN PRIVATE KEY-----\nfake\n-----END PRIVATE KEY-----\n",
})).toString("base64");

function makeTab(uris: (string | null)[]) {
  return {
    inlineObjects: Object.fromEntries(
      uris.map((uri, i) => [
        `obj${i}`,
        {
          inlineObjectProperties: {
            embeddedObject: {
              imageProperties: uri === null ? {} : { contentUri: uri },
            },
          },
        },
      ]),
    ),
  };
}

describe("DocsSDK.imagesExist", () => {
  let assetsDir: string;
  let sdk: DocsSDK;

  beforeEach(() => {
    assetsDir = mkdtempSync(join(tmpdir(), "atlas-assets-"));
    sdk = new DocsSDK(null, assetsDir);
  });

  afterEach(() => {
    rmSync(assetsDir, { recursive: true, force: true });
  });

  it("returns true when tab has no inlineObjects", () => {
    expect(sdk.imagesExist({} as any)).toBe(true);
  });

  it("returns true when all referenced asset files exist on disk", () => {
    writeFileSync(join(assetsDir, "a.png"), "x");
    writeFileSync(join(assetsDir, "b.png"), "x");
    const tab = makeTab(["/assets/uc/a.png", "/assets/uc/b.png"]);
    expect(sdk.imagesExist(tab as any)).toBe(true);
  });

  it("returns false when any referenced asset file is missing", () => {
    writeFileSync(join(assetsDir, "a.png"), "x");
    const tab = makeTab(["/assets/uc/a.png", "/assets/uc/missing.png"]);
    expect(sdk.imagesExist(tab as any)).toBe(false);
  });

  it("ignores remote URIs (http/https) that were never rewritten", () => {
    const tab = makeTab(["https://lh3.googleusercontent.com/whatever"]);
    expect(sdk.imagesExist(tab as any)).toBe(true);
  });

  it("ignores objects with no contentUri", () => {
    const tab = makeTab([null]);
    expect(sdk.imagesExist(tab as any)).toBe(true);
  });
});

describe("DocsSDK.fetchDoc cache decisions", () => {
  // These tests use the real committed .cache/docs/ snapshot as a fixture.
  // The cache key format is `${docId}:${tabId}` (a known doc from data.ts).

  it("contributor (no creds): cache hit returns the cached doc", async () => {
    const sdk = new DocsSDK(null, "/tmp/non-existent");
    const doc = await sdk.fetchDoc(KNOWN_DOC.docId, KNOWN_DOC.tabId);
    expect(doc).toBeTruthy();
    expect(doc.body).toBeTruthy();
  });

  it("contributor (no creds): cache hit returns cached even when images missing", async () => {
    // Pointing assetsPath at an empty temp dir so imagesExist would return
    // false. But with no client, the safety check is skipped and we still
    // serve the cached doc — that's the contributor degradation path.
    const empty = mkdtempSync(join(tmpdir(), "atlas-empty-"));
    try {
      const sdk = new DocsSDK(null, empty);
      const doc = await sdk.fetchDoc(KNOWN_DOC.docId, KNOWN_DOC.tabId);
      expect(doc).toBeTruthy();
    } finally {
      rmSync(empty, { recursive: true, force: true });
    }
  });

  it("maintainer with cacheOnly=true: cache hit returns cached without consulting client", async () => {
    const sdk = new DocsSDK(FAKE_CREDS, "/tmp/non-existent", undefined, true);
    expect(sdk.cacheOnly).toBe(true);
    expect(sdk.client).not.toBeNull();
    const doc = await sdk.fetchDoc(KNOWN_DOC.docId, KNOWN_DOC.tabId);
    expect(doc).toBeTruthy();
  });

  it("contributor (no creds): cache miss throws with helpful message naming the doc", async () => {
    const sdk = new DocsSDK(null, "/tmp");
    await expect(sdk.fetchDoc("non-existent-doc-xyz", "t.99")).rejects.toThrow(
      /non-existent-doc-xyz:t\.99/,
    );
  });

  it("contributor: cache-miss error mentions the no-credentials state", async () => {
    const sdk = new DocsSDK(null, "/tmp");
    await expect(sdk.fetchDoc("non-existent-doc-xyz", "t.99")).rejects.toThrow(
      /no Google credentials configured/,
    );
  });

  it("contributor: cache-miss error points at both recovery paths", async () => {
    const sdk = new DocsSDK(null, "/tmp");
    const err = await sdk.fetchDoc("non-existent-doc-xyz", "t.99").catch((e) => e);
    expect(err.message).toMatch(/GOOGLE_CREDENTIALS_BASE64/);
    expect(err.message).toMatch(/refresh.*cache/i);
    expect(err.message).toMatch(/CONTRIBUTING\.md/);
  });

  it("maintainer with cacheOnly=true: cache miss throws naming cacheOnly state", async () => {
    const sdk = new DocsSDK(FAKE_CREDS, "/tmp", undefined, true);
    await expect(sdk.fetchDoc("non-existent-doc-xyz", "t.99")).rejects.toThrow(
      /cacheOnly mode is enabled/,
    );
  });

  it("maintainer not in cacheOnly: cached hit with missing images triggers a refetch warning", async () => {
    // We can't easily verify the refetch happens (it would hit the real API),
    // but we can verify the warning is logged. Stub imagesExist to force the
    // safety branch, then expect the subsequent network call to fail (no real
    // creds), which still proves the branch was taken.
    const empty = mkdtempSync(join(tmpdir(), "atlas-empty-"));
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    try {
      const sdk = new DocsSDK(FAKE_CREDS, empty, undefined, false);
      // Real cache hit, but assetsPath is empty so imagesExist returns false.
      // The branch falls through to client.documents.get, which will fail
      // because FAKE_CREDS isn't a real key — that's expected.
      await expect(
        sdk.fetchDoc(KNOWN_DOC.docId, KNOWN_DOC.tabId),
      ).rejects.toBeDefined();
      expect(warn).toHaveBeenCalled();
      const msg = warn.mock.calls[0][0];
      expect(msg).toMatch(/missing image assets/);
      expect(msg).toMatch(/re-fetching/);
    } finally {
      warn.mockRestore();
      rmSync(empty, { recursive: true, force: true });
    }
  });
});
