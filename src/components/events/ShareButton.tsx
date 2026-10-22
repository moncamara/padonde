"use client";

import { useState, useEffect } from "react";
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

  const [modalOpen, setModalOpen] = useState(false);
  const [copiado, setCopiado] = useState(false);

  // Cerrar modal con tecla ESC
  useEffect(() => {
    if (!modalOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setModalOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [modalOpen]);

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

  const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
    finalUrl
  )}`;

  const handleShare = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // 1. En dispositivos móviles con Web Share API nativa (iOS y Android),
    // abre la hoja del sistema donde el usuario puede elegir Facebook, WhatsApp, Instagram, etc.
    if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
      try {
        await navigator.share({
          title,
          text: shareText,
          url: finalUrl,
        });
        trackEvent("share_native_success", { title, url: finalUrl });
        return;
      } catch (err: unknown) {
        // Si el usuario canceló la hoja nativa, no hacemos nada
        if (err instanceof Error && err.name === "AbortError") {
          return;
        }
      }
    }

    // 2. Si no tiene navigator.share (Escritorio) o falló, abrimos el modal de opciones
    setModalOpen(true);
    trackEvent("share_modal_open", { title, url: finalUrl });
  };

  const handleCopiarEnlace = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(finalUrl);
        setCopiado(true);
        trackEvent("share_copy_link", { title, url: finalUrl });
        setTimeout(() => setCopiado(false), 2000);
      }
    } catch {
      // Fallback
    }
  };

  return (
    <>
      {variant === "header" && (
        <button
          type="button"
          onClick={handleShare}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/95 hover:bg-white border border-stone-light/90 text-forest text-xs font-sans font-medium transition-all duration-150 cursor-pointer shadow-2xs active:scale-95 ${className}`}
          aria-label={t("button")}
          title={t("button")}
        >
          <span className="text-sm">💬</span>
          <span className="inline font-medium">{t("button")}</span>
        </button>
      )}

      {variant === "detail" && (
        <button
          type="button"
          onClick={handleShare}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-cream/90 backdrop-blur-md border border-stone-light text-forest hover:bg-cream text-xs font-sans font-medium transition-all duration-150 cursor-pointer shadow-xs active:scale-95 ${className}`}
          aria-label={t("button")}
          title={t("button")}
        >
          <span className="text-sm">💬</span>
          <span>{t("button")}</span>
        </button>
      )}

      {variant === "icon" && (
        <button
          type="button"
          onClick={handleShare}
          className={`w-9 h-9 rounded-full bg-stone-light/30 hover:bg-stone-light/60 text-forest flex items-center justify-center transition-all duration-150 cursor-pointer active:scale-95 shadow-2xs ${className}`}
          aria-label={t("button")}
          title={t("button")}
        >
          <span className="text-sm">💬</span>
        </button>
      )}

      {variant === "full" && (
        <button
          type="button"
          onClick={handleShare}
          className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-forest hover:bg-forest-dark text-white font-sans font-semibold text-sm transition-all duration-150 cursor-pointer active:scale-[0.98] shadow-xs ${className}`}
          aria-label={t("button")}
        >
          <span className="text-base">💬</span>
          <span>{t("button")}</span>
        </button>
      )}

      {/* Modal / Menú Elegante de Compartir (para Escritorio o fallback) */}
      {modalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setModalOpen(false)}
          className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-150"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full sm:max-w-md bg-cream rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 shadow-2xl border border-stone-light/70 space-y-4"
          >
            {/* Header del Modal */}
            <div className="flex items-center justify-between pb-2 border-b border-stone-light/60">
              <div className="flex items-center gap-2">
                <span className="text-xl">💬</span>
                <div>
                  <h3 className="font-serif text-base sm:text-lg font-bold text-forest">
                    {t("title")}
                  </h3>
                  <p className="text-xs text-stone font-sans">
                    {t("subtitle")}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="w-8 h-8 rounded-full bg-stone-light/40 hover:bg-stone-light/70 text-forest flex items-center justify-center text-sm font-bold transition-colors cursor-pointer"
                aria-label={t("close")}
              >
                ✕
              </button>
            </div>

            {/* Opciones directas */}
            <div className="space-y-2.5 pt-1">
              {/* 1. WhatsApp */}
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => {
                  trackEvent("share_whatsapp_click", { title, url: finalUrl });
                  setModalOpen(false);
                }}
                className="w-full flex items-center justify-between p-3 rounded-2xl bg-white hover:bg-emerald-50/50 border border-emerald-200/80 text-emerald-950 font-sans text-xs sm:text-sm font-medium transition-all group shadow-2xs cursor-pointer active:scale-[0.99]"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">💬</span>
                  <div className="text-left">
                    <p className="font-bold text-emerald-900 group-hover:text-emerald-950">
                      {t("shareWhatsApp")}
                    </p>
                    <p className="text-[11px] text-emerald-700/80 font-normal">
                      Abrir chat o enviar a estados
                    </p>
                  </div>
                </div>
                <span className="text-emerald-700 font-bold group-hover:translate-x-0.5 transition-transform text-sm">
                  →
                </span>
              </a>

              {/* 2. Facebook */}
              <a
                href={facebookUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => {
                  trackEvent("share_facebook_click", { title, url: finalUrl });
                  setModalOpen(false);
                }}
                className="w-full flex items-center justify-between p-3 rounded-2xl bg-white hover:bg-sky-50/50 border border-sky-200/80 text-sky-950 font-sans text-xs sm:text-sm font-medium transition-all group shadow-2xs cursor-pointer active:scale-[0.99]"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">📘</span>
                  <div className="text-left">
                    <p className="font-bold text-sky-900 group-hover:text-sky-950">
                      {t("shareFacebook")}
                    </p>
                    <p className="text-[11px] text-sky-700/80 font-normal">
                      Publicar en tu muro, historias o grupos
                    </p>
                  </div>
                </div>
                <span className="text-sky-700 font-bold group-hover:translate-x-0.5 transition-transform text-sm">
                  →
                </span>
              </a>

              {/* 3. Copiar Enlace */}
              <button
                type="button"
                onClick={handleCopiarEnlace}
                className="w-full flex items-center justify-between p-3 rounded-2xl bg-white hover:bg-stone-50 border border-stone-light text-forest font-sans text-xs sm:text-sm font-medium transition-all group shadow-2xs cursor-pointer active:scale-[0.99]"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{copiado ? "✅" : "📋"}</span>
                  <div className="text-left">
                    <p className="font-bold text-forest">
                      {copiado ? t("copied") : t("copyLink")}
                    </p>
                    <p className="text-[11px] text-stone font-normal truncate max-w-[200px] sm:max-w-xs">
                      {finalUrl}
                    </p>
                  </div>
                </div>
                <span className="text-forest text-xs font-semibold px-2.5 py-1 rounded-full bg-stone-light/50 group-hover:bg-stone-light transition-colors">
                  {copiado ? "✓ Copiado" : "Copiar"}
                </span>
              </button>
            </div>

            {/* Botón Cerrar */}
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="w-full py-2.5 rounded-xl border border-stone-light/80 text-stone hover:text-forest text-xs font-sans font-medium transition-colors cursor-pointer"
            >
              {t("close")}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
