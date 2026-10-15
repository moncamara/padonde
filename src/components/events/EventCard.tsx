"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { getCategoria, whatsappLink } from "@/constants";
import { formatHora, formatPrecio, mensajeWhatsApp, truncar, getEtiquetaHorario } from "@/lib/utils";
import type { EventoConNegocio } from "@/lib/types";
import { Button } from "@/components/ui/Button";

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
    <article className="group relative w-full rounded-[--radius-card] overflow-hidden bg-forest shadow-xs hover:shadow-md transition-all duration-200">
      {/* 1. Enlace global clickeable que cubre toda la tarjeta */}
      <Link
        href={`/${zona}/${evento.id}`}
        className="absolute inset-0 z-10 focus:outline-none focus:ring-2 focus:ring-terra focus:ring-offset-2 rounded-[--radius-card]"
        aria-label={`${evento.titulo} - ${evento.negocio.nombre}`}
      >
        <span className="sr-only">{evento.titulo}</span>
      </Link>

      {/* 2. Contenedor de Imagen y Gradiente */}
      <div className="relative h-64 sm:h-72 w-full overflow-hidden">
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
          <div className="absolute inset-0 bg-gradient-to-br from-forest to-stone opacity-80" />
        )}

        <div className="card-overlay absolute inset-0" />

        {/* Badges superiores (Categoría y Destacado) */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none z-20">
          {categoria ? (
            <span className="bg-black/35 backdrop-blur-md text-white text-xs font-sans font-medium px-3 py-1 rounded-full border border-white/10 shadow-xs">
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

        {/* 3. Contenido inferior sobre la imagen */}
        <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-5 z-20 pointer-events-none">
          <p className="text-white/80 text-xs font-sans mb-1 font-medium tracking-wide flex items-center gap-1.5 flex-wrap">
            <span>{evento.negocio.nombre}</span>
            <span>·</span>
            <span>{getEtiquetaHorario(evento)}</span>
          </p>

          <h2 className="font-serif text-white text-xl sm:text-2xl leading-tight mb-3 tracking-tight">
            {truncar(evento.titulo, 60)}
          </h2>

          {/* Fila inferior: Precio a la izquierda, Botón de WhatsApp a la derecha */}
          <div className="flex items-center justify-between gap-3 pt-1">
            <div className="flex flex-col">
              <span className="text-white font-sans font-bold text-base tracking-tight drop-shadow-xs">
                {precioDisplay}
              </span>
              {evento.precio !== null && evento.precio > 0 && (
                <span className="text-white/70 text-[10px] font-sans">
                  Por persona
                </span>
              )}
            </div>

            {/* Botón directo de reserva por WhatsApp */}
            <a
              href={waLink}
              target="_blank"
              rel="noopener noreferrer"
              className="pointer-events-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <Button
                size="sm"
                className="bg-terra hover:bg-terra-dark text-white font-medium shadow-md text-xs px-3.5 py-2 flex items-center gap-1.5 active:scale-95 transition-transform"
              >
                <span>💬</span>
                <span>{tCard("reserve")}</span>
              </Button>
            </a>
          </div>
        </div>
      </div>
    </article>
  );
}
