import { setRequestLocale } from "next-intl/server";
import { LuxuryRestaurantMenu } from "@/components/menu/LuxuryRestaurantMenu";
import { LAZY_CAT_MENU } from "@/data/menus/lazyCatMenu";
import { SILOCIBE_MENU } from "@/data/menus/silocibeMenu";
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

export const revalidate = 600;

export function generateStaticParams() {
  return [{ zona: "minca" }, { zona: "mendihuaca" }];
}

export async function generateMetadata({
  params,
  searchParams,
}: MenuDemoPageProps): Promise<Metadata> {
  const { locale } = await params;
  const search = searchParams ? await searchParams : {};

  let nombre = "Lazy Cat Minca";
  let subtitulo = "Hamburguesas de autor, cortes premium y coctelería.";

  if (search.eventoId) {
    if (search.eventoId === "08e4bfe7-8b1c-45a0-9efb-9cb0932b8d09") {
      nombre = "Silocibe Gastro Bar y Mirador";
      subtitulo = "Mirador Panorámico, Sushi Bar, Hamburguesas de Autor y Coctelería en Minca.";
    } else {
      const evento = await getEventoById(search.eventoId);
      if (evento) {
        nombre =
          (evento.metadata_hospedaje?.menu_data as any)?.negocioNombre ||
          evento.negocio?.nombre ||
          evento.titulo;
      }
    }
  }

  const titles: Record<string, string> = {
    es: `Carta Digital Gastronómica · ${nombre} | PaDónde`,
    en: `Digital Gastronomic Menu · ${nombre} | PaDónde`,
    fr: `Menu Gastronomique Digital · ${nombre} | PaDónde`,
    de: `Digitale Speisekarte · ${nombre} | PaDónde`,
  };

  return {
    title: titles[locale] || titles.es,
    description: `Descubre la carta gastronómica de ${nombre} en Minca. ${subtitulo}`,
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
    const isSilocibe =
      search.eventoId === "08e4bfe7-8b1c-45a0-9efb-9cb0932b8d09";
    const evento = await getEventoById(search.eventoId);

    if (evento?.metadata_hospedaje?.menu_data) {
      menuData = {
        ...(evento.metadata_hospedaje.menu_data as any),
        negocioNombre:
          (evento.metadata_hospedaje.menu_data as any)?.negocioNombre ||
          evento.negocio?.nombre ||
          evento.titulo,
        whatsapp:
          (evento.metadata_hospedaje.menu_data as any)?.whatsapp ||
          evento.negocio?.whatsapp ||
          "573218507204",
        googleMapsUrl:
          (evento.metadata_hospedaje.menu_data as any)?.googleMapsUrl ||
          evento.metadata_hospedaje?.google_review_url ||
          (evento.metadata_hospedaje?.google_reputacion as any)?.maps_url ||
          "https://search.google.com/local/writereview?placeid=ChIJKy680-Lx9I4Rk89-h79nh9s",
        pdfOriginalUrl:
          (evento.metadata_hospedaje.menu_data as any)?.pdfOriginalUrl ||
          evento.metadata_hospedaje?.menu_url ||
          "https://drive.google.com/file/d/1UKgR8T8baw9qIljkCR47CCxwSDvklsV7/view?usp=sharing",
      };
    } else if (isSilocibe) {
      menuData = SILOCIBE_MENU;
    } else if (evento) {
      // Si el restaurante existe pero aún está pendiente de guardar su JSON personalizado
      const nombreNegocio = evento.negocio?.nombre || evento.titulo || "Restaurante";
      menuData = {
        ...LAZY_CAT_MENU,
        id: "menu-" + nombreNegocio.toLowerCase().replace(/\s+/g, "-"),
        negocioNombre: nombreNegocio,
        subtitulo: {
          es: `Carta Digital · ${nombreNegocio}`,
          en: `Digital Menu · ${nombreNegocio}`,
          fr: `Menu Digital · ${nombreNegocio}`,
          de: `Digitale Speisekarte · ${nombreNegocio}`,
        },
      };
    }
    const metaTema = isSilocibe ? "fogon" : evento?.metadata_hospedaje?.menu_tema;
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
