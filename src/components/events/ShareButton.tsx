"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

export function ShareButton({ title }: { title: string }) {
  const t = useTranslations("eventDetail");
  const [copied, setCopied] = useState(false);

  async function handleShare() {
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          url: window.location.href,
        });
        return;
      } catch (err) {
        // Ignorar si el usuario cancela
      }
    }

    // Fallback: copiar al portapapeles con manejo seguro de permisos
    try {
      await navigator.clipboard.writeText(window.location.href);
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
