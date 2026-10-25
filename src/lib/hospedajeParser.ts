import type { BadgeHabitacion } from "@/lib/types";

export interface HabitacionExtraida {
  id: string;
  titulo: string;
  descripcion: string;
  precio_noche_cop: number;
  capacidad_max: number;
  fotos: string[];
  badges: BadgeHabitacion[];
}

export interface HospedajeExtraido {
  nombreNegocio: string;
  nombrePropietario?: string;
  whatsapp: string;
  instagram: string;
  zonaSlug: string;
  titulo: string;
  descripcion: string;
  ratingGoogle: string;
  reviewsGoogle: string;
  mapsUrl: string;
  imagenUrl: string;
  destacado: boolean;
  habitaciones: HabitacionExtraida[];
}

/**
 * Parsea una línea rápida en formato lead:
 * Ej: "- 3204475264 Alfonso Cardona - Monpet Beach"
 * Ej: "3204475264 Alfonso Cardona - The Mompe Beach"
 * Ej: "Alfonso Cardona - 3204475264 - Monpet Beach"
 */
export function parsearLineaRapida(linea: string): {
  telefono: string;
  nombrePropietario: string;
  nombreNegocio: string;
  instagram: string;
} {
  let raw = linea.trim().replace(/^[-•*#\s]+/, "");
  if (!raw) {
    return { telefono: "", nombrePropietario: "", nombreNegocio: "", instagram: "" };
  }

  // 1. Extraer Instagram con arroba si viene explícito
  let instagram = "";
  const matchArroba = raw.match(/@([a-zA-Z0-9._]+)/);
  if (matchArroba) {
    instagram = matchArroba[1];
    raw = raw.replace(matchArroba[0], " ").trim();
  }

  // 2. Extraer teléfono colombiano
  let telefono = "";
  const matchTel = raw.match(/(?:\+?57\s?)?(3\d{2}[-.\s]?\d{3}[-.\s]?\d{4}|3\d{9})/);
  if (matchTel) {
    telefono = "57" + matchTel[1].replace(/\D/g, "");
    if (telefono.startsWith("5757")) telefono = telefono.slice(2);
    // Remover el teléfono del string
    raw = raw.replace(matchTel[0], " ").trim();
  }

  // 3. Separar por guiones, barras, dos puntos o plecas
  const partes = raw
    .split(/[-–—|:\/]/)
    .map((p) => p.trim().replace(/^[-•*#\s]+/, "").trim())
    .filter(Boolean);

  let nombrePropietario = "";
  let nombreNegocio = "";

  const regexPalabrasNegocio = /(?:hotel|hostal|cabaña|cabañas|lodge|beach|playa|mar|resort|posada|glamping|casa|finca|camp|suites|villas|refugio|palmar|rancheria|hospedaje)/i;

  if (partes.length >= 2) {
    // Si la parte 0 tiene palabras de negocio y la 1 no, invertimos
    if (regexPalabrasNegocio.test(partes[0]) && !regexPalabrasNegocio.test(partes[1])) {
      nombreNegocio = partes[0];
      nombrePropietario = partes.slice(1).join(" - ");
    } else {
      nombrePropietario = partes[0];
      nombreNegocio = partes.slice(1).join(" - ");
    }
  } else if (partes.length === 1) {
    const textoUnico = partes[0];
    if (regexPalabrasNegocio.test(textoUnico)) {
      nombreNegocio = textoUnico;
    } else {
      // Si no tiene palabras de negocio, intentar adivinar por longitud o palabras
      const palabras = textoUnico.split(/\s+/);
      if (palabras.length >= 3) {
        // Ej: "Alfonso Cardona Monpet Beach" -> 2 palabras propietario, resto negocio
        nombrePropietario = palabras.slice(0, 2).join(" ");
        nombreNegocio = palabras.slice(2).join(" ");
      } else {
        nombreNegocio = textoUnico;
      }
    }
  }

  // 4. Si aún no hay instagram, detectar si el nombre del negocio empieza con un handle (ej: "astramendihuaca Astra Mendihuaca Beach")
  if (!instagram && nombreNegocio) {
    const tokens = nombreNegocio.split(/\s+/);
    if (tokens.length >= 2) {
      const primerToken = tokens[0];
      const resto = tokens.slice(1).join(" ");
      // Si el primer token es una sola palabra en minúsculas/alfanumérico y su raíz coincide con el nombre real
      if (
        /^[a-z0-9_.]+$/i.test(primerToken) &&
        (resto.toLowerCase().includes(primerToken.toLowerCase().slice(0, 5)) ||
          /^[A-Z]/.test(resto))
      ) {
        instagram = primerToken.toLowerCase();
        nombreNegocio = resto;
      }
    }
  }

  return {
    telefono,
    nombrePropietario,
    nombreNegocio,
    instagram,
  };
}

/**
 * Motor de extracción heurística y estructuración de fichas de hospedaje.
 * Diseñado para procesar texto bruto de Booking, Instagram, WhatsApp o sitios web
 * y convertirlo en una estructura lista para el cotizador interactivo de PaDónde.
 */
export function procesarTextoBrutoHospedaje(
  texto: string,
  zonaSugerida: string = "minca",
  nombreSugerido: string = ""
): HospedajeExtraido {
  const lineas = texto.split("\n").map((l) => l.trim()).filter(Boolean);
  const textoCompleto = texto;

  // 1. Detectar si viene en formato de línea rápida (lead): ej: "- 3204475264 Alfonso Cardona - Monpet Beach"
  let nombrePropietario = "";
  let whatsappDetectado = "";
  let instagramDetectado = "";
  if (lineas.length === 1 || (lineas.length > 0 && /[-•*#]?\s*(?:\+?57\s*)?3\d{9}/.test(lineas[0]))) {
    const quick = parsearLineaRapida(lineas[0]);
    if (quick.nombrePropietario) nombrePropietario = quick.nombrePropietario;
    if (quick.nombreNegocio && !nombreSugerido) nombreSugerido = quick.nombreNegocio;
    if (quick.telefono) whatsappDetectado = quick.telefono;
    if (quick.instagram) instagramDetectado = quick.instagram;
  }

  // 1. Detectar Nombre del Negocio
  let nombreNegocio = nombreSugerido.trim();
  if (!nombreNegocio) {
    const matchNombre =
      textoCompleto.match(/(?:hotel|hostal|cabaña|cabañas|lodge|finca|eco-lodge|glamping|posada|resort)\s+[\wáéíóúñÁÉÍÓÚÑ\s]{2,30}/i) ||
      lineas.find((l) => /^(?:hotel|hostal|cabaña|casona|casa|lodge|finca)\b/i.test(l));
    if (matchNombre) {
      nombreNegocio = typeof matchNombre === "string" ? matchNombre : matchNombre[0];
    } else if (lineas.length > 0) {
      nombreNegocio = lineas[0].slice(0, 40);
    } else {
      nombreNegocio = "Hospedaje en " + (zonaSugerida === "mendihuaca" ? "Mendihuaca" : "Minca");
    }
  }

  // Limpiar caracteres extraños en el nombre
  nombreNegocio = nombreNegocio.replace(/^[#*•\-\s]+/, "").trim();

  // 2. Detectar WhatsApp / Teléfono
  let whatsapp = whatsappDetectado;
  if (!whatsapp) {
    const matchWa = textoCompleto.match(/(?:\+?57\s?)?(3\d{2}[-.\s]?\d{3}[-.\s]?\d{4}|3\d{9})/);
    if (matchWa) {
      whatsapp = "57" + matchWa[1].replace(/\D/g, "");
      if (whatsapp.startsWith("5757")) whatsapp = whatsapp.slice(2);
    }
  }

  // 3. Detectar Instagram
  let instagram = "";
  const matchIg = textoCompleto.match(/(?:@|instagram\.com\/)([a-zA-Z0-9_.]+)/i);
  if (matchIg) {
    instagram = "@" + matchIg[1].replace(/^@/, "");
  } else if (instagramDetectado) {
    instagram = "@" + instagramDetectado.replace(/^@/, "");
  }

  // 4. Detectar Rating / Reseñas de Google o Booking
  let ratingGoogle = "";
  let reviewsGoogle = "";
  const matchRating = textoCompleto.match(/(?:puntuaci[oó]n|rating|calificaci[oó]n|estrellas?|nota)?\s*([45]\.[0-9]|[789]\.[0-9]|10)\s*(?:\/|de)?\s*(?:10|5)?/i);
  if (matchRating) {
    let r = parseFloat(matchRating[1]);
    if (r > 5) r = +(r / 2).toFixed(1); // Normalizar a escala de 5 estrellas si venía de 10
    ratingGoogle = r.toString();
  }
  const matchReviews = textoCompleto.match(/(\d{1,4})\s*(?:reseñas|comentarios|reviews|opiniones)/i);
  if (matchReviews) {
    reviewsGoogle = matchReviews[1];
  }

  // 5. Detectar Enlaces de Google Maps
  let mapsUrl = "";
  const matchMaps = textoCompleto.match(/https?:\/\/(?:maps\.app\.goo\.gl|goo\.gl\/maps|www\.google\.com\/maps)[^\s)]+/i);
  if (matchMaps) {
    mapsUrl = matchMaps[0];
  }

  // 6. Detectar URLs de imágenes directas (.jpg, .png, .webp, .jpeg)
  const urlsImagenes = Array.from(
    textoCompleto.matchAll(/https?:\/\/[^\s)]+\.(?:jpg|jpeg|png|webp)(?:\?[^\s)]*)?/gi)
  ).map((m) => m[0]);

  // 7. Detectar Habitaciones / Acomodaciones
  const habitaciones: HabitacionExtraida[] = [];
  
  // Expresión para buscar bloques de habitaciones
  const bloquesHabitacion = [
    {
      regex: /(?:habitaci[oó]n\s+est[aá]ndar|habitaci[oó]n\s+doble|doble\s+est[aá]ndar|cama\s+doble)/i,
      titulo: "Habitación Estándar Doble",
      capacidad: 2,
      precio: 180000,
      badgesDefecto: [{ icono: "🚿", texto: "Baño privado" }, { icono: "🌀", texto: "Ventilador" }, { icono: "📶", texto: "Wi-Fi rápido" }],
    },
    {
      regex: /(?:habitaci[oó]n\s+superior|king|suite|cama\s+king)/i,
      titulo: "Habitación Superior King",
      capacidad: 2,
      precio: 250000,
      badgesDefecto: [{ icono: "🚿", texto: "Baño privado" }, { icono: "🌄", texto: "Balcón privado" }, { icono: "📶", texto: "Wi-Fi rápido" }],
    },
    {
      regex: /(?:habitaci[oó]n\s+triple|triple|3\s+personas)/i,
      titulo: "Habitación Triple Familiar",
      capacidad: 3,
      precio: 290000,
      badgesDefecto: [{ icono: "🚿", texto: "Baño privado" }, { icono: "🍳", texto: "Desayuno incluido" }, { icono: "📶", texto: "Wi-Fi rápido" }],
    },
    {
      regex: /(?:cabaña|casa\s+colibr[ií]|familiar|casa\s+completa|adosada|4\s+personas|5\s+personas|6\s+personas)/i,
      titulo: "Cabaña / Suite Familiar",
      capacidad: 5,
      precio: 420000,
      badgesDefecto: [{ icono: "🚿", texto: "Baño privado" }, { icono: "🌿", texto: "Vista a la montaña" }, { icono: "🌄", texto: "Balcón privado" }, { icono: "📶", texto: "Wi-Fi rápido" }],
    },
    {
      regex: /(?:dormitorio|compartid[ao]|cama\s+en\s+dormitorio|hostel\s+bed)/i,
      titulo: "Cama en Dormitorio Compartido",
      capacidad: 1,
      precio: 65000,
      badgesDefecto: [{ icono: "🚿", texto: "Baño compartido" }, { icono: "🔒", texto: "Locker individual" }, { icono: "📶", texto: "Wi-Fi rápido" }],
    },
  ];

  bloquesHabitacion.forEach((b, idx) => {
    if (b.regex.test(textoCompleto)) {
      // Buscar si hay un precio específico cerca de este tipo de habitación
      let precioFinal = b.precio;
      const matchPrecio = textoCompleto.match(
        new RegExp(`${b.regex.source}[\\s\\S]{0,100}?\\$?\\s*([0-9]{2,3}(?:[.,][0-9]{3})+|[0-9]{5,7})`, "i")
      );
      if (matchPrecio) {
        const val = parseInt(matchPrecio[1].replace(/[.,]/g, ""), 10);
        if (val >= 30000 && val <= 2500000) {
          precioFinal = val;
        }
      }

      // Detectar badges en el texto completo
      const badges: BadgeHabitacion[] = [...b.badgesDefecto];
      if (/desayuno/i.test(textoCompleto) && !badges.some((x) => x.texto.includes("Desayuno"))) {
        badges.push({ icono: "🍳", texto: "Desayuno incluido" });
      }
      if (/(?:aire\s+acondicionado|a\/c)/i.test(textoCompleto) && !badges.some((x) => x.texto.includes("Aire"))) {
        badges.push({ icono: "❄️", texto: "Aire acondicionado" });
      }
      if (/(?:vista\s+al?\s+r[ií]o|r[ií]o)/i.test(textoCompleto) && !badges.some((x) => x.texto.includes("Vista"))) {
        badges.push({ icono: "🌿", texto: "Vista a la montaña" });
      }

      habitaciones.push({
        id: `hab-auto-${idx + 1}-${Date.now().toString().slice(-4)}`,
        titulo: b.titulo,
        descripcion: `Ideal para descanso con entorno natural, comodidad y tranquilidad en ${zonaSugerida === "mendihuaca" ? "Mendihuaca" : "Minca"}.`,
        precio_noche_cop: precioFinal,
        capacidad_max: b.capacidad,
        fotos: urlsImagenes.slice(idx * 2, idx * 2 + 2),
        badges: badges.slice(0, 4),
      });
    }
  });

  // Si no se detectaron habitaciones específicas pero hay texto, crear 2 opciones típicas
  if (habitaciones.length === 0) {
    habitaciones.push(
      {
        id: `hab-auto-1-${Date.now().toString().slice(-4)}`,
        titulo: "Habitación Privada Estándar",
        descripcion: "Habitación cómoda con baño privado, luz natural y ambiente tranquilo de la Sierra.",
        precio_noche_cop: 180000,
        capacidad_max: 2,
        fotos: urlsImagenes.slice(0, 2),
        badges: [
          { icono: "🚿", texto: "Baño privado" },
          { icono: "🌀", texto: "Ventilador" },
          { icono: "📶", texto: "Wi-Fi rápido" },
        ],
      },
      {
        id: `hab-auto-2-${Date.now().toString().slice(-4)}`,
        titulo: "Habitación Superior con Vista",
        descripcion: "Espacio amplio con balcón y vista panorámica a la vegetación tropical.",
        precio_noche_cop: 260000,
        capacidad_max: 3,
        fotos: urlsImagenes.slice(2, 4),
        badges: [
          { icono: "🚿", texto: "Baño privado" },
          { icono: "🌄", texto: "Balcón privado" },
          { icono: "🌿", texto: "Vista a la montaña" },
        ],
      }
    );
  }

  // 8. Redactar Título y Descripción Atractiva estilo PaDónde
  const zonaNombre = zonaSugerida === "mendihuaca" ? "Mendihuaca" : "Minca";
  const tituloFinal = `${nombreNegocio} — Hospedaje & Naturaleza en ${zonaNombre}`;

  // Extraer puntos destacados del texto
  const piscina = /(?:piscina|alberca|pool)/i.test(textoCompleto);
  const colibries = /(?:colibr[ií]|aves|birdwatching|avistamiento)/i.test(textoCompleto);
  const restaurante = /(?:restaurante|comida|gastronom[ií]a|chef)/i.test(textoCompleto);
  const parqueadero = /(?:parqueadero|estacionamiento|parking)/i.test(textoCompleto);

  let descripcionFinal = `${nombreNegocio} es un refugio acogedor ubicado en ${zonaNombre}, rodeado del verde exuberante de la Sierra Nevada de Santa Marta.\n\n`;
  descripcionFinal += `🌿 Destacados de este hospedaje:\n`;
  if (piscina) descripcionFinal += `• Piscina al aire libre con agua fresca de montaña.\n`;
  if (colibries) descripcionFinal += `• Jardines tropicales con bebederos y avistamiento continuo de colibríes.\n`;
  if (restaurante) descripcionFinal += `• Restaurante propio con platos locales e internacionales.\n`;
  if (parqueadero) descripcionFinal += `• Parqueadero privado en las instalaciones.\n`;
  descripcionFinal += `• A poca distancia caminando del pueblo y de senderos ecológicos.\n`;
  descripcionFinal += `• Conexión Wi-Fi para nómadas y viajeros.\n\n`;
  descripcionFinal += `📲 Consulta disponibilidad de habitaciones en el cotizador interactivo o escribe directamente a su WhatsApp para reservar sin intermediarios.`;

  return {
    nombreNegocio,
    nombrePropietario: nombrePropietario || undefined,
    whatsapp,
    instagram,
    zonaSlug: zonaSugerida,
    titulo: tituloFinal,
    descripcion: descripcionFinal,
    ratingGoogle,
    reviewsGoogle,
    mapsUrl,
    imagenUrl: urlsImagenes[0] || "",
    destacado: false,
    habitaciones,
  };
}

/**
 * Detecta si un hospedaje entrante o en edición coincide con uno ya registrado
 * para alertar sobre posibles duplicados por nombre o teléfono.
 */
export function buscarCoincidenciaHospedaje(
  nuevo: { nombre?: string; telefono?: string },
  listaExistente: any[],
  ignorarId?: string
): any | null {
  if (!listaExistente || listaExistente.length === 0) return null;

  const normalizar = (str?: string) =>
    (str || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]/g, "")
      .trim();

  const stopWords = new Set([
    "hotel", "hostal", "lodge", "cabana", "cabanas", "finca", "posada",
    "playa", "beach", "resort", "glamping", "suites", "villas", "refugio",
    "santa", "marta", "minca", "mendihuaca", "sierra", "nevada", "colombia"
  ]);

  const extraerPalabras = (str?: string) =>
    (str || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .split(/[^a-z0-9]+/)
      .filter((w) => w.length >= 4 && !stopWords.has(w));

  const telNuevo = (nuevo.telefono || "").replace(/\D/g, "");
  const telNuevoUltimos10 = telNuevo.length >= 7 ? telNuevo.slice(-10) : "";
  const nomNuevoNorm = normalizar(nuevo.nombre);
  const palabrasNuevas = extraerPalabras(nuevo.nombre);

  for (const item of listaExistente) {
    if (ignorarId && item.id === ignorarId) continue;

    // 1. Coincidencia por teléfono exacto (últimos 10 dígitos)
    const telExistente = (item.negocio?.whatsapp || "").replace(/\D/g, "");
    if (telNuevoUltimos10 && telExistente.length >= 7) {
      if (telExistente.endsWith(telNuevoUltimos10) || telNuevoUltimos10.endsWith(telExistente.slice(-10))) {
        return item;
      }
    }

    // 2. Coincidencia por nombre normalizado (si tiene longitud razonable)
    const nomExistenteNegocio = normalizar(item.negocio?.nombre);
    const nomExistenteTitulo = normalizar(item.titulo);

    if (nomNuevoNorm.length >= 4) {
      if (
        nomExistenteNegocio === nomNuevoNorm ||
        (nomExistenteNegocio.length >= 5 && nomExistenteNegocio.includes(nomNuevoNorm)) ||
        (nomNuevoNorm.length >= 5 && nomNuevoNorm.includes(nomExistenteNegocio)) ||
        nomExistenteTitulo.includes(nomNuevoNorm)
      ) {
        return item;
      }
    }

    // 3. Coincidencia por palabras clave no genéricas (ej: "mompe", "zakua", "brisas")
    if (palabrasNuevas.length > 0) {
      const palabrasExistente = [
        ...extraerPalabras(item.negocio?.nombre),
        ...extraerPalabras(item.titulo),
      ];
      const hayPalabraComun = palabrasNuevas.some((p) => palabrasExistente.includes(p));
      if (hayPalabraComun) {
        return item;
      }
    }
  }

  return null;
}
