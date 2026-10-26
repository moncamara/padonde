"use client";

import { useState, useEffect } from "react";
import type { ServicioEsencial } from "@/lib/types";

interface ModalNotificarAlianzaProps {
  servicio: ServicioEsencial | null;
  isOpen: boolean;
  onClose: () => void;
  zonaNombre?: string;
}

export function calcularFechaEn15Dias(): string {
  const ahora = new Date();
  ahora.setDate(ahora.getDate() + 15);
  const dia = ahora.getDate();
  const meses = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
  ];
  return `${dia} de ${meses[ahora.getMonth()]}`;
}

/**
 * Plantilla 1: Acuerdo Comercial Restaurantes, Cafés, Bares y Gastronomía
 * Enfoque: 15 días gratis, liquidación trimestral con tabla de tarifas claras, 4 idiomas y 0% comisiones.
 */
export function generarMensajeRestauranteComercial(
  nombreComercial: string,
  zonaSlug: string = "mendihuaca",
  zonaNombre: string = "Mendihuaca",
  servicioId?: string
): string {
  const slug = zonaSlug || "mendihuaca";
  const destino = zonaNombre || (slug === "mendihuaca" ? "Mendihuaca" : "Minca");
  const anchor = servicioId ? `#servicio-${servicioId}` : "";
  const urlPublicacion = `https://www.padonde.lat/es/${slug}?tab=servicios${anchor}`;
  const fechaLimite = calcularFechaEn15Dias();

  return `🍹 *¡Hola, ${nombreComercial}! Te saludamos desde PaDónde ${destino}.*

Tu punto gastronómico ya está publicado y destacado en la sección oficial de gastronomía y servicios de ${destino}:
👉 *Míralo en vivo aquí:* ${urlPublicacion}

Para que sientas el impacto directo en tus mesas y pedidos, tienes *15 días de cortesía completa sin ningún costo* desde hoy hasta el *${fechaLimite}* 📲✨

🌟 *Ventajas clave para tu restaurante:*
• *Llegada directa de extranjeros y turistas:* La plataforma traduce tu propuesta a 4 idiomas (ES, EN, FR, DE).
• *Menú y contacto directo:* Enlace a tu WhatsApp para reservas de mesas, domicilios en playa o eventos privados.
• *Cero comisiones ni intermediarios de entrega.*

🗓️ *Reglas claras de activación:*
• Disfrutas de visibilidad gratuita hasta el *${fechaLimite}*.
• A partir del *${fechaLimite}*, para continuar en la temporada, nuestro plan más rentable es el *Trimestral*:

Los pagos son trimestrales de la siguiente forma:
🍽️ Restaurante / Bar con Eventos: $125.000 COP *(incluye publicación de eventos ilimitados en la cartelera semanal)*
☕ Café / Repostería / Tienda Especializada: $90.000 COP *(menos de $1.000 al día)*

🎸 *¿Tienes música en vivo o Sunset Sessions?* Puedes destacar cualquier evento especial en la cima de la Cartelera durante toda la semana por solo *$30.000 COP*.

Revisa tu enlace y cuéntanos si quieres actualizar algún plato estrella o foto. ¡Muchos éxitos con la temporada! 🌿🍽️`;
}

/**
 * Plantilla 2: Comercio Local, Tiendas, Artesanías y Servicios Esenciales
 * Enfoque: 15 días gratis, liquidación trimestral $60.000 COP ($20k/mes), 4 idiomas y contacto directo.
 */
export function generarMensajeComercioServicios(
  nombreComercial: string,
  zonaSlug: string = "mendihuaca",
  zonaNombre: string = "Mendihuaca",
  servicioId?: string
): string {
  const slug = zonaSlug || "mendihuaca";
  const destino = zonaNombre || (slug === "mendihuaca" ? "Mendihuaca" : "Minca");
  const anchor = servicioId ? `#servicio-${servicioId}` : "";
  const urlPublicacion = `https://www.padonde.lat/es/${slug}?tab=servicios${anchor}`;
  const fechaLimite = calcularFechaEn15Dias();

  return `🛵 *¡Hola, ${nombreComercial}! Te saludamos desde PaDónde ${destino}.*

Tu negocio ya está publicado y verificado en la guía oficial de servicios esenciales de ${destino}:
👉 *Míralo en vivo aquí:* ${urlPublicacion}

Queremos darte la bienvenida con *15 días de cortesía total (prueba 100% gratuita)* a partir de hoy hasta el *${fechaLimite}*, para que compruebes cómo turistas y residentes encuentran tus servicios 📲✨

🌟 *Lo que ganas con PaDónde:*
• *Contacto directo a tu WhatsApp:* Los viajeros te escriben a 1 solo toque.
• *Plataforma en 4 idiomas (ES, EN, FR, DE).*
• *Presencia permanente en la guía de servicios clave de la región.*

🗓️ *Reglas claras de activación:*
• Disfrutas de visibilidad gratuita hasta el *${fechaLimite}*.
• A partir del *${fechaLimite}*, el plan es trimestral:

El pago es trimestral de la siguiente forma:
🛵 Plan Trimestral Comercio & Servicios: $60.000 COP *($20.000/mes — menos de $700 COP al día)*.

Revisa tu enlace y cuéntanos si deseas actualizar algún horario o número. ¡Muchos éxitos con la temporada! 🌿🛵`;
}

/**
 * Plantilla 3: Alianza Oficial de Transporte y Mototaxis
 * Enfoque: Canal Oficial, 0% comisión, stickers y habladores QR oficiales.
 */
export function generarMensajeTransporteAlianza(
  nombreComercial: string,
  zonaSlug: string = "mendihuaca",
  zonaNombre: string = "Mendihuaca",
  servicioId?: string
): string {
  const slug = zonaSlug || "mendihuaca";
  const destino = zonaNombre || (slug === "mendihuaca" ? "Mendihuaca" : "Minca");
  const anchor = servicioId ? `#servicio-${servicioId}` : "";
  const urlPublicacion = `https://www.padonde.lat/es/${slug}?tab=servicios${anchor}`;

  return `🛵 *¡Buenas tardes, muchachos de ${nombreComercial}! Un saludo de parte del equipo de PaDónde ${destino}.*

Ya dejamos su punto activo y verificado en la plataforma como el *Canal Oficial de Transporte y Mototaxis de ${destino}*:
👉 *Revisen su ficha oficial aquí:* ${urlPublicacion}

Aquí los turistas y visitantes que llegan a la entrada, al río o a los hostales consultan las tarifas de carreras y les escriben directo para pedir el servicio 📲✨

🤝 *Bases de la Alianza Oficial:*
1. *Cero comisiones y cero cobro:* No les cobramos mensualidad ni porcentaje por ninguna carrera. Todos los viajes que les salgan son 100% de ustedes.
2. *Canal preferente:* Son la línea que la plataforma recomienda a extranjeros y locales para moverse seguro por ${destino}, Costeño, la entrada al Tayrona y el río.
3. *El compromiso del gremio:* Llevar los stickers oficiales y habladores con el código QR de PaDónde en sus cascos y motos, para que los pasajeros escaneen la cartelera mientras viajan y sigamos moviendo el turismo del pueblo entre todos.

Les tenemos listo el material de stickers para entregárselos. Revisen el enlace y quedamos firmes para coordinar la entrega. ¡A rodar con toda! 🏁🌴`;
}

/**
 * Plantilla 4: Alianza Estándar Cortesía / Canje
 */
export function generarMensajeAlianzaEsencial(
  nombreComercial: string,
  tipoAcuerdo: string = "canje_afiche",
  zonaSlug: string = "minca",
  zonaNombre: string = "Minca",
  servicioId?: string
): string {
  const slug = zonaSlug || "minca";
  const destino = zonaNombre || (slug === "mendihuaca" ? "Mendihuaca" : "Minca");
  const anchor = servicioId ? `#servicio-${servicioId}` : "";
  const urlPublicacion = `https://www.padonde.lat/es/${slug}?tab=servicios${anchor}`;

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

export type TipoPlantillaAlianza = "restaurante" | "comercio" | "transporte" | "estandar";

export function ModalNotificarAlianza({
  servicio,
  isOpen,
  onClose,
  zonaNombre = "Minca",
}: ModalNotificarAlianzaProps) {
  const [telefono, setTelefono] = useState("");
  const [tipoPlantilla, setTipoPlantilla] = useState<TipoPlantillaAlianza>("restaurante");
  const [mensaje, setMensaje] = useState("");
  const [copiado, setCopiado] = useState(false);

  const getTextoPlantilla = (tipo: TipoPlantillaAlianza) => {
    if (!servicio) return "";
    const zonaSlug =
      servicio.zona_id === "zona-mendihuaca" ? "mendihuaca" : "minca";

    if (tipo === "transporte") {
      return generarMensajeTransporteAlianza(
        servicio.nombre_comercial,
        zonaSlug,
        zonaNombre,
        servicio.id
      );
    }
    if (tipo === "comercio") {
      return generarMensajeComercioServicios(
        servicio.nombre_comercial,
        zonaSlug,
        zonaNombre,
        servicio.id
      );
    }
    if (tipo === "restaurante") {
      return generarMensajeRestauranteComercial(
        servicio.nombre_comercial,
        zonaSlug,
        zonaNombre,
        servicio.id
      );
    }
    return generarMensajeAlianzaEsencial(
      servicio.nombre_comercial,
      servicio.tipo_acuerdo,
      zonaSlug,
      zonaNombre,
      servicio.id
    );
  };

  useEffect(() => {
    if (servicio) {
      setTelefono(servicio.whatsapp || "57");
      const cat = (servicio.categoria || "").toLowerCase();
      let tipoDefecto: TipoPlantillaAlianza = "estandar";

      if (cat === "transporte") {
        tipoDefecto = "transporte";
      } else if (cat === "comida" || cat === "gastronomia") {
        tipoDefecto = "restaurante";
      } else if (cat === "comercio" || cat === "artesanias" || cat === "servicios") {
        tipoDefecto = "comercio";
      } else {
        tipoDefecto = "restaurante";
      }

      setTipoPlantilla(tipoDefecto);
      setMensaje(getTextoPlantilla(tipoDefecto));
      setCopiado(false);
    }
  }, [servicio, zonaNombre]);

  const handleCambiarPlantilla = (tipo: TipoPlantillaAlianza) => {
    setTipoPlantilla(tipo);
    setMensaje(getTextoPlantilla(tipo));
  };

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
              ?tab=servicios#servicio-{servicio.id}
            </code>
          </div>

          {/* Selector de Enfoque Comercial / Plantilla */}
          <div className="space-y-1.5">
            <label className="font-semibold text-forest block">
              Tipo de Acuerdo / Plantilla:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 p-1 rounded-2xl bg-stone-light/30 border border-stone-light/60">
              <button
                type="button"
                onClick={() => handleCambiarPlantilla("restaurante")}
                className={`py-1.5 px-1 rounded-xl text-[11px] font-semibold transition-all cursor-pointer text-center ${
                  tipoPlantilla === "restaurante"
                    ? "bg-forest text-white shadow-2xs"
                    : "text-stone hover:text-forest hover:bg-white/50"
                }`}
              >
                🍽️ Restaurante
              </button>
              <button
                type="button"
                onClick={() => handleCambiarPlantilla("comercio")}
                className={`py-1.5 px-1 rounded-xl text-[11px] font-semibold transition-all cursor-pointer text-center ${
                  tipoPlantilla === "comercio"
                    ? "bg-forest text-white shadow-2xs"
                    : "text-stone hover:text-forest hover:bg-white/50"
                }`}
              >
                🛵 Comercio
              </button>
              <button
                type="button"
                onClick={() => handleCambiarPlantilla("transporte")}
                className={`py-1.5 px-1 rounded-xl text-[11px] font-semibold transition-all cursor-pointer text-center ${
                  tipoPlantilla === "transporte"
                    ? "bg-forest text-white shadow-2xs"
                    : "text-stone hover:text-forest hover:bg-white/50"
                }`}
              >
                🛵 Mototaxis QR
              </button>
              <button
                type="button"
                onClick={() => handleCambiarPlantilla("estandar")}
                className={`py-1.5 px-1 rounded-xl text-[11px] font-semibold transition-all cursor-pointer text-center ${
                  tipoPlantilla === "estandar"
                    ? "bg-forest text-white shadow-2xs"
                    : "text-stone hover:text-forest hover:bg-white/50"
                }`}
              >
                🤝 Cortesía
              </button>
            </div>
          </div>

          {/* Mensaje */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-forest">
                Mensaje predefinido con enlace directo a WhatsApp:
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
