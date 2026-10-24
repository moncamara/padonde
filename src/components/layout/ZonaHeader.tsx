"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
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
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Cerrar menú con tecla ESC y bloquear scroll del body
  useEffect(() => {
    if (!isMenuOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsMenuOpen(false);
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isMenuOpen]);

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
          {/* Marca limpia + Subtítulo con el destino actual */}
          <div className="space-y-0.5 min-w-0">
            <AdminSecretTrigger>
              <h1 className="font-serif text-2xl sm:text-3xl text-forest tracking-tight leading-none">
                PaDónde
              </h1>
            </AdminSecretTrigger>
            <p className="font-sans text-[11px] sm:text-xs text-stone mt-0.5 truncate">
              {tHeader("subtitle", { zona: zonaNombre })}
            </p>
          </div>

          {/* Columna derecha: Idiomas arriba, Acciones abajo (Buscador, Compartir y Tres Puntitos WhatsApp) */}
          <div className="flex flex-col items-end gap-1.5 shrink-0">
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

              {/* Botón Tres Puntitos estilo WhatsApp para Selector Multizona */}
              <button
                id="btn-multizona-menu"
                type="button"
                onClick={() => setIsMenuOpen(true)}
                aria-expanded={isMenuOpen}
                aria-label={tHeader("changeDestination")}
                title={tHeader("changeDestination")}
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-150 cursor-pointer shadow-2xs active:scale-95 ${
                  isMenuOpen
                    ? "bg-forest text-cream shadow-xs scale-105"
                    : "bg-white/80 hover:bg-white text-forest border border-stone-light/90 hover:border-forest/40"
                }`}
              >
                <svg
                  className="w-4 h-4"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <circle cx="5" cy="12" r="2.2" />
                  <circle cx="12" cy="12" r="2.2" />
                  <circle cx="19" cy="12" r="2.2" />
                </svg>
              </button>
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

      {/* Portal montado directamente en document.body para máxima fluidez y GPU-acceleration (60fps) */}
      {mounted && createPortal(
        <div
          className={`fixed inset-0 z-[100] transition-all duration-300 ${
            isMenuOpen ? "pointer-events-auto" : "pointer-events-none"
          }`}
          aria-hidden={!isMenuOpen}
        >
          {/* Backdrop con fundido gradual y suave */}
          <div
            className={`fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity duration-300 ease-out ${
              isMenuOpen ? "opacity-100" : "opacity-0 pointer-events-none"
            }`}
            onClick={() => setIsMenuOpen(false)}
            aria-hidden="true"
          />

          {/* Panel lateral con curva de aceleración iOS ultra-fluida tanto al entrar como al salir */}
          <aside
            role="dialog"
            aria-modal="true"
            aria-label="Destinos PaDónde"
            className={`fixed top-0 right-0 bottom-0 z-[101] w-80 max-w-[85vw] h-full bg-[#FAF7F2] text-stone-dark border-l border-stone-light/80 shadow-2xl flex flex-col justify-between p-6 overflow-y-auto transform transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] will-change-transform ${
              isMenuOpen ? "translate-x-0" : "translate-x-full"
            }`}
          >
            <div className="space-y-6">
              {/* Cabecera del Drawer */}
              <div className="flex items-center justify-between pb-4 border-b border-stone-light/80">
                <div>
                  <h2 className="font-serif text-2xl text-forest font-bold tracking-tight leading-none">
                    PaDónde
                  </h2>
                  <p className="font-sans text-xs text-stone font-medium mt-1">
                    Destinos PaDónde
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setIsMenuOpen(false)}
                  aria-label="Cerrar menú"
                  className="w-9 h-9 rounded-full bg-white hover:bg-stone-light/60 border border-stone-light/80 text-stone-dark flex items-center justify-center transition-all cursor-pointer shadow-2xs active:scale-95"
                >
                  <span className="text-base font-bold leading-none select-none">✕</span>
                </button>
              </div>

              {/* Lista de Destinos */}
              <div className="space-y-3">
                <p className="text-xs font-sans font-semibold text-stone uppercase tracking-wider px-1">
                  Selecciona tu destino:
                </p>

                {/* Opción Minca */}
                <Link
                  href={`/minca${queryString}`}
                  onClick={() => {
                    handleSelectZona("minca");
                    setIsMenuOpen(false);
                  }}
                  className={`flex items-start justify-between p-4 rounded-2xl transition-all cursor-pointer ${
                    zonaSlug === "minca"
                      ? "bg-white border-2 border-forest text-forest shadow-sm scale-[1.01]"
                      : "bg-white/80 hover:bg-white border border-stone-light/90 hover:border-forest/40 shadow-2xs active:scale-98"
                  }`}
                >
                  <div className="flex items-start gap-3.5">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0 ${
                      zonaSlug === "minca" ? "bg-forest/10" : "bg-stone-light/40"
                    }`}>
                      🌿
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-base leading-tight text-forest">Minca</p>
                        {zonaSlug === "minca" && (
                          <span className="px-2 py-0.5 rounded-full bg-forest text-cream text-[10px] font-bold">
                            Actual
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-stone mt-1 leading-snug">
                        {tHeader("mincaTagline")}
                      </p>
                    </div>
                  </div>
                  {zonaSlug === "minca" ? (
                    <span className="text-forest font-bold text-base select-none pt-1">✓</span>
                  ) : (
                    <span className="text-stone/60 font-bold text-base select-none pt-1">→</span>
                  )}
                </Link>

                {/* Opción Mendihuaca */}
                <Link
                  href={`/mendihuaca${queryString}`}
                  onClick={() => {
                    handleSelectZona("mendihuaca");
                    setIsMenuOpen(false);
                  }}
                  className={`flex items-start justify-between p-4 rounded-2xl transition-all cursor-pointer ${
                    zonaSlug === "mendihuaca"
                      ? "bg-white border-2 border-forest text-forest shadow-sm scale-[1.01]"
                      : "bg-white/80 hover:bg-white border border-stone-light/90 hover:border-forest/40 shadow-2xs active:scale-98"
                  }`}
                >
                  <div className="flex items-start gap-3.5">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0 ${
                      zonaSlug === "mendihuaca" ? "bg-forest/10" : "bg-stone-light/40"
                    }`}>
                      🌊
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-base leading-tight text-forest">Mendihuaca</p>
                        {zonaSlug === "mendihuaca" && (
                          <span className="px-2 py-0.5 rounded-full bg-forest text-cream text-[10px] font-bold">
                            Actual
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-stone mt-1 leading-snug">
                        {tHeader("mendihuacaTagline")}
                      </p>
                    </div>
                  </div>
                  {zonaSlug === "mendihuaca" ? (
                    <span className="text-forest font-bold text-base select-none pt-1">✓</span>
                  ) : (
                    <span className="text-stone/60 font-bold text-base select-none pt-1">→</span>
                  )}
                </Link>
              </div>
            </div>

            {/* Pie del Drawer */}
            <div className="pt-6 border-t border-stone-light/80 text-center">
              <p className="font-serif italic text-xs text-stone">
                Sierra Nevada de Santa Marta & Caribe Colombiano 🌿
              </p>
            </div>
          </aside>
        </div>,
        document.body
      )}
    </header>
  );
}
