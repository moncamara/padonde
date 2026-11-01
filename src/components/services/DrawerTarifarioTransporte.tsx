"use client";

import { useState, useMemo, useEffect } from "react";
import { createPortal } from "react-dom";
import { useLocale } from "next-intl";
import type { TarifarioTransporte, ItemTarifaTransporte } from "@/data/tarifas/types";
import { TEXTOS_TARIFARIO } from "@/data/tarifas/traducciones";

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
  const locale = useLocale();
  const t = TEXTOS_TARIFARIO[locale] || TEXTOS_TARIFARIO.es;

  const [mounted, setMounted] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const [categoriaActiva, setCategoriaActiva] = useState<TabCategoria>("todas");
  const [numPersonas, setNumPersonas] = useState<number>(4);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Mantener persistencia del drawer abierto durante navegación y bloquear scroll de fondo
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

  // Filtrado instantáneo por nombre real del destino/hostal
  const rutasFiltradas = useMemo(() => {
    const q = normalizar(busqueda);

    return todasLasRutas.filter((item) => {
      if (categoriaActiva !== "todas" && item.categoriaClave !== categoriaActiva) {
        return false;
      }

      if (!q) return true;

      return normalizar(item.destino).includes(q);
    });
  }, [todasLasRutas, busqueda, categoriaActiva]);

  // Enlace a WhatsApp con mensaje comprensible y directo para el conductor
  const buildEnlaceWhatsApp = (destino: string, precio: number) => {
    const phone = tarifario.contacto.whatsapp.replace(/\D/g, "");
    const precioStr = precio.toLocaleString("es-CO");
    const textoMensaje = t.mensajeWhatsApp(tarifario.nombre, destino, numPersonas, precioStr);
    return `https://api.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(textoMensaje)}`;
  };

  const handleWhatsAppCustom = () => {
    const phone = tarifario.contacto.whatsapp.replace(/\D/g, "");
    const textoMensaje = t.mensajeWhatsAppCustom(tarifario.nombre, busqueda.trim(), numPersonas);
    window.open(`https://api.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(textoMensaje)}`, "_blank");
  };

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex flex-col justify-end sm:justify-center sm:items-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={handleCerrar}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-lg max-h-[86dvh] sm:max-h-[90vh] flex flex-col shadow-2xl border border-stone-200 overflow-hidden animate-in slide-in-from-bottom-5 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Manija táctil móvil */}
        <div className="w-12 h-1.5 bg-stone-300 rounded-full mx-auto mt-2.5 sm:hidden" />

        {/* Cabecera del Tarifario: limpia, sin selectores duplicados */}
        <div className="p-4 sm:p-5 border-b border-stone-150 bg-stone-50/90 shrink-0 space-y-2">
          <div className="flex items-start justify-between gap-3">
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

            {/* Botón Cerrar accesible y destacado */}
            <button
              type="button"
              onClick={handleCerrar}
              className="text-stone-500 hover:text-stone-800 bg-white hover:bg-stone-100 border border-stone-200 rounded-full w-9 h-9 flex items-center justify-center transition-colors cursor-pointer shrink-0 shadow-2xs font-bold text-sm"
              title="Cerrar"
              aria-label="Cerrar"
            >
              ✕
            </button>
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

          {/* Pills de Categorías de Rutas */}
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

        {/* Lista de Resultados con Target Táctil >= 48px */}
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

              return (
                <a
                  key={`${item.categoriaClave}-${item.destino}-${idx}`}
                  href={waUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center justify-between gap-3 py-3 px-3 hover:bg-forest/5 active:bg-forest/10 rounded-2xl transition-all min-h-[50px] cursor-pointer"
                  title={`${t.botonPedir}: ${item.destino}`}
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-sans text-xs sm:text-sm font-semibold text-stone-dark group-hover:text-forest transition-colors truncate">
                      {item.destino}
                    </p>
                    <p className="text-[10px] text-stone-400 font-sans flex items-center gap-1 mt-0.5">
                      <span>{confCat?.icon || "📍"}</span>
                      <span>{confCat?.label || "Ruta"}</span>
                      <span>•</span>
                      <span>1-4 {locale === "en" ? "pax" : "pers."}</span>
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

        {/* Footer del Drawer con advertencia de clima y margen inferior seguro para barra de inicio móvil */}
        <div className="p-3 pb-8 sm:pb-3 bg-stone-50 border-t border-stone-150 shrink-0 text-center space-y-1">
          <p className="text-[10px] text-stone-500 font-sans">
            🛡️ {t.disclaimerClima}
          </p>
        </div>
      </div>
    </div>,
    document.body
  );
}
