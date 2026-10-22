"use client";

import { useEffect } from "react";

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

    const isLocalhost =
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1";

    if (process.env.NODE_ENV === "production" || isLocalhost) {
      window.addEventListener("load", () => {
        navigator.serviceWorker
          .register("/sw.js", { scope: "/" })
          .then((reg) => {
            reg.update().catch(() => {});

            if (reg.waiting) {
              reg.waiting.postMessage({ type: "SKIP_WAITING" });
            }

            reg.addEventListener("updatefound", () => {
              const newWorker = reg.installing;
              if (newWorker) {
                newWorker.addEventListener("statechange", () => {
                  if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
                    newWorker.postMessage({ type: "SKIP_WAITING" });
                  }
                });
              }
            });
          })
          .catch(() => {});
      });
    }
  }, []);

  return null;
}
