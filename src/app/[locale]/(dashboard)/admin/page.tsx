import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "@/i18n/routing";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/Button";
import { AdminEventList, type EventoAdminItem } from "./AdminEventList";
import { AdminNav } from "./AdminNav";
import { getFechaYMDColombia, getFechaYMDDesdeISO, eventoCoincideConFiltroTiempo } from "@/lib/utils";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Panel de Control — PaDónde Admin",
};

export default async function AdminDashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  // 1. Proteger ruta: verificar autenticación
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect({ href: "/admin/login", locale });
  }

  // 2. Cargar eventos y negocios desde Supabase
  const { data: rawEventos } = await supabase
    .from("eventos")
    .select(`
      id,
      negocio_id,
      titulo,
      descripcion,
      tipo,
      precio,
      precio_moneda,
      fecha_inicio,
      fecha_fin,
      imagen_url,
      destacado,
      tiene_boleteria,
      activo,
      negocio:negocios (
        id,
        nombre,
        whatsapp
      )
    `)
    .order("fecha_inicio", { ascending: false });

  const { data: rawNegocios } = await supabase
    .from("negocios")
    .select("id, nombre")
    .order("nombre");

  const { count: totalNegocios } = await supabase
    .from("negocios")
    .select("*", { count: "exact", head: true });

  const eventos: EventoAdminItem[] = (rawEventos || []) as any;

  // 3. Cálculos de métricas operativas en horario Colombia (UTC-5)
  const hoyYMD = getFechaYMDColombia(new Date());

  const eventosVigentes = eventos.filter((e) => {
    if (!e.activo) return false;
    const ymdInicio = getFechaYMDDesdeISO(e.fecha_inicio);
    const ymdFin = e.fecha_fin ? getFechaYMDDesdeISO(e.fecha_fin) : null;
    return ymdFin ? ymdFin >= hoyYMD : ymdInicio >= hoyYMD;
  });

  const eventosHoy = eventosVigentes.filter((e) =>
    eventoCoincideConFiltroTiempo(e.fecha_inicio, "hoy", new Date(), e.fecha_fin, e.descripcion)
  ).length;
  const destacadosActivos = eventosVigentes.filter((e) => e.destacado).length;
  const eventosPausados = eventos.filter((e) => !e.activo).length;

  return (
    <div className="min-h-screen bg-cream pb-24">
      {/* Header unificado con navegación */}
      <AdminNav userEmail={user?.email} />

      {/* Contenido principal */}
      <main className="max-w-4xl mx-auto px-3.5 sm:px-6 py-4 sm:py-8 space-y-4 sm:space-y-6">
        {/* Banner de bienvenida y botón de acción */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3.5 sm:gap-4 bg-white/70 backdrop-blur-sm p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-stone-light/80 shadow-xs">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-serif text-xl sm:text-2xl text-forest font-bold">Cartelera de Minca</h1>
              <span className="text-[11px] bg-forest/10 text-forest px-2.5 py-0.5 rounded-full font-medium">
                Paso 1: Organización
              </span>
            </div>
            <p className="font-sans text-xs text-stone mt-1">
              Sesión activa: <strong className="text-forest">{user?.email}</strong>
            </p>
          </div>

          <Link href="/admin/nuevo" className="w-full sm:w-auto">
            <Button size="md" className="w-full sm:w-auto shadow-sm py-2 sm:py-2.5 text-xs sm:text-sm">
              <span>+</span> Publicar Nuevo Evento
            </Button>
          </Link>
        </div>

        {/* 4 Métricas Clave de Salud Operativa */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
          <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-white/70 border border-stone-light/80 shadow-xs">
            <p className="text-[10px] sm:text-[11px] text-stone font-sans uppercase tracking-wider">Vigentes</p>
            <p className="font-serif text-xl sm:text-2xl text-forest font-bold mt-0.5">
              {eventosVigentes.length}
            </p>
            <p className="text-[10px] text-emerald-700 font-medium mt-0.5 truncate">
              🟢 {eventosHoy} hoy
            </p>
          </div>

          <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-white/70 border border-stone-light/80 shadow-xs">
            <p className="text-[10px] sm:text-[11px] text-stone font-sans uppercase tracking-wider">Destacados</p>
            <p className="font-serif text-xl sm:text-2xl text-terra font-bold mt-0.5">
              {destacadosActivos}
            </p>
            <p className="text-[10px] text-stone mt-0.5 truncate">⭐ Visibilidad</p>
          </div>

          <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-white/70 border border-stone-light/80 shadow-xs">
            <p className="text-[10px] sm:text-[11px] text-stone font-sans uppercase tracking-wider">Pausados</p>
            <p className="font-serif text-xl sm:text-2xl text-stone font-bold mt-0.5">
              {eventosPausados}
            </p>
            <p className="text-[10px] text-stone mt-0.5 truncate">⏸️ Pausados</p>
          </div>

          <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-white/70 border border-stone-light/80 shadow-xs">
            <p className="text-[10px] sm:text-[11px] text-stone font-sans uppercase tracking-wider">Aliados</p>
            <p className="font-serif text-xl sm:text-2xl text-forest font-bold mt-0.5">
              {totalNegocios || 0}
            </p>
            <p className="text-[10px] text-stone mt-0.5 truncate">🏛️ Comercios</p>
          </div>
        </div>

        {/* Lista de Eventos con Pestañas de Vigencia y Buscador */}
        <div className="bg-white/40 p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl border border-stone-light/60 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-lg sm:text-xl text-forest font-semibold">
              Gestión de Eventos y Planes
            </h2>
            <span className="text-[11px] sm:text-xs text-stone font-sans">
              Histórico: <strong>{eventos.length}</strong>
            </span>
          </div>

          <Suspense fallback={<div className="p-8 text-center text-xs text-stone">Cargando eventos...</div>}>
            <AdminEventList
              eventos={eventos}
              negocios={rawNegocios || []}
              locale={locale}
            />
          </Suspense>
        </div>
      </main>
    </div>
  );
}
