"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { usePathname } from "next/navigation";

export interface StoriesConfig {
  activa: boolean;
  versionId: string;
  slides: string[];
}

interface TouristStoriesProps {
  config?: StoriesConfig | null;
}

const SLIDE_DURATION_MS = 5000;
const MAX_VIDEO_DURATION_SEC = 15;
const TICK_INTERVAL_MS = 50;

export const DEFAULT_DEMO_SLIDES = [
  "/stories-demo/2.jpg",
  "/stories-demo/3.jpg",
  "/stories-demo/4.jpg",
  "/stories-demo/5.jpg",
  "/stories-demo/6.jpg",
];

export function esVideoSlide(url?: string | null): boolean {
  if (!url) return false;
  return /\.(mp4|webm)(\?|#|$)/i.test(url.trim());
}

export function TouristStories({ config }: TouristStoriesProps) {
  const pathname = usePathname();
  const isAdminRoute = Boolean(pathname?.includes("/admin"));
  const activa = config ? Boolean(config.activa) : true;
  const versionId = config?.versionId || "demo-v2";
  const rawSlides =
    Array.isArray(config?.slides) && config!.slides.length > 0
      ? config!.slides
      : DEFAULT_DEMO_SLIDES;

  // Filtrar valores vacíos y excluir siempre /stories-demo/1.jpg (la buseta)
  const slides = rawSlides.filter(
    (s) => Boolean(s) && !s.endsWith("/stories-demo/1.jpg")
  );

  // Inicia en null hasta verificar localStorage / ?testStories=1 en cliente
  const [yaVisto, setYaVisto] = useState<boolean | null>(null);
  const [abierto, setAbierto] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isMuted, setIsMuted] = useState(true);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const pointerDownTimeRef = useRef<number>(0);
  const storageKey = `padonde_story_seen_${versionId}`;

  const currentSlide = slides[currentIndex] || "";
  const isCurrentVideo = abierto && esVideoSlide(currentSlide);

  // Limpieza explícita de RAM móvil para el elemento <video>
  const limpiarMemoriaVideo = useCallback(() => {
    const video = videoRef.current;
    if (video) {
      try {
        video.pause();
        video.removeAttribute("src");
        video.load();
      } catch {
        // Ignorar
      }
    }
  }, []);

  // 1. Verificar en cliente si esta versión ya fue vista (o si viene ?testStories=1)
  useEffect(() => {
    if (!activa || slides.length === 0) {
      setYaVisto(true);
      return;
    }
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get("testStories") === "1") {
        setYaVisto(false);
        return;
      }
      const seen = localStorage.getItem(storageKey);
      setYaVisto(Boolean(seen));
    } catch {
      setYaVisto(false);
    }
  }, [activa, slides.length, storageKey]);

  // 2. Limpiar buffer de video, persistir en localStorage y ocultar por completo la Brújula-Sol
  const finalizarYCerrar = useCallback(() => {
    limpiarMemoriaVideo();
    try {
      localStorage.setItem(storageKey, "true");
    } catch {
      // Ignorar si modo incógnito restringe storage
    }
    setAbierto(false);
    setYaVisto(true);
  }, [limpiarMemoriaVideo, storageKey]);

  const avanzarOSalir = useCallback(() => {
    limpiarMemoriaVideo();
    if (currentIndex < slides.length - 1) {
      setCurrentIndex((idx) => idx + 1);
      setProgress(0);
    } else {
      finalizarYCerrar();
    }
  }, [currentIndex, slides.length, limpiarMemoriaVideo, finalizarYCerrar]);

  const retrocederOReiniciar = useCallback(() => {
    if (currentIndex > 0) {
      limpiarMemoriaVideo();
      setCurrentIndex((idx) => idx - 1);
      setProgress(0);
    } else {
      if (videoRef.current) {
        try {
          videoRef.current.currentTime = 0;
          videoRef.current.play().catch(() => {});
        } catch {
          // Ignorar
        }
      }
      setProgress(0);
    }
  }, [currentIndex, limpiarMemoriaVideo]);

  // 3. Liberar RAM del video anterior al cambiar de lámina o cerrar el modal
  useEffect(() => {
    return () => {
      limpiarMemoriaVideo();
    };
  }, [currentIndex, abierto, limpiarMemoriaVideo]);

  // 4. Pausar o reanudar <video> cuando el usuario mantiene presionada la pantalla
  useEffect(() => {
    if (!isCurrentVideo || !videoRef.current) return;
    if (isPaused) {
      videoRef.current.pause();
    } else {
      videoRef.current.play().catch(() => {});
    }
  }, [isPaused, isCurrentVideo]);

  // 5. Auto-avance cada 5 segundos SOLO para láminas de imagen (los videos usan onTimeUpdate / onEnded)
  useEffect(() => {
    if (!abierto || isPaused || isCurrentVideo) return;

    const step = (TICK_INTERVAL_MS / SLIDE_DURATION_MS) * 100;
    const timer = window.setInterval(() => {
      setProgress((prev) => {
        if (prev + step >= 100) {
          window.clearInterval(timer);
          setTimeout(() => avanzarOSalir(), 0);
          return 100;
        }
        return prev + step;
      });
    }, TICK_INTERVAL_MS);

    return () => window.clearInterval(timer);
  }, [abierto, isPaused, isCurrentVideo, avanzarOSalir]);

  // 6. Bloquear scroll del body y navegación con teclado cuando el visor está abierto
  useEffect(() => {
    if (!abierto) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        finalizarYCerrar();
      } else if (e.key === "ArrowRight") {
        avanzarOSalir();
      } else if (e.key === "ArrowLeft") {
        retrocederOReiniciar();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [abierto, finalizarYCerrar, avanzarOSalir, retrocederOReiniciar]);

  // Zero-Noise UX: nunca mostrar en rutas /admin, ni si está desactivada, sin láminas, o ya fue vista esta versionId -> null
  if (isAdminRoute || !activa || slides.length === 0 || yaVisto !== false) {
    return null;
  }

  function handleAbrirStories() {
    setCurrentIndex(0);
    setProgress(0);
    setIsPaused(false);
    setAbierto(true);
  }

  function handlePointerDown() {
    pointerDownTimeRef.current = Date.now();
    setIsPaused(true);
  }

  function handlePointerUp(zone: "left" | "right") {
    const heldMs = Date.now() - pointerDownTimeRef.current;
    setIsPaused(false);

    if (heldMs > 220) return;

    if (zone === "left") {
      retrocederOReiniciar();
    } else {
      avanzarOSalir();
    }
  }

  function handleVideoTimeUpdate() {
    const video = videoRef.current;
    if (!video) return;

    const rawDuration =
      Number.isFinite(video.duration) && video.duration > 0
        ? video.duration
        : MAX_VIDEO_DURATION_SEC;
    const effectiveDuration = Math.min(MAX_VIDEO_DURATION_SEC, rawDuration);
    const pct = Math.min(100, (video.currentTime / effectiveDuration) * 100);
    setProgress(pct);

    if (video.currentTime >= MAX_VIDEO_DURATION_SEC) {
      avanzarOSalir();
    }
  }

  return (
    <>
      {/* Mascota Flotante Compacta: Anillo Orbital + Sol + Brújula Girando (60fps CSS nativo) */}
      <button
        type="button"
        onClick={handleAbrirStories}
        aria-label="Ver historias destacadas de hoy en PaDónde"
        title="Historias destacadas de hoy"
        className="fixed bottom-20 right-4 z-40 w-[54px] h-[54px] cursor-pointer select-none bg-transparent border-0 p-0 hover:scale-105 active:scale-95 transition-transform focus:outline-none"
      >
        {/* Anillo orbital verde bosque con satélite girando en sentido contrario */}
        <span
          aria-hidden="true"
          className="absolute inset-0 rounded-full border border-[#085127]/75 animate-[spin_8s_linear_infinite_reverse] pointer-events-none"
        >
          <span className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-[#085127]" />
        </span>

        {/* Capa base (Sol limpio sin halo) y capa superior (Brújula girando) sin filtros CSS */}
        <div className="relative w-full h-full p-1.5 pointer-events-none">
          <img
            src="/animations/img_0_clean.png"
            alt="PaDónde"
            className="w-full h-full object-contain"
            draggable={false}
          />
          <img
            src="/animations/img_1.png"
            alt=""
            className="absolute inset-1.5 w-[calc(100%-0.75rem)] h-[calc(100%-0.75rem)] object-contain animate-[spin_12s_linear_infinite]"
            draggable={false}
          />
        </div>
      </button>

      {/* Visor Modal tipo Instagram Stories */}
      {abierto && (
        <div
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex items-center justify-center select-none"
          role="dialog"
          aria-modal="true"
          aria-label="Historias de PaDónde"
        >
          <div className="relative w-full h-full max-w-[430px] max-h-[92vh] sm:rounded-3xl overflow-hidden bg-black shadow-2xl flex flex-col">
            {/* Barras de progreso segmentadas */}
            <div className="absolute top-3 left-3 right-3 z-20 flex items-center gap-1.5">
              {slides.map((_, idx) => {
                const fillWidth =
                  idx < currentIndex
                    ? 100
                    : idx === currentIndex
                    ? Math.min(100, Math.max(0, progress))
                    : 0;
                return (
                  <div
                    key={idx}
                    className="flex-1 h-1 rounded-full bg-white/30 overflow-hidden"
                  >
                    <div
                      className="h-full bg-white transition-none rounded-full"
                      style={{ width: `${fillWidth}%` }}
                    />
                  </div>
                );
              })}
            </div>

            {/* Cabecera con sello PaDónde, control opcional de audio en video y botón cerrar ✕ */}
            <div className="absolute top-6 left-3.5 right-3.5 z-20 flex items-center justify-between pt-1">
              <div className="flex items-center gap-2 bg-black/40 backdrop-blur-md px-3 py-1 rounded-full border border-white/15">
                <span className="text-sm">{isCurrentVideo ? "🎬" : "☀️"}</span>
                <span className="text-xs font-sans font-semibold text-white tracking-wide">
                  PaDónde · Hoy en la Sierra
                </span>
                <span className="text-[10px] font-mono text-white/70">
                  {currentIndex + 1}/{slides.length}
                </span>
              </div>

              <div className="flex items-center gap-2">
                {isCurrentVideo && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsMuted((prev) => !prev);
                    }}
                    aria-label={isMuted ? "Activar sonido" : "Silenciar video"}
                    title={isMuted ? "Activar sonido" : "Silenciar"}
                    className="w-9 h-9 rounded-full bg-black/50 hover:bg-black/75 border border-white/20 text-white flex items-center justify-center text-sm cursor-pointer transition-colors"
                  >
                    {isMuted ? "🔇" : "🔊"}
                  </button>
                )}

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    finalizarYCerrar();
                  }}
                  aria-label="Cerrar historias"
                  className="w-9 h-9 rounded-full bg-black/50 hover:bg-black/75 border border-white/20 text-white flex items-center justify-center text-sm font-bold cursor-pointer transition-colors"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Lámina actual: <video> bajo demanda (0 KB en portada) o <img> */}
            <div className="relative w-full h-full flex items-center justify-center bg-black">
              {isCurrentVideo ? (
                <video
                  key={currentSlide}
                  ref={videoRef}
                  src={currentSlide}
                  autoPlay
                  muted={isMuted}
                  playsInline
                  preload="metadata"
                  onTimeUpdate={handleVideoTimeUpdate}
                  onEnded={avanzarOSalir}
                  onError={avanzarOSalir}
                  className="w-full h-full object-contain bg-black select-none pointer-events-none"
                />
              ) : (
                <img
                  key={currentSlide}
                  src={currentSlide}
                  alt={`Historia PaDónde ${currentIndex + 1} de ${slides.length}`}
                  className="w-full h-full object-contain bg-black select-none pointer-events-none"
                  draggable={false}
                />
              )}

              {/* Zonas táctiles izquierda (retroceder) y derecha (avanzar) + mantener presionado para pausar */}
              <div className="absolute inset-0 z-10 flex">
                <div
                  className="w-[35%] h-full cursor-pointer"
                  onPointerDown={handlePointerDown}
                  onPointerUp={() => handlePointerUp("left")}
                  onPointerCancel={() => setIsPaused(false)}
                />
                <div
                  className="w-[65%] h-full cursor-pointer"
                  onPointerDown={handlePointerDown}
                  onPointerUp={() => handlePointerUp("right")}
                  onPointerCancel={() => setIsPaused(false)}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
