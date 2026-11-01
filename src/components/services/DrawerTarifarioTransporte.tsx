"use client";

import { useState, useMemo, useEffect } from "react";
import { useLocale } from "next-intl";
import { useRouter, usePathname } from "@/i18n/routing";
import type { TarifarioTransporte, ItemTarifaTransporte } from "@/data/tarifas/types";
import { TEXTOS_TARIFARIO, getDestinoTraducido } from "@/data/tarifas/traducciones";

interface DrawerTarifarioTransporteProps {
  tarifario: TarifarioTransporte;
  isOpen: boolean;
  onClose: () => void;
  zonaNombre?: string;
}

type TabCategoria = "todas" | "sierra_alta_y_montana" | "minca_locales_cercanos" | "expresos";

export function DrawerTarifarioTransporte({
  tarifario,
  isOpen,
  onClose,
  zonaNombre = "Minca",
}: DrawerTarifarioTransporteProps) {
  const appLocale = useLocale();
  const [localeActivo, setLocaleActivo] = useState(appLocale);
  const router = useRouter();
  const pathname = usePathname();

  // Sincronizar si cambia el locale exterior
  useEffect(() => {
    setLocaleActivo(appLocale);
  }, [appLocale]);

  const t = TEXTOS_TARIFARIO[localeActivo] || TEXTOS_TARIFARIO.es;

  const [busqueda, setBusqueda] = useState("");
  const [categoriaActiva, setCategoriaActiva] = useState<TabCategoria>("todas");
  const [numPersonas, setNumPersonas] = useState<number>(4);

  // Mantener persistencia del drawer abierto durante cambios de idioma y bloquear scroll
  useEffect(() => {
    if (!isOpen) return;

    if (typeof window !== "undefined") {
      try {
        sessionStorage.setItem("padonde_tarifario_open", "true");
        sessionStorage.setItem("padonde_tarifario_id", tarifario.id);
      } catch {}
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleCerrar();
    };

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, tarifario.id]);

  const handleCerrar = () => {
    if (typeof window !== "undefined") {
      try {
        sessionStorage.removeItem("padonde_tarifario_open");
        sessionStorage.removeItem("padonde_tarifario_id");
      } catch {}
    }
    onClose();
  };

  const cambiarIdioma = (nuevoLocale: "es" | "en" | "fr" | "de") => {
    if (nuevoLocale === localeActivo) return;
    // 1. Cambio reactivo inmediato (0ms de retraso visual dentro del modal)
    setLocaleActivo(nuevoLocale);
    // 2. Persistencia en sesión para que la recarga de Next.js no cierre el modal
    if (typeof window !== "undefined") {
      try {
        sessionStorage.setItem("padonde_tarifario_open", "true");
        sessionStorage.setItem("padonde_tarifario_id", tarifario.id);
        sessionStorage.setItem("padonde_locale_switching", "true");
        sessionStorage.setItem("padonde_detail_lang_switched", "true");
      } catch {}
    }
    // 3. Sincronizar ruta en background
    router.replace(pathname, { locale: nuevoLocale });
  };

  // Nombres localizados de pestañas
  const categoriasConfig: Record<TabCategoria, { label: string; icon: string }> = {
    todas: { label: t.tabTodas, icon: "✨" },
    sierra_alta_y_montana: { label: t.tabSierra, icon: "⛰️" },
    minca_locales_cercanos: { label: t.tabLocales, icon: "🌿" },
    expresos: { label: t.tabExpresos, icon: "🚐" },
  };

  // Aplanar todas las rutas con su categoría asociada
  const todasLasRutas = useMemo(() => {
    const res: Array<ItemTarifaTransporte & { categoriaClave: string }> = [];

    const keys = Object.keys(tarifario.tarifas || {});
    for (const key of keys) {
      const items = tarifario.tarifas[key] || [];
      for (const item of items) {
        res.push({
          ...item,
          categoriaClave: key,
        });
      }
    }
    return res;
  }, [tarifario]);

  // Normalizador insensible a tildes y mayúsculas
  const normalizar = (str: string) =>
    (str || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim();

  // Filtrado instantáneo bilingüe (busca en español y en el idioma activo)
  const rutasFiltradas = useMemo(() => {
    const q = normalizar(busqueda);

    return todasLasRutas.filter((item) => {
      // Filtro por tab de categoría
      if (categoriaActiva !== "todas" && item.categoriaClave !== categoriaActiva) {
        return false;
      }

      if (!q) return true;

      const destOrig = normalizar(item.destino);
      const destTrad = normalizar(getDestinoTraducido(item.destino, localeActivo));
      return destOrig.includes(q) || destTrad.includes(q);
    });
  }, [todasLasRutas, busqueda, categoriaActiva, localeActivo]);

  // Generador de enlace WhatsApp oficial con mensaje en el idioma activo
  const buildEnlaceWhatsApp = (destino: string, precio: number) => {
    const phone = tarifario.contacto.whatsapp.replace(/\D/g, "");
    const destinoFinal = getDestinoTraducido(destino, localeActivo);
    const precioStr = precio.toLocaleString("es-CO");
    const textoMensaje = t.mensajeWhatsApp(tarifario.nombre, destinoFinal, numPersonas, precioStr);
    return `https://api.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(textoMensaje)}`;
  };

  const handleWhatsAppCustom = () => {
    const phone = tarifario.contacto.whatsapp.replace(/\D/g, "");
    const textoMensaje = t.mensajeWhatsAppCustom(tarifario.nombre, busqueda.trim(), numPersonas);
    window.open(`https://api.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(textoMensaje)}`, "_blank");
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col justify-end sm:justify-center sm:items-center bg-black/65 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={handleCerrar}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-lg max-h-[92vh] flex flex-col shadow-2xl border border-stone-200 overflow-hidden animate-in slide-in-from-bottom-5 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Manija táctil móvil */}
        <div className="w-12 h-1.5 bg-stone-300 rounded-full mx-auto mt-2.5 sm:hidden" />

        {/* Cabecera del Drawer con Selector de Idioma Integrado */}
        <div className="p-4 sm:p-5 border-b border-stone-150 bg-stone-50/80 shrink-0 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div className="space-y-0.5 min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold uppercase tracking-wider text-forest bg-forest/10 px-2.5 py-0.5 rounded-full font-sans">
                  {t.tituloBadge}
                </span>
                <span className="text-[11px] text-stone font-medium">
                  {zonaNombre}
                </span>
              </div>
              <h3 className="font-serif text-lg sm:text-xl font-bold text-forest truncate">
                {tarifario.nombre}
              </h3>
            </div>

            {/* Selector de Idioma integrado reactivo (0ms) + Botón Cerrar */}
            <div className="flex items-center gap-2 shrink-0">
              <div className="flex items-center gap-0.5 bg-stone-200/80 p-0.5 rounded-full text-xs font-sans shadow-2xs">
                {(["es", "en", "fr", "de"] as const).map((code) => {
                  const isActive = localeActivo === code;
                  return (
                    <button
                      key={code}
                      type="button"
                      onClick={() => cambiarIdioma(code)}
                      className={`px-2 py-0.5 rounded-full text-[11px] font-bold transition-all cursor-pointer ${
                        isActive
                          ? "bg-forest text-white shadow-xs"
                          : "text-stone hover:text-forest"
                      }`}
                      aria-label={`Cambiar a ${code.toUpperCase()}`}
                    >
                      {code.toUpperCase()}
                    </button>
                  );
                })}
              </div>
              <button
                type="button"
                onClick={handleCerrar}
                className="text-stone-400 hover:text-stone-700 bg-white hover:bg-stone-200/60 border border-stone-200 rounded-full w-8 h-8 flex items-center justify-center transition-colors cursor-pointer shrink-0"
                title="Cerrar"
                aria-label="Cerrar"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Condiciones claras y selector de personas */}
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-stone pt-1">
            <p className="flex items-center gap-1.5 font-medium">
              <span>🚙</span>
              <span>{tarifario.condiciones.tipo_vehiculo}</span>
              <span>•</span>
              <span className="text-emerald-800 font-semibold">{t.capacidad}</span>
            </p>

            <div className="flex items-center gap-1.5 bg-white border border-stone-200 px-2 py-0.5 rounded-xl shadow-2xs">
              <span className="text-[11px] text-stone-500 font-sans">{t.pasajeros}</span>
              {[1, 2, 3, 4].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setNumPersonas(n)}
                  className={`w-6 h-6 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    numPersonas === n
                      ? "bg-forest text-white shadow-xs"
                      : "text-stone hover:bg-stone-100"
                  }`}
                  title={`${n}`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          {/* Barra de Búsqueda Instantánea con Autocompletado */}
          <div className="relative pt-1">
            <span className="absolute left-3.5 top-[58%] -translate-y-1/2 text-stone/70 text-sm pointer-events-none">
              🔍
            </span>
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder={t.placeholderBuscar}
              className="w-full pl-9 pr-9 py-2.5 bg-white text-xs sm:text-sm rounded-xl border border-stone-300 placeholder:text-stone-400 text-forest focus:outline-none focus:ring-1 focus:ring-forest focus:border-forest shadow-2xs"
              autoFocus={false}
            />
            {busqueda && (
              <button
                type="button"
                onClick={() => setBusqueda("")}
                className="absolute right-3 top-[58%] -translate-y-1/2 text-stone-400 hover:text-stone-700 text-xs p-1 cursor-pointer"
                title="Limpiar búsqueda"
              >
                ✕
              </button>
            )}
          </div>

          {/* Pills de Categorías de Rutas con nombres traducidos */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1">
            {(["todas", "sierra_alta_y_montana", "minca_locales_cercanos", "expresos"] as TabCategoria[]).map(
              (catKey) => {
                const conf = categoriasConfig[catKey];
                const isSelected = categoriaActiva === catKey;
                const count =
                  catKey === "todas"
                    ? todasLasRutas.length
                    : (tarifario.tarifas[catKey] || []).length;

                return (
                  <button
                    key={catKey}
                    type="button"
                    onClick={() => setCategoriaActiva(catKey)}
                    className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-sans transition-all cursor-pointer whitespace-nowrap active:scale-95 ${
                      isSelected
                        ? "bg-forest text-white font-semibold shadow-xs"
                        : "bg-white text-stone border border-stone-200 hover:text-forest hover:bg-stone-50"
                    }`}
                  >
                    <span>{conf.icon}</span>
                    <span>{conf.label}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-medium ${
                        isSelected ? "bg-white/20 text-white" : "bg-stone-100 text-stone-600"
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              }
            )}
          </div>
        </div>

        {/* Lista de Resultados con Target Táctil >= 48px y soporte multilingüe */}
        <div className="flex-1 overflow-y-auto divide-y divide-stone-100 px-3 py-1">
          {rutasFiltradas.length === 0 ? (
            <div className="text-center py-10 px-4 space-y-3">
              <span className="text-3xl block">🚙</span>
              <p className="font-serif text-sm font-semibold text-forest">
                {t.sinResultados}
              </p>
              <p className="text-xs text-stone max-w-xs mx-auto">
                {t.noApareceDestino}
              </p>
              <button
                type="button"
                onClick={handleWhatsAppCustom}
                className="mt-2 inline-flex items-center justify-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold py-2.5 px-4 rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer"
              >
                <span>💬</span>
                <span>{t.botonCotizarCustom}</span>
              </button>
            </div>
          ) : (
            rutasFiltradas.map((item, idx) => {
              const waUrl = buildEnlaceWhatsApp(item.destino, item.precio);
              const confCat = categoriasConfig[item.categoriaClave as TabCategoria];
              const destinoTrad = getDestinoTraducido(item.destino, localeActivo);
              const esDiferente = destinoTrad !== item.destino;

              return (
                <a
                  key={`${item.categoriaClave}-${item.destino}-${idx}`}
                  href={waUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center justify-between gap-3 py-3 px-3 hover:bg-forest/5 active:bg-forest/10 rounded-2xl transition-all min-h-[50px] cursor-pointer"
                  title={`${t.botonPedir}: ${destinoTrad}`}
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-sans text-xs sm:text-sm font-semibold text-stone-dark group-hover:text-forest transition-colors truncate">
                      {destinoTrad}
                    </p>
                    {esDiferente && (
                      <span className="text-[10px] text-stone-400 font-sans block truncate">
                        {item.destino}
                      </span>
                    )}
                    <p className="text-[10px] text-stone-400 font-sans flex items-center gap-1 mt-0.5">
                      <span>{confCat?.icon || "📍"}</span>
                      <span>{confCat?.label || "Ruta"}</span>
                      <span>•</span>
                      <span>1-4 {localeActivo === "en" ? "pax" : "pers."}</span>
                    </p>
                  </div>

                  <div className="flex items-center gap-2.5 shrink-0">
                    <span className="font-mono font-bold text-xs sm:text-sm text-forest bg-stone-100 group-hover:bg-emerald-100 group-hover:text-emerald-900 px-2.5 py-1 rounded-xl transition-colors">
                      ${item.precio.toLocaleString("es-CO")} COP
                    </span>
                    <span className="w-8 h-8 rounded-full bg-emerald-600 group-hover:bg-emerald-700 text-white flex items-center justify-center text-sm shadow-2xs group-hover:scale-105 transition-all">
                      💬
                    </span>
                  </div>
                </a>
              );
            })
          )}
        </div>

        {/* Footer del Drawer con advertencia de clima e instrucción rápida */}
        <div className="p-3 bg-stone-50 border-t border-stone-150 shrink-0 text-center space-y-1">
          <p className="text-[10px] text-stone-500 font-sans">
            🛡️ {t.disclaimerClima}
          </p>
        </div>
      </div>
    </div>
  );
}
