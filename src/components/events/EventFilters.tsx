"use client";

import { useState, useMemo } from "react";
import { useTranslations, useLocale } from "next-intl";
import { CATEGORIAS } from "@/constants";
import {
  getOpcionesTiempoColombia,
  TIMEZONE_COLOMBIA,
} from "@/lib/utils";
import type { CategoriaEvento, FiltroTiempo } from "@/lib/types";

interface EventFiltersProps {
  onTiempoChange: (filtro: FiltroTiempo) => void;
  onCategoriaChange: (categoria: CategoriaEvento | null) => void;
}

/**
 * Filtros del feed público:
 * 1. Tiempo: Selector de 7 días (Hoy, Mañana, Días de la semana) + Fin de semana (hora Colombia).
 * 2. Categorías: "Todos" + categorías deslizables con indicador visual de scroll.
 */
export function EventFilters({ onTiempoChange, onCategoriaChange }: EventFiltersProps) {
  const tFilters = useTranslations("filters");
  const tCat = useTranslations("categories");
  const locale = useLocale();

  const [tiempoActivo, setTiempoActivo] = useState<FiltroTiempo>("hoy");
  const [categoriaActiva, setCategoriaActiva] = useState<CategoriaEvento | null>(null);

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
      if (op.id === "finde") {
        return { ...op, label: tFilters("weekend") };
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

  function handleTiempo(filtro: FiltroTiempo) {
    setTiempoActivo(filtro);
    onTiempoChange(filtro);
  }

  function handleCategoria(id: CategoriaEvento | null) {
    setCategoriaActiva(id);
    onCategoriaChange(id);
  }

  return (
    <div className="space-y-4">
      {/* 1. SELECTOR DE TIEMPO DESLIZABLE (Hoy, Mañana, Días específicos, Fin de semana) */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none -mx-4 px-4 sm:mx-0 sm:px-0">
        {opcionesTiempo.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => handleTiempo(id)}
            className={[
              "flex-shrink-0 px-4 py-2 rounded-full text-sm font-sans font-medium transition-all duration-150 cursor-pointer",
              tiempoActivo === id
                ? "bg-terra text-white shadow-xs"
                : "border border-stone-light/80 bg-white/40 text-stone hover:border-forest hover:text-forest",
            ].join(" ")}
          >
            {label}
          </button>
        ))}
      </div>

      {/* 2. FILTROS DE CATEGORÍA CON PEEK EFFECT E INDICADOR DE DESLIZAMIENTO */}
      <div className="relative">
        <div className="flex gap-2.5 overflow-x-auto pb-1 scrollbar-none -mx-4 px-4 sm:mx-0 sm:px-0">
          {/* Botón para ver "Todos los planes de este día" */}
          <button
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

          {/* Categorías específicas */}
          {CATEGORIAS.map(({ id, emoji }) => {
            const isSelected = categoriaActiva === id;
            return (
              <button
                key={id}
                onClick={() => handleCategoria(isSelected ? null : id)}
                className={[
                  "flex-shrink-0 flex flex-col items-center justify-center gap-1 min-w-[70px] px-3.5 py-2.5 rounded-2xl text-xs font-sans transition-all duration-150 cursor-pointer shadow-xs",
                  isSelected
                    ? "bg-forest text-white"
                    : "bg-white/60 border border-stone-light/60 text-stone hover:text-forest",
                ].join(" ")}
              >
                <span className="text-xl">{emoji}</span>
                <span className="font-medium tracking-tight truncate max-w-[64px]">
                  {tCat(id)}
                </span>
              </button>
            );
          })}
        </div>

        {/* Gradiente sutil a la derecha para indicar que hay más opciones para arrastrar */}
        <div className="pointer-events-none absolute right-0 top-0 bottom-1 w-8 bg-gradient-to-l from-cream to-transparent sm:hidden" />
      </div>
    </div>
  );
}
