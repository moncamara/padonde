"use client";

import { useState, useEffect } from "react";
import type { ServicioEsencial } from "@/lib/types";

interface ModalNotificarAlianzaProps {
  servicio: ServicioEsencial | null;
  isOpen: boolean;
  onClose: () => void;
  zonaNombre?: string;
}

export function generarMensajeAlianzaEsencial(
  nombreComercial: string,
  tipoAcuerdo: string = "canje_afiche",
  zonaSlug: string = "minca",
  zonaNombre: string = "Minca"
): string {
  const slug = zonaSlug || "minca";
  const destino = zonaNombre || (slug === "mendihuaca" ? "Mendihuaca" : "Minca");
  const urlPublicacion = `https://www.padonde.lat/es/${slug}?tab=servicios`;

  const textoAcuerdo =
    tipoAcuerdo === "canje_afiche"
      ? "🤝 Alianza activa: Canje por Afiche / Talker QR oficial en su punto de atención."
      : tipoAcuerdo === "pago_mensual"
      ? "💎 Membresía comercial activa: Pauta destacada con botón de WhatsApp directo."
      : "🎁 Alianza de cortesía y visibilidad turística local.";

  return `🌿 ¡Hola ${nombreComercial}! Un saludo muy especial desde PaDónde ${destino}.

Queremos darles la bienvenida oficial como Aliado Esencial de la plataforma turística digital de ${destino} 📲

Ya pueden ver su punto publicado y verificado en la sección de "Info Útil & Servicios" de PaDónde:
👉 ${urlPublicacion}

Aquí los viajeros y turistas que llegan a ${destino} consultan información de transporte, efectivo, tiendas y servicios clave en tiempo real.

${textoAcuerdo}

Queremos pedirles un favor muy especial: ¿Podrían abrir el enlace y confirmarnos si sus horarios, ubicación y detalles están 100% al día?

¡Un abrazo y muchos éxitos con esta alianza para impulsar el turismo en la región! 🌿✨`;
}

export function ModalNotificarAlianza({
  servicio,
  isOpen,
  onClose,
  zonaNombre = "Minca",
}: ModalNotificarAlianzaProps) {
  const [telefono, setTelefono] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [copiado, setCopiado] = useState(false);

  useEffect(() => {
    if (servicio) {
      setTelefono(servicio.whatsapp || "57");
      const zonaSlug =
        servicio.zona_id === "zona-mendihuaca" ? "mendihuaca" : "minca";
      setMensaje(
        generarMensajeAlianzaEsencial(
          servicio.nombre_comercial,
          servicio.tipo_acuerdo,
          zonaSlug,
          zonaNombre
        )
      );
      setCopiado(false);
    }
  }, [servicio, zonaNombre]);

  if (!isOpen || !servicio) return null;

  const cleanPhone = telefono.replace(/\D/g, "");
  const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(mensaje)}`;

  const handleCopiar = async () => {
    try {
      await navigator.clipboard.writeText(mensaje);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2500);
    } catch {
      alert("No se pudo copiar automáticamente. Puedes seleccionar el texto.");
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150"
    >
      <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-stone-light/80 my-8 overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-stone-light/70 bg-stone-light/20 flex items-center justify-between shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl">📲</span>
              <h2 className="font-serif text-lg sm:text-xl font-bold text-forest">
                Notificar Alianza a {servicio.nombre_comercial}
              </h2>
            </div>
            <p className="text-xs text-stone font-sans mt-0.5">
              Comparte el enlace de su punto en PaDónde y confirma las condiciones de la alianza por WhatsApp.
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-stone-light/40 hover:bg-stone-light text-stone hover:text-forest flex items-center justify-center text-sm transition-all cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Contenido */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 font-sans text-xs flex-1">
          {/* Teléfono */}
          <div className="space-y-1">
            <label className="font-semibold text-forest flex items-center justify-between">
              <span>Número de WhatsApp del Aliado:</span>
              <span className="text-[10px] text-stone font-normal">
                (Código de país incluido, ej. 57)
              </span>
            </label>
            <input
              type="text"
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
              placeholder="573103690454"
              className="w-full p-2.5 rounded-xl border border-stone-light bg-stone-light/10 text-forest text-xs focus:ring-2 focus:ring-forest/20 outline-none"
            />
          </div>

          {/* Enlace que se compartirá */}
          <div className="p-3 rounded-xl bg-forest/5 border border-forest/15 space-y-1">
            <span className="text-[10px] font-semibold text-forest uppercase tracking-wider block">
              Enlace directo al aliado en PaDónde:
            </span>
            <code className="text-xs text-forest font-mono break-all font-semibold">
              https://www.padonde.lat/es/
              {servicio.zona_id === "zona-mendihuaca" ? "mendihuaca" : "minca"}
              ?tab=servicios
            </code>
          </div>

          {/* Mensaje */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-forest">
                Mensaje predefinido de bienvenida y confirmación:
              </label>
              <button
                type="button"
                onClick={handleCopiar}
                className="text-[11px] text-terra hover:text-terra-dark font-medium cursor-pointer"
              >
                {copiado ? "✓ ¡Copiado!" : "Copiar texto"}
              </button>
            </div>
            <textarea
              value={mensaje}
              onChange={(e) => setMensaje(e.target.value)}
              rows={10}
              className="w-full p-3 rounded-2xl border border-stone-light bg-stone-light/10 text-forest text-xs leading-relaxed focus:ring-2 focus:ring-forest/20 outline-none resize-none font-sans"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-6 border-t border-stone-light/70 bg-stone-light/10 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={handleCopiar}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-stone-light bg-white hover:bg-stone-light/30 text-stone font-semibold text-xs transition-all cursor-pointer text-center"
          >
            {copiado ? "✓ Texto Copiado" : "📋 Copiar Mensaje"}
          </button>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl border border-stone-light/80 hover:bg-stone-light/40 text-stone font-semibold text-xs transition-all cursor-pointer"
            >
              Cerrar
            </button>
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-forest hover:bg-forest/90 text-cream font-semibold text-xs tracking-wide shadow-md active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <span>💬</span>
              <span>Abrir WhatsApp</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
