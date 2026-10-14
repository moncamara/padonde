import type { CategoriaEvento } from "@/lib/types";
import { COMISION_BOLETERIA } from "@/constants";

// ─── Fechas ───────────────────────────────────────────────────────────────────

/**
 * Formatea una fecha ISO para mostrar en la UI.
 * Usa el locale es-CO para el formato colombiano.
 */
export function formatFecha(iso: string): string {
  return new Date(iso).toLocaleDateString("es-CO", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

/**
 * Formatea una hora ISO para mostrar en la UI. Ejemplo: "9:00 AM"
 * Usa formato manual (no toLocaleTimeString) para evitar hydration mismatch:
 * Node.js y el browser pueden producir strings de locale ligeramente distintos
 * (ej: espacio normal vs espacio estrecho en "a. m.").
 */
export function formatHora(iso: string): string {
  const d = new Date(iso);
  const h = d.getHours();
  const m = d.getMinutes();
  const ampm = h >= 12 ? "PM" : "AM";
  const hora12 = h % 12 || 12;
  const minutos = m.toString().padStart(2, "0");
  return `${hora12}:${minutos} ${ampm}`;
}

/** Retorna true si la fecha ISO corresponde al día de hoy.
 *  Acepta `now` como parámetro para facilitar testing y evitar
 *  evaluar new Date() en contextos de prerender de Next.js.
 */
export function esHoy(iso: string, now = new Date()): boolean {
  const fecha = new Date(iso);
  return (
    fecha.getDate() === now.getDate() &&
    fecha.getMonth() === now.getMonth() &&
    fecha.getFullYear() === now.getFullYear()
  );
}

/** Retorna true si la fecha cae en sábado (6) o domingo (0) */
export function esFinDeSemana(iso: string): boolean {
  const dia = new Date(iso).getDay();
  return dia === 0 || dia === 6;
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
