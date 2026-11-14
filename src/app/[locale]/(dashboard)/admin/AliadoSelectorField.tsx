"use client";

import { useState, useMemo } from "react";
import type { AliadoResumen } from "./EventUpsertForm";

export type AliadoConVerticales = AliadoResumen & {
  eventosCount?: number;
  hospedajesCount?: number;
};

interface AliadoSelectorFieldProps {
  aliados: AliadoConVerticales[];
  selectedNegocioId: string | null;
  nombreActual: string;
  whatsappActual: string;
  onSelectAliado: (aliado: AliadoConVerticales) => void;
  onClearAliado: () => void;
  actualizarDatosMaestros: boolean;
  onToggleActualizarDatosMaestros: (valor: boolean) => void;
  etiquetaContexto?: string;
}

function normalizarTelefono10(tel?: string | null): string {
  const digits = (tel || "").replace(/\D/g, "");
  return digits.length >= 10 ? digits.slice(-10) : digits;
}

export function AliadoSelectorField({
  aliados,
  selectedNegocioId,
  nombreActual,
  whatsappActual,
  onSelectAliado,
  onClearAliado,
  actualizarDatosMaestros,
  onToggleActualizarDatosMaestros,
  etiquetaContexto = "hospedaje",
}: AliadoSelectorFieldProps) {
  const [modo, setModo] = useState<"existente" | "nuevo">(
    selectedNegocioId || aliados.length > 0 ? "existente" : "nuevo"
  );
  const [busqueda, setBusqueda] = useState("");
  const [dropdownAbierto, setDropdownAbierto] = useState(false);

  const aliadoSeleccionado = useMemo(() => {
    if (!selectedNegocioId) return null;
    return aliados.find((a) => a.id === selectedNegocioId) || null;
  }, [aliados, selectedNegocioId]);

  const aliadosFiltrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return aliados.slice(0, 20);
    return aliados
      .filter((a) => {
        const nom = (a.nombre || "").toLowerCase();
        const wa = (a.whatsapp || "").toLowerCase();
        const ig = (a.instagram || "").toLowerCase();
        const zona = (a.zonaNombre || a.zonaSlug || "").toLowerCase();
        return nom.includes(q) || wa.includes(q) || ig.includes(q) || zona.includes(q);
      })
      .slice(0, 25);
  }, [aliados, busqueda]);

  // Detección preventiva de duplicados cuando está en modo "Crear Nuevo Aliado"
  const posibleDuplicado = useMemo(() => {
    if (modo !== "nuevo" || selectedNegocioId) return null;
    const tel10 = normalizarTelefono10(whatsappActual);
    const nomLower = nombreActual.trim().toLowerCase();
    if (tel10.length < 7 && nomLower.length < 3) return null;

    return (
      aliados.find((a) => {
        const aTel10 = normalizarTelefono10(a.whatsapp);
        const aNom = (a.nombre || "").trim().toLowerCase();
        if (tel10.length >= 7 && aTel10 && aTel10 === tel10) return true;
        if (nomLower.length >= 4 && aNom === nomLower) return true;
        return false;
      }) || null
    );
  }, [modo, selectedNegocioId, whatsappActual, nombreActual, aliados]);

  return (
    <div className="bg-cream/60 border border-stone-light/80 rounded-2xl p-3.5 space-y-3">
      {/* Selector de modo */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-[11px] font-bold uppercase tracking-wider text-forest">
          🏢 Aliado / Anfitrión Maestro
        </span>
        <div className="inline-flex rounded-xl bg-white p-0.5 border border-stone-light/70">
          <button
            type="button"
            onClick={() => {
              setModo("existente");
              setDropdownAbierto(true);
            }}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer ${
              modo === "existente"
                ? "bg-forest text-white shadow-2xs"
                : "text-stone hover:text-forest"
            }`}
          >
            🔗 Asociar Existente
          </button>
          <button
            type="button"
            onClick={() => {
              setModo("nuevo");
              setDropdownAbierto(false);
              onClearAliado();
            }}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer ${
              modo === "nuevo"
                ? "bg-forest text-white shadow-2xs"
                : "text-stone hover:text-forest"
            }`}
          >
            ➕ Crear Nuevo
          </button>
        </div>
      </div>

      {/* Modo Asociar a Aliado Existente */}
      {modo === "existente" && (
        <div className="space-y-2.5">
          {aliadoSeleccionado ? (
            <div className="bg-emerald-50/80 border border-emerald-200 rounded-xl p-3 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-xs font-bold text-emerald-950 truncate">
                      ✅ Vinculado a: {aliadoSeleccionado.nombre}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-white text-emerald-800 border border-emerald-200 text-[10px] font-semibold">
                      📍 {aliadoSeleccionado.zonaNombre || aliadoSeleccionado.zonaSlug || "Minca"}
                    </span>
                    {Boolean(aliadoSeleccionado.eventosCount) && (
                      <span className="px-2 py-0.5 rounded-full bg-white text-stone-700 border border-stone-200 text-[10px] font-medium">
                        📅 {aliadoSeleccionado.eventosCount} evento(s)
                      </span>
                    )}
                    {Boolean(aliadoSeleccionado.hospedajesCount) && (
                      <span className="px-2 py-0.5 rounded-full bg-white text-stone-700 border border-stone-200 text-[10px] font-medium">
                        🏡 {aliadoSeleccionado.hospedajesCount} hospedaje(s)
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-emerald-900/80 mt-1">
                    WhatsApp: <span className="font-mono">{aliadoSeleccionado.whatsapp || "N/D"}</span>
                    {aliadoSeleccionado.instagram ? ` · @${aliadoSeleccionado.instagram.replace(/^@/, "")}` : ""}
                    {aliadoSeleccionado.google_rating ? ` · ⭐ ${aliadoSeleccionado.google_rating}` : ""}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    onClearAliado();
                    setDropdownAbierto(true);
                  }}
                  className="text-[11px] font-semibold text-emerald-800 hover:underline shrink-0 cursor-pointer"
                >
                  Cambiar
                </button>
              </div>

              <label className="flex items-start gap-2 pt-1.5 border-t border-emerald-200/70 text-[11px] text-emerald-950 cursor-pointer">
                <input
                  type="checkbox"
                  checked={actualizarDatosMaestros}
                  onChange={(e) => onToggleActualizarDatosMaestros(e.target.checked)}
                  className="mt-0.5 rounded border-emerald-400 text-forest focus:ring-forest"
                />
                <span>
                  Actualizar datos maestros de <strong>{aliadoSeleccionado.nombre}</strong> (WhatsApp, Instagram, Google Maps) si los modifico abajo.{" "}
                  <span className="text-emerald-800/80">
                    (Reflejará el cambio en todas sus publicaciones)
                  </span>
                </span>
              </label>
            </div>
          ) : (
            <div className="relative">
              <input
                type="text"
                value={busqueda}
                onFocus={() => setDropdownAbierto(true)}
                onChange={(e) => {
                  setBusqueda(e.target.value);
                  setDropdownAbierto(true);
                }}
                placeholder="Buscar aliado existente por nombre, WhatsApp, Instagram o zona..."
                className="w-full bg-white border border-stone-light rounded-xl px-3 py-2 text-xs text-forest focus:outline-none focus:border-forest"
              />

              {dropdownAbierto && (
                <div className="mt-1.5 max-h-52 overflow-y-auto bg-white border border-stone-light rounded-xl shadow-lg divide-y divide-stone-light/40">
                  {aliadosFiltrados.length === 0 ? (
                    <div className="p-3 text-xs text-stone flex items-center justify-between gap-2">
                      <span>No se encontró ningún aliado con &quot;{busqueda}&quot;.</span>
                      <button
                        type="button"
                        onClick={() => {
                          setModo("nuevo");
                          setDropdownAbierto(false);
                          onClearAliado();
                        }}
                        className="text-forest font-bold hover:underline cursor-pointer shrink-0"
                      >
                        ➕ Crear nuevo
                      </button>
                    </div>
                  ) : (
                    aliadosFiltrados.map((a) => (
                      <button
                        key={a.id}
                        type="button"
                        onClick={() => {
                          onSelectAliado(a);
                          setBusqueda("");
                          setDropdownAbierto(false);
                        }}
                        className="w-full text-left px-3 py-2 hover:bg-cream/80 transition-colors flex items-center justify-between gap-2 cursor-pointer"
                      >
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-forest truncate">
                            {a.nombre}
                          </div>
                          <div className="text-[11px] text-stone truncate">
                            📍 {a.zonaNombre || a.zonaSlug || "Minca"} · 📱 {a.whatsapp || "Sin WA"}
                            {a.instagram ? ` · @${a.instagram.replace(/^@/, "")}` : ""}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          {Boolean(a.eventosCount) && (
                            <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 text-[10px] font-semibold">
                              📅 {a.eventosCount}
                            </span>
                          )}
                          {Boolean(a.hospedajesCount) && (
                            <span className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 text-[10px] font-semibold">
                              🏡 {a.hospedajesCount}
                            </span>
                          )}
                        </div>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Modo Crear Nuevo Aliado */}
      {modo === "nuevo" && (
        <div className="space-y-2">
          <p className="text-[11px] text-stone leading-relaxed">
            Se creará un nuevo registro maestro en <strong>Aliados</strong> al guardar este {etiquetaContexto}. Completa los datos abajo.
          </p>

          {posibleDuplicado && (
            <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-300 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="text-amber-950">
                <strong>⚠️ Posible aliado existente:</strong> {posibleDuplicado.nombre} ({posibleDuplicado.whatsapp})
              </div>
              <button
                type="button"
                onClick={() => {
                  setModo("existente");
                  setDropdownAbierto(false);
                  onSelectAliado(posibleDuplicado);
                }}
                className="px-2.5 py-1 rounded-lg bg-forest text-white text-[11px] font-bold hover:bg-forest-dark transition-colors cursor-pointer"
              >
                🔗 Vincular a este aliado
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

