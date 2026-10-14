/**
 * Tipos centrales de PaDónde.
 * Estos tipos reflejan la estructura de la base de datos en Supabase.
 * Cualquier cambio en el schema de BD debe reflejarse aquí primero.
 */

// ─── Enumeraciones ────────────────────────────────────────────────────────────

/** Slugs de las zonas geográficas soportadas */
export type ZonaSlug = "minca" | "tairona" | "santa-marta";

/** Categorías de eventos — usadas para filtros y badges */
export type CategoriaEvento =
  | "musica"
  | "comida"
  | "bienestar"
  | "tours"
  | "arte"
  | "hospedaje"
  | "transporte"
  | "artesanias";

/** Planes de suscripción de un negocio */
export type PlanNegocio = "gratis" | "pro" | "premium";

/** Filtro de tiempo en el feed público: 'hoy', 'manana', 'finde', o una fecha específica 'YYYY-MM-DD' */
export type FiltroTiempo = "hoy" | "manana" | "finde" | string;


// ─── Entidades principales ────────────────────────────────────────────────────

export type Zona = {
  id: string;
  nombre: string;
  slug: ZonaSlug;
  descripcion: string;
  imagen_url: string | null;
  activa: boolean;
};

export type Negocio = {
  id: string;
  zona_id: string;
  nombre: string;
  descripcion: string | null;
  categoria: CategoriaEvento;
  whatsapp: string;        // Número con código de país, ej: "573001234567"
  instagram: string | null;
  foto_url: string | null;
  plan: PlanNegocio;
  plan_expira_en: string | null; // ISO 8601
  activo: boolean;
  created_at: string;
};

export type Evento = {
  id: string;
  negocio_id: string;
  zona_id: string;
  titulo: string;
  descripcion: string | null;
  tipo: CategoriaEvento;
  precio: number | null;           // null = gratis o precio a consultar
  precio_moneda: "COP" | "USD";
  fecha_inicio: string;            // ISO 8601
  fecha_fin: string | null;        // null = evento puntual sin duración definida
  imagen_url: string | null;
  destacado: boolean;              // Los planes pro/premium pueden destacar eventos
  tiene_boleteria: boolean;        // Si tiene venta de tickets integrada
  activo: boolean;
  created_at: string;
  // Relación — se incluye en queries con JOIN
  negocio?: Pick<Negocio, "nombre" | "whatsapp" | "instagram">;
};

// ─── Tipos de UI (no van a la BD) ────────────────────────────────────────────

/** Evento enriquecido con datos del negocio para renderizar en el feed */
export type EventoConNegocio = Evento & {
  negocio: Pick<Negocio, "nombre" | "whatsapp" | "instagram">;
};

/** Resultado paginado — para cuando el feed crezca */
export type PaginatedResult<T> = {
  data: T[];
  count: number;
  page: number;
  pageSize: number;
};
