import { createClient } from "@/lib/supabase/server";
import { Link, redirect } from "@/i18n/routing";
import { Button } from "@/components/ui/Button";
import { AdminNav } from "../AdminNav";
import { AdminAliadosList, type AliadoItem } from "./AdminAliadosList";
import { ModalKitProspeccion } from "./ModalKitProspeccion";
import { ModalDifusionWhatsApp } from "./ModalDifusionWhatsApp";
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
  let { data: rawNegocios, error: errNegocios } = await supabase
    .from("negocios")
    .select(`
      id,
      nombre,
      descripcion,
      categoria,
      zona_id,
      whatsapp,
      instagram,
      plan,
      plan_expira_en,
      activo,
      google_rating,
      google_total_reviews,
      google_maps_url,
      google_review_url,
      created_at,
      eventos (
        id,
        titulo,
        tipo,
        precio,
        precio_moneda,
        fecha_inicio,
        fecha_fin,
        activo,
        destacado,
        imagen_url,
        video_url,
        metadata_hospedaje,
        zona_id,
        descripcion
      )
    `)
    .order("nombre", { ascending: true });

  if (errNegocios && errNegocios.code === "42703") {
    const fallbackNeg = await supabase
      .from("negocios")
      .select(`
        id,
        nombre,
        descripcion,
        categoria,
        zona_id,
        whatsapp,
        instagram,
        plan,
        plan_expira_en,
        activo,
        created_at,
        eventos (
          id,
          titulo,
          tipo,
          precio,
          precio_moneda,
          fecha_inicio,
          fecha_fin,
          activo,
          destacado,
          imagen_url,
          video_url,
          metadata_hospedaje,
          zona_id,
          descripcion
        )
      `)
      .order("nombre", { ascending: true });
    rawNegocios = fallbackNeg.data as any;
  }

  const { data: rawZonas } = await supabase
    .from("zonas")
    .select("id, nombre, slug")
    .eq("activa", true);

  const mapaZonas: Record<string, { nombre: string; slug: string }> = {};
  for (const z of rawZonas || []) {
    mapaZonas[z.id] = { nombre: z.nombre, slug: z.slug };
  }

  const ahora = new Date();
  const hace7Dias = new Date(ahora.getTime() - 7 * 24 * 60 * 60 * 1000);

  // 2.1 Cargar clics de WhatsApp (fail-safe para producción)
  let rawClics: { evento_id: string | null; negocio_id: string | null; created_at: string }[] = [];
  try {
    const { data: clicsData, error: clicsErr } = await supabase
      .from("clics_whatsapp")
      .select("evento_id, negocio_id, created_at");
    if (!clicsErr && clicsData) {
      rawClics = clicsData;
    }
  } catch {
    // Silencioso para garantizar cero caídas en producción
  }

  const totalClicsGlobal = rawClics.length;
  const totalClics7DiasGlobal = rawClics.filter(
    (c) => new Date(c.created_at) >= hace7Dias
  ).length;

  // 3. Normalizar datos
  const todosLosAliados: AliadoItem[] = (rawNegocios || []).map((n: any) => {
    const evList = Array.isArray(n.eventos) ? n.eventos : [];
    const evIds = new Set(evList.map((e: any) => e.id));
    const clicsAliado = rawClics.filter(
      (c) => (c.negocio_id && c.negocio_id === n.id) || (c.evento_id && evIds.has(c.evento_id))
    );

    const eventosOrdenados = [...evList].sort(
      (a: any, b: any) => new Date(b.fecha_inicio).getTime() - new Date(a.fecha_inicio).getTime()
    );

    return {
      id: n.id,
      nombre: n.nombre,
      descripcion: n.descripcion || null,
      categoria: n.categoria,
      zona_id: n.zona_id,
      zonaSlug: mapaZonas[n.zona_id]?.slug || "minca",
      zonaNombre: mapaZonas[n.zona_id]?.nombre || "Minca",
      whatsapp: n.whatsapp,
      instagram: n.instagram,
      plan: n.plan,
      plan_expira_en: n.plan_expira_en,
      activo: n.activo,
      google_rating: n.google_rating ?? null,
      google_total_reviews: n.google_total_reviews ?? null,
      google_maps_url: n.google_maps_url ?? null,
      google_review_url: n.google_review_url ?? null,
      created_at: n.created_at,
      totalEventos: evList.length,
      eventosActivos: evList.filter((e: any) => e.activo).length,
      totalClics: clicsAliado.length,
      clics7Dias: clicsAliado.filter((c) => new Date(c.created_at) >= hace7Dias).length,
      eventos: eventosOrdenados,
    };
  });

  // 3.1 Detección inteligente de duplicados (Cero impacto en BD):
  // Si existen registros con el mismo nombre y zona, se preserva el que tiene eventos/clics y se oculta el registro huérfano vacío
  const mapaUnicos = new Map<string, AliadoItem>();
  for (const a of todosLosAliados) {
    const clave = `${a.zona_id}_${a.nombre.trim().toLowerCase()}`;
    const existente = mapaUnicos.get(clave);
    if (!existente) {
      mapaUnicos.set(clave, a);
    } else {
      // Priorizar el que tiene más eventos o más clics
      if (
        a.totalEventos > existente.totalEventos ||
        (a.totalClics || 0) > (existente.totalClics || 0)
      ) {
        mapaUnicos.set(clave, a);
      }
    }
  }

  const aliados = Array.from(mapaUnicos.values());

  const negociosList = aliados.map((a) => ({
    id: a.id,
    nombre: a.nombre,
  }));

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

      <main className="max-w-4xl mx-auto px-3.5 sm:px-6 py-4 sm:py-8 space-y-4 sm:space-y-6">
        {/* Banner principal con Kit de Prospección */}
        <div className="bg-white/70 backdrop-blur-sm p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-stone-light/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-serif text-xl sm:text-2xl text-forest font-bold">
                Aliados Comerciales y Planes B2B
              </h1>
              <span className="text-[11px] bg-forest/10 text-forest px-2.5 py-0.5 rounded-full font-medium">
                Paso 2: Monetización
              </span>
            </div>
            <p className="font-sans text-xs text-stone mt-1">
              Gestiona acuerdos con hostales, restaurantes, guías y aliados turísticos en cada destino.
              Controla renovaciones y genera mensajes de cobro por WhatsApp en 1 clic.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            <ModalDifusionWhatsApp aliados={aliados} />
            <Link href="/admin/nuevo">
              <Button size="sm" className="shadow-xs py-2 px-3 text-xs flex items-center gap-1.5 cursor-pointer">
                <span>+</span>
                <span>Publicar Plan / Nuevo Aliado</span>
              </Button>
            </Link>
            <ModalKitProspeccion />
          </div>
        </div>

        {/* 5 KPIs de Monetización B2B y Conversión */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-3">
          <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-white/70 border border-stone-light/80 shadow-xs">
            <p className="text-[10px] sm:text-[11px] text-stone font-sans uppercase tracking-wider">
              Total Aliados
            </p>
            <p className="font-serif text-xl sm:text-2xl text-forest font-bold mt-0.5">
              {totalAliados}
            </p>
            <p className="text-[10px] text-stone mt-0.5 truncate">🏛️ Comercios</p>
          </div>

          <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-white/70 border border-stone-light/80 shadow-xs">
            <p className="text-[10px] sm:text-[11px] text-stone font-sans uppercase tracking-wider">
              Suscripciones Pro
            </p>
            <p className="font-serif text-xl sm:text-2xl text-emerald-800 font-bold mt-0.5">
              {planesDePago}
            </p>
            <p className="text-[10px] text-emerald-700 font-medium mt-0.5 truncate">
              ⭐ Planes activos
            </p>
          </div>

          <div className="col-span-2 sm:col-span-1 p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-emerald-50/70 border border-emerald-200/80 shadow-xs">
            <p className="text-[10px] sm:text-[11px] text-emerald-800 font-sans uppercase tracking-wider font-semibold">
              Clics WhatsApp
            </p>
            <p className="font-serif text-xl sm:text-2xl text-emerald-900 font-bold mt-0.5">
              {totalClicsGlobal}
            </p>
            <p className="text-[10px] text-emerald-700 font-medium mt-0.5 truncate">
              📲 +{totalClics7DiasGlobal} en 7 días
            </p>
          </div>

          <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-white/70 border border-stone-light/80 shadow-xs">
            <p className="text-[10px] sm:text-[11px] text-stone font-sans uppercase tracking-wider">
              Atención / Cobros
            </p>
            <p className="font-serif text-xl sm:text-2xl text-amber-700 font-bold mt-0.5">
              {porVencerOVencidos}
            </p>
            <p className="text-[10px] text-amber-800 font-medium mt-0.5 truncate">
              ⚠️ Por vencer
            </p>
          </div>

          <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-white/70 border border-stone-light/80 shadow-xs">
            <p className="text-[10px] sm:text-[11px] text-stone font-sans uppercase tracking-wider">
              Planes Gratis
            </p>
            <p className="font-serif text-xl sm:text-2xl text-stone font-bold mt-0.5">
              {planesGratis}
            </p>
            <p className="text-[10px] text-stone mt-0.5 truncate">💡 Para upgrade</p>
          </div>
        </div>

        {/* Directorio con búsqueda, filtros y acciones */}
        <div className="bg-white/40 p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl border border-stone-light/60 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-lg sm:text-xl text-forest font-semibold">
              Directorio de Comercios y Acuerdos
            </h2>
            <span className="text-[11px] sm:text-xs text-stone font-sans">
              <strong>{totalAliados}</strong> registrados
            </span>
          </div>

          <AdminAliadosList
            aliados={aliados}
            negociosList={negociosList}
            locale={locale}
          />
        </div>
      </main>
    </div>
  );
}
