import type { CategoriaEvento, ZonaSlug } from "@/lib/types";

// ─── Zonas ────────────────────────────────────────────────────────────────────

export type ZonaConfig = {
  slug: ZonaSlug;
  nombre: string;
  nombreCorto: string;
  descripcion: string;
  activa: boolean;
};

/** Zonas disponibles en la plataforma — ordenadas por prioridad de lanzamiento */
export const ZONAS: ZonaConfig[] = [
  {
    slug: "minca",
    nombre: "Minca",
    nombreCorto: "Minca",
    descripcion: "Pueblo de montaña en la Sierra Nevada de Santa Marta",
    activa: true,
  },
  {
    slug: "mendihuaca",
    nombre: "Mendihuaca",
    nombreCorto: "Mendihuaca",
    descripcion: "Playas vírgenes, río, surf y naturaleza a los pies de la Sierra Nevada",
    activa: true,
  },
  {
    slug: "tairona",
    nombre: "Parque Tairona",
    nombreCorto: "Tairona",
    descripcion: "Parque Nacional Natural Tayrona",
    activa: false, // Se activa en Fase 2
  },
  {
    slug: "santa-marta",
    nombre: "Santa Marta",
    nombreCorto: "Sta. Marta",
    descripcion: "La ciudad más antigua de Colombia",
    activa: false, // Se activa en Fase 3
  },
];

export const getZona = (slug: ZonaSlug) =>
  ZONAS.find((z) => z.slug === slug) ?? null;

// ─── Categorías ───────────────────────────────────────────────────────────────

export type CategoriaConfig = {
  id: CategoriaEvento;
  label: string;
  labelEn: string;
  emoji: string;
};

/** Categorías con sus etiquetas e íconos para filtros y badges */
export const CATEGORIAS: CategoriaConfig[] = [
  { id: "rumba",       label: "Rumba",       labelEn: "Party & Nightlife", emoji: "🪩" },
  { id: "comida",      label: "Comida",      labelEn: "Food",              emoji: "🍽️" },
  { id: "bienestar",   label: "Bienestar",   labelEn: "Wellness",          emoji: "🧘" },
  { id: "tours",       label: "Tours",       labelEn: "Tours",             emoji: "🌿" },
  { id: "arte",        label: "Arte & Cultura", labelEn: "Art & Culture",  emoji: "🎨" },
  { id: "hospedaje",   label: "Hospedaje",   labelEn: "Stay",              emoji: "🏡" },
  { id: "artesanias",  label: "Artesanías",  labelEn: "Crafts",            emoji: "🪡" },
];

export const getCategoria = (id: CategoriaEvento) =>
  CATEGORIAS.find((c) => c.id === id) ??
  (id === "musica"
    ? { id: "rumba" as CategoriaEvento, label: "Rumba", labelEn: "Party & Nightlife", emoji: "🪩" }
    : null);

// ─── Comisiones ───────────────────────────────────────────────────────────────

/** Porcentaje que retiene la plataforma sobre ventas de boletería (0–1) */
export const COMISION_BOLETERIA = 0.10; // 10%

// ─── Contacto Comercial ───────────────────────────────────────────────────────

/** Número oficial de WhatsApp de PaDónde para negocios y publicaciones */
export const WHATSAPP_CONTACTO = "573013010194";

/**
 * Genera un enlace de WhatsApp directo con mensaje predefinido.
 * @param numero - Número con código de país, ej: "573001234567"
 * @param mensaje - Texto preescrito (se URL-encoda automáticamente)
 */
export const whatsappLink = (numero: string, mensaje: string) =>
  `https://wa.me/${numero}?text=${encodeURIComponent(mensaje)}`;

