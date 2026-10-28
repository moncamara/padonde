import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import crypto from "crypto";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { puntoId, zonaSlug = "minca", dispositivoId, idioma: clientIdioma } = body;

    if (!puntoId || !dispositivoId) {
      return NextResponse.json({ success: false, error: "Parámetros incompletos" }, { status: 400 });
    }

    // 1. Detectar tipo de dispositivo a partir del User-Agent
    const userAgent = request.headers.get("user-agent") || "";
    let dispositivoTipo: "iphone" | "android" | "desktop" | "otro" = "otro";
    if (/iphone|ipad|ipod/i.test(userAgent)) {
      dispositivoTipo = "iphone";
    } else if (/android/i.test(userAgent)) {
      dispositivoTipo = "android";
    } else if (/macintosh|windows|linux/i.test(userAgent)) {
      dispositivoTipo = "desktop";
    }

    // 1b. Extraer idioma del turista (del cliente o cabeceras HTTP)
    const headerLang = request.headers.get("accept-language")?.split(",")[0]?.trim() || "";
    const idiomaDetectado = (clientIdioma || headerLang || "es-CO").slice(0, 15);
    const userAgentConLang = `[LANG:${idiomaDetectado}] ${userAgent}`.slice(0, 250);

    // 2. Hash unidireccional de IP para auditoría y anti-fraude anónimo
    const forwardedFor = request.headers.get("x-forwarded-for") || "";
    const rawIp = forwardedFor.split(",")[0]?.trim() || "127.0.0.1";
    const ipHash = crypto.createHash("sha256").update(rawIp + "padonde_salt_2026").digest("hex").slice(0, 32);

    const supabase = await createClient();

    // 1. Identificar si es escaneo de prueba del administrador
    const isAdminCookie = request.cookies.get("padonde_admin_device")?.value === "true";
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const esPruebaAdmin = Boolean(user || isAdminCookie);
    const userAgentFinal = esPruebaAdmin ? `[PRUEBA_ADMIN] ${userAgentConLang}` : userAgentConLang;

    // 2. Antifraude: Verificar si este dispositivo ya había escaneado este punto
    const { data: escaneoPrevio } = await supabase
      .from("escaneos_qr")
      .select("id")
      .eq("punto_id", puntoId)
      .eq("dispositivo_id", dispositivoId)
      .limit(1)
      .maybeSingle();

    const esPrimerEscaneo = !escaneoPrevio;

    // 4. Insertar el intento de escaneo
    const { data: nuevoEscaneo, error: insertError } = await supabase
      .from("escaneos_qr")
      .insert({
        punto_id: puntoId,
        zona_slug: zonaSlug,
        dispositivo_id: dispositivoId,
        es_primer_escaneo: esPrimerEscaneo,
        es_valido: false, // Se valida a los 5 segundos de permanencia
        dispositivo_tipo: dispositivoTipo,
        user_agent: userAgentFinal,
        ip_hash: ipHash,
      })
      .select("id")
      .single();

    if (insertError) {
      console.warn("Error al registrar escaneo QR en Supabase:", insertError.message);
      return NextResponse.json({
        success: true,
        recorded: false,
        esPrimerEscaneo,
      });
    }

    return NextResponse.json({
      success: true,
      recorded: true,
      scanId: nuevoEscaneo?.id,
      esPrimerEscaneo,
      dispositivoTipo,
    });
  } catch (err: any) {
    console.warn("Excepción al procesar track-qr:", err?.message || err);
    return NextResponse.json({ success: true, recorded: false });
  }
}
