"use client";

import { useState, useEffect } from "react";
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
  const [tabActiva, setTabActiva] = useState<"eventos" | "servicios">("eventos");

  useEffect(() => {
    const urlTab = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("tab") : null;
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
  }, []);

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

      {/* 2. Switcher Superior de Pestañas (Cartelera vs. Info Útil) */}
      <div className="flex items-center gap-1 p-1 bg-stone-light/50 rounded-2xl border border-stone-light/70 max-w-sm mx-auto shadow-2xs">
        <button
          id="tab-btn-cartelera"
          type="button"
          onClick={() => handleSwitchTab("eventos")}
          className={[
            "flex-1 py-2 px-3 rounded-xl font-sans text-xs font-semibold transition-all duration-150 cursor-pointer flex items-center justify-center gap-1.5",
            tabActiva === "eventos"
              ? "bg-forest text-white font-bold shadow-xs"
              : "bg-white text-stone-dark hover:text-forest font-medium shadow-2xs",
          ].join(" ")}
          aria-selected={tabActiva === "eventos"}
          role="tab"
        >
          <span>{zona === "mendihuaca" ? "🌊" : "🌿"}</span>
          <span className="truncate">{t("tabCartelera")}</span>
        </button>

        <button
          id="tab-btn-servicios"
          type="button"
          onClick={() => handleSwitchTab("servicios")}
          className={[
            "flex-1 py-2 px-3 rounded-xl font-sans text-xs font-semibold transition-all duration-150 cursor-pointer flex items-center justify-center gap-1.5",
            tabActiva === "servicios"
              ? "bg-forest text-white font-bold shadow-xs"
              : "bg-white text-stone-dark hover:text-forest font-medium shadow-2xs",
          ].join(" ")}
          aria-selected={tabActiva === "servicios"}
          role="tab"
        >
          <span>💡</span>
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
