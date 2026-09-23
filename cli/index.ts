/**
 * `atlas` — maintainer control surface.
 *
 * Dispatch only. Every command is an importable function in cli/commands/ so it
 * can be unit-tested without going through argv; this file must stay free of
 * behaviour. See docs/tasks/0010 for the design and the commands still to come
 * (`atlas pull`, `atlas generate audio`, `atlas audio stage|publish-cbr`).
 *
 * Since `task:0029` the citation pipeline spans two languages. TypeScript walks
 * the document AST and writes `data/citations/citations.json`; Python owns the
 * resolvers, the CSL store and every export. D3 keeps `atlas` as the single
 * entry point, so that split is invisible here at the command line — the three
 * verbs that read the documents run `scan` first and then hand over.
 *
 * Contributor-facing lifecycle commands stay in package.json (`pnpm dev`,
 * `check`, `verify`) — they are referenced by the pre-push hook, CI and
 * CONTRIBUTING.md, and moving them would break all three for no gain.
 */
import { docsCheck } from './commands/docs-check.js';
import { citationsScan } from './commands/citations/scan.js';
import { PYTHON_VERBS, runPython } from './commands/citations/python.js';

const USAGE = `atlas — AI Safety Atlas maintainer commands

  atlas docs check         verify governed documents against docs/standards/documentation.md
  atlas citations scan     read citations from the cached documents into citations.json
  atlas citations extract  fold the scanned citations into the CSL store
  atlas citations report   list citations needing attention: unresolved, malformed, inconsistent
  atlas citations export   write the whole-book bibliography as BibTeX and CSL-JSON
  atlas citations resolve  fill in metadata (--limit=N, --redo=<resolver,...>)
  atlas citations urls     write every cited source, per chapter and section, as Markdown
  atlas citations render   pre-render every reference in every CSL style for the site

Run from anywhere in the checkout: ./bin/atlas <command>
`;

/**
 * Verbs that read the documents, so a fresh scan must precede them.
 *
 * `export` and `resolve` are absent deliberately: both work from the committed
 * store alone, so requiring the document cache for them would add a dependency
 * they do not have.
 */
const NEEDS_SCAN = new Set(['extract', 'report', 'urls']);

export async function main(argv: string[]): Promise<number> {
  const [group, sub] = argv;

  if (!group || group === '--help' || group === '-h' || group === 'help') {
    console.log(USAGE);
    return 0;
  }

  if (group === 'docs' && sub === 'check') {
    return docsCheck(process.cwd());
  }

  if (group === 'citations') {
    const root = process.cwd();

    if (sub === 'scan') return citationsScan(root, argv[2]);

    if (PYTHON_VERBS.includes(sub as (typeof PYTHON_VERBS)[number])) {
      if (NEEDS_SCAN.has(sub)) {
        const code = await citationsScan(root);
        if (code !== 0) return code;
      }
      // Drop the `citations` group word: the Python parser's own prog name is
      // `atlas citations`, so the verb is its first positional.
      return runPython(root, argv.slice(1));
    }
  }

  console.error(`atlas: unknown command \`${[group, sub].filter(Boolean).join(' ')}\`\n`);
  console.error(USAGE);
  return 2;
}

main(process.argv.slice(2)).then(
  (code) => process.exit(code),
  (err) => {
    console.error(`atlas: ${err instanceof Error ? err.message : String(err)}`);
    process.exit(1);
  },
);
