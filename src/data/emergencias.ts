export type LocaleEmergencias = "es" | "en" | "fr" | "de";

export type TextoI18n = Record<LocaleEmergencias, string>;

export interface ContactoEmergencia {
  id: string;
  icono: string;
  telefono: string;
  telefonoDisplay: string;
  nombre: TextoI18n;
  detalle: TextoI18n;
}

export interface EmbajadaInfo {
  id: string;
  bandera: string;
  pais: TextoI18n;
  telefono: string;
  telefonoDisplay: string;
  telefonoEmergencia?: string;
  telefonoEmergenciaDisplay?: string;
  portalUrl: string;
  ciudad: string;
}

export const EMERGENCIAS_LOCALES: ContactoEmergencia[] = [
  {
    id: "linea-123",
    icono: "🚨",
    telefono: "123",
    telefonoDisplay: "123",
    nombre: {
      es: "Línea Única de Emergencias",
      en: "Single Emergency Line",
      fr: "Numéro d'Urgence Unique",
      de: "Einheitlicher Notruf",
    },
    detalle: {
      es: "Policía, ambulancia y bomberos (24/7)",
      en: "Police, ambulance & fire department (24/7)",
      fr: "Police, ambulance et pompiers (24/7)",
      de: "Polizei, Krankenwagen & Feuerwehr (24/7)",
    },
  },
  {
    id: "policia-turismo",
    icono: "👮",
    telefono: "+573505560986",
    telefonoDisplay: "+57 350 556 0986",
    nombre: {
      es: "Policía de Turismo Santa Marta",
      en: "Santa Marta Tourist Police",
      fr: "Police Touristique de Santa Marta",
      de: "Touristenpolizei Santa Marta",
    },
    detalle: {
      es: "Atención directa a viajeros en la región",
      en: "Direct assistance for travelers in the region",
      fr: "Assistance directe aux voyageurs dans la région",
      de: "Direkte Hilfe für Reisende in der Region",
    },
  },
  {
    id: "defensa-civil",
    icono: "⛰️",
    telefono: "144",
    telefonoDisplay: "144",
    nombre: {
      es: "Defensa Civil",
      en: "Civil Defense",
      fr: "Défense Civile",
      de: "Zivilschutz",
    },
    detalle: {
      es: "Rescate y emergencias en montaña / ríos",
      en: "Mountain & river rescue emergencies",
      fr: "Secours et urgences en montagne / rivière",
      de: "Berg- & Flussrettungsnotfälle",
    },
  },
  {
    id: "cruz-roja",
    icono: "🏥",
    telefono: "132",
    telefonoDisplay: "132",
    nombre: {
      es: "Cruz Roja Colombiana",
      en: "Colombian Red Cross",
      fr: "Croix-Rouge Colombienne",
      de: "Kolumbianisches Rotes Kreuz",
    },
    detalle: {
      es: "Atención prehospitalaria y ambulancias",
      en: "Pre-hospital care & ambulances",
      fr: "Soins préhospitaliers et ambulances",
      de: "Präklinische Versorgung & Krankenwagen",
    },
  },
  {
    id: "guardacostas",
    icono: "⚓",
    telefono: "146",
    telefonoDisplay: "146",
    nombre: {
      es: "Guardacostas / Emergencias Marítimas",
      en: "Coast Guard / Maritime Emergencies",
      fr: "Garde-Côtes / Urgences Maritimes",
      de: "Küstenwache / Seenotruf",
    },
    detalle: {
      es: "Emergencias en mar y playas (Tayrona / Mendihuaca)",
      en: "Sea & beach emergencies (Tayrona / Mendihuaca)",
      fr: "Urgences en mer et sur les plages (Tayrona / Mendihuaca)",
      de: "See- & Strandnotfälle (Tayrona / Mendihuaca)",
    },
  },
];

export const EMBAJADAS_COLOMBIA: EmbajadaInfo[] = [
  {
    id: "alemania",
    bandera: "🇩🇪",
    pais: { es: "Alemania", en: "Germany", fr: "Allemagne", de: "Deutschland" },
    telefono: "+576014232600",
    telefonoDisplay: "+57 601 423 2600",
    portalUrl: "https://bogota.diplo.de",
    ciudad: "Bogotá",
  },
  {
    id: "canada",
    bandera: "🇨🇦",
    pais: { es: "Canadá", en: "Canada", fr: "Canada", de: "Kanada" },
    telefono: "+576016579800",
    telefonoDisplay: "+57 601 657 9800",
    portalUrl: "https://www.international.gc.ca/country-pays/colombia-colombie",
    ciudad: "Bogotá",
  },
  {
    id: "estados-unidos",
    bandera: "🇺🇸",
    pais: { es: "Estados Unidos", en: "United States", fr: "États-Unis", de: "USA / Vereinigte Staaten" },
    telefono: "+576012752000",
    telefonoDisplay: "+57 601 275 2000",
    portalUrl: "https://co.usembassy.gov",
    ciudad: "Bogotá",
  },
  {
    id: "francia",
    bandera: "🇫🇷",
    pais: { es: "Francia", en: "France", fr: "France", de: "Frankreich" },
    telefono: "+576016381400",
    telefonoDisplay: "+57 601 638 1400",
    telefonoEmergencia: "+576016381564",
    telefonoEmergenciaDisplay: "+57 601 638 1564",
    portalUrl: "https://co.ambafrance.org",
    ciudad: "Bogotá",
  },
  {
    id: "espana",
    bandera: "🇪🇸",
    pais: { es: "España", en: "Spain", fr: "Espagne", de: "Spanien" },
    telefono: "+576016220090",
    telefonoDisplay: "+57 601 622 0090",
    telefonoEmergencia: "+573164733216",
    telefonoEmergenciaDisplay: "+57 316 473 3216",
    portalUrl: "https://www.exteriores.gob.es/embajadas/bogota",
    ciudad: "Bogotá",
  },
  {
    id: "suiza",
    bandera: "🇨🇭",
    pais: { es: "Suiza", en: "Switzerland", fr: "Suisse", de: "Schweiz" },
    telefono: "+576014898780",
    telefonoDisplay: "+57 601 489 8780",
    portalUrl: "https://www.eda.admin.ch/bogota",
    ciudad: "Bogotá",
  },
  {
    id: "paises-bajos",
    bandera: "🇳🇱",
    pais: { es: "Países Bajos", en: "Netherlands", fr: "Pays-Bas", de: "Niederlande" },
    telefono: "+576016384200",
    telefonoDisplay: "+57 601 638 4200",
    portalUrl: "https://www.netherlandsworldwide.nl",
    ciudad: "Bogotá",
  },
  {
    id: "reino-unido",
    bandera: "🇬🇧",
    pais: { es: "Reino Unido", en: "United Kingdom", fr: "Royaume-Uni", de: "Vereinigtes Königreich" },
    telefono: "+576013268300",
    telefonoDisplay: "+57 601 326 8300",
    portalUrl: "https://www.gov.uk/world/colombia",
    ciudad: "Bogotá",
  },
];

export const EMERGENCIAS_TEXTOS: Record<
  LocaleEmergencias,
  {
    cardTitle: string;
    cardSubtitle: string;
    cardCta: string;
    footerLink: string;
    modalTitle: string;
    modalSubtitle: string;
    searchPlaceholder: string;
    secLocales: string;
    secEmbajadas: string;
    llamar: string;
    emergenciaConsular: string;
    portalOficial: string;
    sinResultados: string;
    cerrar: string;
  }
> = {
  es: {
    cardTitle: "Emergencias y Embajadas / Consulados",
    cardSubtitle: "Policía, rescate, guardacostas y líneas consulares en Colombia (llamada directa).",
    cardCta: "Ver líneas de ayuda →",
    footerLink: "Emergencias y Consulados",
    modalTitle: "Emergencias y Embajadas",
    modalSubtitle: "Líneas oficiales verificadas en Colombia. Toca para llamar directo.",
    searchPlaceholder: "Buscar país, servicio o número...",
    secLocales: "Emergencias Locales",
    secEmbajadas: "Embajadas y Consulados (Bogotá)",
    llamar: "Llamar",
    emergenciaConsular: "Emergencias",
    portalOficial: "Portal oficial",
    sinResultados: "No encontramos coincidencias para esa búsqueda.",
    cerrar: "Cerrar",
  },
  en: {
    cardTitle: "Emergencies & Embassies / Consulates",
    cardSubtitle: "Police, mountain rescue, coast guard & consulates in Colombia (direct call).",
    cardCta: "View helplines →",
    footerLink: "Emergencies & Consulates",
    modalTitle: "Emergencies & Embassies",
    modalSubtitle: "Verified official numbers in Colombia. Tap to call directly.",
    searchPlaceholder: "Search country, service or number...",
    secLocales: "Local Emergencies",
    secEmbajadas: "Embassies & Consulates (Bogotá)",
    llamar: "Call",
    emergenciaConsular: "Emergency",
    portalOficial: "Official site",
    sinResultados: "No matches found for your search.",
    cerrar: "Close",
  },
  fr: {
    cardTitle: "Urgences & Ambassades / Consulats",
    cardSubtitle: "Police, secours, garde-côtes et consulats en Colombie (appel direct).",
    cardCta: "Voir les numéros →",
    footerLink: "Urgences et Consulats",
    modalTitle: "Urgences & Ambassades",
    modalSubtitle: "Numéros officiels vérifiés en Colombie. Touchez pour appeler.",
    searchPlaceholder: "Rechercher pays, service ou numéro...",
    secLocales: "Urgences Locales",
    secEmbajadas: "Ambassades et Consulats (Bogotá)",
    llamar: "Appeler",
    emergenciaConsular: "Urgences",
    portalOficial: "Site officiel",
    sinResultados: "Aucun résultat pour cette recherche.",
    cerrar: "Fermer",
  },
  de: {
    cardTitle: "Notfälle & Botschaften / Konsulate",
    cardSubtitle: "Polizei, Bergrettung, Küstenwache & Konsulate in Kolumbien (Direktwahl).",
    cardCta: "Notrufnummern ansehen →",
    footerLink: "Notfälle & Konsulate",
    modalTitle: "Notfälle & Botschaften",
    modalSubtitle: "Verifizierte offizielle Nummern in Kolumbien. Zum Anrufen antippen.",
    searchPlaceholder: "Land, Dienst oder Nummer suchen...",
    secLocales: "Lokale Notrufe",
    secEmbajadas: "Botschaften & Konsulate (Bogotá)",
    llamar: "Anrufen",
    emergenciaConsular: "Notfall",
    portalOficial: "Offizielle Seite",
    sinResultados: "Keine Treffer für diese Suche.",
    cerrar: "Schließen",
  },
};

export function resolverLocaleEmergencias(locale: string): LocaleEmergencias {
  if (locale === "en" || locale === "fr" || locale === "de") return locale;
  return "es";
}
