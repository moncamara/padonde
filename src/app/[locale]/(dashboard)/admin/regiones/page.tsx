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

  // Cargar configuración activa desde Supabase con fallback al archivo local
  let configTerritorial = CONFIG_TERRITORIAL;
  try {
    const { data: configDb } = await supabase
      .from("configuraciones")
      .select("valor")
      .eq("clave", "config_territorial")
      .maybeSingle();

    if (configDb?.valor && typeof configDb.valor === "object") {
      configTerritorial = configDb.valor as any;
    }
  } catch {
    // Silencioso: fallback a CONFIG_TERRITORIAL
  }

  return (
    <div className="min-h-screen bg-cream/60">
      <AdminNav userEmail={user?.email} />
      <main className="px-4 py-8">
        <AdminRegionesView initialConfig={configTerritorial} />
      </main>
    </div>
  );
}
