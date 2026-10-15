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
 */
export function trackWhatsAppClick(data: {
  eventoId: string;
  eventoTitulo: string;
  negocioNombre: string;
  ubicacion: "tarjeta" | "detalle";
  precio?: number | null;
}) {
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
}
