import { createClient } from "@/lib/supabase/server";
import { redirect } from "@/i18n/routing";
import { AdminNav } from "../AdminNav";
import { AdminMenuStudio } from "./AdminMenuStudio";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Estudio de Cartas & Menús — PaDónde Admin",
  description: "Estudio interactivo de temas para cartas digitales de aliados gastronómicos.",
};

export default async function AdminMenusPage({
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

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        <AdminMenuStudio locale={locale} />
      </main>
    </div>
  );
}
