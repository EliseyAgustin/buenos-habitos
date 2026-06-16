const CACHE_NAME = 'buenos-habitos-v5';
const APP_SHELL = [
  '/index.html',
  '/css/styles.css',
  '/js/app.js',
  '/js/firebase.js',
  '/js/auth.js',
  '/js/habitos.js',
  '/js/ui.js',
  '/js/cache.js',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/favicon.svg',
];

// ── INSTALL: cachear el app shell ────────────────────────────────────────────
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

// ── ACTIVATE: limpiar caches viejos y tomar control inmediato ────────────────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys =>
        Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
      )
      .then(() => self.clients.claim())
  );
});

// ── FETCH: Network First para todo el app shell ──────────────────────────────
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Ignorar esquemas no-http (chrome-extension://, etc.)
  if (!url.protocol.startsWith('http')) return;

  // Ignorar peticiones a Firebase/Google (siempre van a la red)
  if (
    url.hostname.includes('firebase') ||
    url.hostname.includes('google') ||
    url.hostname.includes('gstatic')
  ) {
    return;
  }

  // Network First: intenta la red, cae al cache si está offline
  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Cachear respuestas ok: basic (same-origin) y cors (cross-origin con CORS headers)
        if (
          response &&
          response.status === 200 &&
          (response.type === 'basic' || response.type === 'cors')
        ) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() =>
        caches.match(event.request).then(cached => {
          if (cached) return cached;
          // Fallback offline para navegación
          if (event.request.destination === 'document') {
            return caches.match('/index.html');
          }
          // Para recursos no cacheados y sin red, respuesta explícita de no disponible
          return new Response(null, {
            status: 503,
            statusText: 'Offline – recurso no disponible',
          });
        })
      )
  );
});
