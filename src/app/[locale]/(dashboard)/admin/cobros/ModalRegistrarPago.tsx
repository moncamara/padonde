"use client";

import { useState, useEffect } from "react";
import type { FilaCobroCalculada } from "@/lib/types";
import { registrarRenovacionPagoAction } from "./actions";
import { sumarMesesAFecha, getHoyColombia } from "./cobrosUtils";

interface ModalRegistrarPagoProps {
  aliado: FilaCobroCalculada | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (mensaje: string) => void;
}

const METODOS_PAGO = [
  { id: "nequi", label: "Nequi", icono: "🟣" },
  { id: "bancolombia", label: "Bancolombia", icono: "🟡" },
  { id: "daviplata", label: "Daviplata", icono: "🔴" },
  { id: "efectivo", label: "Efectivo", icono: "💵" },
  { id: "transferencia", label: "Transferencia", icono: "🏦" },
];

export function ModalRegistrarPago({
  aliado,
  isOpen,
  onClose,
  onSuccess,
}: ModalRegistrarPagoProps) {
  const [metodoPago, setMetodoPago] = useState<string>("nequi");
  const [monto, setMonto] = useState<number>(125000);
  const [fechaPago, setFechaPago] = useState<string>("");
  const [notas, setNotas] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (aliado && isOpen) {
      setMonto(Number(aliado.tarifa_pactada_cop) || 125000);
      setFechaPago(getHoyColombia());
      setMetodoPago("nequi");
      setNotas("");
      setErrorMsg(null);
    }
  }, [aliado, isOpen]);

  if (!isOpen || !aliado) return null;

  const modalidad = aliado.modalidad || "trimestral";
  const mesesASumar = modalidad === "mensual" ? 1 : 3;

  // Proyección de la nueva fecha
  const hoy = fechaPago || getHoyColombia();
  const proximoCobroLimpio = aliado.proximo_cobro ? aliado.proximo_cobro.split("T")[0] : hoy;
  const fechaBase = proximoCobroLimpio > hoy ? proximoCobroLimpio : hoy;
  const nuevaFechaCobro = sumarMesesAFecha(fechaBase, mesesASumar);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    try {
      setIsSubmitting(true);
      setErrorMsg(null);

      const res = await registrarRenovacionPagoAction({
        acuerdoId: aliado.acuerdo_id || undefined,
        negocioId: aliado.negocio_id,
        metodoPago,
        montoCobrado: monto,
        fechaPago,
        notas: notas.trim() ? notas.trim() : undefined,
      });

      if (!res.success) {
        setErrorMsg(res.error || "No se pudo registrar la renovación.");
        return;
      }

      onSuccess(
        `¡Pago de $${monto.toLocaleString("es-CO")} COP registrado para ${aliado.negocio_nombre}! Vigencia extendida hasta ${nuevaFechaCobro}.`
      );
      onClose();
    } catch (err: any) {
      setErrorMsg(err?.message || "Ocurrió un error inesperado al registrar el pago.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-stone-light/60 flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabecera */}
        <div className="bg-forest px-6 py-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center text-xl">
              💵
            </div>
            <div>
              <h3 className="font-serif text-lg font-bold">Registrar Renovación de Pago</h3>
              <p className="text-white/80 text-xs font-sans line-clamp-1">
                {aliado.negocio_nombre} • {aliado.zona_nombre || "PaDónde"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-white/70 hover:text-white p-2 rounded-xl hover:bg-white/10 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          {errorMsg && (
            <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-sans">
              ⚠️ {errorMsg}
            </div>
          )}

          {/* Tarjeta de Resumen y Proyección */}
          <div className="bg-cream p-4 rounded-2xl border border-stone-light/60 space-y-2 text-xs font-sans">
            <div className="flex justify-between items-center text-stone">
              <span>Modalidad pactada:</span>
              <span className="font-semibold text-forest uppercase tracking-wider">
                {modalidad} (+{mesesASumar} mes{mesesASumar > 1 ? "es" : ""})
              </span>
            </div>
            <div className="flex justify-between items-center text-stone">
              <span>Vigencia actual registrada:</span>
              <span className="font-medium text-stone-dark">
                {proximoCobroLimpio || "Sin registro"}
              </span>
            </div>
            <div className="pt-2 border-t border-stone-light/40 flex justify-between items-center text-forest font-bold">
              <span>Nueva fecha próximo cobro:</span>
              <span className="bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full text-xs font-mono">
                📅 {nuevaFechaCobro}
              </span>
            </div>
          </div>

          {/* Selección de Método de Pago */}
          <div>
            <label className="block text-xs font-semibold text-forest mb-2">
              Método de Pago Recibido *
            </label>
            <div className="grid grid-cols-3 gap-2">
              {METODOS_PAGO.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setMetodoPago(m.id)}
                  className={`p-2.5 rounded-2xl border text-xs font-sans font-medium flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    metodoPago === m.id
                      ? "bg-forest text-white border-forest shadow-xs font-semibold"
                      : "bg-white text-stone border-stone-light/60 hover:border-forest/40 hover:bg-stone-50"
                  }`}
                >
                  <span>{m.icono}</span>
                  <span>{m.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Monto y Fecha en Fila */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-forest mb-1">
                Monto Recibido (COP) *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-stone text-xs font-mono">$</span>
                <input
                  type="number"
                  step="1000"
                  min="0"
                  required
                  value={monto}
                  onChange={(e) => setMonto(Number(e.target.value))}
                  className="w-full pl-7 pr-3 py-2 rounded-xl border border-stone-light/80 text-xs font-mono font-medium focus:border-forest focus:ring-1 focus:ring-forest outline-hidden bg-white text-stone-dark"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-forest mb-1">
                Fecha del Pago *
              </label>
              <input
                type="date"
                required
                value={fechaPago}
                onChange={(e) => setFechaPago(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-stone-light/80 text-xs font-mono font-medium focus:border-forest focus:ring-1 focus:ring-forest outline-hidden bg-white text-stone-dark"
              />
            </div>
          </div>

          {/* Notas de Comprobante / Auditoría */}
          <div>
            <label className="block text-xs font-semibold text-forest mb-1">
              Notas u Observaciones (opcional)
            </label>
            <textarea
              rows={2}
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              placeholder="Ej: Comprobante #104928 enviado por WhatsApp. Pago adelantado."
              className="w-full p-3 rounded-xl border border-stone-light/80 text-xs font-sans focus:border-forest focus:ring-1 focus:ring-forest outline-hidden bg-white text-stone-dark resize-none"
            />
          </div>

          {/* Botones de Acción */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-stone-light/40">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl border border-stone-light/60 text-stone text-xs font-medium hover:bg-stone-50 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl bg-forest hover:bg-forest-dark text-white text-xs font-semibold shadow-xs transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Guardando...</span>
                </>
              ) : (
                <>
                  <span>✓</span>
                  <span>Confirmar y Renovar</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
