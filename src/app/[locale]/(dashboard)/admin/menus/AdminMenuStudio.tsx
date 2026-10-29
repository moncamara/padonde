"use client";

import { useState } from "react";
import Link from "next/link";
import { LuxuryRestaurantMenu } from "@/components/menu/LuxuryRestaurantMenu";
import { LAZY_CAT_MENU } from "@/data/menus/lazyCatMenu";
import {
  TEMAS_MENU,
  LISTA_TEMAS,
  type TemaMenuId,
} from "@/components/menu/menuThemes";
import { asignarTemaMenuAction } from "../actions";

interface AdminMenuStudioProps {
  locale: string;
}

type ViewportModo = "mobile" | "tablet" | "full";

export function AdminMenuStudio({ locale }: AdminMenuStudioProps) {
  const [temaActivo, setTemaActivo] = useState<TemaMenuId>("fogon");
  const [viewport, setViewport] = useState<ViewportModo>("mobile");
  const [idiomaTest, setIdiomaTest] = useState<"es" | "en" | "fr" | "de">("es");
  const [guardando, setGuardando] = useState(false);
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);

  const temaInfo = TEMAS_MENU[temaActivo];

  async function handleAsignarTema() {
    setGuardando(true);
    setMensajeExito(null);
    try {
      const res = await asignarTemaMenuAction({ tema: temaActivo });
      if (res.success) {
        setMensajeExito(`¡Tema "${temaInfo.nombre}" (${temaInfo.emoji}) asignado y bloqueado para Lazy Cat en producción!`);
        setTimeout(() => setMensajeExito(null), 5000);
      } else {
        alert("Error al guardar: " + (res.error || "Intenta nuevamente"));
      }
    } catch (e: any) {
      alert("Error: " + (e?.message || "Inesperado"));
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* ─── Encabezado de la Sección ─── */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-stone-light/70 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">🍽️</span>
            <h1 className="font-serif text-xl sm:text-2xl font-bold text-forest">
              Estudio de Cartas Digitales & Asignación de Temas
            </h1>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-terra/10 text-terra border border-terra/20">
              Control de Admin
            </span>
          </div>
          <p className="text-xs sm:text-sm text-stone mt-1 max-w-2xl">
            Selecciona y asigna el tema visual oficial para cada comercio aliado. Los comensales y turistas solo verán el tema asignado aquí, sin controles para cambiarlo.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <button
            type="button"
            onClick={handleAsignarTema}
            disabled={guardando}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-black transition-all shadow-xs active:scale-95 cursor-pointer disabled:opacity-50"
            title="Guardar este tema de forma permanente en la base de datos para Lazy Cat"
          >
            <span>{guardando ? "⏳ Guardando..." : `💾 Asignar "${temaInfo.nombre}" a Lazy Cat`}</span>
          </button>

          <Link
            href={`/minca/menu-demo?tema=${temaActivo}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-forest text-white hover:bg-forest/90 transition-all shadow-xs"
            title="Abrir vista pública del comensal en nueva pestaña"
          >
            <span>📱</span>
            <span>Ver como Comensal</span>
            <span className="text-white/60 text-[10px]">↗</span>
          </Link>
        </div>
      </div>

      {mensajeExito && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-semibold flex items-center gap-2 shadow-xs animate-in fade-in">
          <span className="text-lg">✅</span>
          <span>{mensajeExito}</span>
        </div>
      )}

      {/* ─── Selector Visual de Temas ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {LISTA_TEMAS.map((t) => {
          const esActivo = temaActivo === t.id;
          const esRecomendadoLazyCat = t.id === "fogon";

          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTemaActivo(t.id)}
              className={`p-4 rounded-2xl border text-left transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between ${
                esActivo
                  ? "bg-white border-forest shadow-md ring-2 ring-forest/20"
                  : "bg-white/80 border-stone-light/70 hover:border-forest/40 hover:bg-white"
              }`}
            >
              {esRecomendadoLazyCat && (
                <span className="absolute top-2.5 right-2.5 text-[9px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-800 border border-amber-500/30">
                  ★ Para Lazy Cat
                </span>
              )}

              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-2xl">{t.emoji}</span>
                  <div>
                    <h3 className="font-serif text-base font-bold text-forest">
                      {t.nombre}
                    </h3>
                    <span className="text-[10px] text-stone">
                      Fondo Oscuro Luxury
                    </span>
                  </div>
                </div>

                <p className="text-xs text-stone-dark mt-1 line-clamp-2">
                  {t.descripcion}
                </p>
              </div>

              <div className="mt-3 pt-2.5 border-t border-stone-light/60 flex items-center justify-between text-[11px]">
                <span className="text-stone font-medium truncate">
                  {t.paraQuien.split(",")[0]}
                </span>
                <span
                  className={`w-4 h-4 rounded-full shrink-0 border ${
                    esActivo ? "bg-forest border-forest" : "border-stone-light"
                  }`}
                  style={{
                    backgroundColor: t.id === "oro" ? "#E8C872" : t.id === "fogon" ? "#FFC93C" : t.id === "caribe" ? "#38BDF8" : "#34D399"
                  }}
                />
              </div>
            </button>
          );
        })}
      </div>

      {/* ─── Barra de Control de Dispositivo e Idioma ─── */}
      <div className="bg-white p-3 rounded-2xl border border-stone-light/70 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="text-stone font-medium">Dispositivo:</span>
          <div className="flex items-center gap-1 bg-stone-light/40 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setViewport("mobile")}
              className={`px-3 py-1 rounded-lg font-medium transition-all ${
                viewport === "mobile"
                  ? "bg-white text-forest shadow-xs font-semibold"
                  : "text-stone hover:text-forest"
              }`}
            >
              📱 Móvil (390px)
            </button>
            <button
              type="button"
              onClick={() => setViewport("tablet")}
              className={`px-3 py-1 rounded-lg font-medium transition-all ${
                viewport === "tablet"
                  ? "bg-white text-forest shadow-xs font-semibold"
                  : "text-stone hover:text-forest"
              }`}
            >
              📱 Tablet (640px)
            </button>
            <button
              type="button"
              onClick={() => setViewport("full")}
              className={`px-3 py-1 rounded-lg font-medium transition-all ${
                viewport === "full"
                  ? "bg-white text-forest shadow-xs font-semibold"
                  : "text-stone hover:text-forest"
              }`}
            >
              💻 Completo
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-stone font-medium">Idioma inicial:</span>
          <div className="flex items-center gap-1 bg-stone-light/40 p-1 rounded-xl">
            {(["es", "en", "fr", "de"] as const).map((code) => (
              <button
                key={code}
                type="button"
                onClick={() => setIdiomaTest(code)}
                className={`px-2.5 py-1 rounded-lg font-semibold uppercase text-[11px] transition-all ${
                  idiomaTest === code
                    ? "bg-white text-forest shadow-xs"
                    : "text-stone hover:text-forest"
                }`}
              >
                {code}
              </button>
            ))}
          </div>
        </div>

        <div className="text-[11px] text-stone-dark bg-stone-light/20 px-3 py-1.5 rounded-xl border border-stone-light/60">
          Tema actual: <strong className="text-forest">{temaInfo.nombre}</strong> ({temaInfo.emoji})
        </div>
      </div>

      {/* ─── Lienzo / Mockup de Previsualización Interactiva ─── */}
      <div className="bg-[#181C19] rounded-3xl p-3 sm:p-6 border border-stone-light/30 shadow-inner flex flex-col items-center justify-center min-h-[640px] overflow-hidden">
        <div
          className={`transition-all duration-300 w-full overflow-hidden ${
            viewport === "mobile"
              ? "max-w-[410px] rounded-[36px] shadow-2xl border-[8px] border-[#2A2E2A]"
              : viewport === "tablet"
              ? "max-w-[680px] rounded-[28px] shadow-2xl border-[6px] border-[#2A2E2A]"
              : "w-full rounded-2xl shadow-xl border border-white/10"
          }`}
          style={{
            height: viewport === "full" ? "820px" : "740px",
            maxHeight: "85vh",
            backgroundColor: temaInfo.bg,
          }}
        >
          {/* Barra superior estilo iPhone notch si está en móvil */}
          {viewport === "mobile" && (
            <div
              className="text-[10px] py-1 px-4 flex items-center justify-between font-mono select-none"
              style={{
                backgroundColor: temaInfo.isDark ? "#2A2E2A" : "#E2DDD4",
                color: temaInfo.isDark ? "rgba(255,255,255,0.6)" : "rgba(0,0,0,0.6)",
              }}
            >
              <span>9:41</span>
              <div
                className="w-16 h-3.5 rounded-full mx-auto"
                style={{ backgroundColor: temaInfo.isDark ? "#181C19" : "#C9C4BB" }}
              />
              <span>5G 100%</span>
            </div>
          )}

          {/* Contenedor scrolleable del menú */}
          <div className="w-full h-full overflow-y-auto no-scrollbar">
            <LuxuryRestaurantMenu
              key={`${temaActivo}-${idiomaTest}`}
              initialLocale={idiomaTest}
              menu={LAZY_CAT_MENU}
              tema={temaActivo}
              mostrarSelectorTema={false}
              embebido={true}
            />
          </div>
        </div>
      </div>

      {/* ─── Guía de Decisión Operativa & Comercial ─── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-stone-light/70 shadow-xs">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-700 flex items-center justify-center text-xl mb-3">
            🪑
          </div>
          <h3 className="font-serif text-base font-bold text-forest mb-1.5">
            1. En la Mesa (QR Físico)
          </h3>
          <p className="text-xs text-stone leading-relaxed">
            El comensal escanea y abre la carta en segundos, sin descargar PDFs pesados de 15MB.
            Traducido a 4 idiomas y con botón rápido para dejar reseña 5 estrellas en Google antes de irse.
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-stone-light/70 shadow-xs">
          <div className="w-10 h-10 rounded-xl bg-terra/10 text-terra flex items-center justify-center text-xl mb-3">
            🚶
          </div>
          <h3 className="font-serif text-base font-bold text-forest mb-1.5">
            2. En el Hostal o la Calle
          </h3>
          <p className="text-xs text-stone leading-relaxed">
            El turista explora opciones antes de salir. Se antoja con las fotos de los platos,
            revisa precios en COP o USD y puede tocar el botón de WhatsApp para reservar mesa o consultar disponibilidad.
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-stone-light/70 shadow-xs">
          <div className="w-10 h-10 rounded-xl bg-forest/10 text-forest flex items-center justify-center text-xl mb-3">
            ⚙️
          </div>
          <h3 className="font-serif text-base font-bold text-forest mb-1.5">
            3. Cero Retrabajo Operativo
          </h3>
          <p className="text-xs text-stone leading-relaxed">
            Sin pasarelas de pago caídas ni carritos flotantes que confundan al mesero.
            Un solo motor de código alimenta a todos los restaurantes; tú solo decides el tema visual según la identidad del aliado.
          </p>
        </div>
      </div>
    </div>
  );
}
