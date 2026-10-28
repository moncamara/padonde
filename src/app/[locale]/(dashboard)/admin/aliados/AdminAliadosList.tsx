"use client";

import { useState, useTransition, useMemo } from "react";
import { useRouter } from "@/i18n/routing";
import { formatFecha } from "@/lib/utils";
import {
  actualizarPlanNegocioAction,
  toggleActivoAliadoAction,
  eliminarAliadoAdminAction,
} from "../actions";
import { ModalEditarAliado } from "./ModalEditarAliado";
import { ModalEventosAliado } from "./ModalEventosAliado";
import { obtenerMetricasGA4Aliado, type MetricaHistoricaAliado } from "@/lib/constants/vistasAnalyticsHistoricas";
import type { PlanNegocio } from "@/lib/types";

export interface EventoAliadoItem {
  id: string;
  titulo: string;
  tipo: string;
  precio: number | null;
  precio_moneda: string;
  fecha_inicio: string;
  fecha_fin?: string | null;
  activo: boolean;
  destacado: boolean;
  imagen_url?: string | null;
  descripcion?: string | null;
}

export interface AliadoItem {
  id: string;
  nombre: string;
  descripcion?: string | null;
  categoria: string;
  whatsapp: string;
  instagram?: string | null;
  plan: PlanNegocio;
  plan_expira_en?: string | null;
  activo: boolean;
  created_at: string;
  totalEventos: number;
  eventosActivos: number;
  totalClics?: number;
  clics7Dias?: number;
  zona_id?: string;
  zonaSlug?: string;
  zonaNombre?: string;
  google_rating?: number | null;
  google_total_reviews?: number | null;
  google_maps_url?: string | null;
  google_review_url?: string | null;
  eventos?: EventoAliadoItem[];
}

interface AdminAliadosListProps {
  aliados: AliadoItem[];
  negociosList?: { id: string; nombre: string }[];
  locale: string;
  metricasDinamicas?: Record<string, MetricaHistoricaAliado> | null;
}

type FiltroPlan = "todos" | "pro_premium" | "por_vencer" | "gratis";

export function AdminAliadosList({
  aliados,
  negociosList = [],
  locale,
  metricasDinamicas = null,
}: AdminAliadosListProps) {
  const router = useRouter();
  const [filtro, setFiltro] = useState<FiltroPlan>("todos");
  const [filtroZona, setFiltroZona] = useState<string>("todas");
  const [filtroCategoria, setFiltroCategoria] = useState<string>("todas");
  const [busqueda, setBusqueda] = useState("");
  const [copiadoId, setCopiadoId] = useState<string | null>(null);

  // Estado para ver eventos del aliado
  const [aliadoParaVerEventos, setAliadoParaVerEventos] = useState<AliadoItem | null>(null);

  // Estado para modal de edición completa de aliado
  const [aliadoParaEditar, setAliadoParaEditar] = useState<AliadoItem | null>(null);

  // Estado para confirmación de eliminación de aliado
  const [aliadoAEliminar, setAliadoAEliminar] = useState<AliadoItem | null>(null);

  // Estado para modal / panel de edición de plan
  const [editandoNegocio, setEditandoNegocio] = useState<AliadoItem | null>(null);
  const [reporteNegocio, setReporteNegocio] = useState<AliadoItem | null>(null);
  const [nuevoPlan, setNuevoPlan] = useState<PlanNegocio>("pro");
  const [diasVigencia, setDiasVigencia] = useState<number>(30);
  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Clasificación de vigencia
  function getEstadoExpiracion(aliado: AliadoItem) {
    if (!aliado.plan_expira_en) {
      if (aliado.plan === "gratis") return { tipo: "gratis", texto: "Plan Gratis", badge: "bg-stone-100 text-stone-700 border-stone-200" };
      return { tipo: "vigente", texto: "Sin fecha límite", badge: "bg-emerald-50 text-emerald-800 border-emerald-200" };
    }

    const fechaExp = new Date(aliado.plan_expira_en);
    const ahora = new Date();
    const diffDias = Math.ceil((fechaExp.getTime() - ahora.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDias < 0) {
      return {
        tipo: "vencido",
        texto: `Vencido hace ${Math.abs(diffDias)}d`,
        badge: "bg-red-50 text-red-700 border-red-200",
      };
    }
    if (diffDias <= 5) {
      return {
        tipo: "por_vencer",
        texto: `Vence en ${diffDias === 0 ? "hoy" : `${diffDias}d`} (${formatFecha(aliado.plan_expira_en)})`,
        badge: "bg-amber-50 text-amber-800 border-amber-300",
      };
    }
    return {
      tipo: "vigente",
      texto: `Vigente hasta ${formatFecha(aliado.plan_expira_en)} (${diffDias}d)`,
      badge: "bg-emerald-50 text-emerald-800 border-emerald-200",
    };
  }

  // Filtrado de aliados
  const aliadosFiltrados = useMemo(() => {
    return aliados.filter((a) => {
      // 0. Filtro por Región / Zona
      if (filtroZona !== "todas" && (a.zonaSlug || "minca") !== filtroZona) {
        return false;
      }

      // 0.1 Filtro por Categoría
      if (filtroCategoria !== "todas") {
        const cat = (a.categoria || "").toLowerCase();
        const nom = (a.nombre || "").toLowerCase();
        if (filtroCategoria === "restaurantes") {
          const matchRest =
            cat.includes("comida") ||
            cat.includes("restaurante") ||
            cat.includes("bar") ||
            cat.includes("café") ||
            cat.includes("cafe") ||
            cat.includes("gastronom") ||
            nom.includes("restaurante") ||
            nom.includes("bar") ||
            nom.includes("cafe");
          if (!matchRest) return false;
        } else if (filtroCategoria === "hospedajes") {
          const matchHosp =
            cat.includes("hospedaje") ||
            cat.includes("hostal") ||
            cat.includes("hotel") ||
            cat.includes("glamping") ||
            cat.includes("cabaña") ||
            cat.includes("finca") ||
            nom.includes("hostel") ||
            nom.includes("hostal") ||
            nom.includes("hotel") ||
            nom.includes("finca") ||
            nom.includes("glamping") ||
            nom.includes("cabaña");
          if (!matchHosp) return false;
        } else if (filtroCategoria === "tours") {
          const matchTour =
            cat.includes("tours") ||
            cat.includes("aventura") ||
            cat.includes("guia");
          if (!matchTour) return false;
        }
      }

      // 1. Filtro por plan / estado
      const est = getEstadoExpiracion(a);
      if (filtro === "pro_premium" && a.plan === "gratis") return false;
      if (filtro === "gratis" && a.plan !== "gratis") return false;
      if (filtro === "por_vencer" && est.tipo !== "por_vencer" && est.tipo !== "vencido") return false;

      // 2. Búsqueda por texto
      const q = busqueda.trim().toLowerCase();
      if (!q) return true;
      const matchNombre = a.nombre.toLowerCase().includes(q);
      const matchCategoria = a.categoria.toLowerCase().includes(q);
      const matchWa = a.whatsapp.includes(q);
      return matchNombre || matchCategoria || matchWa;
    });
  }, [aliados, filtro, busqueda, filtroZona, filtroCategoria]);

  // Mensaje para cobrar o contactar por WhatsApp
  function generarEnlaceWhatsAppCobro(aliado: AliadoItem) {
    const cleanWa = aliado.whatsapp.replace(/\D/g, "");
    const est = getEstadoExpiracion(aliado);
    const destinoNombre = aliado.zonaNombre || (aliado.zonaSlug === "mendihuaca" ? "Mendihuaca" : "Minca");

    let mensaje = "";
    if (aliado.plan !== "gratis" && (est.tipo === "por_vencer" || est.tipo === "vencido")) {
      mensaje = `🌿 Hola ${aliado.nombre}, te escribimos de PaDónde.\n\nTu suscripción Plan ${aliado.plan.toUpperCase()} en la cartelera de ${destinoNombre} ${
        est.tipo === "vencido" ? "venció recientemente" : "está próxima a vencer"
      }.\n\nPara mantener tus planes con visibilidad destacada y continuar recibiendo turistas directos a tu WhatsApp, puedes transferir a Nequi/Daviplata.\n\n¿Te gustaría renovar este mes? Quedamos muy atentos.`;
    } else if (aliado.plan === "gratis") {
      mensaje = `🌿 Hola ${aliado.nombre}, te escribimos de PaDónde.\n\nVemos que tienes planes de ${aliado.categoria} en ${destinoNombre}. ¿Te gustaría activar el Plan Pro para que aparezcan destacados en las primeras posiciones de la cartelera y recibas más clics de turistas?\n\nCuéntanos y te mostramos cómo funciona.`;
    } else {
      mensaje = `🌿 Hola ${aliado.nombre}, te escribimos de PaDónde para saber cómo va la temporada en ${destinoNombre} y si tienes nuevos eventos que quieras publicar esta semana.`;
    }

    return `https://wa.me/${cleanWa}?text=${encodeURIComponent(mensaje)}`;
  }

  // Copiar reporte al portapapeles
  function handleCopiarReporte(aliado: AliadoItem) {
    const est = getEstadoExpiracion(aliado);
    const destinoNombre = aliado.zonaNombre || (aliado.zonaSlug === "mendihuaca" ? "Mendihuaca" : "Minca");
    const metricas = obtenerMetricasGA4Aliado(aliado.nombre, metricasDinamicas);
    const fechaPub = aliado.created_at
      ? new Date(aliado.created_at).toLocaleDateString("es-CO", { day: "numeric", month: "short", year: "numeric" })
      : null;
    const diasActivo = aliado.created_at
      ? Math.max(1, Math.ceil((new Date().getTime() - new Date(aliado.created_at).getTime()) / (1000 * 60 * 60 * 24)))
      : null;

    const texto = `🌿 Reporte PaDónde — ${aliado.nombre}
📍 ${destinoNombre}, Magdalena
🗓️ Publicado: ${fechaPub || "Julio 2026"} (${diasActivo} días ${aliado.activo ? "activo" : "pausado"})
👁️ Visitas a la ficha: ${metricas.vistas} vistas (${metricas.usuariosUnicos} turistas únicos)
📲 Contactos a WhatsApp: ${aliado.totalClics || 0}
🟢 Eventos vigentes en cartelera: ${aliado.eventosActivos}
📅 Total de eventos registrados: ${aliado.totalEventos}
⭐ Plan: ${aliado.plan.toUpperCase()} (${est.texto})

¡Gracias por impulsar la cartelera turística de ${destinoNombre}!`;

    navigator.clipboard.writeText(texto);
    setCopiadoId(aliado.id);
    setTimeout(() => setCopiadoId(null), 2500);
  }

  // Alternar estado activo / inactivo de un aliado
  function handleToggleActivo(aliado: AliadoItem) {
    startTransition(async () => {
      const res = await toggleActivoAliadoAction(aliado.id, !aliado.activo, true);
      if (!res.success) {
        alert(res.error || "No se pudo cambiar el estado del aliado.");
      } else {
        router.refresh();
      }
    });
  }

  // Guardar cambio de plan
  function handleGuardarPlan() {
    if (!editandoNegocio) return;
    setErrorMsg(null);

    startTransition(async () => {
      const res = await actualizarPlanNegocioAction(
        editandoNegocio.id,
        nuevoPlan,
        nuevoPlan === "gratis" ? 0 : diasVigencia
      );

      if (!res.success) {
        setErrorMsg(res.error || "No se pudo actualizar el plan.");
      } else {
        setEditandoNegocio(null);
        router.refresh();
      }
    });
  }

  return (
    <div className="space-y-6">
      {/* Selector de Región / Zona y Tipo de Negocio */}
      <div className="bg-white/70 p-2.5 sm:p-3 rounded-2xl border border-stone-light/70 shadow-2xs space-y-2.5">
        {/* Fila 1: Regiones */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full">
          <span className="text-xs font-semibold text-forest font-sans mr-1 shrink-0">
            Región:
          </span>
          {[
            { id: "todas", label: "Todas las Zonas", icon: "🌐", count: aliados.length },
            {
              id: "minca",
              label: "Minca",
              icon: "🌿",
              count: aliados.filter((a) => (a.zonaSlug || "minca") === "minca").length,
            },
            {
              id: "mendihuaca",
              label: "Mendihuaca",
              icon: "🌊",
              count: aliados.filter((a) => a.zonaSlug === "mendihuaca").length,
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

        {/* Fila 2: Categorías (Restaurantes, Hospedajes, Tours, Todos) */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full pt-1.5 border-t border-stone-light/50">
          <span className="text-xs font-semibold text-forest font-sans mr-1 shrink-0">
            Tipo:
          </span>
          {[
            { id: "todas", label: "Todas las Categorías" },
            { id: "restaurantes", label: "🍽️ Restaurantes" },
            { id: "hospedajes", label: "🏡 Hospedajes" },
            { id: "tours", label: "🎒 Tours & Guías" },
          ].map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setFiltroCategoria(c.id)}
              className={[
                "py-1 px-2.5 rounded-lg text-xs font-sans font-medium transition-all cursor-pointer flex items-center gap-1 shrink-0",
                filtroCategoria === c.id
                  ? "bg-forest/90 text-white shadow-2xs font-semibold"
                  : "bg-cream/80 text-stone hover:text-forest hover:bg-stone-100 border border-stone-light/60",
              ].join(" ")}
            >
              <span>{c.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Controles de Búsqueda y Filtros */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-light/80 pb-4">
        {/* Pills de Filtrado con scroll horizontal en móviles */}
        <div className="flex items-center gap-1.5 p-1 bg-stone-light/40 rounded-2xl overflow-x-auto w-full sm:w-auto">
          <button
            onClick={() => setFiltro("todos")}
            className={[
              "px-3 py-1.5 rounded-xl font-sans text-xs font-medium transition-all cursor-pointer whitespace-nowrap flex-shrink-0",
              filtro === "todos"
                ? "bg-white text-forest shadow-xs font-semibold"
                : "text-stone hover:text-forest",
            ].join(" ")}
          >
            Todos ({aliados.length})
          </button>

          <button
            onClick={() => setFiltro("pro_premium")}
            className={[
              "px-3 py-1.5 rounded-xl font-sans text-xs font-medium transition-all cursor-pointer flex items-center gap-1 whitespace-nowrap flex-shrink-0",
              filtro === "pro_premium"
                ? "bg-white text-forest shadow-xs font-semibold"
                : "text-stone hover:text-forest",
            ].join(" ")}
          >
            <span>⭐ Pro / Premium</span>
            <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded-full font-semibold">
              {aliados.filter((a) => a.plan !== "gratis").length}
            </span>
          </button>

          <button
            onClick={() => setFiltro("por_vencer")}
            className={[
              "px-3 py-1.5 rounded-xl font-sans text-xs font-medium transition-all cursor-pointer flex items-center gap-1 whitespace-nowrap flex-shrink-0",
              filtro === "por_vencer"
                ? "bg-white text-forest shadow-xs font-semibold"
                : "text-stone hover:text-forest",
            ].join(" ")}
          >
            <span>⚠️ Por Vencer</span>
            <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded-full font-semibold">
              {
                aliados.filter((a) => {
                  const est = getEstadoExpiracion(a);
                  return est.tipo === "por_vencer" || est.tipo === "vencido";
                }).length
              }
            </span>
          </button>

          <button
            onClick={() => setFiltro("gratis")}
            className={[
              "px-3 py-1.5 rounded-xl font-sans text-xs font-medium transition-all cursor-pointer whitespace-nowrap flex-shrink-0",
              filtro === "gratis"
                ? "bg-white text-forest shadow-xs font-semibold"
                : "text-stone hover:text-forest",
            ].join(" ")}
          >
            Gratis ({aliados.filter((a) => a.plan === "gratis").length})
          </button>
        </div>

        {/* Buscador de Negocio */}
        <div className="relative w-full sm:w-auto">
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por nombre o teléfono..."
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

      {/* Lista de Aliados */}
      <div className="grid grid-cols-1 gap-3">
        {aliadosFiltrados.map((aliado) => {
          const est = getEstadoExpiracion(aliado);
          const cleanWa = aliado.whatsapp.replace(/\D/g, "");
          const metricasGA4 = obtenerMetricasGA4Aliado(aliado.nombre, metricasDinamicas);
          const fechaPub = aliado.created_at
            ? new Date(aliado.created_at).toLocaleDateString("es-CO", { day: "numeric", month: "short", year: "numeric" })
            : null;
          const diasActivo = aliado.created_at
            ? Math.max(1, Math.ceil((new Date().getTime() - new Date(aliado.created_at).getTime()) / (1000 * 60 * 60 * 24)))
            : null;

          return (
            <article
              key={aliado.id}
              className={[
                "rounded-2xl p-4 sm:p-5 border transition-all space-y-3",
                aliado.activo
                  ? "bg-white/80 border-stone-light/80 shadow-xs hover:border-stone hover:shadow-sm"
                  : "bg-stone-50/70 border-dashed border-stone-300 opacity-90",
              ].join(" ")}
            >
              {/* Fila 1: Cabecera con Nombre y Badges Principales */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2 min-w-0">
                  <h3 className="font-serif text-lg sm:text-xl text-forest font-bold tracking-tight">
                    {aliado.nombre}
                  </h3>

                  {/* Badge de Zona */}
                  <span
                    className={[
                      "text-[10px] px-2 py-0.5 rounded-full font-medium border shrink-0",
                      aliado.zonaSlug === "mendihuaca"
                        ? "bg-cyan-50 text-cyan-800 border-cyan-200"
                        : "bg-emerald-50 text-emerald-800 border-emerald-200",
                    ].join(" ")}
                  >
                    {aliado.zonaSlug === "mendihuaca" ? "🌊 Mendihuaca" : "🌿 Minca"}
                  </span>

                  {/* Badge de Google Maps si está configurado */}
                  {aliado.google_rating && (
                    <span
                      className="text-[10px] px-2 py-0.5 rounded-full font-semibold border bg-amber-50 text-amber-900 border-amber-200 flex items-center gap-1 shrink-0"
                      title={`Google Maps: ${aliado.google_rating} (${aliado.google_total_reviews || 0} reseñas)`}
                    >
                      <span>★</span>
                      <span>{Number(aliado.google_rating).toFixed(1)}</span>
                      {aliado.google_total_reviews ? (
                        <span className="text-stone-500 font-normal">({aliado.google_total_reviews})</span>
                      ) : null}
                    </span>
                  )}

                  {/* Switch rápido de Activo / Pausado */}
                  <button
                    type="button"
                    onClick={() => handleToggleActivo(aliado)}
                    disabled={isPending}
                    title={
                      aliado.activo
                        ? "Clic para pausar este aliado (sus publicaciones no se verán)"
                        : "Clic para reactivar este aliado"
                    }
                    className={[
                      "text-[10px] px-2.5 py-0.5 rounded-full font-semibold border flex items-center gap-1 transition-all cursor-pointer shadow-2xs active:scale-95 shrink-0",
                      aliado.activo
                        ? "bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100"
                        : "bg-red-50 text-red-700 border-red-300 hover:bg-red-100",
                    ].join(" ")}
                  >
                    <span>{aliado.activo ? "🟢 Activo" : "⏸️ Pausado"}</span>
                  </button>

                  {/* Badge de Plan */}
                  <span
                    className={[
                      "text-[10px] px-2.5 py-0.5 rounded-full font-semibold border uppercase tracking-wider shrink-0",
                      aliado.plan === "premium"
                        ? "bg-terra text-white border-terra shadow-2xs"
                        : aliado.plan === "pro"
                        ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                        : "bg-stone-100 text-stone-600 border-stone-200",
                    ].join(" ")}
                  >
                    {aliado.plan}
                  </span>

                  {/* Badge de Estado de Vencimiento */}
                  <span
                    className={[
                      "text-[10px] px-2 py-0.5 rounded-full font-medium border shrink-0",
                      est.badge,
                    ].join(" ")}
                  >
                    {est.texto}
                  </span>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {/* Métrica de Vistas Reales GA4 */}
                  {metricasGA4.vistas > 0 && (
                    <div
                      className="inline-flex items-center gap-1.5 text-xs text-forest bg-forest/5 border border-forest/20 px-2.5 py-1 rounded-xl font-medium shrink-0"
                      title={`Google Analytics: ${metricasGA4.vistas} visitas reales por ${metricasGA4.usuariosUnicos} usuarios únicos`}
                    >
                      <span>👁️</span>
                      <span><strong>{metricasGA4.vistas}</strong> vistas</span>
                      <span className="text-[10px] text-stone">({metricasGA4.usuariosUnicos} turistas)</span>
                    </div>
                  )}

                  {/* Métrica de Clics a WhatsApp */}
                  <div
                    className="inline-flex items-center gap-1.5 text-xs text-emerald-800 bg-emerald-50 border border-emerald-200/90 px-2.5 py-1 rounded-xl font-medium shrink-0"
                    title="Personas interesadas que hicieron clic en Reservar por WhatsApp"
                  >
                    <span>📲</span>
                    <span>{aliado.totalClics || 0} clics</span>
                    {typeof aliado.clics7Dias === "number" && aliado.clics7Dias > 0 && (
                      <span className="text-[10px] text-emerald-600 font-bold">(+{aliado.clics7Dias} en 7d)</span>
                    )}
                  </div>

                  {/* Acceso Rápido a Eventos del Aliado */}
                  <button
                    type="button"
                    onClick={() => setAliadoParaVerEventos(aliado)}
                    className="inline-flex items-center gap-1.5 text-xs text-forest hover:text-terra font-semibold hover:underline cursor-pointer bg-forest/5 hover:bg-forest/10 px-2.5 py-1 rounded-xl transition-all shrink-0 self-start sm:self-auto"
                    title={`Ver y gestionar las ${aliado.totalEventos} publicaciones de este aliado`}
                  >
                    <span>🎪</span>
                    <span>
                      {aliado.eventosActivos} vigentes ({aliado.totalEventos} total)
                    </span>
                    <span className="text-[10px]">↗</span>
                  </button>
                </div>
              </div>

              {/* Fila 2: Metadatos de Contacto (Categoría, Fecha de Publicación, Permanencia, WhatsApp, Instagram) */}
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-stone font-sans">
                <span className="capitalize text-forest font-medium">
                  🏷️ {aliado.categoria}
                </span>

                {fechaPub && (
                  <>
                    <span>·</span>
                    <span
                      className="text-stone-600"
                      title={`Ficha publicada el ${fechaPub}. Lleva ${diasActivo} días ${aliado.activo ? "activa en cartelera" : "registrada (actualmente en pausa)"}.`}
                    >
                      🗓️ Publicada: <strong className="text-forest">{fechaPub}</strong> ({diasActivo}d {aliado.activo ? "activo" : "pausado"})
                    </span>
                  </>
                )}

                <span>·</span>
                <a
                  href={`https://wa.me/${cleanWa}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-emerald-700 hover:text-emerald-800 font-medium hover:underline flex items-center gap-1"
                >
                  <span>💬</span>
                  <span>+{cleanWa}</span>
                </a>

                {aliado.instagram && (
                  <>
                    <span>·</span>
                    <a
                      href={`https://instagram.com/${aliado.instagram.replace("@", "")}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-stone hover:text-forest hover:underline"
                    >
                      @{aliado.instagram.replace("@", "")}
                    </a>
                  </>
                )}
              </div>

              {!aliado.activo && (
                <p className="text-[11px] text-amber-800 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200/60 inline-flex items-center gap-1">
                  <span>⚠️</span>
                  <span>Aliado inactivo: sus publicaciones están pausadas en la cartelera turística.</span>
                </p>
              )}

              {/* Fila 3: Barra de Acciones Operativas y Cobro */}
              <div className="pt-2.5 border-t border-stone-light/60 flex flex-wrap items-center justify-between gap-2">
                {/* Grupo Izquierdo: Gestión de Eventos y Reporte */}
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={() => setAliadoParaVerEventos(aliado)}
                    className="px-3 py-1.5 rounded-xl text-xs font-sans font-semibold text-forest bg-forest/10 hover:bg-forest/20 border border-forest/30 transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs"
                    title={`Ver las ${aliado.totalEventos} publicaciones de este aliado`}
                  >
                    <span>🎪</span>
                    <span>Gestionar Eventos ({aliado.totalEventos})</span>
                  </button>

                  <button
                    onClick={() => setReporteNegocio(aliado)}
                    className="px-3 py-1.5 rounded-xl text-xs font-sans text-forest bg-white border border-stone-light hover:bg-stone-50 transition-colors cursor-pointer flex items-center gap-1.5 font-medium shadow-2xs"
                    title="Generar y enviar Reporte de Impacto por WhatsApp"
                  >
                    <span>📊</span>
                    <span>Reporte</span>
                  </button>
                </div>

                {/* Grupo Derecho: WhatsApp Comercial, Plan, Editar y Eliminar */}
                <div className="flex items-center gap-2 flex-wrap">
                  <a
                    href={generarEnlaceWhatsAppCobro(aliado)}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3.5 py-1.5 rounded-xl text-xs font-sans font-semibold bg-emerald-600 text-white hover:bg-emerald-700 transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
                    title="Abrir WhatsApp con mensaje pre-redactado de cobro o contacto"
                  >
                    <span>💬</span>
                    <span>
                      {aliado.plan !== "gratis" && (est.tipo === "por_vencer" || est.tipo === "vencido")
                        ? "Cobrar"
                        : aliado.plan === "gratis"
                        ? "Ofrecer Pro"
                        : "WhatsApp"}
                    </span>
                  </a>

                  <button
                    onClick={() => {
                      setEditandoNegocio(aliado);
                      setNuevoPlan(aliado.plan);
                      setDiasVigencia(30);
                    }}
                    className="px-3 py-1.5 rounded-xl text-xs font-sans font-medium text-stone hover:text-forest bg-white border border-stone-light hover:bg-stone-50 transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
                    title="Cambiar plan o extender vigencia"
                  >
                    <span>⚙️</span>
                    <span>Plan</span>
                  </button>

                  <button
                    onClick={() => setAliadoParaEditar(aliado)}
                    className="px-3 py-1.5 rounded-xl text-xs font-sans font-semibold text-forest bg-white border border-stone-light hover:bg-stone-50 transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
                    title="Editar datos comerciales, teléfono e Instagram"
                  >
                    <span>✏️</span>
                    <span>Editar</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setAliadoAEliminar(aliado)}
                    className="p-1.5 rounded-xl text-xs text-stone/40 hover:text-red-600 hover:bg-red-50 border border-stone-light/60 hover:border-red-200 transition-colors cursor-pointer flex items-center justify-center"
                    title={`Eliminar aliado ${aliado.nombre} y sus publicaciones`}
                  >
                    <span>🗑️</span>
                  </button>
                </div>
              </div>
            </article>
          );
        })}

        {aliadosFiltrados.length === 0 && (
          <div className="text-center py-12 px-4 text-stone bg-white/40 rounded-2xl border border-dashed border-stone-light">
            <p className="text-3xl mb-2">{busqueda ? "🔍" : "👥"}</p>
            <p className="text-sm font-sans font-medium text-forest">
              {busqueda
                ? `No se encontraron aliados para "${busqueda}"`
                : "No hay aliados registrados en este filtro"}
            </p>
          </div>
        )}
      </div>

      {/* Modal / Diálogo para Gestionar Plan */}
      {editandoNegocio && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-xl border border-stone-light space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-serif text-xl text-forest font-bold">
                  Gestionar Plan Comercial
                </h3>
                <p className="text-xs text-stone mt-0.5">
                  Aliado: <strong className="text-forest">{editandoNegocio.nombre}</strong>
                </p>
              </div>
              <button
                onClick={() => setEditandoNegocio(null)}
                className="text-stone hover:text-forest text-sm cursor-pointer p-1"
              >
                ✕
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200">
                {errorMsg}
              </div>
            )}

            <div className="space-y-4 font-sans text-xs">
              {/* Selección de Plan */}
              <div>
                <label className="block font-semibold text-forest mb-1.5">
                  Tipo de Plan
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(["gratis", "pro", "premium"] as PlanNegocio[]).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setNuevoPlan(p)}
                      className={[
                        "py-2 px-3 rounded-xl border text-center font-semibold capitalize transition-all cursor-pointer",
                        nuevoPlan === p
                          ? "bg-forest text-white border-forest shadow-xs"
                          : "bg-white text-stone border-stone-light hover:border-forest",
                      ].join(" ")}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              {/* Si no es gratis, elegir vigencia */}
              {nuevoPlan !== "gratis" && (
                <div>
                  <label className="block font-semibold text-forest mb-1.5">
                    Vigencia a otorgar (días a partir de hoy)
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { label: "15d", dias: 15 },
                      { label: "30d (1m)", dias: 30 },
                      { label: "60d (2m)", dias: 60 },
                      { label: "90d (3m)", dias: 90 },
                    ].map((item) => (
                      <button
                        key={item.dias}
                        type="button"
                        onClick={() => setDiasVigencia(item.dias)}
                        className={[
                          "py-2 px-2 rounded-xl border text-center text-xs transition-all cursor-pointer",
                          diasVigencia === item.dias
                            ? "bg-terra text-white border-terra font-semibold shadow-xs"
                            : "bg-white text-stone border-stone-light hover:border-terra",
                        ].join(" ")}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                  <p className="text-[11px] text-stone mt-2">
                    💡 Se registrará el plan como activo por{" "}
                    <strong>{diasVigencia} días</strong> (ideal tras confirmar pago
                    por Nequi/Daviplata o acuerdo comercial).
                  </p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-light/60">
              <button
                type="button"
                onClick={() => setEditandoNegocio(null)}
                className="px-4 py-2 rounded-xl text-xs font-sans text-stone hover:text-forest cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleGuardarPlan}
                disabled={isPending}
                className="px-5 py-2 rounded-xl text-xs font-sans font-semibold bg-forest text-cream hover:bg-forest/90 transition-all shadow-xs cursor-pointer disabled:opacity-50"
              >
                {isPending ? "Guardando..." : "Guardar Cambios"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal / Diálogo de Reporte de Impacto y Demostración de ROI */}
      {reporteNegocio && (() => {
        const est = getEstadoExpiracion(reporteNegocio);
        const cleanWa = reporteNegocio.whatsapp.replace(/\D/g, "");
        const destinoNombre =
          reporteNegocio.zonaNombre ||
          (reporteNegocio.zonaSlug === "mendihuaca" ? "Mendihuaca" : "Minca");
        const destinoUrl = `https://padonde.lat/es/${reporteNegocio.zonaSlug || "minca"}`;

        const metricas = obtenerMetricasGA4Aliado(reporteNegocio.nombre, metricasDinamicas);
        const fechaPub = reporteNegocio.created_at
          ? new Date(reporteNegocio.created_at).toLocaleDateString("es-CO", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })
          : "Julio 2026";
        const diasActivo = reporteNegocio.created_at
          ? Math.max(
              1,
              Math.ceil(
                (new Date().getTime() - new Date(reporteNegocio.created_at).getTime()) /
                  (1000 * 60 * 60 * 24)
              )
            )
          : 90;

        const visitasTexto =
          metricas.vistas > 0
            ? `• 👁️ *Visitas a tu ficha completa:* ${metricas.vistas} vistas (${metricas.usuariosUnicos} turistas únicos exploraron tus fotos y servicios)\n`
            : "";

        const idiomasTexto =
          (metricas.idiomasDetectados?.length || 0) > 0
            ? `• 🌍 *Audiencia multilingüe:* Consultada en ${(metricas.idiomasDetectados || []).join(", ")}\n`
            : "";

        const clicsTexto =
          typeof reporteNegocio.totalClics === "number" && reporteNegocio.totalClics > 0
            ? `• 📲 *Clientes directos a tu WhatsApp:* ${reporteNegocio.totalClics} prospectos${
                reporteNegocio.clics7Dias ? ` (+${reporteNegocio.clics7Dias} esta semana)` : ""
              }\n`
            : `• 📲 *Contacto WhatsApp directo:* Habilitado sin intermediarios (0% comisión)\n`;

        const textoReporte = `🌿 *Reporte de Impacto PaDónde* — *${reporteNegocio.nombre}*\n📍 *${destinoNombre}, Magdalena*\n\nHola! Te compartimos el balance de visibilidad y clientes que ha generado tu negocio en la cartelera turística:\n\n• 🗓️ *Fecha de publicación:* ${fechaPub}\n• ⏳ *Permanencia en cartelera:* ${diasActivo} días ${
          reporteNegocio.activo ? "activos en vitrina 🟢" : "(actualmente en pausa ⏸️)"
        }\n${visitasTexto}${idiomasTexto}${clicsTexto}• 🟢 *Planes y eventos en vitrina:* ${reporteNegocio.eventosActivos} vigentes (${reporteNegocio.totalEventos} en historial)\n• ⭐ *Plan comercial:* ${reporteNegocio.plan.toUpperCase()} (${est.texto})\n• 🏷️ *Categoría:* ${reporteNegocio.categoria}\n\n💡 *Balance comercial:*\nDurante estos ${diasActivo} días tu propuesta ha estado visible ante viajeros nacionales y extranjeros que buscan qué hacer en ${destinoNombre}, con *0% de comisión* por reserva.\n\nA partir del 1 de noviembre iniciamos el nuevo ciclo trimestral de visibilidad ($125.000 COP el trimestre, es decir menos de $42.000 al mes) e incluimos la digitalización interactiva de tu menú o catálogo de servicios.\n\n🔗 *Ver cartelera:* ${destinoUrl}\n\n¡Gracias por conectar a viajeros y locales con lo mejor de ${destinoNombre}! 🌿`;

        const waUrl = `https://wa.me/${cleanWa}?text=${encodeURIComponent(textoReporte)}`;

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
            <div className="bg-white rounded-3xl p-5 sm:p-6 max-w-lg w-full shadow-xl border border-stone-light space-y-4 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xl">📊</span>
                    <h3 className="font-serif text-lg sm:text-xl text-forest font-bold">
                      Reporte de Impacto y Rendimiento
                    </h3>
                  </div>
                  <p className="text-xs text-stone mt-0.5">
                    Demostración de valor para: <strong className="text-forest">{reporteNegocio.nombre}</strong>
                  </p>
                </div>
                <button
                  onClick={() => setReporteNegocio(null)}
                  className="text-stone hover:text-forest text-sm cursor-pointer p-1"
                >
                  ✕
                </button>
              </div>

              {/* Tarjeta Visual de Rendimiento (ROI Card) */}
              <div className="bg-gradient-to-br from-forest to-[#254225] text-cream p-5 rounded-2xl space-y-4 shadow-sm">
                <div className="flex items-center justify-between border-b border-cream/20 pb-3">
                  <div>
                    <span className="text-[10px] uppercase tracking-wider text-cream/70 font-sans">Aliado Oficial</span>
                    <h4 className="font-serif text-xl font-bold text-cream">{reporteNegocio.nombre}</h4>
                  </div>
                  <span className="text-xs bg-terra text-white px-2.5 py-0.5 rounded-full font-semibold uppercase">
                    Plan {reporteNegocio.plan}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  {/* Caja 1: Visitas GA4 */}
                  <div className="p-2.5 bg-white/10 rounded-xl">
                    <span className="text-[10px] text-cream/80 block">Visitas Reales</span>
                    <span className="font-serif text-2xl font-bold text-white mt-0.5 block">
                      {metricas.vistas}
                    </span>
                    <span className="text-[9px] text-emerald-300">
                      {metricas.usuariosUnicos} turistas
                    </span>
                  </div>

                  {/* Caja 2: Días Activo */}
                  <div className="p-2.5 bg-white/10 rounded-xl">
                    <span className="text-[10px] text-cream/80 block">Permanencia</span>
                    <span className="font-serif text-2xl font-bold text-white mt-0.5 block">
                      {diasActivo}d
                    </span>
                    <span className="text-[9px] text-cream/70 truncate block" title={`Desde ${fechaPub}`}>
                      Desde {fechaPub}
                    </span>
                  </div>

                  {/* Caja 3: Clientes WhatsApp */}
                  <div className="p-2.5 bg-emerald-500/20 border border-emerald-400/30 rounded-xl">
                    <span className="text-[10px] text-emerald-200 block">WhatsApp</span>
                    <span className="font-serif text-2xl font-bold text-white mt-0.5 block">
                      {reporteNegocio.totalClics || 0}
                    </span>
                    <span className="text-[9px] text-emerald-300">
                      {typeof reporteNegocio.clics7Dias === "number" && reporteNegocio.clics7Dias > 0
                        ? `+${reporteNegocio.clics7Dias} en 7d`
                        : "Directos"}
                    </span>
                  </div>

                  {/* Caja 4: Vigentes */}
                  <div className="p-2.5 bg-white/10 rounded-xl">
                    <span className="text-[10px] text-cream/70 block">Vigentes</span>
                    <span className="font-serif text-2xl font-bold text-cream mt-0.5 block">
                      {reporteNegocio.eventosActivos}
                    </span>
                    <span className="text-[9px] text-emerald-300">En cartelera</span>
                  </div>
                </div>

                <div className="text-[11px] text-cream/90 space-y-1.5 pt-1 font-sans border-t border-cream/15">
                  <div className="flex items-center justify-between">
                    <span>🗓️ <strong>Publicación:</strong></span>
                    <span className="font-medium text-white">{fechaPub} ({diasActivo} días {reporteNegocio.activo ? "activa" : "pausada"})</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>📍 <strong>Destino:</strong></span>
                    <span>{destinoNombre}, Magdalena</span>
                  </div>
                  {(metricas.idiomasDetectados?.length || 0) > 0 && (
                    <div className="flex items-center justify-between">
                      <span>🌍 <strong>Idiomas de turistas:</strong></span>
                      <span className="text-emerald-300 font-medium">{(metricas.idiomasDetectados || []).join(", ")}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span>💬 <strong>Canal de Reservas:</strong></span>
                    <span>WhatsApp verificado (+{cleanWa})</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>⏳ <strong>Estado:</strong></span>
                    <span className={reporteNegocio.activo ? "text-emerald-300 font-medium" : "text-amber-300 font-medium"}>
                      {reporteNegocio.activo ? "🟢 Activo en vitrina" : "⏸️ Pausado"} · {est.texto}
                    </span>
                  </div>
                </div>
              </div>

              {/* Botones de Envío y Copia */}
              <div className="space-y-2 pt-1 font-sans">
                <a
                  href={waUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                >
                  <span>💬</span>
                  <span>Enviar Reporte por WhatsApp al Dueño</span>
                </a>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(textoReporte);
                      setCopiadoId("modal-reporte");
                      setTimeout(() => setCopiadoId(null), 2500);
                    }}
                    className="flex-1 py-2 px-3 rounded-xl text-xs font-medium text-forest bg-white border border-stone-light hover:bg-stone-50 transition-colors cursor-pointer text-center"
                  >
                    {copiadoId === "modal-reporte" ? "✓ Reporte Copiado" : "📋 Copiar Texto para WhatsApp"}
                  </button>

                  <button
                    type="button"
                    onClick={() => setReporteNegocio(null)}
                    className="py-2 px-4 rounded-xl text-xs text-stone hover:text-forest cursor-pointer"
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Modal de Edición Completa de Aliado */}
      {aliadoParaEditar && (
        <ModalEditarAliado
          aliado={aliadoParaEditar}
          isOpen={true}
          onClose={() => setAliadoParaEditar(null)}
        />
      )}

      {/* Modal de Eventos y Publicaciones del Aliado */}
      {aliadoParaVerEventos && (
        <ModalEventosAliado
          aliado={aliadoParaVerEventos}
          isOpen={true}
          onClose={() => setAliadoParaVerEventos(null)}
          negociosList={negociosList}
        />
      )}

      {/* Modal de Reconfirmación para Eliminar Aliado */}
      {aliadoAEliminar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150 font-sans">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-stone-light space-y-4 animate-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-2xl mx-auto">
              🗑️
            </div>
            <div className="text-center space-y-1">
              <h3 className="font-serif text-lg font-bold text-forest">
                ¿Eliminar {aliadoAEliminar.nombre}?
              </h3>
              <p className="text-xs text-stone leading-relaxed">
                Esta acción es irreversible. Se eliminará el perfil de este aliado y sus{" "}
                <strong>{aliadoAEliminar.totalEventos} publicaciones</strong> asociadas en la cartelera.
              </p>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setAliadoAEliminar(null)}
                disabled={isPending}
                className="flex-1 py-2.5 rounded-xl border border-stone-light text-stone hover:text-forest text-xs font-medium cursor-pointer transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  startTransition(async () => {
                    const res = await eliminarAliadoAdminAction(aliadoAEliminar.id);
                    if (!res.success) {
                      alert(res.error || "No se pudo eliminar el aliado.");
                    } else {
                      setAliadoAEliminar(null);
                      router.refresh();
                    }
                  });
                }}
                disabled={isPending}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer text-center"
              >
                {isPending ? "Eliminando..." : "Sí, eliminar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
