import { createClient } from "@/lib/supabase/server";
import { redirect } from "@/i18n/routing";
import { AdminNav } from "../AdminNav";
import { AdminHospedajesList } from "./AdminHospedajesList";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Gestión de Hospedajes — PaDónde Admin",
};

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

  // 3. Obtener zonas para el formulario (garantizar que siempre aparezcan Tayrona y Taganga en admin)
  const { data: zonasData } = await supabase
    .from("zonas")
    .select("id, nombre, slug, activa")
    .order("nombre", { ascending: true });

  const ZONAS_CANONICAS_ADMIN = [
    { id: "zona-minca", nombre: "Minca", slug: "minca" },
    { id: "zona-mendihuaca", nombre: "Mendihuaca", slug: "mendihuaca" },
    { id: "zona-tayrona", nombre: "Tayrona", slug: "tayrona" },
    { id: "zona-taganga", nombre: "Taganga", slug: "taganga" },
  ];

  const mapaZonasAdmin = new Map<string, { id: string; nombre: string; slug: string }>();
  for (const z of ZONAS_CANONICAS_ADMIN) {
    mapaZonasAdmin.set(z.slug, z);
  }
  for (const z of zonasData || []) {
    if (z.slug) mapaZonasAdmin.set(z.slug, { id: z.id, nombre: z.nombre, slug: z.slug });
  }
  const zonasCompletas = Array.from(mapaZonasAdmin.values());

  return (
    <div className="min-h-screen bg-cream flex flex-col">
      <AdminNav userEmail={user?.email} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        <AdminHospedajesList
          hospedajes={(hospedajesData as any[]) || []}
          zonas={zonasCompletas}
          locale={locale}
        />
      </main>
    </div>
  );
}
