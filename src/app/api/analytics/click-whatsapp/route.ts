import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    // 1. Filtro Anti-Admin: Si el dispositivo está marcado como admin o tiene sesión activa,
    // respondemos exitosamente pero omitimos la inserción para no contaminar métricas reales.
    const isAdminCookie = request.cookies.get("padonde_admin_device")?.value === "true";
    if (isAdminCookie) {
      return NextResponse.json({ success: true, recorded: false, reason: "admin_cookie" });
    }

    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      return NextResponse.json({ success: true, recorded: false, reason: "admin_session" });
    }

    const body = await request.json().catch(() => ({}));
    const { eventoId, negocioId: inputNegocioId, ubicacion = "tarjeta" } = body;

    let negocioId = inputNegocioId;

    // Si no vino el negocioId directamente pero sí el eventoId, lo resolvemos
    if (!negocioId && eventoId) {
      const { data: ev } = await supabase
        .from("eventos")
        .select("negocio_id")
        .eq("id", eventoId)
        .maybeSingle();

      if (ev?.negocio_id) {
        negocioId = ev.negocio_id;
      }
    }

    // Insertar en la tabla de clics_whatsapp
    const { error: insertError } = await supabase
      .from("clics_whatsapp")
      .insert({
        evento_id: eventoId || null,
        negocio_id: negocioId || null,
        ubicacion: typeof ubicacion === "string" ? ubicacion.slice(0, 30) : "tarjeta",
      });

    if (insertError) {
      // Si la tabla aún no existe o hay algún error de base de datos,
      // registramos warning en el servidor pero respondemos éxito al cliente
      // para jamás interrumpir la experiencia de reserva del usuario.
      console.warn("Métricas WhatsApp (clics_whatsapp insert fallback):", insertError.message);
      return NextResponse.json({ success: true, recorded: false });
    }

    return NextResponse.json({ success: true, recorded: true });
  } catch (err: any) {
    console.warn("Excepción al registrar clic WhatsApp:", err?.message || err);
    return NextResponse.json({ success: true, recorded: false });
  }
}
