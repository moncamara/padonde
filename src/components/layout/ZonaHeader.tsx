"use client";

import { useState } from "react";
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
  const [isMenuOpen, setIsMenuOpen] = useState(false);

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
        {/* Fila principal del Header (Compacta, 1 sola línea) */}
        <div className="flex items-center justify-between gap-2">
          {/* Marca + Selector de Destino Elegante en la misma fila */}
          <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
            <AdminSecretTrigger>
              <h1 className="font-serif text-2xl sm:text-3xl text-forest tracking-tight leading-none shrink-0">
                PaDónde
              </h1>
            </AdminSecretTrigger>

            {/* Dropdown elegante de destino (Mobile-First, no invade la pantalla) */}
            <div className="relative shrink-0">
              <button
                type="button"
                id="btn-selector-destino"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-full bg-stone-light/60 hover:bg-stone-light text-forest text-xs font-bold border border-stone-light/80 transition-all shadow-2xs active:scale-95 cursor-pointer"
                aria-expanded={isMenuOpen}
                aria-label={`Destino actual: ${zonaNombre}. Toca para cambiar.`}
              >
                <span>{zonaSlug === "mendihuaca" ? "🌊 Mendihuaca" : "🌿 Minca"}</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[9px] text-stone transition-transform duration-150 inline-block">
                  {isMenuOpen ? "▲" : "▼"}
                </span>
              </button>

              {/* Menú flotante interactivo de cambio de destino */}
              {isMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40 bg-black/10"
                    onClick={() => setIsMenuOpen(false)}
                  />
                  <div className="absolute top-full left-0 mt-2 w-60 p-2 bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-stone-light/80 z-50 animate-in fade-in zoom-in-95 duration-150">
                    <p className="px-3 py-1 text-[10px] uppercase font-bold text-stone tracking-wider">
                      Cambiar de Destino
                    </p>

                    <Link
                      href={`/minca${queryString}`}
                      onClick={() => {
                        handleSelectZona("minca");
                        setIsMenuOpen(false);
                      }}
                      className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs transition-all cursor-pointer ${
                        zonaSlug === "minca"
                          ? "bg-forest text-cream font-bold shadow-xs"
                          : "text-stone hover:bg-cream hover:text-forest"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="text-base">🌿</span>
                        <div>
                          <p className="font-bold text-xs leading-tight">Minca</p>
                          <p className={`text-[10px] mt-0.5 ${zonaSlug === "minca" ? "text-cream/80" : "text-stone"}`}>
                            Montaña, café & cascadas
                          </p>
                        </div>
                      </div>
                      {zonaSlug === "minca" && <span className="text-emerald-300 font-bold">✓</span>}
                    </Link>

                    <Link
                      href={`/mendihuaca${queryString}`}
                      onClick={() => {
                        handleSelectZona("mendihuaca");
                        setIsMenuOpen(false);
                      }}
                      className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs transition-all mt-1.5 cursor-pointer ${
                        zonaSlug === "mendihuaca"
                          ? "bg-forest text-cream font-bold shadow-xs"
                          : "text-stone hover:bg-cream hover:text-forest"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="text-base">🌊</span>
                        <div>
                          <p className="font-bold text-xs leading-tight">Mendihuaca</p>
                          <p className={`text-[10px] mt-0.5 ${zonaSlug === "mendihuaca" ? "text-cream/80" : "text-stone"}`}>
                            Playas vírgenes, surf & río
                          </p>
                        </div>
                      </div>
                      {zonaSlug === "mendihuaca" && <span className="text-emerald-300 font-bold">✓</span>}
                    </Link>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Columna derecha: Idiomas arriba, Buscador + Compartir abajo */}
          <div className="flex flex-col items-end gap-1 shrink-0">
            <LanguageSwitcher />
            <div className="flex items-center gap-1.5">
              {/* Botón Lupa elegante para búsqueda móvil */}
              <button
                id="btn-header-search"
                type="button"
                onClick={toggleSearch}
                aria-label={tFilters("searchPlaceholder")}
                className={`p-1.5 sm:p-2 rounded-xl transition-all duration-150 cursor-pointer flex items-center justify-center ${
                  isSearchOpen || busqueda
                    ? "bg-forest text-white shadow-xs scale-105"
                    : "bg-white/70 hover:bg-white text-forest border border-stone-light/80 hover:border-forest/40 shadow-2xs"
                }`}
              >
                <span className="text-xs sm:text-sm select-none">🔍</span>
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
