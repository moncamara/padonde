"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useLocale } from "next-intl";

interface StorySlide {
  id: string;
  imageUrl: string;
  caption?: Record<string, string>;
}

interface StoryGroup {
  id: string;
  labels: Record<string, string>;
  thumbnail: string;
  slides: StorySlide[];
}

const SLIDE_DURATION_MS = 5000;

const STORIES_DATA: StoryGroup[] = [
  {
    id: "imperdibles",
    labels: {
      es: "✨ Imperdibles",
      en: "✨ Must-Sees",
      fr: "✨ Incontournables",
      de: "✨ Highlights",
    },
    thumbnail: "/stories-demo/1.jpg",
    slides: [
      {
        id: "imp-1",
        imageUrl: "/stories-demo/1.jpg",
        caption: {
          es: "Experiencias auténticas entre la Sierra y el mar",
          en: "Authentic experiences between mountain and sea",
          fr: "Expériences authentiques entre montagne et mer",
          de: "Authentische Erlebnisse zwischen Berg und Meer",
        },
      },
      {
        id: "imp-2",
        imageUrl: "/stories-demo/2.jpg",
        caption: {
          es: "Planes recomendados hoy por anfitriones locales",
          en: "Today's plans recommended by local hosts",
          fr: "Sorties du jour recommandées par les hôtes locaux",
          de: "Heutige Tipps von lokalen Gastgebern",
        },
      },
    ],
  },
  {
    id: "comunidad",
    labels: {
      es: "🌍 Comunidad",
      en: "🌍 Community",
      fr: "🌍 Communauté",
      de: "🌍 Community",
    },
    thumbnail: "/stories-demo/3.jpg",
    slides: [
      {
        id: "com-1",
        imageUrl: "/stories-demo/3.jpg",
        caption: {
          es: "Viajeros y locales conectados sin intermediarios",
          en: "Travelers and locals connected with zero middlemen",
          fr: "Voyageurs et locaux connectés sans intermédiaire",
          de: "Reisende und Einheimische direkt vernetzt",
        },
      },
      {
        id: "com-2",
        imageUrl: "/stories-demo/4.jpg",
        caption: {
          es: "Cultura viva, bienestar, gastronomía y música",
          en: "Living culture, wellness, dining & live music",
          fr: "Culture vivante, bien-être, gastronomie et musique",
          de: "Lebendige Kultur, Wellness, Gastronomie & Musik",
        },
      },
    ],
  },
  {
    id: "destinos",
    labels: {
      es: "🏔️ Destinos",
      en: "🏔️ Destinations",
      fr: "🏔️ Destinations",
      de: "🏔️ Reiseziele",
    },
    thumbnail: "/stories-demo/5.jpg",
    slides: [
      {
        id: "dest-1",
        imageUrl: "/stories-demo/5.jpg",
        caption: {
          es: "De las cascadas de Minca a las olas de Mendihuaca",
          en: "From Minca's waterfalls to Mendihuaca's waves",
          fr: "Des cascades de Minca aux vagues de Mendihuaca",
          de: "Von Mincas Wasserfällen zu Mendihuacas Wellen",
        },
      },
      {
        id: "dest-2",
        imageUrl: "/stories-demo/6.jpg",
        caption: {
          es: "Explora la ruta completa Minca ⇄ Mendihuaca ⇄ Tayrona",
          en: "Explore the full route Minca ⇄ Mendihuaca ⇄ Tayrona",
          fr: "Explorez l'itinéraire Minca ⇄ Mendihuaca ⇄ Tayrona",
          de: "Entdecke die Route Minca ⇄ Mendihuaca ⇄ Tayrona",
        },
      },
    ],
  },
];

export function TouristStories() {
  const locale = useLocale();
  const [activeStoryIndex, setActiveStoryIndex] = useState<number | null>(null);
  const [activeSlideIndex, setActiveSlideIndex] = useState<number>(0);
  const [progress, setProgress] = useState<number>(0);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [viewedIds, setViewedIds] = useState<Record<string, boolean>>({});

  const pointerDownTimeRef = useRef<number>(0);
  const elapsedBeforePauseRef = useRef<number>(0);
  const lastFrameTimeRef = useRef<number | null>(null);

  const closeViewer = useCallback(() => {
    setActiveStoryIndex(null);
    setActiveSlideIndex(0);
    setProgress(0);
    setIsPaused(false);
    elapsedBeforePauseRef.current = 0;
    lastFrameTimeRef.current = null;
  }, []);

  const goToNextSlide = useCallback(() => {
    if (activeStoryIndex === null) return;
    const currentGroup = STORIES_DATA[activeStoryIndex];
    if (!currentGroup) {
      closeViewer();
      return;
    }

    elapsedBeforePauseRef.current = 0;
    lastFrameTimeRef.current = null;
    setProgress(0);

    // Si hay más slides dentro de la misma burbuja, avanzar al siguiente slide
    if (activeSlideIndex < currentGroup.slides.length - 1) {
      setActiveSlideIndex((prev) => prev + 1);
      return;
    }

    // Marcar la burbuja actual como vista
    setViewedIds((prev) => ({ ...prev, [currentGroup.id]: true }));

    // Pasar automáticamente a la siguiente burbuja o cerrar al terminar la última
    if (activeStoryIndex < STORIES_DATA.length - 1) {
      setActiveStoryIndex((prev) => (prev !== null ? prev + 1 : null));
      setActiveSlideIndex(0);
    } else {
      closeViewer();
    }
  }, [activeStoryIndex, activeSlideIndex, closeViewer]);

  const goToPrevSlide = useCallback(() => {
    if (activeStoryIndex === null) return;

    elapsedBeforePauseRef.current = 0;
    lastFrameTimeRef.current = null;
    setProgress(0);

    if (activeSlideIndex > 0) {
      setActiveSlideIndex((prev) => prev - 1);
      return;
    }

    if (activeStoryIndex > 0) {
      const prevStoryIdx = activeStoryIndex - 1;
      const prevGroup = STORIES_DATA[prevStoryIdx];
      setActiveStoryIndex(prevStoryIdx);
      setActiveSlideIndex(prevGroup ? prevGroup.slides.length - 1 : 0);
    }
  }, [activeStoryIndex, activeSlideIndex]);

  // Temporizador de auto-avance cada 5 segundos con soporte de pausa al mantener presionado
  useEffect(() => {
    if (activeStoryIndex === null) return;

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
  }, [activeStoryIndex, activeSlideIndex, isPaused, goToNextSlide]);

  // Soporte de teclado (Escape, flechas izquierda/derecha)
  useEffect(() => {
    if (activeStoryIndex === null) return;

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
  }, [activeStoryIndex, closeViewer, goToNextSlide, goToPrevSlide]);

  const handleOpenStory = (index: number) => {
    elapsedBeforePauseRef.current = 0;
    lastFrameTimeRef.current = null;
    setProgress(0);
    setIsPaused(false);
    setActiveSlideIndex(0);
    setActiveStoryIndex(index);
  };

  const handlePointerDown = () => {
    pointerDownTimeRef.current = performance.now();
    setIsPaused(true);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    const holdDuration = performance.now() - pointerDownTimeRef.current;
    setIsPaused(false);

    // Si mantuvo presionado (> 200ms), solo reanuda el progreso sin cambiar de slide
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

  const activeGroup =
    activeStoryIndex !== null ? STORIES_DATA[activeStoryIndex] : null;
  const activeSlide =
    activeGroup && activeGroup.slides[activeSlideIndex]
      ? activeGroup.slides[activeSlideIndex]
      : null;

  return (
    <>
      {/* Fila horizontal compacta de burbujas (56px–62px) */}
      <section
        aria-label="Historias destacadas del destino"
        className="flex items-center justify-center sm:justify-start gap-4 sm:gap-5 py-0.5 px-1 overflow-x-auto no-scrollbar select-none"
      >
        {STORIES_DATA.map((story, idx) => {
          const label = story.labels[locale] || story.labels.es;
          const isViewed = Boolean(viewedIds[story.id]);

          return (
            <button
              key={story.id}
              type="button"
              onClick={() => handleOpenStory(idx)}
              className="group flex flex-col items-center gap-1 shrink-0 cursor-pointer focus:outline-none"
            >
              {/* Anillo degradado de marca: Verde Bosque (#1B382B) y Ámbar (#F59E0B) */}
              <div
                className={[
                  "w-[58px] h-[58px] sm:w-[62px] sm:h-[62px] rounded-full p-[2.5px] transition-transform duration-150 group-active:scale-95",
                  isViewed
                    ? "bg-stone-300"
                    : "bg-gradient-to-tr from-[#1B382B] via-[#144D34] to-amber-500 shadow-2xs",
                ].join(" ")}
              >
                <div className="w-full h-full rounded-full bg-cream p-[2px] overflow-hidden">
                  <img
                    src={story.thumbnail}
                    alt={label}
                    width={58}
                    height={58}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full rounded-full object-cover group-hover:scale-105 transition-transform duration-200"
                  />
                </div>
              </div>

              <span className="font-sans text-[11px] font-semibold text-forest tracking-tight leading-tight max-w-[82px] truncate">
                {label}
              </span>
            </button>
          );
        })}
      </section>

      {/* Visor Modal a Pantalla Completa — Montaje 100% condicional (0 descargas ocultas al inicio) */}
      {activeStoryIndex !== null && activeGroup && activeSlide && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={activeGroup.labels[locale] || activeGroup.labels.es}
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-xs flex items-center justify-center overscroll-contain select-none animate-in fade-in duration-150"
        >
          <div className="relative w-full h-full max-w-md max-h-[100dvh] sm:max-h-[90vh] sm:rounded-3xl overflow-hidden bg-stone-950 flex flex-col justify-between shadow-2xl">
            {/* Barra superior segmentada de progreso + Cabecera de la burbuja + Botón cerrar (✕) */}
            <div className="relative z-20 pt-3 px-3 pb-6 bg-gradient-to-b from-black/75 via-black/35 to-transparent space-y-2.5">
              {/* Segmentos de progreso */}
              <div className="flex items-center gap-1.5">
                {activeGroup.slides.map((slide, sIdx) => {
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

              {/* Info de la burbuja activa y botón discreto de cierre (✕) */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <img
                    src={activeGroup.thumbnail}
                    alt=""
                    width={32}
                    height={32}
                    className="w-8 h-8 rounded-full object-cover border border-amber-400/80 shrink-0"
                  />
                  <span className="font-sans text-xs sm:text-sm font-bold text-white truncate drop-shadow-xs">
                    {activeGroup.labels[locale] || activeGroup.labels.es}
                  </span>
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

            {/* Imagen central del slide + Superficie interactiva (1/3 izq retrocede, 2/3 der avanza, hold pausa) */}
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
                alt={
                  activeSlide.caption?.[locale] ||
                  activeSlide.caption?.es ||
                  activeGroup.labels.es
                }
                decoding="async"
                draggable={false}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Pie del slide con leyenda de alto contraste */}
            {activeSlide.caption && (
              <div className="relative z-20 p-4 sm:p-5 pt-10 bg-gradient-to-t from-black/85 via-black/45 to-transparent pointer-events-none">
                <p className="font-sans text-xs sm:text-sm font-medium text-white text-center leading-relaxed drop-shadow-xs">
                  {activeSlide.caption[locale] || activeSlide.caption.es}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

