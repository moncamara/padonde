"use client";

import { useState } from "react";
import Image from "next/image";
import { Link } from "@/i18n/routing";
import { ModalEditarHospedaje } from "./ModalEditarHospedaje";

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
  const [modalAbierto, setModalAbierto] = useState(false);
  const [hospedajeEnEdicion, setHospedajeEnEdicion] = useState<any | null>(null);

  const abrirNuevo = () => {
    setHospedajeEnEdicion(null);
    setModalAbierto(true);
  };

  const abrirEditar = (hosp: any) => {
    setHospedajeEnEdicion(hosp);
    setModalAbierto(true);
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

        <button
          onClick={abrirNuevo}
          className="px-4 py-2.5 bg-forest text-cream font-sans text-xs font-semibold rounded-2xl hover:bg-forest-dark active:scale-95 transition-all shadow-sm flex items-center justify-center gap-1.5 self-start sm:self-auto"
        >
          <span>➕</span>
          <span>Nuevo Hospedaje</span>
        </button>
      </div>

      {/* Lista de Hospedajes */}
      {hospedajes.length === 0 ? (
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
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {hospedajes.map((hosp) => {
            const zonaNombre = hosp.zonas?.nombre || "Minca";
            const zonaSlug = hosp.zonas?.slug || "minca";
            const numHabitaciones = hosp.metadata_hospedaje?.habitaciones?.length || 0;
            const rating = hosp.metadata_hospedaje?.google_reputacion?.rating;
            const totalReviews = hosp.metadata_hospedaje?.google_reputacion?.total_reviews;

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
                        <span className="inline-block text-[10px] font-sans font-medium text-terra bg-terra/10 px-2 py-0.5 rounded-full mb-0.5">
                          📍 {zonaNombre}
                        </span>
                        <h3 className="font-serif text-base font-bold text-forest leading-snug">
                          {hosp.titulo}
                        </h3>
                        <p className="font-sans text-xs text-stone">
                          {hosp.negocio?.nombre}
                        </p>
                      </div>
                    </div>

                    <span
                      className={`text-[10px] font-sans font-medium px-2 py-0.5 rounded-full ${
                        hosp.activo
                          ? "bg-green-100 text-green-700"
                          : "bg-stone-light/60 text-stone"
                      }`}
                    >
                      {hosp.activo ? "En vivo" : "Pausado"}
                    </span>
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
                <div className="flex items-center justify-between pt-2 border-t border-stone-light/40">
                  <Link
                    href={`/${zonaSlug}/${hosp.id}`}
                    target="_blank"
                    className="text-xs font-sans text-stone hover:text-forest underline underline-offset-2 flex items-center gap-1"
                  >
                    <span>Ver ficha pública ↗</span>
                  </Link>

                  <button
                    onClick={() => abrirEditar(hosp)}
                    className="px-3 py-1.5 bg-forest/10 hover:bg-forest text-forest hover:text-cream text-xs font-sans font-medium rounded-xl transition-all"
                  >
                    ✏️ Editar y Tarifas
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Modal Formulario de Creación / Edición */}
      {modalAbierto && (
        <ModalEditarHospedaje
          hospedaje={hospedajeEnEdicion}
          zonas={zonas}
          onClose={() => setModalAbierto(false)}
        />
      )}
    </div>
  );
}
