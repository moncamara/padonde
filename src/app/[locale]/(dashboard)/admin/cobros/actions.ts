"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type {
  FilaCobroAliado,
  FilaCobroCalculada,
  KpisCobros,
  ObtenerCobrosResult,
  UpsertAcuerdoComercialPayload,
  RegistrarRenovacionInput,
  ActionCobroResult,
  EstadoPago,
  AcuerdoComercial,
} from "@/lib/types";
import {
  getHoyColombia,
  sumarMesesAFecha,
  calcularEstadoCobroDinamico,
} from "./cobrosUtils";

// ─── Server Action: Obtener Cobros y KPIs ────────────────────────────────────

/**
 * Consulta la vista `vista_cobros_aliados`, computa en tiempo real los estados y
 * genera los KPIs consolidados de tesorería y cartera para el módulo /admin/cobros.
 */
export async function obtenerCobrosAliadosAction(): Promise<ObtenerCobrosResult> {
  try {
    const supabase = await createClient();

    // 1. Verificar sesión autenticada de Super Admin
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        success: false,
        kpis: {
          totalPorCobrarCop: 0,
          totalCarteraActivaCop: 0,
          aliadosEnCortesia: 0,
          aliadosPorVencer: 0,
          aliadosVencidos: 0,
          aliadosAlDia: 0,
          totalAliados: 0,
        },
        aliados: [],
        error: "No autorizado. Debes iniciar sesión como administrador.",
      };
    }

    // 2. Consultar vista consolidada
    const { data, error } = await supabase
      .from("vista_cobros_aliados")
      .select("*")
      .order("proximo_cobro", { ascending: true });

    if (error) {
      console.error("[obtenerCobrosAliadosAction] Error al consultar vista_cobros_aliados:", error);
      return {
        success: false,
        kpis: {
          totalPorCobrarCop: 0,
          totalCarteraActivaCop: 0,
          aliadosEnCortesia: 0,
          aliadosPorVencer: 0,
          aliadosVencidos: 0,
          aliadosAlDia: 0,
          totalAliados: 0,
        },
        aliados: [],
        error: `Error en base de datos: ${error.message}`,
      };
    }

    const hoy = getHoyColombia();
    const filas = (data || []) as FilaCobroAliado[];

    // 3. Evaluar estados dinámicos y acumular KPIs
    let totalPorCobrarCop = 0;
    let totalCarteraActivaCop = 0;
    let aliadosEnCortesia = 0;
    let aliadosPorVencer = 0;
    let aliadosVencidos = 0;
    let aliadosAlDia = 0;

    const aliadosCalculados: FilaCobroCalculada[] = filas.map((aliado) => {
      const tarifa = Number(aliado.tarifa_pactada_cop) || 0;
      if (aliado.negocio_activo) {
        totalCarteraActivaCop += tarifa;
      }

      const { estadoCalculado, diasRestantes, diasTranscurridos } = calcularEstadoCobroDinamico({
        estadoGuardado: aliado.estado_pago,
        fechaPrimerMensaje: aliado.fecha_primer_mensaje,
        diasCortesia: aliado.dias_cortesia,
        proximoCobro: aliado.proximo_cobro,
        hoyColombia: hoy,
      });

      // Contadores de KPIs
      switch (estadoCalculado) {
        case "vencido":
          aliadosVencidos++;
          totalPorCobrarCop += tarifa;
          break;
        case "por_vencer":
          aliadosPorVencer++;
          totalPorCobrarCop += tarifa;
          break;
        case "en_cortesia":
          aliadosEnCortesia++;
          break;
        case "al_dia":
          aliadosAlDia++;
          break;
      }

      return {
        ...aliado,
        estado_calculado: estadoCalculado,
        dias_restantes: diasRestantes,
        dias_transcurridos: diasTranscurridos,
      };
    });

    // 4. Ordenamiento inteligente: Urgencias primero (vencidos -> por_vencer -> cortesía -> al día)
    const prioridadEstado: Record<EstadoPago, number> = {
      vencido: 1,
      por_vencer: 2,
      en_cortesia: 3,
      al_dia: 4,
    };

    aliadosCalculados.sort((a, b) => {
      const diffPrioridad = prioridadEstado[a.estado_calculado] - prioridadEstado[b.estado_calculado];
      if (diffPrioridad !== 0) return diffPrioridad;
      return a.dias_restantes - b.dias_restantes;
    });

    const kpis: KpisCobros = {
      totalPorCobrarCop,
      totalCarteraActivaCop,
      aliadosEnCortesia,
      aliadosPorVencer,
      aliadosVencidos,
      aliadosAlDia,
      totalAliados: aliadosCalculados.length,
    };

    return {
      success: true,
      kpis,
      aliados: aliadosCalculados,
    };
  } catch (err: any) {
    console.error("[obtenerCobrosAliadosAction] Error inesperado:", err);
    return {
      success: false,
      kpis: {
        totalPorCobrarCop: 0,
        totalCarteraActivaCop: 0,
        aliadosEnCortesia: 0,
        aliadosPorVencer: 0,
        aliadosVencidos: 0,
        aliadosAlDia: 0,
        totalAliados: 0,
      },
      aliados: [],
      error: err?.message || "Ocurrió un error inesperado al calcular cobros.",
    };
  }
}

// ─── Server Action: Actualizar Acuerdo Comercial ────────────────────────────

/**
 * Modifica o inserta los parámetros comerciales de un aliado (tarifa, modalidad, cortesía, etc.).
 */
export async function actualizarAcuerdoComercialAction(
  payload: UpsertAcuerdoComercialPayload
): Promise<ActionCobroResult> {
  try {
    const supabase = await createClient();

    // 1. Verificar sesión de Super Admin
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: "No autorizado. Inicia sesión en el panel." };
    }

    if (!payload.negocio_id) {
      return { success: false, error: "El ID del negocio aliado es obligatorio." };
    }

    // 2. Preparar campos de actualización
    const updateData: Record<string, any> = {
      negocio_id: payload.negocio_id,
      updated_at: new Date().toISOString(),
    };

    if (payload.tarifa_pactada_cop !== undefined) {
      updateData.tarifa_pactada_cop = Math.max(0, Number(payload.tarifa_pactada_cop));
    }
    if (payload.modalidad !== undefined) {
      updateData.modalidad = payload.modalidad;
    }
    if (payload.dias_cortesia !== undefined) {
      updateData.dias_cortesia = Math.max(0, Number(payload.dias_cortesia));
    }
    if (payload.fecha_primer_mensaje !== undefined) {
      updateData.fecha_primer_mensaje = payload.fecha_primer_mensaje.split("T")[0];
    }
    if (payload.estado_pago !== undefined) {
      updateData.estado_pago = payload.estado_pago;
    }
    if (payload.notas_acuerdo !== undefined) {
      updateData.notas_acuerdo = payload.notas_acuerdo;
    }
    if (payload.proximo_cobro !== undefined && payload.proximo_cobro) {
      updateData.proximo_cobro = payload.proximo_cobro.split("T")[0];
    } else if (payload.dias_cortesia !== undefined && payload.fecha_primer_mensaje !== undefined) {
      // Recalcular proximo_cobro si se especifican cortesía y fecha primer mensaje
      const fechaBase = payload.fecha_primer_mensaje.split("T")[0];
      const match = fechaBase.match(/^(\d{4})-(\d{2})-(\d{2})$/);
      if (match) {
        const [y, m, d] = fechaBase.split("-").map(Number);
        const dt = new Date(Date.UTC(y, m - 1, d));
        dt.setUTCDate(dt.getUTCDate() + updateData.dias_cortesia);
        updateData.proximo_cobro = dt.toISOString().split("T")[0];
      }
    }

    // 3. Ejecutar upsert en acuerdos_comerciales
    const { data, error } = await supabase
      .from("acuerdos_comerciales")
      .upsert(updateData, { onConflict: "negocio_id" })
      .select()
      .single();

    if (error) {
      console.error("[actualizarAcuerdoComercialAction] Error en upsert:", error);
      return { success: false, error: `Error al actualizar acuerdo: ${error.message}` };
    }

    // 4. Revalidar rutas administrativas
    revalidatePath("/admin/cobros");
    revalidatePath("/[locale]/(dashboard)/admin/cobros", "page");
    revalidatePath("/admin/aliados");

    return {
      success: true,
      acuerdo: data as AcuerdoComercial,
    };
  } catch (err: any) {
    console.error("[actualizarAcuerdoComercialAction] Error inesperado:", err);
    return { success: false, error: err?.message || "Error al actualizar acuerdo comercial." };
  }
}

// ─── Server Action: Registrar Renovación de Pago ─────────────────────────────

/**
 * Registra un pago recibido de un aliado, traslada la fecha de proximo_cobro
 * (1 mes si es mensual, 3 meses si es trimestral) y pone el estado en 'al_dia'.
 */
export async function registrarRenovacionPagoAction(
  input: RegistrarRenovacionInput
): Promise<ActionCobroResult> {
  try {
    const supabase = await createClient();

    // 1. Verificar sesión de Super Admin
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: "No autorizado. Inicia sesión en el panel." };
    }

    if (!input.acuerdoId && !input.negocioId) {
      return { success: false, error: "Debes especificar el acuerdoId o el negocioId." };
    }

    // 2. Obtener acuerdo actual
    let query = supabase.from("acuerdos_comerciales").select("*");
    if (input.acuerdoId) {
      query = query.eq("id", input.acuerdoId);
    } else if (input.negocioId) {
      query = query.eq("negocio_id", input.negocioId);
    }

    const { data: acuerdoActual, error: fetchError } = await query.single();

    if (fetchError || !acuerdoActual) {
      return {
        success: false,
        error: `No se encontró el acuerdo comercial: ${fetchError?.message || "No existe registro"}`,
      };
    }

    const modalidad = acuerdoActual.modalidad || "trimestral";
    const mesesASumar = modalidad === "mensual" ? 1 : 3;

    // 3. Determinar fecha base para el nuevo ciclo
    // Si la fecha actual de cobro aún no ha vencido, extendemos a partir de esa fecha.
    // Si ya estaba vencida, extendemos a partir de la fecha de pago (hoy por defecto).
    const hoy = getHoyColombia();
    const fechaPago = input.fechaPago ? input.fechaPago.split("T")[0] : hoy;
    const proximoCobroActual = acuerdoActual.proximo_cobro ? acuerdoActual.proximo_cobro.split("T")[0] : hoy;

    const fechaBase = proximoCobroActual > fechaPago ? proximoCobroActual : fechaPago;
    const nuevoProximoCobro = sumarMesesAFecha(fechaBase, mesesASumar);

    // 4. Generar nota de auditoría del pago
    const monto = input.montoCobrado !== undefined ? input.montoCobrado : acuerdoActual.tarifa_pactada_cop;
    const notaPago = `[Renovación ${fechaPago} | ${input.metodoPago.toUpperCase()} | $${Number(monto).toLocaleString("es-CO")} COP]${
      input.notas ? ` - ${input.notas}` : ""
    }`;

    const notasActualizadas = acuerdoActual.notas_acuerdo
      ? `${notaPago}\n${acuerdoActual.notas_acuerdo}`
      : notaPago;

    // 5. Actualizar registro en acuerdos_comerciales
    const { data: acuerdoActualizado, error: updateError } = await supabase
      .from("acuerdos_comerciales")
      .update({
        estado_pago: "al_dia",
        proximo_cobro: nuevoProximoCobro,
        notas_acuerdo: notasActualizadas,
        updated_at: new Date().toISOString(),
      })
      .eq("id", acuerdoActual.id)
      .select()
      .single();

    if (updateError) {
      console.error("[registrarRenovacionPagoAction] Error al actualizar pago:", updateError);
      return { success: false, error: `Error al registrar pago: ${updateError.message}` };
    }

    // 6. Revalidar caché administrativa
    revalidatePath("/admin/cobros");
    revalidatePath("/[locale]/(dashboard)/admin/cobros", "page");
    revalidatePath("/admin/aliados");

    return {
      success: true,
      acuerdo: acuerdoActualizado as AcuerdoComercial,
    };
  } catch (err: any) {
    console.error("[registrarRenovacionPagoAction] Error inesperado:", err);
    return { success: false, error: err?.message || "Error al registrar renovación de pago." };
  }
}
