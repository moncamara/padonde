"use client";

import { useState, useMemo, useEffect } from "react";
import { Link } from "@/i18n/routing";
import {
  formatFecha,
  formatHora,
  formatPrecio,
  getFechaYMDColombia,
  getFechaYMDDesdeISO,
  esHoy,
  getEtiquetaHorario,
} from "@/lib/utils";
import { ToggleActivoButton } from "./ToggleActivoButton";
import { ToggleDestacadoButton } from "./ToggleDestacadoButton";
import { ModalEditarEvento } from "./ModalEditarEvento";
import { Button } from "@/components/ui/Button";

export interface EventoAdminItem {
  id: string;
  titulo: string;
  tipo: string;
  precio: number | null;
  precio_moneda: string;
  fecha_inicio: string;
  fecha_fin?: string | null;
  destacado: boolean;
  tiene_boleteria?: boolean;
  activo: boolean;
  descripcion?: string | null;
  imagen_url?: string | null;
  negocio_id?: string;
  negocio?: {
    id?: string;
    nombre: string;
    whatsapp: string;
  } | null;
}

interface AdminEventListProps {
  eventos: EventoAdminItem[];
  negocios?: { id: string; nombre: string }[];
  locale: string;
}

type TabType = "vigentes" | "pausados" | "pasados";

export function AdminEventList({ eventos, negocios = [], locale }: AdminEventListProps) {
  const [listaEventos, setListaEventos] = useState<EventoAdminItem[]>(eventos);
  const [tabActiva, setTabActiva] = useState<TabType>("vigentes");
  const [busqueda, setBusqueda] = useState("");
  const [eventoAEditar, setEventoAEditar] = useState<EventoAdminItem | null>(null);

  useEffect(() => {
    setListaEventos(eventos);
  }, [eventos]);

  const hoyYMD = useMemo(() => getFechaYMDColombia(new Date()), []);

  // 1. Clasificar eventos por vigencia y estado
  const { vigentes, pausados, pasados } = useMemo(() => {
    const v: EventoAdminItem[] = [];
    const pau: EventoAdminItem[] = [];
    const pas: EventoAdminItem[] = [];

    for (const ev of listaEventos) {
      const ymdInicio = getFechaYMDDesdeISO(ev.fecha_inicio);
      const ymdFin = ev.fecha_fin ? getFechaYMDDesdeISO(ev.fecha_fin) : null;
      const yaPaso = ymdFin ? ymdFin < hoyYMD : ymdInicio < hoyYMD;

      if (!ev.activo && !yaPaso) {
        // Pausado manualmente pero con fecha actual/futura
        pau.push(ev);
      } else if (yaPaso) {
        // La fecha ya concluyó en Colombia
        pas.push(ev);
      } else {
        // Activo y fecha >= hoy
        v.push(ev);
      }
    }

    // Ordenamiento lógico:
    // Vigentes: del más próximo al más lejano (ascendente)
    v.sort((a, b) => new Date(a.fecha_inicio).getTime() - new Date(b.fecha_inicio).getTime());
    // Pausados y Pasados: del más reciente al más antiguo (descendente)
    pau.sort((a, b) => new Date(b.fecha_inicio).getTime() - new Date(a.fecha_inicio).getTime());
    pas.sort((a, b) => new Date(b.fecha_inicio).getTime() - new Date(a.fecha_inicio).getTime());

    return { vigentes: v, pausados: pau, pasados: pas };
  }, [eventos, hoyYMD]);

  // 2. Lista según tab seleccionada
  const listaBase = useMemo(() => {
    switch (tabActiva) {
      case "vigentes":
        return vigentes;
      case "pausados":
        return pausados;
      case "pasados":
        return pasados;
    }
  }, [tabActiva, vigentes, pausados, pasados]);

  // 3. Filtrado por texto de búsqueda
  const listaFiltrada = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return listaBase;

    return listaBase.filter((ev) => {
      const tituloMatch = ev.titulo.toLowerCase().includes(q);
      const negocioMatch = ev.negocio?.nombre.toLowerCase().includes(q) ?? false;
      const tipoMatch = ev.tipo.toLowerCase().includes(q);
      return tituloMatch || negocioMatch || tipoMatch;
    });
  }, [listaBase, busqueda]);

  return (
    <section className="space-y-4">
      {/* Selector de Pestañas por Vigencia */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-light/80 pb-3">
        <div className="grid grid-cols-3 sm:flex items-center gap-1 p-1 bg-stone-light/50 rounded-2xl w-full sm:w-auto">
          <button
            onClick={() => setTabActiva("vigentes")}
            className={[
              "py-2 sm:py-1.5 px-2 sm:px-3.5 rounded-xl font-sans text-xs font-medium transition-all cursor-pointer flex items-center justify-center gap-1 sm:gap-1.5",
              tabActiva === "vigentes"
                ? "bg-white text-forest shadow-xs font-semibold"
                : "text-stone hover:text-forest",
            ].join(" ")}
          >
            <span>🟢</span>
            <span className="truncate">Vigentes</span>
            <span
              className={[
                "px-1.5 py-0.2 rounded-full text-[10px]",
                tabActiva === "vigentes"
                  ? "bg-forest/10 text-forest"
                  : "bg-stone-light text-stone",
              ].join(" ")}
            >
              {vigentes.length}
            </span>
          </button>

          <button
            onClick={() => setTabActiva("pausados")}
            className={[
              "py-2 sm:py-1.5 px-2 sm:px-3.5 rounded-xl font-sans text-xs font-medium transition-all cursor-pointer flex items-center justify-center gap-1 sm:gap-1.5",
              tabActiva === "pausados"
                ? "bg-white text-forest shadow-xs font-semibold"
                : "text-stone hover:text-forest",
            ].join(" ")}
          >
            <span>⏸️</span>
            <span className="truncate">Pausados</span>
            <span
              className={[
                "px-1.5 py-0.2 rounded-full text-[10px]",
                tabActiva === "pausados"
                  ? "bg-amber-100 text-amber-800"
                  : "bg-stone-light text-stone",
              ].join(" ")}
            >
              {pausados.length}
            </span>
          </button>

          <button
            onClick={() => setTabActiva("pasados")}
            className={[
              "py-2 sm:py-1.5 px-2 sm:px-3.5 rounded-xl font-sans text-xs font-medium transition-all cursor-pointer flex items-center justify-center gap-1 sm:gap-1.5",
              tabActiva === "pasados"
                ? "bg-white text-forest shadow-xs font-semibold"
                : "text-stone hover:text-forest",
            ].join(" ")}
          >
            <span>⌛</span>
            <span className="truncate">Pasados</span>
            <span
              className={[
                "px-1.5 py-0.2 rounded-full text-[10px]",
                tabActiva === "pasados"
                  ? "bg-stone-200 text-stone-700"
                  : "bg-stone-light text-stone",
              ].join(" ")}
            >
              {pasados.length}
            </span>
          </button>
        </div>

        {/* Buscador Rápido */}
        <div className="relative w-full sm:w-auto">
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por título o negocio..."
            className="w-full sm:w-64 px-3.5 py-2 sm:py-1.5 text-xs bg-white/80 rounded-xl border border-stone-light/80 placeholder:text-stone/60 focus:outline-none focus:ring-1 focus:ring-forest text-forest"
          />
          {busqueda && (
            <button
              onClick={() => setBusqueda("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone hover:text-forest text-xs cursor-pointer p-1"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Lista de Eventos de la Pestaña Activa */}
      <div className="space-y-3">
        {listaFiltrada.map((ev) => {
          const negocio = Array.isArray(ev.negocio) ? ev.negocio[0] : ev.negocio;
          const esEventoDeHoy = esHoy(ev.fecha_inicio);
          const cleanWa = negocio?.whatsapp ? negocio.whatsapp.replace(/\D/g, "") : null;

          return (
            <article
              key={ev.id}
              className={[
                "rounded-2xl p-3.5 sm:p-4 border transition-all shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3",
                tabActiva === "pasados"
                  ? "bg-white/50 border-stone-light/50 opacity-80"
                  : "bg-white/80 border-stone-light/70",
              ].join(" ")}
            >
              <div className="space-y-1.5 flex-1 min-w-0">
                {/* Título y Badges */}
                <div className="flex flex-wrap items-center gap-1.5">
                  <h3 className="font-serif text-base text-forest font-medium truncate">
                    {ev.titulo}
                  </h3>

                  {esEventoDeHoy && tabActiva === "vigentes" && (
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 border border-emerald-300 px-2 py-0.5 rounded-full font-semibold">
                      🟢 Hoy
                    </span>
                  )}

                  {ev.destacado && (
                    <span className="text-[10px] bg-terra text-white px-2 py-0.5 rounded-full font-semibold shadow-2xs">
                      ⭐ Destacado
                    </span>
                  )}

                  {ev.tiene_boleteria && (
                    <span className="text-[10px] bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-full font-semibold">
                      🎟️ Boletos
                    </span>
                  )}
                </div>

                {/* Datos del Negocio y Fecha */}
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-stone font-sans">
                  {negocio ? (
                    <span className="font-medium text-forest/90 flex items-center gap-1">
                      <span>{negocio.nombre}</span>
                      {cleanWa && (
                        <a
                          href={`https://wa.me/${cleanWa}`}
                          target="_blank"
                          rel="noreferrer"
                          title={`Escribir a WhatsApp de ${negocio.nombre}`}
                          className="text-[11px] text-emerald-600 hover:text-emerald-700 hover:underline"
                        >
                          💬
                        </a>
                      )}
                    </span>
                  ) : (
                    <span>Sin negocio</span>
                  )}

                  <span>·</span>
                  <span className="font-medium text-forest/90">
                    {getEtiquetaHorario(ev)}
                  </span>

                  <span>·</span>
                  <span className="font-medium text-forest">
                    {formatPrecio(ev.precio, (ev.precio_moneda as "COP" | "USD") || "COP")}
                  </span>
                </div>
              </div>

              {/* Acciones Rápidas Optimizadas para Mobile y Desktop */}
              <div className="w-full sm:w-auto pt-2.5 sm:pt-0 border-t border-stone-light/50 sm:border-0 flex items-center justify-between sm:justify-end gap-2 flex-wrap sm:flex-nowrap">
                <div className="flex items-center gap-1.5">
                  <ToggleActivoButton eventoId={ev.id} activoInicial={ev.activo} />
                  <ToggleDestacadoButton eventoId={ev.id} destacadoInicial={ev.destacado} />
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => setEventoAEditar(ev)}
                    className="text-xs text-forest hover:text-terra px-2.5 py-1.5 rounded-xl border border-stone-light/70 bg-white/80 hover:bg-white transition-colors flex items-center gap-1 font-medium font-sans shadow-2xs"
                    title="Editar información del evento"
                  >
                    <span>✏️</span>
                    <span className="font-sans">Editar</span>
                  </button>

                  <Link
                    href={`/minca/${ev.id}`}
                    target="_blank"
                    className="text-xs text-stone hover:text-forest px-2.5 py-1.5 rounded-xl border border-stone-light/60 bg-white/70 hover:bg-white transition-colors flex items-center gap-1 shrink-0"
                    title="Ver en la web pública"
                  >
                    <span>👁️</span>
                    <span className="sm:hidden font-sans">Ver</span>
                  </Link>
                </div>
              </div>
            </article>
          );
        })}

        {/* Estados Vacíos */}
        {listaFiltrada.length === 0 && (
          <div className="text-center py-12 px-4 text-stone bg-white/40 rounded-2xl border border-dashed border-stone-light">
            <p className="text-3xl mb-2">
              {busqueda
                ? "🔍"
                : tabActiva === "vigentes"
                ? "🌿"
                : tabActiva === "pausados"
                ? "⏸️"
                : "⌛"}
            </p>
            <p className="text-sm font-sans font-medium text-forest">
              {busqueda
                ? `No se encontraron eventos para "${busqueda}"`
                : tabActiva === "vigentes"
                ? "No hay eventos vigentes o futuros en este momento"
                : tabActiva === "pausados"
                ? "No tienes eventos pausados"
                : "Aún no hay historial de eventos pasados"}
            </p>
            <p className="text-xs text-stone mt-1 max-w-sm mx-auto">
              {busqueda
                ? "Prueba buscando con otra palabra clave."
                : tabActiva === "vigentes"
                ? "Publica el próximo plan de la cartelera para que los turistas lo descubran."
                : tabActiva === "pausados"
                ? "Todos los eventos activos están visibles en la cartelera."
                : "Los eventos cuya fecha termine se archivarán aquí automáticamente."}
            </p>

            {tabActiva === "vigentes" && !busqueda && (
              <Link href="/admin/nuevo" className="inline-block mt-4">
                <Button size="sm">+ Publicar Nuevo Evento</Button>
              </Link>
            )}
          </div>
        )}
      </div>

      {/* Modal de Edición de Evento */}
      {eventoAEditar && (
        <ModalEditarEvento
          evento={eventoAEditar}
          negocios={negocios}
          onClose={() => setEventoAEditar(null)}
          onSaved={(eventoActualizado) => {
            setListaEventos((prev) =>
              prev.map((e) =>
                e.id === eventoActualizado.id ? ({ ...e, ...eventoActualizado } as EventoAdminItem) : e
              )
            );
          }}
          onDeleted={(idEliminado) => {
            setListaEventos((prev) => prev.filter((e) => e.id !== idEliminado));
          }}
        />
      )}
    </section>
  );
}
