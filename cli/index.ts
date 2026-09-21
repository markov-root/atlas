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

const USAGE = `atlas — AI Safety Atlas maintainer commands

  atlas docs check     verify governed documents against docs/standards/documentation.md

Run from anywhere in the checkout: ./bin/atlas <command>
`;

export function main(argv: string[]): number {
  const [group, sub] = argv;

  if (!group || group === '--help' || group === '-h' || group === 'help') {
    console.log(USAGE);
    return 0;
  }

  if (group === 'docs' && sub === 'check') {
    return docsCheck(process.cwd());
  }

  console.error(`atlas: unknown command \`${[group, sub].filter(Boolean).join(' ')}\`\n`);
  console.error(USAGE);
  return 2;
}

process.exit(main(process.argv.slice(2)));
