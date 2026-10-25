/**
 * Utilidades para normalización, optimización a HD y extracción
 * de fotografías de hospedajes desde Booking.com, Airbnb y CDNs externos.
 */

/**
 * Convierte miniaturas de Booking.com o Airbnb a resolución HD y limpia parámetros.
 */
export function optimizarUrlFotoHd(url: string): string {
  let clean = (url || "").trim();
  if (!clean) return "";

  // 1. Optimización Booking.com (CDN bstatic.com)
  if (clean.includes("bstatic.com")) {
    // Convierte /max300/, /max500/, /square60/, /max400/, etc. a HD /max1024x768/
    clean = clean.replace(/\/(max|square)\d+(x\d+)?\//i, "/max1024x768/");
    // Normaliza el host a cf.bstatic.com y conserva los parámetros ?k=... requeridos por CloudFront
    clean = clean.replace(/https:\/\/[^/]+bstatic\.com/i, "https://cf.bstatic.com");
  }

  // 2. Optimización Airbnb (CDN a0.muscache.com)
  if (clean.includes("muscache.com")) {
    try {
      const parsed = new URL(clean);
      if (parsed.searchParams.has("im_w")) {
        // Eleva a ancho de alta definición
        parsed.searchParams.set("im_w", "1200");
        clean = parsed.toString();
      }
    } catch {
      // Si no es parseable como URL completa, conservar como está
    }
  }

  return clean;
}

/**
 * Extrae URLs válidas de un texto multilínea o separado por comas,
 * las eleva a HD y elimina duplicados.
 */
export function extraerYOptimizarUrls(texto: string): string[] {
  if (!texto) return [];

  const rawUrls = texto
    .split(/[\n,\s]+/)
    .map((u) => u.trim())
    .filter((u) => u.startsWith("http://") || u.startsWith("https://"));

  const urlsOptimizadas = rawUrls.map(optimizarUrlFotoHd);
  return Array.from(new Set(urlsOptimizadas));
}

/**
 * Código JavaScript del Bookmarklet (Marcador de 1 Clic).
 * Funciona tanto en Booking.com como en Airbnb para extraer fotos en HD y copiarlas al portapapeles.
 */
export const SCRIPT_EXTRACCION_BOOKING_AIRBNB = `(function extraerFotosHospedaje() {
  const urlsUnicas = new Set();

  // 1. Buscar fotos en Booking.com (bstatic.com)
  document.querySelectorAll('picture img, #photo_wrapper img, .f6c12c77eb, img[src*="bstatic.com"], [data-preview*="bstatic.com"]').forEach(el => {
    let src = el.currentSrc || el.getAttribute('src') || el.getAttribute('data-preview') || '';
    if (src && src.includes('bstatic.com')) {
      const urlHd = src.replace(/\\/(max|square)\\d+(x\\d+)?\\//i, '/max1024x768/').replace(/https:\\/\\/[^/]+bstatic\\.com/i, 'https://cf.bstatic.com');
      urlsUnicas.add(urlHd);
    }
  });

  // 2. Buscar fotos en Airbnb (muscache.com)
  document.querySelectorAll('img[src*="muscache.com"]').forEach(el => {
    let src = el.currentSrc || el.getAttribute('src') || '';
    if (src && src.includes('muscache.com')) {
      try {
        const u = new URL(src);
        if (u.searchParams.has('im_w')) u.searchParams.set('im_w', '1200');
        urlsUnicas.add(u.toString());
      } catch (e) {
        urlsUnicas.add(src);
      }
    }
  });

  const lista = Array.from(urlsUnicas);

  if (lista.length === 0) {
    alert("⚠️ No encontramos fotos en esta vista. Abre la galería de fotos en pantalla completa y vuelve a presionar el marcador.");
    return;
  }

  const textoPegar = lista.join('\\n');
  navigator.clipboard.writeText(textoPegar).then(() => {
    alert("✅ ¡" + lista.length + " fotos en ALTA RESOLUCIÓN copiadas al portapapeles!\\n\\n👉 Ve a PaDónde y pégalas directamente en el formulario.");
  }).catch(() => {
    prompt("Copia las URLs con Ctrl+C / Cmd+C:", textoPegar);
  });
})();`;

/**
 * Versión empaquetada como URI para marcador (Bookmarklet): javascript:(...)
 */
export const BOOKMARKLET_URI = `javascript:${encodeURIComponent(SCRIPT_EXTRACCION_BOOKING_AIRBNB)}`;
