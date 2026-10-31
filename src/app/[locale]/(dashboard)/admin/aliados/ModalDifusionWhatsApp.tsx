"use client";

import { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/Button";
import {
  formatVisualPhone,
  cleanPhoneNumber,
  buildWhatsAppUrl,
  copyToClipboard,
} from "@/lib/whatsapp/url";
import { calcularFechaEn15Dias } from "@/lib/whatsapp/dates";
import {
  generarMensajeDifusionRedes,
  generarMensajeRestaurante,
  generarMensajeHospedaje,
  generarMensajeTours,
  generarMensajeComercio,
  generarMensajeCorreccion,
} from "@/lib/whatsapp/templates";
import type { AliadoItem } from "./AdminAliadosList";

export type TipoPlantillaMasiva =
  | "restaurantes"
  | "hospedajes"
  | "tours"
  | "comercio"
  | "redes"
  | "cobro"
  | "correccion"
  | "personalizado";

export interface ModalDifusionWhatsAppProps {
  aliados: AliadoItem[];
  abiertoExterno?: boolean;
  onCerrarExterno?: () => void;
  idsPreseleccionados?: string[];
  ocultarBotonTrigger?: boolean;
}

export function ModalDifusionWhatsApp({
  aliados,
  abiertoExterno,
  onCerrarExterno,
  idsPreseleccionados,
  ocultarBotonTrigger = false,
}: ModalDifusionWhatsAppProps) {
  const [abiertoInterno, setAbiertoInterno] = useState(false);
  const abierto = abiertoExterno !== undefined ? abiertoExterno : abiertoInterno;

  const cerrarModal = () => {
    setAbiertoInterno(false);
    if (onCerrarExterno) onCerrarExterno();
  };

  const [mounted, setMounted] = useState(false);

  // Filtros de búsqueda y audiencia
  const [filtroZona, setFiltroZona] = useState<string>("todas");
  const [filtroCategoria, setFiltroCategoria] = useState<string>("todas");
  const [busqueda, setBusqueda] = useState<string>("");
  const [soloSeleccionados, setSoloSeleccionados] = useState<boolean>(false);

  // Plantilla activa
  const [tipoPlantilla, setTipoPlantilla] = useState<TipoPlantillaMasiva>("redes");

  // Registro de contactados en sesión
  const [contactados, setContactados] = useState<Record<string, boolean>>({});

  // IDs de aliados seleccionados con checkbox
  const [seleccionados, setSeleccionados] = useState<Record<string, boolean>>({});

  // Feedback de copiado rápido
  const [copiadoId, setCopiadoId] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    try {
      const guardado = sessionStorage.getItem("padonde_difusion_contactados");
      if (guardado) {
        setContactados(JSON.parse(guardado));
      }
    } catch {}
  }, []);

  // Inicializar selección cuando se abre el modal
  useEffect(() => {
    if (abierto) {
      if (idsPreseleccionados && idsPreseleccionados.length > 0) {
        const pre: Record<string, boolean> = {};
        for (const id of idsPreseleccionados) {
          pre[id] = true;
        }
        setSeleccionados(pre);
      } else {
        const todas: Record<string, boolean> = {};
        for (const a of aliados) {
          todas[a.id] = true;
        }
        setSeleccionados(todas);
      }
    }
  }, [abierto, idsPreseleccionados, aliados]);

  // Bloquear scroll de la página cuando el modal esté abierto
  useEffect(() => {
    if (abierto) {
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prevOverflow;
      };
    }
  }, [abierto]);

  // Cerrar con Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") cerrarModal();
    };
    if (abierto) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [abierto]);

  // Plantillas canónicas idénticas a ModalNotificarAliado
  const plantillasDefault: Record<TipoPlantillaMasiva, { label: string; icon: string; texto: string }> = {
    redes: {
      label: "Difusión en Redes",
      icon: "📲",
      texto: generarMensajeDifusionRedes({
        negocioNombre: "{nombre}",
        zonaNombre: "{zona}",
        enlacePersonalizado: "{enlace}",
      }),
    },
    restaurantes: {
      label: "Restaurantes & Bares",
      icon: "🍽️",
      texto: generarMensajeRestaurante({
        negocioNombre: "{nombre}",
        zonaNombre: "{zona}",
        enlacePersonalizado: "{enlace}",
        whatsapp: "{whatsapp}",
        fechaLimite: "{fecha_limite}",
      }),
    },
    hospedajes: {
      label: "Hospedajes & Cabañas",
      icon: "🏡",
      texto: generarMensajeHospedaje({
        negocioNombre: "{nombre}",
        zonaNombre: "{zona}",
        enlacePersonalizado: "{enlace}",
      }),
    },
    tours: {
      label: "Tours & Guías",
      icon: "🧭",
      texto: generarMensajeTours({
        negocioNombre: "{nombre}",
        zonaNombre: "{zona}",
        enlacePersonalizado: "{enlace}",
      }),
    },
    comercio: {
      label: "Comercio & Servicios",
      icon: "🛵",
      texto: generarMensajeComercio({
        negocioNombre: "{nombre}",
        zonaNombre: "{zona}",
        enlacePersonalizado: "{enlace}",
      }),
    },
    cobro: {
      label: "Cobro / Renovación",
      icon: "💰",
      texto: `🌿 Hola {nombre}, te escribimos de PaDónde.

Queremos coordinar la renovación de tu suscripción en la cartelera oficial de {zona}.

Para mantener tu vitrina con visibilidad destacada y continuar recibiendo turistas directos a tu WhatsApp, puedes transferir a Nequi/Daviplata.

¿Te gustaría renovar para esta temporada? Quedamos muy atentos.`,
    },
    correccion: {
      label: "Corrección de Ficha",
      icon: "✏️",
      texto: generarMensajeCorreccion({
        negocioNombre: "{nombre}",
        zonaNombre: "{zona}",
        enlacePersonalizado: "{enlace}",
      }),
    },
    personalizado: {
      label: "Mensaje Libre",
      icon: "📝",
      texto: `🌿 *Hola {nombre}, te escribimos del equipo de PaDónde ({zona}).*

¿Pudiste revisar tu vitrina oficial ({enlace})? Cuéntanos si deseas actualizar algún dato o foto para los turistas de la temporada. ¡Quedamos muy atentos!`,
    },
  };

  // Texto editable actual
  const [textoPlantilla, setTextoPlantilla] = useState<string>(plantillasDefault.redes.texto);

  // Al cambiar de plantilla
  const handleCambiarPlantilla = (tipo: TipoPlantillaMasiva) => {
    setTipoPlantilla(tipo);
    setTextoPlantilla(plantillasDefault[tipo].texto);
  };

  // Clasificador de negocio por categoría
  const clasificarCategoria = (a: AliadoItem) => {
    const cat = (a.categoria || "").toLowerCase();
    const nom = (a.nombre || "").toLowerCase();
    if (
      cat.includes("restaurante") ||
      cat.includes("comida") ||
      cat.includes("bar") ||
      cat.includes("cafe") ||
      cat.includes("café") ||
      cat.includes("gastronom")
    )
      return "restaurantes";
    if (
      cat.includes("hospedaje") ||
      cat.includes("hotel") ||
      cat.includes("hostal") ||
      cat.includes("glamping") ||
      cat.includes("cabaña") ||
      nom.includes("hostel") ||
      nom.includes("hotel")
    )
      return "hospedajes";
    if (cat.includes("tour") || cat.includes("guía") || cat.includes("aventura")) return "tours";
    return "comercio";
  };

  // Filtrado de aliados
  const aliadosFiltrados = useMemo(() => {
    return aliados.filter((a) => {
      // Filtro de solo seleccionados
      if (soloSeleccionados && !seleccionados[a.id]) {
        return false;
      }

      // Filtro por zona
      if (filtroZona !== "todas" && (a.zonaSlug || "minca") !== filtroZona) {
        return false;
      }

      // Filtro por categoría
      if (filtroCategoria !== "todas") {
        const catReal = clasificarCategoria(a);
        if (catReal !== filtroCategoria) return false;
      }

      // Filtro por texto
      const q = busqueda.trim().toLowerCase();
      if (!q) return true;
      return (
        a.nombre.toLowerCase().includes(q) ||
        a.whatsapp.includes(q) ||
        (a.categoria || "").toLowerCase().includes(q)
      );
    });
  }, [aliados, filtroZona, filtroCategoria, busqueda, soloSeleccionados, seleccionados]);

  // Compilar mensaje personalizado
  const compilarMensaje = (aliado: AliadoItem) => {
    const zonaNombre =
      aliado.zonaNombre || (aliado.zonaSlug === "mendihuaca" ? "Mendihuaca" : "Minca");
    const slug = aliado.zonaSlug || "minca";
    const ev = aliado.eventos?.find((e) => e.activo) || aliado.eventos?.[0];
    const enlace = ev
      ? `https://padonde.lat/es/${slug}/${ev.id}`
      : `https://padonde.lat/es/${slug}`;

    const wpVisual = formatVisualPhone(aliado.whatsapp);
    const fechaLimite = calcularFechaEn15Dias();

    return textoPlantilla
      .replace(/\{nombre\}/g, aliado.nombre.trim())
      .replace(/\{zona\}/g, zonaNombre)
      .replace(/\{enlace\}/g, enlace)
      .replace(/\{link\}/g, enlace)
      .replace(/\{fecha_limite\}|\{fechaLimite\}/g, fechaLimite)
      .replace(/\{whatsapp\}/g, wpVisual || aliado.whatsapp);
  };

  // Enviar WhatsApp individual
  const handleEnviarWhatsApp = (aliado: AliadoItem) => {
    const cleanWa = cleanPhoneNumber(aliado.whatsapp);
    if (!cleanWa) {
      alert(`El aliado ${aliado.nombre} no tiene un número de WhatsApp válido.`);
      return;
    }
    const mensaje = compilarMensaje(aliado);

    // Copia al portapapeles de respaldo
    copyToClipboard(mensaje);

    // URL usando api.whatsapp.com
    const url = buildWhatsAppUrl({ phone: cleanWa, message: mensaje });

    // Marcar como contactado
    const nuevos = { ...contactados, [aliado.id]: true };
    setContactados(nuevos);
    try {
      sessionStorage.setItem("padonde_difusion_contactados", JSON.stringify(nuevos));
    } catch {}

    window.open(url, "_blank", "noopener,noreferrer");
  };

  // Copiar mensaje
  const handleCopiarMensaje = (aliado: AliadoItem) => {
    const mensaje = compilarMensaje(aliado);
    copyToClipboard(mensaje).then((ok) => {
      if (ok) {
        setCopiadoId(aliado.id);
        setTimeout(() => setCopiadoId(null), 2000);
      }
    });
  };

  // Alternar selección total
  const seleccionarTodosVisibles = () => {
    const todosVisiblesEstanSel = aliadosFiltrados.length > 0 && aliadosFiltrados.every((a) => seleccionados[a.id]);
    const nueva = { ...seleccionados };
    for (const a of aliadosFiltrados) {
      nueva[a.id] = !todosVisiblesEstanSel;
    }
    setSeleccionados(nueva);
  };

  const totalEnLista = aliadosFiltrados.length;
  const totalSeleccionados = Object.values(seleccionados).filter(Boolean).length;
  const totalContactadosEnSeleccion = aliados.filter(
    (a) => seleccionados[a.id] && contactados[a.id]
  ).length;

  return (
    <>
      {/* Botón Disparador en el Panel (si no se oculta) */}
      {!ocultarBotonTrigger && (
        <Button
          onClick={() => setAbiertoInterno(true)}
          className="w-full h-full bg-emerald-700 hover:bg-emerald-800 text-white font-semibold py-2 px-3 text-xs rounded-xl shadow-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-95 whitespace-nowrap"
          title="Abrir Centro de Mensajes Masivos de WhatsApp para seleccionar uno, varios o todos los aliados"
        >
          <span>📢</span>
          <span>Mensajes Masivos WhatsApp</span>
        </Button>
      )}

      {/* Modal Pantalla Completa / Drawer */}
      {abierto &&
        mounted &&
        createPortal(
          <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
            <div className="bg-white w-full max-w-5xl max-h-[94vh] rounded-2xl sm:rounded-3xl shadow-2xl border border-stone-light flex flex-col overflow-hidden">
              {/* Header del Modal */}
              <div className="p-4 sm:p-5 bg-stone-50 border-b border-stone-light/80 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center text-xl shrink-0">
                    📢
                  </div>
                  <div>
                    <h2 className="font-serif text-lg sm:text-xl text-forest font-bold leading-tight">
                      Mensajes Masivos WhatsApp
                    </h2>
                    <p className="text-xs text-stone mt-0.5">
                      Selecciona uno, varios o todos los aliados y envíales la plantilla oficial con 1 clic
                    </p>
                  </div>
                </div>
                <button
                  onClick={cerrarModal}
                  className="w-8 h-8 rounded-full bg-stone-200/70 hover:bg-stone-300 text-stone-dark flex items-center justify-center text-sm font-bold cursor-pointer transition-colors"
                >
                  ✕
                </button>
              </div>

              {/* Contenido scrolleable */}
              <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1">
                {/* Paso 1: Selector de Plantilla Canónica */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <span className="text-xs font-bold text-forest uppercase tracking-wider">
                      1. Elige la Plantilla de Mensaje
                    </span>
                    <button
                      type="button"
                      onClick={() => setTextoPlantilla(plantillasDefault[tipoPlantilla].texto)}
                      className="text-[11px] text-stone hover:text-forest underline cursor-pointer"
                    >
                      Restablecer texto original
                    </button>
                  </div>

                  {/* Pestañas de Plantillas Canónicas */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 bg-stone-100/80 p-1.5 rounded-2xl border border-stone-light">
                    {(Object.keys(plantillasDefault) as TipoPlantillaMasiva[]).map((key) => {
                      const item = plantillasDefault[key];
                      const activo = tipoPlantilla === key;
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => handleCambiarPlantilla(key)}
                          className={`py-2 px-2.5 rounded-xl text-xs font-semibold cursor-pointer transition-all flex items-center justify-center gap-1.5 ${
                            activo
                              ? "bg-forest text-white shadow-xs"
                              : "text-stone hover:text-forest hover:bg-white/60"
                          }`}
                        >
                          <span>{item.icon}</span>
                          <span className="truncate">{item.label}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Textarea editable de la plantilla */}
                  <div className="relative">
                    <textarea
                      rows={6}
                      value={textoPlantilla}
                      onChange={(e) => setTextoPlantilla(e.target.value)}
                      className="w-full p-3 bg-stone-50 text-xs font-sans text-stone-dark rounded-xl border border-stone-light focus:outline-none focus:border-forest/60 focus:bg-white leading-relaxed resize-y font-mono"
                      placeholder="Escribe el mensaje..."
                    />
                    <div className="flex items-center justify-between flex-wrap gap-2 mt-1">
                      <p className="text-[11px] text-stone">
                        💡 Variables automáticas: <code>{"{nombre}"}</code>, <code>{"{zona}"}</code>, <code>{"{enlace}"}</code>, <code>{"{whatsapp}"}</code>, <code>{"{fecha_limite}"}</code>
                      </p>
                    </div>
                  </div>
                </div>

                {/* Paso 2: Filtros de Audiencia y Destinatarios */}
                <div className="bg-cream/40 p-3.5 sm:p-4 rounded-2xl border border-stone-light/80 space-y-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <span className="text-xs font-bold text-forest uppercase tracking-wider">
                      2. Filtra y Selecciona tus Aliados Destinatarios
                    </span>
                    <span className="text-xs text-stone">
                      Total seleccionados: <strong className="text-forest font-bold">{totalSeleccionados}</strong> de {aliados.length}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    {/* Filtro Región */}
                    <div>
                      <label className="block text-[11px] font-bold text-stone mb-1 uppercase tracking-wide">
                        Región / Destino
                      </label>
                      <div className="grid grid-cols-3 gap-1 bg-white p-1 rounded-xl border border-stone-light text-center">
                        <button
                          type="button"
                          onClick={() => setFiltroZona("todas")}
                          className={`py-1 px-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                            filtroZona === "todas" ? "bg-forest text-white" : "text-stone hover:text-forest"
                          }`}
                        >
                          Todas
                        </button>
                        <button
                          type="button"
                          onClick={() => setFiltroZona("minca")}
                          className={`py-1 px-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                            filtroZona === "minca" ? "bg-forest text-white" : "text-stone hover:text-forest"
                          }`}
                        >
                          🌿 Minca
                        </button>
                        <button
                          type="button"
                          onClick={() => setFiltroZona("mendihuaca")}
                          className={`py-1 px-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                            filtroZona === "mendihuaca" ? "bg-forest text-white" : "text-stone hover:text-forest"
                          }`}
                        >
                          🌊 Mendi
                        </button>
                      </div>
                    </div>

                    {/* Filtro Categoría */}
                    <div>
                      <label className="block text-[11px] font-bold text-stone mb-1 uppercase tracking-wide">
                        Filtrar por Rubro
                      </label>
                      <select
                        value={filtroCategoria}
                        onChange={(e) => setFiltroCategoria(e.target.value)}
                        className="w-full py-1.5 px-3 text-xs bg-white rounded-xl border border-stone-light text-forest font-medium focus:outline-none focus:ring-1 focus:ring-forest cursor-pointer"
                      >
                        <option value="todas">Todos los rubros</option>
                        <option value="restaurantes">🍽️ Restaurantes & Bares</option>
                        <option value="hospedajes">🏡 Hospedajes & Cabañas</option>
                        <option value="tours">🧭 Tours & Guías</option>
                        <option value="comercio">🛵 Comercio & Servicios</option>
                      </select>
                    </div>

                    {/* Buscador de texto en vivo */}
                    <div>
                      <label className="block text-[11px] font-bold text-stone mb-1 uppercase tracking-wide">
                        Búsqueda directa
                      </label>
                      <input
                        type="text"
                        placeholder="Nombre o teléfono..."
                        value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value)}
                        className="w-full px-3 py-1.5 bg-white text-xs rounded-xl border border-stone-light focus:outline-none focus:border-forest/60"
                      />
                    </div>
                  </div>

                  {/* Barra de Selección Masiva y Progreso */}
                  <div className="flex items-center justify-between flex-wrap gap-2 pt-2 border-t border-stone-light/60">
                    <div className="flex items-center gap-3 flex-wrap">
                      <button
                        type="button"
                        onClick={seleccionarTodosVisibles}
                        className="text-xs font-bold text-forest hover:underline cursor-pointer flex items-center gap-1.5"
                      >
                        <span className="text-base">
                          {aliadosFiltrados.length > 0 && aliadosFiltrados.every((a) => seleccionados[a.id])
                            ? "☑"
                            : "☐"}
                        </span>
                        <span>
                          {aliadosFiltrados.length > 0 && aliadosFiltrados.every((a) => seleccionados[a.id])
                            ? "Deseleccionar Visibles"
                            : `Seleccionar Visibles (${totalEnLista})`}
                        </span>
                      </button>

                      <label className="flex items-center gap-1.5 text-xs text-stone cursor-pointer">
                        <input
                          type="checkbox"
                          checked={soloSeleccionados}
                          onChange={(e) => setSoloSeleccionados(e.target.checked)}
                          className="w-3.5 h-3.5 rounded text-forest focus:ring-forest"
                        />
                        <span>Ver solo seleccionados ({totalSeleccionados})</span>
                      </label>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs text-emerald-800 font-semibold">
                        {totalContactadosEnSeleccion} de {totalSeleccionados} enviados (
                        {totalSeleccionados > 0
                          ? Math.round((totalContactadosEnSeleccion / totalSeleccionados) * 100)
                          : 0}
                        %)
                      </span>
                      <div className="w-24 sm:w-36 bg-stone-200 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-emerald-600 h-full transition-all duration-300"
                          style={{
                            width: `${
                              totalSeleccionados > 0
                                ? (totalContactadosEnSeleccion / totalSeleccionados) * 100
                                : 0
                            }%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Paso 3: Lista de Aliados con Casilla Individual y Envío Directo */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-forest uppercase tracking-wider">
                      3. Destinatarios ({aliadosFiltrados.length})
                    </span>
                    <span className="text-[11px] text-stone">
                      Haz clic en &quot;Enviar WhatsApp&quot; para abrir la conversación de cada aliado
                    </span>
                  </div>

                  {aliadosFiltrados.length === 0 ? (
                    <div className="p-8 text-center bg-stone-50 rounded-2xl border border-dashed border-stone-light">
                      <p className="text-sm text-stone font-sans">
                        No se encontraron aliados con estos filtros.
                      </p>
                    </div>
                  ) : (
                    <div className="divide-y divide-stone-light/70 max-h-[380px] overflow-y-auto pr-1 border border-stone-light rounded-2xl bg-white">
                      {aliadosFiltrados.map((aliado) => {
                        const fueContactado = Boolean(contactados[aliado.id]);
                        const estaSeleccionado = Boolean(seleccionados[aliado.id]);
                        const wpVisual = formatVisualPhone(aliado.whatsapp);

                        return (
                          <div
                            key={aliado.id}
                            className={`py-3 px-3 sm:px-4 flex items-center justify-between gap-3 transition-colors ${
                              fueContactado
                                ? "bg-emerald-50/40 hover:bg-emerald-50/70"
                                : estaSeleccionado
                                ? "bg-white hover:bg-stone-50"
                                : "bg-stone-50/40 opacity-60 hover:opacity-100"
                            }`}
                          >
                            {/* Checkbox Individual + Datos del Aliado */}
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                              <input
                                type="checkbox"
                                checked={estaSeleccionado}
                                onChange={(e) =>
                                  setSeleccionados({
                                    ...seleccionados,
                                    [aliado.id]: e.target.checked,
                                  })
                                }
                                className="w-4 h-4 rounded text-forest focus:ring-forest cursor-pointer shrink-0"
                                title={estaSeleccionado ? "Deseleccionar" : "Seleccionar"}
                              />
                              <div className="min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <p className="font-bold text-xs sm:text-sm text-forest truncate">
                                    {aliado.nombre}
                                  </p>
                                  <span className="text-[10px] bg-stone-100 text-stone-700 px-1.5 py-0.5 rounded font-medium">
                                    {aliado.categoria}
                                  </span>
                                  <span className="text-[10px] bg-emerald-50 text-emerald-800 px-1.5 py-0.5 rounded font-medium">
                                    {aliado.zonaSlug === "mendihuaca" ? "🌊 Mendihuaca" : "🌿 Minca"}
                                  </span>
                                </div>
                                <p className="text-[11px] text-stone mt-0.5 flex items-center gap-2">
                                  <span>📲 {wpVisual || aliado.whatsapp}</span>
                                  {fueContactado && (
                                    <span className="text-emerald-700 font-bold text-[10px] bg-emerald-100 px-1.5 py-0.2 rounded-full">
                                      ✓ Contactado
                                    </span>
                                  )}
                                </p>
                              </div>
                            </div>

                            {/* Botones de Acción */}
                            <div className="flex items-center gap-1.5 shrink-0">
                              <button
                                type="button"
                                onClick={() => handleCopiarMensaje(aliado)}
                                title="Copiar mensaje personalizado"
                                className="p-2 text-xs rounded-xl border border-stone-light hover:bg-white text-stone hover:text-forest cursor-pointer transition-colors"
                              >
                                {copiadoId === aliado.id ? "✓ Copiado" : "📋 Copiar"}
                              </button>

                              <button
                                type="button"
                                onClick={() => handleEnviarWhatsApp(aliado)}
                                className={`py-1.5 px-3 text-xs font-semibold rounded-xl flex items-center gap-1.5 cursor-pointer shadow-2xs transition-all active:scale-95 ${
                                  fueContactado
                                    ? "bg-emerald-100 text-emerald-900 border border-emerald-300 hover:bg-emerald-200"
                                    : "bg-emerald-600 hover:bg-emerald-700 text-white"
                                }`}
                              >
                                <span>📲</span>
                                <span>
                                  {fueContactado ? "Reenviar" : "Enviar WhatsApp"}
                                </span>
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Footer del Modal */}
              <div className="p-3.5 sm:p-4 bg-stone-50 border-t border-stone-light/80 flex items-center justify-between text-xs text-stone">
                <span>
                  Tip: Puedes enviar a uno, a varios o a todos. Cada clic abre WhatsApp directo sin riesgo de baneo.
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={cerrarModal}
                  className="cursor-pointer"
                >
                  Cerrar
                </Button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
