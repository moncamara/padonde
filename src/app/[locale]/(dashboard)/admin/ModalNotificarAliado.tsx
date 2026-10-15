"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";

export interface EventoNotificarData {
  id: string;
  titulo: string;
  negocioNombre: string;
  whatsapp: string;
}

interface ModalNotificarAliadoProps {
  evento: EventoNotificarData | null;
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Genera el texto del mensaje comercial y de bienvenida para el aliado.
 * Diseñado con tono cálido, halagador y con la semilla de suscripción futura.
 */
export function generarMensajeBienvenidaAliado(
  negocioNombre: string,
  tituloEvento: string,
  eventoId: string
): string {
  const urlPublicacion = `https://padonde.lat/es/minca/${eventoId}`;

  return `🌿 ¡Hola ${negocioNombre}! Un saludo muy especial desde PaDónde Minca.

Estuvimos viendo lo que compartieron en la comunidad y nos encantó su plan: "${tituloEvento}" ✨

Para apoyar el turismo local y la visibilidad de los proyectos de la montaña, nos tomamos el atrevimiento de subir su evento como cortesía de bienvenida en la nueva cartelera turística digital de Minca: PaDónde 📲

👉 Pueden ver cómo luce su publicación aquí:
${urlPublicacion}

Queremos pedirles un favor muy especial: ¿Podrían echarle un ojito y confirmarnos si todo está perfecto?
• Que los horarios y días coincidan con su agenda.
• Que el valor o condiciones de reserva estén al día.
• Y sobre todo... ¡que les encante cómo luce su imagen en la plataforma!

En PaDónde los viajeros buscan qué hacer hoy, mañana y los fines de semana, y cuando tocan en "Reservar" van directo a su WhatsApp, sin comisiones ni intermediarios. 💬

Esta publicación estará activa y destacada como cortesía de apertura. Échenle una mirada a toda la cartelera en https://padonde.lat y nos cuentan si desean ajustar cualquier detalle.

¡Un abrazo y muchos éxitos con este planazo! 🌿✨`;
}

export function ModalNotificarAliado({
  evento,
  isOpen,
  onClose,
}: ModalNotificarAliadoProps) {
  const [telefono, setTelefono] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [copiado, setCopiado] = useState(false);

  useEffect(() => {
    if (evento) {
      setTelefono(evento.whatsapp.replace(/\D/g, ""));
      setMensaje(
        generarMensajeBienvenidaAliado(
          evento.negocioNombre,
          evento.titulo,
          evento.id
        )
      );
      setCopiado(false);
    }
  }, [evento]);

  if (!isOpen || !evento) return null;

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-stone-light/80 my-8 overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-stone-light/70 bg-stone-light/20 flex items-center justify-between shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl">📲</span>
              <h2 className="font-serif text-lg sm:text-xl font-bold text-forest">
                Notificar a {evento.negocioNombre}
              </h2>
            </div>
            <p className="text-xs text-stone font-sans mt-0.5">
              Comparte el enlace de su publicación por WhatsApp para que revisen y aprueben los datos.
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
              type="tel"
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
              placeholder="573001234567"
              className="w-full px-3 py-2 rounded-xl border border-stone-light/80 bg-stone-50/50 text-forest text-sm font-sans focus:outline-none focus:ring-2 focus:ring-forest/20 focus:border-forest"
            />
          </div>

          {/* Vista previa del mensaje */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-forest">
                Mensaje personalizado (puedes editar antes de enviar):
              </label>
              <button
                type="button"
                onClick={handleCopiar}
                className="text-[11px] text-terra hover:underline font-medium cursor-pointer"
              >
                {copiado ? "✓ ¡Copiado al portapapeles!" : "📋 Copiar texto"}
              </button>
            </div>
            <textarea
              rows={11}
              value={mensaje}
              onChange={(e) => setMensaje(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-stone-light/80 bg-stone-50/50 text-stone-800 text-xs font-sans leading-relaxed focus:outline-none focus:ring-2 focus:ring-forest/20 focus:border-forest"
            />
          </div>

          {/* Resumen del enlace que recibirán */}
          <div className="p-3 rounded-xl bg-forest/5 border border-forest/15 flex items-center justify-between gap-3 text-xs">
            <div className="min-w-0">
              <p className="font-medium text-forest truncate">🔗 Link en vivo del evento:</p>
              <p className="text-[11px] text-stone truncate">
                https://padonde.lat/es/minca/{evento.id}
              </p>
            </div>
            <a
              href={`/minca/${evento.id}`}
              target="_blank"
              rel="noreferrer"
              className="text-[11px] text-terra font-semibold hover:underline shrink-0"
            >
              Probar link ↗
            </a>
          </div>
        </div>

        {/* Footer con acciones */}
        <div className="p-4 sm:p-5 border-t border-stone-light/70 bg-stone-50 flex items-center justify-end gap-2.5 shrink-0">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            className="text-xs"
          >
            Cancelar
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleCopiar}
            className="text-xs gap-1"
          >
            <span>{copiado ? "✓" : "📋"}</span>
            <span>{copiado ? "Copiado" : "Copiar mensaje"}</span>
          </Button>

          <a
            href={waUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-block"
          >
            <Button
              type="button"
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-xs gap-1.5 active:scale-95 transition-transform"
            >
              <span>💬</span>
              <span>Abrir WhatsApp</span>
            </Button>
          </a>
        </div>
      </div>
    </div>
  );
}
