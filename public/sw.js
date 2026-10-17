/* Service worker PerfConnect (PWA).
 *
 * - Pages : toujours le réseau (contenu personnel et dynamique, jamais mis en
 *   cache) ; sans connexion, on affiche /offline.html.
 * - Fichiers statiques Next (/_next/static, noms versionnés) : cache d'abord.
 * - Notifications push : affichage + ouverture de la bonne page au clic.
 *
 * Changer CACHE_VERSION invalide le cache statique au prochain chargement.
 */
const CACHE_VERSION = 'v3';
const STATIC_CACHE = `perfconnect-static-${CACHE_VERSION}`;
const OFFLINE_URL = '/offline.html';
const PRECACHE_URLS = [OFFLINE_URL, '/brand/logo-wordmark-480.png', '/icons/icon-192.png'];
const MAX_STATIC_ENTRIES = 150;

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== STATIC_CACHE).map((key) => caches.delete(key)))
      )
      .then(() => self.clients.claim())
  );
});

async function trimCache(cache) {
  const keys = await cache.keys();
  const excess = keys.length - MAX_STATIC_ENTRIES;
  for (let i = 0; i < excess; i++) {
    if (!PRECACHE_URLS.includes(new URL(keys[i].url).pathname)) await cache.delete(keys[i]);
  }
}

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) {
    const cache = await caches.open(STATIC_CACHE);
    await cache.put(request, response.clone());
    trimCache(cache);
  }
  return response;
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith(fetch(request).catch(() => caches.match(OFFLINE_URL)));
    return;
  }

  // Logo et icône de la page hors connexion : réseau d'abord, cache ensuite.
  if (PRECACHE_URLS.includes(url.pathname)) {
    event.respondWith(fetch(request).catch(() => caches.match(request)));
    return;
  }

  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(cacheFirst(request));
  }
});

// -----------------------------------------------------------------------------
// Notifications push
// -----------------------------------------------------------------------------

self.addEventListener('push', (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch {
    payload = { body: event.data ? event.data.text() : '' };
  }

  const title = payload.title || 'PerfConnect';
  event.waitUntil(
    self.registration.showNotification(title, {
      body: payload.body || '',
      icon: '/icons/icon-192.png',
      tag: payload.tag,
      renotify: Boolean(payload.tag),
      data: { url: payload.url || '/notifications' },
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  // Seules les pages du site sont ouvertes.
  const target = new URL(event.notification.data?.url || '/', self.location.origin);
  if (target.origin !== self.location.origin) return;

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(async (windows) => {
      for (const client of windows) {
        if (new URL(client.url).origin !== self.location.origin) continue;
        await client.focus();
        if (client.url !== target.href && 'navigate' in client) {
          try {
            await client.navigate(target.href);
          } catch {
            return self.clients.openWindow(target.href);
          }
        }
        return;
      }
      return self.clients.openWindow(target.href);
    })
  );
});
