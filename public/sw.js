// DeComer Service Worker
// DECOMER-14: PWA + push notifications

const CACHE_VERSION = 'v1'
const MENU_CACHE = `decomer-menu-${CACHE_VERSION}`
const STATIC_CACHE = `decomer-static-${CACHE_VERSION}`

const MENU_URLS = [
  '/menu',
  '/buscar',
]

// Assets to cache on install
const PRECACHE_ASSETS = [
  '/',
  '/menu',
]

// ─── Install ────────────────────────────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(MENU_CACHE).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS).catch(() => {
        // Non-fatal: offline shell will be available as pages are visited
      })
    })
  )
  self.skipWaiting()
})

// ─── Activate ────────────────────────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== MENU_CACHE && name !== STATIC_CACHE)
          .map((name) => caches.delete(name))
      )
    })
  )
  self.clients.claim()
})

// ─── Fetch ────────────────────────────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Skip non-GET requests
  if (request.method !== 'GET') return

  // Skip chrome-extension and non-http(s)
  if (!url.protocol.startsWith('http')) return

  // API calls → network-first
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirst(request))
    return
  }

  // Menu page and its related routes → cache-first
  if (MENU_URLS.some((path) => url.pathname === path || url.pathname.startsWith(path + '/'))) {
    event.respondWith(cacheFirst(request, MENU_CACHE))
    return
  }

  // Static assets (JS, CSS, images) → cache-first with static cache
  if (
    url.pathname.match(/\.(js|css|png|jpg|jpeg|svg|ico|woff2?|ttf)$/) ||
    url.pathname.startsWith('/_nuxt/')
  ) {
    event.respondWith(cacheFirst(request, STATIC_CACHE))
    return
  }

  // Everything else → network-first
  event.respondWith(networkFirst(request))
})

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName)
  const cached = await cache.match(request)
  if (cached) return cached

  try {
    const response = await fetch(request)
    if (response.ok) {
      cache.put(request, response.clone())
    }
    return response
  } catch {
    return cached || new Response('Offline', { status: 503 })
  }
}

async function networkFirst(request) {
  try {
    const response = await fetch(request)
    if (response.ok) {
      const cache = await caches.open(MENU_CACHE)
      cache.put(request, response.clone())
    }
    return response
  } catch {
    const cache = await caches.open(MENU_CACHE)
    const cached = await cache.match(request)
    return cached || new Response(JSON.stringify({ error: 'Offline' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}

// ─── Push ────────────────────────────────────────────────────────────────────
self.addEventListener('push', (event) => {
  if (!event.data) return

  let payload
  try {
    payload = event.data.json()
  } catch {
    payload = { type: 'promo', title: 'DeComer', body: event.data.text() }
  }

  const { type = 'promo', title, body, url } = payload

  const icons = {
    pedido: '/favicon-192x192.png',
    recordatorio: '/favicon-192x192.png',
    promo: '/favicon-192x192.png',
  }

  const options = {
    body,
    icon: icons[type] || '/favicon-192x192.png',
    badge: '/favicon-96x96.png',
    tag: type,
    renotify: true,
    data: { url: url || getUrlForType(type), type },
    actions: getActionsForType(type),
  }

  event.waitUntil(self.registration.showNotification(title || 'DeComer', options))
})

function getUrlForType(type) {
  switch (type) {
    case 'pedido': return '/mis-pedidos'
    case 'recordatorio': return '/menu'
    case 'promo': return '/menu'
    default: return '/'
  }
}

function getActionsForType(type) {
  switch (type) {
    case 'pedido':
      return [{ action: 'view', title: 'Ver pedido' }]
    case 'recordatorio':
      return [{ action: 'order', title: 'Pedir ahora' }]
    case 'promo':
      return [{ action: 'view', title: 'Ver oferta' }]
    default:
      return []
  }
}

// ─── Notification click ────────────────────────────────────────────────────
self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  const { url } = event.notification.data || {}
  const targetUrl = url || '/'

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Focus existing window if open
      for (const client of clientList) {
        if (client.url === targetUrl && 'focus' in client) {
          return client.focus()
        }
      }
      // Open new window
      if (clients.openWindow) {
        return clients.openWindow(targetUrl)
      }
    })
  )
})
