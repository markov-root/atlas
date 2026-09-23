# Vendored CSL styles

Citation Style Language definitions used by `atlas citations render` to produce
`data/citations/rendered.json`.

## Provenance and licence

These files are **not** part of the AI Safety Atlas. They are taken verbatim from the
[CSL styles repository](https://github.com/citation-style-language/styles) and remain the work of
their respective authors, aggregated with this repository rather than derived from it.

**Licence: [Creative Commons Attribution-ShareAlike 3.0](http://creativecommons.org/licenses/by-sa/3.0/)**,
as declared in the `<rights>` element of each file. Each style's `<author>` and `<contributor>`
metadata carries its own attribution; that metadata is preserved intact and is the attribution.

The Atlas's own licence is unaffected — these are separate works in a separate directory.

## Why vendored rather than fetched

`CONTRIBUTING.md` promises a clone builds with no credentials and no network. A build step that
fetched style definitions would break both, and would make the output depend on whatever upstream
happened to be serving that day. Zotero and Pandoc vendor for the same reasons.

## Updating

Re-download from the repository above and commit the change on its own, so the diff is reviewable as
an upstream update rather than mixed into product work. `pnpm test:py` covers the rendering, so a
style change that breaks output will fail the gate.

| File                               | Style                          |
| ---------------------------------- | ------------------------------ |
| `apa.csl`                          | APA 7th edition                |
| `chicago-author-date.csl`          | Chicago Manual of Style 18 (author-date) |
| `modern-language-association.csl`  | MLA 9th edition                |
| `nature.csl`                       | Nature                         |
| `ieee.csl`                         | IEEE                           |
