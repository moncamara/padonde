/**
 * PWA SERVICE WORKER — PA DÓNDE 🌿
 * Arquitectura Offline-First ultra-liviana en Vanilla JS
 * Optimizada para conexiones móviles intermitentes 3G/4G en la Sierra Nevada (Minca).
 */

const CACHE_VERSION = 'padonde-v3';
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const PAGES_CACHE = `${CACHE_VERSION}-pages`;
const IMAGES_CACHE = `${CACHE_VERSION}-images`;

// Recursos estáticos mínimos indispensables precacheados durante la instalación
const PRECACHE_ASSETS = [
  '/es/minca',
  '/manifest.webmanifest',
  '/icon-192.png',
  '/icon-512.png',
  '/favicon.ico',
];

// 1. INSTALACIÓN: Precarga limpia de assets críticos y activación sin esperas
self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const staticCache = await caches.open(STATIC_CACHE);
      const pagesCache = await caches.open(PAGES_CACHE);

      for (const url of PRECACHE_ASSETS) {
        try {
          const res = await fetch(url, { redirect: 'follow' });
          if (res && res.status === 200) {
            if (url.includes('/minca')) {
              await pagesCache.put(url, res.clone());
              await pagesCache.put('/', res.clone());
            } else {
              await staticCache.put(url, res.clone());
            }
          }
        } catch {
          // Si alguno falla individualmente, no bloquear la instalación
        }
      }
    })()
  );
  self.skipWaiting();
});

// 2. ACTIVACIÓN: Purgar versiones antiguas y tomar control de clientes inmediatamente
self.addEventListener('activate', (event) => {
  const validCaches = [STATIC_CACHE, PAGES_CACHE, IMAGES_CACHE];
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (!validCaches.includes(key)) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// 3. FETCH: Intercepción resiliente según el tipo de recurso
self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // Solo peticiones GET HTTP/HTTPS
  if (request.method !== 'GET') return;
  if (!url.protocol.startsWith('http')) return;

  // EXCLUSIÓN ESTRICTA: Admin, API administrativa, analíticas y auth NUNCA se cachean
  if (
    url.pathname.includes('/admin') ||
    url.pathname.includes('/api/admin') ||
    url.pathname.includes('/api/analytics') ||
    url.pathname.includes('/api/auth')
  ) {
    return;
  }

  // ESTRATEGIA A: Activos Estáticos Hash (_next/static, fuentes woff2, CSS) -> Cache-First
  if (url.pathname.startsWith('/_next/static/') || url.pathname.endsWith('.woff2')) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const clone = networkResponse.clone();
            caches.open(STATIC_CACHE).then((cache) => cache.put(request, clone));
          }
          return networkResponse;
        });
      })
    );
    return;
  }

  // ESTRATEGIA B: Imágenes (Next/Image, Cloudinary, Supabase, WebP) -> Stale-While-Revalidate
  const isImage =
    request.destination === 'image' ||
    url.pathname.startsWith('/_next/image') ||
    /\.(png|jpg|jpeg|webp|svg|gif|ico)(\?.*)?$/i.test(url.pathname);

  if (isImage) {
    event.respondWith(
      caches.match(request).then((cached) => {
        const fetchPromise = fetch(request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              const clone = networkResponse.clone();
              caches.open(IMAGES_CACHE).then((cache) => cache.put(request, clone));
            }
            return networkResponse;
          })
          .catch(() => cached);

        return cached || fetchPromise;
      })
    );
    return;
  }

  // ESTRATEGIA C: Navegación de Páginas HTML (Cartelera, Detalles, PWA standalone) -> Network-First
  if (request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          const networkResponse = await fetch(request);
          if (networkResponse && networkResponse.status === 200) {
            const cache = await caches.open(PAGES_CACHE);
            cache.put(request, networkResponse.clone());
            if (url.pathname === '/' || url.pathname.includes('/minca')) {
              cache.put('/es/minca', networkResponse.clone());
            }
          }
          return networkResponse;
        } catch {
          // MODO AVIÓN / SIN SEÑAL: Buscar en caché
          const cachedMatch = await caches.match(request, { ignoreSearch: true });
          if (cachedMatch) return cachedMatch;

          // Si el usuario abrió '/' o variantes sin conexión, entregar la cartelera de Minca guardada
          if (url.pathname === '/' || url.pathname === '/es' || url.pathname.endsWith('/minca')) {
            const mincaCached = await caches.match('/es/minca', { ignoreSearch: true });
            if (mincaCached) return mincaCached;
          }

          // Fallback limpio y seguro para detalles no precacheados (NO redirige ni refresca)
          return new Response(
            `<!DOCTYPE html>
            <html lang="es">
            <head>
              <meta charset="utf-8" />
              <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0" />
              <title>PaDónde — Modo Sin Conexión</title>
              <style>
                body { margin: 0; padding: 24px 16px; background-color: #F4F1EA; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; min-height: 100vh; display: flex; align-items: center; justify-content: center; box-sizing: border-box; }
                .card { background: #FFFFFF; border-radius: 24px; padding: 32px 24px; max-width: 380px; width: 100%; text-align: center; box-shadow: 0 4px 20px rgba(28, 56, 41, 0.08); border: 1px solid rgba(226, 221, 209, 0.8); }
                .icon { font-size: 42px; margin-bottom: 12px; }
                h1 { font-family: Georgia, serif; color: #1C3829; font-size: 22px; margin: 0 0 10px; font-weight: 700; }
                p { color: #6E6456; font-size: 14px; line-height: 1.5; margin: 0 0 24px; }
                .btn { display: inline-flex; align-items: center; justify-content: center; gap: 8px; width: 100%; box-sizing: border-box; background: #1C3829; color: #F4F1EA; padding: 14px 20px; border-radius: 16px; font-weight: 600; font-size: 14px; text-decoration: none; border: none; cursor: pointer; }
                .btn:active { transform: scale(0.98); }
              </style>
            </head>
            <body>
              <div class="card">
                <div class="icon">🌿</div>
                <h1>Sin señal en la montaña</h1>
                <p>Este detalle específico no alcanzó a guardarse antes de perder la conexión. Puedes volver a la cartelera para consultar todos los eventos, hospedajes y servicios ya guardados en tu teléfono.</p>
                <button class="btn" onclick="if(window.history.length > 1){ window.history.back(); } else { window.location.href='/es/minca'; }">
                  ← Volver a la Cartelera
                </button>
              </div>
            </body>
            </html>`,
            {
              status: 200,
              headers: { 'Content-Type': 'text/html; charset=utf-8' },
            }
          );
        }
      })()
    );
    return;
  }

  // ESTRATEGIA D: Otras peticiones (RSC, JSON de datos) -> Network con fallback a caché
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(STATIC_CACHE).then((cache) => cache.put(request, clone));
        }
        return response;
      })
      .catch(() => caches.match(request, { ignoreSearch: true }))
  );
});
