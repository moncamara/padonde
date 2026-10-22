/**
 * EMERGENCY CLEANUP / UNREGISTER
 * Limpia inmediatamente cualquier caché y desinstala el Service Worker
 * para que todo el tráfico vaya 100% directo a la red sin bloqueos.
 */

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(keys.map((key) => caches.delete(key)));
    }).then(() => {
      return self.registration.unregister();
    })
  );
  self.clients.claim();
});

// NUNCA interceptar ninguna petición: dejar pasar todo directamente a internet
self.addEventListener('fetch', () => {
  return;
});
