import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { Link, routing } from "@/i18n/routing";
import { RegistroAliadoWizard } from "./RegistroAliadoWizard";

interface SumatePageProps {
  params: Promise<{ locale: string }>;
}

// 100% Estática (SSG + ISR). La única ejecución en servidor ocurre al enviar el formulario.
export const revalidate = 86400;

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: SumatePageProps): Promise<Metadata> {
  const { locale } = await params;
  const title = "Súmate a PaDónde — Registra tu negocio gratis";
  const description =
    "Hospedajes, restaurantes, tours y servicios de Minca, Mendihuaca, Tayrona y Taganga: carga tu ficha en 3 minutos y te publicamos en 4 idiomas.";
  return {
    metadataBase: new URL("https://padonde.lat"),
    title,
    description,
    alternates: { canonical: `https://padonde.lat/${locale}/sumate` },
    openGraph: {
      title,
      description,
      url: `https://padonde.lat/${locale}/sumate`,
      type: "website",
      images: [{ url: "https://padonde.lat/og-banner-padonde.jpg?v=2", width: 1200, height: 628 }],
    },
  };
}

export default async function SumatePage({ params }: SumatePageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="min-h-screen bg-[#FBF9F5] text-[#1B382B] font-sans">
      <header className="sticky top-0 z-30 bg-[#FBF9F5]/95 backdrop-blur-md border-b border-stone-light/70">
        <div className="max-w-xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/minca" className="font-serif text-xl font-bold tracking-tight">
            PaDónde
          </Link>
          <span className="text-[11px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full bg-[#1B382B]/10">
            🌿 Registro de aliados
          </span>
        </div>
      </header>

      <main className="max-w-xl mx-auto px-4 py-5 pb-24">
        <RegistroAliadoWizard />
      </main>
    </div>
  );
}
