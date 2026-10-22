"use client";

import { useState, useRef, useCallback } from "react";
import Image from "next/image";
import type { HabitacionHospedaje } from "@/lib/types";

interface RoomCardProps {
  habitacion: HabitacionHospedaje;
  isSeleccionada: boolean;
  onSelect: (habitacion: HabitacionHospedaje) => void;
  tSelect: string;
  tSelected: string;
  tPerNight: string;
}

/**
 * Tarjeta de habitación móvil con mini-carrusel swipeable (CSS Scroll Snap nativo, 0 JS extra).
 * Muestra fotos optimizadas, badges de amenidades y selector para el cotizador.
 */
export function RoomCard({
  habitacion,
  isSeleccionada,
  onSelect,
  tSelect,
  tSelected,
  tPerNight,
}: RoomCardProps) {
  const { id, titulo, precio_noche_cop, fotos, badges, descripcion } = habitacion;
  const galleryRef = useRef<HTMLDivElement>(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(Boolean(fotos && fotos.length > 1));
  const [photoIndex, setPhotoIndex] = useState(0);

  const checkScroll = useCallback(() => {
    const el = galleryRef.current;
    if (!el || !fotos || fotos.length <= 1) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanLeft(scrollLeft > 4);
    setCanRight(scrollLeft + clientWidth < scrollWidth - 4);
    const index = Math.round(scrollLeft / clientWidth);
    setPhotoIndex(Math.min(Math.max(0, index), fotos.length - 1));
  }, [fotos]);

  const scrollPhoto = (direction: "left" | "right") => {
    const el = galleryRef.current;
    if (!el) return;
    const amount = direction === "left" ? -el.clientWidth : el.clientWidth;
    el.scrollBy({ left: amount, behavior: "smooth" });
  };

  return (
    <article
      onClick={() => onSelect(habitacion)}
      className={`relative bg-white/80 rounded-2xl overflow-hidden border transition-all cursor-pointer ${
        isSeleccionada
          ? "border-forest shadow-md ring-2 ring-forest/20 bg-white"
          : "border-stone-light/70 hover:border-stone"
      }`}
    >
      {/* Mini-Carrusel con Flechas Semitransparentes */}
      <div className="relative aspect-[16/10] w-full group/photo bg-stone-light/30">
        <div
          ref={galleryRef}
          onScroll={checkScroll}
          className="w-full h-full overflow-x-auto flex snap-x snap-mandatory scrollbar-none"
        >
          {fotos && fotos.length > 0 ? (
            fotos.map((src, idx) => (
              <div key={idx} className="relative min-w-full h-full snap-center flex-shrink-0">
                <Image
                  src={src}
                  alt={`${titulo} - foto ${idx + 1}`}
                  fill
                  sizes="(max-width: 640px) 100vw, 480px"
                  className="object-cover"
                  loading={idx === 0 ? "eager" : "lazy"}
                />
              </div>
            ))
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-stone-light/40 text-stone text-xs font-sans">
              🏡 Sin fotografías
            </div>
          )}
        </div>

        {/* Flechas semitransparentes flotantes */}
        {fotos && fotos.length > 1 && (
          <>
            {canLeft && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  scrollPhoto("left");
                }}
                className="absolute left-2 top-1/2 -translate-y-1/2 z-10 w-7 h-7 rounded-full bg-black/40 hover:bg-black/70 text-white backdrop-blur-md border border-white/20 flex items-center justify-center transition-all active:scale-90 cursor-pointer shadow-sm"
                aria-label="Foto anterior"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
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
                className="absolute right-2 top-1/2 -translate-y-1/2 z-10 w-7 h-7 rounded-full bg-black/40 hover:bg-black/70 text-white backdrop-blur-md border border-white/20 flex items-center justify-center transition-all active:scale-90 cursor-pointer shadow-sm"
                aria-label="Foto siguiente"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            )}

            <span className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-xs text-white text-[10px] font-sans px-2 py-0.5 rounded-full pointer-events-none">
              {photoIndex + 1}/{fotos.length}
            </span>
          </>
        )}
      </div>

      {/* Contenido de la habitación */}
      <div className="p-3.5 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="font-serif text-sm font-bold text-forest leading-snug">
              {titulo}
            </h3>
            {descripcion && (
              <p className="text-[11px] font-sans text-stone mt-0.5 leading-snug line-clamp-2">
                {descripcion}
              </p>
            )}
          </div>
          <div className="text-right whitespace-nowrap">
            <span className="font-sans text-xs font-bold text-terra">
              ${precio_noche_cop.toLocaleString("es-CO")}
            </span>
            <span className="block text-[10px] text-stone font-normal leading-none mt-0.5">
              {tPerNight}
            </span>
          </div>
        </div>

        {/* Badges / Micro-datos escaneables */}
        {badges && badges.length > 0 && (
          <div className="flex flex-wrap gap-1 pt-1">
            {badges.map((b, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1 bg-cream/90 text-forest-dark border border-stone-light/60 text-[10px] font-sans px-2 py-0.5 rounded-md"
              >
                <span>{b.icono}</span>
                <span>{b.texto}</span>
              </span>
            ))}
          </div>
        )}

        {/* Selector de selección rápida */}
        <div className="pt-2 flex items-center justify-between border-t border-stone-light/40">
          <span className="text-[11px] font-sans text-stone font-medium">
            {isSeleccionada ? tSelected : tSelect}
          </span>
          <div
            className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${
              isSeleccionada
                ? "border-forest bg-forest text-white text-[10px]"
                : "border-stone bg-white"
            }`}
          >
            {isSeleccionada && "✓"}
          </div>
        </div>
      </div>
    </article>
  );
}
