"use client";

import { useState, useRef, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  resolverIngestaUniversalAction,
  type IngestaUniversalPrefillResultado,
} from "./actions";

export interface UniversalIngestaModalProps {
  isOpen: boolean;
  onClose: () => void;
  entidadInicial?: "hospedaje" | "evento";
  zonaInicial?: string;
  onPrefillHospedaje?: (datos: IngestaUniversalPrefillResultado) => void;
  onPrefillEvento?: (datos: IngestaUniversalPrefillResultado) => void;
}

const EJEMPLOS_UNIVERSALES = {
  hospedaje: [
    {
      label: "🌿 Eco-Lodge Minca",
      texto: `Hotel Sierra Minca Eco-Lodge
Google Maps: https://maps.app.goo.gl/sierra-minca
WhatsApp reservas: +57 312 847 2911
Instagram: @sierraminca
Cabaña privada con vista a la montaña $260.000 / noche (2 personas, baño privado, desayuno).
Habitación compartida 4 camas $65.000 / noche (WiFi, lockers).
Check-in 3:00 PM, sendero ecológico y piscina natural.`,
      zona: "minca",
    },
    {
      label: "🌊 Cabañas Mendihuaca",
      texto: `Cabañas del Río Mendihuaca
Frente al mar y desembocadura del río.
WhatsApp: 310 987 6543
Instagram: @mendihuaca_cabanas
Bungalow familiar $380.000 COP para 4 personas con aire acondicionado y cocina.
Habitación matrimonial $190.000 COP con desayuno caribeño incluido.
Parqueadero vigilado y hamacas frente a la playa.`,
      zona: "mendihuaca",
    },
  ],
  evento: [
    {
      label: "🎸 Noche Acústica",
      texto: `Este viernes a las 8:00 PM noche de fogata acústica en Hotel Minca La Casona.
Música en vivo con artistas locales, cócteles 2x1 y picadas de la casa.
Entrada libre para viajeros y locales.
WhatsApp: 315 519 3679
Instagram: @hotel_lacasona_minca`,
      zona: "minca",
    },
    {
      label: "🧘 Sound Healing & Yoga",
      texto: `Domingo 8:30 AM sesión de Vinyasa Flow y cuencos tibetanos frente a las olas en Casa Maya Mendihuaca.
Aporte consciente: $25.000 COP. Traer esterilla o toalla.
WhatsApp reservas: +57 320 123 4567 @casamayamendihuaca`,
      zona: "mendihuaca",
    },
  ],
};

const ZONAS_DISPONIBLES = [
  { slug: "minca", nombre: "Minca", emoji: "🌿" },
  { slug: "mendihuaca", nombre: "Mendihuaca", emoji: "🌊" },
  { slug: "tayrona", nombre: "Tayrona", emoji: "🌴" },
  { slug: "taganga", nombre: "Taganga", emoji: "🤿" },
];

export function UniversalIngestaModal({
  isOpen,
  onClose,
  entidadInicial = "hospedaje",
  zonaInicial = "minca",
  onPrefillHospedaje,
  onPrefillEvento,
}: UniversalIngestaModalProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Estados del Formulario
  const [entidad, setEntidad] = useState<"hospedaje" | "evento">(entidadInicial);
  const [zonaSlug, setZonaSlug] = useState<string>(zonaInicial);
  const [textoContexto, setTextoContexto] = useState<string>("");
  const [archivosLocales, setArchivosLocales] = useState<File[]>([]);
  const [previewsLocales, setPreviewsLocales] = useState<string[]>([]);

  // Estados de Proceso
  const [loadingStep, setLoadingStep] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [resultado, setResultado] = useState<IngestaUniversalPrefillResultado | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Manejo de carga de archivos multimedia
  const handleArchivosSeleccionados = (files: FileList | null) => {
    if (!files) return;
    const nuevosArchivos: File[] = [];
    const nuevasPreviews: string[] = [];

    Array.from(files).forEach((file) => {
      if (file.type.startsWith("image/")) {
        nuevosArchivos.push(file);
        nuevasPreviews.push(URL.createObjectURL(file));
      }
    });

    setArchivosLocales((prev) => [...prev, ...nuevosArchivos]);
    setPreviewsLocales((prev) => [...prev, ...nuevasPreviews]);
  };

  const handleEliminarArchivo = (index: number) => {
    setArchivosLocales((prev) => prev.filter((_, i) => i !== index));
    setPreviewsLocales((prev) => {
      const target = prev[index];
      if (target) URL.revokeObjectURL(target);
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleCargarEjemplo = (ejemplo: { texto: string; zona: string }) => {
    setTextoContexto(ejemplo.texto);
    setZonaSlug(ejemplo.zona);
    setError(null);
  };

  // Procesamiento Asistido con Gemini Search Grounding + Sharp WebP
  const handleEjecutarIngesta = () => {
    if (!textoContexto.trim() && archivosLocales.length === 0) {
      setError("Por favor ingresa texto, enlaces (Maps, Instagram, WhatsApp) o sube fotos.");
      return;
    }

    setError(null);
    setLoadingStep("🔍 Investigando con Google Grounding y Gemini...");

    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.append("entidad", entidad);
        formData.append("zonaSlug", zonaSlug);
        formData.append("textoContexto", textoContexto);

        archivosLocales.forEach((file) => {
          formData.append("archivos", file);
        });

        // Simular avance de paso para dar retroalimentación visual clara
        const stepTimer = setTimeout(() => {
          setLoadingStep("🖼️ Procesando imágenes y optimizando en WebP (Sharp)...");
        }, 1800);

        const res = await resolverIngestaUniversalAction(formData);
        clearTimeout(stepTimer);

        if (!res.success || !res.resultado) {
          setError(res.error || "No se pudo estructurar la información ingresada.");
          setLoadingStep("");
          return;
        }

        setLoadingStep("");
        setResultado(res.resultado);
      } catch (err: any) {
        console.error("Error en handleEjecutarIngesta:", err);
        setError(err?.message || "Ocurrió un error inesperado al procesar la ingesta.");
        setLoadingStep("");
      }
    });
  };

  // Aplicación del Prefill al formulario canónico destino (Zero DB writes)
  const handleAplicarPrefill = () => {
    if (!resultado) return;

    if (resultado.entidad === "hospedaje") {
      if (onPrefillHospedaje) {
        onPrefillHospedaje(resultado);
        onClose();
      } else {
        // Redirección si se abrió desde un contexto sin modal activo
        try {
          sessionStorage.setItem("padonde_prefill_hospedaje", JSON.stringify(resultado));
        } catch {}
        router.push("/admin/hospedajes");
        onClose();
      }
    } else {
      if (onPrefillEvento) {
        onPrefillEvento(resultado);
        onClose();
      } else {
        try {
          sessionStorage.setItem("padonde_asistente_prefill", JSON.stringify(resultado));
        } catch {}
        router.push("/admin/nuevo");
        onClose();
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/65 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-stone-light/80 overflow-hidden">
        {/* Header Canónico */}
        <div className="px-5 sm:px-6 py-4 border-b border-stone-light/70 flex items-center justify-between bg-cream/50">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-xl shrink-0">
              ✨
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-serif text-lg sm:text-xl text-forest font-bold tracking-tight">
                  Asistente Universal de Ingesta
                </h3>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-forest text-cream">
                  AI Grounding
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-stone font-sans mt-0.5">
                Ingesta inteligente con Google Search Grounding y optimización WebP en Sharp.
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

        {/* Contenido Scrolleable */}
        <div className="p-5 sm:p-6 space-y-4 overflow-y-auto font-sans flex-1">
          {error && (
            <div className="p-3.5 rounded-2xl bg-terra/10 border border-terra/30 text-terra text-xs font-medium flex items-start gap-2">
              <span className="shrink-0 text-sm">⚠️</span>
              <p className="flex-1">{error}</p>
            </div>
          )}

          {/* VISTA 1: CAPTURA Y CONFIGURACIÓN */}
          {!resultado && (
            <div className="space-y-4">
              {/* Selector de Tipo de Entidad */}
              <div>
                <label className="block text-xs font-bold text-forest mb-1.5">
                  1. ¿Qué deseas registrar o actualizar? *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setEntidad("hospedaje");
                      setResultado(null);
                    }}
                    className={`py-2.5 px-3 rounded-2xl border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      entidad === "hospedaje"
                        ? "bg-forest text-white border-forest shadow-xs"
                        : "bg-white text-stone hover:text-forest border-stone-light/80 hover:bg-forest/5"
                    }`}
                  >
                    <span className="text-base">🏡</span>
                    <span>Hospedaje / Eco-Lodge</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEntidad("evento");
                      setResultado(null);
                    }}
                    className={`py-2.5 px-3 rounded-2xl border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      entidad === "evento"
                        ? "bg-forest text-white border-forest shadow-xs"
                        : "bg-white text-stone hover:text-forest border-stone-light/80 hover:bg-forest/5"
                    }`}
                  >
                    <span className="text-base">🎪</span>
                    <span>Evento / Experiencia</span>
                  </button>
                </div>
              </div>

              {/* Selector de Región / Zona */}
              <div>
                <label className="block text-xs font-bold text-forest mb-1.5">
                  2. Región o Destino *
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {ZONAS_DISPONIBLES.map((z) => (
                    <button
                      key={z.slug}
                      type="button"
                      onClick={() => setZonaSlug(z.slug)}
                      className={`py-2 px-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        zonaSlug === z.slug
                          ? "bg-amber-500/15 border-amber-500/50 text-forest font-bold"
                          : "bg-white text-stone hover:text-forest border-stone-light/80"
                      }`}
                    >
                      <span>{z.emoji}</span>
                      <span>{z.nombre}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Ejemplos Rápidos */}
              <div className="p-3 rounded-2xl bg-forest/5 border border-forest/15 space-y-2">
                <p className="text-[11px] text-forest font-semibold flex items-center gap-1.5">
                  <span>💡</span>
                  <span>Ejemplos rápidos para probar:</span>
                </p>
                <div className="flex flex-wrap gap-2">
                  {EJEMPLOS_UNIVERSALES[entidad].map((ej, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleCargarEjemplo(ej)}
                      className="text-[11px] bg-white text-forest hover:bg-forest hover:text-white px-3 py-1 rounded-xl border border-stone-light/80 transition-colors cursor-pointer font-medium shadow-2xs"
                    >
                      {ej.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Entrada Polimórfica de Contexto */}
              <div>
                <label className="block text-xs font-bold text-forest mb-1 flex items-center justify-between">
                  <span>3. Datos, Enlaces o Mensaje WhatsApp *</span>
                  <span className="text-[10px] text-stone font-normal">
                    {textoContexto.length} caracteres
                  </span>
                </label>
                <textarea
                  rows={6}
                  value={textoContexto}
                  onChange={(e) => setTextoContexto(e.target.value)}
                  placeholder={
                    entidad === "hospedaje"
                      ? "Pega aquí enlace de Google Maps, Booking, Instagram, mensaje de WhatsApp o tarifas...\nEj: 'Hostal Sierra Minca, link maps: https://maps.app.goo.gl/..., cabañas desde 180k y dorms a 50k, wsp 312...'"
                      : "Pega aquí mensaje de WhatsApp, flyer, Instagram o itinerario...\nEj: 'Este viernes a las 8pm noche acústica en La Casona Minca, cover libre, cócteles 2x1...'"
                  }
                  className="w-full p-3.5 text-xs rounded-2xl border border-stone-light/90 bg-white text-forest focus:outline-terra font-sans leading-relaxed resize-none shadow-inner"
                />
              </div>

              {/* Dropzone Multimedia / Fotos Locales */}
              <div className="p-3.5 rounded-2xl bg-cream/40 border border-stone-light/70 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-forest flex items-center gap-1.5">
                    <span>🖼️</span> Fotos locales o capturas de pantalla (Opcional)
                  </label>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-xs font-bold text-terra hover:underline cursor-pointer"
                  >
                    + Agregar fotos
                  </button>
                </div>

                <p className="text-[11px] text-stone">
                  Se optimizarán automáticamente a WebP de alta fidelidad (máx 1280px, q84) antes de enviarse al formulario.
                </p>

                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={(e) => handleArchivosSeleccionados(e.target.files)}
                  className="hidden"
                />

                {previewsLocales.length > 0 && (
                  <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 pt-1">
                    {previewsLocales.map((src, i) => (
                      <div
                        key={i}
                        className="relative aspect-square rounded-xl overflow-hidden border border-stone-light group"
                      >
                        <Image
                          src={src}
                          alt={`Foto ${i + 1}`}
                          fill
                          className="object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => handleEliminarArchivo(i)}
                          className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/70 text-white text-[10px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                          title="Eliminar"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* VISTA 2: PREVIEW DE PREFILL ESTRUCTURADO */}
          {resultado && (
            <div className="space-y-4">
              <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-300 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-lg">✅</span>
                  <div>
                    <p className="text-xs font-bold text-emerald-950">
                      Ficha investigada y estructurada exitosamente
                    </p>
                    <p className="text-[11px] text-emerald-800">
                      Revisa el resumen antes de transferirlo al formulario canónico.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setResultado(null)}
                  className="text-xs font-bold text-emerald-900 underline cursor-pointer"
                >
                  Editar entrada
                </button>
              </div>

              {/* Ficha Resumen */}
              <div className="p-4 rounded-2xl bg-white border border-stone-light/80 space-y-3 shadow-2xs">
                <div className="flex items-start gap-3">
                  {resultado.imagenPortadaUrl && (
                    <div className="relative w-20 h-20 rounded-2xl overflow-hidden border border-stone-light shrink-0">
                      <Image
                        src={resultado.imagenPortadaUrl}
                        alt="Portada"
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-forest text-white">
                        {resultado.entidad.toUpperCase()}
                      </span>
                      <span className="text-[10px] font-semibold bg-stone-light/50 px-2 py-0.5 rounded-full text-stone">
                        📍 {resultado.zonaSlug}
                      </span>
                      {typeof resultado.googleRating === "number" && (
                        <span className="text-[10px] font-bold text-amber-900 bg-amber-100 px-2 py-0.5 rounded-full">
                          ⭐ {resultado.googleRating.toFixed(1)} ({resultado.googleReviewsCount || 0} reseñas)
                        </span>
                      )}
                    </div>
                    <h4 className="font-serif text-base text-forest font-bold mt-1 truncate">
                      {resultado.titulo}
                    </h4>
                    <p className="text-xs text-stone line-clamp-2 mt-0.5">
                      {resultado.descripcion}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-stone-light/60 text-xs text-forest">
                  <div>
                    <span className="font-semibold text-stone">Negocio:</span>{" "}
                    <strong>{resultado.nombreNegocio}</strong>
                  </div>
                  <div>
                    <span className="font-semibold text-stone">WhatsApp:</span>{" "}
                    <strong>{resultado.whatsapp ? `+${resultado.whatsapp}` : "No detectado"}</strong>
                  </div>
                  {resultado.instagram && (
                    <div>
                      <span className="font-semibold text-stone">Instagram:</span>{" "}
                      <strong>@{resultado.instagram}</strong>
                    </div>
                  )}
                  {resultado.googleMapsUrl && (
                    <div className="truncate">
                      <span className="font-semibold text-stone">Google Maps:</span>{" "}
                      <a
                        href={resultado.googleMapsUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-terra underline"
                      >
                        Ver enlace
                      </a>
                    </div>
                  )}
                </div>

                {/* Resumen específico de Hospedajes */}
                {resultado.entidad === "hospedaje" && resultado.habitaciones && (
                  <div className="pt-2 border-t border-stone-light/60">
                    <p className="text-xs font-bold text-forest mb-1.5">
                      🛏️ Habitaciones detectadas ({resultado.habitaciones.length}):
                    </p>
                    <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                      {resultado.habitaciones.map((hab, idx) => (
                        <div
                          key={idx}
                          className="p-2 rounded-xl bg-cream/50 border border-stone-light/60 flex items-center justify-between text-xs"
                        >
                          <div>
                            <p className="font-bold text-forest">{hab.titulo}</p>
                            <p className="text-[10px] text-stone">
                              Capacidad: {hab.capacidad_max} pers. • {hab.badges?.map((b) => b.texto).join(", ")}
                            </p>
                          </div>
                          <span className="font-bold text-forest shrink-0">
                            ${hab.precio_noche_cop.toLocaleString("es-CO")} COP
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Resumen específico de Eventos */}
                {resultado.entidad === "evento" && (
                  <div className="pt-2 border-t border-stone-light/60 text-xs flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-stone">Categoría:</span>{" "}
                      <strong className="uppercase">{resultado.tipo || "TOURS"}</strong>
                    </div>
                    <div>
                      <span className="font-semibold text-stone">Precio:</span>{" "}
                      <strong>
                        {resultado.precio === 0
                          ? "Entrada Libre"
                          : `$${resultado.precio?.toLocaleString("es-CO")} COP`}
                      </strong>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer con Acciones */}
        <div className="px-5 sm:px-6 py-4 border-t border-stone-light/70 bg-cream/40 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-stone hover:text-forest transition-colors cursor-pointer"
          >
            Cancelar
          </button>

          {!resultado ? (
            <button
              type="button"
              disabled={isPending}
              onClick={handleEjecutarIngesta}
              className="px-5 py-2.5 rounded-2xl bg-forest hover:bg-forest/90 disabled:bg-stone text-white font-sans text-xs font-bold shadow-md transition-all active:scale-98 cursor-pointer flex items-center gap-2"
            >
              {isPending ? (
                <>
                  <span className="animate-spin text-sm">⏳</span>
                  <span>{loadingStep || "Procesando con IA..."}</span>
                </>
              ) : (
                <>
                  <span>✨</span>
                  <span>Investigar y Estructurar Ficha</span>
                </>
              )}
            </button>
          ) : (
            <button
              type="button"
              onClick={handleAplicarPrefill}
              className="px-6 py-2.5 rounded-2xl bg-terra hover:bg-terra-dark text-white font-sans text-xs font-bold shadow-md transition-all active:scale-98 cursor-pointer flex items-center gap-2"
            >
              <span>🪄</span>
              <span>Aplicar al Formulario (Prefill)</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
