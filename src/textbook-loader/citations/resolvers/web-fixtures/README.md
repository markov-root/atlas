# Web fixtures for the networked resolvers

Recorded once from the live services on 2026-09-21 (agent C, task:0027 AC-1),
then committed; the resolver tests never touch the network. Re-record with
`curl` rather than hand-editing if a service changes shape.

| File                        | Recorded with                                                                                                    |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `crossref-alphafold.json`   | `GET https://api.crossref.org/works/10.1038/s41586-021-03819-2` (Jumper et al. 2021). Bulk fields irrelevant to the mapping (`reference`, `funder`, `license`, `link`, `assertion`, indexing bookkeeping, …) were removed afterwards; the mapped fields are verbatim. |
| `oembed-3blue1brown.json`   | `GET https://www.youtube.com/oembed?url=<watch?v=aircAruvnKk>&format=json`, verbatim.                             |
| `og-alignment-forum.html`   | `GET https://www.alignmentforum.org/posts/B6CxEApaatATzown6/the-lesswrong-2022-review`, spliced (first 600 bytes + the region holding the meta tags; bulk body JS elided). Kept as recorded because it is instructive: a Next.js SSR page that renders its `og:` tags in the **body**, after `</head>`, with no `<title>` at all — a head-only reader would miss it, which is why the resolver scans the whole capped read. Has `og:title`/`og:description` but **no** `og:site_name` and **no** `article:published_time` — that gap is also part of the fixture. |
| `og-no-meta-cifar.html`     | `GET https://www.cs.toronto.edu/~kriz/cifar.html`, verbatim. Real page with zero `og:` tags; exercises the `<title>` fallback. |
| `og-full.html`              | Hand-assembled, modelled on real Substack/Alignment-Forum pages: the one minimal page that carries `og:site_name` **and** `article:published_time` so the date and container mapping is testable against a real-recorded page was not found in a small sample. |

Error paths (404, garbage body, unreachable fetch, non-HTML content type,
redirects, oversized bodies) are built by the test stubs rather than stored
here — they are one-line responses and fixture files would add noise.
