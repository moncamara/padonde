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



