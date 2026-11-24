"use client";

import { useEffect, useMemo, useState } from "react";
import { useLocale } from "next-intl";
import {
  EMERGENCIAS_LOCALES,
  EMBAJADAS_COLOMBIA,
  EMERGENCIAS_TEXTOS,
  resolverLocaleEmergencias,
} from "@/data/emergencias";

function norm(v: string): string {
  return v
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export function EmergenciasModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const locale = resolverLocaleEmergencias(useLocale());
  const txt = EMERGENCIAS_TEXTOS[locale];
  const [busqueda, setBusqueda] = useState("");

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  const q = norm(busqueda);

  const localesFiltrados = useMemo(() => {
    if (!q) return EMERGENCIAS_LOCALES;
    return EMERGENCIAS_LOCALES.filter(
      (c) =>
        norm(c.nombre[locale]).includes(q) ||
        norm(c.detalle[locale]).includes(q) ||
        c.telefonoDisplay.includes(q)
    );
  }, [q, locale]);

  const embajadasFiltradas = useMemo(() => {
    if (!q) return EMBAJADAS_COLOMBIA;
    return EMBAJADAS_COLOMBIA.filter(
      (e) =>
        norm(e.pais[locale]).includes(q) ||
        norm(e.pais.es).includes(q) ||
        e.telefonoDisplay.includes(q) ||
        (e.telefonoEmergenciaDisplay?.includes(q) ?? false)
    );
  }, [q, locale]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={txt.modalTitle}
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center sm:p-4 animate-in fade-in duration-150"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-[#FBF9F5] w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl border border-stone-light shadow-2xl flex flex-col max-h-[88vh] overflow-hidden"
      >
        {/* Cabecera */}
        <div className="p-4 sm:p-5 bg-white border-b border-stone-light/70 flex items-start justify-between gap-3 shrink-0">
          <div>
            <h2 className="font-serif text-lg sm:text-xl font-bold text-forest flex items-center gap-2">
              <span>🚨</span>
              <span>{txt.modalTitle}</span>
            </h2>
            <p className="font-sans text-xs text-stone mt-0.5">{txt.modalSubtitle}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={txt.cerrar}
            className="w-8 h-8 rounded-full bg-stone-light/40 hover:bg-stone-light text-stone hover:text-forest flex items-center justify-center text-sm shrink-0 cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Buscador rápido */}
        <div className="px-4 pt-3 pb-2 bg-[#FBF9F5] shrink-0">
          <div className="relative">
            <input
              type="search"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder={txt.searchPlaceholder}
              className="w-full px-3.5 py-2.5 text-sm bg-white rounded-2xl border border-stone-light text-forest placeholder:text-stone/60 outline-none focus:ring-2 focus:ring-forest/25"
            />
          </div>
        </div>

        {/* Contenido con scroll */}
        <div className="p-4 overflow-y-auto space-y-5 flex-1 font-sans">
          {localesFiltrados.length === 0 && embajadasFiltradas.length === 0 && (
            <p className="text-center text-xs text-stone py-8">{txt.sinResultados}</p>
          )}

          {localesFiltrados.length > 0 && (
            <section className="space-y-2">
              <h3 className="text-[11px] font-bold uppercase tracking-wider text-red-800 px-1">
                {txt.secLocales}
              </h3>
              <div className="space-y-2">
                {localesFiltrados.map((item) => (
                  <div
                    key={item.id}
                    className="bg-white rounded-2xl border border-stone-light/80 p-3 flex items-center justify-between gap-3 shadow-2xs"
                  >
                    <div className="flex items-start gap-2.5 min-w-0">
                      <span className="text-xl shrink-0">{item.icono}</span>
                      <div className="min-w-0">
                        <p className="text-xs sm:text-sm font-bold text-forest leading-snug">
                          {item.nombre[locale]}
                        </p>
                        <p className="text-[11px] text-stone leading-snug">{item.detalle[locale]}</p>
                      </div>
                    </div>
                    <a
                      href={`tel:${item.telefono}`}
                      className="shrink-0 px-3 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-2xs active:scale-95 transition-all"
                    >
                      <span>📞</span>
                      <span>{item.telefonoDisplay}</span>
                    </a>
                  </div>
                ))}
              </div>
            </section>
          )}

          {embajadasFiltradas.length > 0 && (
            <section className="space-y-2">
              <h3 className="text-[11px] font-bold uppercase tracking-wider text-forest px-1">
                {txt.secEmbajadas}
              </h3>
              <div className="space-y-2">
                {embajadasFiltradas.map((emb) => (
                  <div
                    key={emb.id}
                    className="bg-white rounded-2xl border border-stone-light/80 p-3 space-y-2 shadow-2xs"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-xl">{emb.bandera}</span>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-forest truncate">
                            {emb.pais[locale]}
                          </p>
                          <p className="text-[11px] text-stone">{emb.ciudad}</p>
                        </div>
                      </div>
                      <a
                        href={emb.portalUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] font-semibold text-forest underline underline-offset-2 hover:text-terra shrink-0"
                      >
                        🌐 {txt.portalOficial} ↗
                      </a>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <a
                        href={`tel:${emb.telefono}`}
                        className="flex-1 min-w-[140px] py-2 px-3 rounded-xl bg-forest/8 hover:bg-forest text-forest hover:text-cream border border-forest/15 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <span>📞</span>
                        <span>{emb.telefonoDisplay}</span>
                      </a>
                      {emb.telefonoEmergencia && emb.telefonoEmergenciaDisplay && (
                        <a
                          href={`tel:${emb.telefonoEmergencia}`}
                          className="flex-1 min-w-[140px] py-2 px-3 rounded-xl bg-red-50 hover:bg-red-600 text-red-800 hover:text-white border border-red-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                        >
                          <span>🚨</span>
                          <span>
                            {txt.emergenciaConsular}: {emb.telefonoEmergenciaDisplay}
                          </span>
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

/** Enlace discreto reutilizable en el Footer público para abrir el modal de Emergencias desde cualquier página. */
export function EmergenciasFooterLink() {
  const [abierto, setAbierto] = useState(false);
  const locale = resolverLocaleEmergencias(useLocale());
  const txt = EMERGENCIAS_TEXTOS[locale];

  return (
    <>
      <button
        type="button"
        onClick={() => setAbierto(true)}
        className="inline-flex items-center gap-1.5 text-xs font-sans font-medium text-stone hover:text-red-700 underline underline-offset-4 decoration-stone-light hover:decoration-red-300 transition-colors cursor-pointer"
      >
        <span>🚨</span>
        <span>{txt.footerLink}</span>
      </button>
      <EmergenciasModal isOpen={abierto} onClose={() => setAbierto(false)} />
    </>
  );
}
