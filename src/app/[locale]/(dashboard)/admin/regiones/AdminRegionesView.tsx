"use client";

import { useState } from "react";
import { guardarConfigTerritorialAction } from "../actions";
import { CATEGORIAS, type CategoriaConfig, type TerritorialUXConfig } from "@/constants";
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

  // Guardar en config_territorial.json
  const handleGuardar = async () => {
    setIsGuardando(true);
    setMensaje(null);

    try {
      const res = await guardarConfigTerritorialAction({ config });
      if (res.success) {
        setMensaje({
          tipo: "exito",
          texto: "✅ Configuración territorial guardada exitosamente en config_territorial.json (sin tocar la BD).",
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

  // Copiar JSON al portapapeles
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
    <div className="space-y-6 max-w-5xl mx-auto font-sans">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="font-serif text-2xl text-forest font-bold tracking-tight">
            🗺️ Configuración Territorial de Categorías
          </h2>
          <p className="text-xs text-stone mt-1">
            Gestiona el orden de categorías y prioridad del feed por región directamente en el archivo JSON (100% sin base de datos).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCopiarJSON}
            className="px-3.5 py-2 rounded-xl border border-stone-light/80 bg-white hover:bg-cream text-forest text-xs font-semibold transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer"
          >
            <span>{copiado ? "✅" : "📋"}</span>
            <span>{copiado ? "¡JSON Copiado!" : "Copiar JSON"}</span>
          </button>

          <button
            type="button"
            disabled={isGuardando}
            onClick={handleGuardar}
            className="px-4 py-2 rounded-xl bg-forest hover:bg-forest-dark active:scale-95 text-cream text-xs font-semibold transition-all shadow-md flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <span>{isGuardando ? "⏳" : "💾"}</span>
            <span>{isGuardando ? "Guardando..." : "Guardar en JSON"}</span>
          </button>
        </div>
      </div>

      {mensaje && (
        <div
          className={`p-3.5 rounded-2xl text-xs font-medium border animate-in fade-in ${
            mensaje.tipo === "exito"
              ? "bg-green-50 border-green-200 text-green-800"
              : "bg-red-50 border-red-200 text-red-800"
          }`}
        >
          {mensaje.texto}
        </div>
      )}

      {/* Selector de Regiones */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
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
              className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                isActiva
                  ? "bg-forest text-white border-forest shadow-sm ring-2 ring-forest/20"
                  : "bg-white/70 hover:bg-white border-stone-light/80 text-stone hover:text-forest shadow-2xs"
              }`}
            >
              <div className="text-xl mb-1">{info.icono}</div>
              <div className="font-bold text-sm tracking-tight">{info.nombre}</div>
              <div
                className={`text-[10px] line-clamp-1 mt-0.5 ${
                  isActiva ? "text-cream/80" : "text-stone"
                }`}
              >
                {info.subtitulo}
              </div>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Columna Izquierda: Configurador Visual de la Región (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          {/* 1. Prioridad del Feed */}
          <div className="bg-white rounded-3xl p-5 border border-stone-light/70 shadow-2xs space-y-3">
            <div>
              <h3 className="font-serif text-base text-forest font-bold">
                1. Prioridad de Contenido en el Feed
              </h3>
              <p className="text-[11px] text-stone mt-0.5">
                Define qué tipo de contenido se muestra primero en la cartelera de{" "}
                <span className="font-semibold text-forest">
                  {REGIONES_INFO[regionActiva]?.nombre}
                </span>
                .
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
              <label
                onClick={() => handleCambiarCriterio("agenda_primero")}
                className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between ${
                  regionActual.criterioOrdenFeed === "agenda_primero"
                    ? "bg-forest/5 border-forest text-forest ring-1 ring-forest"
                    : "bg-cream/30 border-stone-light/80 text-stone hover:border-forest/50"
                }`}
              >
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="criterio"
                    checked={regionActual.criterioOrdenFeed === "agenda_primero"}
                    onChange={() => handleCambiarCriterio("agenda_primero")}
                    className="accent-forest cursor-pointer"
                  />
                  <span className="font-bold text-xs">🌿 Agenda / Planes primero</span>
                </div>
                <p className="text-[10px] text-stone mt-2 pl-5">
                  Eventos diarios y gastronomía arriba; hospedajes al final. (Ideal para Minca).
                </p>
              </label>

              <label
                onClick={() => handleCambiarCriterio("hospedaje_primero")}
                className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between ${
                  regionActual.criterioOrdenFeed === "hospedaje_primero"
                    ? "bg-forest/5 border-forest text-forest ring-1 ring-forest"
                    : "bg-cream/30 border-stone-light/80 text-stone hover:border-forest/50"
                }`}
              >
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="criterio"
                    checked={regionActual.criterioOrdenFeed === "hospedaje_primero"}
                    onChange={() => handleCambiarCriterio("hospedaje_primero")}
                    className="accent-forest cursor-pointer"
                  />
                  <span className="font-bold text-xs">🏡 Hospedajes primero</span>
                </div>
                <p className="text-[10px] text-stone mt-2 pl-5">
                  Cabañas y hostales arriba; planes después. (Ideal para Mendihuaca/playa).
                </p>
              </label>
            </div>
          </div>

          {/* 2. Orden de Categorías */}
          <div className="bg-white rounded-3xl p-5 border border-stone-light/70 shadow-2xs space-y-3">
            <div>
              <h3 className="font-serif text-base text-forest font-bold">
                2. Orden de Categorías del Menú & Swipe
              </h3>
              <p className="text-[11px] text-stone mt-0.5">
                Usa los botones para subir o bajar las categorías. Este orden determina la barra superior y la secuencia al deslizar (swipe) en el móvil.
              </p>
            </div>

            <div className="space-y-1.5 pt-1">
              {regionActual.ordenCategorias.map((catId, index) => {
                const catObj = catMap.get(catId);
                const isFirst = index === 0;
                const isLast = index === regionActual.ordenCategorias.length - 1;

                return (
                  <div
                    key={catId}
                    className="flex items-center justify-between p-2.5 rounded-2xl bg-cream/40 border border-stone-light/70 text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="w-5 text-center text-[11px] font-bold text-stone">
                        #{index + 1}
                      </span>
                      <span className="text-lg">{catObj?.emoji || "✨"}</span>
                      <div>
                        <span className="font-bold text-forest">
                          {catObj?.label || catId}
                        </span>
                        <span className="text-[10px] text-stone font-mono ml-2">
                          ({catId})
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        disabled={isFirst}
                        onClick={() => handleMoverCategoria(index, "arriba")}
                        className="w-7 h-7 rounded-lg border border-stone-light/80 bg-white hover:bg-forest hover:text-white text-stone flex items-center justify-center text-xs transition-colors disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                        title="Subir de posición"
                      >
                        ▲
                      </button>
                      <button
                        type="button"
                        disabled={isLast}
                        onClick={() => handleMoverCategoria(index, "abajo")}
                        className="w-7 h-7 rounded-lg border border-stone-light/80 bg-white hover:bg-forest hover:text-white text-stone flex items-center justify-center text-xs transition-colors disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
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
        </div>

        {/* Columna Derecha: Visor del JSON en Vivo (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-forest rounded-3xl p-5 border border-forest-dark text-cream shadow-md space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-serif text-sm font-bold text-cream flex items-center gap-1.5">
                  <span>📄</span> config_territorial.json
                </h3>
                <p className="text-[10px] text-cream/70 mt-0.5">
                  Representación viva del archivo JSON en el proyecto
                </p>
              </div>
              <button
                type="button"
                onClick={handleCopiarJSON}
                className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-[10px] font-semibold transition-colors cursor-pointer"
              >
                {copiado ? "✓ Copiado" : "Copiar"}
              </button>
            </div>

            <pre className="bg-black/30 p-3.5 rounded-2xl text-[11px] font-mono text-cream/90 overflow-x-auto max-h-[500px] leading-relaxed border border-white/10">
              {jsonFormateado}
            </pre>

            <div className="text-[10px] text-cream/60 leading-relaxed border-t border-white/10 pt-2.5">
              💡 Este JSON se lee en tiempo de compilación y servidor directamente desde{" "}
              <code className="text-amber-300 font-mono">
                src/constants/config_territorial.json
              </code>
              , garantizando máxima velocidad sin consultas a la base de datos de Supabase.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
