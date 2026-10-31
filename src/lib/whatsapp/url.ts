/**
 * Utilidades canónicas para construcción segura de enlaces de WhatsApp y formateo telefónico.
 * Usa exclusivamente api.whatsapp.com para evitar el bug documentado de redirección 302
 * de wa.me que corrompe emojis UTF-8 en símbolos extraños (%EF%BF%BD).
 */

/**
 * Limpia y normaliza un número de teléfono para WhatsApp.
 * Si es un número colombiano de 10 dígitos (ej. 3013010194), le antepone el prefijo de país 57.
 */
export function cleanPhoneNumber(phone?: string | null): string {
  if (!phone) return "";
  const digits = phone.replace(/\D/g, "");
  if (!digits) return "";
  if (digits.length === 10 && digits.startsWith("3")) {
    return `57${digits}`;
  }
  return digits;
}

/**
 * Formatea un número telefónico para visualización humana amigable.
 * Ejemplo: +57 301 301 0194
 */
export function formatVisualPhone(phone?: string | null): string {
  if (!phone) return "";
  const clean = cleanPhoneNumber(phone);
  if (!clean) return "";
  if (clean.startsWith("57") && clean.length === 12) {
    return `+57 ${clean.slice(2, 5)} ${clean.slice(5, 8)} ${clean.slice(8)}`;
  }
  if (clean.length === 10) {
    return `+57 ${clean.slice(0, 3)} ${clean.slice(3, 6)} ${clean.slice(6)}`;
  }
  return `+${clean}`;
}

export interface BuildWhatsAppUrlOptions {
  phone?: string | null;
  message?: string | null;
}

/**
 * Construye la URL canónica de WhatsApp usando api.whatsapp.com/send
 * con codificación segura de caracteres y emojis UTF-8.
 */
export function buildWhatsAppUrl({ phone, message }: BuildWhatsAppUrlOptions): string {
  const cleanPhone = cleanPhoneNumber(phone);
  const base = cleanPhone
    ? `https://api.whatsapp.com/send?phone=${cleanPhone}`
    : "https://api.whatsapp.com/send";

  if (message && message.trim()) {
    const separator = cleanPhone ? "&" : "?";
    return `${base}${separator}text=${encodeURIComponent(message)}`;
  }

  return base;
}

/**
 * Copia texto al portapapeles de manera segura con fallback para navegadores antiguos.
 */
export async function copyToClipboard(texto: string): Promise<boolean> {
  try {
    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(texto);
      return true;
    }
    // Fallback con input temporal
    const textarea = document.createElement("textarea");
    textarea.value = texto;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    const success = document.execCommand("copy");
    document.body.removeChild(textarea);
    return success;
  } catch {
    return false;
  }
}
