"use client";

import { useEffect, useState } from "react";

interface DetailSlideWrapperProps {
  children: React.ReactNode;
}

/**
 * Contenedor con animación de entrada deslizante estilo app nativa (iOS / Android).
 * Una vez completados los 280ms de entrada, libera el transform para que los elementos
 * fixed (barra superior y sticky CTA inferior) mantengan un comportamiento 100% nativo.
 */
export function DetailSlideWrapper({ children }: DetailSlideWrapperProps) {
  const [isEntering, setIsEntering] = useState(() => {
    if (typeof window !== "undefined") {
      try {
        const wasLocaleSwitch = sessionStorage.getItem("padonde_locale_switching");
        if (wasLocaleSwitch === "true") {
          sessionStorage.removeItem("padonde_locale_switching");
          return false;
        }
        // Si entra normalmente desde el feed, limpiar flag residual
        sessionStorage.removeItem("padonde_detail_lang_switched");
      } catch {}
    }
    return true;
  });

  useEffect(() => {
    if (!isEntering) return;
    const timer = setTimeout(() => {
      setIsEntering(false);
    }, 280);
    return () => clearTimeout(timer);
  }, [isEntering]);

  return (
    <div
      id="detail-page-wrapper"
      className={[
        "min-h-screen bg-cream pb-32",
        isEntering ? "animate-slide-in-right" : "",
      ].join(" ")}
    >
      {children}
    </div>
  );
}
