"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { Link, useRouter } from "@/i18n/routing";
import {
  formatFecha,
  formatHora,
  formatPrecio,
  getEtiquetaHorario,
} from "@/lib/utils";
import { toggleEventoActivoAction } from "../actions";
import { ModalEditarEvento } from "../ModalEditarEvento";
import { ModalNotificarAliado, type EventoNotificarData } from "../ModalNotificarAliado";
import type { AliadoItem } from "./AdminAliadosList";
import type { EventoAdminItem } from "../AdminEventList";

interface ModalEventosAliadoProps {
  aliado: AliadoItem;
  isOpen: boolean;
  onClose: () => void;
  negociosList: { id: string; nombre: string }[];
}

export function ModalEventosAliado({
  aliado,
  isOpen,
  onClose,
  negociosList,
}: ModalEventosAliadoProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [eventoParaEditar, setEventoParaEditar] = useState<EventoAdminItem | null>(null);
  const [eventoParaNotificar, setEventoParaNotificar] = useState<EventoNotificarData | null>(null);

  if (!isOpen) return null;

  const eventos = aliado.eventos || [];

  const handleToggleEvento = (eventoId: string, estadoActual: boolean) => {
    startTransition(async () => {
      const res = await toggleEventoActivoAction(eventoId, !estadoActual);
      if (!res.success) {
        alert(res.error || "No se pudo cambiar el estado de la publicación.");
      } else {
        router.refresh();
      }
    });
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150">
        <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-stone-light/80 my-8 overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col max-h-[92vh]">
          {/* Header */}
          <div className="p-4 sm:p-6 border-b border-stone-light/70 bg-stone-light/20 flex items-center justify-between shrink-0">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl">🎪</span>
                <h2 className="font-serif text-lg sm:text-xl font-bold text-forest">
                  Publicaciones de {aliado.nombre}
                </h2>
              </div>
              <p className="text-xs text-stone font-sans mt-0.5 flex items-center gap-2 flex-wrap">
                <span className="font-medium text-forest">{aliado.categoria}</span>
                <span>·</span>
                <span>
                  <strong>{aliado.eventosActivos}</strong> vigentes ({eventos.length} total)
                </span>
                <span>·</span>
                <span className={aliado.activo ? "text-emerald-700 font-medium" : "text-amber-700 font-medium"}>
                  {aliado.activo ? "🟢 Aliado Activo" : "⏸️ Aliado Pausado"}
                </span>
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-stone-light/40 hover:bg-stone-light text-stone hover:text-forest flex items-center justify-center text-sm transition-all cursor-pointer"
            >
              ✕
            </button>
          </div>

          {/* Lista de Eventos */}
          <div className="p-4 sm:p-6 overflow-y-auto space-y-3 flex-1 font-sans">
            {eventos.length === 0 ? (
              <div className="text-center py-12 px-4 rounded-2xl bg-stone-50 border border-dashed border-stone-light space-y-3">
                <p className="text-3xl">🌿</p>
                <p className="font-serif text-base text-forest font-semibold">
                  Aún no hay publicaciones para este aliado
                </p>
                <p className="text-xs text-stone max-w-xs mx-auto">
                  Puedes registrar su primer evento o tour ahora mismo con sus datos precargados.
                </p>
                <Link
                  href={`/admin/nuevo?negocio=${aliado.id}`}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-forest text-cream text-xs font-semibold shadow-xs hover:bg-forest/90 transition-all cursor-pointer"
                >
                  <span>➕</span>
                  <span>Publicar Primer Evento</span>
                </Link>
              </div>
            ) : (
              eventos.map((ev) => {
                const precioTexto = formatPrecio(
                  ev.precio,
                  (ev.precio_moneda as "COP" | "USD") || "COP"
                );

                const horarioBadge = getEtiquetaHorario(ev);

                return (
                  <article
                    key={ev.id}
                    className={[
                      "p-3.5 sm:p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3",
                      ev.activo
                        ? "bg-white border-stone-light/80 shadow-2xs hover:border-stone"
                        : "bg-stone-50 border-dashed border-stone-300 opacity-80",
                    ].join(" ")}
                  >
                    {/* Info del evento con miniatura */}
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      {ev.imagen_url ? (
                        <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden bg-stone-100 shrink-0 border border-stone-light/50">
                          <Image
                            src={ev.imagen_url}
                            alt={ev.titulo}
                            fill
                            className="object-cover"
                            sizes="64px"
                          />
                        </div>
                      ) : (
                        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-stone-light/30 border border-stone-light/50 flex items-center justify-center text-xl shrink-0">
                          🌿
                        </div>
                      )}

                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-serif text-sm sm:text-base text-forest font-bold truncate">
                            {ev.titulo}
                          </h4>
                          {ev.destacado && (
                            <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded-full font-semibold">
                              ⭐ Destacado
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 text-[11px] text-stone flex-wrap">
                          <span className="font-medium text-forest">{horarioBadge}</span>
                          <span>·</span>
                          <span className="font-medium text-terra">{precioTexto}</span>
                          <span>·</span>
                          <span className="capitalize text-stone/80">🏷️ {ev.tipo}</span>
                        </div>
                      </div>
                    </div>

                    {/* Acciones del evento */}
                    <div className="flex items-center gap-2 shrink-0 pt-2 sm:pt-0 border-t border-stone-light/50 sm:border-0 justify-end">
                      {/* Switch Activo / Pausado */}
                      <button
                        type="button"
                        onClick={() => handleToggleEvento(ev.id, ev.activo)}
                        disabled={isPending}
                        title={ev.activo ? "Clic para pausar esta publicación" : "Clic para activar"}
                        className={[
                          "text-[10px] px-2.5 py-1 rounded-xl font-semibold border flex items-center gap-1 transition-all cursor-pointer shadow-2xs active:scale-95",
                          ev.activo
                            ? "bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100"
                            : "bg-stone-100 text-stone-600 border-stone-300 hover:bg-stone-200",
                        ].join(" ")}
                      >
                        <span>{ev.activo ? "🟢 Activo" : "⏸️ Pausado"}</span>
                      </button>

                      {/* Botón Notificar al Aliado por WhatsApp */}
                      {aliado.whatsapp && (
                        <button
                          type="button"
                          onClick={() =>
                            setEventoParaNotificar({
                              id: ev.id,
                              titulo: ev.titulo,
                              negocioNombre: aliado.nombre,
                              whatsapp: aliado.whatsapp,
                            })
                          }
                          className="px-2.5 py-1 rounded-xl text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-300 hover:bg-emerald-100 transition-colors cursor-pointer flex items-center gap-1 shadow-2xs active:scale-95"
                          title="Enviar mensaje de cortesía y revisión al WhatsApp del aliado"
                        >
                          <span>📲</span>
                          <span>Notificar</span>
                        </button>
                      )}

                      {/* Botón Editar Evento */}
                      <button
                        type="button"
                        onClick={() => {
                          setEventoParaEditar({
                            id: ev.id,
                            titulo: ev.titulo,
                            tipo: ev.tipo,
                            precio: ev.precio,
                            precio_moneda: ev.precio_moneda,
                            fecha_inicio: ev.fecha_inicio,
                            fecha_fin: ev.fecha_fin,
                            destacado: ev.destacado,
                            activo: ev.activo,
                            descripcion: ev.descripcion,
                            imagen_url: ev.imagen_url,
                            negocio_id: aliado.id,
                            negocio: {
                              id: aliado.id,
                              nombre: aliado.nombre,
                              whatsapp: aliado.whatsapp,
                            },
                          });
                        }}
                        className="px-2.5 py-1 rounded-xl text-xs font-semibold text-forest bg-white border border-stone-light hover:bg-stone-50 transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
                        title="Editar fecha, horarios o contenido de este evento"
                      >
                        <span>✏️</span>
                        <span>Editar</span>
                      </button>

                      {/* Enlace directo para ver en la web */}
                      <a
                        href={`/es/minca/${ev.id}`}
                        target="_blank"
                        rel="noreferrer"
                        className="w-7 h-7 rounded-xl bg-white/80 border border-stone-light hover:bg-white text-stone hover:text-forest flex items-center justify-center text-xs transition-colors"
                        title="Ver cómo lo ve el turista en la web"
                      >
                        ↗
                      </a>
                    </div>
                  </article>
                );
              })
            )}
          </div>

          {/* Footer Bar */}
          <div className="p-3.5 sm:p-5 border-t border-stone-light/70 bg-stone-light/20 flex flex-col sm:flex-row items-center justify-between gap-2.5 shrink-0 font-sans text-xs">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Link
                href={`/admin/nuevo?negocio=${aliado.id}`}
                className="flex-1 sm:flex-initial px-3.5 py-2 rounded-xl bg-forest text-cream font-semibold shadow-xs hover:bg-forest/90 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>➕</span>
                <span>Publicar Nuevo Evento</span>
              </Link>

              <Link
                href={`/admin?busqueda=${encodeURIComponent(aliado.nombre)}`}
                className="flex-1 sm:flex-initial px-3 py-2 rounded-xl bg-white border border-stone-light text-forest font-medium hover:bg-stone-50 transition-colors flex items-center justify-center gap-1"
                title="Filtrar en la tabla general de eventos"
              >
                <span>🔍</span>
                <span>Panel General</span>
              </Link>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-4 py-2 rounded-xl text-stone hover:text-forest font-medium cursor-pointer text-center"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>

      {/* Modal de Edición de Evento si el usuario hace clic en Editar */}
      {eventoParaEditar && (
        <ModalEditarEvento
          evento={eventoParaEditar}
          negocios={negociosList}
          onClose={() => setEventoParaEditar(null)}
          onSaved={() => {
            setEventoParaEditar(null);
            router.refresh();
          }}
          onDeleted={() => {
            setEventoParaEditar(null);
            router.refresh();
          }}
        />
      )}

      {/* Modal para Notificar al Aliado por WhatsApp */}
      <ModalNotificarAliado
        evento={eventoParaNotificar}
        isOpen={Boolean(eventoParaNotificar)}
        onClose={() => setEventoParaNotificar(null)}
      />
    </>
  );
}
