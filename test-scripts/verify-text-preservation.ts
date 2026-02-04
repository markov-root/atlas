/**
 * Test script to verify that all text from raw Google Docs is preserved
 * through the transformation pipeline.
 *
 * Usage:
 *   pnpm tsx test-scripts/verify-text-preservation.ts
 *   pnpm tsx test-scripts/verify-text-preservation.ts --from-cache
 *
 * Options:
 *   --from-cache   Use cached docs only (no API calls, no credentials required)
 *   --debug        Show context around missing words
 *   --chapter=N    Only check chapter N (1-indexed)
 */

import "dotenv/config";
import { docs_v1 } from "googleapis";
import { TextbookLoader } from "../src/textbook-loader/loader";
import { TEXTBOOK_EDITIONS } from "../src/textbook-loader/data";
import { extractAllText } from "../src/textbook-loader/utils";
import { readFile } from "fs/promises";
import { join } from "path";

// ============================================================================
// CLI ARGS
// ============================================================================

const args = process.argv.slice(2);
const fromCache = args.includes("--from-cache");
const debugMode = args.includes("--debug");
const debugChapter = args.find((a) => a.startsWith("--chapter="))?.split("=")[1];

// ============================================================================
// COMPONENT TABLE METADATA KEYS
// These are table keys that become attributes, not rendered text
// ============================================================================

const COMPONENT_METADATA_KEYS = new Set([
  "type",
  "source",
  "speaker",
  "position",
  "date",
  "source-url",
  "flavor",
  "term",
  "title",
  "collapsed",
  "src",
  "still_image",
]);

// ============================================================================
// RAW TEXT EXTRACTION (from Google Docs API response)
// ============================================================================

function getTextFromStructuralElement(element: docs_v1.Schema$StructuralElement): string {
  let text = "";
  if (element.paragraph?.elements) {
    for (const el of element.paragraph.elements) {
      if (el.textRun?.content) {
        text += el.textRun.content;
      }
    }
  }
  return text;
}

function extractRawTextFromElement(
  element: docs_v1.Schema$StructuralElement,
  excludeComponentMeta: boolean
): string[] {
  const texts: string[] = [];

  if (element.paragraph?.elements) {
    for (const el of element.paragraph.elements) {
      if (el.textRun?.content) {
        const content = el.textRun.content;
        if (content !== "\n") {
          texts.push(content);
        }
      }
    }
  }

  if (element.table?.tableRows) {
    const isComponentTable =
      element.table.columns === 2 &&
      element.table.tableRows?.some((row) => {
        const firstCell = row.tableCells?.[0]?.content?.[0];
        return firstCell && getTextFromStructuralElement(firstCell).trim().toLowerCase() === "type";
      });

    if (isComponentTable && excludeComponentMeta) {
      for (const row of element.table.tableRows ?? []) {
        const [keyCell, valueCell] = row.tableCells ?? [];
        const key = keyCell?.content?.[0]
          ? getTextFromStructuralElement(keyCell.content[0]).trim().toLowerCase()
          : "";

        if (COMPONENT_METADATA_KEYS.has(key)) {
          continue;
        }

        for (const cellElement of valueCell?.content ?? []) {
          texts.push(...extractRawTextFromElement(cellElement, excludeComponentMeta));
        }
      }
    } else {
      for (const row of element.table.tableRows ?? []) {
        for (const cell of row.tableCells ?? []) {
          for (const cellElement of cell.content ?? []) {
            texts.push(...extractRawTextFromElement(cellElement, excludeComponentMeta));
          }
        }
      }
    }
  }

  return texts;
}

function extractRawText(doc: docs_v1.Schema$DocumentTab, excludeComponentMeta: boolean): string {
  const texts: string[] = [];

  for (const element of doc.body?.content ?? []) {
    texts.push(...extractRawTextFromElement(element, excludeComponentMeta));
  }

  for (const [, footnote] of Object.entries(doc.footnotes ?? {})) {
    for (const element of footnote.content ?? []) {
      texts.push(...extractRawTextFromElement(element, excludeComponentMeta));
    }
  }

  return texts.join("");
}

// ============================================================================
// TEXT NORMALIZATION (for comparison)
// ============================================================================

function normalizeText(text: string): string {
  return text
    .replace(/\s+/g, "")
    .replace(/\\\$/g, "$")
    .normalize("NFC");
}

function extractWords(text: string): Set<string> {
  const normalized = text.toLowerCase();
  const words = normalized.match(/[a-z]{3,}/gi) ?? [];
  return new Set(words);
}

// ============================================================================
// DIFF ANALYSIS
// ============================================================================

interface DiffResult {
  rawLength: number;
  transformedLength: number;
  lengthDiff: number;
  lengthDiffPercent: number;
  missingWords: string[];
  extraWords: string[];
  sampleMissing: string[];
}

function analyzeDiff(rawText: string, transformedText: string): DiffResult {
  const normalizedRaw = normalizeText(rawText);
  const normalizedTransformed = normalizeText(transformedText);

  const rawWords = extractWords(rawText);
  const transformedWords = extractWords(transformedText);

  const missingWords = [...rawWords].filter((w) => !transformedWords.has(w));
  const extraWords = [...transformedWords].filter((w) => !rawWords.has(w));

  const lengthDiff = normalizedRaw.length - normalizedTransformed.length;
  const lengthDiffPercent = (lengthDiff / normalizedRaw.length) * 100;

  return {
    rawLength: normalizedRaw.length,
    transformedLength: normalizedTransformed.length,
    lengthDiff,
    lengthDiffPercent,
    missingWords,
    extraWords,
    sampleMissing: missingWords.slice(0, 20),
  };
}

// ============================================================================
// CACHE READING (for raw doc comparison)
// ============================================================================

async function readFromCache(docId: string, tabId: string): Promise<docs_v1.Schema$DocumentTab> {
  const cachePath = join(process.cwd(), ".cache", "docs", docId, tabId);
  const content = await readFile(cachePath, "utf-8");
  return JSON.parse(content);
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  const creds = process.env.GOOGLE_CREDENTIALS_BASE64 ?? null;

  if (!creds && !fromCache) {
    console.error("Error: GOOGLE_CREDENTIALS_BASE64 not found in environment");
    console.error("Either set the env var or use --from-cache to use cached documents");
    process.exit(1);
  }

  const edition = TEXTBOOK_EDITIONS[0]; // v1 English
  const loader = new TextbookLoader(creds, edition, { cacheOnly: fromCache });

  console.log("=".repeat(80));
  console.log("TEXT PRESERVATION VERIFICATION");
  console.log(fromCache ? "(Using cached documents only)" : "(Using API with cache fallback)");
  console.log("=".repeat(80));
  console.log();

  let totalIssues = 0;
  const THRESHOLD_PERCENT = 5;

  for (let i = 0; i < edition.chapters.length; i++) {
    if (debugChapter !== undefined && debugChapter !== String(i + 1)) {
      continue;
    }

    const chapterDef = edition.chapters[i];
    console.log(`\nChapter ${i + 1} (doc: ${chapterDef.docId.slice(0, 12)}..., tab: ${chapterDef.tabId})`);
    console.log("-".repeat(60));

    try {
      // Load chapter using the loader
      const chapter = await loader.loadChapter(chapterDef);

      // Get raw doc for comparison (from cache)
      const rawDoc = await readFromCache(chapterDef.docId, chapterDef.tabId);
      const rawText = extractRawText(rawDoc, true);
      console.log(`  Raw content text: ${rawText.length.toLocaleString()} chars`);

      // Extract transformed text from all sections
      let transformedText = "";
      for (const section of chapter.sections) {
        transformedText += section.title;
        if (section.description) {
          transformedText += section.description;
        }
        transformedText += extractAllText(section.nodes);
      }
      console.log(`  Transformed text: ${transformedText.length.toLocaleString()} chars`);

      // Analyze diff
      const diff = analyzeDiff(rawText, transformedText);

      console.log(
        `  Normalized: raw=${diff.rawLength.toLocaleString()}, transformed=${diff.transformedLength.toLocaleString()}`
      );
      console.log(`  Difference: ${diff.lengthDiff} chars (${diff.lengthDiffPercent.toFixed(1)}%)`);

      if (diff.lengthDiffPercent > THRESHOLD_PERCENT) {
        console.log(
          `  ⚠️  Large difference (>${THRESHOLD_PERCENT}%) - Missing words: ${diff.sampleMissing.slice(0, 10).join(", ")}...`
        );
        totalIssues++;
      } else if (diff.missingWords.length > 50) {
        console.log(
          `  ⚠️  Many missing words (${diff.missingWords.length}): ${diff.sampleMissing.slice(0, 10).join(", ")}...`
        );
        totalIssues++;
      } else {
        console.log(`  ✓ Text preservation within acceptable range`);
      }

      // Debug mode: show context around missing words
      if (debugMode) {
        console.log("\n  === DEBUG: Missing word contexts ===");
        for (const word of diff.sampleMissing.slice(0, 5)) {
          const rawIndex = rawText.toLowerCase().indexOf(word.toLowerCase());
          if (rawIndex !== -1) {
            const start = Math.max(0, rawIndex - 30);
            const end = Math.min(rawText.length, rawIndex + word.length + 30);
            const context = rawText.slice(start, end).replace(/\n/g, "\\n");
            console.log(`  "${word}" found in raw at ${rawIndex}: ...${context}...`);
          }
        }
        console.log();
      }
    } catch (error) {
      console.log(`  ❌ Error: ${error}`);
      totalIssues++;
    }
  }

  console.log();
  console.log("=".repeat(80));
  if (totalIssues === 0) {
    console.log("✅ ALL CHAPTERS PASSED - Text preservation verified");
  } else {
    console.log(`⚠️  ISSUES FOUND: ${totalIssues} chapters with potential text loss`);
  }
  console.log("=".repeat(80));

  process.exit(totalIssues > 0 ? 1 : 0);
}

main().catch(console.error);
