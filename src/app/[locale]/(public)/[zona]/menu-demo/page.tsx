import { setRequestLocale } from "next-intl/server";
import { LuxuryRestaurantMenu } from "@/components/menu/LuxuryRestaurantMenu";
import { LAZY_CAT_MENU } from "@/data/menus/lazyCatMenu";
import { TEMAS_MENU, type TemaMenuId } from "@/components/menu/menuThemes";
import { getEventoById } from "@/lib/supabase/queries";
import type { Metadata } from "next";

interface MenuDemoPageProps {
  params: Promise<{ locale: string; zona: string }>;
  searchParams?: Promise<{
    tema?: string;
    selector?: string;
    embebido?: string;
    eventoId?: string;
  }>;
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

  // 1. Obtener la carta y el tema configurado por el admin en la base de datos
  let temaAsignado: TemaMenuId | undefined = undefined;
  let menuData = LAZY_CAT_MENU;

  // A) Si viene un eventoId específico en el enlace
  if (search.eventoId) {
    const evento = await getEventoById(search.eventoId);
    if (evento?.metadata_hospedaje?.menu_data) {
      menuData = evento.metadata_hospedaje.menu_data as any;
    }
    const metaTema = evento?.metadata_hospedaje?.menu_tema;
    if (metaTema && metaTema in TEMAS_MENU) {
      temaAsignado = metaTema as TemaMenuId;
    }
  }

  // B) Si el admin pasó ?tema= en la URL
  if (!temaAsignado && search.tema && search.tema in TEMAS_MENU) {
    temaAsignado = search.tema as TemaMenuId;
  }

  // C) Consultar el evento oficial de Lazy Cat Minca en la base de datos
  if (!temaAsignado) {
    const eventoLazy = await getEventoById("a9cb4306-82f5-4784-b6d3-546b6d10f5ec");
    if (eventoLazy?.metadata_hospedaje?.menu_data) {
      menuData = eventoLazy.metadata_hospedaje.menu_data as any;
    }
    const metaTemaLazy = eventoLazy?.metadata_hospedaje?.menu_tema;
    if (metaTemaLazy && metaTemaLazy in TEMAS_MENU) {
      temaAsignado = metaTemaLazy as TemaMenuId;
    }
  }

  // D) Fallback por defecto si aún no tuviera tema guardado
  const temaFinal: TemaMenuId = temaAsignado || "fogon";

  const esEmbebido = search.embebido === "true" || search.embebido === "1";

  // El selector de temas flotante NUNCA se muestra al comensal o cliente público.
  // Solo se activa si el administrador lo solicita expresamente con ?selector=true para pruebas.
  const mostrarSelector = search.selector === "true";

  return (
    <div className="w-full min-h-screen">
      <LuxuryRestaurantMenu
        key={temaFinal}
        initialLocale={locale}
        menu={menuData}
        tema={temaFinal}
        mostrarSelectorTema={!esEmbebido && mostrarSelector}
        embebido={esEmbebido}
      />
    </div>
  );
}
