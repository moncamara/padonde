"use client";

import { useState } from "react";
import type { FilaCobroCalculada } from "@/lib/types";

export interface AnuncioHistorialItem {
  id: string;
  titulo: string;
  fecha: string;
  activo: boolean;
}

export interface HistorialAliadoCobro {
  fecha_ingreso: string;
  dias_activo: number;
  total_anuncios_historicos: number;
  anuncios_activos_hoy: number;
  listado_anuncios: AnuncioHistorialItem[];
}

interface ModalHistorialCobroProps {
  aliado: FilaCobroCalculada | null;
  historial?: HistorialAliadoCobro | null;
  isOpen: boolean;
  onClose: () => void;
}

const BADGE_ESTADO: Record<string, { label: string; cls: string }> = {
  al_dia: { label: "✅ Al Día", cls: "bg-emerald-100 text-emerald-900 border-emerald-300" },
  por_vencer: { label: "⏳ Por Vencer", cls: "bg-amber-100 text-amber-900 border-amber-300" },
  vencido: { label: "🔴 Vencido", cls: "bg-red-100 text-red-800 border-red-300" },
  en_cortesia: { label: "🎁 En Cortesía", cls: "bg-sky-100 text-sky-900 border-sky-300" },
  pausado: { label: "⏸️ Pausado", cls: "bg-stone-100 text-stone-700 border-stone-300" },
};

export function ModalHistorialCobro({
  aliado,
  historial,
  isOpen,
  onClose,
}: ModalHistorialCobroProps) {
  const [copiado, setCopiado] = useState(false);

  if (!isOpen || !aliado) return null;

  const fechaIngreso =
    historial?.fecha_ingreso ||
    (aliado.fecha_registro_app
      ? new Date(aliado.fecha_registro_app).toLocaleDateString("es-CO", {
          day: "2-digit",
          month: "short",
          year: "numeric",
          timeZone: "America/Bogota",
        })
      : "—");

  const diasActivo =
    historial?.dias_activo ??
    Math.max(
      1,
      Math.floor(
        (Date.now() - new Date(aliado.fecha_registro_app || Date.now()).getTime()) / 86400000
      )
    );

  const totalAnuncios = historial?.total_anuncios_historicos ?? 0;
  const activosHoy = historial?.anuncios_activos_hoy ?? 0;
  const listado = historial?.listado_anuncios || [];
  const tarifaStr = `$${Number(aliado.tarifa_pactada_cop || 0).toLocaleString("es-CO")} COP`;
  const modalidadStr = aliado.modalidad === "mensual" ? "Mensual" : "Trimestral";
  const proximoCorte = aliado.proximo_cobro ? aliado.proximo_cobro.split("T")[0] : "—";
  const badge = BADGE_ESTADO[aliado.estado_calculado] || BADGE_ESTADO.en_cortesia;

  const resumenWhatsApp = `🧾 *Resumen de Cuenta PaDónde — ${aliado.negocio_nombre}* (${aliado.zona_nombre || "PaDónde"})

📅 *Antigüedad:* En plataforma desde *${fechaIngreso}* (${diasActivo} días de presencia continua).
📣 *Gestión realizada:* *${totalAnuncios}* anuncio(s) publicado(s) (${activosHoy} vigente(s) hoy).
🌍 *Alcance:* Vitrina activa 24/7 en *4 idiomas (ES / EN / FR / DE)* con reservas directas a su WhatsApp (*0% comisiones*).

💳 *Liquidación (${modalidadStr}):*
• Valor del ciclo pactado: *${tarifaStr}*
• Fecha de corte / renovación: *${proximoCorte}*

📲 *Medios de pago oficiales:*
• *Nequi (Llave):* 3013010194
• *Bancolombia Ahorros:* 080 756 549 53

¡Gracias por confiar en PaDónde para impulsar tus reservas! 🌿✨`;

  async function handleCopiar() {
    try {
      await navigator.clipboard.writeText(resumenWhatsApp);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2500);
    } catch {
      setCopiado(false);
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center sm:p-4 animate-in fade-in duration-150"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-[#FBF9F5] w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl border border-stone-light shadow-2xl flex flex-col max-h-[90vh] overflow-hidden font-sans text-[#1B382B]"
      >
        {/* Cabecera */}
        <div className="p-4 sm:p-5 bg-white border-b border-stone-light/70 flex items-start justify-between gap-3 shrink-0">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="font-serif text-lg sm:text-xl font-bold text-[#1B382B] truncate">
                🧾 {aliado.negocio_nombre}
              </h2>
              <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${badge.cls}`}>
                {badge.label}
              </span>
            </div>
            <p className="text-xs text-stone mt-0.5">
              📍 {aliado.zona_nombre || "PaDónde"} · Soporte de gestión y estado de cuenta
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="w-8 h-8 rounded-full bg-stone-light/40 hover:bg-stone-light text-stone hover:text-[#1B382B] flex items-center justify-center text-sm shrink-0 cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Cuerpo scrollable (diseñado para mostrar al dueño en celular) */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-3.5 flex-1">
          {/* Antigüedad + Gestión */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="bg-white rounded-2xl border border-stone-light/80 p-3.5 shadow-2xs">
              <p className="text-[10px] uppercase tracking-wider font-bold text-stone">
                📅 Antigüedad en PaDónde
              </p>
              <p className="font-serif text-base font-bold text-[#1B382B] mt-1">{fechaIngreso}</p>
              <p className="text-[11px] text-emerald-700 font-semibold mt-0.5">
                {diasActivo} {diasActivo === 1 ? "día" : "días"} activo
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-stone-light/80 p-3.5 shadow-2xs">
              <p className="text-[10px] uppercase tracking-wider font-bold text-stone">
                📣 Gestión Realizada
              </p>
              <p className="font-serif text-base font-bold text-[#1B382B] mt-1">
                {totalAnuncios} {totalAnuncios === 1 ? "anuncio" : "anuncios"}
              </p>
              <p className="text-[11px] text-stone mt-0.5">
                {activosHoy} vigente(s) hoy
              </p>
            </div>
          </div>

          {/* Beneficios activos */}
          <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-3 text-xs text-emerald-950 flex flex-wrap items-center justify-between gap-2">
            <span>🌍 Idiomas activos: <strong>ES / EN / FR / DE</strong></span>
            <span>💬 Canal directo WhatsApp: <strong>0% comisiones</strong></span>
          </div>

          {/* Historial de Publicaciones */}
          <div className="bg-white rounded-2xl border border-stone-light/80 p-3.5 space-y-2 shadow-2xs">
            <p className="text-[11px] uppercase tracking-wider font-bold text-stone">
              📋 Historial de Publicaciones ({listado.length})
            </p>
            {listado.length === 0 ? (
              <p className="text-xs text-stone py-2">
                Aún no hay publicaciones registradas para este aliado.
              </p>
            ) : (
              <div className="max-h-44 overflow-y-auto divide-y divide-stone-light/40 pr-1">
                {listado.map((ev) => (
                  <div
                    key={ev.id}
                    className="py-2 flex items-center justify-between gap-2 text-xs"
                  >
                    <div className="min-w-0">
                      <p className="font-semibold text-[#1B382B] truncate">{ev.titulo}</p>
                      <p className="text-[10px] text-stone">{ev.fecha}</p>
                    </div>
                    <span
                      className={[
                        "shrink-0 text-[10px] px-2 py-0.5 rounded-full font-semibold border",
                        ev.activo
                          ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                          : "bg-stone-100 text-stone-600 border-stone-200",
                      ].join(" ")}
                    >
                      {ev.activo ? "🟢 Activo" : "⏸️ Finalizado"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Liquidación */}
          <div className="bg-white rounded-2xl border border-[#1B382B]/20 p-3.5 flex items-center justify-between gap-3 shadow-2xs">
            <div>
              <p className="text-[10px] uppercase tracking-wider font-bold text-stone">
                💳 Liquidación ({modalidadStr})
              </p>
              <p className="font-serif text-lg font-bold text-[#1B382B]">{tarifaStr}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] uppercase tracking-wider font-bold text-stone">
                Fecha de corte
              </p>
              <p className="text-xs font-bold text-[#C2622D] font-mono mt-0.5">{proximoCorte}</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-white border-t border-stone-light/70 flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleCopiar}
            className="flex-1 py-3 px-4 rounded-2xl bg-[#1B382B] hover:bg-[#142a20] text-[#FBF9F5] text-xs font-bold shadow-xs cursor-pointer active:scale-[0.99] transition-all flex items-center justify-center gap-2"
          >
            <span>{copiado ? "✓" : "📋"}</span>
            <span>
              {copiado
                ? "¡Resumen Copiado para WhatsApp!"
                : "Copiar Resumen de Cobro (WhatsApp)"}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
