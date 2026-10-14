"use client";

import { useState, useMemo, useRef } from "react";
import { useTranslations } from "next-intl";
import { EventCard } from "@/components/events/EventCard";
import { EventFilters } from "@/components/events/EventFilters";
import type { CategoriaEvento, EventoConNegocio, FiltroTiempo } from "@/lib/types";
import { eventoCoincideConFiltroTiempo } from "@/lib/utils";

interface EventFeedProps {
  eventos: EventoConNegocio[];
  zona: string;
}

/**
 * Feed de eventos con filtrado client-side y soporte de traducción.
 */
export function EventFeed({ eventos, zona }: EventFeedProps) {
  const tFeed = useTranslations("feed");

  const [filtroTiempo, setFiltroTiempo] = useState<FiltroTiempo>("hoy");
  const [filtroCategoria, setFiltroCategoria] = useState<CategoriaEvento | null>(null);

  const nowRef = useRef(new Date());

  const eventosFiltrados = useMemo(() => {
    const now = nowRef.current;
    return eventos.filter((e) => {
      const pasaFecha = eventoCoincideConFiltroTiempo(e.fecha_inicio, filtroTiempo, now);
      const pasaCategoria = filtroCategoria === null || e.tipo === filtroCategoria;

      return pasaFecha && pasaCategoria;
    });
  }, [eventos, filtroTiempo, filtroCategoria]);

  return (
    <div className="space-y-6">
      <EventFilters
        tiempoActivo={filtroTiempo}
        categoriaActiva={filtroCategoria}
        onTiempoChange={setFiltroTiempo}
        onCategoriaChange={setFiltroCategoria}
      />

      {eventosFiltrados.length === 0 ? (
        <div className="text-center py-14 px-4 rounded-3xl bg-white/40 border border-stone-light/60 text-stone">
          <p className="text-4xl mb-3">🌿</p>
          <p className="font-serif text-lg text-forest font-medium">{tFeed("empty")}</p>
          <p className="font-sans text-xs text-stone mt-1 max-w-xs mx-auto">
            {tFeed("emptyHint")}
          </p>

          {(filtroTiempo !== "hoy" || filtroCategoria !== null) && (
            <button
              onClick={() => {
                setFiltroTiempo("hoy");
                setFiltroCategoria(null);
              }}
              className="mt-5 inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-forest text-cream font-sans text-xs font-semibold shadow-xs hover:bg-forest/90 active:scale-95 transition-all cursor-pointer"
            >
              <span>✨</span>
              <span>{tFeed("reset")}</span>
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {eventosFiltrados.map((evento, index) => (
            <EventCard
              key={evento.id}
              evento={evento}
              zona={zona}
              priority={index === 0}
            />
          ))}
        </div>
      )}
    </div>
  );
}
