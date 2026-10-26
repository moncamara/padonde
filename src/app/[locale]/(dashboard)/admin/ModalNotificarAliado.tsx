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
  tipoCategoria?: string;
  esPrimerEvento?: boolean;
}

interface ModalNotificarAliadoProps {
  evento: EventoNotificarData | null;
  isOpen: boolean;
  onClose: () => void;
}

export type TipoMensajeAliado =
  | "hospedaje"
  | "restaurante"
  | "tours"
  | "comercio"
  | "bienvenida"
  | "revision"
  | "correccion"
  | "propuesta";

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
 * Calcula la fecha calendario exacta en 15 días a partir de hoy (ej: 9 de Noviembre)
 */
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
 * Mensaje especializado para Hostales, Eco-lodges y Alojamientos.
 * Enfoque: Acuerdo de Activación Comercial con 15 días gratis, escala trimestral por habitaciones y 0% comisiones.
 */
export function generarMensajeHospedajeAliado(
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
  const fechaLimite = calcularFechaEn15Dias();

  return `🌿 *¡Hola ${negocioNombre}! Un saludo muy especial desde PaDónde ${destinoNombre}.*

Ya tenemos tu ficha oficial activa y verificada en vivo dentro de la plataforma digital de ${destinoNombre}:
👉 *Ver tu ficha aquí:* ${urlPublicacion}

Queremos darte la bienvenida con *15 días de cortesía total (prueba 100% gratuita)* a partir de hoy, para que compruebes cómo los turistas y viajeros internacionales que llegan a la zona encuentran tus cabañas, fotos y tarifas en tiempo real 📲✨

🌟 *Lo que ganas con PaDónde:*
• *0% de comisiones por reserva:* El viajero te escribe directo a tu WhatsApp (te ahorras el 18% que descuentan Booking o Airbnb).
• *Plataforma global en 4 idiomas:* Tu hospedaje se muestra automáticamente en Español, Inglés, Francés y Alemán (ES / EN / FR / DE).
• *Presencia turística 24/7:* Indexado en la vitrina oficial de la región.

🗓️ *Reglas claras de activación:*
• Tu periodo de cortesía va desde hoy hasta el *${fechaLimite}*.
• A partir del *${fechaLimite}*, se liquidará el primer ciclo de visibilidad.
• Nuestro plan estándar más rentable es el *Trimestral* y va asociado al número de habitaciones y/o espacios para rentar.

Los pagos son trimestrales de la siguiente forma:
🏨 1-5 habs $125.000 
🏨 6-10 hab $200.000
🏨 11-20 hab $300.000
🏨 +20 habs $400.000

🎶 *Add-on de Eventos & Rumba:* Si organizas noches acústicas, yoga matutino o DJ sets, puedes fijar tu evento en la Cartelera de ${destinoNombre} por solo *$30.000 COP por semana completa*.

Por favor entra a tu enlace, confirma que tus fotos y datos estén perfectos, y seguimos impulsando tus reservas directas. ¡Un gran abrazo y buenas olas! 🌊✨`;
}

/**
 * Mensaje especializado para Restaurantes, Bares, Gastrobares y Cafés.
 * Enfoque: 15 días gratis, 0% comisiones en reservas y pedidos, 4 idiomas y tarifas trimestrales claras.
 */
export function generarMensajeRestauranteAliado(
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
  const fechaLimite = calcularFechaEn15Dias();

  return `🌿 *¡Hola ${negocioNombre}! Un saludo muy especial desde PaDónde ${destinoNombre}.*

Ya tenemos tu propuesta gastronómica activa y verificada en vivo dentro de la plataforma digital de ${destinoNombre}:
👉 *Ver tu ficha aquí:* ${urlPublicacion}

Queremos darte la bienvenida con *15 días de cortesía total (prueba 100% gratuita)* a partir de hoy hasta el *${fechaLimite}*, para que compruebes cómo los comensales, turistas y viajeros internacionales descubren tu menú, fotos y ambiente en tiempo real 📲✨

🌟 *Lo que ganas con PaDónde:*
• *0% de comisiones por reserva o pedidos:* Los clientes te escriben directo a tu WhatsApp para reservar mesa o pedir domicilios (sin intermediarios ni cobros por pedido).
• *Plataforma global en 4 idiomas:* Tu carta y propuesta se muestran automáticamente en Español, Inglés, Francés y Alemán (ES / EN / FR / DE) para turistas que buscan dónde comer.
• *Presencia turística 24/7:* Indexado en la vitrina oficial de gastronomía y planes de ${destinoNombre}.

🗓️ *Reglas claras de activación:*
• Tu periodo de cortesía va desde hoy hasta el *${fechaLimite}*.
• A partir del *${fechaLimite}*, se liquidará el primer ciclo de visibilidad.
• Nuestro plan estándar más rentable es el *Trimestral*, con tarifas claras según tu modelo de negocio:

Los pagos son trimestrales de la siguiente forma:
🍽️ Restaurante / Bar con Eventos: $125.000 COP *(incluye publicación de eventos ilimitados en la cartelera semanal)*
☕ Café / Repostería / Tienda Especializada: $90.000 COP *(menos de $1.000 al día)*

🎶 *Add-on de Música & Sunset Sessions:* Si organizas noches acústicas, DJ sets o sunsets especiales, puedes fijar tu evento en la cima de la Cartelera de ${destinoNombre} por solo *$30.000 COP por semana completa*.

Por favor entra a tu enlace, confirma que tus fotos, menú y datos de contacto estén perfectos, y seguimos atrayendo más comensales a tu mesa. ¡Un gran abrazo y excelentes ventas! 🍽️✨`;
}

/**
 * Mensaje especializado para Tours, Guías y Actividades de Aventura.
 * Enfoque: 15 días cortesía, 0% comisiones (ahorro del 25-30% de agencias) y tarifas trimestrales claras.
 */
export function generarMensajeToursAliado(
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
  const fechaLimite = calcularFechaEn15Dias();

  return `🌿 *¡Hola ${negocioNombre}! Un saludo muy especial desde PaDónde ${destinoNombre}.*

Ya tenemos tu experiencia y recorridos turísticos activos y verificados en vivo dentro de la plataforma digital de ${destinoNombre}:
👉 *Ver tu experiencia aquí:* ${urlPublicacion}

Queremos darte la bienvenida con *15 días de cortesía total (prueba 100% gratuita)* a partir de hoy hasta el *${fechaLimite}*, para que compruebes cómo los turistas y viajeros internacionales que llegan a la zona descubren tus tours, fotos y detalles en tiempo real 📲✨

🌟 *Lo que ganas con PaDónde:*
• *0% de comisiones por turista:* El viajero te contacta y reserva directo a tu WhatsApp (te ahorras el 20% al 30% que cobran agencias intermediarias).
• *Plataforma global en 4 idiomas:* Tu recorrido se muestra automáticamente en Español, Inglés, Francés y Alemán (ES / EN / FR / DE) para mochileros y extranjeros.
• *Presencia turística 24/7:* Indexado en la vitrina oficial de experiencias, caminatas y aventura de ${destinoNombre}.

🗓️ *Reglas claras de activación:*
• Tu periodo de cortesía va desde hoy hasta el *${fechaLimite}*.
• A partir del *${fechaLimite}*, se liquidará el primer ciclo de visibilidad:

El pago es trimestral de la siguiente forma:
🧭 Plan Trimestral Tours & Guías: $125.000 COP *(equivale a menos de $42.000/mes — con 1 solo turista que te reserve directo ya cubres toda la suscripción y te queda ganancia)*.

Por favor entra a tu enlace, confirma que tus fotos, tarifas y descripción estén perfectas, y seguimos impulsando tus reservas directas. ¡Un gran abrazo y excelentes rutas! 🧭🌿`;
}

/**
 * Mensaje especializado para Comercio Local, Tiendas, Artesanías y Servicios Esenciales.
 * Enfoque: 15 días cortesía, tarifa trimestral accesible de $60.000 COP ($20k/mes).
 */
export function generarMensajeComercioAliado(
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
  const fechaLimite = calcularFechaEn15Dias();

  return `🌿 *¡Hola ${negocioNombre}! Un saludo muy especial desde PaDónde ${destinoNombre}.*

Ya tenemos tu negocio y servicios locales activos y verificados en vivo dentro de la plataforma digital de ${destinoNombre}:
👉 *Ver tu ficha aquí:* ${urlPublicacion}

Queremos darte la bienvenida con *15 días de cortesía total (prueba 100% gratuita)* a partir de hoy hasta el *${fechaLimite}*, para que compruebes cómo los viajeros y residentes encuentran tu ubicación, horarios y productos al instante 📲✨

🌟 *Lo que ganas con PaDónde:*
• *Contacto directo a tu WhatsApp:* Los clientes te contactan a un toque sin intermediarios ni comisiones.
• *Plataforma global en 4 idiomas:* Información traducida automáticamente a Español, Inglés, Francés y Alemán (ES / EN / FR / DE).
• *Presencia permanente 24/7:* Indexado en la guía de comercio y servicios esenciales de ${destinoNombre}.

🗓️ *Reglas claras de activación:*
• Tu periodo de cortesía va desde hoy hasta el *${fechaLimite}*.
• A partir del *${fechaLimite}*, se liquidará el primer ciclo de visibilidad:

El pago es trimestral de la siguiente forma:
🛵 Plan Trimestral Comercio & Servicios: $60.000 COP *($20.000/mes — menos de $700 COP al día para que el turista te encuentre de primero cuando necesita solucionar en la zona)*.

Por favor entra a tu enlace, confirma que tus datos y horarios de atención estén al día. ¡Un gran abrazo y muchos éxitos con las ventas! 🛵✨`;
}

/**
 * Mensaje para cuando el aliado nos pidió un ajuste o corrección (fotos, precios, teléfono, info),
 * o para dar seguimiento en una segunda comunicación.
 */
export function generarMensajeCorreccionAliado(
  negocioNombre: string,
  tituloEvento: string,
  eventoId: string,
  zonaSlug?: string,
  zonaNombre?: string,
  whatsapp?: string,
  esHospedaje?: boolean
): string {
  const slug = zonaSlug || "minca";
  const destinoNombre = zonaNombre || (slug === "mendihuaca" ? "Mendihuaca" : "Minca");
  const urlPublicacion = `https://www.padonde.lat/es/${slug}/${eventoId}`;
  const wpVisual = formatearTelefonoVisual(whatsapp);
  const textoWhatsapp = wpVisual ? ` (${wpVisual})` : "";
  const tipoReferencia = esHospedaje ? "en su perfil de hospedaje" : `en su publicación: "${tituloEvento}"`;

  return `🌿 ¡Hola ${negocioNombre}! Un gusto saludarte de nuevo desde PaDónde ${destinoNombre}.

¡Listo! Ya quedaron aplicados los ajustes que nos comentaste ${tipoReferencia} 📲✨

👉 Pueden revisar nuevamente cómo luce aquí:
${urlPublicacion}

Verificamos que todo esté en orden y que las reservas directas sigan conectadas a su WhatsApp${textoWhatsapp}. 

Si en algún momento necesitan actualizar fotos, tarifas, nuevos planes o promociones de temporada, con el mayor gusto nos escriben por aquí y lo dejamos al día.

¡Seguimos en contacto y les deseamos muchos éxitos con las reservas! 🏡🚀`;
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
 * Genera el texto del mensaje comercial y de bienvenida para el aliado por cortesía inicial (1ª vez para eventos/actividades).
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

/**
 * Genera el mensaje de propuesta comercial y negociación con la ficha en vivo y tarifas claras adaptadas a la categoría.
 */
export function generarMensajePropuestaAliado(
  negocioNombre: string,
  tituloEvento: string,
  eventoId: string,
  zonaSlug?: string,
  zonaNombre?: string,
  whatsapp?: string,
  tipoCategoria?: string
): string {
  const slug = zonaSlug || "minca";
  const destinoNombre = zonaNombre || (slug === "mendihuaca" ? "Mendihuaca" : "Minca");
  const urlPublicacion = `https://www.padonde.lat/es/${slug}/${eventoId}`;
  const wpVisual = formatearTelefonoVisual(whatsapp);
  const textoWhatsapp = wpVisual ? ` (${wpVisual})` : "";

  const cat = (tipoCategoria || "").toLowerCase();
  const tit = (tituloEvento || "").toLowerCase();

  const esHosp =
    cat === "hospedaje" ||
    tit.includes("hostal") ||
    tit.includes("hospedaje") ||
    tit.includes("hotel") ||
    tit.includes("lodge") ||
    tit.includes("cabaña");

  const esResto =
    cat === "comida" ||
    cat === "gastronomia" ||
    tit.includes("restaurante") ||
    tit.includes("bar") ||
    tit.includes("café") ||
    tit.includes("cafe");

  const esComercio =
    cat === "comercio" ||
    cat === "artesanias" ||
    cat === "servicios" ||
    cat === "transporte";

  let argumentoComisiones = "";
  let tipoPlanTexto = "";
  let bloqueTarifas = "";

  if (esHosp) {
    tipoPlanTexto = "Hospedajes, Cabañas & Glampings";
    argumentoComisiones =
      "Booking y Airbnb se quedan con el 15% al 20% de cada noche. En PaDónde los turistas cotizan y reservan DIRECTO a tu WhatsApp sin comisiones ni intermediarios. Con 1 sola reserva al mes ya libraste el valor.";
    bloqueTarifas = `💰 *Tarifas Trimestrales por Capacidad:*
🏨 1-5 habs: $125.000 COP
🏨 6-10 hab: $200.000 COP
🏨 11-20 hab: $300.000 COP
🏨 +20 habs: $400.000 COP`;
  } else if (esResto) {
    tipoPlanTexto = "Restaurantes, Bares & Cafés";
    argumentoComisiones =
      "Las apps de delivery o comisionistas descuentan márgenes altos. En PaDónde los clientes y turistas te escriben directo a tu WhatsApp para reservar mesa o pedir a domicilio con 0% de comisiones.";
    bloqueTarifas = `💰 *Tarifas Trimestrales:*
🍽️ Restaurante / Bar con Eventos: $125.000 COP *(eventos ilimitados en cartelera)*
☕ Café / Tienda de Especialidad: $90.000 COP *($30.000/mes)*`;
  } else if (esComercio) {
    tipoPlanTexto = "Comercio Local & Servicios Esenciales";
    argumentoComisiones =
      "Contacto directo sin intermediarios para que turistas y residentes te encuentren al instante cuando necesitan resolver compras y servicios en la región.";
    bloqueTarifas = `💰 *Tarifa Trimestral:*
🛵 Comercio & Servicios: $60.000 COP *($20.000/mes — menos de $700 COP al día)*`;
  } else {
    // Tours & Guías
    tipoPlanTexto = "Tours, Guías & Experiencias de Aventura";
    argumentoComisiones =
      "Las agencias de Santa Marta suelen cobrar del 20% al 30% por mandarte turistas. En PaDónde los viajeros te escriben directo a tu WhatsApp y tú cobras el 100% de tus cupos. Con 1 solo cliente que te compre ya pagas la plataforma y te queda ganancia.";
    bloqueTarifas = `💰 *Tarifa Trimestral:*
🧭 Tours & Guías: $125.000 COP *(menos de $42.000/mes — con 1 solo cliente cubres la inversión)*`;
  }

  return `🌿 *Propuesta Especial PaDónde ${destinoNombre}* 🌿

¡Hola ${negocioNombre}! Qué gusto saludarte.

Te comparto la propuesta que preparamos para ustedes. Ya te dejamos montada la ficha de tu experiencia: *"${tituloEvento}"* para que la revises en vivo con sus fotos, videos/reels y tarifas:

📲 *Toca aquí para ver tu publicación en vivo:*
👉 ${urlPublicacion}

Échale una mirada y fíjate en esto:
• Puedes ver tus fotos, horarios y descripción detallada.
• Puedes darle play al video/reel vertical.
• Toca en *"Reservar por WhatsApp"* para comprobar que te llega directo a tu número${textoWhatsapp}.
• La plataforma traduce automáticamente al inglés, alemán y francés para mochileros extranjeros.

---

📋 *Nuestra Propuesta Comercial:*
${argumentoComisiones}

• *Plan:* ${tipoPlanTexto}
${bloqueTarifas}

✨ *Beneficios incluidos:*
• Ficha activa con fotos, video/reel y botón directo a tu WhatsApp
• Cero comisiones (el 100% del pago de los turistas es tuyo)
• Publicación destacada en la cartelera semanal de ${destinoNombre}
• Insignia de negocio / experiencia local verificada

🎁 *Por lanzamiento, ya te dejamos la publicación activa y destacada durante 15 días de cortesía para que compruebes cuántos viajeros te contactan.* 🚀

¿Pudiste abrir el enlace? ¿Te gusta cómo quedó o le afinamos algún horario/precio? 📲✨`;
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

      // Detección inteligente de plantilla inicial según categoría del negocio
      const cat = (evento.tipoCategoria || "").toLowerCase();
      const tit = (evento.titulo || "").toLowerCase();
      const neg = (evento.negocioNombre || "").toLowerCase();

      let plantillaInicial: TipoMensajeAliado = "revision";

      if (
        cat === "hospedaje" ||
        tit.includes("hospedaje") ||
        tit.includes("hostal") ||
        tit.includes("hotel") ||
        tit.includes("lodge") ||
        tit.includes("cabaña") ||
        neg.includes("hostal") ||
        neg.includes("hotel") ||
        neg.includes("lodge")
      ) {
        plantillaInicial = "hospedaje";
      } else if (
        cat === "comida" ||
        cat === "gastronomia" ||
        tit.includes("restaurante") ||
        tit.includes("bar") ||
        tit.includes("café") ||
        tit.includes("cafe") ||
        tit.includes("pizza") ||
        tit.includes("burger") ||
        neg.includes("restaurante") ||
        neg.includes("cafe") ||
        neg.includes("café") ||
        neg.includes("bar")
      ) {
        plantillaInicial = "restaurante";
      } else if (
        cat === "tours" ||
        cat === "bienestar" ||
        tit.includes("tour") ||
        tit.includes("guía") ||
        tit.includes("guia") ||
        tit.includes("cacao") ||
        tit.includes("avistamiento") ||
        tit.includes("surf")
      ) {
        plantillaInicial = "tours";
      } else if (
        cat === "comercio" ||
        cat === "artesanias" ||
        cat === "servicios" ||
        cat === "transporte"
      ) {
        plantillaInicial = "comercio";
      } else if (evento.esPrimerEvento) {
        plantillaInicial = "bienvenida";
      }

      setTipoPlantilla(plantillaInicial);

      if (plantillaInicial === "hospedaje") {
        setMensaje(
          generarMensajeHospedajeAliado(
            evento.negocioNombre,
            evento.titulo,
            evento.id,
            evento.zonaSlug,
            evento.zonaNombre,
            cleanPhone
          )
        );
      } else if (plantillaInicial === "restaurante") {
        setMensaje(
          generarMensajeRestauranteAliado(
            evento.negocioNombre,
            evento.titulo,
            evento.id,
            evento.zonaSlug,
            evento.zonaNombre,
            cleanPhone
          )
        );
      } else if (plantillaInicial === "tours") {
        setMensaje(
          generarMensajeToursAliado(
            evento.negocioNombre,
            evento.titulo,
            evento.id,
            evento.zonaSlug,
            evento.zonaNombre,
            cleanPhone
          )
        );
      } else if (plantillaInicial === "comercio") {
        setMensaje(
          generarMensajeComercioAliado(
            evento.negocioNombre,
            evento.titulo,
            evento.id,
            evento.zonaSlug,
            evento.zonaNombre,
            cleanPhone
          )
        );
      } else if (plantillaInicial === "bienvenida") {
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
    if (tipo === "propuesta") {
      setMensaje(
        generarMensajePropuestaAliado(
          evento.negocioNombre,
          evento.titulo,
          evento.id,
          evento.zonaSlug,
          evento.zonaNombre,
          telefono,
          evento.tipoCategoria
        )
      );
    } else if (tipo === "hospedaje") {
      setMensaje(
        generarMensajeHospedajeAliado(
          evento.negocioNombre,
          evento.titulo,
          evento.id,
          evento.zonaSlug,
          evento.zonaNombre,
          telefono
        )
      );
    } else if (tipo === "restaurante") {
      setMensaje(
        generarMensajeRestauranteAliado(
          evento.negocioNombre,
          evento.titulo,
          evento.id,
          evento.zonaSlug,
          evento.zonaNombre,
          telefono
        )
      );
    } else if (tipo === "tours") {
      setMensaje(
        generarMensajeToursAliado(
          evento.negocioNombre,
          evento.titulo,
          evento.id,
          evento.zonaSlug,
          evento.zonaNombre,
          telefono
        )
      );
    } else if (tipo === "comercio") {
      setMensaje(
        generarMensajeComercioAliado(
          evento.negocioNombre,
          evento.titulo,
          evento.id,
          evento.zonaSlug,
          evento.zonaNombre,
          telefono
        )
      );
    } else if (tipo === "correccion") {
      const esHospedaje =
        evento.tipoCategoria === "hospedaje" ||
        evento.titulo?.toLowerCase().includes("hospedaje") ||
        evento.titulo?.toLowerCase().includes("hostal") ||
        evento.titulo?.toLowerCase().includes("hotel") ||
        evento.titulo?.toLowerCase().includes("lodge");

      setMensaje(
        generarMensajeCorreccionAliado(
          evento.negocioNombre,
          evento.titulo,
          evento.id,
          evento.zonaSlug,
          evento.zonaNombre,
          telefono,
          esHospedaje
        )
      );
    } else if (tipo === "bienvenida") {
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
          <div className="space-y-2">
            <label className="font-semibold text-forest flex items-center justify-between">
              <span>Acuerdos Comerciales (15 Días Cortesía + Tarifas):</span>
              <span className="text-[10px] text-stone font-normal">
                Tarifas según modelo de negocio
              </span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 p-1 bg-cream/70 rounded-2xl border border-stone-light/80">
              <button
                type="button"
                onClick={() => cambiarPlantilla("hospedaje")}
                className={`py-2 px-1 rounded-xl text-xs font-sans transition-all flex items-center justify-center gap-1 cursor-pointer text-center ${
                  tipoPlantilla === "hospedaje"
                    ? "bg-forest text-white font-semibold shadow-xs"
                    : "text-forest/80 hover:text-forest hover:bg-white/60"
                }`}
              >
                <span>🏡</span>
                <span>Hospedaje</span>
              </button>
              <button
                type="button"
                onClick={() => cambiarPlantilla("restaurante")}
                className={`py-2 px-1 rounded-xl text-xs font-sans transition-all flex items-center justify-center gap-1 cursor-pointer text-center ${
                  tipoPlantilla === "restaurante"
                    ? "bg-amber-700 text-white font-semibold shadow-xs"
                    : "text-amber-900/80 hover:text-amber-950 hover:bg-amber-50/70"
                }`}
              >
                <span>🍽️</span>
                <span>Restaurante</span>
              </button>
              <button
                type="button"
                onClick={() => cambiarPlantilla("tours")}
                className={`py-2 px-1 rounded-xl text-xs font-sans transition-all flex items-center justify-center gap-1 cursor-pointer text-center ${
                  tipoPlantilla === "tours"
                    ? "bg-teal-700 text-white font-semibold shadow-xs"
                    : "text-teal-900/80 hover:text-teal-950 hover:bg-teal-50/70"
                }`}
              >
                <span>🧭</span>
                <span>Tours & Guías</span>
              </button>
              <button
                type="button"
                onClick={() => cambiarPlantilla("comercio")}
                className={`py-2 px-1 rounded-xl text-xs font-sans transition-all flex items-center justify-center gap-1 cursor-pointer text-center ${
                  tipoPlantilla === "comercio"
                    ? "bg-sky-700 text-white font-semibold shadow-xs"
                    : "text-sky-900/80 hover:text-sky-950 hover:bg-sky-50/70"
                }`}
              >
                <span>🛵</span>
                <span>Comercio</span>
              </button>
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-[11px] font-semibold text-stone">Gestión de Eventos & Cartelera:</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 p-1 bg-stone-100/70 rounded-2xl border border-stone-light/70">
              <button
                type="button"
                onClick={() => cambiarPlantilla("bienvenida")}
                className={`py-1.5 px-1 rounded-xl text-xs font-sans transition-all flex items-center justify-center gap-1 cursor-pointer text-center ${
                  tipoPlantilla === "bienvenida"
                    ? "bg-terra text-white font-semibold shadow-xs"
                    : "text-forest/80 hover:text-forest hover:bg-white/60"
                }`}
              >
                <span>🎁</span>
                <span>Bienvenida</span>
              </button>
              <button
                type="button"
                onClick={() => cambiarPlantilla("revision")}
                className={`py-1.5 px-1 rounded-xl text-xs font-sans transition-all flex items-center justify-center gap-1 cursor-pointer text-center ${
                  tipoPlantilla === "revision"
                    ? "bg-forest text-white font-semibold shadow-xs"
                    : "text-forest/80 hover:text-forest hover:bg-white/60"
                }`}
              >
                <span>📢</span>
                <span>Eventos</span>
              </button>
              <button
                type="button"
                onClick={() => cambiarPlantilla("correccion")}
                className={`py-1.5 px-1 rounded-xl text-xs font-sans transition-all flex items-center justify-center gap-1 cursor-pointer text-center ${
                  tipoPlantilla === "correccion"
                    ? "bg-forest text-white font-semibold shadow-xs"
                    : "text-forest/80 hover:text-forest hover:bg-white/60"
                }`}
              >
                <span>✏️</span>
                <span>Ajustes</span>
              </button>
              <button
                type="button"
                onClick={() => cambiarPlantilla("propuesta")}
                className={`py-1.5 px-1 rounded-xl text-xs font-sans transition-all flex items-center justify-center gap-1 cursor-pointer text-center ${
                  tipoPlantilla === "propuesta"
                    ? "bg-emerald-700 text-white font-semibold shadow-xs"
                    : "text-emerald-900/80 hover:text-emerald-950 hover:bg-white/60"
                }`}
              >
                <span>💼</span>
                <span>Propuesta</span>
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
