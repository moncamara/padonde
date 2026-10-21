import type { CategoriaEvento } from "@/lib/types";
import { COMISION_BOLETERIA } from "@/constants";

// ─── Fechas y Zona Horaria (Colombia UTC-5) ──────────────────────────────────
export const TIMEZONE_COLOMBIA = "America/Bogota";

/**
 * Obtiene la fecha YYYY-MM-DD en la zona horaria de Colombia.
 */
export function getFechaYMDColombia(date: Date = new Date()): string {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: TIMEZONE_COLOMBIA,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return formatter.format(date); // Retorna formato ISO YYYY-MM-DD
}

/**
 * Convierte una fecha ISO a YYYY-MM-DD según la hora de Colombia.
 */
export function getFechaYMDDesdeISO(iso: string): string {
  return getFechaYMDColombia(new Date(iso));
}

/**
 * Formatea una fecha ISO para mostrar en la UI en hora colombiana.
 * Ejemplo: "mié, 14 oct"
 */
export function formatFecha(iso: string, locale = "es"): string {
  const intlLocale =
    locale === "de"
      ? "de-DE"
      : locale === "fr"
      ? "fr-FR"
      : locale === "en"
      ? "en-US"
      : "es-CO";

  return new Intl.DateTimeFormat(intlLocale, {
    timeZone: TIMEZONE_COLOMBIA,
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(new Date(iso));
}

/**
 * Formatea una hora ISO para mostrar en la UI en hora colombiana.
 * Ejemplo: "9:00 AM" o "8:30 PM"
 */
export function formatHora(iso: string): string {
  const d = new Date(iso);
  // Obtenemos hora y minutos exactos en Colombia
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: TIMEZONE_COLOMBIA,
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
  return formatter.format(d);
}

/**
 * Obtiene los minutos transcurridos desde la medianoche en hora de Colombia (0 a 1439).
 * Permite ordenar eventos de más temprano a más tarde en el día,
 * independientemente de la fecha calendario en que fue creado el registro.
 */
export function getMinutosDelDiaColombia(iso: string): number {
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return 0;
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: TIMEZONE_COLOMBIA,
      hour: "numeric",
      minute: "numeric",
      hourCycle: "h23",
    });

    const parts = formatter.formatToParts(d);
    let hour = 0;
    let minute = 0;
    for (const part of parts) {
      if (part.type === "hour") hour = parseInt(part.value, 10);
      if (part.type === "minute") minute = parseInt(part.value, 10);
    }
    if (hour === 24) hour = 0;

    return hour * 60 + minute;
  } catch {
    return 0;
  }
}

/** Retorna true si la fecha ISO corresponde al día de hoy en Colombia */
export function esHoy(iso: string, now = new Date()): boolean {
  return getFechaYMDDesdeISO(iso) === getFechaYMDColombia(now);
}

/** Retorna true si la fecha cae en fin de semana en Colombia (sábado o domingo) */
export function esFinDeSemana(iso: string): boolean {
  // Determinamos el día de la semana en Colombia
  const diaSemanaStr = new Intl.DateTimeFormat("en-US", {
    timeZone: TIMEZONE_COLOMBIA,
    weekday: "short",
  }).format(new Date(iso));
  return diaSemanaStr === "Sat" || diaSemanaStr === "Sun";
}

export type OpcionDiaFiltro = {
  id: string; // 'hoy', 'manana', o 'YYYY-MM-DD'
  label: string; // 'Hoy', 'Mañana', 'Jue 15', etc.
  ymd?: string; // YYYY-MM-DD si es un día específico
};

/**
 * Genera la lista de opciones para el selector de tiempo (próximos 7 días)
 * calculado en la hora real de Colombia.
 */
export function getOpcionesTiempoColombia(): OpcionDiaFiltro[] {
  const hoyColombia = new Date();
  const opciones: OpcionDiaFiltro[] = [];

  // 1. Hoy
  const ymdHoy = getFechaYMDColombia(hoyColombia);
  opciones.push({ id: "hoy", label: "Hoy", ymd: ymdHoy });

  // 2. Mañana
  const manana = new Date(hoyColombia);
  manana.setDate(manana.getDate() + 1);
  const ymdManana = getFechaYMDColombia(manana);
  opciones.push({ id: "manana", label: "Mañana", ymd: ymdManana });

  // 3. Los siguientes 5 días (con formato "Jue 16", "Vie 17", etc.)
  for (let i = 2; i <= 6; i++) {
    const diaSig = new Date(hoyColombia);
    diaSig.setDate(diaSig.getDate() + i);
    const ymd = getFechaYMDColombia(diaSig);

    // Formatear etiqueta corta: ej "jue 15"
    const label = new Intl.DateTimeFormat("es-CO", {
      timeZone: TIMEZONE_COLOMBIA,
      weekday: "short",
      day: "numeric",
    }).format(diaSig);

    // Capitalizar primera letra: "Jue 15"
    const labelCap = label.charAt(0).toUpperCase() + label.slice(1).replace(".", "");
    opciones.push({ id: ymd, label: labelCap, ymd });
  }

  // 4. Opción para explorar planes futuros más allá de los próximos 6 días
  opciones.push({ id: "proximos", label: "Más adelante" });

  return opciones;
}

/**
 * Convierte un string de datetime-local ("YYYY-MM-DDTHH:mm") ingresado por el usuario
 * a un string ISO 8601 explícitamente en la zona horaria de Colombia (UTC-5).
 * Esto evita desfases horarios cuando el servidor ejecuta en UTC (ej: Vercel).
 */
export function parseLocalColombiaAISO(dateTimeStr: string): string {
  if (!dateTimeStr) return new Date().toISOString();
  // Si ya contiene información de zona horaria (Z o offset +/-HH:mm), parsear directamente
  if (dateTimeStr.includes("Z") || /[+-]\d{2}:\d{2}$/.test(dateTimeStr)) {
    return new Date(dateTimeStr).toISOString();
  }
  // Si viene de input datetime-local tipo "2026-10-15T19:00"
  const [fechaYHora] = dateTimeStr.split(".");
  const conSegundos = fechaYHora.length === 16 ? `${fechaYHora}:00` : fechaYHora;
  return new Date(`${conSegundos}-05:00`).toISOString();
}

/**
 * Convierte un string ISO a formato 'YYYY-MM-DDTHH:mm' en hora local de Colombia (UTC-5),
 * listo para usarse como defaultValue o value en un <input type="datetime-local" />.
 */
export function isoADatetimeLocalColombia(isoStr?: string | null): string {
  if (!isoStr) return "";
  const d = new Date(isoStr);
  if (isNaN(d.getTime())) return "";

  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: TIMEZONE_COLOMBIA,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(d);

  const getPart = (type: string) => parts.find((p) => p.type === type)?.value || "";
  let hour = getPart("hour");
  if (hour === "24") hour = "00";
  return `${getPart("year")}-${getPart("month")}-${getPart("day")}T${hour}:${getPart("minute")}`;
}

// ─── Recurrencia y Experiencias Diarias ────────────────────────────────────────

export interface RecurrenciaConfig {
  esRecurrente: boolean;
  dias: number[]; // 0=Dom, 1=Lun, 2=Mar, 3=Mié, 4=Jue, 5=Vie, 6=Sáb
}

/**
 * Extrae la configuración de días de repetición embebida en la descripción.
 */
export function extraerRecurrencia(descripcion?: string | null): RecurrenciaConfig {
  if (!descripcion) return { esRecurrente: false, dias: [] };
  const match = descripcion.match(/<!--recurrente:([0-6,]+)-->/);
  if (!match) return { esRecurrente: false, dias: [] };
  const dias = match[1]
    .split(",")
    .map((n) => parseInt(n.trim(), 10))
    .filter((n) => !isNaN(n) && n >= 0 && n <= 6);
  return { esRecurrente: dias.length > 0, dias };
}

/**
 * Limpia la descripción eliminando cualquier metadato técnico de recurrencia.
 */
export function limpiarDescripcionRecurrencia(descripcion?: string | null): string {
  if (!descripcion) return "";
  return descripcion.replace(/<!--recurrente:[0-6,]+-->/g, "").trim();
}

/**
 * Inyecta o actualiza la etiqueta de recurrencia en la descripción.
 */
export function inyectarRecurrencia(descripcion: string, dias: number[]): string {
  const limpia = limpiarDescripcionRecurrencia(descripcion);
  if (!dias || dias.length === 0) return limpia;
  return `${limpia}\n\n<!--recurrente:${dias.join(",")}-->`.trim();
}

/**
 * Formatea los días de la semana en un texto amigable y legible para humanos.
 * Ej: "Todos los días", "Lun a Vie", "Vie, Sáb y Dom", "Fines de semana".
 */
export function formatearDiasRecurrencia(dias: number[], locale = "es"): string {
  if (!dias || dias.length === 0) return "";
  if (dias.length === 7) {
    if (locale === "de") return "Jeden Tag";
    if (locale === "fr") return "Tous les jours";
    if (locale === "en") return "Every day";
    return "Todos los días";
  }

  const diasSet = new Set(dias);
  if (dias.length === 5 && [1, 2, 3, 4, 5].every((d) => diasSet.has(d))) {
    if (locale === "de") return "Mo bis Fr";
    if (locale === "fr") return "Lun au Ven";
    if (locale === "en") return "Mon to Fri";
    return "Lun a Vie";
  }
  if (dias.length === 6 && [1, 2, 3, 4, 5, 6].every((d) => diasSet.has(d))) {
    if (locale === "de") return "Mo bis Sa";
    if (locale === "fr") return "Lun au Sam";
    if (locale === "en") return "Mon to Sat";
    return "Lun a Sáb";
  }
  if (dias.length === 3 && [5, 6, 0].every((d) => diasSet.has(d))) {
    if (locale === "de") return "Fr, Sa & So";
    if (locale === "fr") return "Ven, Sam et Dim";
    if (locale === "en") return "Fri, Sat & Sun";
    return "Vie, Sáb y Dom";
  }
  if (dias.length === 2 && [6, 0].every((d) => diasSet.has(d))) {
    if (locale === "de") return "Wochenenden";
    if (locale === "fr") return "Week-ends";
    if (locale === "en") return "Weekends";
    return "Fines de semana";
  }

  const nombresPorIdioma: Record<string, Record<number, string>> = {
    es: { 1: "Lun", 2: "Mar", 3: "Mié", 4: "Jue", 5: "Vie", 6: "Sáb", 0: "Dom" },
    en: { 1: "Mon", 2: "Tue", 3: "Wed", 4: "Thu", 5: "Fri", 6: "Sat", 0: "Sun" },
    de: { 1: "Mo", 2: "Di", 3: "Mi", 4: "Do", 5: "Fr", 6: "Sa", 0: "So" },
    fr: { 1: "Lun", 2: "Mar", 3: "Mer", 4: "Jeu", 5: "Ven", 6: "Sam", 0: "Dim" },
  };

  const nombresCortos = nombresPorIdioma[locale] || nombresPorIdioma.es;
  const ordenados = [...dias].sort((a, b) => (a === 0 ? 7 : a) - (b === 0 ? 7 : b));
  return ordenados.map((d) => nombresCortos[d]).join(", ");
}

/**
 * Genera la etiqueta de fecha y hora para mostrar en tarjetas y cabeceras.
 * Si es recurrente: "🔄 Todos los días · 6:00 AM" / "🔄 Every day · 6:00 AM"
 * Si es puntual: "jue, 15 oct · 7:00 PM" / "Thu, Oct 15 · 7:00 PM"
 */
export function getEtiquetaHorario(
  evento: {
    fecha_inicio: string;
    fecha_fin?: string | null;
    descripcion?: string | null;
    tipo?: string | null;
  },
  locale = "es"
): string {
  // Para hospedajes y alojamientos, no mostramos fecha puntual de creación, sino disponibilidad
  if (evento.tipo === "hospedaje") {
    const labels: Record<string, string> = {
      es: "Reserva directa · Todo el año",
      en: "Direct booking · Year-round",
      fr: "Réservation directe · Toute l'année",
      de: "Direktbuchung · Ganzjährig",
    };
    return `🏡 ${labels[locale] || labels.es}`;
  }

  const rec = extraerRecurrencia(evento.descripcion);
  const hora = formatHora(evento.fecha_inicio);

  if (rec.esRecurrente) {
    const diasTexto = formatearDiasRecurrencia(rec.dias, locale);
    return `🔄 ${diasTexto} · ${hora}`;
  }

  // Si es un evento de varios días (rango continuo con fecha_fin en otro día)
  const ymdInicio = getFechaYMDDesdeISO(evento.fecha_inicio);
  const ymdFin = evento.fecha_fin ? getFechaYMDDesdeISO(evento.fecha_fin) : null;
  if (ymdFin && ymdFin > ymdInicio && evento.fecha_fin) {
    return `${formatFecha(evento.fecha_inicio, locale)} — ${formatFecha(evento.fecha_fin, locale)}`;
  }

  return `${formatFecha(evento.fecha_inicio, locale)} · ${hora}`;
}

/**
 * Obtiene el día de la semana (0=Dom, 1=Lun, ..., 6=Sáb) evaluado en Colombia.
 */
export function getDayOfWeekColombia(dateStr: string): number {
  const d = new Date(dateStr.includes("T") ? dateStr : `${dateStr}T12:00:00-05:00`);
  const dayStr = new Intl.DateTimeFormat("en-US", {
    timeZone: TIMEZONE_COLOMBIA,
    weekday: "short",
  }).format(d);
  const map: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  return map[dayStr] ?? 0;
}

/**
 * Verifica si la fecha de un evento coincide con el filtro de tiempo seleccionado.
 * Soporta eventos puntuales, rangos continuos y experiencias recurrentes por días de semana.
 * Todos los cálculos se evalúan estrictamente en el huso horario de Colombia (UTC-5).
 */
export function eventoCoincideConFiltroTiempo(
  fechaInicioIso: string,
  filtro: string,
  now: Date = new Date(),
  fechaFinIso?: string | null,
  descripcion?: string | null,
  tipo?: string | null
): boolean {
  // Los hospedajes y alojamientos tienen disponibilidad permanente (todo el año).
  // Coinciden con cualquier día del calendario (hoy, mañana, días específicos, todos).
  if (tipo === "hospedaje") {
    // Si se consulta "proximos" (agenda lejana futura), no se muestran como eventos futuros generales
    if (filtro === "proximos") return false;
    return true;
  }

  // Caso especial: Planes futuros más allá del rango de 7 días visible en la barra
  if (filtro === "proximos") {
    // La barra muestra 7 días individuales: hoy (día 0) hasta hoy + 6 días
    const limiteBarra = new Date(now);
    limiteBarra.setDate(limiteBarra.getDate() + 6);
    const limiteBarraYMD = getFechaYMDColombia(limiteBarra);

    const ymdInicio = getFechaYMDDesdeISO(fechaInicioIso);
    const ymdFin = fechaFinIso ? getFechaYMDDesdeISO(fechaFinIso) : null;
    const rec = extraerRecurrencia(descripcion);

    // Las actividades recurrentes diarias (ej: menús del día, tours permanentes)
    // ya se muestran en cada día correspondiente de la semana y no son eventos futuros "Más adelante"
    if (rec.esRecurrente && rec.dias.length >= 6) {
      return false;
    }

    // Eventos que inician después del rango de 7 días visible
    if (ymdInicio > limiteBarraYMD) {
      return true;
    }

    // Eventos especiales de varios días (no diarios) que se extienden más allá de los 7 días
    if (!rec.esRecurrente && ymdFin && ymdFin > limiteBarraYMD) {
      return true;
    }

    return false;
  }

  if (filtro === "todos") {
    const hoyYMD = getFechaYMDColombia(now);
    const ymdInicio = getFechaYMDDesdeISO(fechaInicioIso);
    const ymdFin = fechaFinIso ? getFechaYMDDesdeISO(fechaFinIso) : null;
    return ymdFin ? ymdFin >= hoyYMD : ymdInicio >= hoyYMD;
  }

  let ymdTarget = filtro;
  if (filtro === "hoy") {
    ymdTarget = getFechaYMDColombia(now);
  } else if (filtro === "manana") {
    const manana = new Date(now);
    manana.setDate(manana.getDate() + 1);
    ymdTarget = getFechaYMDColombia(manana);
  }

  const ymdInicio = getFechaYMDDesdeISO(fechaInicioIso);
  const ymdFin = fechaFinIso ? getFechaYMDDesdeISO(fechaFinIso) : null;
  const rec = extraerRecurrencia(descripcion);

  // Caso 1: Evento recurrente (días específicos de la semana)
  if (rec.esRecurrente) {
    if (ymdTarget < ymdInicio) return false;
    if (ymdFin && ymdTarget > ymdFin) return false;

    const diaSemana = getDayOfWeekColombia(ymdTarget);
    return rec.dias.includes(diaSemana);
  }

  // Caso 2: Rango continuo de fechas (ej: festival o curso de varios días consecutivos)
  if (ymdFin && ymdFin > ymdInicio) {
    return ymdTarget >= ymdInicio && ymdTarget <= ymdFin;
  }

  // Caso 3: Evento puntual de 1 solo día
  return ymdInicio === ymdTarget;
}

// ─── Precios ──────────────────────────────────────────────────────────────────

/**
 * Formatea un precio para mostrar en la UI.
 * Si precio es null o 0, retorna "Consultar" (precio no definido o a consultar).
 */
export function formatPrecio(
  precio: number | null,
  moneda: "COP" | "USD" = "COP"
): string {
  if (precio === null || precio === 0) return "Consultar";

  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: moneda,
    maximumFractionDigits: 0,
  }).format(precio);
}

/**
 * Calcula el precio con comisión de plataforma para boletería.
 * La comisión se suma al precio base y la absorbe el comprador.
 */
export function precioConComision(precioBase: number): number {
  return Math.ceil(precioBase * (1 + COMISION_BOLETERIA));
}

// ─── Texto ────────────────────────────────────────────────────────────────────

/** Trunca un texto a N caracteres y agrega "..." si fue truncado */
export function truncar(texto: string, maxChars: number): string {
  if (texto.length <= maxChars) return texto;
  return texto.slice(0, maxChars).trimEnd() + "…";
}

/** Genera el mensaje de WhatsApp predefinido al contactar un negocio */
export function mensajeWhatsApp(
  nombreEvento: string,
  _categoria?: CategoriaEvento
): string {
  return `Hola! Vi tu publicación "${nombreEvento}" en PaDónde. [Reserva PaDónde 🌿] Me interesa saber disponibilidad y cómo llegar.`;
}
