"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { getCategoria, whatsappLink } from "@/constants";
import { formatHora, formatPrecio, mensajeWhatsApp, truncar } from "@/lib/utils";
import type { EventoConNegocio } from "@/lib/types";
import { Button } from "@/components/ui/Button";

interface EventCardProps {
  evento: EventoConNegocio;
  zona: string;
  priority?: boolean;
}

/**
 * Tarjeta principal de evento para el feed público con soporte i18n.
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

  const mensajeDirecto = tWa("message", {
    tipo: categoria ? tCat(evento.tipo) : "evento",
    titulo: evento.titulo,
  });

  const waLink = whatsappLink(evento.negocio.whatsapp, mensajeDirecto);

  return (
    <article className="relative w-full rounded-[--radius-card] overflow-hidden bg-forest shadow-sm">
      {/* Imagen de fondo del evento */}
      <div className="relative h-56 sm:h-64 w-full">
        {evento.imagen_url ? (
          <Image
            src={evento.imagen_url}
            alt={evento.titulo}
            fill
            sizes="(max-width: 640px) 100vw, 640px"
            className="object-cover"
            priority={priority}
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-forest to-stone opacity-80" />
        )}

        <div className="card-overlay absolute inset-0" />

        {/* Badge de categoría traducida */}
        {categoria && (
          <span className="absolute top-3 left-3 bg-white/20 backdrop-blur-sm text-white text-xs font-sans font-medium px-2.5 py-1 rounded-full">
            {categoria.emoji} {tCat(evento.tipo)}
          </span>
        )}

        {/* Badge "Destacado" / "Featured" */}
        {evento.destacado && (
          <span className="absolute top-3 right-3 bg-terra text-white text-xs font-sans font-semibold px-2.5 py-1 rounded-full">
            ⭐ {tCard("featured")}
          </span>
        )}

        {/* Contenido inferior sobre la imagen */}
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <p className="text-white/70 text-xs font-sans mb-1">
            {evento.negocio.nombre} · {hora}
          </p>

          <h2 className="font-serif text-white text-xl leading-tight mb-3">
            {truncar(evento.titulo, 60)}
          </h2>

          <div className="flex items-center justify-between gap-3">
            <span className="text-white font-sans font-semibold text-sm">
              {precioDisplay}
            </span>

            {/* Enlace a detalle del evento (con Link localizado) */}
            <Link href={`/${zona}/${evento.id}`}>
              <Button
                size="sm"
                variant="outline"
                className="border-white/60 text-white hover:bg-white hover:text-forest"
              >
                {tCard("seeMore")}
              </Button>
            </Link>

            {/* Contacto directo por WhatsApp */}
            <a href={waLink} target="_blank" rel="noopener noreferrer">
              <Button size="sm">
                {tCard("reserve")}
              </Button>
            </a>
          </div>
        </div>
      </div>
    </article>
  );
}
