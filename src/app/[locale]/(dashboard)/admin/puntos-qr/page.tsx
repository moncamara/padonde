import { createClient } from "@/lib/supabase/server";
import { redirect } from "@/i18n/routing";
import { AdminNav } from "../AdminNav";
import { PuntosQRMetricas } from "./PuntosQRMetricas";
import { AdminQRGenerator } from "./AdminQRGenerator";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Puntos QR y Atribución — PaDónde Admin",
};

export default async function AdminPuntosQRPage({
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
    <div className="min-h-screen bg-cream pb-24">
      {/* Header unificado con navegación */}
      <AdminNav userEmail={user?.email} />

      <main className="max-w-3xl mx-auto px-3.5 sm:px-4 py-4 sm:py-8 space-y-4 sm:space-y-6">
        {/* Banner principal */}
        <div className="bg-white/70 backdrop-blur-sm p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-stone-light/80 shadow-xs">
          <div className="flex items-center gap-2">
            <h1 className="font-serif text-xl sm:text-2xl text-forest font-bold">
              Puntos QR y Distribución Física
            </h1>
            <span className="text-[11px] bg-forest/10 text-forest px-2.5 py-0.5 rounded-full font-medium">
              Paso 3: Atribución
            </span>
          </div>
          <p className="font-sans text-xs text-stone mt-1">
            Genera códigos QR únicos para ubicar en afiches, mostradores y mesas de hostales y cafés.
            Cada enlace incluye el origen para saber de dónde llegan los turistas a la cartelera.
          </p>
        </div>

        {/* 3 Métricas Rápidas de Distribución */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-white/70 border border-stone-light/80 shadow-xs">
            <p className="text-[10px] sm:text-[11px] text-stone font-sans uppercase tracking-wider">
              Puntos Clave
            </p>
            <p className="font-serif text-xl sm:text-2xl text-forest font-bold mt-0.5">
              6
            </p>
            <p className="text-[10px] text-emerald-700 font-medium mt-0.5 truncate">
              📍 Minca activos
            </p>
          </div>

          <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-white/70 border border-stone-light/80 shadow-xs">
            <p className="text-[10px] sm:text-[11px] text-stone font-sans uppercase tracking-wider">
              Atribución
            </p>
            <p className="font-serif text-xl sm:text-2xl text-terra font-bold mt-0.5">
              ?src=
            </p>
            <p className="text-[10px] text-stone mt-0.5 truncate">🏷️ UTM activo</p>
          </div>

          <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-white/70 border border-stone-light/80 shadow-xs">
            <p className="text-[10px] sm:text-[11px] text-stone font-sans uppercase tracking-wider">
              Leads [Ref]
            </p>
            <p className="font-serif text-xl sm:text-2xl text-emerald-800 font-bold mt-0.5">
              100%
            </p>
            <p className="text-[10px] text-stone mt-0.5 truncate">💬 WhatsApp listo</p>
          </div>
        </div>

        {/* Auditoría Antifraude y Métricas en Vivo */}
        <PuntosQRMetricas />

        {/* Módulo Generador y Presets */}
        <AdminQRGenerator locale={locale} />
      </main>
    </div>
  );
}
