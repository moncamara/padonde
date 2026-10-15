"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { getCategoria, whatsappLink } from "@/constants";
import { formatHora, formatPrecio, mensajeWhatsApp, truncar, getEtiquetaHorario } from "@/lib/utils";
import type { EventoConNegocio } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { trackWhatsAppClick } from "@/lib/analytics";

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
export function EventCard({ evento, zona, priority = false }: EventCardProps) {
  const tCard = useTranslations("eventCard");
  const tCat = useTranslations("categories");
  const tPrice = useTranslations("price");
  const tWa = useTranslations("whatsapp");

  const categoria = getCategoria(evento.tipo);
  const hora = formatHora(evento.fecha_inicio);
  
  // Si es 0 o null, usamos la traducción correspondiente
  const precioDisplay =
    evento.precio === null
      ? tPrice("consult")
      : evento.precio === 0
      ? tPrice("free")
      : formatPrecio(evento.precio, evento.precio_moneda);

  const refCode = evento.id.slice(0, 5).toUpperCase();
  const mensajeDirecto = `${tWa("message", {
    tipo: categoria ? tCat(evento.tipo) : "evento",
    titulo: evento.titulo,
  })} [Ref #${refCode}]`;

  const waLink = whatsappLink(evento.negocio.whatsapp, mensajeDirecto);

  return (
    <article className="group relative w-full rounded-3xl overflow-hidden bg-white border border-stone-light/80 shadow-xs hover:shadow-md hover:border-stone/60 transition-all duration-300 flex flex-col">
      {/* 1. Enlace global clickeable que cubre toda la tarjeta */}
      <Link
        href={`/${zona}/${evento.id}`}
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

        {/* Badges superiores flotantes (Categoría y Destacado) */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none z-20">
          {categoria ? (
            <span className="bg-black/50 backdrop-blur-md text-white text-xs font-sans font-medium px-3 py-1 rounded-full border border-white/20 shadow-xs">
              {categoria.emoji} {tCat(evento.tipo)}
            </span>
          ) : (
            <span />
          )}

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
          {/* Nombre del Aliado y Horario Inteligente */}
          <p className="text-stone text-xs font-sans font-medium tracking-wide flex items-center gap-1.5 flex-wrap">
            <span className="text-forest font-semibold">{evento.negocio.nombre}</span>
            <span>·</span>
            <span className="text-stone">{getEtiquetaHorario(evento)}</span>
          </p>

          {/* Título de la Experiencia en Tipografía Serif */}
          <h2 className="font-serif text-forest text-lg sm:text-xl font-bold leading-snug tracking-tight group-hover:text-terra transition-colors line-clamp-2">
            {evento.titulo}
          </h2>
        </div>

        {/* Fila inferior: Precio a la izquierda, Botón de WhatsApp a la derecha */}
        <div className="flex items-center justify-between gap-3 pt-2.5 border-t border-stone-light/60">
          <div className="flex flex-col">
            <span className="text-forest font-sans font-bold text-base tracking-tight">
              {precioDisplay}
            </span>
            {evento.precio !== null && evento.precio > 0 && (
              <span className="text-stone text-[10px] font-sans">
                {tCard("perPerson")}
              </span>
            )}
          </div>

          {/* Botón directo de reserva por WhatsApp */}
          <a
            href={waLink}
            target="_blank"
            rel="noopener noreferrer"
            className="pointer-events-auto z-20"
            onClick={(e) => {
              e.stopPropagation();
              trackWhatsAppClick({
                eventoId: evento.id,
                eventoTitulo: evento.titulo,
                negocioNombre: evento.negocio.nombre,
                ubicacion: "tarjeta",
                precio: evento.precio,
              });
            }}
          >
            <Button
              size="sm"
              className="bg-terra hover:bg-terra-dark text-white font-medium shadow-xs text-xs px-3.5 py-2 flex items-center gap-1.5 active:scale-95 transition-transform"
            >
              <span>💬</span>
              <span>{tCard("reserve")}</span>
            </Button>
          </a>
        </div>
      </div>
    </article>
  );
}
