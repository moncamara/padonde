"use client";

import { useState, useEffect } from "react";
import { generarEnlaceWhatsAppHospedaje } from "@/lib/whatsappHospedaje";
import { trackWhatsAppClick } from "@/lib/analytics";
import { getFechaYMDColombia } from "@/lib/utils";
import { RoomCard } from "./RoomCard";
import type { HabitacionHospedaje, ModoVisualizacionHospedaje } from "@/lib/types";

interface StayCalculatorProps {
  habitaciones: HabitacionHospedaje[];
  hostalNombre: string;
  whatsapp: string;
  locale: string;
  eventoId?: string;
  negocioId?: string;
  zonaSlug?: string;
  /** "galeria_y_lista_precios" ⇒ galería de habitaciones arriba + filas compactas sin miniaturas. */
  modoVisualizacion?: ModoVisualizacionHospedaje;
  /** Fotos de habitaciones para el modo "galeria_y_lista_precios" */
  galeriaHabitaciones?: string[];
  labels: {
    sectionTitle: string;
    sectionSubtitle: string;
    checkIn: string;
    checkOut: string;
    guests: string;
    nights: string;
    nightSingular: string;
    estimatedTotal: string;
    consultWhatsApp: string;
    disclaimer: string;
    selectRoom: string;
    selectedRoom: string;
    perNight: string;
    chooseRoomHint: string;
  };
}

export function StayCalculator({
  habitaciones,
  hostalNombre,
  whatsapp,
  locale,
  eventoId,
  negocioId,
  zonaSlug,
  modoVisualizacion = "habitaciones_con_fotos",
  galeriaHabitaciones,
  labels,
}: StayCalculatorProps) {
  const esCompacto = modoVisualizacion === "galeria_y_lista_precios";
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);

  // Fotos unificadas para el carrusel de "Habitaciones y Acomodación" en modo compacto
  const fotosHabitacionesUnificadas = esCompacto
    ? Array.from(
        new Set(
          [
            ...(Array.isArray(galeriaHabitaciones) ? galeriaHabitaciones : []),
            ...(Array.isArray(habitaciones)
              ? habitaciones.flatMap((h) => (Array.isArray(h?.fotos) ? h.fotos : []))
              : []),
          ].filter((u): u is string => typeof u === "string" && u.trim().length > 0)
        )
      )
    : [];

  useEffect(() => {
    if (lightboxIdx === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightboxIdx(null);
      else if (e.key === "ArrowRight")
        setLightboxIdx((i) => (i === null ? null : (i + 1) % fotosHabitacionesUnificadas.length));
      else if (e.key === "ArrowLeft")
        setLightboxIdx((i) =>
          i === null
            ? null
            : (i - 1 + fotosHabitacionesUnificadas.length) % fotosHabitacionesUnificadas.length
        );
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightboxIdx, fotosHabitacionesUnificadas.length]);
  // 1. Habitación seleccionada con blindaje null-safe
  const listaHabitaciones = Array.isArray(habitaciones) ? habitaciones : [];
  const [habitacionSeleccionada, setHabitacionSeleccionada] = useState<HabitacionHospedaje | null>(
    listaHabitaciones.length > 0 ? listaHabitaciones[0] : null
  );

  // 2. Fechas por defecto calculadas estrictamente en la zona horaria de Colombia (UTC-5)
  const hoyStr = getFechaYMDColombia(new Date());
  const mananaDate = new Date(`${hoyStr}T12:00:00-05:00`);
  mananaDate.setDate(mananaDate.getDate() + 1);
  const mananaStr = getFechaYMDColombia(mananaDate);

  const [checkIn, setCheckIn] = useState<string>(hoyStr);
  const [checkOut, setCheckOut] = useState<string>(mananaStr);

  // 3. Huéspedes
  const [huespedes, setHuespedes] = useState<number>(1);

  // 4. Cálculo reactivo de noches con validación estricta (mínimo 1)
  const fechaIn = new Date((checkIn || hoyStr) + "T12:00:00-05:00");
  const fechaOut = new Date((checkOut || mananaStr) + "T12:00:00-05:00");
  const diffTime = fechaOut.getTime() - fechaIn.getTime();
  const diffDias = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  const noches = !isNaN(diffDias) && diffDias > 0 ? diffDias : 1;

  // 5. Cálculo del precio total estimado
  const precioNoche = habitacionSeleccionada ? (habitacionSeleccionada.precio_noche_cop ?? 0) : 0;
  const precioTotal = Math.max(0, precioNoche * noches);

  // 6. Enlace dinámico de WhatsApp
  const waUrl = habitacionSeleccionada
    ? generarEnlaceWhatsAppHospedaje({
        telefono: whatsapp,
        hostalNombre,
        habitacionTitulo: habitacionSeleccionada.titulo,
        checkIn: checkIn || hoyStr,
        checkOut: checkOut || mananaStr,
        noches,
        huespedes,
        precioTotalCOP: precioTotal,
        idioma: locale,
      })
    : `https://wa.me/${(whatsapp || "").replace(/\D/g, "")}`;

  const handleCheckInChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (!val) return;
    setCheckIn(val);
    const dIn = new Date(val + "T12:00:00-05:00");
    const dOut = new Date(checkOut + "T12:00:00-05:00");
    if (isNaN(dIn.getTime()) || isNaN(dOut.getTime()) || dOut <= dIn) {
      const nextDay = new Date(dIn);
      nextDay.setDate(nextDay.getDate() + 1);
      setCheckOut(getFechaYMDColombia(nextDay));
    }
  };

  const handleCheckOutChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (!val) return;
    const dIn = new Date(checkIn + "T12:00:00-05:00");
    const dOut = new Date(val + "T12:00:00-05:00");
    if (isNaN(dOut.getTime()) || isNaN(dIn.getTime()) || dOut <= dIn) {
      const nextDay = new Date(dIn);
      nextDay.setDate(nextDay.getDate() + 1);
      setCheckOut(getFechaYMDColombia(nextDay));
    } else {
      setCheckOut(val);
    }
  };

  return (
    <section className="space-y-6 pt-2">
      {/* Selector visual de habitaciones */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="font-serif text-lg text-forest font-bold">
              {labels.sectionTitle}
            </h2>
            <p className="font-sans text-xs text-stone mt-0.5">
              {labels.sectionSubtitle}
            </p>
          </div>
        </div>

        {/* Carrusel horizontal nativo de habitaciones (solo en modo galeria_y_lista_precios) */}
        {esCompacto && fotosHabitacionesUnificadas.length > 0 && (
          <div className="mb-3.5 space-y-1.5">
            <div className="flex gap-2.5 overflow-x-auto snap-x snap-mandatory scrollbar-none pb-1">
              {fotosHabitacionesUnificadas.map((src, idx) => (
                <button
                  key={`${src}-${idx}`}
                  type="button"
                  onClick={() => setLightboxIdx(idx)}
                  aria-label={`Ver foto ${idx + 1} de ${fotosHabitacionesUnificadas.length}`}
                  className="relative shrink-0 w-44 sm:w-48 aspect-[4/3] rounded-2xl overflow-hidden bg-stone-light/40 border border-stone-light/70 snap-start cursor-pointer group focus:outline-none focus:ring-2 focus:ring-forest"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={src}
                    alt={`${hostalNombre} - habitación ${idx + 1}`}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <span className="absolute bottom-1.5 right-1.5 bg-black/55 backdrop-blur-xs text-white text-[10px] font-sans px-1.5 py-0.5 rounded-full">
                    {idx + 1}/{fotosHabitacionesUnificadas.length}
                  </span>
                </button>
              ))}
            </div>
            <p className="text-[11px] font-sans text-stone/80 flex items-center gap-1">
              <span>👆</span>
              <span>Desliza o toca una foto para ampliarla</span>
            </p>
          </div>
        )}

        <div className={esCompacto ? "space-y-2" : "space-y-3"}>
          {listaHabitaciones.length > 0 ? (
            listaHabitaciones.map((hab) => (
              <RoomCard
                key={hab.id}
                habitacion={hab}
                isSeleccionada={habitacionSeleccionada?.id === hab.id}
                onSelect={(h) => setHabitacionSeleccionada(h)}
                tSelect={labels.selectRoom}
                tSelected={labels.selectedRoom}
                tPerNight={labels.perNight}
                compacto={esCompacto}
              />
            ))
          ) : (
            <div className="p-4 rounded-2xl bg-cream/70 border border-stone-light/70 text-center text-xs text-stone font-sans">
              🏡 Consulta directamente por WhatsApp las habitaciones y tarifas disponibles para este hospedaje.
            </div>
          )}
        </div>
      </div>

      {/* Widget Calculadora / Pre-cotizador */}
      <div className="bg-white/90 backdrop-blur-md rounded-3xl p-5 border border-forest/15 shadow-sm space-y-4">
        <div className="flex items-center gap-2 border-b border-stone-light/50 pb-3">
          <span className="text-xl">🧮</span>
          <div>
            <h3 className="font-serif text-sm font-bold text-forest">
              {habitacionSeleccionada ? habitacionSeleccionada.titulo : labels.chooseRoomHint}
            </h3>
            <p className="font-sans text-[11px] text-stone">
              ${precioNoche.toLocaleString("es-CO")} {labels.perNight}
            </p>
          </div>
        </div>

        {/* Inputs de fechas nativos (0 KB de dependencias) */}
        <div className="grid grid-cols-2 gap-2.5">
          <div>
            <label className="block text-[11px] font-sans font-medium text-stone mb-1">
              📅 {labels.checkIn}
            </label>
            <input
              type="date"
              min={hoyStr}
              value={checkIn}
              onChange={handleCheckInChange}
              className="w-full bg-cream/70 border border-stone-light/80 rounded-xl px-2.5 py-2 text-base sm:text-xs font-sans text-forest focus:outline-none focus:border-forest transition-colors"
            />
          </div>

          <div>
            <label className="block text-[11px] font-sans font-medium text-stone mb-1">
              📅 {labels.checkOut}
            </label>
            <input
              type="date"
              min={checkIn}
              value={checkOut}
              onChange={handleCheckOutChange}
              className="w-full bg-cream/70 border border-stone-light/80 rounded-xl px-2.5 py-2 text-base sm:text-xs font-sans text-forest focus:outline-none focus:border-forest transition-colors"
            />
          </div>
        </div>

        {/* Selector de Huéspedes */}
        <div className="flex items-center justify-between bg-cream/60 px-3 py-2 rounded-xl border border-stone-light/60">
          <span className="text-xs font-sans text-stone font-medium">
            👥 {labels.guests}
          </span>
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => setHuespedes((prev) => Math.max(1, prev - 1))}
              disabled={huespedes <= 1}
              className="w-7 h-7 rounded-lg bg-white border border-stone-light text-forest font-bold text-sm flex items-center justify-center disabled:opacity-40 active:scale-95 transition-all"
            >
              -
            </button>
            <span className="font-sans text-xs font-bold text-forest w-4 text-center">
              {huespedes}
            </span>
            <button
              type="button"
              onClick={() =>
                setHuespedes((prev) =>
                  habitacionSeleccionada
                    ? Math.min(habitacionSeleccionada.capacidad_max, prev + 1)
                    : prev + 1
                )
              }
              disabled={
                habitacionSeleccionada ? huespedes >= habitacionSeleccionada.capacidad_max : false
              }
              className="w-7 h-7 rounded-lg bg-white border border-stone-light text-forest font-bold text-sm flex items-center justify-center disabled:opacity-40 active:scale-95 transition-all"
            >
              +
            </button>
          </div>
        </div>

        {/* Resumen de Tarifa y Total Estimado */}
        <div className="bg-cream/40 p-3 rounded-xl border border-stone-light/50 space-y-1.5">
          <div className="flex justify-between text-xs font-sans text-stone">
            <span>
              {noches} {noches === 1 ? labels.nightSingular : labels.nights} × $
              {precioNoche.toLocaleString("es-CO")}
            </span>
            <span>${precioTotal.toLocaleString("es-CO")} COP</span>
          </div>
          <div className="flex justify-between items-baseline font-serif pt-1 border-t border-stone-light/40">
            <span className="text-xs font-bold text-forest">{labels.estimatedTotal}:</span>
            <span className="text-base font-bold text-terra">
              ${precioTotal.toLocaleString("es-CO")}{" "}
              <span className="text-[10px] font-sans font-normal text-stone">COP</span>
            </span>
          </div>
        </div>

        {/* Botón Principal de WhatsApp con Lead Estructurado y Telemetría GA4/Interna */}
        <a
          href={waUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => {
            trackWhatsAppClick({
              aliado_nombre: hostalNombre || "Hospedaje",
              tipo_categoria: "hospedaje",
              seccion_origen: "cotizador_hospedaje",
              region_destino: zonaSlug,
              eventoId: eventoId || hostalNombre,
              eventoTitulo: habitacionSeleccionada
                ? `${hostalNombre} — ${habitacionSeleccionada.titulo}`
                : `${hostalNombre} — Cotización`,
              negocioNombre: hostalNombre,
              negocioId,
              precio: precioTotal,
              detalles: {
                habitacion: habitacionSeleccionada?.titulo || "Habitación",
                noches,
                huespedes,
                precioTotal,
                checkIn,
                checkOut,
              },
            });
          }}
          className="w-full py-3.5 bg-forest text-cream text-xs sm:text-sm font-sans font-semibold rounded-2xl hover:bg-forest-dark active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-md"
        >
          <span>💬</span>
          <span>{labels.consultWhatsApp}</span>
        </a>

        {/* Microcopy de Descargo (Blindaje para el anfitrión) */}
        <p className="text-[10px] font-sans text-stone/80 text-center leading-tight">
          ℹ️ {labels.disclaimer}
        </p>
      </div>

      {/* Lightbox ligero (0 dependencias) para ampliar fotos de habitaciones */}
      {lightboxIdx !== null && fotosHabitacionesUnificadas[lightboxIdx] && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setLightboxIdx(null)}
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <button
            type="button"
            onClick={() => setLightboxIdx(null)}
            aria-label="Cerrar galería"
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/15 hover:bg-white/25 text-white text-lg flex items-center justify-center cursor-pointer"
          >
            ✕
          </button>

          {fotosHabitacionesUnificadas.length > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setLightboxIdx(
                    (lightboxIdx - 1 + fotosHabitacionesUnificadas.length) %
                      fotosHabitacionesUnificadas.length
                  );
                }}
                aria-label="Foto anterior"
                className="absolute left-3 sm:left-5 w-10 h-10 rounded-full bg-white/15 hover:bg-white/25 text-white text-xl flex items-center justify-center cursor-pointer"
              >
                ‹
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setLightboxIdx((lightboxIdx + 1) % fotosHabitacionesUnificadas.length);
                }}
                aria-label="Foto siguiente"
                className="absolute right-3 sm:right-5 w-10 h-10 rounded-full bg-white/15 hover:bg-white/25 text-white text-xl flex items-center justify-center cursor-pointer"
              >
                ›
              </button>
            </>
          )}

          <div onClick={(e) => e.stopPropagation()} className="max-w-2xl w-full flex flex-col items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={fotosHabitacionesUnificadas[lightboxIdx]}
              alt={`${hostalNombre} - habitación ${lightboxIdx + 1}`}
              className="max-h-[78vh] w-auto max-w-full rounded-2xl object-contain shadow-2xl"
            />
            <span className="text-xs font-sans text-white/80">
              {lightboxIdx + 1} / {fotosHabitacionesUnificadas.length}
            </span>
          </div>
        </div>
      )}
    </section>
  );
}
