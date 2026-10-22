"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { useTranslations, useLocale } from "next-intl";
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
 * Feed de eventos con filtrado client-side, persistencia y restauración de scroll.
 */
export function EventFeed({ eventos, zona }: EventFeedProps) {
  const tFeed = useTranslations("feed");
  const locale = useLocale();

  const [filtroTiempo, setFiltroTiempoState] = useState<FiltroTiempo>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = sessionStorage.getItem("padonde_filtro_tiempo");
        if (saved && (saved === "hoy" || saved === "fin_de_semana" || saved === "proximos")) {
          return saved as FiltroTiempo;
        }
      } catch {}
    }
    return "hoy";
  });

  const [filtroCategoria, setFiltroCategoriaState] = useState<CategoriaEvento | null>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = sessionStorage.getItem("padonde_filtro_categoria");
        if (saved) return saved as CategoriaEvento;
      } catch {}
    }
    return null;
  });

  const setFiltroTiempo = (t: FiltroTiempo) => {
    setFiltroTiempoState(t);
    if (typeof window !== "undefined") {
      try {
        sessionStorage.setItem("padonde_filtro_tiempo", t);
      } catch {}
    }
  };

  const setFiltroCategoria = (c: CategoriaEvento | null) => {
    setFiltroCategoriaState(c);
    if (typeof window !== "undefined") {
      try {
        if (c) sessionStorage.setItem("padonde_filtro_categoria", c);
        else sessionStorage.removeItem("padonde_filtro_categoria");
      } catch {}
    }
  };

  // Restauración de scroll precisa al volver atrás desde un detalle
  useEffect(() => {
    if (typeof window === "undefined") return;

    let cleanupTimer: NodeJS.Timeout | null = null;

    try {
      const lastCardId = sessionStorage.getItem("padonde_last_card");
      const savedPos = sessionStorage.getItem("padonde_scroll_pos");

      if (!lastCardId && !savedPos) return;

      const performScroll = () => {
        if (lastCardId) {
          const el = document.getElementById(lastCardId);
          if (el) {
            el.scrollIntoView({ block: "center", behavior: "instant" });
            return;
          }
        }
        if (savedPos) {
          const top = parseInt(savedPos, 10);
          if (!isNaN(top)) {
            window.scrollTo({ top, behavior: "instant" });
          }
        }
      };

      // 1. Inmediato en el render
      performScroll();

      // 2. En el siguiente frame de animación
      requestAnimationFrame(performScroll);

      // 3. Pequeño timeout (60ms) para neutralizar reseteos del router de Next.js
      setTimeout(performScroll, 60);

      // 4. Limpieza final tras estabilización (300ms)
      cleanupTimer = setTimeout(() => {
        performScroll();
        try {
          sessionStorage.removeItem("padonde_last_card");
          sessionStorage.removeItem("padonde_scroll_pos");
        } catch {}
      }, 300);
    } catch {}

    return () => {
      if (cleanupTimer) clearTimeout(cleanupTimer);
    };
  }, []);

  // Pre-calentamiento progresivo y de baja prioridad para disponibilidad 100% offline en la montaña
  useEffect(() => {
    if (typeof window === "undefined" || !("caches" in window) || !navigator.onLine) return;

    const warmUp = () => {
      // Pre-calentar hasta 20 tarjetas visibles con su URL canónica y payload RSC
      const toWarm = eventos.slice(0, 20);
      toWarm.forEach((evento, i) => {
        setTimeout(() => {
          if (navigator.onLine) {
            const path = `/${locale}/${zona}/${evento.id}`;
            // 1. Precachear HTML de navegación
            fetch(path, { priority: "low" as any }).catch(() => {});
            // 2. Precachear payload RSC para que la transición client-side funcione offline
            fetch(`${path}?_rsc`, {
              headers: { RSC: "1" },
              priority: "low" as any,
            }).catch(() => {});
          }
        }, 600 + i * 150);
      });
    };

    if ("requestIdleCallback" in window) {
      (window as any).requestIdleCallback(warmUp);
    } else {
      setTimeout(warmUp, 1500);
    }
  }, [eventos, zona, locale]);

  const nowRef = useRef(new Date());

  const eventosFiltrados = useMemo(() => {
    const now = nowRef.current;
    const filtrados = eventos.filter((e) => {
      // 1. Si el usuario filtra específicamente por la categoría "hospedaje",
      // mostramos todos los hospedajes activos de forma permanente
      if (filtroCategoria === "hospedaje") {
        return e.tipo === "hospedaje";
      }

      // 2. Para el resto de categorías o vista general ("Todos"):
      const pasaFecha = eventoCoincideConFiltroTiempo(
        e.fecha_inicio,
        filtroTiempo,
        now,
        e.fecha_fin,
        e.descripcion,
        e.tipo
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

      // 2. Prioridad de categoría: eventos y actividades van primero; hospedajes van al final del día
      const esHospedajeA = a.tipo === "hospedaje";
      const esHospedajeB = b.tipo === "hospedaje";
      if (esHospedajeA !== esHospedajeB) {
        return esHospedajeA ? 1 : -1;
      }

      // 3. Destacados primero (dentro del mismo grupo)
      if (a.destacado !== b.destacado) {
        return a.destacado ? -1 : 1;
      }

      // 4. De acuerdo a las horas de los eventos: del más temprano al más tarde (hora Colombia)
      const minA = getMinutosDelDiaColombia(a.fecha_inicio);
      const minB = getMinutosDelDiaColombia(b.fecha_inicio);
      if (minA !== minB) {
        return minA - minB;
      }

      // 5. Desempate determinista por título
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
