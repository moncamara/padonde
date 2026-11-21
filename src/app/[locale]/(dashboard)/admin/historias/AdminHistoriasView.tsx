"use client";

import { useState } from "react";
import {
  TouristStories,
  esVideoSlide,
  type StoriesConfig,
} from "@/components/events/TouristStories";
import { uploadEventImage, uploadEventVideo } from "@/lib/supabase/storage";
import { guardarStoriesBrujulaSolAction } from "../actions";

interface AdminHistoriasViewProps {
  initialConfig: StoriesConfig;
  locale: string;
}

const MAX_SLIDES = 6;
const MAX_VIDEO_BYTES = 4 * 1024 * 1024; // 4 MB

export function AdminHistoriasView({
  initialConfig,
  locale,
}: AdminHistoriasViewProps) {
  const [activa, setActiva] = useState<boolean>(initialConfig.activa);
  const [slides, setSlides] = useState<string[]>(
    (initialConfig.slides || []).filter((s) => !s.endsWith("/stories-demo/1.jpg"))
  );
  const [versionId, setVersionId] = useState<string>(initialConfig.versionId || "demo-v2");
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);
  const [mensaje, setMensaje] = useState<{
    tipo: "ok" | "err";
    texto: string;
  } | null>(null);
  const [previewNonce, setPreviewNonce] = useState<number>(0);

  async function handleSubirArchivos(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    e.target.value = "";
    if (files.length === 0) return;

    if (slides.length + files.length > MAX_SLIDES) {
      setMensaje({
        tipo: "err",
        texto: `Puedes publicar un máximo de ${MAX_SLIDES} láminas (fotos o videos) en total.`,
      });
      return;
    }

    // Candado estricto de peso en cliente (0 CPU en Vercel)
    for (const file of files) {
      const isVideo =
        file.type.startsWith("video/") || /\.(mp4|webm)$/i.test(file.name);
      if (isVideo && file.size > MAX_VIDEO_BYTES) {
        setMensaje({
          tipo: "err",
          texto:
            "El video pesa más de 4 MB. Comprímelo a 720p en CapCut o WhatsApp antes de subirlo para cuidar la velocidad móvil",
        });
        return;
      }
    }

    setIsUploading(true);
    setMensaje(null);
    try {
      const nuevasUrls: string[] = [];
      for (const file of files) {
        const isVideo =
          file.type.startsWith("video/") || /\.(mp4|webm)$/i.test(file.name);
        const url = isVideo
          ? await uploadEventVideo(file)
          : await uploadEventImage(file);
        if (url) {
          nuevasUrls.push(url);
        }
      }

      if (nuevasUrls.length > 0) {
        setSlides((prev) => [...prev, ...nuevasUrls].slice(0, MAX_SLIDES));
        setMensaje({
          tipo: "ok",
          texto: `✅ ${nuevasUrls.length} archivo(s) subidos directamente a Supabase Storage. Pulsa "Guardar y Publicar Nueva Versión" para activarlos.`,
        });
      } else {
        setMensaje({
          tipo: "err",
          texto: "No se pudo subir el archivo a Supabase Storage.",
        });
      }
    } catch (err: any) {
      setMensaje({
        tipo: "err",
        texto: err?.message || "Error al subir archivos a Supabase Storage.",
      });
    } finally {
      setIsUploading(false);
    }
  }

  function handleEliminarSlide(index: number) {
    setSlides((prev) => prev.filter((_, idx) => idx !== index));
  }

  function handleHacerPrimera(index: number) {
    if (index <= 0 || index >= slides.length) return;
    setSlides((prev) => {
      const copia = [...prev];
      const [seleccionada] = copia.splice(index, 1);
      copia.unshift(seleccionada);
      return copia;
    });
  }

  function handleDragStart(idx: number) {
    setDraggedIdx(idx);
  }

  function handleDragOver(e: React.DragEvent, idx: number) {
    e.preventDefault();
    if (draggedIdx === null || draggedIdx === idx) return;
    setDragOverIdx(idx);
  }

  function handleDrop(e: React.DragEvent, targetIdx: number) {
    e.preventDefault();
    setDragOverIdx(null);
    if (draggedIdx === null || draggedIdx === targetIdx) {
      setDraggedIdx(null);
      return;
    }
    setSlides((prev) => {
      const copia = [...prev];
      const [movida] = copia.splice(draggedIdx, 1);
      copia.splice(targetIdx, 0, movida);
      return copia;
    });
    setDraggedIdx(null);
  }

  async function handleGuardar() {
    setIsSaving(true);
    setMensaje(null);
    try {
      const res = await guardarStoriesBrujulaSolAction({
        activa,
        slides,
      });

      if (!res.success) {
        setMensaje({
          tipo: "err",
          texto: res.error || "No se pudo guardar la configuración.",
        });
        return;
      }

      if (res.versionId) {
        setVersionId(res.versionId);
        try {
          localStorage.removeItem(`padonde_story_seen_${res.versionId}`);
        } catch {
          // Ignorar
        }
      }

      setPreviewNonce((n) => n + 1);
      setMensaje({
        tipo: "ok",
        texto: `✅ Configuración guardada y publicada (version_id: ${res.versionId}). La Brújula-Sol volverá a activarse para los turistas.`,
      });
    } catch (err: any) {
      setMensaje({
        tipo: "err",
        texto: err?.message || "Error inesperado al guardar.",
      });
    } finally {
      setIsSaving(false);
    }
  }

  function handleResetearVistoLocal() {
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith("padonde_story_seen_")) {
          keysToRemove.push(k);
        }
      }
      keysToRemove.forEach((k) => localStorage.removeItem(k));
    } catch {
      // Ignorar
    }
    setPreviewNonce((n) => n + 1);
    setMensaje({
      tipo: "ok",
      texto:
        "🔄 Estado 'visto' reiniciado en este navegador. La Brújula-Sol ya aparece abajo a la derecha.",
    });
  }

  return (
    <div className="space-y-6 font-sans">
      {/* Cabecera */}
      <div className="bg-white rounded-3xl p-6 border border-stone-light/80 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-2xl">☀️</span>
            <h1 className="font-serif text-xl sm:text-2xl font-bold text-forest">
              Historias Efímeras · Brújula-Sol
            </h1>
            <span
              className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full border ${
                activa && slides.length > 0
                  ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                  : "bg-stone-100 text-stone-600 border-stone-200"
              }`}
            >
              {activa && slides.length > 0 ? "● ACTIVA EN PORTADA" : "○ APAGADA"}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-stone max-w-2xl">
            Publica hasta 6 láminas verticales (fotos `.webp` o videos cortos `.mp4` / `.webm` de hasta 4 MB). Al terminar de verlas o cerrar el visor, la mascota desaparece por completo hasta que publiques una nueva versión.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <button
            type="button"
            onClick={handleResetearVistoLocal}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-white hover:bg-stone-50 text-forest border border-stone-light transition-colors cursor-pointer"
            title="Volver a mostrar la Brújula-Sol en este navegador para pruebas"
          >
            🔄 Probar Brújula aquí
          </button>

          <a
            href={`/${locale}/minca?testStories=1`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-stone-100 hover:bg-stone-200 text-forest transition-colors"
          >
            🌿 Abrir Minca ↗
          </a>
        </div>
      </div>

      {/* Interruptor Maestro Encender / Apagar Brújula-Sol */}
      <div className="bg-white rounded-3xl p-6 border border-stone-light/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h2 className="font-serif text-base sm:text-lg font-bold text-forest flex items-center gap-2">
              <span>🧭</span>
              <span>Interruptor Maestro: Encender / Apagar Brújula-Sol</span>
            </h2>
            <p className="text-xs text-stone">
              Si está apagado o sin láminas, no se monta ningún elemento en las portadas públicas (Zero-Noise UX · 100% SSG).
            </p>
          </div>

          <button
            type="button"
            role="switch"
            aria-checked={activa}
            onClick={() => setActiva((prev) => !prev)}
            className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 shadow-2xs shrink-0 ${
              activa
                ? "bg-forest text-cream hover:bg-forest/90"
                : "bg-stone-200 text-stone-700 hover:bg-stone-300"
            }`}
          >
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                activa ? "bg-emerald-400 animate-pulse" : "bg-stone-500"
              }`}
            />
            <span>
              {activa ? "Brújula-Sol ENCENDIDA" : "Brújula-Sol APAGADA"}
            </span>
          </button>
        </div>

        <div className="pt-3 border-t border-stone-light/60 flex flex-wrap items-center justify-between gap-2 text-xs text-stone">
          <div>
            Versión activa:{" "}
            <code className="font-mono bg-stone-100 px-2 py-0.5 rounded text-forest font-semibold">
              {versionId}
            </code>
          </div>
          <div>
            Láminas cargadas: <strong className="text-forest">{slides.length} / {MAX_SLIDES}</strong>
          </div>
        </div>
      </div>

      {/* Gestor de Láminas Verticales (Fotos .webp + Videos .mp4 / .webm con candado 4 MB) */}
      <div className="bg-white rounded-3xl p-6 border border-stone-light/80 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-serif text-base sm:text-lg font-bold text-forest flex items-center gap-2">
              <span>🎬</span>
              <span>
                Láminas Verticales de la Historia ({slides.length}/{MAX_SLIDES})
              </span>
            </h3>
            <p className="text-xs text-stone mt-0.5">
              Arrastra para ordenar fotos (`.webp`) y videos cortos (`.mp4` / `.webm`, máx. 4 MB y 15s). Subida directa a Supabase Storage con 0 CPU en Vercel.
            </p>
          </div>

          {slides.length < MAX_SLIDES && (
            <label
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold bg-forest text-cream hover:bg-forest/90 transition-all shadow-2xs cursor-pointer shrink-0 ${
                isUploading ? "opacity-60 pointer-events-none" : ""
              }`}
            >
              <span>{isUploading ? "⏳ Subiendo..." : "➕ Subir Foto o Video (.mp4)"}</span>
              <input
                type="file"
                accept="image/*,video/mp4,video/webm,.mp4,.webm"
                multiple
                onChange={handleSubirArchivos}
                disabled={isUploading}
                className="hidden"
              />
            </label>
          )}
        </div>

        {/* Rejilla Drag & Drop de Láminas (Fotos y Videos con insignia 🎬 Video) */}
        {slides.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            {slides.map((url, idx) => {
              const isVideo = esVideoSlide(url);
              const isDragging = draggedIdx === idx;
              const isDragOver = dragOverIdx === idx;

              return (
                <div
                  key={`${url}-${idx}`}
                  draggable
                  onDragStart={() => handleDragStart(idx)}
                  onDragOver={(e) => handleDragOver(e, idx)}
                  onDrop={(e) => handleDrop(e, idx)}
                  onDragEnd={() => {
                    setDraggedIdx(null);
                    setDragOverIdx(null);
                  }}
                  className={`group relative aspect-[9/16] rounded-2xl overflow-hidden bg-stone-900 border-2 transition-all cursor-grab active:cursor-grabbing select-none ${
                    isDragOver
                      ? "border-terra scale-105 shadow-lg"
                      : idx === 0
                      ? "border-forest shadow-sm"
                      : "border-stone-light/80"
                  } ${isDragging ? "opacity-40" : "opacity-100"}`}
                >
                  {isVideo ? (
                    <video
                      src={url}
                      muted
                      playsInline
                      preload="metadata"
                      className="w-full h-full object-cover pointer-events-none"
                    />
                  ) : (
                    <img
                      src={url}
                      alt={`Lámina ${idx + 1}`}
                      className="w-full h-full object-cover pointer-events-none"
                      draggable={false}
                    />
                  )}

                  {/* Insignia superior izquierda: # orden + 🎬 Video o ⭐ #1 */}
                  <div className="absolute top-2 left-2 flex flex-col gap-1 pointer-events-none">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold shadow-xs ${
                        idx === 0
                          ? "bg-forest text-cream"
                          : "bg-black/65 text-white backdrop-blur-xs"
                      }`}
                    >
                      {idx === 0 ? "⭐ #1 Inicio" : `#${idx + 1}`}
                    </span>

                    {isVideo && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-terra text-white shadow-xs">
                        🎬 Video
                      </span>
                    )}
                  </div>

                  {/* Botón Eliminar */}
                  <button
                    type="button"
                    onClick={() => handleEliminarSlide(idx)}
                    title="Eliminar lámina"
                    className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/65 hover:bg-red-600 text-white text-xs font-bold flex items-center justify-center transition-colors cursor-pointer"
                  >
                    ✕
                  </button>

                  {/* Botón rápido Mover a #1 */}
                  {idx > 0 && (
                    <button
                      type="button"
                      onClick={() => handleHacerPrimera(idx)}
                      className="absolute bottom-2 inset-x-2 py-1 rounded-lg bg-black/70 hover:bg-forest text-white text-[10px] font-semibold opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                    >
                      Mover a #1
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-8 rounded-2xl border-2 border-dashed border-stone-light text-center text-xs text-stone">
            No hay láminas cargadas. Sube hasta 6 fotos (`.webp`) o videos cortos (`.mp4` máx. 4 MB).
          </div>
        )}

        {mensaje && (
          <div
            className={`p-3.5 rounded-2xl text-xs font-semibold border ${
              mensaje.tipo === "ok"
                ? "bg-emerald-50 text-emerald-900 border-emerald-300"
                : "bg-red-50 text-red-700 border-red-200"
            }`}
          >
            {mensaje.texto}
          </div>
        )}

        <div className="pt-2 border-t border-stone-light/60 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={handleGuardar}
            disabled={isSaving || isUploading}
            className="px-6 py-3 rounded-2xl bg-forest hover:bg-forest/90 text-cream text-xs sm:text-sm font-bold shadow-sm transition-all cursor-pointer active:scale-95 disabled:opacity-50"
          >
            {isSaving
              ? "⏳ Guardando y regenerando versión..."
              : "💾 Guardar y Publicar Nueva Versión"}
          </button>
        </div>
      </div>
    </div>
  );
}
