"use client";

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

  return (
    <article
      onClick={() => onSelect(habitacion)}
      className={`relative bg-white/80 rounded-2xl overflow-hidden border transition-all cursor-pointer ${
        isSeleccionada
          ? "border-forest shadow-md ring-2 ring-forest/20 bg-white"
          : "border-stone-light/70 hover:border-stone"
      }`}
    >
      {/* Mini-Carrusel con CSS Scroll Snap Nativo */}
      <div className="relative aspect-[16/10] w-full overflow-x-auto flex snap-x snap-mandatory scrollbar-none bg-stone-light/30">
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

        {/* Indicador de fotos si hay más de 1 */}
        {fotos && fotos.length > 1 && (
          <span className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-xs text-white text-[10px] font-sans px-2 py-0.5 rounded-full pointer-events-none">
            1/{fotos.length} • desliza
          </span>
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
