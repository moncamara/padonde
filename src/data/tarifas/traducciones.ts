export interface TextosTarifario {
  tituloBadge: string;
  subtitulo: string;
  capacidad: string;
  pasajeros: string;
  placeholderBuscar: string;
  tabTodas: string;
  tabSierra: string;
  tabLocales: string;
  tabExpresos: string;
  sinResultados: string;
  tarifaFijaBadge: string;
  tarifaPorVehiculo: string;
  botonPedir: string;
  noApareceDestino: string;
  botonCotizarCustom: string;
  disclaimerClima: string;
  mensajeWhatsApp: (nombre: string, destino: string, personas: number, precioStr: string) => string;
  mensajeWhatsAppCustom: (nombre: string, destino: string, personas: number) => string;
}

export const TEXTOS_TARIFARIO: Record<string, TextosTarifario> = {
  es: {
    tituloBadge: "Tarifario Oficial 4x4",
    subtitulo: "Camperos 4x4 encapsulados • Precios unificados",
    capacidad: "1 a 4 personas",
    pasajeros: "Pasajeros:",
    placeholderBuscar: "Buscar hostal, cascada, expreso o destino...",
    tabTodas: "Todas",
    tabSierra: "Sierra Alta & Montaña",
    tabLocales: "Locales Cercanos",
    tabExpresos: "Expresos / Ciudades",
    sinResultados: "No encontramos rutas con ese nombre.",
    tarifaFijaBadge: "Tarifa oficial",
    tarifaPorVehiculo: "Precio total por vehículo (no por persona)",
    botonPedir: "Pedir por WhatsApp",
    noApareceDestino: "¿Tu destino no aparece en la lista?",
    botonCotizarCustom: "Cotizar ruta personalizada por WhatsApp",
    disclaimerClima: "Tarifas sujetas a condiciones climáticas y de vía en la alta montaña. El campero es privado de punto a punto para tu grupo (1-4 personas).",
    mensajeWhatsApp: (nombre, destino, personas, precioStr) =>
      `Hola ${nombre}, vi sus tarifas oficiales en PaDónde y solicito transporte hacia ${destino} para ${personas} persona${personas === 1 ? "" : "s"}. (Tarifa oficial: $${precioStr} COP)`,
    mensajeWhatsAppCustom: (nombre, destino, personas) =>
      `Hola ${nombre}, vi sus tarifas en PaDónde y quisiera cotizar disponibilidad y transporte para ${personas} persona${personas === 1 ? "" : "s"} hacia: ${destino || "mi destino"}.`,
  },
  en: {
    tituloBadge: "Official 4x4 Rate Card",
    subtitulo: "Enclosed 4x4 vehicles • Unified fixed rates",
    capacidad: "1 to 4 passengers",
    pasajeros: "Passengers:",
    placeholderBuscar: "Search hostel, waterfall, express or destination...",
    tabTodas: "All Routes",
    tabSierra: "High Sierra & Mountain",
    tabLocales: "Nearby Local Spots",
    tabExpresos: "City Express & Airport",
    sinResultados: "No routes found matching your search.",
    tarifaFijaBadge: "Official rate",
    tarifaPorVehiculo: "Total price per vehicle (not per person)",
    botonPedir: "Book via WhatsApp",
    noApareceDestino: "Can't find your destination on the list?",
    botonCotizarCustom: "Request custom quote on WhatsApp",
    disclaimerClima: "Rates subject to weather and mountain road conditions. Service is private point-to-point for your group (1-4 people).",
    mensajeWhatsApp: (nombre, destino, personas, precioStr) =>
      `Hello ${nombre}, I saw your official rates on PaDónde and would like to request 4x4 transport to ${destino} for ${personas} passenger${personas === 1 ? "" : "s"}. (Official rate: $${precioStr} COP)`,
    mensajeWhatsAppCustom: (nombre, destino, personas) =>
      `Hello ${nombre}, I saw your rates on PaDónde and would like to request a quote and availability for ${personas} passenger${personas === 1 ? "" : "s"} to: ${destino || "my destination"}.`,
  },
  fr: {
    tituloBadge: "Grille Tarifaire Officielle 4x4",
    subtitulo: "Véhicules 4x4 fermés • Tarifs unifiés",
    capacidad: "1 à 4 passagers",
    pasajeros: "Passagers :",
    placeholderBuscar: "Rechercher auberge, cascade, express ou lieu...",
    tabTodas: "Toutes",
    tabSierra: "Haute Sierra & Montagne",
    tabLocales: "Lieux Proches",
    tabExpresos: "Express & Aéroports",
    sinResultados: "Aucun trajet trouvé avec ce nom.",
    tarifaFijaBadge: "Tarif officiel",
    tarifaPorVehiculo: "Prix total par véhicule (pas par personne)",
    botonPedir: "Réserver par WhatsApp",
    noApareceDestino: "Votre destination ne figure pas dans la liste ?",
    botonCotizarCustom: "Demander un tarif sur mesure via WhatsApp",
    disclaimerClima: "Tarifs soumis aux conditions météo et de piste en haute montagne. Service privé de point à point pour votre groupe (1 à 4 personnes).",
    mensajeWhatsApp: (nombre, destino, personas, precioStr) =>
      `Bonjour ${nombre}, j'ai vu vos tarifs officiels sur PaDónde et je souhaite réserver un transport 4x4 vers ${destino} pour ${personas} personne${personas === 1 ? "" : "s"}. (Tarif officiel : $${precioStr} COP)`,
    mensajeWhatsAppCustom: (nombre, destino, personas) =>
      `Bonjour ${nombre}, j'ai vu vos tarifs sur PaDónde et je souhaite obtenir un devis personnalisé pour ${personas} personne${personas === 1 ? "" : "s"} vers : ${destino || "ma destination"}.`,
  },
  de: {
    tituloBadge: "Offizielle 4x4-Tariftabelle",
    subtitulo: "Geschlossene 4x4-Geländewagen • Einheitliche Festpreise",
    capacidad: "1 bis 4 Passagiere",
    pasajeros: "Passagiere:",
    placeholderBuscar: "Hostel, Wasserfall, Express oder Ziel suchen...",
    tabTodas: "Alle Strecken",
    tabSierra: "Hohe Sierra & Berge",
    tabLocales: "Lokale Ziele",
    tabExpresos: "Express & Flughafen",
    sinResultados: "Keine Strecken mit diesem Namen gefunden.",
    tarifaFijaBadge: "Offizieller Tarif",
    tarifaPorVehiculo: "Gesamtpreis pro Fahrzeug (nicht pro Person)",
    botonPedir: "Über WhatsApp anfragen",
    noApareceDestino: "Dein Ziel ist nicht in der Liste aufgeführt?",
    botonCotizarCustom: "Individuelles Angebot via WhatsApp anfragen",
    disclaimerClima: "Preise abhängig von Wetter- und Pistenbedingungen im Hochgebirge. Privater Punkt-zu-Punkt-Transfer für Ihre Gruppe (1-4 Personen).",
    mensajeWhatsApp: (nombre, destino, personas, precioStr) =>
      `Hallo ${nombre}, ich habe Ihre offiziellen Tarife auf PaDónde gesehen und möchte einen 4x4-Transport nach ${destino} für ${personas} Person${personas === 1 ? "" : "en"} buchen. (Offizieller Tarif: $${precioStr} COP)`,
    mensajeWhatsAppCustom: (nombre, destino, personas) =>
      `Hallo ${nombre}, ich habe Ihre Tarife auf PaDónde gesehen und möchte ein Angebot und Verfügbarkeit für ${personas} Person${personas === 1 ? "" : "en"} nach: ${destino || "mein Ziel"} anfragen.`,
  },
};

/**
 * Diccionario de destinos traducidos al inglés, francés y alemán
 * para mejorar la comprensión de turistas internacionales.
 */
export const TRADUCCIONES_DESTINOS: Record<string, { en?: string; fr?: string; de?: string }> = {
  "Centro Histórico (Santa Marta)": {
    en: "Historic Downtown (Santa Marta)",
    fr: "Centre Historique (Santa Marta)",
    de: "Historisches Zentrum (Santa Marta)",
  },
  "Aeropuerto Simón Bolívar": {
    en: "Simón Bolívar Airport (SMR)",
    fr: "Aéroport Simón Bolívar (SMR)",
    de: "Flughafen Simón Bolívar (SMR)",
  },
  "Parque Tayrona": {
    en: "Tayrona National Park (Main Entrance)",
    fr: "Parc National Tayrona (Entrée Principale)",
    de: "Tayrona-Nationalpark (Haupteingang)",
  },
  "Entrada Pozo Azul": {
    en: "Pozo Azul Main Entrance",
    fr: "Entrée Principale Pozo Azul",
    de: "Haupteingang Pozo Azul",
  },
  "Cascadas Escondida": {
    en: "Escondida Waterfall",
    fr: "Cascade Escondida",
    de: "Versteckter Wasserfall (Escondida)",
  },
  "Oído del Mundo": {
    en: "Oído del Mundo (Sacred Waterfall)",
    fr: "Oído del Mundo (Cascade Sacrée)",
    de: "Oído del Mundo (Heiliger Wasserfall)",
  },
  "Cascadas Marinka": {
    en: "Marinka Waterfalls",
    fr: "Cascades Marinka",
    de: "Marinka-Wasserfälle",
  },
  "Cascadas Jaguar": {
    en: "Jaguar Waterfalls",
    fr: "Cascades Jaguar",
    de: "Jaguar-Wasserfälle",
  },
  "Mirador Los Pinos": {
    en: "Los Pinos Viewpoint (Panoramic Vista)",
    fr: "Belvédère Los Pinos (Vue Panoramique)",
    de: "Aussichtspunkt Los Pinos (Panoramablick)",
  },
  "Circuito Nubes (Cielo, Guarumo, Sierra Paraíso, Las Nubes, Mountain House)": {
    en: "Nubes Circuit (Cloud Forest Hostels & Trails)",
    fr: "Circuit Nubes (Forêt de Nuages & Auberges)",
    de: "Nubes-Rundweg (Nebelwald-Hostels & Pfade)",
  },
  "El Dorado (Reserva ProAves)": {
    en: "El Dorado Nature Reserve (ProAves Bird Sanctuary)",
    fr: "Réserve Naturelle El Dorado (Sanctuaire ProAves)",
    de: "Naturreservat El Dorado (ProAves Vogelschutzgebiet)",
  },
  "La Tagua": {
    en: "La Tagua (Gateway to Cerro Kennedy)",
    fr: "La Tagua (Accès Cerro Kennedy)",
    de: "La Tagua (Zugang zu Cerro Kennedy)",
  },
  "Filo de los Burros": {
    en: "Filo de los Burros (High Ridge)",
    fr: "Filo de los Burros (Crête d'altitude)",
    de: "Filo de los Burros (Bergkamm)",
  },
};

export function getDestinoTraducido(destinoOriginal: string, locale: string): string {
  const trans = TRADUCCIONES_DESTINOS[destinoOriginal];
  if (!trans) return destinoOriginal;
  if (locale === "en" && trans.en) return trans.en;
  if (locale === "fr" && trans.fr) return trans.fr;
  if (locale === "de" && trans.de) return trans.de;
  return destinoOriginal;
}
