import { describe, it, expect } from "vitest"
import { groupSentences } from "./sentences"

const oneBlock = (n: number) => new Int32Array(n).fill(0)
const words = (text: string) => text.split(" ").filter(Boolean)

// Which words the sentence rule underlines. Split in the wrong place and
// the rule marks half a sentence, or runs a heading into the paragraph
// below it.
describe("groupSentences", () => {
  // The underline marks one sentence at a time, so consecutive sentences have
  // to come back as different groups -- otherwise the whole paragraph lights
  // up at once and the cue means nothing.
  it("splits a paragraph at its sentence ends", () => {
    const w = words("AI has changed. Systems beat humans. Nobody expected it.")
    const ids = groupSentences(w, oneBlock(w.length))
    expect(Array.from(ids)).toEqual([0, 0, 0, 1, 1, 1, 2, 2, 2])
  })

  // This textbook is full of full stops that end nothing. Splitting on any of
  // them would cut the underline in half mid-phrase, several times a page.
  it("does not split inside figure numbers, decimals or abbreviations", () => {
    const w = words("See Figure 1.2 for the 3.5 percent case, e.g. the one above.")
    const ids = groupSentences(w, oneBlock(w.length))
    expect(new Set(Array.from(ids)).size).toBe(1)
  })

  // A heading and the paragraph beneath it are separate thoughts, and a
  // caption is not a continuation of the prose above it. Letting a sentence
  // run across the boundary would underline a heading together with the text
  // that follows it.
  it("never runs a sentence across two blocks", () => {
    const w = words("Current Capabilities AI can write code")
    const blocks = Int32Array.from([0, 0, 1, 1, 1, 1])
    const ids = groupSentences(w, blocks)
    expect(ids[0]).toBe(ids[1])
    expect(ids[1]).not.toBe(ids[2])
    expect(ids[2]).toBe(ids[5])
  })

  // Every word needs a sentence, including one left dangling without final
  // punctuation. A word with none would clear the underline as the narration
  // passed over it.
  it("gives every word a sentence, punctuated or not", () => {
    const w = words("A heading with no full stop")
    const ids = groupSentences(w, oneBlock(w.length))
    expect(Array.from(ids).every((id) => id >= 0)).toBe(true)
    expect(new Set(Array.from(ids)).size).toBe(1)
  })

  // Called on every section, including one whose timings arrive before any
  // word has been wrapped.
  it("handles an empty page", () => {
    expect(groupSentences([], new Int32Array(0)).length).toBe(0)
  })
})
