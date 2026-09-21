import { describe, it, expect } from "vitest"
import {
  availableAudioSources,
  parseAudioSourceOverride,
  resolveSectionAudio,
} from "./section-audio"

const CDN = "https://atlas.foreviewusercontent.com/audio/atlas-ch1-s1-abc.mp3"
const staged = () => true
const notStaged = () => false

// Which file a section page plays. Getting this wrong shows a reader a
// player that loads nothing, or silently drops them onto audio the word
// timings do not match.
describe("resolveSectionAudio", () => {
  // Locally staged audio is constant bitrate, so a seek lands where the word
  // timings say it will. Preferring the published file instead would make
  // clicking a word jump to roughly, not exactly, the right place.
  it("prefers the staged local file over the published one", () => {
    expect(resolveSectionAudio(1, 1, CDN, { staged })).toEqual({
      audioUrl: "/audio/ch1/ch1-s1.mp3",
      wordsUrl: "/audio/ch1/ch1-s1.words.json",
      source: "cbr",
    })
  })

  // A reviewer who clones the branch has the committed timings but not the
  // gitignored MP3s. Falling back to the published narration means the
  // read-along works for them without staging anything first.
  it("falls back to the published audio and keeps the word timings", () => {
    expect(resolveSectionAudio(1, 1, CDN, { staged: notStaged })).toEqual({
      audioUrl: CDN,
      wordsUrl: "/audio/ch1/ch1-s1.words.json",
      source: "cdn",
    })
  })

  // A build without credentials resolves no published link at all, so chapter
  // 1 falls back to the URL pinned beside its timings. Without that, a plain
  // clone would have word timings and nothing to play them against.
  it("uses the pinned published URL when the build resolved none", () => {
    const audio = resolveSectionAudio(1, 1, undefined, { staged: notStaged })
    expect(audio?.source).toBe("cdn")
    expect(audio?.audioUrl).toMatch(/^https:\/\/.+atlas-ch1-s1-.+\.mp3$/)
    expect(audio?.wordsUrl).toBe("/audio/ch1/ch1-s1.words.json")
  })

  // A chapter with no timing table at all -- a build that resolved no audio
  // must report none. Returning a player that loads a 404 would be worse than
  // the no-player state the rest of the site already shows.
  it("reports no audio when neither source exists", () => {
    expect(resolveSectionAudio(99, 2, undefined, { staged: notStaged })).toBeNull()
  })

  // A section outside every timed chapter must still play its published
  // audio, just without a read-along.
  it("plays published audio without timings for chapters that have none", () => {
    expect(resolveSectionAudio(99, 2, CDN, { staged: notStaged })).toEqual({
      audioUrl: CDN,
      wordsUrl: null,
      source: "cdn",
    })
  })

  // Chapter 1 stops at section 11; a section past the end must not be treated
  // as having audio just because its chapter does.
  it("reports no audio for a chapter 1 section with no timings and no published file", () => {
    expect(resolveSectionAudio(1, 99, undefined, { staged })).toBeNull()
  })

  // The dev switch exists to compare the two sources on the same page, so
  // asking for the published file must override the local preference.
  it("serves the published file when the override asks for it", () => {
    const audio = resolveSectionAudio(1, 1, CDN, { staged, override: "cdn" })
    expect(audio?.source).toBe("cdn")
    expect(audio?.wordsUrl).toBe("/audio/ch1/ch1-s1.words.json")
  })

  // Forcing a source that this build cannot serve must report no audio rather
  // than quietly falling back, or the switch would lie about what is playing.
  it("reports no audio when the forced source is unavailable", () => {
    expect(resolveSectionAudio(1, 1, CDN, { staged: notStaged, override: "cbr" })).toBeNull()
    expect(resolveSectionAudio(99, 2, undefined, { staged, override: "cdn" })).toBeNull()
  })

  // "none" is how the no-player path gets exercised on a machine that has the
  // audio, so it must win over both sources being available.
  it("reports no audio for the none override", () => {
    expect(resolveSectionAudio(1, 1, CDN, { staged, override: "none" })).toBeNull()
  })
})

// Reads the development-only source override. It comes from a value a
// person can type, so anything unrecognised has to mean "no override"
// rather than a broken page.
describe("parseAudioSourceOverride", () => {
  // The override arrives from a query string a reader could type anything
  // into. Anything unrecognised has to mean "no override", not a broken page.
  it("accepts the three known values and rejects the rest", () => {
    expect(parseAudioSourceOverride("cbr")).toBe("cbr")
    expect(parseAudioSourceOverride("cdn")).toBe("cdn")
    expect(parseAudioSourceOverride("none")).toBe("none")
    expect(parseAudioSourceOverride("CBR")).toBeNull()
    expect(parseAudioSourceOverride("")).toBeNull()
    expect(parseAudioSourceOverride(null)).toBeNull()
  })
})

// What the development switch offers. If it advertises a source this build
// cannot serve, pressing it produces silence with no explanation.
describe("availableAudioSources", () => {
  // The switch marks options this build cannot serve, so pressing one and
  // getting silence is never a surprise.
  it("reports which sources this build could serve", () => {
    expect(availableAudioSources(1, 1, CDN, { staged })).toEqual({ cbr: true, cdn: true })
    // Chapter 1 keeps a pinned published URL, so cdn stays reachable.
    expect(availableAudioSources(1, 1, undefined, { staged: notStaged })).toEqual({
      cbr: false,
      cdn: true,
    })
    expect(availableAudioSources(99, 2, CDN, { staged })).toEqual({ cbr: false, cdn: true })
    expect(availableAudioSources(99, 2, undefined, { staged })).toEqual({
      cbr: false,
      cdn: false,
    })
  })
})
