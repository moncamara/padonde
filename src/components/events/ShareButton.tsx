"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";

interface ShareButtonProps {
  title: string;
  url?: string;
}

export function ShareButton({ title, url }: ShareButtonProps) {
  const t = useTranslations("eventDetail");
  const locale = useLocale();
  const [copied, setCopied] = useState(false);

  // Asegurar que la URL a compartir siempre lleve explícitamente el prefijo del idioma actual
  function getShareUrl(): string {
    if (url) return url;
    if (typeof window !== "undefined") {
      const origin = window.location.origin;
      const path = window.location.pathname;
      const search = window.location.search;

      // Si el pathname ya empieza con /es, /en, /fr, /de
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

  async function handleShare() {
    const targetUrl = getShareUrl();
    const shareText = `${title} — PaDónde 🌿`;

    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text: shareText,
          url: targetUrl,
        });
        return;
      } catch (err) {
        // Ignorar si el usuario cancela la ventana nativa
      }
    }

    // Fallback: copiar al portapapeles con manejo seguro de permisos
    try {
      await navigator.clipboard.writeText(targetUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Si el navegador bloquea el clipboard (ej. sin foco de ventana), continuar sin error
    }
  }

  return (
    <button
      onClick={handleShare}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-cream border border-stone-light text-forest hover:border-forest text-xs font-sans font-medium transition-all duration-150 cursor-pointer shadow-xs active:scale-95"
      aria-label={t("share")}
    >
      <span>📤</span>
      <span>{copied ? t("copied") : t("share")}</span>
    </button>
  );
}
