"use client";

import { useState } from "react";
import type { TarifarioTransporte } from "@/data/tarifas/types";
import { DrawerTarifarioTransporte } from "@/components/services/DrawerTarifarioTransporte";

interface SeccionTarifarioEventoProps {
  tarifario: TarifarioTransporte;
  zonaNombre: string;
}

export function SeccionTarifarioEvento({
  tarifario,
  zonaNombre,
}: SeccionTarifarioEventoProps) {
  const [drawerAbierto, setDrawerAbierto] = useState(false);
  const totalRutas = Object.values(tarifario.tarifas).flat().length;

  return (
    <>
      <section className="bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent rounded-3xl border border-amber-300/80 p-5 sm:p-6 shadow-xs space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xl">🚙</span>
              <span className="text-xs font-bold uppercase tracking-wider text-amber-900 bg-amber-200/60 px-2.5 py-0.5 rounded-full border border-amber-300">
                Tarifas Oficiales
              </span>
            </div>
            <h3 className="font-serif text-lg sm:text-xl font-bold text-forest">
              {tarifario.nombre} — {totalRutas} Destinos y Excursiones
            </h3>
          </div>
          <span className="text-2xl shrink-0">📋</span>
        </div>

        <p className="font-sans text-xs sm:text-sm text-stone leading-relaxed">
          Consulta las tarifas oficiales fijadas para traslados y tours en camperos 4x4 encapsulados.
          Incluye rutas a Cerro Kennedy, San Rafael, cascadas Marinka, Sierra Alta y expresos directos a Santa Marta o Aeropuerto.
        </p>

        <div className="flex flex-wrap items-center gap-2 text-[11px] font-sans text-amber-950 font-medium pt-1">
          <span className="bg-white/80 border border-amber-200 px-2.5 py-1 rounded-xl shadow-2xs">
            👥 {tarifario.condiciones.capacidad}
          </span>
          <span className="bg-white/80 border border-amber-200 px-2.5 py-1 rounded-xl shadow-2xs">
            🛡️ {tarifario.condiciones.tipo_vehiculo}
          </span>
          <span className="bg-white/80 border border-amber-200 px-2.5 py-1 rounded-xl shadow-2xs">
            💵 Precios fijos en {tarifario.condiciones.moneda}
          </span>
        </div>

        <div className="pt-2">
          <button
            type="button"
            onClick={() => setDrawerAbierto(true)}
            className="w-full min-h-[48px] py-3 px-4 rounded-2xl bg-amber-500 hover:bg-amber-600 text-amber-950 font-sans text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-sm active:scale-[0.99] transition-all cursor-pointer"
          >
            <span>🔍</span>
            <span>Ver Tarifario Completo y Cotizar por WhatsApp</span>
            <span className="text-base font-normal">↗</span>
          </button>
        </div>
      </section>

      {drawerAbierto && (
        <DrawerTarifarioTransporte
          tarifario={tarifario}
          isOpen={drawerAbierto}
          onClose={() => setDrawerAbierto(false)}
          zonaNombre={zonaNombre}
        />
      )}
    </>
  );
}
