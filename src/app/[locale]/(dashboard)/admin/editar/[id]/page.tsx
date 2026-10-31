import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { Link } from "@/i18n/routing";
import { EventUpsertForm, type AliadoResumen } from "../../EventUpsertForm";
import type { EventoAdminItem } from "../../AdminEventList";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Editar Evento — PaDónde Admin",
};

export default async function AdminEditarEventoPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;

  // 1. Proteger ruta: verificar autenticación
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${locale}/admin/login`);
  }

  // 2. Cargar el evento a editar
  const { data: rawEvento, error: evError } = await supabase
    .from("eventos")
    .select(`
      *,
      negocio:negocios(
        id,
        nombre,
        whatsapp,
        instagram,
        categoria,
        google_rating,
        google_total_reviews,
        google_maps_url,
        google_review_url
      )
    `)
    .eq("id", id)
    .single();

  if (evError || !rawEvento) {
    notFound();
  }

  // 3. Cargar lista de aliados y zonas para autocompletado y selección
  let rawNegocios: any[] = [];
  const negociosRes = await supabase
    .from("negocios")
    .select(
      "id, nombre, whatsapp, instagram, categoria, zona_id, activo, google_rating, google_total_reviews, google_maps_url, google_review_url"
    )
    .order("nombre", { ascending: true });

  if (negociosRes.error && negociosRes.error.code === "42703") {
    const fallbackRes = await supabase
      .from("negocios")
      .select("id, nombre, whatsapp, instagram, categoria, zona_id, activo")
      .order("nombre", { ascending: true });
    rawNegocios = fallbackRes.data || [];
  } else {
    rawNegocios = negociosRes.data || [];
  }

  const { data: zonasRaw } = await supabase.from("zonas").select("id, nombre, slug");
  const mapaZonas: Record<string, { slug: string; nombre: string }> = {};
  for (const z of zonasRaw || []) {
    mapaZonas[z.id] = { slug: z.slug, nombre: z.nombre };
  }

  const aliados: AliadoResumen[] = rawNegocios.map((n) => ({
    id: n.id,
    nombre: n.nombre,
    whatsapp: n.whatsapp || "",
    instagram: n.instagram || "",
    categoria: n.categoria || "comida",
    zona_id: n.zona_id,
    zonaSlug: n.zona_id && mapaZonas[n.zona_id] ? mapaZonas[n.zona_id].slug : "minca",
    zonaNombre: n.zona_id && mapaZonas[n.zona_id] ? mapaZonas[n.zona_id].nombre : "Minca",
    activo: n.activo,
    google_rating: n.google_rating ?? null,
    google_total_reviews: n.google_total_reviews ?? null,
    google_maps_url: n.google_maps_url ?? null,
    google_review_url: n.google_review_url ?? null,
  }));

  const eventoAdmin: EventoAdminItem = {
    id: rawEvento.id,
    titulo: rawEvento.titulo,
    tipo: rawEvento.tipo,
    precio: rawEvento.precio,
    precio_moneda: rawEvento.precio_moneda || "COP",
    fecha_inicio: rawEvento.fecha_inicio,
    fecha_fin: rawEvento.fecha_fin,
    destacado: Boolean(rawEvento.destacado),
    tiene_boleteria: Boolean(rawEvento.tiene_boleteria),
    activo: Boolean(rawEvento.activo),
    descripcion: rawEvento.descripcion,
    imagen_url: rawEvento.imagen_url,
    video_url: rawEvento.video_url,
    negocio_id: rawEvento.negocio_id,
    zona_id: rawEvento.zona_id,
    zonaSlug: rawEvento.zona_id && mapaZonas[rawEvento.zona_id] ? mapaZonas[rawEvento.zona_id].slug : "minca",
    negocio: rawEvento.negocio,
    metadata_hospedaje: rawEvento.metadata_hospedaje,
  };

  return (
    <div className="min-h-screen bg-cream pb-24">
      <header className="sticky top-0 z-20 bg-cream/90 backdrop-blur-sm border-b border-stone-light px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <Link
            href="/admin"
            className="inline-flex items-center gap-1.5 text-xs text-forest hover:text-terra font-medium font-sans"
          >
            <span>←</span> Panel Admin
          </Link>
          <span className="font-serif text-lg text-forest font-bold">Editar Evento</span>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl text-forest font-bold">
            {eventoAdmin.titulo}
          </h1>
          <p className="font-sans text-xs text-stone mt-1">
            Modifica la propuesta, fotos de vitrina, fechas o vinculación de aliado.
          </p>
        </div>

        <EventUpsertForm
          mode="editar"
          initialEvento={eventoAdmin}
          aliados={aliados}
          defaultZona={eventoAdmin.zonaSlug || "minca"}
          isModal={false}
        />
      </main>
    </div>
  );
}
