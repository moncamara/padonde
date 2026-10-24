"use client";

import { useTranslations } from "next-intl";
import { AdminSecretTrigger } from "@/components/layout/AdminSecretTrigger";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";
import { ShareButton } from "@/components/events/ShareButton";
import { useZonaSearch } from "@/context/SearchContext";

interface ZonaHeaderProps {
  zonaNombre: string;
  zonaSlug: string;
  locale: string;
}

export function ZonaHeader({ zonaNombre, zonaSlug, locale }: ZonaHeaderProps) {
  const tHeader = useTranslations("header");
  const tFilters = useTranslations("filters");
  const { busqueda, setBusqueda, isSearchOpen, toggleSearch, inputRef } = useZonaSearch();

  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-cream/95 backdrop-blur-md border-b border-stone-light/80 px-4 py-3 shadow-xs transition-all">
      <div className="max-w-lg mx-auto">
        {/* Fila principal del Header */}
        <div className="flex items-center justify-between gap-3">
          <div className="space-y-0.5">
            <AdminSecretTrigger>
              <h1 className="font-serif text-3xl text-forest tracking-tight leading-none">
                PaDónde
              </h1>
            </AdminSecretTrigger>
            <p className="font-sans text-xs text-stone mt-0.5">
              {tHeader("subtitle", { zona: zonaNombre })}
            </p>
          </div>

          {/* Columna derecha: Idiomas arriba, Buscador + Compartir abajo */}
          <div className="flex flex-col items-end gap-1.5 shrink-0">
            <LanguageSwitcher />
            <div className="flex items-center gap-1.5">
              {/* Botón Lupa elegante para búsqueda móvil */}
              <button
                id="btn-header-search"
                type="button"
                onClick={toggleSearch}
                aria-label={tFilters("searchPlaceholder")}
                className={`p-2 rounded-xl transition-all duration-150 cursor-pointer flex items-center justify-center ${
                  isSearchOpen || busqueda
                    ? "bg-forest text-white shadow-xs scale-105"
                    : "bg-white/70 hover:bg-white text-forest border border-stone-light/80 hover:border-forest/40 shadow-2xs"
                }`}
              >
                <span className="text-sm select-none">🔍</span>
              </button>

              <ShareButton
                title={`PaDónde 🌿 Cartelera de ${zonaNombre}`}
                text={`Descubre planes, eventos, rumba, hospedajes en ${zonaNombre} - PaDónde`}
                url={`https://www.padonde.lat/${locale}/${zonaSlug}`}
                zonaNombre={zonaNombre}
                variant="header"
              />
            </div>
          </div>
        </div>

        {/* Buscador deslizable y colapsable */}
        {isSearchOpen && (
          <div className="pt-2.5 pb-0.5 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="relative flex items-center">
              <span className="absolute left-3 text-stone/70 pointer-events-none text-xs select-none">
                🔍
              </span>
              <input
                ref={inputRef}
                id="input-buscador-feed"
                type="text"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder={tFilters("searchPlaceholder")}
                aria-label={tFilters("searchPlaceholder")}
                className="w-full pl-8 pr-8 py-2 bg-white text-stone-dark placeholder:text-stone/60 border border-stone-light/80 focus:border-forest/50 focus:ring-2 focus:ring-forest/15 rounded-xl text-xs sm:text-sm font-sans transition-all outline-none shadow-xs"
              />
              {busqueda ? (
                <button
                  type="button"
                  id="btn-limpiar-busqueda"
                  onClick={() => setBusqueda("")}
                  aria-label={tFilters("clearSearch")}
                  className="absolute right-2 p-1 text-stone hover:text-stone-dark rounded-full hover:bg-stone-light/60 transition-colors cursor-pointer"
                >
                  <span className="text-xs font-bold leading-none select-none">✕</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={toggleSearch}
                  aria-label="Cerrar"
                  className="absolute right-2 p-1 text-stone/60 hover:text-stone-dark rounded-full hover:bg-stone-light/60 transition-colors cursor-pointer"
                >
                  <span className="text-xs font-bold leading-none select-none">✕</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
