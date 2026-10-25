"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { parseLocalColombiaAISO } from "@/lib/utils";
import { traducirEventoCompleto } from "@/lib/translations/translator";
import type { CategoriaEvento, PlanNegocio, CategoriaServicioEsencial, ServicioEsencial } from "@/lib/types";
import sharp from "sharp";

export interface AdminPublishInput {
  negocioId?: string;
  businessName: string;
  whatsapp: string;
  instagram?: string;
  eventTitle: string;
  category: CategoriaEvento;
  dateTime: string;
  fechaFin?: string | null;
  price: number;
  description: string;
  imageUrl?: string;
  videoUrl?: string;
  isFeatured?: boolean;
  zonaSlug: string;
  googleReputacion?: {
    rating: number;
    total_reviews: number;
    maps_url: string;
  };
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
    if (input.negocioId) {
      negocioId = input.negocioId;
      if (input.whatsapp) {
        await supabase
          .from("negocios")
          .update({
            whatsapp: input.whatsapp.replace(/\D/g, ""),
            instagram: input.instagram?.trim() || null,
          })
          .eq("id", negocioId);
      }
    } else {
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
    }

    // 4. Generar traducciones automáticas (EN, DE, FR)
    let traducciones: Record<string, any> = {};
    try {
      traducciones = await traducirEventoCompleto(input.eventTitle.trim(), input.description.trim() || null);
    } catch (e) {
      console.warn("No se pudieron generar traducciones automáticas al publicar:", e);
    }

    // 5. Crear evento con soporte de columna traducciones
    const basePayload = {
      negocio_id: negocioId,
      zona_id: zona.id,
      titulo: input.eventTitle.trim(),
      descripcion: input.description.trim() || null,
      tipo: input.category,
      precio: input.price > 0 ? input.price : 0,
      precio_moneda: "COP",
      fecha_inicio: parseLocalColombiaAISO(input.dateTime),
      fecha_fin: input.fechaFin ? parseLocalColombiaAISO(input.fechaFin) : null,
      imagen_url:
        input.imageUrl ||
        "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&q=80",
      video_url: input.videoUrl || null,
      destacado: Boolean(input.isFeatured),
      tiene_boleteria: false,
      activo: true,
      metadata_hospedaje: input.googleReputacion
        ? { google_reputacion: input.googleReputacion }
        : null,
    };

    let { data: nuevoEvento, error: evError } = await supabase
      .from("eventos")
      .insert({ ...basePayload, traducciones })
      .select("id")
      .single();

    // Fallback retrocompatible si la columna traducciones aún no existe en Supabase
    if (evError && evError.code === "42703") {
      const fallbackRes = await supabase
        .from("eventos")
        .insert(basePayload)
        .select("id")
        .single();
      nuevoEvento = fallbackRes.data;
      evError = fallbackRes.error;
    }

    if (evError || !nuevoEvento) {
      return { success: false, error: "Error al registrar el evento en Supabase." };
    }

    // Revalidar inmediatamente todo el sitio (CDN y rutas públicas en todos los idiomas)
    revalidatePath("/", "layout");
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
    revalidatePath(`/[locale]/admin/hospedajes`, "page");
    revalidatePath(`/[locale]/minca`, "page");
    revalidatePath(`/[locale]/mendihuaca`, "page");
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
    revalidatePath(`/[locale]/mendihuaca`, "page");

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
    revalidatePath(`/[locale]/admin/hospedajes`, "page");
    revalidatePath(`/[locale]/minca`, "page");
    revalidatePath(`/[locale]/mendihuaca`, "page");
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
      {
        nombre: "La Veranda Hotels",
        descripcion: "Hotel boutique y descanso en Minca. Naturaleza, piscina y desconexión total en la Sierra Nevada.",
        categoria: "hospedaje",
        whatsapp: "573123614904",
        instagram: "@laverandahotels",
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
        descripcion:
          "Avistamiento de aves en Minca con el guía especializado Jam. Salidas casi a diario a las 6:00 AM desde el puente de Minca hacia la plataforma de observación Torre del Sol (vía San Rafael).\n\n• Duración: 3 horas y media de caminata ecológica.\n• Avistamiento: Turpiales, Tórtolas, Espigueros, Tucanes y variedad de Colibríes de la Sierra Nevada.\n• Incluye: Acompañamiento de guía local experto y uso de binoculares.\n• Punto de encuentro: Puente de Minca (6:00 AM).\n• Valor: $75.000 COP por persona.\n\n<!--recurrente:0,1,2,3,4,5,6-->",
        tipo: "tours",
        precio: 75000,
        fechaInicio: "2026-10-16T06:00:00-05:00",
        fechaFin: "2026-12-31T09:30:00-05:00",
        imagenUrl: "https://gvrroyncnrnjsaldlges.supabase.co/storage/v1/object/public/eventos/eventos_reales/jam-birding.webp",
        destacado: true,
      },
      {
        negocioNombre: "Feeling Bar Minca",
        titulo: "Menú del Día en Feeling Bar — Rollitos de Repollo",
        descripcion: `🌿🍽️ ¡Hoy en Feeling – Menú del Día! 😋

🥬 Rollitos de repollo rellenos de carne molida 
🥔 Papas cocidas o arroz
🥗 Ensalada fresca
🍲 Sopa de frijoles negros
🍋 Limonada natural

💰 ¡Todo por solo $20.000 COP!

❤️ Comida casera, fresca y llena de sabor, preparada con amor.

📍 ¡Te esperamos en Feeling, Minca! 🌴✨
(📸 Imagen de referencia - la realidad es más rica)

📲 Escríbenos y haz tu pedido o reserva tu mesa.

<!--recurrente:1,2,3,4,5,6,0-->`,
        tipo: "comida",
        precio: 20000,
        fechaInicio: "2026-10-16T12:00:00-05:00",
        fechaFin: "2026-11-30T16:30:00-05:00",
        imagenUrl: "https://gvrroyncnrnjsaldlges.supabase.co/storage/v1/object/public/eventos/eventos_reales/feeling-menu-rollitos.webp",
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
        identificadorClave: "cacao-sound",
        titulo: "Cacao Sensorial & Sound Bath",
        descripcion: "Para bajar de la mente al cuerpo y activar tu poder creador. Cacao, música, movimiento, ojos vendados y visualización para crear desde el corazón. Cerramos con un exquisito baño de sonido para integrar.",
        tipo: "bienestar" as const,
        precio: 0,
        fechaInicio: "2026-10-10T10:00:00-05:00",
        fechaFin: "2026-10-10T14:00:00-05:00",
        imagenUrl: "https://gvrroyncnrnjsaldlges.supabase.co/storage/v1/object/public/eventos/eventos_reales/cacao-sensorial.webp",
        destacado: true,
      },
      {
        negocioNombre: "Finca La Frecuencia",
        identificadorClave: "caminata",
        titulo: "Caminata en Silencio — Meditación Activa",
        descripcion: "La montaña tiene un mensaje para ti. Explora el poder del silencio en esta meditación activa diseñada para enraizarnos con la Madre Tierra y cultivar nuestras cualidades yin de receptividad. Guiada por Jesse Blazo.",
        tipo: "bienestar" as const,
        precio: 0,
        fechaInicio: "2026-10-12T09:30:00-05:00",
        fechaFin: "2026-10-12T11:30:00-05:00",
        imagenUrl: "https://gvrroyncnrnjsaldlges.supabase.co/storage/v1/object/public/eventos/eventos_reales/caminata.webp",
        destacado: true,
      },
      {
        negocioNombre: "Finca La Frecuencia",
        identificadorClave: "bounce",
        titulo: "Bounce & Acupuntura Comunitaria",
        descripcion: "Si el tai chi, el sound healing y el ecstatic dance tuvieran un hijo, sería Bounce. Explora nuevas formas de habitar el cuerpo con la respiración, el sonido y el movimiento. Luego, quédate para una sesión comunitaria de acupuntura.",
        tipo: "bienestar" as const,
        precio: 0,
        fechaInicio: "2026-10-24T10:00:00-05:00",
        fechaFin: "2026-10-24T16:00:00-05:00",
        imagenUrl: "https://gvrroyncnrnjsaldlges.supabase.co/storage/v1/object/public/eventos/eventos_reales/acupuntura.webp",
        destacado: true,
      },
      {
        negocioNombre: "Finca La Frecuencia",
        identificadorClave: "sauna",
        titulo: "Sauna de Leña & Sonido",
        descripcion: "Para habitar la presencia y la escucha interior. Nuestro sauna de leña acompañado de una exploración vocal de sonido y vibración. Abrimos con un círculo de cantos sagrados. Cerramos en silencio y meditación.",
        tipo: "bienestar" as const,
        precio: 0,
        fechaInicio: "2026-10-25T10:00:00-05:00",
        fechaFin: "2026-10-25T14:00:00-05:00",
        imagenUrl: "https://gvrroyncnrnjsaldlges.supabase.co/storage/v1/object/public/eventos/eventos_reales/sauna.webp",
        destacado: true,
      },
      {
        negocioNombre: "Finca La Frecuencia",
        identificadorClave: "cacao-danza",
        titulo: "Cacao Sensorial & Ecstatic Dance en Disfraces",
        descripcion: "Un viaje musical para depurar y regular activamente el sistema nervioso. Cacao, DJ en vivo, baile, ojos vendados y visualización para sacudir lo estancado, liberar emociones y entregarte a la catarsis somática.",
        tipo: "bienestar" as const,
        precio: 0,
        fechaInicio: "2026-10-31T10:00:00-05:00",
        fechaFin: "2026-10-31T14:00:00-05:00",
        imagenUrl: "https://gvrroyncnrnjsaldlges.supabase.co/storage/v1/object/public/eventos/eventos_reales/cacao-danza.webp",
        destacado: true,
      },
      {
        negocioNombre: "La Veranda Hotels",
        titulo: "Escápate a Minca en Octubre — 3x2 en La Veranda Hotels",
        descripcion: `✨ ¡Escápate a Minca en octubre! ✨

🏡 Reserva 2 noches y recibe la tercera GRATIS en La Veranda Hotels.

💦 Descanso, naturaleza y piscina te esperan en la Sierra Nevada.

📲 ¡Escríbenos y reserva directamente con nosotros!

#LaVerandaExperience #Minca #SantaMarta

<!--recurrente:1,2,3,4,5,6,0-->`,
        tipo: "hospedaje",
        precio: null,
        fechaInicio: "2026-10-16T09:00:00-05:00",
        fechaFin: "2026-10-31T23:59:00-05:00",
        imagenUrl: "https://gvrroyncnrnjsaldlges.supabase.co/storage/v1/object/public/eventos/eventos_reales/laveranda.webp",
        destacado: false,
      },
    ];

    let insertadosCount = 0;

    for (const ev of eventosData) {
      const negId = mapaNegocios[ev.negocioNombre];
      if (!negId) continue;

      // Buscar si ya existe un evento similar en ese negocio
      let evExistente = null;
      const clave = (ev as any).identificadorClave;
      if (clave === "bounce") {
        const { data } = await supabase.from("eventos").select("id").eq("negocio_id", negId).ilike("titulo", "%Bounce%").maybeSingle();
        evExistente = data;
      } else if (clave === "sauna") {
        const { data } = await supabase.from("eventos").select("id").eq("negocio_id", negId).ilike("titulo", "%Sauna%").maybeSingle();
        evExistente = data;
      } else if (clave === "cacao-danza") {
        const { data } = await supabase.from("eventos").select("id").eq("negocio_id", negId).ilike("titulo", "%Ecstatic%").maybeSingle();
        evExistente = data;
      } else {
        const { data } = await supabase.from("eventos").select("id").eq("negocio_id", negId).ilike("titulo", ev.titulo).maybeSingle();
        evExistente = data;
      }

      if (evExistente) {
        // Actualizar el evento existente con su nueva imagen WebP y texto pulido
        await supabase.from("eventos").update({
          titulo: ev.titulo,
          descripcion: ev.descripcion,
          tipo: ev.tipo,
          precio: ev.precio && ev.precio > 0 ? ev.precio : 0,
          precio_moneda: "COP",
          fecha_inicio: ev.fechaInicio,
          fecha_fin: ev.fechaFin,
          imagen_url: ev.imagenUrl,
          destacado: ev.destacado,
          activo: true,
        }).eq("id", evExistente.id);
        insertadosCount++;
      } else {
        // Insertar el nuevo evento
        await supabase.from("eventos").insert({
          negocio_id: negId,
          zona_id: zona.id,
          titulo: ev.titulo,
          descripcion: ev.descripcion,
          tipo: ev.tipo,
          precio: ev.precio && ev.precio > 0 ? ev.precio : 0,
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
    revalidatePath(`/[locale]/mendihuaca`, "page");

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
  videoUrl?: string | null;
  destacado: boolean;
  activo: boolean;
  negocioId?: string;
  googleReputacion?: {
    rating: number;
    total_reviews: number;
    maps_url: string;
  } | null;
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

    if (input.videoUrl !== undefined) {
      updatePayload.video_url = input.videoUrl;
    }

    if (input.negocioId) {
      updatePayload.negocio_id = input.negocioId;
    }

    if (input.googleReputacion !== undefined) {
      const { data: currentEvent } = await supabase
        .from("eventos")
        .select("metadata_hospedaje")
        .eq("id", input.eventoId)
        .single();
      const currentMeta = (currentEvent?.metadata_hospedaje as Record<string, any>) || {};
      if (input.googleReputacion === null) {
        delete currentMeta.google_reputacion;
        updatePayload.metadata_hospedaje = Object.keys(currentMeta).length > 0 ? currentMeta : null;
      } else {
        updatePayload.metadata_hospedaje = {
          ...currentMeta,
          google_reputacion: input.googleReputacion,
        };
      }
    }

    try {
      const traducciones = await traducirEventoCompleto(input.titulo.trim(), input.descripcion?.trim() || null);
      updatePayload.traducciones = traducciones;
    } catch (e) {
      console.warn("No se pudieron generar traducciones automáticas al editar:", e);
    }

    let { data: updatedRows, error } = await supabase
      .from("eventos")
      .update(updatePayload)
      .eq("id", input.eventoId)
      .select("id");

    if (error && error.code === "42703") {
      delete updatePayload.traducciones;
      const fallbackRes = await supabase
        .from("eventos")
        .update(updatePayload)
        .eq("id", input.eventoId)
        .select("id");
      updatedRows = fallbackRes.data;
      error = fallbackRes.error;
    }

    if (error) {
      console.error("Error al actualizar evento:", error);
      return { success: false, error: error.message };
    }

    if (!updatedRows || updatedRows.length === 0) {
      console.warn("Advertencia: No se modificó ninguna fila en Supabase (posible política RLS).");
    }

    // Revalidar inmediatamente todo el sitio y todas las rutas públicas y de administración
    revalidatePath("/", "layout");
    revalidatePath("/[locale]/admin", "page");
    revalidatePath("/[locale]/[zona]", "page");
    revalidatePath("/[locale]/[zona]/[id]", "page");

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
    revalidatePath(`/[locale]/admin/hospedajes`, "page");
    revalidatePath(`/[locale]/minca`, "page");
    revalidatePath(`/[locale]/mendihuaca`, "page");

    return { success: true };
  } catch (err: any) {
    console.error("Excepción en eliminarEventoAdminAction:", err);
    return { success: false, error: err?.message || "Error al eliminar evento." };
  }
}

/**
 * Server Action para eliminar permanentemente un Aliado y sus eventos asociados desde el Admin.
 */
export async function eliminarAliadoAdminAction(negocioId: string) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Debes iniciar sesión para eliminar." };
    }

    // 1. Verificar si el aliado tiene eventos asociados
    const { data: eventosAsociados } = await supabase
      .from("eventos")
      .select("id")
      .eq("negocio_id", negocioId);

    const tieneEventos = eventosAsociados && eventosAsociados.length > 0;

    // Si tiene eventos, eliminamos solo los eventos de este aliado específico
    if (tieneEventos) {
      const { error: errorEventos } = await supabase
        .from("eventos")
        .delete()
        .eq("negocio_id", negocioId);

      if (errorEventos) {
        console.warn("Advertencia al eliminar eventos del negocio:", errorEventos);
      }
    }

    // 2. Eliminar el registro del negocio verificando que la fila haya sido removida
    const { data: deletedRows, error: errorNegocio } = await supabase
      .from("negocios")
      .delete()
      .eq("id", negocioId)
      .select("id");

    if (errorNegocio) {
      console.error("Error al eliminar negocio:", errorNegocio);
      return { success: false, error: errorNegocio.message };
    }

    // Si la fila no se borró físicamente (por restricción RLS en Supabase):
    if (!deletedRows || deletedRows.length === 0) {
      // Como medida de seguridad inmediata para que no aparezca en pantalla, lo desactivamos:
      await supabase
        .from("negocios")
        .update({ activo: false })
        .eq("id", negocioId);

      revalidatePath(`/[locale]/admin/aliados`, "page");
      return {
        success: false,
        error: "Supabase protegió el registro por políticas de seguridad (RLS). Para eliminarlo permanentemente, ejecuta el script SQL provisto en el SQL Editor de Supabase.",
      };
    }

    revalidatePath(`/[locale]/admin`, "page");
    revalidatePath(`/[locale]/admin/aliados`, "page");
    revalidatePath(`/[locale]/minca`, "page");
    revalidatePath(`/[locale]/mendihuaca`, "page");

    return { success: true };
  } catch (err: any) {
    console.error("Excepción en eliminarAliadoAdminAction:", err);
    return { success: false, error: err?.message || "Error al eliminar aliado." };
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
    revalidatePath(`/[locale]/mendihuaca`, "page");

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
    revalidatePath(`/[locale]/mendihuaca`, "page");

    return { success: true };
  } catch (err: any) {
    console.error("Excepción en toggleActivoAliadoAction:", err);
    return { success: false, error: err?.message || "Error al alternar estado." };
  }
}

// ─── GESTIÓN DE HOSPEDAJES (SERVER ACTIONS) ─────────────────────────────────

export interface GuardarHospedajeInput {
  id?: string; // Si viene id es edición, si no es nuevo
  nombreNegocio: string;
  whatsapp: string;
  instagram?: string;
  titulo: string;
  descripcion: string;
  zonaSlug: string;
  imagenUrl: string;
  destacado?: boolean;
  metadataHospedaje: {
    check_in_hora?: string;
    check_out_hora?: string;
    google_reputacion?: {
      rating: number;
      total_reviews: number;
      maps_url: string;
    };
    habitaciones: Array<{
      id: string;
      titulo: string;
      descripcion?: string;
      precio_noche_cop: number;
      capacidad_max: number;
      fotos: string[];
      badges: Array<{ icono: string; texto: string }>;
    }>;
  };
}

export async function guardarHospedajeAction(input: GuardarHospedajeInput) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "No autorizado. Inicia sesión." };
    }

    // 1. Obtener ID de la zona
    const { data: zona, error: zonaError } = await supabase
      .from("zonas")
      .select("id")
      .eq("slug", input.zonaSlug)
      .eq("activa", true)
      .single();

    if (zonaError || !zona) {
      return { success: false, error: "Zona no válida o inactiva." };
    }

    // 2. Buscar o crear negocio (aliado de hospedaje) con prevención estricta de duplicados
    let negocioId = "";
    let cleanPhone = input.whatsapp.replace(/\D/g, "");
    if (cleanPhone.length === 10 && cleanPhone.startsWith("3")) {
      cleanPhone = `57${cleanPhone}`;
    }
    const nombreLimpio = input.nombreNegocio.trim();

    // 2.1 Buscar primero por teléfono exacto
    let existingNegocio: { id: string } | null = null;
    if (cleanPhone) {
      const { data: porTel } = await supabase
        .from("negocios")
        .select("id")
        .eq("whatsapp", cleanPhone)
        .maybeSingle();
      if (porTel) existingNegocio = porTel;
    }

    // 2.2 Si no coincidió por teléfono, buscar por nombre exacto dentro de la misma zona
    if (!existingNegocio) {
      const { data: porNombre } = await supabase
        .from("negocios")
        .select("id")
        .eq("zona_id", zona.id)
        .ilike("nombre", nombreLimpio)
        .maybeSingle();
      if (porNombre) existingNegocio = porNombre;
    }

    if (existingNegocio) {
      negocioId = existingNegocio.id;
      await supabase
        .from("negocios")
        .update({
          nombre: nombreLimpio,
          whatsapp: cleanPhone || undefined,
          instagram: input.instagram?.trim() || null,
          categoria: "hospedaje",
        })
        .eq("id", negocioId);
    } else {
      const { data: newNegocio, error: newNegocioError } = await supabase
        .from("negocios")
        .insert({
          zona_id: zona.id,
          user_id: user.id, // Vinculado al admin para permitir edición y borrado
          nombre: nombreLimpio,
          whatsapp: cleanPhone,
          instagram: input.instagram?.trim() || null,
          categoria: "hospedaje",
          plan: "gratis",
          activo: true,
        })
        .select("id")
        .single();

      if (newNegocioError || !newNegocio) {
        return { success: false, error: "Error al crear el aliado de hospedaje." };
      }
      negocioId = newNegocio.id;
    }

    // 3. Calcular precio mínimo referencial para el registro
    const habitacionesList = Array.isArray(input.metadataHospedaje?.habitaciones)
      ? input.metadataHospedaje.habitaciones
      : [];
    const precios = habitacionesList.map((h) => Number(h.precio_noche_cop) || 0);
    const precioBase = precios.length > 0 ? Math.min(...precios) : 0;

    // 4. Insertar o Actualizar el evento tipo 'hospedaje'
    const datosHospedaje: Record<string, any> = {
      negocio_id: negocioId,
      zona_id: zona.id,
      titulo: input.titulo.trim(),
      descripcion: input.descripcion.trim(),
      tipo: "hospedaje" as CategoriaEvento,
      precio: precioBase,
      precio_moneda: "COP" as const,
      fecha_fin: null,
      imagen_url: input.imagenUrl || null,
      destacado: Boolean(input.destacado),
      tiene_boleteria: false,
      activo: true,
      metadata_hospedaje: input.metadataHospedaje,
    };

    if (!input.id) {
      datosHospedaje.fecha_inicio = new Date().toISOString();
    }

    if (input.id) {
      // Actualización
      const { error: updateError } = await supabase
        .from("eventos")
        .update(datosHospedaje)
        .eq("id", input.id);

      if (updateError) {
        return { success: false, error: updateError.message };
      }
    } else {
      // Creación
      const { error: insertError } = await supabase
        .from("eventos")
        .insert(datosHospedaje);

      if (insertError) {
        return { success: false, error: insertError.message };
      }
    }

    // Revalidar rutas para reflejar cambios de inmediato
    revalidatePath(`/[locale]/admin/hospedajes`, "page");
    revalidatePath(`/[locale]/${input.zonaSlug}`, "page");

    return { success: true };
  } catch (err: any) {
    console.error("Excepción en guardarHospedajeAction:", err);
    return { success: false, error: err?.message || "Error al procesar hospedaje." };
  }
}

// ─── GESTIÓN DE SERVICIOS ESENCIALES (SERVER ACTIONS) ───────────────────────────

export interface GuardarServicioEsencialInput {
  id?: string;
  zonaSlug: string;
  categoria: CategoriaServicioEsencial;
  nombreComercial: string;
  subtitulo: string;
  logoUrl?: string | null;
  imagenLugarUrl?: string | null;
  imagenes?: string[];
  videoUrl?: string | null;
  whatsapp: string;
  mensajeWhatsappDefault?: string | null;
  googleMapsUrl?: string | null;
  direccionReferencia: string;
  horarioApertura: string;
  serviciosTags: string[];
  destacadoPatrocinado?: boolean;
  tipoAcuerdo?: "canje_afiche" | "pago_mensual" | "cortesia";
  ordenPrioridad?: number;
  activo?: boolean;
  botonWhatsappActivo?: boolean;
}

export async function guardarServicioEsencialAction(
  input: GuardarServicioEsencialInput
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "No autorizado. Inicia sesión." };
    }

    // 1. Obtener ID de la zona
    const { data: zona } = await supabase
      .from("zonas")
      .select("id")
      .eq("slug", input.zonaSlug)
      .eq("activa", true)
      .single();

    const zonaId = zona?.id || (input.zonaSlug === "mendihuaca" ? "zona-mendihuaca" : "zona-minca");
    const cleanPhone = input.whatsapp.replace(/\D/g, "");

    const imagenesValidas = (input.imagenes || []).map((img) => img.trim()).filter(Boolean);
    const imagenPrincipal =
      input.imagenLugarUrl?.trim() ||
      (imagenesValidas.length > 0 ? imagenesValidas[0] : null);

    const payload: Record<string, any> = {
      zona_id: zonaId,
      categoria: input.categoria,
      nombre_comercial: input.nombreComercial.trim(),
      subtitulo: input.subtitulo.trim(),
      logo_url: input.logoUrl?.trim() || null,
      imagen_lugar_url: imagenPrincipal,
      whatsapp: cleanPhone,
      mensaje_whatsapp_default: input.mensajeWhatsappDefault?.trim() || null,
      google_maps_url: input.googleMapsUrl?.trim() || null,
      direccion_referencia: input.direccionReferencia.trim(),
      horario_apertura: input.horarioApertura.trim(),
      servicios_tags: input.serviciosTags.map((t) => t.trim()).filter(Boolean),
      destacado_patrocinado: Boolean(input.destacadoPatrocinado),
      tipo_acuerdo: input.tipoAcuerdo || "canje_afiche",
      orden_prioridad: Number(input.ordenPrioridad ?? 10),
      activo: input.activo !== undefined ? Boolean(input.activo) : true,
      boton_whatsapp_activo:
        input.botonWhatsappActivo !== undefined
          ? Boolean(input.botonWhatsappActivo)
          : true,
      metadata_comercial: {
        imagenes: imagenesValidas,
        video_url: input.videoUrl?.trim() || null,
      },
    };

    let servicioGuardado: ServicioEsencial | null = null;
    const isUuid = Boolean(
      input.id &&
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
          input.id
        )
    );

    if (isUuid) {
      let { data: updated, error: updateError } = await supabase
        .from("servicios_esenciales")
        .update(payload)
        .eq("id", input.id!)
        .select("*")
        .single();

      // Si la columna boton_whatsapp_activo o metadata_comercial aún no existen, reintentar con fallback
      if (updateError && (updateError.message?.includes("boton_whatsapp_activo") || updateError.message?.includes("metadata_comercial"))) {
        const payloadFallback = { ...payload };
        if (updateError.message.includes("boton_whatsapp_activo")) delete payloadFallback.boton_whatsapp_activo;
        if (updateError.message.includes("metadata_comercial")) delete payloadFallback.metadata_comercial;

        const resFallback = await supabase
          .from("servicios_esenciales")
          .update(payloadFallback)
          .eq("id", input.id!)
          .select("*")
          .single();
        updated = resFallback.data;
        updateError = resFallback.error;
      }

      if (updateError) {
        return { success: false, error: updateError.message };
      }
      servicioGuardado = updated as ServicioEsencial;
    } else {
      let { data: inserted, error: insertError } = await supabase
        .from("servicios_esenciales")
        .insert(payload)
        .select("*")
        .single();

      // Si la columna boton_whatsapp_activo o metadata_comercial aún no existen, reintentar con fallback
      if (insertError && (insertError.message?.includes("boton_whatsapp_activo") || insertError.message?.includes("metadata_comercial"))) {
        const payloadFallback = { ...payload };
        if (insertError.message.includes("boton_whatsapp_activo")) delete payloadFallback.boton_whatsapp_activo;
        if (insertError.message.includes("metadata_comercial")) delete payloadFallback.metadata_comercial;

        const resFallback = await supabase
          .from("servicios_esenciales")
          .insert(payloadFallback)
          .select("*")
          .single();
        inserted = resFallback.data;
        insertError = resFallback.error;
      }

      if (insertError) {
        return { success: false, error: insertError.message };
      }
      servicioGuardado = inserted as ServicioEsencial;
    }

    revalidatePath(`/[locale]/admin/esenciales`, "page");
    revalidatePath(`/[locale]/${input.zonaSlug}`, "page");

    return { success: true, servicio: servicioGuardado };
  } catch (err: any) {
    console.error("Excepción en guardarServicioEsencialAction:", err);
    return {
      success: false,
      error: err?.message || "Error al procesar servicio esencial.",
    };
  }
}

export async function toggleActivoServicioEsencialAction(
  id: string,
  nuevoEstado: boolean,
  zonaSlug: string = "minca"
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
      .from("servicios_esenciales")
      .update({ activo: nuevoEstado })
      .eq("id", id);

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath(`/[locale]/admin/esenciales`, "page");
    revalidatePath(`/[locale]/${zonaSlug}`, "page");

    return { success: true };
  } catch (err: any) {
    console.error("Excepción en toggleActivoServicioEsencialAction:", err);
    return { success: false, error: err?.message || "Error al alternar estado." };
  }
}

export async function toggleBotonWhatsappServicioEsencialAction(
  id: string,
  nuevoEstado: boolean,
  zonaSlug: string = "minca"
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
      .from("servicios_esenciales")
      .update({ boton_whatsapp_activo: nuevoEstado })
      .eq("id", id);

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath(`/[locale]/admin/esenciales`, "page");
    revalidatePath(`/[locale]/${zonaSlug}`, "page");

    return { success: true };
  } catch (err: any) {
    console.error("Excepción en toggleBotonWhatsappServicioEsencialAction:", err);
    return {
      success: false,
      error: err?.message || "Error al alternar visibilidad de WhatsApp.",
    };
  }
}

export async function eliminarServicioEsencialAction(
  id: string,
  zonaSlug: string = "minca"
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "No autenticado." };
    }

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      id
    );

    if (isUuid) {
      const { error } = await supabase
        .from("servicios_esenciales")
        .delete()
        .eq("id", id);

      if (error) {
        return { success: false, error: error.message };
      }
    }

    revalidatePath(`/[locale]/admin/esenciales`, "page");
    revalidatePath(`/[locale]/${zonaSlug}`, "page");

    return { success: true };
  } catch (err: any) {
    console.error("Excepción en eliminarServicioEsencialAction:", err);
    return { success: false, error: err?.message || "Error al eliminar servicio." };
  }
}

/**
 * Server Action para importar una imagen desde una URL externa (Booking, web, etc.)
 * y guardarla permanentemente en Supabase Storage sin restricciones de CORS.
 */
export async function importarImagenDesdeUrlAction(
  imageUrl: string
): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Debes iniciar sesión para importar imágenes." };
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const res = await fetch(imageUrl, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    });
    clearTimeout(timeout);

    if (!res.ok) {
      return { success: false, error: `Error HTTP ${res.status} al descargar imagen externa.` };
    }

    const contentType = res.headers.get("content-type") || "image/jpeg";
    const arrayBuffer = await res.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    let ext = "jpg";
    if (contentType.includes("png")) ext = "png";
    else if (contentType.includes("webp")) ext = "webp";

    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${ext}`;
    const filePath = `eventos/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("eventos")
      .upload(filePath, buffer, {
        contentType,
        cacheControl: "31536000",
        upsert: false,
      });

    if (uploadError) {
      return { success: false, error: uploadError.message };
    }

    const { data } = supabase.storage.from("eventos").getPublicUrl(filePath);
    return { success: true, url: data.publicUrl };
  } catch (err: any) {
    return { success: false, error: err?.message || "Error al importar imagen." };
  }
}

// ─── Generación de Copy con Inteligencia Artificial Gemini ─────────────────────

export interface GenerarCopyGeminiInput {
  textoBruto: string;
  businessName?: string;
  zonaSlug?: string;
  categoriaSugerida?: string;
}

export interface GenerarCopyGeminiResult {
  success: boolean;
  titulo?: string;
  descripcion?: string;
  categoria?: CategoriaEvento;
  precio?: number;
  businessName?: string;
  whatsapp?: string;
  instagram?: string;
  horaInicio?: string;
  horaFin?: string;
  esRecurrente?: boolean;
  diasRecurrentes?: number[];
  error?: string;
}

/**
 * Server Action que invoca la API oficial de Google Gemini (gemini-3.5-flash-lite)
 * con el prompt editorial calibrado para mochileros y cultura de la Sierra Nevada.
 */
export async function generarCopyEventoGeminiAction(
  input: GenerarCopyGeminiInput
): Promise<GenerarCopyGeminiResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return { success: false, error: "GEMINI_API_KEY no configurada en el servidor." };
  }

  const prompt = `Eres el editor cultural, copywriter y analista de prospección comercial de "PaDónde", la plataforma de eventos y experiencias de Minca y la Sierra Nevada de Santa Marta (Colombia).
Tu público objetivo son mochileros, nómadas digitales y viajeros nacionales e internacionales.

Analiza este texto bruto (mensaje de WhatsApp, publicación de Instagram o afiche) y genera una ficha completa lista para publicar en la cartelera:
"${input.textoBruto.replace(/"/g, '\\"')}"

Comercio / Aliado referencial: ${input.businessName || "No especificado"}
Zona: ${input.zonaSlug === "mendihuaca" ? "Mendihuaca (Playa, Surf, Río)" : "Minca (Montaña, Selva, Café)"}

Instrucciones de Redacción y Extracción:
1. Redacción cautivadora: No uses clichés genéricos. Transmite la atmósfera auténtica de la Sierra Nevada (ambiente bohemio, relajado, risas, tragos de autor, buena música, naturaleza).
2. EMOJIS VIBRANTES: Incluye de 3 a 5 emojis acordes (ej. 🎤, 🍹, ✨, 🌿, 🎶, 🌙, 📍, 🍻, 🔥) distribuidos con gracia y dinamismo en los párrafos para que la lectura móvil sea divertida y moderna.
3. DETECCIÓN DE RECURRENCIA Y FRECUENCIA (MUY IMPORTANTE):
   - Si el texto dice "todos los jueves", "cada viernes", "los sábados", "fines de semana", "todos los días", "diario", marca "esRecurrente": true.
   - En "diasRecurrentes", devuelve un array de enteros correspondientes: 0=Domingo, 1=Lunes, 2=Martes, 3=Miércoles, 4=Jueves, 5=Viernes, 6=Sábado.
   - Si dice "todos los días", devuelve [0, 1, 2, 3, 4, 5, 6].
   - Si dice "fines de semana", devuelve [5, 6, 0].
   - Si es un evento de una sola fecha puntual, marca "esRecurrente": false y "diasRecurrentes": [].
4. DETECCIÓN DE HORARIO:
   - "horaInicio": formato "HH:mm" (ej: "20:00" para 8pm, "08:30" para mañana).
   - "horaFin": si menciona hora de cierre o fin (ej: "hasta las 2am", "de 7 a 11pm"), formato "HH:mm".
5. Responde ÚNICAMENTE en formato JSON válido (sin backticks de markdown, solo las llaves {}) con esta estructura:
{
  "titulo": "Título atractivo con 1 emoji representativo (ej. 🎤 Noche de Karaoke & Tragos de Autor)",
  "descripcion": "2 párrafos breves, narrativos, envolventes y con emojis bien integrados que seduzcan al viajero",
  "categoria": "rumba" | "comida" | "bienestar" | "tours" | "arte" | "artesanias",
  "precio": 0,
  "businessName": "Nombre del local/anfitrión si se detecta en el texto o null",
  "whatsapp": "Número colombiano si se detecta (ej: 3151234567) o null",
  "instagram": "@cuenta si se detecta o null",
  "horaInicio": "20:00",
  "horaFin": "02:00",
  "esRecurrente": false,
  "diasRecurrentes": [4]
}`;

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
      }
    );

    if (!res.ok) {
      const errData = await res.json().catch(() => null);
      return { success: false, error: errData?.error?.message || "Error al conectar con Gemini." };
    }

    const data = await res.json();
    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawText) {
      return { success: false, error: "Respuesta vacía de Gemini." };
    }

    const cleanedText = rawText.replace(/```json/gi, "").replace(/```/g, "").trim();
    const parsed = JSON.parse(cleanedText);

    return {
      success: true,
      titulo: parsed.titulo,
      descripcion: parsed.descripcion,
      categoria: parsed.categoria,
      precio: typeof parsed.precio === "number" ? parsed.precio : 0,
      businessName: parsed.businessName || undefined,
      whatsapp: parsed.whatsapp || undefined,
      instagram: parsed.instagram || undefined,
      horaInicio: parsed.horaInicio || undefined,
      horaFin: parsed.horaFin || undefined,
      esRecurrente: typeof parsed.esRecurrente === "boolean" ? parsed.esRecurrente : undefined,
      diasRecurrentes: Array.isArray(parsed.diasRecurrentes) ? parsed.diasRecurrentes : undefined,
    };
  } catch (err: any) {
    return { success: false, error: err?.message || "Error al procesar con Gemini." };
  }
}

export interface GenerarCopyHospedajeInput {
  textoBruto: string;
  nombreNegocio?: string;
  zonaSlug?: string;
}

export interface GenerarCopyHospedajeResult {
  success: boolean;
  titulo?: string;
  descripcion?: string;
  destacados?: string[];
  error?: string;
}

/**
 * Server Action que invoca la API oficial de Google Gemini (gemini-3.5-flash-lite)
 * para redactar descripciones sensoriales, cálidas y envolventes de hospedajes.
 */
export async function generarCopyHospedajeGeminiAction(
  input: GenerarCopyHospedajeInput
): Promise<GenerarCopyHospedajeResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return { success: false, error: "GEMINI_API_KEY no configurada en el servidor." };
  }

  const prompt = `Eres el editor turístico experto de "PaDónde", la plataforma de hospedajes de la Sierra Nevada de Santa Marta (Minca y Mendihuaca, Colombia).
Tu público objetivo son mochileros, nómadas digitales y viajeros que buscan hospedajes con alma, contacto con la naturaleza y descanso real.

A partir del siguiente texto bruto de Booking/WhatsApp/Instagram:
"${input.textoBruto.replace(/"/g, '\\"')}"

Nombre sugerido: ${input.nombreNegocio || "No especificado"}
Zona: ${input.zonaSlug === "mendihuaca" ? "Mendihuaca (Playa, Surf camps, Cabañas frente al mar)" : "Minca (Montaña, Selva nublada, Colibríes, Cafetales)"}

Instrucciones:
1. Prohibido usar clichés corporativos o acartonados ("un espacio ideal para desconectar").
2. Escribe una descripción cautivadora de 2 párrafos cortos que transmita la magia sensorial del lugar (brisa, sonidos de aves o mar, arquitectura, comodidades clave, vistas).
3. INCLUYE EMOJIS: Usa de 3 a 5 emojis cálidos y expresivos (ej. 🌿, 🌊, 🌅, 🦜, ✨, ☕, 🛖, 🛌, 🌴) integrados con armonía en la descripción y al inicio de cada punto destacado.
4. Devuelve ÚNICAMENTE un JSON válido (sin backticks) con esta estructura:
{
  "titulo": "Título atractivo con emoji estilo PaDónde (ej. 🛖 Hotel Minca La Casona — Refugio Colonial de Colibríes 🌿)",
  "descripcion": "Descripción envolvente de 2 párrafos con emojis bien intercalados",
  "destacados": ["🌿 Piscina al aire libre entre jardines", "🦜 Avistamiento diario de colibríes", "🥘 Restaurante con sazón local", "🚶 Senderos ecológicos cercanos"]
}`;

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
      }
    );

    if (!res.ok) {
      const errData = await res.json().catch(() => null);
      return { success: false, error: errData?.error?.message || "Error al conectar con Gemini." };
    }

    const data = await res.json();
    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawText) {
      return { success: false, error: "Respuesta vacía de Gemini." };
    }

    const cleanedText = rawText.replace(/```json/gi, "").replace(/```/g, "").trim();
    const parsed = JSON.parse(cleanedText);

    return {
      success: true,
      titulo: parsed.titulo,
      descripcion: parsed.descripcion,
      destacados: Array.isArray(parsed.destacados) ? parsed.destacados : [],
    };
  } catch (err: any) {
    return { success: false, error: err?.message || "Error al procesar con Gemini." };
  }
}

// ─── Clasificación Inteligente de Fotos con Gemini Vision ─────────────────────

export interface ClasificarFotosHospedajeInput {
  fotos: string[]; // Lista de URLs de imágenes o data URIs
  nombreHospedaje: string;
  habitaciones: Array<{
    id: string;
    titulo: string;
    descripcion?: string;
  }>;
  descripcionContexto?: string;
}

export interface AsignacionFotoResultado {
  url: string;
  destino: "portada" | "area_comun" | string; // ID de habitación o 'portada' / 'area_comun'
  categoriaDetalle?: string;
  razonVisual: string;
  ordenVisual?: number;
}

export interface ClasificarFotosHospedajeResult {
  success: boolean;
  portadaSugerida?: string;
  areasComunes?: Array<{ url: string; tipo: string; descripcion: string }>;
  asignaciones?: AsignacionFotoResultado[];
  error?: string;
}

export async function clasificarFotosHospedajeAction(
  input: ClasificarFotosHospedajeInput
): Promise<ClasificarFotosHospedajeResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return { success: false, error: "GEMINI_API_KEY no configurada en el servidor." };
  }

  const urlsValidas = (input.fotos || [])
    .map((u) => u.trim())
    .filter((u) => u.startsWith("http://") || u.startsWith("https://") || u.startsWith("data:image/"));

  if (urlsValidas.length === 0) {
    return { success: false, error: "No se proporcionaron URLs o imágenes válidas." };
  }

  // Limitar a máximo 20 fotos por lote para asegurar respuesta en < 8s
  const loteFotos = urlsValidas.slice(0, 20);

  try {
    // 1. Convertir imágenes a miniaturas base64 (512px) en memoria
    const miniaturas: Array<{ url: string; b64: string; index: number }> = [];

    await Promise.all(
      loteFotos.map(async (url, idx) => {
        try {
          let buffer: Buffer | null = null;
          if (url.startsWith("data:image/")) {
            const base64Data = url.split(",")[1];
            buffer = Buffer.from(base64Data, "base64");
          } else {
            const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
            if (res.ok) {
              const arrayBuf = await res.arrayBuffer();
              buffer = Buffer.from(arrayBuf);
            }
          }

          if (buffer) {
            const thumbBuf = await sharp(buffer)
              .rotate()
              .resize(512, 512, { fit: "inside", withoutEnlargement: true })
              .jpeg({ quality: 65 })
              .toBuffer();
            miniaturas.push({
              url,
              b64: thumbBuf.toString("base64"),
              index: idx + 1,
            });
          }
        } catch (e) {
          console.warn(`[clasificarFotos] No se pudo miniaturizar foto ${idx + 1}:`, e);
        }
      })
    );

    if (miniaturas.length === 0) {
      return { success: false, error: "No se pudo descargar ni procesar ninguna de las fotos proporcionadas." };
    }

    // Ordenar miniaturas por su índice original
    miniaturas.sort((a, b) => a.index - b.index);

    // 2. Construir Prompt para Gemini Vision
    const listaHabsTexto = input.habitaciones
      .map((h, i) => `${i + 1}. [ID: "${h.id}"] Nombre: "${h.titulo}"${h.descripcion ? ` - Detalles: ${h.descripcion}` : ""}`)
      .join("\n");

    const promptTexto = `Eres el editor visual y director de arte de "PaDónde", plataforma de turismo y hospedajes en la Sierra Nevada de Santa Marta (Colombia).
Tu tarea es clasificar determinísticamente un lote de ${miniaturas.length} fotografías para el hospedaje "${input.nombreHospedaje}".

Habitaciones registradas en el hospedaje:
${listaHabsTexto}

${input.descripcionContexto ? `Contexto adicional del lugar:\n"${input.descripcionContexto}"\n` : ""}

Instrucciones:
1. Para cada foto numerada:
   - Determina si es "portada" (la mejor foto representativa general del hotel, ej: fachada icónica o vista espectacular).
   - O si es "area_comun" (piscina, restaurante, sendero, colibrí, jardín, recepción).
   - O si es "habitacion", emparejándola con el ID exacto de la habitación a la que pertenece según sus características visibles (cama, baño de habitación, balcón).
2. Proporciona una justificación visual muy breve (máx 10 palabras) de por qué se asignó allí.
3. Devuelve ÚNICAMENTE un JSON válido con esta estructura:
{
  "portada_sugerida_index": 1,
  "fotos": [
    {
      "index": 1,
      "destino": "portada" | "area_comun" | "<id_de_la_habitacion>",
      "tipo_area": "piscina" | "restaurante" | "fachada" | "jardin" | "otro",
      "razon_visual": "Cama doble rústica con vista a la selva",
      "orden_en_habitacion": 1
    }
  ]
}`;

    const parts: any[] = [{ text: promptTexto }];
    for (const m of miniaturas) {
      parts.push({ text: `\n[FOTO ${m.index}]` });
      parts.push({
        inline_data: {
          mime_type: "image/jpeg",
          data: m.b64,
        },
      });
    }

    // 3. Invocar Gemini Vision API
    const resGemini = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts }],
          generationConfig: {
            response_mime_type: "application/json",
          },
        }),
      }
    );

    if (!resGemini.ok) {
      const errData = await resGemini.json().catch(() => null);
      return { success: false, error: errData?.error?.message || "Error al conectar con Gemini Vision." };
    }

    const dataGemini = await resGemini.json();
    const rawJson = dataGemini?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawJson) {
      return { success: false, error: "Respuesta vacía de Gemini Vision." };
    }

    const parsed = JSON.parse(rawJson);
    const fotosClasificadas = parsed.fotos || [];

    // 4. Mapear resultados con las URLs originales
    const asignaciones: AsignacionFotoResultado[] = [];
    const miniaturaMap = new Map(miniaturas.map((m) => [m.index, m.url]));

    for (const f of fotosClasificadas) {
      const urlOriginal = miniaturaMap.get(f.index);
      if (urlOriginal) {
        asignaciones.push({
          url: urlOriginal,
          destino: f.destino || "area_comun",
          categoriaDetalle: f.tipo_area || "otro",
          razonVisual: f.razon_visual || "Identificada por Gemini Vision",
          ordenVisual: f.orden_en_habitacion || 1,
        });
      }
    }

    // Portada sugerida
    let portadaSugerida: string | undefined;
    if (parsed.portada_sugerida_index && miniaturaMap.has(parsed.portada_sugerida_index)) {
      portadaSugerida = miniaturaMap.get(parsed.portada_sugerida_index);
    } else {
      const portadaItem = asignaciones.find((a) => a.destino === "portada");
      if (portadaItem) portadaSugerida = portadaItem.url;
    }

    return {
      success: true,
      portadaSugerida,
      asignaciones,
    };
  } catch (err: any) {
    console.error("Excepción en clasificarFotosHospedajeAction:", err);
    return { success: false, error: err?.message || "Error al clasificar fotos con Gemini." };
  }
}

// ─── Configuración Territorial de Categorías (Sin Base de Datos) ──────────────

export interface GuardarConfigTerritorialInput {
  config: Record<
    string,
    {
      ordenCategorias: CategoriaEvento[];
      criterioOrdenFeed: "agenda_primero" | "hospedaje_primero";
    }
  >;
}

export async function guardarConfigTerritorialAction(
  input: GuardarConfigTerritorialInput
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!input.config || typeof input.config !== "object") {
      return { success: false, error: "Estructura de configuración inválida." };
    }

    // 1. Guardar en Supabase (persistencia real en la nube sin error EROFS)
    const supabase = await createClient();
    const { error: dbError } = await supabase
      .from("configuraciones")
      .upsert({
        clave: "config_territorial",
        valor: input.config,
        updated_at: new Date().toISOString(),
      });

    if (dbError) {
      console.warn("Aviso al guardar en Supabase configuraciones:", dbError.message);
    }

    // 2. En local dev (si el filesystem no es read-only), guardamos también en disco
    try {
      const fs = await import("fs");
      const path = await import("path");
      const configPath = path.join(process.cwd(), "src", "constants", "config_territorial.json");
      fs.writeFileSync(configPath, JSON.stringify(input.config, null, 2), "utf8");
    } catch {
      // En Vercel el sistema de archivos es read-only (/var/task); se ignora de forma segura
    }

    revalidatePath("/", "layout");
    revalidatePath("/[locale]/[zona]", "page");
    revalidatePath("/[locale]/(dashboard)/admin/regiones", "page");

    return { success: true };
  } catch (err: any) {
    console.error("Error al guardar configuración territorial:", err);
    return {
      success: false,
      error: err?.message || "No se pudo guardar la configuración territorial.",
    };
  }
}

/**
 * Alterna el estado de activación de las notificaciones de Telegram para el Super Admin.
 */
export async function toggleNotificacionesTelegramAction(activas: boolean) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "No autorizado. Inicia sesión como administrador." };
    }

    const { data: configActual } = await supabase
      .from("configuraciones")
      .select("valor")
      .eq("clave", "notificaciones_telegram")
      .maybeSingle();

    const nuevoValor = {
      ...(configActual?.valor && typeof configActual.valor === "object" ? configActual.valor : {}),
      activas,
      bot_token: configActual?.valor?.bot_token || process.env.TELEGRAM_BOT_TOKEN,
      chat_id: configActual?.valor?.chat_id || process.env.TELEGRAM_CHAT_ID,
    };

    const { error: dbError } = await supabase
      .from("configuraciones")
      .upsert({
        clave: "notificaciones_telegram",
        valor: nuevoValor,
        updated_at: new Date().toISOString(),
      });

    if (dbError) {
      return { success: false, error: dbError.message };
    }

    revalidatePath("/[locale]/(dashboard)/admin", "page");
    return { success: true, activas };
  } catch (err: any) {
    return { success: false, error: err?.message || "Error al actualizar notificaciones." };
  }
}

/**
 * Envía una notificación de prueba directa al chat de Telegram del Super Admin.
 */
export async function testNotificacionTelegramAction() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "No autorizado." };
    }

    const { sendTelegramNotification } = await import("@/lib/telegram");
    const testMsg = [
      `🔔 <b>¡Prueba de Notificación PaDónde!</b>`,
      `✅ Tu bot de Telegram está 100% activo y conectado.`,
      `⏰ <b>Hora:</b> ${new Date().toLocaleTimeString("es-CO", { timeZone: "America/Bogota" })}`,
      `📲 Recibirás una alerta cada vez que un turista haga clic en Reservar o Cotizar disponibilidad.`,
    ].join("\n");

    const ok = await sendTelegramNotification(testMsg);
    if (!ok) {
      return { success: false, error: "No se pudo entregar el mensaje. Verifica que las notificaciones no estén pausadas." };
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || "Error al enviar prueba." };
  }
}



