"use client";

import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Link, useRouter } from "@/i18n/routing";
import {
  formatFecha,
  formatHora,
  formatPrecio,
  getFechaYMDColombia,
  getFechaYMDDesdeISO,
  getMinutosDelDiaColombia,
  esHoy,
  getEtiquetaHorario,
  extraerRecurrencia,
  proyectarProximaFechaEvento,
} from "@/lib/utils";
import { ToggleActivoButton } from "./ToggleActivoButton";
import { ToggleDestacadoButton } from "./ToggleDestacadoButton";
import { ModalEditarEvento } from "./ModalEditarEvento";
import { ModalProyectarEvento } from "./ModalProyectarEvento";
import { ModalNotificarAliado, type EventoNotificarData } from "./ModalNotificarAliado";
import type { AliadoSimple } from "@/lib/eventoParser";
import { Button } from "@/components/ui/Button";
import { getCategoria } from "@/constants";
import type { CategoriaEvento } from "@/lib/types";
import { calcularTiempoAlAireEvento } from "@/lib/constants/vistasAnalyticsHistoricas";

export interface EventoAdminItem {
  id: string;
  titulo: string;
  tipo: string;
  categorias?: string[] | null;
  precio: number | null;
  precio_moneda: string;
  fecha_inicio: string;
  fecha_fin?: string | null;
  destacado: boolean;
  tiene_boleteria?: boolean;
  activo: boolean;
  descripcion?: string | null;
  imagen_url?: string | null;
  video_url?: string | null;
  negocio_id?: string;
  zona_id?: string;
  zonaSlug?: string;
  zonaNombre?: string;
  created_at?: string;
  updated_at?: string;
  negocio?: {
    id?: string;
    nombre: string;
    whatsapp: string;
    google_rating?: number | null;
    google_total_reviews?: number | null;
    google_maps_url?: string | null;
    google_review_url?: string | null;
  } | null;
  clicsCount?: number;
  metadata_hospedaje?: any | null;
  es_recurrente?: boolean;
  dias_recurrentes?: number[];
}

export function getEventoTimestampActividad(ev: EventoAdminItem): number {
  const meta = ev.metadata_hospedaje as Record<string, any> | null;
  if (meta?.ultima_edicion) {
    const t = new Date(meta.ultima_edicion).getTime();
    if (!isNaN(t)) return t;
  }
  if (ev.updated_at) {
    const t = new Date(ev.updated_at).getTime();
    if (!isNaN(t)) return t;
  }
  if (ev.created_at) {
    const t = new Date(ev.created_at).getTime();
    if (!isNaN(t)) return t;
  }
  const t = new Date(ev.fecha_inicio).getTime();
  return isNaN(t) ? 0 : t;
}

interface AdminEventListProps {
  eventos: EventoAdminItem[];
  negocios?: { id: string; nombre: string }[];
  aliados?: AliadoSimple[];
  zonas?: Array<{ id: string; nombre: string; slug: string }>;
  locale: string;
}

type TabType = "vigentes" | "pausados" | "pasados";

export function AdminEventList({
  eventos,
  negocios = [],
  aliados = [],
  zonas = [
    { id: "1", nombre: "Minca", slug: "minca" },
    { id: "2", nombre: "Mendihuaca", slug: "mendihuaca" },
    { id: "3", nombre: "Tayrona", slug: "tayrona" },
    { id: "4", nombre: "Taganga", slug: "taganga" },
  ],
  locale,
}: AdminEventListProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [listaEventos, setListaEventos] = useState<EventoAdminItem[]>(eventos);
  const [tabActiva, setTabActiva] = useState<TabType>("vigentes");
  const [filtroZona, setFiltroZona] = useState<string>("todas");
  const [busqueda, setBusqueda] = useState(searchParams.get("busqueda") || "");
  type CriterioOrdenEventos = "recientes" | "cronologico" | "nombre" | "antiguos";
  const [criterioOrden, setCriterioOrden] = useState<CriterioOrdenEventos>("recientes");
  const [eventoAEditar, setEventoAEditar] = useState<EventoAdminItem | null>(null);
  const [eventoAProyectar, setEventoAProyectar] = useState<EventoAdminItem | null>(null);
  const [eventoANotificar, setEventoANotificar] = useState<EventoNotificarData | null>(null);

  function handleProyectarFecha(ev: EventoAdminItem) {
    const { fechaInicio, fechaFin } = proyectarProximaFechaEvento(
      ev.fecha_inicio,
      ev.fecha_fin,
      ev.descripcion
    );

    const borradorProyectado: EventoAdminItem = {
      ...ev,
      id: "",
      fecha_inicio: fechaInicio,
      fecha_fin: fechaFin,
      activo: false,
    };

    setEventoAProyectar(borradorProyectado);
  }

  useEffect(() => {
    const q = searchParams.get("busqueda");
    if (q !== null) setBusqueda(q);
  }, [searchParams]);

  useEffect(() => {
    setListaEventos(eventos);
  }, [eventos]);

  const hoyYMD = useMemo(() => getFechaYMDColombia(new Date()), []);

  // 1. Clasificar eventos por vigencia y estado
  const { vigentes, pausados, pasados } = useMemo(() => {
    const v: EventoAdminItem[] = [];
    const pau: EventoAdminItem[] = [];
    const pas: EventoAdminItem[] = [];

    const eventosFiltrados =
      filtroZona === "todas"
        ? listaEventos
        : listaEventos.filter((ev) => (ev.zonaSlug || "minca") === filtroZona);

    for (const ev of eventosFiltrados) {
      const ymdInicio = getFechaYMDDesdeISO(ev.fecha_inicio);
      const ymdFin = ev.fecha_fin ? getFechaYMDDesdeISO(ev.fecha_fin) : null;
      const rec = extraerRecurrencia(ev.descripcion);
      const yaPaso =
        ev.tipo === "hospedaje"
          ? false
          : rec.esRecurrente
          ? (ymdFin ? ymdFin < hoyYMD : false)
          : ymdFin
          ? ymdFin < hoyYMD
          : ymdInicio < hoyYMD;

      if (!ev.activo && !yaPaso) {
        // Pausado manualmente pero con fecha actual/futura
        pau.push(ev);
      } else if (yaPaso) {
        // La fecha ya concluyó en Colombia
        pas.push(ev);
      } else {
        // Activo y vigente
        v.push(ev);
      }
    }

    // Ordenamiento lógico:
    // Vigentes: destacados primero, luego del más temprano al más tarde
    v.sort((a, b) => {
      if (a.destacado !== b.destacado) return a.destacado ? -1 : 1;
      const ymdA = getFechaYMDDesdeISO(a.fecha_inicio);
      const ymdB = getFechaYMDDesdeISO(b.fecha_inicio);
      if (ymdA !== ymdB) return ymdA.localeCompare(ymdB);
      const minA = getMinutosDelDiaColombia(a.fecha_inicio);
      const minB = getMinutosDelDiaColombia(b.fecha_inicio);
      if (minA !== minB) return minA - minB;
      return a.titulo.localeCompare(b.titulo);
    });
    // Pausados y Pasados: del más reciente al más antiguo (descendente)
    pau.sort((a, b) => new Date(b.fecha_inicio).getTime() - new Date(a.fecha_inicio).getTime());
    pas.sort((a, b) => new Date(b.fecha_inicio).getTime() - new Date(a.fecha_inicio).getTime());

    return { vigentes: v, pausados: pau, pasados: pas };
  }, [listaEventos, hoyYMD, filtroZona]);

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

  // 3. Filtrado por texto de búsqueda y ordenación
  const listaFiltrada = useMemo(() => {
    let res = listaBase;
    const q = busqueda.trim().toLowerCase();
    if (q) {
      res = res.filter((ev) => {
        const tituloMatch = ev.titulo.toLowerCase().includes(q);
        const negocioMatch = ev.negocio?.nombre.toLowerCase().includes(q) ?? false;
        const tipoMatch =
          ev.tipo.toLowerCase().includes(q) ||
          (ev.categorias && ev.categorias.some((c) => c.toLowerCase().includes(q)));
        return tituloMatch || negocioMatch || tipoMatch;
      });
    }

    return [...res].sort((a, b) => {
      if (criterioOrden === "nombre") {
        return a.titulo.localeCompare(b.titulo, "es", { sensitivity: "base" });
      }
      if (criterioOrden === "cronologico") {
        if (a.destacado !== b.destacado) return a.destacado ? -1 : 1;
        const ymdA = getFechaYMDDesdeISO(a.fecha_inicio);
        const ymdB = getFechaYMDDesdeISO(b.fecha_inicio);
        if (ymdA !== ymdB) return ymdA.localeCompare(ymdB);
        const minA = getMinutosDelDiaColombia(a.fecha_inicio);
        const minB = getMinutosDelDiaColombia(b.fecha_inicio);
        if (minA !== minB) return minA - minB;
        return a.titulo.localeCompare(b.titulo);
      }
      if (criterioOrden === "antiguos") {
        return getEventoTimestampActividad(a) - getEventoTimestampActividad(b);
      }
      // "recientes" (por defecto): del más reciente al más antiguo según última edición o fecha de creación
      return getEventoTimestampActividad(b) - getEventoTimestampActividad(a);
    });
  }, [listaBase, busqueda, criterioOrden]);

  return (
    <section className="space-y-4">
      {/* Selector de Región / Zona */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-white/70 p-2.5 sm:p-3 rounded-2xl border border-stone-light/70 shadow-2xs">
        <div className="flex items-center gap-1.5 overflow-x-auto w-full">
          <span className="text-xs font-semibold text-forest font-sans mr-1 shrink-0">
            Región:
          </span>
          {[
            { id: "todas", label: "Todas las Zonas", icon: "🌐", count: listaEventos.length },
            {
              id: "minca",
              label: "Minca",
              icon: "🌿",
              count: listaEventos.filter((e) => (e.zonaSlug || "minca") === "minca").length,
            },
            {
              id: "mendihuaca",
              label: "Mendihuaca",
              icon: "🌊",
              count: listaEventos.filter((e) => e.zonaSlug === "mendihuaca").length,
            },
            {
              id: "tayrona",
              label: "Tayrona",
              icon: "🌴",
              count: listaEventos.filter((e) => e.zonaSlug === "tayrona").length,
            },
            {
              id: "taganga",
              label: "Taganga",
              icon: "🤿",
              count: listaEventos.filter((e) => e.zonaSlug === "taganga").length,
            },
          ].map((z) => (
            <button
              key={z.id}
              type="button"
              onClick={() => setFiltroZona(z.id)}
              className={[
                "py-1.5 px-3 rounded-xl text-xs font-sans font-medium transition-all cursor-pointer flex items-center gap-1.5 shrink-0",
                filtroZona === z.id
                  ? "bg-forest text-white shadow-xs font-semibold"
                  : "bg-cream text-stone hover:text-forest hover:bg-stone-100",
              ].join(" ")}
            >
              <span>{z.icon}</span>
              <span>{z.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  filtroZona === z.id ? "bg-white/20 text-white" : "bg-stone-light/60 text-stone"
                }`}
              >
                {z.count}
              </span>
            </button>
          ))}
        </div>

        <Link
          href="/admin/nuevo?modalJson=true"
          className="px-3.5 py-1.5 bg-amber-500/15 hover:bg-amber-500/25 text-amber-950 border border-amber-300 font-sans text-xs font-bold rounded-xl shadow-xs transition-all active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer shrink-0 self-start sm:self-auto"
          title="Crear evento pegando JSON estructurado"
        >
          <span>📥</span>
          <span>Cargar desde JSON</span>
        </Link>
      </div>

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

        {/* Controles de Orden y Búsqueda */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
          {/* Selector de Orden */}
          <div className="relative shrink-0">
            <select
              value={criterioOrden}
              onChange={(e) => setCriterioOrden(e.target.value as any)}
              className="w-full sm:w-auto py-2 sm:py-1.5 pl-3 pr-7 text-xs bg-white/90 rounded-xl border border-stone-light/80 text-forest font-medium focus:outline-none focus:ring-1 focus:ring-forest cursor-pointer appearance-none shadow-2xs"
              title="Criterio de ordenación de eventos"
            >
              <option value="recientes">⚡ Más recientes primero</option>
              <option value="cronologico">🗓️ Por fecha de evento</option>
              <option value="nombre">🔤 Nombre / Título (A-Z)</option>
              <option value="antiguos">⏳ Más antiguos primero</option>
            </select>
            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-[10px] text-stone">
              ▼
            </span>
          </div>

          {/* Buscador Rápido */}
          <div className="relative w-full sm:w-60">
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar por título o negocio..."
              className="w-full px-3.5 py-2 sm:py-1.5 text-xs bg-white/80 rounded-xl border border-stone-light/80 placeholder:text-stone/60 focus:outline-none focus:ring-1 focus:ring-forest text-forest"
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

                  {/* Badge de Zona */}
                  <span
                    className={[
                      "text-[10px] px-2 py-0.5 rounded-full font-medium border shrink-0",
                      ev.zonaSlug === "mendihuaca"
                        ? "bg-cyan-50 text-cyan-800 border-cyan-200"
                        : ev.zonaSlug === "tayrona"
                        ? "bg-amber-50 text-amber-800 border-amber-200"
                        : ev.zonaSlug === "taganga"
                        ? "bg-sky-50 text-sky-800 border-sky-200"
                        : "bg-emerald-50 text-emerald-800 border-emerald-200",
                    ].join(" ")}
                  >
                    {ev.zonaSlug === "mendihuaca"
                      ? "🌊 Mendihuaca"
                      : ev.zonaSlug === "tayrona"
                      ? "🌴 Tayrona"
                      : ev.zonaSlug === "taganga"
                      ? "🤿 Taganga"
                      : "🌿 Minca"}
                  </span>

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

                  {(() => {
                    const catObj = getCategoria(ev.tipo as CategoriaEvento);
                    const secundarias = (ev.categorias || []).filter((c) => c !== ev.tipo);
                    return (
                      <div className="flex items-center gap-1 flex-wrap">
                        {catObj ? (
                          <span className="text-[10px] bg-stone-100 text-stone-700 border border-stone-200 px-2 py-0.5 rounded-full font-medium">
                            {catObj.emoji} {catObj.label}
                          </span>
                        ) : null}
                        {secundarias.map((c) => {
                          const sObj = getCategoria(c as CategoriaEvento);
                          if (!sObj) return null;
                          return (
                            <span
                              key={c}
                              className="text-[10px] bg-stone-50 text-stone-500 border border-stone-200/60 px-1.5 py-0.5 rounded-full font-normal"
                            >
                              {sObj.emoji} {sObj.label}
                            </span>
                          );
                        })}
                      </div>
                    );
                  })()}

                  {/* Métrica de Clics a WhatsApp */}
                  <span
                    className="text-[10px] bg-emerald-50 text-emerald-800 border border-emerald-200/90 px-2 py-0.5 rounded-full font-medium"
                    title="Clics de reserva directa vía WhatsApp generados por PaDónde"
                  >
                    📲 {ev.clicsCount || 0} clics
                  </span>

                  {/* Tiempo real que el anuncio estuvo / lleva al aire */}
                  {(() => {
                    const infoT = calcularTiempoAlAireEvento(ev);
                    return (
                      <span
                        className={[
                          "text-[10px] px-2 py-0.5 rounded-full font-medium inline-flex items-center gap-1",
                          infoT.esVigente
                            ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                            : infoT.esPasado
                            ? "bg-stone-100 text-stone-600 border border-stone-200"
                            : "bg-amber-50 text-amber-800 border border-amber-200",
                        ].join(" ")}
                        title={`Tiempo visible en cartelera: del ${infoT.fechaIniStr} al ${infoT.fechaFinStr}`}
                      >
                        {infoT.etiquetaEstado}
                      </span>
                    );
                  })()}

                  {(() => {
                    const rating = ev.negocio?.google_rating ?? ev.metadata_hospedaje?.google_reputacion?.rating;
                    const totalReviews = ev.negocio?.google_total_reviews ?? ev.metadata_hospedaje?.google_reputacion?.total_reviews;
                    if (!rating) return null;
                    return (
                      <span
                        className="text-[10px] bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-full font-medium"
                        title="Calificación en Google Maps"
                      >
                        ★ {Number(rating).toFixed(1)} {totalReviews ? `(${totalReviews})` : ""}
                      </span>
                    );
                  })()}
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

                <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
                  {negocio?.whatsapp && (
                    <button
                      type="button"
                      onClick={() => {
                        const totalEvs = listaEventos.filter(
                          (e) => (negocio && e.negocio?.id === negocio.id) || e.negocio_id === ev.negocio_id
                        ).length;

                        setEventoANotificar({
                          id: ev.id,
                          titulo: ev.titulo,
                          negocioNombre: negocio.nombre,
                          whatsapp: negocio.whatsapp,
                          zonaSlug: ev.zonaSlug,
                          zonaNombre: ev.zonaNombre,
                          tipoCategoria: ev.tipo,
                          esPrimerEvento: totalEvs <= 1,
                        });
                      }}
                      className="text-xs text-emerald-800 hover:text-emerald-900 px-2.5 py-1.5 rounded-xl border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 transition-colors flex items-center gap-1 font-medium font-sans shadow-2xs cursor-pointer active:scale-95"
                      title="Enviar mensaje de revisión y confirmación al WhatsApp del aliado"
                    >
                      <span>📲</span>
                      <span className="font-sans">Notificar</span>
                    </button>
                  )}

                  {ev.tipo === "hospedaje" ? (
                    <Link
                      href="/admin/hospedajes"
                      className="text-xs text-forest hover:text-terra px-2.5 py-1.5 rounded-xl border border-stone-light/70 bg-white/80 hover:bg-white transition-colors flex items-center gap-1 font-semibold font-sans shadow-2xs"
                      title="Editar habitaciones, fotos y tarifas en el módulo de Hospedajes"
                    >
                      <span>🏡</span>
                      <span className="font-sans">Editar Hospedaje</span>
                    </Link>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setEventoAEditar(ev)}
                      className="text-xs text-forest hover:text-terra px-2.5 py-1.5 rounded-xl border border-stone-light/70 bg-white/80 hover:bg-white transition-colors flex items-center gap-1 font-medium font-sans shadow-2xs cursor-pointer"
                      title="Editar información del evento"
                    >
                      <span>✏️</span>
                      <span className="font-sans">Editar</span>
                    </button>
                  )}

                  {ev.tipo !== "hospedaje" && (
                    <button
                      type="button"
                      onClick={() => handleProyectarFecha(ev)}
                      className="text-xs text-amber-800 hover:text-amber-950 px-2.5 py-1.5 rounded-xl border border-amber-300/80 bg-amber-50/80 hover:bg-amber-100 transition-colors flex items-center gap-1 font-semibold font-sans shadow-2xs cursor-pointer"
                      title="Proyectar próxima fecha semanal para este aliado (crea un borrador inactivo con datos precargados)"
                    >
                      <span>🗓️</span>
                      <span className="font-sans">Proyectar Próxima Fecha</span>
                    </button>
                  )}

                  <a
                    href={`/es/${ev.zonaSlug || "minca"}/${ev.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-forest hover:text-white px-2.5 py-1.5 rounded-xl border border-forest/20 bg-forest/5 hover:bg-forest transition-colors flex items-center gap-1.5 font-medium font-sans shadow-2xs shrink-0 cursor-pointer"
                    title="Abrir ficha pública del plan en una nueva pestaña"
                  >
                    <span>👁️</span>
                    <span className="font-sans">Ver Ficha Pública</span>
                  </a>
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
          aliados={aliados}
          onClose={() => setEventoAEditar(null)}
          onSaved={(eventoActualizado) => {
            const ahoraIso = new Date().toISOString();
            setListaEventos((prev) =>
              prev.map((e) => {
                if (e.id === eventoActualizado.id) {
                  const metaActualizado = {
                    ...(e.metadata_hospedaje || {}),
                    ...(eventoActualizado.metadata_hospedaje || {}),
                    ultima_edicion: ahoraIso,
                  };
                  return {
                    ...e,
                    ...eventoActualizado,
                    created_at: e.created_at || ahoraIso,
                    updated_at: ahoraIso,
                    metadata_hospedaje: metaActualizado,
                  } as EventoAdminItem;
                }
                return e;
              })
            );
          }}
          onDeleted={(idEliminado) => {
            setListaEventos((prev) => prev.filter((e) => e.id !== idEliminado));
          }}
        />
      )}

      {/* Modal para Proyectar Próxima Fecha (Aliados Recurrentes) */}
      {eventoAProyectar && (
        <ModalProyectarEvento
          eventoProyectado={eventoAProyectar}
          negocios={negocios}
          onClose={() => setEventoAProyectar(null)}
          onSuccess={(res) => {
            setEventoAProyectar(null);
            if (res?.eventId) {
              setListaEventos((prev) => [
                {
                  ...eventoAProyectar,
                  id: res.eventId,
                  activo: false,
                },
                ...prev,
              ]);
              setTabActiva("pausados");
            }
          }}
        />
      )}

      {/* Modal para Notificar al Aliado por WhatsApp */}
      <ModalNotificarAliado
        evento={eventoANotificar}
        isOpen={Boolean(eventoANotificar)}
        onClose={() => setEventoANotificar(null)}
      />
    </section>
  );
}
