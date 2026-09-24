/** Service worker wiring: register, check for updates, and tell the page when a new version took over. */

const UPDATE_EVENT = 'gym-log:update'
const RECHECK_MS = 5 * 60 * 1000

let updateReady = false
let lastCheck = 0

export function isUpdateReady() {
  return updateReady
}

export function onUpdateReady(cb: () => void): () => void {
  window.addEventListener(UPDATE_EVENT, cb)
  return () => window.removeEventListener(UPDATE_EVENT, cb)
}

export function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return
  if (!import.meta.env.PROD) {
    // A worker left over from an older build would serve stale files in dev.
    void navigator.serviceWorker.getRegistrations().then((regs) => regs.forEach((r) => void r.unregister()))
    return
  }
  const hadController = navigator.serviceWorker.controller != null
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    // First install also fires this; only a swap from an older worker is an update.
    if (!hadController || updateReady) return
    updateReady = true
    window.dispatchEvent(new Event(UPDATE_EVENT))
  })
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register(`${import.meta.env.BASE_URL}sw.js`, { updateViaCache: 'none' })
      .then(() => {
        lastCheck = Date.now()
      })
      .catch(() => {
        /* offline cache is optional */
      })
  })
  // iOS resumes a home-screen app without reloading it, so look for a new build on the way back in.
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState !== 'visible' || Date.now() - lastCheck < RECHECK_MS) return
    void checkForUpdate()
  })
}

export type UpdateCheck = 'found' | 'none' | 'unsupported'

export async function checkForUpdate(): Promise<UpdateCheck> {
  if (!('serviceWorker' in navigator)) return 'unsupported'
  const reg = await navigator.serviceWorker.getRegistration()
  if (!reg) return 'unsupported'
  lastCheck = Date.now()
  try {
    await reg.update()
  } catch {
    return 'none'
  }
  if (updateReady || reg.installing || reg.waiting) return 'found'
  return 'none'
}
