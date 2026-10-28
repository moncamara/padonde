/**
 * Tipos centrales de PaDónde.
 * Estos tipos reflejan la estructura de la base de datos en Supabase.
 * Cualquier cambio en el schema de BD debe reflejarse aquí primero.
 */

// ─── Enumeraciones ────────────────────────────────────────────────────────────

/** Slugs de las zonas geográficas soportadas */
export type ZonaSlug = "minca" | "tairona" | "santa-marta" | "mendihuaca";

/** Categorías de eventos — usadas para filtros y badges */
export type CategoriaEvento =
  | "rumba"
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

/** Filtro de tiempo en el feed público: 'hoy', 'manana', o una fecha específica 'YYYY-MM-DD' */
export type FiltroTiempo = "hoy" | "manana" | string;


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
  google_rating?: number | null;
  google_total_reviews?: number | null;
  google_maps_url?: string | null;
  google_review_url?: string | null;
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
  video_url?: string | null;
  destacado: boolean;              // Los planes pro/premium pueden destacar eventos
  tiene_boleteria: boolean;        // Si tiene venta de tickets integrada
  activo: boolean;
  created_at: string;
  traducciones?: Record<string, { titulo: string; descripcion: string }> | null;
  /** Datos opcionales para hospedajes (habitaciones, cotizador, reputación Google) */
  metadata_hospedaje?: HospedajeMetadata | null;
  // Relación — se incluye en queries con JOIN
  negocio?: {
    id?: string;
    nombre: string;
    whatsapp: string;
    instagram?: string | null;
    activo?: boolean;
    google_rating?: number | null;
    google_total_reviews?: number | null;
    google_maps_url?: string | null;
    google_review_url?: string | null;
  };
};

// ─── Tipos de Hospedaje y Cotizador ──────────────────────────────────────────

export type BadgeHabitacion = {
  icono: string;
  texto: string;
};

export type HabitacionHospedaje = {
  id: string;
  titulo: string;
  descripcion?: string;
  precio_noche_cop: number;
  capacidad_max: number;
  fotos: string[];
  badges: BadgeHabitacion[];
};

export type GoogleReputacion = {
  rating: number;             // ej: 4.8
  total_reviews: number;      // ej: 245
  maps_url: string;           // ej: "https://maps.app.goo.gl/..."
};

export type HospedajeMetadata = {
  check_in_hora?: string;     // ej: "15:00"
  check_out_hora?: string;    // ej: "11:00"
  google_reputacion?: GoogleReputacion;
  habitaciones?: HabitacionHospedaje[];
  galeria_fotos?: string[];   // Fotos adicionales de vitrina (hasta 3-4 fotos para restaurantes, tours, o locales)
  menu_url?: string;          // Enlace directo a carta digital (PDF, Canva, link)
  menu_fotos?: string[];      // Fotos de las páginas de la carta
  google_review_url?: string; // Enlace directo para calificar en Google
};

// ─── Tipos de Servicios Esenciales e Info Útil ────────────────────────────────

export type CategoriaServicioEsencial =
  | "efectivo"
  | "transporte"
  | "salud"
  | "comercio"
  | "general";

export type MetadataComercialServicio = {
  imagenes?: string[];
  video_url?: string | null;
  [key: string]: any;
};

export type ServicioEsencial = {
  id: string;
  zona_id: string;
  categoria: CategoriaServicioEsencial;
  nombre_comercial: string;
  subtitulo: string;
  logo_url: string | null;
  imagen_lugar_url: string | null;
  whatsapp: string;
  mensaje_whatsapp_default: string | null;
  google_maps_url: string | null;
  direccion_referencia: string;
  horario_apertura: string;
  servicios_tags: string[];
  destacado_patrocinado: boolean;
  tipo_acuerdo?: "canje_afiche" | "pago_mensual" | "cortesia";
  orden_prioridad: number;
  activo: boolean;
  boton_whatsapp_activo?: boolean;
  metadata_comercial?: MetadataComercialServicio | null;
  created_at?: string;
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
