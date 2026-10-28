"use client";

import { useState, useTransition, useRef } from "react";
import { useRouter } from "@/i18n/routing";
import { procesarCSVAnalytics, type ResultadoProcesamientoGA4 } from "@/lib/analyticsCSVParser";
import { guardarMetricasGA4Action } from "../actions";

interface ModalActualizarAnalyticsProps {
  negociosRegistrados: { id: string; nombre: string }[];
  ultimaActualizacion?: string | null;
}

const URL_REPORTE_GA4 =
  "https://analytics.google.com/analytics/web/#/a390084444p559212786/reports/explorer?params=_u..nav%3Dmaui%26_u.dateOption%3Dlast90Days%26_u.comparisonOption%3Ddisabled%26_r.explorerCard..seldim%3D%5B%22unifiedScreenClass%22%5D%26_r.explorerCard..startRow%3D0%26_r.explorerCard..rowsPerPage%3D250&r=all-pages-and-screens";

export function ModalActualizarAnalytics({
  negociosRegistrados,
  ultimaActualizacion,
}: ModalActualizarAnalyticsProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [modoManual, setModoManual] = useState(false);
  const [csvTexto, setCsvTexto] = useState("");
  const [nombreArchivo, setNombreArchivo] = useState<string | null>(null);
  const [resultado, setResultado] = useState<ResultadoProcesamientoGA4 | null>(null);
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);
  const [errorLocal, setErrorLocal] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setNombreArchivo(file.name);
    setErrorLocal(null);
    setMensajeExito(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      const contenido = event.target?.result as string;
      if (contenido) {
        setCsvTexto(contenido);
        const res = procesarCSVAnalytics(contenido, negociosRegistrados);
        setResultado(res);
        if (!res.exito) {
          setErrorLocal(res.error || "No se pudo interpretar el archivo CSV.");
        }
      }
    };
    reader.onerror = () => {
      setErrorLocal("Error al leer el archivo en tu dispositivo.");
    };
    reader.readAsText(file, "UTF-8");
  }

  function handleParseManual() {
    if (!csvTexto.trim()) return;
    setErrorLocal(null);
    setMensajeExito(null);
    const res = procesarCSVAnalytics(csvTexto, negociosRegistrados);
    setResultado(res);
    if (!res.exito) {
      setErrorLocal(res.error || "No se pudo interpretar el texto CSV.");
    }
  }

  function handleGuardarEnNube() {
    if (!resultado || !resultado.exito) return;

    setErrorLocal(null);
    startTransition(async () => {
      const res = await guardarMetricasGA4Action({
        fechaInicio: resultado.fechaInicio,
        fechaFin: resultado.fechaFin,
        totalVistas: resultado.totalVistasCSV,
        totalUsuarios: resultado.totalUsuariosCSV,
        totalAliados: resultado.aliadosCoincidentes,
        metricasPorAliado: resultado.metricasPorAliado,
      });

      if (!res.success) {
        setErrorLocal(res.error || "Error al guardar en la nube.");
      } else {
        setMensajeExito(
          `¡Listo! Se actualizaron las métricas de ${resultado.aliadosCoincidentes} aliados con ${resultado.totalVistasCSV.toLocaleString()} vistas totales.`
        );
        setTimeout(() => {
          setIsOpen(false);
          setResultado(null);
          setNombreArchivo(null);
          setCsvTexto("");
          setMensajeExito(null);
          router.refresh();
        }, 1800);
      }
    });
  }

  function formatFechaSync(iso?: string | null) {
    if (!iso) return null;
    try {
      const d = new Date(iso);
      return d.toLocaleDateString("es-CO", { day: "numeric", month: "short", year: "numeric" });
    } catch {
      return null;
    }
  }

  const fechaSyncTexto = formatFechaSync(ultimaActualizacion);

  return (
    <>
      {/* Botón Disparador en la Cabecera de Aliados */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="px-3 py-2 rounded-xl text-xs font-sans font-semibold bg-white border border-stone-light/90 hover:border-forest/40 hover:bg-forest/5 text-forest transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer active:scale-95"
        title="Subir exportación CSV de Google Analytics 4 para actualizar visitas reales de todos los comercios"
      >
        <span>📊</span>
        <span>Sincronizar Analytics</span>
        {fechaSyncTexto && (
          <span className="text-[10px] text-stone font-normal hidden sm:inline">
            ({fechaSyncTexto})
          </span>
        )}
      </button>

      {/* Modal Dialog */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-stone-light flex flex-col max-h-[90vh] overflow-hidden">
            {/* Cabecera del Modal */}
            <div className="p-4 sm:p-5 border-b border-stone-light/70 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xl">📊</span>
                  <h3 className="font-serif text-lg sm:text-xl text-forest font-bold">
                    Sincronizador de Google Analytics 4
                  </h3>
                </div>
                <p className="font-sans text-xs text-stone mt-0.5">
                  Actualiza las vistas reales y turistas de todos los aliados en 1 clic desde tu CSV.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-stone hover:text-forest rounded-xl hover:bg-stone-50 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Contenido Scrolleable */}
            <div className="p-4 sm:p-6 space-y-5 overflow-y-auto font-sans text-xs">
              {/* Paso 1: Enlace Directo a GA4 */}
              <div className="p-3.5 sm:p-4 rounded-2xl bg-forest/5 border border-forest/15 space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h4 className="font-bold text-forest text-xs flex items-center gap-1.5">
                      <span>1️⃣</span>
                      <span>Descargar el reporte en Google Analytics</span>
                    </h4>
                    <p className="text-[11px] text-stone mt-0.5">
                      Abre tu informe de últimos 90 días y haz clic en <strong>Compartir este informe ➔ Descargar CSV</strong>.
                    </p>
                  </div>

                  <a
                    href={URL_REPORTE_GA4}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-forest text-cream hover:bg-forest/90 transition-all flex items-center justify-center gap-1.5 shadow-2xs shrink-0 cursor-pointer"
                  >
                    <span>🔗</span>
                    <span>Abrir Reporte en GA4 ↗</span>
                  </a>
                </div>
              </div>

              {/* Paso 2: Zona de Carga de Archivo */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-forest text-xs flex items-center gap-1.5">
                    <span>2️⃣</span>
                    <span>Cargar archivo CSV exportado</span>
                  </h4>

                  <button
                    type="button"
                    onClick={() => setModoManual(!modoManual)}
                    className="text-[11px] text-stone hover:text-forest underline cursor-pointer"
                  >
                    {modoManual ? "Subir como archivo" : "Pegar texto manualmente"}
                  </button>
                </div>

                {!modoManual ? (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="p-6 border-2 border-dashed border-stone-light/90 hover:border-forest/60 rounded-2xl bg-stone-50/50 hover:bg-forest/5 transition-all flex flex-col items-center justify-center text-center gap-2 cursor-pointer"
                  >
                    <span className="text-3xl">📁</span>
                    <div>
                      <p className="font-semibold text-forest text-xs">
                        {nombreArchivo ? `Archivo seleccionado: ${nombreArchivo}` : "Haz clic para seleccionar tu CSV o arrástralo aquí"}
                      </p>
                      <p className="text-[11px] text-stone mt-0.5">
                        Acepta el formato original descargado de Google Analytics (.csv)
                      </p>
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".csv,text/csv,text/plain"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </div>
                ) : (
                  <div className="space-y-2">
                    <textarea
                      rows={5}
                      value={csvTexto}
                      onChange={(e) => setCsvTexto(e.target.value)}
                      placeholder="Pega aquí el contenido completo del archivo CSV exportado..."
                      className="w-full p-3 font-mono text-[11px] bg-stone-50 border border-stone-light/80 rounded-xl focus:outline-none focus:ring-1 focus:ring-forest text-forest"
                    />
                    <button
                      type="button"
                      onClick={handleParseManual}
                      className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-forest text-cream hover:bg-forest/90 cursor-pointer"
                    >
                      Procesar Texto
                    </button>
                  </div>
                )}
              </div>

              {/* Mensajes de Error o Éxito */}
              {errorLocal && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                  <span>⚠️</span>
                  <span>{errorLocal}</span>
                </div>
              )}

              {mensajeExito && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
                  <span>✅</span>
                  <span>{mensajeExito}</span>
                </div>
              )}

              {/* Paso 3: Vista Previa y Resumen del Procesamiento */}
              {resultado && resultado.exito && (
                <div className="space-y-3 pt-1 border-t border-stone-light/70 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-forest text-xs flex items-center gap-1.5">
                      <span>3️⃣</span>
                      <span>Resumen Detectado</span>
                    </h4>
                    {resultado.fechaInicio && resultado.fechaFin && (
                      <span className="text-[10px] text-stone bg-stone-100 px-2 py-0.5 rounded-full">
                        Periodo: {resultado.fechaInicio} al {resultado.fechaFin}
                      </span>
                    )}
                  </div>

                  {/* 3 Tarjetas de Resumen */}
                  <div className="grid grid-cols-3 gap-2">
                    <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200/80 text-center">
                      <span className="text-[10px] text-emerald-700 uppercase font-semibold block">Vistas Totales</span>
                      <span className="font-serif text-xl sm:text-2xl font-bold text-emerald-900 mt-0.5 block">
                        {resultado.totalVistasCSV.toLocaleString()}
                      </span>
                    </div>

                    <div className="p-3 rounded-xl bg-white border border-stone-light text-center">
                      <span className="text-[10px] text-stone uppercase font-semibold block">Turistas Únicos</span>
                      <span className="font-serif text-xl sm:text-2xl font-bold text-forest mt-0.5 block">
                        {resultado.totalUsuariosCSV.toLocaleString()}
                      </span>
                    </div>

                    <div className="p-3 rounded-xl bg-forest/5 border border-forest/15 text-center">
                      <span className="text-[10px] text-forest uppercase font-semibold block">Aliados Identificados</span>
                      <span className="font-serif text-xl sm:text-2xl font-bold text-forest mt-0.5 block">
                        {resultado.aliadosCoincidentes}
                      </span>
                    </div>
                  </div>

                  {/* Tabla de Comercios Detectados */}
                  <div className="space-y-1.5">
                    <p className="text-[11px] font-semibold text-stone">
                      Comercios y Visitas que se actualizarán:
                    </p>
                    <div className="border border-stone-light rounded-xl overflow-hidden max-h-48 overflow-y-auto divide-y divide-stone-light/50 bg-white">
                      {resultado.resumenAliados.map((item, idx) => (
                        <div
                          key={idx}
                          className="px-3 py-1.5 flex items-center justify-between text-xs hover:bg-stone-50 transition-colors"
                        >
                          <div className="min-w-0 pr-2">
                            <p className="font-medium text-forest truncate">{item.nombre}</p>
                            <p className="text-[10px] text-stone">
                              {item.idiomas.join(", ")} · {item.paginasContadas} publicaciones
                            </p>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="font-bold text-emerald-800">{item.vistas} vistas</span>
                            <span className="text-[10px] text-stone block">({item.usuariosUnicos} turistas)</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Pie de Acciones */}
            <div className="p-4 sm:p-5 border-t border-stone-light/70 bg-stone-50/50 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-sans text-stone hover:text-forest cursor-pointer"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={handleGuardarEnNube}
                disabled={!resultado || !resultado.exito || isPending}
                className="px-5 py-2 rounded-xl text-xs font-sans font-semibold bg-forest text-cream hover:bg-forest/90 disabled:opacity-50 transition-all shadow-xs flex items-center gap-2 cursor-pointer"
              >
                <span>💾</span>
                <span>{isPending ? "Guardando en la Nube..." : "Guardar y Actualizar Todos los Reportes"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
