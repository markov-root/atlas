/**
 * Groups the words of a page into sentences, so the read-along can mark the
 * sentence being narrated as well as the word.
 *
 * A word-level highlight tells a reader where the voice is; it does not tell
 * them where they are in the argument, which is what makes it hard to look
 * away and come back. Underlining the current sentence gives that second,
 * slower cue.
 *
 * Sentence boundaries come from `Intl.Segmenter` rather than a search for
 * full stops. This text is full of stops that end nothing -- "Figure 1.2",
 * "10^26", "e.g.", "vs.", initials in citations -- and each false split would
 * cut an underline in half mid-phrase.
 */

/** Words carry the index of the block they were wrapped in; -1 marks none. */
export function groupSentences(words: string[], blockIds: Int32Array): Int32Array {
  const sentenceOf = new Int32Array(words.length).fill(-1)
  if (!words.length) return sentenceOf

  const segmenter = new Intl.Segmenter("en", { granularity: "sentence" })
  let sentenceBase = 0
  let start = 0

  // A sentence never spans two blocks: a heading and the paragraph under it
  // are separate thoughts however the punctuation falls, and a caption is not
  // a continuation of the prose above it.
  for (let end = 1; end <= words.length; end++) {
    if (end < words.length && blockIds[end] === blockIds[start]) continue

    // Rebuild the block's text exactly as joined here, recording where each
    // word starts, so segment offsets map back onto word indices.
    const offsets: number[] = []
    let text = ""
    for (let k = start; k < end; k++) {
      if (k > start) text += " "
      offsets.push(text.length)
      text += words[k]
    }

    const bounds = Array.from(segmenter.segment(text), (segment) => segment.index)
    let seg = 0
    for (let k = start; k < end; k++) {
      while (seg + 1 < bounds.length && offsets[k - start] >= bounds[seg + 1]) seg++
      sentenceOf[k] = sentenceBase + seg
    }

    sentenceBase += Math.max(bounds.length, 1)
    start = end
  }

  return sentenceOf
}
