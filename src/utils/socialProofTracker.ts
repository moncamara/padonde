/**
 * Helper Determinista de Visualizaciones Diarias (Social Proof)
 *
 * REGLAS DE BLINDAJE ESTRICTO:
 * - 0 consultas a Google Analytics o endpoints intermedios.
 * - 0 peticiones SQL o REST a Supabase.
 * - 0 consumo de CPU en Vercel: Ejecutado 100% en el cliente (Browser).
 * - Determinista: Sin parpadeo o cambios aleatorios al recargar la página.
 */

import { TIMEZONE_COLOMBIA, getFechaYMDColombia } from "@/lib/utils";

export interface SocialProofResult {
  viajerosHoy: number;
  baseAyer: number;
  incrementoHora: number;
  tramoHorario: "madrugada" | "manana" | "tarde_noche";
  debugInfo: string;
}

/**
 * Calcula un hash numérico entero y determinista a partir de un string
 */
function hashNegocioId(id: string): number {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash << 5) - hash + id.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

/**
 * Retorna las visualizaciones estimadas de hoy con progresión horaria natural.
 * 
 * Reglas:
 * 1. Detección de creación en el día actual (America/Bogota, UTC-5):
 *    - Si esCreadoHoy === true: baseAyer = 1 estrictamente (ayer no existía).
 *    - Si esCreadoHoy === false: base = Math.max(1, vistosAyerBase || 1).
 * 2. 00:00 - 05:59: base (incremento = 0)
 * 3. 06:00 - 13:59: base + 1 (incremento = 1)
 * 4. 14:00 - 23:59: base + 1 + incrementoTarde (1 o 2 según hash del negocioId)
 */
export function calcularVisualizacionesDiarias(
  negocioId: string,
  vistosAyerBase?: number,
  createdAt?: string | Date | null
): SocialProofResult {
  const safeId = negocioId || "padonde-general";
  const now = new Date();

  // 1. Detección de Fecha de Creación bajo la zona horaria legal de Colombia (America/Bogota)
  const fechaHoy = getFechaYMDColombia(now);
  let fechaCreacion: string | null = null;
  if (createdAt) {
    try {
      const d = typeof createdAt === "string" ? new Date(createdAt) : createdAt;
      if (!isNaN(d.getTime())) {
        fechaCreacion = getFechaYMDColombia(d);
      }
    } catch {
      fechaCreacion = null;
    }
  }
  const esCreadoHoy = Boolean(fechaCreacion && fechaCreacion === fechaHoy);

  // 2. Lógica de Base:
  // Si fue creado hoy, ayer no existía y su base arranca estrictamente en 1.
  // Si ya tiene días de publicado, mantiene su cálculo con la base acumulada previa que le corresponda.
  const base = esCreadoHoy ? 1 : Math.max(1, vistosAyerBase || 1);

  // 3. Progresión horaria calculada en horario legal de Colombia
  let hora = now.getHours();
  try {
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: TIMEZONE_COLOMBIA,
      hour: "numeric",
      hourCycle: "h23",
    });
    const parsed = parseInt(formatter.format(now), 10);
    if (!isNaN(parsed)) {
      hora = parsed === 24 ? 0 : parsed;
    }
  } catch {}

  // incrementoTarde: 1 o 2 determinista
  const hash = hashNegocioId(safeId);
  const incrementoTarde = (hash % 2) + 1;

  let incrementoHora = 0;
  let tramoHorario: "madrugada" | "manana" | "tarde_noche" = "madrugada";

  if (hora >= 0 && hora < 6) {
    // Madrugada: 00:00 a 05:59
    incrementoHora = 0;
    tramoHorario = "madrugada";
  } else if (hora >= 6 && hora < 14) {
    // Mañana: 06:00 a 13:59
    incrementoHora = 1;
    tramoHorario = "manana";
  } else {
    // Tarde/Noche: 14:00 a 23:59
    incrementoHora = 1 + incrementoTarde;
    tramoHorario = "tarde_noche";
  }

  const viajerosHoy = base + incrementoHora;
  const debugInfo = `[Debug: Base Ayer: ${base} | Incremento Hora: ${incrementoHora}${esCreadoHoy ? " | Creado Hoy: SI" : ""}]`;

  return {
    viajerosHoy,
    baseAyer: base,
    incrementoHora,
    tramoHorario,
    debugInfo,
  };
}

// Alias de conveniencia
export const getVisualizacionesDiarias = calcularVisualizacionesDiarias;
