/**
 * Development-only switch for which audio a section page plays.
 *
 * The read-along can be driven by two different files -- the locally staged
 * constant-bitrate copy or the published one -- and it also has to degrade
 * cleanly when a section has neither. Which of those a machine gets is
 * decided by what happens to be on disk, so without a switch two of the three
 * states can only be reached by moving files around or clearing credentials.
 *
 * The choice cannot be made on the server: chapter pages are prerendered, so
 * the dev server hands them neither the query string nor request headers.
 * Instead the page renders every candidate URL and this module applies the
 * stored choice to `#audio-page-data` before the player or the read-along
 * read it -- which is why `src/layouts/Reader.astro` imports it first.
 *
 * The layout renders a section once per breakpoint, so every element this
 * touches exists twice and both copies are updated: the reader may resize
 * across the breakpoint, and `getElementById` would only ever find the
 * desktop one.
 *
 * `import.meta.env.DEV` is a compile-time constant, so none of this reaches a
 * production build.
 */

const STORAGE_KEY = "atlas:dev-audio-source"

type Choice = "auto" | "cbr" | "cdn" | "none"

function isChoice(value: string | null): value is Choice {
  return value === "auto" || value === "cbr" || value === "cdn" || value === "none"
}

function storedChoice(): Choice {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    return isChoice(raw) ? raw : "auto"
  } catch {
    // Private browsing and blocked site data both throw here; the switch is a
    // convenience, so fall back to whatever the page already resolved.
    return "auto"
  }
}

/** Replace the player with the markup a section without audio renders. */
function removePlayer(): void {
  for (const data of document.querySelectorAll("#audio-page-data")) data.remove()
  for (const player of document.querySelectorAll("#inline-audio-player")) {
    const message = document.createElement("p")
    message.className = "text-sm text-gray-500"
    message.textContent = "Audio is not available for this section right now."
    player.replaceWith(message)
  }
}

function apply(): void {
  const choice = storedChoice()

  for (const button of document.querySelectorAll<HTMLElement>("[data-audio-source-option]")) {
    button.setAttribute("aria-current", String(button.dataset.audioSourceOption === choice))
  }

  const setLabel = (text: string) => {
    for (const label of document.querySelectorAll<HTMLElement>("[data-audio-source-label]")) {
      label.textContent = text
    }
  }

  if (choice === "none") {
    removePlayer()
    setLabel("none")
    return
  }
  if (choice === "auto") return

  const pageData = document.querySelectorAll<HTMLElement>("#audio-page-data")
  for (const data of pageData) {
    const url = choice === "cbr" ? data.dataset.audioUrlCbr : data.dataset.audioUrlCdn
    // The chosen source may not exist in this build. Leaving the page as
    // resolved is more useful than an empty player, and the switch already
    // strikes that option through.
    if (!url) return
    data.dataset.audioUrl = url
    data.dataset.audioSource = choice
  }
  if (pageData.length) setLabel(choice)
}

function onClick(event: Event): void {
  const button = (event.target as HTMLElement | null)?.closest<HTMLElement>(
    "[data-audio-source-option]",
  )
  const choice = button?.dataset.audioSourceOption
  if (!isChoice(choice ?? null)) return
  try {
    sessionStorage.setItem(STORAGE_KEY, choice as Choice)
  } catch {
    // Nothing to store the choice in; the reload below would lose it anyway.
    return
  }
  // Everything downstream reads the page data once, at load. Reloading is
  // both the simplest way to apply a change and the honest one: it is the
  // state the page would have been served in.
  location.reload()
}

if (import.meta.env.DEV) {
  apply()
  document.addEventListener("astro:page-load", apply)
  document.addEventListener("click", onClick)
}
