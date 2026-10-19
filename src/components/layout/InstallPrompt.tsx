"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { trackEvent } from "@/lib/analytics";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function InstallPrompt() {
  const t = useTranslations("pwa");
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [isIosChrome, setIsIosChrome] = useState(false);
  const [showIosModal, setShowIosModal] = useState(false);

  useEffect(() => {
    // 1. Verificar si ya está en modo app (standalone)
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;

    if (isStandalone) {
      return; // Ya está instalada, no mostrar nada
    }

    // 2. Verificar si el usuario lo descartó recientemente (en los últimos 14 días)
    const dismissedTime = localStorage.getItem("padonde_pwa_dismissed");
    if (dismissedTime) {
      const daysSinceDismiss = (Date.now() - parseInt(dismissedTime, 10)) / (1000 * 60 * 60 * 24);
      if (daysSinceDismiss < 14) {
        return;
      }
    }

    // 3. Detección de dispositivos móviles (iOS, Android, Windows Phone)
    const ua = window.navigator.userAgent.toLowerCase();
    const isMobile = /android|iphone|ipad|ipod|mobile|phone/i.test(ua);

    // Si es un computador de escritorio (PC/Mac), no mostrar la barra
    if (!isMobile) {
      return;
    }

    const isAppleIos = /iphone|ipad|ipod/.test(ua);

    if (isAppleIos) {
      const isChrome = ua.includes("crios");
      setIsIos(true);
      setIsIosChrome(isChrome);
      setIsVisible(true);
      trackEvent("pwa_prompt_view", {
        platform: isChrome ? "ios_chrome" : "ios_safari",
      });
      return;
    }

    // 4. Capturar el evento nativo de instalación en Android
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsVisible(true);
      trackEvent("pwa_prompt_view", {
        platform: "android",
      });
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
    };
  }, []);

  const getPlatformLabel = () => {
    if (isIos) {
      return isIosChrome ? "ios_chrome" : "ios_safari";
    }
    return "android";
  };

  const handleDismiss = () => {
    trackEvent("pwa_prompt_dismiss", {
      platform: getPlatformLabel(),
    });
    setIsVisible(false);
    localStorage.setItem("padonde_pwa_dismissed", Date.now().toString());
  };

  const handleInstallClick = async () => {
    const platform = getPlatformLabel();
    trackEvent("pwa_install_click", {
      platform,
    });

    if (isIos) {
      setShowIosModal(true);
      return;
    }

    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        if (choice.outcome === "accepted") {
          setIsVisible(false);
        }
      } catch {
        // En caso de que el navegador cancele el prompt silenciosamente
      }
      setDeferredPrompt(null);
    }
  };

  if (!isVisible) return null;

  return (
    <>
      {/* Barra flotante discreta en la parte inferior */}
      <aside
        aria-label="Acceso directo PaDónde"
        className="fixed bottom-4 left-4 right-4 z-40 max-w-lg mx-auto bg-forest text-cream rounded-2xl shadow-xl border border-forest-light/40 backdrop-blur-md p-3.5 transition-all duration-300 animate-in fade-in slide-in-from-bottom-3"
      >
        <div className="flex items-center justify-between gap-3">
          {/* Logo PaDónde e información clara */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-10 h-10 rounded-xl overflow-hidden bg-cream flex-shrink-0 border border-cream/20 shadow-inner">
              <img
                src="/icon-192.png"
                alt="PaDónde"
                className="w-full h-full object-cover"
                width={40}
                height={40}
              />
            </div>
            <div className="min-w-0">
              <p className="font-serif text-sm font-semibold text-cream truncate leading-snug">
                {t("title")}
              </p>
              <p className="font-sans text-[11px] text-cream/70 truncate leading-none mt-0.5">
                {t("subtitle")}
              </p>
            </div>
          </div>

          {/* Acciones */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <button
              onClick={handleInstallClick}
              className="px-3 py-1.5 bg-terra text-white text-xs font-sans font-medium rounded-xl hover:bg-terra-dark active:scale-95 transition-all shadow-sm"
            >
              {t("button")}
            </button>
            <button
              onClick={handleDismiss}
              aria-label="Cerrar notificación"
              className="p-1.5 text-cream/60 hover:text-cream rounded-lg text-xs transition-colors"
            >
              ✕
            </button>
          </div>
        </div>
      </aside>

      {/* Modal explicativo guiado para iPhone (Safari y Chrome en iOS) */}
      {showIosModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-cream text-forest rounded-3xl p-5 shadow-2xl border border-stone-light/60 animate-in slide-in-from-bottom-4 duration-300">
            <div className="text-center mb-4">
              <div className="w-12 h-12 mx-auto rounded-2xl overflow-hidden shadow-md mb-2">
                <img
                  src="/icon-192.png"
                  alt="PaDónde"
                  className="w-full h-full object-cover"
                  width={48}
                  height={48}
                />
              </div>
              <h3 className="font-serif text-lg font-bold text-forest">
                {t("title")}
              </h3>
              <p className="font-sans text-xs text-stone mt-1">
                {t("instructionsTitle")}
              </p>
            </div>

            <div className="space-y-3 bg-white/70 p-4 rounded-2xl border border-stone-light/40 text-xs font-sans text-forest-dark">
              {isIosChrome ? (
                <>
                  <div className="flex items-start gap-2.5">
                    <span className="text-base leading-none">⬆️</span>
                    <p>
                      <strong>{t("chromeIosStep1")}</strong>{" "}
                      <span className="text-stone">{t("chromeIosStep1Sub")}</span>
                    </p>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <span className="text-base leading-none">➕</span>
                    <p>
                      <strong>{t("chromeIosStep2")}</strong>{" "}
                      <span className="text-forest font-medium">"{t("chromeIosStep2Sub")}"</span>.
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-start gap-2.5">
                    <span className="text-base leading-none">📤</span>
                    <p>
                      <strong>{t("safariStep1")}</strong>{" "}
                      <span className="text-stone">{t("safariStep1Sub")}</span>
                    </p>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <span className="text-base leading-none">➕</span>
                    <p>
                      <strong>{t("safariStep2")}</strong>{" "}
                      <span className="text-forest font-medium">"{t("safariStep2Sub")}"</span>.
                    </p>
                  </div>
                </>
              )}
            </div>

            <div className="mt-5 flex gap-2">
              <button
                onClick={() => setShowIosModal(false)}
                className="w-full py-2.5 bg-forest text-cream text-xs font-sans font-medium rounded-xl hover:bg-forest-dark transition-colors shadow-sm"
              >
                {t("understood")}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
