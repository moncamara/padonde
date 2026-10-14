"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "@/i18n/routing";

export async function loginAction(
  prevState: { error?: string } | undefined,
  formData: FormData
): Promise<{ error?: string } | undefined> {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const locale = (formData.get("locale") as string) || "es";

  if (!email || !password) {
    return { error: "Por favor ingresa tu correo y contraseña." };
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: "Credenciales incorrectas o usuario no registrado." };
  }

  // Redirigir al panel de administración una vez autenticado
  redirect({ href: "/admin", locale });
}

export async function logoutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect({ href: "/admin/login", locale: "es" });
}
