"use client";

import { useState, useEffect, useMemo, useTransition } from "react";
import Image from "next/image";
import { Link, useRouter } from "@/i18n/routing";
import { ModalEditarHospedaje } from "./ModalEditarHospedaje";
import { ModalAsistenteIngesta } from "./ModalAsistenteIngesta";
import { ModalAlertaDuplicado } from "./ModalAlertaDuplicado";
import { ModalNotificarAliado, type EventoNotificarData } from "../ModalNotificarAliado";
import { toggleEventoActivoAction, investigarHospedajeAction } from "../actions";
import { ToggleDestacadoButton } from "../ToggleDestacadoButton";
import { parsearLineaRapida, buscarCoincidenciaHospedaje } from "@/lib/hospedajeParser";

interface AdminHospedajesListProps {
  hospedajes: any[];
  zonas: Array<{ id: string; nombre: string; slug: string }>;
  locale: string;
}

export function AdminHospedajesList({
  hospedajes,
  zonas,
  locale,
}: AdminHospedajesListProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [listaHospedajes, setListaHospedajes] = useState<any[]>(hospedajes);

  // Estados de Búsqueda y Filtro de Zona
  const [busqueda, setBusqueda] = useState("");
  const [filtroZona, setFiltroZona] = useState<string>("todas");

  useEffect(() => {
    setListaHospedajes(hospedajes);
  }, [hospedajes]);

  // Filtrado reactivo en tiempo real
  const hospedajesFiltrados = useMemo(() => {
    let resultado = listaHospedajes;

    // Filtro por zona
    if (filtroZona !== "todas") {
      resultado = resultado.filter((h) => {
        const slug = h.zonas?.slug || h.zonaSlug;
        return slug === filtroZona;
      });
    }

    // Buscador por texto libre
    if (busqueda.trim()) {
      const q = busqueda.trim().toLowerCase();
      resultado = resultado.filter((h) => {
        const titulo = (h.titulo || "").toLowerCase();
        const negocio = (h.negocio?.nombre || h.nombreNegocio || "").toLowerCase();
        const wa = (h.negocio?.whatsapp || h.whatsapp || "").toLowerCase();
        const contacto = (h.metadata_hospedaje?.contacto_propietario || "").toLowerCase();
        const zona = (h.zonas?.nombre || h.zonaNombre || "").toLowerCase();
        return (
          titulo.includes(q) ||
          negocio.includes(q) ||
          wa.includes(q) ||
          contacto.includes(q) ||
          zona.includes(q)
        );
      });
    }

    return resultado;
  }, [listaHospedajes, filtroZona, busqueda]);

  const [modalAbierto, setModalAbierto] = useState(false);
  const [asistenteAbierto, setAsistenteAbierto] = useState(false);
  const [lineaRapida, setLineaRapida] = useState("");
  const [isInvestigando, setIsInvestigando] = useState(false);
  const [hospedajeEnEdicion, setHospedajeEnEdicion] = useState<any | null>(null);
  const [hospedajeANotificar, setHospedajeANotificar] = useState<EventoNotificarData | null>(null);

  // Estado para alertar si se detecta un posible duplicado antes de crear
  const [alertaDuplicado, setAlertaDuplicado] = useState<{
    coincidencia: any;
    nombreIngresado: string;
    telefonoIngresado: string;
    lineaPendiente: string;
  } | null>(null);

  const abrirNuevo = () => {
    setHospedajeEnEdicion(null);
    setModalAbierto(true);
  };

  const ejecutarInvestigacion = async (input: string) => {
    setIsInvestigando(true);
    try {
      const res = await investigarHospedajeAction({
        linea: input,
      });

      if (res.success && res.borrador) {
        setHospedajeEnEdicion(res.borrador);
        setModalAbierto(true);
        setLineaRapida("");
      } else {
        // Fallback local seguro
        const parsed = parsearLineaRapida(input);
        const nuevoBorrador = {
          id: `temp-${Date.now()}`,
          nombreNegocio: parsed.nombreNegocio || "Nuevo Hospedaje",
          nombrePropietario: parsed.nombrePropietario || "",
          whatsapp: parsed.telefono || "",
          titulo: `🏡 ${parsed.nombreNegocio || "Nuevo Hospedaje"} — Refugio Natural 🌿`,
          descripcion: `Ubicado en el entorno mágico de la Sierra Nevada y el Caribe colombiano. Espacio perfecto para descansar y reconectar con la naturaleza.`,
          zonaSlug: "minca",
          destacado: false,
          negocio: {
            nombre: parsed.nombreNegocio || "Nuevo Hospedaje",
            whatsapp: parsed.telefono || "",
          },
          metadata_hospedaje: {
            contacto_propietario: parsed.nombrePropietario || undefined,
            habitaciones: [
              {
                id: `hab-${Date.now()}`,
                titulo: "Habitación Estándar",
                descripcion: "Cama doble, baño privado y ventilador.",
                precio_noche_cop: 120000,
                capacidad_max: 2,
                fotos: [],
                badges: [
                  { icono: "🚿", texto: "Baño privado" },
                  { icono: "🍳", texto: "Desayuno incluido" },
                ],
              },
            ],
          },
        };
        setHospedajeEnEdicion(nuevoBorrador);
        setModalAbierto(true);
        setLineaRapida("");
      }
    } catch (err) {
      console.error("Error al investigar hospedaje:", err);
      const parsed = parsearLineaRapida(input);
      setHospedajeEnEdicion({
        id: `temp-${Date.now()}`,
        nombreNegocio: parsed.nombreNegocio || "Nuevo Hospedaje",
        nombrePropietario: parsed.nombrePropietario || "",
        whatsapp: parsed.telefono || "",
        titulo: `🏡 ${parsed.nombreNegocio || "Nuevo Hospedaje"} — Refugio Natural 🌿`,
        descripcion: `Ubicado en el entorno mágico de la Sierra Nevada y el Caribe colombiano.`,
        zonaSlug: "minca",
        destacado: false,
        negocio: {
          nombre: parsed.nombreNegocio || "Nuevo Hospedaje",
          whatsapp: parsed.telefono || "",
        },
        metadata_hospedaje: {
          contacto_propietario: parsed.nombrePropietario || undefined,
          habitaciones: [],
        },
      });
      setModalAbierto(true);
      setLineaRapida("");
    } finally {
      setIsInvestigando(false);
    }
  };

  const handleProcesarLineaRapida = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const input = lineaRapida.trim();
    if (!input || isInvestigando) return;

    // Detectar si el nombre o teléfono ya coincide con uno existente
    const parsed = parsearLineaRapida(input);
    const coincidencia = buscarCoincidenciaHospedaje(
      { nombre: parsed.nombreNegocio, telefono: parsed.telefono },
      listaHospedajes
    );

    if (coincidencia) {
      setAlertaDuplicado({
        coincidencia,
        nombreIngresado: parsed.nombreNegocio || input,
        telefonoIngresado: parsed.telefono,
        lineaPendiente: input,
      });
      return;
    }

    await ejecutarInvestigacion(input);
  };

  const abrirEditar = (hosp: any) => {
    setHospedajeEnEdicion(hosp);
    setModalAbierto(true);
  };

  const handleParsed = (borrador: any) => {
    setAsistenteAbierto(false);
    setHospedajeEnEdicion(borrador);
    setModalAbierto(true);
  };

  const handleToggleActivo = (id: string, estadoActual: boolean) => {
    startTransition(async () => {
      setListaHospedajes((prev) =>
        prev.map((h) => (h.id === id ? { ...h, activo: !estadoActual } : h))
      );
      const res = await toggleEventoActivoAction(id, !estadoActual);
      if (!res.success) {
        alert(res.error || "No se pudo cambiar el estado del hospedaje.");
        setListaHospedajes((prev) =>
          prev.map((h) => (h.id === id ? { ...h, activo: estadoActual } : h))
        );
      } else {
        router.refresh();
      }
    });
  };

  const handleDeleted = (idEliminado: string) => {
    setListaHospedajes((prev) => prev.filter((h) => h.id !== idEliminado));
    setModalAbierto(false);
  };

  return (
    <div className="space-y-6">
      {/* Encabezado y Acción Principal */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white/70 backdrop-blur-sm p-4 sm:p-5 rounded-3xl border border-stone-light/80 shadow-xs">
        <div>
          <h1 className="font-serif text-2xl text-forest font-bold tracking-tight">
            🏡 Directorio de Hospedajes
          </h1>
          <p className="font-sans text-xs text-stone mt-1">
            Administra eco-lodges, cabañas y hostales con sus habitaciones y tarifas
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap self-start sm:self-auto">
          <button
            onClick={() => setAsistenteAbierto(true)}
            className="px-4 py-2.5 bg-terra/10 hover:bg-terra/20 text-terra border border-terra/30 font-sans text-xs font-semibold rounded-2xl active:scale-95 transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
            title="Pegar texto extenso de Booking, WhatsApp o Instagram para estructurar automáticamente"
          >
            <span>📋</span>
            <span>Pegar Texto Completo</span>
          </button>

          <button
            onClick={abrirNuevo}
            className="px-4 py-2.5 bg-forest text-cream font-sans text-xs font-semibold rounded-2xl hover:bg-forest-dark active:scale-95 transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <span>➕</span>
            <span>Nuevo en Blanco</span>
          </button>
        </div>
      </div>

      {/* Barra de Ingesta Rápida (1 Línea: Teléfono, Propietario y Nombre) */}
      <form
        onSubmit={handleProcesarLineaRapida}
        className="bg-cream/90 backdrop-blur-sm border border-stone-light/90 p-3 sm:p-4 rounded-3xl shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 transition-all focus-within:border-terra focus-within:ring-2 focus-within:ring-terra/20"
      >
        <div className="flex items-center gap-2 shrink-0 px-1">
          <span className="text-xl">⚡</span>
          <div>
            <span className="text-xs font-bold text-forest block">Ingesta Rápida (1 Línea)</span>
            <span className="text-[10px] text-stone block">Pega teléfono, propietario y hospedaje</span>
          </div>
        </div>

        <div className="flex-1 relative">
          <input
            type="text"
            value={lineaRapida}
            onChange={(e) => setLineaRapida(e.target.value)}
            placeholder="Ej: 3106436667 Candelaria - Brisas del Mar"
            className="w-full bg-white text-forest text-xs rounded-2xl border border-stone-light/80 px-3.5 py-2.5 placeholder:text-stone/60 focus:outline-none focus:border-terra shadow-inner font-sans"
          />
        </div>

        <button
          type="submit"
          disabled={isInvestigando}
          className="bg-terra hover:bg-terra-dark text-white text-xs font-semibold px-4 py-2.5 rounded-2xl transition-all active:scale-95 shadow-sm flex items-center justify-center gap-1.5 shrink-0 cursor-pointer disabled:opacity-60 disabled:cursor-wait"
        >
          {isInvestigando ? (
            <>
              <span className="animate-spin inline-block">⏳</span>
              <span>Investigando...</span>
            </>
          ) : (
            <>
              <span>🪄</span>
              <span>Procesar y Abrir</span>
            </>
          )}
        </button>
      </form>

      {/* Barra de Filtros y Buscador */}
      <div className="bg-white/90 backdrop-blur-xs border border-stone-light/80 p-3 sm:p-4 rounded-3xl shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Selector de Zonas */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          <button
            type="button"
            onClick={() => setFiltroZona("todas")}
            className={[
              "px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all cursor-pointer",
              filtroZona === "todas"
                ? "bg-forest text-white shadow-xs font-semibold"
                : "bg-stone-light/30 text-stone hover:text-forest hover:bg-stone-light/50",
            ].join(" ")}
          >
            Todos ({listaHospedajes.length})
          </button>

          {zonas.map((z) => {
            const count = listaHospedajes.filter(
              (h) => (h.zonas?.slug || h.zonaSlug) === z.slug
            ).length;
            const emoji = z.slug === "mendihuaca" ? "🌊" : z.slug === "minca" ? "🌿" : "📍";
            return (
              <button
                key={z.id}
                type="button"
                onClick={() => setFiltroZona(z.slug)}
                className={[
                  "px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all cursor-pointer flex items-center gap-1",
                  filtroZona === z.slug
                    ? "bg-forest text-white shadow-xs font-semibold"
                    : "bg-stone-light/30 text-stone hover:text-forest hover:bg-stone-light/50",
                ].join(" ")}
              >
                <span>{emoji}</span>
                <span>{z.nombre}</span>
                <span className="opacity-70 text-[11px]">({count})</span>
              </button>
            );
          })}
        </div>

        {/* Buscador de Hospedaje */}
        <div className="relative w-full sm:w-72 shrink-0">
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por nombre, anfitrión..."
            className="w-full pl-9 pr-8 py-2 text-xs bg-stone-light/20 focus:bg-white rounded-2xl border border-stone-light/80 placeholder:text-stone/60 focus:outline-none focus:ring-1 focus:ring-forest text-forest transition-colors font-sans"
          />
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone text-xs pointer-events-none">
            🔍
          </span>
          {busqueda && (
            <button
              onClick={() => setBusqueda("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone hover:text-forest text-xs cursor-pointer p-1"
              title="Limpiar búsqueda"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Lista de Hospedajes */}
      {listaHospedajes.length === 0 ? (
        <div className="text-center py-12 px-4 bg-white/60 rounded-3xl border border-dashed border-stone-light space-y-3">
          <span className="text-4xl">🏡</span>
          <h3 className="font-serif text-lg text-forest font-semibold">
            Aún no has registrado ningún hospedaje
          </h3>
          <p className="font-sans text-xs text-stone max-w-sm mx-auto">
            Registra tu primer hostal o eco-lodge con sus habitaciones para que los turistas puedan pre-cotizar y reservar por WhatsApp.
          </p>
          <button
            onClick={abrirNuevo}
            className="px-4 py-2 bg-terra text-white font-sans text-xs font-semibold rounded-xl hover:bg-terra-dark transition-colors inline-flex items-center gap-1.5 shadow-xs"
          >
            <span>➕</span>
            <span>Registrar Hospedaje Ahora</span>
          </button>
        </div>
      ) : hospedajesFiltrados.length === 0 ? (
        <div className="text-center py-12 px-4 bg-white/60 rounded-3xl border border-dashed border-stone-light space-y-3">
          <span className="text-4xl">🔍</span>
          <h3 className="font-serif text-lg text-forest font-semibold">
            No se encontraron hospedajes
          </h3>
          <p className="font-sans text-xs text-stone max-w-sm mx-auto">
            {busqueda
              ? `No hay hospedajes que coincidan con "${busqueda}" en ${
                  filtroZona === "todas" ? "las zonas" : "esta zona"
                }.`
              : "No hay hospedajes registrados en esta zona."}
          </p>
          <button
            onClick={() => {
              setBusqueda("");
              setFiltroZona("todas");
            }}
            className="px-4 py-2 bg-stone-light/60 hover:bg-stone-light text-forest font-sans text-xs font-semibold rounded-xl transition-colors inline-flex items-center gap-1.5 cursor-pointer shadow-2xs"
          >
            <span>✕</span>
            <span>Limpiar filtros de búsqueda</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {hospedajesFiltrados.map((hosp) => {
            const zonaNombre = hosp.zonas?.nombre || "Minca";
            const zonaSlug = hosp.zonas?.slug || "minca";
            const numHabitaciones = hosp.metadata_hospedaje?.habitaciones?.length || 0;
            const rating = hosp.negocio?.google_rating ?? hosp.metadata_hospedaje?.google_reputacion?.rating;
            const totalReviews = hosp.negocio?.google_total_reviews ?? hosp.metadata_hospedaje?.google_reputacion?.total_reviews;

            return (
              <article
                key={hosp.id}
                className="bg-white/80 backdrop-blur-xs rounded-3xl border border-stone-light/80 p-4 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between gap-3"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-12 h-12 rounded-2xl overflow-hidden bg-stone-light/40 relative flex-shrink-0">
                        {hosp.imagen_url ? (
                          <Image
                            src={hosp.imagen_url}
                            alt={hosp.titulo}
                            fill
                            className="object-cover"
                            sizes="48px"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-lg">
                            🏡
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                          <span className="inline-block text-[10px] font-sans font-medium text-terra bg-terra/10 px-2 py-0.5 rounded-full">
                            📍 {zonaNombre}
                          </span>
                          {hosp.destacado && (
                            <span className="inline-block text-[10px] font-sans font-bold text-terra bg-terra/10 border border-terra/20 px-2 py-0.5 rounded-full shadow-2xs">
                              ⭐ Destacado
                            </span>
                          )}
                        </div>
                        <h3 className="font-serif text-base font-bold text-forest leading-snug">
                          {hosp.titulo}
                        </h3>
                        <p className="font-sans text-xs text-stone">
                          {hosp.negocio?.nombre}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 flex-shrink-0 flex-wrap justify-end">
                      <ToggleDestacadoButton
                        eventoId={hosp.id}
                        destacadoInicial={Boolean(hosp.destacado)}
                      />
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() => handleToggleActivo(hosp.id, hosp.activo)}
                        className={`text-[10px] font-sans font-medium px-2.5 py-1 rounded-full transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 shadow-2xs ${
                          hosp.activo
                            ? "bg-green-100 text-green-800 hover:bg-green-200"
                            : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                        }`}
                        title={hosp.activo ? "Visible para turistas en la web. Clic para pausar" : "Pausado (oculto de la web). Clic para reactivar"}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${hosp.activo ? "bg-green-600 animate-pulse" : "bg-stone"}`} />
                        <span>{hosp.activo ? "En vivo" : "Pausado"}</span>
                      </button>
                    </div>
                  </div>

                  {/* Resumen de habitaciones y Google rating */}
                  <div className="mt-3.5 flex flex-wrap items-center gap-2 text-xs font-sans text-forest-dark bg-cream/70 p-2.5 rounded-2xl border border-stone-light/50">
                    <span className="flex items-center gap-1">
                      <span>🛏️</span>
                      <span>
                        <strong>{numHabitaciones}</strong> {numHabitaciones === 1 ? "habitación" : "habitaciones"}
                      </span>
                    </span>

                    {rating && (
                      <>
                        <span className="text-stone-light">•</span>
                        <span className="flex items-center gap-1 text-amber-600 font-semibold">
                          <span>★ {rating}</span>
                          <span className="text-stone text-[10px]">({totalReviews} reseñas)</span>
                        </span>
                      </>
                    )}

                    <span className="text-stone-light">•</span>
                    <span className="text-stone text-[11px]">
                      Desde ${hosp.precio?.toLocaleString("es-CO")} COP
                    </span>
                  </div>
                </div>

                {/* Acciones */}
                <div className="flex items-center justify-between pt-2 border-t border-stone-light/40 flex-wrap gap-2">
                  <Link
                    href={`/${zonaSlug}/${hosp.id}`}
                    target="_blank"
                    className="text-xs font-sans text-stone hover:text-forest underline underline-offset-2 flex items-center gap-1"
                  >
                    <span>Ver ficha pública ↗</span>
                  </Link>

                  <div className="flex items-center gap-1.5">
                    {hosp.negocio?.whatsapp && (
                      <button
                        type="button"
                        onClick={() =>
                          setHospedajeANotificar({
                            id: hosp.id,
                            titulo: hosp.titulo,
                            negocioNombre: hosp.negocio.nombre,
                            whatsapp: hosp.negocio.whatsapp,
                            zonaSlug: zonaSlug,
                            zonaNombre: zonaNombre,
                            tipoCategoria: "hospedaje",
                          })
                        }
                        className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-sans font-semibold rounded-xl transition-all flex items-center gap-1 shadow-2xs cursor-pointer active:scale-95"
                        title="Enviar mensaje gana-gana al WhatsApp del hospedaje"
                      >
                        <span>📲</span>
                        <span>Notificar</span>
                      </button>
                    )}

                    <button
                      onClick={() => abrirEditar(hosp)}
                      className="px-3 py-1.5 bg-forest/10 hover:bg-forest text-forest hover:text-cream text-xs font-sans font-medium rounded-xl transition-all cursor-pointer"
                    >
                      ✏️ Editar y Tarifas
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Modal Formulario de Creación / Edición */}
      {modalAbierto && (
        <ModalEditarHospedaje
          key={
            hospedajeEnEdicion?.id ||
            (hospedajeEnEdicion ? `draft-${hospedajeEnEdicion.nombreNegocio}` : "nuevo")
          }
          hospedaje={hospedajeEnEdicion}
          zonas={zonas}
          hospedajesExistentes={listaHospedajes}
          onClose={() => setModalAbierto(false)}
          onDeleted={handleDeleted}
        />
      )}

      {/* Modal Asistente de Ingesta Rápida */}
      {asistenteAbierto && (
        <ModalAsistenteIngesta
          zonas={zonas}
          onClose={() => setAsistenteAbierto(false)}
          onParsed={handleParsed}
        />
      )}

      {/* Modal para Notificar al Hospedaje por WhatsApp */}
      <ModalNotificarAliado
        evento={hospedajeANotificar}
        isOpen={Boolean(hospedajeANotificar)}
        onClose={() => setHospedajeANotificar(null)}
      />

      {/* Modal de Alerta de Duplicado Detectado */}
      {alertaDuplicado && (
        <ModalAlertaDuplicado
          coincidencia={alertaDuplicado.coincidencia}
          nombreIngresado={alertaDuplicado.nombreIngresado}
          telefonoIngresado={alertaDuplicado.telefonoIngresado}
          onEditarExistente={() => {
            const exp = alertaDuplicado.coincidencia;
            setAlertaDuplicado(null);
            setHospedajeEnEdicion(exp);
            setModalAbierto(true);
            setLineaRapida("");
          }}
          onContinuarCreando={() => {
            const pendiente = alertaDuplicado.lineaPendiente;
            setAlertaDuplicado(null);
            ejecutarInvestigacion(pendiente);
          }}
          onCancelar={() => setAlertaDuplicado(null)}
        />
      )}
    </div>
  );
}
