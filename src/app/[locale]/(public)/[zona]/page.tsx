import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { EventFeed } from "@/components/events/EventFeed";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";
import { getZona, whatsappLink, WHATSAPP_CONTACTO } from "@/constants";
import { getEventosByZona } from "@/lib/supabase/queries";
import { getMockEventos } from "@/lib/mock/eventos";
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
    es: `Qué hacer en ${zona.nombre} hoy — Eventos, Tours y Gastronomía`,
    en: `Things to do in ${zona.nombre} today — Events, Tours & Experiences`,
    fr: `Que faire à ${zona.nombre} aujourd'hui — Événements, Sorties et Tours`,
    de: `Was kann man in ${zona.nombre} heute tun — Events, Touren & Aktivitäten`,
  };

  const descriptions: Record<string, string> = {
    es: `Descubre qué hacer hoy en ${zona.nombre}, Sierra Nevada de Santa Marta. Cartelera turística en vivo: tours de café, avistamiento de aves, música en vivo, yoga y restaurantes locales.`,
    en: `Discover what to do today in ${zona.nombre}, Sierra Nevada de Santa Marta. Live tourist board: coffee tours, birdwatching, live music, wellness, and authentic dining.`,
    fr: `Découvrez quoi faire aujourd'hui à ${zona.nombre}, Sierra Nevada de Santa Marta. Agenda touristique en direct : observation des oiseaux, visites de café, musique live et restaurants.`,
    de: `Entdecke Aktivitäten heute in ${zona.nombre}, Sierra Nevada de Santa Marta. Live-Tourismus-Kalender: Kaffeetouren, Vogelbeobachtung, Live-Musik, Wellness und lokale Restaurants.`,
  };

  const title = titles[locale] || titles.es;
  const description = descriptions[locale] || descriptions.es;
  const canonicalUrl = `https://www.padonde.lat/${locale}/${zonaSlug}`;

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
          url: "/optimized_events/jam-birding.webp",
          width: 1200,
          height: 630,
          alt: `Qué hacer en ${zona.nombre} hoy`,
        },
      ],
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

  // Obtener eventos desde Supabase con fallback a mock
  let eventos = await getEventosByZona(zonaSlug);
  if (eventos.length === 0) {
    eventos = getMockEventos();
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
    <main className="min-h-screen bg-cream">
      {/* Datos estructurados JSON-LD para Google Search */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Header sticky con blur y selector de idioma */}
      <header className="sticky top-0 z-10 bg-cream/90 backdrop-blur-sm border-b border-stone-light px-4 py-3">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div>
            <h1 className="font-serif text-3xl text-forest tracking-tight">
              PaDónde
            </h1>
            <p className="font-sans text-xs text-stone mt-0.5">
              {tHeader("subtitle")} {zona.nombre}
            </p>
          </div>

          {/* Selector de idioma ES / EN / FR */}
          <LanguageSwitcher />
        </div>
      </header>

      {/* Feed de eventos */}
      <div className="max-w-lg mx-auto px-4 py-6">
        <EventFeed eventos={eventos} zona={zonaSlug} />
      </div>

      {/* Footer — invitación a negocios con traducción y enlace a tu WhatsApp */}
      <footer className="text-center py-8 px-4">
        <p className="font-sans text-xs text-stone">
          {tFooter("cta", { zona: zona.nombre })}{" "}
          <a
            href={waComercialLink}
            target="_blank"
            rel="noopener noreferrer"
            className="text-terra underline underline-offset-2 hover:text-terra-dark font-medium"
          >
            {tFooter("ctaLink")}
          </a>
        </p>
      </footer>
    </main>
  );
}
