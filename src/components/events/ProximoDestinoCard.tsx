"use client";

import { Link } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { trackCrossSellingClick } from "@/lib/analytics";

interface ProximoDestinoCardProps {
  zonaActual: string;
}

type ZonaKey = "tayrona" | "mendihuaca" | "minca";

interface TargetDestinoConfig {
  slug: ZonaKey;
  emoji: string;
  themeClasses: string;
}

const DESTINOS_CONFIG: Record<ZonaKey, { targets: TargetDestinoConfig[] }> = {
  tayrona: {
    targets: [
      {
        slug: "mendihuaca",
        emoji: "🌊",
        themeClasses:
          "bg-cyan-700 hover:bg-cyan-800 text-white border-cyan-800 shadow-cyan-900/10",
      },
      {
        slug: "minca",
        emoji: "🌿",
        themeClasses:
          "bg-forest hover:bg-forest-dark text-white border-forest shadow-emerald-950/10",
      },
    ],
  },
  mendihuaca: {
    targets: [
      {
        slug: "tayrona",
        emoji: "🌴",
        themeClasses:
          "bg-[#144D34] hover:bg-[#0C3322] text-white border-[#144D34] shadow-emerald-950/10",
      },
      {
        slug: "minca",
        emoji: "🌿",
        themeClasses:
          "bg-forest hover:bg-forest-dark text-white border-forest shadow-emerald-950/10",
      },
    ],
  },
  minca: {
    targets: [
      {
        slug: "tayrona",
        emoji: "🌴",
        themeClasses:
          "bg-[#144D34] hover:bg-[#0C3322] text-white border-[#144D34] shadow-emerald-950/10",
      },
      {
        slug: "mendihuaca",
        emoji: "🌊",
        themeClasses:
          "bg-cyan-700 hover:bg-cyan-800 text-white border-cyan-800 shadow-cyan-900/10",
      },
    ],
  },
};

export function ProximoDestinoCard({ zonaActual }: ProximoDestinoCardProps) {
  const t = useTranslations("crossSelling");

  const normalized = (zonaActual === "tairona" ? "tayrona" : zonaActual).toLowerCase();
  const currentZone: ZonaKey =
    normalized in DESTINOS_CONFIG
      ? (normalized as ZonaKey)
      : "minca";

  const config = DESTINOS_CONFIG[currentZone];

  const handleTransito = (targetZona: string) => {
    try {
      localStorage.setItem("padonde_zona", targetZona);
      document.cookie = `padonde_zona=${targetZona}; path=/; max-age=31536000; SameSite=Lax`;
      sessionStorage.removeItem("padonde_filtro_categoria");
    } catch {}
    trackCrossSellingClick(zonaActual, targetZona);
  };

  const badge = t("badge");
  const title = t(`${currentZone}.title`);
  const desc = t(`${currentZone}.desc`);

  return (
    <aside
      aria-label="Módulo de transición hacia el próximo destino"
      className="my-7 px-1 animate-in fade-in slide-in-from-bottom-2 duration-300"
    >
      <div className="p-5 sm:p-6 rounded-3xl border border-stone-200/80 bg-gradient-to-br from-white via-stone-50/50 to-cream/70 shadow-sm text-left">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1.5 flex-1">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-sans font-bold tracking-tight bg-stone-100 text-stone-700 border border-stone-200/80 shadow-2xs">
              {badge}
            </span>

            <h3 className="font-serif text-base sm:text-lg text-forest font-bold leading-snug pt-1">
              {title}
            </h3>

            <p className="font-sans text-xs text-stone leading-relaxed">
              {desc}
            </p>
          </div>

          <div
            className="w-10 h-10 rounded-2xl flex items-center justify-center text-lg shrink-0 bg-stone-100/80 border border-stone-200/70 text-stone-600 shadow-2xs select-none"
            aria-hidden="true"
          >
            🧭
          </div>
        </div>

        {/* Matriz dinámica de dos opciones - Mobile-first con touch target >= 44px */}
        <div className="mt-4 pt-3.5 border-t border-stone-light/70 flex items-stretch gap-2 sm:gap-2.5 w-full">
          {config.targets.map((target) => {
            const label = t(`destinos.${target.slug}.label`);

            return (
              <Link
                key={target.slug}
                href={`/${target.slug}`}
                onClick={() => handleTransito(target.slug)}
                className={`flex-1 min-h-[44px] px-3 sm:px-4 py-2.5 rounded-2xl flex items-center justify-center gap-1.5 sm:gap-2 font-sans text-xs sm:text-sm font-bold border transition-all duration-200 active:scale-[0.98] shadow-2xs hover:shadow-xs cursor-pointer ${target.themeClasses}`}
              >
                <span className="text-sm sm:text-base select-none shrink-0">
                  {target.emoji}
                </span>
                <span className="truncate tracking-tight font-semibold">
                  {label}
                </span>
                <span className="text-xs opacity-75 shrink-0 ml-0.5" aria-hidden="true">
                  →
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </aside>
  );
}
