"use client";

import { useState } from "react";
import { guardarConfigTerritorialAction } from "../actions";
import { CATEGORIAS, type CategoriaConfig, type TerritorialUXConfig, type CapsulaTerritorialConfig } from "@/constants";
import type { CategoriaEvento } from "@/lib/types";

interface AdminRegionesViewProps {
  initialConfig: Record<string, TerritorialUXConfig>;
}

const REGIONES_INFO: Record<string, { nombre: string; icono: string; subtitulo: string }> = {
  minca: {
    nombre: "Minca",
    icono: "🌿",
    subtitulo: "Montaña, selva nublada, cascadas y avistamiento de aves",
  },
  mendihuaca: {
    nombre: "Mendihuaca",
    icono: "🌊",
    subtitulo: "Playas vírgenes, río, surf y cabañas frente al mar",
  },
  palomino: {
    nombre: "Palomino",
    icono: "🌴",
    subtitulo: "Playa, río, tubing y descanso (Fase futura)",
  },
  tairona: {
    nombre: "Parque Tairona",
    icono: "🏞️",
    subtitulo: "Ecoturismo, senderismo ancestral y reservas naturales (Fase futura)",
  },
};

export function AdminRegionesView({ initialConfig }: AdminRegionesViewProps) {
  const [config, setConfig] = useState<Record<string, TerritorialUXConfig>>(initialConfig);
  const [regionActiva, setRegionActiva] = useState<string>("minca");
  const [isGuardando, setIsGuardando] = useState(false);
  const [mensaje, setMensaje] = useState<{ tipo: "exito" | "error"; texto: string } | null>(null);
  const [copiado, setCopiado] = useState(false);

  const regionActual = config[regionActiva] || {
    ordenCategorias: ["rumba", "comida", "bienestar", "tours", "arte", "hospedaje", "artesanias"],
    criterioOrdenFeed: "agenda_primero",
  };

  const capsulaActual: CapsulaTerritorialConfig = regionActual.capsula || {
    activa: false,
    etiqueta: `🌊 ${REGIONES_INFO[regionActiva]?.nombre || "Destino"} en vivo`,
    titulo: `${REGIONES_INFO[regionActiva]?.nombre || "Destino"} • Sierra Nevada`,
    descripcion: "",
    video_url: "",
    poster_url: "",
    duracion_segundos: 15,
  };

  // Actualizar configuración de la cápsula de video
  const handleUpdateCapsula = (patch: Partial<CapsulaTerritorialConfig>) => {
    setConfig((prev) => ({
      ...prev,
      [regionActiva]: {
        ...prev[regionActiva],
        capsula: {
          ...(prev[regionActiva]?.capsula || {
            activa: false,
            etiqueta: `🌊 ${REGIONES_INFO[regionActiva]?.nombre || "Destino"} en vivo`,
            titulo: `${REGIONES_INFO[regionActiva]?.nombre || "Destino"} • Sierra Nevada`,
            descripcion: "",
            video_url: "",
            poster_url: "",
            duracion_segundos: 15,
          }),
          ...patch,
        },
      },
    }));
  };

  // Mapeo rápido de categorías con emojis y etiquetas
  const catMap = new Map<string, CategoriaConfig>(CATEGORIAS.map((c) => [c.id, c]));

  // Mover categoría hacia arriba o abajo
  const handleMoverCategoria = (index: number, direccion: "arriba" | "abajo") => {
    const orden = [...regionActual.ordenCategorias];
    const targetIndex = direccion === "arriba" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= orden.length) return;

    const [item] = orden.splice(index, 1);
    orden.splice(targetIndex, 0, item);

    setConfig((prev) => ({
      ...prev,
      [regionActiva]: {
        ...prev[regionActiva],
        ordenCategorias: orden,
      },
    }));
  };

  // Cambiar criterio de orden del feed
  const handleCambiarCriterio = (criterio: "agenda_primero" | "hospedaje_primero") => {
    setConfig((prev) => ({
      ...prev,
      [regionActiva]: {
        ...prev[regionActiva],
        criterioOrdenFeed: criterio,
      },
    }));
  };

  // Guardar configuración territorial
  const handleGuardar = async () => {
    setIsGuardando(true);
    setMensaje(null);

    try {
      const res = await guardarConfigTerritorialAction({ config });
      if (res.success) {
        setMensaje({
          tipo: "exito",
          texto: "✅ Configuración territorial guardada y publicada exitosamente.",
        });
      } else {
        setMensaje({ tipo: "error", texto: res.error || "Error al guardar la configuración." });
      }
    } catch (err: any) {
      setMensaje({ tipo: "error", texto: err?.message || "Error al conectar con el servidor." });
    } finally {
      setIsGuardando(false);
    }
  };

  // Copiar respaldo al portapapeles
  const handleCopiarJSON = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(config, null, 2));
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2500);
    } catch {
      // Silencioso
    }
  };

  const jsonFormateado = JSON.stringify(config, null, 2);

  return (
    <div className="space-y-7 max-w-7xl mx-auto font-sans">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white/60 backdrop-blur-xs p-5 sm:p-6 rounded-3xl border border-stone-light/70 shadow-2xs">
        <div>
          <h2 className="font-serif text-2xl sm:text-3xl text-forest font-bold tracking-tight">
            🗺️ Configuración Territorial de Categorías
          </h2>
          <p className="text-xs sm:text-sm text-stone mt-1 max-w-2xl">
            Personaliza el orden de categorías y la prioridad del feed por región. Al guardar, los cambios se sincronizan automáticamente en la plataforma para todos los usuarios.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={handleCopiarJSON}
            className="px-3.5 py-2.5 rounded-xl border border-stone-light/80 bg-white hover:bg-cream text-forest text-xs font-semibold transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer"
            title="Copiar respaldo del texto de configuración"
          >
            <span>{copiado ? "✅" : "📋"}</span>
            <span>{copiado ? "¡Copiado!" : "Copiar Respaldo"}</span>
          </button>

          <button
            type="button"
            disabled={isGuardando}
            onClick={handleGuardar}
            className="px-5 py-2.5 rounded-xl bg-forest hover:bg-forest-dark active:scale-95 text-cream text-xs sm:text-sm font-semibold transition-all shadow-md hover:shadow-lg flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <span>{isGuardando ? "⏳" : "💾"}</span>
            <span>{isGuardando ? "Guardando..." : "Publicar Cambios"}</span>
          </button>
        </div>
      </div>

      {mensaje && (
        <div
          className={`p-4 rounded-2xl text-xs sm:text-sm font-medium border animate-in fade-in shadow-2xs ${
            mensaje.tipo === "exito"
              ? "bg-green-50 border-green-200 text-green-900"
              : "bg-red-50 border-red-200 text-red-900"
          }`}
        >
          {mensaje.texto}
        </div>
      )}

      {/* Selector de Regiones */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {Object.entries(REGIONES_INFO).map(([slug, info]) => {
          const isActiva = regionActiva === slug;
          return (
            <button
              key={slug}
              type="button"
              onClick={() => {
                setRegionActiva(slug);
                setMensaje(null);
              }}
              className={`p-4 sm:p-5 rounded-2xl border text-left transition-all cursor-pointer ${
                isActiva
                  ? "bg-forest text-white border-forest shadow-md ring-2 ring-forest/20 scale-[1.01]"
                  : "bg-white/80 hover:bg-white border-stone-light/80 text-stone hover:text-forest shadow-2xs hover:shadow-xs"
              }`}
            >
              <div className="text-2xl mb-1.5">{info.icono}</div>
              <div className="font-bold text-sm sm:text-base tracking-tight">{info.nombre}</div>
              <div
                className={`text-[11px] sm:text-xs line-clamp-1 mt-1 ${
                  isActiva ? "text-cream/80" : "text-stone"
                }`}
              >
                {info.subtitulo}
              </div>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-7 items-start">
        {/* Columna Izquierda: Configurador Visual de la Región (8 cols) */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-6">
          {/* 1. Prioridad del Feed */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-stone-light/70 shadow-2xs space-y-4">
            <div>
              <h3 className="font-serif text-lg text-forest font-bold">
                1. Prioridad de Contenido en el Feed
              </h3>
              <p className="text-xs text-stone mt-0.5">
                Define qué tipo de contenido se muestra primero en la cartelera de{" "}
                <span className="font-semibold text-forest">
                  {REGIONES_INFO[regionActiva]?.nombre}
                </span>
                .
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <label
                onClick={() => handleCambiarCriterio("agenda_primero")}
                className={`p-4 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between ${
                  regionActual.criterioOrdenFeed === "agenda_primero"
                    ? "bg-forest/5 border-forest text-forest ring-1 ring-forest shadow-2xs"
                    : "bg-cream/20 border-stone-light/80 text-stone hover:border-forest/50 hover:bg-cream/40"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <input
                    type="radio"
                    name="criterio"
                    checked={regionActual.criterioOrdenFeed === "agenda_primero"}
                    onChange={() => handleCambiarCriterio("agenda_primero")}
                    className="accent-forest cursor-pointer w-4 h-4"
                  />
                  <span className="font-bold text-xs sm:text-sm">🌿 Agenda / Planes primero</span>
                </div>
                <p className="text-[11px] text-stone mt-2 pl-6 leading-relaxed">
                  Eventos diarios y gastronomía arriba; hospedajes al final. (Ideal para Minca).
                </p>
              </label>

              <label
                onClick={() => handleCambiarCriterio("hospedaje_primero")}
                className={`p-4 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between ${
                  regionActual.criterioOrdenFeed === "hospedaje_primero"
                    ? "bg-forest/5 border-forest text-forest ring-1 ring-forest shadow-2xs"
                    : "bg-cream/20 border-stone-light/80 text-stone hover:border-forest/50 hover:bg-cream/40"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <input
                    type="radio"
                    name="criterio"
                    checked={regionActual.criterioOrdenFeed === "hospedaje_primero"}
                    onChange={() => handleCambiarCriterio("hospedaje_primero")}
                    className="accent-forest cursor-pointer w-4 h-4"
                  />
                  <span className="font-bold text-xs sm:text-sm">🏡 Hospedajes primero</span>
                </div>
                <p className="text-[11px] text-stone mt-2 pl-6 leading-relaxed">
                  Cabañas y hostales arriba; planes después. (Ideal para Mendihuaca/playa).
                </p>
              </label>
            </div>
          </div>

          {/* 2. Orden de Categorías */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-stone-light/70 shadow-2xs space-y-4">
            <div>
              <div className="flex items-center justify-between">
                <h3 className="font-serif text-lg text-forest font-bold">
                  2. Orden de Categorías del Menú & Swipe
                </h3>
                <span className="text-[11px] font-semibold text-stone bg-cream/80 px-2.5 py-1 rounded-full border border-stone-light/60">
                  {regionActual.ordenCategorias.length} categorías
                </span>
              </div>
              <p className="text-xs text-stone mt-1 leading-relaxed">
                Usa los botones para organizar la secuencia. Este orden determina los botones de la barra superior y el orden al deslizar horizontalmente (swipe) en dispositivos móviles.
              </p>
            </div>

            <div className="space-y-2 pt-1">
              {regionActual.ordenCategorias.map((catId, index) => {
                const catObj = catMap.get(catId);
                const isFirst = index === 0;
                const isLast = index === regionActual.ordenCategorias.length - 1;

                return (
                  <div
                    key={catId}
                    className="flex items-center justify-between p-3 sm:p-3.5 rounded-2xl bg-cream/30 hover:bg-cream/60 border border-stone-light/70 text-xs sm:text-sm transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-lg bg-stone-light/40 text-stone font-bold text-xs flex items-center justify-center shrink-0">
                        #{index + 1}
                      </span>
                      <span className="text-xl shrink-0">{catObj?.emoji || "✨"}</span>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-forest text-sm">
                          {catObj?.label || catId}
                        </span>
                        <span className="text-[10px] text-stone font-mono bg-white px-2 py-0.5 rounded-md border border-stone-light/60">
                          {catId}
                        </span>
                        {index === 0 && (
                          <span className="text-[10px] bg-forest/10 text-forest font-semibold px-2 py-0.5 rounded-full border border-forest/20">
                            🌟 Abre por defecto
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0 ml-2">
                      <button
                        type="button"
                        disabled={isFirst}
                        onClick={() => handleMoverCategoria(index, "arriba")}
                        className="w-8 h-8 rounded-xl border border-stone-light/80 bg-white hover:bg-forest hover:text-white text-stone flex items-center justify-center text-xs font-bold transition-all disabled:opacity-20 disabled:pointer-events-none cursor-pointer shadow-2xs active:scale-95"
                        title="Subir de posición"
                      >
                        ▲
                      </button>
                      <button
                        type="button"
                        disabled={isLast}
                        onClick={() => handleMoverCategoria(index, "abajo")}
                        className="w-8 h-8 rounded-xl border border-stone-light/80 bg-white hover:bg-forest hover:text-white text-stone flex items-center justify-center text-xs font-bold transition-all disabled:opacity-20 disabled:pointer-events-none cursor-pointer shadow-2xs active:scale-95"
                        title="Bajar de posición"
                      >
                        ▼
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 3. Cápsula de Vibra Territorial (Video Bajo Demanda) */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-stone-light/70 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-serif text-lg text-forest font-bold flex items-center gap-2">
                  <span>📹</span> 3. Cápsula de Vibra Territorial (&quot;Así late hoy&quot;)
                </h3>
                <p className="text-xs text-stone mt-0.5">
                  Video corto (10–15s) no invasivo que el turista puede abrir bajo demanda para ver la realidad del destino en vivo.
                </p>
              </div>

              {/* Interruptor Activar / Pausar */}
              <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
                <span
                  className={`text-[11px] font-sans font-semibold px-2.5 py-1 rounded-full border transition-colors ${
                    capsulaActual.activa
                      ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                      : "bg-stone-light/40 text-stone border-stone-light/80"
                  }`}
                >
                  {capsulaActual.activa ? "🟢 Activa" : "⏸️ Pausada"}
                </span>

                <button
                  type="button"
                  role="switch"
                  aria-checked={capsulaActual.activa}
                  onClick={() => handleUpdateCapsula({ activa: !capsulaActual.activa })}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    capsulaActual.activa ? "bg-emerald-600" : "bg-stone-300"
                  }`}
                  title={capsulaActual.activa ? "Desactivar cápsula" : "Activar cápsula"}
                >
                  <span
                    aria-hidden="true"
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                      capsulaActual.activa ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Campos de Configuración de la Cápsula */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
              <div>
                <label className="block text-xs font-semibold text-forest mb-1">
                  Etiqueta del botón en el feed
                </label>
                <input
                  type="text"
                  value={capsulaActual.etiqueta || ""}
                  onChange={(e) => handleUpdateCapsula({ etiqueta: e.target.value })}
                  placeholder="ej: 🌊 Mendihuaca en vivo"
                  className="w-full px-3 py-2 text-xs font-sans rounded-xl border border-stone-light/80 bg-cream/20 focus:bg-white focus:border-forest outline-none transition-all"
                />
                <p className="text-[10px] text-stone mt-1">Texto de la cápsula flotante antes de abrirse.</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-forest mb-1">
                  Duración mostrada
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={5}
                    max={60}
                    value={capsulaActual.duracion_segundos || 15}
                    onChange={(e) => handleUpdateCapsula({ duracion_segundos: Number(e.target.value) || 15 })}
                    className="w-24 px-3 py-2 text-xs font-sans rounded-xl border border-stone-light/80 bg-cream/20 focus:bg-white focus:border-forest outline-none transition-all"
                  />
                  <span className="text-xs text-stone font-sans">segundos</span>
                </div>
                <p className="text-[10px] text-stone mt-1">Se muestra como badge indicador (ej: ▶ 15s).</p>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-forest mb-1">
                  Título dentro del visor
                </label>
                <input
                  type="text"
                  value={capsulaActual.titulo || ""}
                  onChange={(e) => handleUpdateCapsula({ titulo: e.target.value })}
                  placeholder="ej: Mendihuaca • Sierra Nevada & Caribe"
                  className="w-full px-3 py-2 text-xs font-sans rounded-xl border border-stone-light/80 bg-cream/20 focus:bg-white focus:border-forest outline-none transition-all"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-forest mb-1">
                  Descripción / Copy inspirador
                </label>
                <textarea
                  rows={2}
                  value={capsulaActual.descripcion || ""}
                  onChange={(e) => handleUpdateCapsula({ descripcion: e.target.value })}
                  placeholder="ej: Entre el río y el mar: así late hoy nuestro paraíso tropical."
                  className="w-full px-3 py-2 text-xs font-sans rounded-xl border border-stone-light/80 bg-cream/20 focus:bg-white focus:border-forest outline-none transition-all resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-forest mb-1">
                  Ruta o URL del Video (MP4)
                </label>
                <input
                  type="text"
                  value={capsulaActual.video_url || ""}
                  onChange={(e) => handleUpdateCapsula({ video_url: e.target.value })}
                  placeholder="ej: /videos/mendihuaca_vibra.mp4"
                  className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-stone-light/80 bg-cream/20 focus:bg-white focus:border-forest outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-forest mb-1">
                  Ruta o URL de Portada (Poster)
                </label>
                <input
                  type="text"
                  value={capsulaActual.poster_url || ""}
                  onChange={(e) => handleUpdateCapsula({ poster_url: e.target.value })}
                  placeholder="ej: /videos/mendihuaca_poster.jpg"
                  className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-stone-light/80 bg-cream/20 focus:bg-white focus:border-forest outline-none transition-all"
                />
              </div>
            </div>

            {capsulaActual.video_url && (
              <div className="pt-2 border-t border-stone-light/60 flex items-center justify-between text-xs text-stone">
                <span>Vista previa disponible en el feed público al activar y guardar.</span>
                <span className="font-mono text-[11px] bg-stone-light/30 px-2 py-0.5 rounded">
                  {capsulaActual.activa ? "Visible para turistas" : "Oculto"}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Columna Derecha: Visor del JSON en Vivo (4 cols) */}
        <div className="lg:col-span-5 xl:col-span-4 sticky top-20 space-y-4">
          <div className="bg-forest rounded-3xl p-5 sm:p-6 border border-forest-dark text-cream shadow-md space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-serif text-sm font-bold text-cream flex items-center gap-1.5">
                  <span>⚙️</span> Estructura Sincronizada
                </h3>
                <p className="text-[10px] text-cream/70 mt-0.5">
                  Configuración viva del feed territorial
                </p>
              </div>
              <button
                type="button"
                onClick={handleCopiarJSON}
                className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-[10px] font-semibold transition-colors cursor-pointer"
                title="Copiar texto de configuración"
              >
                {copiado ? "✓ Copiado" : "Copiar"}
              </button>
            </div>

            <pre className="bg-black/30 p-3.5 rounded-2xl text-[11px] font-mono text-cream/90 overflow-x-auto max-h-[520px] leading-relaxed border border-white/10 scrollbar-none">
              {jsonFormateado}
            </pre>

            <div className="text-[11px] text-cream/70 leading-relaxed border-t border-white/10 pt-3">
              ⚡ Al hacer clic en <strong className="text-white">Publicar Cambios</strong>, la configuración se sincroniza automáticamente en el servidor y actualiza la experiencia de los turistas en cada región.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
