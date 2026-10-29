import Image from "next/image";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { getEventoById } from "@/lib/supabase/queries";
import { getCategoria, getCategoriaCTA, getZona, whatsappLink } from "@/constants";
import {
  formatFecha,
  formatHora,
  formatPrecio,
  extraerRecurrencia,
  formatearDiasRecurrencia,
  limpiarDescripcionRecurrencia,
  getFechaYMDDesdeISO,
  getFechaYMDColombia,
  extraerGoogleReviewUrl,
} from "@/lib/utils";

import { getEventoTraducido, getEventoTraducidoAsync } from "@/lib/translations/eventosTraducciones";
import { Button } from "@/components/ui/Button";
import { ShareButton } from "@/components/events/ShareButton";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";
import { WhatsAppBookingButton } from "@/components/events/WhatsAppBookingButton";
import { StayCalculator } from "@/components/events/StayCalculator";
import { GoogleRatingBadge } from "@/components/events/GoogleRatingBadge";
import { DetailBackButton } from "@/components/events/DetailBackButton";
import { DetailSlideWrapper } from "@/components/events/DetailSlideWrapper";
import { EventVideoPlayer } from "@/components/events/EventVideoPlayer";
import { EventHeroGallery } from "@/components/events/EventHeroGallery";
import { RestaurantMenuSection } from "@/components/events/RestaurantMenuSection";
import type { ZonaSlug } from "@/lib/types";
import type { Metadata } from "next";

interface EventoDetailPageProps {
  params: Promise<{ locale: string; zona: ZonaSlug; id: string }>;
}

// Revalidación cada 60 segundos en el Edge CDN de Vercel para soportar tráfico viral sin cargar la BD
export const revalidate = 60;

export async function generateMetadata({ params }: EventoDetailPageProps): Promise<Metadata> {
  const { locale, zona: zonaSlug, id } = await params;
  const rawEvento = await getEventoById(id);
  if (!rawEvento) return {};
  const evento = await getEventoTraducidoAsync(rawEvento, locale);

  const zona = getZona(zonaSlug);
  const nombreZona = zona?.nombre || "Minca";
  const descripcionLimpia = limpiarDescripcionRecurrencia(evento.descripcion) ||
    `${evento.titulo} en ${evento.negocio.nombre}, ${nombreZona}. Consulta horarios y reserva directa por WhatsApp.`;

  const canonicalUrl = `https://www.padonde.lat/${locale}/${zonaSlug}/${id}`;
  const title = `${evento.titulo} — ${evento.negocio.nombre} (${nombreZona})`;

  const absoluteImageUrl = evento.imagen_url
    ? evento.imagen_url.startsWith("http")
      ? evento.imagen_url
      : `https://www.padonde.lat${evento.imagen_url.startsWith("/") ? "" : "/"}${evento.imagen_url}`
    : "https://www.padonde.lat/og_minca.jpg";

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
      images: [
        {
          url: absoluteImageUrl,
          width: 1200,
          height: 630,
          alt: evento.titulo,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: descripcionLimpia.slice(0, 160),
      images: [absoluteImageUrl],
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

  const evento = await getEventoTraducidoAsync(rawEvento, locale);

  const tDetail = await getTranslations("eventDetail");
  const tCat = await getTranslations("categories");
  const tPrice = await getTranslations("price");
  const tWa = await getTranslations("whatsapp");
  const tStay = await getTranslations("stayCalculator");

  const categoria = getCategoria(evento.tipo);
  const rec = extraerRecurrencia(evento.descripcion);
  const fecha = formatFecha(evento.fecha_inicio, locale);
  const hora = formatHora(evento.fecha_inicio);
  const ymdInicio = getFechaYMDDesdeISO(evento.fecha_inicio);
  const ymdFin = evento.fecha_fin ? getFechaYMDDesdeISO(evento.fecha_fin) : null;
  const esMultiDia = Boolean(ymdFin && ymdFin > ymdInicio && evento.fecha_fin);
  const hoyYmd = getFechaYMDColombia();
  const esUltimoDia = Boolean(ymdFin && ymdFin === hoyYmd);
  const fechaFinTexto = evento.fecha_fin ? formatFecha(evento.fecha_fin, locale) : "";

  const precioDisplay =
    evento.precio === null || evento.precio === 0
      ? tPrice("consult")
      : formatPrecio(evento.precio, evento.precio_moneda);

  const refCode = evento.id.slice(0, 5).toUpperCase();
  const ctaConfig = getCategoriaCTA(evento.tipo, locale);
  const plantillaMensaje = ctaConfig.mensajeTemplate || tWa("message", { titulo: evento.titulo });
  const waMensaje = `${plantillaMensaje.replace("{titulo}", evento.titulo)} [Ref #${refCode}]`;

  const waLink = whatsappLink(evento.negocio.whatsapp, waMensaje);

  const descripcionLimpia =
    limpiarDescripcionRecurrencia(evento.descripcion) ||
    `${evento.titulo} en ${evento.negocio.nombre}, ${zona.nombre}.`;

  // Reputación de Google: cascada segura (negocio aliado -> metadata_hospedaje evento)
  const googleReputacion =
    evento.negocio?.google_rating && evento.negocio?.google_maps_url
      ? {
          rating: Number(evento.negocio.google_rating),
          total_reviews: Number(evento.negocio.google_total_reviews || 0),
          maps_url: evento.negocio.google_maps_url,
        }
      : evento.metadata_hospedaje?.google_reputacion;

  // Datos estructurados Schema.org para Google Events y Restaurant Rich Snippets
  const isRestaurante = evento.tipo === "comida";
  const restaurantJsonLd = isRestaurante
    ? {
        "@context": "https://schema.org",
        "@type": "Restaurant",
        name: evento.negocio.nombre,
        description: descripcionLimpia,
        image: evento.imagen_url ? [evento.imagen_url] : [],
        url: `https://www.padonde.lat/${locale}/${zonaSlug}/${evento.id}`,
        telephone: `+${evento.negocio.whatsapp.replace(/\D/g, "")}`,
        address: {
          "@type": "PostalAddress",
          addressLocality: zona.nombre,
          addressRegion: "Magdalena",
          addressCountry: "CO",
        },
        priceRange: evento.precio ? `${evento.precio} COP` : "$$",
        ...(evento.metadata_hospedaje?.menu_url || (evento.metadata_hospedaje?.menu_fotos && evento.metadata_hospedaje.menu_fotos.length > 0)
          ? { hasMenu: evento.metadata_hospedaje?.menu_url || `https://www.padonde.lat/${locale}/${zonaSlug}/${evento.id}` }
          : {}),
        ...(googleReputacion?.rating
          ? {
              aggregateRating: {
                "@type": "AggregateRating",
                ratingValue: googleReputacion.rating,
                reviewCount: googleReputacion.total_reviews || 1,
              },
            }
          : {}),
      }
    : null;

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
    ...(evento.metadata_hospedaje?.menu_url ? { hasMenu: evento.metadata_hospedaje.menu_url } : {}),
  };

  return (
    <DetailSlideWrapper zonaSlug={zonaSlug}>
      {/* Datos estructurados JSON-LD para Google Search Events y Restaurantes */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(restaurantJsonLd || eventJsonLd) }}
      />

      {/* 1. Header flotante sobre la foto con botón atrás, selector de idioma y compartir */}
      <nav className="fixed top-0 left-0 right-0 z-40 px-4 py-3 bg-gradient-to-b from-black/60 to-transparent">
        <div className="max-w-lg mx-auto flex items-center justify-between gap-2">
          <DetailBackButton
            fallbackUrl={`/${locale}/${zonaSlug}`}
            ariaLabel={tDetail("back")}
          />

          <div className="flex items-center gap-2">
            <LanguageSwitcher className="bg-cream/90 backdrop-blur-md shadow-xs" />
            <ShareButton
              title={evento.titulo}
              text={`${evento.titulo} en ${evento.negocio.nombre} (${zona.nombre}) — PaDónde 🌿`}
              url={`https://www.padonde.lat/${locale}/${zonaSlug}/${id}`}
              zonaNombre={zona.nombre}
              variant="detail"
            />
          </div>
        </div>
      </nav>

      {/* 2. Hero Image / Gallery con aspect ratio generoso y scroll-snap nativo */}
      <EventHeroGallery
        imagenUrl={evento.imagen_url}
        titulo={evento.titulo}
        galeriaFotos={evento.metadata_hospedaje?.galeria_fotos}
        categoriaBadge={
          categoria ? (
            <span className="bg-white/20 backdrop-blur-md text-white text-xs font-sans font-medium px-3 py-1 rounded-full">
              {categoria.emoji} {tCat(evento.tipo)}
            </span>
          ) : null
        }
        destacadoBadge={
          evento.destacado ? (
            <span className="bg-terra text-white text-xs font-sans font-semibold px-3 py-1 rounded-full shadow-xs">
              ⭐ {tDetail("featured") || "Destacado"}
            </span>
          ) : null
        }
      />

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

              <div className="flex flex-col items-end gap-1.5">
                {googleReputacion && (
                  <GoogleRatingBadge reputacion={googleReputacion} />
                )}

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
          </div>

          {/* Tarjetas de metadata rápida: Fecha, Hora y Precio */}
          <div className="grid grid-cols-2 gap-3">
            {evento.tipo === "hospedaje" ? (
              <div className="p-3.5 rounded-2xl bg-white/60 border border-stone-light/70 shadow-xs">
                <span className="text-base">🕒</span>
                <p className="text-xs text-stone mt-1">
                  {locale === "en" ? "Check-in / Out" : "Disponibilidad"}
                </p>
                <p className="font-sans font-semibold text-sm text-forest capitalize">
                  {evento.metadata_hospedaje?.check_in_hora
                    ? `In: ${evento.metadata_hospedaje.check_in_hora} · Out: ${evento.metadata_hospedaje.check_out_hora || "11:00"}`
                    : (locale === "en" ? "Daily check-in" : "Check-in diario")}
                </p>
                <p className="text-xs text-stone mt-0.5">
                  {locale === "en" ? "Year-round availability" : "Disponible todo el año"}
                </p>
              </div>
            ) : (
              <div className="p-3.5 rounded-2xl bg-white/60 border border-stone-light/70 shadow-xs">
                <span className="text-base">{rec.esRecurrente ? "🔄" : "📅"}</span>
                <p className="text-xs text-stone mt-1">{tDetail("dateTime")}</p>
                <p className="font-sans font-semibold text-sm text-forest capitalize">
                  {rec.esRecurrente
                    ? formatearDiasRecurrencia(rec.dias, locale)
                    : esMultiDia
                    ? `${fecha} — ${fechaFinTexto}`
                    : fecha}
                </p>
                <p className="text-xs text-stone mt-0.5">
                  {rec.esRecurrente ? (
                    <>
                      {hora}
                      {evento.fecha_fin ? ` · ${tDetail("until")} ${fechaFinTexto}` : ""}
                    </>
                  ) : esMultiDia ? (
                    <>
                      {hora}
                      {esUltimoDia ? (
                        <span className="ml-1 text-terra font-semibold">
                          · {locale === "en" ? "Ends today!" : locale === "fr" ? "Se termine aujourd'hui !" : locale === "de" ? "Endet heute!" : "¡Finaliza hoy!"}
                        </span>
                      ) : (
                        ` · ${tDetail("until")} ${fechaFinTexto}`
                      )}
                    </>
                  ) : (
                    hora
                  )}
                </p>
              </div>
            )}

            <div className="p-3.5 rounded-2xl bg-white/60 border border-stone-light/70 shadow-xs">
              <span className="text-base">🏷️</span>
              <p className="text-xs text-stone mt-1">{tDetail("price")}</p>
              <p className="font-sans font-semibold text-base text-forest">
                {evento.tipo === "hospedaje" && evento.precio ? `Desde ${precioDisplay}` : precioDisplay}
              </p>
              {evento.precio !== null && evento.precio > 0 && (
                <p className="text-[10px] text-stone">
                  {evento.tipo === "hospedaje" ? (locale === "en" ? "per night" : "por noche") : tDetail("perPerson")}
                </p>
              )}
            </div>
          </div>

          {/* Menú Digital de Restaurante & Solicitud de Reseña Google */}
          {(() => {
            const isPepeMojito =
              evento.id === "0274476c-aa64-42d9-9cbc-1e0a41940c2d" ||
              evento.negocio.nombre.toLowerCase().includes("pepe mojito");

            const menuFotos =
              evento.metadata_hospedaje?.menu_fotos &&
              evento.metadata_hospedaje.menu_fotos.length > 0
                ? evento.metadata_hospedaje.menu_fotos
                : isPepeMojito
                ? ["/menus/menupepe1.jpeg", "/menus/menupepe2.jpeg"]
                : undefined;

            const menuUrl =
              evento.metadata_hospedaje?.menu_url ||
              (isPepeMojito ? "/menus/menupepe1.jpeg" : undefined);

            const isJungleJoe =
              evento.id === "6817d5de-d00a-4514-b505-fa2c10608749" ||
              (evento.negocio?.nombre || "").toLowerCase().includes("jungle joe") ||
              (evento.titulo || "").toLowerCase().includes("jungle joe");

            const googleReviewUrl =
              evento.negocio?.google_review_url ||
              evento.metadata_hospedaje?.google_review_url ||
              extraerGoogleReviewUrl(googleReputacion?.maps_url) ||
              (isPepeMojito
                ? "https://search.google.com/local/writereview?placeid=ChIJiQTfKLuV9I4R3E86eG2jG6w"
                : isJungleJoe
                ? "https://search.google.com/local/writereview?placeid=ChIJ6S1R3yvx9I4RZovuGgHEzBs"
                : undefined);

            const googleMapsUrl =
              googleReputacion?.maps_url ||
              (isPepeMojito ? "https://maps.google.com/?cid=12401671911910625244" : undefined);

            const isLazyCat =
              evento.negocio.nombre.toLowerCase().includes("lazy cat") ||
              evento.titulo.toLowerCase().includes("lazy cat");

            const luxuryMenuUrl = isLazyCat ? `/${locale}/${zonaSlug}/menu-demo` : undefined;

            return (
              <RestaurantMenuSection
                businessName={evento.negocio.nombre}
                menuUrl={menuUrl}
                menuFotos={menuFotos}
                googleReviewUrl={googleReviewUrl}
                googleMapsUrl={googleMapsUrl}
                zonaNombre={zona.nombre}
                locale={locale}
                whatsappNumber={evento.negocio.whatsapp}
                luxuryMenuUrl={luxuryMenuUrl}
              />
            );
          })()}

          {/* Descripción detallada */}
          <section className="space-y-2">
            <h2 className="font-serif text-lg text-forest">
              {tDetail("about")}
            </h2>
            <div className="font-sans text-sm text-stone leading-relaxed whitespace-pre-line">
              {limpiarDescripcionRecurrencia(evento.descripcion) || tDetail("noDescription")}
            </div>
          </section>

          {/* Video / Reel de la Experiencia (Bajo demanda, cero consumo inicial) */}
          {evento.video_url && (
            <EventVideoPlayer
              videoUrl={evento.video_url}
              posterUrl={evento.imagen_url}
              title={evento.titulo}
            />
          )}

          {/* Módulo de Hospedaje: Habitaciones y Pre-cotizador reactivo */}
          {evento.tipo === "hospedaje" &&
            evento.metadata_hospedaje?.habitaciones &&
            evento.metadata_hospedaje.habitaciones.length > 0 && (
              <StayCalculator
                habitaciones={evento.metadata_hospedaje.habitaciones}
                hostalNombre={evento.negocio.nombre}
                whatsapp={evento.negocio.whatsapp}
                locale={locale}
                eventoId={evento.id}
                negocioId={evento.negocio_id}
                zonaSlug={zonaSlug}
                labels={{
                  sectionTitle: tStay("sectionTitle"),
                  sectionSubtitle: tStay("sectionSubtitle"),
                  checkIn: tStay("checkIn"),
                  checkOut: tStay("checkOut"),
                  guests: tStay("guests"),
                  nights: tStay("nights"),
                  nightSingular: tStay("nightSingular"),
                  estimatedTotal: tStay("estimatedTotal"),
                  consultWhatsApp: tStay("consultWhatsApp"),
                  disclaimer: tStay("disclaimer"),
                  selectRoom: tStay("selectRoom"),
                  selectedRoom: tStay("selectedRoom"),
                  perNight: tStay("perNight"),
                  chooseRoomHint: tStay("chooseRoomHint"),
                }}
              />
            )}

          {/* Información de ayuda o tips para la zona */}
          <div className="p-4 rounded-2xl bg-stone-light/40 border border-stone-light/60 text-xs text-stone space-y-1">
            <p className="font-semibold text-forest flex items-center gap-1.5">
              <span>🌿</span> {tDetail("tipTitle")}:
            </p>
            <p>
              {tDetail("tipContent", { zona: zona.nombre })}
            </p>
          </div>
        </div>
      </main>

      {/* 4. Barra Fija Inferior (Sticky Bottom CTA con margen para barra gestual) */}
      <aside className="fixed bottom-0 left-0 right-0 z-40 bg-cream/95 backdrop-blur-md border-t border-stone-light pt-3 pb-6 sm:pb-3 px-4 shadow-lg">
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
            label={ctaConfig.label}
            icon={ctaConfig.icon}
            eventoId={rawEvento.id}
            eventoTitulo={rawEvento.titulo}
            negocioNombre={rawEvento.negocio.nombre}
            negocioId={rawEvento.negocio_id}
            precio={rawEvento.precio}
            tipoCategoria={evento.tipo || "evento"}
            seccionOrigen="detalle_evento"
            zonaSlug={zonaSlug}
          />
        </div>
      </aside>
    </DetailSlideWrapper>
  );
}
