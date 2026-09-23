"""The Internet Archive, for citations whose page is gone. ``task:0032``."""

from __future__ import annotations

import httpx

from atlas_citations.commands.report import dead_links
from atlas_citations.resolvers import RESOLVER_ORDER
from atlas_citations.resolvers.base import Unreachable
from atlas_citations.resolvers.wayback import snapshot_for, wayback_resolver
from atlas_citations.store import entry_from_anchor

DEAD = "https://planned-obsolescence.org/the-training-game"
SNAPSHOT = (
    "https://web.archive.org/web/20210804125857/https://planned-obsolescence.org/the-training-game"
)

AVAILABLE = {
    "archived_snapshots": {
        "closest": {
            "available": True,
            "url": "http://web.archive.org/web/20210804125857/https://planned-obsolescence.org/the-training-game",
            "timestamp": "20210804125857",
            "status": "200",
        }
    }
}

ARCHIVED_PAGE = """<html><head>
<meta property="og:title" content="The training game">
<meta property="og:site_name" content="Planned Obsolescence">
</head></html>"""


def route(request: httpx.Request) -> httpx.Response:
    if "archive.org/wayback/available" in str(request.url):
        return httpx.Response(200, json=AVAILABLE)
    return httpx.Response(
        200, text=ARCHIVED_PAGE, headers={"content-type": "text/html; charset=utf-8"}
    )


class TestOrdering:
    def test_runs_after_every_live_resolver(self) -> None:
        """What makes it cheap: by the time it runs, the live page has failed."""
        assert RESOLVER_ORDER[-1] == "wayback"

    def test_never_blocks_the_chain(self) -> None:
        """Non-selective, like Open Graph — it claims every URL, so its claim is
        no evidence of authority and it gets no veto."""
        assert wayback_resolver.selective is False


class TestResolve:
    def test_maps_an_archived_page(self) -> None:
        out = wayback_resolver.resolve(DEAD, make_route_ctx())
        assert out is not None and not isinstance(out, Unreachable)
        assert out.source == "wayback"
        assert out.fields["title"] == "The training game"
        assert out.fields["container-title"] == "Planned Obsolescence"

    def test_the_entrys_url_stays_the_dead_original(self) -> None:
        """It is the entry's identity (``task:0021`` D1) and what the prose links to."""
        out = wayback_resolver.resolve(DEAD, make_route_ctx())
        assert out is not None and not isinstance(out, Unreachable)
        assert out.fields["URL"] == DEAD
        assert out.fields["archive_location"] == SNAPSHOT
        assert out.fields["archive"] == "Internet Archive"

    def test_the_snapshot_date_is_accessed_never_issued(self) -> None:
        """Conflating them would date every archived source to whenever a crawler passed."""
        out = wayback_resolver.resolve(DEAD, make_route_ctx())
        assert out is not None and not isinstance(out, Unreachable)
        assert out.fields["accessed"] == {"date-parts": [[2021, 8, 4]]}
        assert "issued" not in out.fields

    def test_says_in_the_entry_that_the_page_is_gone(self) -> None:
        out = wayback_resolver.resolve(DEAD, make_route_ctx())
        assert out is not None and not isinstance(out, Unreachable)
        assert out.note is not None and "no longer exists" in out.note

    def test_no_snapshot_declines(self) -> None:
        """Coverage is genuinely partial — 2 of 4 sampled corpus dead links had one."""
        ctx = make_ctx_json({"archived_snapshots": {}})
        assert wayback_resolver.resolve(DEAD, ctx) is None
        assert snapshot_for(DEAD, ctx) is None

    def test_an_archive_outage_is_reported_not_treated_as_no_snapshot(self) -> None:
        ctx = make_ctx_status(503)
        assert isinstance(wayback_resolver.resolve(DEAD, ctx), Unreachable)


class TestTheReportStillCallsItDead:
    def test_a_rescued_entry_remains_a_dead_link(self) -> None:
        """Finding a copy is a fact about our metadata; the address being dead is
        a fact about the citation, and only an author can act on the second."""
        entry = entry_from_anchor(DEAD, "Barnes, 2021", {"author": "Barnes", "year": "2021"})
        store = {DEAD: {**entry, "resolvedBy": "wayback"}}
        assert dead_links(store) == [DEAD]


def make_route_ctx():
    from .helpers import make_ctx

    return make_ctx(route)


def make_ctx_json(payload: object):
    from .helpers import make_ctx

    return make_ctx(lambda r: httpx.Response(200, json=payload))


def make_ctx_status(status: int):
    from .helpers import make_ctx

    return make_ctx(lambda r: httpx.Response(status))
