import { createClient } from "@/lib/supabase/server";
import { redirect } from "@/i18n/routing";
import { AdminNav } from "../AdminNav";
import { AdminHospedajesList } from "./AdminHospedajesList";
import type { AliadoConVerticales } from "../AliadoSelectorField";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Gestión de Hospedajes — PaDónde Admin",
};

const ZONAS_CANONICAS_ADMIN = [
  { id: "zona-minca", nombre: "Minca", slug: "minca" },
  { id: "zona-mendihuaca", nombre: "Mendihuaca", slug: "mendihuaca" },
  { id: "zona-tayrona", nombre: "Tayrona", slug: "tayrona" },
  { id: "zona-taganga", nombre: "Taganga", slug: "taganga" },
];

export default async function AdminHospedajesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  // 1. Proteger ruta
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect({ href: "/admin/login", locale });
  }

  // Saneamiento de zona y título para Zirumake
  try {
    await supabase
      .from("negocios")
      .update({ zona_id: "21c8930c-5e37-44a2-b129-fe5f0e6d8899" })
      .ilike("nombre", "%zirumake%")
      .neq("zona_id", "21c8930c-5e37-44a2-b129-fe5f0e6d8899");

    await supabase
      .from("eventos")
      .update({
        titulo: "Hostal Zirumake Tayrona 🌿🏊",
        zona_id: "21c8930c-5e37-44a2-b129-fe5f0e6d8899",
        descripcion:
          "Hospedaje ecológico y descanso en plena naturaleza a pocos minutos de la entrada El Zaino del Parque Nacional Natural Tayrona. Disfruta de piscina, cabañas privadas, ambiente selvático y tranquilidad absoluta.",
      })
      .eq("id", "33dcb70c-3ab7-459b-98d0-bf907e6755e2")
      .ilike("titulo", "%Minca%");
  } catch {}

  // 2. Obtener hospedajes registrados
  let { data: hospedajesData, error: hospErr } = await supabase
    .from("eventos")
    .select(`
      id,
      negocio_id,
      zona_id,
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
      created_at,
      metadata_hospedaje,
      zonas:zona_id (
        id,
        nombre,
        slug
      ),
      negocio:negocios (
        id,
        nombre,
        whatsapp,
        instagram,
        activo,
        google_rating,
        google_total_reviews,
        google_maps_url,
        google_review_url
      )
    `)
    .eq("tipo", "hospedaje")
    .order("created_at", { ascending: false });

  if (hospErr && hospErr.code === "42703") {
    const fallbackRes = await supabase
      .from("eventos")
      .select(`
        id,
        negocio_id,
        zona_id,
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
        created_at,
        metadata_hospedaje,
        zonas:zona_id (
          id,
          nombre,
          slug
        ),
        negocio:negocios (
          nombre,
          whatsapp,
          instagram,
          activo
        )
      `)
      .eq("tipo", "hospedaje")
      .order("created_at", { ascending: false });
    hospedajesData = fallbackRes.data as any;
  }

  // 2.5 Obtener mapa de fechas de edición por aliado desde configuraciones
  let fechasEdicionMapa: Record<string, string> = {};
  try {
    const { data: cfgEdicion } = await supabase
      .from("configuraciones")
      .select("valor")
      .eq("clave", "fechas_edicion_aliados")
      .maybeSingle();
    if (cfgEdicion?.valor && typeof cfgEdicion.valor === "object") {
      fechasEdicionMapa = cfgEdicion.valor as Record<string, string>;
    }
  } catch {}

  const hospedajesEnriquecidos = ((hospedajesData as any[]) || []).map((h) => {
    const fechaAliado = h.negocio_id ? fechasEdicionMapa[h.negocio_id] : undefined;
    const ultimaActual = h.metadata_hospedaje?.ultima_edicion;
    let ultimaEfectiva = ultimaActual;
    if (fechaAliado) {
      if (!ultimaEfectiva || new Date(fechaAliado).getTime() > new Date(ultimaEfectiva).getTime()) {
        ultimaEfectiva = fechaAliado;
      }
    }
    if (ultimaEfectiva && ultimaEfectiva !== ultimaActual) {
      return {
        ...h,
        metadata_hospedaje: {
          ...(h.metadata_hospedaje || {}),
          ultima_edicion: ultimaEfectiva,
        },
      };
    }
    return h;
  });

  // 3. Obtener zonas para el formulario (garantizar que siempre aparezcan Tayrona y Taganga en admin)
  const { data: zonasData } = await supabase
    .from("zonas")
    .select("id, nombre, slug, activa")
    .order("nombre", { ascending: true });

  const mapaZonasAdmin = new Map<string, { id: string; nombre: string; slug: string }>();
  for (const z of ZONAS_CANONICAS_ADMIN) {
    mapaZonasAdmin.set(z.slug, z);
  }
  for (const z of zonasData || []) {
    if (z.slug) mapaZonasAdmin.set(z.slug, { id: z.id, nombre: z.nombre, slug: z.slug });
  }
  const zonasCompletas = Array.from(mapaZonasAdmin.values());

  // 4. Cargar catálogo maestro de aliados (negocios) con conteo de verticales para asociar sin duplicar
  let rawNegocios: any[] = [];
  const negociosRes = await supabase
    .from("negocios")
    .select(
      "id, nombre, whatsapp, instagram, categoria, zona_id, activo, google_rating, google_total_reviews, google_maps_url, google_review_url"
    )
    .order("nombre", { ascending: true });

  if (negociosRes.error && negociosRes.error.code === "42703") {
    const fallbackNeg = await supabase
      .from("negocios")
      .select("id, nombre, whatsapp, instagram, categoria, zona_id, activo")
      .order("nombre", { ascending: true });
    rawNegocios = fallbackNeg.data || [];
  } else {
    rawNegocios = negociosRes.data || [];
  }

  const { data: eventosVerticales } = await supabase
    .from("eventos")
    .select("negocio_id, tipo");

  const conteosPorNegocio = new Map<string, { eventos: number; hospedajes: number }>();
  for (const ev of eventosVerticales || []) {
    if (!ev.negocio_id) continue;
    const prev = conteosPorNegocio.get(ev.negocio_id) || { eventos: 0, hospedajes: 0 };
    if (ev.tipo === "hospedaje") {
      prev.hospedajes += 1;
    } else {
      prev.eventos += 1;
    }
    conteosPorNegocio.set(ev.negocio_id, prev);
  }

  const mapaZonasById = new Map<string, { nombre: string; slug: string }>();
  for (const z of zonasCompletas) {
    mapaZonasById.set(z.id, { nombre: z.nombre, slug: z.slug });
  }

  const aliados: AliadoConVerticales[] = rawNegocios.map((n) => {
    const zInfo = n.zona_id ? mapaZonasById.get(n.zona_id) : undefined;
    const counts = conteosPorNegocio.get(n.id) || { eventos: 0, hospedajes: 0 };
    return {
      id: n.id,
      nombre: n.nombre,
      whatsapp: n.whatsapp || "",
      instagram: n.instagram || "",
      categoria: n.categoria || "comida",
      zona_id: n.zona_id,
      zonaSlug: zInfo?.slug || "minca",
      zonaNombre: zInfo?.nombre || "Minca",
      activo: n.activo,
      google_rating: n.google_rating ?? null,
      google_total_reviews: n.google_total_reviews ?? null,
      google_maps_url: n.google_maps_url ?? null,
      google_review_url: n.google_review_url ?? null,
      eventosCount: counts.eventos,
      hospedajesCount: counts.hospedajes,
    };
  });

  return (
    <div className="min-h-screen bg-cream flex flex-col">
      <AdminNav userEmail={user?.email} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        <AdminHospedajesList
          hospedajes={hospedajesEnriquecidos}
          zonas={zonasCompletas}
          aliados={aliados}
          locale={locale}
        />
      </main>
    </div>
  );
}
