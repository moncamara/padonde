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

  // Manejo de teclado (Escape para cerrar)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  // Actualización de barra de progreso y estado al abrir
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
      {/* 1. DISPARADOR ELEGANTE Y SUTIL (No invasivo, apenas 32px de alto) */}
      <div className="flex items-center justify-center -mb-1">
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/85 hover:bg-white text-forest border border-stone-light/90 hover:border-forest/40 shadow-2xs hover:shadow-xs transition-all active:scale-95 cursor-pointer text-xs font-sans group"
          title="Ver cómo late este destino hoy"
        >
          {/* Punto de pulso activo (indica tiempo real / frescura) */}
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>

          <span className="font-semibold text-[11px] sm:text-xs text-forest tracking-tight">
            {capsula.etiqueta || "Vibra en vivo"}
          </span>

          <span className="text-[10px] font-sans bg-forest/10 group-hover:bg-forest group-hover:text-cream text-forest px-1.5 py-0.5 rounded-md font-medium transition-colors">
            ▶ {capsula.duracion_segundos || 15}s
          </span>
        </button>
      </div>

      {/* 2. MODAL INMERSIVO CINEMÁTICO (Solo se abre bajo demanda) */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-fade-in"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="relative w-full max-w-lg bg-stone-dark rounded-3xl overflow-hidden shadow-2xl border border-white/10 flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Barra superior de progreso de la historia */}
            <div className="absolute top-0 left-0 right-0 z-30 h-1 bg-white/20">
              <div
                className="h-full bg-terra transition-all duration-100 ease-linear"
                style={{ width: `${progress}%` }}
              />
            </div>

            {/* Cabecera del visor con botón de cierre y sonido */}
            <div className="absolute top-3 left-3 right-3 z-30 flex items-center justify-between pointer-events-none">
              <div className="flex items-center gap-2 bg-black/50 backdrop-blur-md px-3 py-1 rounded-full border border-white/15 pointer-events-auto">
                <span className="relative flex h-2 w-2">
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
                </span>
                <span className="text-[11px] font-sans font-medium text-cream">
                  {capsula.etiqueta || "En vivo"}
                </span>
              </div>

              <div className="flex items-center gap-1.5 pointer-events-auto">
                {/* Botón de Sonido */}
                <button
                  type="button"
                  onClick={toggleSound}
                  className="w-8 h-8 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center text-xs backdrop-blur-md transition-colors cursor-pointer border border-white/15"
                  title={isMuted ? "Activar sonido" : "Silenciar"}
                >
                  {isMuted ? "🔇" : "🔊"}
                </button>

                {/* Botón Cerrar */}
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="w-8 h-8 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center text-sm font-bold backdrop-blur-md transition-colors cursor-pointer border border-white/15"
                  title="Cerrar video"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Reproductor de Video */}
            <div
              className="relative aspect-video bg-black flex items-center justify-center cursor-pointer select-none"
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

              {/* Indicador de Pausa si el usuario hace clic */}
              {!isPlaying && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-xs pointer-events-none">
                  <div className="w-14 h-14 rounded-full bg-forest/80 text-white flex items-center justify-center text-xl shadow-lg pl-1">
                    ▶
                  </div>
                </div>
              )}
            </div>

            {/* Pie con Copy Inspirador y Localización */}
            <div className="p-4 sm:p-5 bg-forest text-cream space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="text-sm">📍</span>
                <h3 className="font-serif text-base sm:text-lg font-bold text-white tracking-tight">
                  {capsula.titulo || "Paraíso en la Sierra"}
                </h3>
              </div>
              {capsula.descripcion && (
                <p className="font-sans text-xs text-cream/80 leading-relaxed">
                  {capsula.descripcion}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
