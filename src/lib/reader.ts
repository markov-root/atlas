import { navigate } from 'astro:transitions/client'
import * as audioPlayer from './audio-player'

// --- Media tabs ---

const MEDIA_CONTAINER = '[data-media-tabs]'
const MEDIA_TAB = '[role="tab"][data-tab]'
const MEDIA_PANEL = '[role="tabpanel"]'

function selectTab(container: Element, tabId: string) {
  container.querySelectorAll<HTMLElement>(MEDIA_TAB).forEach((t) => {
    const isSelected = t.dataset.tab === tabId
    t.setAttribute('aria-selected', String(isSelected))
    t.tabIndex = isSelected ? 0 : -1
  })
  container.querySelectorAll<HTMLElement>(MEDIA_PANEL).forEach((p) => {
    p.classList.toggle('hidden', p.dataset.panel !== tabId)
  })
}

document.addEventListener('click', (e) => {
  const tab = (e.target as HTMLElement).closest(MEDIA_TAB) as HTMLElement | null
  if (!tab) return
  const container = tab.closest(MEDIA_CONTAINER)
  if (!container) return
  selectTab(container, tab.dataset.tab!)
})

document.addEventListener('keydown', (e) => {
  const tab = (e.target as HTMLElement).closest(MEDIA_TAB) as HTMLElement | null
  if (!tab) return
  const container = tab.closest(MEDIA_CONTAINER)
  if (!container) return
  const tabs = [...container.querySelectorAll<HTMLElement>(MEDIA_TAB)]
  const idx = tabs.indexOf(tab)
  let next: HTMLElement | undefined
  if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = tabs[(idx + 1) % tabs.length]
  else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') next = tabs[(idx - 1 + tabs.length) % tabs.length]
  if (next) {
    e.preventDefault()
    next.click()
    next.focus()
  }
})

// --- Notebox drilldown ---

let isInDrilldown = false
let savedScrollPosition = 0
let mobileSavedScrollPosition = 0

function showNotebox(noteboxId: string) {
  const wrapper = document.querySelector(`[data-notebox-id="${noteboxId}"]`)
  if (!wrapper) return

  const contentDiv = wrapper.querySelector('.notebox-content') as HTMLElement
  const title = contentDiv?.getAttribute('data-notebox-title') || ''
  const readingTime = contentDiv?.getAttribute('data-notebox-time') || ''
  const metaText = `Optional · ${readingTime} read`
  const contentHtml = contentDiv?.innerHTML || ''

  isInDrilldown = true

  // Desktop
  const mainView = document.getElementById('main-content-view')
  const drilldownView = document.getElementById('notebox-drilldown')
  const drilldownTitle = document.getElementById('notebox-title')
  const drilldownMeta = document.getElementById('notebox-meta')
  const drilldownBody = document.getElementById('notebox-body')

  if (mainView && drilldownView && drilldownTitle && drilldownBody) {
    savedScrollPosition = window.scrollY
    mainView.classList.add('hidden')
    drilldownView.classList.remove('hidden')
    drilldownTitle.textContent = title
    if (drilldownMeta) drilldownMeta.textContent = metaText
    drilldownBody.innerHTML = contentHtml
    window.scrollTo({ top: 0, behavior: 'instant' })
  }

  // Mobile
  const mobileMainView = document.getElementById('mobile-main-content-view')
  const mobileDrilldownView = document.getElementById('mobile-notebox-drilldown')
  const mobileDrilldownTitle = document.getElementById('mobile-notebox-title')
  const mobileDrilldownMeta = document.getElementById('mobile-notebox-meta')
  const mobileDrilldownBody = document.getElementById('mobile-notebox-body')

  if (mobileMainView && mobileDrilldownView && mobileDrilldownTitle && mobileDrilldownBody) {
    mobileSavedScrollPosition = window.scrollY
    mobileMainView.classList.add('hidden')
    mobileDrilldownView.classList.remove('hidden')
    mobileDrilldownTitle.textContent = title
    if (mobileDrilldownMeta) mobileDrilldownMeta.textContent = metaText
    mobileDrilldownBody.innerHTML = contentHtml
    window.scrollTo(0, 0)
  }
}

function hideNotebox() {
  isInDrilldown = false

  const mainView = document.getElementById('main-content-view')
  const drilldownView = document.getElementById('notebox-drilldown')
  const mobileMainView = document.getElementById('mobile-main-content-view')
  const mobileDrilldownView = document.getElementById('mobile-notebox-drilldown')

  if (mainView && drilldownView) {
    const pos = savedScrollPosition
    drilldownView.classList.add('hidden')
    mainView.classList.remove('hidden')
    requestAnimationFrame(() => { window.scrollTo(0, pos) })
  }

  if (mobileMainView && mobileDrilldownView) {
    const pos = mobileSavedScrollPosition
    mobileDrilldownView.classList.add('hidden')
    mobileMainView.classList.remove('hidden')
    requestAnimationFrame(() => { window.scrollTo(0, pos) })
  }
}

// Notebox trigger clicks (event delegation)
document.addEventListener('click', (e) => {
  const trigger = (e.target as HTMLElement).closest('.notebox-trigger')
  if (!trigger) return
  e.preventDefault()
  const wrapper = trigger.closest('.notebox-wrapper')
  const noteboxId = wrapper?.getAttribute('data-notebox-id')
  if (noteboxId) {
    history.pushState({ notebox: noteboxId }, '', `#${noteboxId}`)
    showNotebox(noteboxId)
  }
})

// Back button clicks (event delegation)
document.addEventListener('click', (e) => {
  const back = (e.target as HTMLElement).closest('#notebox-back, .notebox-back-mobile')
  if (!back) return
  e.preventDefault()
  history.replaceState(null, '', window.location.pathname + window.location.search)
  hideNotebox()
})

// Browser back/forward
window.addEventListener('popstate', () => {
  const hash = window.location.hash.slice(1)
  if (hash && hash.startsWith('notebox-')) {
    showNotebox(hash)
  } else if (isInDrilldown) {
    hideNotebox()
  }
})

// Reset scroll position on client-side navigation
document.addEventListener('astro:after-swap', () => {
  window.scrollTo(0, 0)
})

// --- Audio Player (delegated to audio-player.ts) ---

audioPlayer.setup()

// --- Reading position tracking ---

function saveReadingPosition() {
  const pageData = document.getElementById('audio-page-data')
  const url = window.location.pathname
  const match = url.match(/^\/chapters\/[^/]+\/[^/]+\/[^/]+/)
  if (!match) return

  const data: Record<string, string> = { url, timestamp: Date.now().toString() }
  if (pageData) {
    data.sectionTitle = pageData.dataset.sectionTitle || ''
    data.chapterTitle = pageData.dataset.chapterTitle || ''
    data.chapterNumber = pageData.dataset.chapterNumber || ''
    data.sectionNumber = pageData.dataset.sectionNumber || ''
  }
  try { localStorage.setItem('atlas-reading-position', JSON.stringify(data)) } catch {}
}

// --- Per-page init (re-runs on each client-side navigation) ---

let navController: AbortController | null = null

function initReader() {
  // Abort listeners from the previous navigation
  navController?.abort()
  navController = new AbortController()
  const { signal } = navController

  isInDrilldown = false

  saveReadingPosition()

  // Reading progress bar
  const progressBar = document.getElementById('reading-progress-bar')
  if (progressBar) {
    function updateProgress() {
      const scrollTop = window.scrollY
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight
      const progress = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0
      const clampedProgress = Math.min(100, Math.max(0, progress))
      progressBar!.style.width = `${clampedProgress}%`
    }
    window.addEventListener('scroll', updateProgress, { passive: true, signal })
    updateProgress()
  }

  // Handle initial hash
  const hash = window.location.hash.slice(1)
  if (hash && hash.startsWith('notebox-')) showNotebox(hash)

  // Mobile section navigation
  const mobileSectionSelect = document.getElementById('mobile-section-select') as HTMLSelectElement | null
  if (mobileSectionSelect) {
    mobileSectionSelect.addEventListener('change', () => {
      const url = mobileSectionSelect.value
      if (url?.startsWith('/')) navigate(url)
    }, { signal })
  }

  // Mobile chapter navigation
  const mobileChapterSelect = document.getElementById('mobile-chapter-select') as HTMLSelectElement | null
  if (mobileChapterSelect) {
    mobileChapterSelect.addEventListener('change', () => {
      const url = mobileChapterSelect.value
      if (url?.startsWith('/')) navigate(url)
    }, { signal })
  }

  // Copy markdown buttons
  document.querySelectorAll<HTMLElement>('[data-copy-markdown]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const url = btn.dataset.markdownUrl
      const label = btn.querySelector('[data-copy-label]')
      if (!url || !label) return
      try {
        label.textContent = 'Loading...'
        const res = await fetch(url)
        const markdown = await res.text()
        await navigator.clipboard.writeText(markdown)
        label.textContent = 'Copied!'
        setTimeout(() => { label.textContent = 'Copy markdown' }, 2000)
      } catch {
        label.textContent = 'Failed to copy'
        setTimeout(() => { label.textContent = 'Copy markdown' }, 2000)
      }
    }, { signal })
  })

  // Audio: sync player with current page
  audioPlayer.onNavigate()
}

initReader()
document.addEventListener('astro:page-load', initReader)
