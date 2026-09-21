/**
 * The single definition of what an author-year citation looks like.
 *
 * `task:0025` AC-6 requires exactly one such pattern in the codebase, or a
 * recorded reason for two. There are two *uses*, and they genuinely differ —
 * so the core is shared here and each use wraps it:
 *
 *   - The audio renderer strips citations out of narration prose, where the
 *     parentheses are present: "…is possible (Rodriguez, 2020)."
 *   - Citation extraction classifies a hyperlink's anchor text, where they are
 *     NOT: the Google Docs link covers "Rodriguez, 2020" and the surrounding
 *     parentheses belong to the paragraph, not the link.
 *
 * Same notion of a citation, two surrounding contexts. Sharing the core is what
 * stops the two drifting apart, which is the failure AC-6 is aimed at.
 */

/**
 * Author-year without surrounding parentheses, e.g. `Chollet, 2019`,
 * `Smith et al., 2020`, `Giattino et al., 2023`, `Anthropic, 2024`.
 *
 * Deliberately permissive about the author part and strict about the year: the
 * corpus shows the author side is where the messy variation lives
 * (`Burns et. al. 2023`, missing commas), while a 4-digit year with an optional
 * disambiguating letter is near-universal.
 *
 * The comma is optional because the corpus contains both `Andreas 2022` and
 * `Andreas, 2022`. Requiring it would silently drop real citations.
 */
export const AUTHOR_YEAR_CORE = String.raw`[A-Z][^,()]{0,60}?(?:et\.? al\.?)?,?\s*\d{4}[a-z]?`;

/** Matches anchor text that is *entirely* an author-year citation. */
export function isAuthorYearAnchor(text: string): boolean {
  return new RegExp(`^\\s*\\(?${AUTHOR_YEAR_CORE}\\)?[.,;]?\\s*$`).test(text);
}

/**
 * Matches parenthesised citations inside running prose.
 *
 * Used by the audio renderer to remove them from narration, and by extraction
 * to find citations in footnote text that carry no hyperlink at all.
 */
export function parentheticalCitations(): RegExp {
  return new RegExp(String.raw`\([A-Z][^)]*,\s*\d{4}[a-z]?\)`, 'g');
}

/**
 * Best-effort split of an anchor into its author and year parts.
 *
 * Returns null when no year is present. The author half is returned as an
 * unparsed literal: CSL accepts a literal name, and guessing at family/given
 * from "Giattino et al." would invent structure the source does not have.
 */
export function splitAuthorYear(text: string): { author: string; year: string } | null {
  const m = /^\s*\(?\s*(.*?)[,\s]+(\d{4})[a-z]?\)?[.,;]?\s*$/.exec(text);
  if (!m) return null;
  const author = m[1].replace(/[,\s]+$/, '').trim();
  if (!author) return null;
  return { author, year: m[2] };
}
