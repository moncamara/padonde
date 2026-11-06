/**
 * Helper Determinista de Visualizaciones Diarias (Social Proof)
 *
 * REGLAS DE BLINDAJE ESTRICTO:
 * - 0 consultas a Google Analytics o endpoints intermedios.
 * - 0 peticiones SQL o REST a Supabase.
 * - 0 consumo de CPU en Vercel: Ejecutado 100% en el cliente (Browser).
 * - Determinista: Sin parpadeo o cambios aleatorios al recargar la página.
 */

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
 * 1. Base inicial: Math.max(1, vistosAyerBase || 1)
 * 2. 00:00 - 05:59: base (incremento = 0)
 * 3. 06:00 - 13:59: base + 1 (incremento = 1)
 * 4. 14:00 - 23:59: base + 1 + incrementoTarde (1 o 2 según hash del negocioId)
 */
export function calcularVisualizacionesDiarias(
  negocioId: string,
  vistosAyerBase?: number
): SocialProofResult {
  const safeId = negocioId || "padonde-general";
  const base = Math.max(1, vistosAyerBase || 1);

  const now = new Date();
  const hora = now.getHours();

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
  const debugInfo = `[Debug: Base Ayer: ${base} | Incremento Hora: ${incrementoHora}]`;

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
