"use client";

import { useState, useRef, useEffect } from "react";

interface EventVideoPlayerProps {
  videoUrl: string;
  posterUrl?: string | null;
  title: string;
}

export function EventVideoPlayer({
  videoUrl,
  posterUrl,
  title,
}: EventVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [hasStarted, setHasStarted] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsOnline(navigator.onLine);
      const handleOnline = () => setIsOnline(true);
      const handleOffline = () => setIsOnline(false);
      window.addEventListener("online", handleOnline);
      window.addEventListener("offline", handleOffline);
      return () => {
        window.removeEventListener("online", handleOnline);
        window.removeEventListener("offline", handleOffline);
      };
    }
  }, []);

  const togglePlay = () => {
    if (!videoRef.current) return;

    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current
        .play()
        .then(() => {
          setIsPlaying(true);
          setHasStarted(true);
        })
        .catch((err) => {
          console.warn("Error reproduciendo video:", err);
        });
    }
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const current = videoRef.current.currentTime;
    const duration = videoRef.current.duration || 1;
    setProgress((current / duration) * 100);
  };

  const handleVideoEnded = () => {
    setIsPlaying(false);
    setProgress(100);
  };

  const handleFullscreen = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!videoRef.current) return;
    if (videoRef.current.requestFullscreen) {
      videoRef.current.requestFullscreen();
    } else if ((videoRef.current as any).webkitEnterFullscreen) {
      // iOS Safari native fullscreen
      (videoRef.current as any).webkitEnterFullscreen();
    }
  };

  return (
    <div className="my-8">
      {/* Header de sección */}
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-terra animate-pulse" />
          <h3 className="font-serif text-lg font-bold text-forest flex items-center gap-1.5">
            <span>🎬</span> Revive la Experiencia
          </h3>
        </div>
        <span className="text-[11px] font-sans font-medium px-2.5 py-1 rounded-full bg-terra/10 text-terra border border-terra/20">
          Reel de Minca
        </span>
      </div>

      {/* Contenedor del reproductor estilo Reel vertical */}
      <div
        onClick={togglePlay}
        className="relative w-full max-w-sm mx-auto aspect-[9/16] rounded-3xl overflow-hidden bg-black shadow-2xl border border-stone-200/40 cursor-pointer group select-none"
      >
        <video
          ref={videoRef}
          src={videoUrl}
          poster={posterUrl || undefined}
          preload="none"
          playsInline
          muted={isMuted}
          onTimeUpdate={handleTimeUpdate}
          onEnded={handleVideoEnded}
          className="w-full h-full object-cover"
        />

        {/* Overlay con degradado para lectura de controles */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-black/40 pointer-events-none" />

        {/* Barra superior de controles */}
        <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-auto">
          <div className="flex items-center gap-2 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/15">
            <span className="text-xs">🌿</span>
            <span className="text-[11px] font-sans font-medium text-white/90 truncate max-w-[150px]">
              {title}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Botón Mute / Unmute */}
            <button
              type="button"
              onClick={toggleMute}
              title={isMuted ? "Activar sonido" : "Silenciar"}
              className="w-9 h-9 rounded-full bg-black/50 backdrop-blur-md border border-white/20 text-white flex items-center justify-center hover:bg-black/70 active:scale-95 transition-transform"
            >
              {isMuted ? (
                <svg
                  className="w-4 h-4 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2"
                  />
                </svg>
              ) : (
                <svg
                  className="w-4 h-4 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
                  />
                </svg>
              )}
            </button>

            {/* Botón Pantalla Completa */}
            <button
              type="button"
              onClick={handleFullscreen}
              title="Pantalla completa"
              className="w-9 h-9 rounded-full bg-black/50 backdrop-blur-md border border-white/20 text-white flex items-center justify-center hover:bg-black/70 active:scale-95 transition-transform"
            >
              <svg
                className="w-4 h-4 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Botón Central de Play/Pause */}
        {(!isPlaying || !hasStarted) && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-16 h-16 rounded-full bg-white/25 backdrop-blur-md border border-white/40 flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform">
              <div className="w-12 h-12 rounded-full bg-terra text-white flex items-center justify-center pl-1 shadow-lg">
                <svg
                  className="w-6 h-6 fill-current"
                  viewBox="0 0 24 24"
                >
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
            </div>
          </div>
        )}

        {/* Aviso offline si no hay señal */}
        {!isOnline && (
          <div className="absolute bottom-6 left-4 right-4 bg-black/80 backdrop-blur-md p-3 rounded-2xl border border-amber-500/30 text-amber-200 text-xs flex items-center gap-2 pointer-events-none">
            <span>⚠️</span>
            <span>Video en pausa: requiere señal celular o Wi-Fi para reproducirse.</span>
          </div>
        )}

        {/* Barra de progreso inferior */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
          <div
            className="h-full bg-terra transition-all duration-150"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}
