"use client";

import { useState, useEffect } from "react";
import { ModalAficheImprimible } from "@/components/admin/ModalAficheImprimible";

interface PuntoPreset {
  id: string;
  nombre: string;
  tipo: "hostal" | "cafe" | "transporte" | "general";
  src: string;
  descripcion: string;
}

const PRESETS_MINCA: PuntoPreset[] = [
  {
    id: "promotor-estacion",
    nombre: "Promotor Estación de Transporte",
    tipo: "transporte",
    src: "promotor-estacion",
    descripcion: "Activación en calle y llegada de colectivos/vans",
  },
  {
    id: "rio-elemento",
    nombre: "Hostal Rio Elemento",
    tipo: "hostal",
    src: "hostal-rio-elemento",
    descripcion: "Recepción y mesas de desayuno",
  },
  {
    id: "cafe-duni",
    nombre: "Café Duni Minca",
    tipo: "cafe",
    src: "cafe-duni",
    descripcion: "Habladores en mesas principales",
  },
  {
    id: "casas-viejas",
    nombre: "Casas Viejas Lodge",
    tipo: "hostal",
    src: "casas-viejas",
    descripcion: "Zona de hamacas y bar",
  },
  {
    id: "casa-elemento",
    nombre: "Casa Elemento",
    tipo: "hostal",
    src: "casa-elemento",
    descripcion: "Mirador y recepción de visitantes",
  },
  {
    id: "paso-mango",
    nombre: "Paso del Mango",
    tipo: "general",
    src: "paso-mango",
    descripcion: "Punto de información turística",
  },
  {
    id: "terminal-minca",
    nombre: "Parada de Mototaxis Minca",
    tipo: "transporte",
    src: "mototaxis-minca",
    descripcion: "Entrada del pueblo al bajar de Santa Marta",
  },
];

export function AdminQRGenerator({ locale }: { locale: string }) {
  const [nombrePunto, setNombrePunto] = useState("");
  const [slugPersonalizado, setSlugPersonalizado] = useState("");
  const [zonaSeleccionada, setZonaSeleccionada] = useState("minca");
  const [copiadoSrc, setCopiadoSrc] = useState<string | null>(null);
  const [dominioBase, setDominioBase] = useState("https://padonde.lat");
  const [aficheModal, setAficheModal] = useState<{
    isOpen: boolean;
    nombre: string;
    url: string;
    qrUrl: string;
    src: string;
  } | null>(null);

  // Sincronizar origen del navegador tras montaje para evitar errores de hidratación SSR
  useEffect(() => {
    if (typeof window !== "undefined") {
      setDominioBase(window.location.origin);
    }
  }, []);

  // Generar slug automático a partir del nombre
  function handleNombreChange(val: string) {
    setNombrePunto(val);
    const autSlug = val
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_-]+/g, "-")
      .replace(/^-+|-+$/g, "");
    setSlugPersonalizado(autSlug);
  }

  const slugFinal = slugPersonalizado || "punto-fisico";
  const urlGenerada = `${dominioBase}/${locale}/${zonaSeleccionada}?src=${slugFinal}`;
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&margin=12&data=${encodeURIComponent(
    urlGenerada
  )}`;

  function handleCopiar(texto: string, id: string) {
    navigator.clipboard.writeText(texto);
    setCopiadoSrc(id);
    setTimeout(() => setCopiadoSrc(null), 2500);
  }

  return (
    <div className="space-y-6">
      {/* Creador de QR Personalizado */}
      <div className="bg-white/80 p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-stone-light/80 shadow-xs space-y-5">
        <div>
          <h2 className="font-serif text-lg sm:text-xl text-forest font-bold">
            Generador de Códigos QR para Afiches y Mesas
          </h2>
          <p className="font-sans text-xs text-stone mt-1">
            Crea un enlace con etiqueta de origen única para colocar en habladores de mesa,
            stickers o recepción de hostales.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          {/* Formulario de Entrada */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-forest mb-1">
                Nombre del Punto o Aliado
              </label>
              <input
                type="text"
                value={nombrePunto}
                onChange={(e) => handleNombreChange(e.target.value)}
                placeholder="Ej. Hostal Casa Loma, Café Minca..."
                className="w-full px-3.5 py-2 text-xs bg-white rounded-xl border border-stone-light/80 placeholder:text-stone/60 focus:outline-none focus:ring-1 focus:ring-forest text-forest"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-forest mb-1">
                  Zona Destino
                </label>
                <select
                  value={zonaSeleccionada}
                  onChange={(e) => setZonaSeleccionada(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white rounded-xl border border-stone-light/80 focus:outline-none focus:ring-1 focus:ring-forest text-forest cursor-pointer"
                >
                  <option value="minca">🌿 Minca</option>
                  <option value="mendihuaca">🌊 Mendihuaca</option>
                  <option value="tairona">🌴 Tairona</option>
                  <option value="santa-marta">🌊 Santa Marta</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-forest mb-1">
                  Código de Origen (src)
                </label>
                <input
                  type="text"
                  value={slugPersonalizado}
                  onChange={(e) => setSlugPersonalizado(e.target.value)}
                  placeholder="ej. casa-loma"
                  className="w-full px-3 py-2 text-xs bg-white rounded-xl border border-stone-light/80 focus:outline-none focus:ring-1 focus:ring-forest text-forest font-mono text-[11px]"
                />
              </div>
            </div>

            {/* URL Resultante */}
            <div>
              <label className="block text-xs font-semibold text-forest mb-1">
                Enlace con Atribución Generado
              </label>
              <div className="flex items-center gap-2 p-2 bg-stone-light/30 rounded-xl border border-stone-light/60">
                <p
                  suppressHydrationWarning
                  className="font-mono text-[11px] text-forest/90 break-all flex-1 select-all"
                >
                  {urlGenerada}
                </p>
                <button
                  type="button"
                  onClick={() => handleCopiar(urlGenerada, "custom")}
                  className="px-3 py-1.5 rounded-lg text-xs font-sans font-semibold bg-white border border-stone-light hover:bg-stone-50 transition-colors cursor-pointer text-forest shrink-0"
                >
                  {copiadoSrc === "custom" ? "✓ Copiado" : "📋 Copiar"}
                </button>
              </div>
            </div>
          </div>

          {/* Previsualización del QR y Descarga */}
          <div className="flex flex-col items-center justify-center p-5 bg-white rounded-2xl border border-stone-light/70 text-center space-y-3">
            <div className="p-3 bg-cream/50 rounded-2xl border border-stone-light/60 shadow-2xs">
              {/* QR Image */}
              <img
                src={qrImageUrl}
                alt={`QR para ${nombrePunto || "PaDónde"}`}
                className="w-44 h-44 sm:w-52 sm:h-52 object-contain rounded-lg"
              />
            </div>

            <div className="space-y-1">
              <p className="font-serif text-sm text-forest font-bold">
                {nombrePunto || "PaDónde Minca"}
              </p>
              <p className="font-mono text-[10px] text-stone">
                ?src={slugFinal}
              </p>
            </div>

            <div className="w-full flex flex-col sm:flex-row items-center justify-center gap-2 pt-1">
              <button
                type="button"
                onClick={() =>
                  setAficheModal({
                    isOpen: true,
                    nombre: nombrePunto || "PaDónde Minca",
                    url: urlGenerada,
                    qrUrl: qrImageUrl,
                    src: slugFinal,
                  })
                }
                className="w-full sm:w-auto px-4 py-2 rounded-xl text-xs font-sans font-semibold bg-emerald-700 text-white hover:bg-emerald-800 transition-all flex items-center justify-center gap-1.5 shadow-xs cursor-pointer active:scale-95"
              >
                <span>📄</span>
                <span>Generar Afiche / PDF</span>
              </button>

              <a
                href={qrImageUrl}
                target="_blank"
                download={`qr-padonde-${slugFinal}.png`}
                className="w-full sm:w-auto px-4 py-2 rounded-xl text-xs font-sans font-semibold bg-white border border-stone-light text-forest hover:bg-stone-50 transition-all flex items-center justify-center gap-1.5 shadow-2xs"
              >
                <span>📥</span>
                <span>Descargar PNG</span>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Puntos Físicos Estratégicos Pre-configurados en Minca */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-serif text-lg text-forest font-bold">
              Puntos Físicos Sugeridos en Minca
            </h3>
            <p className="font-sans text-xs text-stone mt-0.5">
              Ubicaciones clave con alto tráfico turístico donde ubicar afiches o material POP.
            </p>
          </div>
          <span className="text-xs text-stone font-sans">
            <strong>{PRESETS_MINCA.length}</strong> puntos
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {PRESETS_MINCA.map((preset) => {
            const urlPreset = `${dominioBase}/${locale}/minca?src=${preset.src}`;
            const qrPresetUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&margin=10&data=${encodeURIComponent(
              urlPreset
            )}`;

            return (
              <article
                key={preset.id}
                className="bg-white/80 rounded-2xl p-4 border border-stone-light/80 shadow-xs flex flex-col justify-between gap-3 hover:border-stone transition-all"
              >
                <div className="space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="font-serif text-base text-forest font-bold truncate">
                      {preset.nombre}
                    </h4>
                    <span className="text-[10px] bg-stone-100 text-stone-700 px-2 py-0.5 rounded-full capitalize font-sans">
                      {preset.tipo}
                    </span>
                  </div>
                  <p className="text-xs text-stone font-sans">{preset.descripcion}</p>
                  <p className="font-mono text-[10px] text-emerald-700">
                    ?src={preset.src}
                  </p>
                </div>

                <div className="pt-2 border-t border-stone-light/50 flex items-center justify-between gap-1.5 flex-wrap sm:flex-nowrap">
                  <button
                    type="button"
                    onClick={() => handleCopiar(urlPreset, preset.id)}
                    className="flex-1 py-1.5 px-2.5 rounded-xl text-xs font-sans font-medium text-forest bg-white border border-stone-light hover:bg-stone-50 transition-colors cursor-pointer text-center"
                  >
                    {copiadoSrc === preset.id ? "✓ Copiado" : "📋 Enlace"}
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setAficheModal({
                        isOpen: true,
                        nombre: preset.nombre,
                        url: urlPreset,
                        qrUrl: qrPresetUrl,
                        src: preset.src,
                      })
                    }
                    className="py-1.5 px-3 rounded-xl text-xs font-sans font-semibold text-emerald-800 bg-emerald-50 border border-emerald-300 hover:bg-emerald-100 transition-colors flex items-center gap-1 shrink-0 cursor-pointer shadow-2xs"
                    title="Generar afiche o hablador imprimible para este punto"
                  >
                    <span>📄</span>
                    <span>Afiche PDF</span>
                  </button>

                  <a
                    href={qrPresetUrl}
                    target="_blank"
                    download={`qr-minca-${preset.src}.png`}
                    className="py-1.5 px-2.5 rounded-xl text-xs font-sans font-medium text-stone bg-white border border-stone-light hover:bg-stone-50 transition-colors flex items-center gap-1 shrink-0"
                    title="Descargar solo imagen del código QR"
                  >
                    <span>🖼️</span>
                    <span>PNG</span>
                  </a>
                </div>
              </article>
            );
          })}
        </div>
      </div>

      {/* Modal de Previsualización e Impresión de Afiches en 4 Idiomas */}
      {aficheModal && (
        <ModalAficheImprimible
          isOpen={aficheModal.isOpen}
          onClose={() => setAficheModal(null)}
          puntoNombre={aficheModal.nombre}
          urlDestino={aficheModal.url}
          qrImageUrl={aficheModal.qrUrl}
          srcParam={aficheModal.src}
        />
      )}
    </div>
  );
}
