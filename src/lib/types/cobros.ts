/**
 * 💳 Tipos para el submódulo de finanzas y cobros a aliados (/admin/cobros).
 * Refleja la tabla `acuerdos_comerciales` y la vista `vista_cobros_aliados` de Supabase.
 */

import type { Negocio, PlanNegocio } from "./index";

/** Modalidad de facturación acordada con el aliado */
export type ModalidadCobro = "trimestral" | "mensual";

/** Estado del ciclo de cobro del aliado */
export type EstadoPago = "en_cortesia" | "al_dia" | "por_vencer" | "vencido";

/** Entidad Acuerdo Comercial en Supabase */
export type AcuerdoComercial = {
  id: string;
  negocio_id: string;
  fecha_registro_app: string;       // ISO 8601 o YYYY-MM-DD
  fecha_primer_mensaje: string;     // YYYY-MM-DD
  dias_cortesia: number;            // ej: 15
  tarifa_pactada_cop: number;       // ej: 125000
  modalidad: ModalidadCobro;        // 'trimestral' | 'mensual'
  estado_pago: EstadoPago;          // 'en_cortesia' | 'al_dia' | 'por_vencer' | 'vencido'
  proximo_cobro: string;            // YYYY-MM-DD
  notas_acuerdo: string | null;     // Condiciones especiales o notas
  created_at: string;               // ISO 8601
  updated_at: string;               // ISO 8601
};

/** Payload para crear o actualizar un acuerdo comercial desde el panel administrativo */
export type UpsertAcuerdoComercialPayload = {
  negocio_id: string;
  fecha_primer_mensaje?: string;
  dias_cortesia?: number;
  tarifa_pactada_cop?: number;
  modalidad?: ModalidadCobro;
  estado_pago?: EstadoPago;
  proximo_cobro?: string;
  notas_acuerdo?: string | null;
};

/** Entidad Negocio enriquecida con su Acuerdo Comercial */
export type NegocioConAcuerdo = Negocio & {
  acuerdo?: AcuerdoComercial | null;
};

/** Estructura directa de cada fila de la vista consolidada `vista_cobros_aliados` */
export type FilaCobroAliado = {
  negocio_id: string;
  negocio_nombre: string;
  whatsapp: string;
  instagram: string | null;
  plan: PlanNegocio;
  negocio_activo: boolean;
  zona_nombre: string | null;
  zona_slug: string | null;
  acuerdo_id: string | null;
  fecha_registro_app: string;
  fecha_primer_mensaje: string;
  dias_cortesia: number;
  tarifa_pactada_cop: number;
  modalidad: ModalidadCobro;
  estado_pago: EstadoPago;
  proximo_cobro: string;
  notas_acuerdo: string | null;
  updated_at: string | null;
};

/** Fila enriquecida con el estado dinámico calculado en tiempo de ejecución */
export type FilaCobroCalculada = FilaCobroAliado & {
  estado_calculado: EstadoPago;
  dias_restantes: number;          // Positivo = días que faltan; Negativo = días en mora; 0 = vence hoy
  dias_transcurridos: number;      // Días desde fecha_primer_mensaje hasta hoy
};

/** Indicadores clave de rendimiento (KPIs) del módulo de cobros */
export type KpisCobros = {
  totalPorCobrarCop: number;       // Suma de tarifas pactadas de aliados en estado 'por_vencer' o 'vencido'
  totalCarteraActivaCop: number;   // Cartera proyectada total de aliados activos
  aliadosEnCortesia: number;       // Cantidad de aliados disfrutando cortesía
  aliadosPorVencer: number;        // Cantidad de aliados que vencen en los próximos 5 días
  aliadosVencidos: number;         // Cantidad de aliados con fecha expirada
  aliadosAlDia: number;            // Cantidad de aliados al día
  totalAliados: number;            // Total de aliados evaluados
};

/** Respuesta del Server Action obtenerCobrosAliadosAction */
export type ObtenerCobrosResult = {
  success: boolean;
  kpis: KpisCobros;
  aliados: FilaCobroCalculada[];
  error?: string;
};

/** Input para registrar una renovación de pago */
export type RegistrarRenovacionInput = {
  acuerdoId?: string;
  negocioId?: string;
  metodoPago: "nequi" | "bancolombia" | "daviplata" | "efectivo" | "transferencia" | "otro" | string;
  montoCobrado?: number;
  notas?: string;
  fechaPago?: string;              // YYYY-MM-DD (por defecto hoy)
};

/** Respuesta estándar de operaciones de mutación de acuerdos */
export type ActionCobroResult = {
  success: boolean;
  error?: string;
  acuerdo?: AcuerdoComercial;
};
