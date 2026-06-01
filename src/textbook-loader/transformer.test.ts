import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";
import { Transformer, type Node } from "./transformer";
import { TEXTBOOK_EDITIONS } from "./data";
import { getNodeText, traverseNodes } from "./utils";

function readCachedTab(docId: string, tabId: string) {
  const path = join(process.cwd(), ".cache", "docs", docId, tabId);
  return JSON.parse(readFileSync(path, "utf-8"));
}

// A condensed structural digest of a chapter — small enough for a human to
// eyeball in a snapshot diff, but specific enough to flag regressions.
function digest(rawChapter: ReturnType<Transformer["transformChapter"]>) {
  return {
    title: rawChapter.title,
    number: rawChapter.number,
    sectionCount: rawChapter.sections.length,
    sections: rawChapter.sections.map((s) => {
      const nodeNames = new Map<string, number>();
      traverseNodes(s.nodes, (n: Node) => {
        nodeNames.set(n.name, (nodeNames.get(n.name) ?? 0) + 1);
      });
      return {
        title: s.title,
        slug: s.slug,
        topLevelNodeCount: s.nodes.length,
        footnoteCount: s.footnotes.length,
        readingTimeInSeconds: s.readingTimeInSeconds,
        // Aggregate node-name counts within the section — catches the
        // "Transformer drops Heading nodes" / "Figure renamed to Image"
        // class of regression.
        nodeKinds: Object.fromEntries([...nodeNames.entries()].sort()),
      };
    }),
  };
}

describe("Transformer.transformChapter", () => {
  for (const chapter of TEXTBOOK_EDITIONS[0].chapters) {
    it(`produces a stable AST for ${chapter.docId.slice(0, 12)}…`, () => {
      const tab = readCachedTab(chapter.docId, chapter.tabId);
      const body = tab.body?.content;
      const rawChapter = new Transformer(tab, new Map(), []).transformChapter(body ?? []);

      expect(rawChapter.title).toBeTruthy();
      expect(rawChapter.sections.length).toBeGreaterThan(0);
      expect(digest(rawChapter)).toMatchSnapshot();
    });
  }

  it("first chapter exposes expected high-level shape", () => {
    const ch = TEXTBOOK_EDITIONS[0].chapters[0];
    const tab = readCachedTab(ch.docId, ch.tabId);
    const raw = new Transformer(tab, new Map(), []).transformChapter(tab.body?.content ?? []);

    // Spot-checks that don't depend on prose: every section has a title +
    // slug, every footnote has a number, no node has an undefined name.
    for (const s of raw.sections) {
      expect(s.title).toBeTypeOf("string");
      expect(s.slug).toMatch(/^[a-z0-9-]+$/);
      for (const fn of s.footnotes) {
        expect(fn.number).toBeTruthy();
      }
      traverseNodes(s.nodes, (n: Node) => {
        expect(n.name).toBeTruthy();
      });
    }
  });

  it("traverseNodes + getNodeText round-trip on the first section yields non-empty prose", () => {
    const ch = TEXTBOOK_EDITIONS[0].chapters[0];
    const tab = readCachedTab(ch.docId, ch.tabId);
    const raw = new Transformer(tab, new Map(), []).transformChapter(tab.body?.content ?? []);
    const first = raw.sections[0];

    const textNodes: Node[] = [];
    traverseNodes(first.nodes, (n: Node) => {
      if (n.name === "Span" || n.name === "Paragraph") textNodes.push(n);
    });

    expect(textNodes.length).toBeGreaterThan(0);
    const combined = textNodes.map((n) => getNodeText(n)).join("");
    expect(combined.length).toBeGreaterThan(50);
  });
});
