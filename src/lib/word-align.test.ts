import { describe, it, expect } from "vitest"
import { alignWords, normalizeToken, parkAnnouncements } from "./word-align"

const toks = (text: string) => text.split(" ").filter(Boolean)

// How a spoken word is compared with a printed one. Miss a difference the
// two streams routinely have -- case, accents, punctuation -- and ordinary
// words stop matching, so the highlight resyncs instead of tracking.
describe("normalizeToken", () => {
  // Transcript and page differ in case, accents and punctuation for the same
  // word. If normalisation misses any of those, ordinary words stop matching
  // and the highlight resyncs constantly instead of tracking the narration.
  it("reduces case, accents and punctuation to a comparable core", () => {
    expect(normalizeToken("Café,")).toBe("cafe")
    expect(normalizeToken("general-purpose")).toBe("generalpurpose")
    expect(normalizeToken("(AGI)")).toBe("agi")
  })

  // Standalone punctuation must reduce to empty so the walk can skip it. If
  // it did not, a stray em dash on the page would never match any spoken
  // word and would stall the highlight.
  it("reduces punctuation-only tokens to empty", () => {
    expect(normalizeToken("---")).toBe("")
    expect(normalizeToken("—")).toBe("")
  })
})

// The map from narration to page text. When this is wrong the highlight is
// on the wrong word, and clicking a word seeks to the wrong place.
describe("alignWords", () => {
  // The base case the whole feature rests on: when narration and page agree,
  // every spoken word highlights its own word. If this breaks, the highlight
  // is wrong everywhere, not just at the tricky spots.
  it("maps identical streams one to one", () => {
    const words = toks("Game playing systems beat the best human players")
    const { spokenToWritten, writtenToSpoken, matched } = alignWords(words, words)
    expect(matched).toBe(words.length)
    words.forEach((_, i) => {
      expect(spokenToWritten[i]).toBe(i)
      expect(writtenToSpoken[i]).toBe(i)
    })
  })

  // Every section's narration opens by naming the chapter and section, which
  // is not printed on the page. Readers should see no highlight at all until
  // the prose actually starts, and the first prose word must then be right.
  it("highlights nothing during the spoken preamble, then aligns", () => {
    const spoken = toks("Chapter 1 Capabilities Section 2 Current capabilities Game playing systems beat humans")
    const written = toks("Game playing systems beat humans")
    const { spokenToWritten } = alignWords(spoken, written)
    for (let i = 0; i < 7; i++) expect(spokenToWritten[i]).toBe(-1)
    expect(spokenToWritten[7]).toBe(0)
    expect(spokenToWritten[11]).toBe(4)
  })

  // Figure announcements are audio-only and appear 22 times in section 1.2.
  // The highlight must hold still through the announcement and then land on
  // the text that follows -- not slide forward through unrelated words.
  it("parks through a figure announcement and resumes on the following prose", () => {
    const spoken = toks(
      "trained on centuries of human play The textbook includes Figure 1.2 here It depicts a chess board Kasparov the reigning grandmaster lost the match",
    )
    const written = toks("trained on centuries of human play Kasparov the reigning grandmaster lost the match")
    const { spokenToWritten } = alignWords(spoken, written)

    const lastBefore = written.indexOf("play")
    const resumeAt = spoken.indexOf("Kasparov")
    expect(spokenToWritten[spoken.indexOf("play")]).toBe(lastBefore)
    // Announcement words all hold on the last real word.
    for (let i = spoken.indexOf("play") + 1; i < resumeAt; i++) {
      expect(spokenToWritten[i]).toBe(lastBefore)
    }
    // "Kasparov" resumes exactly where the prose continues.
    expect(spokenToWritten[resumeAt]).toBe(written.indexOf("Kasparov"))
  })

  // Note boxes are announced and then skipped, producing the longest run of
  // narration with nothing to highlight. The highlight must survive it and
  // rejoin the prose afterwards rather than giving up for the rest of the page.
  it("survives a note-box skip-over", () => {
    const spoken = toks(
      "scaling continued The textbook has a supplementary note titled Minecraft agents which we will skip over here Progress then accelerated sharply",
    )
    const written = toks("scaling continued Progress then accelerated sharply")
    const { spokenToWritten } = alignWords(spoken, written)
    expect(spokenToWritten[spoken.indexOf("Progress")]).toBe(written.indexOf("Progress"))
    expect(spokenToWritten[spoken.length - 1]).toBe(written.length - 1)
  })

  // Transcription splits some hyphenated compounds and joins others. Without
  // compound handling each inconsistency costs a word of alignment, and those
  // errors accumulate into visible lag over a long section.
  it("handles compounds split on one side and joined on the other", () => {
    const spokenSplit = toks("a game playing system arrived")
    const writtenJoined = toks("a game-playing system arrived")
    const a = alignWords(spokenSplit, writtenJoined)
    expect(a.spokenToWritten[spokenSplit.indexOf("system")]).toBe(writtenJoined.indexOf("system"))

    const spokenJoined = toks("a game-playing system arrived")
    const writtenSplit = toks("a game playing system arrived")
    const b = alignWords(spokenJoined, writtenSplit)
    expect(b.spokenToWritten[spokenJoined.indexOf("system")]).toBe(writtenSplit.indexOf("system"))
  })

  // A single misheard word is common and must not derail the alignment: the
  // words after it should still highlight correctly.
  it("recovers from a single mistranscribed word", () => {
    const spoken = toks("the model was trained on enormous quantities of text")
    const written = toks("the model was trained on enormous amounts of text")
    const { spokenToWritten } = alignWords(spoken, written)
    expect(spokenToWritten[spoken.length - 1]).toBe(written.length - 1)
    expect(spokenToWritten[spoken.indexOf("of")]).toBe(written.indexOf("of"))
  })

  // Punctuation sits in the text as its own token in places. It is never
  // spoken, so it must be stepped over silently rather than blocking the walk.
  it("steps over punctuation-only written tokens", () => {
    const spoken = toks("progress was rapid and sustained")
    const written = toks("progress was rapid — and sustained")
    const { spokenToWritten } = alignWords(spoken, written)
    expect(spokenToWritten[spoken.indexOf("sustained")]).toBe(written.indexOf("sustained"))
  })

  // Every visible word is clickable. A word the aligner could not match still
  // needs a seek target, or clicking it would silently do nothing.
  it("gives unmatched written words a seek target from their neighbours", () => {
    const spoken = toks("alpha beta gamma")
    const written = toks("alpha beta inserted gamma")
    const { writtenToSpoken } = alignWords(spoken, written)
    expect(writtenToSpoken.every((v) => v >= 0)).toBe(true)
    expect(writtenToSpoken[written.indexOf("inserted")]).toBeGreaterThanOrEqual(
      writtenToSpoken[written.indexOf("beta")],
    )
  })

  // Highlights must only ever move forward. A backward jump is the single
  // most visible failure -- readers see the marker flick back mid-sentence.
  it("never moves the highlight backwards", () => {
    const spoken = toks(
      "Chapter 1 Section 1 systems improved steadily The textbook includes Figure 1.1 here It depicts a graph and then progress accelerated",
    )
    const written = toks("systems improved steadily and then progress accelerated")
    const { spokenToWritten } = alignWords(spoken, written)
    let prev = -1
    for (const idx of spokenToWritten) {
      expect(idx).toBeGreaterThanOrEqual(prev)
      prev = idx
    }
  })

  // Empty or absent timing data must not throw: sections without narration
  // share this code path and should simply render as normal text.
  it("handles empty input without throwing", () => {
    const { spokenToWritten, writtenToSpoken, matched } = alignWords([], [])
    expect(matched).toBe(0)
    expect(spokenToWritten.length).toBe(0)
    expect(writtenToSpoken.length).toBe(0)
  })
})

// Where the highlight rests while the narration describes a figure. The
// prose has nothing to mark during those seconds, so it parks on the
// figure's caption instead of sliding through unrelated text.
describe("parkAnnouncements", () => {
  // Helpers mirroring what the page supplies: the words as rendered, and
  // which figure caption (if any) each one sits in.
  const captions = (spec: string) =>
    Int32Array.from(spec.split(" ").filter(Boolean).map(Number))

  // While the narration describes a figure there is nothing in the prose to
  // highlight, so the alignment holds on the preceding word. Readers should
  // see the highlight move to the caption of the figure being described.
  it("moves an announcement onto the caption being described", () => {
    // Six spoken words park on written word 2; the prose resumes inside the
    // caption at word 4, whose caption starts at word 3.
    const spokenToWritten = Int32Array.from([0, 1, 2, 2, 2, 2, 2, 2, 4])
    const words = toks("intelligence is measured Figure 1.2 shows benchmark scores")
    const { spokenToWritten: parked, parkEnd } = parkAnnouncements(
      spokenToWritten,
      words,
      captions("-1 -1 -1 0 0 0 0 -1 -1"),
    )
    for (let i = 2; i <= 7; i++) expect(parked[i]).toBe(3)
    // "Figure 1.2" is two words and both are spoken, so both are marked.
    expect(parkEnd[2]).toBe(4)
  })

  // The guarantee that matters: a reader must never see the highlight jump
  // backwards to a caption they have already passed.
  it("never moves a parked run backwards", () => {
    // The prose resumes in a caption that sits *before* the parked position,
    // which is what a figure referenced again later looks like.
    const spokenToWritten = Int32Array.from([6, 6, 6, 6, 6, 1])
    const words = toks("caption Figure 1.2 here later prose continues onward")
    const { spokenToWritten: parked } = parkAnnouncements(
      spokenToWritten,
      words,
      captions("0 0 0 0 -1 -1 -1 -1"),
    )
    // The run itself must stay put; only the aligner's own resume point moves on.
    for (let i = 0; i < 5; i++) expect(parked[i]).toBe(6)
  })

  // Ordinary alignment gaps -- a word or two the transcriber dropped -- are
  // not announcements. Parking those on a caption would yank the highlight
  // out of the sentence the reader is following.
  it("leaves short gaps where the aligner put them", () => {
    const spokenToWritten = Int32Array.from([0, 1, 1, 1, 3])
    const words = toks("prose here Figure 1.2 caption")
    const { spokenToWritten: parked } = parkAnnouncements(
      spokenToWritten,
      words,
      captions("-1 -1 0 0 0"),
    )
    expect(Array.from(parked)).toEqual([0, 1, 1, 1, 3])
  })

  // A caption whose text is an ordinary sentence has no "Figure N" label to
  // mark, so the highlight should sit on its first word alone rather than
  // marking an arbitrary two-word run.
  it("marks only the first word when the caption has no figure label", () => {
    const spokenToWritten = Int32Array.from([0, 0, 0, 0, 0, 3])
    const words = toks("prose and then benchmark scores over time")
    const { parkEnd } = parkAnnouncements(
      spokenToWritten,
      words,
      captions("-1 -1 -1 0 0 0 0"),
    )
    expect(parkEnd[0]).toBe(3)
  })

  // A section with no figures at all must come back untouched; the parking
  // pass runs on every page, including those.
  it("leaves a page without captions unchanged", () => {
    const spokenToWritten = Int32Array.from([0, 1, 1, 1, 1, 1, 2])
    const words = toks("prose without any figures at all here")
    const { spokenToWritten: parked, parkEnd } = parkAnnouncements(
      spokenToWritten,
      words,
      captions("-1 -1 -1 -1 -1 -1 -1"),
    )
    expect(Array.from(parked)).toEqual([0, 1, 1, 1, 1, 1, 2])
    expect(Array.from(parkEnd)).toEqual([0, 1, 1, 1, 1, 1, 2])
  })
})
