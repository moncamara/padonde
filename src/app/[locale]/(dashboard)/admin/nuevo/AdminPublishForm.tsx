"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { Link } from "@/i18n/routing";
import { CATEGORIAS_EVENTOS, getCategoria } from "@/constants";
import { uploadEventImage, uploadEventVideo, extractVideoThumbnail } from "@/lib/supabase/storage";
import { adminPublishEventAction } from "../actions";
import { Button } from "@/components/ui/Button";
import { ModalAsistenteEvento } from "../ModalAsistenteEvento";
import {
  inyectarRecurrencia,
  limpiarDescripcionRecurrencia,
  formatearDiasRecurrencia,
  getDayOfWeekColombia,
  getFechaYMDDesdeISO,
} from "@/lib/utils";
import type { EventoExtraido } from "@/lib/eventoParser";
import type { CategoriaEvento } from "@/lib/types";

export interface AliadoResumen {
  id: string;
  nombre: string;
  whatsapp: string;
  instagram?: string | null;
  categoria?: string;
  zonaSlug?: string;
  zonaNombre?: string;
  activo?: boolean;
}

interface AdminPublishFormProps {
  defaultZona?: string;
  initialNegocio?: {
    id?: string;
    nombre: string;
    whatsapp: string;
    instagram?: string | null;
    categoria?: string;
    zonaSlug?: string;
  };
  aliados?: AliadoResumen[];
}

export function AdminPublishForm({
  defaultZona = "minca",
  initialNegocio,
  aliados = [],
}: AdminPublishFormProps) {
  const [zonaSlug, setZonaSlug] = useState<string>(
    initialNegocio?.zonaSlug || defaultZona
  );
  const [businessName, setBusinessName] = useState(initialNegocio?.nombre || "");
  const [whatsapp, setWhatsapp] = useState(initialNegocio?.whatsapp || "");
  const [instagram, setInstagram] = useState(initialNegocio?.instagram || "");
  const [selectedAliadoId, setSelectedAliadoId] = useState<string | null>(
    initialNegocio?.id || null
  );

  // Estados del dropdown buscador de aliados
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Cerrar dropdown al hacer click afuera o presionar Escape
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  // Filtrado en tiempo real sin importar acentos ni mayúsculas
  const aliadosFiltrados = useMemo(() => {
    if (!aliados || aliados.length === 0) return [];
    const q = businessName
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim();

    if (!q) return aliados;

    return aliados.filter((a) => {
      const matchNombre = a.nombre
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .includes(q);
      const matchWp = a.whatsapp?.includes(q.replace(/\D/g, ""));
      const matchIg = a.instagram
        ? a.instagram.toLowerCase().includes(q)
        : false;
      const matchCat = a.categoria
        ? a.categoria.toLowerCase().includes(q)
        : false;
      return matchNombre || matchWp || matchIg || matchCat;
    });
  }, [aliados, businessName]);

  const aliadoSeleccionado = useMemo(() => {
    if (!selectedAliadoId) return null;
    return aliados.find((a) => a.id === selectedAliadoId) || null;
  }, [aliados, selectedAliadoId]);

  function handleSelectAliado(aliado: AliadoResumen) {
    setBusinessName(aliado.nombre);
    setWhatsapp(aliado.whatsapp);
    setInstagram(aliado.instagram || "");
    if (aliado.categoria) {
      if (aliado.categoria === "hospedaje") {
        setCategory("comida");
      } else {
        setCategory(aliado.categoria as CategoriaEvento);
      }
    }
    if (aliado.zonaSlug) {
      setZonaSlug(aliado.zonaSlug);
    }
    setSelectedAliadoId(aliado.id);
    setIsDropdownOpen(false);
  }

  function handleLimpiarAliado() {
    setSelectedAliadoId(null);
    setBusinessName("");
    setWhatsapp("");
    setInstagram("");
    setIsDropdownOpen(true);
  }
  const [eventTitle, setEventTitle] = useState("");
  const [category, setCategory] = useState<CategoriaEvento>(
    initialNegocio?.categoria && initialNegocio.categoria !== "hospedaje"
      ? (initialNegocio.categoria as CategoriaEvento)
      : "comida"
  );
  const [dateTime, setDateTime] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [tieneFechaFin, setTieneFechaFin] = useState(false);
  const [esRecurrente, setEsRecurrente] = useState(false);
  const [diasRecurrentes, setDiasRecurrentes] = useState<number[]>([]);
  const [price, setPrice] = useState<string>("0");
  const [description, setDescription] = useState("");
  const [isFeatured, setIsFeatured] = useState(false);

  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Video / Reel opcional
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null);
  const [isProcessingVideo, setIsProcessingVideo] = useState(false);
  const [autoExtractedPoster, setAutoExtractedPoster] = useState<File | null>(null);

  // Reputación Google Maps (Opcional)
  const [ratingGoogle, setRatingGoogle] = useState("");
  const [reviewsGoogle, setReviewsGoogle] = useState("");
  const [mapsUrl, setMapsUrl] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdEventId, setCreatedEventId] = useState<string | null>(null);
  const [asistenteModalOpen, setAsistenteModalOpen] = useState(false);

  // Recuperar prefill de sessionStorage si viene desde el panel admin principal
  useEffect(() => {
    try {
      const prefillRaw = sessionStorage.getItem("padonde_asistente_prefill");
      if (prefillRaw) {
        sessionStorage.removeItem("padonde_asistente_prefill");
        const p: EventoExtraido = JSON.parse(prefillRaw);
        if (p.businessName) setBusinessName(p.businessName);
        if (p.whatsapp) setWhatsapp(p.whatsapp);
        if (p.instagram) setInstagram(p.instagram);
        if (p.aliadoId) setSelectedAliadoId(p.aliadoId);
        if (p.zonaSlug) setZonaSlug(p.zonaSlug);
        if (p.titulo) setEventTitle(p.titulo);
        if (p.categoria) setCategory(p.categoria);
        if (p.dateTime) setDateTime(p.dateTime);
        if (p.fechaFin) {
          setFechaFin(p.fechaFin);
          setTieneFechaFin(true);
        }
        if (p.esRecurrente) {
          setEsRecurrente(true);
          if (p.diasRecurrentes && p.diasRecurrentes.length > 0) {
            setDiasRecurrentes(p.diasRecurrentes);
          }
        }
        if (p.precio !== undefined) {
          setPrice(p.precio.toString());
        }
        if (p.descripcion) setDescription(p.descripcion);
      }
    } catch {}
  }, []);

  function handlePrefillFromAsistente(data: EventoExtraido, foto?: File | null) {
    if (data.businessName) setBusinessName(data.businessName);
    if (data.whatsapp) setWhatsapp(data.whatsapp);
    if (data.instagram) setInstagram(data.instagram);
    if (data.aliadoId) setSelectedAliadoId(data.aliadoId);
    if (data.zonaSlug) setZonaSlug(data.zonaSlug);
    if (data.titulo) setEventTitle(data.titulo);
    if (data.categoria) setCategory(data.categoria);
    if (data.dateTime) setDateTime(data.dateTime);
    if (data.fechaFin) {
      setFechaFin(data.fechaFin);
      setTieneFechaFin(true);
    }
    if (data.esRecurrente) {
      setEsRecurrente(true);
      if (data.diasRecurrentes && data.diasRecurrentes.length > 0) {
        setDiasRecurrentes(data.diasRecurrentes);
      }
    }
    if (data.precio !== undefined) {
      setPrice(data.precio.toString());
    }
    if (data.descripcion) setDescription(data.descripcion);
    if (foto) {
      setFile(foto);
      setPreviewUrl(URL.createObjectURL(foto));
    }
    setAsistenteModalOpen(false);
  }

  async function handleVideoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0];
    if (selected) {
      setVideoFile(selected);
      setVideoPreviewUrl(URL.createObjectURL(selected));
      setIsProcessingVideo(true);
      try {
        const poster = await extractVideoThumbnail(selected, 1.0);
        if (poster) {
          setAutoExtractedPoster(poster);
          // Si el usuario aún no ha seleccionado foto de portada manual, previsualizar el poster del video
          if (!file) {
            setPreviewUrl(URL.createObjectURL(poster));
          }
        }
      } catch (err) {
        console.warn("No se pudo extraer portada automática del video:", err);
      } finally {
        setIsProcessingVideo(false);
      }
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
      setPreviewUrl(URL.createObjectURL(selected));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      let finalImageUrl: string | undefined = undefined;
      let finalVideoUrl: string | undefined = undefined;

      // 1. Subir video si fue seleccionado
      if (videoFile) {
        const uploadedVideo = await uploadEventVideo(videoFile);
        if (uploadedVideo) finalVideoUrl = uploadedVideo;
      }

      // 2. Subir imagen manual o poster extraído automáticamente
      if (file) {
        const uploaded = await uploadEventImage(file);
        if (uploaded) finalImageUrl = uploaded;
      } else if (autoExtractedPoster) {
        const uploadedPoster = await uploadEventImage(autoExtractedPoster);
        if (uploadedPoster) finalImageUrl = uploadedPoster;
      }

      const googleReputacion =
        ratingGoogle && reviewsGoogle && mapsUrl
          ? {
              rating: parseFloat(ratingGoogle),
              total_reviews: parseInt(reviewsGoogle, 10),
              maps_url: mapsUrl.trim(),
            }
          : undefined;

      const diasFinales = diasRecurrentes.length > 0
        ? diasRecurrentes
        : [dateTime ? getDayOfWeekColombia(getFechaYMDDesdeISO(dateTime)) : 5];

      const descripcionFinal = esRecurrente
        ? inyectarRecurrencia(description, diasFinales)
        : limpiarDescripcionRecurrencia(description);

      const result = await adminPublishEventAction({
        negocioId: selectedAliadoId || undefined,
        businessName,
        whatsapp,
        instagram,
        eventTitle,
        category,
        dateTime: dateTime || new Date().toISOString(),
        fechaFin: tieneFechaFin && fechaFin ? fechaFin : null,
        price: parseFloat(price) || 0,
        description: descripcionFinal,
        imageUrl: finalImageUrl,
        videoUrl: finalVideoUrl,
        isFeatured,
        zonaSlug,
        googleReputacion,
      });

      if (!result.success) {
        setError(result.error || "Ocurrió un error al guardar.");
        setLoading(false);
        return;
      }

      setCreatedEventId(result.eventId || null);
    } catch (err) {
      console.error(err);
      setError("Error inesperado al conectar con el servidor.");
    } finally {
      setLoading(false);
    }
  }

  if (createdEventId) {
    return (
      <div className="bg-white/80 backdrop-blur-md rounded-3xl p-8 border border-stone-light text-center space-y-6 shadow-sm">
        <div className="w-16 h-16 rounded-full bg-forest text-cream flex items-center justify-center text-3xl mx-auto">
          🌿
        </div>
        <div>
          <h2 className="font-serif text-2xl text-forest">¡Evento publicado exitosamente!</h2>
          <p className="font-sans text-xs text-stone mt-1.5">
            El plan ya está visible en vivo en la cartelera de {zonaSlug === "mendihuaca" ? "Mendihuaca" : "Minca"}.
          </p>
        </div>

        <div className="space-y-3 pt-2">
          <Link href={`/${zonaSlug}/${createdEventId}`}>
            <Button size="lg" className="w-full">
              Ver evento en vivo
            </Button>
          </Link>

          <Link href="/admin">
            <Button variant="outline" size="md" className="w-full">
              Volver al panel admin
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {error && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-sans">
          ⚠️ {error}
        </div>
      )}

      {/* Banner Asistente de Ingesta Rápida */}
      <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-forest/10 via-terra/10 to-forest/5 border border-forest/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-3">
          <span className="text-2xl sm:text-3xl">✨</span>
          <div>
            <h3 className="font-serif text-sm sm:text-base text-forest font-bold">
              ¿Tienes un mensaje de WhatsApp o un afiche?
            </h3>
            <p className="text-xs text-stone font-sans mt-0.5">
              Pégalo en el Asistente Inteligente para extraer los datos, redactar la descripción y llenar este formulario en 1 segundo.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setAsistenteModalOpen(true)}
          className="px-4 py-2.5 bg-terra hover:bg-terra-dark text-white font-sans text-xs font-bold rounded-2xl shadow-xs transition-all active:scale-95 shrink-0 flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <span>✨</span>
          <span>Abrir Asistente Rápido</span>
        </button>
      </div>

      {/* 1. NEGOCIO */}
      <section className="bg-white/70 backdrop-blur-sm rounded-3xl p-6 border border-stone-light/70 space-y-4">
        <div className="flex items-center justify-between gap-2">
          <h2 className="font-serif text-lg text-forest flex items-center gap-2">
            <span>📍</span> 1. Negocio / Anfitrión
          </h2>
          {aliados.length > 0 && (
            <button
              type="button"
              onClick={() => setIsDropdownOpen((prev) => !prev)}
              className="text-xs text-forest hover:text-terra font-medium font-sans flex items-center gap-1.5 transition-colors px-2.5 py-1 rounded-lg bg-cream border border-stone-light/70 hover:border-forest"
            >
              <span>👥</span>
              {isDropdownOpen ? "Ocultar lista" : `Listar aliados (${aliados.length})`}
            </button>
          )}
        </div>

        {/* Banner de Aliado Seleccionado */}
        {aliadoSeleccionado ? (
          <div className="p-3.5 bg-emerald-50/90 border border-emerald-200/90 rounded-2xl flex items-center justify-between gap-3 text-xs font-sans shadow-xs">
            <div className="flex items-center gap-3 min-w-0">
              <span className="w-9 h-9 rounded-xl bg-white flex items-center justify-center text-lg border border-emerald-200 shadow-xs shrink-0">
                {getCategoria(aliadoSeleccionado.categoria as any)?.emoji || "🏢"}
              </span>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-emerald-950 truncate text-sm">
                    {aliadoSeleccionado.nombre}
                  </p>
                  <span className="text-[10px] bg-emerald-600 text-white px-2 py-0.5 rounded-full font-medium">
                    ✓ Aliado Vinculado
                  </span>
                </div>
                <p className="text-[11px] text-emerald-800 flex items-center gap-2 mt-0.5">
                  <span className="font-medium">
                    {aliadoSeleccionado.zonaNombre || (zonaSlug === "mendihuaca" ? "Mendihuaca" : "Minca")}
                  </span>
                  {aliadoSeleccionado.whatsapp && (
                    <span>• WA: {aliadoSeleccionado.whatsapp}</span>
                  )}
                  {aliadoSeleccionado.instagram && (
                    <span>• IG: {aliadoSeleccionado.instagram}</span>
                  )}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleLimpiarAliado}
              className="text-[11px] text-emerald-900 hover:text-red-600 font-semibold underline shrink-0 px-2 py-1 rounded-lg hover:bg-emerald-100/50 transition-colors"
            >
              Cambiar
            </button>
          </div>
        ) : null}

        {/* Selector de Zona */}
        <div>
          <label className="block text-xs font-semibold text-forest mb-1.5 font-sans">
            Zona de Publicación *
          </label>
          <div className="grid grid-cols-2 gap-2.5">
            {[
              { id: "minca", label: "Minca", icon: "🌿", desc: "Montaña y Sierra" },
              { id: "mendihuaca", label: "Mendihuaca", icon: "🌊", desc: "Playa, Río y Surf" },
            ].map((z) => (
              <button
                key={z.id}
                type="button"
                onClick={() => setZonaSlug(z.id)}
                className={[
                  "flex items-center gap-2 p-2.5 rounded-xl border text-xs font-sans transition-all cursor-pointer text-left",
                  zonaSlug === z.id
                    ? "bg-forest text-white border-forest shadow-xs font-semibold"
                    : "bg-cream border-stone-light/70 text-forest hover:bg-white",
                ].join(" ")}
              >
                <span className="text-lg">{z.icon}</span>
                <div>
                  <span className="block font-medium">{z.label}</span>
                  <span className={`text-[10px] ${zonaSlug === z.id ? "text-cream/80" : "text-stone"}`}>
                    {z.desc}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Input Buscador / Nombre de Negocio con Combobox */}
        <div ref={dropdownRef} className="relative">
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-medium text-forest font-sans">
              Nombre del Negocio o Aliado *
            </label>
            <span className="text-[11px] text-stone font-sans">
              Escribe para filtrar o desplegar la lista
            </span>
          </div>

          <div className="relative">
            <input
              type="text"
              required
              value={businessName}
              onFocus={() => {
                if (aliados.length > 0) setIsDropdownOpen(true);
              }}
              onChange={(e) => {
                const val = e.target.value;
                setBusinessName(val);
                setIsDropdownOpen(true);
                // Si el usuario edita el texto y ya no coincide con el seleccionado, desvincular
                if (selectedAliadoId) {
                  const actual = aliados.find((a) => a.id === selectedAliadoId);
                  if (!actual || actual.nombre !== val) {
                    setSelectedAliadoId(null);
                  }
                }
              }}
              placeholder="Ej. Casa Maya, Café Sierra, Hostal Casa Loma..."
              className="w-full pl-4 pr-10 py-3 rounded-xl border border-stone-light bg-cream text-forest text-sm font-sans focus:outline-none focus:border-forest transition-colors"
            />

            {/* Botón a la derecha del input: flecha para desplegar o cerrar */}
            <button
              type="button"
              onClick={() => setIsDropdownOpen((prev) => !prev)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center text-stone hover:text-forest transition-colors rounded-lg hover:bg-stone-light/40"
              title={isDropdownOpen ? "Cerrar lista" : "Desplegar lista de aliados"}
            >
              <span className={`text-xs transition-transform duration-200 inline-block ${isDropdownOpen ? "rotate-180 text-forest" : ""}`}>
                ▼
              </span>
            </button>
          </div>

          {/* Menú Dropdown Autocompletado */}
          {isDropdownOpen && (
            <div className="absolute left-0 right-0 top-full mt-1.5 z-40 bg-white rounded-2xl border border-stone-light shadow-xl overflow-hidden animate-in fade-in max-h-72 flex flex-col">
              <div className="px-3.5 py-2 bg-stone-50 border-b border-stone-light/80 flex items-center justify-between text-[11px] font-sans text-stone">
                <span>
                  {aliadosFiltrados.length === 0
                    ? "Sin coincidencias"
                    : `Mostrando ${aliadosFiltrados.length} aliado${aliadosFiltrados.length === 1 ? "" : "s"}`}
                </span>
                <span className="text-[10px] text-stone/80">
                  Clic para autocompletar datos
                </span>
              </div>

              <div className="overflow-y-auto divide-y divide-stone-100 flex-1">
                {aliadosFiltrados.length > 0 ? (
                  aliadosFiltrados.map((aliado) => {
                    const isSelected = selectedAliadoId === aliado.id;
                    const catObj = getCategoria(aliado.categoria as any);
                    return (
                      <button
                        key={aliado.id}
                        type="button"
                        onClick={() => handleSelectAliado(aliado)}
                        className={`w-full text-left px-3.5 py-2.5 hover:bg-cream/90 transition-colors flex items-center justify-between gap-3 cursor-pointer ${
                          isSelected ? "bg-emerald-50/70" : ""
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="w-8 h-8 rounded-xl bg-cream flex items-center justify-center text-sm shrink-0 border border-stone-light/60">
                            {catObj?.emoji || "📍"}
                          </span>
                          <div className="min-w-0">
                            <p className="font-semibold text-xs text-forest truncate flex items-center gap-1.5">
                              <span>{aliado.nombre}</span>
                              {isSelected && (
                                <span className="text-[10px] bg-emerald-600 text-white px-1.5 py-0.2 rounded-full font-sans">
                                  ✓ Seleccionado
                                </span>
                              )}
                            </p>
                            <p className="text-[10px] text-stone truncate font-sans">
                              {aliado.whatsapp ? `WA: ${aliado.whatsapp}` : "Sin WhatsApp"}
                              {aliado.instagram ? ` · IG: ${aliado.instagram}` : ""}
                            </p>
                          </div>
                        </div>

                        <div className="shrink-0 text-right">
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-forest/5 text-forest font-medium border border-forest/10">
                            {aliado.zonaSlug === "mendihuaca" ? "🌊 Mendihuaca" : "🌿 Minca"}
                          </span>
                        </div>
                      </button>
                    );
                  })
                ) : (
                  <div className="p-4 text-center space-y-1">
                    <p className="text-xs text-forest font-medium font-sans">
                      No encontramos "{businessName}" en los aliados registrados
                    </p>
                    <p className="text-[11px] text-stone font-sans">
                      Puedes continuar y se registrará automáticamente como un nuevo aliado al publicar.
                    </p>
                  </div>
                )}
              </div>

              {businessName.trim().length > 0 && !selectedAliadoId && (
                <div className="p-2 bg-cream/50 border-t border-stone-light/60 text-center">
                  <button
                    type="button"
                    onClick={() => setIsDropdownOpen(false)}
                    className="text-[11px] text-forest hover:text-terra font-medium underline"
                  >
                    Usar "{businessName}" como nuevo aliado
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Ayuda visual inferior */}
          {!selectedAliadoId && businessName.trim().length > 1 && (
            <p className="text-[11px] text-terra/90 mt-1.5 font-sans flex items-center gap-1">
              <span>✨</span>
              <span>
                Nuevo aliado: se creará automáticamente en Supabase al publicar.
              </span>
            </p>
          )}
        </div>

        <div>
          <label className="block text-xs font-medium text-forest mb-1.5 font-sans">
            Número de WhatsApp *
          </label>
          <input
            type="tel"
            required
            value={whatsapp}
            onChange={(e) => setWhatsapp(e.target.value)}
            placeholder="573001234567"
            className="w-full px-4 py-3 rounded-xl border border-stone-light bg-cream text-forest text-sm font-sans focus:outline-none focus:border-forest transition-colors"
          />
          <p className="text-[11px] text-stone mt-1">Con código de país (ej. 57) sin espacios.</p>
        </div>

        <div>
          <label className="block text-xs font-medium text-forest mb-1.5 font-sans">
            Instagram (opcional)
          </label>
          <input
            type="text"
            value={instagram}
            onChange={(e) => setInstagram(e.target.value)}
            placeholder="@casaloma"
            className="w-full px-4 py-3 rounded-xl border border-stone-light bg-cream text-forest text-sm font-sans focus:outline-none focus:border-forest transition-colors"
          />
        </div>
      </section>

      {/* 2. EVENTO */}
      <section className="bg-white/70 backdrop-blur-sm rounded-3xl p-6 border border-stone-light/70 space-y-4">
        <h2 className="font-serif text-lg text-forest flex items-center gap-2">
          <span>📅</span> 2. Detalles del Evento
        </h2>

        <div>
          <label className="block text-xs font-medium text-forest mb-1.5 font-sans">
            Título del Plan *
          </label>
          <input
            type="text"
            required
            value={eventTitle}
            onChange={(e) => setEventTitle(e.target.value)}
            placeholder="Ej. Cata de Café de Origen..."
            className="w-full px-4 py-3 rounded-xl border border-stone-light bg-cream text-forest text-sm font-sans focus:outline-none focus:border-forest transition-colors"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-xs font-medium text-forest font-sans">
              Categoría *
            </label>
            <Link
              href="/admin/hospedajes"
              className="text-[11px] text-stone hover:text-terra font-sans transition-colors"
              title="Para publicar cabañas, habitaciones o eco-lodges"
            >
              ¿Es un hospedaje? Publicar en Hospedajes ↗
            </Link>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {CATEGORIAS_EVENTOS.map((cat) => (
              <button
                type="button"
                key={cat.id}
                onClick={() => setCategory(cat.id)}
                className={[
                  "flex flex-col items-center gap-1 p-2.5 rounded-2xl text-xs font-sans transition-all duration-150 cursor-pointer",
                  category === cat.id
                    ? "bg-forest text-white shadow-sm"
                    : "bg-cream border border-stone-light/60 text-stone hover:text-forest",
                ].join(" ")}
              >
                <span className="text-lg">{cat.emoji}</span>
                <span className="text-[11px] truncate w-full text-center">
                  {cat.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* BLOQUE DE HORARIO, DURACIÓN Y RECURRENCIA UNIFICADA */}
        <div className="space-y-4 pt-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-forest mb-1.5 font-sans">
                Fecha y Hora de Inicio *
              </label>
              <input
                type="datetime-local"
                required
                value={dateTime}
                onChange={(e) => {
                  const val = e.target.value;
                  setDateTime(val);
                  // Si no hay días seleccionados en recurrencia, sugerir el día de la fecha elegida
                  if (val) {
                    const dia = getDayOfWeekColombia(getFechaYMDDesdeISO(val));
                    if (diasRecurrentes.length === 0) {
                      setDiasRecurrentes([dia]);
                    }
                  }
                }}
                className="w-full px-4 py-3 rounded-xl border border-stone-light bg-cream text-forest text-sm font-sans focus:outline-none focus:border-forest transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-forest mb-1.5 font-sans">
                Cover / Precio COP (0 = Consultar) *
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  step="500"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-stone-light bg-cream text-forest text-sm font-sans focus:outline-none focus:border-forest transition-colors"
                />
                <span className="absolute right-3.5 top-3.5 text-xs text-stone pointer-events-none">
                  {price === "0" || !price ? "Gratis / Libre" : "COP"}
                </span>
              </div>
            </div>
          </div>

          {/* Duración / Hora de Cierre (Opcional) */}
          <div className="p-3.5 rounded-2xl bg-cream/70 border border-stone-light/70 space-y-2.5">
            <label className="flex items-center justify-between cursor-pointer">
              <div className="flex items-center gap-2">
                <span className="text-sm">⏱️</span>
                <div>
                  <p className="text-xs font-semibold text-forest">
                    ¿Tiene hora de finalización o dura varios días?
                  </p>
                  <p className="text-[11px] text-stone">
                    Recomendado para fiestas que van hasta la madrugada o festivales continuos
                  </p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={tieneFechaFin}
                onChange={(e) => {
                  const checked = e.target.checked;
                  setTieneFechaFin(checked);
                  if (!checked) setFechaFin("");
                  else if (!fechaFin && dateTime) setFechaFin(dateTime);
                }}
                className="w-4 h-4 text-forest rounded border-stone-light focus:ring-forest cursor-pointer"
              />
            </label>

            {tieneFechaFin && (
              <div className="pt-2 border-t border-stone-light/60 animate-in fade-in">
                <label className="block text-xs font-medium text-forest mb-1 font-sans">
                  Fecha y Hora de Cierre / Finalización
                </label>
                <input
                  type="datetime-local"
                  value={fechaFin}
                  min={dateTime || undefined}
                  onChange={(e) => setFechaFin(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-stone-light bg-white text-forest text-xs sm:text-sm font-sans focus:outline-none focus:border-forest"
                />
              </div>
            )}
          </div>

          {/* Frecuencia / Recurrencia Semanal */}
          <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200/90 space-y-3 shadow-2xs">
            <label className="flex items-center justify-between cursor-pointer">
              <div className="flex items-center gap-2.5">
                <span className="text-base">🔄</span>
                <div>
                  <p className="text-xs sm:text-sm font-bold text-amber-950">
                    ¿Es una experiencia periódica o recurrente?
                  </p>
                  <p className="text-[11px] text-amber-800">
                    Aparecerá automáticamente en la cartelera los días que programes
                  </p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={esRecurrente}
                onChange={(e) => {
                  const checked = e.target.checked;
                  setEsRecurrente(checked);
                  if (checked && diasRecurrentes.length === 0) {
                    const diaBase = dateTime
                      ? getDayOfWeekColombia(getFechaYMDDesdeISO(dateTime))
                      : 5;
                    setDiasRecurrentes([diaBase]);
                  }
                }}
                className="w-4 h-4 text-forest rounded border-amber-300 focus:ring-forest cursor-pointer"
              />
            </label>

            {esRecurrente && (
              <div className="pt-3 border-t border-amber-200/80 space-y-3 animate-in fade-in">
                {/* Botones de selección rápida */}
                <div>
                  <span className="block text-[11px] font-semibold text-amber-950 mb-1.5">
                    Preajustes rápidos:
                  </span>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setDiasRecurrentes([1, 2, 3, 4, 5, 6, 0])}
                      className="px-2.5 py-1 text-[11px] rounded-lg bg-white border border-amber-300 hover:bg-amber-100 text-amber-950 font-medium transition-all active:scale-95 cursor-pointer shadow-2xs"
                    >
                      ⚡ Todos los días
                    </button>
                    <button
                      type="button"
                      onClick={() => setDiasRecurrentes([5, 6, 0])}
                      className="px-2.5 py-1 text-[11px] rounded-lg bg-white border border-amber-300 hover:bg-amber-100 text-amber-950 font-medium transition-all active:scale-95 cursor-pointer shadow-2xs"
                    >
                      🎉 Fines de semana (Vie-Dom)
                    </button>
                    <button
                      type="button"
                      onClick={() => setDiasRecurrentes([4, 5, 6])}
                      className="px-2.5 py-1 text-[11px] rounded-lg bg-white border border-amber-300 hover:bg-amber-100 text-amber-950 font-medium transition-all active:scale-95 cursor-pointer shadow-2xs"
                    >
                      🍸 Jue a Sáb
                    </button>
                    {dateTime && (
                      <button
                        type="button"
                        onClick={() => {
                          const dia = getDayOfWeekColombia(getFechaYMDDesdeISO(dateTime));
                          setDiasRecurrentes([dia]);
                        }}
                        className="px-2.5 py-1 text-[11px] rounded-lg bg-white border border-amber-300 hover:bg-amber-100 text-amber-950 font-medium transition-all active:scale-95 cursor-pointer shadow-2xs"
                      >
                        📅 Solo el día del evento
                      </button>
                    )}
                  </div>
                </div>

                {/* Pastillas individuales de días */}
                <div>
                  <span className="block text-[11px] font-semibold text-amber-950 mb-1.5">
                    O marca los días específicos:
                  </span>
                  <div className="grid grid-cols-7 gap-1.5">
                    {[
                      { d: 1, label: "Lun" },
                      { d: 2, label: "Mar" },
                      { d: 3, label: "Mié" },
                      { d: 4, label: "Jue" },
                      { d: 5, label: "Vie" },
                      { d: 6, label: "Sáb" },
                      { d: 0, label: "Dom" },
                    ].map((item) => {
                      const activo = diasRecurrentes.includes(item.d);
                      return (
                        <button
                          key={item.d}
                          type="button"
                          onClick={() => {
                            if (activo) {
                              if (diasRecurrentes.length > 1) {
                                setDiasRecurrentes(diasRecurrentes.filter((x) => x !== item.d));
                              } else {
                                const dia = dateTime ? getDayOfWeekColombia(getFechaYMDDesdeISO(dateTime)) : 5;
                                setDiasRecurrentes([dia]);
                              }
                            } else {
                              setDiasRecurrentes([...diasRecurrentes, item.d]);
                            }
                          }}
                          className={`py-2 rounded-xl text-xs font-semibold transition-all border text-center cursor-pointer ${
                            activo
                              ? "bg-forest text-white border-forest shadow-xs font-bold ring-2 ring-forest/20"
                              : "bg-white text-stone border-amber-200/90 hover:text-forest hover:border-forest/40"
                          }`}
                        >
                          {item.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="p-2.5 bg-white/80 rounded-xl border border-amber-200/80 flex items-center justify-between text-xs text-amber-950">
                  <span className="text-[11px] text-amber-800 font-medium">Programación visible:</span>
                  <strong className="text-forest font-semibold">
                    {diasRecurrentes.length > 0
                      ? formatearDiasRecurrencia(diasRecurrentes)
                      : "Selecciona al menos un día"}
                  </strong>
                </div>
              </div>
            )}
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-forest mb-1.5 font-sans">
            Descripción detallada
          </label>
          <textarea
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Detalla de qué trata, qué incluye, qué llevar..."
            className="w-full px-4 py-3 rounded-xl border border-stone-light bg-cream text-forest text-sm font-sans focus:outline-none focus:border-forest transition-colors"
          />
        </div>
      </section>

      {/* 3. MULTIMEDIA (FOTO DE PORTADA Y VIDEO REEL) */}
      <section className="bg-white/70 backdrop-blur-sm rounded-3xl p-6 border border-stone-light/70 space-y-6">
        <div>
          <h2 className="font-serif text-lg text-forest flex items-center gap-2">
            <span>📸</span> 3. Multimedia del Evento
          </h2>
          <p className="font-sans text-xs text-stone mt-1">
            Puedes subir tu <strong>foto de portada oficial</strong> (para que se vea impecable en la cartelera) y opcionalmente un <strong>Reel o Video</strong> vertical.
          </p>
        </div>

        {/* 1. Foto de Portada / Flyer Oficial (Prioridad visual) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-forest font-sans flex items-center gap-1.5">
              <span>📷</span> Foto de Portada Oficial (Fija en la cartelera)
            </label>
            {file ? (
              <span className="text-[11px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-medium">
                ✓ Tu foto personalizada
              </span>
            ) : autoExtractedPoster ? (
              <span className="text-[11px] text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full font-medium">
                Fotograma automático del video (toca para cambiar por tu foto)
              </span>
            ) : null}
          </div>

          <input
            type="file"
            accept="image/*"
            id="photo-admin-input"
            onChange={handleFileChange}
            className="hidden"
          />
          <label
            htmlFor="photo-admin-input"
            className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-stone-light hover:border-forest rounded-2xl cursor-pointer bg-cream transition-all duration-150"
          >
            {previewUrl ? (
              <div className="relative w-full h-44 rounded-xl overflow-hidden group">
                <img
                  src={previewUrl}
                  alt="Preview Portada"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-semibold">
                  📷 Clic para cambiar por otra foto
                </div>
              </div>
            ) : (
              <div className="text-center space-y-1.5 py-3">
                <span className="text-3xl">📷</span>
                <p className="font-sans text-xs font-semibold text-forest">
                  Seleccionar foto de portada bonita
                </p>
                <p className="text-[11px] text-stone">
                  JPG, PNG o WebP · Esta es la imagen fija que verán los turistas
                </p>
              </div>
            )}
          </label>
        </div>

        {/* 2. Video / Reel opcional */}
        <div className="space-y-2 pt-2 border-t border-stone-light/60">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-forest font-sans flex items-center gap-1.5">
              <span>🎬</span> Video / Reel vertical (Opcional)
            </label>
            {isProcessingVideo ? (
              <span className="text-[11px] text-terra animate-pulse font-medium">
                Procesando video...
              </span>
            ) : videoFile ? (
              <span className="text-[11px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-medium">
                ✓ Video adjunto listo
              </span>
            ) : null}
          </div>

          <input
            type="file"
            accept="video/mp4,video/quicktime,video/webm"
            id="video-admin-input"
            onChange={handleVideoChange}
            className="hidden"
          />
          <label
            htmlFor="video-admin-input"
            className="flex flex-col items-center justify-center p-5 border-2 border-dashed border-stone-light hover:border-forest rounded-2xl cursor-pointer bg-cream transition-all duration-150"
          >
            {videoPreviewUrl ? (
              <div className="flex flex-col items-center gap-2 py-2 text-center">
                <span className="text-3xl">🎬</span>
                <p className="font-sans text-xs font-semibold text-forest">
                  {videoFile?.name}
                </p>
                <span className="text-[11px] text-stone">
                  {((videoFile?.size || 0) / (1024 * 1024)).toFixed(1)} MB · Clic para cambiar video
                </span>
                <span className="text-[10px] text-forest/80 font-medium">
                  {file
                    ? "✓ Tu foto elegida arriba se usará de portada fija, el video se reproduce al tocarlo."
                    : "✓ Puedes subir una foto arriba para reemplazar la portada fija si lo deseas."}
                </span>
              </div>
            ) : (
              <div className="text-center space-y-1.5 py-1">
                <span className="text-2xl">📹</span>
                <p className="font-sans text-xs font-medium text-forest">
                  Adjuntar Video o Reel vertical (MP4 de WhatsApp)
                </p>
                <p className="text-[11px] text-stone">
                  Los turistas podrán reproducirlo al tocar en el plan. Cero consumo de datos en la cartelera.
                </p>
              </div>
            )}
          </label>
        </div>

        {/* Destacado */}
        <label className="flex items-center gap-3 p-3.5 rounded-2xl bg-terra/10 border border-terra/30 cursor-pointer">
          <input
            type="checkbox"
            checked={isFeatured}
            onChange={(e) => setIsFeatured(e.target.checked)}
            className="w-4 h-4 text-terra rounded border-stone-light focus:ring-terra"
          />
          <span className="font-sans text-xs font-semibold text-forest">
            ⭐ Fijar como evento Destacado arriba del feed (Plan Pago)
          </span>
        </label>
      </section>

      {/* 4. REPUTACIÓN DE GOOGLE MAPS (OPCIONAL) */}
      <section className="bg-white/70 backdrop-blur-sm rounded-3xl p-6 border border-stone-light/70 space-y-4">
        <div>
          <h2 className="font-serif text-lg text-forest flex items-center justify-between">
            <span className="flex items-center gap-2">
              <span>⭐</span> 4. Calificación en Google Maps (Opcional)
            </span>
            {ratingGoogle && (
              <span className="text-xs bg-amber-100 text-amber-900 px-2.5 py-0.5 rounded-full font-medium font-sans">
                ★ {ratingGoogle} ({reviewsGoogle || 0})
              </span>
            )}
          </h2>
          <p className="font-sans text-xs text-stone mt-1">
            Si el anfitrión o restaurante tiene ficha en Google Maps, puedes mostrar su calificación y enlace a reseñas.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-forest mb-1.5 font-sans">
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
              className="w-full px-4 py-3 rounded-xl border border-stone-light bg-cream text-forest text-sm font-sans focus:outline-none focus:border-forest transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-forest mb-1.5 font-sans">
              Total de Reseñas
            </label>
            <input
              type="number"
              value={reviewsGoogle}
              onChange={(e) => setReviewsGoogle(e.target.value)}
              placeholder="185"
              className="w-full px-4 py-3 rounded-xl border border-stone-light bg-cream text-forest text-sm font-sans focus:outline-none focus:border-forest transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-forest mb-1.5 font-sans">
              Enlace de Google Maps
            </label>
            <input
              type="url"
              value={mapsUrl}
              onChange={(e) => setMapsUrl(e.target.value)}
              placeholder="https://maps.app.goo.gl/..."
              className="w-full px-4 py-3 rounded-xl border border-stone-light bg-cream text-forest text-sm font-sans focus:outline-none focus:border-forest transition-colors"
            />
          </div>
        </div>
      </section>

      <Button
        type="submit"
        size="lg"
        disabled={loading}
        className="w-full shadow-lg font-semibold py-4"
      >
        {loading ? "Publicando en Supabase..." : "Publicar Evento en PaDónde"}
      </Button>

      {/* Modal Asistente Inteligente */}
      {asistenteModalOpen && (
        <ModalAsistenteEvento
          aliados={aliados}
          zonas={[
            { id: "1", nombre: "Minca", slug: "minca" },
            { id: "2", nombre: "Mendihuaca", slug: "mendihuaca" },
          ]}
          onClose={() => setAsistenteModalOpen(false)}
          onPrefillNuevo={handlePrefillFromAsistente}
        />
      )}
    </form>
  );
}
