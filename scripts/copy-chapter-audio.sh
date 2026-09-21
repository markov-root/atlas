#!/usr/bin/env bash
# Stage a chapter's audio for local development.
#
# The CBR-re-encoded MP3s are large and gitignored, so a fresh clone has the
# timings but no audio and every page falls back to streaming the published
# file. That is fine for reading along, but seeking in a variable-bitrate MP3
# only lands near the word, so anything to do with click-to-seek wants the
# constant-bitrate copies this script produces.
#
# Two ways to get them, tried in this order:
#
#   1. Copy them out of the podcast pipeline's output directory, if it is
#      there. Byte-identical to what the timings were measured against.
#   2. Download the published audio and re-encode it here, which needs only
#      curl and ffmpeg. Same recording, re-encoded at the bitrate the renderer
#      publishes at, so these files can also be uploaded as-is.
#
# Route 1 gives whatever bitrate the pipeline produced, which is lower; that is
# fine locally, where only the seek precision matters, but prefer --fetch for
# anything destined for R2.
#
# It deliberately does NOT touch the committed .words.json files. A pipeline
# output directory can hold timings from a different transcription run: those
# track the same audio, but with slightly different word boundaries than the
# committed set the alignment was tuned and measured against. Refresh timings
# only on purpose, never as a side effect of staging audio.
#
# Name the sections you actually want to save the wait -- one is enough to
# compare seeking between the two sources.
#
#   copy-chapter-audio.sh 4                        every section of chapter 4
#   copy-chapter-audio.sh 4 1 2                     just sections 4.1 and 4.2
#   ATLAS_AUDIO_SRC=/path/to/output/governance ...  use a pipeline output here
#   copy-chapter-audio.sh --fetch 4                 skip it and download instead
set -euo pipefail

# Chapter number -> atlas-podcast output slug, and how many sections it has
# (kept in sync with atlas-podcast/pipeline.py's CHAPTER_META and with
# src/data/chapter-timing.ts -- a chapter only belongs here once its timings
# are committed).
declare -A CHAPTER_SLUG=(
  [1]=capabilities
  [2]=risks
  [3]=strategies
  [4]=governance
  [5]=evaluations
  [6]=specification-gaming
  [7]=goal-misgeneralization
  [8]=scalable-oversight
)
declare -A CHAPTER_SECTIONS=(
  [1]=11 [2]=10 [3]=10 [4]=9 [5]=11 [6]=6 [7]=7 [8]=7
)

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
TIMINGS="$ROOT/src/data/chapter-timing.ts"

fetch_only=false
chapter=""
wanted=()
for arg in "$@"; do
  case "$arg" in
    --fetch) fetch_only=true ;;
    ''|*[!0-9]*) echo "ERROR: unrecognised argument: $arg" >&2; exit 1 ;;
    *)
      if [ -z "$chapter" ]; then
        chapter="$arg"
        if [ -z "${CHAPTER_SLUG[$chapter]:-}" ]; then
          echo "ERROR: no timings for chapter $chapter (have: ${!CHAPTER_SLUG[*]})" >&2
          exit 1
        fi
      else
        wanted+=("$arg")
      fi
      ;;
  esac
done
if [ -z "$chapter" ]; then
  echo "Usage: $(basename "$0") [--fetch] <chapter-number> [section...]" >&2
  exit 1
fi

slug="${CHAPTER_SLUG[$chapter]}"
sections_total="${CHAPTER_SECTIONS[$chapter]}"
DEST="$ROOT/public/audio/ch${chapter}"
SRC="${ATLAS_AUDIO_SRC:-$(cd "$ROOT/.." && pwd)/atlas-podcast/output/$slug}"

for i in "${wanted[@]}"; do
  if [ "$i" -lt 1 ] || [ "$i" -gt "$sections_total" ]; then
    echo "ERROR: chapter $chapter has sections 1 to $sections_total, not $i" >&2
    exit 1
  fi
done
[ ${#wanted[@]} -eq 0 ] && wanted=($(seq 1 "$sections_total"))

need() {
  command -v "$1" >/dev/null 2>&1 || { echo "ERROR: $1 is required but not installed." >&2; exit 1; }
}

mkdir -p "$DEST"

if [ "$fetch_only" = false ] && [ -d "$SRC" ]; then
  echo "Staging chapter $chapter from the pipeline output: $SRC"
  for i in "${wanted[@]}"; do
    # Newer pipeline runs append a content hash (…_cbr.<hash>.mp3) for cache
    # busting; older ones don't. Prefer the newest match so a re-render wins,
    # and fail loudly rather than silently copying a stale file.
    mp3=$(ls -t "$SRC"/"${slug}_${chapter}-${i}"_*_cbr*.mp3 2>/dev/null | head -1 || true)
    if [ -z "$mp3" ]; then
      echo "ERROR: section $i has no CBR audio in $SRC" >&2
      echo "       Re-run with --fetch to download and encode it instead." >&2
      exit 1
    fi
    cp "$mp3" "$DEST/ch${chapter}-s${i}.mp3"
    echo "  s${i}: $(basename "$mp3")"
  done
  echo "Done. MP3s are gitignored; committed .words.json left untouched."
  exit 0
fi

need curl
need ffmpeg

echo "Downloading the published audio and re-encoding to CBR (${#wanted[@]} of $sections_total sections)."
tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT

for i in "${wanted[@]}"; do
  # The published URL for each section is pinned in the timing table; it
  # embeds the chapter and section number, so no parsing of the file's
  # structure is needed to pick the right one out.
  url=$(grep -o "https://[^']*atlas-ch${chapter}-s${i}-[^']*\.mp3" "$TIMINGS" | head -1 || true)
  if [ -z "$url" ]; then
    echo "ERROR: no published URL for chapter $chapter section $i in $TIMINGS" >&2
    exit 1
  fi
  curl -fsSL "$url" -o "$tmp/s${i}.mp3"
  # 96kbps mono, no XING header -- whose table of contents is what makes a
  # seek in the published file imprecise. The bitrate matches what the
  # renderer now publishes, so a file staged here can be uploaded as-is
  # (see scripts/swap-cbr-audio.ts) without changing the audio's quality.
  ffmpeg -v error -y -i "$tmp/s${i}.mp3" -ac 1 -b:a 96k -write_xing 0 "$DEST/ch${chapter}-s${i}.mp3"
  echo "  s${i}: $(basename "$url" | cut -c1-24)… -> ch${chapter}-s${i}.mp3"
done

echo "Done. MP3s are gitignored; committed .words.json left untouched."
