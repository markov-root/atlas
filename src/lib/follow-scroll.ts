/**
 * Geometry for read-along's follow mode.
 *
 * Kept separate from the DOM wiring in word-highlight.ts so the decisions --
 * when to scroll and how far -- can be checked directly. The animation itself
 * is driven by requestAnimationFrame, which only runs while the page is
 * actually visible.
 */

/**
 * Where the narration should sit after a scroll, as a fraction of viewport
 * height. Above the middle: reading happens in the upper half of the screen,
 * with the text still to come visible below it.
 */
export const FOLLOW_TARGET = 0.35

/** Where a newly started paragraph is placed when following moves to it. */
export const FOLLOW_BLOCK_TOP = 0.28

/**
 * How far the active word may drift within a single paragraph before the page
 * catches up regardless of paragraph boundaries. This is the safety net for
 * paragraphs taller than the viewport, not the usual trigger.
 */
export const FOLLOW_BAND_TOP = 0.15
export const FOLLOW_BAND_BOTTOM = 0.8

/** How far past the viewport edge a word may sit before the pill appears. */
export const OFFSCREEN_GRACE = 0.1

export const FOLLOW_SCROLL_MS = 550

/** Vertical centre of a rect. */
export function centreOf(top: number, height: number): number {
  return top + height / 2
}

/**
 * Has the active word drifted far enough within its paragraph that the page
 * should catch up without waiting for the next one?
 */
export function isOutsideFollowBand(centre: number, viewportHeight: number): boolean {
  return (
    centre < viewportHeight * FOLLOW_BAND_TOP ||
    centre > viewportHeight * FOLLOW_BAND_BOTTOM
  )
}

/**
 * Scroll position that puts `offset` (a viewport-relative y) at `fraction` of
 * the viewport height.
 */
export function scrollTargetFor(
  offset: number,
  viewportHeight: number,
  scrollY: number,
  fraction: number,
): number {
  return scrollY + offset - viewportHeight * fraction
}

/**
 * Should following move to a paragraph that has just started?
 *
 * Only when the paragraph sits below the line we would place it on. A
 * paragraph already at or above that line needs no scroll, and scrolling
 * backwards to reach it would drag the reader away from what they can see.
 */
export function shouldFollowNewBlock(blockTop: number, viewportHeight: number): boolean {
  return blockTop > viewportHeight * FOLLOW_BLOCK_TOP
}

/**
 * Which way the reader would have to travel to reach the active word, or
 * null if it is close enough that offering to move would just be noise.
 */
export function offscreenDirection(
  top: number,
  bottom: number,
  viewportHeight: number,
): "above" | "below" | null {
  const grace = viewportHeight * OFFSCREEN_GRACE
  if (bottom < -grace) return "above"
  if (top > viewportHeight + grace) return "below"
  return null
}

export function easeInOutQuad(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2
}
