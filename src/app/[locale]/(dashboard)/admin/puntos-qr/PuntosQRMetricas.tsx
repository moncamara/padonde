"use client";

import { useState, useEffect, useCallback } from "react";

interface EscaneoLog {
  id: string;
  puntoId: string;
  zonaSlug: string;
  dispositivoTipo: string;
  esPrimerEscaneo: boolean;
  esValido: boolean;
  tiempoPermanenciaSeg: number;
  createdAt: string;
}

interface MetricasData {
  totales: number;
  unicosValidados: number;
  unicosSinPermanencia: number;
  repetidos: number;
  ultimosEscaneos: EscaneoLog[];
}

export function PuntosQRMetricas() {
  const [puntoFiltro, setPuntoFiltro] = useState<string>("promotor-estacion");
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<MetricasData>({
    totales: 0,
    unicosValidados: 0,
    unicosSinPermanencia: 0,
    repetidos: 0,
    ultimosEscaneos: [],
  });

  // Calculadora de pago dinámico
  const [tarifaPorEscaneo, setTarifaPorEscaneo] = useState<number>(700);
  const [baseFijo, setBaseFijo] = useState<number>(40000);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const cargarMetricas = useCallback(async () => {
    try {
      const url = puntoFiltro
        ? `/api/admin/puntos-qr/metricas?puntoId=${encodeURIComponent(puntoFiltro)}`
        : `/api/admin/puntos-qr/metricas`;
      const res = await fetch(url);
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.warn("Error al cargar métricas de QR:", err);
    } finally {
      setLoading(false);
    }
  }, [puntoFiltro]);

  useEffect(() => {
    cargarMetricas();
  }, [cargarMetricas]);

  // Auto-refresco cada 25 segundos para monitoreo en vivo durante el turno del promotor
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      cargarMetricas();
    }, 25000);
    return () => clearInterval(interval);
  }, [autoRefresh, cargarMetricas]);

  const totalComision = data.unicosValidados * tarifaPorEscaneo;
  const pagoTotalEstimado = baseFijo + totalComision;

  function formatHora(iso: string) {
    try {
      const d = new Date(iso);
      return d.toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" });
    } catch {
      return "";
    }
  }

  function getTiempoRelativo(iso: string) {
    try {
      const diffMin = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
      if (diffMin < 1) return "hace unos segundos";
      if (diffMin === 1) return "hace 1 minuto";
      if (diffMin < 60) return `hace ${diffMin} min`;
      const diffHoras = Math.floor(diffMin / 60);
      return `hace ${diffHoras} h`;
    } catch {
      return "";
    }
  }

  return (
    <div className="bg-white/80 p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-stone-light/80 shadow-xs space-y-6">
      {/* Encabezado y controles de monitoreo */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-light/60">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-serif text-lg sm:text-xl text-forest font-bold">
              Auditoría Antifraude en Vivo (Escaneos QR)
            </h2>
            <span className="inline-flex items-center gap-1 text-[11px] bg-emerald-100 text-emerald-800 font-medium px-2 py-0.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              En vivo
            </span>
          </div>
          <p className="font-sans text-xs text-stone mt-0.5">
            Mide únicamente dispositivos móviles reales y descarta auto-escaneos repetidos o rebotes rápidos.
          </p>
        </div>

        {/* Filtro por punto y botón de actualizar */}
        <div className="flex items-center gap-2">
          <select
            value={puntoFiltro}
            onChange={(e) => setPuntoFiltro(e.target.value)}
            className="text-xs font-sans bg-white border border-stone-light rounded-xl px-2.5 py-1.5 text-forest focus:outline-none focus:ring-1 focus:ring-forest cursor-pointer"
          >
            <option value="promotor-estacion">📍 Promotor Estación</option>
            <option value="">Todos los puntos QR</option>
            <option value="mototaxis-minca">🛵 Parada Mototaxis</option>
            <option value="hostal-rio-elemento">🏨 Rio Elemento</option>
            <option value="cafe-duni">☕ Café Duni</option>
            <option value="casas-viejas">🏡 Casas Viejas</option>
          </select>

          <button
            onClick={() => cargarMetricas()}
            disabled={loading}
            className="p-1.5 rounded-xl border border-stone-light bg-white hover:bg-stone-light/20 text-forest text-xs font-sans transition-all cursor-pointer"
            title="Refrescar métricas ahora"
          >
            🔄
          </button>
        </div>
      </div>

      {/* 3 Tarjetas de Estado del Promotor */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* 1. ÚNICOS VALIDADOS (A PAGAR) */}
        <div className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-sans font-semibold uppercase tracking-wider text-emerald-800">
              ✅ Únicos a Pagar
            </span>
            <span className="text-lg">🎯</span>
          </div>
          <p className="font-serif text-3xl sm:text-4xl text-emerald-900 font-extrabold mt-1">
            {data.unicosValidados}
          </p>
          <p className="text-[11px] text-emerald-700 font-medium mt-1">
            Celulares nuevos con permanencia real (&ge; 5s)
          </p>
        </div>

        {/* 2. DESCARTADOS (AUTO-ESCANEOS REPETIDOS) */}
        <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-sans font-semibold uppercase tracking-wider text-amber-800">
              ⚠️ Repetidos (Descartados)
            </span>
            <span className="text-lg">🛡️</span>
          </div>
          <p className="font-serif text-3xl sm:text-4xl text-amber-900 font-extrabold mt-1">
            {data.repetidos}
          </p>
          <p className="text-[11px] text-amber-700 font-medium mt-1">
            Mismo celular escaneando de nuevo (antifraude)
          </p>
        </div>

        {/* 3. REBOTES RÁPIDOS (< 5s) */}
        <div className="p-4 rounded-2xl bg-stone-50 border border-stone-light/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-sans font-semibold uppercase tracking-wider text-stone">
              ⏱️ Sin Permanencia
            </span>
            <span className="text-lg">⚡</span>
          </div>
          <p className="font-serif text-3xl sm:text-4xl text-stone-dark font-extrabold mt-1">
            {data.unicosSinPermanencia}
          </p>
          <p className="text-[11px] text-stone text-[11px] mt-1">
            Abrieron y cerraron de inmediato (&lt; 5s)
          </p>
        </div>
      </div>

      {/* Liquidador en Vivo de Pago al Promotor */}
      <div className="p-4 rounded-2xl bg-forest text-white shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-base">💰</span>
            <h3 className="font-serif text-base font-bold text-white">
              Liquidación de Turno en Vivo
            </h3>
          </div>
          <span className="text-xs text-cream/70 font-sans">
            Cálculo automático antifraude
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          <div>
            <label className="block text-[11px] text-cream/70 font-sans mb-1">
              Base fija diaria (COP)
            </label>
            <input
              type="number"
              step="5000"
              value={baseFijo}
              onChange={(e) => setBaseFijo(Number(e.target.value) || 0)}
              className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-1.5 text-white font-sans text-xs focus:outline-none focus:ring-1 focus:ring-cream"
            />
          </div>

          <div>
            <label className="block text-[11px] text-cream/70 font-sans mb-1">
              Bono por escaneo único (COP)
            </label>
            <input
              type="number"
              step="100"
              value={tarifaPorEscaneo}
              onChange={(e) => setTarifaPorEscaneo(Number(e.target.value) || 0)}
              className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-1.5 text-white font-sans text-xs focus:outline-none focus:ring-1 focus:ring-cream"
            />
          </div>

          <div className="flex flex-col justify-end bg-white/10 p-2.5 rounded-xl border border-white/15">
            <span className="text-[10px] text-cream/70 font-sans uppercase tracking-wider">
              Total a pagar al chico
            </span>
            <span className="font-serif text-xl sm:text-2xl font-extrabold text-terra-light text-emerald-300">
              ${pagoTotalEstimado.toLocaleString("es-CO")} COP
            </span>
            <span className="text-[10px] text-cream/60">
              Base (${baseFijo.toLocaleString("es-CO")}) + {data.unicosValidados} únicos (${totalComision.toLocaleString("es-CO")})
            </span>
          </div>
        </div>
      </div>

      {/* Bitácora en Vivo de los Últimos Escaneos */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-serif text-sm font-bold text-forest">
            Bitácora de Escaneos Recientes
          </h3>
          <span className="text-xs text-stone font-sans">
            Total registrados: {data.totales}
          </span>
        </div>

        {data.ultimosEscaneos.length === 0 ? (
          <div className="p-6 rounded-2xl bg-cream/40 border border-stone-light/60 text-center">
            <span className="text-2xl">📱</span>
            <p className="font-sans text-xs text-stone mt-1.5">
              Aún no hay escaneos registrados para este código.
            </p>
            <p className="font-sans text-[11px] text-stone/70 mt-0.5">
              Cuando el chico comience a mostrar el QR en la estación, verás cada celular entrar aquí en tiempo real.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-stone-light/60 border border-stone-light/80 rounded-2xl overflow-hidden bg-white">
            {data.ultimosEscaneos.map((esc) => {
              const iconDisp =
                esc.dispositivoTipo === "iphone"
                  ? "🍏 iPhone"
                  : esc.dispositivoTipo === "android"
                  ? "🤖 Android"
                  : "💻 Web";

              const isValid = esc.esPrimerEscaneo && esc.esValido;
              const isRepeated = !esc.esPrimerEscaneo;

              return (
                <div
                  key={esc.id}
                  className="p-3 flex items-center justify-between gap-3 text-xs font-sans hover:bg-stone-50/50 transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-sm">
                      {isValid ? "✅" : isRepeated ? "⚠️" : "⏱️"}
                    </span>
                    <div>
                      <p className="font-medium text-forest">
                        {iconDisp}{" "}
                        <span className="text-stone font-normal">
                          · {esc.puntoId}
                        </span>
                      </p>
                      <p className="text-[10px] text-stone">
                        {formatHora(esc.createdAt)} ({getTiempoRelativo(esc.createdAt)})
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    {isValid ? (
                      <span className="inline-block px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-semibold">
                        Válido (+{esc.tiempoPermanenciaSeg}s)
                      </span>
                    ) : isRepeated ? (
                      <span className="inline-block px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-medium">
                        Repetido (No paga)
                      </span>
                    ) : (
                      <span className="inline-block px-2 py-0.5 rounded-full bg-stone-100 text-stone text-[10px] font-medium">
                        Rebote (&lt;5s)
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
