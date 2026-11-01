"use client";

import { useSearchParams } from "next/navigation";
import { Link } from "@/i18n/routing";
import { ZONAS } from "@/constants";
import { trackDestinationSwitch } from "@/lib/analytics";

interface TabsDestinosProps {
  zonaActiva: string;
  locale: string;
  className?: string;
}

interface DestinoTabConfig {
  slug: string;
  nombre: string;
  emoji: string;
  activa: boolean;
  badge?: string;
  colorActive?: string;
}

const DESTINOS_TABS: DestinoTabConfig[] = [
  {
    slug: "minca",
    nombre: "Minca",
    emoji: "🌿",
    activa: true,
    colorActive: "bg-forest text-cream",
  },
  {
    slug: "mendihuaca",
    nombre: "Mendihuaca",
    emoji: "🌊",
    activa: true,
    colorActive: "bg-[#0B4F6C] text-white",
  },
  {
    slug: "tayrona",
    nombre: "Tayrona",
    emoji: "🌴",
    activa: false,
    badge: "Pronto",
  },
  {
    slug: "palomino",
    nombre: "Palomino",
    emoji: "🏖️",
    activa: false,
    badge: "Pronto",
  },
  {
    slug: "santa-marta",
    nombre: "Santa Marta",
    emoji: "⛵",
    activa: false,
    badge: "Pronto",
  },
];

export function TabsDestinos({ zonaActiva, locale, className = "" }: TabsDestinosProps) {
  const searchParams = useSearchParams();
  const queryString = searchParams.toString() ? `?${searchParams.toString()}` : "";

  const handleSelectZona = (targetSlug: string) => {
    if (targetSlug === zonaActiva) return;
    try {
      localStorage.setItem("padonde_zona", targetSlug);
      document.cookie = `padonde_zona=${targetSlug}; path=/; max-age=31536000; SameSite=Lax`;
      sessionStorage.removeItem("padonde_filtro_categoria");
    } catch {}
    trackDestinationSwitch(zonaActiva, targetSlug);
  };

  return (
    <div className={`space-y-1.5 ${className}`.trim()}>
      <div className="flex items-center justify-between px-1">
        <span className="text-[11px] font-sans font-semibold uppercase tracking-wider text-stone/80">
          📍 Destino en el Caribe
        </span>
        <span className="text-[10px] text-stone-400 font-sans">
          Desliza para explorar →
        </span>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 px-0.5 -mx-1 sm:mx-0">
        {DESTINOS_TABS.map((destino) => {
          const isSelected = zonaActiva === destino.slug;

          if (!destino.activa) {
            return (
              <div
                key={destino.slug}
                className="shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-stone-100/70 border border-stone-200/60 text-stone-400 text-xs font-sans cursor-not-allowed select-none opacity-75"
                title={`${destino.nombre} estará disponible próximamente`}
              >
                <span className="text-sm grayscale">{destino.emoji}</span>
                <span className="font-medium">{destino.nombre}</span>
                <span className="text-[9px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded-md">
                  {destino.badge}
                </span>
              </div>
            );
          }

          return (
            <Link
              key={destino.slug}
              href={`/${destino.slug}${queryString}`}
              onClick={() => handleSelectZona(destino.slug)}
              className={[
                "shrink-0 inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl text-xs font-sans transition-all duration-200 cursor-pointer shadow-2xs active:scale-95",
                isSelected
                  ? `${destino.colorActive || "bg-forest text-cream"} font-bold shadow-xs ring-2 ring-forest/20 scale-[1.02]`
                  : "bg-white hover:bg-stone-50 border border-stone-light/80 text-stone hover:text-forest",
              ].join(" ")}
              aria-current={isSelected ? "page" : undefined}
            >
              <span className="text-sm">{destino.emoji}</span>
              <span className="tracking-tight whitespace-nowrap font-medium">
                {destino.nombre}
              </span>
              {isSelected && (
                <span className="w-1.5 h-1.5 rounded-full bg-cream animate-pulse ml-0.5" />
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
