/**
 * PaDónde Resilient Offline Service Worker
 * Diseñado específicamente para Minca y Mendihuaca ante caídas de luz y señal celular.
 * 
 * Reglas de oro:
 * 1. SI HAY INTERNET: La red SIEMPRE tiene prioridad y NUNCA se bloquea una respuesta real (incluyendo redirecciones 307/308).
 * 2. SI SE CAE LA SEÑAL (Modo Avión / Corte de luz): Entrega la cartelera de Minca guardada en caché.
 * 3. NUNCA tocar /admin ni APIs de administración ni analíticas.
 */

const CACHE_VERSION = 'v2';
const STATIC_CACHE = `padonde-static-${CACHE_VERSION}`;
const PAGES_CACHE = `padonde-pages-${CACHE_VERSION}`;
const IMAGES_CACHE = `padonde-images-${CACHE_VERSION}`;
const MAX_CACHED_IMAGES = 40;

// Rutas esenciales pre-guardadas en la instalación
const PRECACHE_URLS = [
  '/',
  '/es/minca',
  '/manifest.json',
  '/favicon.ico',
  '/icon-192.png',
  '/icon-512.png',
];

// Limpieza LRU de caché de imágenes para no saturar memoria
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

// 1. Instalación: Precachear cartelera de Minca y estáticos
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then(async (cache) => {
      // Precachear individualmente para que si uno falla no cancele los demás
      for (const url of PRECACHE_URLS) {
        try {
          const res = await fetch(url, { redirect: 'follow' });
          if (res && res.status === 200) {
            await cache.put(url, res);
            // También guardar en caché de páginas si es la cartelera
            if (url === '/' || url === '/es/minca') {
              const pagesCache = await caches.open(PAGES_CACHE);
              await pagesCache.put(url, res.clone());
            }
          }
        } catch {
          // Continuar con los demás
        }
      }
    })
  );
  self.skipWaiting();
});

// 2. Activación: Limpiar cachés antiguas y tomar control de clientes
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

// 3. Fetch: Intercepción segura
self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // Solo peticiones GET
  if (request.method !== 'GET') return;
  if (!url.protocol.startsWith('http')) return;

  // EXCLUSIÓN TOTAL: Rutas de administración y analíticas
  if (
    url.pathname.includes('/admin') ||
    url.pathname.includes('/api/admin') ||
    url.pathname.includes('/api/analytics') ||
    url.hostname.includes('google-analytics.com') ||
    url.hostname.includes('googletagmanager.com')
  ) {
    return;
  }

  // CASO A: Navegación de páginas (HTML de cartelera, detalles de eventos, accesos directos)
  if (request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          // 1. Siempre intentar la red primero con seguimiento de redirecciones
          const networkResponse = await fetch(request);

          // Si la red respondió (cualquier código válido: 200, 301, 302, 307, 308, etc.)
          // NUNCA lanzar error; entregar directamente la respuesta del servidor
          if (networkResponse) {
            // Si fue una página exitosa 200, guardamos copia en caché para cuando se vaya la luz
            if (networkResponse.status === 200) {
              const cache = await caches.open(PAGES_CACHE);
              cache.put(request, networkResponse.clone());
              // Si visitó Minca o la raíz, respaldar ambas
              if (url.pathname === '/' || url.pathname.includes('/minca')) {
                cache.put('/es/minca', networkResponse.clone());
                cache.put('/', networkResponse.clone());
              }
            }
            return networkResponse;
          }
          return networkResponse;
        } catch (networkError) {
          // 2. LA RED FALLÓ DE VERDAD (Corte de luz en Minca / Modo Avión)
          // Buscar primero la URL exacta solicitada en caché
          const cachedMatch = await caches.match(request);
          if (cachedMatch) {
            return cachedMatch;
          }

          // Si el acceso directo pidió '/' o una variante y no está, entregar la Cartelera de Minca guardada
          const mincaCached = await caches.match('/es/minca');
          if (mincaCached) {
            return mincaCached;
          }

          const rootCached = await caches.match('/');
          if (rootCached) {
            return rootCached;
          }

          // Si es la primera vez que abre esa ruta específica y no hay red:
          return new Response(
            `<!DOCTYPE html>
            <html lang="es">
            <head>
              <meta charset="utf-8" />
              <meta name="viewport" content="width=device-width, initial-scale=1.0" />
              <title>PaDónde — Sin Conexión</title>
              <style>
                body { background: #F4F1EA; color: #1C3829; font-family: sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 20px; text-align: center; }
                .box { background: white; border-radius: 24px; padding: 32px 20px; max-width: 380px; box-shadow: 0 4px 20px rgba(0,0,0,0.06); }
                h2 { margin: 0 0 10px; font-size: 20px; }
                p { color: #6e6456; font-size: 13px; line-height: 1.5; margin-bottom: 20px; }
                a { display: block; background: #1C3829; color: white; padding: 12px; border-radius: 14px; text-decoration: none; font-weight: bold; font-size: 14px; }
              </style>
            </head>
            <body>
              <div class="box">
                <span style="font-size: 40px; display: block; margin-bottom: 12px;">🌿</span>
                <h2>Sin señal en la montaña</h2>
                <p>Parece que la señal descansó en este punto de la Sierra. Toca abajo para ver la cartelera guardada en tu teléfono:</p>
                <a href="/es/minca">Ver Cartelera de Minca</a>
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
              caches.open(STATIC_CACHE).then((cache) => cache.put(request, resClone));
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
