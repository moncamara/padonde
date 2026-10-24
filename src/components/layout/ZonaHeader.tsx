"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { useSearchParams } from "next/navigation";
import { AdminSecretTrigger } from "@/components/layout/AdminSecretTrigger";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";
import { ShareButton } from "@/components/events/ShareButton";
import { useZonaSearch } from "@/context/SearchContext";
import { trackDestinationSwitch } from "@/lib/analytics";

interface ZonaHeaderProps {
  zonaNombre: string;
  zonaSlug: string;
  locale: string;
}

export function ZonaHeader({ zonaNombre, zonaSlug, locale }: ZonaHeaderProps) {
  const tHeader = useTranslations("header");
  const tFilters = useTranslations("filters");
  const { busqueda, setBusqueda, isSearchOpen, toggleSearch, inputRef } = useZonaSearch();
  const searchParams = useSearchParams();
  const queryString = searchParams.toString() ? `?${searchParams.toString()}` : "";

  const handleSelectZona = (targetSlug: string) => {
    if (targetSlug === zonaSlug) return;
    try {
      localStorage.setItem("padonde_zona", targetSlug);
      document.cookie = `padonde_zona=${targetSlug}; path=/; max-age=31536000; SameSite=Lax`;
    } catch {}
    trackDestinationSwitch(zonaSlug, targetSlug);
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-cream/95 backdrop-blur-md border-b border-stone-light/80 px-4 py-2.5 sm:py-3 shadow-xs transition-all">
      <div className="max-w-lg mx-auto">
        {/* Fila principal del Header */}
        <div className="flex items-center justify-between gap-3">
          <div className="space-y-0.5">
            <AdminSecretTrigger>
              <h1 className="font-serif text-2xl sm:text-3xl text-forest tracking-tight leading-none">
                PaDónde
              </h1>
            </AdminSecretTrigger>
            <p className="font-sans text-[11px] sm:text-xs text-stone mt-0.5">
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

        {/* Selector de Destino Minimalista y Ultra-Liviano (1-Clic Mobile-First) */}
        <div className="flex items-center gap-1.5 mt-2.5 pt-2 border-t border-stone-light/50">
          <div className="flex items-center p-0.5 bg-stone-light/50 rounded-2xl w-full shadow-2xs">
            <Link
              href={`/minca${queryString}`}
              onClick={() => handleSelectZona("minca")}
              className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-sans transition-all flex items-center justify-center gap-1.5 select-none ${
                zonaSlug === "minca"
                  ? "bg-forest text-cream font-bold shadow-xs scale-[1.01]"
                  : "text-stone hover:text-forest font-medium"
              }`}
            >
              <span className="text-sm">🌿</span>
              <span>Minca</span>
              {zonaSlug === "minca" && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse ml-0.5" />
              )}
            </Link>

            <Link
              href={`/mendihuaca${queryString}`}
              onClick={() => handleSelectZona("mendihuaca")}
              className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-sans transition-all flex items-center justify-center gap-1.5 select-none ${
                zonaSlug === "mendihuaca"
                  ? "bg-forest text-cream font-bold shadow-xs scale-[1.01]"
                  : "text-stone hover:text-forest font-medium"
              }`}
            >
              <span className="text-sm">🌊</span>
              <span>Mendihuaca</span>
              {zonaSlug === "mendihuaca" && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse ml-0.5" />
              )}
            </Link>
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
                type="search"
                enterKeyHint="search"
                autoComplete="off"
                autoCorrect="off"
                spellCheck={false}
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    inputRef.current?.blur();
                  }
                }}
                placeholder={tFilters("searchPlaceholder")}
                aria-label={tFilters("searchPlaceholder")}
                className="w-full pl-8 pr-8 py-2 bg-white text-stone-dark placeholder:text-stone/60 border border-stone-light/80 focus:border-forest/50 focus:ring-2 focus:ring-forest/15 rounded-xl text-base sm:text-sm font-sans transition-all outline-none shadow-xs [&::-webkit-search-cancel-button]:hidden [&::-webkit-search-decoration]:hidden"
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
