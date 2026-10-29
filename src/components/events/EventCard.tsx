"use client";

import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { getCategoria } from "@/constants";
import { formatPrecio, getEtiquetaHorario } from "@/lib/utils";
import { getEventoTraducido } from "@/lib/translations/eventosTraducciones";
import type { EventoConNegocio } from "@/lib/types";
import { trackEvent } from "@/lib/analytics";

interface EventCardProps {
  evento: EventoConNegocio;
  zona: string;
  priority?: boolean;
}

/**
 * Tarjeta principal de evento para el feed público con soporte i18n.
 * Toda la tarjeta es clickeable para abrir el detalle del plan,
 * manteniendo el botón de WhatsApp como acción directa de reserva.
 */
export function EventCard({ evento: rawEvento, zona, priority = false }: EventCardProps) {
  const locale = useLocale();
  const evento = rawEvento.traducciones?.[locale]?.titulo
    ? {
        ...rawEvento,
        titulo: rawEvento.traducciones[locale].titulo,
        descripcion: rawEvento.traducciones[locale].descripcion ?? rawEvento.descripcion,
      }
    : getEventoTraducido(rawEvento, locale);

  const tCard = useTranslations("eventCard");
  const tCat = useTranslations("categories");
  const tPrice = useTranslations("price");

  const categoria = getCategoria(evento.tipo);
  
  // Si es 0 o null, mostramos precio a consultar
  const precioDisplay =
    evento.precio === null || evento.precio === 0
      ? tPrice("consult")
      : formatPrecio(evento.precio, evento.precio_moneda);

  return (
    <article
      id={`card-evento-${evento.id}`}
      className="group relative isolate w-full rounded-3xl overflow-hidden bg-white border border-stone-light/80 shadow-xs hover:shadow-md hover:border-stone/60 transition-all duration-300 flex flex-col"
    >
      {/* 1. Enlace global clickeable que cubre toda la tarjeta */}
      <Link
        href={`/${zona}/${evento.id}`}
        draggable={false}
        onClick={() => {
          if (typeof window !== "undefined") {
            try {
              sessionStorage.setItem("padonde_scroll_pos", window.scrollY.toString());
              sessionStorage.setItem("padonde_last_card", `card-evento-${evento.id}`);
            } catch {
              // Silencioso
            }
          }
        }}
        className="absolute inset-0 z-10 focus:outline-none focus:ring-2 focus:ring-terra focus:ring-offset-2 rounded-3xl"
        aria-label={`${evento.titulo} - ${evento.negocio.nombre}`}
      >
        <span className="sr-only">{evento.titulo}</span>
      </Link>

      {/* 2. Contenedor de Imagen / Flyer 100% limpio y visible */}
      <div className="relative aspect-[16/10] sm:aspect-[16/9] w-full overflow-hidden bg-stone-100">
        {evento.imagen_url ? (
          <Image
            src={evento.imagen_url}
            alt={evento.titulo}
            fill
            sizes="(max-width: 640px) 100vw, 640px"
            className="object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
            priority={priority}
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-forest/90 to-stone/80 flex items-center justify-center text-4xl">
            🌿
          </div>
        )}

        {/* Badges superiores flotantes (Categoría, Video y Destacado) */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none z-20">
          <div className="flex items-center gap-1.5 flex-wrap">
            {categoria ? (
              <span className="bg-black/50 backdrop-blur-md text-white text-xs font-sans font-medium px-3 py-1 rounded-full border border-white/20 shadow-xs">
                {categoria.emoji} {tCat(evento.tipo)}
              </span>
            ) : null}

            {evento.video_url && (
              <span className="bg-black/60 backdrop-blur-md text-white text-xs font-sans font-semibold px-2.5 py-1 rounded-full border border-amber-400/40 shadow-xs flex items-center gap-1 text-amber-300">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                🎬 Reel
              </span>
            )}
          </div>

          {evento.destacado && (
            <span className="bg-terra text-white text-xs font-sans font-semibold px-3 py-1 rounded-full shadow-xs">
              ⭐ {tCard("featured")}
            </span>
          )}
        </div>
      </div>

      {/* 3. Cuerpo de la tarjeta (Debajo de la foto con legibilidad 100% garantizada) */}
      <div className="p-4 sm:p-5 flex flex-col justify-between flex-1 space-y-3 bg-white">
        <div className="space-y-1.5">
          {/* Nombre del Aliado, Horario Inteligente y Calificación Google */}
          <div className="text-stone text-xs font-sans font-medium tracking-wide flex items-center gap-1.5 flex-wrap">
            <span className="text-forest font-semibold">{evento.negocio.nombre}</span>
            <span>·</span>
            <span className="text-stone">{getEtiquetaHorario(evento, locale)}</span>
            {(() => {
              const rating = evento.negocio?.google_rating ?? evento.metadata_hospedaje?.google_reputacion?.rating;
              const totalReviews = evento.negocio?.google_total_reviews ?? evento.metadata_hospedaje?.google_reputacion?.total_reviews;
              if (!rating) return null;
              return (
                <>
                  <span>·</span>
                  <span className="inline-flex items-center gap-0.5 text-amber-700 font-semibold bg-amber-50 px-1.5 py-0.5 rounded-md border border-amber-200/80 text-[11px]">
                    <span>★</span>
                    <span>{Number(rating).toFixed(1)}</span>
                    {totalReviews ? (
                      <span className="text-stone font-normal text-[10px]">
                        ({totalReviews})
                      </span>
                    ) : null}
                  </span>
                </>
              );
            })()}
          </div>

          {/* Título de la Experiencia en Tipografía Serif */}
          <h2 className="font-serif text-forest text-lg sm:text-xl font-bold leading-snug tracking-tight group-hover:text-terra transition-colors line-clamp-2">
            {evento.titulo}
          </h2>
        </div>

        {/* Fila inferior: Precio a la izquierda, Botón de WhatsApp a la derecha */}
        <div className="flex items-center justify-between gap-3 pt-2.5 border-t border-stone-light/60">
          <div className="flex flex-col">
            <span className="text-forest font-sans font-bold text-base tracking-tight">
              {evento.tipo === "hospedaje" && evento.precio ? `Desde ${precioDisplay}` : precioDisplay}
              {evento.precio !== null && evento.precio > 0 && (
                <span className="text-[10px] font-normal text-stone ml-1">COP</span>
              )}
            </span>
            {evento.precio !== null && evento.precio > 0 && (
              <span className="text-stone text-[10px] font-sans">
                {evento.tipo === "hospedaje"
                  ? locale === "en"
                    ? "per night"
                    : "por noche"
                  : tCard("perPerson")}
              </span>
            )}
          </div>

          {/* Botón Ver más hacia la ficha completa */}
          <div className="flex items-center z-20">
            <Link
              href={`/${zona}/${evento.id}`}
              onClick={(e) => {
                e.stopPropagation();
                if (typeof window !== "undefined") {
                  try {
                    sessionStorage.setItem("padonde_scroll_pos", window.scrollY.toString());
                    sessionStorage.setItem("padonde_last_card", `card-evento-${evento.id}`);
                  } catch {
                    // Silencioso
                  }
                }
                trackEvent("click_ver_mas_tarjeta", {
                  aliado_nombre: rawEvento.negocio?.nombre || "Organizador",
                  tipo_categoria: rawEvento.tipo === "hospedaje" ? "hospedaje" : "evento",
                  region_destino: zona,
                  eventoId: rawEvento.id,
                  eventoTitulo: rawEvento.titulo,
                  negocioNombre: rawEvento.negocio?.nombre,
                  negocioId: rawEvento.negocio_id,
                });
              }}
              className="inline-flex items-center gap-1.5 bg-forest/5 hover:bg-forest text-forest hover:text-cream font-medium text-xs px-3.5 py-2 rounded-xl border border-forest/15 hover:border-forest shadow-2xs transition-all active:scale-95 group/btn cursor-pointer"
            >
              <span>{tCard("seeMore")}</span>
              <span className="group-hover/btn:translate-x-0.5 transition-transform">→</span>
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}
