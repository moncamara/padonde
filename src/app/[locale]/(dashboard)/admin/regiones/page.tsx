import { createClient } from "@/lib/supabase/server";
import { redirect } from "@/i18n/routing";
import { AdminNav } from "../AdminNav";
import { AdminRegionesView } from "./AdminRegionesView";
import { CONFIG_TERRITORIAL } from "@/constants";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Configuración Territorial de Categorías — PaDónde Admin",
};

export default async function AdminRegionesPage({
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

  return (
    <div className="min-h-screen bg-cream/60">
      <AdminNav userEmail={user?.email} />
      <main className="px-4 py-8">
        <AdminRegionesView initialConfig={CONFIG_TERRITORIAL} />
      </main>
    </div>
  );
}
