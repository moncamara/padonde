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

export interface TrackWhatsAppClickParams {
  aliado_nombre?: string;
  tipo_categoria?: "hospedaje" | "evento" | "servicio_esencial" | string;
  seccion_origen?: "cotizador_hospedaje" | "tarjeta_feed" | "detalle_evento" | "servicios_esenciales" | "footer_comercial" | string;
  eventoId?: string;
  eventoTitulo?: string;
  negocioNombre?: string;
  negocioId?: string;
  ubicacion?: "tarjeta" | "detalle" | string;
  precio?: number | null;
  bypassAdminCheck?: boolean;
}

/**
 * Evento clave de conversión unificado: Clic en botón hacia WhatsApp (click_whatsapp)
 * Envía la telemetría a Google Analytics 4 (GA4) y al backend interno de analíticas en segundo plano.
 * 
 * Garantías:
 * - Valida la existencia segura de gtag (typeof window.gtag === 'function') para navegadores con bloqueadores.
 * - Despacha el nombre exacto de evento: 'click_whatsapp'.
 * - Parámetros 100% blindados contra undefined / null.
 * - Cero latencia o bloqueo sobre window.open o navegación nativa.
 */
export function trackWhatsAppClick(data: TrackWhatsAppClickParams) {
  if (typeof window === "undefined") return;

  const isForced =
    data.bypassAdminCheck ||
    (typeof window !== "undefined" && (window as any).padonde_force_analytics === true);

  if (isAdminDevice() && !isForced) {
    if ((window as any).padonde_debug_analytics) {
      console.info("🛡️ [Analytics: Admin device] Evento click_whatsapp omitido por padonde_admin_device cookie.");
    }
    return;
  }

  // 1. Sanitización de parámetros con Null-Safety estricto
  const aliadoNombre = (data.aliado_nombre || data.negocioNombre || "Aliado PaDónde").trim();
  const tipoCategoria = (data.tipo_categoria || (data.ubicacion === "tarjeta" ? "evento" : "evento")).trim();
  const seccionOrigen = (data.seccion_origen || data.ubicacion || "general").trim();
  const itemId = data.eventoId || "n/a";
  const itemName = (data.eventoTitulo || aliadoNombre).trim();
  const precio = typeof data.precio === "number" && !isNaN(data.precio) && data.precio >= 0 ? data.precio : 0;

  const ga4Payload: Record<string, any> = {
    aliado_nombre: aliadoNombre,
    tipo_categoria: tipoCategoria,
    seccion_origen: seccionOrigen,
    item_id: itemId,
    item_name: itemName,
    business_name: aliadoNombre,
    value: precio,
    currency: "COP",
    event_category: "Conversion",
    event_label: `${aliadoNombre} [${tipoCategoria}] - ${seccionOrigen}`,
  };

  // 2. Despacho a Google Analytics 4 (GA4) con validación estricta de función
  try {
    if (typeof window.gtag === "function") {
      window.gtag("event", "click_whatsapp", ga4Payload);
      if ((window as any).padonde_debug_analytics) {
        console.log("📊 [GA4 click_whatsapp despachado]", ga4Payload);
      }
    }
  } catch (gtagErr) {
    console.warn("Métricas WhatsApp (gtag dispatch fallback):", gtagErr);
  }

  // 3. Registro interno en segundo plano para el Panel Admin (no bloqueante vía Beacon o fetch keepalive)
  try {
    const payload = JSON.stringify({
      eventoId: data.eventoId,
      negocioId: data.negocioId,
      ubicacion: seccionOrigen,
      aliado_nombre: aliadoNombre,
      tipo_categoria: tipoCategoria,
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
    // Silencioso para garantizar cero impacto en la apertura inmediata de WhatsApp
  }
}

/**
 * Evento de conversión para Servicios Esenciales e Info Útil:
 * Reutiliza el evento unificado click_whatsapp garantizando consistencia en GA4.
 */
export function trackServicioEsencialWhatsAppClick(data: {
  servicioId: string;
  nombreComercial: string;
  categoria: string;
  zonaNombre: string;
}) {
  trackWhatsAppClick({
    aliado_nombre: data.nombreComercial,
    tipo_categoria: "servicio_esencial",
    seccion_origen: "servicios_esenciales",
    eventoId: data.servicioId,
    eventoTitulo: `${data.nombreComercial} (${data.categoria})`,
  });
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

