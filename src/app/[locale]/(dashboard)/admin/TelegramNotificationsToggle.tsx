"use client";

import { useState, useTransition } from "react";
import {
  toggleNotificacionesTelegramAction,
  testNotificacionTelegramAction,
} from "./actions";

interface TelegramNotificationsToggleProps {
  initialActivas?: boolean;
  botUsername?: string;
}

export function TelegramNotificationsToggle({
  initialActivas = true,
  botUsername = "@padonde_app_bot",
}: TelegramNotificationsToggleProps) {
  const [activas, setActivas] = useState(initialActivas);
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ tipo: "ok" | "error"; texto: string } | null>(null);
  const [isTesting, setIsTesting] = useState(false);

  const handleToggle = () => {
    const nuevoEstado = !activas;
    setActivas(nuevoEstado);
    setFeedback(null);

    startTransition(async () => {
      const res = await toggleNotificacionesTelegramAction(nuevoEstado);
      if (res.success) {
        setFeedback({
          tipo: "ok",
          texto: nuevoEstado
            ? "🔔 Notificaciones activadas en Telegram"
            : "⏸️ Notificaciones pausadas correctamente",
        });
      } else {
        setActivas(!nuevoEstado); // Revertir en caso de fallo
        setFeedback({ tipo: "error", texto: res.error || "Error al actualizar" });
      }
      setTimeout(() => setFeedback(null), 3500);
    });
  };

  const handleTest = async () => {
    setIsTesting(true);
    setFeedback(null);
    try {
      const res = await testNotificacionTelegramAction();
      if (res.success) {
        setFeedback({ tipo: "ok", texto: "📨 ¡Mensaje de prueba enviado a tu Telegram!" });
      } else {
        setFeedback({ tipo: "error", texto: res.error || "No se pudo enviar la prueba" });
      }
    } catch {
      setFeedback({ tipo: "error", texto: "Error al contactar con Telegram" });
    } finally {
      setIsTesting(false);
      setTimeout(() => setFeedback(null), 4000);
    }
  };

  return (
    <div className="bg-white/80 backdrop-blur-sm p-3.5 sm:p-4 rounded-2xl border border-stone-light/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all">
      <div className="flex items-start sm:items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-sky-50 border border-sky-200/80 flex items-center justify-center text-lg shrink-0">
          ✈️
        </div>
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-sans text-xs sm:text-sm font-semibold text-forest">
              Alertas de Reservas en Telegram
            </h3>
            <span
              className={`text-[10px] font-sans font-medium px-2 py-0.5 rounded-full border transition-colors ${
                activas
                  ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                  : "bg-amber-50 text-amber-800 border-amber-200"
              }`}
            >
              {activas ? "🟢 Activas" : "⏸️ Pausadas"}
            </span>
          </div>
          <p className="font-sans text-[11px] text-stone mt-0.5 leading-snug">
            Avisos instantáneos cuando hagan clic en <strong className="text-forest">Reservar</strong> o <strong className="text-forest">Cotizar disponibilidad</strong> vía {botUsername}.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
        {feedback && (
          <span
            className={`text-[11px] font-sans font-medium px-2 py-0.5 rounded-lg animate-fade-in ${
              feedback.tipo === "ok"
                ? "text-emerald-700 bg-emerald-50 border border-emerald-200/60"
                : "text-red-700 bg-red-50 border border-red-200/60"
            }`}
          >
            {feedback.texto}
          </span>
        )}

        {/* Botón de prueba */}
        {activas && (
          <button
            type="button"
            onClick={handleTest}
            disabled={isTesting || isPending}
            className="text-[11px] font-sans font-medium text-stone hover:text-forest bg-stone-light/30 hover:bg-stone-light/60 px-2.5 py-1.5 rounded-xl border border-stone-light/60 transition-colors disabled:opacity-50 cursor-pointer"
            title="Enviar mensaje de prueba a Telegram"
          >
            {isTesting ? "Enviando..." : "Test 📨"}
          </button>
        )}

        {/* Toggle Switch */}
        <button
          type="button"
          role="switch"
          aria-checked={activas}
          onClick={handleToggle}
          disabled={isPending}
          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-forest/20 disabled:opacity-50 ${
            activas ? "bg-emerald-600" : "bg-stone-300"
          }`}
          title={activas ? "Click para pausar notificaciones" : "Click para reanudar notificaciones"}
        >
          <span
            aria-hidden="true"
            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
              activas ? "translate-x-5" : "translate-x-0"
            }`}
          />
        </button>
      </div>
    </div>
  );
}
