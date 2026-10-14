import { createClient } from "@/lib/supabase/server";
import { redirect } from "@/i18n/routing";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/Button";
import { AdminEventList, type EventoAdminItem } from "./AdminEventList";
import { AdminNav } from "./AdminNav";
import { getFechaYMDColombia, getFechaYMDDesdeISO } from "@/lib/utils";
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
      titulo,
      tipo,
      precio,
      precio_moneda,
      fecha_inicio,
      fecha_fin,
      destacado,
      tiene_boleteria,
      activo,
      negocio:negocios (
        nombre,
        whatsapp
      )
    `)
    .order("fecha_inicio", { ascending: false });

  const { count: totalNegocios } = await supabase
    .from("negocios")
    .select("*", { count: "exact", head: true });

  const eventos: EventoAdminItem[] = (rawEventos || []) as any;

  // 3. Cálculos de métricas operativas en horario Colombia (UTC-5)
  const hoyYMD = getFechaYMDColombia(new Date());

  const eventosVigentes = eventos.filter(
    (e) => e.activo && getFechaYMDDesdeISO(e.fecha_inicio) >= hoyYMD
  );
  const eventosHoy = eventosVigentes.filter(
    (e) => getFechaYMDDesdeISO(e.fecha_inicio) === hoyYMD
  ).length;
  const destacadosActivos = eventosVigentes.filter((e) => e.destacado).length;
  const eventosPausados = eventos.filter((e) => !e.activo).length;

  return (
    <div className="min-h-screen bg-cream pb-24">
      {/* Header unificado con navegación */}
      <AdminNav userEmail={user?.email} />

      {/* Contenido principal */}
      <main className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        {/* Banner de bienvenida y botón de acción */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white/70 backdrop-blur-sm p-6 rounded-3xl border border-stone-light/80 shadow-xs">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-serif text-2xl text-forest font-bold">Cartelera de Minca</h1>
              <span className="text-xs bg-forest/10 text-forest px-2.5 py-0.5 rounded-full font-medium">
                Paso 1: Organización
              </span>
            </div>
            <p className="font-sans text-xs text-stone mt-1">
              Sesión activa como: <strong className="text-forest">{user?.email}</strong>
            </p>
          </div>

          <Link href="/admin/nuevo">
            <Button size="md" className="shadow-sm">
              <span>+</span> Publicar Nuevo Evento
            </Button>
          </Link>
        </div>

        {/* 4 Métricas Clave de Salud Operativa */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-4 rounded-2xl bg-white/70 border border-stone-light/80 shadow-xs">
            <p className="text-[11px] text-stone font-sans uppercase tracking-wider">Vigentes</p>
            <p className="font-serif text-2xl text-forest font-bold mt-0.5">
              {eventosVigentes.length}
            </p>
            <p className="text-[10px] text-emerald-700 font-medium mt-1">
              🟢 {eventosHoy} para hoy
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white/70 border border-stone-light/80 shadow-xs">
            <p className="text-[11px] text-stone font-sans uppercase tracking-wider">Destacados</p>
            <p className="font-serif text-2xl text-terra font-bold mt-0.5">
              {destacadosActivos}
            </p>
            <p className="text-[10px] text-stone mt-1">⭐ Máxima visibilidad</p>
          </div>

          <div className="p-4 rounded-2xl bg-white/70 border border-stone-light/80 shadow-xs">
            <p className="text-[11px] text-stone font-sans uppercase tracking-wider">Pausados</p>
            <p className="font-serif text-2xl text-stone font-bold mt-0.5">
              {eventosPausados}
            </p>
            <p className="text-[10px] text-stone mt-1">⏸️ Fuera de cartelera</p>
          </div>

          <div className="p-4 rounded-2xl bg-white/70 border border-stone-light/80 shadow-xs">
            <p className="text-[11px] text-stone font-sans uppercase tracking-wider">Aliados</p>
            <p className="font-serif text-2xl text-forest font-bold mt-0.5">
              {totalNegocios || 0}
            </p>
            <p className="text-[10px] text-stone mt-1">🏛️ Negocios registrados</p>
          </div>
        </div>

        {/* Lista de Eventos con Pestañas de Vigencia y Buscador */}
        <div className="bg-white/40 p-5 rounded-3xl border border-stone-light/60 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-xl text-forest font-semibold">
              Gestión de Eventos y Planes
            </h2>
            <span className="text-xs text-stone font-sans">
              Total histórico: <strong>{eventos.length}</strong>
            </span>
          </div>

          <AdminEventList eventos={eventos} locale={locale} />
        </div>
      </main>
    </div>
  );
}
