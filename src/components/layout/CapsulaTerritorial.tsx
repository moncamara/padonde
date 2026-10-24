"use client";

import { useState, useRef, useEffect } from "react";
import type { TerritorialUXConfig } from "@/constants";

interface CapsulaTerritorialProps {
  zonaSlug: string;
  configTerritorial?: Record<string, TerritorialUXConfig>;
}

export function CapsulaTerritorial({
  zonaSlug,
  configTerritorial,
}: CapsulaTerritorialProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);
  const [progress, setProgress] = useState(0);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const regionConfig = configTerritorial?.[zonaSlug];
  const capsula = regionConfig?.capsula;

  // Si no está activa o no tiene video configurado, no renderiza NADA (0 píxeles, cero impacto)
  if (!capsula || !capsula.activa || !capsula.video_url) {
    return null;
  }

  // Manejo de teclado (Escape para cerrar, Espacio para pausar/reanudar)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
      } else if (e.key === " ") {
        e.preventDefault();
        togglePlay();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  // Actualización de estado al abrir/cerrar
  useEffect(() => {
    if (isOpen && videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch(() => {});
      setIsPlaying(true);
    } else if (!isOpen && videoRef.current) {
      videoRef.current.pause();
    }
  }, [isOpen]);

  const handleTimeUpdate = () => {
    if (videoRef.current && videoRef.current.duration) {
      setProgress((videoRef.current.currentTime / videoRef.current.duration) * 100);
    }
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play();
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const toggleSound = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  return (
    <>
      {/* 1. DISPARADOR FLOTANTE MINIMALISTA: Botón sutil con destello activo 'Visítanos' */}
      <div className="fixed bottom-6 right-4 sm:right-6 z-40">
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full bg-forest text-cream border border-forest-light/40 shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer text-xs font-sans group backdrop-blur-md"
          title={capsula.etiqueta || "Conoce la vibra de este destino"}
          aria-label={capsula.etiqueta || "Ver video de la región"}
        >
          {/* Destello / Pulso verde activo */}
          <span className="relative flex h-2.5 w-2.5 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-80"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500 shadow-xs"></span>
          </span>

          {/* Texto dinámico (Visítanos) */}
          <span className="font-bold text-xs tracking-tight text-white">
            {capsula.etiqueta || "Visítanos"}
          </span>

          {/* Ícono Play sutil */}
          <span className="text-[10px] text-cream/80 group-hover:text-terra transition-colors font-mono">
            ▶
          </span>
        </button>
      </div>

      {/* 2. VISOR MODAL CINEMÁTICO CENTRADO (Nitidez HD óptima, sin estirar ni rotar) */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/85 backdrop-blur-md animate-fade-in select-none"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="relative w-full max-w-lg bg-forest-dark rounded-3xl overflow-hidden shadow-2xl border border-white/15 flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Barra superior de progreso (15s) */}
            <div className="absolute top-0 left-0 right-0 z-30 h-1 bg-white/20">
              <div
                className="h-full bg-terra transition-all duration-100 ease-linear"
                style={{ width: `${progress}%` }}
              />
            </div>

            {/* Cabecera del visor con etiqueta, sonido y cerrar */}
            <div className="absolute top-3 left-3 right-3 z-30 flex items-center justify-between pointer-events-none">
              <div className="flex items-center gap-2 bg-black/55 backdrop-blur-md px-3 py-1 rounded-full border border-white/20 pointer-events-auto">
                <span className="relative flex h-2 w-2">
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
                </span>
                <span className="text-[11px] font-sans font-bold text-white">
                  {capsula.etiqueta || "Visítanos"}
                </span>
              </div>

              <div className="flex items-center gap-1.5 pointer-events-auto">
                {/* Botón de Sonido */}
                <button
                  type="button"
                  onClick={toggleSound}
                  className="w-8 h-8 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center text-xs backdrop-blur-md transition-colors cursor-pointer border border-white/20"
                  title={isMuted ? "Activar sonido" : "Silenciar"}
                >
                  {isMuted ? "🔇" : "🔊"}
                </button>

                {/* Botón Cerrar */}
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="w-8 h-8 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center text-sm font-bold backdrop-blur-md transition-colors cursor-pointer border border-white/20"
                  title="Cerrar video"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Contenedor de Video (Aspecto 16:9 Natural y Centrado) */}
            <div
              className="relative aspect-video w-full bg-black flex items-center justify-center cursor-pointer overflow-hidden"
              onClick={togglePlay}
            >
              <video
                ref={videoRef}
                src={capsula.video_url}
                poster={capsula.poster_url}
                playsInline
                autoPlay
                muted={isMuted}
                loop
                onTimeUpdate={handleTimeUpdate}
                className="w-full h-full object-cover"
              />

              {/* Indicador de Pausa al tocar el video */}
              {!isPlaying && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/35 backdrop-blur-xs pointer-events-none">
                  <div className="w-14 h-14 rounded-full bg-forest/90 text-white flex items-center justify-center text-xl shadow-xl pl-1">
                    ▶
                  </div>
                </div>
              )}
            </div>

            {/* Pie con Copy Inspirador y Localización */}
            <div className="p-4 sm:p-5 bg-forest text-cream space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-sm">📍</span>
                <h3 className="font-serif text-base sm:text-lg font-bold text-white tracking-tight">
                  {capsula.titulo || "Mendihuaca • Sierra Nevada & Caribe"}
                </h3>
              </div>
              {capsula.descripcion && (
                <p className="font-sans text-xs text-cream/80 leading-relaxed">
                  {capsula.descripcion}
                </p>
              )}
              <div className="pt-1.5 text-[10px] text-cream/50 flex items-center gap-2">
                <span>💡 Toca el video para pausar o reanudar</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
