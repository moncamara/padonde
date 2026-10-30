"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import Link from "next/link";
import { trackEvent } from "@/lib/analytics";

interface RestaurantMenuSectionProps {
  businessName: string;
  menuUrl?: string | null;
  menuFotos?: string[] | null;
  googleReviewUrl?: string | null;
  googleMapsUrl?: string | null;
  zonaNombre: string;
  locale?: string;
  whatsappNumber?: string;
  luxuryMenuUrl?: string | null;
  menuTema?: "fogon" | "sierra" | "caribe" | "oro" | null;
}

const THEME_STYLES = {
  fogon: {
    emoji: "🔥",
    badge: "🔥 Fogón",
    titleEs: "Carta Digital Fogón & Brasas",
    titleEn: "Artisanal Fire & Grill Menu",
    cardBg: "from-[#1F140E] via-[#2A180E] to-[#120B07] border-amber-500/50 hover:border-amber-400 hover:shadow-lg hover:shadow-amber-500/10",
    iconBg: "from-amber-500 via-orange-500 to-amber-600 text-black",
    titleColor: "text-amber-200 group-hover:text-amber-100",
    badgeClass: "bg-amber-500/20 text-amber-300 border-amber-500/30",
    subtitleColor: "text-amber-100/75",
    btnBg: "from-amber-500 to-orange-500 text-black",
    btnIcon: "🔥",
  },
  sierra: {
    emoji: "🌿",
    badge: "🌿 Sierra",
    titleEs: "Carta Digital Sierra Esmeralda",
    titleEn: "Emerald Rainforest Menu",
    cardBg: "from-[#081810] via-[#0C2218] to-[#05100B] border-emerald-500/50 hover:border-emerald-400 hover:shadow-lg hover:shadow-emerald-500/10",
    iconBg: "from-emerald-400 via-teal-500 to-emerald-600 text-black",
    titleColor: "text-emerald-200 group-hover:text-emerald-100",
    badgeClass: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
    subtitleColor: "text-emerald-100/75",
    btnBg: "from-emerald-400 to-teal-500 text-black",
    btnIcon: "🌿",
  },
  caribe: {
    emoji: "🌊",
    badge: "🌊 Caribe",
    titleEs: "Carta Digital Sabor Caribe",
    titleEn: "Caribbean Sapphire Menu",
    cardBg: "from-[#071524] via-[#0C2035] to-[#040E18] border-sky-500/50 hover:border-sky-400 hover:shadow-lg hover:shadow-sky-500/10",
    iconBg: "from-sky-400 via-cyan-500 to-sky-600 text-black",
    titleColor: "text-sky-200 group-hover:text-sky-100",
    badgeClass: "bg-sky-500/20 text-sky-300 border-sky-500/30",
    subtitleColor: "text-sky-100/75",
    btnBg: "from-sky-400 to-cyan-500 text-black",
    btnIcon: "🌊",
  },
  oro: {
    emoji: "👑",
    badge: "✨ Oro",
    titleEs: "Carta Digital Alta Selección",
    titleEn: "Haute Cuisine Digital Menu",
    cardBg: "from-[#121E17] via-[#1A2E23] to-[#0A120E] border-amber-400/50 hover:border-amber-300 hover:shadow-lg hover:shadow-amber-500/10",
    iconBg: "from-amber-400 via-amber-500 to-amber-600 text-black",
    titleColor: "text-amber-200 group-hover:text-amber-100",
    badgeClass: "bg-amber-400/20 text-amber-300 border-amber-400/30",
    subtitleColor: "text-amber-100/70",
    btnBg: "from-amber-400 to-amber-500 text-black",
    btnIcon: "✨",
  },
};

export function RestaurantMenuSection({
  businessName,
  menuUrl,
  menuFotos,
  googleReviewUrl,
  googleMapsUrl,
  zonaNombre,
  locale = "es",
  whatsappNumber,
  luxuryMenuUrl,
  menuTema = "fogon",
}: RestaurantMenuSectionProps) {
  const [mounted, setMounted] = useState(false);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [paginaActual, setPaginaActual] = useState(0);
  const carouselRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const irAPagina = (index: number) => {
    if (carouselRef.current && index >= 0 && index < (menuFotos?.length || 0)) {
      const ancho = carouselRef.current.clientWidth;
      carouselRef.current.scrollTo({
        left: index * ancho,
        behavior: "smooth",
      });
      setPaginaActual(index);
    }
  };

  const fotos = menuFotos && menuFotos.length > 0 ? menuFotos : [];
  const tieneMenu = Boolean((menuFotos && menuFotos.length > 0) || menuUrl);
  const linkCalificar = googleReviewUrl || googleMapsUrl;

  // Bloquear scroll del fondo cuando el modal esté abierto
  useEffect(() => {
    if (modalAbierto) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [modalAbierto]);

  // Si el turista escaneó el QR físico de la mesa (src contiene mesa), abrir la carta automáticamente
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const srcParam = params.get("src") || "";
      if (luxuryMenuUrl && (srcParam.includes("mesa") || params.get("menu") === "abrir")) {
        window.location.href = luxuryMenuUrl;
        return;
      }
      if (tieneMenu && (srcParam.includes("mesa") || params.get("menu") === "abrir")) {
        setModalAbierto(true);
        trackEvent("apertura_automatica_menu_qr", {
          restaurante: businessName,
          zona: zonaNombre,
          origen: srcParam,
        });
      }
    }
  }, [tieneMenu, luxuryMenuUrl, businessName, zonaNombre]);

  // Si no hay menú ni enlace para calificar ni menú de lujo, no ocupamos espacio
  if (!tieneMenu && !linkCalificar && !luxuryMenuUrl) {
    return null;
  }

  const isEn = locale === "en";
  const curTheme = THEME_STYLES[menuTema || "fogon"] || THEME_STYLES.fogon;

  return (
    <>
      {/* ─── 1. Tarjetas en la ficha del negocio ─── */}
      <section className="space-y-3">
        {/* Carta Interactiva de Lujo con tema dinámico si está configurada */}
        {luxuryMenuUrl && (
          <Link
            href={luxuryMenuUrl}
            onClick={() => {
              trackEvent("click_menu_lujo_interactivo", {
                restaurante: businessName,
                zona: zonaNombre,
                tema: menuTema,
              });
            }}
            className={`w-full text-left p-4 rounded-2xl bg-gradient-to-br ${curTheme.cardBg} active:scale-[0.99] transition-all flex items-center justify-between gap-3 cursor-pointer group text-inherit no-underline`}
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${curTheme.iconBg} flex items-center justify-center text-2xl shrink-0 shadow-md group-hover:scale-105 transition-transform font-bold`}>
                {curTheme.emoji}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <h3 className={`font-serif text-base font-bold ${curTheme.titleColor} truncate transition-colors`}>
                    {isEn ? curTheme.titleEn : curTheme.titleEs}
                  </h3>
                  <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border shrink-0 ${curTheme.badgeClass}`}>
                    {curTheme.badge}
                  </span>
                </div>
                <p className={`text-xs ${curTheme.subtitleColor} line-clamp-1 mt-0.5 font-serif italic`}>
                  {isEn
                    ? "Interactive digital menu in 4 languages with photos"
                    : "Menú interactivo en 4 idiomas con fotografías y detalles"}
                </p>
              </div>
            </div>

            <span className={`shrink-0 bg-gradient-to-r ${curTheme.btnBg} font-serif text-xs font-bold px-3.5 py-2.5 rounded-xl transition-all shadow-md group-hover:scale-105 flex items-center gap-1.5 pointer-events-none`}>
              <span>{curTheme.btnIcon}</span>
              <span>{isEn ? "Open Menu" : "Ver Menú"}</span>
            </span>
          </Link>
        )}

        {/* Solo mostrar la carta tradicional si NO hay carta interactiva de lujo configurada */}
        {!luxuryMenuUrl && tieneMenu && (
          <button
            type="button"
            onClick={() => {
              trackEvent("ver_menu_carta", {
                restaurante: businessName,
                zona: zonaNombre,
                formato: fotos.length > 0 ? "fotos" : "enlace_externo",
                paginas: fotos.length,
              });
              setModalAbierto(true);
            }}
            className="w-full text-left p-4 rounded-2xl bg-gradient-to-br from-terra/10 via-cream to-white border border-terra/20 hover:border-terra/40 hover:shadow-md active:scale-[0.99] transition-all flex items-center justify-between gap-3 cursor-pointer group"
            aria-label={isEn ? "View menu & dishes" : "Ver carta y menú digital"}
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-12 h-12 rounded-xl bg-terra text-white flex items-center justify-center text-2xl shrink-0 shadow-xs group-hover:scale-105 transition-transform">
                🍽️
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h3 className="font-serif text-base font-semibold text-forest truncate group-hover:text-terra transition-colors">
                    {isEn ? "Digital Menu" : "Carta & Menú"}
                  </h3>
                  {fotos.length > 0 && (
                    <span className="text-[10px] font-sans font-medium px-2 py-0.5 rounded-full bg-terra/15 text-terra shrink-0">
                      {fotos.length} {fotos.length === 1 ? (isEn ? "page" : "pág") : (isEn ? "págs" : "págs")}
                    </span>
                  )}
                </div>
                <p className="text-xs text-stone line-clamp-1 mt-0.5">
                  {isEn
                    ? "Prices, specialties and options"
                    : "Precios y platos recomendados"}
                </p>
              </div>
            </div>

            <span
              className="shrink-0 bg-terra group-hover:bg-terra-dark text-white font-sans text-xs font-semibold px-3.5 py-2.5 rounded-xl transition-all shadow-xs group-hover:shadow-md group-hover:scale-105 flex items-center gap-1.5 pointer-events-none"
            >
              <span>📖</span>
              <span>{isEn ? "View Menu" : "Ver Carta"}</span>
            </span>
          </button>
        )}

        {/* ─── 2. Tarjeta de Calificación Google (Poderoso canal de reputación) ─── */}
        {linkCalificar && (
          <a
            href={linkCalificar}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => {
              trackEvent("click_calificar_google", {
                restaurante: businessName,
                zona: zonaNombre,
                ubicacion: "tarjeta_ficha",
              });
            }}
            className="w-full text-left p-3.5 rounded-2xl bg-amber-500/10 hover:bg-amber-500/15 border border-amber-500/20 hover:border-amber-500/35 hover:shadow-xs active:scale-[0.99] transition-all flex items-center justify-between gap-3 cursor-pointer group text-inherit no-underline"
            aria-label={isEn ? `Rate ${businessName} on Google` : `Calificar a ${businessName} en Google`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="text-xl shrink-0 group-hover:scale-110 transition-transform">⭐</span>
              <div className="min-w-0">
                <p className="font-sans text-xs font-semibold text-forest truncate group-hover:text-terra transition-colors">
                  {isEn ? "Enjoying your visit?" : "¿Disfrutaste tu visita?"}
                </p>
                <p className="text-[11px] text-stone line-clamp-1">
                  {isEn
                    ? `Rate ${businessName} with 5 stars`
                    : `Califica a ${businessName} con 5 estrellas`}
                </p>
              </div>
            </div>

            <span
              className="shrink-0 bg-white group-hover:bg-amber-50 text-forest border border-amber-300 text-xs font-semibold px-3 py-1.5 rounded-xl transition-all shadow-2xs group-hover:shadow-xs group-hover:scale-105 flex items-center gap-1 pointer-events-none"
            >
              <span className="text-amber-500">★</span>
              <span>{isEn ? "Rate" : "Calificar"}</span>
            </span>
          </a>
        )}
      </section>

      {/* ─── 3. Modal / Visor a pantalla completa para el Menú ─── */}
      {modalAbierto && mounted && createPortal(
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[9999] bg-black/90 backdrop-blur-md flex flex-col justify-between animate-in fade-in duration-200"
        >
          {/* Barra superior del Visor */}
          <header className="px-4 py-3 bg-gradient-to-b from-black/90 to-transparent flex items-center justify-between gap-3 text-white">
            <div className="min-w-0">
              <p className="text-[11px] text-stone-light uppercase tracking-wider font-semibold">
                {isEn ? "Menu" : "Carta Digital"}
              </p>
              <h2 className="font-serif text-lg font-bold text-white truncate">
                {businessName}
              </h2>
            </div>

            <div className="flex items-center gap-2">
              {fotos.length > 1 && (
                <div className="flex items-center gap-1 bg-white/15 backdrop-blur-md p-1 rounded-full border border-white/20">
                  {fotos.map((_, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => irAPagina(idx)}
                      className={`text-[11px] font-sans font-bold px-2.5 py-0.5 rounded-full transition-all cursor-pointer ${
                        idx === paginaActual
                          ? "bg-terra text-white shadow-xs"
                          : "text-white/75 hover:text-white"
                      }`}
                    >
                      Pág. {idx + 1}
                    </button>
                  ))}
                </div>
              )}
              <button
                type="button"
                onClick={() => setModalAbierto(false)}
                className="w-9 h-9 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-md text-white flex items-center justify-center text-lg font-bold transition-all active:scale-90 cursor-pointer"
                aria-label={isEn ? "Close menu" : "Cerrar carta"}
              >
                ✕
              </button>
            </div>
          </header>

          {/* Contenido principal: Fotos de la carta con Scroll-Snap y Flechas de Carrusel */}
          <main className="flex-1 w-full min-w-0 max-w-full overflow-hidden flex flex-col items-center justify-center px-2 py-1 relative">
            {fotos.length > 0 ? (
              <div className="relative w-full min-w-0 max-w-lg mx-auto flex flex-col justify-center h-full">
                {/* Contenedor deslizante */}
                <div
                  ref={carouselRef}
                  className="w-full min-w-0 max-w-full h-full flex overflow-x-auto snap-x snap-mandatory scrollbar-none items-center"
                  onScroll={(e) => {
                    const target = e.currentTarget;
                    const index = Math.round(target.scrollLeft / target.clientWidth);
                    if (index !== paginaActual && index >= 0 && index < fotos.length) {
                      setPaginaActual(index);
                    }
                  }}
                >
                  {fotos.map((foto, idx) => (
                    <div
                      key={idx}
                      className="w-full min-w-full max-w-full h-full shrink-0 snap-center flex items-center justify-center p-2 relative"
                    >
                      <Image
                        src={foto}
                        alt={`${businessName} — Menú pág. ${idx + 1}`}
                        width={1200}
                        height={1600}
                        className="max-h-[68vh] sm:max-h-[74vh] w-auto max-w-full object-contain rounded-xl shadow-2xl select-none"
                        unoptimized={true}
                        priority={idx === 0}
                        loading={idx === 0 ? "eager" : "lazy"}
                      />
                    </div>
                  ))}
                </div>

                {/* Barra de control de páginas bajo la imagen (‹ Ant | ● ○ | Sig ›) */}
                {fotos.length > 1 && (
                  <div className="flex items-center justify-between gap-3 max-w-[240px] w-full mx-auto py-1 px-3.5 bg-black/75 backdrop-blur-md rounded-full border border-white/20 z-20 shadow-lg">
                    <button
                      type="button"
                      onClick={() => irAPagina(paginaActual - 1)}
                      disabled={paginaActual === 0}
                      className={`text-xs font-sans font-bold flex items-center gap-1 transition-all ${
                        paginaActual === 0
                          ? "opacity-25 pointer-events-none text-white/40"
                          : "text-white hover:text-terra cursor-pointer active:scale-90"
                      }`}
                      aria-label="Página anterior"
                    >
                      <span className="text-base font-mono">‹</span>
                      <span>{isEn ? "Prev" : "Pág. Ant"}</span>
                    </button>

                    <div className="flex items-center gap-1.5">
                      {fotos.map((_, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => irAPagina(idx)}
                          className={`transition-all rounded-full cursor-pointer ${
                            idx === paginaActual
                              ? "w-5 h-2 bg-terra shadow-xs"
                              : "w-2 h-2 bg-white/40 hover:bg-white/70"
                          }`}
                          aria-label={`Página ${idx + 1}`}
                        />
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={() => irAPagina(paginaActual + 1)}
                      disabled={paginaActual === fotos.length - 1}
                      className={`text-xs font-sans font-bold flex items-center gap-1 transition-all ${
                        paginaActual === fotos.length - 1
                          ? "opacity-25 pointer-events-none text-white/40"
                          : "text-terra hover:text-white cursor-pointer active:scale-90"
                      }`}
                      aria-label="Página siguiente"
                    >
                      <span>{isEn ? "Next" : "Pág. Sig"}</span>
                      <span className="text-base font-mono">›</span>
                    </button>
                  </div>
                )}
              </div>
            ) : menuUrl ? (
              <div className="text-center p-6 bg-white/10 backdrop-blur-md rounded-2xl max-w-sm mx-auto text-white space-y-4">
                <span className="text-5xl block">📄</span>
                <div>
                  <h3 className="font-serif text-lg font-bold">
                    {isEn ? "Interactive Menu available" : "Menú digital disponible"}
                  </h3>
                  <p className="text-xs text-white/80 mt-1">
                    {isEn
                      ? "The restaurant maintains an updated digital menu in PDF / Canva format."
                      : "El restaurante tiene su menú oficial disponible para consulta directa."}
                  </p>
                </div>
                <a
                  href={menuUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => {
                    trackEvent("click_menu_externo", {
                      restaurante: businessName,
                      zona: zonaNombre,
                      url: menuUrl,
                    });
                  }}
                  className="inline-flex items-center gap-2 bg-terra hover:bg-terra-dark text-white font-sans text-sm font-semibold px-5 py-3 rounded-xl shadow-lg transition-all active:scale-95"
                >
                  <span>🔗</span>
                  <span>{isEn ? "Open Menu (External Link)" : "Abrir Carta Completa"}</span>
                </a>
              </div>
            ) : (
              <div className="text-center text-white/80 p-6">
                <p>{isEn ? "Menu coming soon" : "Menú próximamente disponible"}</p>
              </div>
            )}

            {/* ─── Flechas de Carrusel Estándar a los costados de la pantalla ─── */}
            {fotos.length > 1 && paginaActual > 0 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  irAPagina(paginaActual - 1);
                }}
                className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-30 w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-black/75 hover:bg-black/90 active:scale-90 text-white border border-white/30 backdrop-blur-md shadow-2xl flex items-center justify-center transition-all cursor-pointer group"
                aria-label={isEn ? "Previous page" : "Página anterior"}
              >
                <svg
                  className="w-6 h-6 stroke-current transition-transform group-hover:-translate-x-0.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="2.5"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15.75 19.5L8.25 12l7.5-7.5"
                  />
                </svg>
              </button>
            )}

            {fotos.length > 1 && paginaActual < fotos.length - 1 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  irAPagina(paginaActual + 1);
                }}
                className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-30 w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-terra hover:bg-terra-dark active:scale-90 text-white border-2 border-white/80 shadow-2xl backdrop-blur-md flex items-center justify-center transition-all cursor-pointer group animate-pulse hover:animate-none"
                aria-label={isEn ? "Next page" : "Página siguiente"}
              >
                <svg
                  className="w-7 h-7 sm:w-8 sm:h-8 stroke-current transition-transform group-hover:translate-x-0.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="2.5"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M8.25 4.5l7.5 7.5-7.5 7.5"
                  />
                </svg>
              </button>
            )}
          </main>

          {/* Barra inferior del Visor: Opciones de pedir o calificar */}
          <footer className="px-4 py-3 bg-gradient-to-t from-black/95 via-black/80 to-transparent flex flex-col gap-2 max-w-lg mx-auto w-full">
            <div className="flex items-center justify-between gap-2">
              {whatsappNumber && (
                <a
                  href={`https://wa.me/${whatsappNumber.replace(/\D/g, "")}?text=${encodeURIComponent(
                    `Hola ${businessName}, estoy viendo su carta en PaDónde y me gustaría ordenar / consultar disponibilidad.`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => {
                    trackEvent("click_whatsapp_menu", {
                      restaurante: businessName,
                      zona: zonaNombre,
                      seccion_origen: "visor_menu_carta",
                    });
                  }}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white font-sans text-xs font-semibold py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-xs"
                >
                  <span>💬</span>
                  <span>{isEn ? "Order on WhatsApp" : "Pedir por WhatsApp"}</span>
                </a>
              )}

              {linkCalificar && (
                <a
                  href={linkCalificar}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => {
                    trackEvent("click_calificar_google", {
                      restaurante: businessName,
                      zona: zonaNombre,
                      ubicacion: "modal_carta",
                    });
                  }}
                  className="bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-400/40 font-sans text-xs font-semibold py-2.5 px-3 rounded-xl flex items-center justify-center gap-1 transition-all"
                >
                  <span>⭐</span>
                  <span>{isEn ? "Rate on Google" : "Calificar en Google"}</span>
                </a>
              )}
            </div>

            <p className="text-[10px] text-center text-white/50">
              🌿 {isEn ? "Powered by PaDónde · Explore" : "Presentado por PaDónde · Descubre"} {zonaNombre}
            </p>
          </footer>
        </div>,
        document.body
      )}
    </>
  );
}
