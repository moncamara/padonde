"use server";

import { createClient } from "@/lib/supabase/server";
import { getFechaYMDColombia } from "@/lib/utils";

export interface UpsertSeguimientoInput {
  negocioId: string;
  fecha?: string;
  revisado_redes: boolean;
  publicado_hoy: boolean;
  interactuado_ig: boolean;
  comentario: string | null;
}

export async function guardarSeguimientoAliadoAction(
  input: UpsertSeguimientoInput
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Sesión expirada. Recarga e inicia sesión." };
    }

    const fecha = input.fecha || getFechaYMDColombia(new Date());

    const { error } = await supabase.from("seguimiento_aliados").upsert(
      {
        negocio_id: input.negocioId,
        fecha,
        revisado_redes: Boolean(input.revisado_redes),
        publicado_hoy: Boolean(input.publicado_hoy),
        interactuado_ig: Boolean(input.interactuado_ig),
        comentario: input.comentario?.trim() ? input.comentario.trim() : null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "negocio_id,fecha" }
    );

    if (error) {
      console.error("[seguimiento] Error upsert:", error.message);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    console.error("[seguimiento] Excepción upsert:", err?.message);
    return { success: false, error: err?.message || "Error al guardar seguimiento." };
  }
}
