import { getPublicSupabaseClient } from "@/lib/supabase/public";
import { getMockEventos } from "@/lib/mock/eventos";
import { MOCK_SERVICIOS_ESENCIALES } from "@/lib/mock/serviciosEsenciales";
import { getZona } from "@/constants";
import type { EventoConNegocio, ZonaSlug, ServicioEsencial } from "@/lib/types";

const COLUMNAS_BASE = `
  id,
  negocio_id,
  zona_id,
  titulo,
  descripcion,
  tipo,
  categorias,
  precio,
  precio_moneda,
  fecha_inicio,
  fecha_fin,
  imagen_url,
  video_url,
  destacado,
  tiene_boleteria,
  activo,
  created_at,
  metadata_hospedaje,
  negocio:negocios (
    id,
    nombre,
    whatsapp,
    instagram,
    activo
  )
`;

const COLUMNAS_CON_TRADUCCIONES = `
  id,
  negocio_id,
  zona_id,
  titulo,
  descripcion,
  tipo,
  categorias,
  precio,
  precio_moneda,
  fecha_inicio,
  fecha_fin,
  imagen_url,
  video_url,
  destacado,
  tiene_boleteria,
  activo,
  created_at,
  traducciones,
  metadata_hospedaje,
  negocio:negocios (
    id,
    nombre,
    whatsapp,
    instagram,
    activo
  )
`;

const COLUMNAS_CON_REPUTACION_Y_TRADUCCIONES = `
  id,
  negocio_id,
  zona_id,
  titulo,
  descripcion,
  tipo,
  categorias,
  precio,
  precio_moneda,
  fecha_inicio,
  fecha_fin,
  imagen_url,
  video_url,
  destacado,
  tiene_boleteria,
  activo,
  created_at,
  traducciones,
  metadata_hospedaje,
  negocio:negocios (
    id,
    nombre,
    whatsapp,
    instagram,
    activo,
    google_rating,
    google_total_reviews,
    google_maps_url,
    google_review_url
  )
`;

type OpcionesLectura = { preview?: boolean };

/**
 * Cliente de lectura: público (sin cookies, compatible con ISR) por defecto.
 * Solo en vista previa LOCAL (ver src/lib/preview.ts) usa la sesión del admin,
 * para que la política RLS "authenticated" permita leer zonas inactivas.
 */
async function getClienteLectura(preview?: boolean) {
  if (preview) {
    const { createClient } = await import("@/lib/supabase/server");
    return await createClient();
  }
  return getPublicSupabaseClient();
}

/**
 * Obtiene los eventos activos de una zona desde Supabase.
 * Realiza un JOIN relacional con la tabla de negocios.
 */
export async function getEventosByZona(
  zonaSlug: ZonaSlug,
  opciones: OpcionesLectura = {}
): Promise<EventoConNegocio[]> {
  try {
    const supabase = await getClienteLectura(opciones.preview);

    // 1. Obtener ID de la zona por su slug (en producción solo zonas activas)
    let zonaQuery = supabase.from("zonas").select("id").eq("slug", zonaSlug);
    if (!opciones.preview) zonaQuery = zonaQuery.eq("activa", true);
    const { data: zona, error: zonaError } = await zonaQuery.single();

    if (zonaError || !zona) {
      console.warn(`Zona no encontrada en Supabase: ${zonaSlug}`);
      return getMockEventos(zonaSlug);
    }

    // 2. Obtener eventos con su negocio relacionado
    // En producción solo eventos activos; en vista previa local muestra todo para validar el montaje
    let eventosData: any[] | null = null;
    let queryInicial = supabase
      .from("eventos")
      .select(COLUMNAS_CON_REPUTACION_Y_TRADUCCIONES)
      .eq("zona_id", zona.id);
    if (!opciones.preview) {
      queryInicial = queryInicial.eq("activo", true);
    }
    const resInicial = await queryInicial
      .order("destacado", { ascending: false })
      .order("fecha_inicio", { ascending: true });

    let eventosError = resInicial.error;
    eventosData = resInicial.data;

    // Fallback retrocompatible por si las nuevas columnas de reputación aún no existen en 'negocios'
    if (eventosError && eventosError.code === "42703") {
      let queryTrad = supabase
        .from("eventos")
        .select(COLUMNAS_CON_TRADUCCIONES)
        .eq("zona_id", zona.id);
      if (!opciones.preview) queryTrad = queryTrad.eq("activo", true);
      const fallbackTraducciones = await queryTrad
        .order("destacado", { ascending: false })
        .order("fecha_inicio", { ascending: true });
      eventosData = fallbackTraducciones.data;
      eventosError = fallbackTraducciones.error;

      if (eventosError && eventosError.code === "42703") {
        let queryBase = supabase
          .from("eventos")
          .select(COLUMNAS_BASE)
          .eq("zona_id", zona.id);
        if (!opciones.preview) queryBase = queryBase.eq("activo", true);
        const fallbackBase = await queryBase
          .order("destacado", { ascending: false })
          .order("fecha_inicio", { ascending: true });
        eventosData = fallbackBase.data;
        eventosError = fallbackBase.error;
      }
    }

    if (eventosError) {
      console.error("Error al obtener eventos de Supabase:", eventosError);
      return getMockEventos(zonaSlug);
    }

    const lista = (eventosData as unknown as (EventoConNegocio & { negocio?: { activo?: boolean } })[]) || [];
    // En producción oculta si el negocio está inactivo; en preview local permite verlo
    const filtrados = opciones.preview
      ? lista
      : lista.filter((e) => !e.negocio || e.negocio.activo !== false);

    if (filtrados.length === 0) {
      return getMockEventos(zonaSlug);
    }
    return filtrados;
  } catch (err) {
    console.error("Excepción en getEventosByZona:", err);
    return getMockEventos(zonaSlug);
  }
}

/**
 * Obtiene el detalle de un evento por su ID con datos del negocio.
 * Si no está en Supabase, busca en el mock como fallback.
 */
export async function getEventoById(
  id: string,
  opciones: OpcionesLectura = {}
): Promise<EventoConNegocio | null> {
  try {
    const supabase = await getClienteLectura(opciones.preview);

    let eventoData: any = null;
    let queryInicial = supabase
      .from("eventos")
      .select(COLUMNAS_CON_REPUTACION_Y_TRADUCCIONES)
      .eq("id", id);
    if (!opciones.preview) queryInicial = queryInicial.eq("activo", true);
    const resInicial = await queryInicial.single();

    let error = resInicial.error;
    eventoData = resInicial.data;

    // Fallback retrocompatible por si las nuevas columnas de reputación aún no existen en 'negocios'
    if (error && error.code === "42703") {
      let queryTrad = supabase
        .from("eventos")
        .select(COLUMNAS_CON_TRADUCCIONES)
        .eq("id", id);
      if (!opciones.preview) queryTrad = queryTrad.eq("activo", true);
      const fallbackTraducciones = await queryTrad.single();
      eventoData = fallbackTraducciones.data;
      error = fallbackTraducciones.error;

      if (error && error.code === "42703") {
        let queryBase = supabase
          .from("eventos")
          .select(COLUMNAS_BASE)
          .eq("id", id);
        if (!opciones.preview) queryBase = queryBase.eq("activo", true);
        const fallbackBase = await queryBase.single();
        eventoData = fallbackBase.data;
        error = fallbackBase.error;
      }
    }

    if (error || !eventoData) {
      // Buscar en mock como fallback
      const mockEventos = getMockEventos();
      return mockEventos.find((e) => e.id === id) || null;
    }

    return eventoData as unknown as EventoConNegocio;
  } catch (err) {
    console.error("Excepción en getEventoById:", err);
    const mockEventos = getMockEventos();
    return mockEventos.find((e) => e.id === id) || null;
  }
}

/**
 * Obtiene los servicios esenciales de infraestructura activos para una zona.
 * Si la tabla aún no existe en Supabase o da error, usa el mock como fallback seguro.
 */
export async function getServiciosEsencialesByZona(
  zonaSlug: ZonaSlug,
  opciones: OpcionesLectura = {}
): Promise<ServicioEsencial[]> {
  try {
    const supabase = await getClienteLectura(opciones.preview);

    // 1. Obtener ID de la zona por su slug (en producción solo zonas activas)
    let zonaQuery = supabase.from("zonas").select("id").eq("slug", zonaSlug);
    if (!opciones.preview) zonaQuery = zonaQuery.eq("activa", true);
    const { data: zona } = await zonaQuery.single();

    const zonaId = zona?.id || `zona-${zonaSlug}`;

    let queryEsenciales = supabase
      .from("servicios_esenciales")
      .select("*")
      .eq("zona_id", zonaId);
    if (!opciones.preview) queryEsenciales = queryEsenciales.eq("activo", true);
    const { data, error } = await queryEsenciales.order("orden_prioridad", { ascending: true });

    if (error || !data || data.length === 0) {
      const fallbackList = MOCK_SERVICIOS_ESENCIALES.filter((s) => {
        const matchesSlug = s.zona_id === `zona-${zonaSlug}`;
        return (s.zona_id === zonaId || matchesSlug) && s.activo;
      });
      return fallbackList.sort((a, b) => a.orden_prioridad - b.orden_prioridad);
    }

    return data as ServicioEsencial[];
  } catch (err) {
    console.warn("[getServiciosEsencialesByZona] Fallback a mock:", err);
    return MOCK_SERVICIOS_ESENCIALES.filter((s) => {
      const matchesSlug = s.zona_id === `zona-${zonaSlug}`;
      return matchesSlug && s.activo;
    });
  }
}

/**
 * Obtiene la configuración de UX territorial desde Supabase con fallback seguro a CONFIG_TERRITORIAL.
 */
export async function getConfigTerritorialAsync(): Promise<Record<string, any>> {
  try {
    const supabase = getPublicSupabaseClient();
    const { data } = await supabase
      .from("configuraciones")
      .select("valor")
      .eq("clave", "config_territorial")
      .maybeSingle();

    if (data?.valor && typeof data.valor === "object") {
      return data.valor;
    }
  } catch {
    // Silencioso
  }
  const { CONFIG_TERRITORIAL } = await import("@/constants");
  return CONFIG_TERRITORIAL;
}

