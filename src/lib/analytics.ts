// 📊 Utilidades de Google Analytics 4 (GA4) para PaDónde

export const GA_TRACKING_ID = process.env.NEXT_PUBLIC_GA_ID || "G-KNXJ1FEZE3";

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
    dataLayer?: any[];
  }
}

/**
 * Registra un evento personalizado en Google Analytics
 */
export function trackEvent(eventName: string, params: Record<string, any> = {}) {
  if (typeof window !== "undefined" && typeof window.gtag === "function") {
    window.gtag("event", eventName, params);
  }
}

/**
 * Evento clave de conversión: Clic en botón de WhatsApp para reservar
 * Envía el evento tanto a GA4 como a la base de datos interna de PaDónde en segundo plano.
 */
export function trackWhatsAppClick(data: {
  eventoId: string;
  eventoTitulo: string;
  negocioNombre: string;
  negocioId?: string;
  ubicacion: "tarjeta" | "detalle";
  precio?: number | null;
}) {
  // 1. Google Analytics 4 (GA4)
  trackEvent("click_reserva_whatsapp", {
    event_category: "Conversion",
    event_label: `${data.negocioNombre} - ${data.eventoTitulo}`,
    item_id: data.eventoId,
    item_name: data.eventoTitulo,
    business_name: data.negocioNombre,
    click_location: data.ubicacion,
    value: data.precio || 0,
    currency: "COP",
  });

  // 2. Registro interno en tiempo real para Panel Admin (fail-safe y no bloqueante)
  if (typeof window !== "undefined") {
    try {
      const payload = JSON.stringify({
        eventoId: data.eventoId,
        negocioId: data.negocioId,
        ubicacion: data.ubicacion,
      });

      if (typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
        const blob = new Blob([payload], { type: "application/json" });
        navigator.sendBeacon("/api/analytics/click-whatsapp", blob);
      } else {
        fetch("/api/analytics/click-whatsapp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: payload,
          keepalive: true,
        }).catch(() => {});
      }
    } catch {
      // Silencioso para garantizar cero impacto en la experiencia del usuario
    }
  }
}
