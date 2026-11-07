"use client";

import { useState, useEffect } from "react";
import { useLocale } from "next-intl";
import type { TarifarioTransporte } from "@/data/tarifas/types";
import { DrawerTarifarioTransporte } from "@/components/services/DrawerTarifarioTransporte";

interface SeccionTarifarioEventoProps {
  tarifario: TarifarioTransporte;
  zonaNombre: string;
}

const TEXTOS_SECCION: Record<
  string,
  {
    badge: string;
    destinosYExcursiones: string;
    descripcion: string;
    capacidad: string;
    tipoVehiculo: string;
    preciosFijos: string;
    boton: string;
  }
> = {
  es: {
    badge: "Tarifas Oficiales",
    destinosYExcursiones: "Destinos y Excursiones",
    descripcion:
      "Consulta las tarifas oficiales fijadas para traslados y tours en camperos 4x4 encapsulados. Incluye rutas a Cerro Kennedy, San Rafael, cascadas Marinka, Sierra Alta y expresos directos a Santa Marta o Aeropuerto.",
    capacidad: "Solo ida • De 1 a 4 personas",
    tipoVehiculo: "Camperos 4x4 encapsulados",
    preciosFijos: "Precios fijos en COP",
    boton: "Ver Tarifario Completo y Cotizar por WhatsApp",
  },
  en: {
    badge: "Official Rates",
    destinosYExcursiones: "Destinations & Tours",
    descripcion:
      "Check official fixed rates for private transfers and mountain tours in enclosed 4x4 vehicles. Includes routes to Cerro Kennedy, San Rafael, Marinka waterfalls, High Sierra, and direct expresses to Santa Marta or Airport.",
    capacidad: "One way • 1 to 4 passengers",
    tipoVehiculo: "Enclosed 4x4 vehicles",
    preciosFijos: "Fixed rates in COP",
    boton: "View Full Rate Card & Inquire via WhatsApp",
  },
  fr: {
    badge: "Tarifs Officiels",
    destinosYExcursiones: "Destinations & Circuits",
    descripcion:
      "Consultez les tarifs officiels pour les transferts et excursions en véhicules 4x4 fermés. Comprend les pistes du Cerro Kennedy, San Rafael, cascades Marinka, Haute Sierra et liaisons directes vers Santa Marta ou Aéroport.",
    capacidad: "Aller simple • De 1 à 4 personnes",
    tipoVehiculo: "Véhicules 4x4 fermés",
    preciosFijos: "Tarifs fixes en COP",
    boton: "Voir la Grille Tarifaire & Réserver via WhatsApp",
  },
  de: {
    badge: "Offizielle Tarife",
    destinosYExcursiones: "Ziele & Expeditionen",
    descripcion:
      "Hier findest du die offiziellen Festpreise für Transfers und Bergtouren in geschlossenen 4x4-Geländewagen. Beinhaltet Strecken zum Cerro Kennedy, San Rafael, Marinka-Wasserfällen, Hohe Sierra und Express-Fahrten nach Santa Marta oder Flughafen.",
    capacidad: "Einfache Fahrt • 1 bis 4 Personen",
    tipoVehiculo: "Geschlossene 4x4-Geländewagen",
    preciosFijos: "Festpreise in COP",
    boton: "Vollständige Tarife ansehen & via WhatsApp anfragen",
  },
};

export function SeccionTarifarioEvento({
  tarifario,
  zonaNombre,
}: SeccionTarifarioEventoProps) {
  const locale = useLocale();
  const t = TEXTOS_SECCION[locale] || TEXTOS_SECCION.es;

  // Restauración inmediata al cambiar de idioma para evitar que el drawer se cierre
  const [drawerAbierto, setDrawerAbierto] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      try {
        const wasOpen = sessionStorage.getItem("padonde_tarifario_open");
        const savedId = sessionStorage.getItem("padonde_tarifario_id");
        return wasOpen === "true" && (!savedId || savedId === tarifario.id);
      } catch {}
    }
    return false;
  });

  useEffect(() => {
    try {
      const wasOpen = sessionStorage.getItem("padonde_tarifario_open");
      const savedId = sessionStorage.getItem("padonde_tarifario_id");
      if (wasOpen === "true" && (!savedId || savedId === tarifario.id)) {
        setDrawerAbierto(true);
      }
    } catch {}
  }, [tarifario.id]);

  const abrirDrawer = () => {
    try {
      sessionStorage.setItem("padonde_tarifario_open", "true");
      sessionStorage.setItem("padonde_tarifario_id", tarifario.id);
    } catch {}
    setDrawerAbierto(true);
  };

  const cerrarDrawer = () => {
    try {
      sessionStorage.removeItem("padonde_tarifario_open");
      sessionStorage.removeItem("padonde_tarifario_id");
    } catch {}
    setDrawerAbierto(false);
  };

  const totalRutas = Object.values(tarifario.tarifas).flat().length;
  const es4x4 = tarifario.subcategoria?.includes("4x4") || tarifario.condiciones.tipo_vehiculo.toLowerCase().includes("4x4");

  const descripcionDinamica = es4x4
    ? t.descripcion
    : locale === "en"
    ? `Check official fixed rates for private door-to-door transfers, airport expresses, Tayrona Park, beaches, and Caribbean Coast cities.`
    : locale === "fr"
    ? `Consultez les tarifs officiels pour les transferts privés de porte à porte, aéroports, Parc Tayrona, plages et villes de la Côte Caraïbe.`
    : locale === "de"
    ? `Hier findest du die offiziellen Festpreise für private Transfers von Tür zu Tür, Expressfahrten zum Flughafen, Tayrona-Park, Stränden und Städten an der Karibikküste.`
    : `Consulta las tarifas oficiales fijadas para traslados privados de puerta a puerta, expresos a aeropuertos, Parque Tayrona, playas y ciudades de la Costa Caribe.`;

  return (
    <>
      <section className="bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent rounded-3xl border border-amber-300/80 p-5 sm:p-6 shadow-xs space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xl">{es4x4 ? "🚙" : "🚐"}</span>
              <span className="text-xs font-bold uppercase tracking-wider text-amber-900 bg-amber-200/60 px-2.5 py-0.5 rounded-full border border-amber-300">
                {t.badge}
              </span>
            </div>
            <h3 className="font-serif text-lg sm:text-xl font-bold text-forest">
              {tarifario.nombre} — {totalRutas} {t.destinosYExcursiones}
            </h3>
          </div>
          <span className="text-2xl shrink-0">📋</span>
        </div>

        <p className="font-sans text-xs sm:text-sm text-stone leading-relaxed">
          {descripcionDinamica}
        </p>

        <div className="flex flex-wrap items-center gap-2 text-[11px] font-sans text-amber-950 font-medium pt-1">
          <span className="bg-white/80 border border-amber-200 px-2.5 py-1 rounded-xl shadow-2xs">
            👥 {tarifario.condiciones?.capacidad || t.capacidad}
          </span>
          <span className="bg-white/80 border border-amber-200 px-2.5 py-1 rounded-xl shadow-2xs">
            🛡️ {tarifario.condiciones?.tipo_vehiculo || t.tipoVehiculo}
          </span>
          <span className="bg-white/80 border border-amber-200 px-2.5 py-1 rounded-xl shadow-2xs">
            💵 {t.preciosFijos}
          </span>
        </div>

        <div className="pt-2">
          <button
            type="button"
            onClick={abrirDrawer}
            className="w-full min-h-[48px] py-3 px-4 rounded-2xl bg-amber-500 hover:bg-amber-600 text-amber-950 font-sans text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-sm active:scale-[0.99] transition-all cursor-pointer"
          >
            <span>🔍</span>
            <span>{t.boton}</span>
            <span className="text-base font-normal">↗</span>
          </button>
        </div>
      </section>

      {drawerAbierto && (
        <DrawerTarifarioTransporte
          tarifario={tarifario}
          isOpen={drawerAbierto}
          onClose={cerrarDrawer}
          zonaNombre={zonaNombre}
        />
      )}
    </>
  );
}

