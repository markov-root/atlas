import { describe, it, expect } from "vitest"
import {
  FOLLOW_BAND_BOTTOM,
  FOLLOW_BAND_TOP,
  FOLLOW_BLOCK_TOP,
  FOLLOW_TARGET,
  OFFSCREEN_GRACE,
  centreOf,
  easeInOutQuad,
  isOutsideFollowBand,
  offscreenDirection,
  scrollTargetFor,
  shouldFollowNewBlock,
} from "./follow-scroll"

const VIEWPORT = 800

// Where the page puts the line being read. Get this wrong and the reader
// follows the narration from the bottom of the screen, with every next
// sentence still off-screen.
describe("reading position", () => {
  // Text is placed above the middle of the screen so the reader can see what
  // is coming. If this drifted to the centre or below, reading would happen
  // in the bottom half with the narration always about to go off-screen.
  it("keeps the reading line in the upper half of the viewport", () => {
    expect(FOLLOW_TARGET).toBeLessThan(0.5)
    expect(FOLLOW_BLOCK_TOP).toBeLessThan(0.5)
  })
})

// When the page is allowed to move under the reader. Too eager and it
// twitches on every word; too reluctant and the narration walks off the
// screen while the reader waits.
describe("isOutsideFollowBand", () => {
  // Within a paragraph the page should stay still; this band is only the
  // rescue for paragraphs taller than the screen. Too tight a band and the
  // page creeps continuously, which is what following by paragraph avoids.
  it("leaves the page alone through the bulk of the viewport", () => {
    expect(isOutsideFollowBand(VIEWPORT * 0.3, VIEWPORT)).toBe(false)
    expect(isOutsideFollowBand(VIEWPORT * 0.5, VIEWPORT)).toBe(false)
    expect(isOutsideFollowBand(VIEWPORT * 0.75, VIEWPORT)).toBe(false)
  })

  // A word approaching either edge is about to be lost, so the page catches
  // up even mid-paragraph.
  it("catches up once the word approaches an edge", () => {
    expect(isOutsideFollowBand(VIEWPORT * (FOLLOW_BAND_TOP - 0.05), VIEWPORT)).toBe(true)
    expect(isOutsideFollowBand(VIEWPORT * (FOLLOW_BAND_BOTTOM + 0.05), VIEWPORT)).toBe(true)
  })

  // A word scrolled off the top reports a negative centre; that must count as
  // drifted rather than reading as "fine".
  it("treats a word above the viewport as drifted", () => {
    expect(isOutsideFollowBand(-500, VIEWPORT)).toBe(true)
  })
})

// Where a follow scroll lands. A wrong target either overshoots the word
// being spoken or leaves it at the very edge of the screen.
describe("scrollTargetFor", () => {
  // The glide exists to land the narration on the reading line. If this
  // arithmetic is wrong the page settles with the text in the wrong place, or
  // jumps somewhere unrelated.
  it("places the given offset at the requested fraction of the viewport", () => {
    // Something 700px down an 800px viewport, page already scrolled 1000px,
    // asked to sit at 35% => 1000 + 700 - 280.
    expect(scrollTargetFor(700, VIEWPORT, 1000, 0.35)).toBe(1420)
  })

  // Text already on the reading line must produce no movement, or following
  // would jitter every time the highlight advanced.
  it("returns the current position when already on the line", () => {
    expect(scrollTargetFor(VIEWPORT * 0.35, VIEWPORT, 2500, 0.35)).toBe(2500)
  })

  // Readers seek backwards, and the page has to follow them upward too.
  it("scrolls upward for something above the viewport", () => {
    expect(scrollTargetFor(-200, VIEWPORT, 3000, 0.35)).toBe(2520)
  })
})

// Whether arriving at a new paragraph should move the page. This is what
// makes the page advance a paragraph at a time rather than continuously.
describe("shouldFollowNewBlock", () => {
  // Reaching a new paragraph that is already at or above the reading line
  // needs no scroll -- and scrolling backwards to reach it would drag the
  // reader away from text they are still looking at.
  it("does not scroll backwards to a paragraph already high on screen", () => {
    expect(shouldFollowNewBlock(VIEWPORT * 0.1, VIEWPORT)).toBe(false)
    expect(shouldFollowNewBlock(-300, VIEWPORT)).toBe(false)
  })

  // The normal case: narration moves into a paragraph further down the page,
  // so the page moves to bring it up to the reading line.
  it("scrolls to a paragraph below the reading line", () => {
    expect(shouldFollowNewBlock(VIEWPORT * 0.6, VIEWPORT)).toBe(true)
  })
})

// Which way the "jump back to the narration" button points, and whether it
// appears at all. A wrong answer sends the reader the wrong way.
describe("offscreenDirection", () => {
  // The pill is an interruption, so it stays away while the word is visible
  // or only just past the fold.
  it("stays hidden while the word is on screen or within the grace band", () => {
    expect(offscreenDirection(300, 320, VIEWPORT)).toBeNull()
    const justBelow = VIEWPORT + VIEWPORT * OFFSCREEN_GRACE - 10
    expect(offscreenDirection(justBelow, justBelow + 20, VIEWPORT)).toBeNull()
  })

  // Once the reader has genuinely scrolled away, the arrow must point the
  // right way or the button sends them further from the narration.
  it("points toward the word once it is well outside the viewport", () => {
    expect(offscreenDirection(-400, -380, VIEWPORT)).toBe("above")
    expect(offscreenDirection(VIEWPORT + 400, VIEWPORT + 420, VIEWPORT)).toBe("below")
  })
})

// The shape of the follow scroll. Without easing the page jumps, which is
// the thing that makes a moving page hard to read.
describe("easeInOutQuad", () => {
  // The glide must start where the page is and finish exactly on target; an
  // easing that misses either end leaves the page part-scrolled.
  it("runs from 0 to 1 and passes through the midpoint", () => {
    expect(easeInOutQuad(0)).toBe(0)
    expect(easeInOutQuad(1)).toBe(1)
    expect(easeInOutQuad(0.5)).toBeCloseTo(0.5, 5)
  })

  // Motion that reversed would look like the page stuttering backwards.
  it("never moves backwards", () => {
    let prev = -1
    for (let t = 0; t <= 1.0001; t += 0.05) {
      const v = easeInOutQuad(Math.min(1, t))
      expect(v).toBeGreaterThanOrEqual(prev)
      prev = v
    }
  })
})

// The geometry the rest of the follow logic is built on; if it is wrong,
// every scroll decision above it is wrong too.
describe("centreOf", () => {
  // Every decision above keys off this, so an off-by-half here would bias the
  // whole feature toward one edge of the screen.
  it("returns the vertical middle of a rect", () => {
    expect(centreOf(100, 20)).toBe(110)
  })
})
