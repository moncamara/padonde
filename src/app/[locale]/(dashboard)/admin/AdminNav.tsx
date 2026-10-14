"use client";

import { Link, usePathname } from "@/i18n/routing";
import { logoutAction } from "./login/actions";

interface AdminNavProps {
  userEmail?: string | null;
}

export function AdminNav({ userEmail }: AdminNavProps) {
  const pathname = usePathname();

  const isCartelera = pathname === "/admin" || pathname.endsWith("/admin");
  const isAliados = pathname.includes("/admin/aliados");
  const isPuntosQR = pathname.includes("/admin/puntos-qr");

  return (
    <header className="sticky top-0 z-20 bg-cream/90 backdrop-blur-md border-b border-stone-light/80 px-4 py-3">
      <div className="max-w-3xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Logo y Enlaces de Navegación del Admin */}
        <div className="flex items-center justify-between sm:justify-start gap-4">
          <Link href="/admin" className="flex items-center gap-2">
            <span className="text-xl">🌿</span>
            <span className="font-serif text-xl text-forest font-bold tracking-tight">
              PaDónde Admin
            </span>
          </Link>

          {/* Pestañas de Navegación Principal */}
          <nav className="flex items-center gap-1 bg-stone-light/40 p-1 rounded-2xl">
            <Link
              href="/admin"
              className={[
                "px-3 py-1.5 rounded-xl font-sans text-xs font-medium transition-all",
                isCartelera
                  ? "bg-white text-forest shadow-xs font-semibold"
                  : "text-stone hover:text-forest",
              ].join(" ")}
            >
              🌿 Cartelera
            </Link>

            <Link
              href="/admin/aliados"
              className={[
                "px-3 py-1.5 rounded-xl font-sans text-xs font-medium transition-all flex items-center gap-1.5",
                isAliados
                  ? "bg-white text-forest shadow-xs font-semibold"
                  : "text-stone hover:text-forest",
              ].join(" ")}
            >
              <span>👥 Aliados</span>
              <span className="text-[10px] bg-forest/10 text-forest px-1.5 py-0.2 rounded-full font-semibold">
                Paso 2
              </span>
            </Link>

            <span
              title="Próximo paso: Atribución de tráfico QR"
              className="px-2.5 py-1.5 rounded-xl font-sans text-xs text-stone/60 cursor-not-allowed flex items-center gap-1"
            >
              <span>📍 QRs</span>
              <span className="text-[9px] bg-stone-200/70 text-stone px-1 rounded-sm">
                Paso 3
              </span>
            </span>
          </nav>
        </div>

        {/* Acciones del Header */}
        <div className="flex items-center justify-end gap-3 text-xs font-sans">
          <Link
            href="/minca"
            target="_blank"
            className="text-stone hover:text-forest underline underline-offset-2"
          >
            Ver web pública ↗
          </Link>

          <form action={logoutAction}>
            <button
              type="submit"
              className="text-red-600 hover:text-red-700 font-medium cursor-pointer px-2.5 py-1 rounded-lg border border-red-200 bg-red-50 hover:bg-red-100 transition-colors"
            >
              Cerrar sesión
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
