"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";

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

  const nombreZona = zona === "mendihuaca" ? "Mendihuaca" : "Minca";
  const urlCartelera = `https://www.padonde.lat/es/${zona}`;

  // Plantillas de prospección según audio
  const plantillas: Record<CategoriaMensaje, { titulo: string; icon: string; texto: string }> = {
    hospedajes: {
      titulo: "Hospedajes, Cabañas & Glampings",
      icon: "🏡",
      texto: `🌿 ¡Hola! Qué gusto saludarte.

Te escribo porque estamos impulsando PaDónde (${urlCartelera}), la cartelera digital turística en vivo de ${nombreZona}. 📲✨

Diseñamos un espacio exclusivo para hospedajes donde los viajeros pueden ver tus fotos, servicios y cotizar tarifas por noche, con una gran ventaja: cuando el turista toca en "Consultar Disponibilidad", el mensaje te llega DIRECTO a tu WhatsApp, sin comisiones ni intermediarios de reservas.

Échale una mirada a cómo luce la vitrina aquí:
👉 ${urlCartelera}

Si te gustaría que tu hospedaje aparezca visible ante los turistas que están llegando a la zona, avísame y con todo gusto coordinamos una visita o te ayudo a montarlo en 5 minutos. ¡Un abrazo! 🏡🍃`,
    },
    tiendas: {
      titulo: "Tiendas, Restaurantes & Servicios",
      icon: "🏪",
      texto: `👋 ¡Hola! ¿Cómo estás? Un saludo especial.

Te contacto rápidamente porque estamos lanzando la sección de "Servicios Esenciales e Info Útil" dentro de PaDónde (${urlCartelera}), la plataforma turística que están consultando los viajeros en ${nombreZona}. 📲

Muchos turistas a diario preguntan dónde retirar efectivo, comprar víveres, conseguir transporte, farmacia o comer rico. Queremos que tu negocio esté mapeado como punto oficial para que los viajeros te encuentren fácil y te escriban directo al WhatsApp cuando necesiten lo que ofreces.

Puedes ver la cartelera aquí:
👉 ${urlCartelera}

Si quieres que te incluyamos en el directorio comercial de la zona, me avisas y te paso a visitar para dejarte registrado. ¡Muchos éxitos en las ventas! 🛒✨`,
    },
    eventos: {
      titulo: "Eventos, Tours & Actividades",
      icon: "🎭",
      texto: `✨ ¡Hola! Espero que todo vaya excelente.

Te escribo porque en PaDónde (${urlCartelera}) tenemos la cartelera turística en vivo donde los viajeros y locales consultan qué planes, eventos, talleres, tours o rumba hay hoy y el fin de semana en ${nombreZona}. 🌿🎉

La idea es que puedas publicar tus actividades y fechas para que los turistas se agenden y reserven cupos directamente contigo por WhatsApp.

Mira la agenda aquí:
👉 ${urlCartelera}

Si tienes planes programados para estos días y quieres promocionarlos en la cartelera, respóndeme este mensaje y te ayudo a publicarlos o paso por tu local y lo revisamos juntos. 📲🚀`,
    },
    general: {
      titulo: "Mensaje General / Invitación a la Comunidad",
      icon: "🌿",
      texto: `Hola, ¿cómo te ha ido? Espero que estés muy bien.

Te comparto un proyecto muy bonito y serio que acabamos de lanzar para fortalecer el turismo local: se llama PaDónde (${urlCartelera}) 🌿

Es una plataforma en vivo donde los turistas que llegan a la estación de busetas y hostales escanean códigos QR y encuentran planes, hospedajes y servicios recomendados sin intermediarios.

Pégale una miradita para que conozcas la iniciativa:
👉 ${urlCartelera}

Si te interesa hacer parte de la comunidad o crees que a tu negocio le sirve esta visibilidad, me confirmas por acá y con mucho gusto te visito o nos tomamos un café para contarte los detalles. ¡Un abrazo! 🙌`,
    },
  };

  const plantillaActual = plantillas[categoria];

  const handleCopiar = async () => {
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(plantillaActual.texto);
        setCopiado(true);
        setTimeout(() => setCopiado(false), 2500);
      }
    } catch {
      // Fallback
    }
  };

  const getWaLink = () => {
    const telLimpio = telefono.replace(/\D/g, "");
    const base = telLimpio
      ? `https://api.whatsapp.com/send?phone=${telLimpio.startsWith("57") ? telLimpio : `57${telLimpio}`}&text=`
      : `https://api.whatsapp.com/send?text=`;
    return `${base}${encodeURIComponent(plantillaActual.texto)}`;
  };

  return (
    <>
      {/* Botón de apertura en el panel */}
      <Button
        type="button"
        onClick={() => setAbierto(true)}
        className="bg-emerald-700 hover:bg-emerald-800 text-white font-sans text-xs font-semibold px-3.5 py-2 rounded-xl shadow-xs flex items-center gap-2 cursor-pointer active:scale-95 transition-all"
      >
        <span>📲</span>
        <span>Kit de Prospección WhatsApp</span>
      </Button>

      {/* Modal */}
      {abierto && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setAbierto(false)}
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-2xl bg-cream rounded-3xl p-4 sm:p-6 shadow-2xl border border-stone-light/80 space-y-4 my-auto max-h-[92vh] flex flex-col"
          >
            {/* Header del Modal */}
            <div className="flex items-center justify-between pb-3 border-b border-stone-light/70 shrink-0">
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

            {/* Selector de Destino */}
            <div className="flex items-center justify-between gap-2 shrink-0 bg-white/70 p-2 rounded-2xl border border-stone-light/60">
              <span className="text-xs font-semibold text-forest font-sans ml-1">
                Destino a recomendar:
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setZona("minca")}
                  className={`px-3 py-1 rounded-xl text-xs font-sans font-medium transition-all cursor-pointer ${
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
                  className={`px-3 py-1 rounded-xl text-xs font-sans font-medium transition-all cursor-pointer ${
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
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 shrink-0">
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
                  className={`p-2.5 rounded-2xl text-left border transition-all cursor-pointer ${
                    categoria === tab.id
                      ? "bg-white border-forest/40 shadow-xs ring-1 ring-forest/20"
                      : "bg-white/40 border-stone-light/60 hover:bg-white text-stone"
                  }`}
                >
                  <span className="text-lg block mb-0.5">{tab.icon}</span>
                  <p
                    className={`text-xs font-sans font-medium truncate ${
                      categoria === tab.id ? "text-forest font-bold" : "text-stone"
                    }`}
                  >
                    {tab.label}
                  </p>
                </button>
              ))}
            </div>

            {/* Caja de Texto del Mensaje */}
            <div className="space-y-1.5 flex-1 min-h-0 flex flex-col">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-forest font-sans flex items-center gap-1.5">
                  <span>{plantillaActual.icon}</span>
                  <span>Mensaje para {plantillaActual.titulo}:</span>
                </label>
                <button
                  type="button"
                  onClick={handleCopiar}
                  className="text-xs text-terra hover:text-terra-dark font-medium cursor-pointer"
                >
                  {copiado ? "✓ ¡Copiado!" : "📋 Copiar texto"}
                </button>
              </div>

              <textarea
                readOnly
                value={plantillaActual.texto}
                rows={10}
                className="w-full flex-1 p-3 rounded-2xl border border-stone-light/80 bg-white text-stone-800 text-xs font-sans leading-relaxed resize-none focus:outline-none focus:ring-1 focus:ring-forest/30"
              />
            </div>

            {/* Input opcional de teléfono de WhatsApp */}
            <div className="shrink-0 pt-1">
              <label className="block text-[11px] text-stone font-sans mb-1">
                Teléfono del contacto (opcional para abrir su chat directo):
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="tel"
                  placeholder="Ej: 3001234567"
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                  className="flex-1 px-3 py-1.5 rounded-xl border border-stone-light/80 bg-white text-xs font-sans text-stone-800 focus:outline-none focus:ring-1 focus:ring-forest/30"
                />
              </div>
            </div>

            {/* Footer con Acciones */}
            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-stone-light/70 shrink-0">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setAbierto(false)}
                className="text-xs"
              >
                Cerrar
              </Button>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleCopiar}
                className="text-xs gap-1.5"
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
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-xs gap-1.5 active:scale-95 transition-transform"
                >
                  <span>💬</span>
                  <span>Abrir en WhatsApp</span>
                </Button>
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
