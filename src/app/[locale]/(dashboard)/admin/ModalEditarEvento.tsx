"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Link } from "@/i18n/routing";
import Image from "next/image";
import { CATEGORIAS_EVENTOS } from "@/constants";
import {
  isoADatetimeLocalColombia,
  parseLocalColombiaAISO,
  extraerRecurrencia,
  limpiarDescripcionRecurrencia,
  inyectarRecurrencia,
  formatearDiasRecurrencia,
  getDayOfWeekColombia,
  getFechaYMDDesdeISO,
} from "@/lib/utils";
import { uploadEventImage, uploadEventVideo } from "@/lib/supabase/storage";
import { editarEventoAdminAction, eliminarEventoAdminAction } from "./actions";
import { Button } from "@/components/ui/Button";
import type { CategoriaEvento } from "@/lib/types";
import type { EventoAdminItem } from "./AdminEventList";

interface ModalEditarEventoProps {
  evento: EventoAdminItem;
  negocios: { id: string; nombre: string }[];
  onClose: () => void;
  onSaved: (eventoActualizado: Partial<EventoAdminItem>) => void;
  onDeleted: (eventoId: string) => void;
}

export function ModalEditarEvento({
  evento,
  negocios,
  onClose,
  onSaved,
  onDeleted,
}: ModalEditarEventoProps) {
  const router = useRouter();
  const [titulo, setTitulo] = useState(evento.titulo);
  const [negocioId, setNegocioId] = useState(
    evento.negocio_id || (evento.negocio as any)?.id || ""
  );
  const [tipo, setTipo] = useState<CategoriaEvento>(
    (evento.tipo as CategoriaEvento) || "comida"
  );
  const [dateTime, setDateTime] = useState(
    isoADatetimeLocalColombia(evento.fecha_inicio)
  );
  const [precio, setPrecio] = useState(
    evento.precio !== null && evento.precio !== undefined
      ? evento.precio.toString()
      : "0"
  );

  // Calificación / Reputación Google Maps (Opcional)
  const [ratingGoogle, setRatingGoogle] = useState(
    evento.metadata_hospedaje?.google_reputacion?.rating?.toString() || ""
  );
  const [reviewsGoogle, setReviewsGoogle] = useState(
    evento.metadata_hospedaje?.google_reputacion?.total_reviews?.toString() || ""
  );
  const [mapsUrl, setMapsUrl] = useState(
    evento.metadata_hospedaje?.google_reputacion?.maps_url || ""
  );

  // Recurrencia y días de la semana
  const recInicial = extraerRecurrencia(evento.descripcion);
  const diaBaseEvento = evento.fecha_inicio
    ? getDayOfWeekColombia(getFechaYMDDesdeISO(evento.fecha_inicio))
    : new Date().getDay();
  const [esRecurrente, setEsRecurrente] = useState(recInicial.esRecurrente);
  const [diasSeleccionados, setDiasSeleccionados] = useState<number[]>(
    recInicial.dias.length > 0 ? recInicial.dias : [diaBaseEvento]
  );
  const [fechaFin, setFechaFin] = useState(
    isoADatetimeLocalColombia(evento.fecha_fin)
  );
  const [guardadoExito, setGuardadoExito] = useState(false);

  // Descripción limpia (sin tags internos de recurrencia)
  const [descripcion, setDescripcion] = useState(
    limpiarDescripcionRecurrencia(evento.descripcion)
  );

  const [destacado, setDestacado] = useState(Boolean(evento.destacado));
  const [activo, setActivo] = useState(Boolean(evento.activo));

  // Manejo de imagen
  const [imagenUrl, setImagenUrl] = useState(evento.imagen_url || "");
  const [archivoFoto, setArchivoFoto] = useState<File | null>(null);
  const [previewFoto, setPreviewFoto] = useState<string | null>(
    evento.imagen_url || null
  );

  // Manejo de video / reel
  const [videoUrl, setVideoUrl] = useState(evento.video_url || "");
  const [archivoVideo, setArchivoVideo] = useState<File | null>(null);
  const [videoNombre, setVideoNombre] = useState<string | null>(null);
  const [mostrarUrlDirecta, setMostrarUrlDirecta] = useState(Boolean(evento.video_url));

  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmarEliminar, setConfirmarEliminar] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setArchivoFoto(file);
      setPreviewFoto(URL.createObjectURL(file));
    }
  }

  function handleVideoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setArchivoVideo(file);
      setVideoNombre(file.name);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!titulo.trim()) {
      setError("El título del evento es obligatorio.");
      return;
    }
    if (!dateTime) {
      setError("Debes ingresar una fecha y hora válida.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let finalImg = imagenUrl;
      if (archivoFoto) {
        const uploadedUrl = await uploadEventImage(archivoFoto);
        if (uploadedUrl) finalImg = uploadedUrl;
      }

      let finalVideo = videoUrl;
      if (archivoVideo) {
        const uploadedVideo = await uploadEventVideo(archivoVideo);
        if (uploadedVideo) finalVideo = uploadedVideo;
      }

      const descripcionFinal = esRecurrente
        ? inyectarRecurrencia(descripcion, diasSeleccionados)
        : limpiarDescripcionRecurrencia(descripcion);

      const googleReputacion =
        ratingGoogle && reviewsGoogle && mapsUrl
          ? {
              rating: parseFloat(ratingGoogle),
              total_reviews: parseInt(reviewsGoogle, 10),
              maps_url: mapsUrl.trim(),
            }
          : null;

      const res = await editarEventoAdminAction({
        eventoId: evento.id,
        titulo: titulo.trim(),
        descripcion: descripcionFinal || null,
        tipo,
        precio: parseFloat(precio) || 0,
        dateTime,
        fechaFin: fechaFin ? fechaFin : null,
        imageUrl: finalImg || undefined,
        videoUrl: finalVideo || null,
        destacado,
        activo,
        negocioId: negocioId || undefined,
        googleReputacion,
      });

      if (!res.success) {
        setError(res.error || "No se pudo actualizar el evento.");
        setLoading(false);
        return;
      }

      setGuardadoExito(true);

      const negocioSeleccionado = negocios.find((n) => n.id === negocioId);

      setTimeout(() => {
        onSaved({
          id: evento.id,
          titulo: titulo.trim(),
          descripcion: descripcionFinal || null,
          tipo,
          precio: parseFloat(precio) || 0,
          fecha_inicio: parseLocalColombiaAISO(dateTime),
          fecha_fin: fechaFin ? parseLocalColombiaAISO(fechaFin) : null,
          destacado,
          activo,
          imagen_url: finalImg,
          video_url: finalVideo || null,
          negocio_id: negocioId || evento.negocio_id,
          metadata_hospedaje: googleReputacion
            ? {
                ...(evento.metadata_hospedaje || {}),
                google_reputacion: googleReputacion,
              }
            : {
                ...(evento.metadata_hospedaje || {}),
                google_reputacion: undefined,
              },
          negocio: negocioSeleccionado
            ? {
                id: negocioSeleccionado.id,
                nombre: negocioSeleccionado.nombre,
                whatsapp: evento.negocio?.whatsapp || "",
              }
            : evento.negocio,
        });

        router.refresh();
        onClose();
      }, 700);
    } catch (err: any) {
      setError(err?.message || "Error inesperado al guardar.");
    } finally {
      setLoading(false);
    }
  }

  async function handleEliminar() {
    setDeleting(true);
    setError(null);
    try {
      const res = await eliminarEventoAdminAction(evento.id);
      if (!res.success) {
        setError(res.error || "No se pudo eliminar el evento.");
        setDeleting(false);
        return;
      }
      onDeleted(evento.id);
      onClose();
    } catch (err: any) {
      setError(err?.message || "Error inesperado al eliminar.");
      setDeleting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-stone-light/80 overflow-hidden">
        {/* Header del Modal */}
        <div className="px-5 sm:px-6 py-4 border-b border-stone-light/70 flex items-center justify-between bg-cream/50">
          <div>
            <h3 className="font-serif text-lg sm:text-xl text-forest font-semibold flex items-center gap-2">
              <span>✏️</span> Editar Evento o Experiencia
            </h3>
            <p className="text-[11px] sm:text-xs text-stone font-sans mt-0.5">
              Actualiza descripción, periodicidad, precios y fotografía del plan.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-stone-light/40 hover:bg-stone-light text-stone hover:text-forest flex items-center justify-center text-sm font-bold transition-colors"
            title="Cerrar"
          >
            ✕
          </button>
        </div>

        {/* Contenido scrolleable del formulario */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-5 sm:p-6 space-y-4 sm:space-y-5 text-left flex-1">
          {evento.tipo === "hospedaje" && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-sans text-emerald-950 shadow-2xs">
              <div className="flex items-center gap-2.5">
                <span className="text-2xl">🏡</span>
                <div>
                  <p className="font-bold text-forest">Este registro es un Hospedaje</p>
                  <p className="text-[11px] text-emerald-800">
                    Las habitaciones, fotos de cuartos y tarifas se administran en su módulo dedicado:
                  </p>
                </div>
              </div>
              <Link
                href="/admin/hospedajes"
                className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shrink-0 transition-colors shadow-xs text-center"
              >
                Ir a Hospedajes →
              </Link>
            </div>
          )}

          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 font-sans">
              ⚠️ {error}
            </div>
          )}

          {/* 1. Título */}
          <div>
            <label className="block text-xs font-semibold text-forest mb-1 font-sans">
              Título del Evento o Experiencia *
            </label>
            <input
              type="text"
              required
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-stone-light bg-stone-50/50 text-forest text-sm font-sans focus:outline-none focus:border-forest focus:bg-white transition-colors"
              placeholder="Ej: Tour Matutino de Aves, Menú del Día..."
            />
          </div>

          {/* 2. Negocio Asociado */}
          <div>
            <label className="block text-xs font-semibold text-forest mb-1 font-sans">
              Negocio / Aliado Anfitrión
            </label>
            <select
              value={negocioId}
              onChange={(e) => setNegocioId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-stone-light bg-stone-50/50 text-forest text-sm font-sans focus:outline-none focus:border-forest focus:bg-white transition-colors"
            >
              <option value="">Selecciona o cambia el negocio...</option>
              {negocios.map((n) => (
                <option key={n.id} value={n.id}>
                  {n.nombre}
                </option>
              ))}
            </select>
          </div>

          {/* 3. Categoría */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-forest font-sans">
                Categoría
              </label>
              <Link
                href="/admin/hospedajes"
                className="text-[11px] text-stone hover:text-terra font-sans transition-colors"
                title="Para gestionar cabañas o eco-lodges"
              >
                ¿Hospedaje? Ir a Hospedajes ↗
              </Link>
            </div>
            {tipo === "hospedaje" ? (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl flex items-center justify-between text-xs font-sans">
                <span className="text-amber-800">
                  🏡 Este registro es un <strong>Hospedaje</strong>.
                </span>
                <Link
                  href="/admin/hospedajes"
                  className="font-semibold text-forest hover:text-terra underline"
                >
                  Ir al módulo de Hospedajes →
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                {CATEGORIAS_EVENTOS.map((cat) => {
                  const selected = tipo === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setTipo(cat.id)}
                      className={[
                        "px-2.5 py-2 rounded-xl text-xs font-sans font-medium flex items-center justify-center gap-1.5 border transition-all cursor-pointer",
                        selected
                          ? "bg-forest text-cream border-forest shadow-xs font-semibold"
                          : "bg-white text-stone border-stone-light hover:border-forest/40 hover:text-forest",
                      ].join(" ")}
                    >
                      <span>{cat.emoji}</span>
                      <span className="truncate">{cat.label}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* 4. Fecha y Hora + Precio */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-xs font-semibold text-forest mb-1 font-sans">
                Fecha y Hora de Inicio *
              </label>
              <input
                type="datetime-local"
                required
                value={dateTime}
                onChange={(e) => setDateTime(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-light bg-stone-50/50 text-forest text-sm font-sans focus:outline-none focus:border-forest focus:bg-white transition-colors"
              />
              <span className="text-[10px] text-stone font-sans mt-0.5 block">
                Calculado en hora de Colombia (UTC-5).
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-forest mb-1 font-sans">
                Precio (COP)
              </label>
              <input
                type="number"
                min="0"
                step="1000"
                value={precio}
                onChange={(e) => setPrecio(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-light bg-stone-50/50 text-forest text-sm font-sans focus:outline-none focus:border-forest focus:bg-white transition-colors"
                placeholder="0 = Consultar"
              />
              <span className="text-[10px] text-stone font-sans mt-0.5 block">
                0 para consultar precio o sin cobro directo.
              </span>
            </div>
          </div>

          {/* 5. SECCIÓN DE RECURRENCIA (DÍAS DE REPETICIÓN) */}
          <div className="p-3.5 sm:p-4 rounded-2xl bg-amber-50/70 border border-amber-200/90 space-y-3">
            <label className="flex items-center justify-between cursor-pointer">
              <div className="flex items-center gap-2">
                <span className="text-base sm:text-lg">🔄</span>
                <div>
                  <span className="text-xs font-semibold text-forest block font-sans">
                    ¿Es una experiencia diaria o recurrente?
                  </span>
                  <span className="text-[10px] text-stone font-sans block">
                    Aparecerá en el feed de todos los días seleccionados (ej: tours diarios o menús de lunes a sábado).
                  </span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={esRecurrente}
                onChange={(e) => {
                  const checked = e.target.checked;
                  setEsRecurrente(checked);
                  if (checked && recInicial.dias.length === 0) {
                    setDiasSeleccionados([diaBaseEvento]);
                  }
                }}
                className="w-4 h-4 text-forest rounded border-stone-light focus:ring-forest shrink-0 ml-2 cursor-pointer"
              />
            </label>

            {esRecurrente && (
              <div className="pt-2 border-t border-amber-200/60 space-y-3 animate-in fade-in duration-150">
                {/* Atajos Rápidos */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] text-stone font-medium mr-1">Atajos:</span>
                  <button
                    type="button"
                    onClick={() => setDiasSeleccionados([diaBaseEvento])}
                    className="text-[10px] px-2.5 py-1 rounded-lg bg-amber-100/90 border border-amber-300 text-amber-950 font-semibold hover:bg-amber-200/90 transition-colors cursor-pointer"
                  >
                    Solo este día ({["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"][diaBaseEvento]})
                  </button>
                  <button
                    type="button"
                    onClick={() => setDiasSeleccionados([1, 2, 3, 4, 5, 6, 0])}
                    className="text-[10px] px-2.5 py-1 rounded-lg bg-white border border-amber-300 text-forest hover:bg-amber-100/60 font-medium transition-colors cursor-pointer"
                  >
                    Todos los días
                  </button>
                  <button
                    type="button"
                    onClick={() => setDiasSeleccionados([1, 2, 3, 4, 5])}
                    className="text-[10px] px-2.5 py-1 rounded-lg bg-white border border-amber-300 text-forest hover:bg-amber-100/60 font-medium transition-colors cursor-pointer"
                  >
                    Lun a Vie
                  </button>
                  <button
                    type="button"
                    onClick={() => setDiasSeleccionados([1, 2, 3, 4, 5, 6])}
                    className="text-[10px] px-2.5 py-1 rounded-lg bg-white border border-amber-300 text-forest hover:bg-amber-100/60 font-medium transition-colors cursor-pointer"
                  >
                    Lun a Sáb
                  </button>
                  <button
                    type="button"
                    onClick={() => setDiasSeleccionados([5, 6, 0])}
                    className="text-[10px] px-2.5 py-1 rounded-lg bg-white border border-amber-300 text-forest hover:bg-amber-100/60 font-medium transition-colors cursor-pointer"
                  >
                    Vie, Sáb y Dom
                  </button>
                  <button
                    type="button"
                    onClick={() => setDiasSeleccionados([6, 0])}
                    className="text-[10px] px-2.5 py-1 rounded-lg bg-white border border-amber-300 text-forest hover:bg-amber-100/60 font-medium transition-colors cursor-pointer"
                  >
                    Fines de semana
                  </button>
                </div>

                {/* Botones de Días de la semana */}
                <div>
                  <span className="block text-[11px] font-semibold text-forest mb-1.5 font-sans">
                    Días en los que aplica:
                  </span>
                  <div className="grid grid-cols-7 gap-1">
                    {[
                      { d: 1, label: "L", nombre: "Lun" },
                      { d: 2, label: "M", nombre: "Mar" },
                      { d: 3, label: "M", nombre: "Mié" },
                      { d: 4, label: "J", nombre: "Jue" },
                      { d: 5, label: "V", nombre: "Vie" },
                      { d: 6, label: "S", nombre: "Sáb" },
                      { d: 0, label: "D", nombre: "Dom" },
                    ].map((item) => {
                      const activo = diasSeleccionados.includes(item.d);
                      return (
                        <button
                          key={item.d}
                          type="button"
                          onClick={() => {
                            if (activo) {
                              if (diasSeleccionados.length > 1) {
                                setDiasSeleccionados(
                                  diasSeleccionados.filter((x) => x !== item.d)
                                );
                              }
                            } else {
                              setDiasSeleccionados([...diasSeleccionados, item.d]);
                            }
                          }}
                          className={[
                            "py-2 rounded-xl text-xs font-semibold transition-all border text-center flex flex-col items-center justify-center",
                            activo
                              ? "bg-forest text-cream border-forest shadow-2xs font-bold"
                              : "bg-white text-stone border-amber-200 hover:border-forest/40 hover:text-forest",
                          ].join(" ")}
                          title={item.nombre}
                        >
                          <span>{item.label}</span>
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-[11px] text-amber-900 font-sans mt-1.5 font-medium">
                    Programación: <strong>{formatearDiasRecurrencia(diasSeleccionados)}</strong>
                  </p>
                </div>

                {/* Vigencia / Fecha fin opcional */}
                <div>
                  <label className="block text-[11px] font-semibold text-forest mb-1 font-sans">
                    Vigente hasta (Fecha fin):
                  </label>
                  <input
                    type="datetime-local"
                    value={fechaFin}
                    onChange={(e) => setFechaFin(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-amber-300 bg-white text-forest text-xs font-sans focus:outline-none focus:border-forest"
                  />
                  <span className="text-[10px] text-stone font-sans mt-0.5 block">
                    Fecha límite en la que dejará de mostrarse en la cartelera.
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* 6. Descripción amplia (WhatsApp Paste) */}
          <div>
            <label className="block text-xs font-semibold text-forest mb-1 font-sans">
              Descripción del Plan (Pega aquí la información de WhatsApp)
            </label>
            <textarea
              rows={4}
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Escribe o pega aquí la descripción detallada del evento, qué incluye, qué llevar, cupos, etc..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-stone-light bg-stone-50/50 text-forest text-sm font-sans focus:outline-none focus:border-forest focus:bg-white transition-colors resize-y"
            />
          </div>

          {/* 7. Fotografía del Evento */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-forest font-sans">
              Fotografía de Portada
            </label>
            <div className="flex items-center gap-3">
              {previewFoto ? (
                <div className="relative w-20 h-20 rounded-xl overflow-hidden border border-stone-light shrink-0 bg-stone-100">
                  <Image
                    src={previewFoto}
                    alt="Previsualización"
                    fill
                    className="object-cover"
                  />
                </div>
              ) : (
                <div className="w-20 h-20 rounded-xl bg-stone-100 border border-dashed border-stone-light flex items-center justify-center text-xl text-stone shrink-0">
                  📷
                </div>
              )}

              <div className="space-y-1.5 flex-1 text-xs">
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleFileChange}
                  className="block w-full text-xs text-stone file:mr-2.5 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-forest/10 file:text-forest hover:file:bg-forest/20 cursor-pointer"
                />
                <p className="text-[10px] text-stone font-sans">
                  Formatos recomendados: WebP o JPG.
                </p>
              </div>
            </div>
          </div>

          {/* 8. Video / Reel Vertical (Opcional) */}
          <div className="space-y-2.5 p-3.5 rounded-2xl bg-stone-50 border border-stone-light/70">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-forest font-sans flex items-center gap-1.5">
                <span>🎬</span> Video / Reel vertical (Opcional)
              </label>
              {videoUrl && !archivoVideo && (
                <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-medium">
                  ✓ Video activo
                </span>
              )}
            </div>

            <input
              type="file"
              accept="video/mp4,video/quicktime,video/webm"
              onChange={handleVideoChange}
              className="block w-full text-xs text-stone file:mr-2.5 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-terra/10 file:text-terra hover:file:bg-terra/20 cursor-pointer"
            />

            {videoNombre ? (
              <p className="text-[11px] text-forest font-medium">
                Nuevo video seleccionado: {videoNombre}
              </p>
            ) : videoUrl ? (
              <div className="flex items-center justify-between text-xs pt-1">
                <a
                  href={videoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-terra hover:underline truncate max-w-[220px]"
                >
                  Ver video actual ↗
                </a>
                <button
                  type="button"
                  onClick={() => setVideoUrl("")}
                  className="text-red-600 hover:text-red-700 font-medium text-[11px] cursor-pointer"
                >
                  Quitar video
                </button>
              </div>
            ) : null}

            <div className="pt-1 border-t border-stone-light/50">
              {!mostrarUrlDirecta && !videoUrl ? (
                <button
                  type="button"
                  onClick={() => setMostrarUrlDirecta(true)}
                  className="text-[11px] text-stone hover:text-forest underline cursor-pointer"
                >
                  O pegar URL directa de video / reel (.mp4)
                </button>
              ) : (
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-stone font-medium">URL directa de video (MP4):</span>
                    <button
                      type="button"
                      onClick={() => setMostrarUrlDirecta(!mostrarUrlDirecta)}
                      className="text-[10px] text-stone hover:text-forest cursor-pointer"
                    >
                      {mostrarUrlDirecta ? "Ocultar" : "Mostrar"}
                    </button>
                  </div>
                  {mostrarUrlDirecta && (
                    <>
                      <input
                        type="url"
                        value={videoUrl}
                        onChange={(e) => setVideoUrl(e.target.value)}
                        placeholder="https://.../video.mp4"
                        className="w-full px-3 py-1.5 text-xs rounded-xl border border-stone-light/80 bg-white font-sans text-forest focus:outline-terra"
                      />
                      {evento.id === "6817d5de-d00a-4514-b505-fa2c10608749" && !videoUrl && (
                        <button
                          type="button"
                          onClick={() => {
                            setVideoUrl("https://gvrroyncnrnjsaldlges.supabase.co/storage/v1/object/public/eventos/videos/1792684308424-m681hcn.mp4");
                            setMostrarUrlDirecta(true);
                          }}
                          className="text-[11px] text-terra hover:underline font-medium block mt-1 cursor-pointer"
                        >
                          🌿 Restaurar video original de Jungle Joe
                        </button>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* 9. Reputación de Google Maps (Opcional) */}
          <div className="space-y-3 p-3.5 rounded-2xl bg-stone-50 border border-stone-light/70 font-sans text-xs">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-forest flex items-center gap-1.5">
                <span>⭐</span> Calificación en Google Maps (Opcional)
              </span>
              {ratingGoogle && (
                <span className="text-[10px] bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full font-medium">
                  ★ {ratingGoogle} ({reviewsGoogle || 0})
                </span>
              )}
            </div>
            <p className="text-stone text-[11px] leading-relaxed">
              Muestra las estrellas y número de opiniones en la ficha pública con enlace directo a Maps.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-stone font-medium mb-1">
                  Puntaje (ej: 4.8)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="1"
                  max="5"
                  value={ratingGoogle}
                  onChange={(e) => setRatingGoogle(e.target.value)}
                  placeholder="4.8"
                  className="w-full bg-white border border-stone-light rounded-xl px-3 py-2 text-forest focus:outline-none focus:border-forest text-xs"
                />
              </div>

              <div>
                <label className="block text-stone font-medium mb-1">
                  Número de Reseñas
                </label>
                <input
                  type="number"
                  value={reviewsGoogle}
                  onChange={(e) => setReviewsGoogle(e.target.value)}
                  placeholder="245"
                  className="w-full bg-white border border-stone-light rounded-xl px-3 py-2 text-forest focus:outline-none focus:border-forest text-xs"
                />
              </div>

              <div className="col-span-2 sm:col-span-1">
                <label className="block text-stone font-medium mb-1">
                  Enlace a Google Maps
                </label>
                <input
                  type="url"
                  value={mapsUrl}
                  onChange={(e) => setMapsUrl(e.target.value)}
                  placeholder="https://maps.app.goo.gl/..."
                  className="w-full bg-white border border-stone-light rounded-xl px-3 py-2 text-forest focus:outline-none focus:border-forest text-xs"
                />
              </div>
            </div>
          </div>

          {/* 8. Switches de Control (Destacado y Activo) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <label className="flex items-center gap-2.5 p-3 rounded-xl bg-stone-50 border border-stone-light/70 cursor-pointer hover:bg-stone-100/60 transition-colors">
              <input
                type="checkbox"
                checked={destacado}
                onChange={(e) => setDestacado(e.target.checked)}
                className="w-4 h-4 text-terra rounded border-stone-light focus:ring-terra"
              />
              <div className="text-left">
                <span className="text-xs font-medium text-forest block">⭐ Destacado</span>
                <span className="text-[10px] text-stone block">Aparece arriba en la cartelera</span>
              </div>
            </label>

            <label className="flex items-center gap-2.5 p-3 rounded-xl bg-stone-50 border border-stone-light/70 cursor-pointer hover:bg-stone-100/60 transition-colors">
              <input
                type="checkbox"
                checked={activo}
                onChange={(e) => setActivo(e.target.checked)}
                className="w-4 h-4 text-emerald-600 rounded border-stone-light focus:ring-emerald-600"
              />
              <div className="text-left">
                <span className="text-xs font-medium text-forest block">🟢 Evento Activo</span>
                <span className="text-[10px] text-stone block">Visible en la web pública</span>
              </div>
            </label>
          </div>

          {/* Zona de peligro: Eliminar evento */}
          <div className="pt-2 border-t border-stone-light/60">
            {confirmarEliminar ? (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 space-y-2">
                <p className="text-xs text-red-800 font-medium font-sans">
                  ¿Estás completamente segura de eliminar este evento?
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={deleting}
                    onClick={handleEliminar}
                    className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-medium transition-colors"
                  >
                    {deleting ? "Eliminando..." : "Sí, eliminar definitivamente"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmarEliminar(false)}
                    className="px-3 py-1.5 rounded-lg bg-white border border-stone-light text-stone text-xs hover:text-forest transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmarEliminar(true)}
                className="text-xs text-red-600 hover:text-red-700 hover:underline flex items-center gap-1 font-medium font-sans"
              >
                <span>🗑️</span> Eliminar evento
              </button>
            )}
          </div>

          {/* Footer de Acciones del Formulario */}
          <div className="pt-3 border-t border-stone-light/70 sticky bottom-0 bg-white space-y-2">
            {error && (
              <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 font-sans">
                ⚠️ {error}
              </div>
            )}
            <div className="flex items-center justify-end gap-2.5">
              <Button
                type="button"
                variant="outline"
                size="md"
                onClick={onClose}
                disabled={loading || deleting}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                size="md"
                disabled={loading || deleting || guardadoExito}
                className={`shadow-sm transition-all ${
                  guardadoExito ? "bg-emerald-600 hover:bg-emerald-700 text-white" : ""
                }`}
              >
                {guardadoExito
                  ? "✅ ¡Guardado con éxito!"
                  : loading
                  ? "Guardando cambios..."
                  : "Guardar Cambios"}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
