"use client";

import { useState } from "react";
import { procesarTextoBrutoHospedaje, type HospedajeExtraido } from "@/lib/hospedajeParser";
import { generarCopyHospedajeGeminiAction } from "../actions";

interface ModalAsistenteIngestaProps {
  zonas: Array<{ id: string; nombre: string; slug: string }>;
  onClose: () => void;
  onParsed: (borrador: HospedajeExtraido) => void;
}

const EJEMPLO_LA_CASONA = `Hotel Minca La Casona
Teléfono / WhatsApp: +57 315 519 3679
Instagram: @hotelminca
Ubicación: Centro de Minca, Sierra Nevada de Santa Marta
Calificación Google: 4.6 (cientos de reseñas positivas)

Hotel tradicional de estilo colonial con 50 años de historia. Cuenta con piscina al aire libre, restaurante propio de comida típica e internacional, parqueadero privado y jardines tropicales donde llegan decenas de colibríes todo el día. Cerca de senderos ecológicos y del sendero ancestral Tayrona.

Habitaciones disponibles:
1. Habitación Estándar Doble: Cama doble, baño privado con agua caliente, ventilador, wifi. Tarifa: $190.000 COP por noche para 2 personas.
2. Habitación Superior King: Cama King Size, balcón privado con hamaca y vista a la montaña, baño privado, wifi. Tarifa: $260.000 COP por noche.
3. Habitación Triple: Cama doble y cama sencilla, baño privado, ventilador, ideal para 3 personas. Tarifa: $310.000 COP por noche.
4. Casa Colibrí Familiar: Cabaña completa para hasta 6 personas con cocina integral, sala, terraza y vista a los jardines. Tarifa: $450.000 COP por noche.`;

export function ModalAsistenteIngesta({
  zonas,
  onClose,
  onParsed,
}: ModalAsistenteIngestaProps) {
  const [nombre, setNombre] = useState("");
  const [zonaSlug, setZonaSlug] = useState("minca");
  const [textoBruto, setTextoBruto] = useState("");
  const [isProcesando, setIsProcesando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCargarEjemplo = () => {
    setNombre("Hotel Minca La Casona");
    setZonaSlug("minca");
    setTextoBruto(EJEMPLO_LA_CASONA);
    setError(null);
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
                Convierte texto bruto de Booking, Instagram o WhatsApp en una ficha lista para publicar.
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
          {/* Banner de Ayuda & Botón Ejemplo */}
          <div className="p-3.5 rounded-2xl bg-forest/5 border border-forest/15 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
            <div className="text-xs text-forest">
              <span className="font-semibold">💡 Tip rápido:</span> Pega la descripción tal como la copiaste. El asistente extraerá teléfonos, habitaciones, precios y comodidades automáticamente.
            </div>
            <button
              type="button"
              onClick={handleCargarEjemplo}
              className="text-xs font-semibold text-terra hover:underline shrink-0 bg-white px-2.5 py-1.5 rounded-xl border border-terra/30 hover:bg-terra/5 transition-colors cursor-pointer self-start sm:self-auto"
            >
              Probar con &quot;La Casona&quot; ⚡
            </button>
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
                placeholder="Ej. Hotel Minca La Casona"
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
              placeholder="Pega aquí el texto completo... Ej: 'Hotel Minca La Casona, WhatsApp 3155193679, piscina, colibríes, habitación doble $190.000 con baño privado...'"
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
