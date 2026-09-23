"""arXiv resolver.

The two "trap" cases are the reason this file is longer than the mapping it
tests: both would otherwise put a fabricated entry into the bibliography.
"""

from __future__ import annotations

import httpx
import pytest

from atlas_citations.resolvers.arxiv import arxiv_id_from_url, arxiv_resolver
from atlas_citations.resolvers.base import Unreachable

from .helpers import make_ctx

FEED = """<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom" xmlns:arxiv="http://arxiv.org/schemas/atom">
  <entry>
    <id>http://arxiv.org/abs/1911.01547v2</id>
    <published>2019-11-05T17:44:09Z</published>
    <title>On the Measure
      of Intelligence</title>
    <summary>  To make deliberate progress, we need a definition.  </summary>
    <author><name>Francois Chollet</name></author>
    <arxiv:doi>10.1000/xyz123</arxiv:doi>
  </entry>
</feed>
"""

MULTI_AUTHOR = """<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <entry>
    <id>http://arxiv.org/abs/2203.15556v1</id>
    <published>2022-03-29T00:00:00Z</published>
    <title>Training Compute-Optimal Large Language Models</title>
    <author><name>Jordan Hoffmann</name></author>
    <author><name>Sebastian Borgeaud</name></author>
    <author><name>DeepMind</name></author>
  </entry>
</feed>
"""

# The real shape that broke the TypeScript resolver: arXiv puts
# <arxiv:affiliation> between </name> and </author>, which its regex
# `<author>\s*<name>(.*?)</name>\s*</author>` could not match - so the lazy
# quantifier ran on to a LATER </name></author> pair and swallowed hundreds of
# authors into one name. See audit:0011 F11.
AFFILIATED = """<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom" xmlns:arxiv="http://arxiv.org/schemas/atom">
  <entry>
    <id>http://arxiv.org/abs/2303.08774v1</id>
    <published>2023-03-15T00:00:00Z</published>
    <title>GPT-4 Technical Report</title>
    <author>
      <name>OpenAI</name>
      <arxiv:affiliation>Rai</arxiv:affiliation>
    </author>
    <author>
      <name>Josh Achiam</name>
      <arxiv:affiliation>Rai</arxiv:affiliation>
    </author>
    <author>
      <name>Steven Adler</name>
    </author>
  </entry>
</feed>
"""

EMPTY_FEED = """<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom"></feed>
"""

ERROR_FEED = """<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <entry>
    <id>http://arxiv.org/api/errors#incorrect_id_format</id>
    <title>Error</title>
    <published>2024-01-01T00:00:00Z</published>
    <author><name>arXiv api core</name></author>
  </entry>
</feed>
"""


def feed_ctx(body: str, status: int = 200):
    def handler(request: httpx.Request) -> httpx.Response:
        assert "export.arxiv.org" in str(request.url)
        return httpx.Response(status, text=body, headers={"content-type": "application/atom+xml"})

    return make_ctx(handler)


class TestIdExtraction:
    @pytest.mark.parametrize(
        ("url", "expected"),
        [
            ("https://arxiv.org/abs/1911.01547", "1911.01547"),
            ("https://arxiv.org/abs/cs/0101001", "cs/0101001"),
            ("https://example.org/abs/1911.01547", None),
            ("https://arxiv.org/list/cs.AI/recent", None),
        ],
    )
    def test_reads_the_id_from_a_canonical_url(self, url: str, expected: str | None) -> None:
        assert arxiv_id_from_url(url) == expected

    def test_claims_only_paper_urls(self) -> None:
        assert arxiv_resolver.claims("https://arxiv.org/abs/1911.01547")
        assert not arxiv_resolver.claims("https://example.org/paper")


class TestMapping:
    def test_maps_a_feed_to_csl(self) -> None:
        out = arxiv_resolver.resolve("https://arxiv.org/abs/1911.01547", feed_ctx(FEED))
        assert out is not None
        assert out.source == "arxiv"
        assert out.fields["title"] == "On the Measure of Intelligence"
        assert out.fields["type"] == "article"
        assert out.fields["issued"] == {"date-parts": [[2019, 11, 5]]}
        assert out.fields["DOI"] == "10.1000/xyz123"
        assert out.fields["URL"] == "https://arxiv.org/abs/1911.01547"

    def test_collapses_the_wrapping_the_feed_introduces(self) -> None:
        out = arxiv_resolver.resolve("https://arxiv.org/abs/1911.01547", feed_ctx(FEED))
        assert out is not None
        assert "\n" not in out.fields["title"]
        assert out.fields["abstract"] == "To make deliberate progress, we need a definition."

    def test_splits_personal_names_and_keeps_organisations_literal(self) -> None:
        out = arxiv_resolver.resolve("https://arxiv.org/abs/2203.15556", feed_ctx(MULTI_AUTHOR))
        assert out is not None
        assert out.fields["author"] == [
            {"given": "Jordan", "family": "Hoffmann"},
            {"given": "Sebastian", "family": "Borgeaud"},
            {"literal": "DeepMind"},
        ]


class TestAffiliations:
    """audit:0011 F11 - the defect that put 96 KB of raw XML in one author name."""

    def test_an_affiliation_between_name_and_author_does_not_swallow_the_list(self) -> None:
        out = arxiv_resolver.resolve("https://arxiv.org/abs/2303.08774", feed_ctx(AFFILIATED))
        assert out is not None
        assert out.fields["author"] == [
            {"literal": "OpenAI"},
            {"given": "Josh", "family": "Achiam"},
            {"given": "Steven", "family": "Adler"},
        ]

    def test_no_author_field_carries_markup(self) -> None:
        out = arxiv_resolver.resolve("https://arxiv.org/abs/2303.08774", feed_ctx(AFFILIATED))
        assert out is not None
        for name in out.fields["author"]:
            for value in name.values():
                assert "<" not in value, value
                assert len(value) < 100, "a name this long is a parse failure, not a name"


class TestTraps:
    """Both of these return HTTP 200. Mapping either fabricates a bibliography entry."""

    def test_an_empty_feed_declines(self) -> None:
        assert (
            arxiv_resolver.resolve("https://arxiv.org/abs/0000.00000", feed_ctx(EMPTY_FEED)) is None
        )

    def test_the_api_error_entry_is_never_mapped(self) -> None:
        out = arxiv_resolver.resolve("https://arxiv.org/abs/bogus", feed_ctx(ERROR_FEED))
        assert out is None, "an entry titled 'Error' must never reach the bibliography"


class TestFailureModes:
    """``task:0032`` AC-1 on the resolver it was found on.

    arXiv is the authority for a paper it holds, so an arXiv *outage* must not
    read as an arXiv *verdict*. ``audit:0011`` F12 is what happens when it does:
    arXiv failed briefly, Open Graph answered in its place with zero authors
    where arXiv gives 1,158, and because resolution is sticky the entry kept that
    answer permanently.
    """

    def test_a_5xx_is_unreachable_not_a_decline(self) -> None:
        out = arxiv_resolver.resolve("https://arxiv.org/abs/1911.01547", feed_ctx("", 503))
        assert out == Unreachable("unavailable")

    def test_an_unreachable_host_reports_unreachable_without_raising(self, unreachable_ctx) -> None:
        out = arxiv_resolver.resolve("https://arxiv.org/abs/1911.01547", unreachable_ctx)
        assert out == Unreachable("unavailable")

    def test_an_empty_feed_is_still_a_decline(self) -> None:
        """The distinction has to cut both ways or it is not a distinction.

        HTTP 200 with no entries is arXiv saying "no such paper" - a real answer,
        and one that should let the next resolver try.
        """
        feed = '<?xml version="1.0"?><feed xmlns="http://www.w3.org/2005/Atom"></feed>'
        assert arxiv_resolver.resolve("https://arxiv.org/abs/1911.01547", feed_ctx(feed)) is None
