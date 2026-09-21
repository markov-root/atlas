/**
 * Which audio file a section page plays, and whether it can be read along.
 *
 * Chapters with word-level timings (`src/data/chapter-timing.ts`) ship them
 * next to CBR re-encoded MP3s. Those MP3s are gitignored -- large and
 * reproducible -- so whether they are present depends on who is building.
 * Two sources can therefore serve the same narration:
 *
 * - `cbr`: staged locally by `scripts/copy-chapter-audio.sh`. Constant
 *   bitrate makes a seek land exactly where the timings say, which is what
 *   clicking a word to jump there needs, so this one is preferred.
 * - `cdn`: the published file. A build with credentials resolves it into
 *   `section.audioLink`; for chapters with timings it is also pinned in the
 *   timing table, so a clone without credentials can still play the
 *   narration those timings were measured against. Same recording, so the
 *   read-along works either way; only seeking is coarser, because the
 *   published file is variable bitrate and browsers interpolate the seek
 *   position.
 *
 * With neither, the section has no audio and the page renders no player at
 * all, which is what a contributor build without credentials already does for
 * every other section. A player that loads a 404 is worse than no player.
 *
 * The published URL is hashed on the section *text*, so a TTS re-render
 * serves different audio from the same URL. The committed timings have to be
 * regenerated with it -- `pipeline.py --check-remote` in `atlas-podcast`
 * detects that the upstream audio moved.
 */

import { existsSync } from "node:fs"
import { join } from "node:path"
import chapterTimings from "@/data/chapter-timing"

export type AudioSource = "cbr" | "cdn"

/** What a dev-only override can ask for: one source, or no audio at all. */
export type AudioSourceOverride = AudioSource | "none"

export interface SectionAudio {
  /** What the player loads. */
  audioUrl: string
  /** Word timings driving the read-along, or null when there are none. */
  wordsUrl: string | null
  /** Which of the two sources this came from. */
  source: AudioSource
}

export interface ResolveOptions {
  /**
   * Force a source rather than taking the best available one. The dev-only
   * switch on the section page uses this to exercise each state -- including
   * "none", which is how the no-player path gets checked without deleting
   * files.
   */
  override?: AudioSourceOverride | null
  /** Injectable so the decision can be tested without a filesystem. */
  staged?: (publicUrl: string) => boolean
}

/** Is a `/public`-relative URL backed by a file this build will serve? */
function isStaged(publicUrl: string): boolean {
  return existsSync(join(process.cwd(), "public", publicUrl))
}

/** Read an override off a query string, ignoring anything unrecognised. */
export function parseAudioSourceOverride(raw: string | null): AudioSourceOverride | null {
  return raw === "cbr" || raw === "cdn" || raw === "none" ? raw : null
}

export function resolveSectionAudio(
  chapterNumber: number,
  sectionNumber: number,
  publishedAudioUrl: string | undefined,
  { override = null, staged = isStaged }: ResolveOptions = {},
): SectionAudio | null {
  if (override === "none") return null

  const timing = chapterTimings[chapterNumber]?.[sectionNumber]

  if (timing && staged(timing.audioUrl) && override !== "cdn") {
    return { audioUrl: timing.audioUrl, wordsUrl: timing.wordsUrl, source: "cbr" }
  }

  // The build's own link first: it tracks whatever is published today, where
  // the pinned URL is only as fresh as the timings beside it.
  const published = publishedAudioUrl ?? timing?.publishedUrl
  if (!published || override === "cbr") return null
  return { audioUrl: published, wordsUrl: timing?.wordsUrl ?? null, source: "cdn" }
}

/**
 * Which sources this build could serve, so the dev switch can say which of
 * its options would actually do something.
 */
export function availableAudioSources(
  chapterNumber: number,
  sectionNumber: number,
  publishedAudioUrl: string | undefined,
  { staged = isStaged }: Pick<ResolveOptions, "staged"> = {},
): Record<AudioSource, boolean> {
  const timing = chapterTimings[chapterNumber]?.[sectionNumber]
  return {
    cbr: !!timing && staged(timing.audioUrl),
    cdn: !!(publishedAudioUrl ?? timing?.publishedUrl),
  }
}
