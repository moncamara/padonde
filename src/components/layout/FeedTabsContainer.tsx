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

      {/* 2. Switcher Superior de Pestañas (Cartelera vs. Info Útil) con borde definido y alto contraste */}
      <div className="flex items-center p-1.5 bg-white/75 backdrop-blur-md rounded-2xl border border-stone-light/90 shadow-2xs max-w-sm mx-auto">
        <button
          id="tab-btn-cartelera"
          type="button"
          onClick={() => handleSwitchTab("eventos")}
          className={[
            "flex-1 py-2 px-3 rounded-xl font-sans text-xs transition-all duration-200 cursor-pointer flex items-center justify-center gap-1.5 select-none",
            tabActiva === "eventos"
              ? "bg-white text-forest shadow-xs font-bold border border-stone-200/90 scale-[1.01]"
              : "text-stone-dark/70 hover:text-forest hover:bg-white/50 font-medium",
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
            "flex-1 py-2 px-3 rounded-xl font-sans text-xs transition-all duration-200 cursor-pointer flex items-center justify-center gap-1.5 select-none",
            tabActiva === "servicios"
              ? "bg-white text-forest shadow-xs font-bold border border-stone-200/90 scale-[1.01]"
              : "text-stone-dark/70 hover:text-forest hover:bg-white/50 font-medium",
          ].join(" ")}
          aria-selected={tabActiva === "servicios"}
          role="tab"
        >
          <span className="text-sm">💡</span>
          <span className="truncate">{t("tabServicios")}</span>
          <span
            className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full border transition-colors ${
              tabActiva === "servicios"
                ? "bg-amber-100 text-amber-900 border-amber-300/80"
                : "bg-amber-50 text-amber-800 border-amber-200/70"
            }`}
          >
            {locale === "en" ? "Guide" : "Guía"}
          </span>
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
