"use client";

import { useState } from "react";
import { clasificarFotosHospedajeAction, type AsignacionFotoResultado } from "../actions";

interface HabitacionContext {
  id: string;
  titulo: string;
  descripcion?: string;
}

interface ModalClasificadorFotosIAProps {
  nombreHospedaje: string;
  habitaciones: HabitacionContext[];
  descripcionContexto?: string;
  onClose: () => void;
  onAplicar: (data: {
    portadaUrl?: string;
    asignacionesPorHabitacion: Record<string, string[]>;
  }) => void;
}

export function ModalClasificadorFotosIA({
  nombreHospedaje,
  habitaciones,
  descripcionContexto,
  onClose,
  onAplicar,
}: ModalClasificadorFotosIAProps) {
  // Entradas
  const [urlsTexto, setUrlsTexto] = useState("");
  const [fotosLocales, setFotosLocales] = useState<string[]>([]);
  const [isAnalizando, setIsAnalizando] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Resultados
  const [resultados, setResultados] = useState<AsignacionFotoResultado[] | null>(null);
  const [portadaSugerida, setPortadaSugerida] = useState<string | null>(null);
  const [aplicarPortada, setAplicarPortada] = useState(true);

  // Manejo de subida local de archivos como data URIs para análisis
  const handleArchivosSeleccionados = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const b64 = ev.target?.result as string;
        if (b64) {
          setFotosLocales((prev) => [...prev, b64]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleAnalizar = async () => {
    // Extraer URLs separadas por saltos de línea o comas
    const urlsExtraidas = urlsTexto
      .split(/[\n,]+/)
      .map((u) => u.trim())
      .filter((u) => u.startsWith("http://") || u.startsWith("https://"));

    const todasLasFotos = [...urlsExtraidas, ...fotosLocales];

    if (todasLasFotos.length === 0) {
      setErrorMsg("Por favor pega al menos una URL de imagen o sube fotos.");
      return;
    }

    if (habitaciones.length === 0) {
      setErrorMsg("Debes tener al menos 1 habitación creada para poder asignarle fotos.");
      return;
    }

    setIsAnalizando(true);
    setErrorMsg(null);

    try {
      const res = await clasificarFotosHospedajeAction({
        fotos: todasLasFotos,
        nombreHospedaje: nombreHospedaje || "Hospedaje",
        habitaciones: habitaciones.map((h) => ({
          id: h.id,
          titulo: h.titulo,
          descripcion: h.descripcion,
        })),
        descripcionContexto,
      });

      if (!res.success || !res.asignaciones) {
        setErrorMsg(res.error || "No se pudo clasificar las fotos con Gemini.");
        setIsAnalizando(false);
        return;
      }

      setResultados(res.asignaciones);
      if (res.portadaSugerida) {
        setPortadaSugerida(res.portadaSugerida);
      }
    } catch (err: any) {
      setErrorMsg(err?.message || "Ocurrió un error inesperado al conectar con el servidor.");
    } finally {
      setIsAnalizando(false);
    }
  };

  // Permite al usuario cambiar el destino de una foto sugerida
  const handleCambiarDestino = (index: number, nuevoDestino: string) => {
    if (!resultados) return;
    const copia = [...resultados];
    copia[index].destino = nuevoDestino;
    setResultados(copia);
  };

  // Confirmar y aplicar a las habitaciones
  const handleConfirmar = () => {
    if (!resultados) return;

    const asignacionesPorHabitacion: Record<string, string[]> = {};
    habitaciones.forEach((h) => {
      asignacionesPorHabitacion[h.id] = [];
    });

    resultados.forEach((r) => {
      if (r.destino !== "portada" && r.destino !== "area_comun" && r.destino !== "descartar") {
        if (!asignacionesPorHabitacion[r.destino]) {
          asignacionesPorHabitacion[r.destino] = [];
        }
        asignacionesPorHabitacion[r.destino].push(r.url);
      }
    });

    onAplicar({
      portadaUrl: aplicarPortada && portadaSugerida ? portadaSugerida : undefined,
      asignacionesPorHabitacion,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-stone-light/80 overflow-hidden font-sans">
        {/* Header */}
        <div className="px-5 sm:px-6 py-4 border-b border-stone-light/70 flex items-center justify-between bg-cream/50">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">✨</span>
            <div>
              <h3 className="font-serif text-lg sm:text-xl text-forest font-bold">
                Clasificador Mágico de Fotos con IA
              </h3>
              <p className="text-[11px] sm:text-xs text-stone mt-0.5">
                Gemini Vision analiza las fotos y las asigna automáticamente a la habitación adecuada o portada.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-stone-light/40 hover:bg-stone-light text-stone hover:text-forest flex items-center justify-center text-sm font-bold transition-colors cursor-pointer"
            title="Cerrar"
          >
            ✕
          </button>
        </div>

        {/* Contenido Principal con Scroll */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1 text-xs">
          {/* Si aún no hay resultados, mostramos el formulario de entrada */}
          {!resultados ? (
            <div className="space-y-4">
              {/* Habitaciones Detectadas como Destino */}
              <div className="p-3.5 rounded-2xl bg-forest/5 border border-forest/15">
                <span className="font-semibold text-forest block mb-1.5">
                  🛏️ Habitaciones activas para asignación:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {habitaciones.map((h, i) => (
                    <span
                      key={h.id}
                      className="px-2.5 py-1 rounded-xl bg-white text-forest border border-forest/20 text-[11px] font-medium"
                    >
                      {i + 1}. {h.titulo}
                    </span>
                  ))}
                </div>
              </div>

              {/* Pegar URLs masivas de Booking / Airbnb */}
              <div>
                <label className="block text-xs font-semibold text-forest mb-1 flex items-center justify-between">
                  <span>1. Pega enlaces de imágenes (URLs de Booking, Airbnb o Web)</span>
                  <span className="text-[11px] text-stone font-normal">Una URL por línea</span>
                </label>
                <textarea
                  rows={5}
                  value={urlsTexto}
                  onChange={(e) => setUrlsTexto(e.target.value)}
                  placeholder="https://cf.bstatic.com/xdata/images/hotel/max1024x768/...&#10;https://a0.muscache.com/im/pictures/..."
                  className="w-full p-3 text-xs rounded-2xl border border-stone-light/80 bg-white text-forest focus:outline-terra font-mono resize-none leading-relaxed"
                />
              </div>

              {/* O bien, subir archivos locales */}
              <div>
                <label className="block text-xs font-semibold text-forest mb-1">
                  2. O selecciona múltiples fotos desde tu dispositivo
                </label>
                <div className="flex items-center gap-3">
                  <label className="px-4 py-2.5 rounded-xl border border-dashed border-stone hover:border-forest bg-cream/30 hover:bg-cream text-forest cursor-pointer font-medium flex items-center gap-2 transition-colors">
                    <span>📁 Seleccionar fotos locales</span>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleArchivosSeleccionados}
                      className="hidden"
                    />
                  </label>
                  {fotosLocales.length > 0 && (
                    <span className="text-forest font-semibold">
                      ✅ {fotosLocales.length} foto(s) cargadas
                    </span>
                  )}
                </div>
              </div>

              {errorMsg && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700">
                  ⚠️ {errorMsg}
                </div>
              )}
            </div>
          ) : (
            /* Vista de Resultados y Revisión Visual */
            <div className="space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2 p-3 rounded-2xl bg-forest/5 border border-forest/15">
                <div>
                  <span className="font-semibold text-forest text-sm block">
                    🎉 {resultados.length} fotografías clasificadas por Gemini Vision
                  </span>
                  <p className="text-[11px] text-stone">
                    Revisa las asignaciones sugeridas abajo. Puedes reasignar cualquier foto si lo deseas antes de aplicar.
                  </p>
                </div>
                {portadaSugerida && (
                  <label className="flex items-center gap-2 text-xs text-forest font-medium cursor-pointer">
                    <input
                      type="checkbox"
                      checked={aplicarPortada}
                      onChange={(e) => setAplicarPortada(e.target.checked)}
                      className="rounded accent-forest cursor-pointer"
                    />
                    <span>Fijar portada sugerida como foto principal</span>
                  </label>
                )}
              </div>

              {/* Grid de Fotos Clasificadas */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {resultados.map((item, idx) => {
                  const isPortada = portadaSugerida === item.url;
                  return (
                    <div
                      key={idx}
                      className={`p-2.5 rounded-2xl border bg-white flex flex-col justify-between gap-2 transition-all shadow-2xs ${
                        isPortada ? "border-amber-400 ring-2 ring-amber-300/40" : "border-stone-light/80"
                      }`}
                    >
                      {/* Miniatura */}
                      <div className="relative aspect-4/3 rounded-xl overflow-hidden bg-stone-light/30">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={item.url}
                          alt="Foto clasificada"
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                        {isPortada && (
                          <span className="absolute top-2 left-2 bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow-xs">
                            ⭐ Portada Sugerida
                          </span>
                        )}
                      </div>

                      {/* Razón visual de Gemini */}
                      <p className="text-[11px] text-stone italic line-clamp-2">
                        &quot;{item.razonVisual}&quot;
                      </p>

                      {/* Selector de Destino */}
                      <div>
                        <label className="block text-[10px] text-stone font-semibold mb-1">
                          Asignar a:
                        </label>
                        <select
                          value={item.destino}
                          onChange={(e) => handleCambiarDestino(idx, e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-xl border border-stone-light/80 bg-cream/40 text-forest font-medium focus:outline-terra cursor-pointer text-xs"
                        >
                          <option value="portada">⭐ Portada Principal</option>
                          <option value="area_comun">🌿 Áreas Comunes / Entorno</option>
                          {habitaciones.map((hab) => (
                            <option key={hab.id} value={hab.id}>
                              🛏️ {hab.titulo}
                            </option>
                          ))}
                          <option value="descartar">🚫 Descartar / No usar</option>
                        </select>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 sm:px-6 py-3.5 border-t border-stone-light/70 bg-cream/40 flex items-center justify-between gap-2.5">
          {resultados ? (
            <button
              type="button"
              onClick={() => {
                setResultados(null);
                setErrorMsg(null);
              }}
              className="px-3.5 py-2 text-xs font-sans text-stone hover:text-forest transition-colors cursor-pointer"
            >
              ← Volver a cargar fotos
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-sans text-stone hover:text-forest transition-colors cursor-pointer"
            >
              Cancelar
            </button>

            {!resultados ? (
              <button
                type="button"
                disabled={isAnalizando}
                onClick={handleAnalizar}
                className="px-5 py-2.5 rounded-xl bg-forest text-cream font-sans text-xs font-semibold hover:bg-forest-dark active:scale-95 transition-all shadow-md flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isAnalizando ? (
                  <>
                    <span className="animate-spin text-sm">⏳</span>
                    <span>Analizando con Gemini Vision...</span>
                  </>
                ) : (
                  <>
                    <span>✨</span>
                    <span>Analizar y Asignar Fotos</span>
                  </>
                )}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleConfirmar}
                className="px-5 py-2.5 rounded-xl bg-forest text-cream font-sans text-xs font-semibold hover:bg-forest-dark active:scale-95 transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
              >
                <span>✅</span>
                <span>Aplicar Asignación a Habitaciones</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
