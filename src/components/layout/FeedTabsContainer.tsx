"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { EventFeed } from "@/components/events/EventFeed";
import { ServiciosList } from "@/components/services/ServiciosList";
import type { EventoConNegocio, ServicioEsencial } from "@/lib/types";
import { trackTabChange } from "@/lib/analytics";

interface FeedTabsContainerProps {
  eventos: EventoConNegocio[];
  servicios: ServicioEsencial[];
  zona: string;
  zonaNombre: string;
}

export function FeedTabsContainer({
  eventos,
  servicios,
  zona,
  zonaNombre,
}: FeedTabsContainerProps) {
  const t = useTranslations("essentialServices");
  const searchParams = useSearchParams();
  const [tabActiva, setTabActiva] = useState<"eventos" | "servicios">(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = sessionStorage.getItem("padonde_tab_activa");
        if (saved === "eventos" || saved === "servicios") return saved;
      } catch {}
    }
    return "eventos";
  });

  useEffect(() => {
    const urlTab = searchParams.get("tab");
    if (urlTab === "servicios" || urlTab === "eventos") {
      setTabActiva(urlTab);
      try {
        sessionStorage.setItem("padonde_tab_activa", urlTab);
      } catch {}
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
    <div className="space-y-6">
      {/* Switcher Superior de Pestañas (Cartelera vs. Info Útil) */}
      <div className="flex items-center p-1 bg-stone-light/40 rounded-2xl max-w-sm mx-auto shadow-2xs">
        <button
          onClick={() => handleSwitchTab("eventos")}
          className={[
            "flex-1 py-2 px-3 rounded-xl font-sans text-xs font-semibold transition-all duration-150 cursor-pointer flex items-center justify-center gap-1.5",
            tabActiva === "eventos"
              ? "bg-white text-forest shadow-xs font-bold"
              : "text-stone hover:text-forest",
          ].join(" ")}
        >
          <span>🌿</span>
          <span className="truncate">{t("tabCartelera")}</span>
        </button>

        <button
          onClick={() => handleSwitchTab("servicios")}
          className={[
            "flex-1 py-2 px-3 rounded-xl font-sans text-xs font-semibold transition-all duration-150 cursor-pointer flex items-center justify-center gap-1.5",
            tabActiva === "servicios"
              ? "bg-white text-forest shadow-xs font-bold"
              : "text-stone hover:text-forest",
          ].join(" ")}
        >
          <span>💡</span>
          <span className="truncate">{t("tabServicios")}</span>
        </button>
      </div>

      {/* Contenido según la pestaña activa */}
      {tabActiva === "eventos" ? (
        <EventFeed eventos={eventos} zona={zona} />
      ) : (
        <ServiciosList servicios={servicios} zonaNombre={zonaNombre} />
      )}
    </div>
  );
}
