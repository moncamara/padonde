"use client";

import { useLocale, useTranslations } from "next-intl";
import { trackEvent } from "@/lib/analytics";

interface ShareButtonProps {
  title: string;
  text?: string;
  url?: string;
  zonaNombre?: string;
  variant?: "header" | "detail" | "icon" | "full";
  className?: string;
}

export function ShareButton({
  title,
  text,
  url,
  zonaNombre,
  variant = "header",
  className = "",
}: ShareButtonProps) {
  const locale = useLocale();
  const t = useTranslations("shareModal");

  // Asegurar que la URL a compartir siempre lleve explícitamente el prefijo del idioma actual
  function getShareUrl(): string {
    if (url) return url;
    if (typeof window !== "undefined") {
      const origin = window.location.origin;
      const path = window.location.pathname;
      const search = window.location.search;

      const matchLocale = path.match(/^\/(es|en|fr|de)(\/.*|$)/);
      if (matchLocale) {
        if (matchLocale[1] === locale) {
          return `${origin}${path}${search}`;
        }
        return `${origin}/${locale}${matchLocale[2]}${search}`;
      } else {
        return `${origin}/${locale}${path}${search}`;
      }
    }
    return `https://www.padonde.lat/${locale}`;
  }

  const finalUrl = getShareUrl();

  const shareText =
    text ||
    (zonaNombre
      ? `Descubre planes, eventos, rumba, hospedajes en ${zonaNombre} - PaDónde`
      : `${title} - PaDónde`);

  const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(
    `${shareText}\n\n👉 ${finalUrl}`
  )}`;

  return (
    <>
      {variant === "header" && (
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => trackEvent("share_whatsapp_click", { title, url: finalUrl })}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/95 hover:bg-white border border-stone-light/90 text-forest text-xs font-sans font-medium transition-all duration-150 cursor-pointer shadow-2xs active:scale-95 ${className}`}
          aria-label={t("shareWhatsApp")}
          title={t("shareWhatsApp")}
        >
          <span className="text-sm">💬</span>
          <span className="inline font-medium">{t("button")}</span>
        </a>
      )}

      {variant === "detail" && (
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => trackEvent("share_whatsapp_click", { title, url: finalUrl })}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-cream/90 backdrop-blur-md border border-stone-light text-forest hover:bg-cream text-xs font-sans font-medium transition-all duration-150 cursor-pointer shadow-xs active:scale-95 ${className}`}
          aria-label={t("shareWhatsApp")}
          title={t("shareWhatsApp")}
        >
          <span className="text-sm">💬</span>
          <span>{t("button")}</span>
        </a>
      )}

      {variant === "icon" && (
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => {
            e.stopPropagation();
            trackEvent("share_whatsapp_click", { title, url: finalUrl });
          }}
          className={`w-9 h-9 rounded-full bg-stone-light/30 hover:bg-stone-light/60 text-forest flex items-center justify-center transition-all duration-150 cursor-pointer active:scale-95 shadow-2xs ${className}`}
          aria-label={t("shareWhatsApp")}
          title={t("shareWhatsApp")}
        >
          <span className="text-sm">💬</span>
        </a>
      )}

      {variant === "full" && (
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => trackEvent("share_whatsapp_click", { title, url: finalUrl })}
          className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-[#25D366] hover:bg-[#20ba59] text-white font-sans font-semibold text-sm transition-all duration-150 cursor-pointer active:scale-[0.98] shadow-xs ${className}`}
          aria-label={t("shareWhatsApp")}
        >
          <span className="text-base">💬</span>
          <span>{t("shareWhatsApp")}</span>
        </a>
      )}
    </>
  );
}
