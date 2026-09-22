/**
 * `atlas` — maintainer control surface.
 *
 * Dispatch only. Every command is an importable function in cli/commands/ so it
 * can be unit-tested without going through argv; this file must stay free of
 * behaviour. See docs/tasks/0010 for the design and the commands still to come
 * (`atlas pull`, `atlas generate audio`, `atlas audio stage|publish-cbr`).
 *
 * Contributor-facing lifecycle commands stay in package.json (`pnpm dev`,
 * `check`, `verify`) — they are referenced by the pre-push hook, CI and
 * CONTRIBUTING.md, and moving them would break all three for no gain.
 */
import { docsCheck } from './commands/docs-check.js';
import { citationsUrls } from './commands/citations/index.js';
import { citationsExtract } from './commands/citations/extract-cmd.js';
import { citationsReport } from './commands/citations/report.js';
import { citationsExport } from './commands/citations/export.js';
import { citationsResolve } from './commands/citations/resolve.js';

const USAGE = `atlas — AI Safety Atlas maintainer commands

  atlas docs check         verify governed documents against docs/standards/documentation.md
  atlas citations extract  read citations from the cached documents into the CSL store
  atlas citations report   list citations needing attention: unresolved, malformed, inconsistent
  atlas citations export   write the whole-book bibliography as BibTeX and CSL-JSON
  atlas citations resolve  fill in metadata (--limit=N, --redo=<resolver,...>)
  atlas citations urls     write every cited source, per chapter and section, as Markdown

Run from anywhere in the checkout: ./bin/atlas <command>
`;

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
    if (sub === 'extract') return citationsExtract(process.cwd());
    if (sub === 'report') return citationsReport(process.cwd(), argv[2]);
    if (sub === 'export') return citationsExport(process.cwd(), argv[2]);
    if (sub === 'resolve') {
      const limitArg = argv.find((a) => a.startsWith('--limit='));
      const redoArg = argv.find((a) => a.startsWith('--redo='));
      return citationsResolve(process.cwd(), {
        limit: limitArg ? Number(limitArg.split('=')[1]) : undefined,
        redo: redoArg ? redoArg.split('=')[1].split(',').filter(Boolean) : undefined,
      });
    }
    if (sub === 'urls') return citationsUrls(process.cwd(), argv[2]);
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
