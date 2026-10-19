import type { ServicioEsencial } from "@/lib/types";

export interface ServicioTraduccion {
  subtitulo: string;
  horario_apertura?: string;
  servicios_tags?: string[];
}

const TRADUCCIONES_SERVICIOS: Record<
  string,
  Partial<Record<"en" | "de" | "fr", ServicioTraduccion>>
> = {
  // Embassy Bank
  embassy: {
    en: {
      subtitulo: "The Bank of Minca • Cash Withdrawal & Currency Exchange",
      horario_apertura: "Monday to Sunday • 8:00 AM - 7:00 PM",
      servicios_tags: [
        "🏧 Cash Withdrawal",
        "💶 Exchange EUR & USD",
        "💳 Card POS Advance",
        "📲 Western Union & Transfers",
      ],
    },
    de: {
      subtitulo: "Die Bank von Minca • Bargeldabhebung & Geldwechsel",
      horario_apertura: "Montag bis Sonntag • 8:00 - 19:00 Uhr",
      servicios_tags: [
        "🏧 Bargeldabhebung",
        "💶 EUR & USD Wechsel",
        "💳 Kartenvorschuss",
        "📲 Western Union & Überweisungen",
      ],
    },
    fr: {
      subtitulo: "La Banque de Minca • Retrait d'Espèces & Change de Devises",
      horario_apertura: "Lundi au Dimanche • 8h00 - 19h00",
      servicios_tags: [
        "🏧 Retrait d'Espèces",
        "💶 Change EUR & USD",
        "💳 Avance par Carte",
        "📲 Western Union & Transferts",
      ],
    },
  },

  // Transporte Sierra Mar
  "sierra-mar": {
    en: {
      subtitulo:
        "Buses to Minca, Pozo Azul & La Tagua • Continuous departures with fixed rates",
      horario_apertura: "Every day • Departures from 7:00 AM to 6:00 PM",
      servicios_tags: [
        "🚐 Bus Santa Marta - Minca",
        "🌿 Routes to Pozo Azul",
        "⛰️ Trips to La Tagua",
        "💰 Official Fixed Rates",
      ],
    },
    de: {
      subtitulo:
        "Kleinbusse nach Minca, Pozo Azul & La Tagua • Regelmäßige Fahrten zu Festpreisen",
      horario_apertura: "Täglich • Abfahrten von 7:00 bis 18:00 Uhr",
      servicios_tags: [
        "🚐 Bus Santa Marta - Minca",
        "🌿 Routen nach Pozo Azul",
        "⛰️ Fahrten nach La Tagua",
        "💰 Offizielle Festpreise",
      ],
    },
    fr: {
      subtitulo:
        "Minibus pour Minca, Pozo Azul & La Tagua • Départs réguliers à tarifs fixes",
      horario_apertura: "Tous les jours • Départs de 7h00 à 18h00",
      servicios_tags: [
        "🚐 Bus Santa Marta - Minca",
        "🌿 Trajets vers Pozo Azul",
        "⛰️ Montée vers La Tagua",
        "💰 Tarifs Fixes Officiels",
      ],
    },
  },
};

function identificarClaveServicio(servicio: ServicioEsencial): string | null {
  const nom = (servicio.nombre_comercial || "").toLowerCase();
  const sub = (servicio.subtitulo || "").toLowerCase();

  if (nom.includes("embassy") || sub.includes("banco de minca")) {
    return "embassy";
  }
  if (nom.includes("sierra mar") || nom.includes("transporte sierra")) {
    return "sierra-mar";
  }

  return null;
}

/**
 * Retorna el servicio esencial adaptado al idioma activo (ES, EN, DE, FR).
 * Si el idioma es español o no hay traducción registrada, devuelve los datos originales sin alteración.
 */
export function getServicioEsencialTraducido(
  servicio: ServicioEsencial,
  locale: string
): ServicioEsencial {
  if (!locale || locale === "es") {
    return servicio;
  }

  const clave = identificarClaveServicio(servicio);
  if (!clave) {
    return servicio;
  }

  const trad = TRADUCCIONES_SERVICIOS[clave]?.[locale as "en" | "de" | "fr"];
  if (!trad) {
    return servicio;
  }

  return {
    ...servicio,
    subtitulo: trad.subtitulo || servicio.subtitulo,
    horario_apertura: trad.horario_apertura || servicio.horario_apertura,
    servicios_tags: trad.servicios_tags || servicio.servicios_tags,
  };
}
