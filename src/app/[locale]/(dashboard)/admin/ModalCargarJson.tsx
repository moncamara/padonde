"use client";

import { useState } from "react";

export interface ModalCargarJsonProps {
  isOpen: boolean;
  onClose: () => void;
  tipo: "hospedaje" | "evento";
  onAplicar: (parsed: any) => Promise<void> | void;
  isProcesando?: boolean;
}

const EJEMPLO_JSON_HOSPEDAJE = {
  nombreNegocio: "Magic Green Dentro del Parque Tayrona",
  nombrePropietario: "Manuel",
  whatsapp: "573114200589",
  instagram: "magicgreentayrona",
  zonaSlug: "tayrona",
  titulo: "Eco-Lodge con Piscina dentro del Parque Tayrona",
  descripcion:
    "Piscina al aire libre, restaurante y bungalows de madera independientes a 8 min de Playa Castilletes dentro del Tayrona.",
  googleMapsUrl: "https://maps.google.com/?cid=8362484646700030521",
  googleRating: 4.7,
  googleReviewsCount: 67,
  imagenPortadaUrl:
    "https://gvrroyncnrnjsaldlges.supabase.co/storage/v1/object/public/eventos/hospedajes/magic-green-portada-piscina.webp",
  habitaciones: [
    {
      titulo: "Bungalow Familiar con Balcón y Selva",
      descripcion: "Bungalow independiente de 36 m² con 1 cama doble y 1 litera, baño privado y vista a la montaña.",
      precio_noche_cop: 320000,
      capacidad_max: 4,
      fotos: [
        "https://gvrroyncnrnjsaldlges.supabase.co/storage/v1/object/public/eventos/hospedajes/magic-green-hab-bungalow-1.webp",
      ],
      badges: ["Baño privado", "Vista montaña", "Balcón privado"],
    },
    {
      titulo: "Cabaña Doble Estándar con Terraza",
      descripcion: "Habitación privada inmersa en la vegetación nativa para 2 personas.",
      precio_noche_cop: 250000,
      capacidad_max: 2,
      fotos: [
        "https://gvrroyncnrnjsaldlges.supabase.co/storage/v1/object/public/eventos/hospedajes/magic-green-hab-bungalow-2.webp",
      ],
      badges: ["Baño privado", "Vista jardín", "Desayuno disponible"],
    },
  ],
};

const EJEMPLO_JSON_EVENTO = {
  titulo: "🎸 Noche de Cumbia & Fogata Acústica",
  descripcion:
    "Ven a disfrutar de una velada única bajo las estrellas en Minca. Música en vivo con artistas de la región, cócteles artesanales y ambiente relajado.",
  categoria: "rumba",
  precio: 20000,
  fechaInicio: "2026-11-20T20:00:00",
  fechaFin: "2026-11-21T02:00:00",
  esRecurrente: true,
  diasRecurrentes: [5, 6],
  nombreNegocio: "La Casona Minca",
  whatsapp: "573111234567",
  instagram: "lacasonaminca",
  zonaSlug: "minca",
  googleMapsUrl: "https://maps.google.com/?cid=123456789",
  imagenPortadaUrl:
    "https://gvrroyncnrnjsaldlges.supabase.co/storage/v1/object/public/eventos/hospedajes/magic-green-portada-piscina.webp",
};

export function ModalCargarJson({
  isOpen,
  onClose,
  tipo,
  onAplicar,
  isProcesando = false,
}: ModalCargarJsonProps) {
  const [jsonText, setJsonText] = useState("");
  const [errorParse, setErrorParse] = useState<string | null>(null);
  const [isEjecutando, setIsEjecutando] = useState(false);

  if (!isOpen) return null;

  const handleCargarEjemplo = () => {
    const ejemplo = tipo === "hospedaje" ? EJEMPLO_JSON_HOSPEDAJE : EJEMPLO_JSON_EVENTO;
    setJsonText(JSON.stringify(ejemplo, null, 2));
    setErrorParse(null);
  };

  const handleAplicar = async () => {
    setErrorParse(null);
    if (!jsonText.trim()) {
      setErrorParse("Por favor pega un JSON estructurado antes de continuar.");
      return;
    }

    try {
      const parsed = JSON.parse(jsonText.trim());
      if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
        throw new Error("El JSON debe ser un objeto válido {...}");
      }

      setIsEjecutando(true);
      await onAplicar(parsed);
      onClose();
    } catch (err: any) {
      setErrorParse(err.message || "Error al parsear el JSON. Verifica comas y comillas.");
    } finally {
      setIsEjecutando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl border border-stone-200 flex flex-col max-h-[90vh]">
        {/* Cabecera */}
        <div className="p-4 sm:p-5 bg-stone-50/80 border-b border-stone-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">📥</span>
            <div>
              <h3 className="font-serif text-lg sm:text-xl font-bold text-forest">
                {tipo === "hospedaje"
                  ? "Cargar Hospedaje desde JSON"
                  : "Cargar Evento desde JSON"}
              </h3>
              <p className="text-stone text-[11px] sm:text-xs">
                {tipo === "hospedaje"
                  ? "Pega la estructura JSON del hospedaje y sus habitaciones para rellenar el formulario."
                  : "Pega la estructura JSON del evento (fechas, datos y fotos) para rellenar el formulario."}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isEjecutando || isProcesando}
            className="w-8 h-8 rounded-full bg-stone-200/60 hover:bg-stone-200 text-stone hover:text-forest flex items-center justify-center text-sm transition-colors cursor-pointer disabled:opacity-50"
          >
            ✕
          </button>
        </div>

        {/* Cuerpo */}
        <div className="p-4 sm:p-5 space-y-3 overflow-y-auto flex-1">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <label className="text-xs font-semibold text-forest flex items-center gap-1.5">
              <span>Pegar JSON Estructurado:</span>
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCargarEjemplo}
                className="text-[11px] font-semibold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-300 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
              >
                📋 Cargar Ejemplo Válido
              </button>
              {jsonText && (
                <button
                  type="button"
                  onClick={() => {
                    setJsonText("");
                    setErrorParse(null);
                  }}
                  className="text-[11px] text-stone hover:text-red-600 underline cursor-pointer"
                >
                  Limpiar
                </button>
              )}
            </div>
          </div>

          <textarea
            rows={12}
            value={jsonText}
            onChange={(e) => {
              setJsonText(e.target.value);
              if (errorParse) setErrorParse(null);
            }}
            placeholder={`{\n  "nombreNegocio": "...",\n  "whatsapp": "...",\n  "titulo": "...",\n  ${
              tipo === "hospedaje" ? '"habitaciones": [...]' : '"categoria": "..."'
            }\n}`}
            className="w-full bg-stone-50 border border-stone-200 rounded-2xl p-3 text-xs font-mono text-stone-800 focus:outline-none focus:border-forest focus:bg-white resize-y leading-relaxed"
            disabled={isEjecutando || isProcesando}
          />

          {errorParse && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center gap-2 animate-in fade-in">
              <span className="text-base shrink-0">⚠️</span>
              <span>{errorParse}</span>
            </div>
          )}

          {/* Banner explicativo del prefill */}
          <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-xl text-[11px] text-amber-900 leading-relaxed flex items-start gap-2">
            <span className="text-sm shrink-0 mt-0.5">💡</span>
            <div>
              <strong>Pre-población segura en memoria:</strong> El formulario se completará con los campos recibidos sin guardar en base de datos. Si el JSON incluye fotos externas, se optimizarán a WebP en Supabase Storage automáticamente sin errores de CORS.
            </div>
          </div>
        </div>

        {/* Pie de Acciones */}
        <div className="p-4 sm:p-5 bg-stone-50/80 border-t border-stone-200 flex items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={isEjecutando || isProcesando}
            className="px-4 py-2 border border-stone-300 text-stone-700 hover:bg-stone-100 rounded-xl text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={handleAplicar}
            disabled={isEjecutando || isProcesando || !jsonText.trim()}
            className="px-5 py-2.5 bg-forest hover:bg-forest-dark text-cream rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-2 cursor-pointer disabled:opacity-50 active:scale-95"
          >
            {isEjecutando || isProcesando ? (
              <>
                <svg className="animate-spin h-3.5 w-3.5 text-cream" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Procesando fotos y pre-llenando...</span>
              </>
            ) : (
              <>
                <span>📥</span>
                <span>Pre-llenar Formulario</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
