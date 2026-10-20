import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { scanId, tiempoPermanenciaSeg = 5 } = body;

    if (!scanId) {
      return NextResponse.json({ success: false, error: "scanId requerido" }, { status: 400 });
    }

    // Regla antifraude: permanencia mínima de 4 segundos
    const permanencia = Math.max(Math.floor(Number(tiempoPermanenciaSeg) || 0), 4);

    const supabase = await createClient();

    // Actualizar registro como validado
    const { error: updateError } = await supabase
      .from("escaneos_qr")
      .update({
        es_valido: true,
        tiempo_permanencia_seg: permanencia,
        updated_at: new Date().toISOString(),
      })
      .eq("id", scanId);

    if (updateError) {
      console.warn("Error al confirmar escaneo QR en Supabase:", updateError.message);
      return NextResponse.json({ success: true, confirmed: false });
    }

    return NextResponse.json({ success: true, confirmed: true });
  } catch (err: any) {
    console.warn("Excepción al procesar confirm-qr:", err?.message || err);
    return NextResponse.json({ success: true, confirmed: false });
  }
}
