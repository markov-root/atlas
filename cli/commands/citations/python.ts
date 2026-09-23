/**
 * Hand a citation verb to the Python half of the pipeline.
 *
 * `task:0029` D3 keeps `atlas` as the single entry point, so the language
 * boundary is invisible at the command line: `atlas citations export` works the
 * same as it did when the exporter was TypeScript. This function is the seam.
 *
 * `uv run` is used rather than a bare `python` so the command works from a fresh
 * checkout with no virtualenv activated - `uv` resolves the locked dependencies
 * itself. That is the same reason `pnpm` is mandated for the Node half.
 */
import { spawnSync } from 'node:child_process';

/** Verbs owned by Python. `scan` is the one that stays in TypeScript. */
export const PYTHON_VERBS = [
  'extract',
  'report',
  'export',
  'resolve',
  'propose',
  'urls',
  'render',
] as const;

/**
 * Run `atlas_citations.cli` with the given arguments, inheriting stdio.
 *
 * stdio is inherited rather than captured so progress from a long resolve run
 * appears as it happens. Capturing it would make the command look hung.
 *
 * `-u` is not optional. Python block-buffers stdout whenever it is not a TTY,
 * so the moment anyone runs this under `tee`, into a log, or inside tmux - which
 * is exactly what a run over hundreds of URLs should be run under - inheriting
 * stdio is not enough on its own and the output arrives in one lump at the end.
 * Unbuffering costs nothing here: this process prints a line every fifty
 * entries, not a stream.
 */
export function runPython(root: string, args: string[]): number {
  const result = spawnSync('uv', ['run', 'python', '-u', '-m', 'atlas_citations.cli', ...args], {
    cwd: root,
    stdio: 'inherit',
    env: { ...process.env },
  });

  if (result.error) {
    const hint =
      (result.error as NodeJS.ErrnoException).code === 'ENOENT'
        ? 'uv is not on PATH - see CONTRIBUTING.md for the Python toolchain setup'
        : result.error.message;
    console.error(`atlas: could not run the Python citation commands: ${hint}`);
    return 1;
  }
  // A signal death has no exit code; report it as one rather than as success.
  if (result.status === null) {
    console.error(`atlas: the Python citation command was terminated by ${result.signal}`);
    return 1;
  }
  return result.status;
}
