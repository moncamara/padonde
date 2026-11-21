import { createClient } from "@/lib/supabase/server";
import { redirect } from "@/i18n/routing";
import { AdminNav } from "../AdminNav";
import { AdminHistoriasView } from "./AdminHistoriasView";
import { getStoriesConfigAsync } from "@/lib/supabase/queries";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Historias Efímeras & Brújula-Sol — PaDónde Admin",
  description: "Panel de control de historias efímeras y mascota animada Brújula-Sol.",
};

export default async function AdminHistoriasPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect({ href: "/admin/login", locale });
  }

  const initialConfig = await getStoriesConfigAsync();

  return (
    <div className="min-h-screen bg-cream pb-20">
      <AdminNav userEmail={user?.email} />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <AdminHistoriasView initialConfig={initialConfig} locale={locale} />
      </main>
    </div>
  );
}
