// 🌍 Motor de Traducción Automática para PaDónde
// Traduce dinámicamente títulos y descripciones de eventos a EN, DE y FR.
// Preserva etiquetas técnicas <!--recurrente:...-->, emojis y saltos de línea.
// Diseñado con tolerancia total a fallos (fallback al texto original si hay error de red).

import type { LocaleCode } from "./eventosTraducciones";

export interface ContenidoTraducido {
  titulo: string;
  descripcion: string;
}

export type TraduccionesPorIdioma = Partial<Record<"en" | "de" | "fr", ContenidoTraducido>>;

// Caché en memoria para evitar llamadas redundantes durante el ciclo de vida del servidor
const translationCache = new Map<string, string>();

/**
 * Traduce un texto simple de español a un idioma destino.
 */
export async function traducirTexto(
  texto: string,
  targetLang: "en" | "de" | "fr",
  sourceLang: string = "es"
): Promise<string> {
  const limpio = (texto || "").trim();
  if (!limpio) return texto;
  if ((targetLang as string) === "es") return texto;

  const cacheKey = `${sourceLang}:${targetLang}:${limpio}`;
  if (translationCache.has(cacheKey)) {
    return translationCache.get(cacheKey)!;
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000); // 4s timeout

    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sourceLang}&tl=${targetLang}&dt=t&q=${encodeURIComponent(
      limpio
    )}`;

    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
      },
    });

    clearTimeout(timeout);

    if (!res.ok) {
      console.warn(`[Traductor] HTTP ${res.status} al traducir a ${targetLang}`);
      return limpio;
    }

    const data = await res.json();
    if (Array.isArray(data) && Array.isArray(data[0])) {
      const traducido = data[0].map((item: any) => item[0]).join("");
      if (traducido && traducido.trim().length > 0) {
        translationCache.set(cacheKey, traducido);
        return traducido;
      }
    }

    return limpio;
  } catch (err) {
    console.warn(`[Traductor] Error al traducir a ${targetLang}:`, err);
    return limpio;
  }
}

/**
 * Traduce el título y la descripción completa de un evento a los tres idiomas principales (EN, DE, FR).
 * Preserva de forma intacta la etiqueta <!--recurrente:...--> al final de la descripción.
 */
export async function traducirEventoCompleto(
  titulo: string,
  descripcion?: string | null
): Promise<Record<"en" | "de" | "fr", ContenidoTraducido>> {
  const descRaw = descripcion || "";

  // Separar etiqueta técnica de recurrencia si existe
  const tagMatch = descRaw.match(/<!--recurrente:([0-9,]+)-->/);
  const tagTecnica = tagMatch ? tagMatch[0] : "";
  const descSinTag = descRaw.replace(/<!--recurrente:([0-9,]+)-->/g, "").trim();

  const idiomas: ("en" | "de" | "fr")[] = ["en", "de", "fr"];

  const resultados = await Promise.all(
    idiomas.map(async (lang) => {
      const [tituloTraducido, descTraducida] = await Promise.all([
        traducirTexto(titulo, lang),
        descSinTag ? traducirTexto(descSinTag, lang) : Promise.resolve(""),
      ]);

      const descripcionFinal = descTraducida
        ? tagTecnica
          ? `${descTraducida.trim()}\n\n${tagTecnica}`
          : descTraducida.trim()
        : tagTecnica;

      return {
        lang,
        contenido: {
          titulo: tituloTraducido.trim() || titulo,
          descripcion: descripcionFinal,
        },
      };
    })
  );

  const res: Record<"en" | "de" | "fr", ContenidoTraducido> = {
    en: { titulo, descripcion: descRaw },
    de: { titulo, descripcion: descRaw },
    fr: { titulo, descripcion: descRaw },
  };

  for (const item of resultados) {
    res[item.lang] = item.contenido;
  }

  return res;
}
