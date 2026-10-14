"use client";

import { useState, useMemo, useRef } from "react";
import { useTranslations } from "next-intl";
import { EventCard } from "@/components/events/EventCard";
import { EventFilters } from "@/components/events/EventFilters";
import type { CategoriaEvento, EventoConNegocio, FiltroTiempo } from "@/lib/types";
import { esFinDeSemana, esHoy } from "@/lib/utils";

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
      const pasaFecha =
        filtroTiempo === "hoy"
          ? esHoy(e.fecha_inicio, now)
          : filtroTiempo === "manana"
          ? !esHoy(e.fecha_inicio, now) && !esFinDeSemana(e.fecha_inicio)
          : esFinDeSemana(e.fecha_inicio);

      const pasaCategoria = filtroCategoria === null || e.tipo === filtroCategoria;

      return pasaFecha && pasaCategoria;
    });
  }, [eventos, filtroTiempo, filtroCategoria]);

  return (
    <div className="space-y-6">
      <EventFilters
        onTiempoChange={setFiltroTiempo}
        onCategoriaChange={setFiltroCategoria}
      />

      {eventosFiltrados.length === 0 ? (
        <div className="text-center py-16 text-stone">
          <p className="text-4xl mb-3">🌿</p>
          <p className="font-sans text-base">{tFeed("empty")}</p>
          <p className="font-sans text-sm mt-1">{tFeed("emptyHint")}</p>
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
