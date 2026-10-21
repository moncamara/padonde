// 📊 Utilidades de Google Analytics 4 (GA4) para PaDónde

export const GA_TRACKING_ID = process.env.NEXT_PUBLIC_GA_ID || "G-KNXJ1FEZE3";

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
    dataLayer?: any[];
  }
}

/**
 * Detecta si el dispositivo actual pertenece a un administrador
 * (marcado por cookie al entrar al panel) para no contaminar analíticas con pruebas internas.
 */
export function isAdminDevice(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return document.cookie.includes("padonde_admin_device=true");
  } catch {
    return false;
  }
}

/**
 * Registra un evento personalizado en Google Analytics
 */
export function trackEvent(eventName: string, params: Record<string, any> = {}) {
  if (typeof window !== "undefined") {
    if (isAdminDevice()) return;
    if (typeof window.gtag === "function") {
      window.gtag("event", eventName, params);
    }
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
  if (isAdminDevice()) {
    // El administrador está probando botones; no contaminamos métricas de conversión
    return;
  }

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

/**
 * Evento clave de conversión para Servicios Esenciales e Info Útil:
 * Clic en botón de WhatsApp del aliado fijo (Embassy Bank, Transporte, etc.)
 */
export function trackServicioEsencialWhatsAppClick(data: {
  servicioId: string;
  nombreComercial: string;
  categoria: string;
  zonaNombre: string;
}) {
  // 1. Google Analytics 4 (GA4)
  trackEvent("click_esencial_whatsapp", {
    event_category: "Conversion",
    event_label: `${data.nombreComercial} (${data.categoria}) - ${data.zonaNombre}`,
    service_id: data.servicioId,
    service_name: data.nombreComercial,
    category: data.categoria,
    destination: data.zonaNombre,
  });

  // 2. Registro interno en tiempo real para Panel Admin
  if (typeof window !== "undefined") {
    try {
      const payload = JSON.stringify({
        ubicacion: "servicio_esencial",
        servicioId: data.servicioId,
      });

      if (typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
        const blob = new Blob([payload], { type: "application/json" });
        navigator.sendBeacon("/api/analytics/click-whatsapp", blob);
      }
    } catch {
      // Silencioso
    }
  }
}

/**
 * Evento de Google Analytics: Clic en enlace de Google Maps de un Servicio Esencial
 */
export function trackServicioEsencialMapsClick(data: {
  servicioId: string;
  nombreComercial: string;
  categoria: string;
}) {
  trackEvent("click_esencial_maps", {
    event_category: "Engagement",
    event_label: `${data.nombreComercial} (${data.categoria})`,
    service_id: data.servicioId,
    service_name: data.nombreComercial,
    category: data.categoria,
  });
}

/**
 * Evento de Google Analytics: Cambio de Pestaña principal (Cartelera vs Info Útil)
 */
export function trackTabChange(tab: "eventos" | "servicios", zonaNombre: string) {
  trackEvent("switch_feed_tab", {
    event_category: "Navigation",
    tab_name: tab,
    destination: zonaNombre,
  });
}

