"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import type { CategoriaServicioEsencial, ServicioEsencial } from "@/lib/types";
import { getServicioEsencialTraducido } from "@/lib/translations/serviciosTraducciones";
import {
  trackServicioEsencialWhatsAppClick,
  trackServicioEsencialMapsClick,
} from "@/lib/analytics";

interface ServiciosListProps {
  servicios: ServicioEsencial[];
  zonaNombre: string;
}

const CATEGORIAS_CONFIG: Array<{
  id: "todas" | CategoriaServicioEsencial;
  emoji: string;
  labelKey: string;
}> = [
  { id: "todas", emoji: "✨", labelKey: "filterAll" },
  { id: "efectivo", emoji: "🏧", labelKey: "categories.efectivo" },
  { id: "transporte", emoji: "🛵", labelKey: "categories.transporte" },
  { id: "salud", emoji: "💊", labelKey: "categories.salud" },
  { id: "comercio", emoji: "🛍️", labelKey: "categories.comercio" },
  { id: "general", emoji: "ℹ️", labelKey: "categories.general" },
];

export function ServiciosList({ servicios, zonaNombre }: ServiciosListProps) {
  const t = useTranslations("essentialServices");
  const locale = useLocale();
  const [categoriaActiva, setCategoriaActiva] = useState<string>("todas");

  const serviciosActivos = servicios.filter((s) => s.activo);

  const serviciosFiltrados = serviciosActivos.filter((s) => {
    if (categoriaActiva === "todas") return true;
    return s.categoria === categoriaActiva;
  });

  return (
    <div className="space-y-6">
      {/* Subtítulo explicativo */}
      <div className="text-center space-y-1">
        <h2 className="font-serif text-xl sm:text-2xl font-bold text-forest">
          {t("tabServicios")}
        </h2>
        <p className="font-sans text-xs text-stone max-w-sm mx-auto">
          {t("servicesSubtitle")} {zonaNombre}
        </p>
      </div>

      {/* Carrusel horizontal de categorías de servicios */}
      <div className="relative">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 px-1">
          {CATEGORIAS_CONFIG.map(({ id, emoji, labelKey }) => {
            const isSelected = categoriaActiva === id;
            const label =
              id === "todas"
                ? t("filterAll")
                : t(`categories.${id as CategoriaServicioEsencial}`);

            return (
              <button
                key={id}
                onClick={() => setCategoriaActiva(id)}
                className={[
                  "shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-xs font-sans transition-all duration-150 cursor-pointer shadow-2xs active:scale-95",
                  isSelected
                    ? "bg-forest text-cream font-semibold shadow-xs"
                    : "bg-white/80 border border-stone-light/70 text-stone hover:text-forest hover:bg-white",
                ].join(" ")}
              >
                <span className="text-sm">{emoji}</span>
                <span className="tracking-tight whitespace-nowrap">{label}</span>
              </button>
            );
          })}
        </div>
        <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-6 bg-gradient-to-l from-cream to-transparent sm:hidden" />
      </div>

      {/* Lista de Tarjetas de Servicios */}
      {serviciosFiltrados.length === 0 ? (
        <div className="text-center py-14 px-4 rounded-3xl bg-white/40 border border-stone-light/60 text-stone">
          <p className="text-3xl mb-2">🌿</p>
          <p className="font-serif text-base text-forest font-semibold">
            {t("empty")}
          </p>
          <button
            onClick={() => setCategoriaActiva("todas")}
            className="mt-4 px-4 py-2 rounded-full bg-forest text-cream text-xs font-semibold cursor-pointer active:scale-95"
          >
            {t("filterAll")}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {serviciosFiltrados.map((rawServicio) => {
            const servicio = getServicioEsencialTraducido(rawServicio, locale);
            const cleanPhone = servicio.whatsapp.replace(/\D/g, "");
            const defaultMsg =
              servicio.mensaje_whatsapp_default ||
              t("defaultWhatsAppMessage", { zona: zonaNombre });
            const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(defaultMsg)}`;

            return (
              <article
                key={servicio.id}
                className="bg-white rounded-3xl border border-stone-light/80 p-5 sm:p-6 shadow-xs hover:border-forest/40 transition-all space-y-4"
              >
                {/* Header de la tarjeta */}
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-sans text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-forest/8 text-forest">
                        {t(`categories.${servicio.categoria}`)}
                      </span>
                      {servicio.destacado_patrocinado && (
                        <span className="font-sans text-[10px] font-semibold px-2 py-0.5 rounded-full bg-terra/10 text-terra border border-terra/20">
                          ★ {t("officialPoint")}
                        </span>
                      )}
                    </div>
                    <h3 className="font-serif text-xl sm:text-2xl font-bold text-forest leading-tight pt-1">
                      {servicio.nombre_comercial}
                    </h3>
                  </div>

                  {servicio.logo_url && (
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-stone-light/20 border border-stone-light/60 overflow-hidden shrink-0 flex items-center justify-center p-1">
                      <img
                        src={servicio.logo_url}
                        alt={servicio.nombre_comercial}
                        className="w-full h-full object-contain"
                        loading="lazy"
                      />
                    </div>
                  )}
                </div>

                {/* Subtítulo descriptivo */}
                <p className="font-sans text-xs sm:text-sm text-stone leading-relaxed">
                  {servicio.subtitulo}
                </p>

                {/* Horario de atención con indicador activo */}
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-forest/5 border border-forest/15 font-sans">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                  <span className="text-forest text-xs font-semibold">
                    {t("openNow")}
                  </span>
                  <span className="text-stone text-xs">
                    • {servicio.horario_apertura}
                  </span>
                </div>

                {/* Tags de características / servicios */}
                {servicio.servicios_tags && servicio.servicios_tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {servicio.servicios_tags.map((tag, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center px-2.5 py-1 rounded-lg bg-stone-light/30 text-forest text-xs font-medium"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Dirección y Google Maps */}
                <div className="pt-2 border-t border-stone-light/60 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs font-sans">
                  <div className="flex items-start gap-1.5 text-stone flex-1">
                    <span className="text-terra shrink-0">📍</span>
                    <span className="leading-snug">
                      {servicio.direccion_referencia}
                    </span>
                  </div>

                  {servicio.google_maps_url && (
                    <a
                      href={servicio.google_maps_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => {
                        trackServicioEsencialMapsClick({
                          servicioId: rawServicio.id,
                          nombreComercial: rawServicio.nombre_comercial,
                          categoria: rawServicio.categoria,
                        });
                      }}
                      className="text-terra hover:text-terra-dark font-medium underline underline-offset-2 shrink-0 self-start sm:self-auto"
                    >
                      {t("openInMaps")}
                    </a>
                  )}
                </div>

                {/* Botón directo de WhatsApp (sólo si tienen plan/conversión activa) */}
                {servicio.boton_whatsapp_activo !== false ? (
                  <div className="pt-1">
                    <a
                      href={waUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => {
                        trackServicioEsencialWhatsAppClick({
                          servicioId: rawServicio.id,
                          nombreComercial: rawServicio.nombre_comercial,
                          categoria: rawServicio.categoria,
                          zonaNombre,
                        });
                      }}
                      className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-forest hover:bg-forest/90 text-cream font-sans text-xs sm:text-sm font-semibold tracking-wide shadow-xs active:scale-[0.98] transition-all"
                    >
                      <span className="text-base">💬</span>
                      <span>{t("contactWhatsApp")}</span>
                    </a>
                  </div>
                ) : (
                  <div className="pt-1">
                    <div className="w-full py-2.5 px-4 rounded-2xl bg-stone-light/20 border border-stone-light/60 text-stone text-center font-sans text-xs flex items-center justify-center gap-2">
                      <span>🏪</span>
                      <span>{t("inPersonOnly")}</span>
                    </div>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
