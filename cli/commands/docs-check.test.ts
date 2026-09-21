import { describe, it, expect } from 'vitest';
import { checkDocument, sectionBody, frontmatterKeys } from './docs-check.js';
import type { DocRule } from '../doc-rules.js';

const RULE: DocRule = {
  path: 'docs/EXAMPLE.md',
  role: 'standard',
  discriminatingTest: 'test',
  sections: [{ heading: 'Conformance', minWords: 20, must: 'say how conformance is decided' }],
  patterns: [
    { label: 'triggers', pattern: /break trigger/gi, minCount: 2, must: 'state triggers' },
  ],
};

const words = (n: number) => Array.from({ length: n }, (_, i) => `word${i}`).join(' ');

const doc = (body: string, fm = '---\nstandard:\n  version: 1\n---\n') =>
  `${fm}\n# Title\n\n${body}`;

describe('sectionBody', () => {
  it('returns the body of a matching section', () => {
    expect(sectionBody('## Scope\n\nalpha beta\n', 'Scope')).toContain('alpha beta');
  });

  it('stops at the next heading of the same level', () => {
    const body = sectionBody('## Scope\n\nalpha\n\n## Other\n\nbeta\n', 'Scope');
    expect(body).toContain('alpha');
    expect(body).not.toContain('beta');
  });

  it('includes nested deeper headings', () => {
    const body = sectionBody(
      '## Scope\n\nalpha\n\n### Detail\n\nbeta\n\n## Other\n\ngamma\n',
      'Scope',
    );
    expect(body).toContain('beta');
    expect(body).not.toContain('gamma');
  });

  it('ignores headings inside fenced code blocks', () => {
    const body = sectionBody('## Scope\n\n```\n## Other\n```\n\nalpha\n', 'Scope');
    expect(body).toContain('alpha');
  });

  it('returns null when the section is absent', () => {
    expect(sectionBody('## Other\n\nalpha\n', 'Scope')).toBeNull();
  });
});

describe('frontmatterKeys', () => {
  it('reads top-level keys only', () => {
    expect(frontmatterKeys('---\nstandard:\n  version: 1\n  id: x\n---\n')).toEqual(['standard']);
  });

  it('returns nothing when there is no frontmatter', () => {
    expect(frontmatterKeys('# Title\n')).toEqual([]);
  });
});

describe('checkDocument', () => {
  it('passes a document that declares its role and fills its sections', () => {
    const r = checkDocument(
      doc(`## Conformance\n\n${words(30)}\n\nbreak trigger one. break trigger two.`),
      RULE,
    );
    expect(r.ok).toBe(true);
  });

  it('fails when the role is not declared in frontmatter', () => {
    const r = checkDocument(
      doc(
        `## Conformance\n\n${words(30)}\n\nbreak trigger one break trigger two`,
        '---\nroadmap:\n---\n',
      ),
      RULE,
    );
    expect(r.ok).toBe(false);
    expect(r.checks.find((c) => c.label.startsWith('role:'))?.ok).toBe(false);
  });

  it('fails when a required section is missing', () => {
    const r = checkDocument(doc('## Something else\n\nalpha'), RULE);
    expect(r.checks.find((c) => c.label === 'Conformance')?.detail).toBe('section missing');
  });

  // The regression this whole command exists to prevent: an earlier session added
  // the headings a standard names, filled them with almost nothing, and reported
  // the standard adopted because a validator went green.
  it('fails a section that exists but is too thin to be substantive', () => {
    const r = checkDocument(
      doc(`## Conformance\n\nTBD.\n\nbreak trigger one break trigger two`),
      RULE,
    );
    const check = r.checks.find((c) => c.label === 'Conformance');
    expect(check?.ok).toBe(false);
    expect(check?.detail).toMatch(/needs 20/);
    expect(check?.must).toBe('say how conformance is decided');
  });

  it('does not let a fenced code block satisfy a prose word floor', () => {
    const r = checkDocument(
      doc(`## Conformance\n\n\`\`\`\n${words(60)}\n\`\`\`\n\nbreak trigger one break trigger two`),
      RULE,
    );
    expect(r.checks.find((c) => c.label === 'Conformance')?.ok).toBe(false);
  });

  it('fails when a required pattern appears too few times', () => {
    const r = checkDocument(doc(`## Conformance\n\n${words(30)}\n\nbreak trigger only once`), RULE);
    const check = r.checks.find((c) => c.label === 'triggers');
    expect(check?.ok).toBe(false);
    expect(check?.detail).toBe('1 found, needs 2');
  });

  it('reports every failure, not just the first', () => {
    const r = checkDocument(doc('## Nothing\n\nx', '---\n---\n'), RULE);
    expect(r.checks.filter((c) => !c.ok).length).toBe(3);
  });
});
