"use client";

import { useEffect } from "react";

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      window.addEventListener("load", () => {
        navigator.serviceWorker
          .register("/sw.js", { scope: "/" })
          .then((registration) => {
            // Verificar actualizaciones en segundo plano
            registration.update().catch(() => {});
          })
          .catch((err) => {
            console.warn("[SW] Registro omitido:", err);
          });
      });
    }
  }, []);

  return null;
}
