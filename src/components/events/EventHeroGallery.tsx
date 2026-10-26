"use client";

import { useState, useRef, useCallback } from "react";
import Image from "next/image";

interface EventHeroGalleryProps {
  imagenUrl: string | null;
  titulo: string;
  galeriaFotos?: string[] | null;
  categoriaBadge?: React.ReactNode;
  destacadoBadge?: React.ReactNode;
}

/**
 * Hero Gallery para eventos y vitrinas de aliados.
 * - Soporta carrusel swipeable nativo (CSS Scroll Snap, 0 libs externas pesadas).
 * - Primera foto cargada con prioridad (LCP óptimo).
 * - Fotos subsecuentes cargadas de forma diferida (lazy) para ahorro extremo de datos móviles.
 * - Indicadores discretos: contador numérico y dots modernos.
 */
export function EventHeroGallery({
  imagenUrl,
  titulo,
  galeriaFotos,
  categoriaBadge,
  destacadoBadge,
}: EventHeroGalleryProps) {
  // Combinamos la foto de portada principal con las fotos de galería adicionales
  const fotos: string[] = [imagenUrl, ...(galeriaFotos || [])].filter(
    (url): url is string => Boolean(url && url.trim().length > 0)
  );

  const containerRef = useRef<HTMLDivElement>(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(Boolean(fotos.length > 1));
  const [activeIndex, setActiveIndex] = useState(0);

  const handleScroll = useCallback(() => {
    const el = containerRef.current;
    if (!el || fotos.length <= 1) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanLeft(scrollLeft > 10);
    setCanRight(scrollLeft + clientWidth < scrollWidth - 10);
    const index = Math.round(scrollLeft / clientWidth);
    setActiveIndex(Math.min(Math.max(0, index), fotos.length - 1));
  }, [fotos.length]);

  const scrollPhoto = (direction: "left" | "right") => {
    const el = containerRef.current;
    if (!el) return;
    const amount = direction === "left" ? -el.clientWidth : el.clientWidth;
    el.scrollBy({ left: amount, behavior: "smooth" });
  };

  const scrollToSlide = (idx: number) => {
    const el = containerRef.current;
    if (!el) return;
    el.scrollTo({ left: idx * el.clientWidth, behavior: "smooth" });
  };

  // CASO 1: Sin fotografías
  if (fotos.length === 0) {
    return (
      <div className="relative w-full h-80 sm:h-96 bg-forest overflow-hidden select-none">
        <div className="absolute inset-0 bg-gradient-to-br from-forest to-stone" />
        <div className="card-overlay absolute inset-0 pointer-events-none" />

        {/* Badges flotantes */}
        <div className="absolute bottom-4 left-4 right-4 max-w-lg mx-auto flex items-center gap-2 pointer-events-none">
          {categoriaBadge}
          {destacadoBadge}
        </div>
      </div>
    );
  }

  // CASO 2: Solo una fotografía (renderizado estándar sin carrusel ni overhead)
  if (fotos.length === 1) {
    return (
      <div className="relative w-full h-80 sm:h-96 bg-forest overflow-hidden select-none">
        <Image
          src={fotos[0]}
          alt={titulo}
          fill
          priority
          sizes="(max-width: 640px) 100vw, 640px"
          className="object-cover"
        />
        <div className="card-overlay absolute inset-0 pointer-events-none" />

        {/* Badges flotantes */}
        <div className="absolute bottom-4 left-4 right-4 max-w-lg mx-auto flex items-center gap-2 pointer-events-none">
          {categoriaBadge}
          {destacadoBadge}
        </div>
      </div>
    );
  }

  // CASO 3: Múltiples fotografías (Carrusel interactivo ultra fluido)
  return (
    <div className="relative w-full h-80 sm:h-96 bg-forest overflow-hidden group/gallery select-none">
      {/* Contenedor scroll-snap swipeable nativo */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="w-full h-full overflow-x-auto flex snap-x snap-mandatory scrollbar-none scroll-smooth"
      >
        {fotos.map((src, idx) => (
          <div
            key={idx}
            className="relative min-w-full h-full snap-center flex-shrink-0 bg-forest"
          >
            <Image
              src={src}
              alt={`${titulo} - foto ${idx + 1}`}
              fill
              priority={idx === 0}
              loading={idx === 0 ? "eager" : "lazy"}
              sizes="(max-width: 640px) 100vw, 640px"
              className="object-cover"
            />
          </div>
        ))}
      </div>

      {/* Gradiente overlay para contraste de badges y controles */}
      <div className="card-overlay absolute inset-0 pointer-events-none" />

      {/* Flechas de navegación (visibles en desktop/hover o tablets) */}
      {canLeft && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            scrollPhoto("left");
          }}
          className="absolute left-3 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-black/40 hover:bg-black/75 text-white backdrop-blur-md border border-white/20 flex items-center justify-center transition-all active:scale-95 cursor-pointer shadow-md"
          aria-label="Foto anterior"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      )}

      {canRight && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            scrollPhoto("right");
          }}
          className="absolute right-3 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-black/40 hover:bg-black/75 text-white backdrop-blur-md border border-white/20 flex items-center justify-center transition-all active:scale-95 cursor-pointer shadow-md"
          aria-label="Foto siguiente"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      )}

      {/* Barra inferior: Badges a la izquierda + Indicadores a la derecha */}
      <div className="absolute bottom-4 left-4 right-4 max-w-lg mx-auto flex items-center justify-between pointer-events-none z-10">
        {/* Badges de Categoría y Destacado */}
        <div className="flex items-center gap-2">
          {categoriaBadge}
          {destacadoBadge}
        </div>

        {/* Indicador de fotos (Badge estilo Airbnb / Instagram) */}
        <div className="flex items-center gap-2">
          {/* Dots discretos */}
          <div className="hidden sm:flex items-center gap-1 bg-black/40 backdrop-blur-md px-2 py-1 rounded-full pointer-events-auto">
            {fotos.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => scrollToSlide(i)}
                aria-label={`Ir a foto ${i + 1}`}
                className={`transition-all rounded-full cursor-pointer ${
                  activeIndex === i
                    ? "w-3 h-1.5 bg-white"
                    : "w-1.5 h-1.5 bg-white/40 hover:bg-white/70"
                }`}
              />
            ))}
          </div>

          {/* Contador numérico */}
          <span className="bg-black/60 backdrop-blur-md text-white text-[11px] font-sans font-medium px-2.5 py-1 rounded-full border border-white/10 shadow-xs">
            📷 {activeIndex + 1}/{fotos.length}
          </span>
        </div>
      </div>
    </div>
  );
}
