import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { Link, routing } from "@/i18n/routing";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";
import { WHATSAPP_CONTACTO, whatsappLink } from "@/constants";
import { getAliadosCopy } from "./aliadosCopy";
import { AliadosWhatsAppCta } from "./AliadosWhatsAppCta";

interface AliadosPageProps {
  params: Promise<{ locale: string }>;
}

// 100% Estática (SSG + ISR en Edge CDN sin consumo de CPU Serverless en Vercel)
export const revalidate = 3600;

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: AliadosPageProps): Promise<Metadata> {
  const { locale } = await params;
  const copy = getAliadosCopy(locale);
  const canonicalUrl = `https://padonde.lat/${locale}/aliados`;
  const ogImageUrl = "https://padonde.lat/og_minca.jpg";

  return {
    metadataBase: new URL("https://padonde.lat"),
    title: copy.metaTitle,
    description: copy.metaDescription,
    alternates: {
      canonical: canonicalUrl,
      languages: {
        es: "https://padonde.lat/es/aliados",
        en: "https://padonde.lat/en/aliados",
        fr: "https://padonde.lat/fr/aliados",
        de: "https://padonde.lat/de/aliados",
      },
    },
    openGraph: {
      title: copy.metaTitle,
      description: copy.metaDescription,
      url: canonicalUrl,
      type: "website",
      locale:
        locale === "en"
          ? "en_US"
          : locale === "fr"
          ? "fr_FR"
          : locale === "de"
          ? "de_DE"
          : "es_CO",
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: copy.metaTitle,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: copy.metaTitle,
      description: copy.metaDescription,
      images: [ogImageUrl],
    },
  };
}

export default async function AliadosLandingPage({ params }: AliadosPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const copy = getAliadosCopy(locale);
  const heroWaUrl = whatsappLink(WHATSAPP_CONTACTO, copy.hero.waMessageHero);

  // Datos estructurados Schema.org (Organization + FAQPage) para indexación SEO rica
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        name: "PaDónde",
        url: `https://padonde.lat/${locale}/aliados`,
        logo: "https://padonde.lat/icon-192x192.png",
        description: copy.metaDescription,
        areaServed: [
          { "@type": "Place", name: "Minca, Sierra Nevada de Santa Marta" },
          { "@type": "Place", name: "Mendihuaca, Magdalena" },
          { "@type": "Place", name: "Parque Nacional Natural Tayrona" },
        ],
        contactPoint: {
          "@type": "ContactPoint",
          telephone: `+${WHATSAPP_CONTACTO}`,
          contactType: "sales",
          availableLanguage: ["Spanish", "English", "French", "German"],
        },
      },
      {
        "@type": "FAQPage",
        mainEntity: copy.faq.items.map((item) => ({
          "@type": "Question",
          name: item.q,
          acceptedAnswer: {
            "@type": "Answer",
            text: item.a,
          },
        })),
      },
    ],
  };

  return (
    <div className="min-h-screen bg-[#FBF9F5] text-[#1B382B] font-sans selection:bg-[#1B382B] selection:text-[#FBF9F5]">
      {/* JSON-LD Schema.org */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Barra de Navegación Institucional Fija */}
      <header className="sticky top-0 z-40 bg-[#FBF9F5]/95 backdrop-blur-md border-b border-stone-light/80 shadow-2xs">
        <div className="max-w-6xl mx-auto px-3 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between gap-1.5 sm:gap-4 w-full">
          {/* Izquierda: Logo PaDónde contenido y sin encogerse */}
          <div className="flex items-center gap-2.5 shrink-0">
            <Link
              href="/minca"
              className="shrink-0 font-serif text-lg sm:text-2xl font-bold text-[#1B382B] tracking-tight leading-none hover:opacity-90 transition-opacity"
            >
              PaDónde
            </Link>
            <span className="hidden lg:inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider px-3 py-1 rounded-full bg-[#1B382B]/10 text-[#1B382B] border border-[#1B382B]/15">
              <span>🌿</span>
              <span>{copy.nav.badge}</span>
            </span>
          </div>

          {/* Centro: Selector de idiomas siempre visible en móvil y desktop */}
          <LanguageSwitcher className="flex shrink-0 text-[11px] sm:text-xs gap-1 sm:gap-1.5 px-2 py-1 rounded-full bg-stone-100/80 [&_button]:px-1.5 sm:[&_button]:px-2.5 [&_button]:py-0.5 sm:[&_button]:py-1" />

          {/* Derecha: Botón de WhatsApp adaptable (conciso en móvil, extendido en sm+) */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <Link
              href="/minca"
              className="hidden md:inline-flex items-center justify-center min-h-10 px-3.5 py-2 rounded-xl text-xs font-semibold text-[#1B382B] bg-white border border-stone-light hover:border-[#1B382B]/40 transition-colors"
            >
              {copy.nav.exploreBoard}
            </Link>
            <AliadosWhatsAppCta
              href={heroWaUrl}
              section="header_nav"
              className="inline-flex items-center justify-center gap-1 sm:gap-1.5 px-2.5 py-1.5 sm:px-4 sm:py-2 rounded-xl text-xs sm:text-sm font-semibold sm:font-bold bg-[#1B382B] text-[#FBF9F5] hover:bg-[#144D34] transition-colors shadow-xs whitespace-nowrap shrink-0"
            >
              <span>💬</span>
              <span className="sm:hidden">{copy.nav.joinCtaShort}</span>
              <span className="hidden sm:inline">{copy.nav.joinCta}</span>
            </AliadosWhatsAppCta>
          </div>
        </div>
      </header>

      <main>
        {/* ─────────────────────────────────────────────────────────────
            1. HERO SECTION (Inspiración & Propósito de Red)
        ───────────────────────────────────────────────────────────── */}
        <section className="relative overflow-hidden pt-10 pb-14 sm:pt-16 sm:pb-20 lg:pt-20 lg:pb-24 border-b border-stone-light/70">
          {/* Decoración sutil de fondo con los 3 tonos territoriales */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 overflow-hidden"
          >
            <div className="absolute -top-24 -left-24 w-80 h-80 rounded-full bg-[#1B382B]/6 blur-3xl" />
            <div className="absolute top-12 -right-24 w-80 h-80 rounded-full bg-[#0E4A68]/8 blur-3xl" />
            <div className="absolute bottom-0 left-1/3 w-72 h-72 rounded-full bg-amber-500/8 blur-3xl" />
          </div>

          <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6 sm:space-y-8">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/15 border border-amber-600/30 text-amber-900 text-[11px] sm:text-xs font-bold tracking-wider uppercase">
              <span>{copy.hero.eyebrow}</span>
            </div>

            <h1 className="font-serif text-3xl sm:text-5xl lg:text-6xl font-bold text-[#1B382B] tracking-tight leading-[1.12] max-w-4xl mx-auto">
              {copy.hero.title}
            </h1>

            <p className="font-sans text-base sm:text-lg lg:text-xl text-stone-700 leading-relaxed max-w-3xl mx-auto">
              {copy.hero.subtitle}
            </p>

            {/* Botones de Acción Principales (CTAs con target táctil >= 44px) */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3.5 pt-2 max-w-xl sm:max-w-none mx-auto">
              <AliadosWhatsAppCta
                href={heroWaUrl}
                section="hero_primary"
                className="min-h-12 px-6 sm:px-8 py-3.5 rounded-2xl bg-[#1B382B] hover:bg-[#144D34] text-[#FBF9F5] font-sans text-sm sm:text-base font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2.5"
              >
                {/* Icono WhatsApp / Mensaje */}
                <svg
                  className="w-5 h-5 text-amber-400 shrink-0"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
                </svg>
                <span>{copy.hero.primaryCta}</span>
              </AliadosWhatsAppCta>

              <Link
                href="/minca"
                className="min-h-12 px-6 sm:px-7 py-3.5 rounded-2xl bg-white hover:bg-stone-100/80 text-[#1B382B] border-2 border-[#1B382B]/20 hover:border-[#1B382B]/50 font-sans text-sm sm:text-base font-bold transition-all flex items-center justify-center gap-2"
              >
                <svg
                  className="w-5 h-5 text-[#0E4A68] shrink-0"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <circle cx="12" cy="12" r="10" />
                  <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
                </svg>
                <span>{copy.hero.secondaryCta}</span>
              </Link>
            </div>

            {/* Píldoras de Confianza */}
            <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-2.5 pt-2">
              {copy.hero.trustBadges.map((badge) => (
                <span
                  key={badge}
                  className="px-3.5 py-1.5 rounded-full bg-white/90 border border-stone-light text-xs font-semibold text-[#1B382B] shadow-2xs"
                >
                  {badge}
                </span>
              ))}
            </div>

            {/* Accesos directos a las 3 carteleras activas */}
            <div className="pt-4 border-t border-stone-light/60 max-w-2xl mx-auto">
              <p className="text-xs font-semibold uppercase tracking-wider text-stone mb-3">
                {copy.hero.destinationsLabel}
              </p>
              <div className="flex flex-wrap items-center justify-center gap-2.5">
                <Link
                  href="/minca"
                  className="min-h-11 px-4 py-2 rounded-xl bg-[#1B382B]/10 hover:bg-[#1B382B] text-[#1B382B] hover:text-white text-xs sm:text-sm font-bold transition-all inline-flex items-center gap-1.5 border border-[#1B382B]/20"
                >
                  <span>🌿</span>
                  <span>Minca</span>
                  <span className="text-xs opacity-75">↗</span>
                </Link>
                <Link
                  href="/mendihuaca"
                  className="min-h-11 px-4 py-2 rounded-xl bg-[#0E4A68]/10 hover:bg-[#0E4A68] text-[#0E4A68] hover:text-white text-xs sm:text-sm font-bold transition-all inline-flex items-center gap-1.5 border border-[#0E4A68]/20"
                >
                  <span>🌊</span>
                  <span>Mendihuaca</span>
                  <span className="text-xs opacity-75">↗</span>
                </Link>
                <Link
                  href="/tayrona"
                  className="min-h-11 px-4 py-2 rounded-xl bg-[#144D34]/10 hover:bg-[#144D34] text-[#144D34] hover:text-white text-xs sm:text-sm font-bold transition-all inline-flex items-center gap-1.5 border border-[#144D34]/20"
                >
                  <span>🌴</span>
                  <span>Parque Tayrona</span>
                  <span className="text-xs opacity-75">↗</span>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ─────────────────────────────────────────────────────────────
            2. EL EFECTO RED TERRITORIAL (Circulación Montaña ⇄ Costa)
        ───────────────────────────────────────────────────────────── */}
        <section
          id="efecto-red"
          className="py-14 sm:py-20 bg-white border-b border-stone-light/70"
        >
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
            <div className="text-center max-w-3xl mx-auto space-y-3">
              <span className="text-xs font-bold uppercase tracking-widest text-[#144D34] bg-[#144D34]/10 px-3 py-1 rounded-full">
                {copy.network.eyebrow}
              </span>
              <h2 className="font-serif text-2xl sm:text-4xl font-bold text-[#1B382B]">
                {copy.network.title}
              </h2>
              <p className="text-sm sm:text-base text-stone-700 leading-relaxed">
                {copy.network.subtitle}
              </p>
            </div>

            {/* Ilustración Conceptual de Flujo Territorial: Minca ⇄ Mendihuaca ⇄ Tayrona */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6 items-stretch relative">
              {/* Nodo 1: Minca (#1B382B Verde Bosque) */}
              <article className="rounded-3xl p-6 sm:p-7 bg-[#E8EFEA]/70 border-2 border-[#1B382B]/20 flex flex-col justify-between space-y-5 shadow-xs">
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-[#1B382B] text-white text-2xl shadow-xs">
                      🌿
                    </span>
                    <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-[#1B382B]/12 text-[#1B382B]">
                      650 m s. n. m. • Sierra
                    </span>
                  </div>
                  <h3 className="font-serif text-xl sm:text-2xl font-bold text-[#1B382B]">
                    {copy.network.nodes.minca.name}
                  </h3>
                  <p className="text-xs font-semibold text-[#1B382B]/80">
                    {copy.network.nodes.minca.tag}
                  </p>
                  <p className="text-sm text-stone-700 leading-relaxed">
                    {copy.network.nodes.minca.desc}
                  </p>
                </div>

                <div className="pt-2 border-t border-[#1B382B]/15 flex items-center justify-between">
                  <Link
                    href="/minca"
                    className="min-h-11 inline-flex items-center text-xs sm:text-sm font-bold text-[#1B382B] hover:underline"
                  >
                    {copy.network.nodes.minca.cta}
                  </Link>
                  <span className="text-lg font-bold text-[#1B382B]" aria-hidden="true">
                    ⇄
                  </span>
                </div>
              </article>

              {/* Nodo 2: Mendihuaca (#0E4A68 Azul Caribe) */}
              <article className="rounded-3xl p-6 sm:p-7 bg-[#E1F0F7]/70 border-2 border-[#0E4A68]/25 flex flex-col justify-between space-y-5 shadow-xs">
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-[#0E4A68] text-white text-2xl shadow-xs">
                      🌊
                    </span>
                    <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-[#0E4A68]/12 text-[#0E4A68]">
                      Nivel del Mar • Caribe
                    </span>
                  </div>
                  <h3 className="font-serif text-xl sm:text-2xl font-bold text-[#0E4A68]">
                    {copy.network.nodes.mendihuaca.name}
                  </h3>
                  <p className="text-xs font-semibold text-[#0E4A68]/80">
                    {copy.network.nodes.mendihuaca.tag}
                  </p>
                  <p className="text-sm text-stone-700 leading-relaxed">
                    {copy.network.nodes.mendihuaca.desc}
                  </p>
                </div>

                <div className="pt-2 border-t border-[#0E4A68]/15 flex items-center justify-between">
                  <Link
                    href="/mendihuaca"
                    className="min-h-11 inline-flex items-center text-xs sm:text-sm font-bold text-[#0E4A68] hover:underline"
                  >
                    {copy.network.nodes.mendihuaca.cta}
                  </Link>
                  <span className="text-lg font-bold text-[#0E4A68]" aria-hidden="true">
                    ⇄
                  </span>
                </div>
              </article>

              {/* Nodo 3: Parque Tayrona (#144D34 Verde Jungla) */}
              <article className="rounded-3xl p-6 sm:p-7 bg-[#EAF2EC]/80 border-2 border-[#144D34]/25 flex flex-col justify-between space-y-5 shadow-xs">
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-[#144D34] text-white text-2xl shadow-xs">
                      🌴
                    </span>
                    <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-[#144D34]/12 text-[#144D34]">
                      Selva & Bahías • Tayrona
                    </span>
                  </div>
                  <h3 className="font-serif text-xl sm:text-2xl font-bold text-[#144D34]">
                    {copy.network.nodes.tayrona.name}
                  </h3>
                  <p className="text-xs font-semibold text-[#144D34]/80">
                    {copy.network.nodes.tayrona.tag}
                  </p>
                  <p className="text-sm text-stone-700 leading-relaxed">
                    {copy.network.nodes.tayrona.desc}
                  </p>
                </div>

                <div className="pt-2 border-t border-[#144D34]/15 flex items-center justify-between">
                  <Link
                    href="/tayrona"
                    className="min-h-11 inline-flex items-center text-xs sm:text-sm font-bold text-[#144D34] hover:underline"
                  >
                    {copy.network.nodes.tayrona.cta}
                  </Link>
                  <span className="text-lg font-bold text-[#144D34]" aria-hidden="true">
                    ⇄
                  </span>
                </div>
              </article>
            </div>

            {/* Nota de retroalimentación circular */}
            <div className="rounded-2xl bg-[#1B382B] text-[#FBF9F5] p-5 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
              <p className="text-xs sm:text-sm leading-relaxed text-[#FBF9F5]/95 font-medium">
                {copy.network.flowNote}
              </p>
              <span className="shrink-0 text-xs font-bold uppercase tracking-wider px-3.5 py-1.5 rounded-full bg-amber-400 text-[#1B382B]">
                Minca ⇄ Mendihuaca ⇄ Tayrona
              </span>
            </div>
          </div>
        </section>

        {/* ─────────────────────────────────────────────────────────────
            3. COMPARATIVA DE VALOR (OTAs vs. PaDónde)
        ───────────────────────────────────────────────────────────── */}
        <section
          id="comparativa"
          className="py-14 sm:py-20 bg-[#FBF9F5] border-b border-stone-light/70"
        >
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
            <div className="text-center max-w-3xl mx-auto space-y-3">
              <span className="text-xs font-bold uppercase tracking-widest text-amber-800 bg-amber-500/15 px-3 py-1 rounded-full">
                {copy.comparison.eyebrow}
              </span>
              <h2 className="font-serif text-2xl sm:text-4xl font-bold text-[#1B382B]">
                {copy.comparison.title}
              </h2>
              <p className="text-sm sm:text-base text-stone-700 leading-relaxed">
                {copy.comparison.subtitle}
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 items-stretch">
              {/* Columna 1: Plataformas Tradicionales (OTAs) */}
              <div className="rounded-3xl p-6 sm:p-8 bg-white border border-stone-300/90 space-y-6 flex flex-col justify-between">
                <div className="space-y-3 border-b border-stone-200 pb-4">
                  <span className="inline-block text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-red-100 text-red-800">
                    {copy.comparison.ota.badge}
                  </span>
                  <h3 className="font-serif text-xl sm:text-2xl font-bold text-stone-800">
                    {copy.comparison.ota.title}
                  </h3>
                </div>

                <ul className="space-y-4 flex-1">
                  {copy.comparison.ota.items.map((item) => (
                    <li key={item.title} className="flex items-start gap-3">
                      <span
                        className="mt-0.5 w-6 h-6 rounded-full bg-red-100 text-red-700 flex items-center justify-center text-xs font-bold shrink-0"
                        aria-hidden="true"
                      >
                        ✕
                      </span>
                      <div>
                        <p className="font-sans text-sm sm:text-base font-bold text-stone-800">
                          {item.title}
                        </p>
                        <p className="text-xs sm:text-sm text-stone-600 mt-0.5 leading-relaxed">
                          {item.desc}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Columna 2: PaDónde (Destacada en Verde Bosque #1B382B y Dorado) */}
              <div className="rounded-3xl p-6 sm:p-8 bg-[#1B382B] text-[#FBF9F5] border-2 border-amber-400/70 shadow-xl space-y-6 flex flex-col justify-between relative overflow-hidden">
                <div className="space-y-3 border-b border-white/15 pb-4">
                  <span className="inline-block text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-amber-400 text-[#1B382B]">
                    {copy.comparison.padonde.badge}
                  </span>
                  <h3 className="font-serif text-xl sm:text-2xl font-bold text-white">
                    {copy.comparison.padonde.title}
                  </h3>
                </div>

                <ul className="space-y-4 flex-1">
                  {copy.comparison.padonde.items.map((item) => (
                    <li key={item.title} className="flex items-start gap-3">
                      <span
                        className="mt-0.5 w-6 h-6 rounded-full bg-emerald-400/20 border border-emerald-300/50 text-emerald-300 flex items-center justify-center text-xs font-bold shrink-0"
                        aria-hidden="true"
                      >
                        ✓
                      </span>
                      <div>
                        <p className="font-sans text-sm sm:text-base font-bold text-white">
                          {item.title}
                        </p>
                        <p className="text-xs sm:text-sm text-[#FBF9F5]/85 mt-0.5 leading-relaxed">
                          {item.desc}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* ─────────────────────────────────────────────────────────────
            4. PILARES DE RESPALDO & PRESENCIA REAL
        ───────────────────────────────────────────────────────────── */}
        <section
          id="pilares"
          className="py-14 sm:py-20 bg-white border-b border-stone-light/70"
        >
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
            <div className="text-center max-w-3xl mx-auto space-y-3">
              <span className="text-xs font-bold uppercase tracking-widest text-[#0E4A68] bg-[#0E4A68]/10 px-3 py-1 rounded-full">
                {copy.pillars.eyebrow}
              </span>
              <h2 className="font-serif text-2xl sm:text-4xl font-bold text-[#1B382B]">
                {copy.pillars.title}
              </h2>
              <p className="text-sm sm:text-base text-stone-700 leading-relaxed">
                {copy.pillars.subtitle}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {copy.pillars.items.map((pillar, idx) => (
                <article
                  key={pillar.title}
                  className="rounded-3xl p-6 sm:p-7 bg-[#FBF9F5] border border-stone-light hover:border-[#1B382B]/40 transition-colors space-y-4 flex flex-col justify-between"
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="w-12 h-12 rounded-2xl bg-[#1B382B] text-amber-300 flex items-center justify-center shadow-xs">
                        {idx === 0 ? (
                          /* Icono Smartphone / Offline PWA */
                          <svg
                            className="w-6 h-6"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            aria-hidden="true"
                          >
                            <rect width="14" height="20" x="5" y="2" rx="2" ry="2" />
                            <path d="M12 18h.01" />
                          </svg>
                        ) : idx === 1 ? (
                          /* Icono QR Code en Territorio */
                          <svg
                            className="w-6 h-6"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            aria-hidden="true"
                          >
                            <rect width="5" height="5" x="3" y="3" rx="1" />
                            <rect width="5" height="5" x="16" y="3" rx="1" />
                            <rect width="5" height="5" x="3" y="16" rx="1" />
                            <path d="M21 16h-3a2 2 0 0 0-2 2v3" />
                            <path d="M21 21v.01" />
                            <path d="M12 7v3a2 2 0 0 1-2 2H7" />
                            <path d="M3 12h.01" />
                            <path d="M12 3h.01" />
                            <path d="M12 16v.01" />
                            <path d="M16 12h1" />
                            <path d="M21 12v.01" />
                            <path d="M12 21v-1" />
                          </svg>
                        ) : (
                          /* Icono MapPin + Star Google Maps */
                          <svg
                            className="w-6 h-6"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            aria-hidden="true"
                          >
                            <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                            <circle cx="12" cy="10" r="3" />
                          </svg>
                        )}
                      </div>
                      <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-[#1B382B]/10 text-[#1B382B]">
                        {pillar.badge}
                      </span>
                    </div>

                    <h3 className="font-serif text-xl font-bold text-[#1B382B]">
                      {pillar.title}
                    </h3>
                    <p className="text-sm text-stone-700 leading-relaxed">
                      {pillar.desc}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ─────────────────────────────────────────────────────────────
            5. PLANES TRANSPARENTES Y CORTESÍA DE ENTRADA (15 DÍAS)
        ───────────────────────────────────────────────────────────── */}
        <section
          id="planes"
          className="py-14 sm:py-20 bg-[#FBF9F5] border-b border-stone-light/70"
        >
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
            <div className="text-center max-w-3xl mx-auto space-y-3">
              <span className="text-xs font-bold uppercase tracking-widest text-[#1B382B] bg-[#1B382B]/10 px-3 py-1 rounded-full">
                {copy.plans.eyebrow}
              </span>
              <h2 className="font-serif text-2xl sm:text-4xl font-bold text-[#1B382B]">
                {copy.plans.title}
              </h2>
              <p className="text-sm sm:text-base text-stone-700 leading-relaxed">
                {copy.plans.subtitle}
              </p>
            </div>

            {/* Banner Destacado: 15 Días de Cortesía Sin Costo */}
            <div className="rounded-3xl p-6 sm:p-8 lg:p-10 bg-gradient-to-br from-[#1B382B] via-[#144D34] to-[#0E4A68] text-[#FBF9F5] shadow-lg border-2 border-amber-400/60 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
              <div className="space-y-3 max-w-2xl">
                <span className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider px-3.5 py-1 rounded-full bg-amber-400 text-[#1B382B]">
                  {copy.plans.courtesyBanner.badge}
                </span>
                <h3 className="font-serif text-2xl sm:text-3xl font-bold text-white">
                  {copy.plans.courtesyBanner.title}
                </h3>
                <p className="text-sm sm:text-base text-[#FBF9F5]/90 leading-relaxed">
                  {copy.plans.courtesyBanner.desc}
                </p>
              </div>

              <div className="w-full lg:w-auto shrink-0">
                <AliadosWhatsAppCta
                  href={heroWaUrl}
                  section="courtesy_banner"
                  className="w-full lg:w-auto min-h-12 px-6 py-3.5 rounded-2xl bg-amber-400 hover:bg-amber-300 text-[#1B382B] font-sans text-sm sm:text-base font-extrabold shadow-md transition-all inline-flex items-center justify-center gap-2"
                >
                  <span>{copy.plans.courtesyBanner.cta}</span>
                </AliadosWhatsAppCta>
              </div>
            </div>

            {/* Subtítulo de Modalidades Trimestrales */}
            <div className="text-center">
              <span className="inline-block text-xs font-bold uppercase tracking-wider px-4 py-1.5 rounded-full bg-white border border-stone-light text-[#1B382B] shadow-2xs">
                {copy.plans.cycleBadge}
              </span>
            </div>

            {/* Tarjetas de las 3 Modalidades Trimestrales */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
              {copy.plans.modalities.map((mod) => {
                const modWaUrl = whatsappLink(WHATSAPP_CONTACTO, mod.waMessage);
                return (
                  <article
                    key={mod.id}
                    className="rounded-3xl p-6 sm:p-7 bg-white border border-stone-light hover:border-[#1B382B]/50 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-6"
                  >
                    <div className="space-y-4">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-3xl" aria-hidden="true">
                          {mod.emoji}
                        </span>
                        <span className="text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-[#E8EFEA] text-[#1B382B]">
                          {mod.badge}
                        </span>
                      </div>

                      <div>
                        <h3 className="font-serif text-xl sm:text-2xl font-bold text-[#1B382B]">
                          {mod.title}
                        </h3>
                        <p className="text-xs sm:text-sm text-stone-600 mt-1">
                          {mod.subtitle}
                        </p>
                      </div>

                      <ul className="space-y-2.5 pt-2 border-t border-stone-light/70">
                        {mod.features.map((feat) => (
                          <li
                            key={feat}
                            className="flex items-start gap-2.5 text-xs sm:text-sm text-stone-700 leading-relaxed"
                          >
                            <span
                              className="text-emerald-700 font-bold mt-0.5 shrink-0"
                              aria-hidden="true"
                            >
                              ✓
                            </span>
                            <span>{feat}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <AliadosWhatsAppCta
                      href={modWaUrl}
                      section="plans_card"
                      modality={mod.id}
                      className="w-full min-h-11 px-4 py-3 rounded-xl bg-[#1B382B] hover:bg-[#144D34] text-[#FBF9F5] text-xs sm:text-sm font-bold transition-colors flex items-center justify-center gap-2 shadow-xs"
                    >
                      <span>💬</span>
                      <span>{mod.cta}</span>
                    </AliadosWhatsAppCta>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        {/* ─────────────────────────────────────────────────────────────
            6. PREGUNTAS FRECUENTES (FAQ Accordion con <details> nativo)
        ───────────────────────────────────────────────────────────── */}
        <section
          id="faq"
          aria-labelledby="faq-heading"
          className="py-14 sm:py-20 bg-white border-b border-stone-light/70"
        >
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
            <div className="text-center space-y-3">
              <span className="text-xs font-bold uppercase tracking-widest text-[#1B382B] bg-[#1B382B]/10 px-3 py-1 rounded-full">
                {copy.faq.eyebrow}
              </span>
              <h2
                id="faq-heading"
                className="font-serif text-2xl sm:text-4xl font-bold text-[#1B382B]"
              >
                {copy.faq.title}
              </h2>
              <p className="text-sm sm:text-base text-stone-700">
                {copy.faq.subtitle}
              </p>
            </div>

            <div className="space-y-3.5">
              {copy.faq.items.map((item, index) => (
                <details
                  key={item.q}
                  open={index === 0}
                  className="group rounded-2xl bg-[#FBF9F5] border border-stone-light open:border-[#1B382B]/40 open:bg-white transition-colors shadow-2xs"
                >
                  <summary className="list-none [&::-webkit-details-marker]:hidden cursor-pointer min-h-12 p-4 sm:p-5 flex items-center gap-3 font-sans text-sm sm:text-base font-bold text-[#1B382B] select-none">
                    <span
                      aria-hidden="true"
                      className="w-6 h-6 rounded-full bg-[#1B382B]/10 text-[#1B382B] flex items-center justify-center text-xs transition-transform duration-200 -rotate-90 group-open:rotate-0 shrink-0"
                    >
                      ▼
                    </span>
                    <span>{item.q}</span>
                  </summary>
                  <div className="px-4 sm:px-5 pb-5 pt-1 pl-13 text-xs sm:text-sm text-stone-700 leading-relaxed border-t border-stone-light/50">
                    {item.a}
                  </div>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* ─────────────────────────────────────────────────────────────
            7. CIERRE & LLAMADO A LA ACCIÓN FINAL
        ───────────────────────────────────────────────────────────── */}
        <section className="py-14 sm:py-20 bg-[#1B382B] text-[#FBF9F5]">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
            <h2 className="font-serif text-2xl sm:text-4xl font-bold text-white leading-tight">
              {copy.finalCta.title}
            </h2>
            <p className="text-sm sm:text-base text-[#FBF9F5]/85 max-w-2xl mx-auto leading-relaxed">
              {copy.finalCta.subtitle}
            </p>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3.5 pt-2 max-w-md sm:max-w-none mx-auto">
              <AliadosWhatsAppCta
                href={heroWaUrl}
                section="footer_cta"
                className="min-h-12 px-7 py-3.5 rounded-2xl bg-amber-400 hover:bg-amber-300 text-[#1B382B] font-sans text-sm sm:text-base font-extrabold shadow-md transition-all flex items-center justify-center gap-2"
              >
                <span>💬</span>
                <span>{copy.finalCta.primaryCta}</span>
              </AliadosWhatsAppCta>
              <Link
                href="/minca"
                className="min-h-12 px-6 py-3.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white border border-white/25 font-sans text-sm sm:text-base font-semibold transition-all flex items-center justify-center gap-2"
              >
                <span>🌿</span>
                <span>{copy.finalCta.secondaryCta}</span>
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Pie de Página Institucional */}
      <footer className="bg-[#122112] text-[#FBF9F5]/80 py-8 px-4 border-t border-white/10">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-serif text-lg font-bold text-white">PaDónde</span>
            <span>•</span>
            <span>Minca ⇄ Mendihuaca ⇄ Tayrona</span>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link href="/minca" className="hover:text-white transition-colors">
              🌿 Minca
            </Link>
            <Link href="/mendihuaca" className="hover:text-white transition-colors">
              🌊 Mendihuaca
            </Link>
            <Link href="/tayrona" className="hover:text-white transition-colors">
              🌴 Tayrona
            </Link>
            <a
              href={heroWaUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-amber-300 hover:text-amber-200 font-semibold transition-colors"
            >
              WhatsApp Oficial ↗
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

