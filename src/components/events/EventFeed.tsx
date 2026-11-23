"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { useTranslations, useLocale } from "next-intl";
import { EventCard } from "@/components/events/EventCard";
import { EventFilters } from "@/components/events/EventFilters";
import { CapsulaTerritorial } from "@/components/layout/CapsulaTerritorial";
import type { CategoriaEvento, EventoConNegocio, FiltroTiempo } from "@/lib/types";
import {
  getTerritorialConfig,
  getCategoriasParaZona,
  type TerritorialUXConfig,
} from "@/constants";
import { useSwipeCategoryNav } from "@/hooks/useSwipeCategoryNav";
import {
  eventoCoincideConFiltroTiempo,
  esEventoVigente,
  getFechaYMDColombia,
  getFechaYMDDesdeISO,
  getMinutosDelDiaColombia,
} from "@/lib/utils";
import { trackSearch } from "@/lib/analytics";
import { useZonaSearch } from "@/context/SearchContext";
import { normalizarTextoBusqueda } from "@/lib/utils/text";

interface EventFeedProps {
  eventos: EventoConNegocio[];
  zona: string;
  configTerritorial?: Record<string, TerritorialUXConfig>;
}

/**
 * Hash determinístico FNV-1a de 32 bits para rotación diaria equitativa (100% compatible con SSG/ISR sin desajuste de hidratación).
 */
function hashDeterministicoDiario(seedStr: string): number {
  let hash = 2166136261;
  for (let i = 0; i < seedStr.length; i++) {
    hash ^= seedStr.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

/**
 * Calcula el timestamp de última actividad o vigencia más reciente de una publicación/aliado.
 */
function getTimestampActividadPublica(
  e: EventoConNegocio,
  fechasEdicionAliados?: Record<string, string>
): number {
  let maxTs = 0;

  const checkDate = (val?: string | null) => {
    if (!val) return;
    const t = new Date(val).getTime();
    if (!Number.isNaN(t) && t > maxTs) maxTs = t;
  };

  const checkUrlTs = (url?: string | null) => {
    if (!url || typeof url !== "string") return;
    const m = url.match(/(?:^|\/|-)((?:17|18)\d{11})(?:-|\.)/);
    if (m && m[1]) {
      const ts = Number(m[1]);
      if (Number.isFinite(ts) && ts > maxTs) maxTs = ts;
    }
  };

  checkDate((e.metadata_hospedaje as any)?.ultima_edicion);
  checkDate((e as any).updated_at);
  checkDate(e.created_at);
  if (e.negocio_id && fechasEdicionAliados?.[e.negocio_id]) {
    checkDate(fechasEdicionAliados[e.negocio_id]);
  }
  checkUrlTs(e.imagen_url);
  if (Array.isArray(e.metadata_hospedaje?.galeria_fotos)) {
    e.metadata_hospedaje.galeria_fotos.forEach(checkUrlTs);
  }

  return maxTs;
}

function eventoCoincideConBusqueda(e: EventoConNegocio, queryNorm: string): boolean {
  if (!queryNorm) return true;
  if (normalizarTextoBusqueda(e.titulo).includes(queryNorm)) return true;
  if (e.descripcion && normalizarTextoBusqueda(e.descripcion).includes(queryNorm)) return true;
  if (e.negocio?.nombre && normalizarTextoBusqueda(e.negocio.nombre).includes(queryNorm)) return true;
  if (normalizarTextoBusqueda(e.tipo).includes(queryNorm)) return true;
  if (e.categorias?.some((c) => normalizarTextoBusqueda(c).includes(queryNorm))) return true;
  if (
    e.metadata_hospedaje?.habitaciones?.some(
      (h) =>
        normalizarTextoBusqueda(h.titulo).includes(queryNorm) ||
        (h.descripcion && normalizarTextoBusqueda(h.descripcion).includes(queryNorm)) ||
        h.badges?.some((b) =>
          normalizarTextoBusqueda(typeof b === "object" ? b?.texto || "" : String(b || "")).includes(queryNorm)
        )
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

  const { busqueda, setBusqueda, filtroTiempo, setFiltroTiempo } = useZonaSearch();

  const [filtroCategoria, setFiltroCategoriaState] = useState<CategoriaEvento | null>(null);
  const prevZonaRef = useRef(zona);

  // Restaurar categoría previamente seleccionada tras la hidratación en el cliente
  useEffect(() => {
    try {
      const savedCat = sessionStorage.getItem("padonde_filtro_categoria");
      const lastCardId = sessionStorage.getItem("padonde_last_card");
      if (savedCat) {
        // Si venimos de regreso a una ficha específica y esa ficha no pertenece a savedCat, mostrar "Todos" para que la ficha sea visible
        if (lastCardId && lastCardId.startsWith("card-evento-")) {
          const targetId = lastCardId.replace("card-evento-", "");
          const targetEv = eventos.find((e) => e.id === targetId);
          const matchesSavedCat = targetEv
            ? targetEv.categorias?.length
              ? targetEv.categorias.includes(savedCat as CategoriaEvento)
              : targetEv.tipo === savedCat
            : true;
          if (!matchesSavedCat) {
            setFiltroCategoriaState(null);
            sessionStorage.removeItem("padonde_filtro_categoria");
            return;
          }
        }
        setFiltroCategoriaState(savedCat as CategoriaEvento);
      }
    } catch {}
  }, [eventos]);

  // Al cambiar de destino (Mendihuaca <-> Minca), reiniciar la categoría a "Todos"
  useEffect(() => {
    if (prevZonaRef.current !== zona) {
      prevZonaRef.current = zona;
      setFiltroCategoriaState(null);
      try {
        sessionStorage.removeItem("padonde_filtro_categoria");
      } catch {}
    }
  }, [zona]);

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

  const nowRef = useRef(new Date());
  const queryNorm = normalizarTextoBusqueda(busqueda);

  // Filtrado de eventos por categoría, búsqueda y fecha con fallback inteligente a otras fechas
  const { eventosFiltrados, esEnOtrasFechas } = useMemo(() => {
    const now = nowRef.current;

    // 1. Regla Mandatoria de Estado (Pre-Filtro Inmediato):
    // Ningún evento inactivo entra al array público ni a la búsqueda
    const eventosDisponibles = eventos.filter((e) => e.activo !== false);

    // 2. Lógica Unificada de Vigencia Temporal (!eventoHaCaducado):
    // Restringir estrictamente a eventos vigentes evaluados en hora de Colombia (America/Bogota)
    const eventosBuscables = eventosDisponibles.filter((e) => esEventoVigente(e, now));

    // 3. Filtrar por categoría seleccionada
    const porCategoria =
      filtroCategoria === null
        ? eventosBuscables
        : eventosBuscables.filter((e) =>
            e.categorias?.length
              ? e.categorias.includes(filtroCategoria)
              : e.tipo === filtroCategoria
          );

    // 4. Pipeline de Búsqueda Textual sobre eventos activos y vigentes:
    const coincidentesBusqueda = !queryNorm
      ? porCategoria
      : porCategoria.filter((e) => eventoCoincideConBusqueda(e, queryNorm));

    // 5. Filtrar por fecha con validación null-safe de recurrencia y huso horario Colombia
    const coincidentesEnFecha = coincidentesBusqueda.filter((e) => {
      if (filtroCategoria === "hospedaje") {
        return e.categorias?.length ? e.categorias.includes("hospedaje") : e.tipo === "hospedaje";
      }

      return eventoCoincideConFiltroTiempo(
        e.fecha_inicio,
        filtroTiempo,
        now,
        e.fecha_fin,
        e.descripcion,
        e.tipo,
        e.metadata_hospedaje,
        e.dias_recurrentes,
        e.es_recurrente
      );
    });

    // 6. Fallback inteligente: si hay búsqueda activa pero no hay eventos en esta fecha puntual,
    // pero sí en otras fechas vigentes/futuras, mostramos los de otras fechas con aviso amigable
    let listaAFiltrar = coincidentesEnFecha;
    let fallbackOtrasFechas = false;

    if (queryNorm && coincidentesEnFecha.length === 0 && coincidentesBusqueda.length > 0) {
      listaAFiltrar = coincidentesBusqueda;
      fallbackOtrasFechas = true;
    }

    const territorialConfig = getTerritorialConfig(zona, configTerritorial);
    const ordenPublicoConfig = (configTerritorial as any)?._ordenPublicoAliados as
      | {
          estrategia?: "rotacion_diaria" | "actividad_reciente" | "curaduria_manual";
          posicionesManuales?: Record<string, number>;
          fechasEdicionAliados?: Record<string, string>;
        }
      | undefined;
    const estrategiaActiva = ordenPublicoConfig?.estrategia || "rotacion_diaria";
    const posicionesManuales = ordenPublicoConfig?.posicionesManuales || {};
    const fechasEdicionAliados = ordenPublicoConfig?.fechasEdicionAliados || {};
    const semillaFechaColombia = getFechaYMDColombia(now);

    const ordenados = [...listaAFiltrar].sort((a, b) => {
      // 1. Jerarquía de Destacados en Cartelera (SIEMPRE PROTEGIDOS EN PRIMERAS POSICIONES):
      // Eventos con destacado === true (o es_destacado) encabecen estrictamente el listado antes de los eventos estándar
      const esDestacadoA = Boolean(a.destacado || (a as any).es_destacado);
      const esDestacadoB = Boolean(b.destacado || (b as any).es_destacado);
      if (esDestacadoA !== esDestacadoB) {
        return esDestacadoA ? -1 : 1;
      }
      if (esDestacadoA && esDestacadoB) {
        const rawA = Number((a as any).orden_destacado ?? a.metadata_hospedaje?.orden_destacado);
        const rawB = Number((b as any).orden_destacado ?? b.metadata_hospedaje?.orden_destacado);
        const ordenA = Number.isFinite(rawA) && rawA > 0 ? rawA : 99;
        const ordenB = Number.isFinite(rawB) && rawB > 0 ? rawB : 99;
        if (ordenA !== ordenB) {
          return ordenA - ordenB;
        }
      }

      // 2. Si estamos mostrando otras fechas o es filtro "proximos" o "todos", orden cronológico por día
      if (fallbackOtrasFechas || filtroTiempo === "proximos" || filtroTiempo === "todos") {
        const ymdA = getFechaYMDDesdeISO(a.fecha_inicio);
        const ymdB = getFechaYMDDesdeISO(b.fecha_inicio);
        if (ymdA !== ymdB) {
          return ymdA.localeCompare(ymdB);
        }
      }

      // 3. Prioridad territorial de categoría
      const esHospedajeA = a.tipo === "hospedaje";
      const esHospedajeB = b.tipo === "hospedaje";
      if (esHospedajeA !== esHospedajeB) {
        if (territorialConfig.criterioOrdenFeed === "hospedaje_primero") {
          return esHospedajeA ? -1 : 1;
        } else {
          return esHospedajeA ? 1 : -1;
        }
      }

      // 4. Estrategia configurable para Espacios No Destacados:
      if (!esDestacadoA && !esDestacadoB) {
        if (estrategiaActiva === "curaduria_manual") {
          const rawPosA = Number(
            (a.negocio_id ? posicionesManuales[a.negocio_id] : undefined) ??
              (a.negocio as any)?.posicion_manual ??
              (a.metadata_hospedaje as any)?.posicion_manual ??
              99
          );
          const rawPosB = Number(
            (b.negocio_id ? posicionesManuales[b.negocio_id] : undefined) ??
              (b.negocio as any)?.posicion_manual ??
              (b.metadata_hospedaje as any)?.posicion_manual ??
              99
          );
          const posA = Number.isFinite(rawPosA) && rawPosA > 0 ? rawPosA : 99;
          const posB = Number.isFinite(rawPosB) && rawPosB > 0 ? rawPosB : 99;
          if (posA !== posB) {
            return posA - posB;
          }
        } else if (estrategiaActiva === "actividad_reciente") {
          const actA = getTimestampActividadPublica(a, fechasEdicionAliados);
          const actB = getTimestampActividadPublica(b, fechasEdicionAliados);
          if (actA !== actB) {
            return actB - actA;
          }
        }

        // Modo Equitativo / Rotación Diaria (Por defecto y desempate determinístico cada 24h en hora de Colombia):
        const hashA = hashDeterministicoDiario(
          `${semillaFechaColombia}_${zona}_${a.negocio_id || a.id}_${a.id}`
        );
        const hashB = hashDeterministicoDiario(
          `${semillaFechaColombia}_${zona}_${b.negocio_id || b.id}_${b.id}`
        );
        if (hashA !== hashB) {
          return hashA - hashB;
        }
      }

      // 5. Fallback final determinista
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
      {/* Cápsula de Vibra Territorial (bajo demanda, no invasiva) */}
      <CapsulaTerritorial
        zonaSlug={zona}
        configTerritorial={configTerritorial}
      />

      <EventFilters
        tiempoActivo={filtroTiempo}
        categoriaActiva={filtroCategoria}
        zonaSlug={zona}
        configTerritorial={configTerritorial}
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
