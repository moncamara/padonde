import type { BadgeHabitacion } from "@/lib/types";

export const COMODIDADES_HABITACION: BadgeHabitacion[] = [
  { icono: "🌊", texto: "Frente al mar" },
  { icono: "🌅", texto: "Vista al mar" },
  { icono: "⛰️", texto: "Vista montaña" },
  { icono: "🌿", texto: "Vista a la selva / río" },
  { icono: "🚿", texto: "Baño privado" },
  { icono: "❄️", texto: "Aire acondicionado" },
  { icono: "🌀", texto: "Ventilador" },
  { icono: "♨️", texto: "Agua caliente" },
  { icono: "🛏️", texto: "Mosquitero" },
  { icono: "🏡", texto: "Balcón" },
  { icono: "🏖️", texto: "Hamaca privada" },
  { icono: "📶", texto: "WiFi" },
  { icono: "☕", texto: "Desayuno incluido" },
  { icono: "🍳", texto: "Acceso a cocina" },
  { icono: "🛁", texto: "Jacuzzi / Tina" },
  { icono: "🐾", texto: "Pet friendly" },
];

export const COMODIDADES_ADMIN: BadgeHabitacion[] = [
  ...COMODIDADES_HABITACION,
  { icono: "🚿", texto: "Baño compartido" },
  { icono: "🔒", texto: "Locker individual" },
];

export const ICONOS_COMODIDADES: Record<string, string> = Object.fromEntries([
  ...COMODIDADES_ADMIN.map((c) => [c.texto, c.icono]),
  ["Aire/Ventilador", "🌀"], // Compatibilidad hacia atrás
]);

const TRADUCCIONES_COMODIDADES: Record<string, { en: string; fr: string; de: string }> = {
  "frente al mar": { en: "Beachfront", fr: "Front de mer", de: "Direkt am Strand" },
  "vista al mar": { en: "Ocean view", fr: "Vue sur la mer", de: "Meerblick" },
  "vista montaña": { en: "Mountain view", fr: "Vue sur la montagne", de: "Bergblick" },
  "vista a la montaña": { en: "Mountain view", fr: "Vue sur la montagne", de: "Bergblick" },
  "vista a la selva / río": { en: "Jungle / river view", fr: "Vue jungle / rivière", de: "Dschungel- / Flussblick" },
  "baño privado": { en: "Private bathroom", fr: "Salle de bain privée", de: "Eigenes Bad" },
  "baño compartido": { en: "Shared bathroom", fr: "Salle de bain partagée", de: "Gemeinschaftsbad" },
  "aire acondicionado": { en: "Air conditioning", fr: "Climatisation", de: "Klimaanlage" },
  "ventilador": { en: "Fan", fr: "Ventilateur", de: "Ventilator" },
  "aire/ventilador": { en: "A/C / Fan", fr: "Clim / Ventilateur", de: "Klima / Ventilator" },
  "agua caliente": { en: "Hot water", fr: "Eau chaude", de: "Warmwasser" },
  "mosquitero": { en: "Mosquito net", fr: "Moustiquaire", de: "Moskitonetz" },
  "balcón": { en: "Balcony", fr: "Balcon", de: "Balkon" },
  "balcón privado": { en: "Private balcony", fr: "Balcon privé", de: "Privater Balkon" },
  "hamaca privada": { en: "Private hammock", fr: "Hamac privé", de: "Private Hängematte" },
  "wifi": { en: "WiFi", fr: "Wi-Fi", de: "WLAN" },
  "wi-fi rápido": { en: "Fast WiFi", fr: "Wi-Fi rapide", de: "Schnelles WLAN" },
  "desayuno incluido": { en: "Breakfast included", fr: "Petit-déjeuner inclus", de: "Frühstück inklusive" },
  "acceso a cocina": { en: "Kitchen access", fr: "Accès cuisine", de: "Küchenzugang" },
  "jacuzzi / tina": { en: "Jacuzzi / Tub", fr: "Jacuzzi / Baignoire", de: "Whirlpool / Badewanne" },
  "pet friendly": { en: "Pet friendly", fr: "Animaux acceptés", de: "Haustierfreundlich" },
  "locker individual": { en: "Personal locker", fr: "Casier individuel", de: "Persönlicher Spind" },
};

/** Traduce el texto de una comodidad de habitación en ES/EN/FR/DE conservando compatibilidad con etiquetas previas. */
export function traducirComodidadHabitacion(texto: string, locale: string): string {
  if (!texto || locale === "es") return texto;
  const entry = TRADUCCIONES_COMODIDADES[texto.trim().toLowerCase()];
  if (!entry) return texto;
  if (locale === "en" || locale === "fr" || locale === "de") return entry[locale];
  return texto;
}
