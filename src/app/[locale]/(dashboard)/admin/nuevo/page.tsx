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
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  // Proteger ruta: verificar autenticación
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect({ href: "/admin/login", locale });
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
          <h1 className="font-serif text-3xl text-forest">Publicar para un Negocio</h1>
          <p className="font-sans text-xs text-stone mt-1">
            Este evento se publicará inmediatamente en la cartelera de Minca.
          </p>
        </div>

        <AdminPublishForm defaultZona="minca" />
      </main>
    </div>
  );
}
