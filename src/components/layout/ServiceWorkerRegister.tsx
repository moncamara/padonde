"use client";

import { useEffect } from "react";

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }

    const prefetchVisibleEvents = (registration: ServiceWorkerRegistration) => {
      try {
        const target = registration.active || navigator.serviceWorker.controller;
        if (!target) return;

        // Extraer los enlaces de detalle de eventos visibles en la cartelera
        const eventLinks = Array.from(
          document.querySelectorAll('a[href*="/minca/"], a[href*="/mendihuaca/"]')
        )
          .map((el) => (el as HTMLAnchorElement).pathname)
          .filter((path) => {
            // Asegurar que sea una ruta de detalle /[locale]/[zona]/[uuid]
            const parts = path.split("/").filter(Boolean);
            return parts.length >= 3;
          });

        const uniqueLinks = Array.from(new Set(eventLinks));
        if (uniqueLinks.length > 0) {
          target.postMessage({
            type: "CACHE_EVENT_PAGES",
            urls: uniqueLinks,
          });
        }
      } catch {
        // Silencioso
      }
    };

    const registerSW = () => {
      navigator.serviceWorker
        .register("/sw.js", { scope: "/" })
        .then((registration) => {
          registration.update().catch(() => {});

          // Pre-guardar los eventos del feed para que abran sin señal
          setTimeout(() => {
            prefetchVisibleEvents(registration);
          }, 1000);
        })
        .catch((err) => {
          console.warn("[PaDónde SW] Error al registrar:", err);
        });
    };

    if (document.readyState === "complete" || document.readyState === "interactive") {
      registerSW();
    } else {
      window.addEventListener("load", registerSW);
      return () => window.removeEventListener("load", registerSW);
    }
  }, []);

  return null;
}
