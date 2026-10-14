import { createClient } from "@/lib/supabase/server";
import { redirect } from "@/i18n/routing";
import { LoginForm } from "./LoginForm";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Acceso Administrador — PaDónde",
};

export default async function AdminLoginPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  // Si ya tiene sesión activa, redirigir directamente al panel
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect({ href: "/admin", locale });
  }

  return (
    <div className="min-h-screen bg-cream flex flex-col justify-center px-4 py-12">
      <div className="max-w-md w-full mx-auto space-y-8">
        <div className="text-center space-y-2">
          <span className="text-4xl">🌿</span>
          <h1 className="font-serif text-3xl text-forest">PaDónde Admin</h1>
          <p className="font-sans text-xs text-stone">
            Acceso exclusivo para gestión y publicación de eventos
          </p>
        </div>

        <div className="bg-white/80 backdrop-blur-md rounded-3xl p-8 border border-stone-light/80 shadow-sm">
          <LoginForm locale={locale} />
        </div>
      </div>
    </div>
  );
}
