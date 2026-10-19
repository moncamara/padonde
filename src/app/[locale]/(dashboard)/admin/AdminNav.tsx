"use client";

import { Link, usePathname } from "@/i18n/routing";
import { logoutAction } from "./login/actions";

interface AdminNavProps {
  userEmail?: string | null;
}

export function AdminNav({ userEmail }: AdminNavProps) {
  const pathname = usePathname();

  const isCartelera = pathname === "/admin" || pathname.endsWith("/admin");
  const isHospedajes = pathname.includes("/admin/hospedajes");
  const isAliados = pathname.includes("/admin/aliados");
  const isPuntosQR = pathname.includes("/admin/puntos-qr");

  return (
    <header className="sticky top-0 z-20 bg-cream/95 backdrop-blur-md border-b border-stone-light/80 px-3 sm:px-6 py-2.5 sm:py-3 transition-all">
      <div className="max-w-4xl mx-auto flex flex-col gap-2.5 sm:gap-0 sm:flex-row sm:items-center sm:justify-between">
        {/* Fila 1 en Mobile / Lado Izquierdo en Desktop: Logo y Acciones Rápidas */}
        <div className="flex items-center justify-between">
          <Link href="/admin" className="flex items-center gap-2 group">
            <span className="text-xl group-hover:scale-110 transition-transform">🌿</span>
            <span className="font-serif text-lg sm:text-xl text-forest font-bold tracking-tight">
              PaDónde <span className="font-sans font-normal text-xs text-stone bg-white/70 px-2 py-0.5 rounded-full border border-stone-light/60">Admin</span>
            </span>
          </Link>

          {/* Acciones de Cuenta en Mobile */}
          <div className="flex items-center gap-1.5 sm:hidden text-xs font-sans">
            <Link
              href="/minca"
              className="text-stone hover:text-forest p-1 rounded-lg border border-stone-light/60 bg-white/70 text-[10px]"
              title="Ver Minca"
            >
              🌿 Minca
            </Link>
            <Link
              href="/mendihuaca"
              className="text-stone hover:text-forest p-1 rounded-lg border border-stone-light/60 bg-white/70 text-[10px]"
              title="Ver Mendihuaca"
            >
              🌊 Mendi.
            </Link>

            <form action={logoutAction}>
              <button
                type="submit"
                className="text-red-600 font-medium px-2 py-1 rounded-lg border border-red-200 bg-red-50 text-[11px]"
              >
                Salir
              </button>
            </form>
          </div>
        </div>

        {/* Fila 2 en Mobile / Centro en Desktop: Pestañas de Navegación Segmentadas (4 columnas) */}
        <nav className="grid grid-cols-4 sm:flex items-center gap-1 bg-stone-light/40 p-1 rounded-2xl w-full sm:w-auto">
          <Link
            href="/admin"
            className={[
              "py-1.5 px-1.5 sm:px-3 rounded-xl font-sans text-xs font-medium transition-all text-center flex items-center justify-center gap-1",
              isCartelera
                ? "bg-white text-forest shadow-xs font-semibold"
                : "text-stone hover:text-forest",
            ].join(" ")}
          >
            <span>🌿</span>
            <span className="truncate">Cartelera</span>
          </Link>

          <Link
            href="/admin/hospedajes"
            className={[
              "py-1.5 px-1.5 sm:px-3 rounded-xl font-sans text-xs font-medium transition-all text-center flex items-center justify-center gap-1",
              isHospedajes
                ? "bg-white text-forest shadow-xs font-semibold"
                : "text-stone hover:text-forest",
            ].join(" ")}
          >
            <span>🏡</span>
            <span className="truncate">Hospedajes</span>
          </Link>

          <Link
            href="/admin/aliados"
            className={[
              "py-1.5 px-1.5 sm:px-3 rounded-xl font-sans text-xs font-medium transition-all text-center flex items-center justify-center gap-1",
              isAliados
                ? "bg-white text-forest shadow-xs font-semibold"
                : "text-stone hover:text-forest",
            ].join(" ")}
          >
            <span>👥</span>
            <span className="truncate">Aliados</span>
          </Link>

          <Link
            href="/admin/puntos-qr"
            className={[
              "py-1.5 px-1.5 sm:px-3 rounded-xl font-sans text-xs font-medium transition-all text-center flex items-center justify-center gap-1",
              isPuntosQR
                ? "bg-white text-forest shadow-xs font-semibold"
                : "text-stone hover:text-forest",
            ].join(" ")}
          >
            <span>📍</span>
            <span className="truncate">Puntos QR</span>
          </Link>
        </nav>

        {/* Acciones de Cuenta en Desktop */}
        <div className="hidden sm:flex items-center justify-end gap-3 text-xs font-sans">
          <div className="flex items-center gap-2">
            <Link
              href="/minca"
              className="text-stone hover:text-forest underline underline-offset-2 flex items-center gap-1"
            >
              <span>🌿 Minca</span>
            </Link>
            <span className="text-stone-light">|</span>
            <Link
              href="/mendihuaca"
              className="text-stone hover:text-forest underline underline-offset-2 flex items-center gap-1"
            >
              <span>🌊 Mendihuaca</span>
            </Link>
          </div>

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
