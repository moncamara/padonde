"use client";

import { useEffect, useState, useRef, useTransition } from "react";
import { useRouter } from "@/i18n/routing";

/**
 * Componente ultra ligero para PWA y móviles.
 * 1. Gesto nativo Pull-to-Refresh (deslizar hacia abajo cuando estás arriba).
 * 2. Auto-actualización silenciosa al regresar a la app si pasaron más de 60 segundos.
 * Cero dependencias externas y rendimiento a 60 FPS garantizado.
 */
export function PullToRefreshTracker() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [pullDist, setPullDist] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const startYRef = useRef(0);
  const isPullingRef = useRef(false);
  const lastRefreshRef = useRef<number>(Date.now());

  // Umbral en píxeles para activar la recarga
  const PULL_THRESHOLD = 65;

  // 1. Manejo del gesto táctil Pull-to-Refresh
  useEffect(() => {
    function handleTouchStart(e: TouchEvent) {
      if (window.scrollY <= 1 && !isRefreshing) {
        startYRef.current = e.touches[0].clientY;
        isPullingRef.current = true;
      } else {
        isPullingRef.current = false;
      }
    }

    function handleTouchMove(e: TouchEvent) {
      if (!isPullingRef.current || isRefreshing) return;

      const currentY = e.touches[0].clientY;
      const diff = currentY - startYRef.current;

      if (diff > 0 && window.scrollY <= 1) {
        // Resistencia progresiva con amortiguación suave
        const distance = Math.min(diff * 0.4, 90);
        setPullDist(distance);
      } else {
        setPullDist(0);
      }
    }

    function handleTouchEnd() {
      if (!isPullingRef.current || isRefreshing) {
        isPullingRef.current = false;
        return;
      }
      isPullingRef.current = false;

      if (pullDist >= PULL_THRESHOLD) {
        triggerRefresh();
      } else {
        setPullDist(0);
      }
    }

    window.addEventListener("touchstart", handleTouchStart, { passive: true });
    window.addEventListener("touchmove", handleTouchMove, { passive: true });
    window.addEventListener("touchend", handleTouchEnd, { passive: true });

    return () => {
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
    };
  }, [pullDist, isRefreshing]);

  // Función para refrescar datos de Next.js
  function triggerRefresh() {
    setIsRefreshing(true);
    setPullDist(50); // Mantener un pill sutil mientras carga

    startTransition(() => {
      router.refresh();
      lastRefreshRef.current = Date.now();
    });

    // Cierre suave visual tras obtener respuesta
    setTimeout(() => {
      setIsRefreshing(false);
      setPullDist(0);
    }, 700);
  }

  // 2. Auto-recarga silenciosa al volver a enfocar la app (cuando el usuario regresa de WhatsApp u otra app)
  useEffect(() => {
    function handleVisibilityChange() {
      if (document.visibilityState === "visible") {
        const now = Date.now();
        // Si estuvo en segundo plano más de 60 segundos, sincronizar en silencio
        if (now - lastRefreshRef.current > 60000 && !isRefreshing) {
          lastRefreshRef.current = now;
          startTransition(() => {
            router.refresh();
          });
        }
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleVisibilityChange);
    };
  }, [isRefreshing]);

  if (pullDist <= 0 && !isRefreshing) return null;

  const isTriggerReady = pullDist >= PULL_THRESHOLD;

  return (
    <aside
      role="status"
      aria-live="polite"
      aria-label={isRefreshing ? "Actualizando cartelera" : isTriggerReady ? "Suelta para actualizar" : "Desliza para actualizar"}
      style={{
        transform: `translateY(${Math.max(pullDist - 12, 10)}px)`,
        transition: isPullingRef.current ? "none" : "transform 0.25s ease-out, opacity 0.2s ease-out",
      }}
      className="fixed top-2 left-1/2 -translate-x-1/2 z-50 pointer-events-none flex items-center justify-center"
    >
      <div className="bg-forest/95 text-white backdrop-blur-md px-3.5 py-1.5 rounded-full shadow-lg border border-white/20 flex items-center gap-2 text-xs font-sans font-medium">
        <span
          className={`text-sm transition-transform duration-200 ${
            isRefreshing ? "animate-spin" : isTriggerReady ? "rotate-180" : ""
          }`}
        >
          {isRefreshing ? "⏳" : "🌿"}
        </span>
        <span>
          {isRefreshing
            ? "Actualizando cartelera..."
            : isTriggerReady
            ? "Suelta para actualizar"
            : "Desliza para actualizar"}
        </span>
      </div>
    </aside>
  );
}
