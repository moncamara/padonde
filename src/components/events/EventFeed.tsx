"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { useTranslations, useLocale } from "next-intl";
import { EventCard } from "@/components/events/EventCard";
import { EventFilters } from "@/components/events/EventFilters";
import type { CategoriaEvento, EventoConNegocio, FiltroTiempo } from "@/lib/types";
import {
  getTerritorialConfig,
  getCategoriasParaZona,
  type TerritorialUXConfig,
} from "@/constants";
import { useSwipeCategoryNav } from "@/hooks/useSwipeCategoryNav";
import {
  eventoCoincideConFiltroTiempo,
  getFechaYMDDesdeISO,
  getMinutosDelDiaColombia,
} from "@/lib/utils";
import { trackSearch } from "@/lib/analytics";

interface EventFeedProps {
  eventos: EventoConNegocio[];
  zona: string;
  configTerritorial?: Record<string, TerritorialUXConfig>;
}

function normalizarTexto(txt: string): string {
  return txt
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function eventoCoincideConBusqueda(e: EventoConNegocio, queryNorm: string): boolean {
  if (!queryNorm) return true;
  if (normalizarTexto(e.titulo).includes(queryNorm)) return true;
  if (e.descripcion && normalizarTexto(e.descripcion).includes(queryNorm)) return true;
  if (e.negocio?.nombre && normalizarTexto(e.negocio.nombre).includes(queryNorm)) return true;
  if (normalizarTexto(e.tipo).includes(queryNorm)) return true;
  if (
    e.metadata_hospedaje?.habitaciones?.some(
      (h) =>
        normalizarTexto(h.titulo).includes(queryNorm) ||
        (h.descripcion && normalizarTexto(h.descripcion).includes(queryNorm)) ||
        h.badges?.some((b) => normalizarTexto(b.texto).includes(queryNorm))
    )
  ) {
    return true;
  }
  return false;
}

/**
 * Feed de eventos con filtrado client-side, persistencia y restauración de scroll.
 */
export function EventFeed({ eventos, zona, configTerritorial }: EventFeedProps) {
  const tFeed = useTranslations("feed");
  const tFilters = useTranslations("filters");
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

  const [busqueda, setBusquedaState] = useState<string>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = sessionStorage.getItem("padonde_busqueda");
        if (saved) return saved;
      } catch {}
    }
    return "";
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

  const setBusqueda = (q: string) => {
    setBusquedaState(q);
    if (typeof window !== "undefined") {
      try {
        if (q) sessionStorage.setItem("padonde_busqueda", q);
        else sessionStorage.removeItem("padonde_busqueda");
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
  const queryNorm = normalizarTexto(busqueda);

  // Filtrado de eventos por categoría, búsqueda y fecha con fallback inteligente a otras fechas
  const { eventosFiltrados, esEnOtrasFechas } = useMemo(() => {
    const now = nowRef.current;

    // 1. Filtrar por categoría seleccionada
    const porCategoria = filtroCategoria === null
      ? eventos
      : eventos.filter((e) => e.tipo === filtroCategoria);

    // 2. Filtrar por texto de búsqueda
    const coincidentesBusqueda = !queryNorm
      ? porCategoria
      : porCategoria.filter((e) => eventoCoincideConBusqueda(e, queryNorm));

    // 3. Filtrar por fecha
    const coincidentesEnFecha = coincidentesBusqueda.filter((e) => {
      if (filtroCategoria === "hospedaje") return e.tipo === "hospedaje";

      return eventoCoincideConFiltroTiempo(
        e.fecha_inicio,
        filtroTiempo,
        now,
        e.fecha_fin,
        e.descripcion,
        e.tipo
      );
    });

    // 4. Fallback inteligente: si hay búsqueda activa pero no hay eventos en esta fecha,
    // pero sí en otras fechas, mostramos los de otras fechas con aviso amigable
    let listaAFiltrar = coincidentesEnFecha;
    let fallbackOtrasFechas = false;

    if (queryNorm && coincidentesEnFecha.length === 0 && coincidentesBusqueda.length > 0) {
      listaAFiltrar = coincidentesBusqueda;
      fallbackOtrasFechas = true;
    }

    const territorialConfig = getTerritorialConfig(zona, configTerritorial);

    const ordenados = [...listaAFiltrar].sort((a, b) => {
      // Si estamos mostrando otras fechas o es filtro "proximos", orden cronológico por día
      if (fallbackOtrasFechas || filtroTiempo === "proximos") {
        const ymdA = getFechaYMDDesdeISO(a.fecha_inicio);
        const ymdB = getFechaYMDDesdeISO(b.fecha_inicio);
        if (ymdA !== ymdB) {
          return ymdA.localeCompare(ymdB);
        }
      }

      // Prioridad territorial de categoría
      const esHospedajeA = a.tipo === "hospedaje";
      const esHospedajeB = b.tipo === "hospedaje";
      if (esHospedajeA !== esHospedajeB) {
        if (territorialConfig.criterioOrdenFeed === "hospedaje_primero") {
          return esHospedajeA ? -1 : 1;
        } else {
          return esHospedajeA ? 1 : -1;
        }
      }

      // Destacados primero
      if (a.destacado !== b.destacado) {
        return a.destacado ? -1 : 1;
      }

      // Horas del evento
      const minA = getMinutosDelDiaColombia(a.fecha_inicio);
      const minB = getMinutosDelDiaColombia(b.fecha_inicio);
      if (minA !== minB) {
        return minA - minB;
      }

      return a.titulo.localeCompare(b.titulo);
    });

    return { eventosFiltrados: ordenados, esEnOtrasFechas: fallbackOtrasFechas };
  }, [eventos, filtroTiempo, filtroCategoria, zona, configTerritorial, queryNorm]);

  // Telemetría debounced en Google Analytics para registrar intenciones de búsqueda
  useEffect(() => {
    const q = busqueda.trim();
    if (q.length < 2) return;
    const timer = setTimeout(() => {
      trackSearch(q, zona, eventosFiltrados.length);
    }, 800);
    return () => clearTimeout(timer);
  }, [busqueda, zona, eventosFiltrados.length]);

  // Lista ordenada de categorías para navegación por swipe horizontal (incluyendo null = "Todos")
  const listaCategorias = useMemo(() => {
    const catsZona = getCategoriasParaZona(zona, configTerritorial);
    return [null, ...catsZona.map((c) => c.id)] as (CategoriaEvento | null)[];
  }, [zona, configTerritorial]);

  // Hook desacoplado de gestos táctiles para cambio de categorías con swipe horizontal
  const { containerRef, animClass } = useSwipeCategoryNav({
    categorias: listaCategorias,
    categoriaActiva: filtroCategoria,
    onCategoriaChange: setFiltroCategoria,
  });

  return (
    <div className="space-y-6">
      <EventFilters
        tiempoActivo={filtroTiempo}
        categoriaActiva={filtroCategoria}
        zonaSlug={zona}
        configTerritorial={configTerritorial}
        busqueda={busqueda}
        onBusquedaChange={setBusqueda}
        onTiempoChange={setFiltroTiempo}
        onCategoriaChange={setFiltroCategoria}
      />

      {/* Indicador de resultados de búsqueda si hay texto activo */}
      {busqueda.trim() && eventosFiltrados.length > 0 && (
        esEnOtrasFechas ? (
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-forest/5 border border-forest/15 text-forest text-xs font-sans shadow-2xs">
            <div className="flex items-center gap-2">
              <span className="text-sm select-none">💡</span>
              <span>{tFilters("otherDaysResults", { query: busqueda })}</span>
            </div>
            <button
              onClick={() => setBusqueda("")}
              className="font-bold underline ml-2 shrink-0 cursor-pointer text-terra hover:text-terra-dark"
            >
              {tFilters("clear")}
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between text-xs text-stone font-sans px-1">
            <span>{tFilters("searchResultsCount", { count: eventosFiltrados.length, query: busqueda })}</span>
            <button
              onClick={() => setBusqueda("")}
              className="text-terra hover:text-terra-dark font-semibold underline cursor-pointer"
            >
              {tFilters("clear")}
            </button>
          </div>
        )
      )}

      {/* Contenedor del feed con navegación táctil swipe fluida */}
      <div ref={containerRef} className={`space-y-4 touch-pan-y select-none ${animClass}`}>
        {eventosFiltrados.length === 0 ? (
          <div className="text-center py-14 px-4 rounded-3xl bg-white/40 border border-stone-light/60 text-stone">
            {busqueda.trim() ? (
              <>
                <p className="text-4xl mb-3">🔍</p>
                <p className="font-serif text-lg text-forest font-medium">
                  {tFeed("noSearchResults", { query: busqueda })}
                </p>
                <p className="font-sans text-xs text-stone mt-1 max-w-xs mx-auto">
                  {tFeed("noSearchResultsHint")}
                </p>
                <button
                  onClick={() => setBusqueda("")}
                  className="mt-5 inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-forest text-cream font-sans text-xs font-semibold shadow-xs hover:bg-forest/90 active:scale-95 transition-all cursor-pointer"
                >
                  <span>✕</span>
                  <span>{tFilters("clearSearch")}</span>
                </button>
              </>
            ) : (
              <>
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
              </>
            )}
          </div>
        ) : (
          eventosFiltrados.map((evento, index) => (
            <EventCard
              key={evento.id}
              evento={evento}
              zona={zona}
              priority={index === 0}
            />
          ))
        )}
      </div>
    </div>
  );
}
