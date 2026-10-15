"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { parseLocalColombiaAISO } from "@/lib/utils";
import type { CategoriaEvento, PlanNegocio } from "@/lib/types";

export interface AdminPublishInput {
  businessName: string;
  whatsapp: string;
  instagram?: string;
  eventTitle: string;
  category: CategoriaEvento;
  dateTime: string;
  price: number;
  description: string;
  imageUrl?: string;
  isFeatured?: boolean;
  zonaSlug: string;
}

export interface AdminPublishResult {
  success: boolean;
  eventId?: string;
  error?: string;
}

/**
 * Server Action protegido para publicar eventos desde el panel de Super Admin.
 * Verifica que el usuario tenga sesión activa antes de insertar.
 */
export async function adminPublishEventAction(
  input: AdminPublishInput
): Promise<AdminPublishResult> {
  try {
    const supabase = await createClient();

    // 1. Verificar sesión autenticada
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "No autorizado. Debes iniciar sesión." };
    }

    // 2. Obtener zona
    const { data: zona, error: zonaError } = await supabase
      .from("zonas")
      .select("id")
      .eq("slug", input.zonaSlug)
      .eq("activa", true)
      .single();

    if (zonaError || !zona) {
      return { success: false, error: "Zona no válida o inactiva." };
    }

    // 3. Buscar o crear negocio
    let negocioId: string;
    const { data: negocioExistente } = await supabase
      .from("negocios")
      .select("id")
      .eq("zona_id", zona.id)
      .ilike("nombre", input.businessName.trim())
      .maybeSingle();

    if (negocioExistente) {
      negocioId = negocioExistente.id;
      await supabase
        .from("negocios")
        .update({
          whatsapp: input.whatsapp.replace(/\D/g, ""),
          instagram: input.instagram?.trim() || null,
        })
        .eq("id", negocioId);
    } else {
      const { data: nuevoNegocio, error: negError } = await supabase
        .from("negocios")
        .insert({
          zona_id: zona.id,
          user_id: user.id, // Vinculado al admin creador
          nombre: input.businessName.trim(),
          categoria: input.category,
          whatsapp: input.whatsapp.replace(/\D/g, ""),
          instagram: input.instagram?.trim() || null,
          plan: input.isFeatured ? "pro" : "gratis",
          activo: true,
        })
        .select("id")
        .single();

      if (negError || !nuevoNegocio) {
        return { success: false, error: "No se pudo registrar el negocio." };
      }
      negocioId = nuevoNegocio.id;
    }

    // 4. Crear evento
    const { data: nuevoEvento, error: evError } = await supabase
      .from("eventos")
      .insert({
        negocio_id: negocioId,
        zona_id: zona.id,
        titulo: input.eventTitle.trim(),
        descripcion: input.description.trim() || null,
        tipo: input.category,
        precio: input.price > 0 ? input.price : 0,
        precio_moneda: "COP",
        fecha_inicio: parseLocalColombiaAISO(input.dateTime),
        imagen_url:
          input.imageUrl ||
          "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&q=80",
        destacado: Boolean(input.isFeatured),
        tiene_boleteria: false,
        activo: true,
      })
      .select("id")
      .single();

    if (evError || !nuevoEvento) {
      return { success: false, error: "Error al registrar el evento en Supabase." };
    }

    revalidatePath(`/[locale]/${input.zonaSlug}`, "page");
    revalidatePath(`/[locale]/admin`, "page");

    return { success: true, eventId: nuevoEvento.id };
  } catch (err) {
    console.error("Excepción en adminPublishEventAction:", err);
    return { success: false, error: "Error inesperado del servidor." };
  }
}

/**
 * Server Action para cambiar el estado activo/inactivo de un evento
 */
export async function toggleEventoActivoAction(eventoId: string, nuevoEstado: boolean) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      console.warn("toggleEventoActivoAction: Usuario no autenticado.");
      return { success: false, error: "No autenticado" };
    }

    const { error } = await supabase
      .from("eventos")
      .update({ activo: nuevoEstado })
      .eq("id", eventoId);

    if (error) {
      console.error("Error al actualizar evento en Supabase:", error);
      return { success: false, error: error.message };
    }

    revalidatePath(`/[locale]/admin`, "page");
    revalidatePath(`/[locale]/minca`, "page");
    return { success: true };
  } catch (err) {
    console.error("Excepción en toggleEventoActivoAction:", err);
    return { success: false };
  }
}

/**
 * Server Action para actualizar el plan y vencimiento de un Aliado / Negocio.
 * Usado por el Admin al registrar pagos por Nequi/Daviplata o acuerdos comerciales.
 */
export async function actualizarPlanNegocioAction(
  negocioId: string,
  nuevoPlan: PlanNegocio,
  diasVigencia?: number
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "No autorizado." };
    }

    let planExpiraEn: string | null = null;
    if (nuevoPlan !== "gratis" && diasVigencia && diasVigencia > 0) {
      const expira = new Date();
      expira.setDate(expira.getDate() + diasVigencia);
      planExpiraEn = expira.toISOString();
    }

    const { error } = await supabase
      .from("negocios")
      .update({
        plan: nuevoPlan,
        plan_expira_en: planExpiraEn,
      })
      .eq("id", negocioId);

    if (error) {
      console.error("Error al actualizar plan del negocio:", error);
      return { success: false, error: error.message };
    }

    revalidatePath(`/[locale]/admin`, "page");
    revalidatePath(`/[locale]/admin/aliados`, "page");
    revalidatePath(`/[locale]/minca`, "page");

    return { success: true };
  } catch (err) {
    console.error("Excepción en actualizarPlanNegocioAction:", err);
    return { success: false, error: "Error inesperado al actualizar plan." };
  }
}

/**
 * Server Action para alternar el estado destacado de un evento (Monetización por visibilidad).
 */
export async function toggleEventoDestacadoAction(eventoId: string, nuevoEstado: boolean) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      console.warn("toggleEventoDestacadoAction: Usuario no autenticado.");
      return { success: false, error: "No autenticado" };
    }

    const { error } = await supabase
      .from("eventos")
      .update({ destacado: nuevoEstado })
      .eq("id", eventoId);

    if (error) {
      console.error("Error al actualizar destacado en Supabase:", error);
      return { success: false, error: error.message };
    }

    revalidatePath(`/[locale]/admin`, "page");
    revalidatePath(`/[locale]/minca`, "page");
    return { success: true };
  } catch (err) {
    console.error("Excepción en toggleEventoDestacadoAction:", err);
    return { success: false };
  }
}

/**
 * Server Action para importar el lote de eventos y aliados reales extraídos de WhatsApp.
 * Requiere que el admin tenga sesión activa.
 */
export async function importarLoteEventosRealesAction() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Debes iniciar sesión en el panel admin para importar." };
    }

    // 1. Obtener zona Minca
    const { data: zona, error: zonaError } = await supabase
      .from("zonas")
      .select("id")
      .eq("slug", "minca")
      .single();

    if (zonaError || !zona) {
      return { success: false, error: "Zona Minca no encontrada." };
    }

    // 2. Definición de negocios reales
    const negociosData = [
      {
        nombre: "Cacao Cultural",
        descripcion: "Espacio de encuentro, cine comunitario, creatividad y cultura en Minca",
        categoria: "arte",
        whatsapp: "573013010194",
        instagram: "@cacaocultural",
        plan: "pro" as PlanNegocio,
      },
      {
        nombre: "Jam Birding Minca",
        descripcion: "Avistamiento de aves en la Sierra Nevada con guía especializado Jam",
        categoria: "tours",
        whatsapp: "573005554433",
        instagram: "@jambirding",
        plan: "pro" as PlanNegocio,
      },
      {
        nombre: "Feeling Bar Minca",
        descripcion: "Restaurante y bar con sabores frescos, menú del día y coctelería en el centro de Minca",
        categoria: "comida",
        whatsapp: "573013010194",
        instagram: "@feelingbarminca",
        plan: "gratis" as PlanNegocio,
      },
      {
        nombre: "Finca La Frecuencia",
        descripcion: "Espacio de bienestar holístico, sauna de leña, meditación, cacao sensorial y movimiento",
        categoria: "bienestar",
        whatsapp: "573126040206",
        instagram: "@fincalafrecuencia",
        plan: "pro" as PlanNegocio,
      },
      {
        nombre: "Casa Cora Minca",
        descripcion: "Capacitaciones profesionales de coctelería, mixología y talleres en Minca",
        categoria: "comida",
        whatsapp: "573107276072",
        instagram: "@casa_cora_minca",
        plan: "gratis" as PlanNegocio,
      },
      {
        nombre: "Dhamma Gutti (Vipassana)",
        descripcion: "Centro de meditación y cursos de Vipassana y Anapana en Colombia",
        categoria: "bienestar",
        whatsapp: "573045252997",
        instagram: null,
        plan: "gratis" as PlanNegocio,
      },
    ];

    const mapaNegocios: Record<string, string> = {};

    for (const neg of negociosData) {
      const { data: existente } = await supabase
        .from("negocios")
        .select("id")
        .eq("zona_id", zona.id)
        .ilike("nombre", neg.nombre)
        .maybeSingle();

      if (existente) {
        mapaNegocios[neg.nombre] = existente.id;
        await supabase
          .from("negocios")
          .update({
            descripcion: neg.descripcion,
            whatsapp: neg.whatsapp,
            instagram: neg.instagram,
          })
          .eq("id", existente.id);
      } else {
        const { data: nuevo, error: negErr } = await supabase
          .from("negocios")
          .insert({
            zona_id: zona.id,
            user_id: user.id,
            nombre: neg.nombre,
            descripcion: neg.descripcion,
            categoria: neg.categoria,
            whatsapp: neg.whatsapp,
            instagram: neg.instagram,
            plan: neg.plan,
            activo: true,
          })
          .select("id")
          .single();

        if (!negErr && nuevo) {
          mapaNegocios[neg.nombre] = nuevo.id;
        }
      }
    }

    // 3. Definición de eventos reales
    const eventosData = [
      {
        negocioNombre: "Cacao Cultural",
        titulo: "Velada Especial Cine 40: Páramos II — El Origen",
        descripcion: "Proyección simultánea nacional y documental ambiental sobre los páramos de Colombia. Una película, muchos territorios, un mismo momento.",
        tipo: "arte",
        precio: 0,
        fechaInicio: "2026-10-15T19:00:00-05:00",
        fechaFin: "2026-10-15T21:00:00-05:00",
        imagenUrl: "https://gvrroyncnrnjsaldlges.supabase.co/storage/v1/object/public/eventos/eventos_reales/cine40-paramos.webp",
        destacado: true,
      },
      {
        negocioNombre: "Cacao Cultural",
        titulo: "La Hora del Río — Conversatorio en Cine 40",
        descripcion: "Un espacio de reflexión en comunidad para aportar al cuidado, conservación y futuro de nuestro río Minca.",
        tipo: "arte",
        precio: 0,
        fechaInicio: "2026-10-15T19:00:00-05:00",
        fechaFin: "2026-10-15T21:30:00-05:00",
        imagenUrl: "https://gvrroyncnrnjsaldlges.supabase.co/storage/v1/object/public/eventos/eventos_reales/la-hora-del-rio.webp",
        destacado: false,
      },
      {
        negocioNombre: "Jam Birding Minca",
        titulo: "Tour Matutino de Avistamiento de Aves (6:00 AM)",
        descripcion: "Caminata de 150 minutos alrededor de Minca con guía de avistamiento Jam. Observación de aves: Turpiales, Tórtolas, Espigueros, Tucanes y Colibríes. Visita a plataforma Torre del Sol vía San Rafael. Binoculares incluidos.",
        tipo: "tours",
        precio: 75000,
        fechaInicio: "2026-10-16T06:00:00-05:00",
        fechaFin: "2026-10-16T08:30:00-05:00",
        imagenUrl: "https://gvrroyncnrnjsaldlges.supabase.co/storage/v1/object/public/eventos/eventos_reales/jam-birding.webp",
        destacado: true,
      },
      {
        negocioNombre: "Feeling Bar Minca",
        titulo: "Menú del Día y Almuerzos en Feeling Bar",
        descripcion: "Pasta penne en pesto de la casa, cerdo a la plancha en salsa de maracuyá, lentejas, ensalada fresca y jugo del día natural. Sabores frescos con mucho amor.",
        tipo: "comida",
        precio: 20000,
        fechaInicio: "2026-10-15T12:00:00-05:00",
        fechaFin: "2026-10-15T16:00:00-05:00",
        imagenUrl: "https://gvrroyncnrnjsaldlges.supabase.co/storage/v1/object/public/eventos/eventos_reales/feeling-bar-almuerzo.webp",
        destacado: false,
      },
      {
        negocioNombre: "Dhamma Gutti (Vipassana)",
        titulo: "Meditación Anapana para Niñ@s (8 a 12 años)",
        descripcion: "Taller de meditación y respiración consciente para niños de 8 a 12 años. Lugar: Colegio de Minca 'I.E.D Técnica de Minca'. Inscripción previa por WhatsApp.",
        tipo: "bienestar",
        precio: 0,
        fechaInicio: "2026-10-17T09:00:00-05:00",
        fechaFin: "2026-10-17T12:00:00-05:00",
        imagenUrl: "https://gvrroyncnrnjsaldlges.supabase.co/storage/v1/object/public/eventos/eventos_reales/meditacion-anapana-ninos.webp",
        destacado: false,
      },
      {
        negocioNombre: "Casa Cora Minca",
        titulo: "Capacitaciones y Talleres de Coctelería — Casa Cora",
        descripcion: "Cursos desde Introducción a la Coctelería (Nivel 1), Técnicas y Presentación (Nivel 2), hasta Working Flair (Nivel 3). Talleres complementarios: Cerveza de Jengibre e Inglés de servicio.",
        tipo: "comida",
        precio: 333000,
        fechaInicio: "2026-10-19T09:00:00-05:00",
        fechaFin: "2026-10-23T13:00:00-05:00",
        imagenUrl: "https://gvrroyncnrnjsaldlges.supabase.co/storage/v1/object/public/eventos/eventos_reales/casa-cora-cocteleria.webp",
        destacado: false,
      },
      {
        negocioNombre: "Finca La Frecuencia",
        titulo: "Bounce & Acupuntura Comunitaria — Finca La Frecuencia",
        descripcion: "Si el tai chi, sound healing y ecstatic dance tuvieran un hijo, sería Bounce. Explora el cuerpo con respiración y movimiento. Luego, sesión grupal de acupuntura.",
        tipo: "bienestar",
        precio: 0,
        fechaInicio: "2026-10-24T10:00:00-05:00",
        fechaFin: "2026-10-24T16:00:00-05:00",
        imagenUrl: "https://gvrroyncnrnjsaldlges.supabase.co/storage/v1/object/public/eventos/eventos_reales/finca-la-frecuencia.webp",
        destacado: true,
      },
      {
        negocioNombre: "Finca La Frecuencia",
        titulo: "Sauna de Leña & Baño de Sonido — Finca La Frecuencia",
        descripcion: "Para habitar la presencia y la escucha interior. Sauna de leña acompañado de exploración vocal de sonido y vibración, círculo de cantos sagrados y meditación.",
        tipo: "bienestar",
        precio: 0,
        fechaInicio: "2026-10-25T10:00:00-05:00",
        fechaFin: "2026-10-25T14:00:00-05:00",
        imagenUrl: "https://gvrroyncnrnjsaldlges.supabase.co/storage/v1/object/public/eventos/eventos_reales/finca-la-frecuencia.webp",
        destacado: true,
      },
      {
        negocioNombre: "Finca La Frecuencia",
        titulo: "Cacao Sensorial & Ecstatic Dance en Disfraces",
        descripcion: "Un viaje musical para depurar y regular activamente el sistema nervioso. Cacao, DJ en vivo, baile, ojos vendados y visualización para sacudir lo estancado.",
        tipo: "bienestar",
        precio: 0,
        fechaInicio: "2026-10-31T10:00:00-05:00",
        fechaFin: "2026-10-31T14:00:00-05:00",
        imagenUrl: "https://gvrroyncnrnjsaldlges.supabase.co/storage/v1/object/public/eventos/eventos_reales/finca-la-frecuencia.webp",
        destacado: true,
      },
    ];

    let insertadosCount = 0;

    for (const ev of eventosData) {
      const negId = mapaNegocios[ev.negocioNombre];
      if (!negId) continue;

      // Verificar si ya existe un evento con el mismo título en ese negocio
      const { data: evExistente } = await supabase
        .from("eventos")
        .select("id")
        .eq("negocio_id", negId)
        .ilike("titulo", ev.titulo)
        .maybeSingle();

      if (!evExistente) {
        await supabase.from("eventos").insert({
          negocio_id: negId,
          zona_id: zona.id,
          titulo: ev.titulo,
          descripcion: ev.descripcion,
          tipo: ev.tipo,
          precio: ev.precio > 0 ? ev.precio : 0,
          precio_moneda: "COP",
          fecha_inicio: ev.fechaInicio,
          fecha_fin: ev.fechaFin,
          imagen_url: ev.imagenUrl,
          destacado: ev.destacado,
          tiene_boleteria: false,
          activo: true,
        });
        insertadosCount++;
      }
    }

    revalidatePath(`/[locale]/admin`, "page");
    revalidatePath(`/[locale]/admin/aliados`, "page");
    revalidatePath(`/[locale]/minca`, "page");

    return { success: true, count: insertadosCount };
  } catch (err: any) {
    console.error("Excepción en importarLoteEventosRealesAction:", err);
    return { success: false, error: err?.message || "Error al procesar la carga." };
  }
}

export interface EditarEventoAdminInput {
  eventoId: string;
  titulo: string;
  descripcion?: string | null;
  tipo: CategoriaEvento;
  precio: number;
  dateTime: string;
  fechaFin?: string | null;
  imageUrl?: string;
  destacado: boolean;
  activo: boolean;
  negocioId?: string;
}

/**
 * Server Action para actualizar todos los campos de un evento desde el Admin.
 */
export async function editarEventoAdminAction(input: EditarEventoAdminInput) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Debes iniciar sesión para editar." };
    }

    const updatePayload: Record<string, any> = {
      titulo: input.titulo.trim(),
      descripcion: input.descripcion?.trim() || null,
      tipo: input.tipo,
      precio: input.precio >= 0 ? input.precio : 0,
      fecha_inicio: parseLocalColombiaAISO(input.dateTime),
      fecha_fin: input.fechaFin ? parseLocalColombiaAISO(input.fechaFin) : null,
      destacado: Boolean(input.destacado),
      activo: Boolean(input.activo),
    };

    if (input.imageUrl) {
      updatePayload.imagen_url = input.imageUrl;
    }

    if (input.negocioId) {
      updatePayload.negocio_id = input.negocioId;
    }

    const { error } = await supabase
      .from("eventos")
      .update(updatePayload)
      .eq("id", input.eventoId);

    if (error) {
      console.error("Error al actualizar evento:", error);
      return { success: false, error: error.message };
    }

    revalidatePath(`/[locale]/admin`, "page");
    revalidatePath(`/[locale]/minca`, "page");
    revalidatePath(`/[locale]/minca/${input.eventoId}`, "page");

    return { success: true };
  } catch (err: any) {
    console.error("Excepción en editarEventoAdminAction:", err);
    return { success: false, error: err?.message || "Error al actualizar evento." };
  }
}

/**
 * Server Action para eliminar permanentemente un evento desde el Admin.
 */
export async function eliminarEventoAdminAction(eventoId: string) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Debes iniciar sesión para eliminar." };
    }

    const { error } = await supabase
      .from("eventos")
      .delete()
      .eq("id", eventoId);

    if (error) {
      console.error("Error al eliminar evento:", error);
      return { success: false, error: error.message };
    }

    revalidatePath(`/[locale]/admin`, "page");
    revalidatePath(`/[locale]/minca`, "page");

    return { success: true };
  } catch (err: any) {
    console.error("Excepción en eliminarEventoAdminAction:", err);
    return { success: false, error: err?.message || "Error al eliminar evento." };
  }
}

export interface EditarAliadoInput {
  id: string;
  nombre: string;
  categoria: CategoriaEvento;
  whatsapp: string;
  instagram?: string | null;
  descripcion?: string | null;
  activo: boolean;
  plan: PlanNegocio;
  diasVigencia?: number;
  sincronizarPublicaciones?: boolean;
}

/**
 * Server Action para editar completamente los datos de un Aliado comercial.
 */
export async function editarAliadoCompletoAction(input: EditarAliadoInput) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Debes iniciar sesión para editar." };
    }

    if (!input.nombre?.trim() || input.nombre.trim().length < 2) {
      return { success: false, error: "El nombre del aliado debe tener al menos 2 caracteres." };
    }

    // Normalizar WhatsApp
    let cleanWa = input.whatsapp.replace(/\D/g, "");
    if (cleanWa.length === 10 && cleanWa.startsWith("3")) {
      cleanWa = `57${cleanWa}`;
    }
    if (cleanWa.length < 8) {
      return { success: false, error: "El número de WhatsApp no es válido." };
    }

    // Normalizar Instagram
    const cleanIg = input.instagram?.replace(/^@+/, "").trim() || null;

    // Calcular vigencia del plan si aplica
    let planExpiraEn: string | null = null;
    if (input.plan !== "gratis" && input.diasVigencia && input.diasVigencia > 0) {
      const expira = new Date();
      expira.setDate(expira.getDate() + input.diasVigencia);
      planExpiraEn = expira.toISOString();
    }

    const updatePayload: Record<string, any> = {
      nombre: input.nombre.trim(),
      categoria: input.categoria,
      whatsapp: cleanWa,
      instagram: cleanIg,
      descripcion: input.descripcion?.trim() || null,
      activo: input.activo,
      plan: input.plan,
    };

    if (input.plan === "gratis") {
      updatePayload.plan_expira_en = null;
    } else if (planExpiraEn) {
      updatePayload.plan_expira_en = planExpiraEn;
    }

    const { error } = await supabase
      .from("negocios")
      .update(updatePayload)
      .eq("id", input.id);

    if (error) {
      console.error("Error al actualizar aliado:", error);
      return { success: false, error: error.message };
    }

    // Si el usuario solicita sincronizar publicaciones al desactivar/activar
    if (input.sincronizarPublicaciones) {
      await supabase
        .from("eventos")
        .update({ activo: input.activo })
        .eq("negocio_id", input.id);
    }

    revalidatePath(`/[locale]/admin`, "page");
    revalidatePath(`/[locale]/admin/aliados`, "page");
    revalidatePath(`/[locale]/minca`, "page");

    return { success: true };
  } catch (err: any) {
    console.error("Excepción en editarAliadoCompletoAction:", err);
    return { success: false, error: err?.message || "Error al actualizar aliado." };
  }
}

/**
 * Server Action para alternar rápidamente el estado activo/inactivo de un Aliado con 1 clic.
 */
export async function toggleActivoAliadoAction(
  negocioId: string,
  nuevoEstado: boolean,
  sincronizarPublicaciones: boolean = true
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "No autenticado." };
    }

    const { error } = await supabase
      .from("negocios")
      .update({ activo: nuevoEstado })
      .eq("id", negocioId);

    if (error) {
      console.error("Error al alternar estado del aliado:", error);
      return { success: false, error: error.message };
    }

    if (sincronizarPublicaciones) {
      await supabase
        .from("eventos")
        .update({ activo: nuevoEstado })
        .eq("negocio_id", negocioId);
    }

    revalidatePath(`/[locale]/admin`, "page");
    revalidatePath(`/[locale]/admin/aliados`, "page");
    revalidatePath(`/[locale]/minca`, "page");

    return { success: true };
  } catch (err: any) {
    console.error("Excepción en toggleActivoAliadoAction:", err);
    return { success: false, error: err?.message || "Error al alternar estado." };
  }
}



