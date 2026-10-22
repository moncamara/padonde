"use client";

import { useEffect } from "react";

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }

    const registerSW = () => {
      navigator.serviceWorker
        .register("/sw.js", { scope: "/" })
        .then((registration) => {
          // Si el SW ya está esperando o activo, asegurar actualización
          registration.update().catch(() => {});
        })
        .catch((err) => {
          console.warn("[PaDónde SW] Error al registrar:", err);
        });
    };

    // Si el documento ya terminó de cargar (caso típico en Next.js hydration), registrar de una vez
    if (document.readyState === "complete" || document.readyState === "interactive") {
      registerSW();
    } else {
      window.addEventListener("load", registerSW);
      return () => window.removeEventListener("load", registerSW);
    }
  }, []);

  return null;
}
