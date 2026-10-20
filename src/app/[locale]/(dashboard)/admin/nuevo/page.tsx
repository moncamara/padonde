import { createClient } from "@/lib/supabase/server";
import { redirect } from "@/i18n/routing";
import { Link } from "@/i18n/routing";
import { AdminPublishForm } from "./AdminPublishForm";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Nuevo Evento — PaDónde Admin",
};

export default async function AdminNuevoEventoPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ negocio?: string }>;
}) {
  const { locale } = await params;
  const { negocio: negocioId } = (await searchParams) || {};

  // Proteger ruta: verificar autenticación
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect({ href: "/admin/login", locale });
  }

  // Cargar aliados existentes y zonas para autocompletado y vinculación
  const [negociosRes, zonasRes] = await Promise.all([
    supabase
      .from("negocios")
      .select("id, nombre, whatsapp, instagram, categoria, zona_id, activo")
      .order("nombre", { ascending: true }),
    supabase.from("zonas").select("id, nombre, slug"),
  ]);

  const rawNegocios = negociosRes.data || [];
  const rawZonas = zonasRes.data || [];
  const mapaZonas: Record<string, { slug: string; nombre: string }> = {};
  for (const z of rawZonas) {
    mapaZonas[z.id] = { slug: z.slug, nombre: z.nombre };
  }

  const aliados = rawNegocios.map((n) => ({
    id: n.id,
    nombre: n.nombre,
    whatsapp: n.whatsapp || "",
    instagram: n.instagram || "",
    categoria: n.categoria || "comida",
    zona_id: n.zona_id,
    zonaSlug: n.zona_id && mapaZonas[n.zona_id] ? mapaZonas[n.zona_id].slug : "minca",
    zonaNombre: n.zona_id && mapaZonas[n.zona_id] ? mapaZonas[n.zona_id].nombre : "Minca",
    activo: n.activo,
  }));

  let defaultNegocio:
    | {
        id?: string;
        nombre: string;
        whatsapp: string;
        instagram?: string | null;
        categoria?: string;
        zonaSlug?: string;
      }
    | undefined = undefined;

  if (negocioId) {
    const encontrado = aliados.find((a) => a.id === negocioId);
    if (encontrado) {
      defaultNegocio = {
        id: encontrado.id,
        nombre: encontrado.nombre,
        whatsapp: encontrado.whatsapp,
        instagram: encontrado.instagram,
        categoria: encontrado.categoria,
        zonaSlug: encontrado.zonaSlug,
      };
    }
  }

  return (
    <div className="min-h-screen bg-cream pb-24">
      <header className="sticky top-0 z-20 bg-cream/90 backdrop-blur-sm border-b border-stone-light px-4 py-3">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <Link
            href="/admin"
            className="inline-flex items-center gap-1.5 text-xs text-forest hover:text-terra font-medium font-sans"
          >
            <span>←</span> Panel Admin
          </Link>
          <span className="font-serif text-lg text-forest">Nuevo Evento</span>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-8 space-y-6">
        <div>
          <h1 className="font-serif text-3xl text-forest">
            {defaultNegocio ? `Publicar para ${defaultNegocio.nombre}` : "Publicar para un Negocio"}
          </h1>
          <p className="font-sans text-xs text-stone mt-1">
            {defaultNegocio
              ? `Datos de ${defaultNegocio.nombre} precargados. Completa los detalles de la experiencia.`
              : "Selecciona un aliado existente o escribe uno nuevo para publicar en la cartelera."}
          </p>
        </div>

        <AdminPublishForm
          defaultZona={defaultNegocio?.zonaSlug || "minca"}
          initialNegocio={defaultNegocio}
          aliados={aliados}
        />
      </main>
    </div>
  );
}
