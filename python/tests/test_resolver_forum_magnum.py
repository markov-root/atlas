"""LessWrong, the EA Forum and the Alignment Forum. ``task:0032`` AC-4."""

from __future__ import annotations

import httpx

from atlas_citations.resolvers.base import Unreachable
from atlas_citations.resolvers.forum_magnum import (
    forum_magnum_resolver,
    post_id,
    site_for,
)

from .helpers import html_response, json_response, make_ctx

POST = {
    "data": {
        "post": {
            "result": {
                "_id": "puv8fRDCH9jx5yhbX",
                "title": "johnswentworth's Shortform",
                "pageUrl": "https://www.lesswrong.com/posts/puv8fRDCH9jx5yhbX/johnswentworth-s-shortform",
                "postedAt": "2020-02-27T19:04:55.108Z",
                "user": {"displayName": "johnswentworth"},
                "coauthors": [],
            }
        }
    }
}


class TestClaims:
    def test_claims_the_three_forum_magnum_hosts(self) -> None:
        for url in (
            "https://www.lesswrong.com/posts/puv8fRDCH9jx5yhbX/shortform",
            "https://lesswrong.com/posts/puv8fRDCH9jx5yhbX/shortform",
            "https://www.alignmentforum.org/posts/puv8fRDCH9jx5yhbX/x",
            "https://forum.effectivealtruism.org/posts/7WfMYzLfcTyDtD6Gn/pause",
        ):
            assert forum_magnum_resolver.claims(url), url

    def test_declines_an_unrelated_host(self) -> None:
        assert not forum_magnum_resolver.claims("https://example.org/posts/abcdefghijklm/x")

    def test_declines_a_forum_page_that_is_not_a_post(self) -> None:
        """A tag page or a user profile has no post record to fetch."""
        assert not forum_magnum_resolver.claims("https://www.lesswrong.com/tag/ai-alignment")

    def test_reads_the_post_id_out_of_a_sequence_url(self) -> None:
        assert post_id("https://www.lesswrong.com/s/abc/p/puv8fRDCH9jx5yhbX") == "puv8fRDCH9jx5yhbX"

    def test_a_comment_permalink_keeps_its_post_id(self) -> None:
        """The bibliography cites the post; a comment has no title of its own.

        This is the shape Open Graph could never handle - the page renders
        client-side and a plain fetch returns no title at all.
        """
        url = "https://lesswrong.com/posts/puv8fRDCH9jx5yhbX?commentId=aBcAh8H9cSzdXm"
        assert post_id(url) == "puv8fRDCH9jx5yhbX"

    def test_each_host_maps_to_its_own_endpoint_and_container(self) -> None:
        endpoint, container = site_for("https://www.alignmentforum.org/posts/abcdefghijklm/x")
        assert endpoint == "https://www.alignmentforum.org/graphql"
        assert container == "AI Alignment Forum"


class TestResolve:
    def test_maps_a_post(self) -> None:
        out = forum_magnum_resolver.resolve(
            "https://www.lesswrong.com/posts/puv8fRDCH9jx5yhbX/johnswentworth-s-shortform",
            make_ctx(lambda r: json_response(POST)),
        )
        assert out is not None and not isinstance(out, Unreachable)
        assert out.source == "forum-magnum"
        assert out.fields["title"] == "johnswentworth's Shortform"
        assert out.fields["type"] == "post-weblog"
        assert out.fields["container-title"] == "LessWrong"
        assert out.fields["issued"] == {"date-parts": [[2020, 2, 27]]}

    def test_a_display_name_stays_literal(self) -> None:
        """ "johnswentworth" has no surname to split off, and inventing one is worse."""
        out = forum_magnum_resolver.resolve(
            "https://www.lesswrong.com/posts/puv8fRDCH9jx5yhbX/x",
            make_ctx(lambda r: json_response(POST)),
        )
        assert out is not None and not isinstance(out, Unreachable)
        assert out.fields["author"] == [{"literal": "johnswentworth"}]

    def test_coauthors_are_credited(self) -> None:
        """A jointly written post credited to one submitter is a citation we broke."""
        payload = {
            "data": {
                "post": {
                    "result": {
                        "title": "Joint",
                        "postedAt": "2024-01-02T00:00:00.000Z",
                        "user": {"displayName": "Alice"},
                        "coauthors": [{"displayName": "Bob"}, {"displayName": "Alice"}],
                    }
                }
            }
        }
        out = forum_magnum_resolver.resolve(
            "https://www.lesswrong.com/posts/puv8fRDCH9jx5yhbX/x",
            make_ctx(lambda r: json_response(payload)),
        )
        assert out is not None and not isinstance(out, Unreachable)
        # Deduplicated: a submitter listed again as a coauthor is one person.
        assert out.fields["author"] == [{"literal": "Alice"}, {"literal": "Bob"}]

    def test_the_entrys_own_url_is_never_overwritten_by_pageurl(self) -> None:
        """Identity is the canonical URL (``task:0021`` D1), slug drift and all."""
        cited = "https://lesswrong.com/posts/puv8fRDCH9jx5yhbX/an-older-slug"
        out = forum_magnum_resolver.resolve(cited, make_ctx(lambda r: json_response(POST)))
        assert out is not None and not isinstance(out, Unreachable)
        assert out.fields["URL"] == cited

    def test_a_deleted_post_declines_rather_than_reporting_unreachable(self) -> None:
        """GraphQL says "no such post" with a 200 and a null result - a verdict."""
        payload = {"data": {"post": {"result": None}}}
        out = forum_magnum_resolver.resolve(
            "https://www.lesswrong.com/posts/puv8fRDCH9jx5yhbX/x",
            make_ctx(lambda r: json_response(payload)),
        )
        assert out is None

    def test_an_outage_reports_unreachable(self) -> None:
        out = forum_magnum_resolver.resolve(
            "https://www.lesswrong.com/posts/puv8fRDCH9jx5yhbX/x",
            make_ctx(lambda r: httpx.Response(503)),
        )
        assert isinstance(out, Unreachable)

    def test_an_html_error_page_declines_rather_than_crashing(self) -> None:
        out = forum_magnum_resolver.resolve(
            "https://www.lesswrong.com/posts/puv8fRDCH9jx5yhbX/x",
            make_ctx(lambda r: html_response("<html><body>nope</body></html>")),
        )
        assert out is None

    def test_the_query_is_posted_as_json(self) -> None:
        """A GET would 404; the endpoint only answers POSTed GraphQL."""
        seen: dict[str, object] = {}

        def handler(request: httpx.Request) -> httpx.Response:
            seen["method"] = request.method
            seen["url"] = str(request.url)
            return json_response(POST)

        forum_magnum_resolver.resolve(
            "https://www.lesswrong.com/posts/puv8fRDCH9jx5yhbX/x", make_ctx(handler)
        )
        assert seen["method"] == "POST"
        assert seen["url"] == "https://www.lesswrong.com/graphql"
