"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { trackEvent } from "@/lib/analytics";

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  text?: string;
  url: string;
  zonaNombre?: string;
}

export function ShareModal({
  isOpen,
  onClose,
  title,
  text,
  url,
  zonaNombre,
}: ShareModalProps) {
  const t = useTranslations("shareModal");
  const [copied, setCopied] = useState(false);
  const [showQr, setShowQr] = useState(false);
  const [hasNativeShare, setHasNativeShare] = useState(false);

  useEffect(() => {
    if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
      setHasNativeShare(true);
    }
  }, []);

  // Bloquear scroll de fondo cuando el modal esté abierto
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
      setShowQr(false);
      setCopied(false);
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const shareText =
    text ||
    (zonaNombre
      ? `Descubre qué hacer hoy en ${zonaNombre}: planes, hospedajes, eventos en vivo y tours en PaDónde 🌿`
      : `${title} — PaDónde 🌿`);

  const whatsappShareUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(
    `${shareText}\n\n👉 ${url}`
  )}`;

  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=350x350&margin=8&data=${encodeURIComponent(
    url
  )}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      trackEvent("share_action", { method: "clipboard", url });
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback si clipboard API está bloqueado
      const input = document.createElement("input");
      input.value = url;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text: shareText,
          url,
        });
        trackEvent("share_action", { method: "native_share", url });
        onClose();
      } catch (err: unknown) {
        // Ignorar AbortError (cuando el usuario cierra la hoja nativa)
        if ((err as { name?: string })?.name !== "AbortError") {
          console.warn("Error en navigator.share:", err);
        }
      }
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="relative w-full max-w-md bg-cream rounded-t-3xl sm:rounded-3xl border border-stone-light/80 shadow-2xl p-5 sm:p-6 overflow-hidden max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Barra superior de arrastre en móvil */}
        <div className="w-12 h-1.5 bg-stone-light/80 rounded-full mx-auto mb-4 sm:hidden" />

        {/* Encabezado del modal */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="space-y-0.5">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-forest/70">
              <span>🌿</span> PaDónde
            </span>
            <h3 className="font-serif text-xl sm:text-2xl text-forest font-bold leading-tight">
              {title}
            </h3>
            <p className="text-xs text-stone font-sans">
              {t("subtitle")}
            </p>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-stone-light/40 hover:bg-stone-light/70 text-forest flex items-center justify-center transition-colors text-sm shrink-0 cursor-pointer"
            aria-label={t("close")}
          >
            ✕
          </button>
        </div>

        {/* Botón Principal: WhatsApp (El canal #1 de viajeros y anfitriones) */}
        <a
          href={whatsappShareUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => trackEvent("share_action", { method: "whatsapp", url })}
          className="w-full flex items-center justify-center gap-2.5 py-3.5 px-4 rounded-2xl bg-[#25D366] hover:bg-[#20ba59] text-white font-sans font-semibold text-sm shadow-sm hover:shadow transition-all duration-200 active:scale-[0.98] mb-3"
        >
          <span className="text-lg">💬</span>
          <span>{t("shareWhatsApp")}</span>
        </a>

        {/* Botón Nativo del Celular (AirDrop, Instagram Stories, SMS, etc.) si está disponible */}
        {hasNativeShare && (
          <button
            onClick={handleNativeShare}
            className="w-full flex items-center justify-center gap-2.5 py-3 px-4 rounded-2xl bg-white border border-stone-light text-forest hover:bg-white/80 font-sans font-medium text-sm transition-all duration-150 active:scale-[0.98] mb-3 shadow-2xs cursor-pointer"
          >
            <span className="text-base">📤</span>
            <span>{t("nativeShare")}</span>
          </button>
        )}

        {/* Caja de Copiar Enlace */}
        <div className="mb-4">
          <label className="block text-[11px] font-sans font-medium text-stone mb-1.5 uppercase tracking-wider">
            {t("copyLink")}
          </label>
          <div className="flex items-center gap-2 bg-white/90 border border-stone-light/90 rounded-2xl p-1.5 pl-3 shadow-2xs">
            <span className="text-xs text-forest/70 font-mono truncate flex-1 select-all">
              {url}
            </span>
            <button
              onClick={handleCopy}
              className={`px-3.5 py-2 rounded-xl text-xs font-sans font-semibold transition-all duration-200 cursor-pointer shrink-0 ${
                copied
                  ? "bg-forest text-white"
                  : "bg-terra hover:bg-terra-dark text-white active:scale-95 shadow-2xs"
              }`}
            >
              {copied ? t("copied") : t("copyLink")}
            </button>
          </div>
        </div>

        {/* Sección Código QR (Ideal para mostrar pantalla en reuniones en vivo) */}
        <div className="pt-2 border-t border-stone-light/60">
          <button
            onClick={() => {
              setShowQr(!showQr);
              if (!showQr) {
                trackEvent("share_action", { method: "view_qr", url });
              }
            }}
            className="w-full flex items-center justify-between py-2 text-xs font-sans font-medium text-forest hover:text-terra transition-colors cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <span>📷</span>
              <span className="font-semibold">{t("qrTitle")}</span>
            </span>
            <span className="text-stone text-[11px]">
              {showQr ? "Ocultar ▲" : "Ver QR ▼"}
            </span>
          </button>

          {showQr && (
            <div className="mt-3 p-4 bg-white rounded-2xl border border-stone-light/80 flex flex-col items-center text-center animate-in fade-in zoom-in-95 duration-200">
              <div className="p-2 bg-white rounded-xl shadow-xs border border-stone-light/60">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={qrImageUrl}
                  alt={`QR ${title}`}
                  width={200}
                  height={200}
                  className="w-48 h-48 object-contain rounded-lg"
                />
              </div>
              <p className="text-xs font-sans text-stone mt-2.5 max-w-[240px] leading-relaxed">
                {t("qrSubtitle")}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
