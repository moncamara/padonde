import type { EstadoPago } from "@/lib/types";

/**
 * Retorna la fecha actual en formato 'YYYY-MM-DD' en la zona horaria de Colombia.
 */
export function getHoyColombia(): string {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Bogota",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return formatter.format(new Date()); // 'YYYY-MM-DD'
}

/**
 * Calcula la diferencia en días enteros entre dos fechas 'YYYY-MM-DD' (fechaB - fechaA).
 */
export function calcularDiferenciaDias(fechaA: string, fechaB: string): number {
  const cleanA = fechaA.split("T")[0];
  const cleanB = fechaB.split("T")[0];

  const [yA, mA, dA] = cleanA.split("-").map(Number);
  const [yB, mB, dB] = cleanB.split("-").map(Number);

  const utcA = Date.UTC(yA, mA - 1, dA);
  const utcB = Date.UTC(yB, mB - 1, dB);

  return Math.round((utcB - utcA) / (1000 * 60 * 60 * 24));
}

/**
 * Suma meses calendario a una fecha 'YYYY-MM-DD', controlando el fin de mes.
 */
export function sumarMesesAFecha(fechaStr: string, meses: number): string {
  const clean = fechaStr.split("T")[0];
  const match = clean.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) {
    const d = new Date();
    d.setMonth(d.getMonth() + meses);
    return d.toISOString().split("T")[0];
  }

  const [, yearStr, monthStr, dayStr] = match;
  let year = parseInt(yearStr, 10);
  let month = parseInt(monthStr, 10) - 1 + meses;
  const day = parseInt(dayStr, 10);

  year += Math.floor(month / 12);
  month = ((month % 12) + 12) % 12;

  // Días máximos en el mes destino (ej: evitar 31 de febrero)
  const diasEnMes = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const finalDay = Math.min(day, diasEnMes);

  const finalDate = new Date(Date.UTC(year, month, finalDay));
  return finalDate.toISOString().split("T")[0];
}

/**
 * Extrae y suma los montos asentados en las notas de renovación (ej. "[Renovación ... | $125.000 COP]").
 */
export function extraerTotalPagosDeNotas(notas: string | null | undefined): number {
  if (!notas) return 0;
  const regex = /\[Renovaci[oó]n[^\]]*\|\s*\$([\d.,]+)\s*COP\]/gi;
  let total = 0;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(notas)) !== null) {
    const limpio = match[1].replace(/[.,\s]/g, "");
    const valor = Number(limpio);
    if (!Number.isNaN(valor) && valor > 0) {
      total += valor;
    }
  }
  return total;
}

/**
 * Determina si un aliado está en estado pausado / inactivo (no aceptó la propuesta o en pausa).
 */
export function esAliadoPausadoOInactivo(aliado: {
  negocio_activo?: boolean;
  estado_pago?: string;
  estado_calculado?: string;
}): boolean {
  if (aliado.negocio_activo === false) return true;
  if (aliado.estado_pago === "pausado" || aliado.estado_pago === "cancelado") return true;
  if (aliado.estado_calculado === "pausado" || aliado.estado_calculado === "cancelado") return true;
  return false;
}

/**
 * Evalúa en tiempo de ejecución el estado real del ciclo de pago según las reglas:
 * 1. Si negocio_activo === false o estadoGuardado === 'pausado'/'cancelado' ➔ 'pausado'.
 * 2. Si hoy > proximo_cobro y no se ha renovado ➔ 'vencido'.
 * 3. Si faltan entre 0 y 5 días para proximo_cobro ➔ 'por_vencer'.
 * 4. Si hoy < proximo_cobro y días transcurridos <= dias_cortesia (o estado persistido en_cortesia) ➔ 'en_cortesia'.
 * 5. De lo contrario (o si fue renovado y no está por vencer) ➔ 'al_dia'.
 */
export function calcularEstadoCobroDinamico(params: {
  estadoGuardado: EstadoPago;
  fechaPrimerMensaje: string;
  diasCortesia: number;
  proximoCobro: string;
  hoyColombia?: string;
  negocioActivo?: boolean;
}): {
  estadoCalculado: EstadoPago;
  diasRestantes: number;
  diasTranscurridos: number;
} {
  const hoy = params.hoyColombia || getHoyColombia();
  const proximoLimpio = params.proximoCobro.split("T")[0];
  const primerMensajeLimpio = params.fechaPrimerMensaje.split("T")[0];

  const diasRestantes = calcularDiferenciaDias(hoy, proximoLimpio);
  const diasTranscurridos = calcularDiferenciaDias(primerMensajeLimpio, hoy);

  let estadoCalculado: EstadoPago;

  if (
    params.negocioActivo === false ||
    params.estadoGuardado === "pausado" ||
    params.estadoGuardado === "cancelado"
  ) {
    estadoCalculado = "pausado";
  } else if (diasRestantes < 0) {
    // La fecha de vencimiento ya pasó
    estadoCalculado = "vencido";
  } else if (diasRestantes <= 5) {
    // Faltan entre 0 y 5 días (urgencia de cobro / recordatorio)
    estadoCalculado = "por_vencer";
  } else if (params.estadoGuardado === "al_dia") {
    // Ya renovó y tiene más de 5 días de cobertura
    estadoCalculado = "al_dia";
  } else if (diasTranscurridos <= params.diasCortesia || params.estadoGuardado === "en_cortesia") {
    // Dentro del periodo de cortesía inicial
    estadoCalculado = "en_cortesia";
  } else {
    estadoCalculado = "al_dia";
  }

  return {
    estadoCalculado,
    diasRestantes,
    diasTranscurridos,
  };
}
