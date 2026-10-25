"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import type { CategoriaServicioEsencial, ServicioEsencial } from "@/lib/types";
import { CarouselWrapper } from "@/components/ui/CarouselWrapper";
import { getServicioEsencialTraducido } from "@/lib/translations/serviciosTraducciones";
import { EventVideoPlayer } from "@/components/events/EventVideoPlayer";
import { ShareButton } from "@/components/events/ShareButton";
import {
  trackServicioEsencialWhatsAppClick,
  trackServicioEsencialMapsClick,
} from "@/lib/analytics";

interface ServiciosListProps {
  servicios: ServicioEsencial[];
  zonaNombre: string;
  zonaSlug?: string;
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

export function ServiciosList({ servicios, zonaNombre, zonaSlug }: ServiciosListProps) {
  const t = useTranslations("essentialServices");
  const locale = useLocale();
  const [categoriaActiva, setCategoriaActiva] = useState<string>("todas");
  const [videoActivoId, setVideoActivoId] = useState<string | null>(null);
  const [fotoSeleccionada, setFotoSeleccionada] = useState<Record<string, string>>({});

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

      {/* Carrusel horizontal de categorías de servicios con flechas semitransparentes */}
      <CarouselWrapper
        containerClassName="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 px-1"
        ariaLabel="categorías de servicios"
        step={200}
      >
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
      </CarouselWrapper>

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

            const mainPhoto =
              fotoSeleccionada[servicio.id] ||
              servicio.imagen_lugar_url ||
              servicio.metadata_comercial?.imagenes?.[0] ||
              null;
            const todasFotos = Array.from(
              new Set([
                ...(servicio.imagen_lugar_url ? [servicio.imagen_lugar_url] : []),
                ...(servicio.metadata_comercial?.imagenes || []),
              ])
            ).filter(Boolean);
            const videoUrl = servicio.metadata_comercial?.video_url || null;
            const tieneMedia = Boolean(mainPhoto || videoUrl);

            const origin =
              typeof window !== "undefined"
                ? window.location.origin
                : "https://www.padonde.lat";
            const cardUrl = `${origin}/${locale}/${zonaSlug || "minca"}?tab=servicios#servicio-${servicio.id}`;
            const shareTitle = `${servicio.nombre_comercial} - PaDónde`;
            const shareText = `${servicio.nombre_comercial} (${t(`categories.${servicio.categoria}`)}): ${servicio.subtitulo || ""} en ${zonaNombre}. Consúltalo en PaDónde:`;

            return (
              <article
                key={servicio.id}
                id={`servicio-${servicio.id}`}
                className="scroll-mt-24 bg-white rounded-3xl border border-stone-light/80 p-5 sm:p-6 shadow-xs hover:border-forest/40 transition-all space-y-4 target:ring-2 target:ring-terra target:border-terra/60"
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

                  <div className="flex items-center gap-2 shrink-0">
                    <ShareButton
                      title={shareTitle}
                      text={shareText}
                      url={cardUrl}
                      zonaNombre={zonaNombre}
                      variant="icon"
                      className="!w-9 !h-9 bg-stone-light/30 hover:bg-stone-light/70 text-forest"
                    />

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
                </div>

                {/* Bloque Multimedia (Foto y/o Reel) */}
                {tieneMedia && (
                  <div className="space-y-2">
                    {videoActivoId === servicio.id && videoUrl ? (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between px-1">
                          <span className="text-[11px] font-semibold text-terra flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-terra animate-pulse" />
                            🎬 Reel de {servicio.nombre_comercial}
                          </span>
                          <button
                            type="button"
                            onClick={() => setVideoActivoId(null)}
                            className="text-stone hover:text-forest text-xs font-semibold px-2.5 py-1 rounded-full bg-stone-light/40 hover:bg-stone-light cursor-pointer transition-colors"
                          >
                            ✕ {t("closeVideo")}
                          </button>
                        </div>
                        <EventVideoPlayer
                          videoUrl={videoUrl}
                          posterUrl={mainPhoto}
                          title={servicio.nombre_comercial}
                        />
                      </div>
                    ) : (
                      <div className="relative aspect-[16/10] sm:aspect-[16/9] w-full rounded-2xl overflow-hidden bg-stone-100 group border border-stone-light/60">
                        {mainPhoto ? (
                          <img
                            src={mainPhoto}
                            alt={servicio.nombre_comercial}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-forest/80 to-stone/80 flex items-center justify-center text-4xl">
                            🌿
                          </div>
                        )}

                        {/* Botón flotante para reproducir Reel si tiene video */}
                        {videoUrl && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/25 group-hover:bg-black/35 transition-colors">
                            <button
                              type="button"
                              onClick={() => setVideoActivoId(servicio.id)}
                              className="px-4 py-2 rounded-full bg-forest/90 hover:bg-forest text-cream text-xs font-semibold flex items-center gap-2 shadow-lg backdrop-blur-sm cursor-pointer active:scale-95 transition-all"
                            >
                              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                              <span>🎬 {t("watchReel")}</span>
                            </button>
                          </div>
                        )}

                        {/* Contador de fotos si hay más de una */}
                        {todasFotos.length > 1 && (
                          <div className="absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-sm text-white text-[10px] font-sans font-medium pointer-events-none">
                            📷 {todasFotos.length}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Tiras de miniaturas si hay múltiples fotos y no está reproduciendo el video */}
                    {videoActivoId !== servicio.id && todasFotos.length > 1 && (
                      <div className="flex items-center gap-2 overflow-x-auto py-1 no-scrollbar">
                        {todasFotos.map((foto, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() =>
                              setFotoSeleccionada((prev) => ({
                                ...prev,
                                [servicio.id]: foto,
                              }))
                            }
                            className={`relative w-14 h-11 rounded-xl overflow-hidden border shrink-0 transition-all cursor-pointer ${
                              mainPhoto === foto
                                ? "border-forest ring-2 ring-forest/30"
                                : "border-stone-light/70 opacity-70 hover:opacity-100"
                            }`}
                          >
                            <img
                              src={foto}
                              alt=""
                              className="w-full h-full object-cover"
                              loading="lazy"
                            />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

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

                {/* Botones de acción: WhatsApp y Compartir ficha */}
                <div className="pt-1 flex items-center gap-2">
                  {servicio.boton_whatsapp_activo !== false ? (
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
                      className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-forest hover:bg-forest/90 text-cream font-sans text-xs sm:text-sm font-semibold tracking-wide shadow-xs active:scale-[0.98] transition-all"
                    >
                      <span className="text-base">💬</span>
                      <span>{t("contactWhatsApp")}</span>
                    </a>
                  ) : (
                    <div className="flex-1 py-2.5 px-4 rounded-2xl bg-stone-light/20 border border-stone-light/60 text-stone text-center font-sans text-xs flex items-center justify-center gap-2">
                      <span>🏪</span>
                      <span>{t("inPersonOnly")}</span>
                    </div>
                  )}

                  <ShareButton
                    title={shareTitle}
                    text={shareText}
                    url={cardUrl}
                    zonaNombre={zonaNombre}
                    variant="header"
                    className="!h-11 sm:!h-12 !px-3.5 sm:!px-4 !rounded-2xl border-stone-light hover:border-forest/40 bg-white shadow-2xs text-xs font-semibold"
                  />
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
