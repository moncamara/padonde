"use client";

import { useState } from "react";
import { generarEnlaceWhatsAppHospedaje } from "@/lib/whatsappHospedaje";
import { RoomCard } from "./RoomCard";
import type { HabitacionHospedaje } from "@/lib/types";

interface StayCalculatorProps {
  habitaciones: HabitacionHospedaje[];
  hostalNombre: string;
  whatsapp: string;
  locale: string;
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
  labels,
}: StayCalculatorProps) {
  // 1. Habitación seleccionada (por defecto la primera)
  const [habitacionSeleccionada, setHabitacionSeleccionada] = useState<HabitacionHospedaje | null>(
    habitaciones && habitaciones.length > 0 ? habitaciones[0] : null
  );

  // 2. Fechas por defecto: hoy y mañana en formato YYYY-MM-DD
  const hoyStr = new Date().toISOString().split("T")[0];
  const mananaDate = new Date();
  mananaDate.setDate(mananaDate.getDate() + 1);
  const mananaStr = mananaDate.toISOString().split("T")[0];

  const [checkIn, setCheckIn] = useState<string>(hoyStr);
  const [checkOut, setCheckOut] = useState<string>(mananaStr);

  // 3. Huéspedes
  const [huespedes, setHuespedes] = useState<number>(1);

  // 4. Cálculo reactivo de noches (mínimo 1)
  const fechaIn = new Date(checkIn);
  const fechaOut = new Date(checkOut);
  const diffTime = fechaOut.getTime() - fechaIn.getTime();
  const nochesCalc = Math.round(diffTime / (1000 * 60 * 60 * 24));
  const noches = isNaN(nochesCalc) || nochesCalc < 1 ? 1 : nochesCalc;

  // 5. Cálculo del precio total estimado
  const precioNoche = habitacionSeleccionada ? habitacionSeleccionada.precio_noche_cop : 0;
  const precioTotal = precioNoche * noches;

  // 6. Enlace dinámico de WhatsApp
  const waUrl = habitacionSeleccionada
    ? generarEnlaceWhatsAppHospedaje({
        telefono: whatsapp,
        hostalNombre,
        habitacionTitulo: habitacionSeleccionada.titulo,
        checkIn,
        checkOut,
        noches,
        huespedes,
        precioTotalCOP: precioTotal,
        idioma: locale,
      })
    : `https://wa.me/${whatsapp.replace(/\D/g, "")}`;

  const handleCheckInChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setCheckIn(val);
    // Si la fecha de salida es menor o igual, ajustarla automáticamente a checkIn + 1 día
    if (new Date(checkOut) <= new Date(val)) {
      const nextDay = new Date(val);
      nextDay.setDate(nextDay.getDate() + 1);
      setCheckOut(nextDay.toISOString().split("T")[0]);
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

        <div className="space-y-3">
          {habitaciones.map((hab) => (
            <RoomCard
              key={hab.id}
              habitacion={hab}
              isSeleccionada={habitacionSeleccionada?.id === hab.id}
              onSelect={(h) => setHabitacionSeleccionada(h)}
              tSelect={labels.selectRoom}
              tSelected={labels.selectedRoom}
              tPerNight={labels.perNight}
            />
          ))}
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
              className="w-full bg-cream/70 border border-stone-light/80 rounded-xl px-2.5 py-2 text-xs font-sans text-forest focus:outline-none focus:border-forest transition-colors"
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
              onChange={(e) => setCheckOut(e.target.value)}
              className="w-full bg-cream/70 border border-stone-light/80 rounded-xl px-2.5 py-2 text-xs font-sans text-forest focus:outline-none focus:border-forest transition-colors"
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

        {/* Botón Principal de WhatsApp con Lead Estructurado */}
        <a
          href={waUrl}
          target="_blank"
          rel="noopener noreferrer"
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
    </section>
  );
}
