"use client";

import { useState, useEffect } from "react";
import type { FilaCobroCalculada, ModalidadCobro, EstadoPago } from "@/lib/types";
import { actualizarAcuerdoComercialAction } from "./actions";
import { getHoyColombia } from "./cobrosUtils";

interface ModalAjustarAcuerdoProps {
  aliado: FilaCobroCalculada | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (mensaje: string) => void;
}

const TARIFAS_RAPIDAS = [90000, 125000, 150000, 200000, 250000];

export function ModalAjustarAcuerdo({
  aliado,
  isOpen,
  onClose,
  onSuccess,
}: ModalAjustarAcuerdoProps) {
  const [tarifa, setTarifa] = useState<number>(125000);
  const [modalidad, setModalidad] = useState<ModalidadCobro>("trimestral");
  const [diasCortesia, setDiasCortesia] = useState<number>(15);
  const [fechaPrimerMensaje, setFechaPrimerMensaje] = useState<string>("");
  const [proximoCobro, setProximoCobro] = useState<string>("");
  const [estadoPago, setEstadoPago] = useState<EstadoPago>("en_cortesia");
  const [notas, setNotas] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (aliado && isOpen) {
      setTarifa(Number(aliado.tarifa_pactada_cop) || 125000);
      setModalidad(aliado.modalidad || "trimestral");
      setDiasCortesia(aliado.dias_cortesia !== undefined ? aliado.dias_cortesia : 15);
      setFechaPrimerMensaje(
        aliado.fecha_primer_mensaje
          ? aliado.fecha_primer_mensaje.split("T")[0]
          : getHoyColombia()
      );
      setProximoCobro(
        aliado.proximo_cobro ? aliado.proximo_cobro.split("T")[0] : ""
      );
      setEstadoPago(aliado.estado_pago || "en_cortesia");
      setNotas(aliado.notas_acuerdo || "");
      setErrorMsg(null);
    }
  }, [aliado, isOpen]);

  if (!isOpen || !aliado) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    try {
      setIsSubmitting(true);
      setErrorMsg(null);

      const res = await actualizarAcuerdoComercialAction({
        negocio_id: aliado.negocio_id,
        tarifa_pactada_cop: tarifa,
        modalidad,
        dias_cortesia: diasCortesia,
        fecha_primer_mensaje: fechaPrimerMensaje,
        proximo_cobro: proximoCobro || undefined,
        estado_pago: estadoPago,
        notas_acuerdo: notas.trim() ? notas.trim() : null,
      });

      if (!res.success) {
        setErrorMsg(res.error || "No se pudo actualizar el acuerdo comercial.");
        return;
      }

      onSuccess(`Acuerdo comercial actualizado exitosamente para ${aliado.negocio_nombre}.`);
      onClose();
    } catch (err: any) {
      setErrorMsg(err?.message || "Ocurrió un error inesperado al guardar los cambios.");
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
              ⚙️
            </div>
            <div>
              <h3 className="font-serif text-lg font-bold">Ajustar Acuerdo Comercial</h3>
              <p className="text-white/80 text-xs font-sans line-clamp-1">
                {aliado.negocio_nombre} • Registrado el{" "}
                {aliado.fecha_registro_app ? aliado.fecha_registro_app.split("T")[0] : "N/D"}
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

          {/* Tarifa Pactada y Atajos Rápidos */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-semibold text-forest">
                Tarifa Pactada (COP) *
              </label>
              <span className="text-[11px] text-stone font-mono">
                ${tarifa.toLocaleString("es-CO")} COP
              </span>
            </div>
            <div className="relative mb-2">
              <span className="absolute left-3 top-2.5 text-stone text-xs font-mono">$</span>
              <input
                type="number"
                step="1000"
                min="0"
                required
                value={tarifa}
                onChange={(e) => setTarifa(Number(e.target.value))}
                className="w-full pl-7 pr-3 py-2 rounded-xl border border-stone-light/80 text-xs font-mono font-medium focus:border-forest focus:ring-1 focus:ring-forest outline-hidden bg-white text-stone-dark"
              />
            </div>
            <div className="flex flex-wrap gap-1.5">
              {TARIFAS_RAPIDAS.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTarifa(t)}
                  className={`text-[10px] font-mono px-2 py-0.5 rounded-lg border transition-all cursor-pointer ${
                    tarifa === t
                      ? "bg-forest text-white border-forest font-semibold"
                      : "bg-stone-50 text-stone border-stone-light/60 hover:bg-stone-100"
                  }`}
                >
                  ${(t / 1000).toFixed(0)}k
                </button>
              ))}
            </div>
          </div>

          {/* Modalidad y Días de Cortesía */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-forest mb-1">
                Modalidad de Cobro *
              </label>
              <select
                value={modalidad}
                onChange={(e) => setModalidad(e.target.value as ModalidadCobro)}
                className="w-full px-3 py-2 rounded-xl border border-stone-light/80 text-xs font-sans font-medium focus:border-forest focus:ring-1 focus:ring-forest outline-hidden bg-white text-stone-dark"
              >
                <option value="trimestral">Trimestral (cada 3 meses)</option>
                <option value="mensual">Mensual (cada 1 mes)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-forest mb-1">
                Días de Cortesía Gratuitos
              </label>
              <input
                type="number"
                min="0"
                max="365"
                required
                value={diasCortesia}
                onChange={(e) => setDiasCortesia(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-stone-light/80 text-xs font-mono font-medium focus:border-forest focus:ring-1 focus:ring-forest outline-hidden bg-white text-stone-dark"
              />
            </div>
          </div>

          {/* Fechas: Primer Mensaje y Próximo Cobro */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-forest mb-1">
                Fecha Primer Mensaje
              </label>
              <input
                type="date"
                required
                value={fechaPrimerMensaje}
                onChange={(e) => setFechaPrimerMensaje(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-stone-light/80 text-xs font-mono font-medium focus:border-forest focus:ring-1 focus:ring-forest outline-hidden bg-white text-stone-dark"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-forest mb-1">
                Próximo Cobro (Vigencia)
              </label>
              <input
                type="date"
                value={proximoCobro}
                onChange={(e) => setProximoCobro(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-stone-light/80 text-xs font-mono font-medium focus:border-forest focus:ring-1 focus:ring-forest outline-hidden bg-white text-stone-dark"
              />
            </div>
          </div>

          {/* Estado Forzado Manual */}
          <div>
            <label className="block text-xs font-semibold text-forest mb-1">
              Estado Base Guardado
            </label>
            <select
              value={estadoPago}
              onChange={(e) => setEstadoPago(e.target.value as EstadoPago)}
              className="w-full px-3 py-2 rounded-xl border border-stone-light/80 text-xs font-sans font-medium focus:border-forest focus:ring-1 focus:ring-forest outline-hidden bg-white text-stone-dark"
            >
              <option value="en_cortesia">En Cortesía</option>
              <option value="al_dia">Al Día</option>
              <option value="por_vencer">Por Vencer</option>
              <option value="vencido">Vencido</option>
            </select>
          </div>

          {/* Notas del Acuerdo */}
          <div>
            <label className="block text-xs font-semibold text-forest mb-1">
              Condiciones Especiales o Notas
            </label>
            <textarea
              rows={3}
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              placeholder="Ej: Acordado pago trimestral anticipado. Incluye afiche QR en recepción y destacados quincenales."
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
                  <span>Guardar Condiciones</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
