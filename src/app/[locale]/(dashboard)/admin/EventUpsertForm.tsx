"use client";

import { useState, useRef, useEffect, useMemo, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Link } from "@/i18n/routing";
import { CATEGORIAS_EVENTOS, getCategoria } from "@/constants";
import {
  isoADatetimeLocalColombia,
  parseLocalColombiaAISO,
  extraerRecurrencia,
  limpiarDescripcionRecurrencia,
  inyectarRecurrencia,
  formatearDiasRecurrencia,
  getDayOfWeekColombia,
  getFechaYMDDesdeISO,
  extraerGoogleReviewUrl,
} from "@/lib/utils";
import {
  uploadEventImage,
  uploadEventVideo,
  uploadMenuDocument,
  extractVideoThumbnail,
} from "@/lib/supabase/storage";
import {
  adminPublishEventAction,
  editarEventoAdminAction,
  eliminarEventoAdminAction,
} from "./actions";
import { Button } from "@/components/ui/Button";
import { ModalAsistenteEvento } from "./ModalAsistenteEvento";
import { ModalAficheImprimible } from "@/components/admin/ModalAficheImprimible";
import type { EventoExtraido } from "@/lib/eventoParser";
import type { CategoriaEvento } from "@/lib/types";
import type { EventoAdminItem } from "./AdminEventList";

export interface AliadoResumen {
  id: string;
  nombre: string;
  whatsapp: string;
  instagram?: string | null;
  categoria?: string;
  zonaSlug?: string;
  zonaNombre?: string;
  activo?: boolean;
  google_rating?: number | null;
  google_total_reviews?: number | null;
  google_maps_url?: string | null;
  google_review_url?: string | null;
}

export interface EventUpsertFormProps {
  mode: "crear" | "editar";
  initialEvento?: EventoAdminItem | null;
  initialNegocio?: {
    id?: string;
    nombre: string;
    whatsapp: string;
    instagram?: string | null;
    categoria?: string;
    zonaSlug?: string;
  } | null;
  aliados?: AliadoResumen[];
  negocios?: { id: string; nombre: string }[];
  defaultZona?: string;
  isModal?: boolean;
  onSuccess?: (eventoGuardado: any) => void;
  onClose?: () => void;
  onDeleted?: (eventoId: string) => void;
}

export function EventUpsertForm({
  mode,
  initialEvento,
  initialNegocio,
  aliados = [],
  negocios = [],
  defaultZona = "minca",
  isModal = false,
  onSuccess,
  onClose,
  onDeleted,
}: EventUpsertFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // 1. Estado de Zona y Aliado / Negocio
  const [zonaSlug, setZonaSlug] = useState<string>(() => {
    if (initialEvento) {
      return initialEvento.zona_id === "zona-mendihuaca" ||
        (initialEvento as any).zonaSlug === "mendihuaca"
        ? "mendihuaca"
        : defaultZona || "minca";
    }
    return initialNegocio?.zonaSlug || defaultZona || "minca";
  });

  const [selectedAliadoId, setSelectedAliadoId] = useState<string | null>(() => {
    if (initialEvento) {
      return initialEvento.negocio_id || (initialEvento.negocio as any)?.id || null;
    }
    return initialNegocio?.id || null;
  });

  const [businessName, setBusinessName] = useState(() => {
    if (initialEvento) return initialEvento.negocio?.nombre || "";
    return initialNegocio?.nombre || "";
  });

  const [whatsapp, setWhatsapp] = useState(() => {
    if (initialEvento) return initialEvento.negocio?.whatsapp || "";
    return initialNegocio?.whatsapp || "";
  });

  const [instagram, setInstagram] = useState(() => {
    if (initialEvento) return (initialEvento.negocio as any)?.instagram || "";
    return initialNegocio?.instagram || "";
  });

  // Dropdown de búsqueda de aliados
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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
      const matchIg = a.instagram ? a.instagram.toLowerCase().includes(q) : false;
      const matchCat = a.categoria ? a.categoria.toLowerCase().includes(q) : false;
      return matchNombre || matchWp || matchIg || matchCat;
    });
  }, [aliados, businessName]);

  function handleSelectAliado(aliado: AliadoResumen) {
    setSelectedAliadoId(aliado.id);
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
    if (aliado.google_rating) {
      setRatingGoogle(aliado.google_rating.toString());
    }
    if (aliado.google_total_reviews) {
      setReviewsGoogle(aliado.google_total_reviews.toString());
    }
    if (aliado.google_maps_url) {
      setMapsUrl(aliado.google_maps_url);
    }
    if (aliado.google_review_url) {
      setGoogleReviewUrl(aliado.google_review_url);
    }
    setIsDropdownOpen(false);
  }

  // 2. Información Básica del Evento
  const [eventTitle, setEventTitle] = useState(initialEvento?.titulo || "");
  const [category, setCategory] = useState<CategoriaEvento>(
    (initialEvento?.tipo as CategoriaEvento) ||
      (initialNegocio?.categoria as CategoriaEvento) ||
      "comida"
  );
  const [price, setPrice] = useState(() => {
    if (initialEvento && initialEvento.precio !== null && initialEvento.precio !== undefined) {
      return initialEvento.precio.toString();
    }
    return "0";
  });
  const [description, setDescription] = useState(initialEvento?.descripcion || "");

  // 3. Fechas y Horarios
  const [dateTime, setDateTime] = useState(() => {
    if (initialEvento?.fecha_inicio) {
      return isoADatetimeLocalColombia(initialEvento.fecha_inicio);
    }
    return "";
  });
  const [tieneFechaFin, setTieneFechaFin] = useState(() => Boolean(initialEvento?.fecha_fin));
  const [fechaFin, setFechaFin] = useState(() => {
    if (initialEvento?.fecha_fin) {
      return isoADatetimeLocalColombia(initialEvento.fecha_fin);
    }
    return "";
  });

  // 4. Recurrencia
  const recInicial = useMemo(
    () => (initialEvento ? extraerRecurrencia(initialEvento.descripcion) : { esRecurrente: false, dias: [] }),
    [initialEvento]
  );
  const diaBaseEvento = useMemo(() => {
    if (dateTime) {
      return getDayOfWeekColombia(getFechaYMDDesdeISO(dateTime));
    }
    return new Date().getDay();
  }, [dateTime]);

  const [esRecurrente, setEsRecurrente] = useState(recInicial.esRecurrente);
  const [diasRecurrentes, setDiasRecurrentes] = useState<number[]>(
    recInicial.dias.length > 0 ? recInicial.dias : [diaBaseEvento]
  );

  function toggleDia(dia: number) {
    setDiasRecurrentes((prev) =>
      prev.includes(dia) ? prev.filter((d) => d !== dia) : [...prev, dia].sort()
    );
  }

  // 5. Fotografía Principal y Portada
  const [file, setFile] = useState<File | null>(null);
  const [previewFoto, setPreviewFoto] = useState<string | null>(initialEvento?.imagen_url || null);
  const [autoExtractedPoster, setAutoExtractedPoster] = useState<File | null>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) {
      setFile(f);
      setPreviewFoto(URL.createObjectURL(f));
      setAutoExtractedPoster(null);
    }
  }

  // 6. Galería de Fotos Adicionales (Carrusel de Vitrina - Habilitado en Crear y Editar)
  const [galeriaFotos, setGaleriaFotos] = useState<string[]>(
    initialEvento?.metadata_hospedaje?.galeria_fotos || []
  );
  const [subiendoFotoGaleria, setSubiendoFotoGaleria] = useState(false);

  async function handleAgregarFotosGaleria(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    if (galeriaFotos.length + files.length > 5) {
      alert("Puedes agregar un máximo de 5 fotos adicionales (total de 6 fotos con la portada) para garantizar velocidad máxima de carga.");
      return;
    }

    setSubiendoFotoGaleria(true);
    try {
      for (const f of files) {
        const url = await uploadEventImage(f);
        if (url) {
          setGaleriaFotos((prev) => [...prev, url]);
        }
      }
    } catch (err: any) {
      alert("Error al subir fotografía de vitrina: " + (err?.message || "intenta de nuevo"));
    } finally {
      setSubiendoFotoGaleria(false);
      e.target.value = "";
    }
  }

  function handleEliminarFotoGaleria(indexAEliminar: number) {
    setGaleriaFotos((prev) => prev.filter((_, i) => i !== indexAEliminar));
  }

  // 7. Video / Reel
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState(initialEvento?.video_url || "");
  const [videoNombre, setVideoNombre] = useState<string | null>(null);
  const [mostrarUrlDirecta, setMostrarUrlDirecta] = useState(Boolean(initialEvento?.video_url));

  async function handleVideoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) {
      setVideoFile(f);
      setVideoNombre(f.name);

      // Si no hay foto fija cargada, extraer automáticamente el primer fotograma
      if (!file && !previewFoto) {
        try {
          const poster = await extractVideoThumbnail(f);
          if (poster) {
            setAutoExtractedPoster(poster);
            setPreviewFoto(URL.createObjectURL(poster));
          }
        } catch (err) {
          console.warn("No se pudo extraer miniatura automática del video:", err);
        }
      }
    }
  }

  // 8. Menú Digital, Carta Interactiva y Páginas del Menú en Fotos
  const isLazyCat =
    initialEvento?.id === "a9cb4306-82f5-4784-b6d3-546b6d10f5ec" ||
    (businessName || "").toLowerCase().includes("lazy cat") ||
    (eventTitle || "").toLowerCase().includes("lazy cat");

  const [menuInteractivo, setMenuInteractivo] = useState<boolean>(() => {
    if (initialEvento?.metadata_hospedaje?.menu_interactivo !== undefined) {
      return Boolean(initialEvento.metadata_hospedaje.menu_interactivo);
    }
    return isLazyCat;
  });

  const [menuTema, setMenuTema] = useState<"fogon" | "sierra" | "caribe" | "oro">(() => {
    return (
      (initialEvento?.metadata_hospedaje?.menu_tema as any) ||
      (isLazyCat ? "fogon" : "fogon")
    );
  });

  const [menuUrl, setMenuUrl] = useState(initialEvento?.metadata_hospedaje?.menu_url || "");
  const [menuFotos, setMenuFotos] = useState<string[]>(
    initialEvento?.metadata_hospedaje?.menu_fotos &&
      initialEvento.metadata_hospedaje.menu_fotos.length > 0
      ? initialEvento.metadata_hospedaje.menu_fotos
      : []
  );
  const [subiendoFotoMenu, setSubiendoFotoMenu] = useState(false);
  const [subiendoPdfMenu, setSubiendoPdfMenu] = useState(false);

  async function handleAgregarFotosMenu(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    if (menuFotos.length + files.length > 10) {
      alert("Puedes agregar un máximo de 10 páginas para la carta digital.");
      return;
    }

    setSubiendoFotoMenu(true);
    try {
      for (const f of files) {
        const url = await uploadMenuDocument(f);
        if (url) {
          setMenuFotos((prev) => [...prev, url]);
        }
      }
    } catch (err: any) {
      alert("Error al subir foto de la carta: " + (err?.message || "intenta de nuevo"));
    } finally {
      setSubiendoFotoMenu(false);
      e.target.value = "";
    }
  }

  function handleEliminarFotoMenu(indexAEliminar: number) {
    setMenuFotos((prev) => prev.filter((_, i) => i !== indexAEliminar));
  }

  async function handleSubirPdfMenu(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setSubiendoPdfMenu(true);
    try {
      const url = await uploadMenuDocument(f);
      if (url) {
        setMenuUrl(url);
      }
    } catch (err: any) {
      alert("Error al subir archivo PDF: " + (err?.message || "intenta de nuevo"));
    } finally {
      setSubiendoPdfMenu(false);
      e.target.value = "";
    }
  }

  // 9. Calificación / Reputación Google Maps (Sincronizada)
  const [ratingGoogle, setRatingGoogle] = useState(
    initialEvento?.metadata_hospedaje?.google_reputacion?.rating?.toString() || ""
  );
  const [reviewsGoogle, setReviewsGoogle] = useState(
    initialEvento?.metadata_hospedaje?.google_reputacion?.total_reviews?.toString() || ""
  );
  const [mapsUrl, setMapsUrl] = useState(
    initialEvento?.metadata_hospedaje?.google_reputacion?.maps_url || ""
  );
  const [googleReviewUrl, setGoogleReviewUrl] = useState(
    initialEvento?.metadata_hospedaje?.google_review_url || ""
  );

  // 10. Opciones de Publicación / Estados
  const [isFeatured, setIsFeatured] = useState(Boolean(initialEvento?.destacado));
  const [isActive, setIsActive] = useState(
    initialEvento?.activo !== undefined ? Boolean(initialEvento.activo) : true
  );

  // Estados UI
  const [loading, setLoading] = useState(false);
  const [guardadoExito, setGuardadoExito] = useState(false);
  const [createdEventId, setCreatedEventId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [confirmarEliminar, setConfirmarEliminar] = useState(false);
  const [mostrarHabladorMesa, setMostrarHabladorMesa] = useState(false);
  const [mostrarAsistenteIA, setMostrarAsistenteIA] = useState(false);

  // Callback del Asistente IA
  function handleDatosAsistenteExtraidos(datos: EventoExtraido) {
    if (datos.titulo) setEventTitle(datos.titulo);
    if (datos.categoria) setCategory(datos.categoria);
    if (datos.dateTime) setDateTime(datos.dateTime);
    if (datos.fechaFin) {
      setFechaFin(datos.fechaFin);
      setTieneFechaFin(true);
    }
    if (datos.precio !== null && datos.precio !== undefined) {
      setPrice(datos.precio.toString());
    }
    if (datos.descripcion) setDescription(datos.descripcion);
    if (datos.businessName && !businessName) setBusinessName(datos.businessName);
    if (datos.whatsapp && !whatsapp) setWhatsapp(datos.whatsapp);
    if (datos.instagram && !instagram) setInstagram(datos.instagram);
    if (datos.esRecurrente !== undefined) setEsRecurrente(datos.esRecurrente);
    if (datos.diasRecurrentes && datos.diasRecurrentes.length > 0) {
      setDiasRecurrentes(datos.diasRecurrentes);
    }
  }

  // Submit Handler Unificado (Upsert Canónico)
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      let finalImgUrl: string | undefined = previewFoto || undefined;
      let finalVidUrl: string | null = videoUrl || null;

      // 1. Subida de Portada
      if (file) {
        const uploaded = await uploadEventImage(file);
        if (uploaded) finalImgUrl = uploaded;
      } else if (autoExtractedPoster) {
        const uploadedPoster = await uploadEventImage(autoExtractedPoster);
        if (uploadedPoster) finalImgUrl = uploadedPoster;
      }

      // 2. Subida de Video
      if (videoFile) {
        const uploadedVideo = await uploadEventVideo(videoFile);
        if (uploadedVideo) finalVidUrl = uploadedVideo;
      }

      // 3. Construcción de Recurrencia
      const diasFinales =
        diasRecurrentes.length > 0
          ? diasRecurrentes
          : [dateTime ? getDayOfWeekColombia(getFechaYMDDesdeISO(dateTime)) : 5];

      const descripcionFinal = esRecurrente
        ? inyectarRecurrencia(description, diasFinales)
        : limpiarDescripcionRecurrencia(description);

      // 4. Construcción de Reputación Google
      const googleReputacion =
        ratingGoogle && reviewsGoogle && mapsUrl
          ? {
              rating: parseFloat(ratingGoogle),
              total_reviews: parseInt(reviewsGoogle, 10),
              maps_url: mapsUrl.trim(),
            }
          : null;

      const reviewUrlFinal =
        googleReviewUrl.includes("search.google.com/local/writereview") ||
        googleReviewUrl.includes("g.page/r/")
          ? googleReviewUrl.trim()
          : extraerGoogleReviewUrl(googleReviewUrl) ||
            extraerGoogleReviewUrl(mapsUrl) ||
            googleReviewUrl.trim() ||
            undefined;

      if (mode === "crear") {
        // MODO CREAR: INSERT Consolidado con arrays listos
        const res = await adminPublishEventAction({
          negocioId: selectedAliadoId || undefined,
          businessName: businessName.trim(),
          whatsapp: whatsapp.trim(),
          instagram: instagram.trim() || null,
          eventTitle: eventTitle.trim(),
          category,
          dateTime: dateTime || new Date().toISOString(),
          fechaFin: tieneFechaFin && fechaFin ? fechaFin : null,
          price: parseFloat(price) || 0,
          description: descripcionFinal,
          imageUrl: finalImgUrl,
          videoUrl: finalVidUrl || undefined,
          isFeatured,
          zonaSlug,
          googleReputacion: googleReputacion || undefined,
          galeriaFotos: galeriaFotos.length > 0 ? galeriaFotos : undefined,
          menuUrl: menuUrl.trim() || undefined,
          menuFotos: menuFotos.length > 0 ? menuFotos : undefined,
          googleReviewUrl: reviewUrlFinal,
          menuInteractivo,
          menuTema,
        });

        if (!res.success) {
          setError(res.error || "Ocurrió un error al registrar el evento.");
          setLoading(false);
          return;
        }

        setGuardadoExito(true);
        setCreatedEventId(res.eventId || null);

        if (onSuccess) {
          onSuccess(res);
        }
      } else {
        // MODO EDITAR: UPDATE con Merge Seguro (WHERE id = target_id)
        if (!initialEvento?.id) {
          throw new Error("No se proporcionó el ID único del evento a editar.");
        }

        const res = await editarEventoAdminAction({
          eventoId: initialEvento.id,
          titulo: eventTitle.trim(),
          descripcion: descripcionFinal || null,
          tipo: category,
          precio: parseFloat(price) || 0,
          dateTime: dateTime || initialEvento.fecha_inicio,
          fechaFin: tieneFechaFin && fechaFin ? fechaFin : null,
          imageUrl: finalImgUrl || undefined,
          videoUrl: finalVidUrl,
          destacado: isFeatured,
          activo: isActive,
          negocioId: selectedAliadoId || initialEvento.negocio_id,
          googleReputacion: googleReputacion || undefined,
          galeriaFotos: galeriaFotos.length > 0 ? galeriaFotos : undefined,
          googleReviewUrl: reviewUrlFinal,
          menuFotos: menuFotos.length > 0 ? menuFotos : undefined,
          menuUrl: menuUrl.trim() || undefined,
          menuInteractivo,
          menuTema,
        });

        if (!res.success) {
          setError(res.error || "No se pudo actualizar el evento.");
          setLoading(false);
          return;
        }

        setGuardadoExito(true);

        const negocioSeleccionado =
          aliados.find((a) => a.id === selectedAliadoId) ||
          negocios.find((n) => n.id === selectedAliadoId);

        setTimeout(() => {
          if (onSuccess) {
            onSuccess({
              id: initialEvento.id,
              titulo: eventTitle.trim(),
              descripcion: descripcionFinal || null,
              tipo: category,
              precio: parseFloat(price) || 0,
              fecha_inicio: parseLocalColombiaAISO(dateTime || initialEvento.fecha_inicio),
              fecha_fin: tieneFechaFin && fechaFin ? parseLocalColombiaAISO(fechaFin) : null,
              destacado: isFeatured,
              activo: isActive,
              imagen_url: finalImgUrl || initialEvento.imagen_url,
              video_url: finalVidUrl,
              negocio_id: selectedAliadoId || initialEvento.negocio_id,
              metadata_hospedaje: {
                ...(initialEvento.metadata_hospedaje || {}),
                google_reputacion: googleReputacion || undefined,
                galeria_fotos: galeriaFotos.length > 0 ? galeriaFotos : undefined,
                menu_fotos: menuFotos.length > 0 ? menuFotos : undefined,
                menu_url: menuUrl.trim() || undefined,
                google_review_url: reviewUrlFinal,
                menu_interactivo: menuInteractivo,
                menu_tema: menuTema,
              },
              negocio: negocioSeleccionado
                ? {
                    id: negocioSeleccionado.id,
                    nombre: negocioSeleccionado.nombre,
                    whatsapp: (negocioSeleccionado as any).whatsapp || whatsapp,
                  }
                : initialEvento.negocio,
            });
          }
          router.refresh();
          if (onClose) onClose();
        }, 700);
      }
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Error inesperado al conectar con el servidor.");
    } finally {
      setLoading(false);
    }
  }

  // Eliminar Evento (Solo modo Editar)
  async function handleEliminar() {
    if (!initialEvento?.id) return;
    setDeleting(true);
    setError(null);
    try {
      const res = await eliminarEventoAdminAction(initialEvento.id);
      if (!res.success) {
        setError(res.error || "No se pudo eliminar el evento.");
        setDeleting(false);
        return;
      }
      if (onDeleted) onDeleted(initialEvento.id);
      if (onClose) onClose();
      router.refresh();
    } catch (err: any) {
      setError(err?.message || "Error al eliminar el evento.");
      setDeleting(false);
    }
  }

  // Vista de Éxito en Pantalla Completa (Modo Crear)
  if (createdEventId && !isModal) {
    return (
      <div className="bg-white/90 backdrop-blur-md rounded-3xl p-8 border border-stone-light text-center space-y-6 shadow-sm">
        <div className="w-16 h-16 rounded-full bg-forest text-cream flex items-center justify-center text-3xl mx-auto">
          🌿
        </div>
        <div>
          <h2 className="font-serif text-2xl text-forest font-bold">¡Evento publicado exitosamente!</h2>
          <p className="font-sans text-xs text-stone mt-1.5">
            El plan ya está activo y visible en vivo en la cartelera de{" "}
            <span className="font-semibold text-forest capitalize">{zonaSlug}</span>.
          </p>
        </div>

        <div className="space-y-3 pt-2">
          <Link
            href={`/${zonaSlug}/${createdEventId}`}
            className="block w-full py-3 px-4 rounded-xl bg-forest text-cream text-sm font-sans font-medium text-center hover:bg-forest/90 transition-all shadow-xs"
            target="_blank"
          >
            Ver Evento en Vivo ↗
          </Link>

          <button
            type="button"
            onClick={() => {
              setCreatedEventId(null);
              setEventTitle("");
              setDescription("");
              setPrice("0");
              setDateTime("");
              setFile(null);
              setPreviewFoto(null);
              setGaleriaFotos([]);
              setVideoFile(null);
              setVideoUrl("");
            }}
            className="block w-full py-2.5 px-4 rounded-xl border border-stone-light text-stone text-xs font-sans hover:text-forest transition-colors"
          >
            + Publicar Otro Evento
          </button>

          <Link
            href="/admin"
            className="block text-center text-xs font-sans text-stone hover:text-forest pt-1"
          >
            Volver a la Cartelera Admin
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Cabecera / Modal Top Bar */}
      {isModal && (
        <div className="flex items-center justify-between pb-4 border-b border-stone-light/70">
          <div className="flex items-center gap-2">
            <span className="text-xl">✏️</span>
            <div>
              <h2 className="font-serif text-lg sm:text-xl font-bold text-forest">
                {mode === "editar" ? "Editar Evento" : "Nuevo Evento"}
              </h2>
              <p className="font-sans text-[11px] text-stone">
                {mode === "editar"
                  ? `Modificando registro: ${initialEvento?.titulo || "Evento"}`
                  : "Completa la información oficial para publicar en la cartelera."}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {mode === "editar" && (
              <button
                type="button"
                onClick={() => setMostrarHabladorMesa(true)}
                className="px-2.5 py-1.5 rounded-xl border border-forest/30 bg-forest/5 text-forest font-sans text-xs font-semibold hover:bg-forest/10 flex items-center gap-1.5 cursor-pointer shadow-2xs"
                title="Generar hablador de mesa QR para imprimir"
              >
                <span>🖨️</span>
                <span className="hidden sm:inline">Afiche QR</span>
              </button>
            )}

            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-full border border-stone-light/80 flex items-center justify-center text-stone hover:text-forest text-sm cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      )}

      {/* Botón de Asistente IA */}
      <div className="bg-gradient-to-r from-forest/5 via-forest/10 to-transparent p-3.5 rounded-2xl border border-forest/20 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="text-xl">✨</span>
          <div>
            <p className="font-sans text-xs font-bold text-forest">Asistente IA de Extracción</p>
            <p className="font-sans text-[11px] text-stone">
              Pega un texto de WhatsApp o Instagram para rellenar los campos automáticamente.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setMostrarAsistenteIA(true)}
          className="px-3 py-1.5 rounded-xl bg-forest text-cream font-sans text-xs font-semibold hover:bg-forest/90 transition-all shrink-0 cursor-pointer shadow-2xs"
        >
          Pegar Copy
        </button>
      </div>

      {/* 1. SELECCIÓN DE REGIÓN Y NEGOCIO / ORGANIZADOR */}
      <div className="bg-white/80 p-4 sm:p-5 rounded-3xl border border-stone-light/70 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b border-stone-light/40 pb-2.5">
          <h3 className="font-serif text-sm font-bold text-forest uppercase tracking-wider flex items-center gap-1.5">
            <span>📍</span> 1. Región y Aliado
          </h3>
          {selectedAliadoId && (
            <span className="text-[10px] bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.5 rounded-full font-sans">
              ✓ Aliado Vinculado
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 font-sans">
          {/* Selector de Región / Zona */}
          <div>
            <label className="block text-xs font-semibold text-forest mb-1">Región / Destino *</label>
            <select
              value={zonaSlug}
              onChange={(e) => setZonaSlug(e.target.value)}
              className="w-full p-2.5 text-xs bg-white rounded-xl border border-stone-light/80 text-forest font-medium outline-none cursor-pointer"
            >
              <option value="minca">🌿 Minca (Sierra Nevada)</option>
              <option value="mendihuaca">🌊 Mendihuaca (Caribe & Surf)</option>
            </select>
          </div>

          {/* Buscador de Negocio / Aliado con Autocompletado */}
          <div className="relative" ref={dropdownRef}>
            <label className="block text-xs font-semibold text-forest mb-1">
              Nombre del Aliado / Negocio *
            </label>
            <input
              type="text"
              value={businessName}
              onChange={(e) => {
                setBusinessName(e.target.value);
                setSelectedAliadoId(null);
                setIsDropdownOpen(true);
              }}
              onFocus={() => setIsDropdownOpen(true)}
              placeholder="Buscar aliado existente o escribir nuevo..."
              className="w-full p-2.5 text-xs bg-white rounded-xl border border-stone-light/80 text-forest placeholder:text-stone/60 outline-none focus:ring-1 focus:ring-forest"
              required
            />

            {/* Dropdown flotante */}
            {isDropdownOpen && aliadosFiltrados.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-1.5 max-h-56 overflow-y-auto bg-white rounded-2xl border border-stone-light/80 shadow-lg z-30 divide-y divide-stone-light/40">
                {aliadosFiltrados.map((a) => (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => handleSelectAliado(a)}
                    className="w-full text-left p-2.5 hover:bg-forest/5 flex items-center justify-between text-xs transition-colors cursor-pointer"
                  >
                    <div>
                      <span className="font-semibold text-forest block">{a.nombre}</span>
                      <span className="text-[10px] text-stone">
                        {a.categoria || "Negocio"} • {a.zonaNombre || a.zonaSlug || "Minca"}
                      </span>
                    </div>
                    {a.whatsapp && (
                      <span className="text-[10px] text-emerald-700 font-mono bg-emerald-50 px-1.5 py-0.5 rounded">
                        +{a.whatsapp.slice(-4)}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* WhatsApp del Negocio */}
          <div>
            <label className="block text-xs font-semibold text-forest mb-1">
              WhatsApp de Reservas *
            </label>
            <input
              type="tel"
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              placeholder="573001234567"
              className="w-full p-2.5 text-xs bg-white rounded-xl border border-stone-light/80 text-forest font-mono outline-none focus:ring-1 focus:ring-forest"
              required
            />
          </div>

          {/* Instagram */}
          <div>
            <label className="block text-xs font-semibold text-forest mb-1">
              Instagram <span className="text-stone font-normal">(opcional)</span>
            </label>
            <input
              type="text"
              value={instagram}
              onChange={(e) => setInstagram(e.target.value)}
              placeholder="@nombre_del_negocio"
              className="w-full p-2.5 text-xs bg-white rounded-xl border border-stone-light/80 text-forest outline-none focus:ring-1 focus:ring-forest"
            />
          </div>
        </div>
      </div>

      {/* 2. DETALLES DEL EVENTO O EXPERIENCIA */}
      <div className="bg-white/80 p-4 sm:p-5 rounded-3xl border border-stone-light/70 shadow-2xs space-y-4">
        <h3 className="font-serif text-sm font-bold text-forest uppercase tracking-wider flex items-center gap-1.5 border-b border-stone-light/40 pb-2.5">
          <span>🌿</span> 2. Detalles del Evento
        </h3>

        <div className="space-y-3.5 font-sans">
          {/* Título */}
          <div>
            <label className="block text-xs font-semibold text-forest mb-1">
              Título del Evento o Propuesta *
            </label>
            <input
              type="text"
              value={eventTitle}
              onChange={(e) => setEventTitle(e.target.value)}
              placeholder="Ej. Tarde de Cócteles al Atardecer & DJ Set"
              className="w-full p-2.5 text-xs bg-white rounded-xl border border-stone-light/80 text-forest font-medium outline-none focus:ring-1 focus:ring-forest"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Categoría */}
            <div>
              <label className="block text-xs font-semibold text-forest mb-1">Categoría *</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as CategoriaEvento)}
                className="w-full p-2.5 text-xs bg-white rounded-xl border border-stone-light/80 text-forest font-medium outline-none cursor-pointer"
              >
                {CATEGORIAS_EVENTOS.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.emoji} {c.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Precio */}
            <div>
              <label className="block text-xs font-semibold text-forest mb-1">
                Precio (COP) — 0 para Entrada Libre
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone text-xs">$</span>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-full pl-7 pr-3 py-2.5 text-xs bg-white rounded-xl border border-stone-light/80 text-forest font-mono outline-none focus:ring-1 focus:ring-forest"
                />
              </div>
            </div>
          </div>

          {/* Chips de Precio Rápido */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <span className="text-[10px] text-stone font-medium mr-1">Precios rápidos:</span>
            {[0, 15000, 25000, 35000, 50000].map((val) => (
              <button
                key={val}
                type="button"
                onClick={() => setPrice(val.toString())}
                className={`text-[10px] px-2 py-0.5 rounded-lg border transition-all cursor-pointer ${
                  price === val.toString()
                    ? "bg-forest text-cream border-forest font-bold"
                    : "bg-stone-light/20 text-stone hover:text-forest border-stone-light/60"
                }`}
              >
                {val === 0 ? "Gratis" : `$${val.toLocaleString("es-CO")}`}
              </button>
            ))}
          </div>

          {/* Descripción */}
          <div>
            <label className="block text-xs font-semibold text-forest mb-1">
              Descripción del Evento <span className="text-stone font-normal">(opcional)</span>
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe la experiencia, qué incluye, el ambiente o requisitos especiales..."
              className="w-full p-2.5 text-xs bg-white rounded-xl border border-stone-light/80 text-forest outline-none focus:ring-1 focus:ring-forest leading-relaxed"
            />
          </div>
        </div>
      </div>

      {/* 3. FECHAS Y RECURRENCIA */}
      <div className="bg-white/80 p-4 sm:p-5 rounded-3xl border border-stone-light/70 shadow-2xs space-y-4">
        <h3 className="font-serif text-sm font-bold text-forest uppercase tracking-wider flex items-center gap-1.5 border-b border-stone-light/40 pb-2.5">
          <span>🗓️</span> 3. Fechas y Horarios
        </h3>

        <div className="space-y-3.5 font-sans">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Fecha y Hora de Inicio */}
            <div>
              <label className="block text-xs font-semibold text-forest mb-1">
                Fecha y Hora de Inicio *
              </label>
              <input
                type="datetime-local"
                value={dateTime}
                onChange={(e) => setDateTime(e.target.value)}
                className="w-full p-2.5 text-xs bg-white rounded-xl border border-stone-light/80 text-forest font-medium outline-none focus:ring-1 focus:ring-forest"
                required
              />
            </div>

            {/* Fecha de Fin Opcional */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-forest">Fecha de Fin</label>
                <button
                  type="button"
                  onClick={() => setTieneFechaFin(!tieneFechaFin)}
                  className="text-[10px] text-forest underline cursor-pointer"
                >
                  {tieneFechaFin ? "Quitar fecha fin" : "+ Agregar fecha fin"}
                </button>
              </div>
              {tieneFechaFin ? (
                <input
                  type="datetime-local"
                  value={fechaFin}
                  onChange={(e) => setFechaFin(e.target.value)}
                  className="w-full p-2.5 text-xs bg-white rounded-xl border border-stone-light/80 text-forest font-medium outline-none focus:ring-1 focus:ring-forest"
                />
              ) : (
                <div className="p-2.5 rounded-xl border border-dashed border-stone-light text-[11px] text-stone text-center">
                  Evento de un solo día o sesión
                </div>
              )}
            </div>
          </div>

          {/* Toggle de Recurrencia */}
          <div className="pt-2 border-t border-stone-light/40">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={esRecurrente}
                onChange={(e) => setEsRecurrente(e.target.checked)}
                className="rounded text-forest focus:ring-forest w-4 h-4 cursor-pointer"
              />
              <span className="text-xs font-semibold text-forest">
                🔄 Es un evento recurrente (se repite semanalmente)
              </span>
            </label>

            {esRecurrente && (
              <div className="mt-3 p-3 bg-stone-light/20 rounded-2xl space-y-2">
                <span className="text-[11px] text-stone block font-medium">
                  Selecciona los días en que se repite:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { id: 1, label: "Lun" },
                    { id: 2, label: "Mar" },
                    { id: 3, label: "Mié" },
                    { id: 4, label: "Jue" },
                    { id: 5, label: "Vie" },
                    { id: 6, label: "Sáb" },
                    { id: 0, label: "Dom" },
                  ].map((dia) => (
                    <button
                      key={dia.id}
                      type="button"
                      onClick={() => toggleDia(dia.id)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        diasRecurrentes.includes(dia.id)
                          ? "bg-forest text-cream shadow-2xs"
                          : "bg-white text-stone border border-stone-light/80 hover:text-forest"
                      }`}
                    >
                      {dia.label}
                    </button>
                  ))}
                </div>
                {diasRecurrentes.length > 0 && (
                  <p className="text-[10px] text-emerald-800 font-medium pt-1">
                    ✓ Se mostrará los {formatearDiasRecurrencia(diasRecurrentes).toLowerCase()}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 4. MULTIMEDIA: FOTO PRINCIPAL Y GALERÍA COMPLETA (PARIDAD TOTAL) */}
      <div className="bg-white/80 p-4 sm:p-5 rounded-3xl border border-stone-light/70 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b border-stone-light/40 pb-2.5">
          <h3 className="font-serif text-sm font-bold text-forest uppercase tracking-wider flex items-center gap-1.5">
            <span>📷</span> 4. Fotografía y Galería de Vitrina
          </h3>
          <span className="text-[10px] text-stone font-mono">
            {galeriaFotos.length + (previewFoto ? 1 : 0)} / 6 fotos
          </span>
        </div>

        <div className="space-y-4 font-sans">
          {/* A. Foto de Portada */}
          <div>
            <label className="block text-xs font-semibold text-forest mb-1.5">
              Fotografía Principal (Portada) *
            </label>

            <div className="flex items-center gap-4">
              {previewFoto ? (
                <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden border border-stone-light/80 shrink-0 shadow-2xs group">
                  <Image
                    src={previewFoto}
                    alt="Foto de portada"
                    fill
                    className="object-cover group-hover:scale-105 transition-transform"
                  />
                  <label className="absolute inset-0 bg-black/40 text-white text-[10px] font-semibold flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                    Cambiar
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                </div>
              ) : (
                <label className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl border-2 border-dashed border-forest/30 hover:border-forest/60 bg-forest/5 flex flex-col items-center justify-center text-center p-2 cursor-pointer transition-colors shrink-0">
                  <span className="text-xl">📸</span>
                  <span className="text-[10px] font-bold text-forest mt-1">Subir Foto</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
              )}

              <div className="text-xs text-stone space-y-1">
                <p className="font-semibold text-forest">Esta es la foto destacada en la cartelera.</p>
                <p className="text-[11px] leading-relaxed">
                  Formato WebP, JPG o PNG. Se comprime automáticamente para una carga ultra rápida en teléfonos móviles de turistas.
                </p>
                {previewFoto && (
                  <label className="inline-block text-[11px] text-forest underline cursor-pointer pt-1">
                    Seleccionar otra foto
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            </div>
          </div>

          {/* B. Galería de Fotos Adicionales (Carrusel de Vitrina) */}
          <div className="pt-3 border-t border-stone-light/40 space-y-2.5">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-xs font-semibold text-forest flex items-center gap-1.5">
                  <span>📸</span> Galería Adicional de Vitrina ({galeriaFotos.length}/5)
                </label>
                <p className="text-[11px] text-stone">
                  Crea el carrusel swipeable para que los viajeros vean platos, ambiente y detalles.
                </p>
              </div>

              {subiendoFotoGaleria && (
                <span className="text-[11px] text-terra font-semibold animate-pulse">
                  Subiendo fotografías...
                </span>
              )}
            </div>

            {/* Grid de fotos cargadas en la galería */}
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5">
              {galeriaFotos.map((fotoUrl, idx) => (
                <div
                  key={idx}
                  className="relative aspect-square rounded-2xl overflow-hidden border border-stone-light/80 shadow-2xs group"
                >
                  <Image
                    src={fotoUrl}
                    alt={`Foto vitrina ${idx + 1}`}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform"
                  />
                  <button
                    type="button"
                    onClick={() => handleEliminarFotoGaleria(idx)}
                    className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/70 hover:bg-red-600 text-white text-[10px] flex items-center justify-center transition-colors cursor-pointer shadow"
                    title="Eliminar esta foto"
                  >
                    ✕
                  </button>
                  <span className="absolute bottom-1 left-1 bg-black/60 text-white font-mono text-[9px] px-1 rounded">
                    #{idx + 1}
                  </span>
                </div>
              ))}

              {/* Botón para subir fotos a la galería */}
              {galeriaFotos.length < 5 && (
                <label className="aspect-square rounded-2xl border-2 border-dashed border-stone-light/80 hover:border-forest/60 bg-stone-light/10 flex flex-col items-center justify-center text-center p-2 cursor-pointer transition-colors">
                  <span className="text-lg">＋</span>
                  <span className="text-[10px] font-bold text-forest mt-0.5">
                    {galeriaFotos.length === 0 ? "Agregar Fotos" : "+ Otra Foto"}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    disabled={subiendoFotoGaleria}
                    onChange={handleAgregarFotosGaleria}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          </div>

          {/* C. Video / Reel (Opcional) */}
          <div className="pt-3 border-t border-stone-light/40 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-forest flex items-center gap-1.5">
                <span>🎬</span> Video Reel Vertical <span className="text-stone font-normal">(opcional)</span>
              </label>
              <button
                type="button"
                onClick={() => setMostrarUrlDirecta(!mostrarUrlDirecta)}
                className="text-[10px] text-forest underline cursor-pointer"
              >
                {mostrarUrlDirecta ? "Subir archivo MP4" : "Ingresar URL directa"}
              </button>
            </div>

            {mostrarUrlDirecta ? (
              <input
                type="url"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                placeholder="https://... o enlace de Supabase Storage"
                className="w-full p-2.5 text-xs bg-white rounded-xl border border-stone-light/80 text-forest outline-none focus:ring-1 focus:ring-forest"
              />
            ) : (
              <div className="flex items-center gap-3">
                <label className="px-3 py-2 rounded-xl border border-stone-light/80 bg-stone-light/20 hover:bg-stone-light/40 text-forest text-xs font-medium cursor-pointer transition-colors shrink-0">
                  <span>📁 Seleccionar Video (MP4)</span>
                  <input
                    type="file"
                    accept="video/mp4,video/quicktime,video/webm"
                    onChange={handleVideoChange}
                    className="hidden"
                  />
                </label>
                {videoNombre && (
                  <span className="text-xs text-forest font-medium truncate">
                    ✓ {videoNombre}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 5. CARTA / MENÚ DIGITAL (PÁGINAS EN FOTOS, PDF Y TEMA) */}
      <div className="bg-white/80 p-4 sm:p-5 rounded-3xl border border-stone-light/70 shadow-2xs space-y-4">
        <h3 className="font-serif text-sm font-bold text-forest uppercase tracking-wider flex items-center gap-1.5 border-b border-stone-light/40 pb-2.5">
          <span>🍽️</span> 5. Carta y Menú Digital
        </h3>

        <div className="space-y-4 font-sans">
          {/* Toggle Menú Interactivo */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-forest/5 rounded-2xl border border-forest/20">
            <div>
              <label className="text-xs font-bold text-forest flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={menuInteractivo}
                  onChange={(e) => setMenuInteractivo(e.target.checked)}
                  className="rounded text-forest focus:ring-forest w-4 h-4 cursor-pointer"
                />
                <span>Habilitar Menú Digital e Interactivo</span>
              </label>
              <p className="text-[11px] text-stone mt-0.5 ml-6">
                Permite a los comensales ver platos con traductor automático y botón de pedido.
              </p>
            </div>

            {menuInteractivo && (
              <div className="flex items-center gap-1.5 ml-6 sm:ml-0">
                <span className="text-[10px] text-stone font-semibold">Tema:</span>
                <select
                  value={menuTema}
                  onChange={(e) => setMenuTema(e.target.value as any)}
                  className="text-xs p-1.5 rounded-xl border border-stone-light/80 bg-white text-forest font-medium outline-none cursor-pointer"
                >
                  <option value="fogon">🔥 Fogón</option>
                  <option value="sierra">🌿 Sierra</option>
                  <option value="caribe">🌊 Caribe</option>
                  <option value="oro">✨ Oro</option>
                </select>
              </div>
            )}
          </div>

          {/* Páginas de la Carta en Fotos */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-forest flex items-center gap-1.5">
                <span>📸</span> Páginas del Menú en Fotos ({menuFotos.length}/10)
              </label>
              {subiendoFotoMenu && (
                <span className="text-[11px] text-terra font-semibold animate-pulse">
                  Subiendo páginas...
                </span>
              )}
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5">
              {menuFotos.map((fotoUrl, idx) => (
                <div
                  key={idx}
                  className="relative aspect-square rounded-2xl overflow-hidden border border-stone-light/80 shadow-2xs group"
                >
                  <Image
                    src={fotoUrl}
                    alt={`Página de carta ${idx + 1}`}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform"
                  />
                  <button
                    type="button"
                    onClick={() => handleEliminarFotoMenu(idx)}
                    className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/70 hover:bg-red-600 text-white text-[10px] flex items-center justify-center transition-colors cursor-pointer"
                  >
                    ✕
                  </button>
                  <span className="absolute bottom-1 left-1 bg-black/60 text-white font-mono text-[9px] px-1 rounded">
                    Pág. {idx + 1}
                  </span>
                </div>
              ))}

              {menuFotos.length < 10 && (
                <label className="aspect-square rounded-2xl border-2 border-dashed border-stone-light/80 hover:border-forest/60 bg-stone-light/10 flex flex-col items-center justify-center text-center p-2 cursor-pointer transition-colors">
                  <span className="text-lg">＋</span>
                  <span className="text-[10px] font-bold text-forest mt-0.5">
                    {menuFotos.length === 0 ? "Subir Páginas" : "+ Otra Pág."}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    disabled={subiendoFotoMenu}
                    onChange={handleAgregarFotosMenu}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          </div>

          {/* Archivo PDF o URL de Menú */}
          <div className="pt-2 border-t border-stone-light/40 space-y-1.5">
            <label className="block text-xs font-semibold text-forest">
              Archivo PDF o Enlace Directo a Carta
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={menuUrl}
                onChange={(e) => setMenuUrl(e.target.value)}
                placeholder="https://... o sube un archivo PDF"
                className="flex-1 p-2.5 text-xs bg-white rounded-xl border border-stone-light/80 text-forest outline-none focus:ring-1 focus:ring-forest"
              />
              <label className="px-3 py-2.5 rounded-xl border border-stone-light/80 bg-stone-light/20 hover:bg-stone-light/40 text-forest text-xs font-semibold cursor-pointer transition-colors shrink-0">
                <span>{subiendoPdfMenu ? "Subiendo..." : "📄 Subir PDF"}</span>
                <input
                  type="file"
                  accept="application/pdf"
                  disabled={subiendoPdfMenu}
                  onChange={handleSubirPdfMenu}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* 6. REPUTACIÓN DE GOOGLE (OPCIONAL Y SINCRONIZADA) */}
      <div className="bg-white/80 p-4 sm:p-5 rounded-3xl border border-stone-light/70 shadow-2xs space-y-4">
        <h3 className="font-serif text-sm font-bold text-forest uppercase tracking-wider flex items-center gap-1.5 border-b border-stone-light/40 pb-2.5">
          <span>⭐</span> 6. Reputación de Google Maps
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 font-sans">
          <div>
            <label className="block text-xs font-semibold text-forest mb-1">
              Calificación (Rating)
            </label>
            <input
              type="number"
              step="0.1"
              min="1"
              max="5"
              value={ratingGoogle}
              onChange={(e) => setRatingGoogle(e.target.value)}
              placeholder="Ej. 4.8"
              className="w-full p-2.5 text-xs bg-white rounded-xl border border-stone-light/80 text-forest outline-none focus:ring-1 focus:ring-forest"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-forest mb-1">
              Total de Reseñas en Google
            </label>
            <input
              type="number"
              min="0"
              value={reviewsGoogle}
              onChange={(e) => setReviewsGoogle(e.target.value)}
              placeholder="Ej. 182"
              className="w-full p-2.5 text-xs bg-white rounded-xl border border-stone-light/80 text-forest outline-none focus:ring-1 focus:ring-forest"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-forest mb-1">
              Enlace de Google Maps del Establecimiento
            </label>
            <input
              type="url"
              value={mapsUrl}
              onChange={(e) => setMapsUrl(e.target.value)}
              placeholder="https://maps.app.goo.gl/..."
              className="w-full p-2.5 text-xs bg-white rounded-xl border border-stone-light/80 text-forest outline-none focus:ring-1 focus:ring-forest"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-forest mb-1">
              Enlace Directo para Dejar Reseña en Google <span className="text-stone font-normal">(opcional)</span>
            </label>
            <input
              type="url"
              value={googleReviewUrl}
              onChange={(e) => setGoogleReviewUrl(e.target.value)}
              placeholder="https://search.google.com/local/writereview?placeid=... o https://g.page/r/..."
              className="w-full p-2.5 text-xs bg-white rounded-xl border border-stone-light/80 text-forest outline-none focus:ring-1 focus:ring-forest"
            />
          </div>
        </div>
      </div>

      {/* 7. OPCIONES DE VISIBILIDAD */}
      <div className="bg-white/80 p-4 sm:p-5 rounded-3xl border border-stone-light/70 shadow-2xs space-y-3 font-sans">
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isFeatured}
              onChange={(e) => setIsFeatured(e.target.checked)}
              className="rounded text-terra focus:ring-terra w-4 h-4 cursor-pointer"
            />
            <span className="text-xs font-bold text-forest">
              ★ Destacar en la cartelera (Posición prioritaria)
            </span>
          </label>
        </div>

        {mode === "editar" && (
          <div className="pt-2 border-t border-stone-light/40 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-forest block">Estado del Evento</span>
              <span className="text-[11px] text-stone">
                {isActive ? "Visible para turistas en la app" : "Pausado / Oculto de la cartelera"}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setIsActive(!isActive)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                isActive
                  ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                  : "bg-stone-light/60 text-stone hover:bg-stone-light"
              }`}
            >
              {isActive ? "🟢 Visible" : "⚪ Oculto"}
            </button>
          </div>
        )}
      </div>

      {/* MENSAJES DE ERROR O ÉXITO */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-sans">
          ⚠️ {error}
        </div>
      )}

      {guardadoExito && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl font-sans font-semibold text-center animate-fade-in">
          ✓ Guardado exitosamente. Sincronizando cartelera...
        </div>
      )}

      {/* BOTONES DE ACCIÓN */}
      <div className="flex items-center justify-between gap-3 pt-2">
        {mode === "editar" ? (
          <div>
            {confirmarEliminar ? (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleEliminar}
                  disabled={deleting}
                  className="px-3 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-sans text-xs font-semibold cursor-pointer shadow-xs transition-all"
                >
                  {deleting ? "Eliminando..." : "Sí, Eliminar Definitivamente"}
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmarEliminar(false)}
                  className="px-2.5 py-2 rounded-xl border border-stone-light text-stone hover:text-forest font-sans text-xs cursor-pointer"
                >
                  Cancelar
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmarEliminar(true)}
                className="px-3 py-2 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 font-sans text-xs font-semibold transition-colors cursor-pointer"
              >
                🗑️ Eliminar
              </button>
            )}
          </div>
        ) : (
          <div />
        )}

        <div className="flex items-center gap-2">
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2.5 rounded-xl border border-stone-light text-stone hover:text-forest font-sans text-xs font-semibold transition-colors cursor-pointer"
            >
              Cancelar
            </button>
          )}

          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 rounded-xl bg-forest hover:bg-forest/90 text-cream font-sans text-xs font-bold shadow-xs active:scale-95 transition-all cursor-pointer disabled:opacity-60"
          >
            {loading ? "Guardando..." : mode === "crear" ? "🌿 Publicar Evento" : "💾 Guardar Cambios"}
          </button>
        </div>
      </div>

      {/* MODALES AUXILIARES */}
      {mostrarAsistenteIA && (
        <ModalAsistenteEvento
          aliados={aliados.map((a) => ({
            id: a.id,
            nombre: a.nombre,
            whatsapp: a.whatsapp,
            instagram: a.instagram,
            categoria: a.categoria,
            zonaSlug: a.zonaSlug,
            zonaNombre: a.zonaNombre,
          }))}
          zonas={[
            { id: "zona-minca", nombre: "Minca", slug: "minca" },
            { id: "zona-mendihuaca", nombre: "Mendihuaca", slug: "mendihuaca" },
          ]}
          onClose={() => setMostrarAsistenteIA(false)}
          onPrefillNuevo={(datos, archivoFoto) => {
            handleDatosAsistenteExtraidos(datos);
            if (archivoFoto) {
              setFile(archivoFoto);
              setPreviewFoto(URL.createObjectURL(archivoFoto));
            }
            setMostrarAsistenteIA(false);
          }}
        />
      )}

      {mostrarHabladorMesa && initialEvento && (
        <ModalAficheImprimible
          isOpen={mostrarHabladorMesa}
          onClose={() => setMostrarHabladorMesa(false)}
          puntoNombre={businessName || eventTitle}
          urlDestino={`https://www.padonde.lat/es/${zonaSlug}?tab=servicios#evento-${initialEvento.id}`}
          tipoContenido="menu_restaurante"
        />
      )}
    </form>
  );
}
