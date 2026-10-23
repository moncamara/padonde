import type { CategoriaEvento } from "@/lib/types";
import { getFechaYMDColombia } from "@/lib/utils";

export interface AliadoSimple {
  id: string;
  nombre: string;
  whatsapp: string;
  instagram?: string | null;
  categoria?: string;
  zonaSlug?: string;
  zonaNombre?: string;
}

export interface EventoExtraido {
  titulo: string;
  descripcion: string;
  categoria: CategoriaEvento;
  precio: number;
  dateTime: string; // Formato YYYY-MM-DDTHH:mm para input datetime-local
  fechaFin?: string | null;
  aliadoId?: string | null;
  businessName: string;
  whatsapp: string;
  instagram: string;
  zonaSlug: string;
  mapsUrl?: string;
  destacado: boolean;
  textoOriginal: string;
  notasAsistente: string[];
  esRecurrente?: boolean;
  diasRecurrentes?: number[];
}

/**
 * Normaliza texto para comparaciones sin tildes ni caracteres especiales.
 */
function normalizar(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

/**
 * Días de la semana en español y sus índices (0 = Domingo, 1 = Lunes, ..., 6 = Sábado).
 */
const DIAS_SEMANA: Record<string, number> = {
  domingo: 0,
  lunes: 1,
  martes: 2,
  miercoles: 3,
  miércoles: 3,
  jueves: 4,
  viernes: 5,
  sabado: 6,
  sábado: 6,
};

const MESES: Record<string, number> = {
  enero: 0,
  febrero: 1,
  marzo: 2,
  abril: 3,
  mayo: 4,
  junio: 5,
  julio: 6,
  agosto: 7,
  septiembre: 8,
  setiembre: 8,
  octubre: 9,
  noviembre: 10,
  diciembre: 11,
};

/**
 * Obtiene la fecha actual en la zona horaria de Colombia como objeto Date base.
 */
function getAhoraColombia(): Date {
  const ahora = new Date();
  const ymd = getFechaYMDColombia(ahora);
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(y, m - 1, d, 12, 0, 0); // Mediodía para evitar desfases
}

/**
 * Calcula la fecha y hora en formato local YYYY-MM-DDTHH:mm
 */
function calcularFechaHora(
  texto: string,
  categoriaInval: CategoriaEvento
): { dateTime: string; fechaFin?: string | null; nota: string } {
  const norm = normalizar(texto);
  const ahoraCol = getAhoraColombia();
  const diaActualIndex = ahoraCol.getDay(); // 0-6

  let targetDate = new Date(ahoraCol);
  let fechaDetectadaNota = "Fecha: Hoy";

  // 1. Detectar día de la semana o relativo
  if (/\bhoy\b|\besta noche\b/.test(norm)) {
    targetDate = ahoraCol;
    fechaDetectadaNota = "Detectado: Hoy";
  } else if (/\bma[nñ]ana\b/.test(norm)) {
    targetDate.setDate(ahoraCol.getDate() + 1);
    fechaDetectadaNota = "Detectado: Mañana";
  } else if (/\bpasado ma[nñ]ana\b/.test(norm)) {
    targetDate.setDate(ahoraCol.getDate() + 2);
    fechaDetectadaNota = "Detectado: Pasado mañana";
  } else {
    // Buscar días de la semana ("este viernes", "el sábado", "miércoles", etc.)
    let matchDia: { dia: string; index: number } | null = null;
    for (const [nombreDia, idx] of Object.entries(DIAS_SEMANA)) {
      const regex = new RegExp(`\\b(?:este|el|pr[oó]ximo)?\\s*${nombreDia}\\b`, "i");
      if (regex.test(norm)) {
        matchDia = { dia: nombreDia, index: idx };
        break;
      }
    }

    if (matchDia) {
      let diasDiferencia = matchDia.index - diaActualIndex;
      if (diasDiferencia < 0) {
        diasDiferencia += 7; // Próximo día de la semana si ya pasó esta semana
      }
      targetDate.setDate(ahoraCol.getDate() + diasDiferencia);
      fechaDetectadaNota =
        diasDiferencia === 0
          ? `Detectado: Hoy (${matchDia.dia})`
          : `Detectado: Próximo ${matchDia.dia}`;
    } else {
      // Buscar fechas tipo "25 de octubre", "31 oct", "15/11"
      const matchFechaMes = norm.match(
        /\b(\d{1,2})\s*(?:de|\/)?\s*(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre|ene|feb|mar|abr|may|jun|jul|ago|sep|oct|nov|dic)\b/i
      );

      if (matchFechaMes) {
        const diaNum = parseInt(matchFechaMes[1], 10);
        const mesStr = matchFechaMes[2].toLowerCase();
        let mesNum = ahoraCol.getMonth();
        for (const [mNombre, mIdx] of Object.entries(MESES)) {
          if (mNombre.startsWith(mesStr)) {
            mesNum = mIdx;
            break;
          }
        }
        let ano = ahoraCol.getFullYear();
        if (mesNum < ahoraCol.getMonth()) {
          ano += 1; // Si el mes ya pasó este año, sugerir el próximo
        }
        targetDate = new Date(ano, mesNum, diaNum, 12, 0, 0);
        fechaDetectadaNota = `Detectado: ${diaNum} de ${mesStr}`;
      }
    }
  }

  // 2. Detectar Hora
  let hora = "20";
  let minutos = "00";
  let horaDetectada = false;

  // Formato tipo "8:30 pm", "7pm", "9:00pm", "20:00"
  const matchHora = texto.match(/\b([01]?\d|2[0-3])(?::([0-5]\d))?\s*(am|pm|a\.m\.|p\.m\.)?\b/i);
  if (matchHora) {
    let h = parseInt(matchHora[1], 10);
    const m = matchHora[2] ? matchHora[2] : "00";
    const meridiano = matchHora[3]?.toLowerCase().replace(/\./g, "");

    if (meridiano === "pm" && h < 12) h += 12;
    if (meridiano === "am" && h === 12) h = 0;

    // Si no tiene am/pm y es menor a 12, evaluar contexto
    if (!meridiano && h <= 12) {
      if (h <= 5 || h === 12) {
        h += 12; // 4 -> 16:00 (tardeo/noche)
      } else if (h >= 6 && h <= 11) {
        if (categoriaInval === "rumba" || categoriaInval === "arte") {
          h += 12; // 8 en fiesta -> 20:00
        }
      }
    }

    hora = h.toString().padStart(2, "0");
    minutos = m.padStart(2, "0");
    horaDetectada = true;
  } else {
    // Horas predeterminadas según tipo de plan
    switch (categoriaInval) {
      case "rumba":
        hora = "21";
        minutos = "00";
        break;
      case "comida":
        hora = "19";
        minutos = "30";
        break;
      case "bienestar":
        hora = "08";
        minutos = "30";
        break;
      case "tours":
        hora = "08";
        minutos = "00";
        break;
      case "arte":
        hora = "20";
        minutos = "00";
        break;
      default:
        hora = "19";
        minutos = "00";
        break;
    }
  }

  const yyyy = targetDate.getFullYear();
  const mm = (targetDate.getMonth() + 1).toString().padStart(2, "0");
  const dd = targetDate.getDate().toString().padStart(2, "0");

  const dateTime = `${yyyy}-${mm}-${dd}T${hora}:${minutos}`;

  return {
    dateTime,
    nota: `${fechaDetectadaNota} a las ${hora}:${minutos} ${horaDetectada ? "(encontrado en texto)" : "(sugerido por categoría)"}`,
  };
}

/**
 * Procesa texto crudo (mensaje de WhatsApp o descripción de afiche) y genera
 * una ficha lista para publicar en PaDónde.
 */
export function procesarTextoBrutoEvento(
  texto: string,
  aliadosDisponibles: AliadoSimple[] = [],
  zonaSugerida: string = "minca"
): EventoExtraido {
  const lineas = texto.split("\n").map((l) => l.trim()).filter(Boolean);
  const textoNorm = normalizar(texto);
  const notasAsistente: string[] = [];

  // 1. Detectar Aliado / Negocio Existente
  let aliadoId: string | null = null;
  let businessName = "";
  let whatsapp = "";
  let instagram = "";
  let zonaSlug = zonaSugerida;

  // Buscar coincidencia en la lista de aliados registrados
  for (const aliado of aliadosDisponibles) {
    const nombreNorm = normalizar(aliado.nombre);
    if (nombreNorm.length >= 3 && textoNorm.includes(nombreNorm)) {
      aliadoId = aliado.id;
      businessName = aliado.nombre;
      whatsapp = aliado.whatsapp || "";
      instagram = aliado.instagram || "";
      if (aliado.zonaSlug) zonaSlug = aliado.zonaSlug;
      notasAsistente.push(`Aliado vinculado automáticamente: "${aliado.nombre}"`);
      break;
    }
  }

  // Si no se encontró un aliado registrado, extraer pistas del texto
  if (!businessName) {
    // Buscar patrones tipo: "en @hostalxyz", "en Duni", "lugar: Casona"
    const matchLugar =
      texto.match(/(?:en|lugar|ubicaci[oó]n|venue|hostal|hotel|restaurante|finca)\s*[:\-]?\s*([A-ZÁÉÍÓÚÑa-záéíóúñ0-9\s]{3,30})/i) ||
      texto.match(/@([a-zA-Z0-9_.]+)/);

    if (matchLugar) {
      businessName = matchLugar[1].trim().replace(/^@/, "");
      notasAsistente.push(`Lugar inferido del texto: "${businessName}"`);
    } else if (lineas.length > 0) {
      businessName = lineas[0].slice(0, 35);
    } else {
      businessName = zonaSugerida === "mendihuaca" ? "Negocio en Mendihuaca" : "Negocio en Minca";
    }
  }

  // Extraer WhatsApp si no venía en el aliado
  if (!whatsapp) {
    const matchWa = texto.match(/(?:\+?57\s?)?(3\d{2}[-.\s]?\d{3}[-.\s]?\d{4}|3\d{9})/);
    if (matchWa) {
      whatsapp = "57" + matchWa[1].replace(/\D/g, "");
      if (whatsapp.startsWith("5757")) whatsapp = whatsapp.slice(2);
      notasAsistente.push(`WhatsApp extraído: ${whatsapp}`);
    }
  }

  // Extraer Instagram si no venía en el aliado
  if (!instagram) {
    const matchIg = texto.match(/(?:@|instagram\.com\/)([a-zA-Z0-9_.]+)/i);
    if (matchIg) {
      instagram = "@" + matchIg[1].replace(/^@/, "");
      notasAsistente.push(`Instagram extraído: ${instagram}`);
    }
  }

  // 2. Clasificar Categoría
  let categoria: CategoriaEvento = "arte";
  if (
    /fiesta|dj\b|techno|house|perreo|rumba|party|barra libre|shot|shots|carranga|electr[oó]nica/.test(
      textoNorm
    )
  ) {
    categoria = "rumba";
  } else if (
    /yoga|sound healing|cuencos|meditaci[oó]n|cacao|temazcal|breathwork|respiraci[oó]n|reiki|hol[ií]stico|detox/.test(
      textoNorm
    )
  ) {
    categoria = "bienestar";
  } else if (
    /tour|caminata|trek|cascada|waterfall|senderismo|avistamiento|p[aá]jaros|birdwatching|pozo azul|marinka|r[ií]o|tubing|surf/.test(
      textoNorm
    )
  ) {
    categoria = "tours";
  } else if (
    /pizza|burger|hamburguesa|cena|almuerzo|cata|vino|cerveza|brunch|asado|gastronom[ií]a|postre|caf[eé]/.test(
      textoNorm
    )
  ) {
    categoria = "comida";
  } else if (
    /feria|artesan[ií]as|mercado|artesanos|souvenirs|tejido/.test(textoNorm)
  ) {
    categoria = "artesanias";
  } else {
    // Por defecto 'arte' para música en vivo, acústicos, bandas, cine
    categoria = "arte";
  }
  notasAsistente.push(`Categoría sugerida: ${categoria.toUpperCase()}`);

  // 3. Detectar Precio / Cover
  let precio = 0;
  if (/entrada libre|gratis|free entrance|sin cover|aporte voluntario|aporte libre|free/i.test(textoNorm)) {
    precio = 0;
    notasAsistente.push("Cover: Entrada Libre ($0 COP)");
  } else {
    // Detectar patrones de precio tipo "$15.000", "20k", "15000", "cover: 10 mil"
    const matchPrecioK = textoNorm.match(/\b(\d{1,3})\s*k\b/);
    const matchPrecioMil = textoNorm.match(/\b(\d{1,3})\s*mil\b/);
    const matchPrecioCop = textoNorm.match(/\$?\s*(\d{1,3}(?:\.\d{3})+|\d{4,6})\b/);

    if (matchPrecioK) {
      precio = parseInt(matchPrecioK[1], 10) * 1000;
      notasAsistente.push(`Cover detectado: $${precio.toLocaleString("es-CO")} COP (de formato "${matchPrecioK[0]}")`);
    } else if (matchPrecioMil) {
      precio = parseInt(matchPrecioMil[1], 10) * 1000;
      notasAsistente.push(`Cover detectado: $${precio.toLocaleString("es-CO")} COP`);
    } else if (matchPrecioCop) {
      const numLimpio = matchPrecioCop[1].replace(/\./g, "");
      precio = parseInt(numLimpio, 10);
      notasAsistente.push(`Cover detectado: $${precio.toLocaleString("es-CO")} COP`);
    } else {
      notasAsistente.push("Cover no especificado en el texto (se asignó Entrada Libre $0 COP por seguridad)");
    }
  }

  // 4. Calcular Fecha y Hora
  const fechaCalculada = calcularFechaHora(texto, categoria);
  notasAsistente.push(fechaCalculada.nota);

  // 5. Redacción de Título Atractivo (Estilo mochilero / cartelera premium)
  let titulo = "";
  // Buscar pistas explícitas de música o concepto
  const matchAcustico = /ac[uú]stico|guitarra|en vivo|live music|banda/i.test(textoNorm);
  const matchSalsa = /salsa|bachata|tropical/i.test(textoNorm);
  const matchFogata = /fogata|campfire|bonfire/i.test(textoNorm);
  const matchDj = /dj|sunset|atardecer/i.test(textoNorm);

  if (categoria === "arte" && matchAcustico && matchFogata) {
    titulo = "Noche Acústica & Fogata en Vivo";
  } else if (categoria === "arte" && matchAcustico) {
    titulo = "Música en Vivo & Noche Acústica";
  } else if (categoria === "rumba" && matchSalsa) {
    titulo = "Noche de Salsa, Ritmo & Cócteles";
  } else if (categoria === "rumba" && matchDj) {
    titulo = "Sunset & DJ Party en la Selva";
  } else if (categoria === "rumba") {
    titulo = "Noche de Fiesta & Buena Música";
  } else if (categoria === "bienestar") {
    titulo = "Sesión de Yoga & Conexión Holística";
  } else if (categoria === "tours") {
    titulo = "Aventura & Caminata Guiada en la Sierra";
  } else if (categoria === "comida") {
    titulo = "Noche Gastronómica & Especial del Chef";
  } else {
    // Tomar la primera línea limpia capitalizada
    const primeraLimpia = lineas[0]
      .replace(/^[#*•\-\s!]+/, "")
      .replace(/[!¡]+/g, "")
      .trim();
    titulo = primeraLimpia.length > 5 && primeraLimpia.length < 50
      ? primeraLimpia
      : `Plan Especial en ${businessName}`;
  }

  // Asegurar formato de título: primera letra mayúscula, no todo mayúsculas
  if (titulo === titulo.toUpperCase()) {
    titulo = titulo.charAt(0).toUpperCase() + titulo.slice(1).toLowerCase();
  }

  // 6. Redacción de Descripción Atractiva para Turistas y Mochileros
  let descripcion = "";
  const detallesAmbiente: string[] = [];

  if (matchFogata) detallesAmbiente.push("🔥 Ambiente cálido con fogata bajo las estrellas.");
  if (matchAcustico) detallesAmbiente.push("🎸 Presentación musical en vivo con artistas locales e invitados.");
  if (matchSalsa) detallesAmbiente.push("💃 Pista abierta con lo mejor de la salsa, bachata y ritmos tropicales.");
  if (precio === 0) detallesAmbiente.push("✨ Entrada libre para toda la comunidad y viajeros.");
  else detallesAmbiente.push(`🎟️ Cover: $${precio.toLocaleString("es-CO")} COP por persona.`);

  const textoSintetizado = lineas
    .filter((l) => l.length > 15 && !l.toLowerCase().includes("whatsapp"))
    .slice(0, 3)
    .join(" ");

  descripcion = [
    `¡Ven a disfrutar de una velada única en ${businessName}! Un espacio perfecto para conectar con otros viajeros, buena energía y la mejor vibra de la Sierra Nevada.`,
    detallesAmbiente.length > 0 ? detallesAmbiente.join("\n") : "",
    textoSintetizado ? `📌 Info del evento: ${textoSintetizado}` : "",
    "🍹 Servicio de barra y cocina disponible. ¡Te esperamos!",
  ]
    .filter(Boolean)
    .join("\n\n");

  // 4.5 Detectar si es recurrente / periódico ("todos los jueves", "cada día", etc.)
  let esRecurrente = false;
  let diasRecurrentes: number[] = [];

  if (/\b(?:todos los dias|diario|diaria|cada dia)\b/.test(textoNorm)) {
    esRecurrente = true;
    diasRecurrentes = [1, 2, 3, 4, 5, 6, 0];
  } else {
    for (const [nombreDia, idx] of Object.entries(DIAS_SEMANA)) {
      const regexRec = new RegExp(`\\b(?:todos los|cada|los)\\s+${nombreDia}s?\\b`, "i");
      if (regexRec.test(textoNorm)) {
        esRecurrente = true;
        if (!diasRecurrentes.includes(idx)) diasRecurrentes.push(idx);
      }
    }
  }

  if (esRecurrente) {
    notasAsistente.push(
      `🔄 Frecuencia recurrente detectada (${
        diasRecurrentes.length === 7
          ? "Todos los días"
          : diasRecurrentes.map((d) => ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"][d]).join(", ")
      })`
    );
  }

  return {
    titulo,
    descripcion,
    categoria,
    precio,
    dateTime: fechaCalculada.dateTime,
    aliadoId,
    businessName,
    whatsapp,
    instagram,
    zonaSlug,
    destacado: false,
    textoOriginal: texto,
    notasAsistente,
    esRecurrente,
    diasRecurrentes,
  };
}
