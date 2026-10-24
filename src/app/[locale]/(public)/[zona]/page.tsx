import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { FeedTabsContainer } from "@/components/layout/FeedTabsContainer";
import { ZonaHeader } from "@/components/layout/ZonaHeader";
import { SearchProvider } from "@/context/SearchContext";
import { InstallPrompt } from "@/components/layout/InstallPrompt";
import { InstallAppButton } from "@/components/layout/InstallAppButton";
import { QRScanTracker } from "@/components/layout/QRScanTracker";
import { PullToRefreshTracker } from "@/components/layout/PullToRefreshTracker";
import {
  getEventosByZona,
  getServiciosEsencialesByZona,
  getConfigTerritorialAsync,
} from "@/lib/supabase/queries";
import { getZona, whatsappLink, WHATSAPP_CONTACTO } from "@/constants";
import { getEventoTraducidoAsync } from "@/lib/translations/eventosTraducciones";
import type { ZonaSlug } from "@/lib/types";
import type { Metadata } from "next";

interface ZonaPageProps {
  params: Promise<{ locale: string; zona: ZonaSlug }>;
}

// Revalidación cada 60 segundos en el Edge CDN de Vercel para máxima velocidad y protección de la BD
export const revalidate = 60;

/** Metadata dinámica por zona e idioma — optimizada para búsquedas turísticas en Google */
export async function generateMetadata({ params }: ZonaPageProps): Promise<Metadata> {
  const { locale, zona: zonaSlug } = await params;
  const zona = getZona(zonaSlug);
  if (!zona) return {};

  const titles: Record<string, string> = {
    es: `PaDónde 🌿 Cartelera de ${zona.nombre} | Live Events & Tours`,
    en: `PaDónde 🌿 Things to do in ${zona.nombre} today — Live Events & Tours`,
    fr: `PaDónde 🌿 Agenda Touristique à ${zona.nombre} — Événements et Sorties`,
    de: `PaDónde 🌿 Live-Tourismus-Kalender in ${zona.nombre} — Events & Touren`,
  };

  const descriptions: Record<string, string> = {
    es: `Qué hacer hoy en ${zona.nombre}: eventos, música en vivo, talleres y tours. / Live tourist board: daily events, live music, workshops, wellness & local dining.`,
    en: `Discover what to do today in ${zona.nombre}, Sierra Nevada. Live tourist board: live music, workshops, wellness, tours, and authentic dining.`,
    fr: `Découvrez quoi faire aujourd'hui à ${zona.nombre}, Sierra Nevada. Agenda touristique en direct : musique live, ateliers, yoga, visites et restaurants.`,
    de: `Entdecke Aktivitäten heute in ${zona.nombre}, Sierra Nevada. Live-Tourismus-Kalender: Live-Musik, Workshops, Yoga, Touren und Restaurants.`,
  };

  const title = titles[locale] || titles.es;
  const description = descriptions[locale] || descriptions.es;
  const canonicalUrl = `https://www.padonde.lat/${locale}/${zonaSlug}`;
  const ogImageUrl = "https://www.padonde.lat/og_minca.jpg";

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
      languages: {
        es: `https://www.padonde.lat/es/${zonaSlug}`,
        en: `https://www.padonde.lat/en/${zonaSlug}`,
        fr: `https://www.padonde.lat/fr/${zonaSlug}`,
        de: `https://www.padonde.lat/de/${zonaSlug}`,
      },
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      type: "website",
      locale: locale === "en" ? "en_US" : locale === "fr" ? "fr_FR" : locale === "de" ? "de_DE" : "es_CO",
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: `PaDónde — Cartelera Turística de ${zona.nombre}`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImageUrl],
    },
  };
}

/**
 * Página principal del feed por zona con soporte multi-idioma.
 * Consulta primero la base de datos de Supabase; si aún no está conectada
 * o no tiene registros, usa los datos mock como fallback transparente.
 */
export default async function ZonaPage({ params }: ZonaPageProps) {
  const { locale, zona: zonaSlug } = await params;
  const zona = getZona(zonaSlug);

  if (!zona || !zona.activa) notFound();

  setRequestLocale(locale);

  const tHeader = await getTranslations("header");
  const tFooter = await getTranslations("footer");
  const tWa = await getTranslations("whatsapp");

  // Obtener eventos, servicios esenciales y configuración territorial activa de la nube
  const [eventosRaw, servicios, configTerritorial] = await Promise.all([
    getEventosByZona(zonaSlug),
    getServiciosEsencialesByZona(zonaSlug),
    getConfigTerritorialAsync(),
  ]);
  let eventos = eventosRaw;

  // Si el idioma no es español, traducir dinámicamente títulos y descripciones
  if (locale !== "es" && eventos.length > 0) {
    eventos = await Promise.all(
      eventos.map((ev) => getEventoTraducidoAsync(ev, locale))
    );
  }

  const mensajeComercial = tWa("businessMessage", { zona: zona.nombre });
  const waComercialLink = whatsappLink(WHATSAPP_CONTACTO, mensajeComercial);

  // Datos estructurados Schema.org para indexación rica en Google
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "TouristDestination",
        name: zona.nombre,
        description: zona.descripcion,
        touristType: ["Eco-tourism", "Adventure", "Culture", "Gastronomy"],
        containedInPlace: {
          "@type": "Place",
          name: "Sierra Nevada de Santa Marta",
          address: {
            "@type": "PostalAddress",
            addressRegion: "Magdalena",
            addressCountry: "CO",
          },
        },
      },
      {
        "@type": "ItemList",
        name: `Eventos y planes en ${zona.nombre}`,
        itemListElement: eventos.map((e, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: e.titulo,
          url: `https://www.padonde.lat/${locale}/${zonaSlug}/${e.id}`,
        })),
      },
    ],
  };

  return (
    <main className="min-h-screen bg-cream page-enter">
      {/* Datos estructurados JSON-LD para Google Search */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Persistencia silenciosa de la última zona visitada para el acceso directo PWA */}
      <script
        dangerouslySetInnerHTML={{
          __html: `document.cookie = "padonde_zona=${zonaSlug}; path=/; max-age=31536000; SameSite=Lax";`,
        }}
      />

      <SearchProvider>
        {/* Header fijo superior interactivo con buscador colapsable, selector de idioma y compartir */}
        <ZonaHeader
          zonaNombre={zona.nombre}
          zonaSlug={zonaSlug}
          locale={locale}
        />

        {/* Feed principal y Servicios Esenciales con padding-top generoso para el header fijo */}
        <div className="max-w-lg mx-auto px-4 pt-24 sm:pt-28 pb-6">
          <FeedTabsContainer
            eventos={eventos}
            servicios={servicios}
            zona={zonaSlug}
            zonaNombre={zona.nombre}
            configTerritorial={configTerritorial}
          />
        </div>
      </SearchProvider>

      {/* Footer — invitación a negocios con traducción y enlace a tu WhatsApp */}
      <footer className="text-center py-8 px-4 pb-24">
        <p className="font-sans text-sm text-stone-dark inline-flex items-center justify-center gap-1.5 flex-wrap">
          <span className="text-base select-none">🌿</span>
          <span className="font-medium">{tFooter("cta", { zona: zona.nombre })}</span>
          <a
            href={waComercialLink}
            target="_blank"
            rel="noopener noreferrer"
            className="font-bold text-terra hover:text-terra-dark underline underline-offset-4 decoration-terra/60 hover:decoration-terra transition-colors ml-0.5"
          >
            {tFooter("ctaLink")}
          </a>
        </p>

        {/* Acceso manual permanente a la instalación de la app */}
        <div className="mt-3">
          <InstallAppButton />
        </div>
      </footer>

      {/* Acceso directo PWA discreto (sólo en móviles) */}
      <InstallPrompt />

      {/* Actualización al volver a la app y Pull-to-Refresh en móviles */}
      <PullToRefreshTracker />

      {/* Rastreador de escaneo físico QR con antifraude */}
      <QRScanTracker zonaSlug={zonaSlug} />
    </main>
  );
}
