"use client";

import { useEffect } from "react";

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      // Registrar tras carga inicial de la página para no bloquear el First Contentful Paint
      window.addEventListener("load", () => {
        navigator.serviceWorker
          .register("/sw.js", { scope: "/" })
          .then((registration) => {
            // Manejar actualizaciones en segundo plano
            registration.onupdatefound = () => {
              const installingWorker = registration.installing;
              if (installingWorker) {
                installingWorker.onstatechange = () => {
                  if (
                    installingWorker.state === "installed" &&
                    navigator.serviceWorker.controller
                  ) {
                    console.log("[PWA] Nueva versión disponible en segundo plano.");
                  }
                };
              }
            };
          })
          .catch((err) => {
            console.warn("[PWA] Registro de Service Worker omitido:", err);
          });
      });
    }
  }, []);

  return null;
}
