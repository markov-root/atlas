"""Store semantics, and the port's central safety property.

``task:0029`` AC-4 and D4: the 789 already-resolved entries must survive the move
to Python without re-resolution. Proof is semantic equality entry by entry
against the real committed store, not against a fixture — a fixture tidier than
the real data tests the fixture, which is exactly how a span-joining bug reached
production earlier in this work.
"""

from __future__ import annotations

import pytest

from atlas_citations.store import (
    entry_from_anchor,
    fill_container_titles,
    infer_container_title,
    infer_csl_type,
    literal_name,
    merge_entry,
    parse_store,
    serialize_store,
    to_csl_json,
    upsert_entries,
    year_to_csl_date,
)

STORE_FILE = "data/citations/sources.yaml"


def anchor(key: str, text: str, parsed: dict[str, str] | None) -> dict:
    return entry_from_anchor(key, text, parsed)


class TestInferCslType:
    @pytest.mark.parametrize(
        ("url", "expected"),
        [
            ("https://arxiv.org/abs/1911.01547", "article"),
            ("https://doi.org/10.1038/nature09659", "article-journal"),
            ("https://www.youtube.com/watch?v=abc", "motion_picture"),
            ("https://youtu.be/abc", "motion_picture"),
            ("https://lesswrong.com/posts/x", "post-weblog"),
            ("https://alignmentforum.org/posts/x", "post-weblog"),
            ("https://someone.substack.com/p/x", "post-weblog"),
            ("https://deepmind.google/blog/x", "webpage"),
        ],
    )
    def test_maps_known_hosts(self, url: str, expected: str) -> None:
        assert infer_csl_type(url) == expected

    def test_unparseable_url_is_a_document(self) -> None:
        assert infer_csl_type("not a url") == "document"


class TestEntryFromAnchor:
    def test_parsed_anchor_yields_author_year_and_a_note(self) -> None:
        entry = anchor("https://a.org/x", "Chollet, 2019", {"author": "Chollet", "year": "2019"})
        assert entry["item"]["author"] == [literal_name("Chollet")]
        assert entry["item"]["issued"] == year_to_csl_date("2019")
        assert entry["item"]["title"] == "Chollet, 2019"
        assert "Unresolved" in entry["item"]["note"]
        assert entry["resolvedBy"] == "anchor"

    def test_identity_is_the_url(self) -> None:
        entry = anchor("https://a.org/x", "Chollet, 2019", None)
        assert entry["item"]["id"] == "https://a.org/x"
        assert entry["item"]["URL"] == "https://a.org/x"

    def test_unparsed_anchor_still_produces_an_entry(self) -> None:
        entry = anchor("https://a.org/x", "available here", None)
        assert entry["item"]["title"] == "available here"
        assert "no author-year" in entry["item"]["note"]

    def test_empty_anchor_falls_back_to_the_url(self) -> None:
        entry = anchor("https://a.org/x", "", None)
        assert entry["item"]["title"] == "https://a.org/x"
        assert entry["anchors"] == []


class TestMergeEntry:
    def test_resolved_metadata_is_never_clobbered_by_re_extraction(self) -> None:
        existing = {
            "item": {"id": "u", "type": "article", "title": "The Real Title"},
            "resolvedBy": "arxiv",
            "anchors": ["Chollet, 2019"],
        }
        incoming = anchor("u", "Chollet, 2019", {"author": "Chollet", "year": "2019"})
        merged = merge_entry(existing, incoming)
        assert merged["item"]["title"] == "The Real Title"
        assert merged["resolvedBy"] == "arxiv"

    def test_anchor_list_grows_and_stays_sorted(self) -> None:
        existing = anchor("u", "B, 2020", None)
        incoming = anchor("u", "A, 2020", None)
        assert merge_entry(existing, incoming)["anchors"] == ["A, 2020", "B, 2020"]

    def test_an_unresolved_entry_is_replaced(self) -> None:
        existing = anchor("u", "old", None)
        incoming = anchor("u", "new", None)
        assert merge_entry(existing, incoming)["item"]["title"] == "new"


class TestUpsertEntries:
    def test_same_url_twice_collapses_to_one_entry(self) -> None:
        store = upsert_entries(
            {},
            [
                ("u", anchor("u", "A, 2020", None)),
                ("u", anchor("u", "A., 2020", None)),
            ],
        )
        assert list(store) == ["u"]
        assert store["u"]["anchors"] == ["A, 2020", "A., 2020"]


class TestSerialization:
    def test_keys_are_sorted_so_diffs_stay_reviewable(self) -> None:
        store = {
            "https://z.org/a": anchor("https://z.org/a", "Z, 2020", None),
            "https://a.org/a": anchor("https://a.org/a", "A, 2020", None),
        }
        text = serialize_store(store)
        assert text.index("https://a.org/a") < text.index("https://z.org/a")

    def test_serialization_is_clock_free_and_idempotent(self) -> None:
        store = {"u": anchor("u", "A, 2020", None)}
        assert serialize_store(store) == serialize_store(store)

    def test_round_trip_preserves_the_store(self) -> None:
        store = {"u": anchor("u", "A, 2020", {"author": "A", "year": "2020"})}
        assert parse_store(serialize_store(store)) == store

    def test_comment_only_file_parses_as_empty(self) -> None:
        assert parse_store("# just a header\n") == {}

    def test_empty_file_parses_as_empty(self) -> None:
        assert parse_store("") == {}

    def test_csl_json_is_the_items_in_key_order(self) -> None:
        store = {
            "b": anchor("b", "B, 2020", None),
            "a": anchor("a", "A, 2020", None),
        }
        assert [item["id"] for item in to_csl_json(store)] == ["a", "b"]


class TestCommittedCorpus:
    """``task:0029`` AC-4 — the resolved work survives the port.

    These run against the real ``data/citations/sources.yaml``. If it is ever
    absent the tests skip rather than silently passing on an empty store.
    """

    # Session-scoped: parsing 1.4 MB of YAML takes seconds, and every test here
    # reads the same immutable snapshot.
    @pytest.fixture(scope="session")
    def store(self, repo_root):
        path = repo_root / STORE_FILE
        if not path.exists():
            pytest.skip(f"{STORE_FILE} not present")
        return parse_store(path.read_text(encoding="utf-8"))

    @pytest.fixture(scope="session")
    def round_tripped(self, store):
        return parse_store(serialize_store(store))

    def test_the_committed_store_parses(self, store) -> None:
        assert len(store) > 900, "the committed corpus should hold ~948 sources"

    def test_every_entry_survives_a_round_trip_unchanged(self, store, round_tripped) -> None:
        """AC-4: semantic equality, entry by entry.

        A whole-dict comparison would report one failure for any number of
        broken entries; comparing per key names which source regressed.
        """
        assert set(round_tripped) == set(store)
        changed = [key for key in store if store[key] != round_tripped[key]]
        assert changed == [], f"{len(changed)} entries changed across a round trip"

    def test_resolved_entries_are_not_reverted_to_anchors(self, store, round_tripped) -> None:
        resolved = {k: v for k, v in store.items() if v.get("resolvedBy") != "anchor"}
        assert len(resolved) > 700, "the corpus holds ~789 resolved entries"
        assert all(round_tripped[k]["resolvedBy"] == v["resolvedBy"] for k, v in resolved.items())

    def test_every_entry_is_keyed_by_its_own_id(self, store) -> None:
        mismatched = [k for k, v in store.items() if v["item"]["id"] != k]
        assert mismatched == [], "entry identity is the canonical URL (task:0021 D1)"


class TestContainerTitleFromTheUrl:
    """``task:0032`` AC-7 / D5 — state a container, never invent one."""

    def test_names_the_platforms_whose_proper_name_differs_from_their_domain(self) -> None:
        assert infer_container_title("https://arxiv.org/abs/1911.01547") == "arXiv"
        assert infer_container_title("https://www.youtube.com/watch?v=abc") == "YouTube"
        assert infer_container_title("https://lesswrong.com/posts/x") == "LessWrong"
        assert (
            infer_container_title("https://www.alignmentforum.org/posts/x") == "AI Alignment Forum"
        )

    def test_declines_everything_else_rather_than_prettifying_a_domain(self) -> None:
        """D5: the facet falls back to the domain, which is true and needs no table."""
        assert infer_container_title("https://openai.com/index/x") is None
        assert infer_container_title("https://some-blog.example/post") is None
        assert infer_container_title("not a url") is None

    def test_backfills_without_a_single_request(self) -> None:
        """--redo=arxiv would re-fetch 300+ records from a public API for a constant."""
        store = {
            "https://arxiv.org/abs/1": {
                "item": {"id": "https://arxiv.org/abs/1", "URL": "https://arxiv.org/abs/1"},
                "resolvedBy": "arxiv",
            }
        }
        out, filled = fill_container_titles(store)
        assert filled == 1
        assert out["https://arxiv.org/abs/1"]["item"]["container-title"] == "arXiv"

    def test_never_overwrites_a_container_a_resolver_read_off_the_source(self) -> None:
        store = {
            "https://arxiv.org/abs/1": {
                "item": {
                    "id": "https://arxiv.org/abs/1",
                    "URL": "https://arxiv.org/abs/1",
                    "container-title": "Nature",
                },
                "resolvedBy": "crossref",
            }
        }
        out, filled = fill_container_titles(store)
        assert filled == 0
        assert out["https://arxiv.org/abs/1"]["item"]["container-title"] == "Nature"


class TestTheAttemptRecordSurvivesReExtraction:
    """``task:0032`` AC-6. ``extract`` runs immediately before ``report``, so an
    ``unreachable`` marker it wipes is one the report can never show."""

    def entry(self, **extra):
        base = entry_from_anchor("https://x/y", "A, 2024", {"author": "A", "year": "2024"})
        return {**base, **extra}

    def test_a_dead_link_stays_marked_dead_across_an_extract(self) -> None:
        merged = merge_entry(self.entry(unreachable="gone"), self.entry())
        assert merged["unreachable"] == "gone"

    def test_the_anchor_text_is_still_re_derived(self) -> None:
        """The prose can be edited; the address's HTTP status cannot be, by editing prose."""
        incoming = entry_from_anchor("https://x/y", "B, 2025", {"author": "B", "year": "2025"})
        merged = merge_entry(self.entry(unreachable="refused"), incoming)
        assert merged["item"]["title"] == "B, 2025"
        assert merged["unreachable"] == "refused"

    def test_a_resolved_entry_is_untouched_as_before(self) -> None:
        resolved = {**self.entry(), "resolvedBy": "arxiv", "item": {"title": "Real"}}
        assert merge_entry(resolved, self.entry())["item"]["title"] == "Real"
