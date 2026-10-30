"use client";

import { useEffect } from "react";
import { Link, usePathname } from "@/i18n/routing";
import { logoutAction } from "./login/actions";

interface AdminNavProps {
  userEmail?: string | null;
}

export function AdminNav({ userEmail }: AdminNavProps) {
  const pathname = usePathname();

  useEffect(() => {
    // Marca el dispositivo del administrador para que sus clics y pruebas
    // no contaminen las métricas de WhatsApp ni escaneos QR en analíticas.
    try {
      document.cookie = "padonde_admin_device=true; path=/; max-age=31536000; SameSite=Lax";
    } catch {
      // Ignorar
    }
  }, []);

  const isCartelera = pathname === "/admin" || pathname.endsWith("/admin");
  const isHospedajes = pathname.includes("/admin/hospedajes");
  const isAliados = pathname.includes("/admin/aliados");
  const isTarifas = pathname.includes("/admin/tarifas");
  const isMenus = pathname.includes("/admin/menus");
  const isPuntosQR = pathname.includes("/admin/puntos-qr");
  const isEsenciales = pathname.includes("/admin/esenciales");
  const isRegiones = pathname.includes("/admin/regiones");

  return (
    <header className="sticky top-0 z-20 bg-cream/95 backdrop-blur-md border-b border-stone-light/80 px-3 sm:px-6 py-2 sm:py-2.5 transition-all w-full overflow-x-clip">
      <div className="max-w-7xl mx-auto flex flex-col gap-2 xl:flex-row xl:items-center xl:justify-between">
        {/* Fila 1 en Mobile/Tablet (< xl): Logo y Acciones Rápidas */}
        <div className="flex items-center justify-between shrink-0">
          <Link href="/admin" className="flex items-center gap-2 group">
            <span className="text-xl group-hover:scale-110 transition-transform">🌿</span>
            <span className="font-serif text-lg sm:text-xl text-forest font-bold tracking-tight">
              PaDónde <span className="font-sans font-normal text-xs text-stone bg-white/70 px-2 py-0.5 rounded-full border border-stone-light/60">Admin</span>
            </span>
          </Link>

          {/* Acciones de Cuenta en Mobile / Tablet (< xl) */}
          <div className="flex items-center gap-1.5 xl:hidden text-xs font-sans">
            <Link
              href="/minca"
              className="text-stone hover:text-forest px-2 py-1 rounded-lg border border-stone-light/60 bg-white/70 text-[11px] font-medium"
              title="Ver vitrina de Minca"
            >
              🌿 Minca
            </Link>
            <Link
              href="/mendihuaca"
              className="text-stone hover:text-forest px-2 py-1 rounded-lg border border-stone-light/60 bg-white/70 text-[11px] font-medium"
              title="Ver vitrina de Mendihuaca"
            >
              🌊 Mendi.
            </Link>

            <form action={logoutAction}>
              <button
                type="submit"
                className="text-red-600 hover:text-red-700 font-medium px-2.5 py-1 rounded-lg border border-red-200 bg-red-50 hover:bg-red-100 text-[11px] transition-colors cursor-pointer whitespace-nowrap"
              >
                Cerrar sesión
              </button>
            </form>
          </div>
        </div>

        {/* Fila 2 en Mobile/Tablet / Centro en Desktop (>= xl): Pestañas de Navegación Segmentadas */}
        <nav className="flex items-center gap-1 bg-stone-light/40 p-1 rounded-2xl overflow-x-auto no-scrollbar min-w-0 xl:flex-1 xl:justify-center">
          <Link
            href="/admin"
            className={[
              "py-1.5 px-2.5 sm:px-3 rounded-xl font-sans text-[11px] sm:text-xs font-medium transition-all text-center flex items-center justify-center gap-1 shrink-0 whitespace-nowrap",
              isCartelera
                ? "bg-white text-forest shadow-xs font-semibold"
                : "text-stone hover:text-forest",
            ].join(" ")}
          >
            <span>🌿</span>
            <span>Cartelera</span>
          </Link>

          <Link
            href="/admin/hospedajes"
            className={[
              "py-1.5 px-2.5 sm:px-3 rounded-xl font-sans text-[11px] sm:text-xs font-medium transition-all text-center flex items-center justify-center gap-1 shrink-0 whitespace-nowrap",
              isHospedajes
                ? "bg-white text-forest shadow-xs font-semibold"
                : "text-stone hover:text-forest",
            ].join(" ")}
          >
            <span>🏡</span>
            <span>Hospedajes</span>
          </Link>

          <Link
            href="/admin/aliados"
            className={[
              "py-1.5 px-2.5 sm:px-3 rounded-xl font-sans text-[11px] sm:text-xs font-medium transition-all text-center flex items-center justify-center gap-1 shrink-0 whitespace-nowrap",
              isAliados
                ? "bg-white text-forest shadow-xs font-semibold"
                : "text-stone hover:text-forest",
            ].join(" ")}
          >
            <span>👥</span>
            <span>Aliados</span>
          </Link>

          <Link
            href="/admin/tarifas"
            className={[
              "py-1.5 px-2.5 sm:px-3 rounded-xl font-sans text-[11px] sm:text-xs font-medium transition-all text-center flex items-center justify-center gap-1 shrink-0 whitespace-nowrap",
              isTarifas
                ? "bg-forest text-white shadow-xs font-semibold"
                : "text-terra hover:text-terra-dark font-semibold bg-terra/5",
            ].join(" ")}
          >
            <span>💼</span>
            <span>Tarifas</span>
          </Link>

          <Link
            href="/admin/menus"
            className={[
              "py-1.5 px-2.5 sm:px-3 rounded-xl font-sans text-[11px] sm:text-xs font-medium transition-all text-center flex items-center justify-center gap-1 shrink-0 whitespace-nowrap",
              isMenus
                ? "bg-white text-forest shadow-xs font-semibold"
                : "text-stone hover:text-forest",
            ].join(" ")}
          >
            <span>🍽️</span>
            <span>Cartas & Temas</span>
          </Link>

          <Link
            href="/admin/puntos-qr"
            className={[
              "py-1.5 px-2.5 sm:px-3 rounded-xl font-sans text-[11px] sm:text-xs font-medium transition-all text-center flex items-center justify-center gap-1 shrink-0 whitespace-nowrap",
              isPuntosQR
                ? "bg-white text-forest shadow-xs font-semibold"
                : "text-stone hover:text-forest",
            ].join(" ")}
          >
            <span>📍</span>
            <span>Puntos QR</span>
          </Link>

          <Link
            href="/admin/esenciales"
            className={[
              "py-1.5 px-2.5 sm:px-3 rounded-xl font-sans text-[11px] sm:text-xs font-medium transition-all text-center flex items-center justify-center gap-1 shrink-0 whitespace-nowrap",
              isEsenciales
                ? "bg-white text-forest shadow-xs font-semibold"
                : "text-stone hover:text-forest",
            ].join(" ")}
          >
            <span>💡</span>
            <span>Esenciales</span>
          </Link>

          <Link
            href="/admin/regiones"
            className={[
              "py-1.5 px-2.5 sm:px-3 rounded-xl font-sans text-[11px] sm:text-xs font-medium transition-all text-center flex items-center justify-center gap-1 shrink-0 whitespace-nowrap",
              isRegiones
                ? "bg-white text-forest shadow-xs font-semibold"
                : "text-stone hover:text-forest",
            ].join(" ")}
          >
            <span>🗺️</span>
            <span>Regiones</span>
          </Link>
        </nav>

        {/* Acciones de Cuenta en Desktop (>= xl) */}
        <div className="hidden xl:flex items-center justify-end gap-3 text-xs font-sans shrink-0">
          <div className="flex items-center gap-2">
            <Link
              href="/minca"
              className="text-stone hover:text-forest underline underline-offset-2 flex items-center gap-1 font-medium"
              title="Ver vitrina de Minca"
            >
              <span>🌿 Minca</span>
            </Link>
            <span className="text-stone-light">|</span>
            <Link
              href="/mendihuaca"
              className="text-stone hover:text-forest underline underline-offset-2 flex items-center gap-1 font-medium"
              title="Ver vitrina de Mendihuaca"
            >
              <span>🌊 Mendihuaca</span>
            </Link>
          </div>

          <form action={logoutAction}>
            <button
              type="submit"
              className="text-red-600 hover:text-red-700 font-medium cursor-pointer px-3 py-1.5 rounded-lg border border-red-200 bg-red-50 hover:bg-red-100 transition-colors whitespace-nowrap"
            >
              Cerrar sesión
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
