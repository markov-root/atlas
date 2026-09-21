/**
 * Read-along: highlights each word of the chapter text as the narration
 * speaks it, and lets a reader click a word to jump the audio there.
 *
 * The mapping between narration and page text is not positional -- see
 * word-align.ts for why -- so this module is only responsible for finding
 * the words on the page, driving the highlight from playback time, and
 * keeping the active word comfortably in view.
 */

import { alignWords, parkAnnouncements } from "./word-align"
import { groupSentences } from "./sentences"
import {
  FOLLOW_BLOCK_TOP,
  FOLLOW_SCROLL_MS,
  FOLLOW_TARGET,
  centreOf,
  easeInOutQuad,
  isOutsideFollowBand,
  offscreenDirection,
  scrollTargetFor,
  shouldFollowNewBlock,
} from "./follow-scroll"

type WordEntry = { w: string; s: number; e: number }

/**
 * Blocks whose text is narrated: prose, section headings, and figure captions
 * (which are read out as part of the figure description).
 *
 * Headings matter more than they look. The narration reads each one, so
 * leaving them unwrapped meant the highlight had nothing to move to and sat
 * parked on the previous paragraph through every subsection change.
 */
const WRAPPABLE_SELECTOR = "p, figcaption, h2, h3, h4"

/**
 * Text that is on the page but never spoken. Footnote markers are bare
 * numbers, equations render as SVG rather than text, note boxes are
 * announced and then skipped, and `.if-js` marks interactive page chrome
 * (the feedback form) rather than prose.
 */
const UNSPOKEN_SELECTOR =
  ".footnote-ref, .inline-equation, .notebox-content, .if-js"

const SCROLL_KEYS = new Set([
  "PageUp",
  "PageDown",
  "ArrowUp",
  "ArrowDown",
  "Home",
  "End",
  " ",
])

let spokenWords: WordEntry[] = []
let spans: HTMLSpanElement[] = []
let spanIndex = new WeakMap<Element, number>()
let spokenToWritten: Int32Array | null = null
let writtenToSpoken: Int32Array | null = null
let activeIdx = -1
let activeEnd = -1
let parkEnd: Int32Array | null = null
let sentenceOf: Int32Array | null = null
let activeSentence = -1
let sentenceRules: HTMLElement[] = []
let followMode = true
let followedBlock: Element | null = null
let seekArmed = false
let pageAudioUrl = ""
let article: Element | null = null
let roots: Element[] = []
let pill: HTMLButtonElement | null = null
let cancelGlide: (() => void) | null = null
let teardown: Array<() => void> = []

function getAudio(): HTMLAudioElement | null {
  return document.getElementById("audio-element") as HTMLAudioElement | null
}

/**
 * Is the shared player actually playing this page's narration?
 *
 * The audio element persists across client-side navigation so playback
 * continues while the reader moves between pages. Without this check, one
 * chapter's playback time would drive another chapter's word spans.
 */
function audioMatchesPage(audio: HTMLAudioElement): boolean {
  if (!pageAudioUrl) return false
  const src = audio.currentSrc || audio.src
  if (!src) return false
  try {
    return (
      new URL(src, location.href).pathname ===
      new URL(pageAudioUrl, location.href).pathname
    )
  } catch {
    return false
  }
}

/** Binary search for the word being spoken at time t. */
function findWordIndex(words: WordEntry[], t: number): number {
  let lo = 0
  let hi = words.length - 1
  while (lo <= hi) {
    const mid = (lo + hi) >> 1
    if (words[mid].e < t) lo = mid + 1
    else if (words[mid].s > t) hi = mid - 1
    else return mid
  }
  return lo > 0 ? lo - 1 : -1
}

/**
 * Pick the article to highlight, preferring one that is actually visible.
 *
 * A layout may render the chapter twice and show one copy per breakpoint.
 * Wrapping a hidden copy would highlight words the reader cannot see.
 */
function pickArticle(): Element | null {
  const candidates = Array.from(document.querySelectorAll("[data-chapter-article]"))
  if (candidates.length <= 1) return candidates[0] ?? null
  return (
    candidates.find((el) => (el as HTMLElement).offsetParent !== null) ??
    candidates[0]
  )
}

/**
 * The heading lines the narration reads before the prose starts.
 *
 * Every section opens with "Section 1.2: Current Capabilities", and the
 * chapter's first section is preceded by "Chapter 1: Capabilities". Those
 * words are printed on the page, above the article, so highlighting them
 * makes the read-along visibly live from the first second rather than
 * appearing part-way down the page once the prose begins.
 *
 * Like the article, the heading is rendered once per breakpoint, so only the
 * copy actually on screen is wrapped.
 */
function pickHeadings(): Element[] {
  const all = Array.from(document.querySelectorAll("[data-narration-heading]"))
  const visible = all.filter((el) => (el as HTMLElement).offsetParent !== null)
  return visible.length ? visible : all
}

/**
 * Wrap every narrated word in its own span.
 *
 * This descends through inline markup rather than only touching direct text
 * children: bold text, links and glossary terms are all spoken, and skipping
 * them would drop those words from the alignment.
 */
function wrapWordsIn(root: Element, out: HTMLSpanElement[]): void {
  for (const node of Array.from(root.childNodes)) {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent ?? ""
      if (!text.trim()) continue
      const frag = document.createDocumentFragment()
      for (const part of text.split(/(\s+)/)) {
        if (!part) continue
        if (part.trim()) {
          const span = document.createElement("span")
          span.className = "word-span"
          span.textContent = part
          spanIndex.set(span, out.length)
          out.push(span)
          frag.appendChild(span)
        } else {
          frag.appendChild(document.createTextNode(part))
        }
      }
      root.replaceChild(frag, node)
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as Element
      if (el.classList.contains("word-span")) {
        // Already wrapped by an earlier pass over this same copy: collect it
        // rather than skipping, so re-wrapping still yields the full list.
        spanIndex.set(el, out.length)
        out.push(el as HTMLSpanElement)
        continue
      }
      if (el.matches(UNSPOKEN_SELECTOR)) continue
      wrapWordsIn(el, out)
    }
  }
}

/**
 * Wrap the narrated text of the page, in the order it is read out: the
 * heading lines first, then the article's own blocks.
 *
 * Returns which block each word came from as well, which is what keeps a
 * sentence from running out of a heading and into the paragraph below it.
 */
function wrapNarratedWords(
  headings: Element[],
  article: Element,
): { spans: HTMLSpanElement[]; blockIds: Int32Array } {
  const out: HTMLSpanElement[] = []
  const blocks: number[] = []
  let block = 0

  const wrapBlock = (element: Element) => {
    const before = out.length
    wrapWordsIn(element, out)
    for (let i = before; i < out.length; i++) blocks.push(block)
    block++
  }

  for (const heading of headings) wrapBlock(heading)
  for (const element of Array.from(article.querySelectorAll(WRAPPABLE_SELECTOR))) {
    if (element.closest(UNSPOKEN_SELECTOR)) continue
    wrapBlock(element)
  }
  return { spans: out, blockIds: Int32Array.from(blocks) }
}

/**
 * Underline the sentence being narrated.
 *
 * Drawn as a thin element under each line the sentence covers, rather than as
 * a text decoration. Every decoration route comes out dashed: a class on the
 * words leaves the spaces between them bare, and a highlight range is painted
 * per element, so a sentence split into word spans breaks at every span.
 * Drawing it also puts the rule below the word highlight rather than inside
 * its background box, where the highlight would cut through it.
 */
const SENTENCE_RULE_GAP = 2

function sentenceRange(index: number): Range | null {
  if (index < 0 || !sentenceOf) return null
  let first = -1
  let last = -1
  for (let i = 0; i < sentenceOf.length; i++) {
    if (sentenceOf[i] !== index) continue
    if (first < 0) first = i
    last = i
  }
  if (first < 0 || !spans[first] || !spans[last]) return null
  const range = document.createRange()
  range.setStartBefore(spans[first])
  range.setEndAfter(spans[last])
  return range
}

/**
 * One rectangle per line of the sentence.
 *
 * A range over wrapped words reports a rectangle per span, so they are merged
 * by the line they sit on -- otherwise the rule would be drawn in fragments
 * with a gap at every space.
 */
function lineRects(range: Range): DOMRect[] {
  const lines: DOMRect[] = []
  for (const rect of Array.from(range.getClientRects())) {
    if (rect.width <= 0 || rect.height <= 0) continue
    const line = lines.find((l) => Math.abs(l.bottom - rect.bottom) < rect.height / 2)
    if (!line) {
      lines.push(new DOMRect(rect.x, rect.y, rect.width, rect.height))
      continue
    }
    const left = Math.min(line.left, rect.left)
    const right = Math.max(line.right, rect.right)
    const top = Math.min(line.top, rect.top)
    const bottom = Math.max(line.bottom, rect.bottom)
    lines[lines.indexOf(line)] = new DOMRect(left, top, right - left, bottom - top)
  }
  return lines
}

/**
 * Position the rules in page coordinates, so scrolling does not move them and
 * only a reflow -- a resize, a font arriving -- needs them recomputed.
 */
function drawSentenceRule(): void {
  const range = sentenceRange(activeSentence)
  const rects = range ? lineRects(range) : []

  while (sentenceRules.length < rects.length) {
    const rule = document.createElement("div")
    rule.className = "sentence-rule"
    rule.hidden = true
    document.body.appendChild(rule)
    sentenceRules.push(rule)
  }
  for (let i = 0; i < sentenceRules.length; i++) {
    const rule = sentenceRules[i]
    const rect = rects[i]
    if (!rect) {
      rule.hidden = true
      continue
    }
    rule.style.left = `${rect.left + window.scrollX}px`
    rule.style.top = `${rect.bottom + window.scrollY + SENTENCE_RULE_GAP}px`
    rule.style.width = `${rect.width}px`
    rule.hidden = false
  }
}

function markSentence(index: number): void {
  if (index === activeSentence) return
  activeSentence = index
  drawSentenceRule()
}

/**
 * Where the active word sits on screen, or null if it has no position.
 *
 * A word inside a hidden element reports a zero-size rect at the document
 * origin. Treating that as a real position makes the page scroll toward the
 * top on every highlight step.
 */
function activeWordRect(): DOMRect | null {
  if (activeIdx < 0) return null
  const el = spans[activeIdx]
  if (!el) return null
  const rect = el.getBoundingClientRect()
  if (rect.width === 0 && rect.height === 0) return null
  return rect
}

/** The paragraph, heading or caption the active word belongs to. */
function activeBlock(): Element | null {
  if (activeIdx < 0) return null
  return spans[activeIdx]?.closest(WRAPPABLE_SELECTOR) ?? null
}

/**
 * Glide the page so that `offset` (a viewport-relative y) ends up at
 * `fraction` of the viewport height.
 *
 * Driven by window.scrollTo rather than scrollIntoView so the movement reads
 * as motion rather than a jump, and because scrollTo raises only scroll
 * events -- the manual-scroll detection below listens for input events, so
 * this cannot cancel its own follow.
 */
function glideTo(offset: number, fraction: number): void {
  const start = window.scrollY
  const target = scrollTargetFor(offset, window.innerHeight, start, fraction)
  const delta = target - start
  if (Math.abs(delta) < 1) return

  cancelGlide?.()
  let frame = 0
  let cancelled = false
  const began = performance.now()

  const step = (now: number) => {
    if (cancelled) return
    const progress = Math.min(1, (now - began) / FOLLOW_SCROLL_MS)
    window.scrollTo(0, start + delta * easeInOutQuad(progress))
    if (progress < 1) frame = requestAnimationFrame(step)
    else cancelGlide = null
  }
  frame = requestAnimationFrame(step)

  cancelGlide = () => {
    cancelled = true
    cancelAnimationFrame(frame)
    cancelGlide = null
  }
}

/** Bring the active word to the reading line, wherever it currently is. */
function glideActiveWordIntoPlace(): void {
  const rect = activeWordRect()
  if (!rect) return
  glideTo(centreOf(rect.top, rect.height), FOLLOW_TARGET)
}

/**
 * Move the page with the narration, at paragraph boundaries.
 *
 * Scrolling whenever the active word crosses a fixed line makes the text
 * creep continuously and leaves the reader mid-paragraph at an arbitrary
 * position. Moving when the narration reaches a new paragraph matches how the
 * text is actually structured, so the page settles between paragraphs rather
 * than inside them.
 *
 * The word-level band is kept only as a safety net, for paragraphs taller
 * than the viewport where waiting for the next one would lose the reader.
 */
function followActiveWord(): void {
  const rect = activeWordRect()
  if (!rect) return
  const block = activeBlock()

  if (block && block !== followedBlock) {
    followedBlock = block
    const blockTop = block.getBoundingClientRect().top
    if (shouldFollowNewBlock(blockTop, window.innerHeight)) {
      glideTo(blockTop, FOLLOW_BLOCK_TOP)
      return
    }
  }

  if (isOutsideFollowBand(centreOf(rect.top, rect.height), window.innerHeight)) {
    glideActiveWordIntoPlace()
  }
}

function ensurePill(): HTMLButtonElement {
  if (pill && pill.isConnected) return pill
  pill = document.createElement("button")
  pill.id = "jump-to-current"
  pill.className = "jump-to-current"
  pill.type = "button"
  pill.hidden = true
  pill.addEventListener("click", () => {
    followMode = true
    glideActiveWordIntoPlace()
    updatePill()
  })
  document.body.appendChild(pill)
  return pill
}

/**
 * Offer a way back to the narration once the reader has scrolled away.
 *
 * Only shown when following is off and the word is well outside the
 * viewport, so a word just past the fold does not nag.
 */
function updatePill(): void {
  const button = ensurePill()
  const rect = activeWordRect()
  if (followMode || !seekArmed || !rect) {
    button.hidden = true
    return
  }
  const direction = offscreenDirection(rect.top, rect.bottom, window.innerHeight)
  if (!direction) {
    button.hidden = true
    return
  }
  button.textContent = (direction === "above" ? "↑" : "↓") + " Move & Follow"
  button.hidden = false
}

/**
 * Which figure caption each word sits in, as an id per word (-1 outside any
 * caption), so the parking algorithm can stay free of the DOM.
 */
function captionIds(wordSpans: HTMLSpanElement[]): Int32Array {
  const ids = new Int32Array(wordSpans.length).fill(-1)
  const seen = new Map<Element, number>()
  for (let i = 0; i < wordSpans.length; i++) {
    const caption = wordSpans[i].closest("figcaption")
    if (!caption) continue
    let id = seen.get(caption)
    if (id === undefined) {
      id = seen.size
      seen.set(caption, id)
    }
    ids[i] = id
  }
  return ids
}

/**
 * Highlight a range of words.
 *
 * Usually one word. A figure announcement highlights the figure's label --
 * "Figure 1.2" -- which is two words, so that what the narration just said
 * matches what is marked on the page.
 */
function setActive(start: number, end: number = start): void {
  markSentence(start >= 0 && sentenceOf ? (sentenceOf[start] ?? -1) : -1)
  if (start === activeIdx && end === activeEnd) return
  for (let i = activeIdx; activeIdx >= 0 && i <= activeEnd; i++) {
    spans[i]?.classList.remove("word-active")
  }
  activeIdx = start
  activeEnd = end
  if (start >= 0 && start < spans.length) {
    for (let i = start; i <= end && i < spans.length; i++) {
      spans[i]?.classList.add("word-active")
    }
    if (followMode) followActiveWord()
  }
  updatePill()
}

function syncHighlight(time: number): void {
  if (!spokenWords.length || !spans.length || !spokenToWritten) return
  const spokenIdx = findWordIndex(spokenWords, time)
  if (spokenIdx < 0) {
    setActive(-1, -1)
    return
  }
  const start = spokenToWritten[spokenIdx] ?? -1
  setActive(start, parkEnd ? parkEnd[spokenIdx] : start)
}

/**
 * Turn manual scrolling off follow mode.
 *
 * Listens for input events rather than the scroll event: follow's own
 * scrolling raises scroll, so using it here would switch follow off the
 * moment it engaged.
 */
function onManualScroll(): void {
  cancelGlide?.()
  if (followMode) {
    followMode = false
    updatePill()
  }
}

/**
 * Seek to a clicked word.
 *
 * Only active while this page's narration is playing, so the rest of the
 * time the words behave as ordinary text -- selectable, with working links.
 */
function onArticleClick(event: MouseEvent): void {
  if (!seekArmed || !writtenToSpoken) return
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return

  const target = event.target
  if (!(target instanceof Element)) return
  const span = target.closest(".word-span")
  if (!span) return
  // Let glossary terms and citations navigate as usual.
  if (span.closest("a")) return
  // Ignore the click that completes a text selection.
  const selection = window.getSelection()
  if (selection && !selection.isCollapsed) return

  const idx = spanIndex.get(span)
  if (idx === undefined) return
  const spokenIdx = writtenToSpoken[idx]
  if (spokenIdx < 0) return
  const audio = getAudio()
  if (!audio) return

  audio.currentTime = spokenWords[spokenIdx].s
  // Clicking a word means "read along from here".
  followMode = true
  updatePill()
}

function setArmed(armed: boolean): void {
  seekArmed = armed
  for (const root of roots) root.classList.toggle("read-along-active", armed)
  updatePill()
}

function cleanup(): void {
  for (const off of teardown) off()
  teardown = []
  cancelGlide?.()
  spokenWords = []
  // Drop the highlight before the spans are forgotten. Re-wrapping after a
  // breakpoint change builds a fresh list, and a leftover .word-active on the
  // copy that is now hidden reappears the moment the reader resizes back.
  for (const span of spans) span.classList.remove("word-active")
  spans = []
  spanIndex = new WeakMap()
  spokenToWritten = null
  writtenToSpoken = null
  activeIdx = -1
  activeEnd = -1
  parkEnd = null
  sentenceOf = null
  activeSentence = -1
  for (const rule of sentenceRules) rule.hidden = true
  followMode = true
  followedBlock = null
  seekArmed = false
  pageAudioUrl = ""
  article = null
  roots = []
  if (pill) pill.hidden = true
}

function on(
  target: EventTarget,
  type: string,
  handler: EventListenerOrEventListenerObject,
  options?: AddEventListenerOptions,
): void {
  target.addEventListener(type, handler, options)
  teardown.push(() => target.removeEventListener(type, handler, options))
}

function initWordHighlight(): void {
  cleanup()

  const pageData = document.getElementById("audio-page-data")
  const wordsUrl = pageData?.dataset.wordsUrl ?? ""
  if (!wordsUrl) return

  pageAudioUrl = pageData?.dataset.audioUrl ?? ""
  article = pickArticle()
  const audio = getAudio()
  if (!article || !audio) return
  roots = [...pickHeadings(), article]

  fetch(wordsUrl)
    .then((response) => response.json())
    .then((data: WordEntry[]) => {
      const target = article
      if (!Array.isArray(data) || !data.length || !target) return
      spokenWords = data
      const wrapped = wrapNarratedWords(pickHeadings(), target)
      spans = wrapped.spans

      const writtenWords = spans.map((span) => span.textContent ?? "")
      sentenceOf = groupSentences(writtenWords, wrapped.blockIds)
      const alignment = alignWords(
        spokenWords.map((word) => word.w),
        writtenWords,
      )
      const parked = parkAnnouncements(
        alignment.spokenToWritten,
        writtenWords,
        captionIds(spans),
      )
      spokenToWritten = parked.spokenToWritten
      writtenToSpoken = alignment.writtenToSpoken
      parkEnd = parked.parkEnd

      // Transcript timestamps are used as-is, with no correction factor.
      //
      // An earlier version scaled every timestamp by
      // lastWordEnd / audio.duration, inherited from when the audio was
      // variable bitrate and the browser's reported position could not be
      // trusted. With constant bitrate the position is accurate and that
      // ratio measures nothing useful: it is the trailing silence after the
      // last word, roughly 0.3s whatever the file's length (0.37s of 231s,
      // 0.25s of 1201s, 0.33s of 1372s). Real drift would scale with
      // duration.
      //
      // It was also actively harmful. This element persists across
      // client-side navigation so playback survives moving between pages,
      // which means that on arriving at a new section it still holds the
      // previous one. The factor was computed from this section's transcript
      // over the previous section's duration -- 5.19 going from 1.1 to 1.2 --
      // and nothing recalculated it, so the highlight stayed wrong until a
      // full reload. Please don't reintroduce it without a measurement
      // showing genuine drift.
      const sync = () => {
        if (!audioMatchesPage(audio)) return
        syncHighlight(audio.currentTime)
      }

      on(audio, "timeupdate", sync)
      on(audio, "seeked", sync)

      // Clicking a word is only offered while this page's narration is
      // actually playing. Derive that from the element's own state rather
      // than tracking it per event: on the first play the source is still
      // being selected, so `play` can arrive before the element knows what
      // it is loading, and `loadstart` can arrive after playback began.
      const refreshArmed = () => setArmed(!audio.paused && audioMatchesPage(audio))
      for (const event of ["play", "playing", "pause", "ended", "emptied", "loadeddata"]) {
        on(audio, event, refreshArmed)
      }
      // A new source means any highlight on screen belongs to the old one.
      on(audio, "loadstart", () => {
        setActive(-1, -1)
        refreshArmed()
      })

      for (const root of roots) on(root, "click", onArticleClick as EventListener)
      on(window, "wheel", onManualScroll, { passive: true })
      on(window, "touchmove", onManualScroll, { passive: true })
      on(window, "keydown", ((event: KeyboardEvent) => {
        // Escape leaves read-along by pausing, so resuming re-arms it.
        if (event.key === "Escape" && seekArmed) {
          audio.pause()
          return
        }
        if (SCROLL_KEYS.has(event.key)) onManualScroll()
      }) as EventListener)

      // The layout renders the chapter once per breakpoint and shows one
      // copy. Resizing across that breakpoint hides the copy whose words are
      // wrapped, leaving the reader with text that neither highlights nor
      // responds to clicks, so re-wrap the copy that is now on screen.
      let resizeTimer: ReturnType<typeof setTimeout> | undefined
      on(window, "resize", () => {
        clearTimeout(resizeTimer)
        resizeTimer = setTimeout(() => {
          const visible = pickArticle()
          if (visible && visible !== article) initWordHighlight()
          // The rules are positioned from measured text, so a reflow leaves
          // them behind even when the same copy stays on screen.
          else drawSentenceRule()
        }, 200)
      })
      teardown.push(() => clearTimeout(resizeTimer))

      let pending = false
      on(
        window,
        "scroll",
        () => {
          if (pending) return
          pending = true
          requestAnimationFrame(() => {
            pending = false
            updatePill()
          })
        },
        { passive: true },
      )

      // Arriving mid-playback (a client-side navigation while listening)
      // should pick the highlight up where the narration already is.
      refreshArmed()
      if (audio.currentTime > 0) sync()
    })
    .catch(() => {
      // No timings for this section: leave the text exactly as rendered.
    })
}

document.addEventListener("astro:page-load", initWordHighlight)
document.addEventListener("astro:before-swap", cleanup)
