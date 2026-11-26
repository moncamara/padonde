"use client";

import { useMemo, useState } from "react";
import { guardarSeguimientoAliadoAction } from "./actions";
import { normalizarTextoBusqueda } from "@/lib/utils/text";

export type EstadoCartelera = "reciente" | "atrasado" | "sin_publicaciones";

export interface AliadoSeguimientoRow {
  negocioId: string;
  nombre: string;
  categoria: string;
  zonaSlug: string;
  zonaNombre: string;
  whatsapp: string;
  instagram: string | null;
  totalEventos: number;
  estadoCartelera: EstadoCartelera;
  ultimaPublicacionIso: string | null;
  estadoPagoReal?: string | null;
  revisadoHoy: boolean;
  publicadoHoy: boolean;
  interactuadoIgHoy: boolean;
  comentarioHoy: string;
  ultimaInteraccionIgFecha: string | null;
  ultimaPublicacionSeguimientoFecha: string | null;
  ultimoComentarioAnterior: string | null;
}

type FiltroRapido =
  | "todos"
  | "al_dia"
  | "sin_publicar_2d"
  | "reciente"
  | "publique_hoy"
  | "sin_nada_hoy"
  | "interactue_ig_hoy";

const COLUMNAS_CSV = [
  { id: "nombre", label: "Nombre" },
  { id: "zona", label: "Zona" },
  { id: "categoria", label: "Categoría" },
  { id: "whatsapp", label: "WhatsApp" },
  { id: "instagram", label: "Instagram" },
  { id: "estado", label: "Estado Cartelera" },
  { id: "ultima_pub", label: "Última Publicación" },
  { id: "revisado_hoy", label: "Revisado Hoy" },
  { id: "publique_hoy", label: "Publiqué Hoy" },
  { id: "interactue_ig", label: "Interactué IG" },
  { id: "comentarios", label: "Comentarios" },
] as const;

type ColumnaCsvId = (typeof COLUMNAS_CSV)[number]["id"];

function formatearFechaCorta(iso: string | null): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("es-CO", {
      timeZone: "America/Bogota",
      day: "2-digit",
      month: "short",
    });
  } catch {
    return iso.slice(0, 10);
  }
}

export function SeguimientoRadarClient({
  filasIniciales,
  hoyYMD,
}: {
  filasIniciales: AliadoSeguimientoRow[];
  hoyYMD: string;
}) {
  const [filas, setFilas] = useState<AliadoSeguimientoRow[]>(filasIniciales);
  const [filtroRapido, setFiltroRapido] = useState<FiltroRapido>("todos");
  const [filtroZona, setFiltroZona] = useState("todas");
  const [filtroCategoria, setFiltroCategoria] = useState("todas");
  const [busqueda, setBusqueda] = useState("");
  const [estadoGuardado, setEstadoGuardado] = useState<Record<string, "saving" | "saved" | "error">>({});

  // Modal de exportación CSV
  const [modalCsv, setModalCsv] = useState(false);
  const [colsExportar, setColsExportar] = useState<Record<ColumnaCsvId, boolean>>({
    nombre: true,
    zona: true,
    categoria: true,
    whatsapp: true,
    instagram: true,
    estado: true,
    ultima_pub: true,
    revisado_hoy: true,
    publique_hoy: true,
    interactue_ig: true,
    comentarios: true,
  });

  async function persistir(row: AliadoSeguimientoRow) {
    setEstadoGuardado((p) => ({ ...p, [row.negocioId]: "saving" }));
    const res = await guardarSeguimientoAliadoAction({
      negocioId: row.negocioId,
      fecha: hoyYMD,
      revisado_redes: row.revisadoHoy,
      publicado_hoy: row.publicadoHoy,
      interactuado_ig: row.interactuadoIgHoy,
      comentario: row.comentarioHoy,
    });
    setEstadoGuardado((p) => ({
      ...p,
      [row.negocioId]: res.success ? "saved" : "error",
    }));
    if (res.success) {
      setTimeout(() => {
        setEstadoGuardado((p) => {
          const next = { ...p };
          if (next[row.negocioId] === "saved") delete next[row.negocioId];
          return next;
        });
      }, 1800);
    }
  }

  function toggleCampo(
    negocioId: string,
    campo: "revisadoHoy" | "publicadoHoy" | "interactuadoIgHoy"
  ) {
    let filaActualizada: AliadoSeguimientoRow | null = null;
    setFilas((prev) =>
      prev.map((f) => {
        if (f.negocioId !== negocioId) return f;
        filaActualizada = { ...f, [campo]: !f[campo] };
        return filaActualizada;
      })
    );
    if (filaActualizada) void persistir(filaActualizada);
  }

  function actualizarComentarioLocal(negocioId: string, val: string) {
    setFilas((prev) =>
      prev.map((f) => (f.negocioId === negocioId ? { ...f, comentarioHoy: val } : f))
    );
  }

  function guardarComentario(negocioId: string) {
    const fila = filas.find((f) => f.negocioId === negocioId);
    if (fila) void persistir(fila);
  }

  const contadores = useMemo(() => {
    return {
      todos: filas.length,
      al_dia: filas.filter((f) => f.estadoPagoReal === "al_dia").length,
      sin_publicar_2d: filas.filter((f) => f.estadoCartelera !== "reciente").length,
      reciente: filas.filter((f) => f.estadoCartelera === "reciente").length,
      publique_hoy: filas.filter((f) => f.publicadoHoy).length,
      sin_nada_hoy: filas.filter((f) => f.revisadoHoy && !f.publicadoHoy).length,
      interactue_ig_hoy: filas.filter((f) => f.interactuadoIgHoy).length,
    };
  }, [filas]);

  const filasFiltradas = useMemo(() => {
    const q = normalizarTextoBusqueda(busqueda);
    return filas.filter((f) => {
      if (filtroRapido === "al_dia" && f.estadoPagoReal !== "al_dia") return false;
      if (filtroRapido === "sin_publicar_2d" && f.estadoCartelera === "reciente") return false;
      if (filtroRapido === "reciente" && f.estadoCartelera !== "reciente") return false;
      if (filtroRapido === "publique_hoy" && !f.publicadoHoy) return false;
      if (filtroRapido === "sin_nada_hoy" && !(f.revisadoHoy && !f.publicadoHoy)) return false;
      if (filtroRapido === "interactue_ig_hoy" && !f.interactuadoIgHoy) return false;

      if (filtroZona !== "todas" && f.zonaSlug !== filtroZona) return false;
      if (filtroCategoria !== "todas" && f.categoria !== filtroCategoria) return false;

      if (q) {
        const hit =
          normalizarTextoBusqueda(f.nombre).includes(q) ||
          normalizarTextoBusqueda(f.instagram || "").includes(q) ||
          normalizarTextoBusqueda(f.comentarioHoy || f.ultimoComentarioAnterior || "").includes(q);
        if (!hit) return false;
      }
      return true;
    });
  }, [filas, filtroRapido, filtroZona, filtroCategoria, busqueda]);

  function exportarCsv() {
    const activas = COLUMNAS_CSV.filter((c) => colsExportar[c.id]);
    if (activas.length === 0) return;

    const esc = (v: string) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const header = activas.map((c) => esc(c.label)).join(",");

    const lines = filasFiltradas.map((f) => {
      const estadoTxt =
        f.estadoCartelera === "reciente"
          ? "Activo reciente (<=48h)"
          : f.estadoCartelera === "atrasado"
          ? "Sin publicar >2 dias"
          : "Sin publicaciones";

      const mapa: Record<ColumnaCsvId, string> = {
        nombre: f.nombre,
        zona: f.zonaNombre,
        categoria: f.categoria,
        whatsapp: f.whatsapp,
        instagram: f.instagram ? `@${f.instagram.replace(/^@/, "")}` : "",
        estado: estadoTxt,
        ultima_pub: f.ultimaPublicacionIso ? f.ultimaPublicacionIso.slice(0, 10) : "",
        revisado_hoy: f.revisadoHoy ? "Sí" : "No",
        publique_hoy: f.publicadoHoy ? "Sí" : "No",
        interactue_ig: f.interactuadoIgHoy ? "Sí" : "No",
        comentarios: f.comentarioHoy || f.ultimoComentarioAnterior || "",
      };
      return activas.map((c) => esc(mapa[c.id])).join(",");
    });

    const csv = "\uFEFF" + [header, ...lines].join("\r\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `padonde-radar-aliados-${hoyYMD}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setModalCsv(false);
  }

  return (
    <div className="space-y-4 font-sans text-[#1B382B]">
      {/* Cabecera */}
      <div className="bg-white/90 rounded-3xl border border-stone-light/80 p-4 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="font-serif text-xl sm:text-2xl font-bold text-[#1B382B] flex items-center gap-2">
            <span>📡</span>
            <span>Radar Diario y Seguimiento de Aliados</span>
          </h1>
          <p className="text-xs text-stone mt-1">
            Curaduría diaria de redes, publicaciones y bitácora persistente · Fecha Colombia:{" "}
            <strong className="text-[#1B382B]">{hoyYMD}</strong>
          </p>
        </div>

        <button
          type="button"
          onClick={() => setModalCsv(true)}
          className="px-4 py-2.5 rounded-2xl bg-[#1B382B] hover:bg-[#142a20] text-[#FBF9F5] text-xs font-bold shadow-xs flex items-center justify-center gap-2 cursor-pointer active:scale-95 transition-all shrink-0"
        >
          <span>📊</span>
          <span>Personalizar y Exportar Informe</span>
        </button>
      </div>

      {/* Píldoras de filtro rápido */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {(
          [
            { id: "todos", label: `Todos los Activos (${contadores.todos})` },
            { id: "al_dia", label: `💳 Al día / Pagados (${contadores.al_dia})` },
            { id: "sin_publicar_2d", label: `🔴 Sin publicar +2 días (${contadores.sin_publicar_2d})` },
            { id: "reciente", label: `🟢 Publicación reciente (${contadores.reciente})` },
            { id: "publique_hoy", label: `📤 Les publiqué hoy (${contadores.publique_hoy})` },
            { id: "sin_nada_hoy", label: `🚫 Sin nada para publicar hoy (${contadores.sin_nada_hoy})` },
            { id: "interactue_ig_hoy", label: `💬 Interactué en IG hoy (${contadores.interactue_ig_hoy})` },
          ] as const
        ).map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => setFiltroRapido(p.id)}
            className={[
              "shrink-0 px-3.5 py-2 rounded-2xl text-xs font-semibold border transition-all cursor-pointer",
              filtroRapido === p.id
                ? "bg-[#1B382B] text-[#FBF9F5] border-[#1B382B] shadow-xs"
                : "bg-white text-[#1B382B] border-stone-light hover:border-[#1B382B]/40",
            ].join(" ")}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Filtros secundarios */}
      <div className="bg-white/80 rounded-2xl border border-stone-light/80 p-3 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
        <select
          value={filtroZona}
          onChange={(e) => setFiltroZona(e.target.value)}
          className="px-3 py-2 text-xs bg-white rounded-xl border border-stone-light text-[#1B382B] font-semibold outline-none cursor-pointer"
        >
          <option value="todas">📍 Todas las Zonas</option>
          <option value="minca">🌿 Minca</option>
          <option value="mendihuaca">🌊 Mendihuaca</option>
          <option value="tayrona">🌴 Tayrona</option>
          <option value="taganga">🤿 Taganga</option>
        </select>

        <select
          value={filtroCategoria}
          onChange={(e) => setFiltroCategoria(e.target.value)}
          className="px-3 py-2 text-xs bg-white rounded-xl border border-stone-light text-[#1B382B] font-semibold outline-none cursor-pointer"
        >
          <option value="todas">🏷️ Todas las Categorías</option>
          <option value="comida">🍽️ Comida</option>
          <option value="rumba">🪩 Rumba</option>
          <option value="hospedaje">🏡 Hospedaje</option>
          <option value="tours">🌿 Tours</option>
          <option value="bienestar">🧘 Bienestar</option>
          <option value="arte">🎨 Arte & Cultura</option>
          <option value="artesanias">🪡 Artesanías</option>
        </select>

        <input
          type="search"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar aliado, @instagram o comentario..."
          className="flex-1 px-3.5 py-2 text-xs bg-white rounded-xl border border-stone-light text-[#1B382B] placeholder:text-stone/60 outline-none focus:ring-1 focus:ring-[#1B382B]"
        />

        <span className="text-[11px] text-stone font-medium px-1 shrink-0">
          Mostrando <strong>{filasFiltradas.length}</strong> de {filas.length}
        </span>
      </div>

      {/* Tabla operativa diaria */}
      <div className="bg-white rounded-3xl border border-stone-light/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#FBF9F5] border-b border-stone-light/80 text-[11px] uppercase tracking-wider text-stone">
                <th className="py-3 px-4 font-bold">Aliado & Zona</th>
                <th className="py-3 px-3 font-bold">Estado Cartelera</th>
                <th className="py-3 px-2.5 text-center font-bold">Revisé IG/WA</th>
                <th className="py-3 px-2.5 text-center font-bold">Publiqué Hoy</th>
                <th className="py-3 px-2.5 text-center font-bold">Interactué IG</th>
                <th className="py-3 px-4 font-bold min-w-[240px]">Comentario / Bitácora</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-light/50">
              {filasFiltradas.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-stone">
                    No hay aliados que coincidan con los filtros actuales.
                  </td>
                </tr>
              ) : (
                filasFiltradas.map((f) => {
                  const igClean = f.instagram ? f.instagram.replace(/^@/, "").trim() : "";
                  const waClean = f.whatsapp ? f.whatsapp.replace(/\D/g, "") : "";
                  const st = estadoGuardado[f.negocioId];

                  return (
                    <tr key={f.negocioId} className="hover:bg-[#FBF9F5]/70 transition-colors">
                      {/* Aliado & Zona */}
                      <td className="py-3 px-4 align-top">
                        <p className="font-serif text-sm font-bold text-[#1B382B] leading-snug">
                          {f.nombre}
                        </p>
                        <div className="flex flex-wrap items-center gap-1.5 mt-1">
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-stone-100 text-stone-700 font-semibold">
                            📍 {f.zonaNombre}
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 capitalize">
                            {f.categoria}
                          </span>
                          {f.estadoPagoReal === "al_dia" && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300 font-semibold">
                              💳 Al día
                            </span>
                          )}
                          {igClean && (
                            <a
                              href={`https://instagram.com/${igClean}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[10px] px-2 py-0.5 rounded-full bg-pink-50 text-pink-800 border border-pink-200 hover:bg-pink-100 font-semibold"
                            >
                              @{igClean} ↗
                            </a>
                          )}
                          {waClean && (
                            <a
                              href={`https://wa.me/${waClean}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 font-semibold"
                            >
                              💬 WA ↗
                            </a>
                          )}
                        </div>
                      </td>

                      {/* Estado Cartelera */}
                      <td className="py-3 px-3 align-top whitespace-nowrap">
                        {f.estadoCartelera === "reciente" ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-semibold">
                            🟢 Reciente
                          </span>
                        ) : f.estadoCartelera === "atrasado" ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200 text-[11px] font-semibold">
                            🔴 +2 días sin pub.
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-stone-100 text-stone-600 border border-stone-200 text-[11px] font-semibold">
                            ⚪ Sin publicaciones
                          </span>
                        )}
                        <p className="text-[10px] text-stone mt-1">
                          Últ. pub: <strong>{formatearFechaCorta(f.ultimaPublicacionIso)}</strong>
                        </p>
                        {(f.ultimaInteraccionIgFecha || f.ultimaPublicacionSeguimientoFecha) && (
                          <p className="text-[10px] text-stone/80">
                            {f.ultimaInteraccionIgFecha ? `IG: ${f.ultimaInteraccionIgFecha.slice(5)}` : ""}
                            {f.ultimaInteraccionIgFecha && f.ultimaPublicacionSeguimientoFecha ? " · " : ""}
                            {f.ultimaPublicacionSeguimientoFecha ? `Pub: ${f.ultimaPublicacionSeguimientoFecha.slice(5)}` : ""}
                          </p>
                        )}
                      </td>

                      {/* Checkboxes persistentes */}
                      <td className="py-3 px-2.5 text-center align-middle">
                        <input
                          type="checkbox"
                          checked={f.revisadoHoy}
                          onChange={() => toggleCampo(f.negocioId, "revisadoHoy")}
                          aria-label={`Revisé IG/WA de ${f.nombre}`}
                          className="w-5 h-5 accent-[#1B382B] rounded cursor-pointer"
                        />
                      </td>
                      <td className="py-3 px-2.5 text-center align-middle">
                        <input
                          type="checkbox"
                          checked={f.publicadoHoy}
                          onChange={() => toggleCampo(f.negocioId, "publicadoHoy")}
                          aria-label={`Publiqué hoy a ${f.nombre}`}
                          className="w-5 h-5 accent-[#1B382B] rounded cursor-pointer"
                        />
                      </td>
                      <td className="py-3 px-2.5 text-center align-middle">
                        <input
                          type="checkbox"
                          checked={f.interactuadoIgHoy}
                          onChange={() => toggleCampo(f.negocioId, "interactuadoIgHoy")}
                          aria-label={`Interactué en IG con ${f.nombre}`}
                          className="w-5 h-5 accent-[#1B382B] rounded cursor-pointer"
                        />
                      </td>

                      {/* Comentario / Bitácora inline */}
                      <td className="py-3 px-4 align-middle">
                        <div className="flex items-center gap-1.5">
                          <input
                            type="text"
                            value={f.comentarioHoy}
                            onChange={(e) => actualizarComentarioLocal(f.negocioId, e.target.value)}
                            onBlur={() => guardarComentario(f.negocioId)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                (e.target as HTMLInputElement).blur();
                              }
                            }}
                            placeholder={
                              f.ultimoComentarioAnterior
                                ? `Ant: ${f.ultimoComentarioAnterior}`
                                : "Nota rápida (Enter o salir para guardar)..."
                            }
                            className="w-full px-3 py-1.5 text-xs bg-[#FBF9F5] rounded-xl border border-stone-light text-[#1B382B] placeholder:text-stone/60 outline-none focus:ring-1 focus:ring-[#1B382B] focus:bg-white"
                          />
                          <span className="w-4 text-center text-[11px] shrink-0">
                            {st === "saving" ? "⏳" : st === "saved" ? "✓" : st === "error" ? "⚠️" : ""}
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Personalizar y Exportar CSV */}
      {modalCsv && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setModalCsv(false)}
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl max-w-md w-full p-5 sm:p-6 border border-stone-light shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-lg font-bold text-[#1B382B]">
                📊 Exportar Informe CSV / Excel
              </h2>
              <button
                type="button"
                onClick={() => setModalCsv(false)}
                className="w-8 h-8 rounded-full bg-stone-100 text-stone hover:text-[#1B382B] cursor-pointer"
              >
                ✕
              </button>
            </div>
            <p className="text-xs text-stone">
              Elige las columnas a incluir para los <strong>{filasFiltradas.length}</strong> aliados filtrados:
            </p>
            <div className="grid grid-cols-2 gap-2">
              {COLUMNAS_CSV.map((c) => (
                <label
                  key={c.id}
                  className="flex items-center gap-2 p-2 rounded-xl border border-stone-light/70 bg-[#FBF9F5] text-xs font-medium cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={colsExportar[c.id]}
                    onChange={() =>
                      setColsExportar((prev) => ({ ...prev, [c.id]: !prev[c.id] }))
                    }
                    className="accent-[#1B382B]"
                  />
                  <span>{c.label}</span>
                </label>
              ))}
            </div>
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setModalCsv(false)}
                className="flex-1 py-2.5 rounded-xl border border-stone-light text-xs font-semibold cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={exportarCsv}
                className="flex-1 py-2.5 rounded-xl bg-[#1B382B] text-[#FBF9F5] text-xs font-bold cursor-pointer"
              >
                Descargar .CSV
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
