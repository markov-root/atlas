/**
 * Aligns the spoken narration to the words printed on the page.
 *
 * These two streams deliberately diverge. The narration script inserts
 * content that exists only in audio, for listeners who cannot see the page:
 * figure announcements ("The textbook includes Figure 1.2 here. It depicts
 * ..."), note-box skip-overs ("The textbook has a supplementary note titled
 * ..., which we'll skip over here"), and a section preamble naming the
 * chapter and section. Section 1.2 alone announces 22 figures.
 *
 * A sequential mapping (writtenIndex = spokenIndex - preambleOffset) cannot
 * survive that: each announcement shifts it by roughly nine words and the
 * error is permanent, so the highlight falls progressively further behind
 * and eventually runs off the end of the text.
 *
 * This aligner instead walks both streams together and, whenever they stop
 * agreeing, looks ahead for the nearest place where several words agree
 * again. Words with no counterpart are still given a sensible position, so
 * the highlight parks in place during an announcement rather than drifting.
 */

export type AlignResult = {
  /**
   * For each spoken word, the index of the written word to highlight, or -1
   * to highlight nothing (the preamble, before the prose starts).
   */
  spokenToWritten: Int32Array
  /**
   * For each written word, the index of the spoken word to seek to when a
   * reader clicks it. Never -1 once any word has matched, so every visible
   * word remains clickable.
   */
  writtenToSpoken: Int32Array
  /** How many spoken words matched a written word directly. */
  matched: number
}

/** Consecutive agreeing words required to trust a resync point. */
const ANCHOR_LEN = 3
/** How far ahead to look for that agreement, in each stream. */
const SPOKEN_WINDOW = 250
const WRITTEN_WINDOW = 150

/**
 * Reduce a token to its comparable core: case, accents and punctuation all
 * vary between what the transcriber heard and what the page prints.
 *
 * Stripping punctuation also normalises hyphenated compounds, so
 * "general-purpose" and "general purpose" reduce to comparable forms.
 * Punctuation-only tokens reduce to the empty string and are skipped.
 */
export function normalizeToken(raw: string): string {
  return raw.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]/g, "")
}

/**
 * Try to match one spoken token against one written token, allowing for a
 * compound word that one stream split and the other joined.
 *
 * Transcription is inconsistent about these: "Game-playing" may come back as
 * two tokens while "general-purpose" comes back as one. Returns how many
 * tokens each side consumed, or null if they do not agree.
 */
function matchAt(
  spoken: string[],
  si: number,
  written: string[],
  wi: number,
): [number, number] | null {
  const s = spoken[si]
  const w = written[wi]
  if (!s || !w) return null
  if (s === w) return [1, 1]
  // Spoken split the compound, the page joined it.
  if (si + 1 < spoken.length && s + spoken[si + 1] === w) return [2, 1]
  // The page split the compound, spoken joined it.
  if (wi + 1 < written.length && s === w + written[wi + 1]) return [1, 2]
  return null
}

/** Advance past written tokens that carry no letters or digits. */
function nextWritten(written: string[], wi: number): number {
  let w = wi
  while (w < written.length && !written[w]) w++
  return w
}

/**
 * Do ANCHOR_LEN consecutive words agree starting here?
 *
 * Near the end of either stream there may not be ANCHOR_LEN words left. A
 * short run of agreement is accepted there, because running out of text is
 * not evidence of disagreement -- without this, a mismatch in the last few
 * words strands the highlight for the rest of the section.
 */
function isAnchor(spoken: string[], si: number, written: string[], wi: number): boolean {
  let s = si
  let w = wi
  let agreed = 0
  while (agreed < ANCHOR_LEN) {
    w = nextWritten(written, w)
    if (s >= spoken.length || w >= written.length) break
    const m = matchAt(spoken, s, written, w)
    if (!m) return false
    s += m[0]
    w += m[1]
    agreed++
  }
  return agreed > 0
}

/**
 * Find the nearest point at or after (si, wi) where the streams agree again.
 *
 * Searched in order of total distance skipped, so a resync that drops three
 * spoken words is preferred over one that drops thirty — the highlight
 * should rejoin the text at the first honest opportunity.
 */
function findResync(
  spoken: string[],
  si: number,
  written: string[],
  wi: number,
): [number, number] | null {
  const maxTotal = SPOKEN_WINDOW + WRITTEN_WINDOW
  for (let total = 1; total <= maxTotal; total++) {
    const minDs = Math.max(0, total - WRITTEN_WINDOW)
    const maxDs = Math.min(total, SPOKEN_WINDOW)
    for (let ds = minDs; ds <= maxDs; ds++) {
      const dw = total - ds
      const s = si + ds
      const w = wi + dw
      if (s >= spoken.length || w >= written.length) continue
      if (isAnchor(spoken, s, written, w)) return [s, w]
    }
  }
  return null
}

/**
 * Map the spoken stream onto the written stream.
 *
 * Both inputs are raw tokens; normalisation happens here so callers can pass
 * transcript words and on-page text without preprocessing.
 */
export function alignWords(spokenRaw: string[], writtenRaw: string[]): AlignResult {
  const spoken = spokenRaw.map(normalizeToken)
  const written = writtenRaw.map(normalizeToken)

  const spokenToWritten = new Int32Array(spoken.length).fill(-1)
  const writtenToSpoken = new Int32Array(written.length).fill(-1)
  let matched = 0

  let si = 0
  let wi = 0
  // Where the highlight rests while the narration is saying something that
  // is not on the page. -1 until the prose starts, so the preamble
  // highlights nothing at all.
  let lastWritten = -1

  while (si < spoken.length && wi < written.length) {
    if (!spoken[si]) {
      spokenToWritten[si] = lastWritten
      si++
      continue
    }
    const w = nextWritten(written, wi)
    if (w >= written.length) break
    wi = w

    const m = matchAt(spoken, si, written, wi)
    if (m) {
      const [ds, dw] = m
      for (let k = 0; k < ds; k++) spokenToWritten[si + k] = wi
      for (let k = 0; k < dw; k++) writtenToSpoken[wi + k] = si
      lastWritten = wi
      matched += ds
      si += ds
      wi += dw
      continue
    }

    const resync = findResync(spoken, si, written, wi)
    if (!resync) {
      // Nothing agrees within the search window. Treat this spoken word as
      // narration-only and park the highlight; the streams may agree again
      // further on.
      spokenToWritten[si] = lastWritten
      si++
      continue
    }

    const [nextSi, nextWi] = resync
    // Narration with no counterpart on the page: hold the highlight still
    // rather than sliding it through unrelated text.
    for (let k = si; k < nextSi; k++) spokenToWritten[k] = lastWritten
    si = nextSi
    wi = nextWi
  }

  // Any spoken words past the end of the text (a closing announcement) keep
  // the highlight where it last legitimately was.
  for (let k = si; k < spoken.length; k++) spokenToWritten[k] = lastWritten

  fillWrittenGaps(writtenToSpoken)

  return { spokenToWritten, writtenToSpoken, matched }
}

/**
 * Give every written word a seek target by borrowing from its nearest
 * matched neighbour.
 *
 * Words skipped during alignment are still on screen and still clickable, so
 * leaving them at -1 would make clicking them do nothing.
 */
function fillWrittenGaps(writtenToSpoken: Int32Array): void {
  let carry = -1
  for (let i = 0; i < writtenToSpoken.length; i++) {
    if (writtenToSpoken[i] >= 0) carry = writtenToSpoken[i]
    else writtenToSpoken[i] = carry
  }
  // Leading words before the first match borrow backwards instead.
  carry = -1
  for (let i = writtenToSpoken.length - 1; i >= 0; i--) {
    if (writtenToSpoken[i] >= 0) carry = writtenToSpoken[i]
    else writtenToSpoken[i] = carry
  }
}

/**
 * Shortest run of narration-only words treated as an announcement rather than
 * an ordinary gap in the alignment.
 */
const MIN_ANNOUNCEMENT_WORDS = 4

/** Caption openers worth marking: the "Figure 1.2" the narration says. */
const FIGURE_LABEL_WORDS = new Set(["figure", "fig", "table", "chart", "video"])

export type ParkResult = {
  /** Where each spoken word highlights, with announcements moved onto captions. */
  spokenToWritten: Int32Array
  /** Last written word of each highlight, so a caption label marks as a whole. */
  parkEnd: Int32Array
}

/**
 * How far a caption's own label runs -- the "Figure 1.2" that opens it.
 *
 * The narration says both words, so highlighting only "Figure" marks less
 * than was actually spoken. Stops at the caption's own words, and at the
 * first token with no digit in it, so an ordinary caption sentence is not
 * swallowed.
 */
function captionLabelEnd(
  words: string[],
  captionId: Int32Array,
  start: number,
): number {
  const first = words[start]?.toLowerCase().replace(/[^a-z]/g, "") ?? ""
  if (!FIGURE_LABEL_WORDS.has(first)) return start
  let end = start
  for (let i = start + 1; i < words.length && i <= start + 2; i++) {
    if (captionId[i] !== captionId[start]) break
    if (!/\d/.test(words[i] ?? "")) break
    end = i
  }
  return end
}

/**
 * Move figure announcements onto the figure's own caption.
 *
 * While the narration says "The textbook includes Figure 1.2 here. It depicts
 * ...", there is nothing in the prose to highlight, so the alignment holds
 * the highlight on the last word of the preceding paragraph. The caption is
 * what is being talked about, and it opens with the figure number just
 * spoken, so resting there reads far better.
 *
 * The aligner cannot do this itself: it resyncs on consecutive matching
 * words, and an announcement shares only "Figure 1.2" with the caption before
 * diverging. It also has no notion of a caption -- which caption each word
 * belongs to is DOM knowledge, passed in here as an id per written word (-1
 * for words outside any caption).
 *
 * A run is only ever moved forward, so the highlight cannot appear to travel
 * backwards through the page.
 */
export function parkAnnouncements(
  spokenToWritten: Int32Array,
  words: string[],
  captionId: Int32Array,
): ParkResult {
  const starts = Int32Array.from(spokenToWritten)
  const ends = Int32Array.from(spokenToWritten)

  const captionStart = new Map<number, number>()
  for (let i = 0; i < captionId.length; i++) {
    if (captionId[i] >= 0 && !captionStart.has(captionId[i])) {
      captionStart.set(captionId[i], i)
    }
  }
  if (!captionStart.size) return { spokenToWritten: starts, parkEnd: ends }

  let i = 0
  while (i < starts.length) {
    const parkedAt = starts[i]
    let end = i
    while (end + 1 < starts.length && starts[end + 1] === parkedAt) end++

    const resumesAt = end + 1 < starts.length ? starts[end + 1] : -1
    if (end - i + 1 >= MIN_ANNOUNCEMENT_WORDS && resumesAt > parkedAt) {
      const caption = resumesAt >= 0 ? captionId[resumesAt] : -1
      const start = caption >= 0 ? captionStart.get(caption) : undefined
      if (start !== undefined && start > parkedAt) {
        const labelEnd = captionLabelEnd(words, captionId, start)
        for (let k = i; k <= end; k++) {
          starts[k] = start
          ends[k] = labelEnd
        }
      }
    }
    i = end + 1
  }

  return { spokenToWritten: starts, parkEnd: ends }
}
