"use client";

import { useState, useMemo, useRef } from "react";
import { useTranslations } from "next-intl";
import { EventCard } from "@/components/events/EventCard";
import { EventFilters } from "@/components/events/EventFilters";
import type { CategoriaEvento, EventoConNegocio, FiltroTiempo } from "@/lib/types";
import {
  eventoCoincideConFiltroTiempo,
  getFechaYMDDesdeISO,
  getMinutosDelDiaColombia,
} from "@/lib/utils";

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
    const filtrados = eventos.filter((e) => {
      const pasaFecha = eventoCoincideConFiltroTiempo(
        e.fecha_inicio,
        filtroTiempo,
        now,
        e.fecha_fin,
        e.descripcion
      );
      const pasaCategoria = filtroCategoria === null || e.tipo === filtroCategoria;

      return pasaFecha && pasaCategoria;
    });

    return [...filtrados].sort((a, b) => {
      // 1. Si es filtro "proximos" (agenda futura), el orden principal es cronológico por día
      if (filtroTiempo === "proximos") {
        const ymdA = getFechaYMDDesdeISO(a.fecha_inicio);
        const ymdB = getFechaYMDDesdeISO(b.fecha_inicio);
        if (ymdA !== ymdB) {
          return ymdA.localeCompare(ymdB);
        }
      }

      // 2. Destacados primero (en la vista de un día específico o dentro del mismo día en próximos)
      if (a.destacado !== b.destacado) {
        return a.destacado ? -1 : 1;
      }

      // 3. De acuerdo a las horas de los eventos: del más temprano al más tarde (hora Colombia)
      const minA = getMinutosDelDiaColombia(a.fecha_inicio);
      const minB = getMinutosDelDiaColombia(b.fecha_inicio);
      if (minA !== minB) {
        return minA - minB;
      }

      // 4. Desempate determinista por título
      return a.titulo.localeCompare(b.titulo);
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
