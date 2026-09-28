/* Karvan service worker — uygulama kabuğu ve harita karoları için önbellek. */
const VERSION = 'karvan-v1'
const SHELL_CACHE = `${VERSION}-shell`
const TILE_CACHE = `${VERSION}-tiles`
const TILE_LIMIT = 240

const SHELL_ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './images/camp-sea.jpg',
  './images/camp-lake.jpg',
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(SHELL_CACHE)
      .then((cache) => cache.addAll(SHELL_ASSETS).catch(() => undefined))
      .then(() => self.skipWaiting()),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => !key.startsWith(VERSION)).map((key) => caches.delete(key))),
      )
      .then(() => self.clients.claim()),
  )
})

const isTile = (url) =>
  /basemaps\.cartocdn\.com|tile\.openstreetmap\.org|tiles\./.test(url.hostname)

async function trimCache(cacheName, limit) {
  const cache = await caches.open(cacheName)
  const keys = await cache.keys()
  if (keys.length <= limit) return
  await Promise.all(keys.slice(0, keys.length - limit).map((key) => cache.delete(key)))
}

async function cacheFirst(request, cacheName, limit) {
  const cache = await caches.open(cacheName)
  const cached = await cache.match(request)
  if (cached) return cached
  const response = await fetch(request)
  if (response && (response.ok || response.type === 'opaque')) {
    await cache.put(request, response.clone())
    if (limit) trimCache(cacheName, limit)
  }
  return response
}

async function networkFirst(request) {
  const cache = await caches.open(SHELL_CACHE)
  try {
    const response = await fetch(request)
    if (response && response.ok) cache.put(request, response.clone())
    return response
  } catch (error) {
    const cached = await cache.match(request)
    if (cached) return cached
    const shell = await cache.match('./index.html')
    if (shell) return shell
    throw error
  }
}

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return
  const url = new URL(request.url)

  if (request.mode === 'navigate') {
    event.respondWith(networkFirst(request))
    return
  }

  if (isTile(url)) {
    event.respondWith(cacheFirst(request, TILE_CACHE, TILE_LIMIT).catch(() => Response.error()))
    return
  }

  if (url.origin === self.location.origin) {
    event.respondWith(
      cacheFirst(request, SHELL_CACHE).catch(() => caches.match('./index.html')),
    )
  }
})
