"use server";

import { createClient } from "@/lib/supabase/server";

export async function toggleQrDisenadoAliadoAction(
  negocioId: string,
  qrDisenado: boolean
): Promise<{ success: boolean; error?: string }> {
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
      .update({ qr_disenado: Boolean(qrDisenado) })
      .eq("id", negocioId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || "No se pudo actualizar el estado de QR.",
    };
  }
}
