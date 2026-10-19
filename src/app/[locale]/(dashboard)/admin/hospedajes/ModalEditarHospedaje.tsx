"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/routing";
import { guardarHospedajeAction } from "../actions";
import { uploadEventImage } from "@/lib/supabase/storage";
import type { BadgeHabitacion } from "@/lib/types";

interface ModalEditarHospedajeProps {
  hospedaje?: any | null;
  zonas: Array<{ id: string; nombre: string; slug: string }>;
  onClose: () => void;
}

const BADGES_DISPONIBLES: BadgeHabitacion[] = [
  { icono: "🚿", texto: "Baño privado" },
  { icono: "🚿", texto: "Baño compartido" },
  { icono: "🍳", texto: "Desayuno incluido" },
  { icono: "🌿", texto: "Vista a la montaña" },
  { icono: "❄️", texto: "Aire acondicionado" },
  { icono: "🌀", texto: "Ventilador" },
  { icono: "📶", texto: "Wi-Fi rápido" },
  { icono: "🔒", texto: "Locker individual" },
  { icono: "🌄", texto: "Balcón privado" },
];

export function ModalEditarHospedaje({
  hospedaje,
  zonas,
  onClose,
}: ModalEditarHospedajeProps) {
  const router = useRouter();
  const isEdicion = Boolean(hospedaje?.id);

  // Estados Datos Generales
  const [nombreNegocio, setNombreNegocio] = useState(hospedaje?.negocio?.nombre || "");
  const [whatsapp, setWhatsapp] = useState(hospedaje?.negocio?.whatsapp || "");
  const [instagram, setInstagram] = useState(hospedaje?.negocio?.instagram || "");
  const [titulo, setTitulo] = useState(hospedaje?.titulo || "");
  const [descripcion, setDescripcion] = useState(hospedaje?.descripcion || "");
  const [zonaSlug, setZonaSlug] = useState(hospedaje?.zonas?.slug || zonas[0]?.slug || "minca");
  const [imagenUrl, setImagenUrl] = useState(hospedaje?.imagen_url || "");
  const [destacado, setDestacado] = useState(Boolean(hospedaje?.destacado));

  // Estados Google Rating
  const [ratingGoogle, setRatingGoogle] = useState(
    hospedaje?.metadata_hospedaje?.google_reputacion?.rating?.toString() || ""
  );
  const [reviewsGoogle, setReviewsGoogle] = useState(
    hospedaje?.metadata_hospedaje?.google_reputacion?.total_reviews?.toString() || ""
  );
  const [mapsUrl, setMapsUrl] = useState(
    hospedaje?.metadata_hospedaje?.google_reputacion?.maps_url || ""
  );

  // Estados Habitaciones
  const [habitaciones, setHabitaciones] = useState<any[]>(
    hospedaje?.metadata_hospedaje?.habitaciones || [
      {
        id: "hab-1",
        titulo: "Habitación Privada",
        descripcion: "",
        precio_noche_cop: 120000,
        capacidad_max: 2,
        fotos: [],
        badges: [{ icono: "🚿", texto: "Baño privado" }, { icono: "🍳", texto: "Desayuno incluido" }],
      },
    ]
  );

  const [isSubiendoFoto, setIsSubiendoFoto] = useState(false);
  const [isGuardando, setIsGuardando] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Manejo de Habitaciones dinámicas
  const agregarHabitacion = () => {
    setHabitaciones((prev) => [
      ...prev,
      {
        id: `hab-${Date.now()}`,
        titulo: `Habitación ${prev.length + 1}`,
        descripcion: "",
        precio_noche_cop: 90000,
        capacidad_max: 2,
        fotos: [],
        badges: [{ icono: "🚿", texto: "Baño privado" }],
      },
    ]);
  };

  const eliminarHabitacion = (index: number) => {
    setHabitaciones((prev) => prev.filter((_, i) => i !== index));
  };

  const actualizarHabitacion = (index: number, campo: string, valor: any) => {
    setHabitaciones((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [campo]: valor };
      return copy;
    });
  };

  const toggleBadge = (indexHab: number, badge: BadgeHabitacion) => {
    setHabitaciones((prev) => {
      const copy = [...prev];
      const badgesActuales = copy[indexHab].badges || [];
      const existe = badgesActuales.some((b: any) => b.texto === badge.texto);

      if (existe) {
        copy[indexHab].badges = badgesActuales.filter((b: any) => b.texto !== badge.texto);
      } else {
        copy[indexHab].badges = [...badgesActuales, badge];
      }
      return copy;
    });
  };

  // Subida de imagen de portada
  const handleUploadPortada = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsSubiendoFoto(true);
    try {
      const url = await uploadEventImage(file);
      if (url) setImagenUrl(url);
    } catch {
      setErrorMsg("Error al subir imagen de portada");
    } finally {
      setIsSubiendoFoto(false);
    }
  };

  // Subida de fotos para habitaciones
  const handleUploadFotoHabitacion = async (
    indexHab: number,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsSubiendoFoto(true);
    try {
      const urls: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const url = await uploadEventImage(files[i]);
        if (url) urls.push(url);
      }

      setHabitaciones((prev) => {
        const copy = [...prev];
        const fotosActuales = copy[indexHab].fotos || [];
        copy[indexHab].fotos = [...fotosActuales, ...urls];
        return copy;
      });
    } catch {
      setErrorMsg("Error al subir fotos de la habitación");
    } finally {
      setIsSubiendoFoto(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsGuardando(true);

    try {
      const metadataHospedaje = {
        check_in_hora: "15:00",
        check_out_hora: "11:00",
        google_reputacion:
          ratingGoogle && reviewsGoogle && mapsUrl
            ? {
                rating: parseFloat(ratingGoogle),
                total_reviews: parseInt(reviewsGoogle, 10),
                maps_url: mapsUrl.trim(),
              }
            : undefined,
        habitaciones: habitaciones.map((h) => ({
          ...h,
          precio_noche_cop: Number(h.precio_noche_cop),
          capacidad_max: Number(h.capacidad_max),
        })),
      };

      const res = await guardarHospedajeAction({
        id: hospedaje?.id,
        nombreNegocio,
        whatsapp,
        instagram,
        titulo,
        descripcion,
        zonaSlug,
        imagenUrl,
        destacado,
        metadataHospedaje,
      });

      if (!res.success) {
        setErrorMsg(res.error || "Ocurrió un error al guardar");
        setIsGuardando(false);
        return;
      }

      router.refresh();
      onClose();
    } catch (err: any) {
      setErrorMsg(err?.message || "Error al procesar el formulario");
      setIsGuardando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
      <div className="w-full max-w-2xl bg-cream text-forest rounded-3xl p-5 sm:p-7 shadow-2xl border border-stone-light/80 my-8 space-y-6 max-h-[90vh] overflow-y-auto">
        {/* Encabezado Modal */}
        <div className="flex items-center justify-between border-b border-stone-light/60 pb-3">
          <div>
            <h2 className="font-serif text-xl sm:text-2xl font-bold text-forest">
              {isEdicion ? "✏️ Editar Hospedaje y Tarifas" : "🏡 Registrar Nuevo Hospedaje"}
            </h2>
            <p className="font-sans text-xs text-stone mt-0.5">
              Configura la información visible y las habitaciones para el pre-cotizador
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-stone-light/40 hover:bg-stone-light text-stone hover:text-forest flex items-center justify-center text-sm transition-colors"
          >
            ✕
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 bg-red-100 border border-red-200 text-red-700 text-xs rounded-xl font-sans">
            ⚠️ {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* SECCIÓN 1: DATOS GENERALES */}
          <div className="space-y-4 bg-white/70 p-4 sm:p-5 rounded-2xl border border-stone-light/60">
            <h3 className="font-serif text-sm font-bold text-forest flex items-center gap-1.5">
              <span>📍</span> 1. Información General del Alojamiento
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-sans text-xs">
              <div>
                <label className="block text-stone font-medium mb-1">
                  Nombre del Hostal / Eco-Lodge *
                </label>
                <input
                  type="text"
                  required
                  value={nombreNegocio}
                  onChange={(e) => setNombreNegocio(e.target.value)}
                  placeholder="Ej: Hostal La Cumbre Minca"
                  className="w-full bg-cream/70 border border-stone-light rounded-xl px-3 py-2 text-forest focus:outline-none focus:border-forest"
                />
              </div>

              <div>
                <label className="block text-stone font-medium mb-1">
                  WhatsApp para Reservas *
                </label>
                <input
                  type="text"
                  required
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  placeholder="573001234567"
                  className="w-full bg-cream/70 border border-stone-light rounded-xl px-3 py-2 text-forest focus:outline-none focus:border-forest"
                />
              </div>

              <div>
                <label className="block text-stone font-medium mb-1">Zona</label>
                <select
                  value={zonaSlug}
                  onChange={(e) => setZonaSlug(e.target.value)}
                  className="w-full bg-cream/70 border border-stone-light rounded-xl px-3 py-2 text-forest focus:outline-none focus:border-forest"
                >
                  {zonas.map((z) => (
                    <option key={z.slug} value={z.slug}>
                      {z.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-stone font-medium mb-1">
                  Instagram (opcional)
                </label>
                <input
                  type="text"
                  value={instagram}
                  onChange={(e) => setInstagram(e.target.value)}
                  placeholder="@hostal.minca"
                  className="w-full bg-cream/70 border border-stone-light rounded-xl px-3 py-2 text-forest focus:outline-none focus:border-forest"
                />
              </div>
            </div>

            <div className="font-sans text-xs space-y-3">
              <div>
                <label className="block text-stone font-medium mb-1">
                  Título de la Ficha Turística *
                </label>
                <input
                  type="text"
                  required
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  placeholder="Ej: Cabañas Panorámicas & Eco-Habitaciones en Minca"
                  className="w-full bg-cream/70 border border-stone-light rounded-xl px-3 py-2 text-forest focus:outline-none focus:border-forest"
                />
              </div>

              <div>
                <label className="block text-stone font-medium mb-1">
                  Descripción del Hospedaje *
                </label>
                <textarea
                  required
                  rows={3}
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  placeholder="Describe la experiencia, vista, clima y atractivos del lugar..."
                  className="w-full bg-cream/70 border border-stone-light rounded-xl px-3 py-2 text-forest focus:outline-none focus:border-forest"
                />
              </div>

              <div>
                <label className="block text-stone font-medium mb-1">
                  Foto de Portada Principal
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleUploadPortada}
                    className="text-xs font-sans text-stone"
                  />
                  {imagenUrl && (
                    <span className="text-green-600 font-medium text-[11px]">
                      ✓ Foto cargada
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* SECCIÓN 2: GOOGLE REVIEWS (OPCIONAL) */}
          <div className="space-y-3 bg-white/70 p-4 sm:p-5 rounded-2xl border border-stone-light/60 font-sans text-xs">
            <h3 className="font-serif text-sm font-bold text-forest flex items-center gap-1.5">
              <span>⭐</span> 2. Reputación de Google Maps (Opcional)
            </h3>
            <p className="text-stone text-[11px]">
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
                  className="w-full bg-cream/70 border border-stone-light rounded-xl px-3 py-2 text-forest focus:outline-none focus:border-forest"
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
                  className="w-full bg-cream/70 border border-stone-light rounded-xl px-3 py-2 text-forest focus:outline-none focus:border-forest"
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
                  className="w-full bg-cream/70 border border-stone-light rounded-xl px-3 py-2 text-forest focus:outline-none focus:border-forest"
                />
              </div>
            </div>
          </div>

          {/* SECCIÓN 3: HABITACIONES Y TARIFAS */}
          <div className="space-y-4 bg-white/70 p-4 sm:p-5 rounded-2xl border border-stone-light/60 font-sans text-xs">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-serif text-sm font-bold text-forest flex items-center gap-1.5">
                  <span>🛏️</span> 3. Habitaciones y Tarifas
                </h3>
                <p className="text-stone text-[11px] mt-0.5">
                  Estas opciones alimentan la calculadora interactiva de reservas
                </p>
              </div>

              <button
                type="button"
                onClick={agregarHabitacion}
                className="px-3 py-1.5 bg-forest/10 hover:bg-forest text-forest hover:text-cream rounded-xl font-medium transition-colors"
              >
                + Agregar Habitación
              </button>
            </div>

            <div className="space-y-4">
              {habitaciones.map((hab, index) => (
                <div
                  key={hab.id || index}
                  className="p-4 rounded-2xl bg-cream/50 border border-stone-light/70 space-y-3"
                >
                  <div className="flex items-center justify-between border-b border-stone-light/40 pb-2">
                    <span className="font-serif font-bold text-forest">
                      Habitación #{index + 1}
                    </span>
                    {habitaciones.length > 1 && (
                      <button
                        type="button"
                        onClick={() => eliminarHabitacion(index)}
                        className="text-red-500 hover:text-red-700 text-[11px] underline"
                      >
                        Eliminar
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2">
                      <label className="block text-stone font-medium mb-1">
                        Nombre de la Habitación
                      </label>
                      <input
                        type="text"
                        required
                        value={hab.titulo}
                        onChange={(e) =>
                          actualizarHabitacion(index, "titulo", e.target.value)
                        }
                        placeholder="Ej: Cabaña Vista Sierra"
                        className="w-full bg-white border border-stone-light rounded-xl px-3 py-2 text-forest focus:outline-none focus:border-forest"
                      />
                    </div>

                    <div>
                      <label className="block text-stone font-medium mb-1">
                        Precio / noche (COP)
                      </label>
                      <input
                        type="number"
                        required
                        value={hab.precio_noche_cop}
                        onChange={(e) =>
                          actualizarHabitacion(index, "precio_noche_cop", e.target.value)
                        }
                        placeholder="120000"
                        className="w-full bg-white border border-stone-light rounded-xl px-3 py-2 text-forest focus:outline-none focus:border-forest"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-stone font-medium mb-1">
                        Capacidad Máxima (personas)
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="20"
                        value={hab.capacidad_max}
                        onChange={(e) =>
                          actualizarHabitacion(index, "capacidad_max", e.target.value)
                        }
                        className="w-full bg-white border border-stone-light rounded-xl px-3 py-2 text-forest focus:outline-none focus:border-forest"
                      />
                    </div>

                    <div>
                      <label className="block text-stone font-medium mb-1">
                        Fotos de la Habitación
                      </label>
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={(e) => handleUploadFotoHabitacion(index, e)}
                        className="text-xs text-stone"
                      />
                      {hab.fotos?.length > 0 && (
                        <p className="text-[11px] text-green-700 mt-1">
                          ✓ {hab.fotos.length} {hab.fotos.length === 1 ? "foto" : "fotos"} añadidas
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Badges tipo chip seleccionables */}
                  <div>
                    <label className="block text-stone font-medium mb-1.5">
                      Comodidades / Badges (toca para encender):
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {BADGES_DISPONIBLES.map((b) => {
                        const activo = hab.badges?.some(
                          (item: any) => item.texto === b.texto
                        );
                        return (
                          <button
                            type="button"
                            key={b.texto}
                            onClick={() => toggleBadge(index, b)}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-sans transition-all flex items-center gap-1 border ${
                              activo
                                ? "bg-forest text-cream border-forest shadow-2xs"
                                : "bg-white text-stone border-stone-light hover:border-forest/50"
                            }`}
                          >
                            <span>{b.icono}</span>
                            <span>{b.texto}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Botones de Acción */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-stone-light/60">
            <button
              type="button"
              onClick={onClose}
              disabled={isGuardando}
              className="px-4 py-2.5 rounded-xl border border-stone-light font-sans text-xs text-stone hover:text-forest transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isGuardando || isSubiendoFoto}
              className="px-6 py-2.5 rounded-xl bg-forest text-cream font-sans text-xs font-semibold hover:bg-forest-dark active:scale-95 transition-all shadow-md disabled:opacity-50"
            >
              {isGuardando
                ? "Guardando..."
                : isSubiendoFoto
                ? "Subiendo fotos..."
                : isEdicion
                ? "Guardar Cambios"
                : "Publicar Hospedaje en Vivo"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
