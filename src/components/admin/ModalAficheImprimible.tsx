"use client";

import { useState } from "react";

interface ModalAficheImprimibleProps {
  isOpen: boolean;
  onClose: () => void;
  puntoNombre: string;
  urlDestino: string;
  qrImageUrl: string;
  srcParam: string;
}

export function ModalAficheImprimible({
  isOpen,
  onClose,
  puntoNombre,
  urlDestino,
  qrImageUrl,
  srcParam,
}: ModalAficheImprimibleProps) {
  const [formato, setFormato] = useState<"pared" | "mesa">("pared");

  if (!isOpen) return null;

  function handlePrint() {
    window.print();
  }

  const nombreLugar = puntoNombre.trim() || "Minca & Sierra Nevada";

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 print:p-0 print:bg-white print:static print:inset-auto">
      {/* Contenedor Modal (no se imprime el fondo oscuro ni los controles) */}
      <div className="bg-cream rounded-3xl max-w-2xl w-full shadow-2xl border border-stone-light/80 overflow-hidden flex flex-col max-h-[92vh] print:max-h-none print:max-w-none print:shadow-none print:border-none print:rounded-none">
        {/* Barra superior de controles (oculta al imprimir) */}
        <div className="p-4 sm:p-5 bg-white border-b border-stone-light/70 flex flex-wrap items-center justify-between gap-3 print:hidden">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl">📄</span>
              <h3 className="font-serif text-lg sm:text-xl text-forest font-bold">
                Afiche Turístico Multilingüe (Listo para Imprimir)
              </h3>
            </div>
            <p className="text-xs text-stone font-sans mt-0.5">
              Diseñado en <strong>4 idiomas (ES, EN, DE, FR)</strong> para que cualquier turista lo escanee en hostales o mesas.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Selector de tamaño / formato */}
            <div className="flex items-center p-1 bg-stone-light/40 rounded-xl text-xs font-sans">
              <button
                type="button"
                onClick={() => setFormato("pared")}
                className={[
                  "px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer",
                  formato === "pared"
                    ? "bg-white text-forest shadow-2xs font-semibold"
                    : "text-stone hover:text-forest",
                ].join(" ")}
              >
                Póster de Pared (A4 / Carta)
              </button>
              <button
                type="button"
                onClick={() => setFormato("mesa")}
                className={[
                  "px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer",
                  formato === "mesa"
                    ? "bg-white text-forest shadow-2xs font-semibold"
                    : "text-stone hover:text-forest",
                ].join(" ")}
              >
                Hablador de Mesa
              </button>
            </div>

            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs cursor-pointer transition-all active:scale-95"
            >
              <span>🖨️</span>
              <span>Imprimir / Guardar PDF</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 text-stone hover:text-forest rounded-xl hover:bg-stone-light/40 cursor-pointer"
              title="Cerrar vista previa"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Área de Visualización y Contenedor Imprimible */}
        <div className="overflow-y-auto p-4 sm:p-8 flex items-center justify-center bg-stone-200/40 print:p-0 print:bg-white print:overflow-visible">
          {/* ─────────────────────────────────────────────────────────────
              EL AFICHE REAL (Esta sección es la que se imprime y se guarda en PDF)
              ───────────────────────────────────────────────────────────── */}
          <div
            id="afiche-imprimible"
            className={[
              "print-afiche-container bg-white text-forest rounded-2xl sm:rounded-3xl shadow-xl print:shadow-none border-2 border-forest/30 print:border-forest/40 relative overflow-hidden flex flex-col justify-between transition-all",
              formato === "pared"
                ? "w-full max-w-[540px] p-6 sm:p-8 space-y-6"
                : "w-full max-w-[440px] p-5 sm:p-6 space-y-4",
            ].join(" ")}
            style={{ printColorAdjust: "exact", WebkitPrintColorAdjust: "exact" }}
          >
            {/* Marca de agua / decoración orgánica superior */}
            <div className="absolute top-0 left-0 right-0 h-3 bg-gradient-to-r from-forest via-terra to-forest" />

            {/* 1. Cabecera Institucional y Nombre del Punto */}
            <div className="text-center space-y-1.5 pt-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-forest/5 border border-forest/15">
                <span className="text-lg">🌿</span>
                <span className="font-serif text-base sm:text-lg font-bold tracking-tight text-forest">
                  PaDónde <span className="font-sans font-light text-xs text-stone">Minca</span>
                </span>
              </div>

              {nombreLugar && (
                <p className="text-[11px] sm:text-xs text-stone uppercase tracking-widest font-sans font-semibold pt-1">
                  📍 Punto Oficial: <span className="text-forest font-bold">{nombreLugar}</span>
                </p>
              )}
            </div>

            {/* 2. El Gancho Cuadrilingüe (Hook en 4 Idiomas) */}
            <div className="text-center space-y-2.5">
              <div className="space-y-1">
                <h1 className="font-serif text-2xl sm:text-3xl text-forest font-black tracking-tight leading-tight">
                  ¿Qué hacer hoy en Minca?
                </h1>
                <p className="font-serif italic text-base sm:text-lg text-terra font-bold">
                  What to do today in Minca?
                </p>
              </div>

              {/* Subtítulos en Alemán y Francés */}
              <div className="grid grid-cols-2 gap-2 max-w-sm mx-auto text-[11px] sm:text-xs font-sans text-forest/80 pt-1">
                <div className="bg-forest/5 p-1.5 rounded-lg border border-forest/10 font-medium">
                  🇩🇪 <em>Was geht heute in Minca?</em>
                </div>
                <div className="bg-forest/5 p-1.5 rounded-lg border border-forest/10 font-medium">
                  🇫🇷 <em>Que faire aujourd&apos;hui à Minca ?</em>
                </div>
              </div>
            </div>

            {/* 3. Escenario Central: Código QR Gigante y Nítido */}
            <div className="flex flex-col items-center justify-center my-1 sm:my-2">
              <div className="p-4 sm:p-5 bg-cream/60 rounded-3xl border-2 border-forest/20 shadow-md flex flex-col items-center relative">
                {/* Badge flotante animador */}
                <div className="absolute -top-3 px-3 py-0.5 bg-forest text-cream text-[10px] font-sans font-bold uppercase tracking-wider rounded-full shadow-xs flex items-center gap-1">
                  <span>📸</span>
                  <span>Escanear con tu cámara</span>
                </div>

                <img
                  src={qrImageUrl}
                  alt={`Código QR ${nombreLugar}`}
                  className="w-48 h-48 sm:w-56 sm:h-56 object-contain rounded-xl"
                  style={{ imageRendering: "pixelated" }}
                />

                <p className="text-[10px] sm:text-[11px] font-mono text-stone font-semibold mt-2">
                  padonde.lat/es/minca?src={srcParam}
                </p>
              </div>
            </div>

            {/* 4. Categorías Visuales Destacadas */}
            <div className="grid grid-cols-2 gap-2 text-center text-xs font-sans">
              <div className="p-2 rounded-xl bg-forest/5 border border-stone-light/80">
                <p className="font-bold text-forest text-xs">🎵 Música & Atardeceres</p>
                <p className="text-[10px] text-stone">Live Music · Live-Musik</p>
              </div>
              <div className="p-2 rounded-xl bg-forest/5 border border-stone-light/80">
                <p className="font-bold text-forest text-xs">🍫 Cacao & Café de Origen</p>
                <p className="text-[10px] text-stone">Cacao Tours · Kakao & Café</p>
              </div>
              <div className="p-2 rounded-xl bg-forest/5 border border-stone-light/80">
                <p className="font-bold text-forest text-xs">🦜 Cascadas & Aves</p>
                <p className="text-[10px] text-stone">Birding · Waterfalls</p>
              </div>
              <div className="p-2 rounded-xl bg-forest/5 border border-stone-light/80">
                <p className="font-bold text-forest text-xs">🧘 Yoga & Bienestar</p>
                <p className="text-[10px] text-stone">Sauna · Soundbath · Wellness</p>
              </div>
            </div>

            {/* 5. Pie de Página con Garantías y Facilidad */}
            <div className="pt-3 border-t border-stone-light/70 text-center space-y-1.5 font-sans">
              <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[11px] text-forest font-semibold">
                <span className="flex items-center gap-1">
                  <span>⚡</span> Sin descargar apps (Abre en tu navegador)
                </span>
                <span>·</span>
                <span className="flex items-center gap-1 text-emerald-800">
                  <span>💬</span> Reserva directa con anfitriones por WhatsApp
                </span>
              </div>
              <p className="text-[10px] text-stone">
                Cartelera turística comunitaria de Minca, Sierra Nevada de Santa Marta 🌿 <strong>www.padonde.lat</strong>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
