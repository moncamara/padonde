"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";

export interface EventoNotificarData {
  id: string;
  titulo: string;
  negocioNombre: string;
  whatsapp: string;
  zonaSlug?: string;
  zonaNombre?: string;
  esPrimerEvento?: boolean;
}

interface ModalNotificarAliadoProps {
  evento: EventoNotificarData | null;
  isOpen: boolean;
  onClose: () => void;
}

export type TipoMensajeAliado = "revision" | "bienvenida";

/**
 * Formatea un número telefónico para lectura humana amigable (ej: +57 301 301 0194)
 */
export function formatearTelefonoVisual(telefono?: string): string {
  if (!telefono) return "";
  const clean = telefono.replace(/\D/g, "");
  if (!clean) return "";
  if (clean.startsWith("57") && clean.length === 12) {
    return `+57 ${clean.slice(2, 5)} ${clean.slice(5, 8)} ${clean.slice(8)}`;
  }
  if (clean.length === 10) {
    return `+57 ${clean.slice(0, 3)} ${clean.slice(3, 6)} ${clean.slice(6)}`;
  }
  return `+${clean}`;
}

/**
 * Mensaje estándar para eventos compartidos por el aliado o publicaciones recurrentes.
 * Tono cercano, ágil y enfocado en revisión/confirmación y tráfico a WhatsApp.
 */
export function generarMensajeRevisionAliado(
  negocioNombre: string,
  tituloEvento: string,
  eventoId: string,
  zonaSlug?: string,
  zonaNombre?: string,
  whatsapp?: string
): string {
  const slug = zonaSlug || "minca";
  const destinoNombre = zonaNombre || (slug === "mendihuaca" ? "Mendihuaca" : "Minca");
  const urlPublicacion = `https://www.padonde.lat/es/${slug}/${eventoId}`;
  const urlCartelera = `https://www.padonde.lat/es/${slug}`;
  const wpVisual = formatearTelefonoVisual(whatsapp);
  const textoWhatsapp = wpVisual ? ` (${wpVisual})` : "";

  return `🌿 ¡Hola ${negocioNombre}! Un saludo muy especial desde PaDónde ${destinoNombre}.

¡Ya está lista y publicada la información de su evento: "${tituloEvento}" en la cartelera digital! 📲✨

👉 Pueden ver cómo luce su publicación aquí:
${urlPublicacion}

Les compartimos el enlace para que puedan echarle un ojito y confirmarnos si todo está perfecto:
• Que los horarios y días coincidan con su agenda.
• Que el valor o condiciones de reserva estén al día.
• Que su WhatsApp registrado para recibir reservas sea el correcto${textoWhatsapp}.
• Y sobre todo... ¡que les encante cómo luce su imagen en la plataforma!

En PaDónde los viajeros buscan qué hacer hoy, mañana y los fines de semana, y cuando tocan en "Reservar" van directo a su WhatsApp${textoWhatsapp}, sin comisiones ni intermediarios. 💬

Pueden compartir este enlace en sus historias o redes para que la comunidad y turistas se enteren. Échenle una mirada a toda la cartelera en ${urlCartelera} y nos cuentan si desean ajustar cualquier detalle.

¡Un abrazo y muchos éxitos con este planazo! 🌿🚀`;
}

/**
 * Genera el texto del mensaje comercial y de bienvenida para el aliado por cortesía inicial (1ª vez).
 * Diseñado con tono cálido, halagador y con la semilla de cortesía de apertura.
 */
export function generarMensajeBienvenidaAliado(
  negocioNombre: string,
  tituloEvento: string,
  eventoId: string,
  zonaSlug?: string,
  zonaNombre?: string,
  whatsapp?: string
): string {
  const slug = zonaSlug || "minca";
  const destinoNombre = zonaNombre || (slug === "mendihuaca" ? "Mendihuaca" : "Minca");
  const urlPublicacion = `https://www.padonde.lat/es/${slug}/${eventoId}`;
  const urlCartelera = `https://www.padonde.lat/es/${slug}`;
  const wpVisual = formatearTelefonoVisual(whatsapp);
  const textoWhatsapp = wpVisual ? ` (${wpVisual})` : "";

  return `🌿 ¡Hola ${negocioNombre}! Un saludo muy especial desde PaDónde ${destinoNombre}.

Estuvimos viendo lo que compartieron en la comunidad y nos encantó su plan: "${tituloEvento}" ✨

Para apoyar el turismo local y la visibilidad de los proyectos de la región, nos tomamos el atrevimiento de subir su evento como cortesía de bienvenida en la nueva cartelera turística digital de ${destinoNombre}: PaDónde 📲

👉 Pueden ver cómo luce su publicación aquí:
${urlPublicacion}

Queremos pedirles un favor muy especial: ¿Podrían echarle un ojito y confirmarnos si todo está perfecto?
• Que los horarios y días coincidan con su agenda.
• Que el valor o condiciones de reserva estén al día.
• Que su WhatsApp registrado para recibir reservas sea el correcto${textoWhatsapp}.
• Y sobre todo... ¡que les encante cómo luce su imagen en la plataforma!

En PaDónde los viajeros buscan qué hacer hoy, mañana y los fines de semana, y cuando tocan en "Reservar" van directo a su WhatsApp${textoWhatsapp}, sin comisiones ni intermediarios. 💬

Esta publicación estará activa y destacada como cortesía de apertura. Échenle una mirada a toda la cartelera en ${urlCartelera} y nos cuentan si desean ajustar cualquier detalle.

¡Un abrazo y muchos éxitos con este planazo! 🌿✨`;
}

export function ModalNotificarAliado({
  evento,
  isOpen,
  onClose,
}: ModalNotificarAliadoProps) {
  const [telefono, setTelefono] = useState("");
  const [tipoPlantilla, setTipoPlantilla] = useState<TipoMensajeAliado>("revision");
  const [mensaje, setMensaje] = useState("");
  const [copiado, setCopiado] = useState(false);

  useEffect(() => {
    if (evento) {
      const cleanPhone = evento.whatsapp.replace(/\D/g, "");
      setTelefono(cleanPhone);
      // Si explícitamente se marca como primer evento, se usa bienvenida; de lo contrario, revisión habitual
      const plantillaInicial: TipoMensajeAliado =
        evento.esPrimerEvento ? "bienvenida" : "revision";
      setTipoPlantilla(plantillaInicial);

      if (plantillaInicial === "bienvenida") {
        setMensaje(
          generarMensajeBienvenidaAliado(
            evento.negocioNombre,
            evento.titulo,
            evento.id,
            evento.zonaSlug,
            evento.zonaNombre,
            cleanPhone
          )
        );
      } else {
        setMensaje(
          generarMensajeRevisionAliado(
            evento.negocioNombre,
            evento.titulo,
            evento.id,
            evento.zonaSlug,
            evento.zonaNombre,
            cleanPhone
          )
        );
      }
      setCopiado(false);
    }
  }, [evento]);

  function cambiarPlantilla(tipo: TipoMensajeAliado) {
    if (!evento) return;
    setTipoPlantilla(tipo);
    if (tipo === "bienvenida") {
      setMensaje(
        generarMensajeBienvenidaAliado(
          evento.negocioNombre,
          evento.titulo,
          evento.id,
          evento.zonaSlug,
          evento.zonaNombre,
          telefono
        )
      );
    } else {
      setMensaje(
        generarMensajeRevisionAliado(
          evento.negocioNombre,
          evento.titulo,
          evento.id,
          evento.zonaSlug,
          evento.zonaNombre,
          telefono
        )
      );
    }
  }

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
              Comparte el enlace de su publicación por WhatsApp para que revisen y confirmen los datos.
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

          {/* Selector de Plantilla */}
          <div className="space-y-1.5">
            <label className="font-semibold text-forest flex items-center justify-between">
              <span>Tipo de Mensaje:</span>
              <span className="text-[10px] text-stone font-normal">
                Haz clic para alternar el mensaje
              </span>
            </label>
            <div className="grid grid-cols-2 gap-2 p-1 bg-cream/70 rounded-2xl border border-stone-light/80">
              <button
                type="button"
                onClick={() => cambiarPlantilla("revision")}
                className={`py-2 px-2.5 rounded-xl text-xs font-sans transition-all flex flex-col sm:flex-row items-center justify-center gap-1 cursor-pointer text-center ${
                  tipoPlantilla === "revision"
                    ? "bg-forest text-white font-semibold shadow-xs"
                    : "text-forest/80 hover:text-forest hover:bg-white/60"
                }`}
              >
                <span>📢</span>
                <span>Publicación Lista (Revisión)</span>
              </button>
              <button
                type="button"
                onClick={() => cambiarPlantilla("bienvenida")}
                className={`py-2 px-2.5 rounded-xl text-xs font-sans transition-all flex flex-col sm:flex-row items-center justify-center gap-1 cursor-pointer text-center ${
                  tipoPlantilla === "bienvenida"
                    ? "bg-terra text-white font-semibold shadow-xs"
                    : "text-forest/80 hover:text-forest hover:bg-white/60"
                }`}
              >
                <span>🎁</span>
                <span>Bienvenida (1ª vez / Cortesía)</span>
              </button>
            </div>
          </div>

          {/* Vista previa del mensaje */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-forest">
                Mensaje personalizado (puedes editar libremente antes de enviar):
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
                https://www.padonde.lat/es/{evento.zonaSlug || "minca"}/{evento.id}
              </p>
            </div>
            <a
              href={`/${evento.zonaSlug || "minca"}/${evento.id}`}
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
