import { createClient } from "@/lib/supabase/server";
import { redirect } from "@/i18n/routing";
import { AdminNav } from "../AdminNav";
import { AdminEsencialesList } from "./AdminEsencialesList";
import { MOCK_SERVICIOS_ESENCIALES } from "@/lib/mock/serviciosEsenciales";
import type { ServicioEsencial } from "@/lib/types";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Info Útil & Servicios Esenciales — PaDónde Admin",
};

export default async function AdminEsencialesPage({
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

  // 2. Cargar servicios esenciales desde Supabase (con fallback a mock si aún no está poblada la tabla)
  let servicios: ServicioEsencial[] = [];
  try {
    const { data: rawEsenciales, error } = await supabase
      .from("servicios_esenciales")
      .select("*")
      .order("created_at", { ascending: false });

    if (error || !rawEsenciales || rawEsenciales.length === 0) {
      servicios = MOCK_SERVICIOS_ESENCIALES;
    } else {
      servicios = rawEsenciales as ServicioEsencial[];
    }
  } catch (err) {
    console.warn("[AdminEsencialesPage] Fallback a mock data:", err);
    servicios = MOCK_SERVICIOS_ESENCIALES;
  }

  // 3. Cargar zonas activas
  const { data: zonasRaw } = await supabase
    .from("zonas")
    .select("id, nombre, slug")
    .order("nombre", { ascending: true });

  const zonas =
    zonasRaw && zonasRaw.length > 0
      ? zonasRaw
      : [
          { id: "zona-minca", nombre: "Minca", slug: "minca" },
          { id: "zona-mendihuaca", nombre: "Mendihuaca", slug: "mendihuaca" },
        ];

  // Métricas rápidas
  const totalActivos = servicios.filter((s) => s.activo).length;
  const totalCanje = servicios.filter(
    (s) => s.tipo_acuerdo === "canje_afiche" || !s.tipo_acuerdo
  ).length;
  const totalPatrocinados = servicios.filter(
    (s) => s.destacado_patrocinado
  ).length;

  return (
    <div className="min-h-screen bg-cream pb-16">
      <AdminNav userEmail={user?.email} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 space-y-6">
        {/* Cabecera Informativa y Contexto Comercial */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-2xl">💡</span>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-forest tracking-tight">
              Info Útil & Servicios Esenciales
            </h1>
          </div>
          <p className="font-sans text-xs sm:text-sm text-stone max-w-2xl leading-relaxed">
            Módulo para negocios fijos de infraestructura (Embassy Bank / &ldquo;El Banco de Minca&rdquo;,
            transporte, farmacias, tiendas locales). Aparecen en cápsulas compactas sin desordenar
            la cartelera de eventos del día.
          </p>
        </div>

        {/* Tarjetas de Métricas Rápidas */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-sans">
          <div className="bg-white/80 p-3.5 rounded-2xl border border-stone-light/70 shadow-2xs">
            <span className="text-[11px] text-stone font-medium block">
              Total Aliados
            </span>
            <span className="font-serif text-xl sm:text-2xl font-bold text-forest">
              {servicios.length}
            </span>
          </div>

          <div className="bg-white/80 p-3.5 rounded-2xl border border-stone-light/70 shadow-2xs">
            <span className="text-[11px] text-stone font-medium block">
              Activos en App
            </span>
            <span className="font-serif text-xl sm:text-2xl font-bold text-emerald-600">
              {totalActivos}
            </span>
          </div>

          <div className="bg-white/80 p-3.5 rounded-2xl border border-stone-light/70 shadow-2xs">
            <span className="text-[11px] text-stone font-medium block">
              🤝 Canje Talker QR
            </span>
            <span className="font-serif text-xl sm:text-2xl font-bold text-forest">
              {totalCanje}
            </span>
          </div>

          <div className="bg-white/80 p-3.5 rounded-2xl border border-stone-light/70 shadow-2xs">
            <span className="text-[11px] text-stone font-medium block">
              ★ Patrocinados
            </span>
            <span className="font-serif text-xl sm:text-2xl font-bold text-terra">
              {totalPatrocinados}
            </span>
          </div>
        </div>

        {/* Lista interactiva con filtros, toggle y edición */}
        <AdminEsencialesList serviciosIniciales={servicios} zonas={zonas} />
      </main>
    </div>
  );
}
