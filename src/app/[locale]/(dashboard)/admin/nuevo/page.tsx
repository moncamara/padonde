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

  let defaultNegocio:
    | {
        nombre: string;
        whatsapp: string;
        instagram?: string | null;
        categoria?: string;
      }
    | undefined = undefined;

  if (negocioId) {
    const { data: n } = await supabase
      .from("negocios")
      .select("nombre, whatsapp, instagram, categoria")
      .eq("id", negocioId)
      .single();

    if (n) {
      defaultNegocio = n as any;
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
              : "Este evento se publicará inmediatamente en la cartelera seleccionada."}
          </p>
        </div>

        <AdminPublishForm defaultZona="minca" initialNegocio={defaultNegocio} />
      </main>
    </div>
  );
}
