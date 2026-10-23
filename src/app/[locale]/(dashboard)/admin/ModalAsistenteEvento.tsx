"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  procesarTextoBrutoEvento,
  type EventoExtraido,
  type AliadoSimple,
} from "@/lib/eventoParser";
import { CATEGORIAS_EVENTOS, getCategoria } from "@/constants";
import { adminPublishEventAction, generarCopyEventoGeminiAction } from "./actions";
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
  const [isAnalizando, setIsAnalizando] = useState(false);
  const [isRegenerandoAI, setIsRegenerandoAI] = useState(false);
  const [generadoConGemini, setGeneradoConGemini] = useState(false);

  // Estados de control de Aliado (Evitar duplicados)
  const [modoAliado, setModoAliado] = useState<"existente" | "nuevo">("existente");
  const [selectedAliadoId, setSelectedAliadoId] = useState<string>("");
  const [busquedaAliado, setBusquedaAliado] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [nuevoNombre, setNuevoNombre] = useState("");
  const [nuevoWhatsapp, setNuevoWhatsapp] = useState("");
  const [nuevoInstagram, setNuevoInstagram] = useState("");

  const aliadoSeleccionado = useMemo(() => {
    if (!selectedAliadoId) return null;
    return aliados.find((a) => a.id === selectedAliadoId) || null;
  }, [aliados, selectedAliadoId]);

  const aliadosFiltrados = useMemo(() => {
    if (!aliados || aliados.length === 0) return [];
    const q = busquedaAliado.toLowerCase().trim();
    if (!q) return aliados;
    return aliados.filter(
      (a) =>
        a.nombre.toLowerCase().includes(q) ||
        (a.whatsapp && a.whatsapp.includes(q))
    );
  }, [aliados, busquedaAliado]);

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

  // Procesar con el motor inteligente y Gemini AI
  const handleAnalizar = async () => {
    if (!textoBruto.trim()) {
      setError(
        "Por favor escribe o pega el mensaje de WhatsApp, enlace o texto del afiche."
      );
      return;
    }

    setIsAnalizando(true);
    setError(null);

    try {
      const extraido = procesarTextoBrutoEvento(textoBruto, aliados, zonaSlug);

      // Si el motor detectó un aliado existente, seleccionarlo de inmediato
      if (extraido.aliadoId) {
        setModoAliado("existente");
        setSelectedAliadoId(extraido.aliadoId);
        setBusquedaAliado("");
      } else {
        setModoAliado("existente");
        setSelectedAliadoId("");
        setBusquedaAliado(extraido.businessName);
      }

      setNuevoNombre(extraido.businessName);
      setNuevoWhatsapp(extraido.whatsapp);
      setNuevoInstagram(extraido.instagram);

      // Invocar a Gemini AI para redactar título y copy editorial con atmósfera real
      const aiRes = await generarCopyEventoGeminiAction({
        textoBruto,
        businessName: extraido.businessName,
        zonaSlug,
      });

      if (aiRes.success) {
        if (aiRes.titulo) extraido.titulo = aiRes.titulo;
        if (aiRes.descripcion) extraido.descripcion = aiRes.descripcion;
        if (aiRes.categoria) extraido.categoria = aiRes.categoria;
        if (aiRes.precio !== undefined) extraido.precio = aiRes.precio;
        extraido.notasAsistente.unshift("✨ Redacción generada por Gemini AI (estilo bohemio & mochilero)");
        setGeneradoConGemini(true);
      } else {
        console.warn("Gemini AI fallback:", aiRes.error);
      }

      setEvento(extraido);
      setPaso(2);
    } catch (err: any) {
      setError(err?.message || "Ocurrió un error al analizar el texto.");
    } finally {
      setIsAnalizando(false);
    }
  };

  // Regenerar solo el texto con Gemini AI a demanda
  const handleRegenerarCopyGemini = async () => {
    if (!evento) return;
    setIsRegenerandoAI(true);
    setError(null);

    try {
      const aiRes = await generarCopyEventoGeminiAction({
        textoBruto: evento.textoOriginal || textoBruto,
        businessName:
          modoAliado === "existente"
            ? (aliadoSeleccionado?.nombre || evento.businessName)
            : nuevoNombre.trim(),
        zonaSlug: evento.zonaSlug || zonaSlug,
      });

      if (aiRes.success) {
        setEvento({
          ...evento,
          titulo: aiRes.titulo || evento.titulo,
          descripcion: aiRes.descripcion || evento.descripcion,
          categoria: aiRes.categoria || evento.categoria,
        });
        setGeneradoConGemini(true);
      } else {
        setError(aiRes.error || "No se pudo regenerar con Gemini.");
      }
    } catch (err: any) {
      setError(err?.message || "Error al regenerar con IA.");
    } finally {
      setIsRegenerandoAI(false);
    }
  };

  // Publicar directamente desde la modal en 1 clic
  const handlePublicarDirecto = async () => {
    if (!evento) return;

    if (modoAliado === "existente" && !selectedAliadoId) {
      setError("Por favor selecciona un Aliado de la lista o activa la opción '➕ Crear Nuevo Aliado'.");
      return;
    }

    if (modoAliado === "nuevo" && !nuevoNombre.trim()) {
      setError("Por favor escribe el nombre del nuevo comercio / aliado.");
      return;
    }

    if (!evento.titulo.trim()) {
      setError("El evento debe tener un título.");
      return;
    }
    if (!evento.dateTime) {
      setError("Debes indicar una fecha y hora válida.");
      return;
    }

    const finalAliadoId = modoAliado === "existente" ? selectedAliadoId : undefined;
    const finalBusinessName =
      modoAliado === "existente"
        ? (aliadoSeleccionado?.nombre || evento.businessName)
        : nuevoNombre.trim();
    const finalWhatsapp =
      modoAliado === "existente"
        ? (aliadoSeleccionado?.whatsapp || evento.whatsapp || "573000000000")
        : (nuevoWhatsapp.trim() || "573000000000");
    const finalInstagram =
      modoAliado === "existente"
        ? (aliadoSeleccionado?.instagram || evento.instagram || undefined)
        : (nuevoInstagram.trim() || undefined);
    const finalZonaSlug =
      modoAliado === "existente"
        ? (aliadoSeleccionado?.zonaSlug || evento.zonaSlug || zonaSlug)
        : (evento.zonaSlug || zonaSlug);

    setIsPublicando(true);
    setError(null);

    try {
      let finalImg = "";
      if (archivoFoto) {
        const uploaded = await uploadEventImage(archivoFoto);
        if (uploaded) finalImg = uploaded;
      }

      const res = await adminPublishEventAction({
        negocioId: finalAliadoId,
        businessName: finalBusinessName,
        whatsapp: finalWhatsapp,
        instagram: finalInstagram,
        eventTitle: evento.titulo.trim(),
        category: evento.categoria,
        dateTime: evento.dateTime,
        price: Number(evento.precio) || 0,
        description: evento.descripcion,
        imageUrl: finalImg || undefined,
        isFeatured: evento.destacado,
        zonaSlug: finalZonaSlug,
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

    const finalAliadoId = modoAliado === "existente" ? (selectedAliadoId || null) : null;
    const finalBusinessName =
      modoAliado === "existente"
        ? (aliadoSeleccionado?.nombre || evento.businessName)
        : nuevoNombre.trim();
    const finalWhatsapp =
      modoAliado === "existente"
        ? (aliadoSeleccionado?.whatsapp || evento.whatsapp)
        : nuevoWhatsapp.trim();
    const finalInstagram =
      modoAliado === "existente"
        ? (aliadoSeleccionado?.instagram || evento.instagram)
        : nuevoInstagram.trim();
    const finalZonaSlug =
      modoAliado === "existente"
        ? (aliadoSeleccionado?.zonaSlug || evento.zonaSlug || zonaSlug)
        : (evento.zonaSlug || zonaSlug);

    const payloadExtraido: EventoExtraido = {
      ...evento,
      aliadoId: finalAliadoId,
      businessName: finalBusinessName,
      whatsapp: finalWhatsapp,
      instagram: finalInstagram,
      zonaSlug: finalZonaSlug,
    };

    if (onPrefillNuevo) {
      onPrefillNuevo(payloadExtraido, archivoFoto);
    } else {
      try {
        sessionStorage.setItem("padonde_asistente_prefill", JSON.stringify(payloadExtraido));
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
                  ? "Convierte mensajes de WhatsApp o afiches en planes listos para publicar."
                  : "Selecciona el aliado, revisa los datos y publica sin crear duplicados."}
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
                      className="text-[11px] text-terra hover:underline cursor-pointer"
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

              {/* Botón Analizar con Gemini AI */}
              <button
                type="button"
                disabled={isAnalizando}
                onClick={handleAnalizar}
                className="w-full py-3.5 rounded-2xl bg-forest hover:bg-forest/90 disabled:bg-stone text-white font-sans text-sm font-bold shadow-md transition-all active:scale-98 cursor-pointer flex items-center justify-center gap-2"
              >
                {isAnalizando ? (
                  <>
                    <span className="animate-spin text-lg">⏳</span>
                    <span>Redactando con Gemini AI...</span>
                  </>
                ) : (
                  <>
                    <span>✨</span>
                    <span>Analizar y Redactar con Gemini AI</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* ─────────────────────────────────────────────────────────────
              PASO 2: FICHA EXTRAÍDA CON SELECTOR DE ALIADO
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

              {/* SELECTOR CONTROLADO DE ALIADO: Evitar Duplicados */}
              <div className="p-3.5 rounded-2xl bg-white border border-stone-light/80 space-y-3 shadow-2xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <label className="text-xs font-bold text-forest flex items-center gap-1.5">
                    <span>📍</span> Aliado Comercial Responsable *
                  </label>

                  {/* Selector Existente vs Crear Nuevo */}
                  <div className="inline-flex rounded-xl bg-stone-light/40 p-0.5 text-[11px] font-sans font-medium self-start sm:self-auto">
                    <button
                      type="button"
                      onClick={() => setModoAliado("existente")}
                      className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                        modoAliado === "existente"
                          ? "bg-forest text-white font-semibold shadow-2xs"
                          : "text-stone hover:text-forest"
                      }`}
                    >
                      Elegir Existente ({aliados.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setModoAliado("nuevo");
                        setSelectedAliadoId("");
                      }}
                      className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                        modoAliado === "nuevo"
                          ? "bg-terra text-white font-semibold shadow-2xs"
                          : "text-stone hover:text-forest"
                      }`}
                    >
                      ➕ Crear Nuevo
                    </button>
                  </div>
                </div>

                {/* Vista cuando está en modo EXISTENTE */}
                {modoAliado === "existente" && (
                  <div className="space-y-2">
                    {aliadoSeleccionado ? (
                      <div className="p-3 bg-emerald-50/90 border border-emerald-300 rounded-2xl flex items-center justify-between gap-3 shadow-2xs">
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="w-9 h-9 rounded-xl bg-white flex items-center justify-center text-lg border border-emerald-200 shadow-xs shrink-0">
                            {getCategoria(aliadoSeleccionado.categoria as any)?.emoji || "🏢"}
                          </span>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-xs font-bold text-emerald-950 truncate">
                                {aliadoSeleccionado.nombre}
                              </p>
                              <span className="text-[10px] font-semibold uppercase tracking-wider bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded-md shrink-0">
                                {aliadoSeleccionado.zonaNombre || (aliadoSeleccionado.zonaSlug === "mendihuaca" ? "Mendihuaca" : "Minca")}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-[10px] text-emerald-800 mt-0.5">
                              {aliadoSeleccionado.whatsapp && (
                                <span>📞 +{aliadoSeleccionado.whatsapp}</span>
                              )}
                              {aliadoSeleccionado.instagram && (
                                <span>📸 {aliadoSeleccionado.instagram}</span>
                              )}
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            setSelectedAliadoId("");
                            setIsDropdownOpen(true);
                          }}
                          className="text-xs font-bold text-emerald-800 hover:text-emerald-950 underline shrink-0 px-2.5 py-1.5 bg-white/80 rounded-xl border border-emerald-200 hover:bg-white transition-colors cursor-pointer"
                        >
                          Cambiar Aliado ▾
                        </button>
                      </div>
                    ) : (
                      <div className="relative">
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            placeholder="🔍 Buscar aliado registrado en PaDónde (ej. La Casona, Duni...)"
                            value={busquedaAliado}
                            onChange={(e) => {
                              setBusquedaAliado(e.target.value);
                              setIsDropdownOpen(true);
                            }}
                            onFocus={() => setIsDropdownOpen(true)}
                            className="w-full px-3.5 py-2 text-xs rounded-xl border border-stone-light/80 bg-white text-forest font-medium focus:outline-terra"
                          />
                          <button
                            type="button"
                            onClick={() => setIsDropdownOpen((prev) => !prev)}
                            className="px-3 py-2 text-xs rounded-xl border border-stone-light bg-stone-light/30 text-stone hover:text-forest shrink-0 cursor-pointer"
                          >
                            {isDropdownOpen ? "Cerrar" : "Ver todos"}
                          </button>
                        </div>

                        {isDropdownOpen && (
                          <div className="absolute top-full left-0 right-0 z-30 mt-1 max-h-52 overflow-y-auto bg-white border border-stone-light rounded-2xl shadow-xl p-1.5 space-y-1">
                            {aliadosFiltrados.length === 0 ? (
                              <div className="p-3 text-center text-xs text-stone space-y-2">
                                <p>No se encontró ningún aliado registrado con ese nombre.</p>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setModoAliado("nuevo");
                                    setNuevoNombre(busquedaAliado);
                                    setIsDropdownOpen(false);
                                  }}
                                  className="text-xs font-bold text-terra hover:underline cursor-pointer"
                                >
                                  ➕ Registrar como nuevo aliado &quot;{busquedaAliado}&quot;
                                </button>
                              </div>
                            ) : (
                              aliadosFiltrados.map((a) => (
                                <button
                                  key={a.id}
                                  type="button"
                                  onClick={() => {
                                    setSelectedAliadoId(a.id);
                                    if (a.zonaSlug) setZonaSlug(a.zonaSlug);
                                    setIsDropdownOpen(false);
                                  }}
                                  className="w-full text-left p-2 hover:bg-forest/5 rounded-xl flex items-center justify-between text-xs transition-colors cursor-pointer"
                                >
                                  <div className="flex items-center gap-2 min-w-0">
                                    <span>{getCategoria(a.categoria as any)?.emoji || "🏢"}</span>
                                    <span className="font-semibold text-forest truncate">
                                      {a.nombre}
                                    </span>
                                  </div>
                                  <span className="text-[10px] bg-stone-light/50 px-2 py-0.5 rounded-full text-stone shrink-0">
                                    {a.zonaNombre || (a.zonaSlug === "mendihuaca" ? "Mendihuaca" : "Minca")}
                                  </span>
                                </button>
                              ))
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Vista cuando está en modo CREAR NUEVO */}
                {modoAliado === "nuevo" && (
                  <div className="p-3.5 bg-terra/5 border border-terra/20 rounded-2xl space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-terra uppercase tracking-wider flex items-center gap-1.5">
                        <span>➕</span> Registrar Comercio Nuevo en PaDónde
                      </span>
                      <button
                        type="button"
                        onClick={() => setModoAliado("existente")}
                        className="text-[11px] text-stone hover:text-forest underline cursor-pointer"
                      >
                        ← Volver a lista existente
                      </button>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-forest mb-1">
                        Nombre Oficial del Negocio *
                      </label>
                      <input
                        type="text"
                        required
                        value={nuevoNombre}
                        onChange={(e) => setNuevoNombre(e.target.value)}
                        placeholder="Ej. Hostal La Brisa"
                        className="w-full px-3 py-2 text-xs rounded-xl border border-stone-light bg-white text-forest font-semibold focus:outline-terra"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-[11px] font-semibold text-forest mb-1">
                          WhatsApp de Contacto *
                        </label>
                        <input
                          type="tel"
                          required
                          value={nuevoWhatsapp}
                          onChange={(e) => setNuevoWhatsapp(e.target.value)}
                          placeholder="573001234567"
                          className="w-full px-3 py-2 text-xs rounded-xl border border-stone-light bg-white text-forest focus:outline-terra"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-forest mb-1">
                          Instagram (Opcional)
                        </label>
                        <input
                          type="text"
                          value={nuevoInstagram}
                          onChange={(e) => setNuevoInstagram(e.target.value)}
                          placeholder="@hostallabrisa"
                          className="w-full px-3 py-2 text-xs rounded-xl border border-stone-light bg-white text-forest focus:outline-terra"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Categoría & Zona */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-forest mb-1">
                    Categoría del Evento *
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

                <div>
                  <label className="block text-xs font-semibold text-forest mb-1">
                    Zona de Destino *
                  </label>
                  <select
                    value={evento.zonaSlug || zonaSlug}
                    onChange={(e) =>
                      setEvento({ ...evento, zonaSlug: e.target.value })
                    }
                    className="w-full px-3 py-2 text-xs rounded-xl border border-stone-light/80 bg-white text-forest font-medium focus:outline-terra cursor-pointer"
                  >
                    {zonas.map((z) => (
                      <option key={z.id} value={z.slug}>
                        {z.nombre}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Título sugerido */}
              <div>
                <label className="block text-xs font-semibold text-forest mb-1">
                  Título del Evento (Limpio para móvil) *
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

              {/* Descripción Seductora para Turistas con botón de regeneración */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5">
                    <label className="text-xs font-semibold text-forest">
                      Descripción para Mochileros y Viajeros
                    </label>
                    {generadoConGemini && (
                      <span className="text-[10px] bg-purple-100 text-purple-800 font-semibold px-2 py-0.5 rounded-full flex items-center gap-1">
                        <span>✨</span> Gemini AI
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    disabled={isRegenerandoAI}
                    onClick={handleRegenerarCopyGemini}
                    className="text-xs font-bold text-purple-700 hover:text-purple-900 bg-purple-50 hover:bg-purple-100 border border-purple-200 px-2.5 py-1 rounded-xl transition-all flex items-center gap-1 cursor-pointer active:scale-95 disabled:opacity-50"
                    title="Pedir a Gemini una nueva versión creativa del texto"
                  >
                    <span>{isRegenerandoAI ? "⏳" : "🪄"}</span>
                    <span>{isRegenerandoAI ? "Regenerando..." : "Regenerar con Gemini"}</span>
                  </button>
                </div>

                <textarea
                  rows={5}
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
