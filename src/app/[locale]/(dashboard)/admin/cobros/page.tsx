import { createClient } from "@/lib/supabase/server";
import { redirect } from "@/i18n/routing";
import { AdminNav } from "../AdminNav";
import { CobrosDashboardClient } from "./CobrosDashboardClient";
import type { HistorialAliadoCobro } from "./ModalHistorialCobro";
import { obtenerCobrosAliadosAction } from "./actions";
import { esEventoVigente } from "@/lib/utils";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Finanzas & Cobros a Aliados — PaDónde Admin",
  description: "Control de acuerdos comerciales, cortesías y recaudos a aliados en PaDónde.",
};

export default async function AdminCobrosPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  // 1. Proteger ruta con sesión de Super Admin
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect({ href: "/admin/login", locale });
  }

  // 2. Carga inicial SSR rápida + historial de negocios y eventos por aliado
  const [initialData, { data: negociosCreated }, { data: todosEventos }] = await Promise.all([
    obtenerCobrosAliadosAction(),
    supabase.from("negocios").select("id, created_at"),
    supabase
      .from("eventos")
      .select("id, negocio_id, titulo, tipo, activo, fecha_inicio, fecha_fin, descripcion, metadata_hospedaje, created_at")
      .order("fecha_inicio", { ascending: false }),
  ]);

  const createdPorNegocio = new Map<string, string>();
  for (const n of negociosCreated || []) {
    if (n.id && n.created_at) createdPorNegocio.set(n.id, n.created_at);
  }

  const eventosPorNegocio = new Map<string, any[]>();
  for (const ev of todosEventos || []) {
    if (!ev.negocio_id) continue;
    const arr = eventosPorNegocio.get(ev.negocio_id) || [];
    arr.push(ev);
    eventosPorNegocio.set(ev.negocio_id, arr);
  }

  const ahoraMs = Date.now();
  const historialPorNegocio: Record<string, HistorialAliadoCobro> = {};
  for (const a of initialData.aliados || []) {
    const fechaIngresoIso = createdPorNegocio.get(a.negocio_id) || a.fecha_registro_app;
    const fechaMs = fechaIngresoIso ? new Date(fechaIngresoIso).getTime() : ahoraMs;
    const diasActivo = Math.max(1, Math.floor((ahoraMs - fechaMs) / 86400000));
    const fechaIngreso = fechaIngresoIso
      ? new Date(fechaIngresoIso).toLocaleDateString("es-CO", {
          day: "2-digit",
          month: "short",
          year: "numeric",
          timeZone: "America/Bogota",
        })
      : "—";

    const evs = eventosPorNegocio.get(a.negocio_id) || [];
    historialPorNegocio[a.negocio_id] = {
      fecha_ingreso: fechaIngreso,
      dias_activo: diasActivo,
      total_anuncios_historicos: evs.length,
      anuncios_activos_hoy: evs.filter((e) => Boolean(e.activo) && esEventoVigente(e)).length,
      listado_anuncios: evs.map((e) => {
        const refIso = e.fecha_inicio || e.created_at;
        let fechaFmt = "—";
        try {
          if (refIso) {
            fechaFmt = new Date(refIso).toLocaleDateString("es-CO", {
              day: "2-digit",
              month: "short",
              year: "numeric",
              timeZone: "America/Bogota",
            });
          }
        } catch {}
        const estaActivo = Boolean(e.activo);
        const estaVigente = estaActivo && esEventoVigente(e);
        return {
          id: e.id,
          titulo: e.titulo || "Publicación",
          fecha: fechaFmt,
          activo: estaActivo,
          vigente: estaVigente,
        };
      }),
    };
  }

  return (
    <div className="min-h-screen bg-cream flex flex-col font-sans">
      <AdminNav userEmail={user?.email} />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        <CobrosDashboardClient
          initialData={initialData}
          historialPorNegocio={historialPorNegocio}
        />
      </main>
    </div>
  );
}

