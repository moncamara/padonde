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
  const [isRotated, setIsRotated] = useState(false);
  const [progress, setProgress] = useState(0);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const playerContainerRef = useRef<HTMLDivElement | null>(null);

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
        setIsRotated(false);
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
      setIsRotated(false);
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

  const toggleRotate = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsRotated((prev) => !prev);
  };

  const toggleNativeFullscreen = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      if (!document.fullscreenElement) {
        if (playerContainerRef.current?.requestFullscreen) {
          await playerContainerRef.current.requestFullscreen();
        } else if ((playerContainerRef.current as any)?.webkitRequestFullscreen) {
          await (playerContainerRef.current as any).webkitRequestFullscreen();
        }
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        }
      }
    } catch {
      // Si la API nativa de fullscreen está restringida, activamos la rotación visual 90°
      setIsRotated((prev) => !prev);
    }
  };

  return (
    <>
      {/* 1. DISPARADOR: CIRCULITO FLOTANTE ESTILO STORY / REEL (Cero invasivo, en la esquina inferior) */}
      <div className="fixed bottom-6 right-4 sm:right-6 z-40 flex flex-col items-center">
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="relative w-15 h-15 sm:w-16 sm:h-16 rounded-full p-0.5 bg-gradient-to-tr from-terra via-amber-500 to-forest shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all duration-300 cursor-pointer flex items-center justify-center group"
          title={capsula.etiqueta || "Ver video de la región"}
          aria-label={capsula.etiqueta || "Ver cómo late este destino hoy"}
        >
          {/* Anillo de pulso animado */}
          <span className="absolute -inset-1 rounded-full bg-terra/25 animate-ping opacity-75 pointer-events-none"></span>

          {/* Miniatura circular */}
          <div className="w-full h-full rounded-full overflow-hidden border-2 border-white relative bg-forest">
            {capsula.poster_url ? (
              <img
                src={capsula.poster_url}
                alt={capsula.titulo || "Vibra del destino"}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white text-lg">
                🌊
              </div>
            )}

            {/* Ícono Play central */}
            <div className="absolute inset-0 bg-black/25 flex items-center justify-center">
              <span className="w-5 h-5 rounded-full bg-white/95 text-forest text-[10px] flex items-center justify-center pl-0.5 shadow-xs font-bold">
                ▶
              </span>
            </div>
          </div>

          {/* Badge inferior "En vivo" */}
          <div className="absolute -bottom-1.5 bg-forest text-cream text-[9px] font-sans font-bold px-2 py-0.5 rounded-full border border-white/80 shadow-xs flex items-center gap-1 shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>En vivo</span>
          </div>
        </button>
      </div>

      {/* 2. VISOR MODAL EN PANTALLA COMPLETA CON ROTACIÓN (Poder Voltear) */}
      {isOpen && (
        <div
          ref={playerContainerRef}
          className="fixed inset-0 z-50 bg-black flex flex-col justify-between overflow-hidden animate-fade-in select-none"
          onClick={() => {
            if (isRotated) setIsRotated(false);
            else setIsOpen(false);
          }}
        >
          {/* Barra superior de progreso de la historia (15s) */}
          <div className="absolute top-0 left-0 right-0 z-40 h-1 bg-white/20">
            <div
              className="h-full bg-terra transition-all duration-100 ease-linear"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Cabecera de controles superiores */}
          <div
            className="relative z-40 p-3 sm:p-4 flex items-center justify-between bg-gradient-to-b from-black/80 via-black/40 to-transparent"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Título y badge */}
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <span className="text-xs sm:text-sm font-sans font-bold text-white drop-shadow-sm truncate max-w-[190px] sm:max-w-none">
                {capsula.etiqueta || "Vibra en vivo"}
              </span>
            </div>

            {/* Acciones: Voltear, Sonido, Cerrar */}
            <div className="flex items-center gap-2">
              {/* Botón Voltear / Girar 90° (Permite ver horizontal a pantalla completa sin quitar el bloqueo de rotación) */}
              <button
                type="button"
                onClick={toggleRotate}
                className={`px-2.5 py-1.5 rounded-full text-xs font-sans font-semibold flex items-center gap-1.5 border transition-all cursor-pointer backdrop-blur-md ${
                  isRotated
                    ? "bg-terra text-white border-terra shadow-md"
                    : "bg-white/15 hover:bg-white/30 text-white border-white/20"
                }`}
                title="Girar video a pantalla completa panorámica"
              >
                <span>🔄</span>
                <span className="text-[11px] hidden sm:inline">
                  {isRotated ? "Enderezar" : "Voltear"}
                </span>
              </button>

              {/* Botón Sonido */}
              <button
                type="button"
                onClick={toggleSound}
                className="w-8 h-8 rounded-full bg-white/15 hover:bg-white/30 text-white flex items-center justify-center text-xs backdrop-blur-md transition-colors cursor-pointer border border-white/20"
                title={isMuted ? "Activar sonido" : "Silenciar"}
              >
                {isMuted ? "🔇" : "🔊"}
              </button>

              {/* Botón Cerrar */}
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  setIsRotated(false);
                }}
                className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/40 text-white flex items-center justify-center text-sm font-bold backdrop-blur-md transition-colors cursor-pointer border border-white/25"
                title="Cerrar visor"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Área Central de Video (Con soporte de rotación 90° suave) */}
          <div
            className="flex-1 flex items-center justify-center relative overflow-hidden cursor-pointer"
            onClick={togglePlay}
          >
            <div
              className={`transition-all duration-300 ease-out flex items-center justify-center ${
                isRotated
                  ? "w-screen h-screen flex items-center justify-center"
                  : "w-full max-w-4xl max-h-[80vh] px-2 sm:px-4"
              }`}
              style={
                isRotated
                  ? {
                      transform: "rotate(90deg)",
                      width: "100vh",
                      height: "100vw",
                      maxWidth: "100vh",
                      maxHeight: "100vw",
                    }
                  : undefined
              }
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
                className={`rounded-2xl shadow-2xl object-cover bg-black ${
                  isRotated ? "w-full h-full rounded-none" : "w-full max-h-[72vh] aspect-video"
                }`}
              />

              {/* Indicador de Pausa grande al pulsar */}
              {!isPlaying && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/35 backdrop-blur-xs pointer-events-none">
                  <div className="w-16 h-16 rounded-full bg-forest/90 text-white flex items-center justify-center text-2xl shadow-xl pl-1">
                    ▶
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Pie con Copy Inspirador y Guía (Oculto sutilmente cuando está volteado para dar 100% protagonismo al cine) */}
          {!isRotated && (
            <div
              className="relative z-40 p-4 sm:p-6 bg-gradient-to-t from-black/95 via-black/70 to-transparent space-y-1 text-center sm:text-left max-w-2xl mx-auto w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-center sm:justify-start gap-1.5 text-cream font-serif font-bold text-sm sm:text-base">
                <span>📍</span>
                <h3>{capsula.titulo || "Paraíso en la Sierra"}</h3>
              </div>
              {capsula.descripcion && (
                <p className="text-xs font-sans text-cream/80 leading-relaxed max-w-xl mx-auto sm:mx-0">
                  {capsula.descripcion}
                </p>
              )}
              <div className="pt-1 text-[10px] font-sans text-stone-light/60 flex items-center justify-center sm:justify-start gap-3">
                <span>💡 Toca para pausar</span>
                <span>•</span>
                <span>Pulsa 🔄 Voltear para ver en pantalla completa</span>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}
