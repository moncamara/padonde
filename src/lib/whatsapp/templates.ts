/**
 * Catálogo Canónico y Centralizado de Plantillas de Mensajes de WhatsApp de PaDónde.
 * Fuente única de verdad para textos de bienvenida, tarifas, difusión, prospección y cobro.
 */

import { formatVisualPhone } from "./url";
import { calcularFechaLimite } from "./dates";

export interface MensajeBaseParams {
  negocioNombre: string;
  zonaSlug?: string;
  zonaNombre?: string;
  eventoId?: string;
  enlacePersonalizado?: string;
  whatsapp?: string;
  fechaLimite?: string;
}

/**
 * Resuelve la URL pública canónica para la ficha de un aliado o evento.
 */
export function resolverUrlPublicacion(params: MensajeBaseParams): string {
  if (params.enlacePersonalizado) return params.enlacePersonalizado;
  const slug = params.zonaSlug || "minca";
  if (params.eventoId) {
    return `https://www.padonde.lat/es/${slug}/${params.eventoId}`;
  }
  return `https://www.padonde.lat/es/${slug}`;
}

/**
 * Resuelve el nombre comercial del destino (Minca o Mendihuaca).
 */
export function resolverNombreDestino(params: MensajeBaseParams): string {
  if (params.zonaNombre) return params.zonaNombre;
  const slug = params.zonaSlug || "minca";
  return slug === "mendihuaca" ? "Mendihuaca" : "Minca";
}

// ─── 1. PLANTILLAS DE ONBOARDING / ACTIVACIÓN (15 DÍAS DE CORTESÍA) ──────────

/**
 * Plantilla oficial para Restaurantes, Bares, Gastrobares y Cafés.
 * Tarifas oficiales: $150.000 COP el trimestre.
 * Menú Digital + Reseñas Google: $100.000 COP pago único.
 * CTA: "Consultar Menú - Reservar".
 */
export function generarMensajeRestaurante(params: MensajeBaseParams): string {
  const destino = resolverNombreDestino(params);
  const url = resolverUrlPublicacion(params);
  const fechaLimite = params.fechaLimite || calcularFechaLimite(15);
  const wpVisual = formatVisualPhone(params.whatsapp);
  const textoWhatsapp = wpVisual ? ` (${wpVisual})` : "";

  return `🌿 *¡Hola ${params.negocioNombre}! Un saludo muy especial desde PaDónde ${destino}.*

Ya tenemos su propuesta gastronómica activa y verificada en vivo dentro de la cartelera oficial de ${destino}:
👉 *Miren su vitrina aquí:* ${url}

Échale una mirada y fíjate en esto:
• Puedes ver tus fotos, horarios y descripción detallada.
• Si deseas agregar un reel y/o el Menú digital e interactivo nos avisas
• Toca en *"Consultar Menú - Reservar"* para comprobar que te llega directo a tu número${textoWhatsapp}.
• La plataforma traduce automáticamente al inglés, alemán y francés para mochileros extranjeros.

🎁 *Por lanzamiento, ya te dejamos la publicación activa y destacada durante 15 días de cortesía 100% libres de costo (hasta el ${fechaLimite})* para que compruebes cuántos viajeros te descubren y contactan. 🚀

---

📋 *Nuestra Propuesta Comercial (para después de tus 15 días):*
Las apps de delivery o comisionistas descuentan márgenes altos. En PaDónde los clientes y turistas te escriben directo a tu WhatsApp con *0% de comisiones*.

💰 *Plan Trimestral Restaurantes, Bares & Cafés:*
• *$150.000 COP el trimestre*.
Incluye tu ficha activa 24/7, publicación en cartelera turística, 0% comisiones y catálogo en 4 idiomas.

💡 *Opción recomendada para mesa: Menú Digital + Reseñas en Google* (Único pago de $100.000 COP):
• *Stickers con código QR resistentes para tus mesas:* El comensal se sienta, escanea y ve tu menú en su celular al instante.
• *Reseñas 5 Estrellas en Google sin rodeos:* Al final del menú dejamos un botón directo para que el cliente califique tu negocio en Google Maps en 1 solo clic.
• Publicación y habilitación de tu carta en la plataforma *(solo nos pasas las fotos o archivo de tu menú y nosotros te lo dejamos listo)* + el archivo del código QR en alta calidad por si deseas mandar a hacer habladores.

---

¿Pudiste abrir el enlace de *${params.negocioNombre}*? ¿Te gusta cómo quedó o le afinamos algún horario o detalle? 📲✨`;
}

/**
 * Plantilla oficial para Hostales, Eco-lodges y Alojamientos.
 * Enfoque: 15 días cortesía, escala trimestral por habitaciones y 0% comisiones.
 */
export function generarMensajeHospedaje(params: MensajeBaseParams): string {
  const destino = resolverNombreDestino(params);
  const url = resolverUrlPublicacion(params);
  const fechaLimite = params.fechaLimite || calcularFechaLimite(15);

  return `🌿 *¡Hola ${params.negocioNombre}! Un saludo muy especial desde PaDónde ${destino}.*

Ya tenemos su propuesta de hospedaje activa y verificada en vivo dentro de la plataforma digital oficial de ${destino}:
👉 *Ver su ficha aquí:* ${url}

Queremos darles la bienvenida con *15 días de cortesía total (prueba 100% gratuita)* a partir de hoy hasta el *${fechaLimite}*, para que comprueben cómo los viajeros y turistas internacionales encuentran sus cabañas, fotos y tarifas en tiempo real 📲✨

🌟 *El valor directo para ${params.negocioNombre}:*
• *0% de comisiones por reserva:* El huésped les escribe y cotiza directo a su WhatsApp (se ahorran el 18% al 20% que descuentan Booking o Airbnb).
• *Catálogo global en 4 idiomas:* Su hospedaje se presenta automáticamente en Español, Inglés, Francés y Alemán (ES / EN / FR / DE) para captar al viajero extranjero.
• *Presencia fija 24/7:* Indexados en la vitrina oficial recomendada de alojamientos de ${destino}.

🗓️ *Reglas claras de activación:*
• Su periodo de cortesía corre libre de costo hasta el *${fechaLimite}*.
• A partir del *${fechaLimite}*, formalizamos su presencia para toda la temporada con nuestro Plan Trimestral (asociado a su capacidad de habitaciones o cabañas):

Los pagos son trimestrales de la siguiente forma:
🏨 1 a 5 habitaciones: $125.000 COP *(menos de $1.400 al día)*
🏨 6 a 10 habitaciones: $200.000 COP
🏨 11 a 20 habitaciones: $300.000 COP
🏨 Más de 20 habitaciones: $400.000 COP

💡 *Con 1 sola noche de habitación reservada directo a su WhatsApp en los 3 meses, ya se ahorran más comisiones de Booking que el costo total de la plataforma.*

🎉 *Difusión de Eventos y Actividades:*
Si organizan noches acústicas, yoga matutino, sunsets o eventos abiertos:
• *1 evento puntual:* $30.000 COP (activo toda la semana de promoción).
• *Agenda Semanal Completa (hasta 3 eventos en la semana):* $50.000 COP.
(Incluye flyer, fechas, horarios, fotos y botón directo a su WhatsApp para reservas).

¿Pudieron abrir el enlace? Échenle un ojito a la ficha y me cuentan si sus fotos, tarifas y número de WhatsApp están al día para dejarlos activos desde hoy. ¡Muchos éxitos con las reservas en esta temporada! 🏡🌊✨`;
}

/**
 * Plantilla oficial para Tours, Guías y Actividades de Aventura.
 * Enfoque: 15 días cortesía, $125.000 COP trimestral y 0% comisiones.
 */
export function generarMensajeTours(params: MensajeBaseParams): string {
  const destino = resolverNombreDestino(params);
  const url = resolverUrlPublicacion(params);
  const fechaLimite = params.fechaLimite || calcularFechaLimite(15);

  return `🌿 *¡Hola ${params.negocioNombre}! Un saludo muy especial desde PaDónde ${destino}.*

Ya tenemos tu experiencia y recorridos turísticos activos y verificados en vivo dentro de la plataforma digital de ${destino}:
👉 *Ver tu experiencia aquí:* ${url}

Queremos darte la bienvenida con *15 días de cortesía total (prueba 100% gratuita)* a partir de hoy hasta el *${fechaLimite}*, para que compruebes cómo los turistas y viajeros internacionales que llegan a la zona descubren tus tours, fotos y detalles en tiempo real 📲✨

🌟 *Lo que ganas con PaDónde:*
• *0% de comisiones por turista:* El viajero te contacta y reserva directo a tu WhatsApp (te ahorras el 20% al 30% que cobran agencias intermediarias).
• *Plataforma global en 4 idiomas:* Tu recorrido se muestra automáticamente en Español, Inglés, Francés y Alemán (ES / EN / FR / DE) para mochileros y extranjeros.
• *Presencia turística 24/7:* Indexado en la vitrina oficial de experiencias, caminatas y aventura de ${destino}.

🗓️ *Reglas claras de activación:*
• Tu periodo de cortesía va desde hoy hasta el *${fechaLimite}*.
• A partir del *${fechaLimite}*, se liquidará el primer ciclo de visibilidad:

El pago es trimestral de la siguiente forma:
🧭 Plan Trimestral Tours & Guías: $125.000 COP *(equivale a menos de $42.000/mes — con 1 solo turista que te reserve directo ya cubres toda la suscripción y te queda ganancia)*.

Por favor entra a tu enlace, confirma que tus fotos, tarifas y descripción estén perfectas, y seguimos impulsando tus reservas directas. ¡Un gran abrazo y excelentes rutas! 🧭🌿`;
}

/**
 * Plantilla oficial para Comercio Local, Tiendas, Artesanías y Servicios Esenciales.
 * Enfoque: 15 días cortesía, tarifa trimestral accesible de $60.000 COP ($20k/mes).
 */
export function generarMensajeComercio(params: MensajeBaseParams): string {
  const destino = resolverNombreDestino(params);
  const url = resolverUrlPublicacion(params);
  const fechaLimite = params.fechaLimite || calcularFechaLimite(15);

  return `🌿 *¡Hola ${params.negocioNombre}! Un saludo muy especial desde PaDónde ${destino}.*

Ya tenemos tu negocio y servicios locales activos y verificados en vivo dentro de la plataforma digital de ${destino}:
👉 *Ver tu ficha aquí:* ${url}

Queremos darte la bienvenida con *15 días de cortesía total (prueba 100% gratuita)* a partir de hoy hasta el *${fechaLimite}*, para que compruebes cómo los viajeros y residentes encuentran tu ubicación, horarios y productos al instante 📲✨

🌟 *Lo que ganas con PaDónde:*
• *Contacto directo a tu WhatsApp:* Los clientes te contactan a un toque sin intermediarios ni comisiones.
• *Plataforma global en 4 idiomas:* Información traducida automáticamente a Español, Inglés, Francés y Alemán (ES / EN / FR / DE).
• *Presencia permanente 24/7:* Indexado en la guía de comercio y servicios esenciales de ${destino}.

🗓️ *Reglas claras de activación:*
• Tu periodo de cortesía va desde hoy hasta el *${fechaLimite}*.
• A partir del *${fechaLimite}*, se liquidará el primer ciclo de visibilidad:

El pago es trimestral de la siguiente forma:
🛵 Plan Trimestral Comercio & Servicios: $60.000 COP *($20.000/mes — menos de $700 COP al día para que el turista te encuentre de primero cuando necesita solucionar en la zona)*.

Por favor entra a tu enlace, confirma que tus datos y horarios de atención estén al día. ¡Un gran abrazo y muchos éxitos con las ventas! 🛵✨`;
}

// ─── 2. DIFUSIÓN EN REDES SOCIALES ──────────────────────────────────────────

/**
 * Plantilla oficial de difusión para que el aliado comparta en sus estados e historias.
 */
export function generarMensajeDifusionRedes(params: MensajeBaseParams): string {
  const destino = resolverNombreDestino(params);
  const url = resolverUrlPublicacion(params);

  return `🌿 *¡Hola ${params.negocioNombre}! Qué alegría saludarte desde PaDónde ${destino}.*

Tu vitrina digital oficial ya está activa en vivo y lista para recibir a viajeros y turistas de la temporada 📲✨
👉 *Enlace directo:* ${url}

Queremos ayudarte a sacarle el máximo provecho desde hoy. Cuando los negocios comparten su ficha en sus redes y estados, sus propios clientes y huéspedes empiezan a compartirla con amigos y conocidos que están planeando venir a ${destino}.

Te dejamos dos formas súper rápidas de moverlo hoy mismo:

🟢 *1. En tus Estados de WhatsApp:*
Sube una foto de tu lugar, cabaña o plato favorito y pega este texto en tu estado:
_«¡Ya tenemos nuestra vitrina oficial en PaDónde ${destino}! 🌿 Conoce nuestras fotos, carta y reserva directo a nuestro WhatsApp sin comisiones aquí:_
👉 ${url}»_

📸 *2. En tus Historias de Instagram:*
1. Sube una foto o video de tu lugar.
2. Agrega el sticker de enlace (🔗) con tu link:
   • *URL:* ${url}
   • *Texto del sticker:* «Ver Vitrina Oficial 🌿» o «Consultar Menú - Reservar 📲»
3. ¡Y menciónanos para repostearte y darte más visibilidad!

Cualquier viajero que toque el enlace podrá ver tus fotos en alta calidad, cambiar el idioma (inglés/francés/alemán) y escribirte directo al WhatsApp.

¡Muchos éxitos y que se llenen esas reservas! 🚀🌊`;
}

// ─── 3. PROSPECCIÓN COMERCIAL (NUEVOS ALIADOS) ──────────────────────────────

export type CategoriaProspeccion = "hospedajes" | "tiendas" | "eventos" | "general";

export function generarMensajeProspeccion(
  categoria: CategoriaProspeccion,
  params: MensajeBaseParams
): string {
  const destino = resolverNombreDestino(params);
  const urlCartelera = resolverUrlPublicacion(params);

  switch (categoria) {
    case "hospedajes":
      return `🌿 ¡Hola! Qué gusto saludarte.

Te escribo porque estamos impulsando PaDónde (${urlCartelera}), la cartelera digital turística en vivo de ${destino}. 📲✨

Diseñamos un espacio exclusivo para hospedajes donde los viajeros pueden ver tus fotos, servicios y cotizar tarifas por noche, con una gran ventaja: cuando el turista toca en "Consultar Disponibilidad", el mensaje te llega DIRECTO a tu WhatsApp, sin comisiones ni intermediarios de reservas.

Échale una mirada a cómo luce la vitrina aquí:
👉 ${urlCartelera}

Si te gustaría que tu hospedaje aparezca visible ante los turistas que están llegando a la zona, avísame y con todo gusto coordinamos una visita o te ayudo a montarlo en 5 minutos. ¡Un abrazo! 🏡🍃`;

    case "tiendas":
      return `👋 ¡Hola! ¿Cómo estás? Un saludo especial.

Te contacto rápidamente porque estamos lanzando la sección de "Servicios Esenciales e Info Útil" dentro de PaDónde (${urlCartelera}), la plataforma turística que están consultando los viajeros en ${destino}. 📲

Muchos turistas a diario preguntan dónde retirar efectivo, comprar víveres, conseguir transporte, farmacia o comer rico. Queremos que tu negocio esté mapeado como punto oficial para que los viajeros te encuentren fácil y te escriban directo al WhatsApp cuando necesiten lo que ofreces.

Puedes ver la cartelera aquí:
👉 ${urlCartelera}

Si quieres que te incluyamos en el directorio comercial de la zona, me avisas y te paso a visitar para dejarte registrado. ¡Muchos éxitos en las ventas! 🛒✨`;

    case "eventos":
      return `✨ ¡Hola! Espero que todo vaya excelente.

Te escribo porque en PaDónde (${urlCartelera}) tenemos la cartelera turística en vivo donde los viajeros y locales consultan qué planes, eventos, talleres, tours o rumba hay hoy y el fin de semana en ${destino}. 🌿🎉

La idea es que puedas publicar tus actividades y fechas para que los turistas se agenden y reserven cupos directamente contigo por WhatsApp.

Mira la agenda aquí:
👉 ${urlCartelera}

Si tienes planes programados para estos días y quieres promocionarlos en la cartelera, respóndeme este mensaje y te ayudo a publicarlos o paso por tu local y lo revisamos juntos. 📲🚀`;

    case "general":
    default:
      return `Hola, ¿cómo te ha ido? Espero que estés muy bien.

Te comparto un proyecto muy bonito y serio que acabamos de lanzar para fortalecer el turismo local: se llama PaDónde (${urlCartelera}) 🌿

Es una plataforma en vivo que usan mochileros, extranjeros y viajeros para ver qué hacer hoy en ${destino}: comida, hospedajes, música, tours y servicios esenciales, todo traducido en 4 idiomas y con botón directo al WhatsApp de cada negocio sin cobrar comisiones.

Si quieres conocerla o sumar tu negocio a la cartelera, entra aquí:
👉 ${urlCartelera}

¡Quedo muy atento y muchos éxitos con la temporada! 📲✨`;
  }
}

// ─── 4. COBRO, RENOVACIÓN Y PLANES PRO ──────────────────────────────────────

export interface MensajeCobroParams {
  nombre: string;
  plan: string;
  categoria?: string;
  tipoEstado: "por_vencer" | "vencido" | "gratis" | "activo";
  destinoNombre: string;
}

export function generarMensajeCobro(params: MensajeCobroParams): string {
  const { nombre, plan, categoria, tipoEstado, destinoNombre } = params;

  if (plan !== "gratis" && (tipoEstado === "por_vencer" || tipoEstado === "vencido")) {
    return `🌿 Hola ${nombre}, te escribimos de PaDónde.

Tu suscripción Plan ${plan.toUpperCase()} en la cartelera de ${destinoNombre} ${
      tipoEstado === "vencido" ? "venció recientemente" : "está próxima a vencer"
    }.

Para mantener tus planes con visibilidad destacada y continuar recibiendo turistas directos a tu WhatsApp, puedes transferir a Nequi/Daviplata.

¿Te gustaría renovar este mes? Quedamos muy atentos.`;
  }

  if (plan === "gratis") {
    const rubro = categoria ? ` de ${categoria}` : "";
    return `🌿 Hola ${nombre}, te escribimos de PaDónde.

Vemos que tienes planes${rubro} en ${destinoNombre}. ¿Te gustaría activar el Plan Pro para que aparezcan destacados en las primeras posiciones de la cartelera y recibas más clics de turistas?

Cuéntanos y te mostramos cómo funciona.`;
  }

  return `🌿 Hola ${nombre}, te escribimos de PaDónde para saber cómo va la temporada en ${destinoNombre} y si tienes nuevos eventos que quieras publicar esta semana.`;
}

// ─── 5. REPORTES DE RENDIMIENTO (GA4 / CLICS) ───────────────────────────────

export interface MensajeReporteParams {
  nombre: string;
  destinoNombre: string;
  periodoTexto: string;
  diasEfectivos: number;
  estadoAlAire: string;
  vistas: number;
  usuariosUnicos: number;
  promedioDiario: number | string;
  totalClics: number;
  eventosActivos: number;
  totalEventos: number;
  plan: string;
  estadoTexto: string;
}

export function generarMensajeReporteRendimiento(params: MensajeReporteParams): string {
  return `🌿 Reporte PaDónde — ${params.nombre}
📍 ${params.destinoNombre}, Magdalena
🗓️ Periodo analizado: ${params.periodoTexto}
⏱️ Tiempo al aire en este reporte: ${params.diasEfectivos} ${params.diasEfectivos === 1 ? "día" : "días"} (${params.estadoAlAire})
👁️ Visitas a tu propuesta: ${params.vistas} vistas (${params.usuariosUnicos} turistas únicos ~ prom. ${params.promedioDiario}/día)
📲 Contactos a WhatsApp: ${params.totalClics}
🟢 Eventos vigentes en cartelera: ${params.eventosActivos}
📅 Total de eventos registrados: ${params.totalEventos}
⭐ Plan: ${params.plan.toUpperCase()} (${params.estadoTexto})

¡Gracias por impulsar la cartelera turística de ${params.destinoNombre}!`;
}

export interface MensajeReporteDetalladoParams {
  nombre: string;
  destinoNombre: string;
  destinoUrl: string;
  periodoTexto: string;
  diasEfectivos: number;
  estadoTiempo: string;
  visitasTexto: string;
  idiomasTexto: string;
  clicsTexto: string;
  eventosActivos: number;
  totalEventos: number;
  plan: string;
  estadoTexto: string;
  categoria: string;
  balancePeriodo: string;
}

export function generarMensajeReporteDetallado(params: MensajeReporteDetalladoParams): string {
  const unidadDias = params.diasEfectivos === 1 ? "día" : "días";
  return `🌿 *Reporte de Impacto PaDónde* — *${params.nombre}*
📍 *${params.destinoNombre}, Magdalena*

¡Hola! Te compartimos el balance de visibilidad y clientes que ha generado tu propuesta en la cartelera turística oficial:

• 🗓️ *Periodo analizado:* ${params.periodoTexto}
• ⏱️ *Tiempo al aire en este reporte:* ${params.diasEfectivos} ${unidadDias} ${params.estadoTiempo}
${params.visitasTexto}${params.idiomasTexto}${params.clicsTexto}• 🟢 *Planes y eventos en vitrina:* ${params.eventosActivos} vigentes (${params.totalEventos} en historial)
• ⭐ *Plan comercial:* ${params.plan.toUpperCase()} (${params.estadoTexto})
• 🏷️ *Categoría:* ${params.categoria}

💡 *Balance del periodo:*
${params.balancePeriodo}

A partir del 1 de noviembre iniciamos el nuevo ciclo trimestral de visibilidad ($125.000 COP el trimestre, es decir menos de $42.000 al mes) e incluimos la digitalización interactiva de tu menú o catálogo de servicios.

🔗 *Ver cartelera:* ${params.destinoUrl}

¡Gracias por conectar a viajeros y locales con lo mejor de ${params.destinoNombre}! 🌿`;
}

// ─── 6. CORRECCIÓN Y REVISIÓN DE FICHA ──────────────────────────────────────

export function generarMensajeCorreccion(params: MensajeBaseParams): string {
  const destino = resolverNombreDestino(params);
  const url = resolverUrlPublicacion(params);

  return `🌿 *¡Hola ${params.negocioNombre}! Te escribimos de PaDónde ${destino}.*

Ya realizamos los ajustes solicitados en tu vitrina oficial. Quedó actualizada y al aire para todos los turistas:
👉 *Mírala aquí:* ${url}

Por favor revísala y confirma que todo esté perfecto. ¡Seguimos a tu disposición! 📲✨`;
}

export function generarMensajeRevision(params: MensajeBaseParams): string {
  const destino = resolverNombreDestino(params);
  const url = resolverUrlPublicacion(params);

  return `👋 *¡Hola ${params.negocioNombre}! Saludos desde PaDónde ${destino}.*

Queremos verificar que la información de tu vitrina siga al día para la temporada:
👉 *Enlace:* ${url}

¿Tus horarios, fotos y precios continúan vigentes, o deseas que actualicemos algún detalle? Quedamos muy atentos. 🌿`;
}
