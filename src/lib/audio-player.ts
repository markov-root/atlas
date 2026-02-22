import { navigate } from 'astro:transitions/client'

// --- Types ---

type AudioState = {
  url: string
  title: string
  time: number
  speed: number
  playing: boolean
  nextUrl: string
  nextAudioUrl: string
}

type PageData = {
  audioUrl: string
  sectionTitle: string
  nextUrl: string
  nextAudioUrl: string
}

// --- State ---

let audioPlayerActive = false
let autoAdvancing = false
let currentSpeed = 1
let currentTitle = ''
let currentNextUrl = ''
let currentNextAudioUrl = ''
let inlinePlayerObserver: IntersectionObserver | null = null
let inlinePlayerVisible = false
let inlinePlayerSynced = false

// --- Helpers ---

function toAbsolute(url: string): string {
  if (!url) return ''
  try {
    return new URL(url, location.origin).href
  } catch {
    return url
  }
}

function getPageData(): PageData | null {
  const el = document.getElementById('audio-page-data')
  if (!el) return null
  return {
    audioUrl: toAbsolute(el.dataset.audioUrl || ''),
    sectionTitle: el.dataset.sectionTitle || '',
    nextUrl: el.dataset.nextUrl || '',
    nextAudioUrl: el.dataset.nextAudioUrl || '',
  }
}

function getAudio(): HTMLAudioElement | null {
  return document.getElementById('audio-element') as HTMLAudioElement | null
}

function formatTime(seconds: number): string {
  if (!isFinite(seconds) || seconds < 0) return '0:00'
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

// --- Render functions ---

function renderPlayPause(playing: boolean) {
  // Persistent players (desktop/mobile) always reflect the global audio state
  document.querySelectorAll('#desktop-audio-player .audio-icon-play').forEach(el => el.classList.toggle('hidden', playing))
  document.querySelectorAll('#desktop-audio-player .audio-icon-pause').forEach(el => el.classList.toggle('hidden', !playing))

  // Inline player only reflects state when synced
  const inlinePlayer = document.getElementById('inline-audio-player')
  if (inlinePlayer) {
    const inlinePlaying = inlinePlayerSynced && playing
    inlinePlayer.querySelectorAll('.audio-icon-play').forEach(el => el.classList.toggle('hidden', inlinePlaying))
    inlinePlayer.querySelectorAll('.audio-icon-pause').forEach(el => el.classList.toggle('hidden', !inlinePlaying))
  }
}

function renderProgress(current: number, duration: number) {
  const pct = duration > 0 ? (current / duration) * 100 : 0
  const pctStr = `${pct}%`

  const desktopBar = document.getElementById('desktop-progress-bar')
  const desktopHandle = document.getElementById('desktop-progress-handle')

  if (desktopBar) desktopBar.style.width = pctStr
  if (desktopHandle) desktopHandle.style.left = pctStr

  const currentStr = formatTime(current)
  const durationStr = formatTime(duration)

  const dCurrent = document.getElementById('desktop-time-current')
  const dDuration = document.getElementById('desktop-time-duration')

  if (dCurrent) dCurrent.textContent = currentStr
  if (dDuration) dDuration.textContent = durationStr

  if (inlinePlayerSynced) {
    const inlineBar = document.getElementById('inline-progress-bar')
    const inlineHandle = document.getElementById('inline-progress-handle')
    const iCurrent = document.getElementById('inline-time-current')
    const iDuration = document.getElementById('inline-time-duration')

    if (inlineBar) inlineBar.style.width = pctStr
    if (inlineHandle) inlineHandle.style.left = pctStr
    if (iCurrent) iCurrent.textContent = currentStr
    if (iDuration) iDuration.textContent = durationStr
  }
}

function renderTitle(title: string) {
  currentTitle = title
  const dt = document.getElementById('desktop-track-title')
  if (dt) dt.textContent = title
  if (inlinePlayerSynced) {
    const it = document.getElementById('inline-track-title')
    if (it) it.textContent = title
  }
}

function renderSpeed() {
  document.querySelectorAll<HTMLSelectElement>('select[data-audio-speed]').forEach(el => {
    el.value = String(currentSpeed)
  })
}

function resetInlineUI() {
  const inlineBar = document.getElementById('inline-progress-bar')
  const inlineHandle = document.getElementById('inline-progress-handle')
  const iCurrent = document.getElementById('inline-time-current')
  const iDuration = document.getElementById('inline-time-duration')
  if (inlineBar) inlineBar.style.width = '0%'
  if (inlineHandle) inlineHandle.style.left = '0%'
  if (iCurrent) iCurrent.textContent = '0:00'
  if (iDuration) iDuration.textContent = '0:00'
}

// --- Player visibility ---

function showPlayer() {
  audioPlayerActive = true
  if (!inlinePlayerVisible) {
    document.getElementById('desktop-audio-player')?.classList.remove('hidden')
  }
}

function hidePlayer() {
  audioPlayerActive = false
  document.getElementById('desktop-audio-player')?.classList.add('hidden')
}

// --- Persistence ---

function saveAudioState() {
  const audio = getAudio()
  if (!audio || !audio.src) return
  const state: AudioState = {
    url: audio.src,
    title: currentTitle,
    time: audio.currentTime,
    speed: currentSpeed,
    playing: !audio.paused,
    nextUrl: currentNextUrl,
    nextAudioUrl: currentNextAudioUrl,
  }
  try { localStorage.setItem('atlas-audio-player', JSON.stringify(state)) } catch {}
}

function loadAudioState(): AudioState | null {
  try {
    const raw = localStorage.getItem('atlas-audio-player')
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}

function clearAudioState() {
  try { localStorage.removeItem('atlas-audio-player') } catch {}
}

// --- Media Session ---

function updateMediaSession(playing: boolean) {
  if (!('mediaSession' in navigator)) return
  if (playing) {
    navigator.mediaSession.metadata = new MediaMetadata({
      title: currentTitle,
      artist: 'Atlas AI Safety',
    })
    navigator.mediaSession.setActionHandler('play', () => getAudio()?.play())
    navigator.mediaSession.setActionHandler('pause', () => getAudio()?.pause())
    navigator.mediaSession.setActionHandler('seekbackward', () => {
      const a = getAudio()
      if (a) a.currentTime = Math.max(0, a.currentTime - 15)
    })
    navigator.mediaSession.setActionHandler('seekforward', () => {
      const a = getAudio()
      if (a) a.currentTime = Math.min(a.duration || 0, a.currentTime + 15)
    })
  } else {
    navigator.mediaSession.metadata = null
    navigator.mediaSession.setActionHandler('play', null)
    navigator.mediaSession.setActionHandler('pause', null)
    navigator.mediaSession.setActionHandler('seekbackward', null)
    navigator.mediaSession.setActionHandler('seekforward', null)
  }
}

// --- Core actions ---

function startAudio(url: string, title: string, nextUrl: string, nextAudioUrl: string) {
  const audio = getAudio()
  if (!audio) return

  const absUrl = toAbsolute(url)

  // If same URL is already loaded and playing, just update metadata
  if (audio.src === absUrl && !audio.paused) {
    currentNextUrl = nextUrl
    currentNextAudioUrl = nextAudioUrl
    inlinePlayerSynced = true
    renderTitle(title)
    return
  }

  audio.src = absUrl
  audio.playbackRate = currentSpeed
  currentNextUrl = nextUrl
  currentNextAudioUrl = nextAudioUrl
  inlinePlayerSynced = true
  renderTitle(title)
  showPlayer()
  audio.play().catch(() => {})
}

function stopAudio() {
  const audio = getAudio()
  if (audio) {
    audio.pause()
    audio.removeAttribute('src')
    audio.load()
  }
  inlinePlayerSynced = false
  hidePlayer()
  renderPlayPause(false)
  renderProgress(0, 0)
  clearAudioState()
  updateMediaSession(false)
}

// --- Seek helper ---

function handleSeek(e: MouseEvent, bar: HTMLElement) {
  const rect = bar.getBoundingClientRect()
  const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
  const audio = getAudio()
  if (audio && audio.duration) {
    audio.currentTime = pct * audio.duration
  }
}

// --- IntersectionObserver for inline/desktop toggle ---

function setupInlinePlayerObserver() {
  if (inlinePlayerObserver) {
    inlinePlayerObserver.disconnect()
    inlinePlayerObserver = null
  }

  const inlinePlayer = document.getElementById('inline-audio-player')
  if (!inlinePlayer) {
    inlinePlayerVisible = false
    if (audioPlayerActive) {
      document.getElementById('desktop-audio-player')?.classList.remove('hidden')
    }
    return
  }

  inlinePlayerVisible = true

  inlinePlayerObserver = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      inlinePlayerVisible = entry.isIntersecting
      if (!audioPlayerActive) continue
      const desktopPlayer = document.getElementById('desktop-audio-player')
      if (!desktopPlayer) continue
      // Only hide desktop player when inline is visible AND synced to current audio
      if (entry.isIntersecting && inlinePlayerSynced) {
        desktopPlayer.classList.add('hidden')
      } else {
        desktopPlayer.classList.remove('hidden')
      }
    }
  }, { threshold: 0 })

  inlinePlayerObserver.observe(inlinePlayer)
}

// --- Public API ---

/** Call once on initial page load. Registers all global event listeners. */
export function setup() {
  // Audio element events
  const audio = getAudio()
  if (audio) {
    audio.addEventListener('timeupdate', () => {
      renderProgress(audio.currentTime, audio.duration)
      saveAudioState()
    })

    audio.addEventListener('play', () => {
      renderPlayPause(true)
      updateMediaSession(true)
    })

    audio.addEventListener('pause', () => {
      renderPlayPause(false)
      saveAudioState()
    })

    audio.addEventListener('loadedmetadata', () => {
      renderProgress(audio.currentTime, audio.duration)
    })

    audio.addEventListener('ended', () => {
      renderPlayPause(false)
      if (currentNextUrl && currentNextAudioUrl) {
        autoAdvancing = true
        navigate(currentNextUrl)
      } else {
        stopAudio()
      }
    })
  }

  // Click delegation
  document.addEventListener('click', (e) => {
    const target = e.target as HTMLElement

    // Listen button
    const listenBtn = target.closest('[data-audio-listen]')
    if (listenBtn) {
      e.preventDefault()
      const a = getAudio()
      const pd = getPageData()
      if (!a || !pd || !pd.audioUrl) return
      if (a.src === pd.audioUrl) {
        if (a.paused) a.play().catch(() => {})
        else a.pause()
      } else {
        startAudio(pd.audioUrl, pd.sectionTitle, pd.nextUrl, pd.nextAudioUrl)
      }
      return
    }

    // Play/pause
    const playPauseBtn = target.closest('[data-audio-playpause]')
    if (playPauseBtn) {
      e.preventDefault()
      const a = getAudio()
      if (!a) return
      if (!a.src) {
        const pd = getPageData()
        if (pd && pd.audioUrl) {
          startAudio(pd.audioUrl, pd.sectionTitle, pd.nextUrl, pd.nextAudioUrl)
        }
        return
      }
      if (a.paused) a.play().catch(() => {})
      else a.pause()
      return
    }

    // Skip
    const skipBtn = target.closest('[data-audio-skip]')
    if (skipBtn) {
      e.preventDefault()
      const a = getAudio()
      if (!a) return
      const delta = parseInt(skipBtn.getAttribute('data-audio-skip') || '0', 10)
      a.currentTime = Math.max(0, Math.min(a.duration || 0, a.currentTime + delta))
      return
    }

    // Close
    const closeBtn = target.closest('[data-audio-close]')
    if (closeBtn) {
      e.preventDefault()
      stopAudio()
      return
    }
  })

  // Speed select
  document.addEventListener('change', (e) => {
    const select = (e.target as HTMLElement).closest('select[data-audio-speed]') as HTMLSelectElement | null
    if (!select) return
    currentSpeed = parseFloat(select.value)
    const a = getAudio()
    if (a) a.playbackRate = currentSpeed
    renderSpeed()
  })

  // Seek bar click/drag
  document.addEventListener('mousedown', (e) => {
    const bar = (e.target as HTMLElement).closest('[data-audio-seek]') as HTMLElement | null
    if (!bar) return
    e.preventDefault()
    handleSeek(e, bar)

    const onMove = (ev: MouseEvent) => handleSeek(ev, bar)
    const onUp = () => {
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
    }
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
  })
}

/** Call on each client-side navigation to sync player state with the current page. */
export function onNavigate() {
  setupInlinePlayerObserver()

  const audio = getAudio()
  const pd = getPageData()

  // Auto-advance from previous section
  if (autoAdvancing && pd) {
    autoAdvancing = false
    if (pd.audioUrl) {
      startAudio(pd.audioUrl, pd.sectionTitle, pd.nextUrl, pd.nextAudioUrl)
    }
    return
  }

  // Sync player state with current page
  if (audioPlayerActive && pd && audio && audio.src) {
    const isCurrentPage = pd.audioUrl && audio.src === pd.audioUrl
    inlinePlayerSynced = !!isCurrentPage
    if (isCurrentPage) {
      currentNextUrl = pd.nextUrl
      currentNextAudioUrl = pd.nextAudioUrl
      renderTitle(pd.sectionTitle)
    }
    renderProgress(audio.currentTime, audio.duration)
    renderPlayPause(!audio.paused)
    renderSpeed()

    if (!isCurrentPage) {
      resetInlineUI()
    }
    return
  }

  // Cold load: restore from localStorage
  if (!audioPlayerActive && !autoAdvancing) {
    const saved = loadAudioState()
    if (saved && saved.url && audio) {
      audio.src = saved.url
      currentSpeed = saved.speed || 1
      audio.playbackRate = currentSpeed
      currentTitle = saved.title || ''
      currentNextUrl = saved.nextUrl || ''
      currentNextAudioUrl = saved.nextAudioUrl || ''
      renderTitle(currentTitle)
      renderSpeed()
      showPlayer()

      const restoreTime = saved.time || 0
      const onMeta = () => {
        audio.currentTime = restoreTime
        renderProgress(restoreTime, audio.duration)
        audio.removeEventListener('loadedmetadata', onMeta)
      }
      audio.addEventListener('loadedmetadata', onMeta)
      audio.load()
      renderPlayPause(false)
    }
  }
}
