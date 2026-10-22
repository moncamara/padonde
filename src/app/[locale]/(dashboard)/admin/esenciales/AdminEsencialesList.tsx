"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { CategoriaServicioEsencial, ServicioEsencial } from "@/lib/types";
import { ModalEditarEsencial } from "./ModalEditarEsencial";
import { ModalNotificarAlianza } from "./ModalNotificarAlianza";
import {
  toggleActivoServicioEsencialAction,
  toggleBotonWhatsappServicioEsencialAction,
  eliminarServicioEsencialAction,
} from "../actions";

interface AdminEsencialesListProps {
  serviciosIniciales: ServicioEsencial[];
  zonas: Array<{ id: string; nombre: string; slug: string }>;
}

const CATEGORIA_ICONS: Record<string, string> = {
  efectivo: "🏧",
  transporte: "🛵",
  salud: "💊",
  comercio: "🛍️",
  general: "ℹ️",
};

export function AdminEsencialesList({
  serviciosIniciales,
  zonas,
}: AdminEsencialesListProps) {
  const router = useRouter();
  const [servicios, setServicios] =
    useState<ServicioEsencial[]>(serviciosIniciales);
  const [servicioEditando, setServicioEditando] =
    useState<ServicioEsencial | null>(null);
  const [servicioNotificando, setServicioNotificando] =
    useState<ServicioEsencial | null>(null);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [filtroCategoria, setFiltroCategoria] = useState<string>("todas");
  const [filtroZona, setFiltroZona] = useState<string>("todas");
  const [isPending, startTransition] = useTransition();

  const handleToggleActivo = (servicio: ServicioEsencial) => {
    const nuevoEstado = !servicio.activo;

    // Optimistic UI update
    setServicios((prev) =>
      prev.map((s) => (s.id === servicio.id ? { ...s, activo: nuevoEstado } : s))
    );

    startTransition(async () => {
      const zonaSlug =
        servicio.zona_id === "zona-mendihuaca" ? "mendihuaca" : "minca";
      const res = await toggleActivoServicioEsencialAction(
        servicio.id,
        nuevoEstado,
        zonaSlug
      );
      if (!res.success) {
        // Revertir si falla
        setServicios((prev) =>
          prev.map((s) =>
            s.id === servicio.id ? { ...s, activo: !nuevoEstado } : s
          )
        );
        alert("No se pudo actualizar el estado: " + res.error);
      }
    });
  };

  const handleToggleWhatsapp = (servicio: ServicioEsencial) => {
    const nuevoEstado = !(servicio.boton_whatsapp_activo !== false);

    // Optimistic UI update
    setServicios((prev) =>
      prev.map((s) =>
        s.id === servicio.id
          ? { ...s, boton_whatsapp_activo: nuevoEstado }
          : s
      )
    );

    startTransition(async () => {
      const zonaSlug =
        servicio.zona_id === "zona-mendihuaca" ? "mendihuaca" : "minca";
      const res = await toggleBotonWhatsappServicioEsencialAction(
        servicio.id,
        nuevoEstado,
        zonaSlug
      );
      if (!res.success) {
        // Revertir si falla
        setServicios((prev) =>
          prev.map((s) =>
            s.id === servicio.id
              ? { ...s, boton_whatsapp_activo: !nuevoEstado }
              : s
          )
        );
        alert("No se pudo actualizar la visibilidad de WhatsApp: " + res.error);
      }
    });
  };

  const handleEliminar = (servicio: ServicioEsencial) => {
    const confirmar = confirm(
      `¿Estás seguro de que deseas eliminar permanentemente a "${servicio.nombre_comercial}"?`
    );
    if (!confirmar) return;

    // Optimistic UI update
    setServicios((prev) => prev.filter((s) => s.id !== servicio.id));

    startTransition(async () => {
      const zonaSlug =
        servicio.zona_id === "zona-mendihuaca" ? "mendihuaca" : "minca";
      const res = await eliminarServicioEsencialAction(servicio.id, zonaSlug);
      if (!res.success) {
        // Revertir
        setServicios((prev) => [...prev, servicio]);
        alert("No se pudo eliminar el servicio: " + res.error);
      } else {
        router.refresh();
      }
    });
  };

  const serviciosFiltrados = servicios.filter((s) => {
    const pasaCat =
      filtroCategoria === "todas" || s.categoria === filtroCategoria;
    const pasaZona =
      filtroZona === "todas" ||
      (filtroZona === "minca" && s.zona_id !== "zona-mendihuaca") ||
      (filtroZona === "mendihuaca" && s.zona_id === "zona-mendihuaca");
    return pasaCat && pasaZona;
  });

  return (
    <div className="space-y-6">
      {/* Barra de Filtros y Botón de Crear */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white/70 p-3 sm:p-4 rounded-2xl border border-stone-light/70">
        <div className="flex flex-wrap items-center gap-2">
          {/* Filtro Zona */}
          <select
            value={filtroZona}
            onChange={(e) => setFiltroZona(e.target.value)}
            className="p-2 rounded-xl border border-stone-light bg-stone-light/10 text-forest text-xs font-medium outline-none"
          >
            <option value="todas">📍 Todas las Zonas</option>
            {zonas.map((z) => (
              <option key={z.id} value={z.slug}>
                {z.nombre}
              </option>
            ))}
          </select>

          {/* Filtro Categoría */}
          <select
            value={filtroCategoria}
            onChange={(e) => setFiltroCategoria(e.target.value)}
            className="p-2 rounded-xl border border-stone-light bg-stone-light/10 text-forest text-xs font-medium outline-none"
          >
            <option value="todas">✨ Todas las Categorías</option>
            <option value="efectivo">🏧 Efectivo & Divisas</option>
            <option value="transporte">🛵 Transporte & Motos</option>
            <option value="salud">💊 Farmacia & Salud</option>
            <option value="comercio">🛍️ Tiendas & Souvenirs</option>
            <option value="general">ℹ️ General</option>
          </select>
        </div>

        <button
          onClick={() => {
            setServicioEditando(null);
            setModalAbierto(true);
          }}
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-forest hover:bg-forest/90 text-cream font-sans text-xs font-semibold shadow-xs active:scale-95 transition-all cursor-pointer"
        >
          <span>＋</span>
          <span>Nuevo Aliado Fijo</span>
        </button>
      </div>

      {/* Lista de Servicios Esenciales */}
      {serviciosFiltrados.length === 0 ? (
        <div className="text-center py-12 px-4 rounded-3xl bg-white/50 border border-stone-light/60 text-stone">
          <p className="text-3xl mb-2">💡</p>
          <p className="font-serif text-lg text-forest font-semibold">
            No hay servicios esenciales en esta selección
          </p>
          <p className="font-sans text-xs text-stone mt-1">
            Usa el botón superior para agregar un nuevo aliado fijo (ej. Embassy Bank).
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {serviciosFiltrados.map((s) => {
            const icon = CATEGORIA_ICONS[s.categoria] || "📍";
            const cleanPhone = s.whatsapp.replace(/\D/g, "");
            const waUrl = `https://wa.me/${cleanPhone}`;

            return (
              <div
                key={s.id}
                className={[
                  "p-4 sm:p-5 rounded-3xl border bg-white shadow-2xs flex flex-col justify-between transition-all",
                  s.activo
                    ? "border-stone-light/80 hover:border-forest/40"
                    : "border-stone-light/40 opacity-60 bg-stone-light/10",
                ].join(" ")}
              >
                <div>
                  {/* Fila Superior: Categoría, Prioridad y Estado */}
                  <div className="flex items-center justify-between gap-2 mb-2.5">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-lg">{icon}</span>
                      <span className="font-sans text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-forest/8 text-forest">
                        {s.categoria}
                      </span>
                      <span className="font-sans text-[10px] text-stone font-mono px-1.5 py-0.5 rounded-md bg-stone-light/30">
                        #{s.orden_prioridad}
                      </span>
                      {s.destacado_patrocinado && (
                        <span className="font-sans text-[10px] font-semibold px-2 py-0.5 rounded-full bg-terra/10 text-terra border border-terra/20">
                          ★ Patrocinado
                        </span>
                      )}
                      {(s.imagen_lugar_url || s.metadata_comercial?.imagenes?.length) && (
                        <span className="font-sans text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                          📷 Foto
                        </span>
                      )}
                      {s.metadata_comercial?.video_url && (
                        <span className="font-sans text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                          🎬 Reel
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      {/* Toggle Botón WhatsApp Público */}
                      <button
                        onClick={() => handleToggleWhatsapp(s)}
                        disabled={isPending}
                        className={[
                          "px-2 py-0.5 rounded-full text-[10px] font-semibold transition-all cursor-pointer border",
                          s.boton_whatsapp_activo !== false
                            ? "bg-forest/10 border-forest/30 text-forest hover:bg-forest/20"
                            : "bg-stone-light/40 border-stone-light/70 text-stone hover:bg-stone-light",
                        ].join(" ")}
                        title="Haz clic para activar o desactivar el botón de WhatsApp público (Membresía / Conversión)"
                      >
                        {s.boton_whatsapp_activo !== false ? "💬 WA ON" : "🚫 WA OFF"}
                      </button>

                      {/* Toggle Activo / Inactivo */}
                      <button
                        onClick={() => handleToggleActivo(s)}
                        disabled={isPending}
                        className={[
                          "px-2.5 py-0.5 rounded-full text-[10px] font-semibold transition-all cursor-pointer",
                          s.activo
                            ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                            : "bg-stone-light/60 text-stone hover:bg-stone-light",
                        ].join(" ")}
                        title="Haz clic para activar o desactivar del feed público"
                      >
                        {s.activo ? "🟢 Visible" : "⚪ Oculto"}
                      </button>
                    </div>
                  </div>

                  {/* Nombre y Subtítulo */}
                  <h3 className="font-serif text-lg font-bold text-forest leading-tight">
                    {s.nombre_comercial}
                  </h3>
                  <p className="font-sans text-xs text-stone mt-1 leading-snug line-clamp-2">
                    {s.subtitulo}
                  </p>

                  {/* Horario y Dirección */}
                  <div className="mt-3 space-y-1 text-[11px] text-stone font-sans">
                    <p className="flex items-center gap-1.5">
                      <span>⏰</span>
                      <span>{s.horario_apertura}</span>
                    </p>
                    <p className="flex items-center gap-1.5">
                      <span>📍</span>
                      <span className="truncate">{s.direccion_referencia}</span>
                    </p>
                  </div>

                  {/* Modelo de Acuerdo / Barter */}
                  <div className="mt-3 pt-2.5 border-t border-stone-light/50 flex items-center justify-between text-[11px] font-sans">
                    <span className="text-stone">Acuerdo comercial:</span>
                    <span className="font-medium text-forest">
                      {s.tipo_acuerdo === "canje_afiche" && "🤝 Canje Afiche / Talker QR"}
                      {s.tipo_acuerdo === "pago_mensual" && "💎 Pago Mensual Pauta"}
                      {s.tipo_acuerdo === "cortesia" && "🎁 Cortesía / Alianza"}
                      {!s.tipo_acuerdo && "🤝 Canje Afiche QR"}
                    </span>
                  </div>

                  {/* Tags */}
                  {s.servicios_tags && s.servicios_tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2.5">
                      {s.servicios_tags.map((t, idx) => (
                        <span
                          key={idx}
                          className="text-[10px] px-2 py-0.5 rounded-md bg-stone-light/30 text-forest font-medium"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Acciones de Tarjeta */}
                <div className="mt-4 pt-3 border-t border-stone-light/60 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <a
                      href={waUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs flex items-center gap-1 font-sans"
                      title="Abrir chat en WhatsApp"
                    >
                      <span>💬</span>
                      <span className="text-[11px] font-medium">WhatsApp</span>
                    </a>

                    {s.google_maps_url && (
                      <a
                        href={s.google_maps_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 rounded-lg bg-stone-light/40 hover:bg-stone-light text-forest text-xs flex items-center gap-1 font-sans"
                        title="Ver en Google Maps"
                      >
                        <span>🗺️</span>
                        <span className="text-[11px] font-medium">Maps</span>
                      </a>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setServicioNotificando(s)}
                      className="px-2.5 py-1.5 rounded-xl border border-terra/30 bg-terra/5 hover:bg-terra/10 text-terra font-sans text-xs font-semibold transition-all cursor-pointer flex items-center gap-1 shadow-2xs active:scale-95"
                      title="Enviar mensaje de confirmación de alianza con enlace de PaDónde por WhatsApp"
                    >
                      <span>📲</span>
                      <span>Notificar</span>
                    </button>

                    <button
                      onClick={() => {
                        setServicioEditando(s);
                        setModalAbierto(true);
                      }}
                      className="px-3 py-1.5 rounded-xl border border-stone-light bg-stone-light/20 hover:bg-stone-light text-forest font-sans text-xs font-semibold transition-all cursor-pointer"
                    >
                      ✏️ Editar
                    </button>

                    <button
                      onClick={() => handleEliminar(s)}
                      disabled={isPending}
                      className="p-1.5 rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 text-red-600 font-sans text-xs transition-all cursor-pointer"
                      title="Eliminar este servicio esencial"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal para Editar o Crear */}
      {modalAbierto && (
        <ModalEditarEsencial
          key={servicioEditando?.id || "nuevo"}
          servicio={servicioEditando}
          isOpen={modalAbierto}
          onClose={() => {
            setModalAbierto(false);
            setServicioEditando(null);
          }}
          onSaved={(servicioGuardado) => {
            setServicios((prev) => {
              const existe = prev.some((s) => s.id === servicioGuardado.id);
              if (existe) {
                return prev.map((s) =>
                  s.id === servicioGuardado.id ? servicioGuardado : s
                );
              }
              return [...prev, servicioGuardado].sort(
                (a, b) => a.orden_prioridad - b.orden_prioridad
              );
            });
            router.refresh();
          }}
          zonas={zonas}
        />
      )}

      {/* Modal para Notificar Alianza por WhatsApp */}
      <ModalNotificarAlianza
        servicio={servicioNotificando}
        isOpen={servicioNotificando !== null}
        onClose={() => setServicioNotificando(null)}
        zonaNombre={
          zonas.find((z) =>
            servicioNotificando?.zona_id === "zona-mendihuaca"
              ? z.slug === "mendihuaca"
              : z.slug === "minca"
          )?.nombre || "Minca"
        }
      />
    </div>
  );
}
