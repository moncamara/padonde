"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { Link } from "@/i18n/routing";
import { CATEGORIAS, getCategoria } from "@/constants";
import { uploadEventImage, uploadEventVideo, extractVideoThumbnail } from "@/lib/supabase/storage";
import { adminPublishEventAction } from "../actions";
import { Button } from "@/components/ui/Button";
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
      setCategory(aliado.categoria as CategoriaEvento);
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
    (initialNegocio?.categoria as CategoriaEvento) || "comida"
  );
  const [dateTime, setDateTime] = useState("");
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

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdEventId, setCreatedEventId] = useState<string | null>(null);

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

      const result = await adminPublishEventAction({
        businessName,
        whatsapp,
        instagram,
        eventTitle,
        category,
        dateTime: dateTime || new Date().toISOString(),
        price: parseFloat(price) || 0,
        description,
        imageUrl: finalImageUrl,
        videoUrl: finalVideoUrl,
        isFeatured,
        zonaSlug,
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
          <label className="block text-xs font-medium text-forest mb-2 font-sans">
            Categoría *
          </label>
          <div className="grid grid-cols-4 gap-2">
            {CATEGORIAS.map((cat) => (
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

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-forest mb-1.5 font-sans">
              Fecha y Hora *
            </label>
            <input
              type="datetime-local"
              required
              value={dateTime}
              onChange={(e) => setDateTime(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-stone-light bg-cream text-forest text-sm font-sans focus:outline-none focus:border-forest transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-forest mb-1.5 font-sans">
              Precio COP (0 = Consultar) *
            </label>
            <input
              type="number"
              min="0"
              step="500"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-stone-light bg-cream text-forest text-sm font-sans focus:outline-none focus:border-forest transition-colors"
            />
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

      <Button
        type="submit"
        size="lg"
        disabled={loading}
        className="w-full shadow-lg font-semibold py-4"
      >
        {loading ? "Publicando en Supabase..." : "Publicar Evento en PaDónde"}
      </Button>
    </form>
  );
}
