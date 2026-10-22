"use client";

import { useRef, useState, useEffect, useCallback } from "react";

interface CarouselWrapperProps {
  children: React.ReactNode;
  containerClassName?: string;
  step?: number;
  variant?: "light" | "dark";
  ariaLabel?: string;
}

/**
 * Envoltorio inteligente para carruseles horizontales con flechas semitransparentes
 * de desplazamiento suave que se muestran dinámicamente según la posición del scroll.
 */
export function CarouselWrapper({
  children,
  containerClassName = "flex gap-2 overflow-x-auto scrollbar-none",
  step = 220,
  variant = "light",
  ariaLabel = "carrusel",
}: CarouselWrapperProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanScrollLeft(scrollLeft > 4);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 4);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    checkScroll();

    el.addEventListener("scroll", checkScroll, { passive: true });
    window.addEventListener("resize", checkScroll);

    // Verificación diferida para asegurar layout completo tras renderizado
    const timer = setTimeout(checkScroll, 120);

    return () => {
      el.removeEventListener("scroll", checkScroll);
      window.removeEventListener("resize", checkScroll);
      clearTimeout(timer);
    };
  }, [checkScroll]);

  const handleScroll = (direction: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;
    const amount = direction === "left" ? -step : step;
    el.scrollBy({ left: amount, behavior: "smooth" });
  };

  const isLight = variant === "light";

  return (
    <div className="relative isolate group/carousel w-full">
      {/* Flecha Izquierda Semitransparente */}
      {canScrollLeft && (
        <button
          type="button"
          onClick={() => handleScroll("left")}
          aria-label={`Desplazar ${ariaLabel} a la izquierda`}
          className={[
            "absolute left-0 top-1/2 -translate-y-1/2 z-20 flex items-center justify-center transition-all duration-200 active:scale-90 cursor-pointer shadow-sm hover:shadow-md",
            isLight
              ? "w-8 h-8 rounded-full bg-cream/90 hover:bg-cream text-forest border border-stone-light/80 backdrop-blur-md -ml-1 sm:ml-0"
              : "w-7 h-7 rounded-full bg-black/45 hover:bg-black/75 text-white border border-white/25 backdrop-blur-md left-2",
          ].join(" ")}
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      )}

      {/* Contenedor desplazable */}
      <div ref={scrollRef} className={containerClassName}>
        {children}
      </div>

      {/* Flecha Derecha Semitransparente */}
      {canScrollRight && (
        <button
          type="button"
          onClick={() => handleScroll("right")}
          aria-label={`Desplazar ${ariaLabel} a la derecha`}
          className={[
            "absolute right-0 top-1/2 -translate-y-1/2 z-20 flex items-center justify-center transition-all duration-200 active:scale-90 cursor-pointer shadow-sm hover:shadow-md",
            isLight
              ? "w-8 h-8 rounded-full bg-cream/90 hover:bg-cream text-forest border border-stone-light/80 backdrop-blur-md -mr-1 sm:mr-0"
              : "w-7 h-7 rounded-full bg-black/45 hover:bg-black/75 text-white border border-white/25 backdrop-blur-md right-2",
          ].join(" ")}
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      )}
    </div>
  );
}
