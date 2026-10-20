"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "@/i18n/routing";
import { ZONAS } from "@/constants";
import type { ZonaSlug } from "@/lib/types";

interface ZoneSwitcherProps {
  currentZona: ZonaSlug;
}

export function ZoneSwitcher({ currentZona }: ZoneSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Guardar en cookie la zona actual para que el acceso directo de la PWA abra siempre la última zona visitada
  useEffect(() => {
    document.cookie = `padonde_zona=${currentZona}; path=/; max-age=31536000; SameSite=Lax`;
  }, [currentZona]);

  // Cerrar dropdown al hacer click afuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const zonasActivas = ZONAS.filter((z) => z.activa);
  const zonaActual = ZONAS.find((z) => z.slug === currentZona) || zonasActivas[0];

  function handleSelectZona(slug: ZonaSlug) {
    if (slug === currentZona) {
      setIsOpen(false);
      return;
    }
    document.cookie = `padonde_zona=${slug}; path=/; max-age=31536000; SameSite=Lax`;
    setIsOpen(false);
    router.push(`/${slug}`);
  }

  return (
    <div className="relative inline-block" ref={containerRef}>
      {/* Botón trigger discreto y elegante */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-1 px-2 py-0.5 -my-0.5 rounded-lg bg-stone-light/40 hover:bg-stone-light/70 text-forest text-xs font-sans font-semibold transition-all cursor-pointer border border-stone-light/60 active:scale-95"
        aria-label="Cambiar de destino"
        title="Cambiar destino turístico"
      >
        <span className="text-[11px]">{zonaActual.slug === "mendihuaca" ? "🌊" : "🌿"}</span>
        <span>{zonaActual.nombre}</span>
        <span className="text-[9px] text-stone">▾</span>
      </button>

      {/* Menú desplegable */}
      {isOpen && (
        <div className="absolute left-0 top-full mt-1.5 w-48 bg-cream border border-stone-light/90 rounded-2xl shadow-lg p-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
          <p className="px-2.5 py-1 text-[10px] font-sans font-semibold uppercase tracking-wider text-stone/70">
            Destinos disponibles
          </p>
          <div className="space-y-0.5">
            {zonasActivas.map((zona) => {
              const isSelected = zona.slug === currentZona;
              return (
                <button
                  key={zona.slug}
                  onClick={() => handleSelectZona(zona.slug)}
                  className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-sans text-left transition-colors cursor-pointer ${
                    isSelected
                      ? "bg-forest text-white font-semibold shadow-xs"
                      : "text-forest hover:bg-white/80 font-medium"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span>{zona.slug === "mendihuaca" ? "🌊" : "🌿"}</span>
                    <span>{zona.nombre}</span>
                  </span>
                  {isSelected && <span className="text-xs">✓</span>}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
