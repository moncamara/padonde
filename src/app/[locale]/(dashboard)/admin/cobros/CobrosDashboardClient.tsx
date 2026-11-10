"use client";

import { useState, useTransition, useMemo } from "react";
import type {
  FilaCobroCalculada,
  KpisCobros,
  ObtenerCobrosResult,
  EstadoPago,
} from "@/lib/types";
import { obtenerCobrosAliadosAction, alternarEstadoActivoAliadoAction } from "./actions";
import { esAliadoPausadoOInactivo } from "./cobrosUtils";
import { ModalRegistrarPago } from "./ModalRegistrarPago";
import { ModalAjustarAcuerdo } from "./ModalAjustarAcuerdo";

interface CobrosDashboardClientProps {
  initialData: ObtenerCobrosResult;
}

type FiltroEstadoPildora = "todos" | "pausados" | EstadoPago;

/**
 * Genera el mensaje oficial preformateado para WhatsApp según el estado del aliado.
 */
function generarMensajeWhatsAppCobro(aliado: FilaCobroCalculada): string {
  const nombre = aliado.negocio_nombre;
  const tarifaFormateada = `$${Number(aliado.tarifa_pactada_cop || 0).toLocaleString("es-CO")} COP`;
  const modalidadTexto = aliado.modalidad === "mensual" ? "mensual" : "trimestral";
  const proximoCobroLimpio = aliado.proximo_cobro ? aliado.proximo_cobro.split("T")[0] : "";

  let fechaLegible = proximoCobroLimpio;
  try {
    const [y, m, d] = proximoCobroLimpio.split("-").map(Number);
    const dateObj = new Date(Date.UTC(y, m - 1, d));
    fechaLegible = dateObj.toLocaleDateString("es-CO", {
      day: "numeric",
      month: "long",
      timeZone: "UTC",
    });
  } catch {
    fechaLegible = proximoCobroLimpio;
  }

  if (aliado.estado_calculado === "vencido") {
    const diasMora = Math.abs(aliado.dias_restantes);
    const fraseTiempo =
      aliado.dias_restantes < 0
        ? `venció el pasado ${fechaLegible}${diasMora > 0 ? ` (hace ${diasMora} día${diasMora > 1 ? "s" : ""})` : ""}`
        : `vence el próximo ${fechaLegible}`;

    return `Hola equipo de *${nombre}* 🌿\n\nTe saludamos desde la administración de *PaDónde*. Te escribimos cordialmente para recordarles que el periodo de su plan ${modalidadTexto} en la plataforma ${fraseTiempo}.\n\nPara mantener su vitrina activa, los eventos destacados y las reservas directas por WhatsApp con los turistas, les compartimos los datos de renovación por el valor acordado de *${tarifaFormateada}*:\n\n🟣 *Nequi:* 3013010194\n🟡 *Bancolombia (Ahorros):* 080 756 549 53\n\nPor favor nos envían el comprobante por este medio una vez realizado para actualizar su vigencia en el sistema. ¡Muchas gracias por seguir haciendo crecer el turismo local con nosotros! 🙌`;
  }

  if (aliado.estado_calculado === "por_vencer") {
    const dias = aliado.dias_restantes;
    const tiempoVencimiento =
      dias === 0
        ? "vence *hoy*"
        : dias === 1
        ? `vence *mañana* (${fechaLegible})`
        : `vence el próximo *${fechaLegible}* (en ${dias} días)`;

    return `¡Hola equipo de *${nombre}*! 🌿\n\nTe saludamos de *PaDónde*. Esperamos que estén teniendo una excelente semana de reservas y visitantes.\n\nTe escribimos con un recordatorio amigable: su periodo activo en la plataforma ${tiempoVencimiento}. Para no interrumpir la publicación de sus experiencias y la vitrina a viajeros, podemos coordinar la renovación de su plan ${modalidadTexto} (*${tarifaFormateada}*):\n\n🟣 *Nequi:* 3013010194\n🟡 *Bancolombia (Ahorros):* 080 756 549 53\n\nUna vez realizado el pago, nos envían el comprobante por aquí para dejar su cuenta al día. ¡Quedamos muy atentos! ✨`;
  }

  if (aliado.estado_calculado === "en_cortesia") {
    const dias = aliado.dias_restantes;
    const fraseTiempo =
      dias === 0
        ? "vence *hoy*"
        : dias === 1
        ? `vence *mañana* (${fechaLegible})`
        : `vence el próximo *${fechaLegible}* (quedan ${dias} días)`;

    return `¡Hola amigos de *${nombre}*! 🌿\n\nDesde *PaDónde* esperamos que estén disfrutando de la vitrina digital y de los turistas que llegan a través de la app.\n\nQueremos recordarles que sus ${aliado.dias_cortesia || 15} días de bienvenida y cortesía gratuita ${fraseTiempo}. Si desean continuar con su vitrina activa y destacados de eventos, la tarifa acordada es de *${tarifaFormateada}* (${modalidadTexto}):\n\n🟣 *Nequi:* 3013010194\n🟡 *Bancolombia (Ahorros):* 080 756 549 53\n\n¿Tienen alguna duda o necesitan apoyo con nuevos eventos para publicar esta semana? ¡Un abrazo grande! 🚀`;
  }

  // Al día
  return `¡Hola equipo de *${nombre}*! 🌿\n\nUn saludo cordial de *PaDónde*. Queríamos confirmarles que su vitrina y plan comercial se encuentran *al día* hasta el *${fechaLegible}*. Si tienen nuevos eventos, menús o novedades para promocionar esta semana, no duden en avisarnos para apoyarlos en la difusión. ¡Éxitos! 🌟`;
}

function generarEnlaceWhatsApp(aliado: FilaCobroCalculada): string {
  const cleanPhone = (aliado.whatsapp || "").replace(/\D/g, "");
  const tel = cleanPhone.startsWith("57")
    ? cleanPhone
    : cleanPhone.length === 10
    ? "57" + cleanPhone
    : cleanPhone || "573218507204";
  const mensaje = generarMensajeWhatsAppCobro(aliado);
  return `https://wa.me/${tel}?text=${encodeURIComponent(mensaje)}`;
}

export function CobrosDashboardClient({ initialData }: CobrosDashboardClientProps) {
  const [data, setData] = useState<ObtenerCobrosResult>(initialData);
  const [isPending, startTransition] = useTransition();

  // Filtros
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [filtroEstado, setFiltroEstado] = useState<FiltroEstadoPildora>("todos");
  const [filtroZona, setFiltroZona] = useState<string>("todas");

  // Modales
  const [pagoAliado, setPagoAliado] = useState<FilaCobroCalculada | null>(null);
  const [ajusteAliado, setAjusteAliado] = useState<FilaCobroCalculada | null>(null);

  // Toast / Notificaciones
  const [toastMsg, setToastMsg] = useState<{ tipo: "exito" | "error"; texto: string } | null>(null);

  const kpis: KpisCobros = data.kpis || {
    totalPorCobrarCop: 0,
    totalRecaudadoCop: 0,
    totalCarteraActivaCop: 0,
    aliadosEnCortesia: 0,
    aliadosPorVencer: 0,
    aliadosVencidos: 0,
    aliadosAlDia: 0,
    aliadosPausados: 0,
    totalAliadosActivos: 0,
    totalAliados: 0,
  };

  const [reactivandoId, setReactivandoId] = useState<string | null>(null);

  const reactivarAliado = async (aliado: FilaCobroCalculada) => {
    if (reactivandoId) return;
    setReactivandoId(aliado.negocio_id);
    try {
      const res = await alternarEstadoActivoAliadoAction(aliado.negocio_id, true);
      if (res.success) {
        mostrarToast(`${aliado.negocio_nombre} reactivado y de vuelta en la cartera activa ✅`, "exito");
        refrescarDatos();
      } else {
        mostrarToast(res.error || "No se pudo reactivar el aliado", "error");
      }
    } finally {
      setReactivandoId(null);
    }
  };

  const mostrarToast = (texto: string, tipo: "exito" | "error" = "exito") => {
    setToastMsg({ tipo, texto });
    setTimeout(() => setToastMsg(null), 5000);
  };

  const refrescarDatos = () => {
    startTransition(async () => {
      const res = await obtenerCobrosAliadosAction();
      if (res.success) {
        setData(res);
      } else {
        mostrarToast(res.error || "Error al refrescar cobros", "error");
      }
    });
  };

  const copiarMensaje = async (aliado: FilaCobroCalculada) => {
    try {
      const msg = generarMensajeWhatsAppCobro(aliado);
      await navigator.clipboard.writeText(msg);
      mostrarToast(`Texto con datos de pago copiado al portapapeles 📋`, "exito");
    } catch {
      mostrarToast("No se pudo copiar automáticamente al portapapeles", "error");
    }
  };

  // Zonas únicas disponibles
  const zonasDisponibles = useMemo(() => {
    const setZonas = new Set<string>();
    (data.aliados || []).forEach((a) => {
      if (a.zona_nombre) setZonas.add(a.zona_nombre);
    });
    return Array.from(setZonas).sort();
  }, [data.aliados]);

  // Filtrado de aliados
  const aliadosFiltrados = useMemo(() => {
    return (data.aliados || []).filter((a) => {
      // 1. Separación Activos vs Pausados / No Aceptaron
      const pausado = esAliadoPausadoOInactivo(a);
      if (filtroEstado === "pausados") {
        if (!pausado) return false;
      } else {
        if (pausado) return false;
        if (filtroEstado !== "todos" && a.estado_calculado !== filtroEstado) {
          return false;
        }
      }

      // 2. Filtro por Zona
      if (filtroZona !== "todas" && a.zona_nombre !== filtroZona) {
        return false;
      }

      // 3. Filtro por Búsqueda (nombre, notas, zona, whatsapp)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const nombre = (a.negocio_nombre || "").toLowerCase();
        const zona = (a.zona_nombre || "").toLowerCase();
        const notas = (a.notas_acuerdo || "").toLowerCase();
        const tel = (a.whatsapp || "").toLowerCase();
        if (!nombre.includes(q) && !zona.includes(q) && !notas.includes(q) && !tel.includes(q)) {
          return false;
        }
      }

      return true;
    });
  }, [data.aliados, filtroEstado, filtroZona, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Toast Notificación */}
      {toastMsg && (
        <div
          className={`fixed bottom-6 right-6 z-50 p-4 rounded-2xl shadow-xl border flex items-center gap-3 text-xs font-sans max-w-md animate-in slide-in-from-bottom-5 duration-200 ${
            toastMsg.tipo === "exito"
              ? "bg-emerald-50 text-emerald-900 border-emerald-200"
              : "bg-rose-50 text-rose-900 border-rose-200"
          }`}
        >
          <span className="text-base">{toastMsg.tipo === "exito" ? "✅" : "⚠️"}</span>
          <p className="flex-1 font-medium">{toastMsg.texto}</p>
          <button
            onClick={() => setToastMsg(null)}
            className="text-stone-400 hover:text-stone-600 text-sm font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* Cabecera del Submódulo */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">💳</span>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-forest">
              Finanzas & Cobros a Aliados
            </h1>
          </div>
          <p className="text-stone text-xs sm:text-sm mt-1">
            Control de cortesías, alertas automáticas de WhatsApp y recaudos comerciales en PaDónde.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={refrescarDatos}
            disabled={isPending}
            className="px-3.5 py-2 rounded-xl border border-stone-light/80 bg-white hover:bg-stone-50 text-stone-dark text-xs font-medium shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            title="Refrescar estados y cartera"
          >
            <span className={isPending ? "animate-spin" : ""}>🔄</span>
            <span>{isPending ? "Actualizando..." : "Actualizar"}</span>
          </button>
        </div>
      </div>

      {/* A. Resumen de KPIs (Tarjetas Superiores) */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
        {/* Total por Cobrar */}
        <div className="bg-gradient-to-br from-rose-50 to-amber-50/50 p-4 rounded-3xl border border-rose-200/80 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-rose-800 uppercase tracking-wider">
              Por Cobrar
            </span>
            <span className="text-base">🚨</span>
          </div>
          <div className="my-2">
            <div className="font-serif text-xl sm:text-2xl font-bold text-rose-900 tracking-tight">
              ${kpis.totalPorCobrarCop.toLocaleString("es-CO")}
            </div>
            <div className="text-[11px] text-rose-700/80 font-sans mt-0.5">
              COP acumulados en mora / alerta
            </div>
          </div>
          <div className="text-[10px] text-stone font-medium">
            Cartera activa total: ${kpis.totalCarteraActivaCop.toLocaleString("es-CO")}
          </div>
        </div>

        {/* Total Recaudado / Recibido */}
        <div className="bg-gradient-to-br from-emerald-50 to-teal-50/60 p-4 rounded-3xl border border-emerald-200/90 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-emerald-800 uppercase tracking-wider">
              Recaudado / Recibido
            </span>
            <span className="text-base">💵</span>
          </div>
          <div className="my-2">
            <div className="font-serif text-xl sm:text-2xl font-bold text-emerald-900 tracking-tight">
              ${(kpis.totalRecaudadoCop || 0).toLocaleString("es-CO")}
            </div>
            <div className="text-[11px] text-emerald-700/90 font-sans mt-0.5">
              COP efectivamente cobrados
            </div>
          </div>
          <div className="text-[10px] text-emerald-800 font-medium">
            {kpis.aliadosAlDia} {kpis.aliadosAlDia === 1 ? "aliado al día" : "aliados al día"} con pago vigente
          </div>
        </div>

        {/* Aliados Vencidos */}
        <div className="bg-white p-4 rounded-3xl border border-stone-light/70 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-stone uppercase tracking-wider">
              Vencidos
            </span>
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
          </div>
          <div className="my-2">
            <div className="font-serif text-2xl font-bold text-rose-600">
              {kpis.aliadosVencidos}
            </div>
            <div className="text-[11px] text-stone font-sans">Cobro vencido</div>
          </div>
          <span className="inline-flex items-center gap-1 text-[10px] text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full font-medium w-fit">
            Requieren cobro urgente
          </span>
        </div>

        {/* Próximos a Vencer */}
        <div className="bg-white p-4 rounded-3xl border border-stone-light/70 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-stone uppercase tracking-wider">
              Por Vencer
            </span>
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
          </div>
          <div className="my-2">
            <div className="font-serif text-2xl font-bold text-amber-600">
              {kpis.aliadosPorVencer}
            </div>
            <div className="text-[11px] text-stone font-sans">En 1 a 5 días</div>
          </div>
          <span className="inline-flex items-center gap-1 text-[10px] text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full font-medium w-fit">
            Enviar recordatorio amigable
          </span>
        </div>

        {/* En Cortesía */}
        <div className="bg-white p-4 rounded-3xl border border-stone-light/70 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-stone uppercase tracking-wider">
              En Cortesía
            </span>
            <span className="w-2.5 h-2.5 rounded-full bg-orange-400" />
          </div>
          <div className="my-2">
            <div className="font-serif text-2xl font-bold text-orange-600">
              {kpis.aliadosEnCortesia}
            </div>
            <div className="text-[11px] text-stone font-sans">15 días gratuitos</div>
          </div>
          <span className="inline-flex items-center gap-1 text-[10px] text-orange-800 bg-orange-50 px-2 py-0.5 rounded-full font-medium w-fit">
            Periodo de bienvenida
          </span>
        </div>

        {/* Al Día */}
        <div className="bg-white p-4 rounded-3xl border border-stone-light/70 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-stone uppercase tracking-wider">
              Al Día
            </span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
          </div>
          <div className="my-2">
            <div className="font-serif text-2xl font-bold text-emerald-600">
              {kpis.aliadosAlDia}
            </div>
            <div className="text-[11px] text-stone font-sans">Pago vigente</div>
          </div>
          <span className="inline-flex items-center gap-1 text-[10px] text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full font-medium w-fit">
            {kpis.totalAliadosActivos} aliados activos
          </span>
        </div>
      </div>

      {/* B. Barra de Herramientas y Filtros */}
      <div className="bg-white p-4 rounded-3xl border border-stone-light/70 shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Buscador */}
          <div className="relative flex-1">
            <span className="absolute left-3.5 top-2.5 text-stone text-sm">🔍</span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar aliado, zona, notas o WhatsApp..."
              className="w-full pl-9 pr-8 py-2 rounded-2xl border border-stone-light/80 text-xs font-sans placeholder:text-stone-400 focus:border-forest focus:ring-1 focus:ring-forest outline-hidden bg-cream/40"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-2.5 text-stone-400 hover:text-stone-600 text-xs"
              >
                ✕
              </button>
            )}
          </div>

          {/* Selector de Zona */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs text-stone font-medium">Zona:</span>
            <select
              value={filtroZona}
              onChange={(e) => setFiltroZona(e.target.value)}
              className="px-3 py-2 rounded-2xl border border-stone-light/80 text-xs font-sans font-medium focus:border-forest focus:ring-1 focus:ring-forest outline-hidden bg-cream/40 text-stone-dark"
            >
              <option value="todas">Todas las Zonas</option>
              {zonasDisponibles.map((z) => (
                <option key={z} value={z}>
                  {z}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Píldoras de Filtro por Estado */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1">
          <button
            type="button"
            onClick={() => setFiltroEstado("todos")}
            className={`px-3 py-1.5 rounded-xl text-xs font-sans font-medium whitespace-nowrap transition-all cursor-pointer ${
              filtroEstado === "todos"
                ? "bg-forest text-white font-semibold shadow-xs"
                : "bg-stone-50 text-stone hover:bg-stone-100 border border-stone-light/50"
            }`}
          >
            Todos ({kpis.totalAliadosActivos})
          </button>

          <button
            type="button"
            onClick={() => setFiltroEstado("vencido")}
            className={`px-3 py-1.5 rounded-xl text-xs font-sans font-medium whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
              filtroEstado === "vencido"
                ? "bg-rose-600 text-white font-semibold shadow-xs"
                : "bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200"
            }`}
          >
            <span>🔴</span>
            <span>Vencidos ({kpis.aliadosVencidos})</span>
          </button>

          <button
            type="button"
            onClick={() => setFiltroEstado("por_vencer")}
            className={`px-3 py-1.5 rounded-xl text-xs font-sans font-medium whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
              filtroEstado === "por_vencer"
                ? "bg-amber-500 text-white font-semibold shadow-xs"
                : "bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200"
            }`}
          >
            <span>🟡</span>
            <span>Por Vencer 1-5d ({kpis.aliadosPorVencer})</span>
          </button>

          <button
            type="button"
            onClick={() => setFiltroEstado("en_cortesia")}
            className={`px-3 py-1.5 rounded-xl text-xs font-sans font-medium whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
              filtroEstado === "en_cortesia"
                ? "bg-orange-500 text-white font-semibold shadow-xs"
                : "bg-orange-50 text-orange-800 hover:bg-orange-100 border border-orange-200"
            }`}
          >
            <span>🟠</span>
            <span>En Cortesía ({kpis.aliadosEnCortesia})</span>
          </button>

          <button
            type="button"
            onClick={() => setFiltroEstado("al_dia")}
            className={`px-3 py-1.5 rounded-xl text-xs font-sans font-medium whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
              filtroEstado === "al_dia"
                ? "bg-emerald-600 text-white font-semibold shadow-xs"
                : "bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200"
            }`}
          >
            <span>🟢</span>
            <span>Al Día ({kpis.aliadosAlDia})</span>
          </button>

          <button
            type="button"
            onClick={() => setFiltroEstado("pausados")}
            className={`px-3 py-1.5 rounded-xl text-xs font-sans font-medium whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
              filtroEstado === "pausados"
                ? "bg-stone-700 text-white font-semibold shadow-xs"
                : "bg-stone-100 text-stone-700 hover:bg-stone-200 border border-stone-300"
            }`}
          >
            <span>⏸️</span>
            <span>Pausados / No Aceptaron ({kpis.aliadosPausados})</span>
          </button>
        </div>
      </div>

      {/* C. Tabla / Tarjetas de Aliados */}
      {aliadosFiltrados.length === 0 ? (
        <div className="bg-white p-12 rounded-3xl border border-stone-light/70 text-center space-y-3">
          <span className="text-4xl block">🍃</span>
          <h3 className="font-serif text-lg font-bold text-forest">
            No se encontraron aliados con estos filtros
          </h3>
          <p className="text-stone text-xs max-w-sm mx-auto">
            Intenta cambiar el término de búsqueda o selecciona otra pestaña de estado.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery("");
              setFiltroEstado("todos");
              setFiltroZona("todas");
            }}
            className="text-xs text-forest hover:underline font-medium cursor-pointer"
          >
            Restablecer todos los filtros
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-stone-light/70 shadow-2xs overflow-hidden">
          {/* Vista Desktop (Tabla) */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left text-xs font-sans">
              <thead className="bg-cream/70 border-b border-stone-light/60 text-forest font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3.5 px-4">Aliado & Destino</th>
                  <th className="py-3.5 px-4">Tarifa & Modalidad</th>
                  <th className="py-3.5 px-4">Vigencia / Próx. Cobro</th>
                  <th className="py-3.5 px-4">Estado</th>
                  <th className="py-3.5 px-4 text-right">Acciones Rápidas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-light/40">
                {aliadosFiltrados.map((aliado) => {
                  const dias = aliado.dias_restantes;
                  const proximoLimpio = aliado.proximo_cobro
                    ? aliado.proximo_cobro.split("T")[0]
                    : "N/D";
                  const waUrl = generarEnlaceWhatsApp(aliado);

                  return (
                    <tr
                      key={aliado.negocio_id}
                      className="hover:bg-stone-50/70 transition-colors group"
                    >
                      {/* Aliado & Destino */}
                      <td className="py-4 px-4">
                        <div className="font-bold text-forest text-sm">
                          {aliado.negocio_nombre}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5 text-stone text-[11px]">
                          <span className="bg-cream px-2 py-0.5 rounded-full border border-stone-light/60">
                            📍 {aliado.zona_nombre || "Minca"}
                          </span>
                          <span>WhatsApp: {aliado.whatsapp}</span>
                        </div>
                        {aliado.notas_acuerdo && (
                          <div className="mt-1 text-[11px] text-stone-500 italic line-clamp-1 max-w-xs">
                            💬 {aliado.notas_acuerdo}
                          </div>
                        )}
                      </td>

                      {/* Tarifa & Modalidad */}
                      <td className="py-4 px-4">
                        <div className="font-mono font-bold text-stone-dark text-sm">
                          ${Number(aliado.tarifa_pactada_cop || 0).toLocaleString("es-CO")} COP
                        </div>
                        <div className="text-[11px] text-stone uppercase tracking-wider font-medium">
                          {aliado.modalidad || "trimestral"}
                        </div>
                      </td>

                      {/* Vigencia / Próx. Cobro */}
                      <td className="py-4 px-4 font-mono">
                        <div className="font-medium text-stone-dark text-xs flex items-center gap-1.5">
                          <span>📅</span>
                          <span>{proximoLimpio}</span>
                        </div>
                        <div className="text-[11px] text-stone mt-0.5 font-sans">
                          {dias < 0 ? (
                            <span className="text-rose-600 font-bold">
                              Mora de {Math.abs(dias)} día{Math.abs(dias) > 1 ? "s" : ""}
                            </span>
                          ) : dias === 0 ? (
                            <span className="text-amber-600 font-bold">Vence hoy</span>
                          ) : (
                            <span>Quedan {dias} días</span>
                          )}
                        </div>
                      </td>

                      {/* Badge Estado Semáforo */}
                      <td className="py-4 px-4">
                        {aliado.estado_calculado === "vencido" && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300">
                            <span className="w-2 h-2 rounded-full bg-rose-600 animate-pulse" />
                            Vencido ({dias < 0 ? `${dias}d` : "Mora"})
                          </span>
                        )}
                        {aliado.estado_calculado === "por_vencer" && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
                            <span className="w-2 h-2 rounded-full bg-amber-600" />
                            Por Vencer ({dias}d)
                          </span>
                        )}
                        {aliado.estado_calculado === "en_cortesia" && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-900 border border-orange-300">
                            <span className="w-2 h-2 rounded-full bg-orange-500" />
                            En Cortesía ({dias}d)
                          </span>
                        )}
                        {aliado.estado_calculado === "al_dia" && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-900 border border-emerald-300">
                            <span className="w-2 h-2 rounded-full bg-emerald-600" />
                            Al Día ({dias}d)
                          </span>
                        )}
                        {(aliado.estado_calculado === "pausado" || aliado.estado_calculado === "cancelado") && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-stone-100 text-stone-700 border border-stone-300">
                            ⏸️ Pausado / No aceptó
                          </span>
                        )}
                      </td>

                      {/* Acciones Rápidas */}
                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {esAliadoPausadoOInactivo(aliado) && (
                            <button
                              type="button"
                              onClick={() => reactivarAliado(aliado)}
                              disabled={reactivandoId === aliado.negocio_id}
                              className="px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-[11px] shadow-2xs transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50"
                              title="Reactivar aliado y devolverlo a la cartera activa"
                            >
                              <span>▶️</span>
                              <span>{reactivandoId === aliado.negocio_id ? "Reactivando..." : "Reactivar"}</span>
                            </button>
                          )}
                          {!esAliadoPausadoOInactivo(aliado) && (<>
                          {/* Botón WhatsApp */}
                          <a
                            href={waUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-[11px] shadow-2xs transition-all flex items-center gap-1 cursor-pointer"
                            title="Abrir chat en WhatsApp"
                          >
                            <span>💬</span>
                            <span>WhatsApp</span>
                          </a>

                          {/* Botón Copiar Mensaje */}
                          <button
                            type="button"
                            onClick={() => copiarMensaje(aliado)}
                            className="p-1.5 rounded-xl border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[11px] transition-all cursor-pointer"
                            title="Copiar texto con emoticones al portapapeles"
                          >
                            📋
                          </button>

                          {/* Botón Registrar Pago */}
                          <button
                            type="button"
                            onClick={() => setPagoAliado(aliado)}
                            className="px-2.5 py-1.5 rounded-xl bg-forest hover:bg-forest-dark text-white font-medium text-[11px] shadow-2xs transition-all flex items-center gap-1 cursor-pointer"
                            title="Registrar pago recibido y extender vigencia"
                          >
                            <span>💵</span>
                            <span>Pago</span>
                          </button>
                          </>)}

                          {/* Botón Ajustar Acuerdo */}
                          <button
                            type="button"
                            onClick={() => setAjusteAliado(aliado)}
                            className="p-1.5 rounded-xl border border-stone-light/80 hover:bg-stone-100 text-stone text-[11px] transition-all cursor-pointer"
                            title="Ajustar tarifa, cortesía o modalidad"
                          >
                            ⚙️
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Vista Mobile (Tarjetas) */}
          <div className="md:hidden divide-y divide-stone-light/40">
            {aliadosFiltrados.map((aliado) => {
              const dias = aliado.dias_restantes;
              const proximoLimpio = aliado.proximo_cobro
                ? aliado.proximo_cobro.split("T")[0]
                : "N/D";
              const waUrl = generarEnlaceWhatsApp(aliado);

              return (
                <div key={aliado.negocio_id} className="p-4 space-y-3">
                  {/* Encabezado Tarjeta */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-bold text-forest text-sm">
                        {aliado.negocio_nombre}
                      </h4>
                      <div className="flex items-center gap-1.5 text-stone text-[11px] mt-0.5">
                        <span>📍 {aliado.zona_nombre || "Minca"}</span>
                        <span>•</span>
                        <span>{aliado.whatsapp}</span>
                      </div>
                    </div>

                    {/* Badge */}
                    <div>
                      {aliado.estado_calculado === "vencido" && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
                          🔴 Vencido
                        </span>
                      )}
                      {aliado.estado_calculado === "por_vencer" && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                          🟡 Por vencer ({dias}d)
                        </span>
                      )}
                      {aliado.estado_calculado === "en_cortesia" && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-orange-100 text-orange-900 border border-orange-300">
                          🟠 Cortesía ({dias}d)
                        </span>
                      )}
                      {aliado.estado_calculado === "al_dia" && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-100 text-emerald-900 border border-emerald-300">
                          🟢 Al día ({dias}d)
                        </span>
                      )}
                      {(aliado.estado_calculado === "pausado" || aliado.estado_calculado === "cancelado") && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-stone-100 text-stone-700 border border-stone-300">
                          ⏸️ Pausado
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Datos Comerciales */}
                  <div className="bg-cream p-3 rounded-2xl border border-stone-light/50 flex justify-between items-center text-xs">
                    <div>
                      <div className="text-stone text-[10px] uppercase tracking-wider">
                        Tarifa & Ciclo
                      </div>
                      <div className="font-mono font-bold text-stone-dark">
                        ${Number(aliado.tarifa_pactada_cop || 0).toLocaleString("es-CO")} COP
                      </div>
                      <div className="text-[10px] text-stone font-medium">
                        Modalidad: {aliado.modalidad || "trimestral"}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-stone text-[10px] uppercase tracking-wider">
                        Próx. Cobro
                      </div>
                      <div className="font-mono font-semibold text-stone-dark">
                        {proximoLimpio}
                      </div>
                      <div className="text-[10px] font-medium">
                        {dias < 0 ? (
                          <span className="text-rose-600 font-bold">
                            Mora de {Math.abs(dias)} días
                          </span>
                        ) : dias === 0 ? (
                          <span className="text-amber-600 font-bold">Vence hoy</span>
                        ) : (
                          <span className="text-stone">Quedan {dias} días</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Acciones */}
                  <div className="flex items-center gap-2 pt-1">
                    {esAliadoPausadoOInactivo(aliado) ? (
                    <button
                      type="button"
                      onClick={() => reactivarAliado(aliado)}
                      disabled={reactivandoId === aliado.negocio_id}
                      className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs text-center shadow-2xs transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
                    >
                      <span>▶️</span>
                      <span>{reactivandoId === aliado.negocio_id ? "Reactivando..." : "Reactivar"}</span>
                    </button>
                    ) : (<>
                    <a
                      href={waUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs text-center shadow-2xs transition-colors flex items-center justify-center gap-1.5"
                    >
                      <span>💬</span>
                      <span>WhatsApp</span>
                    </a>

                    <button
                      type="button"
                      onClick={() => copiarMensaje(aliado)}
                      className="p-2 rounded-xl border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs transition-colors flex items-center justify-center"
                      title="Copiar texto con emoticones"
                    >
                      📋
                    </button>

                    <button
                      type="button"
                      onClick={() => setPagoAliado(aliado)}
                      className="flex-1 py-2 rounded-xl bg-forest hover:bg-forest-dark text-white font-semibold text-xs text-center shadow-2xs transition-colors flex items-center justify-center gap-1.5"
                    >
                      <span>💵</span>
                      <span>Pago</span>
                    </button>
                    </>)}

                    <button
                      type="button"
                      onClick={() => setAjusteAliado(aliado)}
                      className="p-2 rounded-xl border border-stone-light/80 hover:bg-stone-100 text-stone text-xs transition-colors"
                      title="Ajustar Acuerdo"
                    >
                      ⚙️
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Modales */}
      <ModalRegistrarPago
        aliado={pagoAliado}
        isOpen={Boolean(pagoAliado)}
        onClose={() => setPagoAliado(null)}
        onSuccess={(msg) => {
          mostrarToast(msg, "exito");
          refrescarDatos();
        }}
      />

      <ModalAjustarAcuerdo
        aliado={ajusteAliado}
        isOpen={Boolean(ajusteAliado)}
        onClose={() => setAjusteAliado(null)}
        onSuccess={(msg) => {
          mostrarToast(msg, "exito");
          refrescarDatos();
        }}
      />
    </div>
  );
}

