"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { EventFeed } from "@/components/events/EventFeed";
import { ServiciosList } from "@/components/services/ServiciosList";
import { TabsDestinos } from "@/components/layout/TabsDestinos";
import type { EventoConNegocio, ServicioEsencial } from "@/lib/types";
import type { TerritorialUXConfig } from "@/constants";
import { trackTabChange } from "@/lib/analytics";

interface FeedTabsContainerProps {
  eventos: EventoConNegocio[];
  servicios: ServicioEsencial[];
  zona: string;
  zonaNombre: string;
  configTerritorial?: Record<string, TerritorialUXConfig>;
}

export function FeedTabsContainer({
  eventos,
  servicios,
  zona,
  zonaNombre,
  configTerritorial,
}: FeedTabsContainerProps) {
  const t = useTranslations("essentialServices");
  const locale = useLocale();
  const searchParams = useSearchParams();
  const [tabActiva, setTabActiva] = useState<"eventos" | "servicios">("eventos");

  useEffect(() => {
    const urlTab = searchParams.get("tab");
    const hash = typeof window !== "undefined" ? window.location.hash : "";
    const isServicioHash = hash.startsWith("#servicio-");

    if (urlTab === "servicios" || isServicioHash) {
      setTabActiva("servicios");
      try {
        sessionStorage.setItem("padonde_tab_activa", "servicios");
      } catch {}
    } else if (urlTab === "eventos") {
      setTabActiva("eventos");
      try {
        sessionStorage.setItem("padonde_tab_activa", "eventos");
      } catch {}
    } else {
      try {
        const saved = sessionStorage.getItem("padonde_tab_activa");
        if (saved === "eventos" || saved === "servicios") {
          setTabActiva(saved);
        }
      } catch {}
    }

    if (isServicioHash) {
      setTimeout(() => {
        const elId = hash.slice(1);
        const el = document.getElementById(elId);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }, 400);
    }
  }, [searchParams]);

  const handleSwitchTab = (nuevaTab: "eventos" | "servicios") => {
    if (nuevaTab !== tabActiva) {
      setTabActiva(nuevaTab);
      try {
        sessionStorage.setItem("padonde_tab_activa", nuevaTab);
      } catch {}
      trackTabChange(nuevaTab, zonaNombre);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* 1. Selector Multizona Horizontal (Minca, Mendihuaca, etc.) */}
      <TabsDestinos zonaActiva={zona} locale={locale} />

      {/* 2. Switcher de Pestañas: Activa con color primario sólido, Inactiva con fondo blanco */}
      <div className="flex items-center gap-2 max-w-sm mx-auto">
        <button
          id="tab-btn-cartelera"
          type="button"
          onClick={() => handleSwitchTab("eventos")}
          className={[
            "flex-1 py-2.5 px-3.5 rounded-2xl font-sans text-xs transition-all duration-200 cursor-pointer flex items-center justify-center gap-1.5 select-none shadow-2xs active:scale-95",
            tabActiva === "eventos"
              ? "bg-forest text-white font-bold shadow-xs scale-[1.01]"
              : "bg-white hover:bg-stone-50 text-stone-dark border border-stone-light/80 font-medium",
          ].join(" ")}
          aria-selected={tabActiva === "eventos"}
          role="tab"
        >
          <span className="text-sm">{zona === "mendihuaca" ? "🌊" : "🌿"}</span>
          <span className="truncate">{t("tabCartelera")}</span>
        </button>

        <button
          id="tab-btn-servicios"
          type="button"
          onClick={() => handleSwitchTab("servicios")}
          className={[
            "flex-1 py-2.5 px-3.5 rounded-2xl font-sans text-xs transition-all duration-200 cursor-pointer flex items-center justify-center gap-1.5 select-none shadow-2xs active:scale-95",
            tabActiva === "servicios"
              ? "bg-forest text-white font-bold shadow-xs scale-[1.01]"
              : "bg-white hover:bg-stone-50 text-stone-dark border border-stone-light/80 font-medium",
          ].join(" ")}
          aria-selected={tabActiva === "servicios"}
          role="tab"
        >
          <span className="text-sm">💡</span>
          <span className="truncate">{t("tabServicios")}</span>
        </button>
      </div>

      {/* Contenido según la pestaña activa */}
      {tabActiva === "eventos" ? (
        <EventFeed
          eventos={eventos}
          zona={zona}
          configTerritorial={configTerritorial}
        />
      ) : (
        <ServiciosList
          servicios={servicios}
          zonaNombre={zonaNombre}
          zonaSlug={zona}
        />
      )}
    </div>
  );
}
