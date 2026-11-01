"use client";

import { useState, useMemo } from "react";
import { useTranslations, useLocale } from "next-intl";
import { getCategoriasParaZona, type TerritorialUXConfig } from "@/constants";
import {
  getOpcionesTiempoColombia,
  TIMEZONE_COLOMBIA,
} from "@/lib/utils";
import type { CategoriaEvento, FiltroTiempo } from "@/lib/types";

interface EventFiltersProps {
  tiempoActivo: FiltroTiempo;
  categoriaActiva: CategoriaEvento | null;
  zonaSlug?: string;
  configTerritorial?: Record<string, TerritorialUXConfig>;
  onTiempoChange: (filtro: FiltroTiempo) => void;
  onCategoriaChange: (categoria: CategoriaEvento | null) => void;
}

/**
 * Filtros del feed público:
 * 1. Tiempo: Selector de 7 días (Hoy, Mañana, y los 5 días siguientes en hora Colombia).
 * 2. Categorías: "Todos" + categorías ordenadas contextualmente por territorio con scroll táctil.
 */
export function EventFilters({
  tiempoActivo,
  categoriaActiva,
  zonaSlug,
  configTerritorial,
  onTiempoChange,
  onCategoriaChange,
}: EventFiltersProps) {
  const tFilters = useTranslations("filters");
  const tCat = useTranslations("categories");
  const locale = useLocale();

  // Generamos los días disponibles según el reloj de Colombia
  const opcionesTiempo = useMemo(() => {
    const rawOpciones = getOpcionesTiempoColombia();

    return rawOpciones.map((op) => {
      if (op.id === "hoy") {
        return { ...op, label: tFilters("today") };
      }
      if (op.id === "manana") {
        return { ...op, label: tFilters("tomorrow") };
      }
      if (op.id === "proximos") {
        return { ...op, label: tFilters("upcoming") };
      }

      // Para los días específicos (ej. 2026-10-16), formateamos con el locale activo (es/en/fr)
      if (op.ymd) {
        const [year, month, day] = op.ymd.split("-").map(Number);
        const d = new Date(year, month - 1, day, 12, 0, 0); // Mediodía para evitar cualquier desfase horario
        const formatted = new Intl.DateTimeFormat(locale, {
          timeZone: TIMEZONE_COLOMBIA,
          weekday: "short",
          day: "numeric",
        }).format(d);
        const labelCap = formatted.charAt(0).toUpperCase() + formatted.slice(1).replace(".", "");
        return { ...op, label: labelCap };
      }

      return op;
    });
  }, [tFilters, locale]);

  // Categorías ordenadas contextualmente según la región activa
  const categoriasDisponibles = useMemo(
    () => getCategoriasParaZona(zonaSlug, configTerritorial),
    [zonaSlug, configTerritorial]
  );

  function handleTiempo(filtro: FiltroTiempo) {
    onTiempoChange(filtro);
  }

  function handleCategoria(id: CategoriaEvento | null) {
    onCategoriaChange(id);
  }

  return (
    <div className="space-y-4">
      {/* 1. SELECTOR COMPACTO DE FECHA / CUÁNDO (Hoy, Mañana, Fin de Semana, Todos) */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5 -mx-4 px-4 sm:mx-0 sm:px-0">
        {[
          { id: "hoy", label: tFilters("today"), emoji: "📅" },
          { id: "manana", label: tFilters("tomorrow"), emoji: "🌅" },
          { id: "fin_de_semana", label: locale === "en" ? "Weekend" : locale === "fr" ? "Week-end" : locale === "de" ? "Wochenende" : "Fin de semana", emoji: "🎉" },
          { id: "todos", label: locale === "en" ? "All upcoming" : locale === "fr" ? "Tous les plans" : locale === "de" ? "Alle Termine" : "Todos los planes", emoji: "✨" },
        ].map(({ id, label, emoji }) => {
          const isSelected = tiempoActivo === id;
          return (
            <button
              key={id}
              onClick={() => handleTiempo(id)}
              className={[
                "shrink-0 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-sans transition-all duration-150 cursor-pointer shadow-2xs active:scale-95",
                isSelected
                  ? "bg-forest text-cream font-bold shadow-xs scale-[1.02]"
                  : "bg-white/80 border border-stone-light/80 text-stone hover:text-forest hover:bg-white",
              ].join(" ")}
            >
              <span className="text-xs select-none">{emoji}</span>
              <span className="whitespace-nowrap">{label}</span>
            </button>
          );
        })}
      </div>

      {/* 2. FILTROS DE CATEGORÍA (Sin flechas, scroll táctil fluido) */}
      <div className="flex gap-2.5 overflow-x-auto pb-1 scrollbar-none -mx-4 px-4 sm:mx-0 sm:px-0">
        {/* Botón para ver "Todos los planes de este día" */}
        <button
          id="btn-cat-all"
          onClick={() => handleCategoria(null)}
          className={[
            "flex-shrink-0 flex flex-col items-center justify-center gap-1 min-w-[70px] px-3.5 py-2.5 rounded-2xl text-xs font-sans transition-all duration-150 cursor-pointer shadow-xs",
            categoriaActiva === null
              ? "bg-forest text-white"
              : "bg-white/60 border border-stone-light/60 text-stone hover:text-forest",
          ].join(" ")}
        >
          <span className="text-xl">✨</span>
          <span className="font-medium tracking-tight">{tCat("all")}</span>
        </button>

        {/* Categorías específicas según el orden territorial */}
        {categoriasDisponibles.map(({ id, emoji }) => {
          const isSelected = categoriaActiva === id;
          return (
            <button
              key={id}
              id={`btn-cat-${id}`}
              onClick={() => handleCategoria(isSelected ? null : id)}
              className={[
                "flex-shrink-0 flex flex-col items-center justify-center gap-1 min-w-[72px] px-3.5 py-2.5 rounded-2xl text-xs font-sans transition-all duration-150 cursor-pointer shadow-xs",
                isSelected
                  ? "bg-forest text-white"
                  : "bg-white/60 border border-stone-light/60 text-stone hover:text-forest",
              ].join(" ")}
            >
              <span className="text-xl">{emoji}</span>
              <span className="font-medium tracking-tight truncate max-w-[84px]">
                {tCat(id)}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
