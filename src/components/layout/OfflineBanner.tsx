"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";

/**
 * Banner flotante discreto que notifica al turista cuando está en modo sin conexión (Minca 3G/4G)
 * o cuando la conexión a internet se ha restablecido.
 */
export function OfflineBanner() {
  const t = useTranslations("offline");
  const [isOffline, setIsOffline] = useState(false);
  const [showBackOnline, setShowBackOnline] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    if (!navigator.onLine) {
      setIsOffline(true);
    }

    const handleOffline = () => {
      setIsOffline(true);
      setShowBackOnline(false);
    };

    const handleOnline = () => {
      setIsOffline(false);
      setShowBackOnline(true);
      const timer = setTimeout(() => {
        setShowBackOnline(false);
      }, 3500);
      return () => clearTimeout(timer);
    };

    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);

    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
    };
  }, []);

  if (!isOffline && !showBackOnline) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed top-3 left-1/2 -translate-x-1/2 z-50 max-w-sm w-[92%] pointer-events-none transition-all duration-300 animate-in fade-in slide-in-from-top-2"
    >
      <div
        className={[
          "px-4 py-2 rounded-full font-sans text-xs font-semibold shadow-md flex items-center justify-center gap-2 text-center backdrop-blur-md transition-all",
          isOffline
            ? "bg-forest/95 text-cream border border-cream/20 shadow-forest/20"
            : "bg-emerald-700/95 text-white border border-emerald-400/30 shadow-emerald-900/20",
        ].join(" ")}
      >
        <span className="text-sm shrink-0">{isOffline ? "📶" : "✨"}</span>
        <span className="truncate">{isOffline ? t("offlineNotice") : t("backOnline")}</span>
      </div>
    </div>
  );
}
