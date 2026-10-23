"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  procesarTextoBrutoEvento,
  type EventoExtraido,
  type AliadoSimple,
} from "@/lib/eventoParser";
import { CATEGORIAS_EVENTOS, getCategoria } from "@/constants";
import { adminPublishEventAction } from "./actions";
import { uploadEventImage } from "@/lib/supabase/storage";
import type { CategoriaEvento } from "@/lib/types";

interface ModalAsistenteEventoProps {
  aliados: AliadoSimple[];
  zonas: Array<{ id: string; nombre: string; slug: string }>;
  onClose: () => void;
  onPublished?: () => void;
  onPrefillNuevo?: (data: EventoExtraido, archivoFoto?: File | null) => void;
}

const EJEMPLOS_PRUEBA = [
  {
    label: "🎸 Acústico La Casona",
    texto: `Hola Mónica! Este viernes a las 8pm tenemos noche acústica en Hotel Minca La Casona con fogata bajo las estrellas. Entrada libre para todos los huéspedes y mochileros, cócteles 2x1 hasta las 9. WhatsApp 3155193679`,
    zona: "minca",
  },
  {
    label: "💃 Salsa en Duni",
    texto: `Buenas! Sábado de salsa y pizza en Duni Gourmet Minca. Empezamos a las 7:30 pm con DJ invitado y pista abierta. Cover 15k incluye cerveza artesanal. Reservas al 3001234567 @duniminca`,
    zona: "minca",
  },
  {
    label: "🧘 Yoga en Casa Maya",
    texto: `Domingo 8:30 am sesión de Vinyasa Yoga frente al mar y sound healing con cuencos en Casa Maya Mendihuaca. Aporte consciente $25.000 COP. Traer esterilla o toalla. WhatsApp 3209876543`,
    zona: "mendihuaca",
  },
];

export function ModalAsistenteEvento({
  aliados,
  zonas,
  onClose,
  onPublished,
  onPrefillNuevo,
}: ModalAsistenteEventoProps) {
  const router = useRouter();

  // Estados del Paso 1 (Ingesta)
  const [paso, setPaso] = useState<1 | 2>(1);
  const [textoBruto, setTextoBruto] = useState("");
  const [zonaSlug, setZonaSlug] = useState("minca");
  const [archivoFoto, setArchivoFoto] = useState<File | null>(null);
  const [previewFoto, setPreviewFoto] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Estados del Paso 2 (Ficha extraída y editable)
  const [evento, setEvento] = useState<EventoExtraido | null>(null);
  const [isPublicando, setIsPublicando] = useState(false);

  // Cargar ejemplo rápido
  const handleCargarEjemplo = (ejemplo: (typeof EJEMPLOS_PRUEBA)[0]) => {
    setTextoBruto(ejemplo.texto);
    setZonaSlug(ejemplo.zona);
    setError(null);
  };

  // Manejo de imagen o afiche cargado
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setArchivoFoto(file);
      setPreviewFoto(URL.createObjectURL(file));
    }
  };

  // Procesar con el motor inteligente
  const handleAnalizar = () => {
    if (!textoBruto.trim()) {
      setError(
        "Por favor escribe o pega el mensaje de WhatsApp, enlace o texto del afiche."
      );
      return;
    }

    setError(null);
    try {
      const extraido = procesarTextoBrutoEvento(
        textoBruto,
        aliados,
        zonaSlug
      );
      setEvento(extraido);
      setPaso(2);
    } catch (err: any) {
      setError(err?.message || "Ocurrió un error al analizar el texto.");
    }
  };

  // Publicar directamente desde la modal en 1 clic
  const handlePublicarDirecto = async () => {
    if (!evento) return;
    if (!evento.titulo.trim()) {
      setError("El evento debe tener un título.");
      return;
    }
    if (!evento.dateTime) {
      setError("Debes indicar una fecha y hora válida.");
      return;
    }

    setIsPublicando(true);
    setError(null);

    try {
      let finalImg = "";
      if (archivoFoto) {
        const uploaded = await uploadEventImage(archivoFoto);
        if (uploaded) finalImg = uploaded;
      }

      const res = await adminPublishEventAction({
        businessName: evento.businessName.trim(),
        whatsapp: evento.whatsapp || "573000000000",
        instagram: evento.instagram || undefined,
        eventTitle: evento.titulo.trim(),
        category: evento.categoria,
        dateTime: evento.dateTime,
        price: Number(evento.precio) || 0,
        description: evento.descripcion,
        imageUrl: finalImg || undefined,
        isFeatured: evento.destacado,
        zonaSlug: evento.zonaSlug || zonaSlug,
      });

      if (!res.success) {
        setError(res.error || "No se pudo publicar el evento.");
        setIsPublicando(false);
        return;
      }

      // Éxito: refrescar router, notificar y cerrar modal
      router.refresh();
      if (onPublished) onPublished();
      onClose();
    } catch (err: any) {
      setError(err?.message || "Error al publicar.");
      setIsPublicando(false);
    }
  };

  // Abrir en el formulario completo (/admin/nuevo)
  const handleAbrirFormularioCompleto = () => {
    if (!evento) return;
    if (onPrefillNuevo) {
      onPrefillNuevo(evento, archivoFoto);
    } else {
      // Guardar en sessionStorage para ser recuperado por /admin/nuevo
      try {
        sessionStorage.setItem("padonde_asistente_prefill", JSON.stringify(evento));
      } catch {}
      router.push("/admin/nuevo");
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-stone-light/80 overflow-hidden">
        {/* Header */}
        <div className="px-5 sm:px-6 py-4 border-b border-stone-light/70 flex items-center justify-between bg-cream/50">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">✨</span>
            <div>
              <h3 className="font-serif text-lg sm:text-xl text-forest font-bold">
                Asistente Inteligente de Eventos
              </h3>
              <p className="text-[11px] sm:text-xs text-stone font-sans mt-0.5">
                {paso === 1
                  ? "Convierte mensajes informales de WhatsApp o afiches en planes listos para publicar."
                  : "Revisa la ficha extraída con copy para turistas y publica en 1 clic."}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-stone-light/40 hover:bg-stone-light text-stone hover:text-forest flex items-center justify-center text-sm font-bold transition-colors cursor-pointer"
            title="Cerrar"
          >
            ✕
          </button>
        </div>

        {/* Cuerpo del Modal */}
        <div className="p-5 sm:p-6 space-y-4 overflow-y-auto font-sans flex-1">
          {error && (
            <div className="p-3.5 rounded-2xl bg-terra/10 border border-terra/30 text-terra text-xs font-medium">
              ⚠️ {error}
            </div>
          )}

          {/* ─────────────────────────────────────────────────────────────
              PASO 1: INPUT CAÓTICO (WhatsApp / Flyer)
             ───────────────────────────────────────────────────────────── */}
          {paso === 1 && (
            <div className="space-y-4">
              {/* Botones de Ejemplo Rápido */}
              <div className="p-3.5 rounded-2xl bg-forest/5 border border-forest/15 space-y-2">
                <p className="text-xs text-forest font-semibold">
                  💡 Probar con ejemplos reales de WhatsApp:
                </p>
                <div className="flex flex-wrap gap-2">
                  {EJEMPLOS_PRUEBA.map((ej, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleCargarEjemplo(ej)}
                      className="text-xs bg-white text-forest hover:bg-forest hover:text-white px-3 py-1.5 rounded-xl border border-stone-light/80 transition-colors cursor-pointer font-medium shadow-2xs"
                    >
                      {ej.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Selector de Zona */}
              <div>
                <label className="block text-xs font-semibold text-forest mb-1">
                  Zona del Evento *
                </label>
                <select
                  value={zonaSlug}
                  onChange={(e) => setZonaSlug(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-stone-light/80 bg-white text-forest font-medium focus:outline-terra cursor-pointer"
                >
                  {zonas.map((z) => (
                    <option key={z.id} value={z.slug}>
                      {z.nombre}
                    </option>
                  ))}
                </select>
              </div>

              {/* Área de Texto Crudo */}
              <div>
                <label className="block text-xs font-semibold text-forest mb-1 flex items-center justify-between">
                  <span>Mensaje de WhatsApp, enlace o texto del afiche *</span>
                  <span className="text-[10px] text-stone font-normal">
                    {textoBruto.length} caracteres
                  </span>
                </label>
                <textarea
                  rows={6}
                  value={textoBruto}
                  onChange={(e) => setTextoBruto(e.target.value)}
                  placeholder="Pega aquí el mensaje tal como te llegó por WhatsApp o el texto del afiche... Ej: 'Este viernes a las 8pm tocamos en vivo en La Casona, acústico con fogata, cover 10k...'"
                  className="w-full p-3.5 text-xs rounded-2xl border border-stone-light/80 bg-white text-forest focus:outline-terra font-sans leading-relaxed resize-none shadow-2xs"
                />
              </div>

              {/* Subida Opcional de Flyer / Imagen de Portada */}
              <div className="p-3.5 rounded-2xl bg-cream/40 border border-stone-light/60 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-forest">
                    🖼️ Flyer o Foto de Portada (Opcional)
                  </label>
                  {previewFoto && (
                    <button
                      type="button"
                      onClick={() => {
                        setArchivoFoto(null);
                        setPreviewFoto(null);
                      }}
                      className="text-[11px] text-terra hover:underline"
                    >
                      Quitar foto
                    </button>
                  )}
                </div>

                <p className="text-[11px] text-stone">
                  Tip PaDónde: Los afiches tapizados de texto saturan en móviles. Te sugerimos usar una foto de ambiente limpia como portada del feed.
                </p>

                <div className="flex items-center gap-3 pt-1">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="text-xs text-stone file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-forest/10 file:text-forest hover:file:bg-forest/20 cursor-pointer"
                  />
                  {previewFoto && (
                    <div className="relative w-12 h-12 rounded-xl overflow-hidden border border-stone-light shrink-0">
                      <Image
                        src={previewFoto}
                        alt="Preview"
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Botón Analizar */}
              <button
                type="button"
                onClick={handleAnalizar}
                className="w-full py-3.5 rounded-2xl bg-forest hover:bg-forest/90 text-white font-sans text-sm font-bold shadow-md transition-all active:scale-98 cursor-pointer flex items-center justify-center gap-2"
              >
                <span>⚡</span>
                <span>Analizar y Estructurar Evento</span>
              </button>
            </div>
          )}

          {/* ─────────────────────────────────────────────────────────────
              PASO 2: FICHA EXTRAÍDA (Revisión y 1-Click Publish)
             ───────────────────────────────────────────────────────────── */}
          {paso === 2 && evento && (
            <div className="space-y-4">
              {/* Píldoras de Lo que detectó el Asistente */}
              <div className="p-3 rounded-2xl bg-forest/5 border border-forest/15 space-y-1.5">
                <p className="text-[11px] font-semibold text-forest flex items-center gap-1.5">
                  <span>🧠</span>
                  <span>Inteligencia de Extracción:</span>
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {evento.notasAsistente.map((n, i) => (
                    <span
                      key={i}
                      className="inline-block text-[10px] bg-white border border-forest/20 text-forest px-2.5 py-1 rounded-full font-medium"
                    >
                      ✓ {n}
                    </span>
                  ))}
                </div>
              </div>

              {/* Aliado & Categoría */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-forest mb-1">
                    Comercio / Aliado Vinculado *
                  </label>
                  <input
                    type="text"
                    value={evento.businessName}
                    onChange={(e) =>
                      setEvento({ ...evento, businessName: e.target.value })
                    }
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-stone-light/80 bg-white text-forest font-medium focus:outline-terra"
                  />
                  {evento.whatsapp && (
                    <p className="text-[10px] text-stone mt-0.5">
                      WhatsApp: +{evento.whatsapp}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-forest mb-1">
                    Categoría *
                  </label>
                  <select
                    value={evento.categoria}
                    onChange={(e) =>
                      setEvento({
                        ...evento,
                        categoria: e.target.value as CategoriaEvento,
                      })
                    }
                    className="w-full px-3 py-2 text-xs rounded-xl border border-stone-light/80 bg-white text-forest font-medium focus:outline-terra cursor-pointer"
                  >
                    {CATEGORIAS_EVENTOS.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.emoji} {c.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Título sugerido */}
              <div>
                <label className="block text-xs font-semibold text-forest mb-1">
                  Título Sugerido (Limpio para móvil) *
                </label>
                <input
                  type="text"
                  value={evento.titulo}
                  onChange={(e) =>
                    setEvento({ ...evento, titulo: e.target.value })
                  }
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-stone-light/80 bg-white text-forest font-semibold focus:outline-terra"
                />
              </div>

              {/* Fecha/Hora y Cover */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-forest mb-1">
                    Fecha y Hora de Inicio *
                  </label>
                  <input
                    type="datetime-local"
                    value={evento.dateTime}
                    onChange={(e) =>
                      setEvento({ ...evento, dateTime: e.target.value })
                    }
                    className="w-full px-3 py-2 text-xs rounded-xl border border-stone-light/80 bg-white text-forest font-medium focus:outline-terra"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-forest mb-1">
                    Cover / Entrada (COP)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={evento.precio}
                      onChange={(e) =>
                        setEvento({
                          ...evento,
                          precio: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-stone-light/80 bg-white text-forest font-semibold focus:outline-terra"
                    />
                    <span className="absolute right-3 top-2 text-[11px] text-stone">
                      {evento.precio === 0 ? "Gratis / Libre" : "COP"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Descripción Seductora para Turistas */}
              <div>
                <label className="block text-xs font-semibold text-forest mb-1 flex items-center justify-between">
                  <span>Descripción redactada para mochileros</span>
                  <span className="text-[10px] text-stone">
                    Con emojis y llamada a la acción
                  </span>
                </label>
                <textarea
                  rows={4}
                  value={evento.descripcion}
                  onChange={(e) =>
                    setEvento({ ...evento, descripcion: e.target.value })
                  }
                  className="w-full p-3 text-xs rounded-2xl border border-stone-light/80 bg-white text-forest focus:outline-terra font-sans leading-relaxed resize-none shadow-2xs"
                />
              </div>

              {/* Foto de portada cargada */}
              {previewFoto && (
                <div className="flex items-center gap-3 p-2.5 rounded-2xl bg-cream/40 border border-stone-light/60">
                  <div className="relative w-14 h-14 rounded-xl overflow-hidden border border-stone-light shrink-0">
                    <Image
                      src={previewFoto}
                      alt="Portada"
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="text-xs text-forest">
                    <p className="font-semibold">Foto lista para subir</p>
                    <p className="text-[10px] text-stone">
                      Se optimizará y guardará automáticamente como portada del plan.
                    </p>
                  </div>
                </div>
              )}

              {/* Botones de Acción */}
              <div className="space-y-2 pt-2 border-t border-stone-light/60">
                <button
                  type="button"
                  disabled={isPublicando}
                  onClick={handlePublicarDirecto}
                  className="w-full py-3.5 rounded-2xl bg-emerald-700 hover:bg-emerald-800 disabled:bg-stone text-white font-sans text-sm font-bold shadow-md transition-all active:scale-98 cursor-pointer flex items-center justify-center gap-2"
                >
                  {isPublicando ? (
                    <>
                      <span className="animate-spin text-lg">⏳</span>
                      <span>Publicando en PaDónde...</span>
                    </>
                  ) : (
                    <>
                      <span>🚀</span>
                      <span>Publicar Evento Ahora</span>
                    </>
                  )}
                </button>

                <div className="flex items-center justify-between gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setPaso(1)}
                    className="text-xs text-stone hover:text-forest underline font-medium cursor-pointer"
                  >
                    ← Modificar texto original
                  </button>

                  <button
                    type="button"
                    onClick={handleAbrirFormularioCompleto}
                    className="text-xs text-terra hover:underline font-semibold cursor-pointer"
                  >
                    Abrir en Formulario Completo →
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
