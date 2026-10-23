"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/routing";
import {
  guardarHospedajeAction,
  eliminarEventoAdminAction,
  importarImagenDesdeUrlAction,
  generarCopyHospedajeGeminiAction,
} from "../actions";
import { uploadEventImage } from "@/lib/supabase/storage";
import type { BadgeHabitacion } from "@/lib/types";

interface ModalEditarHospedajeProps {
  hospedaje?: any | null;
  zonas: Array<{ id: string; nombre: string; slug: string }>;
  onClose: () => void;
  onDeleted?: (id: string) => void;
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
  onDeleted,
}: ModalEditarHospedajeProps) {
  const router = useRouter();
  const isEdicion = Boolean(hospedaje?.id);

  // Estados Datos Generales (Soporta registros existentes de BD o borradores del Asistente)
  const [nombreNegocio, setNombreNegocio] = useState(
    hospedaje?.negocio?.nombre || hospedaje?.nombreNegocio || ""
  );
  const [whatsapp, setWhatsapp] = useState(
    hospedaje?.negocio?.whatsapp || hospedaje?.whatsapp || ""
  );
  const [instagram, setInstagram] = useState(
    hospedaje?.negocio?.instagram || hospedaje?.instagram || ""
  );
  const [titulo, setTitulo] = useState(hospedaje?.titulo || "");
  const [descripcion, setDescripcion] = useState(hospedaje?.descripcion || "");
  const [zonaSlug, setZonaSlug] = useState(
    hospedaje?.zonas?.slug || hospedaje?.zonaSlug || zonas[0]?.slug || "minca"
  );
  const [imagenUrl, setImagenUrl] = useState(hospedaje?.imagen_url || hospedaje?.imagenUrl || "");
  const [destacado, setDestacado] = useState(Boolean(hospedaje?.destacado));

  // Estados Google Rating
  const [ratingGoogle, setRatingGoogle] = useState(
    hospedaje?.metadata_hospedaje?.google_reputacion?.rating?.toString() ||
      hospedaje?.ratingGoogle ||
      ""
  );
  const [reviewsGoogle, setReviewsGoogle] = useState(
    hospedaje?.metadata_hospedaje?.google_reputacion?.total_reviews?.toString() ||
      hospedaje?.reviewsGoogle ||
      ""
  );
  const [mapsUrl, setMapsUrl] = useState(
    hospedaje?.metadata_hospedaje?.google_reputacion?.maps_url ||
      hospedaje?.mapsUrl ||
      ""
  );

  // Estados Habitaciones
  const [habitaciones, setHabitaciones] = useState<any[]>(
    hospedaje?.metadata_hospedaje?.habitaciones ||
      hospedaje?.habitaciones || [
        {
          id: "hab-1",
          titulo: "Habitación Privada",
          descripcion: "",
          precio_noche_cop: 120000,
          capacidad_max: 2,
          fotos: [],
          badges: [
            { icono: "🚿", texto: "Baño privado" },
            { icono: "🍳", texto: "Desayuno incluido" },
          ],
        },
      ]
  );

  const [isSubiendoFoto, setIsSubiendoFoto] = useState(false);
  const [isGuardando, setIsGuardando] = useState(false);
  const [isRegenerandoAI, setIsRegenerandoAI] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Regenerar copy de hospedaje con Gemini AI
  const handleRegenerarCopyGemini = async () => {
    setIsRegenerandoAI(true);
    try {
      const res = await generarCopyHospedajeGeminiAction({
        textoBruto: `${nombreNegocio}. ${descripcion}`,
        nombreNegocio,
        zonaSlug,
      });
      if (res.success) {
        if (res.titulo) setTitulo(res.titulo);
        if (res.descripcion) {
          let descConDestacados = res.descripcion;
          if (res.destacados && res.destacados.length > 0) {
            descConDestacados += "\n\n🌿 Destacados del lugar:\n" + res.destacados.map((d) => `• ${d}`).join("\n");
          }
          setDescripcion(descConDestacados);
        }
      } else {
        alert(res.error || "No se pudo regenerar con Gemini.");
      }
    } catch {
      alert("Error al conectar con Gemini AI.");
    } finally {
      setIsRegenerandoAI(false);
    }
  };

  // Estados de eliminación segura con 2 pasos
  const [confirmarEliminar, setConfirmarEliminar] = useState(false);
  const [isEliminando, setIsEliminando] = useState(false);
  const [errorEliminar, setErrorEliminar] = useState<string | null>(null);

  async function handleEliminar() {
    if (!hospedaje?.id) return;
    setIsEliminando(true);
    setErrorEliminar(null);
    try {
      const res = await eliminarEventoAdminAction(hospedaje.id);
      if (!res.success) {
        setErrorEliminar(res.error || "No se pudo eliminar el hospedaje.");
        setIsEliminando(false);
        return;
      }
      onDeleted?.(hospedaje.id);
      router.refresh();
      onClose();
    } catch (err: any) {
      setErrorEliminar(err?.message || "Error al eliminar el hospedaje.");
      setIsEliminando(false);
    }
  }

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

  // Eliminar una foto individual de la habitación
  const eliminarFotoHabitacion = (indexHab: number, fotoIndex: number) => {
    setHabitaciones((prev) => {
      const copy = [...prev];
      const fotosActuales = copy[indexHab].fotos || [];
      copy[indexHab].fotos = fotosActuales.filter((_: string, i: number) => i !== fotoIndex);
      return copy;
    });
  };

  // Reordenar foto para colocarla como portada (índice 0)
  const hacerFotoPortadaHabitacion = (indexHab: number, fotoIndex: number) => {
    setHabitaciones((prev) => {
      const copy = [...prev];
      const fotosActuales = [...(copy[indexHab].fotos || [])];
      if (fotoIndex > 0 && fotoIndex < fotosActuales.length) {
        const [foto] = fotosActuales.splice(fotoIndex, 1);
        fotosActuales.unshift(foto);
        copy[indexHab].fotos = fotosActuales;
      }
      return copy;
    });
  };

  // Agregar foto mediante URL externa o ruta local (admite una o varias URLs separadas por coma o salto de línea)
  const agregarFotoPorUrl = (indexHab: number, urlOrUrls: string) => {
    const urls = urlOrUrls
      .split(/[\n,]+/)
      .map((u) => u.trim())
      .filter((u) => u.length > 0);
    if (urls.length === 0) return;
    setHabitaciones((prev) => {
      const copy = [...prev];
      const fotosActuales = copy[indexHab].fotos || [];
      copy[indexHab].fotos = [...fotosActuales, ...urls];
      return copy;
    });
  };

  // Reemplazar la URL de una foto (ej: al convertir una URL externa a Supabase Storage)
  const reemplazarFotoHabitacion = (
    indexHab: number,
    fotoIndex: number,
    nuevaUrl: string
  ) => {
    setHabitaciones((prev) => {
      const copy = [...prev];
      const fotosActuales = [...(copy[indexHab].fotos || [])];
      fotosActuales[fotoIndex] = nuevaUrl;
      copy[indexHab].fotos = fotosActuales;
      return copy;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsGuardando(true);

    try {
      const metadataHospedaje = {
        check_in_hora: hospedaje?.metadata_hospedaje?.check_in_hora || "14:00",
        check_out_hora: hospedaje?.metadata_hospedaje?.check_out_hora || "11:00",
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
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-stone font-medium">
                    Descripción del Hospedaje *
                  </label>
                  <button
                    type="button"
                    disabled={isRegenerandoAI}
                    onClick={handleRegenerarCopyGemini}
                    className="text-[11px] font-bold text-purple-700 hover:text-purple-900 bg-purple-50 hover:bg-purple-100 border border-purple-200 px-2.5 py-1 rounded-xl transition-all flex items-center gap-1 cursor-pointer active:scale-95 disabled:opacity-50"
                    title="Pedir a Gemini que redacte una descripción sensorial y envolvente"
                  >
                    <span>{isRegenerandoAI ? "⏳" : "🪄"}</span>
                    <span>{isRegenerandoAI ? "Redactando..." : "Regenerar con Gemini AI"}</span>
                  </button>
                </div>
                <textarea
                  required
                  rows={4}
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

              {/* Opción Destacado */}
              <div className="pt-3 border-t border-stone-light/60">
                <label className="flex items-center gap-3 p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200/80 cursor-pointer hover:bg-amber-100/60 transition-colors select-none">
                  <input
                    type="checkbox"
                    checked={destacado}
                    onChange={(e) => setDestacado(e.target.checked)}
                    className="w-4 h-4 text-terra rounded border-stone-light focus:ring-terra cursor-pointer accent-terra"
                  />
                  <div className="text-left flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs font-bold text-forest block">
                        ⭐ Fijar como Hospedaje Destacado
                      </span>
                      <span className="bg-terra/10 text-terra text-[10px] font-semibold px-2 py-0.5 rounded-full">
                        Máxima Visibilidad
                      </span>
                    </div>
                    <span className="text-[11px] text-stone block mt-0.5">
                      Ubica este hospedaje en las primeras posiciones de la cartelera con el distintivo público "⭐ Destacado".
                    </span>
                  </div>
                </label>
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
                  </div>

                  {/* Galería y Gestor de Fotografías de la Habitación */}
                  <HabitacionFotosManager
                    indexHab={index}
                    nombreHabitacion={hab.titulo}
                    fotos={hab.fotos || []}
                    isSubiendo={isSubiendoFoto}
                    onUploadFiles={handleUploadFotoHabitacion}
                    onAddUrl={agregarFotoPorUrl}
                    onRemoveFoto={eliminarFotoHabitacion}
                    onSetPortada={hacerFotoPortadaHabitacion}
                    onReplaceFoto={reemplazarFotoHabitacion}
                  />

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
          <div className="flex items-center justify-between gap-3 pt-3 border-t border-stone-light/60 flex-wrap">
            {/* Lado Izquierdo: Eliminar seguro (Solo visible al editar un hospedaje existente) */}
            {isEdicion ? (
              <div>
                {confirmarEliminar ? (
                  <div className="flex items-center gap-2 bg-red-50 p-2 rounded-2xl border border-red-200">
                    <span className="text-xs text-red-800 font-medium">¿Eliminar permanentemente?</span>
                    <button
                      type="button"
                      disabled={isEliminando}
                      onClick={handleEliminar}
                      className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-xl transition-all cursor-pointer disabled:opacity-50"
                    >
                      {isEliminando ? "Eliminando..." : "Sí, eliminar"}
                    </button>
                    <button
                      type="button"
                      disabled={isEliminando}
                      onClick={() => setConfirmarEliminar(false)}
                      className="px-2.5 py-1 bg-white border border-stone-light text-stone hover:text-forest text-xs rounded-xl transition-colors cursor-pointer"
                    >
                      Cancelar
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmarEliminar(true)}
                    className="text-xs text-red-600 hover:text-red-700 hover:underline flex items-center gap-1.5 font-medium font-sans cursor-pointer py-1"
                    title="Eliminar este hospedaje permanentemente de la base de datos"
                  >
                    <span>🗑️</span>
                    <span>Eliminar hospedaje</span>
                  </button>
                )}
                {errorEliminar && (
                  <p className="text-[11px] text-red-600 mt-1">⚠️ {errorEliminar}</p>
                )}
              </div>
            ) : (
              <div />
            )}

            {/* Lado Derecho: Cancelar y Guardar */}
            <div className="flex items-center gap-2 ml-auto">
              <button
                type="button"
                onClick={onClose}
                disabled={isGuardando || isEliminando}
                className="px-4 py-2.5 rounded-xl border border-stone-light font-sans text-xs text-stone hover:text-forest transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isGuardando || isSubiendoFoto || isEliminando}
                className="px-6 py-2.5 rounded-xl bg-forest text-cream font-sans text-xs font-semibold hover:bg-forest-dark active:scale-95 transition-all shadow-md disabled:opacity-50 cursor-pointer"
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
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Sub-componente Gestor de Fotos de Habitación ────────────────────────────

interface HabitacionFotosManagerProps {
  indexHab: number;
  nombreHabitacion?: string;
  fotos: string[];
  isSubiendo: boolean;
  onUploadFiles: (indexHab: number, e: React.ChangeEvent<HTMLInputElement>) => void;
  onAddUrl: (indexHab: number, url: string) => void;
  onRemoveFoto: (indexHab: number, fotoIndex: number) => void;
  onSetPortada: (indexHab: number, fotoIndex: number) => void;
  onReplaceFoto?: (indexHab: number, fotoIndex: number, nuevaUrl: string) => void;
}

function HabitacionFotosManager({
  indexHab,
  nombreHabitacion,
  fotos = [],
  isSubiendo,
  onUploadFiles,
  onAddUrl,
  onRemoveFoto,
  onSetPortada,
  onReplaceFoto,
}: HabitacionFotosManagerProps) {
  const [urlInput, setUrlInput] = useState("");
  const [mostrarInputUrl, setMostrarInputUrl] = useState(false);
  const [mostrarListaUrls, setMostrarListaUrls] = useState(false);
  const [copiadoIndex, setCopiadoIndex] = useState<number | null>(null);
  const [importandoIndex, setImportandoIndex] = useState<number | null>(null);
  const [isBatchGuardando, setIsBatchGuardando] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{
    tipo: "ok" | "err";
    texto: string;
  } | null>(null);

  const esUrlSupabase = (url: string) =>
    url.includes("supabase.co/storage") || url.startsWith("/images/");

  const fotosExternas = fotos
    .map((url, idx) => ({ url, idx }))
    .filter(({ url }) => !esUrlSupabase(url));

  const handleAgregarUrl = () => {
    if (!urlInput.trim()) return;
    onAddUrl(indexHab, urlInput.trim());
    setUrlInput("");
    setMostrarInputUrl(false);
    setMostrarListaUrls(true);
  };

  const handleCopiarUrl = async (url: string, index: number) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiadoIndex(index);
      setTimeout(() => setCopiadoIndex(null), 2000);
    } catch {
      // Ignorar fallback
    }
  };

  // Descarga directa al equipo (carpeta Descargas) sin bloqueos de CORS
  const handleDescargarFoto = (url: string, fIdx: number) => {
    const cleanHab = (nombreHabitacion || `hab-${indexHab + 1}`)
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-");
    const ext = url.includes(".png")
      ? "png"
      : url.includes(".webp")
      ? "webp"
      : "jpg";
    const filename = `${cleanHab}-foto-${fIdx + 1}.${ext}`;
    const downloadUrl = `/api/admin/descargar-imagen?url=${encodeURIComponent(
      url
    )}&filename=${encodeURIComponent(filename)}`;

    const link = document.createElement("a");
    link.href = downloadUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Descarga en lote de todas las fotos de la habitación
  const handleDescargarTodas = () => {
    if (fotos.length === 0) return;
    fotos.forEach((url, idx) => {
      setTimeout(() => {
        handleDescargarFoto(url, idx);
      }, idx * 400);
    });
    setFeedbackMsg({
      tipo: "ok",
      texto: `📥 Iniciando descarga de ${fotos.length} fotos a tu carpeta Descargas...`,
    });
    setTimeout(() => setFeedbackMsg(null), 4000);
  };

  // Guardar 1 foto externa directamente en Supabase Storage (bypasea descarga manual)
  const handleGuardarEnPaDonde = async (url: string, fotoIndex: number) => {
    setImportandoIndex(fotoIndex);
    setFeedbackMsg(null);
    try {
      const res = await importarImagenDesdeUrlAction(url);
      if (!res.success || !res.url) {
        setFeedbackMsg({
          tipo: "err",
          texto: res.error || "No se pudo guardar la imagen en PaDónde.",
        });
        return;
      }
      onReplaceFoto?.(indexHab, fotoIndex, res.url);
      setFeedbackMsg({
        tipo: "ok",
        texto: `✅ Foto #${fotoIndex + 1} guardada con éxito en PaDónde Storage.`,
      });
      setTimeout(() => setFeedbackMsg(null), 3000);
    } catch (err: any) {
      setFeedbackMsg({
        tipo: "err",
        texto: err?.message || "Error al conectar con el servidor.",
      });
    } finally {
      setImportandoIndex(null);
    }
  };

  // Guardar todas las fotos externas de la habitación en Supabase Storage
  const handleGuardarTodasEnPaDonde = async () => {
    if (fotosExternas.length === 0) return;
    setIsBatchGuardando(true);
    setFeedbackMsg({
      tipo: "ok",
      texto: `☁️ Guardando ${fotosExternas.length} fotos externas en PaDónde...`,
    });

    let exitos = 0;
    for (const item of fotosExternas) {
      try {
        const res = await importarImagenDesdeUrlAction(item.url);
        if (res.success && res.url) {
          onReplaceFoto?.(indexHab, item.idx, res.url);
          exitos++;
        }
      } catch {
        // Continuar con las siguientes
      }
    }

    setIsBatchGuardando(false);
    setFeedbackMsg({
      tipo: "ok",
      texto: `🎉 ${exitos} de ${fotosExternas.length} fotos guardadas en PaDónde Storage.`,
    });
    setTimeout(() => setFeedbackMsg(null), 4500);
  };

  return (
    <div className="space-y-2.5 pt-1">
      {/* Encabezado y resumen de fotos */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <label className="block text-stone font-semibold text-xs">
          Fotografías de la Habitación ({fotos.length})
        </label>
        <div className="flex items-center gap-2">
          {fotos.length > 0 && (
            <button
              type="button"
              onClick={() => setMostrarListaUrls((prev) => !prev)}
              className="text-[11px] font-sans font-medium text-forest hover:underline cursor-pointer flex items-center gap-1"
            >
              <span>{mostrarListaUrls ? "🙈 Ocultar URLs" : "👁️ Ver URLs"}</span>
              <span className="text-stone">({fotos.length})</span>
            </button>
          )}
          {fotos.length > 0 && (
            <button
              type="button"
              onClick={handleDescargarTodas}
              title="Descarga todas las fotos de esta habitación a tu carpeta Descargas"
              className="text-[11px] font-sans font-semibold text-forest bg-forest/10 hover:bg-forest/20 px-2 py-0.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
            >
              <span>📥</span>
              <span>Descargar todas</span>
            </button>
          )}
        </div>
      </div>

      {/* Banner de mensajes de retroalimentación */}
      {feedbackMsg && (
        <div
          className={`p-2.5 rounded-xl text-xs font-sans flex items-center justify-between animate-fadeIn ${
            feedbackMsg.tipo === "ok"
              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
              : "bg-red-50 text-red-800 border border-red-200"
          }`}
        >
          <span>{feedbackMsg.texto}</span>
          <button
            type="button"
            onClick={() => setFeedbackMsg(null)}
            className="text-stone hover:text-black ml-2 font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* Banner informativo si hay fotos externas detectadas */}
      {fotosExternas.length > 0 && (
        <div className="p-2.5 bg-amber-50/90 border border-amber-200/80 rounded-2xl flex items-center justify-between gap-2 flex-wrap">
          <div className="text-[11px] text-amber-900 font-sans">
            <span className="font-bold">💡 {fotosExternas.length} foto(s) externas:</span>{" "}
            Puedes descargarlas a tu carpeta Descargas o guardarlas en PaDónde con 1 clic.
          </div>
          <button
            type="button"
            disabled={isBatchGuardando}
            onClick={handleGuardarTodasEnPaDonde}
            className="text-[11px] font-sans font-semibold bg-forest text-cream px-2.5 py-1 rounded-xl hover:bg-forest-dark transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1 shadow-2xs"
          >
            <span>☁️</span>
            <span>{isBatchGuardando ? "Guardando..." : "Guardar todas en PaDónde"}</span>
          </button>
        </div>
      )}

      {/* Galería de Miniaturas */}
      {fotos.length > 0 ? (
        <div className="flex flex-wrap gap-2.5 p-2.5 bg-white rounded-2xl border border-stone-light/70 shadow-2xs">
          {fotos.map((src, fIdx) => {
            const esSupabase = esUrlSupabase(src);
            return (
              <div
                key={`${src}-${fIdx}`}
                className="relative w-20 h-20 rounded-xl overflow-hidden border border-stone-light/80 shadow-2xs group bg-stone-100 flex-shrink-0"
              >
                <img
                  src={src}
                  alt={`Foto habitación ${fIdx + 1}`}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLElement).style.opacity = "0.5";
                  }}
                />

                {/* Badge de tipo de almacenamiento */}
                <span
                  title={esSupabase ? "Guardada en PaDónde Storage" : "URL externa (Booking/Web)"}
                  className={`absolute top-1 left-1 text-[8px] font-sans font-bold px-1 py-0.2 rounded shadow-2xs ${
                    esSupabase
                      ? "bg-emerald-600/90 text-white"
                      : "bg-amber-600/90 text-white"
                  }`}
                >
                  {esSupabase ? "☁️" : "🌐"}
                </span>

                {/* Distintivo de Portada */}
                {fIdx === 0 ? (
                  <span className="absolute bottom-1 left-1 bg-forest/90 text-cream text-[9px] font-sans font-bold px-1.5 py-0.5 rounded shadow-xs">
                    ⭐ Portada
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => onSetPortada(indexHab, fIdx)}
                    title="Establecer como foto principal"
                    className="absolute bottom-1 left-1 bg-black/70 hover:bg-forest text-cream text-[9px] font-sans font-medium px-1.5 py-0.5 rounded shadow-xs transition-colors opacity-90 sm:opacity-0 sm:group-hover:opacity-100"
                  >
                    ⭐ Principal
                  </button>
                )}

                {/* Botón Descargar rápido a equipo */}
                <button
                  type="button"
                  onClick={() => handleDescargarFoto(src, fIdx)}
                  title="Descargar esta foto a tu carpeta Descargas"
                  className="absolute top-1 right-7 w-5 h-5 rounded-full bg-black/70 hover:bg-forest text-white text-[10px] flex items-center justify-center transition-colors shadow-xs opacity-90 sm:opacity-0 sm:group-hover:opacity-100"
                >
                  📥
                </button>

                {/* Botón Eliminar individual */}
                <button
                  type="button"
                  onClick={() => onRemoveFoto(indexHab, fIdx)}
                  title="Eliminar esta foto"
                  className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/70 hover:bg-red-600 text-white text-[10px] flex items-center justify-center transition-colors shadow-xs"
                >
                  ✕
                </button>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-3 bg-stone-light/20 rounded-xl border border-dashed border-stone-light/70 text-center">
          <p className="text-[11px] text-stone font-sans">
            📷 No hay fotos asignadas a esta habitación. Agrega fotos para que el carrusel público se visualice atractivo.
          </p>
        </div>
      )}

      {/* Lista detallada de URLs con botones de Descarga y Subida a PaDónde */}
      {mostrarListaUrls && fotos.length > 0 && (
        <div className="bg-sand-light/50 p-3 rounded-2xl border border-stone-light/80 space-y-2 animate-fadeIn">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-forest">
              URLs de las fotografías ({fotos.length})
            </span>
            <span className="text-[11px] text-stone">
              Descarga a tu Mac o guárdalas directo en PaDónde
            </span>
          </div>

          <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
            {fotos.map((url, fIdx) => {
              const esSupabase = esUrlSupabase(url);
              const estaImportando = importandoIndex === fIdx;

              return (
                <div
                  key={`url-row-${fIdx}`}
                  className="p-2 bg-white rounded-xl border border-stone-light/60 flex items-center gap-2 justify-between flex-wrap text-xs"
                >
                  {/* Vista previa y número */}
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <span className="font-mono text-[10px] text-stone font-bold w-4">
                      #{fIdx + 1}
                    </span>
                    <img
                      src={url}
                      alt={`Miniatura ${fIdx + 1}`}
                      className="w-8 h-8 rounded-lg object-cover bg-stone-100 flex-shrink-0 border border-stone-light/50"
                      onError={(e) => {
                        (e.target as HTMLElement).style.opacity = "0.5";
                      }}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span
                          className={`text-[9px] font-sans font-bold px-1.5 py-0.2 rounded ${
                            esSupabase
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {esSupabase ? "☁️ PaDónde Storage" : "🌐 URL Externa (Booking/Web)"}
                        </span>
                        {fIdx === 0 && (
                          <span className="text-[9px] bg-forest/10 text-forest font-semibold px-1 rounded">
                            ⭐ Portada
                          </span>
                        )}
                      </div>
                      <p
                        title={url}
                        className="text-[11px] text-stone truncate font-mono select-all"
                      >
                        {url}
                      </p>
                    </div>
                  </div>

                  {/* Botones de acción por cada foto */}
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {/* Botón Copiar URL */}
                    <button
                      type="button"
                      onClick={() => handleCopiarUrl(url, fIdx)}
                      title="Copiar URL al portapapeles"
                      className="px-2 py-1 bg-stone-light/30 hover:bg-stone-light/60 text-stone text-[11px] font-medium rounded-lg transition-colors cursor-pointer"
                    >
                      {copiadoIndex === fIdx ? "✓ Copiada" : "📋 Copiar"}
                    </button>

                    {/* Botón Descargar a carpeta Descargas */}
                    <button
                      type="button"
                      onClick={() => handleDescargarFoto(url, fIdx)}
                      title="Descargar esta foto a tu carpeta Descargas del equipo"
                      className="px-2 py-1 bg-forest/10 hover:bg-forest/20 text-forest text-[11px] font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <span>📥</span>
                      <span>Descargar</span>
                    </button>

                    {/* Botón Guardar en PaDónde (solo si es externa) */}
                    {!esSupabase && (
                      <button
                        type="button"
                        disabled={estaImportando || isBatchGuardando}
                        onClick={() => handleGuardarEnPaDonde(url, fIdx)}
                        title="Descarga del servidor externo y guarda en PaDónde Storage con 1 clic"
                        className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-semibold rounded-lg transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1 shadow-2xs"
                      >
                        <span>☁️</span>
                        <span>{estaImportando ? "Guardando..." : "Subir a PaDónde"}</span>
                      </button>
                    )}

                    {/* Botón Eliminar */}
                    <button
                      type="button"
                      onClick={() => onRemoveFoto(indexHab, fIdx)}
                      title="Eliminar foto"
                      className="w-6 h-6 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 text-xs flex items-center justify-center transition-colors cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Controles de Carga: Archivo local (Descargas) o URL */}
      <div className="flex flex-wrap items-center gap-2 pt-0.5">
        <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-forest/10 hover:bg-forest/20 text-forest text-xs font-semibold rounded-xl cursor-pointer transition-colors border border-forest/20 shadow-2xs">
          <span>📁</span>
          <span>{isSubiendo ? "Subiendo imágenes..." : "Subir desde dispositivo (Descargas)"}</span>
          <input
            type="file"
            multiple
            accept="image/*"
            disabled={isSubiendo}
            onChange={(e) => onUploadFiles(indexHab, e)}
            className="hidden"
          />
        </label>

        <button
          type="button"
          onClick={() => setMostrarInputUrl((prev) => !prev)}
          className="inline-flex items-center gap-1 px-3 py-1.5 bg-stone-light/30 hover:bg-stone-light/50 text-stone hover:text-forest text-xs font-medium rounded-xl transition-colors border border-stone-light/60 cursor-pointer"
        >
          <span>🔗</span>
          <span>{mostrarInputUrl ? "Ocultar agregar URL" : "Agregar por URL(s)"}</span>
        </button>
      </div>

      {/* Input para agregar URL directa (soporta 1 o múltiples URLs) */}
      {mostrarInputUrl && (
        <div className="space-y-1.5 pt-1 animate-fadeIn bg-stone-50/70 p-2.5 rounded-2xl border border-stone-light/60">
          <textarea
            rows={2}
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="Pega 1 o varias URLs de imágenes (separadas por coma o salto de línea). Al agregarlas, podrás descargarlas a tu equipo o guardarlas en PaDónde en 1 clic."
            className="w-full bg-white border border-stone-light rounded-xl px-3 py-1.5 text-xs text-forest focus:outline-none focus:border-forest font-mono"
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setUrlInput("");
                setMostrarInputUrl(false);
              }}
              className="px-3 py-1 text-xs text-stone hover:text-forest"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleAgregarUrl}
              className="px-3.5 py-1 bg-forest text-cream text-xs font-semibold rounded-xl hover:bg-forest-dark transition-colors cursor-pointer shadow-2xs"
            >
              + Añadir a la habitación
            </button>
          </div>
        </div>
      )}
    </div>
  );
}


