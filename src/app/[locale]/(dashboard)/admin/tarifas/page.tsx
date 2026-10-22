import { createClient } from "@/lib/supabase/server";
import { redirect } from "@/i18n/routing";
import { AdminNav } from "../AdminNav";
import { CotizadorVentas } from "./CotizadorVentas";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cotizador & Tarifas de Ventas — PaDónde Admin",
  description: "Herramienta interactiva de ventas y tarifas para aliados de Pa' Donde.",
};

export default async function AdminTarifasPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  // 1. Proteger ruta con sesión de Supabase Auth
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect({ href: "/admin/login", locale });
  }

  return (
    <div className="min-h-screen bg-cream flex flex-col font-sans">
      <AdminNav userEmail={user?.email} />

      <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6">
        <CotizadorVentas />
      </main>
    </div>
  );
}
