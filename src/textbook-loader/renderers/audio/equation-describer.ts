import { createHash } from 'crypto';
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { GoogleGenAI } from '@google/genai';

const CACHE_DIR = join(process.cwd(), '.cache', 'equation-descriptions');

/** Manual overrides for equations where the LLM produces poor spoken descriptions. */
const MANUAL_OVERRIDES: Record<string, string> = {
  'n L_n (w^)': 'n times L sub n of w-hat',
  'lambda log n': 'lambda times log n',
};

type EquationType = 'inline' | 'display';

interface PendingEquation {
  latex: string;
  type: EquationType;
  hash: string;
  context?: string;
}

export class EquationDescriber {
  private descriptions: Map<string, string> = new Map();
  private pending: PendingEquation[] = [];
  private apiKey: string | undefined;

  constructor(apiKey: string | undefined) {
    this.apiKey = apiKey;
    mkdirSync(CACHE_DIR, { recursive: true });
  }

  hashLatex(latex: string): string {
    return createHash('sha256').update(latex).digest('hex');
  }

  private cachePath(hash: string): string {
    return join(CACHE_DIR, `${hash}.txt`);
  }

  /**
   * Queue a LaTeX expression for description. Call batchFetch() before
   * calling getDescription() to ensure all queued equations are resolved.
   */
  queue(latex: string, type: EquationType, context?: string): void {
    const hash = this.hashLatex(latex);

    // Manual overrides always win, regardless of cache
    if (MANUAL_OVERRIDES[latex]) {
      this.descriptions.set(hash, MANUAL_OVERRIDES[latex]);
      return;
    }

    if (this.descriptions.has(hash)) return;

    const cached = this.cachePath(hash);
    if (existsSync(cached)) {
      this.descriptions.set(hash, readFileSync(cached, 'utf-8').trim());
      return;
    }

    // Avoid duplicate pending entries
    if (!this.pending.some(p => p.hash === hash)) {
      this.pending.push({ latex, type, hash, context });
    }
  }

  /**
   * Fetch descriptions for all pending equations from Gemini.
   * After this resolves, getDescription() is safe to call.
   */
  async batchFetch(): Promise<void> {
    if (this.pending.length === 0) return;
    if (!this.apiKey) {
      // Without API key, leave descriptions empty (will use fallback)
      this.pending = [];
      return;
    }

    const ai = new GoogleGenAI({ apiKey: this.apiKey });

    // Process in small batches to avoid rate limits
    const BATCH_SIZE = 10;
    for (let i = 0; i < this.pending.length; i += BATCH_SIZE) {
      const batch = this.pending.slice(i, i + BATCH_SIZE);
      await Promise.all(batch.map(eq => this.fetchOne(ai, eq)));
    }

    this.pending = [];
  }

  private async fetchOne(ai: GoogleGenAI, eq: PendingEquation): Promise<void> {
    const typeInstruction = eq.type === 'inline'
      ? 'This is an inline equation; give a very concise spoken description (a few words or a short phrase).'
      : 'This is a displayed equation; give a clear spoken description suitable for audio. Be thorough but natural.';

    const contextLine = eq.context ? `\nContext: This equation appears in an AI safety textbook, in the section "${eq.context}". Use this to infer the meaning of symbols.\n` : '';

    const prompt = `Convert this LaTeX equation to a natural spoken description suitable for text-to-speech.
${contextLine}
Rules:
- Output ONLY the spoken description, nothing else. No formatting or markdown.
- Use natural English a narrator would say aloud. Avoid reading out raw symbol names like "tilde", "right arrow", "backslash", "subscript", "superscript".
- For arrows, describe the relationship (e.g. "maps to", "leads to", "implies").
- For sampling notation (~), say "is sampled from" or "is drawn from".
- For conditional expressions (|), use "given" or "given that" naturally.
- Prefer words over spelled-out notation: say "equals" not "is equal to", say "of" for function application.

${typeInstruction}

LaTeX: ${eq.latex}`;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });

      const text = response.text?.trim() ?? '';
      if (text) {
        this.descriptions.set(eq.hash, text);
        writeFileSync(this.cachePath(eq.hash), text, 'utf-8');
      }
    } catch (err) {
      console.warn(`[equation-describer] Failed to describe equation "${eq.latex}":`, err);
    }
  }

  /**
   * Get a description for a previously-queued equation.
   * Returns null if unavailable (no API key or fetch failed).
   */
  getDescription(latex: string, type: EquationType): string | null {
    if (MANUAL_OVERRIDES[latex]) return MANUAL_OVERRIDES[latex];

    const hash = this.hashLatex(latex);
    if (!this.descriptions.has(hash)) {
      const cached = this.cachePath(hash);
      if (existsSync(cached)) {
        this.descriptions.set(hash, readFileSync(cached, 'utf-8').trim());
      }
    }
    return this.descriptions.get(hash) ?? null;
  }
}
