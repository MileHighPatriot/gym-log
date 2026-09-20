import { useEffect, useState } from 'react'

const DISMISS_KEY = 'gym-log-install-dismissed'

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

let deferred: BeforeInstallPromptEvent | null = null
if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault()
    deferred = e as BeforeInstallPromptEvent
  })
}

function isStandalone(): boolean {
  if (typeof window === 'undefined') return true
  return (
    window.matchMedia?.('(display-mode: standalone)').matches ||
    (navigator as { standalone?: boolean }).standalone === true
  )
}

function isIOS(): boolean {
  if (typeof navigator === 'undefined') return false
  return /iphone|ipad|ipod/i.test(navigator.userAgent)
}

/** "Add to home screen" nudge. Hidden once installed or dismissed. */
export function InstallBanner() {
  const [dismissed, setDismissed] = useState(() => {
    try {
      return localStorage.getItem(DISMISS_KEY) === '1'
    } catch {
      return false
    }
  })
  const [canPrompt, setCanPrompt] = useState(() => deferred != null)

  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault()
      deferred = e as BeforeInstallPromptEvent
      setCanPrompt(true)
    }
    window.addEventListener('beforeinstallprompt', onPrompt)
    return () => window.removeEventListener('beforeinstallprompt', onPrompt)
  }, [])

  if (dismissed || isStandalone()) return null
  if (!canPrompt && !isIOS()) return null

  const dismiss = () => {
    setDismissed(true)
    try {
      localStorage.setItem(DISMISS_KEY, '1')
    } catch {
      /* private mode */
    }
  }

  return (
    <div className="card install-card">
      <p className="eyebrow">Install</p>
      <h2>Put it on your home screen</h2>
      <p className="muted">
        {canPrompt
          ? 'Opens full-screen, works offline, no browser bar in the gym.'
          : 'Tap Share, then “Add to Home Screen”. Full-screen, offline, no browser bar.'}
      </p>
      <div className="row">
        {canPrompt && (
          <button
            type="button"
            className="primary"
            onClick={() => {
              const ev = deferred
              if (!ev) return
              void ev.prompt().then(() => ev.userChoice).then((choice) => {
                if (choice.outcome === 'accepted') dismiss()
                deferred = null
                setCanPrompt(false)
              })
            }}
          >
            Add to home screen
          </button>
        )}
        <button type="button" className="ghost" onClick={dismiss}>
          Not now
        </button>
      </div>
    </div>
  )
}

/** Thin bar shown while offline. Logging still works; the SW serves the app. */
export function OfflineBar() {
  const [online, setOnline] = useState(() => (typeof navigator === 'undefined' ? true : navigator.onLine))
  useEffect(() => {
    const up = () => setOnline(true)
    const down = () => setOnline(false)
    window.addEventListener('online', up)
    window.addEventListener('offline', down)
    return () => {
      window.removeEventListener('online', up)
      window.removeEventListener('offline', down)
    }
  }, [])
  if (online) return null
  return (
    <div className="offline-bar" role="status">
      Offline · logging still works · photo guesses will not
    </div>
  )
}
