import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync, writeFileSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { DocsSDK } from "./gdocsdk";

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
