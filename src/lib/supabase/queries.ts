import { createClient } from "@/lib/supabase/server";
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
    nombre,
    whatsapp,
    instagram,
    activo
  )
`;

/**
 * Obtiene los eventos activos de una zona desde Supabase.
 * Realiza un JOIN relacional con la tabla de negocios.
 */
export async function getEventosByZona(zonaSlug: ZonaSlug): Promise<EventoConNegocio[]> {
  try {
    const supabase = await createClient();

    // 1. Obtener ID de la zona por su slug
    const { data: zona, error: zonaError } = await supabase
      .from("zonas")
      .select("id")
      .eq("slug", zonaSlug)
      .eq("activa", true)
      .single();

    if (zonaError || !zona) {
      console.warn(`Zona no encontrada en Supabase: ${zonaSlug}`);
      return getMockEventos(zonaSlug);
    }

    // 2. Obtener eventos con su negocio relacionado (todos los activos)
    let eventosData: any[] | null = null;
    const resInicial = await supabase
      .from("eventos")
      .select(COLUMNAS_CON_TRADUCCIONES)
      .eq("zona_id", zona.id)
      .eq("activo", true)
      .order("destacado", { ascending: false })
      .order("fecha_inicio", { ascending: true });

    let eventosError = resInicial.error;
    eventosData = resInicial.data;

    // Fallback retrocompatible por si la columna traducciones aún no existe en la BD
    if (eventosError && eventosError.code === "42703") {
      const fallbackRes = await supabase
        .from("eventos")
        .select(COLUMNAS_BASE)
        .eq("zona_id", zona.id)
        .eq("activo", true)
        .order("destacado", { ascending: false })
        .order("fecha_inicio", { ascending: true });
      eventosData = fallbackRes.data;
      eventosError = fallbackRes.error;
    }

    if (eventosError) {
      console.error("Error al obtener eventos de Supabase:", eventosError);
      return getMockEventos(zonaSlug);
    }

    const lista = (eventosData as unknown as (EventoConNegocio & { negocio?: { activo?: boolean } })[]) || [];
    // Ocultar del feed público si el comercio aliado está desactivado
    const filtrados = lista.filter((e) => !e.negocio || e.negocio.activo !== false);
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
export async function getEventoById(id: string): Promise<EventoConNegocio | null> {
  try {
    const supabase = await createClient();

    let eventoData: any = null;
    const resInicial = await supabase
      .from("eventos")
      .select(COLUMNAS_CON_TRADUCCIONES)
      .eq("id", id)
      .eq("activo", true)
      .single();

    let error = resInicial.error;
    eventoData = resInicial.data;

    // Fallback retrocompatible por si la columna traducciones aún no existe en la BD
    if (error && error.code === "42703") {
      const fallbackRes = await supabase
        .from("eventos")
        .select(COLUMNAS_BASE)
        .eq("id", id)
        .eq("activo", true)
        .single();
      eventoData = fallbackRes.data;
      error = fallbackRes.error;
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
  zonaSlug: ZonaSlug
): Promise<ServicioEsencial[]> {
  try {
    const supabase = await createClient();

    // 1. Obtener ID de la zona por su slug
    const { data: zona } = await supabase
      .from("zonas")
      .select("id")
      .eq("slug", zonaSlug)
      .eq("activa", true)
      .single();

    const zonaId = zona?.id || (zonaSlug === "mendihuaca" ? "zona-mendihuaca" : "zona-minca");

    const { data, error } = await supabase
      .from("servicios_esenciales")
      .select("*")
      .eq("zona_id", zonaId)
      .eq("activo", true)
      .order("orden_prioridad", { ascending: true });

    if (error || !data || data.length === 0) {
      const fallbackList = MOCK_SERVICIOS_ESENCIALES.filter((s) => {
        const matchesSlug =
          zonaSlug === "mendihuaca"
            ? s.zona_id === "zona-mendihuaca"
            : s.zona_id === "zona-minca";
        return (s.zona_id === zonaId || matchesSlug) && s.activo;
      });
      return fallbackList.sort((a, b) => a.orden_prioridad - b.orden_prioridad);
    }

    return data as ServicioEsencial[];
  } catch (err) {
    console.warn("[getServiciosEsencialesByZona] Fallback a mock:", err);
    return MOCK_SERVICIOS_ESENCIALES.filter((s) => {
      const matchesSlug =
        zonaSlug === "mendihuaca"
          ? s.zona_id === "zona-mendihuaca"
          : s.zona_id === "zona-minca";
      return matchesSlug && s.activo;
    });
  }
}

/**
 * Obtiene la configuración de UX territorial desde Supabase con fallback seguro a CONFIG_TERRITORIAL.
 */
export async function getConfigTerritorialAsync(): Promise<Record<string, any>> {
  try {
    const supabase = await createClient();
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

