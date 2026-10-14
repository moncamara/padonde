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

/** Metadata dinámica por zona e idioma — importante para SEO multi-idioma */
export async function generateMetadata({ params }: ZonaPageProps): Promise<Metadata> {
  const { locale, zona: zonaSlug } = await params;
  const zona = getZona(zonaSlug);
  if (!zona) return {};

  const t = await getTranslations({ locale, namespace: "header" });

  return {
    title: `PaDónde ${zona.nombre} — ${t("subtitle")} ${zona.nombre}`,
    description: `Descubre qué hacer hoy en ${zona.nombre}. Eventos, tours, comida, música y más.`,
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

  return (
    <main className="min-h-screen bg-cream">
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
