"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { getCategoriasParaZona, type TerritorialUXConfig } from "@/constants";
import type { CategoriaEvento } from "@/lib/types";

interface EventFiltersProps {
  categoriaActiva: CategoriaEvento | null;
  zonaSlug?: string;
  configTerritorial?: Record<string, TerritorialUXConfig>;
  onCategoriaChange: (categoria: CategoriaEvento | null) => void;
  // Prop opcional para retrocompatibilidad
  tiempoActivo?: string;
  onTiempoChange?: (filtro: any) => void;
}

/**
 * Filtros del feed público:
 * Carrusel horizontal de categorías por territorio ("Todos", "Tours", "Comida", "Rumba", etc.).
 * La selección de fecha y ordenamiento se gestiona desde el menú de cabecera (...) para no empujar las tarjetas hacia abajo.
 */
export function EventFilters({
  categoriaActiva,
  zonaSlug,
  configTerritorial,
  onCategoriaChange,
}: EventFiltersProps) {
  const tCat = useTranslations("categories");

  // Categorías ordenadas contextualmente según la región activa
  const categoriasDisponibles = useMemo(
    () => getCategoriasParaZona(zonaSlug, configTerritorial),
    [zonaSlug, configTerritorial]
  );

  function handleCategoria(id: CategoriaEvento | null) {
    onCategoriaChange(id);
  }

  return (
    <div className="flex gap-2.5 overflow-x-auto pb-1 scrollbar-none -mx-4 px-4 sm:mx-0 sm:px-0">
      {/* Botón para ver "Todos los planes" */}
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
  );
}
