/**
 * PWA SERVICE WORKER — PA DÓNDE 🌿
 * Arquitectura Offline-First ultra-liviana en Vanilla JS
 * Optimizada para conexiones móviles intermitentes 3G/4G en la Sierra Nevada (Minca).
 */

const CACHE_VERSION = 'padonde-v6';
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const PAGES_CACHE = `${CACHE_VERSION}-pages`;
const IMAGES_CACHE = `${CACHE_VERSION}-images`;

// Escuchar mensaje de actualización inmediata desde la app
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Recursos estáticos mínimos indispensables precacheados durante la instalación (Minca & Mendihuaca aislados)
const PRECACHE_ASSETS = [
  '/es/minca',
  '/es/mendihuaca',
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
            if (url.includes('/minca') || url.includes('/mendihuaca')) {
              await pagesCache.put(url, res.clone());
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
            if (url.pathname.includes('/minca')) {
              cache.put('/es/minca', networkResponse.clone());
            } else if (url.pathname.includes('/mendihuaca')) {
              cache.put('/es/mendihuaca', networkResponse.clone());
            }
          }
          return networkResponse;
        } catch {
          // MODO AVIÓN / SIN SEÑAL: Buscar en caché de páginas
          const cachedMatch = await caches.match(request, { ignoreSearch: true });
          if (cachedMatch) return cachedMatch;

          // Si el usuario intentó abrir Mendihuaca sin conexión
          if (url.pathname.includes('/mendihuaca')) {
            const mendiCached = await caches.match('/es/mendihuaca', { ignoreSearch: true });
            if (mendiCached) return mendiCached;
          }

          // Si el usuario intentó abrir Minca sin conexión
          if (url.pathname.includes('/minca')) {
            const mincaCached = await caches.match('/es/minca', { ignoreSearch: true });
            if (mincaCached) return mincaCached;
          }

          // Si el usuario abrió '/' o variantes sin conexión, respetar la última región guardada
          const cookieHeader = request.headers.get('cookie') || '';
          if (cookieHeader.includes('padonde_zona=mendihuaca')) {
            const mendiCached = await caches.match('/es/mendihuaca', { ignoreSearch: true });
            if (mendiCached) return mendiCached;
          }

          const defaultCached = await caches.match('/es/minca', { ignoreSearch: true });
          if (defaultCached) return defaultCached;

          // Redirección sutil, limpia e imperceptible a la navegación previa o a Minca
          return new Response(
            `<!DOCTYPE html>
            <html lang="es">
            <head>
              <meta charset="utf-8" />
              <style>html,body{margin:0;padding:0;background:#F4F1EA;height:100%;overflow:hidden;}</style>
              <script>
                if (window.history.length > 1) {
                  window.history.back();
                } else {
                  var last = "minca";
                  try { last = localStorage.getItem("padonde_zona") || "minca"; } catch(e){}
                  window.location.replace('/es/' + last);
                }
              </script>
            </head>
            <body></body>
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

  // ESTRATEGIA D: Otras peticiones (RSC, JSON de datos, navegación SPA) -> Network con fallback a caché
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response && response.status === 200) {
          const clone = response.clone();
          const targetCache =
            url.searchParams.has('_rsc') || !url.pathname.includes('.')
              ? PAGES_CACHE
              : STATIC_CACHE;
          caches.open(targetCache).then((cache) => cache.put(request, clone));
        }
        return response;
      })
      .catch(async () => {
        const cached = await caches.match(request, { ignoreSearch: true });
        if (cached) return cached;
        // Si es una petición RSC que no está en caché, responder vacío para evitar errores abruptos
        if (url.searchParams.has('_rsc') || request.headers.get('RSC') === '1') {
          return new Response(null, { status: 204 });
        }
        return new Response(null, { status: 404 });
      })
  );
});
