import { createClient } from "@/lib/supabase/server";
import { redirect } from "@/i18n/routing";
import { AdminNav } from "../AdminNav";
import { AdminAliadosList, type AliadoItem } from "./AdminAliadosList";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Aliados y Planes — PaDónde Admin",
};

export default async function AdminAliadosPage({
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

  // 2. Cargar negocios con sus eventos asociados
  const { data: rawNegocios } = await supabase
    .from("negocios")
    .select(`
      id,
      nombre,
      categoria,
      whatsapp,
      instagram,
      plan,
      plan_expira_en,
      activo,
      created_at,
      eventos (
        id,
        activo
      )
    `)
    .order("nombre", { ascending: true });

  const ahora = new Date();

  // 3. Normalizar datos
  const aliados: AliadoItem[] = (rawNegocios || []).map((n: any) => {
    const evList = Array.isArray(n.eventos) ? n.eventos : [];
    return {
      id: n.id,
      nombre: n.nombre,
      categoria: n.categoria,
      whatsapp: n.whatsapp,
      instagram: n.instagram,
      plan: n.plan,
      plan_expira_en: n.plan_expira_en,
      activo: n.activo,
      created_at: n.created_at,
      totalEventos: evList.length,
      eventosActivos: evList.filter((e: any) => e.activo).length,
    };
  });

  // 4. Métricas de Monetización B2B
  const totalAliados = aliados.length;
  const planesDePago = aliados.filter((a) => a.plan !== "gratis").length;
  const planesGratis = aliados.filter((a) => a.plan === "gratis").length;

  const porVencerOVencidos = aliados.filter((a) => {
    if (!a.plan_expira_en || a.plan === "gratis") return false;
    const diffDias = Math.ceil(
      (new Date(a.plan_expira_en).getTime() - ahora.getTime()) / (1000 * 60 * 60 * 24)
    );
    return diffDias <= 5; // Vencidos o por vencer en 5 días
  }).length;

  return (
    <div className="min-h-screen bg-cream pb-24">
      {/* Header unificado con navegación */}
      <AdminNav userEmail={user?.email} />

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        {/* Banner principal */}
        <div className="bg-white/70 backdrop-blur-sm p-6 rounded-3xl border border-stone-light/80 shadow-xs">
          <div className="flex items-center gap-2">
            <h1 className="font-serif text-2xl text-forest font-bold">
              Aliados Comerciales y Planes B2B
            </h1>
            <span className="text-xs bg-forest/10 text-forest px-2.5 py-0.5 rounded-full font-medium">
              Paso 2: Monetización
            </span>
          </div>
          <p className="font-sans text-xs text-stone mt-1">
            Gestiona los acuerdos con hostales, restaurantes, guías y artesanos de Minca.
            Controla sus renovaciones y genera mensajes de cobro por WhatsApp en 1 clic.
          </p>
        </div>

        {/* 4 KPIs de Monetización B2B */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-4 rounded-2xl bg-white/70 border border-stone-light/80 shadow-xs">
            <p className="text-[11px] text-stone font-sans uppercase tracking-wider">
              Total Aliados
            </p>
            <p className="font-serif text-2xl text-forest font-bold mt-0.5">
              {totalAliados}
            </p>
            <p className="text-[10px] text-stone mt-1">🏛️ Comercios registrados</p>
          </div>

          <div className="p-4 rounded-2xl bg-white/70 border border-stone-light/80 shadow-xs">
            <p className="text-[11px] text-stone font-sans uppercase tracking-wider">
              Suscripciones Pro
            </p>
            <p className="font-serif text-2xl text-emerald-800 font-bold mt-0.5">
              {planesDePago}
            </p>
            <p className="text-[10px] text-emerald-700 font-medium mt-1">
              ⭐ Planes de pago activos
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white/70 border border-stone-light/80 shadow-xs">
            <p className="text-[11px] text-stone font-sans uppercase tracking-wider">
              Atención / Cobros
            </p>
            <p className="font-serif text-2xl text-amber-700 font-bold mt-0.5">
              {porVencerOVencidos}
            </p>
            <p className="text-[10px] text-amber-800 font-medium mt-1">
              ⚠️ Vencidos o por vencer
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white/70 border border-stone-light/80 shadow-xs">
            <p className="text-[11px] text-stone font-sans uppercase tracking-wider">
              Planes Gratis
            </p>
            <p className="font-serif text-2xl text-stone font-bold mt-0.5">
              {planesGratis}
            </p>
            <p className="text-[10px] text-stone mt-1">💡 Prospectos para upgrade</p>
          </div>
        </div>

        {/* Directorio con búsqueda, filtros y acciones */}
        <div className="bg-white/40 p-5 rounded-3xl border border-stone-light/60 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-xl text-forest font-semibold">
              Directorio de Comercios y Acuerdos
            </h2>
            <span className="text-xs text-stone font-sans">
              <strong>{totalAliados}</strong> registrados
            </span>
          </div>

          <AdminAliadosList aliados={aliados} locale={locale} />
        </div>
      </main>
    </div>
  );
}
