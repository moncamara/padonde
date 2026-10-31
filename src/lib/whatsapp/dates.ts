/**
 * Utilidades para cálculo de fechas comerciales y límites de cortesía en mensajes de WhatsApp.
 */

const MESES_ES = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

/**
 * Calcula la fecha calendario en N días a partir de hoy (por defecto 15 días).
 * Ejemplo: "15 de Noviembre"
 */
export function calcularFechaLimite(dias: number = 15): string {
  const target = new Date();
  target.setDate(target.getDate() + dias);
  const dia = target.getDate();
  const mes = MESES_ES[target.getMonth()];
  return `${dia} de ${mes}`;
}

/**
 * Retorna la fecha límite formateada para 15 días (alias retrocompatible).
 */
export function calcularFechaEn15Dias(): string {
  return calcularFechaLimite(15);
}
