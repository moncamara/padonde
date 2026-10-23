export interface GenerarEnlaceHospedajeParams {
  telefono: string;
  hostalNombre: string;
  habitacionTitulo: string;
  checkIn: string; // formato YYYY-MM-DD o legible
  checkOut: string; // formato YYYY-MM-DD o legible
  noches: number;
  huespedes: number;
  precioTotalCOP: number;
  idioma?: string;
}

/**
 * Genera un enlace limpio y seguro a WhatsApp con encodeURIComponent,
 * formateo de moneda colombiana y saltos de línea compatibles con iOS/Android.
 */
export function generarEnlaceWhatsAppHospedaje({
  telefono,
  hostalNombre,
  habitacionTitulo,
  checkIn,
  checkOut,
  noches,
  huespedes,
  precioTotalCOP,
  idioma = "es",
}: GenerarEnlaceHospedajeParams): string {
  let cleanPhone = (telefono || "").replace(/\D/g, "");
  // Si es un celular colombiano de 10 dígitos que inicia por 3 (ej: 3151234567), anteponer 57
  if (cleanPhone.length === 10 && cleanPhone.startsWith("3")) {
    cleanPhone = `57${cleanPhone}`;
  }
  if (cleanPhone.startsWith("5757")) {
    cleanPhone = cleanPhone.slice(2);
  }
  if (!cleanPhone) {
    cleanPhone = "573000000000";
  }

  // Mensaje en Español (por defecto) o adaptado
  let lineas: string[] = [];

  if (idioma === "en") {
    lineas = [
      `Hi ${hostalNombre}! 🌿 I saw your stay on PaDónde.`,
      `I'd like to check availability for:`,
      ``,
      `🏡 *${habitacionTitulo}*`,
      `📅 *Check-in:* ${checkIn}`,
      `📅 *Check-out:* ${checkOut} (${noches} ${noches === 1 ? "night" : "nights"})`,
      `👥 *Guests:* ${huespedes}`,
      `💰 *Estimated total:* $${precioTotalCOP.toLocaleString("es-CO")} COP`,
      ``,
      `Do you have availability for these dates? Thank you!`,
    ];
  } else if (idioma === "fr") {
    lineas = [
      `Bonjour ${hostalNombre} ! 🌿 J'ai vu votre hébergement sur PaDónde.`,
      `J'aimerais vérifier la disponibilité pour :`,
      ``,
      `🏡 *${habitacionTitulo}*`,
      `📅 *Arrivée :* ${checkIn}`,
      `📅 *Départ :* ${checkOut} (${noches} ${noches === 1 ? "nuit" : "nuits"})`,
      `👥 *Voyageurs :* ${huespedes}`,
      `💰 *Total estimé :* $${precioTotalCOP.toLocaleString("es-CO")} COP`,
      ``,
      `Avez-vous de la disponibilité pour ces dates ? Merci !`,
    ];
  } else if (idioma === "de") {
    lineas = [
      `Hallo ${hostalNombre}! 🌿 Ich habe deine Unterkunft auf PaDónde gesehen.`,
      `Ich möchte die Verfügbarkeit anfragen für:`,
      ``,
      `🏡 *${habitacionTitulo}*`,
      `📅 *Check-in:* ${checkIn}`,
      `📅 *Check-out:* ${checkOut} (${noches} ${noches === 1 ? "Nacht" : "Nächte"})`,
      `👥 *Gäste:* ${huespedes}`,
      `💰 *Geschätzter Gesamtpreis:* $${precioTotalCOP.toLocaleString("es-CO")} COP`,
      ``,
      `Habt ihr für diese Daten noch Verfügbarkeit? Danke!`,
    ];
  } else {
    // Español (default)
    lineas = [
      `¡Hola ${hostalNombre}! 🌿 Vi su hospedaje en PaDónde.`,
      `Me gustaría consultar disponibilidad para:`,
      ``,
      `🏡 *${habitacionTitulo}*`,
      `📅 *Check-in:* ${checkIn}`,
      `📅 *Check-out:* ${checkOut} (${noches} ${noches === 1 ? "noche" : "noches"})`,
      `👥 *Huéspedes:* ${huespedes}`,
      `💰 *Cotización estimada:* $${precioTotalCOP.toLocaleString("es-CO")} COP`,
      ``,
      `¿Tienen disponibilidad para estas fechas? ¡Muchas gracias!`,
    ];
  }

  const mensaje = lineas.join("\n");
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(mensaje)}`;
}
