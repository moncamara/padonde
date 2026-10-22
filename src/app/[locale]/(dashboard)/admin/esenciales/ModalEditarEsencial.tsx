"use client";

import { useState, useEffect, useTransition } from "react";
import type { CategoriaServicioEsencial, ServicioEsencial } from "@/lib/types";
import { uploadEventImage, uploadEventVideo } from "@/lib/supabase/storage";
import { guardarServicioEsencialAction } from "../actions";

interface ModalEditarEsencialProps {
  servicio: ServicioEsencial | null; // null si es nuevo
  isOpen: boolean;
  onClose: () => void;
  onSaved?: (servicio: ServicioEsencial) => void;
  zonas: Array<{ id: string; nombre: string; slug: string }>;
}

const CATEGORIAS_OPCIONES: Array<{
  id: CategoriaServicioEsencial;
  label: string;
  emoji: string;
}> = [
  { id: "efectivo", label: "Efectivo & Divisas", emoji: "🏧" },
  { id: "transporte", label: "Motos & Transporte", emoji: "🛵" },
  { id: "salud", label: "Farmacia & Salud", emoji: "💊" },
  { id: "comercio", label: "Tiendas & Souvenirs", emoji: "🛍️" },
  { id: "general", label: "Servicios Generales", emoji: "ℹ️" },
];

export function ModalEditarEsencial({
  servicio,
  isOpen,
  onClose,
  onSaved,
  zonas,
}: ModalEditarEsencialProps) {
  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form states
  const [zonaSlug, setZonaSlug] = useState(
    servicio?.zona_id === "zona-mendihuaca" ? "mendihuaca" : "minca"
  );
  const [categoria, setCategoria] = useState<CategoriaServicioEsencial>(
    servicio?.categoria || "efectivo"
  );
  const [nombreComercial, setNombreComercial] = useState(
    servicio?.nombre_comercial || ""
  );
  const [subtitulo, setSubtitulo] = useState(servicio?.subtitulo || "");
  const [whatsapp, setWhatsapp] = useState(servicio?.whatsapp || "57");
  const [mensajeWhatsapp, setMensajeWhatsapp] = useState(
    servicio?.mensaje_whatsapp_default || ""
  );
  const [direccion, setDireccion] = useState(
    servicio?.direccion_referencia || ""
  );
  const [mapsUrl, setMapsUrl] = useState(servicio?.google_maps_url || "");
  const [horario, setHorario] = useState(
    servicio?.horario_apertura || "Lunes a Domingo • 8:00 AM - 7:00 PM"
  );
  const [tagsStr, setTagsStr] = useState(
    servicio?.servicios_tags?.join(", ") || ""
  );
  const [tipoAcuerdo, setTipoAcuerdo] = useState<
    "canje_afiche" | "pago_mensual" | "cortesia"
  >(servicio?.tipo_acuerdo || "canje_afiche");
  const [destacado, setDestacado] = useState(
    Boolean(servicio?.destacado_patrocinado)
  );
  const [orden, setOrden] = useState(Number(servicio?.orden_prioridad ?? 1));
  const [activo, setActivo] = useState(servicio?.activo ?? true);
  const [botonWhatsappActivo, setBotonWhatsappActivo] = useState(
    servicio?.boton_whatsapp_activo ?? true
  );

  // Estados de Fotos y Video/Reel
  const [imagenLugarUrl, setImagenLugarUrl] = useState(
    servicio?.imagen_lugar_url || servicio?.metadata_comercial?.imagenes?.[0] || ""
  );
  const [imagenes, setImagenes] = useState<string[]>(
    servicio?.metadata_comercial?.imagenes || (servicio?.imagen_lugar_url ? [servicio.imagen_lugar_url] : [])
  );
  const [videoUrl, setVideoUrl] = useState(
    servicio?.metadata_comercial?.video_url || ""
  );
  const [archivoFoto, setArchivoFoto] = useState<File | null>(null);
  const [previewFoto, setPreviewFoto] = useState<string | null>(
    servicio?.imagen_lugar_url || servicio?.metadata_comercial?.imagenes?.[0] || null
  );
  const [archivoVideo, setArchivoVideo] = useState<File | null>(null);
  const [videoNombre, setVideoNombre] = useState<string | null>(null);
  const [subiendoArchivos, setSubiendoArchivos] = useState(false);

  useEffect(() => {
    if (servicio) {
      setZonaSlug(
        servicio.zona_id === "zona-mendihuaca" ? "mendihuaca" : "minca"
      );
      setCategoria(servicio.categoria || "efectivo");
      setNombreComercial(servicio.nombre_comercial || "");
      setSubtitulo(servicio.subtitulo || "");
      setWhatsapp(servicio.whatsapp || "57");
      setMensajeWhatsapp(servicio.mensaje_whatsapp_default || "");
      setDireccion(servicio.direccion_referencia || "");
      setMapsUrl(servicio.google_maps_url || "");
      setHorario(servicio.horario_apertura || "Lunes a Domingo • 8:00 AM - 7:00 PM");
      setTagsStr(servicio.servicios_tags?.join(", ") || "");
      setTipoAcuerdo(servicio.tipo_acuerdo || "canje_afiche");
      setDestacado(Boolean(servicio.destacado_patrocinado));
      setOrden(Number(servicio.orden_prioridad ?? 1));
      setActivo(servicio.activo ?? true);
      setBotonWhatsappActivo(servicio.boton_whatsapp_activo ?? true);

      const mainImg = servicio.imagen_lugar_url || servicio.metadata_comercial?.imagenes?.[0] || "";
      setImagenLugarUrl(mainImg);
      setPreviewFoto(mainImg || null);
      setImagenes(servicio.metadata_comercial?.imagenes || (mainImg ? [mainImg] : []));
      setVideoUrl(servicio.metadata_comercial?.video_url || "");
      setArchivoFoto(null);
      setArchivoVideo(null);
      setVideoNombre(null);
    } else {
      setZonaSlug("minca");
      setCategoria("efectivo");
      setNombreComercial("");
      setSubtitulo("");
      setWhatsapp("57");
      setMensajeWhatsapp("");
      setDireccion("");
      setMapsUrl("");
      setHorario("Lunes a Domingo • 8:00 AM - 7:00 PM");
      setTagsStr("");
      setTipoAcuerdo("canje_afiche");
      setDestacado(false);
      setOrden(10);
      setActivo(true);
      setBotonWhatsappActivo(true);
      setImagenLugarUrl("");
      setPreviewFoto(null);
      setImagenes([]);
      setVideoUrl("");
      setArchivoFoto(null);
      setArchivoVideo(null);
      setVideoNombre(null);
    }
  }, [servicio, isOpen]);

  if (!isOpen) return null;

  function handleFotoPrincipalChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setArchivoFoto(file);
      setPreviewFoto(URL.createObjectURL(file));
    }
  }

  async function handleAgregarFotoGaleria(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setSubiendoArchivos(true);
    try {
      const nuevasUrls: string[] = [];
      for (const f of files) {
        const url = await uploadEventImage(f);
        if (url) nuevasUrls.push(url);
      }
      setImagenes((prev) => [...prev, ...nuevasUrls]);
    } catch (err) {
      console.error("Error subiendo foto a la galería:", err);
    } finally {
      setSubiendoArchivos(false);
    }
  }

  function handleQuitarFotoGaleria(index: number) {
    setImagenes((prev) => prev.filter((_, i) => i !== index));
  }

  function handleVideoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setArchivoVideo(file);
      setVideoNombre(file.name);
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!nombreComercial.trim()) {
      setErrorMsg("El nombre comercial es obligatorio.");
      return;
    }
    if (!whatsapp.trim()) {
      setErrorMsg("El número de WhatsApp es obligatorio.");
      return;
    }

    const tagsArray = tagsStr
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    setSubiendoArchivos(true);
    try {
      let finalFoto = imagenLugarUrl;
      if (archivoFoto) {
        const uploaded = await uploadEventImage(archivoFoto);
        if (uploaded) finalFoto = uploaded;
      }

      let finalVideo = videoUrl;
      if (archivoVideo) {
        const uploadedVid = await uploadEventVideo(archivoVideo);
        if (uploadedVid) finalVideo = uploadedVid;
      }

      const finalImagenes = Array.from(new Set([finalFoto, ...imagenes])).filter(Boolean) as string[];

      startTransition(async () => {
        const res = await guardarServicioEsencialAction({
          id: servicio?.id,
          zonaSlug,
          categoria,
          nombreComercial,
          subtitulo,
          imagenLugarUrl: finalFoto || (finalImagenes[0] ?? null),
          imagenes: finalImagenes,
          videoUrl: finalVideo || null,
          whatsapp,
          mensajeWhatsappDefault: mensajeWhatsapp || null,
          direccionReferencia: direccion,
          googleMapsUrl: mapsUrl || null,
          horarioApertura: horario,
          serviciosTags: tagsArray,
          destacadoPatrocinado: destacado,
          tipoAcuerdo,
          ordenPrioridad: orden,
          activo,
          botonWhatsappActivo,
        });

        setSubiendoArchivos(false);
        if (!res.success) {
          setErrorMsg(res.error || "Ocurrió un error al guardar.");
        } else {
          if (res.servicio) {
            onSaved?.(res.servicio);
          }
          onClose();
        }
      });
    } catch (err: any) {
      setSubiendoArchivos(false);
      setErrorMsg(err?.message || "Error al procesar archivos multimedia.");
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150"
    >
      <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-stone-light/80 my-8 overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col max-h-[92vh]">
        {/* Encabezado */}
        <div className="p-4 sm:p-6 border-b border-stone-light/70 bg-stone-light/20 flex items-center justify-between shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl">
                {CATEGORIAS_OPCIONES.find((c) => c.id === categoria)?.emoji || "💡"}
              </span>
              <h2 className="font-serif text-lg sm:text-xl font-bold text-forest">
                {servicio ? "Editar Servicio Esencial" : "Nuevo Servicio Esencial"}
              </h2>
            </div>
            <p className="text-xs text-stone font-sans mt-0.5">
              Gestiona presencia, horarios, enlaces de Maps y WhatsApp del aliado fijo.
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-stone-light/40 hover:bg-stone-light text-stone hover:text-forest flex items-center justify-center text-sm transition-all cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Formulario con scroll suave */}
        <form
          onSubmit={handleSubmit}
          className="p-4 sm:p-6 overflow-y-auto space-y-4 font-sans text-xs flex-1"
        >
          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs">
              ⚠️ {errorMsg}
            </div>
          )}

          {/* Fila 1: Zona y Categoría */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-forest block mb-1">
                Destino / Zona:
              </label>
              <select
                value={zonaSlug}
                onChange={(e) => setZonaSlug(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-stone-light bg-stone-light/10 text-forest text-xs focus:ring-2 focus:ring-forest/20 outline-none"
              >
                {zonas.map((z) => (
                  <option key={z.id} value={z.slug}>
                    {z.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-semibold text-forest block mb-1">
                Categoría:
              </label>
              <select
                value={categoria}
                onChange={(e) =>
                  setCategoria(e.target.value as CategoriaServicioEsencial)
                }
                className="w-full p-2.5 rounded-xl border border-stone-light bg-stone-light/10 text-forest text-xs focus:ring-2 focus:ring-forest/20 outline-none"
              >
                {CATEGORIAS_OPCIONES.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.emoji} {c.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Nombre Comercial */}
          <div>
            <label className="font-semibold text-forest block mb-1">
              Nombre Comercial:
            </label>
            <input
              type="text"
              value={nombreComercial}
              onChange={(e) => setNombreComercial(e.target.value)}
              placeholder="Ej: Embassy Bank Colombia"
              required
              className="w-full p-2.5 rounded-xl border border-stone-light bg-stone-light/10 text-forest text-xs focus:ring-2 focus:ring-forest/20 outline-none"
            />
          </div>

          {/* Subtítulo descriptivo */}
          <div>
            <label className="font-semibold text-forest block mb-1">
              Subtítulo / Especialidad:
            </label>
            <input
              type="text"
              value={subtitulo}
              onChange={(e) => setSubtitulo(e.target.value)}
              placeholder="Ej: El Banco de Minca • Retiro de Efectivo y Cambio de Moneda"
              className="w-full p-2.5 rounded-xl border border-stone-light bg-stone-light/10 text-forest text-xs focus:ring-2 focus:ring-forest/20 outline-none"
            />
          </div>

          {/* WhatsApp y Mensaje Default */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-forest block mb-1">
                WhatsApp:
              </label>
              <input
                type="text"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                placeholder="573013010194"
                required
                className="w-full p-2.5 rounded-xl border border-stone-light bg-stone-light/10 text-forest text-xs focus:ring-2 focus:ring-forest/20 outline-none"
              />
            </div>

            <div>
              <label className="font-semibold text-forest block mb-1">
                Horario de Atención:
              </label>
              <input
                type="text"
                value={horario}
                onChange={(e) => setHorario(e.target.value)}
                placeholder="Lunes a Domingo • 8:00 AM - 7:00 PM"
                className="w-full p-2.5 rounded-xl border border-stone-light bg-stone-light/10 text-forest text-xs focus:ring-2 focus:ring-forest/20 outline-none"
              />
            </div>
          </div>

          {/* Mensaje WhatsApp predeterminado */}
          <div>
            <label className="font-semibold text-forest block mb-1">
              Mensaje WhatsApp Predeterminado:
            </label>
            <textarea
              value={mensajeWhatsapp}
              onChange={(e) => setMensajeWhatsapp(e.target.value)}
              rows={2}
              placeholder="¡Hola! Vi su punto en PaDónde Minca..."
              className="w-full p-2.5 rounded-xl border border-stone-light bg-stone-light/10 text-forest text-xs focus:ring-2 focus:ring-forest/20 outline-none resize-none"
            />
          </div>

          {/* Dirección y Google Maps */}
          <div>
            <label className="font-semibold text-forest block mb-1">
              Dirección o Referencia Local:
            </label>
            <input
              type="text"
              value={direccion}
              onChange={(e) => setDireccion(e.target.value)}
              placeholder="Calle principal de Minca, diagonal al puente central"
              className="w-full p-2.5 rounded-xl border border-stone-light bg-stone-light/10 text-forest text-xs focus:ring-2 focus:ring-forest/20 outline-none"
            />
          </div>

          <div>
            <label className="font-semibold text-forest block mb-1">
              Enlace de Google Maps:
            </label>
            <input
              type="url"
              value={mapsUrl}
              onChange={(e) => setMapsUrl(e.target.value)}
              placeholder="https://maps.app.goo.gl/..."
              className="w-full p-2.5 rounded-xl border border-stone-light bg-stone-light/10 text-forest text-xs focus:ring-2 focus:ring-forest/20 outline-none"
            />
          </div>

          {/* Tags de Servicios */}
          <div>
            <label className="font-semibold text-forest block mb-1">
              Servicios o Características (separados por coma):
            </label>
            <input
              type="text"
              value={tagsStr}
              onChange={(e) => setTagsStr(e.target.value)}
              placeholder="🏧 Retiro Efectivo, 💶 Cambio EUR & USD, 💳 Datáfono"
              className="w-full p-2.5 rounded-xl border border-stone-light bg-stone-light/10 text-forest text-xs focus:ring-2 focus:ring-forest/20 outline-none"
            />
          </div>

          {/* Fila Multimedia: Foto Principal, Galería y Reel Vertical */}
          <div className="space-y-4 p-4 rounded-2xl bg-stone-light/20 border border-stone-light/70">
            <div>
              <h4 className="font-semibold text-forest text-xs flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <span>📸</span> Fotos y Video / Reel del Servicio (Opcional)
                </span>
                {subiendoArchivos && (
                  <span className="text-[10px] text-terra animate-pulse font-medium">
                    Subiendo archivo...
                  </span>
                )}
              </h4>
              <p className="text-stone text-[11px] mt-0.5">
                Añade foto de portada, fotos del lugar y un video o reel vertical para que los viajeros conozcan el negocio.
              </p>
            </div>

            {/* 1. Foto de Portada Principal */}
            <div className="space-y-1.5">
              <label className="block text-stone font-medium text-[11px]">
                Foto de Portada Principal:
              </label>
              <div className="flex items-center gap-3">
                {previewFoto ? (
                  <div className="relative w-20 h-16 rounded-xl overflow-hidden border border-stone-light shrink-0">
                    <img
                      src={previewFoto}
                      alt="Portada"
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-20 h-16 rounded-xl bg-stone-100 border border-dashed border-stone-light flex items-center justify-center text-xl text-stone shrink-0">
                    📷
                  </div>
                )}
                <div className="space-y-1 flex-1">
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleFotoPrincipalChange}
                    className="block w-full text-xs text-stone file:mr-2.5 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-forest/10 file:text-forest hover:file:bg-forest/20 cursor-pointer"
                  />
                  {imagenLugarUrl && !archivoFoto && (
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-emerald-700 font-medium">✓ Foto actual cargada</span>
                      <button
                        type="button"
                        onClick={() => {
                          setImagenLugarUrl("");
                          setPreviewFoto(null);
                        }}
                        className="text-[10px] text-red-600 hover:underline cursor-pointer"
                      >
                        Quitar
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* 2. Galería de Fotos Adicionales */}
            <div className="space-y-1.5 pt-2 border-t border-stone-light/60">
              <label className="block text-stone font-medium text-[11px]">
                Fotos adicionales del lugar ({imagenes.length}):
              </label>
              {imagenes.length > 0 && (
                <div className="flex items-center gap-2 overflow-x-auto py-1">
                  {imagenes.map((url, idx) => (
                    <div key={idx} className="relative w-16 h-14 rounded-lg overflow-hidden border border-stone-light shrink-0 group">
                      <img src={url} alt={`Foto ${idx + 1}`} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => handleQuitarFotoGaleria(idx)}
                        className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-black/70 text-white text-[10px] flex items-center justify-center hover:bg-red-600 cursor-pointer"
                        title="Eliminar foto"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <input
                type="file"
                multiple
                accept="image/jpeg,image/png,image/webp"
                onChange={handleAgregarFotoGaleria}
                className="block w-full text-xs text-stone file:mr-2.5 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-[11px] file:font-medium file:bg-stone-light/40 file:text-forest hover:file:bg-stone-light cursor-pointer"
              />
            </div>

            {/* 3. Video o Reel Vertical (Opcional) */}
            <div className="space-y-1.5 pt-2 border-t border-stone-light/60">
              <label className="block text-stone font-medium text-[11px] flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <span>🎬</span> Video / Reel vertical (Opcional)
                </span>
                {videoUrl && !archivoVideo && (
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-medium">
                    ✓ Video activo
                  </span>
                )}
              </label>

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
                <div className="flex items-center justify-between text-xs pt-0.5">
                  <a
                    href={videoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-terra hover:underline truncate max-w-[200px] text-[11px]"
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
              ) : (
                <p className="text-[10px] text-stone">
                  Formato recomendado: MP4 vertical de WhatsApp o Instagram Reels.
                </p>
              )}
            </div>
          </div>

          {/* Fila Modelo de Negocio / Acuerdo y Prioridad */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-stone-light/60">
            <div>
              <label className="font-semibold text-forest block mb-1">
                Tipo de Acuerdo:
              </label>
              <select
                value={tipoAcuerdo}
                onChange={(e) =>
                  setTipoAcuerdo(
                    e.target.value as "canje_afiche" | "pago_mensual" | "cortesia"
                  )
                }
                className="w-full p-2.5 rounded-xl border border-stone-light bg-stone-light/10 text-forest text-xs focus:ring-2 focus:ring-forest/20 outline-none"
              >
                <option value="canje_afiche">
                  🤝 Canje por Afiche / Talker QR
                </option>
                <option value="pago_mensual">💎 Pago Mensual Pauta</option>
                <option value="cortesia">🎁 Cortesía / Alianza</option>
              </select>
            </div>

            <div>
              <label className="font-semibold text-forest block mb-1">
                Orden de Prioridad (menor = primero):
              </label>
              <input
                type="number"
                min="1"
                max="99"
                value={orden}
                onChange={(e) => setOrden(Number(e.target.value))}
                className="w-full p-2.5 rounded-xl border border-stone-light bg-stone-light/10 text-forest text-xs focus:ring-2 focus:ring-forest/20 outline-none"
              />
            </div>
          </div>

          {/* Checkboxes de Destacado y Activo */}
          <div className="flex flex-wrap items-center gap-6 pt-2">
            <label className="flex items-center gap-2 cursor-pointer font-semibold text-forest">
              <input
                type="checkbox"
                checked={destacado}
                onChange={(e) => setDestacado(e.target.checked)}
                className="w-4 h-4 rounded text-forest focus:ring-forest/20"
              />
              <span>★ Destacado / Patrocinado</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer font-semibold text-forest">
              <input
                type="checkbox"
                checked={activo}
                onChange={(e) => setActivo(e.target.checked)}
                className="w-4 h-4 rounded text-forest focus:ring-forest/20"
              />
              <span>🟢 Activo en la App</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer font-semibold text-forest">
              <input
                type="checkbox"
                checked={botonWhatsappActivo}
                onChange={(e) => setBotonWhatsappActivo(e.target.checked)}
                className="w-4 h-4 rounded text-forest focus:ring-forest/20"
              />
              <span>💬 Botón WhatsApp Público (Plan de Conversión Activo)</span>
            </label>
          </div>

          {/* Footer de Acciones */}
          <div className="pt-4 border-t border-stone-light/70 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="px-4 py-2.5 rounded-xl border border-stone-light/80 hover:bg-stone-light/30 text-stone font-semibold transition-all cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="px-5 py-2.5 rounded-xl bg-forest hover:bg-forest/90 text-cream font-semibold transition-all shadow-md active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              {isPending ? "Guardando..." : "Guardar Servicio"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
