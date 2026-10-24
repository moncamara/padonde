"use client";

import { Link } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { trackCrossSellingClick } from "@/lib/analytics";

interface ProximoDestinoCardProps {
  zonaActual: string;
}

export function ProximoDestinoCard({ zonaActual }: ProximoDestinoCardProps) {
  const t = useTranslations("crossSelling");

  const isMinca = zonaActual === "minca";
  const targetZona = isMinca ? "mendihuaca" : "minca";

  const handleTransito = () => {
    try {
      localStorage.setItem("padonde_zona", targetZona);
      document.cookie = `padonde_zona=${targetZona}; path=/; max-age=31536000; SameSite=Lax`;
    } catch {}
    trackCrossSellingClick(zonaActual, targetZona);
  };

  const badge = isMinca ? t("mincaToMendiBadge") : t("mendiToMincaBadge");
  const title = isMinca ? t("mincaToMendiTitle") : t("mendiToMincaTitle");
  const desc = isMinca ? t("mincaToMendiDesc") : t("mendiToMincaDesc");
  const cta = isMinca ? t("mincaToMendiCta") : t("mendiToMincaCta");

  return (
    <aside
      aria-label="Módulo de transición hacia el próximo destino"
      className="my-7 px-1 animate-in fade-in slide-in-from-bottom-2 duration-300"
    >
      <Link
        href={`/${targetZona}`}
        onClick={handleTransito}
        className={`block p-5 sm:p-6 rounded-3xl border transition-all duration-200 group active:scale-[0.99] shadow-sm hover:shadow-md cursor-pointer ${
          isMinca
            ? "bg-gradient-to-br from-white via-cyan-50/40 to-emerald-50/50 border-cyan-200/70 hover:border-cyan-300"
            : "bg-gradient-to-br from-white via-emerald-50/40 to-stone-50/60 border-emerald-200/70 hover:border-emerald-300"
        }`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1.5 flex-1">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-sans font-bold tracking-tight shadow-2xs ${
                isMinca
                  ? "bg-cyan-100/70 text-cyan-900 border border-cyan-200"
                  : "bg-emerald-100/70 text-emerald-900 border border-emerald-200"
              }`}
            >
              {badge}
            </span>

            <h3 className="font-serif text-base sm:text-lg text-forest font-bold leading-snug group-hover:text-forest-dark transition-colors pt-1">
              {title}
            </h3>

            <p className="font-sans text-xs text-stone leading-relaxed">
              {desc}
            </p>
          </div>

          <div
            className={`w-11 h-11 rounded-2xl flex items-center justify-center text-xl shrink-0 transition-transform group-hover:scale-110 shadow-2xs ${
              isMinca
                ? "bg-cyan-50 border border-cyan-100 text-cyan-800"
                : "bg-emerald-50 border border-emerald-100 text-emerald-800"
            }`}
          >
            {isMinca ? "🌊" : "🌿"}
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-stone-light/60 flex items-center justify-between">
          <span className="font-sans text-[11px] text-stone font-medium">
            {isMinca ? "Sierra Nevada ➔ Mar Caribe" : "Caribe ➔ Sierra Nevada"}
          </span>

          <span
            className={`inline-flex items-center gap-1 px-3.5 py-1.5 rounded-xl font-sans text-xs font-bold transition-all shadow-2xs group-hover:shadow-xs ${
              isMinca
                ? "bg-cyan-700 text-white group-hover:bg-cyan-800"
                : "bg-forest text-cream group-hover:bg-forest-dark"
            }`}
          >
            {cta}
          </span>
        </div>
      </Link>
    </aside>
  );
}
