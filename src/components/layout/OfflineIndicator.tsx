"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export function OfflineIndicator() {
  const router = useRouter();
  const [isOffline, setIsOffline] = useState(false);
  const [recovered, setRecovered] = useState(false);

  useEffect(() => {
    // 1. Estado inicial del navegador
    if (typeof navigator !== "undefined") {
      setIsOffline(!navigator.onLine);
    }

    // 2. Manejadores de eventos de conectividad
    const handleOffline = () => {
      setIsOffline(true);
      setRecovered(false);
    };

    const handleOnline = () => {
      setIsOffline(false);
      setRecovered(true);

      // Sincronizar datos y refrescar la cartelera en segundo plano
      try {
        router.refresh();
      } catch {
        // Ignorar
      }

      // Ocultar mensaje de reconexión tras 3.5 segundos
      const timer = setTimeout(() => {
        setRecovered(false);
      }, 3500);

      return () => clearTimeout(timer);
    };

    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);

    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
    };
  }, [router]);

  if (!isOffline && !recovered) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-300 animate-in slide-in-from-top"
    >
      {isOffline ? (
        <div className="bg-amber-500/95 backdrop-blur-md text-amber-950 px-3 py-1.5 border-b border-amber-600/30 shadow-xs flex items-center justify-center gap-2 text-[11px] sm:text-xs font-sans font-semibold">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-900 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-900"></span>
          </span>
          <span>📡 Modo sin conexión • Mostrando planes guardados</span>
        </div>
      ) : (
        <div className="bg-emerald-600/95 backdrop-blur-md text-white px-3 py-1.5 border-b border-emerald-700/30 shadow-xs flex items-center justify-center gap-2 text-[11px] sm:text-xs font-sans font-semibold">
          <span className="text-xs">🟢</span>
          <span>¡Conexión restablecida! Actualizando planes...</span>
        </div>
      )}
    </div>
  );
}
