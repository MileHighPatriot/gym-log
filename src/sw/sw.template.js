/* Gym Log service worker. vite.config.ts fills in BUILD_ID and PRECACHE at build time. */
const BUILD_ID = '__BUILD_ID__'
const PRECACHE = __PRECACHE__

const SHELL = `gym-log-shell-${BUILD_ID}`
const MEDIA = 'gym-log-media-v1'
const FONTS = 'gym-log-fonts-v1'
const KEEP = [SHELL, MEDIA, FONTS]
const MEDIA_MAX = 80
const NAV_TIMEOUT_MS = 3000

const scoped = (path) => new URL(path, self.registration.scope).href
const INDEX = scoped('index.html')

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(SHELL).then((cache) => cache.addAll(PRECACHE.map(scoped))))
  // A home-screen app on iOS almost never fully closes, so a waiting worker could wait forever.
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      // Other apps share this github.io origin. Only ever touch our own caches.
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('gym-log-') && !KEEP.includes(k)).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (event) => {
  const req = event.request
  if (req.method !== 'GET') return
  // Safari asks for video in byte ranges. Let the network answer those.
  if (req.headers.has('range')) return
  const url = new URL(req.url)
  if (url.pathname.endsWith('.mp4')) return

  if (req.mode === 'navigate') {
    event.respondWith(networkFirst(req))
    return
  }
  const sameOrigin = url.origin === self.location.origin
  if (sameOrigin && url.pathname.includes('/assets/')) {
    event.respondWith(cacheFirst(req, SHELL))
    return
  }
  if (sameOrigin && /\/exercises\/.+\.(jpe?g|png|webp)$/.test(url.pathname)) {
    event.respondWith(cacheFirst(req, MEDIA, MEDIA_MAX))
    return
  }
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    event.respondWith(staleWhileRevalidate(req, FONTS))
    return
  }
  if (sameOrigin && PRECACHE.some((p) => scoped(p) === url.href)) {
    event.respondWith(cacheFirst(req, SHELL))
  }
})

const usable = (res) => res && (res.ok || res.type === 'opaque')

/** Fresh page when the gym Wi-Fi cooperates; the cached one after a few seconds when it doesn't. */
async function networkFirst(req) {
  const cache = await caches.open(SHELL)
  const fresh = fetch(req).then((res) => {
    if (res.ok) void cache.put(INDEX, res.clone())
    return res
  })
  fresh.catch(() => {})
  const timeout = new Promise((resolve) => setTimeout(resolve, NAV_TIMEOUT_MS))
  try {
    const first = await Promise.race([fresh, timeout])
    if (first) return first
  } catch {
    /* offline: fall through to the cache */
  }
  const cached = await cache.match(INDEX)
  if (cached) return cached
  return fresh
}

async function cacheFirst(req, name, max) {
  const cache = await caches.open(name)
  const cached = await cache.match(req)
  if (cached) return cached
  const res = await fetch(req)
  if (usable(res)) {
    await cache.put(req, res.clone())
    if (max) void trim(cache, max)
  }
  return res
}

async function staleWhileRevalidate(req, name) {
  const cache = await caches.open(name)
  const cached = await cache.match(req)
  const fresh = fetch(req)
    .then((res) => {
      if (usable(res)) void cache.put(req, res.clone())
      return res
    })
    .catch(() => cached)
  return cached || fresh
}

async function trim(cache, max) {
  const keys = await cache.keys()
  for (const key of keys.slice(0, Math.max(0, keys.length - max))) await cache.delete(key)
}
