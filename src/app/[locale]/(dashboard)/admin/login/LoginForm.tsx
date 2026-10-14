"use client";

import { useActionState } from "react";
import { loginAction } from "./actions";
import { Button } from "@/components/ui/Button";

export function LoginForm({ locale }: { locale: string }) {
  const [state, formAction, isPending] = useActionState(loginAction, undefined);

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="locale" value={locale} />

      {state?.error && (
        <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-sans">
          ⚠️ {state.error}
        </div>
      )}

      <div>
        <label className="block text-xs font-medium text-forest mb-1.5 font-sans">
          Correo electrónico
        </label>
        <input
          type="email"
          name="email"
          required
          placeholder="admin@padonde.lat"
          className="w-full px-4 py-3 rounded-xl border border-stone-light bg-cream text-forest text-sm font-sans focus:outline-none focus:border-forest transition-colors"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-forest mb-1.5 font-sans">
          Contraseña
        </label>
        <input
          type="password"
          name="password"
          required
          placeholder="••••••••••••"
          className="w-full px-4 py-3 rounded-xl border border-stone-light bg-cream text-forest text-sm font-sans focus:outline-none focus:border-forest transition-colors"
        />
      </div>

      <Button
        type="submit"
        size="lg"
        disabled={isPending}
        className="w-full shadow-md font-semibold py-3.5"
      >
        {isPending ? "Ingresando..." : "Iniciar Sesión como Administrador"}
      </Button>
    </form>
  );
}
