"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { parseLocalColombiaAISO } from "@/lib/utils";
import { traducirEventoCompleto } from "@/lib/translations/translator";
import type { CategoriaEvento, PlanNegocio, CategoriaServicioEsencial, ServicioEsencial } from "@/lib/types";

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
  videoUrl?: string;
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
      imagen_url:
        input.imageUrl ||
        "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&q=80",
      video_url: input.videoUrl || null,
      destacado: Boolean(input.isFeatured),
      tiene_boleteria: false,
      activo: true,
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

    // 1. Eliminar primero eventos asociados (garantiza limpieza completa)
    const { error: errorEventos } = await supabase
      .from("eventos")
      .delete()
      .eq("negocio_id", negocioId);

    if (errorEventos) {
      console.warn("Advertencia al eliminar eventos del negocio:", errorEventos);
    }

    // 2. Eliminar el registro del negocio
    const { error: errorNegocio } = await supabase
      .from("negocios")
      .delete()
      .eq("id", negocioId);

    if (errorNegocio) {
      console.error("Error al eliminar negocio:", errorNegocio);
      return { success: false, error: errorNegocio.message };
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

    // 2. Buscar o crear negocio (aliado de hospedaje)
    let negocioId = "";
    const cleanPhone = input.whatsapp.replace(/\D/g, "");

    const { data: existingNegocio } = await supabase
      .from("negocios")
      .select("id")
      .eq("whatsapp", cleanPhone)
      .maybeSingle();

    if (existingNegocio) {
      negocioId = existingNegocio.id;
      await supabase
        .from("negocios")
        .update({
          nombre: input.nombreNegocio.trim(),
          instagram: input.instagram?.trim() || null,
          categoria: "hospedaje",
        })
        .eq("id", negocioId);
    } else {
      const { data: newNegocio, error: newNegocioError } = await supabase
        .from("negocios")
        .insert({
          zona_id: zona.id,
          nombre: input.nombreNegocio.trim(),
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
    const precios = input.metadataHospedaje.habitaciones.map((h) => h.precio_noche_cop);
    const precioBase = precios.length > 0 ? Math.min(...precios) : 0;

    // 4. Insertar o Actualizar el evento tipo 'hospedaje'
    const datosHospedaje = {
      negocio_id: negocioId,
      zona_id: zona.id,
      titulo: input.titulo.trim(),
      descripcion: input.descripcion.trim(),
      tipo: "hospedaje" as CategoriaEvento,
      precio: precioBase,
      precio_moneda: "COP" as const,
      fecha_inicio: new Date().toISOString(),
      fecha_fin: null,
      imagen_url: input.imagenUrl || null,
      destacado: Boolean(input.destacado),
      tiene_boleteria: false,
      activo: true,
      metadata_hospedaje: input.metadataHospedaje,
    };

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

    const payload = {
      zona_id: zonaId,
      categoria: input.categoria,
      nombre_comercial: input.nombreComercial.trim(),
      subtitulo: input.subtitulo.trim(),
      logo_url: input.logoUrl?.trim() || null,
      imagen_lugar_url: input.imagenLugarUrl?.trim() || null,
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

      // Si la columna boton_whatsapp_activo aún no ha sido agregada por ALTER TABLE, reintentar sin ella
      if (updateError && updateError.message?.includes("boton_whatsapp_activo")) {
        const { boton_whatsapp_activo: _, ...payloadFallback } = payload;
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

      // Si la columna boton_whatsapp_activo aún no ha sido agregada por ALTER TABLE, reintentar sin ella
      if (insertError && insertError.message?.includes("boton_whatsapp_activo")) {
        const { boton_whatsapp_activo: _, ...payloadFallback } = payload;
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
