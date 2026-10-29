/**
 * Temas visuales de la Carta Digital PaDónde.
 *
 * Regla operativa: UN solo motor (idiomas, moneda, categorías, fotos, botones)
 * y un número CERRADO de "vestidos" predefinidos. Nunca diseño a la medida
 * por cliente, para no generar retrabajo. El tema se escoge según la
 * identidad real del lugar, no según cuánto paga.
 */

export type TemaMenuId = "sierra" | "fogon" | "caribe" | "oro";

export interface TemaMenu {
  id: TemaMenuId;
  nombre: string;
  emoji: string;
  paraQuien: string;
  descripcion: string;
  isDark: boolean;

  // Base
  bg: string;
  text: string;
  textMuted: string;
  textSoft: string;
  heading: string;
  dishTitle: string;
  accent: string;
  accentMuted: string;
  border: string;
  borderStrong: string;
  fontTitle: string;

  // Tarjetas
  cardFrom: string;
  cardTo: string;
  cardShadow: string;
  cardHoverShadow: string;
  imageBg: string;

  // Superficies y campos
  surface: string;
  inputBg: string;
  inputText: string;
  navBg: string;

  // Degradados de texto
  titleGradient: string;
  priceGradient: string;

  // Botones
  btnGradient: string;
  btnText: string;
  btnShadow: string;
  secondaryBg: string;
  secondaryBorder: string;
  secondaryText: string;

  // Pestañas de categoría
  pillBg: string;
  pillText: string;
  pillActiveGradient: string;
  pillActiveText: string;

  // Selectores (idioma / moneda)
  chipBg: string;
  chipText: string;
  chipActiveBg: string;
  chipActiveText: string;

  // Sello e insignias
  badgeBg: string;
  badgeBorder: string;
  badgeText: string;

  // Halos decorativos de fondo
  halo1: string;
  halo2: string;
}

const SERIF = "var(--font-playfair), Georgia, serif";
const SANS = "var(--font-inter), system-ui, sans-serif";

export const TEMAS_MENU: Record<TemaMenuId, TemaMenu> = {
  sierra: {
    id: "sierra",
    nombre: "Sierra",
    emoji: "🌿",
    paraQuien: "Cafés de montaña, comida de autor, vegetarianos, experiencias botánicas",
    descripcion: "Fondo negro esmeralda profundo con vibrantes tonos verdes jade y menta luminosa.",
    isDark: true,
    bg: "#07100A",
    text: "#F0FDF4",
    textMuted: "rgba(240, 253, 244, 0.65)",
    textSoft: "rgba(240, 253, 244, 0.85)",
    heading: "#6EE7B7",
    dishTitle: "#ECFDF5",
    accent: "#34D399",
    accentMuted: "rgba(52, 211, 153, 0.75)",
    border: "rgba(52, 211, 153, 0.25)",
    borderStrong: "rgba(52, 211, 153, 0.55)",
    fontTitle: SERIF,
    cardFrom: "#0E1A12",
    cardTo: "#07110A",
    cardShadow: "0 8px 24px rgba(0, 0, 0, 0.6)",
    cardHoverShadow: "0 12px 30px rgba(52, 211, 153, 0.22)",
    imageBg: "#050B07",
    surface: "rgba(14, 26, 18, 0.92)",
    inputBg: "rgba(0, 0, 0, 0.55)",
    inputText: "#FFFFFF",
    navBg: "rgba(7, 16, 10, 0.96)",
    titleGradient: "linear-gradient(180deg, #D1FAE5 0%, #34D399 45%, #059669 100%)",
    priceGradient: "linear-gradient(180deg, #A7F3D0 0%, #34D399 100%)",
    btnGradient: "linear-gradient(135deg, #10B981 0%, #059669 50%, #047857 100%)",
    btnText: "#FFFFFF",
    btnShadow: "0 4px 20px rgba(16, 185, 129, 0.45)",
    secondaryBg: "rgba(52, 211, 153, 0.12)",
    secondaryBorder: "rgba(52, 211, 153, 0.45)",
    secondaryText: "#6EE7B7",
    pillBg: "#0E1A12",
    pillText: "rgba(240, 253, 244, 0.78)",
    pillActiveGradient: "linear-gradient(135deg, #34D399 0%, #059669 100%)",
    pillActiveText: "#03170C",
    chipBg: "rgba(0, 0, 0, 0.55)",
    chipText: "rgba(240, 253, 244, 0.7)",
    chipActiveBg: "#34D399",
    chipActiveText: "#07100A",
    badgeBg: "rgba(16, 185, 129, 0.15)",
    badgeBorder: "rgba(52, 211, 153, 0.45)",
    badgeText: "#6EE7B7",
    halo1: "rgba(52, 211, 153, 0.16)",
    halo2: "rgba(16, 185, 129, 0.08)",
  },

  fogon: {
    id: "fogon",
    nombre: "Fogón",
    emoji: "🔥",
    paraQuien: "Bares, hamburgueserías, parrillas, sitios de ambiente relajado",
    descripcion: "Carbón cálido con rojo y amarillo de fuego. Casual, con personalidad.",
    isDark: true,
    bg: "#17110E",
    text: "#F7EFE6",
    textMuted: "rgba(247, 239, 230, 0.62)",
    textSoft: "rgba(247, 239, 230, 0.82)",
    heading: "#FFD24A",
    dishTitle: "#FFF4E0",
    accent: "#FFC93C",
    accentMuted: "rgba(255, 201, 60, 0.75)",
    border: "rgba(229, 72, 45, 0.28)",
    borderStrong: "rgba(255, 201, 60, 0.5)",
    fontTitle: SANS,
    cardFrom: "#241A16",
    cardTo: "#1A120F",
    cardShadow: "0 8px 24px rgba(0, 0, 0, 0.55)",
    cardHoverShadow: "0 12px 30px rgba(229, 72, 45, 0.22)",
    imageBg: "#0E0A08",
    surface: "rgba(36, 26, 22, 0.92)",
    inputBg: "rgba(0, 0, 0, 0.45)",
    inputText: "#FFFFFF",
    navBg: "rgba(23, 17, 14, 0.96)",
    titleGradient: "linear-gradient(180deg, #FFE58A 0%, #FFC93C 45%, #F2762E 100%)",
    priceGradient: "linear-gradient(180deg, #FFE9A0 0%, #FFC93C 100%)",
    btnGradient: "linear-gradient(135deg, #F05A3C 0%, #D7372A 55%, #B32820 100%)",
    btnText: "#FFFFFF",
    btnShadow: "0 4px 20px rgba(215, 55, 42, 0.45)",
    secondaryBg: "rgba(255, 201, 60, 0.12)",
    secondaryBorder: "rgba(255, 201, 60, 0.45)",
    secondaryText: "#FFE08A",
    pillBg: "#231915",
    pillText: "rgba(247, 239, 230, 0.78)",
    pillActiveGradient: "linear-gradient(135deg, #FFD24A 0%, #FFB627 100%)",
    pillActiveText: "#1A120F",
    chipBg: "rgba(0, 0, 0, 0.55)",
    chipText: "rgba(247, 239, 230, 0.7)",
    chipActiveBg: "#FFC93C",
    chipActiveText: "#17110E",
    badgeBg: "rgba(229, 72, 45, 0.16)",
    badgeBorder: "rgba(255, 201, 60, 0.45)",
    badgeText: "#FFE08A",
    halo1: "rgba(229, 72, 45, 0.16)",
    halo2: "rgba(255, 201, 60, 0.07)",
  },

  caribe: {
    id: "caribe",
    nombre: "Caribe",
    emoji: "🌊",
    paraQuien: "Restaurantes de playa, Mendihuaca, cocina de mar, beach clubs",
    descripcion: "Fondo negro noche oceánica con vibrantes tonos azul zafiro y cian luminoso.",
    isDark: true,
    bg: "#050D14",
    text: "#F0F9FF",
    textMuted: "rgba(240, 249, 255, 0.65)",
    textSoft: "rgba(240, 249, 255, 0.85)",
    heading: "#38BDF8",
    dishTitle: "#F0F9FF",
    accent: "#38BDF8",
    accentMuted: "rgba(56, 189, 248, 0.75)",
    border: "rgba(56, 189, 248, 0.28)",
    borderStrong: "rgba(56, 189, 248, 0.55)",
    fontTitle: SERIF,
    cardFrom: "#0A1826",
    cardTo: "#050D14",
    cardShadow: "0 8px 24px rgba(0, 0, 0, 0.6)",
    cardHoverShadow: "0 12px 30px rgba(56, 189, 248, 0.22)",
    imageBg: "#03080D",
    surface: "rgba(10, 24, 38, 0.92)",
    inputBg: "rgba(0, 0, 0, 0.55)",
    inputText: "#FFFFFF",
    navBg: "rgba(5, 13, 20, 0.96)",
    titleGradient: "linear-gradient(180deg, #E0F2FE 0%, #38BDF8 45%, #0284C7 100%)",
    priceGradient: "linear-gradient(180deg, #BAE6FD 0%, #38BDF8 100%)",
    btnGradient: "linear-gradient(135deg, #0284C7 0%, #0369A1 50%, #075985 100%)",
    btnText: "#FFFFFF",
    btnShadow: "0 4px 20px rgba(2, 132, 199, 0.45)",
    secondaryBg: "rgba(56, 189, 248, 0.12)",
    secondaryBorder: "rgba(56, 189, 248, 0.45)",
    secondaryText: "#7DD3FC",
    pillBg: "#0A1826",
    pillText: "rgba(240, 249, 255, 0.78)",
    pillActiveGradient: "linear-gradient(135deg, #38BDF8 0%, #0284C7 100%)",
    pillActiveText: "#02121E",
    chipBg: "rgba(0, 0, 0, 0.55)",
    chipText: "rgba(240, 249, 255, 0.7)",
    chipActiveBg: "#38BDF8",
    chipActiveText: "#050D14",
    badgeBg: "rgba(14, 165, 233, 0.16)",
    badgeBorder: "rgba(56, 189, 248, 0.45)",
    badgeText: "#7DD3FC",
    halo1: "rgba(56, 189, 248, 0.16)",
    halo2: "rgba(2, 132, 199, 0.08)",
  },

  oro: {
    id: "oro",
    nombre: "Oro",
    emoji: "👑",
    paraQuien: "Solo alta cocina o experiencias de chef reales (sello que se gana)",
    descripcion: "Obsidiana profunda y oro cepillado. Reservado para muy pocos.",
    isDark: true,
    bg: "#080D0A",
    text: "#F4F1EA",
    textMuted: "rgba(244, 241, 234, 0.65)",
    textSoft: "rgba(244, 241, 234, 0.8)",
    heading: "#F3E5AB",
    dishTitle: "#FFF8E7",
    accent: "#E8C872",
    accentMuted: "rgba(212, 175, 55, 0.7)",
    border: "rgba(212, 175, 55, 0.25)",
    borderStrong: "rgba(212, 175, 55, 0.45)",
    fontTitle: SERIF,
    cardFrom: "#0F1712",
    cardTo: "#09100C",
    cardShadow: "0 8px 24px rgba(0, 0, 0, 0.6)",
    cardHoverShadow: "0 12px 30px rgba(212, 175, 55, 0.15)",
    imageBg: "#050806",
    surface: "rgba(15, 23, 18, 0.9)",
    inputBg: "rgba(0, 0, 0, 0.65)",
    inputText: "#FFFFFF",
    navBg: "rgba(8, 13, 10, 0.96)",
    titleGradient: "linear-gradient(180deg, #FFF8E7 0%, #E8C872 45%, #C29B38 100%)",
    priceGradient: "linear-gradient(180deg, #FFF9EA 0%, #E8C872 70%, #B8860B 100%)",
    btnGradient: "linear-gradient(135deg, #F3E5AB 0%, #D4AF37 50%, #B8860B 100%)",
    btnText: "#080D0A",
    btnShadow: "0 4px 20px rgba(212, 175, 55, 0.4)",
    secondaryBg: "rgba(245, 158, 11, 0.15)",
    secondaryBorder: "rgba(245, 158, 11, 0.45)",
    secondaryText: "#FDE68A",
    pillBg: "#0E1611",
    pillText: "rgba(244, 241, 234, 0.75)",
    pillActiveGradient: "linear-gradient(135deg, #F5E7B2 0%, #D4AF37 50%, #997415 100%)",
    pillActiveText: "#080D0A",
    chipBg: "rgba(0, 0, 0, 0.7)",
    chipText: "rgba(244, 241, 234, 0.7)",
    chipActiveBg: "#E8C872",
    chipActiveText: "#080D0A",
    badgeBg: "linear-gradient(135deg, rgba(212, 175, 55, 0.18) 0%, rgba(14, 22, 17, 0.95) 100%)",
    badgeBorder: "rgba(232, 200, 114, 0.45)",
    badgeText: "#F3E5AB",
    halo1: "rgba(212, 175, 55, 0.12)",
    halo2: "rgba(212, 175, 55, 0.08)",
  },
};

export const LISTA_TEMAS: TemaMenu[] = [
  TEMAS_MENU.sierra,
  TEMAS_MENU.fogon,
  TEMAS_MENU.caribe,
  TEMAS_MENU.oro,
];

export function esTemaValido(valor: unknown): valor is TemaMenuId {
  return typeof valor === "string" && valor in TEMAS_MENU;
}
