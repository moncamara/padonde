"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { CATEGORIAS } from "@/constants";
import type { CategoriaEvento, FiltroTiempo } from "@/lib/types";

interface EventFiltersProps {
  onTiempoChange: (filtro: FiltroTiempo) => void;
  onCategoriaChange: (categoria: CategoriaEvento | null) => void;
}

/**
 * Filtros del feed público: tiempo (Hoy/Mañana/Fin de semana) y categoría.
 * Utiliza next-intl para traducir dinámicamente según el locale activo.
 */
export function EventFilters({ onTiempoChange, onCategoriaChange }: EventFiltersProps) {
  const tFilters = useTranslations("filters");
  const tCat = useTranslations("categories");

  const [tiempoActivo, setTiempoActivo] = useState<FiltroTiempo>("hoy");
  const [categoriaActiva, setCategoriaActiva] = useState<CategoriaEvento | null>(null);

  const tiempoFiltros: { id: FiltroTiempo; label: string }[] = [
    { id: "hoy",    label: tFilters("today") },
    { id: "manana", label: tFilters("tomorrow") },
    { id: "finde",  label: tFilters("weekend") },
  ];

  function handleTiempo(filtro: FiltroTiempo) {
    setTiempoActivo(filtro);
    onTiempoChange(filtro);
  }

  function handleCategoria(id: CategoriaEvento) {
    const nueva = categoriaActiva === id ? null : id;
    setCategoriaActiva(nueva);
    onCategoriaChange(nueva);
  }

  return (
    <div className="space-y-4">
      {/* Filtros de tiempo */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {tiempoFiltros.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => handleTiempo(id)}
            className={[
              "flex-shrink-0 px-5 py-2 rounded-full text-sm font-sans font-medium transition-all duration-150",
              tiempoActivo === id
                ? "bg-terra text-white"
                : "border border-stone-light text-stone hover:border-forest hover:text-forest",
            ].join(" ")}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Filtros de categoría */}
      <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-none">
        {CATEGORIAS.map(({ id, emoji }) => (
          <button
            key={id}
            onClick={() => handleCategoria(id)}
            className={[
              "flex-shrink-0 flex flex-col items-center gap-1 px-3 py-2 rounded-xl text-xs font-sans transition-all duration-150",
              categoriaActiva === id
                ? "bg-forest text-white"
                : "text-stone hover:text-forest",
            ].join(" ")}
          >
            <span className="text-xl">{emoji}</span>
            <span>{tCat(id)}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
