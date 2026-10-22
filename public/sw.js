/**
 * PaDónde Service Worker (Lightweight Offline Resilience)
 * Diseñado para zonas de montaña y costa (Minca, Mendihuaca) con caídas frecuentes de señal.
 * Estrategias:
 * - Páginas y Carteleras: Network-First con fallback a Caché y fallback a offline.html.
 * - Recursos Estáticos (JS/CSS/Fonts): Stale-While-Revalidate.
 * - Imágenes de Eventos: Cache-First con límite estricto LRU (máx 35 portadas).
 * - Exclusiones: Rutas de administración (/admin), APIs admin y analíticas nunca se cachean.
 */

const CACHE_VERSION = 'v1';
const STATIC_CACHE = `padonde-static-${CACHE_VERSION}`;
const PAGES_CACHE = `padonde-pages-${CACHE_VERSION}`;
const IMAGES_CACHE = `padonde-images-${CACHE_VERSION}`;
const MAX_CACHED_IMAGES = 35;

// Recursos mínimos pre-cacheados al instalar para garantizar arranque sin señal
const PRECACHE_ASSETS = [
  '/offline.html',
  '/favicon.ico',
  '/icon-192.png',
  '/icon-512.png',
];

// Helper para limitar tamaño de caché (LRU / FIFO)
async function limitCacheSize(cacheName, maxItems) {
  try {
    const cache = await caches.open(cacheName);
    const keys = await cache.keys();
    if (keys.length > maxItems) {
      await cache.delete(keys[0]);
      await limitCacheSize(cacheName, maxItems);
    }
  } catch {
    // Ignorar errores menores de cuota
  }
}

// 1. Instalación del Service Worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS).catch((err) => {
        console.warn('[SW] Error pre-cacheando assets mínimos:', err);
      });
    })
  );
  self.skipWaiting();
});

// 2. Activación y Limpieza de Cachés Antiguas
self.addEventListener('activate', (event) => {
  const currentCaches = [STATIC_CACHE, PAGES_CACHE, IMAGES_CACHE];
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (!currentCaches.includes(key)) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// 3. Interceptación de Peticiones
self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // Solo procesar peticiones GET en http/https
  if (request.method !== 'GET' || !url.protocol.startsWith('http')) {
    return;
  }

  // EXCLUSIONES DE PRODUCCIÓN:
  // Nunca interceptar ni cachear rutas de administración, APIs admin, ni analíticas
  if (
    url.pathname.includes('/admin') ||
    url.pathname.includes('/api/admin') ||
    url.pathname.includes('/api/analytics') ||
    url.hostname.includes('google-analytics.com') ||
    url.hostname.includes('googletagmanager.com')
  ) {
    return;
  }

  // A. Peticiones de Navegación (HTML de páginas / carteleras de destino)
  if (request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          // Intentar red primero con timeout para no congelar la pantalla en conexiones lentas
          const networkPromise = fetch(request);
          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Network timeout')), 3500)
          );

          const response = await Promise.race([networkPromise, timeoutPromise]);
          if (response && response.status === 200) {
            const cache = await caches.open(PAGES_CACHE);
            cache.put(request, response.clone());
            return response;
          }
          throw new Error('Respuesta de red no válida');
        } catch {
          // Si la red falla o está sin señal, buscar la página en caché
          const cachedPage = await caches.match(request);
          if (cachedPage) {
            return cachedPage;
          }

          // Si es una ruta no visitada previamente, mostrar el fallback offline
          const offlinePage = await caches.match('/offline.html');
          if (offlinePage) {
            return offlinePage;
          }

          return new Response('Sin conexión a internet', {
            status: 503,
            statusText: 'Service Unavailable',
            headers: new Headers({ 'Content-Type': 'text/plain; charset=utf-8' }),
          });
        }
      })()
    );
    return;
  }

  // B. Recursos Estáticos de Next.js (JS, CSS, Fuentes) -> Stale-While-Revalidate
  const isStaticAsset =
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.endsWith('.css') ||
    url.pathname.endsWith('.js') ||
    url.pathname.includes('/fonts/') ||
    url.pathname.endsWith('.woff2');

  if (isStaticAsset) {
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

  // C. Imágenes de Eventos y Hospedajes -> Cache-First con límite LRU (máx 35 imágenes)
  const isImage =
    request.destination === 'image' ||
    url.pathname.match(/\.(webp|jpg|jpeg|png|svg|avif|ico)$/i) ||
    url.pathname.startsWith('/optimized_');

  if (isImage) {
    event.respondWith(
      caches.match(request).then((cachedImage) => {
        if (cachedImage) {
          return cachedImage;
        }

        return fetch(request)
          .then(async (networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              const cache = await caches.open(IMAGES_CACHE);
              cache.put(request, networkResponse.clone());
              // Limitar tamaño de caché para cuidar el almacenamiento del turista
              limitCacheSize(IMAGES_CACHE, MAX_CACHED_IMAGES);
            }
            return networkResponse;
          })
          .catch(() => {
            // Si no hay red y no está en caché, simplemente no carga la imagen (degradación suave)
            return new Response('', { status: 408, statusText: 'Image unavailable offline' });
          });
      })
    );
    return;
  }
});
