import { describe, it, expect } from "vitest";
import { detectBuildMode, type EnvSnapshot } from "./build-mode";

const R2: Pick<
  EnvSnapshot,
  "R2_ENDPOINT" | "R2_ACCESS_KEY_ID" | "R2_SECRET_ACCESS_KEY" | "R2_BUCKET"
> = {
  R2_ENDPOINT: "https://example.r2.cloudflarestorage.com",
  R2_ACCESS_KEY_ID: "id",
  R2_SECRET_ACCESS_KEY: "secret",
  R2_BUCKET: "atlas",
};

describe("detectBuildMode", () => {
  it("no env → contributor cache-only build", () => {
    const m = detectBuildMode({});
    expect(m.hasGoogleCreds).toBe(false);
    expect(m.fetchFromGoogleDocs).toBe(false);
    expect(m.generatePdf).toBe(false);
    expect(m.generateAudio).toBe(false);
    expect(m.indexAlgolia).toBe(false);
    expect(m.downloadAudio).toBe(false);
    expect(m.uploadAudio).toBe(false);
    expect(m.summary).toContain("contributor");
    expect(m.summary).toContain("cache-only");
  });

  it("Google creds only → maintainer build with PDF + audio, no Algolia indexing", () => {
    const m = detectBuildMode({ GOOGLE_CREDENTIALS_BASE64: "abc" });
    expect(m.hasGoogleCreds).toBe(true);
    expect(m.fetchFromGoogleDocs).toBe(true);
    expect(m.generatePdf).toBe(true);
    expect(m.generateAudio).toBe(true);
    expect(m.indexAlgolia).toBe(false);
    expect(m.summary).toContain("maintainer");
  });

  it("Google + Algolia write → indexes Algolia", () => {
    const m = detectBuildMode({
      GOOGLE_CREDENTIALS_BASE64: "abc",
      ALGOLIA_WRITE_KEY: "xyz",
    });
    expect(m.indexAlgolia).toBe(true);
  });

  it("Algolia write without Google creds → no indexing (cache has no fresh data)", () => {
    const m = detectBuildMode({ ALGOLIA_WRITE_KEY: "xyz" });
    expect(m.indexAlgolia).toBe(false);
  });

  it("SKIP_PDF overrides PDF even with creds", () => {
    const m = detectBuildMode({
      GOOGLE_CREDENTIALS_BASE64: "abc",
      SKIP_PDF: "1",
    });
    expect(m.generatePdf).toBe(false);
    expect(m.generateAudio).toBe(true);
  });

  it("SKIP_AUDIO overrides audio even with creds", () => {
    const m = detectBuildMode({
      GOOGLE_CREDENTIALS_BASE64: "abc",
      SKIP_AUDIO: "1",
    });
    expect(m.generateAudio).toBe(false);
    expect(m.uploadAudio).toBe(false);
    expect(m.generatePdf).toBe(true);
  });

  it("R2 creds present + production build → audio download/upload enabled", () => {
    const m = detectBuildMode({
      GOOGLE_CREDENTIALS_BASE64: "abc",
      ...R2,
    });
    expect(m.hasR2Creds).toBe(true);
    expect(m.downloadAudio).toBe(true);
    expect(m.uploadAudio).toBe(true);
  });

  it("R2 creds + dev mode → no R2 audio traffic", () => {
    const m = detectBuildMode({
      GOOGLE_CREDENTIALS_BASE64: "abc",
      NODE_ENV: "development",
      ...R2,
    });
    expect(m.hasR2Creds).toBe(true);
    expect(m.downloadAudio).toBe(false);
    expect(m.uploadAudio).toBe(false);
  });

  it("partial R2 creds → hasR2Creds false", () => {
    const m = detectBuildMode({
      GOOGLE_CREDENTIALS_BASE64: "abc",
      R2_ENDPOINT: R2.R2_ENDPOINT,
      R2_ACCESS_KEY_ID: R2.R2_ACCESS_KEY_ID,
    });
    expect(m.hasR2Creds).toBe(false);
    expect(m.downloadAudio).toBe(false);
  });

  it("summary string is stable and human-readable", () => {
    const m = detectBuildMode({});
    expect(m.summary.startsWith("[atlas] BuildMode:")).toBe(true);
  });
});
