const CACHE_NAME = 'money-sys-v10'

const PRECACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon1.png',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      await Promise.all(
        PRECACHE.map(async (url) => {
          try {
            const response = await fetch(url, { cache: 'reload' })
            if (response.ok) {
              await cache.put(url, response.clone())
            }
          } catch (error) {
            console.warn('[sw] precache failed:', url, error)
          }
        })
      )
      await self.skipWaiting()
    })
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(async (keys) => {
      await Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )

      if (self.registration.navigationPreload) {
        await self.registration.navigationPreload.enable()
      }

      await self.clients.claim()
    })
  )
})

self.addEventListener('fetch', (event) => {
  const { request } = event

  if (request.method !== 'GET') return

  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return

  if (url.pathname.startsWith('/api/')) {
    event.respondWith(fetch(request))
    return
  }

  if (isNavigationRequest(request)) {
    event.respondWith(handleNavigationRequest(event))
    return
  }

  if (isStaticAsset(url)) {
    event.respondWith(handleStaticAsset(request))
    return
  }

  event.respondWith(handleNetworkFirst(request))
})

function isNavigationRequest(request) {
  return request.mode === 'navigate' || request.headers.get('accept')?.includes('text/html')
}

function isStaticAsset(url) {
  return (
    url.pathname.startsWith('/assets/') ||
    url.pathname.startsWith('/icons/') ||
    url.pathname === '/manifest.json' ||
    url.pathname === '/favicon1.png' ||
    /\.(?:js|css|png|jpg|jpeg|svg|webp|ico|woff2?)$/i.test(url.pathname)
  )
}

async function handleNavigationRequest(event) {
  const preloadResponse = await event.preloadResponse
  if (preloadResponse) return preloadResponse

  try {
    const response = await fetch(event.request, { cache: 'reload' })
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME)
      await cache.put('/index.html', response.clone())
    }
    return response
  } catch (error) {
    return (
      (await caches.match('/index.html')) ||
      (await caches.match('/')) ||
      new Response('App is temporarily unavailable.', {
        status: 503,
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      })
    )
  }
}

async function handleStaticAsset(request) {
  const cached = await caches.match(request)
  if (cached) return cached

  const response = await fetch(request)
  if (response.ok) {
    const cache = await caches.open(CACHE_NAME)
    await cache.put(request, response.clone())
  }
  return response
}

async function handleNetworkFirst(request) {
  try {
    const response = await fetch(request)
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME)
      await cache.put(request, response.clone())
    }
    return response
  } catch (error) {
    const cached = await caches.match(request)
    if (cached) return cached
    throw error
  }
}
