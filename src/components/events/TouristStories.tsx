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
const MASCOT_SIZE = 54;
const SAFE_MARGIN = 12;
const DRAG_THRESHOLD_PX = 6;
const TRASH_HIT_RADIUS_PX = 56;
const POS_STORAGE_KEY = "padonde_story_pos";

export const DEFAULT_DEMO_SLIDES: string[] = [];

export function esVideoSlide(url?: string | null): boolean {
  if (!url) return false;
  return /\.(mp4|webm)(\?|#|$)/i.test(url.trim());
}

function clampPositionToViewport(x: number, y: number): { x: number; y: number } {
  if (typeof window === "undefined") return { x, y };
  const maxX = Math.max(SAFE_MARGIN, window.innerWidth - MASCOT_SIZE - SAFE_MARGIN);
  const maxY = Math.max(SAFE_MARGIN, window.innerHeight - MASCOT_SIZE - SAFE_MARGIN);
  return {
    x: Math.min(maxX, Math.max(SAFE_MARGIN, Math.round(x))),
    y: Math.min(maxY, Math.max(SAFE_MARGIN, Math.round(y))),
  };
}

export function TouristStories({ config }: TouristStoriesProps) {
  const pathname = usePathname();
  const isAdminRoute = Boolean(pathname?.includes("/admin"));
  const activa = config ? Boolean(config.activa) : false;
  const versionId = config?.versionId || "v1";
  const rawSlides =
    Array.isArray(config?.slides) && config!.slides.length > 0
      ? config!.slides
      : DEFAULT_DEMO_SLIDES;

  // Filtrar valores vacíos y cualquier imagen demo heredada (/stories-demo/*)
  const slides = rawSlides.filter(
    (s) => Boolean(s) && !s.includes("/stories-demo/")
  );

  // Inicia en null hasta verificar localStorage / ?testStories=1 en cliente
  const [ocultoPorCaneca, setOcultoPorCaneca] = useState<boolean | null>(null);
  const [yaVisto, setYaVisto] = useState(false);
  const [abierto, setAbierto] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isMuted, setIsMuted] = useState(true);

  // Estados de arrastre libre y caneca (Drag-to-Trash)
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isOverTrash, setIsOverTrash] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const videoReadyForVolumeUnmuteRef = useRef<boolean>(false);
  const trashRef = useRef<HTMLDivElement | null>(null);
  const pointerDownTimeRef = useRef<number>(0);
  const viewerStartXRef = useRef<number>(0);
  const lastNavRef = useRef<number>(0);
  const elapsedMsRef = useRef<number>(0);
  const dragStateRef = useRef<{
    active: boolean;
    pointerId: number | null;
    startX: number;
    startY: number;
    initialLeft: number;
    initialTop: number;
    moved: boolean;
    overTrash: boolean;
    lastPos: { x: number; y: number } | null;
  }>({
    active: false,
    pointerId: null,
    startX: 0,
    startY: 0,
    initialLeft: 0,
    initialTop: 0,
    moved: false,
    overTrash: false,
    lastPos: null,
  });

  const storageKey = `padonde_story_seen_${versionId}`;
  const dismissedKey = `padonde_story_dismissed_${versionId}`;

  const currentSlide = slides[currentIndex] || "";
  const isCurrentVideo = abierto && esVideoSlide(currentSlide);

  // 1. Verificar en cliente si fue descartada en la caneca, si ya fue vista y si tiene coordenadas guardadas
  useEffect(() => {
    if (!activa || slides.length === 0) {
      setOcultoPorCaneca(true);
      return;
    }
    try {
      const params = new URLSearchParams(window.location.search);
      const isTestMode = params.get("testStories") === "1";

      if (isTestMode) {
        setOcultoPorCaneca(false);
        setYaVisto(false);
      } else {
        const dismissed = localStorage.getItem(dismissedKey);
        const seen = localStorage.getItem(storageKey);
        setOcultoPorCaneca(Boolean(dismissed));
        setYaVisto(Boolean(seen));
      }

      const rawPos = localStorage.getItem(POS_STORAGE_KEY);
      if (rawPos) {
        const parsed = JSON.parse(rawPos);
        if (
          parsed &&
          typeof parsed.x === "number" &&
          typeof parsed.y === "number" &&
          Number.isFinite(parsed.x) &&
          Number.isFinite(parsed.y)
        ) {
          setPos(clampPositionToViewport(parsed.x, parsed.y));
        }
      }
    } catch {
      setOcultoPorCaneca(false);
      setYaVisto(false);
    }

    const handleResize = () => {
      setPos((prev) =>
        prev ? clampPositionToViewport(prev.x, prev.y) : null
      );
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [activa, slides.length, storageKey, dismissedKey]);

  // 2. Precargar la siguiente lámina de imagen cuando el modal está abierto para transición sin parpadeo negro
  useEffect(() => {
    if (!abierto) return;
    const nextSlide = slides[currentIndex + 1];
    if (nextSlide && !esVideoSlide(nextSlide)) {
      const img = new Image();
      img.src = nextSlide;
    }
  }, [abierto, currentIndex, slides]);

  // 3. Al cerrar o terminar las láminas: registrar que ya las vio pero MANTENER la Brújula-Sol disponible en pantalla
  const finalizarYCerrar = useCallback(() => {
    if (videoRef.current) {
      try {
        videoRef.current.pause();
      } catch {
        // Ignorar
      }
    }
    try {
      localStorage.setItem(storageKey, "true");
    } catch {
      // Ignorar si modo incógnito restringe storage
    }
    setAbierto(false);
    setYaVisto(true);
  }, [storageKey]);

  const avanzarOSalir = useCallback(() => {
    const now = Date.now();
    if (now - lastNavRef.current < 250) return;
    lastNavRef.current = now;
    elapsedMsRef.current = 0;
    setProgress(0);

    if (currentIndex < slides.length - 1) {
      setCurrentIndex((idx) => Math.min(slides.length - 1, idx + 1));
    } else {
      finalizarYCerrar();
    }
  }, [currentIndex, slides.length, finalizarYCerrar]);

  const retrocederOReiniciar = useCallback(() => {
    const now = Date.now();
    if (now - lastNavRef.current < 250) return;
    lastNavRef.current = now;
    elapsedMsRef.current = 0;
    setProgress(0);

    if (currentIndex > 0) {
      setCurrentIndex((idx) => Math.max(0, idx - 1));
    } else {
      if (videoRef.current) {
        try {
          videoRef.current.currentTime = 0;
          videoRef.current.play().catch(() => {});
        } catch {
          // Ignorar
        }
      }
    }
  }, [currentIndex]);

  // 4. Iniciar reproducción inmediata al entrar a un slide de video y pausar al salir
  useEffect(() => {
    if (!isCurrentVideo) return;
    const videoEl = videoRef.current;
    if (!videoEl) return;

    videoReadyForVolumeUnmuteRef.current = false;
    videoEl.currentTime = 0;
    try {
      videoEl.volume = 0.8;
    } catch {
      // Ignorar en dispositivos que solo controlan volumen por hardware
    }

    const readyTimer = window.setTimeout(() => {
      videoReadyForVolumeUnmuteRef.current = true;
    }, 200);

    const playPromise = videoEl.play();
    if (playPromise !== undefined) {
      playPromise.catch(() => {
        // Fallback: forzar muted si el navegador bloqueó autoplay con audio
        videoReadyForVolumeUnmuteRef.current = false;
        videoEl.muted = true;
        setIsMuted(true);
        videoEl.play().catch(() => {});
        window.setTimeout(() => {
          videoReadyForVolumeUnmuteRef.current = true;
        }, 200);
      });
    }

    return () => {
      window.clearTimeout(readyTimer);
      videoReadyForVolumeUnmuteRef.current = false;
      try {
        videoEl.pause();
      } catch {
        // Ignorar
      }
    };
  }, [isCurrentVideo, currentSlide]);

  // 5. Pausar o reanudar <video> cuando el usuario mantiene presionada la pantalla
  useEffect(() => {
    if (!isCurrentVideo || !videoRef.current) return;
    if (isPaused) {
      videoRef.current.pause();
    } else {
      videoRef.current.play().catch(() => {});
    }
  }, [isPaused, isCurrentVideo]);

  // 6. Ritmo de exploración natural: las fotos permanecen estáticas para contemplarlas sin prisa; los videos avanzan en onEnded
  useEffect(() => {
    elapsedMsRef.current = 0;
    setProgress(0);
  }, [currentIndex, abierto]);

  // 7. Bloquear scroll del body y navegación con teclado cuando el visor está abierto
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
      } else if (e.key === "AudioVolumeUp" || e.key === "VolumeUp") {
        if (videoRef.current) {
          videoRef.current.muted = false;
          if (videoRef.current.volume === 0) {
            try {
              videoRef.current.volume = 0.8;
            } catch {
              // Ignorar
            }
          }
        }
        setIsMuted(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [abierto, finalizarYCerrar, avanzarOSalir, retrocederOReiniciar]);

  // Zero-Noise UX: nunca mostrar en rutas /admin, ni si está desactivada, sin láminas, o si el usuario la arrojó a la caneca
  if (isAdminRoute || !activa || slides.length === 0 || ocultoPorCaneca !== false) {
    return null;
  }

  function handleAbrirStories() {
    lastNavRef.current = 0;
    elapsedMsRef.current = 0;
    setCurrentIndex(0);
    setProgress(0);
    setIsPaused(false);
    setAbierto(true);
  }

  function handleMascotPointerDown(e: React.PointerEvent<HTMLButtonElement>) {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    dragStateRef.current = {
      active: true,
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      initialLeft: rect.left,
      initialTop: rect.top,
      moved: false,
      overTrash: false,
      lastPos: { x: rect.left, y: rect.top },
    };
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // Ignorar si el navegador no soporta pointer capture
    }
  }

  function handleMascotPointerMove(e: React.PointerEvent<HTMLButtonElement>) {
    const state = dragStateRef.current;
    if (!state.active || state.pointerId !== e.pointerId) return;

    const dx = e.clientX - state.startX;
    const dy = e.clientY - state.startY;
    const distFromStart = Math.hypot(dx, dy);

    if (!state.moved && distFromStart < DRAG_THRESHOLD_PX) {
      return;
    }

    if (!state.moved) {
      state.moved = true;
      setIsDragging(true);
    }

    const clamped = clampPositionToViewport(
      state.initialLeft + dx,
      state.initialTop + dy
    );
    state.lastPos = clamped;
    setPos(clamped);

    // Calcular distancia entre el centro de la Brújula-Sol y el centro de la caneca inferior
    const mascotCenterX = clamped.x + MASCOT_SIZE / 2;
    const mascotCenterY = clamped.y + MASCOT_SIZE / 2;

    let trashCenterX = window.innerWidth / 2;
    let trashCenterY = window.innerHeight - 24 - 28;
    if (trashRef.current) {
      const trashRect = trashRef.current.getBoundingClientRect();
      trashCenterX = trashRect.left + trashRect.width / 2;
      trashCenterY = trashRect.top + trashRect.height / 2;
    }

    const distToTrash = Math.hypot(
      mascotCenterX - trashCenterX,
      mascotCenterY - trashCenterY
    );
    const hitTrash = distToTrash < TRASH_HIT_RADIUS_PX;
    state.overTrash = hitTrash;
    setIsOverTrash(hitTrash);
  }

  function handleMascotPointerUp(e: React.PointerEvent<HTMLButtonElement>) {
    const state = dragStateRef.current;
    if (!state.active || state.pointerId !== e.pointerId) return;

    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // Ignorar
    }

    const { moved, overTrash, lastPos } = state;
    state.active = false;
    state.pointerId = null;
    setIsDragging(false);
    setIsOverTrash(false);

    if (!moved) {
      handleAbrirStories();
      return;
    }

    if (overTrash) {
      try {
        localStorage.setItem(dismissedKey, "true");
      } catch {
        // Ignorar
      }
      setOcultoPorCaneca(true);
      return;
    }

    if (lastPos) {
      try {
        localStorage.setItem(POS_STORAGE_KEY, JSON.stringify(lastPos));
      } catch {
        // Ignorar
      }
    }
  }

  function handleMascotPointerCancel(e: React.PointerEvent<HTMLButtonElement>) {
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // Ignorar
    }
    dragStateRef.current.active = false;
    dragStateRef.current.pointerId = null;
    setIsDragging(false);
    setIsOverTrash(false);
  }

  function handlePointerDown(e: React.PointerEvent<HTMLDivElement>) {
    pointerDownTimeRef.current = Date.now();
    viewerStartXRef.current = e.clientX;
    setIsPaused(true);
  }

  function handlePointerUp(
    e: React.PointerEvent<HTMLDivElement>,
    zone: "left" | "right"
  ) {
    const heldMs = Date.now() - pointerDownTimeRef.current;
    const dx = e.clientX - viewerStartXRef.current;
    setIsPaused(false);

    // Gesto de deslizamiento horizontal (swipe)
    if (Math.abs(dx) > 36) {
      if (dx < 0) {
        avanzarOSalir();
      } else {
        retrocederOReiniciar();
      }
      return;
    }

    if (heldMs > 350) return;

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
      {/* Mascota Flotante Compacta: Anillo Orbital + Sol + Brújula Girando (Arrastrable + Drag-to-Trash) */}
      <button
        type="button"
        onPointerDown={handleMascotPointerDown}
        onPointerMove={handleMascotPointerMove}
        onPointerUp={handleMascotPointerUp}
        onPointerCancel={handleMascotPointerCancel}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleAbrirStories();
          }
        }}
        aria-label="Ver historias destacadas de hoy en PaDónde (o arrastrar para mover/ocultar)"
        title="Toca para ver historias • Arrastra para mover o llevar a la papelera"
        className={[
          "fixed z-40 w-[54px] h-[54px] cursor-grab active:cursor-grabbing select-none touch-none border-0 p-0 focus:outline-none",
          pos ? "" : "bottom-20 right-4",
          isDragging
            ? isOverTrash
              ? "scale-75 opacity-80 transition-transform duration-150"
              : "scale-110 transition-none"
            : "hover:scale-105 active:scale-95 transition-transform",
        ].join(" ")}
        style={
          pos
            ? { background: "none", left: `${pos.x}px`, top: `${pos.y}px` }
            : { background: "none" }
        }
      >
        {/* Anillo orbital verde bosque con satélite girando en sentido contrario */}
        <span
          aria-hidden="true"
          className={[
            "absolute inset-0 rounded-full border animate-[spin_8s_linear_infinite_reverse] pointer-events-none",
            yaVisto ? "border-[#085127]/50" : "border-[#085127]/75",
          ].join(" ")}
        >
          <span className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-[#085127]" />
        </span>

        {/* Capa base (Sol 290x290 en su escala real dentro del núcleo) y Brújula (578x590) 100% abierta y transparente */}
        <div className="relative w-full h-full p-1.5 pointer-events-none">
          <img
            src="/animations/img_0.png"
            alt="PaDónde"
            className="absolute inset-0 m-auto w-[42%] h-[42%] object-contain"
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

      {/* Caneca dinámica Drag-to-Trash en la parte inferior central mientras se arrastra */}
      {isDragging && (
        <div
          ref={trashRef}
          aria-hidden="true"
          className={[
            "fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-14 h-14 rounded-full flex items-center justify-center pointer-events-none select-none transition-all duration-150 shadow-xl",
            isOverTrash
              ? "scale-125 bg-red-600/90 text-white border-2 border-red-300"
              : "scale-100 bg-black/75 backdrop-blur-md text-white border border-white/25",
          ].join(" ")}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-6 h-6"
          >
            <path d="M3 6h18" />
            <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
            <line x1="10" y1="11" x2="10" y2="17" />
            <line x1="14" y1="11" x2="14" y2="17" />
          </svg>
        </div>
      )}

      {/* Visor Modal con Dial Orbital de Brújula (sin barras tipo Instagram) */}
      {abierto && (
        <div
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex items-center justify-center select-none"
          role="dialog"
          aria-modal="true"
          aria-label="Historias de PaDónde"
        >
          <div className="relative w-full h-full max-w-[430px] max-h-[92vh] sm:rounded-3xl overflow-hidden bg-black shadow-2xl flex flex-col">
            {/* Controles superiores limpios en esquina derecha: audio (en video) y botón cerrar ✕ */}
            <div className="absolute top-4 right-3.5 z-30 flex items-center justify-end gap-2">
              {isCurrentVideo && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    const nextMuted = !isMuted;
                    videoReadyForVolumeUnmuteRef.current = false;
                    if (videoRef.current) {
                      videoRef.current.muted = nextMuted;
                      if (!nextMuted && videoRef.current.volume === 0) {
                        try {
                          videoRef.current.volume = 0.8;
                        } catch {
                          // Ignorar
                        }
                      }
                    }
                    setIsMuted(nextMuted);
                    window.setTimeout(() => {
                      videoReadyForVolumeUnmuteRef.current = true;
                    }, 200);
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

            {/* Lámina actual: <video> bajo demanda (0 KB en portada) o <img> */}
            <div className="relative flex-1 min-h-0 w-full h-full flex items-center justify-center bg-black">
              {isCurrentVideo ? (
                <video
                  key={currentSlide}
                  ref={videoRef}
                  src={currentSlide}
                  autoPlay
                  muted={isMuted}
                  playsInline
                  preload="auto"
                  onCanPlay={(e) => {
                    if (!isPaused) {
                      e.currentTarget.play().catch(() => {});
                    }
                  }}
                  onVolumeChange={(e) => {
                    const videoEl = e.currentTarget;
                    if (
                      videoReadyForVolumeUnmuteRef.current &&
                      videoEl.muted &&
                      videoEl.volume > 0
                    ) {
                      videoEl.muted = false;
                      setIsMuted(false);
                    } else if (!videoEl.muted && isMuted) {
                      setIsMuted(false);
                    }
                  }}
                  onTimeUpdate={handleVideoTimeUpdate}
                  onEnded={avanzarOSalir}
                  className="absolute inset-0 w-full h-full object-contain bg-black opacity-100 z-10 select-none pointer-events-none"
                />
              ) : (
                <img
                  key={currentSlide}
                  src={currentSlide}
                  alt={`Historia PaDónde ${currentIndex + 1} de ${slides.length}`}
                  className="absolute inset-0 w-full h-full object-contain bg-black opacity-100 z-10 select-none pointer-events-none"
                  draggable={false}
                />
              )}

              {/* Zonas táctiles izquierda (1/3 retroceder) y derecha (2/3 avanzar) + deslizar o mantener presionado */}
              <div className="absolute inset-0 z-20 flex bg-transparent">
                <div
                  className="w-1/3 h-full cursor-pointer"
                  onPointerDown={handlePointerDown}
                  onPointerUp={(e) => handlePointerUp(e, "left")}
                  onPointerCancel={() => setIsPaused(false)}
                />
                <div
                  className="w-2/3 h-full cursor-pointer"
                  onPointerDown={handlePointerDown}
                  onPointerUp={(e) => handlePointerUp(e, "right")}
                  onPointerCancel={() => setIsPaused(false)}
                />
              </div>

              {/* Dial Orbital de Brújula en SVG vectorial puro (52x52px) en la base del visor */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  avanzarOSalir();
                }}
                aria-label={`Rumbo ${currentIndex + 1} de ${slides.length}. Toca para avanzar`}
                title={`Lámina ${currentIndex + 1} de ${slides.length} • Toca para girar al siguiente rumbo`}
                className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 w-[52px] h-[52px] rounded-full bg-black/45 backdrop-blur-md border border-white/20 flex items-center justify-center cursor-pointer hover:scale-105 active:scale-95 transition-transform shadow-lg focus:outline-none"
              >
                <svg
                  viewBox="0 0 52 52"
                  className="w-full h-full overflow-visible"
                  aria-hidden="true"
                >
                  {/* Aro orbital fino */}
                  <circle
                    cx="26"
                    cy="26"
                    r="19"
                    fill="none"
                    stroke="rgba(255,255,255,0.22)"
                    strokeWidth="1"
                  />

                  {/* Letras cardinales sutiles N · E · S · W en el aro interior */}
                  <text
                    x="26"
                    y="12.5"
                    textAnchor="middle"
                    fill="rgba(212,175,55,0.75)"
                    fontSize="5.2"
                    fontWeight="700"
                  >
                    N
                  </text>
                  <text
                    x="39.5"
                    y="27.8"
                    textAnchor="middle"
                    fill="rgba(255,255,255,0.45)"
                    fontSize="4.8"
                    fontWeight="600"
                  >
                    E
                  </text>
                  <text
                    x="26"
                    y="42.5"
                    textAnchor="middle"
                    fill="rgba(255,255,255,0.45)"
                    fontSize="4.8"
                    fontWeight="600"
                  >
                    S
                  </text>
                  <text
                    x="12.5"
                    y="27.8"
                    textAnchor="middle"
                    fill="rgba(255,255,255,0.45)"
                    fontSize="4.8"
                    fontWeight="600"
                  >
                    W
                  </text>

                  {/* Nodos orbitales en el perímetro por cada lámina cargada */}
                  {slides.map((_, idx) => {
                    const angleDeg = (idx * 360) / Math.max(1, slides.length);
                    const angleRad = ((angleDeg - 90) * Math.PI) / 180;
                    const cx = 26 + 19 * Math.cos(angleRad);
                    const cy = 26 + 19 * Math.sin(angleRad);
                    const isActive = idx === currentIndex;
                    const isPast = idx < currentIndex;

                    return (
                      <g key={idx}>
                        {isActive && (
                          <circle
                            cx={cx}
                            cy={cy}
                            r="4.2"
                            fill="rgba(212,175,55,0.28)"
                          />
                        )}
                        <circle
                          cx={cx}
                          cy={cy}
                          r={isActive ? "2.4" : "1.6"}
                          fill={
                            isActive
                              ? "#D4AF37"
                              : isPast
                              ? "rgba(255,255,255,0.85)"
                              : "rgba(255,255,255,0.35)"
                          }
                        />
                      </g>
                    );
                  })}

                  {/* Aguja de brújula dorada con rotación suave hacia el ángulo de la lámina activa */}
                  <g
                    className="transition-transform duration-500 ease-out"
                    style={{
                      transform: `rotate(${
                        (currentIndex * 360) / Math.max(1, slides.length)
                      }deg)`,
                      transformOrigin: "26px 26px",
                    }}
                  >
                    {/* Punta norte dorada */}
                    <polygon
                      points="26,13 28.4,26 26,24.2 23.6,26"
                      fill="#D4AF37"
                    />
                    {/* Contrapeso sur translúcido */}
                    <polygon
                      points="26,37 28,26 26,27.5 24,26"
                      fill="rgba(255,255,255,0.35)"
                    />
                    {/* Eje central */}
                    <circle
                      cx="26"
                      cy="26"
                      r="2"
                      fill="#D4AF37"
                      stroke="rgba(0,0,0,0.65)"
                      strokeWidth="0.8"
                    />
                  </g>
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
