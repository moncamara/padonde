import { createClient } from "@/lib/supabase/server";
import { redirect } from "@/i18n/routing";
import { AdminNav } from "../AdminNav";
import { obtenerCobrosAliadosAction } from "../cobros/actions";
import { getFechaYMDColombia } from "@/lib/utils";
import {
  SeguimientoRadarClient,
  type AliadoSeguimientoRow,
  type EstadoCartelera,
} from "./SeguimientoRadarClient";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Radar Diario y Seguimiento — PaDónde Admin",
};

export default async function AdminSeguimientoPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect({ href: "/admin/login", locale });
  }

  const hoyYMD = getFechaYMDColombia(new Date());
  const ahoraMs = Date.now();
  const limite48hMs = 48 * 60 * 60 * 1000;

  const [{ data: rawNegocios }, { data: rawZonas }] = await Promise.all([
    supabase
      .from("negocios")
      .select(
        `
        id,
        nombre,
        categoria,
        whatsapp,
        instagram,
        zona_id,
        activo,
        created_at,
        eventos (
          id,
          titulo,
          activo,
          created_at,
          fecha_inicio,
          metadata_hospedaje
        )
      `
      )
      .eq("activo", true)
      .order("nombre", { ascending: true }),
    supabase.from("zonas").select("id, nombre, slug"),
  ]);

  const mapaZonas: Record<string, { nombre: string; slug: string }> = {
    "zona-minca": { nombre: "Minca", slug: "minca" },
    "zona-mendihuaca": { nombre: "Mendihuaca", slug: "mendihuaca" },
    "zona-tayrona": { nombre: "Tayrona", slug: "tayrona" },
    "zona-taganga": { nombre: "Taganga", slug: "taganga" },
  };
  for (const z of rawZonas || []) {
    mapaZonas[z.id] = { nombre: z.nombre, slug: z.slug };
  }

  // Cargar historial reciente de seguimiento (últimos 90 días) con fallback seguro si aún no se corre el SQL
  const hace90Dias = new Date(ahoraMs - 90 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  let tablaPendiente = false;
  let logsSeguimiento: any[] = [];

  try {
    const { data: rawLogs, error: logErr } = await supabase
      .from("seguimiento_aliados")
      .select("negocio_id, fecha, revisado_redes, publicado_hoy, interactuado_ig, comentario")
      .gte("fecha", hace90Dias)
      .order("fecha", { ascending: false });

    if (logErr) {
      tablaPendiente = true;
    } else {
      logsSeguimiento = rawLogs || [];
    }
  } catch {
    tablaPendiente = true;
  }

  // Cargar estado real de pagos desde /admin/cobros (acuerdos_comerciales / vista_cobros_aliados)
  const mapaEstadoPagoReal = new Map<string, string>();
  try {
    const cobrosRes = await obtenerCobrosAliadosAction();
    if (cobrosRes.success && Array.isArray(cobrosRes.aliados)) {
      for (const c of cobrosRes.aliados) {
        if (c.negocio_id) {
          mapaEstadoPagoReal.set(c.negocio_id, c.estado_calculado);
        }
      }
    }
  } catch {
    // Silencioso
  }

  // Agrupar logs por negocio_id
  const logsPorNegocio = new Map<string, any[]>();
  for (const log of logsSeguimiento) {
    const arr = logsPorNegocio.get(log.negocio_id) || [];
    arr.push(log);
    logsPorNegocio.set(log.negocio_id, arr);
  }

  const filas: AliadoSeguimientoRow[] = (rawNegocios || []).map((n: any) => {
    const evs: any[] = Array.isArray(n.eventos) ? n.eventos : [];
    let maxPubMs = 0;
    for (const ev of evs) {
      const candidatos = [
        ev.metadata_hospedaje?.ultima_edicion,
        ev.created_at,
        ev.fecha_inicio,
      ];
      for (const c of candidatos) {
        if (!c) continue;
        const t = new Date(c).getTime();
        if (!isNaN(t) && t > maxPubMs) maxPubMs = t;
      }
    }

    let estadoCartelera: EstadoCartelera = "sin_publicaciones";
    if (evs.length > 0 && maxPubMs > 0) {
      estadoCartelera = ahoraMs - maxPubMs <= limite48hMs ? "reciente" : "atrasado";
    }

    const logs = logsPorNegocio.get(n.id) || [];
    const logHoy = logs.find((l) => l.fecha === hoyYMD);
    const ultimaIg = logs.find((l) => l.interactuado_ig)?.fecha || null;
    const ultimaPubSeg = logs.find((l) => l.publicado_hoy)?.fecha || null;
    const ultimoComentarioPrevio =
      logs.find((l) => l.fecha !== hoyYMD && l.comentario)?.comentario || null;

    return {
      negocioId: n.id,
      nombre: n.nombre,
      categoria: n.categoria || "comida",
      zonaSlug: mapaZonas[n.zona_id]?.slug || "minca",
      zonaNombre: mapaZonas[n.zona_id]?.nombre || "Minca",
      whatsapp: n.whatsapp || "",
      instagram: n.instagram || null,
      totalEventos: evs.length,
      estadoCartelera,
      ultimaPublicacionIso: maxPubMs > 0 ? new Date(maxPubMs).toISOString() : null,
      estadoPagoReal: mapaEstadoPagoReal.get(n.id) ?? null,
      revisadoHoy: Boolean(logHoy?.revisado_redes),
      publicadoHoy: Boolean(logHoy?.publicado_hoy),
      interactuadoIgHoy: Boolean(logHoy?.interactuado_ig),
      comentarioHoy: logHoy?.comentario || "",
      ultimaInteraccionIgFecha: ultimaIg,
      ultimaPublicacionSeguimientoFecha: ultimaPubSeg,
      ultimoComentarioAnterior: ultimoComentarioPrevio,
    };
  });

  return (
    <div className="min-h-screen bg-[#FBF9F5] pb-24">
      <AdminNav userEmail={user?.email} />
      <main className="max-w-[1440px] mx-auto px-3.5 sm:px-6 lg:px-8 py-4 sm:py-7 space-y-5">
        {tablaPendiente && (
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 text-amber-950 text-xs font-sans flex items-start gap-2.5">
            <span className="text-lg shrink-0">⚠️</span>
            <div>
              <p className="font-bold">Falta crear la tabla en Supabase</p>
              <p className="mt-0.5 text-amber-900">
                Ejecuta <code className="bg-amber-100 px-1.5 py-0.5 rounded font-mono">supabase/seguimiento_aliados.sql</code> en el SQL Editor de Supabase para habilitar la persistencia diaria.
              </p>
            </div>
          </div>
        )}

        <SeguimientoRadarClient
          filasIniciales={filas}
          hoyYMD={hoyYMD}
        />
      </main>
    </div>
  );
}
