import Image from "next/image";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { getEventoById } from "@/lib/supabase/queries";
import { getCategoria, getZona, whatsappLink } from "@/constants";
import {
  formatFecha,
  formatHora,
  formatPrecio,
  extraerRecurrencia,
  formatearDiasRecurrencia,
  limpiarDescripcionRecurrencia,
} from "@/lib/utils";
import { getEventoTraducido } from "@/lib/translations/eventosTraducciones";
import { Button } from "@/components/ui/Button";
import { ShareButton } from "@/components/events/ShareButton";
import { WhatsAppBookingButton } from "@/components/events/WhatsAppBookingButton";
import type { ZonaSlug } from "@/lib/types";
import type { Metadata } from "next";

interface EventoDetailPageProps {
  params: Promise<{ locale: string; zona: ZonaSlug; id: string }>;
}

export async function generateMetadata({ params }: EventoDetailPageProps): Promise<Metadata> {
  const { locale, zona: zonaSlug, id } = await params;
  const rawEvento = await getEventoById(id);
  if (!rawEvento) return {};
  const evento = getEventoTraducido(rawEvento, locale);

  const zona = getZona(zonaSlug);
  const nombreZona = zona?.nombre || "Minca";
  const descripcionLimpia = limpiarDescripcionRecurrencia(evento.descripcion) ||
    `${evento.titulo} en ${evento.negocio.nombre}, ${nombreZona}. Consulta horarios y reserva directa por WhatsApp.`;

  const canonicalUrl = `https://www.padonde.lat/${locale}/${zonaSlug}/${id}`;
  const title = `${evento.titulo} — ${evento.negocio.nombre} (${nombreZona})`;

  return {
    title,
    description: descripcionLimpia.slice(0, 160),
    alternates: {
      canonical: canonicalUrl,
      languages: {
        es: `https://www.padonde.lat/es/${zonaSlug}/${id}`,
        en: `https://www.padonde.lat/en/${zonaSlug}/${id}`,
        fr: `https://www.padonde.lat/fr/${zonaSlug}/${id}`,
        de: `https://www.padonde.lat/de/${zonaSlug}/${id}`,
      },
    },
    openGraph: {
      title,
      description: descripcionLimpia.slice(0, 160),
      url: canonicalUrl,
      type: "website",
      locale: locale === "en" ? "en_US" : locale === "fr" ? "fr_FR" : locale === "de" ? "de_DE" : "es_CO",
      images: evento.imagen_url
        ? [
            {
              url: evento.imagen_url,
              width: 1200,
              height: 630,
              alt: evento.titulo,
            },
          ]
        : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: descripcionLimpia.slice(0, 160),
      images: evento.imagen_url ? [evento.imagen_url] : undefined,
    },
  };
}

export default async function EventoDetailPage({ params }: EventoDetailPageProps) {
  const { locale, zona: zonaSlug, id } = await params;
  const zona = getZona(zonaSlug);

  if (!zona || !zona.activa) notFound();

  setRequestLocale(locale);

  const rawEvento = await getEventoById(id);
  if (!rawEvento) notFound();

  const evento = getEventoTraducido(rawEvento, locale);

  const tDetail = await getTranslations("eventDetail");
  const tCat = await getTranslations("categories");
  const tPrice = await getTranslations("price");
  const tWa = await getTranslations("whatsapp");

  const categoria = getCategoria(evento.tipo);
  const rec = extraerRecurrencia(evento.descripcion);
  const fecha = formatFecha(evento.fecha_inicio, locale);
  const hora = formatHora(evento.fecha_inicio);

  const precioDisplay =
    evento.precio === null
      ? tPrice("consult")
      : evento.precio === 0
      ? tPrice("free")
      : formatPrecio(evento.precio, evento.precio_moneda);

  const refCode = evento.id.slice(0, 5).toUpperCase();
  const waMensaje = `${tWa("message", {
    titulo: evento.titulo,
  })} [Ref #${refCode}]`;

  const waLink = whatsappLink(evento.negocio.whatsapp, waMensaje);

  const descripcionLimpia =
    limpiarDescripcionRecurrencia(evento.descripcion) ||
    `${evento.titulo} en ${evento.negocio.nombre}, ${zona.nombre}.`;

  // Datos estructurados Schema.org para Google Events Rich Snippets
  const eventJsonLd = {
    "@context": "https://schema.org",
    "@type": "Event",
    name: evento.titulo,
    description: descripcionLimpia,
    startDate: evento.fecha_inicio,
    endDate: evento.fecha_fin || evento.fecha_inicio,
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    eventStatus: "https://schema.org/EventScheduled",
    image: evento.imagen_url ? [evento.imagen_url] : [],
    location: {
      "@type": "Place",
      name: evento.negocio.nombre,
      address: {
        "@type": "PostalAddress",
        addressLocality: zona.nombre,
        addressRegion: "Magdalena",
        addressCountry: "CO",
      },
    },
    organizer: {
      "@type": "Organization",
      name: evento.negocio.nombre,
      url: `https://wa.me/${evento.negocio.whatsapp.replace(/\D/g, "")}`,
    },
    offers: {
      "@type": "Offer",
      price: evento.precio ?? 0,
      priceCurrency: evento.precio_moneda || "COP",
      url: `https://www.padonde.lat/${locale}/${zonaSlug}/${evento.id}`,
      availability: "https://schema.org/InStock",
    },
  };

  return (
    <div className="min-h-screen bg-cream pb-32">
      {/* Datos estructurados JSON-LD para Google Search Events */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(eventJsonLd) }}
      />

      {/* 1. Header flotante sobre la foto con botón atrás y compartir */}
      <nav className="fixed top-0 left-0 right-0 z-30 px-4 py-3 bg-gradient-to-b from-black/60 to-transparent">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <Link
            href={`/${zonaSlug}`}
            className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-cream/90 backdrop-blur-md text-forest hover:bg-cream transition-all duration-150 shadow-sm active:scale-95"
            aria-label={tDetail("back")}
          >
            <span className="text-lg">←</span>
          </Link>

          <ShareButton title={evento.titulo} />
        </div>
      </nav>

      {/* 2. Hero Image con aspect ratio generoso */}
      <div className="relative w-full h-80 sm:h-96 bg-forest">
        {evento.imagen_url ? (
          <Image
            src={evento.imagen_url}
            alt={evento.titulo}
            fill
            priority
            sizes="(max-width: 640px) 100vw, 640px"
            className="object-cover"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-forest to-stone" />
        )}
        <div className="card-overlay absolute inset-0" />

        {/* Badge flotante en la foto */}
        <div className="absolute bottom-4 left-4 right-4 max-w-lg mx-auto flex items-center gap-2">
          {categoria && (
            <span className="bg-white/20 backdrop-blur-md text-white text-xs font-sans font-medium px-3 py-1 rounded-full">
              {categoria.emoji} {tCat(evento.tipo)}
            </span>
          )}
          {evento.destacado && (
            <span className="bg-terra text-white text-xs font-sans font-semibold px-3 py-1 rounded-full shadow-xs">
              ⭐ {tDetail("featured") || "Destacado"}
            </span>
          )}
        </div>
      </div>

      {/* 3. Contenedor principal de detalles */}
      <main className="max-w-lg mx-auto px-4 -mt-3 relative z-10">
        <div className="bg-cream rounded-t-3xl pt-6 space-y-6">
          {/* Título y Organizador */}
          <div>
            <h1 className="font-serif text-2xl sm:text-3xl text-forest leading-tight tracking-tight">
              {evento.titulo}
            </h1>

            {/* Info del negocio / anfitrión */}
            <div className="mt-3 flex items-center justify-between p-3 rounded-2xl bg-stone-light/50 border border-stone-light">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-forest text-cream flex items-center justify-center font-serif text-lg font-bold">
                  {evento.negocio.nombre.charAt(0)}
                </div>
                <div>
                  <p className="text-xs text-stone uppercase tracking-wider font-semibold">
                    {tDetail("organizedBy")}
                  </p>
                  <p className="font-sans font-medium text-sm text-forest">
                    {evento.negocio.nombre}
                  </p>
                </div>
              </div>

              {evento.negocio.instagram && (
                <a
                  href={`https://instagram.com/${evento.negocio.instagram.replace("@", "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-terra hover:text-terra-dark font-medium underline underline-offset-2"
                >
                  {evento.negocio.instagram}
                </a>
              )}
            </div>
          </div>

          {/* Tarjetas de metadata rápida: Fecha, Hora y Precio */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3.5 rounded-2xl bg-white/60 border border-stone-light/70 shadow-xs">
              <span className="text-base">{rec.esRecurrente ? "🔄" : "📅"}</span>
              <p className="text-xs text-stone mt-1">{tDetail("dateTime")}</p>
              <p className="font-sans font-semibold text-sm text-forest capitalize">
                {rec.esRecurrente ? formatearDiasRecurrencia(rec.dias, locale) : fecha}
              </p>
              <p className="text-xs text-stone mt-0.5">
                {hora}
                {rec.esRecurrente && evento.fecha_fin ? ` · ${tDetail("until")} ${formatFecha(evento.fecha_fin, locale)}` : ""}
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-white/60 border border-stone-light/70 shadow-xs">
              <span className="text-base">🏷️</span>
              <p className="text-xs text-stone mt-1">{tDetail("price")}</p>
              <p className="font-sans font-semibold text-base text-forest">
                {precioDisplay}
              </p>
              {evento.precio !== null && evento.precio > 0 && (
                <p className="text-[10px] text-stone">{tDetail("perPerson")}</p>
              )}
            </div>
          </div>

          {/* Descripción detallada */}
          <section className="space-y-2">
            <h2 className="font-serif text-lg text-forest">
              {tDetail("about")}
            </h2>
            <div className="font-sans text-sm text-stone leading-relaxed whitespace-pre-line">
              {limpiarDescripcionRecurrencia(evento.descripcion) || tDetail("noDescription")}
            </div>
          </section>

          {/* Información de ayuda o tips para la zona */}
          <div className="p-4 rounded-2xl bg-stone-light/40 border border-stone-light/60 text-xs text-stone space-y-1">
            <p className="font-semibold text-forest flex items-center gap-1.5">
              <span>🌿</span> {tDetail("tipTitle")}:
            </p>
            <p>
              {tDetail("tipContent")}
            </p>
          </div>
        </div>
      </main>

      {/* 4. Barra Fija Inferior (Sticky Bottom CTA con margen para barra gestual) */}
      <aside className="fixed bottom-0 left-0 right-0 z-20 bg-cream/95 backdrop-blur-md border-t border-stone-light pt-3 pb-6 sm:pb-3 px-4 shadow-lg">
        <div className="max-w-lg mx-auto flex items-center justify-between gap-4">
          <div>
            <p className="text-[11px] text-stone uppercase tracking-wider font-semibold">
              {tDetail("price")}
            </p>
            <p className="font-serif text-lg font-bold text-forest">
              {precioDisplay}
            </p>
          </div>

          <WhatsAppBookingButton
            href={waLink}
            label={tDetail("bookWhatsApp")}
            eventoId={rawEvento.id}
            eventoTitulo={rawEvento.titulo}
            negocioNombre={rawEvento.negocio.nombre}
            negocioId={rawEvento.negocio_id}
            precio={rawEvento.precio}
          />
        </div>
      </aside>
    </div>
  );
}
