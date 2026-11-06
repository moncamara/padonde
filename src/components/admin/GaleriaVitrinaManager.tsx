"use client";

import { useState } from "react";
import Image from "next/image";
import { uploadEventImage, uploadEventVideo } from "@/lib/supabase/storage";

export interface GaleriaVitrinaManagerProps {
  fotos: string[];
  onChangeFotos: (fotos: string[]) => void;
  posicionPortada?: string;
  onChangePosicionPortada?: (posicion: string) => void;
  videoUrl?: string | null;
  onChangeVideoUrl?: (videoUrl: string) => void;
  maxFotos?: number;
  titulo?: string;
  subtitulo?: string;
}

/**
 * Componente canónico de Gestión de Multimedia (Fotografía y Galería de Vitrina)
 * Homologado para Eventos, Hospedajes y Servicios Esenciales.
 * Ofrece:
 * 1. Rejilla de fotos con contador dinámico y subida optimizada WebP.
 * 2. Drag and drop nativo para reordenar miniaturas (#1, #2...).
 * 3. Asignación automática de ⭐ Portada a la posición #1.
 * 4. Control de encuadre vertical (Focal Point) con previsualización en tiempo real.
 * 5. Soporte complementario de Video / Reel vertical (MP4 o URL directa).
 */
export function GaleriaVitrinaManager({
  fotos = [],
  onChangeFotos,
  posicionPortada = "50%",
  onChangePosicionPortada,
  videoUrl = "",
  onChangeVideoUrl,
  maxFotos = 6,
  titulo = "4. Fotografía y Galería de Vitrina",
  subtitulo = "Arrastra las fotos para definir el orden. La primera foto define automáticamente la Portada destacada.",
}: GaleriaVitrinaManagerProps) {
  const [subiendoFoto, setSubiendoFoto] = useState(false);
  const [subiendoVideo, setSubiendoVideo] = useState(false);
  const [mostrarUrlDirecta, setMostrarUrlDirecta] = useState(false);
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);

  // Subida múltiple con compresión WebP
  async function handleSubirFotos(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    if (fotos.length + files.length > maxFotos) {
      alert(
        `Puedes tener un máximo de ${maxFotos} fotos en total para garantizar velocidad máxima de carga.`
      );
      return;
    }

    setSubiendoFoto(true);
    try {
      const nuevasUrls: string[] = [];
      for (const file of files) {
        const url = await uploadEventImage(file);
        if (url) {
          nuevasUrls.push(url);
        }
      }

      if (nuevasUrls.length > 0) {
        // Evitar duplicados exactos
        const combinadas = [...fotos];
        nuevasUrls.forEach((u) => {
          if (!combinadas.includes(u)) combinadas.push(u);
        });
        onChangeFotos(combinadas);
      }
    } catch (err: any) {
      alert("Error al subir fotografía: " + (err?.message || "intenta de nuevo"));
    } finally {
      setSubiendoFoto(false);
      e.target.value = "";
    }
  }

  // Reordenamiento drag and drop nativo
  const handleReordenarFotos = (fromIdx: number, toIdx: number) => {
    if (fromIdx === toIdx) return;
    const lista = [...fotos];
    if (fromIdx < 0 || fromIdx >= lista.length || toIdx < 0 || toIdx >= lista.length) return;
    const [fotoMovida] = lista.splice(fromIdx, 1);
    lista.splice(toIdx, 0, fotoMovida);
    onChangeFotos(lista);
  };

  const handleHacerPortada = (idx: number) => {
    handleReordenarFotos(idx, 0);
  };

  const handleEliminarFoto = (idx: number) => {
    const lista = [...fotos];
    lista.splice(idx, 1);
    onChangeFotos(lista);
  };

  // Subida de video / reel
  async function handleSubirVideo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setSubiendoVideo(true);
    try {
      const url = await uploadEventVideo(file);
      if (url && onChangeVideoUrl) {
        onChangeVideoUrl(url);
      }
    } catch (err: any) {
      alert("Error al subir video: " + (err?.message || "intenta de nuevo"));
    } finally {
      setSubiendoVideo(false);
      e.target.value = "";
    }
  }

  const cleanPosicion = posicionPortada || "50%";

  return (
    <div className="bg-white/80 p-4 sm:p-5 rounded-3xl border border-stone-light/70 shadow-2xs space-y-4">
      {/* Encabezado del Módulo */}
      <div className="flex items-center justify-between border-b border-stone-light/40 pb-2.5">
        <div>
          <h3 className="font-serif text-sm font-bold text-forest uppercase tracking-wider flex items-center gap-1.5">
            <span>📷</span> {titulo}
          </h3>
          {subtitulo && (
            <p className="text-[11px] text-stone mt-0.5">
              {subtitulo}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {subiendoFoto && (
            <span className="text-[11px] text-terra font-semibold animate-pulse">
              Subiendo fotos...
            </span>
          )}
          <span className="text-[10px] text-stone font-mono bg-cream px-2 py-0.5 rounded-full border border-stone-light/60">
            {fotos.length} / {maxFotos} fotos
          </span>
        </div>
      </div>

      <div className="space-y-3 font-sans">
        {fotos.length > 1 && (
          <p className="text-[11px] text-stone font-medium flex items-center gap-1 select-none">
            <span>🖐️</span> Arrastra las fotos para reordenarlas. La primera foto queda como{" "}
            <span className="font-semibold text-forest">⭐ Portada</span>.
          </p>
        )}

        {/* Rejilla de Miniaturas con Drag & Drop */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          {fotos.map((fotoUrl, idx) => {
            const isDragging = draggedIdx === idx;
            const isDragOver = dragOverIdx === idx && draggedIdx !== idx;

            return (
              <div
                key={`${fotoUrl}-${idx}`}
                draggable
                onDragStart={(e) => {
                  setDraggedIdx(idx);
                  e.dataTransfer.effectAllowed = "move";
                  e.dataTransfer.setData("text/plain", idx.toString());
                }}
                onDragEnd={() => {
                  setDraggedIdx(null);
                  setDragOverIdx(null);
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.dataTransfer.dropEffect = "move";
                  if (dragOverIdx !== idx) {
                    setDragOverIdx(idx);
                  }
                }}
                onDragLeave={() => {
                  if (dragOverIdx === idx) {
                    setDragOverIdx(null);
                  }
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  if (draggedIdx !== null && draggedIdx !== idx) {
                    handleReordenarFotos(draggedIdx, idx);
                  }
                  setDraggedIdx(null);
                  setDragOverIdx(null);
                }}
                className={`relative aspect-square rounded-2xl overflow-hidden shadow-2xs group cursor-grab active:cursor-grabbing transition-all select-none ${
                  isDragging
                    ? "opacity-30 scale-95 border-2 border-dashed border-forest ring-2 ring-forest/30"
                    : isDragOver
                    ? "border-2 border-dashed border-forest ring-2 ring-forest/50 scale-105"
                    : "border border-stone-light/80 hover:border-forest/50"
                }`}
                title="Arrastra para reordenar (la primera queda como Portada)"
              >
                <Image
                  src={fotoUrl}
                  alt={idx === 0 ? "Foto de portada" : `Foto vitrina ${idx + 1}`}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform pointer-events-none"
                  style={idx === 0 ? { objectPosition: `center ${cleanPosicion}` } : undefined}
                />

                {/* Insignia de Portada o Botón para Hacer Portada */}
                {idx === 0 ? (
                  <span className="absolute bottom-1.5 left-1.5 bg-forest text-cream text-[9px] font-sans font-bold px-1.5 py-0.5 rounded shadow-xs pointer-events-none flex items-center gap-1">
                    ⭐ Portada
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleHacerPortada(idx)}
                    title="Establecer como foto principal de portada"
                    className="absolute bottom-1.5 left-1.5 bg-black/70 hover:bg-forest text-cream text-[9px] font-sans font-medium px-1.5 py-0.5 rounded shadow-xs transition-colors opacity-90 sm:opacity-0 sm:group-hover:opacity-100 cursor-pointer"
                  >
                    ⭐ Portada
                  </button>
                )}

                {/* Número de posición */}
                <span className="absolute top-1.5 left-1.5 bg-black/60 text-white font-mono text-[9px] px-1 rounded pointer-events-none">
                  #{idx + 1}
                </span>

                {/* Botón Eliminar Foto */}
                <button
                  type="button"
                  onClick={() => handleEliminarFoto(idx)}
                  className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/70 hover:bg-red-600 text-white text-[10px] flex items-center justify-center transition-colors cursor-pointer shadow"
                  title="Eliminar esta foto"
                >
                  ✕
                </button>
              </div>
            );
          })}

          {/* Botón dashed para subir fotos */}
          {fotos.length < maxFotos && (
            <label className="aspect-square rounded-2xl border-2 border-dashed border-stone-light/80 hover:border-forest/60 bg-stone-light/10 hover:bg-stone-light/20 flex flex-col items-center justify-center text-center p-2 cursor-pointer transition-colors group">
              <span className="text-xl group-hover:scale-110 transition-transform">📸</span>
              <span className="text-[10px] font-bold text-forest mt-1">
                {fotos.length === 0 ? "Subir Foto" : "+ Otra Foto"}
              </span>
              <span className="text-[9px] text-stone mt-0.5">
                ({maxFotos - fotos.length} disponibles)
              </span>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/avif"
                multiple
                disabled={subiendoFoto}
                onChange={handleSubirFotos}
                className="hidden"
              />
            </label>
          )}
        </div>

        <p className="text-[11px] text-stone leading-relaxed">
          Formato WebP, JPG o PNG. Las imágenes se comprimen automáticamente para una carga ultra rápida en teléfonos móviles de turistas.
        </p>

        {/* 2. Control de Encuadre Vertical Dinámico (Focal Point) de Portada */}
        {fotos.length > 0 && onChangePosicionPortada && (
          <div className="p-3.5 sm:p-4 rounded-2xl bg-forest/5 border border-forest/15 space-y-3 mt-2">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <label className="text-xs font-semibold text-forest flex items-center gap-1.5">
                  <span>🎯</span> Encuadre Vertical de Portada (Focal Point)
                </label>
                <p className="text-[11px] text-stone">
                  Ajusta el foco de corte de la foto en las tarjetas horizontales de la cartelera pública.
                </p>
              </div>
              <span className="text-[11px] font-mono font-bold text-forest bg-white px-2.5 py-0.5 rounded-full border border-forest/20 shadow-2xs">
                {cleanPosicion}
              </span>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4">
              {/* Mini Previsualización Horizontal en Tiempo Real */}
              <div className="relative w-full sm:w-56 aspect-[16/10] rounded-xl overflow-hidden border-2 border-forest/30 shadow-xs bg-stone-100 shrink-0 group">
                <Image
                  src={fotos[0]}
                  alt="Previsualización recorte tarjeta"
                  fill
                  className="object-cover transition-all duration-200"
                  style={{ objectPosition: `center ${cleanPosicion}` }}
                />
                <div className="absolute top-1.5 left-1.5 bg-black/60 backdrop-blur-xs text-white text-[9px] font-semibold px-2 py-0.5 rounded-full pointer-events-none">
                  Vista Tarjeta
                </div>
                <div className="absolute bottom-1.5 right-1.5 bg-forest/90 text-cream text-[9px] font-mono px-1.5 py-0.5 rounded pointer-events-none">
                  {cleanPosicion}
                </div>
              </div>

              {/* Controles: Slider + Botones Rápidos */}
              <div className="w-full flex-1 space-y-2.5">
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] text-stone font-medium">
                    <span>⬆️ Arriba (0%)</span>
                    <span>⏺️ Centro (50%)</span>
                    <span>⬇️ Abajo (100%)</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={parseInt(cleanPosicion.replace("%", ""), 10) || 50}
                    onChange={(e) => onChangePosicionPortada(`${e.target.value}%`)}
                    className="w-full accent-forest cursor-pointer h-2 bg-stone-200 rounded-lg"
                  />
                </div>

                {/* Botones de Selección Rápida */}
                <div className="flex items-center gap-2">
                  {[
                    { label: "⬆️ Arriba", value: "20%" },
                    { label: "⏺️ Centro", value: "50%" },
                    { label: "⬇️ Abajo", value: "80%" },
                  ].map((btn) => {
                    const isSelected = cleanPosicion === btn.value;
                    return (
                      <button
                        key={btn.value}
                        type="button"
                        onClick={() => onChangePosicionPortada(btn.value)}
                        className={`flex-1 py-1 px-2 rounded-xl text-[11px] font-medium transition-all cursor-pointer text-center ${
                          isSelected
                            ? "bg-forest text-cream shadow-2xs font-bold"
                            : "bg-white text-forest border border-forest/20 hover:bg-forest/10"
                        }`}
                      >
                        {btn.label} ({btn.value})
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 3. Video / Reel Vertical (Opcional) */}
      {onChangeVideoUrl && (
        <div className="pt-3 border-t border-stone-light/40 space-y-2 font-sans">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-forest flex items-center gap-1.5">
              <span>🎬</span> Video Reel Vertical <span className="text-stone font-normal">(opcional)</span>
            </label>
            <button
              type="button"
              onClick={() => setMostrarUrlDirecta(!mostrarUrlDirecta)}
              className="text-[10px] text-forest underline cursor-pointer"
            >
              {mostrarUrlDirecta ? "Subir archivo MP4" : "Ingresar URL directa"}
            </button>
          </div>

          {mostrarUrlDirecta ? (
            <input
              type="url"
              value={videoUrl || ""}
              onChange={(e) => onChangeVideoUrl(e.target.value)}
              placeholder="https://... o enlace de Supabase Storage"
              className="w-full p-2.5 text-xs bg-white rounded-xl border border-stone-light/80 text-forest outline-none focus:ring-1 focus:ring-forest"
            />
          ) : (
            <div className="flex items-center gap-3">
              <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-forest text-cream rounded-xl text-xs font-medium cursor-pointer hover:bg-forest-light transition-colors">
                <span>📁</span>
                <span>{subiendoVideo ? "Subiendo video..." : "Seleccionar video MP4"}</span>
                <input
                  type="file"
                  accept="video/mp4,video/quicktime,video/webm"
                  disabled={subiendoVideo}
                  onChange={handleSubirVideo}
                  className="hidden"
                />
              </label>

              {videoUrl ? (
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-emerald-700 font-medium">✓ Video cargado</span>
                  <a
                    href={videoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-terra underline text-[11px]"
                  >
                    Ver ↗
                  </a>
                  <button
                    type="button"
                    onClick={() => onChangeVideoUrl("")}
                    className="text-stone hover:text-red-600 cursor-pointer"
                  >
                    Quitar
                  </button>
                </div>
              ) : (
                <span className="text-[10px] text-stone">
                  Máximo 50MB. MP4 recomendado.
                </span>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
