"use client";

import { useEffect } from "react";
import type { CriterioOrden } from "@/context/SearchContext";

interface FiltrosModalProps {
  isOpen: boolean;
  onClose: () => void;
  filtroTiempo: string;
  setFiltroTiempo: (t: string) => void;
  criterioOrden: CriterioOrden;
  setCriterioOrden: (o: CriterioOrden) => void;
  locale?: string;
}

export function FiltrosModal({
  isOpen,
  onClose,
  filtroTiempo,
  setFiltroTiempo,
  criterioOrden,
  setCriterioOrden,
  locale = "es",
}: FiltrosModalProps) {
  // Prevenir scroll de la página de fondo cuando el modal está abierto
  useEffect(() => {
    if (!isOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Opciones de fecha
  const opcionesTiempo = [
    {
      id: "hoy",
      emoji: "📅",
      titulo: locale === "en" ? "Today" : locale === "fr" ? "Aujourd'hui" : locale === "de" ? "Heute" : "Hoy",
      subtitulo: locale === "en" ? "Plans happening today" : locale === "fr" ? "Plans prévus aujourd'hui" : locale === "de" ? "Pläne für heute" : "Planes que ocurren hoy",
    },
    {
      id: "manana",
      emoji: "🌅",
      titulo: locale === "en" ? "Tomorrow" : locale === "fr" ? "Demain" : locale === "de" ? "Morgen" : "Mañana",
      subtitulo: locale === "en" ? "Plans for tomorrow" : locale === "fr" ? "Plans pour demain" : locale === "de" ? "Pläne für morgen" : "Planes programados para mañana",
    },
    {
      id: "fin_de_semana",
      emoji: "🎉",
      titulo: locale === "en" ? "Weekend" : locale === "fr" ? "Week-end" : locale === "de" ? "Wochenende" : "Fin de semana",
      subtitulo: locale === "en" ? "Saturday & Sunday" : locale === "fr" ? "Samedi et dimanche" : locale === "de" ? "Samstag & Sonntag" : "Sábado y domingo",
    },
    {
      id: "todos",
      emoji: "✨",
      titulo: locale === "en" ? "All plans" : locale === "fr" ? "Tous les plans" : locale === "de" ? "Alle Termine" : "Todos los planes",
      subtitulo: locale === "en" ? "Everything available" : locale === "fr" ? "Toute la programmation" : locale === "de" ? "Das gesamte Programm" : "Toda la programación disponible",
    },
  ];

  // Opciones de ordenamiento
  const opcionesOrden: { id: CriterioOrden; emoji: string; titulo: string; subtitulo: string }[] = [
    {
      id: "recomendados",
      emoji: "⭐",
      titulo: locale === "en" ? "Recommended & Featured" : locale === "fr" ? "Recommandés & En vedette" : locale === "de" ? "Empfohlen & Highlights" : "Recomendados y Destacados",
      subtitulo: locale === "en" ? "Curated by PaDónde" : locale === "fr" ? "Sélection PaDónde" : locale === "de" ? "Von PaDónde kuratiert" : "Selección editorial oficial",
    },
    {
      id: "hora",
      emoji: "⏰",
      titulo: locale === "en" ? "By Schedule" : locale === "fr" ? "Par horaire" : locale === "de" ? "Nach Uhrzeit" : "Por Horario",
      subtitulo: locale === "en" ? "Earliest first" : locale === "fr" ? "Le plus tôt d'abord" : locale === "de" ? "Früheste zuerst" : "De más temprano a más tarde",
    },
    {
      id: "precio",
      emoji: "💵",
      titulo: locale === "en" ? "By Price" : locale === "fr" ? "Par prix" : locale === "de" ? "Nach Preis" : "Por Precio",
      subtitulo: locale === "en" ? "Free & budget-friendly first" : locale === "fr" ? "Gratuit et économique d'abord" : locale === "de" ? "Günstigste zuerst" : "Gratis y económicos primero",
    },
  ];

  const hayFiltrosActivos = filtroTiempo !== "hoy" || criterioOrden !== "recomendados";

  const handleRestablecer = () => {
    setFiltroTiempo("hoy");
    setCriterioOrden("recomendados");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      {/* Backdrop con desenfoque */}
      <div
        className="fixed inset-0 bg-stone-dark/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Contenedor del Modal / Bottom Sheet */}
      <div
        className="relative w-full max-w-lg bg-cream rounded-t-3xl sm:rounded-3xl shadow-2xl border border-stone-light/80 p-5 sm:p-6 z-10 max-h-[88vh] flex flex-col animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-filtros-title"
      >
        {/* Barra superior de arrastre en móvil */}
        <div className="w-12 h-1.5 bg-stone/25 rounded-full mx-auto -mt-1 mb-4 sm:hidden" />

        {/* Header del Modal */}
        <div className="flex items-center justify-between pb-3 border-b border-stone-light/70">
          <div>
            <h2 id="modal-filtros-title" className="font-serif text-xl sm:text-2xl text-forest font-bold">
              {locale === "en" ? "Date & Sorting" : locale === "fr" ? "Date & Tri" : locale === "de" ? "Datum & Sortierung" : "Fecha y Orden"}
            </h2>
            <p className="font-sans text-xs text-stone mt-0.5">
              {locale === "en"
                ? "Customize what you see in the feed"
                : locale === "fr"
                ? "Personnalisez votre fil d'événements"
                : locale === "de"
                ? "Passe an, was du im Feed siehst"
                : "Personaliza lo que ves en la cartelera"}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="w-9 h-9 rounded-full bg-white/80 hover:bg-white text-stone hover:text-stone-dark border border-stone-light/80 flex items-center justify-center transition-colors cursor-pointer"
          >
            <span className="text-sm font-bold select-none leading-none">✕</span>
          </button>
        </div>

        {/* Contenido con scroll interno si la pantalla es pequeña */}
        <div className="flex-1 overflow-y-auto py-4 space-y-6 scrollbar-thin">
          {/* SECCIÓN 1: FECHA */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <span className="font-sans text-xs font-bold text-stone uppercase tracking-wider">
                {locale === "en" ? "When are you going out?" : locale === "fr" ? "Quand voulez-vous sortir ?" : locale === "de" ? "Wann möchtest du los?" : "¿Cuándo quieres salir?"}
              </span>
              <span className="font-sans text-[11px] text-forest font-medium">
                {filtroTiempo === "hoy"
                  ? "Hoy"
                  : filtroTiempo === "manana"
                  ? "Mañana"
                  : filtroTiempo === "fin_de_semana"
                  ? "Fin de semana"
                  : "Todos"}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {opcionesTiempo.map((op) => {
                const isSelected = filtroTiempo === op.id;
                return (
                  <button
                    key={op.id}
                    type="button"
                    onClick={() => setFiltroTiempo(op.id)}
                    className={`flex items-start gap-2.5 p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? "bg-forest text-cream border-forest shadow-xs scale-[1.02]"
                        : "bg-white/80 hover:bg-white border-stone-light/80 text-stone-dark hover:border-forest/40"
                    }`}
                  >
                    <span className="text-xl shrink-0 mt-0.5">{op.emoji}</span>
                    <div className="min-w-0">
                      <div className={`text-xs font-bold ${isSelected ? "text-cream" : "text-forest"}`}>
                        {op.titulo}
                      </div>
                      <div className={`text-[10px] leading-tight mt-0.5 line-clamp-1 ${isSelected ? "text-cream/80" : "text-stone"}`}>
                        {op.subtitulo}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* SECCIÓN 2: ORDENAR POR */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <span className="font-sans text-xs font-bold text-stone uppercase tracking-wider">
                {locale === "en" ? "Order plans by" : locale === "fr" ? "Trier les plans par" : locale === "de" ? "Pläne sortieren nach" : "Ordenar planes por"}
              </span>
            </div>

            <div className="space-y-2">
              {opcionesOrden.map((op) => {
                const isSelected = criterioOrden === op.id;
                return (
                  <button
                    key={op.id}
                    type="button"
                    onClick={() => setCriterioOrden(op.id)}
                    className={`w-full flex items-center justify-between p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? "bg-forest/10 border-forest text-forest shadow-2xs"
                        : "bg-white/80 hover:bg-white border-stone-light/80 text-stone-dark hover:border-forest/40"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-lg shrink-0">{op.emoji}</span>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-forest">
                          {op.titulo}
                        </div>
                        <div className="text-[11px] text-stone mt-0.5">
                          {op.subtitulo}
                        </div>
                      </div>
                    </div>

                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ml-2 transition-all ${
                        isSelected ? "border-forest bg-forest text-white" : "border-stone-light/80"
                      }`}
                    >
                      {isSelected && <span className="text-[10px] font-bold leading-none">✓</span>}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer con acciones */}
        <div className="pt-3 border-t border-stone-light/70 flex items-center gap-3">
          {hayFiltrosActivos && (
            <button
              type="button"
              onClick={handleRestablecer}
              className="px-4 py-2.5 rounded-full bg-stone-light/50 hover:bg-stone-light text-stone-dark font-sans text-xs font-semibold transition-colors cursor-pointer"
            >
              {locale === "en" ? "Reset" : locale === "fr" ? "Réinitialiser" : locale === "de" ? "Zurücksetzen" : "Restablecer"}
            </button>
          )}

          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 px-5 rounded-full bg-forest text-cream font-sans text-xs sm:text-sm font-bold shadow-md hover:bg-forest/90 active:scale-98 transition-all cursor-pointer text-center"
          >
            {locale === "en" ? "View Results" : locale === "fr" ? "Voir les résultats" : locale === "de" ? "Ergebnisse anzeigen" : "Ver resultados"}
          </button>
        </div>
      </div>
    </div>
  );
}
