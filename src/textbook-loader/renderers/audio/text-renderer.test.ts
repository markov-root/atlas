import { describe, it, expect } from 'vitest';
import { TextRenderer } from './text-renderer';
import type { EquationDescriber } from './equation-describer';
import type { Node } from '../../transformer';

// Stub describer: lets us decouple tests from the real equation-describer's
// filesystem cache and API calls. Returning null mimics "no description
// available" (no API key / cache miss).
class StubDescriber {
  private map = new Map<string, string>();
  preset(latex: string, description: string) {
    this.map.set(latex, description);
  }
  getDescription(latex: string): string | null {
    return this.map.get(latex) ?? null;
  }
}

function makeRenderer(stub?: StubDescriber) {
  const describer = (stub ?? new StubDescriber()) as unknown as EquationDescriber;
  return new TextRenderer(describer);
}

function node(name: string, attributes: Record<string, unknown> = {}, children: Node[] = []): Node {
  return { name, attributes, children };
}
const span = (content: string) => node('Span', { content });
const paragraph = (...children: Node[]) => node('Paragraph', {}, children);

// Citations like "(Smith, 2023)" are visible noise when spoken aloud — a
// narrator reading "(Smith comma 2023)" pulls listeners out of the prose.
// The audio pipeline strips them before TTS. If these tests fail, generated
// audio for any chapter that cites academic sources (most of them) will
// either re-introduce the noise or, worse, drop legitimate parenthetical
// prose. Both manifest as a listener-facing quality regression.
describe('TextRenderer — citation stripping for spoken text', () => {
  it('strips single-author citations like "(Smith, 2023)"', () => {
    const r = makeRenderer();
    const out = r.renderNodes([
      paragraph(span('Some claim (Smith, 2023) follows from prior work.')),
    ]);
    expect(out[0]).toContain('Some claim');
    expect(out[0]).toContain('follows from prior work');
    expect(out[0]).not.toContain('Smith');
    expect(out[0]).not.toContain('2023');
  });

  it('strips multi-author citations like "(Smith et al., 2020)"', () => {
    const r = makeRenderer();
    const out = r.renderNodes([paragraph(span('As shown (Smith et al., 2020), this matters.'))]);
    expect(out[0]).toContain('As shown');
    expect(out[0]).not.toContain('Smith');
    expect(out[0]).not.toContain('2020');
  });

  it('drops paragraphs that become empty after citation stripping', () => {
    // A paragraph containing nothing but a citation should not produce a
    // standalone silent gap in the audio — the entry is omitted entirely.
    const r = makeRenderer();
    const out = r.renderNodes([paragraph(span('(Smith, 2020)'))]);
    expect(out).toEqual([]);
  });
});

// Footnotes and links carry visible meaning on the page but break TTS flow
// if spoken literally ("footnote one", "https colon slash slash..."). The
// audio pipeline contracts: footnotes are skipped entirely, links speak
// only their visible text, glossary terms speak their matched text. If
// these contracts break, audio listeners hear either URL/footnote noise or
// dropped sentence fragments.
describe('TextRenderer — inline link / glossary / footnote handling for spoken text', () => {
  it('speaks Link visible text only (not the URL)', () => {
    const r = makeRenderer();
    const out = r.renderNodes([
      paragraph(span('see '), node('Link', { content: 'this paper', href: 'https://x' })),
    ]);
    expect(out[0]).toBe('see this paper');
  });

  it('speaks GlossaryDefinition as its matched text', () => {
    const r = makeRenderer();
    const out = r.renderNodes([
      paragraph(
        span('the '),
        node('GlossaryDefinition', { matchedText: 'alignment', term: 'AI alignment' }),
        span(' problem'),
      ),
    ]);
    expect(out[0]).toBe('the alignment problem');
  });

  it('skips Footnote nodes (they break sentence flow when read aloud)', () => {
    const r = makeRenderer();
    const out = r.renderNodes([
      paragraph(span('before'), node('Footnote', { number: '1' }), span(' after')),
    ]);
    expect(out[0]).toBe('before after');
  });
});

// Equations are the highest-stakes element of audio rendering: LaTeX read
// aloud as raw symbols ("backslash sum sub i") is unlistenable. The
// pipeline depends on the EquationDescriber producing a spoken version,
// with a clear fallback string when one is not available. If these
// contracts break, listeners hear either garbled symbol-by-symbol LaTeX or
// silence where an equation should be.
describe('TextRenderer — equation handling and describer integration', () => {
  it("uses the describer's description for inline equations when available", () => {
    const stub = new StubDescriber();
    stub.preset('x^2', 'x squared');
    const r = makeRenderer(stub);
    const out = r.renderNodes([
      paragraph(span('formula '), node('InlineEquation', { content: 'x^2' })),
    ]);
    expect(out[0]).toBe('formula x squared');
  });

  it('falls back to a readable phrase when the describer returns null for an inline equation', () => {
    // When no description is cached and no API key is configured, listeners
    // should still hear something coherent rather than silence.
    const r = makeRenderer();
    const out = r.renderNodes([
      paragraph(span('formula '), node('InlineEquation', { content: 'x^2' })),
    ]);
    expect(out[0]).toMatch(/formula .+x\^2/);
  });

  it('falls back for top-level DisplayEquation with its own announce-the-equation prefix', () => {
    const r = makeRenderer();
    const out = r.renderNodes([node('DisplayEquation', { content: 'a+b=c' })]);
    expect(out[0]).toMatch(/equation.*a\+b=c/i);
  });

  it('uses the describer for top-level DisplayEquation when available', () => {
    const stub = new StubDescriber();
    stub.preset('E=mc^2', 'Energy equals mass times c squared.');
    const r = makeRenderer(stub);
    const out = r.renderNodes([node('DisplayEquation', { content: 'E=mc^2' })]);
    expect(out[0]).toBe('Energy equals mass times c squared.');
  });

  it('collectEquations gathers every inline and display equation in document order', () => {
    // The audio pipeline pre-batches all equations to the describer before
    // rendering, so misses here cause silent listener-facing fallbacks
    // throughout the chapter instead of high-quality descriptions.
    const r = makeRenderer();
    const eqs = r.collectEquations([
      paragraph(span('hi '), node('InlineEquation', { content: 'a' })),
      node('DisplayEquation', { content: 'b' }),
      paragraph(node('InlineEquation', { content: 'c' })),
    ]);
    expect(eqs).toEqual([
      { latex: 'a', type: 'inline' },
      { latex: 'b', type: 'display' },
      { latex: 'c', type: 'inline' },
    ]);
  });
});
