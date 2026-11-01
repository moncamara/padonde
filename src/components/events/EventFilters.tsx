"use client";

import { useState, useMemo, useEffect } from "react";
import { useTranslations, useLocale } from "next-intl";
import { getCategoriasParaZona, type TerritorialUXConfig } from "@/constants";
import { getFechaYMDColombia, TIMEZONE_COLOMBIA } from "@/lib/utils";
import type { CategoriaEvento } from "@/lib/types";

interface EventFiltersProps {
  categoriaActiva: CategoriaEvento | null;
  zonaSlug?: string;
  configTerritorial?: Record<string, TerritorialUXConfig>;
  onCategoriaChange: (categoria: CategoriaEvento | null) => void;
  tiempoActivo?: string;
  onTiempoChange?: (filtro: string) => void;
}

export function EventFilters({
  categoriaActiva,
  zonaSlug,
  configTerritorial,
  onCategoriaChange,
  tiempoActivo = "hoy",
  onTiempoChange,
}: EventFiltersProps) {
  const tCat = useTranslations("categories");
  const tFilters = useTranslations("filters");
  const locale = useLocale();

  const [isModalOpen, setIsModalOpen] = useState(false);

  // Categorías ordenadas contextualmente según la región activa
  const categoriasDisponibles = useMemo(
    () => getCategoriasParaZona(zonaSlug, configTerritorial),
    [zonaSlug, configTerritorial]
  );

  // Bloquear scroll de la página de fondo cuando el modal de fecha está abierto
  useEffect(() => {
    if (!isModalOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsModalOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [isModalOpen]);

  // Lista dinámica de fechas: Hoy, Mañana, días de la semana (Martes, Miércoles, Jueves...), Fin de semana
  const opcionesFecha = useMemo(() => {
    const hoyColombia = new Date();
    const lista: { id: string; emoji: string; titulo: string; subtitulo: string }[] = [];

    // 1. Hoy
    lista.push({
      id: "hoy",
      emoji: "📅",
      titulo: tFilters("today"),
      subtitulo: locale === "en" ? "Plans happening today" : locale === "fr" ? "Plans prévus aujourd'hui" : locale === "de" ? "Pläne für heute" : "Planes que ocurren hoy",
    });

    // 2. Mañana
    const manana = new Date(hoyColombia);
    manana.setDate(manana.getDate() + 1);
    const mananaDiaNombre = new Intl.DateTimeFormat(locale === "en" ? "en-US" : "es-CO", {
      timeZone: TIMEZONE_COLOMBIA,
      weekday: "long",
    }).format(manana);

    lista.push({
      id: "manana",
      emoji: "🌅",
      titulo: tFilters("tomorrow"),
      subtitulo: mananaDiaNombre.charAt(0).toUpperCase() + mananaDiaNombre.slice(1),
    });

    // 3. Días específicos siguientes de la semana (ej: Martes, Miércoles, Jueves...)
    for (let i = 2; i <= 5; i++) {
      const dia = new Date(hoyColombia);
      dia.setDate(dia.getDate() + i);
      const ymd = getFechaYMDColombia(dia);

      const diaNombre = new Intl.DateTimeFormat(locale === "en" ? "en-US" : "es-CO", {
        timeZone: TIMEZONE_COLOMBIA,
        weekday: "long",
      }).format(dia);
      const diaCap = diaNombre.charAt(0).toUpperCase() + diaNombre.slice(1);

      const fechaCorta = new Intl.DateTimeFormat(locale === "en" ? "en-US" : "es-CO", {
        timeZone: TIMEZONE_COLOMBIA,
        day: "numeric",
        month: "short",
      }).format(dia);

      lista.push({
        id: ymd,
        emoji: "🗓️",
        titulo: diaCap,
        subtitulo: fechaCorta,
      });
    }

    // 4. Fin de semana (Sábado y domingo)
    lista.push({
      id: "fin_de_semana",
      emoji: "🎉",
      titulo: tFilters("weekend"),
      subtitulo: locale === "en" ? "Saturday & Sunday" : locale === "fr" ? "Samedi et dimanche" : locale === "de" ? "Samstag & Sonntag" : "Sábado y domingo",
    });

    return lista;
  }, [tFilters, locale]);

  // Resolver emoji y label para el botón de fecha visible
  const fechaActual = opcionesFecha.find((op) => op.id === tiempoActivo) || opcionesFecha[0];
  const esFechaFiltrada = Boolean(tiempoActivo && tiempoActivo !== "hoy" && opcionesFecha.some((op) => op.id === tiempoActivo));

  // Si había una fecha en sessionStorage que ya pasó y no está en las opciones válidas, resetear limpiamente a Hoy
  useEffect(() => {
    if (tiempoActivo !== "hoy" && !opcionesFecha.some((op) => op.id === tiempoActivo)) {
      if (onTiempoChange) {
        onTiempoChange("hoy");
      }
    }
  }, [tiempoActivo, opcionesFecha, onTiempoChange]);

  const handleSelectFecha = (id: string) => {
    if (onTiempoChange) {
      onTiempoChange(id);
    }
    setIsModalOpen(false);
  };

  return (
    <>
      {/* Fila Única Unificada de Navegación: Categorías + Selector de Fecha al final */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none -mx-4 px-4 sm:mx-0 sm:px-0">
        {/* 1. BOTÓN "TODOS LOS PLANES" DE LA CATEGORÍA */}
        <button
          id="btn-cat-all"
          type="button"
          onClick={() => onCategoriaChange(null)}
          className={[
            "flex-shrink-0 flex flex-col items-center justify-center gap-1 min-w-[70px] px-3.5 py-2.5 rounded-2xl text-xs font-sans transition-all duration-150 cursor-pointer shadow-xs",
            categoriaActiva === null
              ? "bg-forest text-white shadow-2xs"
              : "bg-white/60 border border-stone-light/60 text-stone hover:text-forest",
          ].join(" ")}
        >
          <span className="text-xl leading-none">✨</span>
          <span className="font-medium tracking-tight">{tCat("all")}</span>
        </button>

        {/* 2. CATEGORÍAS ESPECÍFICAS SEGÚN EL ORDEN TERRITORIAL */}
        {categoriasDisponibles.map(({ id, emoji }) => {
          const isSelected = categoriaActiva === id;
          return (
            <button
              key={id}
              id={`btn-cat-${id}`}
              type="button"
              onClick={() => onCategoriaChange(isSelected ? null : id)}
              className={[
                "flex-shrink-0 flex flex-col items-center justify-center gap-1 min-w-[72px] px-3.5 py-2.5 rounded-2xl text-xs font-sans transition-all duration-150 cursor-pointer shadow-xs",
                isSelected
                  ? "bg-forest text-white shadow-2xs"
                  : "bg-white/60 border border-stone-light/60 text-stone hover:text-forest",
              ].join(" ")}
            >
              <span className="text-xl leading-none">{emoji}</span>
              <span className="font-medium tracking-tight truncate max-w-[84px]">
                {tCat(id)}
              </span>
            </button>
          );
        })}

        {/* Separador vertical limpio antes del selector de fecha */}
        <div className="w-[1px] h-8 bg-stone-light/80 shrink-0 mx-0.5" aria-hidden="true" />

        {/* 3. BOTÓN DE FECHA / DÍAS AL FINAL DE LA FILA */}
        <button
          id="btn-filtro-fecha"
          type="button"
          onClick={() => {
            if (esFechaFiltrada) {
              // Despulsar: con 1 solo toque se desactiva y vuelve a Hoy sin abrir nada extra
              handleSelectFecha("hoy");
            } else {
              // Pulsar: abre las opciones para elegir fecha
              setIsModalOpen(true);
            }
          }}
          aria-label={esFechaFiltrada ? `Quitar filtro de ${fechaActual.titulo} y volver a Hoy` : `Filtrar fecha: ${fechaActual.titulo}`}
          aria-haspopup="dialog"
          aria-expanded={isModalOpen}
          className={[
            "flex-shrink-0 flex flex-col items-center justify-center gap-1 min-w-[76px] px-3 py-2 rounded-2xl text-xs font-sans transition-all duration-150 cursor-pointer shadow-xs border relative active:scale-95",
            esFechaFiltrada
              ? "bg-terra/15 border-terra text-terra-dark font-bold shadow-2xs ring-1 ring-terra/30"
              : "bg-white/80 hover:bg-white border-stone-light/80 text-forest hover:border-forest/40",
          ].join(" ")}
        >
          <div className="flex items-center gap-1">
            <span className="text-lg leading-none">{fechaActual.emoji}</span>
            <span className="text-[10px] font-bold text-stone-dark">
              {esFechaFiltrada ? "✕" : "▾"}
            </span>
          </div>
          <span className="font-bold tracking-tight text-[11px] truncate max-w-[74px]">
            {fechaActual.titulo}
          </span>
        </button>
      </div>

      {/* MODAL / BOTTOM SHEET DE SELECCIÓN RÁPIDA DE FECHA */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
          {/* Backdrop con desenfoque suave */}
          <div
            className="fixed inset-0 bg-stone-dark/60 backdrop-blur-xs transition-opacity"
            onClick={() => setIsModalOpen(false)}
            aria-hidden="true"
          />

          {/* Contenedor del Sheet */}
          <div
            className="relative w-full max-w-sm bg-cream rounded-t-3xl sm:rounded-3xl shadow-2xl border border-stone-light/80 p-5 z-10 animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-200"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-fecha-title"
          >
            {/* Indicador de arrastre táctil */}
            <div className="w-12 h-1.5 bg-stone/25 rounded-full mx-auto -mt-1 mb-4 sm:hidden" />

            {/* Cabecera del selector */}
            <div className="flex items-center justify-between pb-3 border-b border-stone-light/70">
              <div>
                <h3 id="modal-fecha-title" className="font-serif text-lg font-bold text-forest">
                  {locale === "en" ? "When are you going out?" : locale === "fr" ? "Quand voulez-vous sortir ?" : locale === "de" ? "Wann möchtest du los?" : "¿Cuándo quieres salir?"}
                </h3>
                <p className="font-sans text-xs text-stone mt-0.5">
                  {locale === "en" ? "Choose a date to filter events" : "Selecciona una fecha para ver planes"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                aria-label="Cerrar"
                className="w-8 h-8 rounded-full bg-white/80 hover:bg-white text-stone hover:text-stone-dark border border-stone-light/80 flex items-center justify-center transition-colors cursor-pointer"
              >
                <span className="text-xs font-bold leading-none select-none">✕</span>
              </button>
            </div>

            {/* Opciones interactivas de fecha */}
            <div className="py-3 space-y-2 overflow-y-auto max-h-[60vh] pr-0.5 scrollbar-thin">
              {opcionesFecha.map((op) => {
                const isSelected = tiempoActivo === op.id;
                return (
                  <button
                    key={op.id}
                    type="button"
                    onClick={() => handleSelectFecha(op.id)}
                    className={`w-full flex items-center justify-between p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? "bg-forest text-cream border-forest shadow-xs scale-[1.01]"
                        : "bg-white/80 hover:bg-white border-stone-light/80 text-stone-dark hover:border-forest/40"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-xl shrink-0">{op.emoji}</span>
                      <div className="min-w-0">
                        <div className={`text-xs font-bold ${isSelected ? "text-cream" : "text-forest"}`}>
                          {op.titulo}
                        </div>
                        <div className={`text-[11px] leading-tight mt-0.5 ${isSelected ? "text-cream/80" : "text-stone"}`}>
                          {op.subtitulo}
                        </div>
                      </div>
                    </div>

                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ml-2 ${
                        isSelected ? "border-white bg-white text-forest" : "border-stone-light/80"
                      }`}
                    >
                      {isSelected && <span className="text-[10px] font-bold leading-none">✓</span>}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Botón rápido para volver a Hoy si está filtrando otra fecha */}
            {esFechaFiltrada && (
              <div className="pt-2 border-t border-stone-light/60">
                <button
                  type="button"
                  onClick={() => handleSelectFecha("hoy")}
                  className="w-full py-2.5 rounded-full bg-stone-light/50 hover:bg-stone-light text-stone-dark font-sans text-xs font-semibold transition-colors cursor-pointer text-center"
                >
                  {locale === "en" ? "Reset to Today" : "Restablecer a Hoy"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
