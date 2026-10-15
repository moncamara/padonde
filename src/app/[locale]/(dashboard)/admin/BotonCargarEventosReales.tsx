"use client";

import { useState } from "react";
import { importarLoteEventosRealesAction } from "./actions";
import { Button } from "@/components/ui/Button";

export function BotonCargarEventosReales() {
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleImportar() {
    setLoading(true);
    setError(null);
    setMensaje(null);

    try {
      const res = await importarLoteEventosRealesAction();
      if (!res.success) {
        setError(res.error || "Ocurrió un error al importar los eventos.");
      } else {
        setMensaje(`¡Listo! Se sincronizaron los aliados y ${res.count ?? 0} eventos nuevos en la cartelera.`);
      }
    } catch (err: any) {
      setError(err?.message || "Error inesperado al conectar.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-forest/5 border border-forest/20 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3.5">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <span className="text-base sm:text-lg">🌿</span>
          <h3 className="font-serif text-base sm:text-lg text-forest font-semibold">
            Lote de Eventos Reales de Minca
          </h3>
          <span className="text-[10px] bg-forest text-cream font-medium px-2 py-0.5 rounded-full uppercase tracking-wider">
            WhatsApp Listo
          </span>
        </div>
        <p className="text-xs text-stone font-sans max-w-xl">
          Carga con 1 solo clic los eventos procesados (Cine 40, Jam Birding, Feeling Bar, Finca La Frecuencia, Casa Cora y Dhamma Gutti) con sus fotos optimizadas en WebP.
        </p>

        {mensaje && (
          <p className="text-xs font-medium text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200 mt-2">
            🎉 {mensaje}
          </p>
        )}
        {error && (
          <p className="text-xs font-medium text-red-600 bg-red-50 px-3 py-1.5 rounded-lg border border-red-200 mt-2">
            ⚠️ {error}
          </p>
        )}
      </div>

      <Button
        onClick={handleImportar}
        disabled={loading}
        size="md"
        className="w-full sm:w-auto shrink-0 shadow-sm"
      >
        {loading ? (
          <span className="flex items-center gap-2">
            <span className="w-4 h-4 border-2 border-cream/30 border-t-cream rounded-full animate-spin" />
            Sincronizando...
          </span>
        ) : (
          "⚡ Cargar Eventos Reales"
        )}
      </Button>
    </div>
  );
}
