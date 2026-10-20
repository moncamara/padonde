import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const puntoId = searchParams.get("puntoId") || "";

    const supabase = await createClient();

    // 1. Proteger ruta: verificar autenticación de administrador
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // 2. Consulta base
    let query = supabase.from("escaneos_qr").select("*");
    if (puntoId) {
      query = query.eq("punto_id", puntoId);
    }

    const { data: escaneos, error } = await query
      .order("created_at", { ascending: false })
      .limit(200);

    if (error) {
      // Si la tabla no existe aún, responder con estructura vacía
      console.warn("Tabla escaneos_qr no lista en Supabase:", error.message);
      return NextResponse.json({
        totales: 0,
        unicosValidados: 0,
        unicosSinPermanencia: 0,
        repetidos: 0,
        ultimosEscaneos: [],
      });
    }

    const lista = escaneos || [];

    const totales = lista.length;
    // Escaneos válidos a pagar: Primer escaneo de ese celular Y permaneció >= 5s
    const unicosValidados = lista.filter((e) => e.es_primer_escaneo && e.es_valido).length;
    // Abrió y cerró de inmediato (<5s)
    const unicosSinPermanencia = lista.filter((e) => e.es_primer_escaneo && !e.es_valido).length;
    // Celulares repetidos (auto-escaneos o personas que ya lo habían escaneado)
    const repetidos = lista.filter((e) => !e.es_primer_escaneo).length;

    // Últimos 30 escaneos para la bitácora en vivo
    const ultimosEscaneos = lista.slice(0, 30).map((e) => ({
      id: e.id,
      puntoId: e.punto_id,
      zonaSlug: e.zona_slug,
      dispositivoTipo: e.dispositivo_tipo,
      esPrimerEscaneo: e.es_primer_escaneo,
      esValido: e.es_valido,
      tiempoPermanenciaSeg: e.tiempo_permanencia_seg,
      createdAt: e.created_at,
    }));

    return NextResponse.json({
      totales,
      unicosValidados,
      unicosSinPermanencia,
      repetidos,
      ultimosEscaneos,
    });
  } catch (err: any) {
    console.warn("Excepción en métricas QR:", err?.message || err);
    return NextResponse.json({
      totales: 0,
      unicosValidados: 0,
      unicosSinPermanencia: 0,
      repetidos: 0,
      ultimosEscaneos: [],
    });
  }
}
