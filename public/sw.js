/**
 * UNINSTALLER SERVICE WORKER
 * Desinstala automáticamente el Service Worker y purga todas las cachés
 * para devolver el control 100% nativo al navegador y restaurar el scroll perfecto.
 */

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(keys.map((k) => caches.delete(k)));
    }).then(() => {
      return self.registration.unregister();
    })
  );
  self.clients.claim();
});
