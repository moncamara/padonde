import { createClient } from "@/lib/supabase/server";
import { redirect } from "@/i18n/routing";
import { AdminNav } from "../AdminNav";
import { CobrosDashboardClient } from "./CobrosDashboardClient";
import { obtenerCobrosAliadosAction } from "./actions";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Finanzas & Cobros a Aliados — PaDónde Admin",
  description: "Control de acuerdos comerciales, cortesías y recaudos a aliados en PaDónde.",
};

export default async function AdminCobrosPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  // 1. Proteger ruta con sesión de Super Admin
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect({ href: "/admin/login", locale });
  }

  // 2. Carga inicial SSR rápida para renderizado instantáneo
  const initialData = await obtenerCobrosAliadosAction();

  return (
    <div className="min-h-screen bg-cream flex flex-col font-sans">
      <AdminNav userEmail={user?.email} />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        <CobrosDashboardClient initialData={initialData} />
      </main>
    </div>
  );
}

