"use client";

import { useState, useEffect, useRef } from "react";
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
import { DrawerTarifarioTransporte } from "./DrawerTarifarioTransporte";
import { getTarifarioPorId } from "@/data/tarifas";
import type { TarifarioTransporte } from "@/data/tarifas/types";
import {
  calcularVisualizacionesDiarias,
  type SocialProofResult,
} from "@/utils/socialProofTracker";

interface ServiciosListProps {
  servicios: ServicioEsencial[];
  zonaNombre: string;
  zonaSlug?: string;
}

/**
 * Micro-indicador determinista de prueba social para fichas de servicios
 */
function ServicioSocialProofIndicator({
  servicioId,
  vistosAyerBase,
}: {
  servicioId: string;
  vistosAyerBase?: number;
}) {
  const t = useTranslations("essentialServices");
  const [proof, setProof] = useState<SocialProofResult | null>(null);

  useEffect(() => {
    setProof(calcularVisualizacionesDiarias(servicioId, vistosAyerBase));
  }, [servicioId, vistosAyerBase]);

  if (!proof) {
    return (
      <div className="h-5 flex items-center select-none invisible" aria-hidden="true">
        &nbsp;
      </div>
    );
  }

  return (
    <div
      className="h-5 flex items-center font-sans text-xs text-stone"
      aria-live="polite"
    >
      <span className="inline-flex items-center gap-1.5 text-stone/85 text-[11px] font-sans">
        <span className="text-xs">👁️</span>
        <span>{t("travelersViewedToday", { count: proof.viajerosHoy })}</span>
      </span>
    </div>
  );
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

/**
 * Carrusel Táctil Ultraliviano para Fichas de Servicios
 * Utiliza CSS Scroll-Snap nativo sin librerías externas (0 dependencias)
 */
function ServicePhotoCarousel({
  fotos,
  nombreComercial,
  videoUrl,
  posicionPortada = "50%",
  watchReelLabel = "Ver Reel",
  onPlayVideo,
}: {
  fotos: string[];
  nombreComercial: string;
  videoUrl?: string | null;
  posicionPortada?: string;
  watchReelLabel?: string;
  onPlayVideo?: () => void;
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, clientWidth } = scrollRef.current;
    if (clientWidth > 0) {
      const idx = Math.round(scrollLeft / clientWidth);
      setCurrentIndex(Math.min(Math.max(0, idx), fotos.length - 1));
    }
  };

  const scrollPrev = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: -scrollRef.current.clientWidth, behavior: "smooth" });
    }
  };

  const scrollNext = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: scrollRef.current.clientWidth, behavior: "smooth" });
    }
  };

  if (fotos.length === 0) {
    return (
      <div className="relative aspect-[16/10] sm:aspect-[16/9] w-full rounded-2xl overflow-hidden bg-gradient-to-br from-forest/80 to-stone/80 flex items-center justify-center text-4xl border border-stone-light/60">
        🌿
      </div>
    );
  }

  return (
    <div className="relative aspect-[16/10] sm:aspect-[16/9] w-full rounded-2xl overflow-hidden bg-stone-100 border border-stone-light/60 group select-none">
      {/* Contenedor Scroll-Snap Nativo */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex w-full h-full overflow-x-auto snap-x snap-mandatory no-scrollbar scroll-smooth"
        style={{
          WebkitOverflowScrolling: "touch",
        }}
      >
        {fotos.map((foto, idx) => (
          <div
            key={idx}
            className="w-full h-full shrink-0 snap-start relative overflow-hidden"
            style={{ scrollSnapAlign: "start" }}
          >
            <img
              src={foto}
              alt={`${nombreComercial} - Foto ${idx + 1}`}
              width={640}
              height={400}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              style={idx === 0 ? { objectPosition: `center ${posicionPortada || "50%"}` } : undefined}
              loading={idx === 0 ? "eager" : "lazy"}
              decoding="async"
            />
          </div>
        ))}
      </div>

      {/* Flechas circulares oscuras de navegación (idénticas a la galería de detalle de eventos) */}
      {fotos.length > 1 && (
        <>
          {currentIndex > 0 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                scrollPrev();
              }}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-black/45 hover:bg-black/75 text-white backdrop-blur-md border border-white/20 flex items-center justify-center transition-all active:scale-90 cursor-pointer shadow-md"
              aria-label="Foto anterior"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}
          {currentIndex < fotos.length - 1 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                scrollNext();
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-black/45 hover:bg-black/75 text-white backdrop-blur-md border border-white/20 flex items-center justify-center transition-all active:scale-90 cursor-pointer shadow-md"
              aria-label="Siguiente foto"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}
        </>
      )}

      {/* Botón flotante para reproducir Reel si tiene video */}
      {videoUrl && onPlayVideo && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/25 pointer-events-none group-hover:bg-black/35 transition-colors z-10">
          <button
            type="button"
            onClick={onPlayVideo}
            className="pointer-events-auto px-4 py-2 rounded-full bg-forest/90 hover:bg-forest text-cream text-xs font-semibold flex items-center gap-2 shadow-lg backdrop-blur-sm cursor-pointer active:scale-95 transition-all"
          >
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span>🎬 {watchReelLabel}</span>
          </button>
        </div>
      )}

      {/* Indicadores y Contador superpuestos (sin restar altura a la tarjeta) */}
      {fotos.length > 1 && (
        <>
          {/* Indicadores Dots tenues centrados */}
          <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 flex items-center gap-1 px-2 py-1 rounded-full bg-black/30 backdrop-blur-xs pointer-events-none z-10">
            {fotos.map((_, i) => (
              <span
                key={i}
                className={`h-1.5 rounded-full transition-all duration-200 ${
                  currentIndex === i ? "w-3 bg-white" : "w-1.5 bg-white/50"
                }`}
              />
            ))}
          </div>

          {/* Badge translúcido con conteo (ej. 📷 1/3) en la esquina inferior derecha */}
          <div className="absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-xs text-white text-[10px] font-sans font-medium pointer-events-none z-10 flex items-center gap-1">
            <span>📷</span>
            <span>
              {currentIndex + 1}/{fotos.length}
            </span>
          </div>
        </>
      )}
    </div>
  );
}

export function ServiciosList({ servicios, zonaNombre, zonaSlug }: ServiciosListProps) {
  const t = useTranslations("essentialServices");
  const locale = useLocale();
  const [categoriaActiva, setCategoriaActiva] = useState<string>("todas");
  const [videoActivoId, setVideoActivoId] = useState<string | null>(null);
  const [tarifarioActivo, setTarifarioActivo] = useState<TarifarioTransporte | null>(() => {
    if (typeof window !== "undefined") {
      try {
        const wasOpen = sessionStorage.getItem("padonde_tarifario_open");
        const savedId = sessionStorage.getItem("padonde_tarifario_id");
        if (wasOpen === "true") {
          return getTarifarioPorId(savedId || "transporte-aventura-4x4-minca");
        }
      } catch {}
    }
    return null;
  });

  useEffect(() => {
    try {
      const wasOpen = sessionStorage.getItem("padonde_tarifario_open");
      const savedId = sessionStorage.getItem("padonde_tarifario_id");
      if (wasOpen === "true" && !tarifarioActivo) {
        setTarifarioActivo(getTarifarioPorId(savedId || "transporte-aventura-4x4-minca"));
      }
    } catch {}
  }, []);

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

            // Extracción normalizada y limpia del array de fotos
            const fotos: string[] = (
              servicio.fotos ||
              servicio.metadata_comercial?.fotos ||
              servicio.metadata_comercial?.imagenes ||
              (servicio.imagen_lugar_url ? [servicio.imagen_lugar_url] : null) ||
              (servicio.imagen_url ? [servicio.imagen_url] : []) ||
              []
            ).filter(Boolean);

            const videoUrl = servicio.metadata_comercial?.video_url || null;
            const tieneMedia = Boolean(fotos.length > 0 || videoUrl);

            const origin =
              typeof window !== "undefined"
                ? window.location.origin
                : "https://www.padonde.lat";
            const cardUrl = `${origin}/${locale}/${zonaSlug || "minca"}?tab=servicios#servicio-${servicio.id}`;
            const shareTitle = `${servicio.nombre_comercial} - PaDónde`;
            const shareText = `${servicio.nombre_comercial} (${t(`categories.${servicio.categoria}`)}): ${servicio.subtitulo || ""} en ${zonaNombre}. Consúltalo en PaDónde:`;

            const rawTarifarioId =
              (servicio.metadata_comercial as Record<string, any>)?.tarifario_id ||
              servicio.id;
            const tarifarioId =
              rawTarifarioId === "transporte-aventura-4x4-minca" ||
              servicio.nombre_comercial?.toLowerCase().includes("aventura 4x4")
                ? "transporte-aventura-4x4-minca"
                : rawTarifarioId;
            const tarifario = getTarifarioPorId(tarifarioId);

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

                    {/* Micro-indicador de visualizaciones diarias (Social Proof determinista) */}
                    <ServicioSocialProofIndicator
                      servicioId={servicio.id}
                      vistosAyerBase={((servicio.id.charCodeAt(0) || 1) % 3) + 2}
                    />
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
                          width={80}
                          height={80}
                          className="w-full h-full object-contain"
                          loading="lazy"
                          decoding="async"
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Bloque Multimedia: Carrusel Táctil Ultraliviano o Reproductor Reel */}
                {tieneMedia && (
                  <div>
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
                          posterUrl={fotos[0] || null}
                          title={servicio.nombre_comercial}
                        />
                      </div>
                    ) : (
                      <ServicePhotoCarousel
                        fotos={fotos}
                        nombreComercial={servicio.nombre_comercial}
                        videoUrl={videoUrl}
                        posicionPortada={
                          servicio.metadata_comercial?.posicion_portada ||
                          (servicio.metadata_comercial as any)?.posicionPortada ||
                          "50%"
                        }
                        watchReelLabel={t("watchReel")}
                        onPlayVideo={() => setVideoActivoId(servicio.id)}
                      />
                    )}
                  </div>
                )}

                {/* Subtítulo descriptivo */}
                <p className="font-sans text-xs sm:text-sm text-stone leading-relaxed">
                  {servicio.subtitulo}
                </p>

                {/* Horario de atención con indicador activo en verde */}
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-forest/5 border border-forest/15 font-sans">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                  <span className="text-forest text-xs font-semibold">
                    {t("openNow")}
                  </span>
                  <span className="text-stone text-xs">
                    • {servicio.horario_apertura}
                  </span>
                </div>

                {/* Badges de características / servicios (Layout flexible fluido sin recortes) */}
                {servicio.servicios_tags && servicio.servicios_tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 w-full h-auto pt-1">
                    {servicio.servicios_tags.map((tag, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center py-1.5 px-3 rounded-xl bg-stone-light/30 text-forest text-xs font-medium leading-normal"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Dirección y referencia */}
                <div className="pt-2 border-t border-stone-light/60 flex items-start gap-1.5 text-xs font-sans text-stone">
                  <span className="text-terra shrink-0">📍</span>
                  <span className="leading-snug">
                    {servicio.direccion_referencia}
                  </span>
                </div>

                {/* Tarifario oficial si existe (ej. 4x4, mototaxis) */}
                {tarifario && (
                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        try {
                          sessionStorage.setItem("padonde_tarifario_open", "true");
                          sessionStorage.setItem("padonde_tarifario_id", tarifario.id);
                        } catch {}
                        setTarifarioActivo(tarifario);
                      }}
                      className="w-full py-2.5 px-3.5 rounded-2xl bg-amber-500/10 hover:bg-amber-500/15 border border-amber-300/80 text-amber-950 font-sans text-xs font-semibold flex items-center justify-between gap-2 shadow-2xs active:scale-[0.99] transition-all cursor-pointer group"
                    >
                      <div className="flex items-center gap-2.5 text-left min-w-0">
                        <span className="text-base shrink-0 group-hover:scale-110 transition-transform">📋</span>
                        <div className="min-w-0">
                          <span className="block font-bold truncate text-forest">
                            {locale === "en"
                              ? `Official Rate Card (${Object.values(tarifario.tarifas).flat().length} Destinations)`
                              : locale === "fr"
                              ? `Grille Tarifaire Officielle (${Object.values(tarifario.tarifas).flat().length} Destinations)`
                              : locale === "de"
                              ? `Offizielle Tarife (${Object.values(tarifario.tarifas).flat().length} Ziele)`
                              : `Tarifario Oficial (${Object.values(tarifario.tarifas).flat().length} Destinos)`}
                          </span>
                          <span className="text-[10px] text-stone truncate block">
                            {locale === "en"
                              ? "Fixed rates to hostels, waterfalls & High Sierra"
                              : locale === "fr"
                              ? "Tarifs fixes vers auberges, cascades & Haute Sierra"
                              : locale === "de"
                              ? "Festpreise zu Hostels, Wasserfällen & Hohe Sierra"
                              : "Precios fijos a hostales, cascadas y Sierra Alta"}
                          </span>
                        </div>
                      </div>
                      <span className="shrink-0 text-[11px] font-bold bg-white group-hover:bg-amber-50 text-amber-900 border border-amber-300 px-2.5 py-1 rounded-xl shadow-2xs transition-colors">
                        {locale === "en" ? "View Rates ↗" : locale === "fr" ? "Voir Tarifs ↗" : locale === "de" ? "Tarife ansehen ↗" : "Ver Tarifas ↗"}
                      </span>
                    </button>
                  </div>
                )}

                {/* Botones de acción canónicos: WhatsApp y Cómo llegar (Google Maps) */}
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

                  {servicio.google_maps_url ? (
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
                      className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 py-3 px-4 rounded-2xl border border-stone-light/80 hover:border-forest/40 bg-white hover:bg-stone-50 text-forest font-sans text-xs sm:text-sm font-semibold shadow-2xs active:scale-[0.98] transition-all"
                    >
                      <span>📍</span>
                      <span>
                        {locale === "en"
                          ? "Directions"
                          : locale === "fr"
                          ? "Itinéraire"
                          : locale === "de"
                          ? "Route"
                          : "Cómo llegar"}
                      </span>
                    </a>
                  ) : (
                    <ShareButton
                      title={shareTitle}
                      text={shareText}
                      url={cardUrl}
                      zonaNombre={zonaNombre}
                      variant="header"
                      className="!h-11 sm:!h-12 !px-3.5 sm:!px-4 !rounded-2xl border-stone-light hover:border-forest/40 bg-white shadow-2xs text-xs font-semibold"
                    />
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Drawer / Modal de Tarifario de Transporte */}
      {tarifarioActivo && (
        <DrawerTarifarioTransporte
          tarifario={tarifarioActivo}
          isOpen={Boolean(tarifarioActivo)}
          onClose={() => {
            try {
              sessionStorage.removeItem("padonde_tarifario_open");
              sessionStorage.removeItem("padonde_tarifario_id");
            } catch {}
            setTarifarioActivo(null);
          }}
          zonaNombre={zonaNombre}
        />
      )}
    </div>
  );
}
