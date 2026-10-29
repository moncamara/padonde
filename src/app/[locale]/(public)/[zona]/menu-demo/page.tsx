import { setRequestLocale } from "next-intl/server";
import { LuxuryRestaurantMenu } from "@/components/menu/LuxuryRestaurantMenu";
import { LAZY_CAT_MENU } from "@/data/menus/lazyCatMenu";
import { TEMAS_MENU, type TemaMenuId } from "@/components/menu/menuThemes";
import type { Metadata } from "next";

interface MenuDemoPageProps {
  params: Promise<{ locale: string; zona: string }>;
  searchParams?: Promise<{ tema?: string; selector?: string; embebido?: string }>;
}

export const revalidate = 60;

export async function generateMetadata({
  params,
}: MenuDemoPageProps): Promise<Metadata> {
  const { locale } = await params;

  const titles: Record<string, string> = {
    es: "Carta Digital Gastronómica · Lazy Cat Minca | PaDónde",
    en: "Digital Gastronomic Menu · Lazy Cat Minca | PaDónde",
    fr: "Menu Gastronomique Digital · Lazy Cat Minca | PaDónde",
    de: "Digitale Speisekarte · Lazy Cat Minca | PaDónde",
  };

  return {
    title: titles[locale] || titles.es,
    description:
      "Descubre la carta gastronómica de Lazy Cat Bar & Restaurante en Minca. Hamburguesas de autor, cortes premium y coctelería.",
  };
}

export default async function MenuDemoPage({
  params,
  searchParams,
}: MenuDemoPageProps) {
  const { locale } = await params;
  const search = searchParams ? await searchParams : {};
  setRequestLocale(locale);

  // Tema solicitado por query param (?tema=fogon | sierra | caribe | oro)
  const temaValido: TemaMenuId | undefined =
    search.tema && search.tema in TEMAS_MENU
      ? (search.tema as TemaMenuId)
      : undefined;

  const esEmbebido = search.embebido === "true" || search.embebido === "1";
  const mostrarSelector = search.selector !== "false";

  return (
    <div className="w-full min-h-screen">
      <LuxuryRestaurantMenu
        initialLocale={locale}
        menu={LAZY_CAT_MENU}
        tema={temaValido}
        mostrarSelectorTema={!esEmbebido && mostrarSelector}
        embebido={esEmbebido}
      />
    </div>
  );
}
