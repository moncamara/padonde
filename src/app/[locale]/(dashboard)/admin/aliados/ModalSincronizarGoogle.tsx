"use client";

import { useState, useTransition } from "react";
import { useRouter } from "@/i18n/routing";
import { sincronizarReputacionGoogleAction } from "../actions";

interface ModalSincronizarGoogleProps {
  ultimaSincronizacion?: string | null;
}

export function ModalSincronizarGoogle({
  ultimaSincronizacion,
}: ModalSincronizarGoogleProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [detalles, setDetalles] = useState<
    { id: string; nombre: string; rating: number; reviews: number }[] | null
  >(null);
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSincronizar = () => {
    setErrorMsg(null);
    setMensajeExito(null);
    setDetalles(null);

    startTransition(async () => {
      const res = await sincronizarReputacionGoogleAction();
      if (!res.success) {
        setErrorMsg(res.error || "No se pudo sincronizar la reputación.");
      } else {
        setMensajeExito(
          `¡Sincronización exitosa! Se actualizaron ${res.actualizados || 0} aliados con datos de Google.`
        );
        if (res.detalles) {
          setDetalles(res.detalles);
        }
        router.refresh();
      }
    });
  };

  const fechaFormateada = ultimaSincronizacion
    ? new Date(ultimaSincronizacion).toLocaleDateString("es-CO", {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="w-full h-full py-2 px-3 rounded-xl text-xs font-semibold bg-amber-500/10 hover:bg-amber-500/20 text-amber-900 border border-amber-300/80 transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap active:scale-95"
        title="Sincronizar calificaciones y reseñas de Google Maps con Gemini AI"
      >
        <span>⭐</span>
        <span>Sincronizar Google</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-stone-200 space-y-5 max-h-[90vh] overflow-y-auto">
            {/* Cabecera */}
            <div className="flex items-start justify-between gap-3 border-b border-stone-100 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xl">⭐</span>
                  <h3 className="font-serif text-lg font-bold text-forest">
                    Sincronizador de Reseñas de Google
                  </h3>
                </div>
                <p className="text-xs text-stone mt-0.5">
                  Actualiza las calificaciones y el total de reseñas de todos los aliados en 1 clic mediante Gemini AI.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-stone hover:text-forest p-1 rounded-lg text-sm"
              >
                ✕
              </button>
            </div>

            {/* Tarjeta de Estado y Recomendación */}
            <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200/80 text-xs text-amber-900 space-y-1.5">
              <div className="flex items-center justify-between font-bold">
                <span>Estado de Sincronización</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-200/60 text-amber-950 font-mono">
                  Gemini AI · Costo $0 COP
                </span>
              </div>
              <p className="text-[11px] text-amber-800 leading-relaxed">
                {fechaFormateada ? (
                  <>
                    Última sincronización: <strong>{fechaFormateada}</strong>.
                  </>
                ) : (
                  "Aún no se ha realizado una sincronización automática este mes."
                )}
              </p>
              <p className="text-[10px] text-amber-700/80 italic">
                💡 <strong>Consejo operativo:</strong> Ejecutar una sola vez a la semana o cada 15 días es suficiente para mantener los números al día sin saturar llamadas.
              </p>
            </div>

            {/* Mensajes de feedback */}
            {errorMsg && (
              <div className="p-3 rounded-xl bg-red-50 text-red-700 border border-red-200 text-xs">
                {errorMsg}
              </div>
            )}

            {mensajeExito && (
              <div className="p-3 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold flex items-center gap-2">
                <span>✅</span>
                <span>{mensajeExito}</span>
              </div>
            )}

            {/* Lista de resultados actualizados */}
            {detalles && detalles.length > 0 && (
              <div className="space-y-2">
                <span className="text-xs font-bold text-forest block">
                  Comercios Actualizados ({detalles.length}):
                </span>
                <div className="max-h-48 overflow-y-auto space-y-1.5 p-2 bg-stone-50 rounded-xl border border-stone-200 text-xs">
                  {detalles.map((d) => (
                    <div
                      key={d.id}
                      className="flex items-center justify-between p-1.5 bg-white rounded-lg border border-stone-100"
                    >
                      <span className="font-medium text-forest truncate max-w-[240px]">
                        {d.nombre}
                      </span>
                      <span className="font-semibold text-amber-800 shrink-0 font-mono text-[11px]">
                        ★ {d.rating.toFixed(1)} ({d.reviews} reseñas)
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Acciones */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-100">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                disabled={isPending}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-stone hover:bg-stone-100 transition-all cursor-pointer"
              >
                Cerrar
              </button>

              <button
                type="button"
                onClick={handleSincronizar}
                disabled={isPending}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-black shadow-xs transition-all active:scale-95 cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
              >
                {isPending ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                    <span>Sincronizando con Gemini...</span>
                  </>
                ) : (
                  <>
                    <span>🔄</span>
                    <span>Actualizar Todos Ahora</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
