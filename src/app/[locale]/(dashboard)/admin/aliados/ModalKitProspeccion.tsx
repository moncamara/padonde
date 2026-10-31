"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/Button";
import { generarMensajeProspeccion } from "@/lib/whatsapp/templates";
import { buildWhatsAppUrl, copyToClipboard } from "@/lib/whatsapp/url";

interface ModalKitProspeccionProps {
  zonaInicial?: string;
}

type CategoriaMensaje = "hospedajes" | "tiendas" | "eventos" | "general";

export function ModalKitProspeccion({ zonaInicial = "minca" }: ModalKitProspeccionProps) {
  const [abierto, setAbierto] = useState(false);
  const [zona, setZona] = useState<string>(zonaInicial);
  const [categoria, setCategoria] = useState<CategoriaMensaje>("hospedajes");
  const [copiado, setCopiado] = useState(false);
  const [telefono, setTelefono] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Bloquear scroll de la página de fondo cuando el modal esté abierto
  useEffect(() => {
    if (abierto) {
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prevOverflow;
      };
    }
  }, [abierto]);

  // Cerrar al presionar la tecla Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setAbierto(false);
    };
    if (abierto) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [abierto]);

  const zonaNombre = zona === "mendihuaca" ? "Mendihuaca" : "Minca";
  const urlCartelera = `https://www.padonde.lat/es/${zona}`;

  // Plantillas de prospección canónicas desde templates.ts
  const plantillas: Record<CategoriaMensaje, { titulo: string; icon: string; texto: string }> = {
    hospedajes: {
      titulo: "Hospedajes, Cabañas & Glampings",
      icon: "🏡",
      texto: generarMensajeProspeccion("hospedajes", {
        negocioNombre: "",
        zonaSlug: zona,
        zonaNombre,
        enlacePersonalizado: urlCartelera,
      }),
    },
    tiendas: {
      titulo: "Tiendas, Restaurantes & Servicios",
      icon: "🏪",
      texto: generarMensajeProspeccion("tiendas", {
        negocioNombre: "",
        zonaSlug: zona,
        zonaNombre,
        enlacePersonalizado: urlCartelera,
      }),
    },
    eventos: {
      titulo: "Eventos, Tours & Actividades",
      icon: "🎭",
      texto: generarMensajeProspeccion("eventos", {
        negocioNombre: "",
        zonaSlug: zona,
        zonaNombre,
        enlacePersonalizado: urlCartelera,
      }),
    },
    general: {
      titulo: "Mensaje General / Invitación a la Comunidad",
      icon: "🌿",
      texto: generarMensajeProspeccion("general", {
        negocioNombre: "",
        zonaSlug: zona,
        zonaNombre,
        enlacePersonalizado: urlCartelera,
      }),
    },
  };

  const plantillaActual = plantillas[categoria];

  const handleCopiar = async () => {
    const ok = await copyToClipboard(plantillaActual.texto);
    if (ok) {
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2500);
    }
  };

  const getWaLink = () => {
    return buildWhatsAppUrl({
      phone: telefono,
      message: plantillaActual.texto,
    });
  };

  return (
    <>
      {/* Botón de apertura en el panel */}
      <Button
        type="button"
        onClick={() => setAbierto(true)}
        className="w-full h-full bg-emerald-700 hover:bg-emerald-800 text-white font-sans text-xs font-semibold px-3 py-2 rounded-xl shadow-xs flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 transition-all whitespace-nowrap"
      >
        <span>📲</span>
        <span>Kit de Prospección</span>
      </Button>

      {/* Modal montado directamente en document.body para quedar encima de todo */}
      {mounted && abierto && createPortal(
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setAbierto(false)}
          className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-2xl bg-cream rounded-3xl shadow-2xl border border-stone-light/80 my-auto flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-150"
          >
            {/* Header del Modal (Fijo arriba) */}
            <div className="p-4 sm:p-5 border-b border-stone-light/70 bg-stone-light/20 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <span className="text-2xl">📲</span>
                <div>
                  <h2 className="font-serif text-lg sm:text-xl font-bold text-forest">
                    Kit de Prospección WhatsApp
                  </h2>
                  <p className="text-xs text-stone font-sans">
                    Mensajes predefinidos para enviar a dueños de negocios antes de visitarlos
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setAbierto(false)}
                className="w-8 h-8 rounded-full bg-stone-light/40 hover:bg-stone-light/70 text-forest flex items-center justify-center text-sm font-bold transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Cuerpo con scroll independiente */}
            <div className="p-4 sm:p-6 overflow-y-auto space-y-4 font-sans text-xs flex-1">
              {/* Selector de Destino */}
              <div className="flex items-center justify-between gap-2 bg-white/80 p-2.5 rounded-2xl border border-stone-light/60 shadow-2xs">
                <span className="text-xs font-semibold text-forest font-sans ml-1">
                  Destino a recomendar:
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setZona("minca")}
                    className={`px-3 py-1.5 rounded-xl text-xs font-sans font-medium transition-all cursor-pointer ${
                      zona === "minca"
                        ? "bg-forest text-white font-semibold shadow-2xs"
                        : "bg-cream text-stone hover:text-forest"
                    }`}
                  >
                    🌿 Minca
                  </button>
                  <button
                    type="button"
                    onClick={() => setZona("mendihuaca")}
                    className={`px-3 py-1.5 rounded-xl text-xs font-sans font-medium transition-all cursor-pointer ${
                      zona === "mendihuaca"
                        ? "bg-forest text-white font-semibold shadow-2xs"
                        : "bg-cream text-stone hover:text-forest"
                    }`}
                  >
                    🌊 Mendihuaca
                  </button>
                </div>
              </div>

              {/* Pestañas de Tipo de Negocio */}
              <div>
                <label className="block text-xs font-semibold text-forest mb-2">
                  Tipo de Negocio / Enfoque:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {(
                    [
                      { id: "hospedajes", label: "Hospedajes", icon: "🏡" },
                      { id: "tiendas", label: "Tiendas / Servicios", icon: "🏪" },
                      { id: "eventos", label: "Eventos / Planes", icon: "🎭" },
                      { id: "general", label: "General", icon: "🌿" },
                    ] as const
                  ).map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setCategoria(tab.id)}
                      className={`p-3 rounded-2xl text-left border transition-all cursor-pointer ${
                        categoria === tab.id
                          ? "bg-white border-forest shadow-xs ring-2 ring-forest/20 text-forest"
                          : "bg-white/50 border-stone-light/70 hover:bg-white text-stone"
                      }`}
                    >
                      <span className="text-xl block mb-1">{tab.icon}</span>
                      <p
                        className={`text-xs font-sans font-semibold truncate ${
                          categoria === tab.id ? "text-forest" : "text-stone"
                        }`}
                      >
                        {tab.label}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Caja de Texto del Mensaje con altura explícita garantizada */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-forest font-sans flex items-center gap-1.5">
                    <span>{plantillaActual.icon}</span>
                    <span>Mensaje para {plantillaActual.titulo}:</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleCopiar}
                    className="text-xs text-terra hover:text-terra-dark font-bold cursor-pointer transition-colors"
                  >
                    {copiado ? "✓ ¡Copiado al portapapeles!" : "📋 Copiar texto"}
                  </button>
                </div>

                <textarea
                  readOnly
                  value={plantillaActual.texto}
                  className="w-full h-64 sm:h-72 min-h-[220px] p-3.5 rounded-2xl border border-stone-light/80 bg-white text-stone-800 text-xs font-sans leading-relaxed resize-y focus:outline-none focus:ring-2 focus:ring-forest/20 shadow-inner"
                />
              </div>

              {/* Input opcional de teléfono de WhatsApp */}
              <div className="bg-white/70 p-3 rounded-2xl border border-stone-light/60 space-y-1.5">
                <label className="block text-xs font-semibold text-forest font-sans">
                  Teléfono WhatsApp del contacto (opcional):
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-stone font-semibold px-2 py-1.5 bg-stone-light/30 rounded-xl">
                    🇨🇴 +57
                  </span>
                  <input
                    type="tel"
                    placeholder="Ej: 3173085270 (sin espacios ni guiones)"
                    value={telefono}
                    onChange={(e) => setTelefono(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-xl border border-stone-light/80 bg-white text-xs font-sans text-stone-800 focus:outline-none focus:ring-2 focus:ring-forest/20"
                  />
                </div>
                <p className="text-[11px] text-stone font-sans">
                  Si escribes el número, el botón verde abrirá directamente el chat de WhatsApp con el texto ya redactado.
                </p>
              </div>
            </div>

            {/* Footer con Acciones (Fijo abajo) */}
            <div className="p-3 sm:p-4 border-t border-stone-light/70 bg-stone-light/20 flex flex-wrap items-center justify-end gap-2 shrink-0">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setAbierto(false)}
                className="text-xs cursor-pointer"
              >
                Cerrar
              </Button>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleCopiar}
                className="text-xs gap-1.5 cursor-pointer font-semibold text-stone-800"
              >
                <span>{copiado ? "✓" : "📋"}</span>
                <span>{copiado ? "¡Copiado!" : "Copiar Mensaje"}</span>
              </Button>

              <a
                href={getWaLink()}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block"
              >
                <Button
                  type="button"
                  size="sm"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-xs gap-1.5 active:scale-95 transition-transform cursor-pointer"
                >
                  <span>💬</span>
                  <span>Abrir en WhatsApp</span>
                </Button>
              </a>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
