import { createClient } from "@/lib/supabase/server";
import { getMockEventos } from "@/lib/mock/eventos";
import type { EventoConNegocio, ZonaSlug } from "@/lib/types";

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
      return [];
    }

    // 2. Obtener eventos con su negocio relacionado (todos los activos)
    const { data: eventos, error: eventosError } = await supabase
      .from("eventos")
      .select(`
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
        destacado,
        tiene_boleteria,
        activo,
        created_at,
        negocio:negocios (
          nombre,
          whatsapp,
          instagram,
          activo
        )
      `)
      .eq("zona_id", zona.id)
      .eq("activo", true)
      .order("destacado", { ascending: false })
      .order("fecha_inicio", { ascending: true });

    if (eventosError) {
      console.error("Error al obtener eventos de Supabase:", eventosError);
      return [];
    }

    const lista = (eventos as unknown as (EventoConNegocio & { negocio?: { activo?: boolean } })[]) || [];
    // Ocultar del feed público si el comercio aliado está desactivado
    return lista.filter((e) => !e.negocio || e.negocio.activo !== false);
  } catch (err) {
    console.error("Excepción en getEventosByZona:", err);
    return [];
  }
}

/**
 * Obtiene el detalle de un evento por su ID con datos del negocio.
 * Si no está en Supabase, busca en el mock como fallback.
 */
export async function getEventoById(id: string): Promise<EventoConNegocio | null> {
  try {
    const supabase = await createClient();

    const { data: evento, error } = await supabase
      .from("eventos")
      .select(`
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
        destacado,
        tiene_boleteria,
        activo,
        created_at,
        negocio:negocios (
          nombre,
          whatsapp,
          instagram,
          activo
        )
      `)
      .eq("id", id)
      .eq("activo", true)
      .single();

    if (error || !evento) {
      // Buscar en mock como fallback
      const mockEventos = getMockEventos();
      return mockEventos.find((e) => e.id === id) || null;
    }

    return evento as unknown as EventoConNegocio;
  } catch (err) {
    console.error("Excepción en getEventoById:", err);
    const mockEventos = getMockEventos();
    return mockEventos.find((e) => e.id === id) || null;
  }
}
