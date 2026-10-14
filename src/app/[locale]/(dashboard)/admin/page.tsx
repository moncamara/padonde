import { createClient } from "@/lib/supabase/server";
import { redirect } from "@/i18n/routing";
import { Link } from "@/i18n/routing";
import { formatFecha, formatPrecio } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { ToggleActivoButton } from "./ToggleActivoButton";
import { logoutAction } from "./login/actions";
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

  // 2. Cargar métricas y todos los eventos desde Supabase
  const { data: eventos } = await supabase
    .from("eventos")
    .select(`
      id,
      titulo,
      tipo,
      precio,
      precio_moneda,
      fecha_inicio,
      destacado,
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

  const totalEventos = eventos?.length || 0;
  const eventosActivos = eventos?.filter((e) => e.activo).length || 0;

  return (
    <div className="min-h-screen bg-cream pb-24">
      {/* Header superior */}
      <header className="sticky top-0 z-20 bg-cream/90 backdrop-blur-sm border-b border-stone-light px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">🌿</span>
            <span className="font-serif text-xl text-forest font-bold">PaDónde Admin</span>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/minca"
              target="_blank"
              className="text-xs text-stone hover:text-forest underline underline-offset-2 font-sans"
            >
              Ver web pública ↗
            </Link>

            <form action={logoutAction}>
              <button
                type="submit"
                className="text-xs text-red-600 hover:text-red-700 font-medium font-sans cursor-pointer px-2.5 py-1 rounded-lg border border-red-200 bg-red-50"
              >
                Cerrar sesión
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* Contenido principal */}
      <main className="max-w-2xl mx-auto px-4 py-8 space-y-8">
        {/* Banner de bienvenida y botón de acción */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white/70 backdrop-blur-sm p-6 rounded-3xl border border-stone-light/80 shadow-xs">
          <div>
            <h1 className="font-serif text-2xl text-forest">Cartelera de Minca</h1>
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

        {/* Tarjetas de métricas rápidas */}
        <div className="grid grid-cols-3 gap-3">
          <div className="p-4 rounded-2xl bg-white/60 border border-stone-light/70 text-center shadow-xs">
            <p className="text-xs text-stone font-sans">Publicados</p>
            <p className="font-serif text-2xl text-forest font-bold mt-1">
              {eventosActivos}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white/60 border border-stone-light/70 text-center shadow-xs">
            <p className="text-xs text-stone font-sans">Total Histórico</p>
            <p className="font-serif text-2xl text-forest font-bold mt-1">
              {totalEventos}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white/60 border border-stone-light/70 text-center shadow-xs">
            <p className="text-xs text-stone font-sans">Negocios</p>
            <p className="font-serif text-2xl text-forest font-bold mt-1">
              {totalNegocios || 0}
            </p>
          </div>
        </div>

        {/* Lista de eventos para gestionar */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-xl text-forest">Gestión de Eventos</h2>
            <span className="text-xs text-stone font-sans">{totalEventos} eventos</span>
          </div>

          <div className="space-y-3">
            {eventos?.map((ev: any) => {
              const negocio = Array.isArray(ev.negocio) ? ev.negocio[0] : ev.negocio;
              return (
                <article
                  key={ev.id}
                  className="bg-white/80 rounded-2xl p-4 border border-stone-light/70 flex items-center justify-between gap-4 shadow-xs"
                >
                  <div className="space-y-1 flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-serif text-base text-forest font-medium truncate">
                        {ev.titulo}
                      </h3>
                      {ev.destacado && (
                        <span className="text-[10px] bg-terra text-white px-2 py-0.5 rounded-full font-semibold">
                          ⭐ Destacado
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-stone font-sans">
                      {negocio?.nombre || "Sin negocio"} · {formatFecha(ev.fecha_inicio)} ·{" "}
                      {formatPrecio(ev.precio, ev.precio_moneda)}
                    </p>
                  </div>

                  {/* Interruptor Activo / Pausado */}
                  <div className="flex items-center gap-2">
                    <ToggleActivoButton eventoId={ev.id} activoInicial={ev.activo} />

                    <Link
                      href={`/minca/${ev.id}`}
                      target="_blank"
                      className="text-xs text-stone hover:text-forest p-1.5"
                      title="Ver en la web"
                    >
                      👁️
                    </Link>
                  </div>
                </article>
              );
            })}

            {totalEventos === 0 && (
              <div className="text-center py-12 text-stone bg-white/40 rounded-2xl border border-dashed border-stone-light">
                <p className="text-3xl mb-2">🌿</p>
                <p className="text-sm font-sans">No hay eventos registrados todavía.</p>
                <Link href="/admin/nuevo" className="inline-block mt-3">
                  <Button size="sm">Crear el primero</Button>
                </Link>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
