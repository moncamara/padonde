"use client";

import { useState } from "react";
import {
  procesarTextoBrutoHospedaje,
  parsearLineaRapida,
  type HospedajeExtraido,
} from "@/lib/hospedajeParser";
import { generarCopyHospedajeGeminiAction, investigarHospedajeAction } from "../actions";

interface ModalAsistenteIngestaProps {
  zonas: Array<{ id: string; nombre: string; slug: string }>;
  onClose: () => void;
  onParsed: (borrador: HospedajeExtraido) => void;
}

export function ModalAsistenteIngesta({
  zonas,
  onClose,
  onParsed,
}: ModalAsistenteIngestaProps) {
  const [lineaRapida, setLineaRapida] = useState("");
  const [nombre, setNombre] = useState("");
  const [zonaSlug, setZonaSlug] = useState("minca");
  const [textoBruto, setTextoBruto] = useState("");
  const [isProcesando, setIsProcesando] = useState(false);
  const [isInvestigandoRapido, setIsInvestigandoRapido] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleProcesarLineaRapida = async () => {
    const input = lineaRapida.trim();
    if (!input || isInvestigandoRapido) {
      setError("Por favor escribe o pega el teléfono, nombre de contacto y hospedaje.");
      return;
    }

    setIsInvestigandoRapido(true);
    setError(null);
    try {
      const res = await investigarHospedajeAction({
        linea: input,
        zonaSlug,
      });

      if (res.success && res.borrador) {
        onParsed(res.borrador);
      } else {
        // Fallback local seguro
        const parsed = parsearLineaRapida(input);
        const nuevoBorrador: HospedajeExtraido = {
          nombreNegocio: parsed.nombreNegocio || "Nuevo Hospedaje",
          nombrePropietario: parsed.nombrePropietario || "",
          whatsapp: parsed.telefono || "",
          instagram: "",
          zonaSlug: zonaSlug || "minca",
          titulo: `🏡 ${parsed.nombreNegocio || "Nuevo Hospedaje"} — Refugio Natural 🌿`,
          descripcion: `Ubicado en la región caribe y la Sierra Nevada. Espacio ideal para desconectar y descansar en armonía con la naturaleza.`,
          ratingGoogle: "",
          reviewsGoogle: "",
          mapsUrl: "",
          imagenUrl: "",
          destacado: false,
          habitaciones: [
            {
              id: `hab-${Date.now()}`,
              titulo: "Habitación Estándar",
              descripcion: "Cama doble, baño privado y ventilador.",
              precio_noche_cop: 120000,
              capacidad_max: 2,
              fotos: [],
              badges: [
                { icono: "🚿", texto: "Baño privado" },
                { icono: "🍳", texto: "Desayuno incluido" },
              ],
            },
          ],
        };
        onParsed(nuevoBorrador);
      }
    } catch (err: any) {
      console.error("Error en asistente de ingesta rápida:", err);
      const parsed = parsearLineaRapida(input);
      onParsed({
        nombreNegocio: parsed.nombreNegocio || "Nuevo Hospedaje",
        nombrePropietario: parsed.nombrePropietario || "",
        whatsapp: parsed.telefono || "",
        instagram: "",
        zonaSlug: zonaSlug || "minca",
        titulo: `🏡 ${parsed.nombreNegocio || "Nuevo Hospedaje"} — Refugio Natural 🌿`,
        descripcion: `Ubicado en el entorno de la Sierra Nevada y el Caribe colombiano.`,
        ratingGoogle: "",
        reviewsGoogle: "",
        mapsUrl: "",
        imagenUrl: "",
        destacado: false,
        habitaciones: [],
      });
    } finally {
      setIsInvestigandoRapido(false);
    }
  };

  const handleProcesar = async () => {
    if (!textoBruto.trim()) {
      setError("Por favor pega algún texto, descripción o datos del hospedaje.");
      return;
    }

    setIsProcesando(true);
    setError(null);

    try {
      const borrador = procesarTextoBrutoHospedaje(textoBruto, zonaSlug, nombre);

      // Enriquecer con Gemini AI para lograr copy sensorial y mágico
      const aiRes = await generarCopyHospedajeGeminiAction({
        textoBruto,
        nombreNegocio: borrador.nombreNegocio,
        zonaSlug,
      });

      if (aiRes.success) {
        if (aiRes.titulo) borrador.titulo = aiRes.titulo;
        if (aiRes.descripcion) {
          let descConDestacados = aiRes.descripcion;
          if (aiRes.destacados && aiRes.destacados.length > 0) {
            descConDestacados += "\n\n🌿 Destacados del lugar:\n" + aiRes.destacados.map((d) => `• ${d}`).join("\n");
          }
          borrador.descripcion = descConDestacados;
        }
      }

      onParsed(borrador);
    } catch (err: any) {
      setError(err?.message || "Ocurrió un error al procesar el texto.");
      setIsProcesando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-stone-light/80 overflow-hidden">
        {/* Header */}
        <div className="px-5 sm:px-6 py-4 border-b border-stone-light/70 flex items-center justify-between bg-cream/50">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">✨</span>
            <div>
              <h3 className="font-serif text-lg sm:text-xl text-forest font-bold">
                Asistente de Ingesta Rápida
              </h3>
              <p className="text-[11px] sm:text-xs text-stone font-sans mt-0.5">
                Convierte texto bruto o una sola línea (teléfono - dueño - hotel) en una ficha lista para publicar.
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

        {/* Contenido del Formulario */}
        <div className="p-5 sm:p-6 space-y-4 overflow-y-auto font-sans flex-1">
          {/* OPCIÓN 1: INGESTA EN 1 SOLA LÍNEA (LEAD RÁPIDO) */}
          <div className="p-4 rounded-2xl bg-amber-500/10 border-2 border-amber-500/30 space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-forest flex items-center gap-1.5">
                <span>⚡</span> Ingesta Rápida (1 Sola Línea)
              </label>
              <span className="text-[10px] text-amber-800 font-bold bg-white px-2 py-0.5 rounded-full border border-amber-300">
                Pega y Enter ↵
              </span>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                autoFocus
                value={lineaRapida}
                onChange={(e) => {
                  setLineaRapida(e.target.value);
                  setError(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleProcesarLineaRapida();
                  }
                }}
                placeholder="Escribe o pega aquí: 3106436667 Candelaria - Brisas del Mar"
                className="flex-1 px-3.5 py-2.5 text-xs rounded-xl border border-stone-light/90 bg-white text-forest focus:outline-terra font-sans shadow-inner placeholder:text-stone/60 font-medium"
              />
              <button
                type="button"
                disabled={isInvestigandoRapido}
                onClick={handleProcesarLineaRapida}
                className="px-4 py-2.5 bg-terra hover:bg-terra-dark text-white text-xs font-semibold rounded-xl active:scale-95 transition-all shadow-xs shrink-0 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60 disabled:cursor-wait"
              >
                {isInvestigandoRapido ? (
                  <>
                    <span className="animate-spin inline-block">⏳</span>
                    <span>Investigando...</span>
                  </>
                ) : (
                  <>
                    <span>🪄</span>
                    <span>Crear Ficha Ahora</span>
                  </>
                )}
              </button>
            </div>

            <p className="text-[11px] text-stone">
              Detecta automáticamente: <strong>Teléfono</strong>, <strong>Propietario</strong> y <strong>Hospedaje</strong>.
            </p>
          </div>

          {/* Divisor Visual */}
          <div className="flex items-center gap-3 py-1">
            <div className="h-px bg-stone-light/70 flex-1" />
            <span className="text-[10px] font-bold text-stone/80 uppercase tracking-wider">
              O Opción 2: Texto Extenso (Booking / WhatsApp)
            </span>
            <div className="h-px bg-stone-light/70 flex-1" />
          </div>

          {/* Nombre y Zona */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-forest mb-1">
                Nombre del Hospedaje (Opcional)
              </label>
              <input
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ej. Hostal La Selva"
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-stone-light/80 bg-white text-forest focus:outline-terra"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-forest mb-1">
                Zona de Destino *
              </label>
              <select
                value={zonaSlug}
                onChange={(e) => setZonaSlug(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-stone-light/80 bg-white text-forest font-medium focus:outline-terra cursor-pointer"
              >
                {zonas.map((z) => (
                  <option key={z.id} value={z.slug}>
                    {z.nombre}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Área de Texto Bruto */}
          <div>
            <label className="block text-xs font-semibold text-forest mb-1 flex items-center justify-between">
              <span>Texto copiado de Booking, Instagram o WhatsApp *</span>
              <span className="text-[10px] text-stone font-normal">
                {textoBruto.length} caracteres
              </span>
            </label>
            <textarea
              rows={8}
              value={textoBruto}
              onChange={(e) => setTextoBruto(e.target.value)}
              placeholder="Pega aquí el texto copiado de Booking, Airbnb o WhatsApp (incluye descripción, servicios, habitaciones y tarifas)..."
              className="w-full p-3.5 text-xs rounded-2xl border border-stone-light/80 bg-white text-forest focus:outline-terra font-sans leading-relaxed resize-none"
            />
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700">
              ⚠️ {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 sm:px-6 py-3.5 border-t border-stone-light/70 bg-cream/40 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-sans text-stone hover:text-forest transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={isProcesando}
            onClick={handleProcesar}
            className="px-5 py-2.5 rounded-xl bg-forest text-cream font-sans text-xs font-semibold hover:bg-forest-dark active:scale-95 transition-all shadow-md flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            {isProcesando ? (
              <>
                <span className="animate-spin text-sm">⏳</span>
                <span>Redactando con Gemini AI...</span>
              </>
            ) : (
              <>
                <span>✨</span>
                <span>Estructurar y Redactar con Gemini AI</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
