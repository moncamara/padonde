"use client";

import { useEffect, useState, useRef, useTransition } from "react";
import { useRouter } from "@/i18n/routing";

/**
 * Componente ultra ligero para PWA y móviles.
 * 1. Gesto nativo Pull-to-Refresh: Indicador circular minimalista (arco con flecha) estilo navegador nativo.
 * 2. Cero espabilón: Requiere arrastre vertical deliberado (> 18px) y no se dispara en swipes horizontales.
 * 3. Auto-actualización silenciosa al regresar a la app si pasaron más de 60 segundos.
 */
export function PullToRefreshTracker() {
  const router = useRouter();
  const [, startTransition] = useTransition();

  const [pullDist, setPullDist] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const startXRef = useRef(0);
  const startYRef = useRef(0);
  const isPullingRef = useRef(false);
  const lastRefreshRef = useRef<number>(Date.now());

  // Umbral en píxeles para activar la recarga
  const PULL_THRESHOLD = 55;

  // 1. Manejo del gesto táctil Pull-to-Refresh
  useEffect(() => {
    function handleTouchStart(e: TouchEvent) {
      if (window.scrollY <= 1 && !isRefreshing && e.touches.length === 1) {
        startXRef.current = e.touches[0].clientX;
        startYRef.current = e.touches[0].clientY;
        isPullingRef.current = true;
      } else {
        isPullingRef.current = false;
      }
    }

    function handleTouchMove(e: TouchEvent) {
      if (!isPullingRef.current || isRefreshing || e.touches.length !== 1) return;

      const currentX = e.touches[0].clientX;
      const currentY = e.touches[0].clientY;
      const diffX = Math.abs(currentX - startXRef.current);
      const diffY = currentY - startYRef.current;

      // Si el movimiento es horizontal (o swipe entre categorías), cancelar pull-to-refresh
      if (diffX > diffY) {
        isPullingRef.current = false;
        setPullDist(0);
        return;
      }

      // Zona muerta de 18px para evitar cualquier espabilón en toques o scrolls rápidos
      if (diffY > 18 && window.scrollY <= 1) {
        // Resistencia suave progresiva
        const distance = Math.min((diffY - 18) * 0.45, 68);
        setPullDist(distance);
      } else {
        setPullDist(0);
      }
    }

    function handleTouchEnd() {
      if (!isPullingRef.current || isRefreshing) {
        isPullingRef.current = false;
        setPullDist(0);
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
    setPullDist(45); // Mantener el círculo visible mientras el servidor responde

    startTransition(() => {
      router.refresh();
      lastRefreshRef.current = Date.now();
    });

    // Cierre suave visual tras obtener respuesta
    setTimeout(() => {
      setIsRefreshing(false);
      setPullDist(0);
    }, 650);
  }

  // 2. Auto-recarga silenciosa al volver a enfocar la app (cuando el usuario regresa de WhatsApp u otra app)
  useEffect(() => {
    function handleVisibilityChange() {
      if (document.visibilityState === "visible") {
        const now = Date.now();
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

  // Cero renderizado si no hay arrastre intencional ni recarga
  if (pullDist < 12 && !isRefreshing) return null;

  const isTriggerReady = pullDist >= PULL_THRESHOLD;
  const rotation = Math.min((pullDist / PULL_THRESHOLD) * 360, 360);
  const opacity = Math.min(pullDist / 25, 1);

  return (
    <aside
      role="status"
      aria-label={isRefreshing ? "Actualizando cartelera" : "Recargar"}
      style={{
        transform: `translate(-50%, ${Math.max(pullDist + 64, 70)}px) scale(${isTriggerReady ? 1.08 : 0.92})`,
        opacity: isRefreshing ? 1 : opacity,
        transition: isPullingRef.current
          ? "none"
          : "transform 0.22s cubic-bezier(0.2, 0.8, 0.2, 1), opacity 0.2s ease-out, scale 0.2s ease-out",
      }}
      className="fixed top-0 left-1/2 z-50 pointer-events-none flex items-center justify-center"
    >
      <div className="w-10 h-10 rounded-full bg-white text-forest shadow-lg border border-stone-light/80 flex items-center justify-center">
        <svg
          className={`w-5 h-5 text-forest transition-transform ${isRefreshing ? "animate-spin" : ""}`}
          style={{
            transform: isRefreshing ? "none" : `rotate(${rotation}deg)`,
            transition: isPullingRef.current ? "none" : "transform 0.18s ease-out",
          }}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {/* Símbolo universal de actualización: arco circular con flecha */}
          <path d="M21 12a9 9 0 1 1-6.219-8.56" />
          <polyline points="21 3 21 9 15 9" />
        </svg>
      </div>
    </aside>
  );
}
