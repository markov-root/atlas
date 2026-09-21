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

const USAGE = `atlas — AI Safety Atlas maintainer commands

  atlas docs check       verify governed documents against docs/standards/documentation.md
  atlas citations urls   write every cited source, per chapter and section, as Markdown

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

  if (group === 'citations' && sub === 'urls') {
    return citationsUrls(process.cwd(), argv[2]);
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
