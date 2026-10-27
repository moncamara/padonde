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
  const DOMINIO_OFICIAL = "https://www.padonde.lat";
  const [dominioBase, setDominioBase] = useState(DOMINIO_OFICIAL);
  const [aficheModal, setAficheModal] = useState<{
    isOpen: boolean;
    nombre: string;
    url: string;
    qrUrl: string;
    src: string;
  } | null>(null);

  // Garantizar que los códigos QR y afiches físicos NUNCA usen localhost,
  // incluso si el administrador está en un entorno local o de desarrollo.
  useEffect(() => {
    if (typeof window !== "undefined") {
      const origin = window.location.origin;
      // Solo si el origen es un dominio público real (no localhost ni IPs privadas)
      if (
        origin &&
        !origin.includes("localhost") &&
        !origin.includes("127.0.0.1") &&
        !origin.includes("0.0.0.0")
      ) {
        setDominioBase(origin);
      } else {
        setDominioBase(DOMINIO_OFICIAL);
      }
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
  const qrPngUrl = `https://api.qrserver.com/v1/create-qr-code/?size=1000x1000&margin=12&data=${encodeURIComponent(
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
                placeholder="Ej. Hostal Casa Loma, Café Central..."
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
                  placeholder="ej. recepcion-principal"
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
                {nombrePunto || "PaDónde"}
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
                    nombre: nombrePunto || "",
                    url: urlGenerada,
                    qrUrl: qrImageUrl,
                    src: slugFinal,
                  })
                }
                className="w-full sm:w-auto px-4 py-2 rounded-xl text-xs font-sans font-semibold bg-emerald-700 text-white hover:bg-emerald-800 transition-all flex items-center justify-center gap-1.5 shadow-xs cursor-pointer active:scale-95"
                title="Generar y previsualizar afiche o hablador completo (PDF o Imagen)"
              >
                <span>📄</span>
                <span>Generar Afiche (PDF / Imagen)</span>
              </button>

              <a
                href={qrPngUrl}
                target="_blank"
                download={`solo-qr-padonde-${slugFinal}.png`}
                className="w-full sm:w-auto px-4 py-2 rounded-xl text-xs font-sans font-semibold bg-white border border-stone-light text-forest hover:bg-stone-50 transition-all flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
                title="Descargar únicamente el código QR en imagen PNG de alta resolución"
              >
                <span>🖼️</span>
                <span>Solo QR (PNG)</span>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Puntos Físicos Estratégicos Pre-configurados */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-serif text-lg text-forest font-bold">
              Puntos Físicos Sugeridos
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
            const qrPresetUrl = `https://api.qrserver.com/v1/create-qr-code/?size=600x600&margin=10&data=${encodeURIComponent(
              urlPreset
            )}`;
            const qrPresetPngUrl = `https://api.qrserver.com/v1/create-qr-code/?size=1000x1000&margin=10&data=${encodeURIComponent(
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

                <div className="pt-3 border-t border-stone-light/60 flex flex-col gap-2">
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
                    className="w-full py-2 px-3 rounded-xl text-xs font-sans font-semibold text-emerald-900 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs active:scale-[0.99]"
                    title="Generar afiche o hablador completo (PDF o Imagen)"
                  >
                    <span>📄</span>
                    <span>Generar Afiche (PDF / Imagen)</span>
                  </button>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => handleCopiar(urlPreset, preset.id)}
                      className="py-1.5 px-2 rounded-xl text-xs font-sans font-medium text-forest bg-white border border-stone-light hover:bg-stone-50 transition-colors cursor-pointer flex items-center justify-center gap-1"
                    >
                      <span>{copiadoSrc === preset.id ? "✓" : "📋"}</span>
                      <span>{copiadoSrc === preset.id ? "Copiado" : "Copiar Link"}</span>
                    </button>

                    <a
                      href={qrPresetPngUrl}
                      target="_blank"
                      download={`solo-qr-${preset.src}.png`}
                      className="py-1.5 px-2 rounded-xl text-xs font-sans font-medium text-indigo-900 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 transition-colors flex items-center justify-center gap-1 cursor-pointer"
                      title="Descargar únicamente el código QR en imagen PNG"
                    >
                      <span>🖼️</span>
                      <span>Descargar QR</span>
                    </a>
                  </div>
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
