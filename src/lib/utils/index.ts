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
export function formatFecha(iso: string): string {
  return new Intl.DateTimeFormat("es-CO", {
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
 * Verifica si la fecha de un evento coincide con el filtro de tiempo seleccionado.
 * Todos los cálculos se evalúan estrictamente en el huso horario de Colombia (UTC-5).
 *
 * Filtros soportados:
 * - "hoy": la fecha del evento coincide con la fecha de hoy en Colombia.
 * - "manana": la fecha del evento coincide con la fecha de mañana en Colombia.
 * - "YYYY-MM-DD": la fecha del evento coincide exactamente con esa fecha específica.
 */
export function eventoCoincideConFiltroTiempo(
  fechaInicioIso: string,
  filtro: string,
  now: Date = new Date()
): boolean {
  const ymdEvento = getFechaYMDDesdeISO(fechaInicioIso);
  const ymdHoy = getFechaYMDColombia(now);

  if (filtro === "hoy") {
    return ymdEvento === ymdHoy;
  }

  if (filtro === "manana") {
    const manana = new Date(now);
    manana.setDate(manana.getDate() + 1);
    const ymdManana = getFechaYMDColombia(manana);
    return ymdEvento === ymdManana;
  }

  // Fecha específica (formato YYYY-MM-DD)
  return ymdEvento === filtro;
}

// ─── Precios ──────────────────────────────────────────────────────────────────

/**
 * Formatea un precio para mostrar en la UI.
 * Si precio es null, retorna "Consultar" (precio no definido).
 * Si precio es 0, retorna "Gratis".
 */
export function formatPrecio(
  precio: number | null,
  moneda: "COP" | "USD" = "COP"
): string {
  if (precio === null) return "Consultar";
  if (precio === 0) return "Gratis";

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
  categoria: CategoriaEvento
): string {
  return `Hola! Vi tu ${categoria} "${nombreEvento}" en PaDónde y me interesa saber más. 🌿`;
}
