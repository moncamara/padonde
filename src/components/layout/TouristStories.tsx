"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useLocale } from "next-intl";

interface StorySlide {
  id: string;
  imageUrl: string;
  tag: Record<string, string>;
  caption: Record<string, string>;
}

const SLIDE_DURATION_MS = 5000;
const SESSION_STORAGE_KEY = "padonde_stories_demo_viewed";

const ORB_LABELS: Record<string, { title: string; badge: string }> = {
  es: { title: "Historias de PaDónde", badge: "Novedades" },
  en: { title: "PaDónde Stories", badge: "Highlights" },
  fr: { title: "Stories PaDónde", badge: "À la une" },
  de: { title: "PaDónde Stories", badge: "Highlights" },
};

const STORY_SLIDES: StorySlide[] = [
  {
    id: "slide-1",
    imageUrl: "/stories-demo/1.jpg",
    tag: {
      es: "✨ Imperdibles",
      en: "✨ Must-Sees",
      fr: "✨ Incontournables",
      de: "✨ Highlights",
    },
    caption: {
      es: "Experiencias auténticas entre la Sierra Nevada y el mar Caribe",
      en: "Authentic experiences between the Sierra Nevada and the Caribbean",
      fr: "Expériences authentiques entre la Sierra Nevada et la mer des Caraïbes",
      de: "Authentische Erlebnisse zwischen der Sierra Nevada und der Karibik",
    },
  },
  {
    id: "slide-2",
    imageUrl: "/stories-demo/2.jpg",
    tag: {
      es: "✨ Imperdibles",
      en: "✨ Must-Sees",
      fr: "✨ Incontournables",
      de: "✨ Highlights",
    },
    caption: {
      es: "Planes recomendados hoy por anfitriones locales sin intermediarios",
      en: "Today's plans recommended by local hosts with zero middlemen",
      fr: "Sorties du jour recommandées par les hôtes locaux sans intermédiaire",
      de: "Heutige Tipps von lokalen Gastgebern ohne Zwischenhändler",
    },
  },
  {
    id: "slide-3",
    imageUrl: "/stories-demo/3.jpg",
    tag: {
      es: "🌍 Comunidad",
      en: "🌍 Community",
      fr: "🌍 Communauté",
      de: "🌍 Community",
    },
    caption: {
      es: "Viajeros y anfitriones conectados directamente por WhatsApp",
      en: "Travelers and hosts connected directly via WhatsApp",
      fr: "Voyageurs et hôtes connectés directement sur WhatsApp",
      de: "Reisende und Gastgeber direkt über WhatsApp vernetzt",
    },
  },
  {
    id: "slide-4",
    imageUrl: "/stories-demo/4.jpg",
    tag: {
      es: "🌍 Comunidad",
      en: "🌍 Community",
      fr: "🌍 Communauté",
      de: "🌍 Community",
    },
    caption: {
      es: "Cultura viva, bienestar, gastronomía local y música en vivo",
      en: "Living culture, wellness, local dining & live music",
      fr: "Culture vivante, bien-être, gastronomie locale et musique live",
      de: "Lebendige Kultur, Wellness, lokale Gastronomie & Live-Musik",
    },
  },
  {
    id: "slide-5",
    imageUrl: "/stories-demo/5.jpg",
    tag: {
      es: "🏔️ Destinos",
      en: "🏔️ Destinations",
      fr: "🏔️ Destinations",
      de: "🏔️ Reiseziele",
    },
    caption: {
      es: "De las cascadas frescas de Minca a las olas de Mendihuaca",
      en: "From Minca's fresh waterfalls to Mendihuaca's waves",
      fr: "Des cascades fraîches de Minca aux vagues de Mendihuaca",
      de: "Von Mincas frischen Wasserfällen zu Mendihuacas Wellen",
    },
  },
  {
    id: "slide-6",
    imageUrl: "/stories-demo/6.jpg",
    tag: {
      es: "🏔️ Destinos",
      en: "🏔️ Destinations",
      fr: "🏔️ Destinations",
      de: "🏔️ Reiseziele",
    },
    caption: {
      es: "Explora la ruta completa Minca ⇄ Mendihuaca ⇄ Parque Tayrona",
      en: "Explore the full route Minca ⇄ Mendihuaca ⇄ Tayrona Park",
      fr: "Explorez l'itinéraire complet Minca ⇄ Mendihuaca ⇄ Parc Tayrona",
      de: "Entdecke die komplette Route Minca ⇄ Mendihuaca ⇄ Tayrona-Park",
    },
  },
];

export function TouristStories() {
  const locale = useLocale();
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [activeSlideIndex, setActiveSlideIndex] = useState<number>(0);
  const [progress, setProgress] = useState<number>(0);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isViewed, setIsViewed] = useState<boolean>(false);

  const pointerDownTimeRef = useRef<number>(0);
  const elapsedBeforePauseRef = useRef<number>(0);
  const lastFrameTimeRef = useRef<number | null>(null);

  // Recuperar estado "Visto" desde sessionStorage
  useEffect(() => {
    try {
      if (sessionStorage.getItem(SESSION_STORAGE_KEY) === "true") {
        setIsViewed(true);
      }
    } catch {}
  }, []);

  const markAsViewed = useCallback(() => {
    setIsViewed(true);
    try {
      sessionStorage.setItem(SESSION_STORAGE_KEY, "true");
    } catch {}
  }, []);

  const closeViewer = useCallback(() => {
    setIsOpen(false);
    setActiveSlideIndex(0);
    setProgress(0);
    setIsPaused(false);
    elapsedBeforePauseRef.current = 0;
    lastFrameTimeRef.current = null;
  }, []);

  const goToNextSlide = useCallback(() => {
    elapsedBeforePauseRef.current = 0;
    lastFrameTimeRef.current = null;
    setProgress(0);

    if (activeSlideIndex < STORY_SLIDES.length - 1) {
      setActiveSlideIndex((prev) => prev + 1);
    } else {
      markAsViewed();
      closeViewer();
    }
  }, [activeSlideIndex, closeViewer, markAsViewed]);

  const goToPrevSlide = useCallback(() => {
    elapsedBeforePauseRef.current = 0;
    lastFrameTimeRef.current = null;
    setProgress(0);

    if (activeSlideIndex > 0) {
      setActiveSlideIndex((prev) => prev - 1);
    }
  }, [activeSlideIndex]);

  // Temporizador de auto-avance cada 5 segundos con pausa al mantener presionado
  useEffect(() => {
    if (!isOpen) return;

    let rafId: number;

    const tick = (now: number) => {
      if (lastFrameTimeRef.current === null) {
        lastFrameTimeRef.current = now;
      }
      const delta = now - lastFrameTimeRef.current;
      lastFrameTimeRef.current = now;

      if (!isPaused) {
        elapsedBeforePauseRef.current += delta;
        const pct = Math.min(
          100,
          (elapsedBeforePauseRef.current / SLIDE_DURATION_MS) * 100
        );
        setProgress(pct);

        if (elapsedBeforePauseRef.current >= SLIDE_DURATION_MS) {
          goToNextSlide();
          return;
        }
      }

      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [isOpen, activeSlideIndex, isPaused, goToNextSlide]);

  // Soporte de teclado (Escape, flechas izquierda/derecha)
  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        closeViewer();
      } else if (e.key === "ArrowRight") {
        goToNextSlide();
      } else if (e.key === "ArrowLeft") {
        goToPrevSlide();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, closeViewer, goToNextSlide, goToPrevSlide]);

  const handleOpenOrb = () => {
    elapsedBeforePauseRef.current = 0;
    lastFrameTimeRef.current = null;
    setProgress(0);
    setIsPaused(false);
    setActiveSlideIndex(0);
    setIsOpen(true);
    markAsViewed();
  };

  const handlePointerDown = () => {
    pointerDownTimeRef.current = performance.now();
    setIsPaused(true);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    const holdDuration = performance.now() - pointerDownTimeRef.current;
    setIsPaused(false);

    if (holdDuration > 200) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const isLeftThird = clickX < rect.width / 3;

    if (isLeftThird) {
      goToPrevSlide();
    } else {
      goToNextSlide();
    }
  };

  const orbCopy = ORB_LABELS[locale] || ORB_LABELS.es;
  const activeSlide = STORY_SLIDES[activeSlideIndex] || STORY_SLIDES[0];

  return (
    <>
      {/* Burbuja Flotante Única (Floating Story Orb) — 0px de impacto vertical en la cabecera */}
      <button
        type="button"
        onClick={handleOpenOrb}
        aria-label={orbCopy.title}
        title={orbCopy.title}
        className="fixed bottom-5 right-4 z-40 group flex flex-col items-center cursor-pointer select-none focus:outline-none"
      >
        <div
          className={[
            "relative w-14 h-14 rounded-full p-[2.5px] shadow-lg transition-all duration-200 group-hover:scale-105 group-active:scale-95",
            isViewed
              ? "bg-stone-300/90 opacity-90"
              : "bg-gradient-to-tr from-[#1B382B] via-[#144D34] to-amber-500",
          ].join(" ")}
        >
          {/* Insignia superior discreta (✨ + contador 6) */}
          <span
            className={[
              "absolute -top-1 -right-1 z-10 px-1.5 py-0.5 rounded-full text-[9px] font-extrabold leading-none shadow-xs border flex items-center gap-0.5",
              isViewed
                ? "bg-stone-200 text-stone-700 border-white"
                : "bg-amber-400 text-[#1B382B] border-[#FBF9F5]",
            ].join(" ")}
          >
            <span>✨</span>
            <span>{STORY_SLIDES.length}</span>
          </span>

          <div className="w-full h-full rounded-full bg-cream p-[2px] overflow-hidden">
            <img
              src="/stories-demo/1.jpg"
              alt={orbCopy.title}
              width={56}
              height={56}
              loading="lazy"
              decoding="async"
              className="w-full h-full rounded-full object-cover"
            />
          </div>

          {/* Micro-etiqueta inferior superpuesta sin ocupar flujo */}
          <span
            className={[
              "absolute -bottom-1.5 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full text-[9px] font-bold tracking-tight whitespace-nowrap shadow-xs border",
              isViewed
                ? "bg-white/95 text-stone-600 border-stone-300"
                : "bg-[#1B382B] text-[#FBF9F5] border-amber-400/70",
            ].join(" ")}
          >
            {orbCopy.badge}
          </span>
        </div>
      </button>

      {/* Visor Modal a Pantalla Completa — Montaje 100% condicional (0 KB descargados al inicio) */}
      {isOpen && activeSlide && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={orbCopy.title}
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-xs flex items-center justify-center overscroll-contain select-none animate-in fade-in duration-150"
        >
          <div className="relative w-full h-full max-w-md max-h-[100dvh] sm:max-h-[90vh] sm:rounded-3xl overflow-hidden bg-stone-950 flex flex-col justify-between shadow-2xl">
            {/* Barra superior segmentada (6 slides) + Cabecera + Botón cerrar (✕) */}
            <div className="relative z-20 pt-3 px-3 pb-6 bg-gradient-to-b from-black/80 via-black/40 to-transparent space-y-2.5">
              <div className="flex items-center gap-1">
                {STORY_SLIDES.map((slide, sIdx) => {
                  let barWidth = "0%";
                  if (sIdx < activeSlideIndex) {
                    barWidth = "100%";
                  } else if (sIdx === activeSlideIndex) {
                    barWidth = `${progress}%`;
                  }

                  return (
                    <div
                      key={slide.id}
                      className="flex-1 h-1 rounded-full bg-white/30 overflow-hidden"
                    >
                      <div
                        className="h-full bg-amber-400 rounded-full"
                        style={{ width: barWidth }}
                      />
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <img
                    src="/stories-demo/1.jpg"
                    alt=""
                    width={32}
                    height={32}
                    className="w-8 h-8 rounded-full object-cover border border-amber-400/80 shrink-0"
                  />
                  <div className="min-w-0">
                    <span className="font-sans text-xs sm:text-sm font-bold text-white block truncate drop-shadow-xs">
                      {activeSlide.tag[locale] || activeSlide.tag.es}
                    </span>
                    <span className="font-sans text-[10px] text-white/75 block truncate">
                      PaDónde • {activeSlideIndex + 1}/{STORY_SLIDES.length}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    closeViewer();
                  }}
                  aria-label="Cerrar historias"
                  className="w-11 h-11 rounded-full bg-black/40 hover:bg-black/65 text-white flex items-center justify-center text-base font-bold transition-colors cursor-pointer shrink-0"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Imagen central del slide + Superficie táctil (1/3 izq retrocede, 2/3 der avanza, mantener presionado pausa) */}
            <div
              onPointerDown={handlePointerDown}
              onPointerUp={handlePointerUp}
              onPointerCancel={() => setIsPaused(false)}
              onPointerLeave={() => {
                if (isPaused) setIsPaused(false);
              }}
              onContextMenu={(e) => e.preventDefault()}
              className="absolute inset-0 z-10 flex items-center justify-center cursor-pointer touch-manipulation"
            >
              <img
                key={activeSlide.id}
                src={activeSlide.imageUrl}
                alt={activeSlide.caption[locale] || activeSlide.caption.es}
                decoding="async"
                draggable={false}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Pie del slide con leyenda */}
            <div className="relative z-20 p-4 sm:p-5 pt-10 bg-gradient-to-t from-black/85 via-black/45 to-transparent pointer-events-none">
              <p className="font-sans text-xs sm:text-sm font-medium text-white text-center leading-relaxed drop-shadow-xs">
                {activeSlide.caption[locale] || activeSlide.caption.es}
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
