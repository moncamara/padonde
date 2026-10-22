/**
 * PaDónde Resilient Offline Service Worker (v3)
 * Especialmente optimizado para iOS Safari y Android en zonas sin señal (Minca / Sierra Nevada).
 */

const CACHE_VERSION = 'v3';
const STATIC_CACHE = `padonde-static-${CACHE_VERSION}`;
const PAGES_CACHE = `padonde-pages-${CACHE_VERSION}`;
const IMAGES_CACHE = `padonde-images-${CACHE_VERSION}`;
const MAX_CACHED_IMAGES = 40;

// Rutas esenciales a precachear
const PRECACHE_URLS = [
  '/es/minca',
  '/',
  '/manifest.json',
  '/favicon.ico',
  '/icon-192.png',
  '/icon-512.png',
];

// Limpieza LRU de caché de imágenes
async function limitCacheSize(cacheName, maxItems) {
  try {
    const cache = await caches.open(cacheName);
    const keys = await cache.keys();
    if (keys.length > maxItems) {
      await cache.delete(keys[0]);
      await limitCacheSize(cacheName, maxItems);
    }
  } catch {
    // Ignorar
  }
}

// 1. Instalación: Precachear cartelera de Minca sin bloquear por errores individuales
self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const staticCache = await caches.open(STATIC_CACHE);
      const pagesCache = await caches.open(PAGES_CACHE);

      for (const url of PRECACHE_URLS) {
        try {
          const res = await fetch(url, { redirect: 'follow' });
          if (res && res.status === 200) {
            const cloneForPages = res.clone();
            const cloneForStatic = res.clone();
            await staticCache.put(url, cloneForStatic);
            if (url === '/es/minca' || url === '/') {
              await pagesCache.put(url, cloneForPages);
            }
          }
        } catch {
          // Continuar con los demás
        }
      }
    })()
  );
  self.skipWaiting();
});

// 2. Activación: Purgar cachés viejas y tomar control
self.addEventListener('activate', (event) => {
  const activeCaches = [STATIC_CACHE, PAGES_CACHE, IMAGES_CACHE];
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (!activeCaches.includes(key)) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// 3. Fetch: Manejo seguro y tolerante a fallos
self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // Solo peticiones GET
  if (request.method !== 'GET') return;
  if (!url.protocol.startsWith('http')) return;

  // EXCLUSIÓN: Admin, APIs y analíticas NUNCA se cachean
  if (
    url.pathname.includes('/admin') ||
    url.pathname.includes('/api/admin') ||
    url.pathname.includes('/api/analytics') ||
    url.hostname.includes('google-analytics.com') ||
    url.hostname.includes('googletagmanager.com')
  ) {
    return;
  }

  // CASO A: Navegación de páginas (HTML de carteleras y accesos directos)
  if (request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          // 1. Siempre intentar la red primero
          const networkResponse = await fetch(request);
          if (networkResponse) {
            if (networkResponse.status === 200) {
              const cache = await caches.open(PAGES_CACHE);
              cache.put(request, networkResponse.clone());
              if (url.pathname === '/' || url.pathname.includes('/minca')) {
                cache.put('/es/minca', networkResponse.clone());
                cache.put('/', networkResponse.clone());
              }
            }
            return networkResponse;
          }
          return networkResponse;
        } catch {
          // 2. MODO AVIÓN / CORTE DE LUZ (Red inaccesible)
          // Buscar ignorando query parameters (?src=...)
          const cachedMatch = await caches.match(request, { ignoreSearch: true });
          if (cachedMatch) return cachedMatch;

          const mincaCached = await caches.match('/es/minca', { ignoreSearch: true });
          if (mincaCached) return mincaCached;

          const rootCached = await caches.match('/', { ignoreSearch: true });
          if (rootCached) return rootCached;

          // Fallback visual amigable
          return new Response(
            `<!DOCTYPE html>
            <html lang="es">
            <head>
              <meta charset="utf-8" />
              <meta name="viewport" content="width=device-width, initial-scale=1.0" />
              <title>PaDónde — Minca</title>
              <style>
                body { background: #F4F1EA; color: #1C3829; font-family: sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 24px; text-align: center; }
                .card { background: #fff; padding: 32px 24px; border-radius: 24px; max-width: 380px; box-shadow: 0 4px 20px rgba(0,0,0,0.06); }
                h2 { margin: 0 0 10px; font-size: 20px; }
                p { color: #6e6456; font-size: 13px; line-height: 1.5; margin-bottom: 20px; }
                a { display: block; background: #1C3829; color: #fff; padding: 12px; border-radius: 14px; text-decoration: none; font-weight: bold; }
              </style>
            </head>
            <body>
              <div class="card">
                <span style="font-size: 40px; display: block; margin-bottom: 12px;">🌿</span>
                <h2>Sin señal en la montaña</h2>
                <p>La señal celular descansó. Toca abajo para ver la cartelera guardada en tu teléfono:</p>
                <a href="/es/minca">Ver Cartelera de Minca</a>
              </div>
            </body>
            </html>`,
            { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
          );
        }
      })()
    );
    return;
  }

  // CASO B: Archivos estáticos de Next.js (_next/static, css, js, fuentes) -> Stale-While-Revalidate
  const isStatic =
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.endsWith('.css') ||
    url.pathname.endsWith('.js') ||
    url.pathname.endsWith('.woff2');

  if (isStatic) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        const fetchPromise = fetch(request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              const resClone = networkResponse.clone();
              caches.open(STATIC_CACHE).then((c) => c.put(request, resClone));
            }
            return networkResponse;
          })
          .catch(() => cachedResponse);

        return cachedResponse || fetchPromise;
      })
    );
    return;
  }

  // CASO C: Imágenes de eventos y hospedajes -> Cache-First con límite LRU
  const isImage =
    request.destination === 'image' ||
    url.pathname.match(/\.(webp|jpg|jpeg|png|svg|avif|ico)$/i) ||
    url.pathname.startsWith('/optimized_');

  if (isImage) {
    event.respondWith(
      caches.match(request).then((cachedImage) => {
        if (cachedImage) return cachedImage;

        return fetch(request)
          .then(async (networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              const cache = await caches.open(IMAGES_CACHE);
              cache.put(request, networkResponse.clone());
              limitCacheSize(IMAGES_CACHE, MAX_CACHED_IMAGES);
            }
            return networkResponse;
          })
          .catch(() => {
            return new Response('', { status: 408 });
          });
      })
    );
    return;
  }
});
