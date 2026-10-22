"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";

/**
 * Banner flotante discreto que notifica al turista cuando está en modo sin conexión (Minca 3G/4G)
 * o cuando la conexión a internet se ha restablecido.
 */
export function OfflineBanner() {
  const t = useTranslations("offline");
  const [visibleNotice, setVisibleNotice] = useState<"offline" | "online" | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    let timer: NodeJS.Timeout | null = null;

    const showToast = (type: "offline" | "online") => {
      if (timer) clearTimeout(timer);
      setVisibleNotice(type);
      timer = setTimeout(() => {
        setVisibleNotice(null);
      }, 4000);
    };

    // Si abre la aplicación estando sin señal
    if (!navigator.onLine) {
      showToast("offline");
    }

    const handleOffline = () => {
      showToast("offline");
    };

    const handleOnline = () => {
      showToast("online");
    };

    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);

    return () => {
      if (timer) clearTimeout(timer);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
    };
  }, []);

  if (!visibleNotice) return null;

  const isOffline = visibleNotice === "offline";

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed top-16 sm:top-18 left-1/2 -translate-x-1/2 z-50 max-w-sm w-[90%] pointer-events-none transition-all duration-300 animate-in fade-in slide-in-from-top-3"
    >
      <div
        className={[
          "px-4 py-2.5 rounded-full font-sans text-xs font-semibold shadow-lg flex items-center justify-center gap-2 text-center backdrop-blur-md transition-all",
          isOffline
            ? "bg-forest/95 text-cream border border-cream/20 shadow-forest/25"
            : "bg-emerald-700/95 text-white border border-emerald-400/30 shadow-emerald-900/25",
        ].join(" ")}
      >
        <span className="text-sm shrink-0">{isOffline ? "📶" : "✨"}</span>
        <span className="truncate">{isOffline ? t("offlineNotice") : t("backOnline")}</span>
      </div>
    </div>
  );
}
