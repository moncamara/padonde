import type { CategoriaEvento } from "@/lib/types";
import { COMISION_BOLETERIA, ROTACION_PORTADAS_CONFIG, type RotacionPortadasConfig } from "@/constants";

// ─── Fechas y Zona Horaria (Colombia UTC-5) ──────────────────────────────────
export const TIMEZONE_COLOMBIA = "America/Bogota";

/**
 * Obtiene la fecha YYYY-MM-DD en la zona horaria de Colombia.
 */
export function getFechaYMDColombia(date: Date = new Date()): string {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: TIMEZONE_COLOMBIA,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return formatter.format(date); // Retorna formato ISO YYYY-MM-DD
}

/**
 * Lista de meses abreviados deterministas en español
 */
export const MESES_ES_CORTO = [
  "ene", "feb", "mar", "abr", "may", "jun",
  "jul", "ago", "sep", "oct", "nov", "dic"
];

/**
 * Formatea una fecha de forma 100% determinista sin depender de variaciones de ICU
 * entre Node.js (SSR) y diferentes navegadores (Chrome/Safari), eliminando errores de hidratación.
 * Ejemplo: "14 oct" o "14 oct 2026"
 */
export function formatearFechaCortaDeterminista(
  dateOrIso: Date | string | number | null | undefined,
  incluirAnio = false
): string {
  if (!dateOrIso) return "";
  let d: Date;
  if (typeof dateOrIso === "number") {
    d = new Date(dateOrIso);
  } else if (typeof dateOrIso === "string") {
    d = new Date(dateOrIso);
  } else {
    d = dateOrIso;
  }
  if (isNaN(d.getTime())) return "";

  const ymd = getFechaYMDColombia(d);
  const [y, m, dayStr] = ymd.split("-");
  const mesIndex = parseInt(m, 10) - 1;
  const diaNum = parseInt(dayStr, 10);
  const mes = MESES_ES_CORTO[mesIndex] || m;

  return incluirAnio ? `${diaNum} ${mes} ${y}` : `${diaNum} ${mes}`;
}

/**
 * Convierte una fecha ISO a YYYY-MM-DD según la hora de Colombia.
 */
export function getFechaYMDDesdeISO(iso: string): string {
  return getFechaYMDColombia(new Date(iso));
}

/**
 * Formatea una fecha ISO para mostrar en la UI en hora colombiana.
 * Ejemplo: "mié, 14 oct"
 */
export function formatFecha(iso: string, locale = "es"): string {
  const intlLocale =
    locale === "de"
      ? "de-DE"
      : locale === "fr"
      ? "fr-FR"
      : locale === "en"
      ? "en-US"
      : "es-CO";

  return new Intl.DateTimeFormat(intlLocale, {
    timeZone: TIMEZONE_COLOMBIA,
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(new Date(iso));
}

/**
 * Formatea una hora ISO para mostrar en la UI en hora colombiana.
 * Ejemplo: "9:00 AM" o "8:30 PM"
 */
export function formatHora(iso: string): string {
  const d = new Date(iso);
  // Obtenemos hora y minutos exactos en Colombia
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: TIMEZONE_COLOMBIA,
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
  return formatter.format(d);
}

/**
 * Obtiene los minutos transcurridos desde la medianoche en hora de Colombia (0 a 1439).
 * Permite ordenar eventos de más temprano a más tarde en el día,
 * independientemente de la fecha calendario en que fue creado el registro.
 */
export function getMinutosDelDiaColombia(iso: string): number {
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return 0;
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: TIMEZONE_COLOMBIA,
      hour: "numeric",
      minute: "numeric",
      hourCycle: "h23",
    });

    const parts = formatter.formatToParts(d);
    let hour = 0;
    let minute = 0;
    for (const part of parts) {
      if (part.type === "hour") hour = parseInt(part.value, 10);
      if (part.type === "minute") minute = parseInt(part.value, 10);
    }
    if (hour === 24) hour = 0;

    return hour * 60 + minute;
  } catch {
    return 0;
  }
}

/** Retorna true si la fecha ISO corresponde al día de hoy en Colombia */
export function esHoy(iso: string, now = new Date()): boolean {
  return getFechaYMDDesdeISO(iso) === getFechaYMDColombia(now);
}

/** Retorna true si la fecha cae en fin de semana en Colombia (sábado o domingo) */
export function esFinDeSemana(iso: string): boolean {
  // Determinamos el día de la semana en Colombia
  const diaSemanaStr = new Intl.DateTimeFormat("en-US", {
    timeZone: TIMEZONE_COLOMBIA,
    weekday: "short",
  }).format(new Date(iso));
  return diaSemanaStr === "Sat" || diaSemanaStr === "Sun";
}

export type OpcionDiaFiltro = {
  id: string; // 'hoy', 'manana', o 'YYYY-MM-DD'
  label: string; // 'Hoy', 'Mañana', 'Jue 15', etc.
  ymd?: string; // YYYY-MM-DD si es un día específico
};

/**
 * Genera la lista de opciones para el selector de tiempo (próximos 7 días)
 * calculado en la hora real de Colombia.
 */
export function getOpcionesTiempoColombia(): OpcionDiaFiltro[] {
  const hoyColombia = new Date();
  const opciones: OpcionDiaFiltro[] = [];

  // 1. Hoy
  const ymdHoy = getFechaYMDColombia(hoyColombia);
  opciones.push({ id: "hoy", label: "Hoy", ymd: ymdHoy });

  // 2. Mañana
  const manana = new Date(hoyColombia);
  manana.setDate(manana.getDate() + 1);
  const ymdManana = getFechaYMDColombia(manana);
  opciones.push({ id: "manana", label: "Mañana", ymd: ymdManana });

  // 3. Los siguientes 5 días (con formato "Jue 16", "Vie 17", etc.)
  for (let i = 2; i <= 6; i++) {
    const diaSig = new Date(hoyColombia);
    diaSig.setDate(diaSig.getDate() + i);
    const ymd = getFechaYMDColombia(diaSig);

    // Formatear etiqueta corta: ej "jue 15"
    const label = new Intl.DateTimeFormat("es-CO", {
      timeZone: TIMEZONE_COLOMBIA,
      weekday: "short",
      day: "numeric",
    }).format(diaSig);

    // Capitalizar primera letra: "Jue 15"
    const labelCap = label.charAt(0).toUpperCase() + label.slice(1).replace(".", "");
    opciones.push({ id: ymd, label: labelCap, ymd });
  }

  // 4. Opción para explorar planes futuros más allá de los próximos 6 días
  opciones.push({ id: "proximos", label: "Más adelante" });

  return opciones;
}

/**
 * Convierte un string de datetime-local ("YYYY-MM-DDTHH:mm") ingresado por el usuario
 * a un string ISO 8601 explícitamente en la zona horaria de Colombia (UTC-5).
 * Esto evita desfases horarios cuando el servidor ejecuta en UTC (ej: Vercel).
 */
export function parseLocalColombiaAISO(dateTimeStr: string): string {
  if (!dateTimeStr) return new Date().toISOString();
  // Si ya contiene información de zona horaria (Z o offset +/-HH:mm), parsear directamente
  if (dateTimeStr.includes("Z") || /[+-]\d{2}:\d{2}$/.test(dateTimeStr)) {
    return new Date(dateTimeStr).toISOString();
  }
  // Si viene de input datetime-local tipo "2026-10-15T19:00"
  const [fechaYHora] = dateTimeStr.split(".");
  const conSegundos = fechaYHora.length === 16 ? `${fechaYHora}:00` : fechaYHora;
  return new Date(`${conSegundos}-05:00`).toISOString();
}

/**
 * Convierte un string ISO a formato 'YYYY-MM-DDTHH:mm' en hora local de Colombia (UTC-5),
 * listo para usarse como defaultValue o value en un <input type="datetime-local" />.
 */
export function isoADatetimeLocalColombia(isoStr?: string | null): string {
  if (!isoStr) return "";
  const d = new Date(isoStr);
  if (isNaN(d.getTime())) return "";

  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: TIMEZONE_COLOMBIA,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(d);

  const getPart = (type: string) => parts.find((p) => p.type === type)?.value || "";
  let hour = getPart("hour");
  if (hour === "24") hour = "00";
  return `${getPart("year")}-${getPart("month")}-${getPart("day")}T${hour}:${getPart("minute")}`;
}

// ─── Recurrencia y Experiencias Diarias ────────────────────────────────────────

export interface RecurrenciaConfig {
  esRecurrente: boolean;
  dias: number[]; // 0=Dom, 1=Lun, 2=Mar, 3=Mié, 4=Jue, 5=Vie, 6=Sáb
}

/**
 * Extrae la configuración de días de repetición embebida en la descripción o metadata.
 * Soporta formato canónico numérico (<!--recurrente:0,1,2,3,4,5,6-->),
 * metadata_hospedaje.horario y variantes descriptivas en lenguaje natural.
 */
export function extraerRecurrencia(
  descripcion?: string | null,
  metadata?: any,
  diasDirectos?: number[]
): RecurrenciaConfig {
  if (Array.isArray(diasDirectos) && diasDirectos.length > 0) {
    const diasValidos = diasDirectos.filter((n) => typeof n === "number" && n >= 0 && n <= 6);
    if (diasValidos.length > 0) {
      return { esRecurrente: true, dias: [...new Set(diasValidos)].sort() };
    }
  }

  const metaHorario = metadata?.horario;
  if (Array.isArray(metaHorario?.dias_recurrentes) && metaHorario.dias_recurrentes.length > 0) {
    const diasValidos = (metaHorario.dias_recurrentes as number[]).filter(
      (n) => typeof n === "number" && n >= 0 && n <= 6
    );
    if (diasValidos.length > 0) {
      return { esRecurrente: true, dias: [...new Set(diasValidos)].sort() };
    }
  }

  if (!descripcion) return { esRecurrente: false, dias: [] };

  // 1. Coincidencia con formato numérico canónico (ej: <!--recurrente:0,1,2,3,4,5,6-->)
  const matchNumerico = descripcion.match(/<!--\s*recurrente:([0-6,\s]+)-->/i);
  if (matchNumerico) {
    const dias = matchNumerico[1]
      .split(",")
      .map((n) => parseInt(n.trim(), 10))
      .filter((n) => !isNaN(n) && n >= 0 && n <= 6);
    if (dias.length > 0) {
      return { esRecurrente: true, dias: [...new Set(dias)].sort() };
    }
  }

  // 2. Coincidencia con comentarios de recurrencia en texto natural
  const matchTexto = descripcion.match(/<!--\s*recurrente:([\s\S]*?)-->/i);
  if (matchTexto) {
    const contenido = matchTexto[1].toLowerCase();
    const diasDetectados = new Set<number>();

    const todosLosDias =
      contenido.includes("lunes a domingo") ||
      contenido.includes("diario") ||
      contenido.includes("todos los dias") ||
      contenido.includes("todos los días");

    const finesDeSemana =
      contenido.includes("fines de semana") ||
      contenido.includes("fin de semana");

    if (todosLosDias) {
      [0, 1, 2, 3, 4, 5, 6].forEach((d) => diasDetectados.add(d));
    } else if (finesDeSemana) {
      [5, 6, 0].forEach((d) => diasDetectados.add(d));
    } else {
      if (contenido.includes("lunes")) diasDetectados.add(1);
      if (contenido.includes("martes")) diasDetectados.add(2);
      if (contenido.includes("miercoles") || contenido.includes("miércoles")) diasDetectados.add(3);
      if (contenido.includes("jueves")) diasDetectados.add(4);
      if (contenido.includes("viernes")) diasDetectados.add(5);
      if (contenido.includes("sabado") || contenido.includes("sábado")) diasDetectados.add(6);
      if (contenido.includes("domingo")) diasDetectados.add(0);
    }

    // Manejo de excepciones (ej: "excepto los domingos", "excepto domingos", "menos domingos")
    if (contenido.includes("excepto") || contenido.includes("menos")) {
      if (contenido.includes("domingo")) diasDetectados.delete(0);
      if (contenido.includes("lunes")) diasDetectados.delete(1);
      if (contenido.includes("martes")) diasDetectados.delete(2);
      if (contenido.includes("miercoles") || contenido.includes("miércoles")) diasDetectados.delete(3);
      if (contenido.includes("jueves")) diasDetectados.delete(4);
      if (contenido.includes("viernes")) diasDetectados.delete(5);
      if (contenido.includes("sabado") || contenido.includes("sábado")) diasDetectados.delete(6);
    }

    if (diasDetectados.size > 0) {
      return { esRecurrente: true, dias: Array.from(diasDetectados).sort() };
    }
  }

  return { esRecurrente: false, dias: [] };
}

/**
 * Limpia la descripción eliminando cualquier metadato técnico o comentario HTML.
 */
export function limpiarDescripcionRecurrencia(descripcion?: string | null): string {
  if (!descripcion) return "";
  return descripcion
    .replace(/<!--\s*recurrente:[\s\S]*?-->/gi, "")
    .replace(/<!--[\s\S]*?-->/g, "")
    .trim();
}

/**
 * Inyecta o actualiza la etiqueta de recurrencia en la descripción.
 */
export function inyectarRecurrencia(descripcion: string, dias: number[]): string {
  const limpia = limpiarDescripcionRecurrencia(descripcion);
  if (!dias || dias.length === 0) return limpia;
  return `${limpia}\n\n<!--recurrente:${dias.join(",")}-->`.trim();
}

/**
 * Formatea los días de la semana en un texto amigable y legible para humanos.
 * Ej: "Todos los días", "Lun a Vie", "Vie, Sáb y Dom", "Fines de semana".
 */
export function formatearDiasRecurrencia(dias: number[], locale = "es"): string {
  if (!dias || dias.length === 0) return "";
  if (dias.length === 7) {
    if (locale === "de") return "Jeden Tag";
    if (locale === "fr") return "Tous les jours";
    if (locale === "en") return "Every day";
    return "Todos los días";
  }

  const diasSet = new Set(dias);
  if (dias.length === 5 && [1, 2, 3, 4, 5].every((d) => diasSet.has(d))) {
    if (locale === "de") return "Mo bis Fr";
    if (locale === "fr") return "Lun au Ven";
    if (locale === "en") return "Mon to Fri";
    return "Lun a Vie";
  }
  if (dias.length === 6 && [1, 2, 3, 4, 5, 6].every((d) => diasSet.has(d))) {
    if (locale === "de") return "Mo bis Sa";
    if (locale === "fr") return "Lun au Sam";
    if (locale === "en") return "Mon to Sat";
    return "Lun a Sáb";
  }
  if (dias.length === 3 && [5, 6, 0].every((d) => diasSet.has(d))) {
    if (locale === "de") return "Fr, Sa & So";
    if (locale === "fr") return "Ven, Sam et Dim";
    if (locale === "en") return "Fri, Sat & Sun";
    return "Vie, Sáb y Dom";
  }
  if (dias.length === 2 && [6, 0].every((d) => diasSet.has(d))) {
    if (locale === "de") return "Wochenenden";
    if (locale === "fr") return "Week-ends";
    if (locale === "en") return "Weekends";
    return "Fines de semana";
  }

  const nombresPorIdioma: Record<string, Record<number, string>> = {
    es: { 1: "Lun", 2: "Mar", 3: "Mié", 4: "Jue", 5: "Vie", 6: "Sáb", 0: "Dom" },
    en: { 1: "Mon", 2: "Tue", 3: "Wed", 4: "Thu", 5: "Fri", 6: "Sat", 0: "Sun" },
    de: { 1: "Mo", 2: "Di", 3: "Mi", 4: "Do", 5: "Fr", 6: "Sa", 0: "So" },
    fr: { 1: "Lun", 2: "Mar", 3: "Mer", 4: "Jeu", 5: "Ven", 6: "Sam", 0: "Dim" },
  };

  const nombresCortos = nombresPorIdioma[locale] || nombresPorIdioma.es;
  const ordenados = [...dias].sort((a, b) => (a === 0 ? 7 : a) - (b === 0 ? 7 : b));
  return ordenados.map((d) => nombresCortos[d]).join(", ");
}

/**
 * Formatea una hora en string "HH:mm" (ej: "08:00", "23:30") a formato 12h "8:00 AM" / "11:30 PM".
 */
export function formatHoraDesdeHHMM(hhmm?: string | null): string {
  if (!hhmm) return "";
  const partes = hhmm.trim().split(":");
  if (partes.length < 2) return hhmm;
  let h = parseInt(partes[0], 10);
  const m = partes[1].slice(0, 2);
  if (isNaN(h)) return hhmm;
  const ampm = h >= 12 ? "PM" : "AM";
  if (h === 0) h = 12;
  else if (h > 12) h -= 12;
  return `${h}:${m} ${ampm}`;
}

/**
 * Genera la etiqueta de fecha y hora para mostrar en tarjetas y cabeceras.
 * Si es recurrente: "🔄 Todos los días · 8:00 AM – 11:00 PM"
 * Si es puntual: "jue, 15 oct · 7:00 PM" / "Thu, Oct 15 · 7:00 PM"
 */
export function getEtiquetaHorario(
  evento: {
    fecha_inicio: string;
    fecha_fin?: string | null;
    descripcion?: string | null;
    tipo?: string | null;
    metadata_hospedaje?: any;
    dias_recurrentes?: number[];
  },
  locale = "es"
): string {
  // Para hospedajes y alojamientos, no mostramos fecha puntual de creación, sino disponibilidad
  if (evento.tipo === "hospedaje") {
    const labels: Record<string, string> = {
      es: "Reserva directa · Todo el año",
      en: "Direct booking · Year-round",
      fr: "Réservation directe · Toute l'année",
      de: "Direktbuchung · Ganzjährig",
    };
    return `🏡 ${labels[locale] || labels.es}`;
  }

  const rec = extraerRecurrencia(evento.descripcion, evento.metadata_hospedaje, evento.dias_recurrentes);
  const horario = evento.metadata_hospedaje?.horario;

  if (rec.esRecurrente) {
    const diasTexto = formatearDiasRecurrencia(rec.dias, locale);
    if (horario?.hora_inicio && horario?.hora_fin) {
      return `🔄 ${diasTexto} · ${formatHoraDesdeHHMM(horario.hora_inicio)} – ${formatHoraDesdeHHMM(horario.hora_fin)}`;
    }
    const hora = formatHora(evento.fecha_inicio);
    return `🔄 ${diasTexto} · ${hora}`;
  }

  // Si es un evento de varios días (rango continuo con fecha_fin en otro día)
  const ymdInicio = getFechaYMDDesdeISO(evento.fecha_inicio);
  const ymdFin = evento.fecha_fin ? getFechaYMDDesdeISO(evento.fecha_fin) : null;
  if (ymdFin && ymdFin > ymdInicio && evento.fecha_fin) {
    return `${formatFecha(evento.fecha_inicio, locale)} — ${formatFecha(evento.fecha_fin, locale)}`;
  }

  const hora = formatHora(evento.fecha_inicio);
  return `${formatFecha(evento.fecha_inicio, locale)} · ${hora}`;
}

/**
 * Obtiene el día de la semana (0=Dom, 1=Lun, ..., 6=Sáb) evaluado en Colombia.
 */
export function getDayOfWeekColombia(dateStr: string): number {
  const d = new Date(dateStr.includes("T") ? dateStr : `${dateStr}T12:00:00-05:00`);
  const dayStr = new Intl.DateTimeFormat("en-US", {
    timeZone: TIMEZONE_COLOMBIA,
    weekday: "short",
  }).format(d);
  const map: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  return map[dayStr] ?? 0;
}

/**
 * Lógica unificada de vigencia temporal de eventos (!eventoHaCaducado).
 * Evaluada estrictamente en la zona horaria America/Bogota (UTC-5):
 * - tipo === 'hospedaje': siempre vigente (no caduca por fecha de evento).
 * - es_recurrente === true:
 *    * Con fecha_limite_vigencia (en metadata_hospedaje.horario o campo nativo):
 *      es vigente si fecha_limite_vigencia >= hoyYMDColombia.
 *    * Sin límite de vigencia: vigente permanentemente.
 * - es_recurrente === false (evento puntual):
 *    * Con fecha_fin: es vigente si fecha_fin >= nowColombiaIso (o timestamp >= nowColombia.getTime()).
 *    * Sin fecha_fin: es vigente si el día calendario de fecha_inicio >= hoyYMDColombia.
 */
export function esEventoVigente(
  evento: {
    tipo?: string | null;
    fecha_inicio: string;
    fecha_fin?: string | null;
    descripcion?: string | null;
    metadata_hospedaje?: any;
    dias_recurrentes?: number[];
    es_recurrente?: boolean;
    fecha_limite_vigencia?: string | null;
  },
  nowColombia: Date = new Date()
): boolean {
  // 1. Si tipo === 'hospedaje': siempre es vigente (no caduca por fecha de evento)
  if (evento.tipo === "hospedaje") {
    return true;
  }

  const hoyYMDColombia = getFechaYMDColombia(nowColombia);
  const nowColombiaIso = nowColombia.toISOString();

  // 2. Extraer recurrencia y evaluar vigencia
  const rec = extraerRecurrencia(
    evento.descripcion,
    evento.metadata_hospedaje,
    evento.dias_recurrentes
  );
  const esRecurrente = Boolean(
    evento.es_recurrente ||
    rec.esRecurrente ||
    evento.metadata_hospedaje?.horario?.es_recurrente
  );

  if (esRecurrente) {
    const fechaLimite =
      evento.fecha_limite_vigencia ||
      evento.metadata_hospedaje?.horario?.fecha_limite_vigencia ||
      null;

    if (fechaLimite) {
      return fechaLimite >= hoyYMDColombia;
    }
    // Si no tiene límite de vigencia: es vigente de forma permanente
    return true;
  }

  // 3. Si es_recurrente === false (evento puntual):
  if (evento.fecha_fin) {
    const timeFin = new Date(evento.fecha_fin).getTime();
    if (!isNaN(timeFin)) {
      return timeFin >= nowColombia.getTime();
    }
    return evento.fecha_fin >= nowColombiaIso;
  }

  // Si no tiene fecha_fin: es vigente si el día calendario de fecha_inicio es igual o posterior al día actual en Colombia
  const ymdInicio = getFechaYMDDesdeISO(evento.fecha_inicio);
  return ymdInicio >= hoyYMDColombia;
}

/**
 * Verifica si la fecha de un evento coincide con el filtro de tiempo seleccionado.
 * Soporta eventos puntuales, rangos continuos y experiencias recurrentes por días de semana.
 * Todos los cálculos se evalúan estrictamente en el huso horario de Colombia (UTC-5).
 */
export function eventoCoincideConFiltroTiempo(
  fechaInicioIso: string,
  filtro: string,
  now: Date = new Date(),
  fechaFinIso?: string | null,
  descripcion?: string | null,
  tipo?: string | null,
  metadata?: any,
  diasRecurrentesDirectos?: number[],
  esRecurrenteDirecto?: boolean
): boolean {
  // Los hospedajes y alojamientos tienen disponibilidad permanente (todo el año).
  // Coinciden con cualquier día del calendario (hoy, mañana, días específicos, todos).
  if (tipo === "hospedaje") {
    // Si se consulta "proximos" (agenda lejana futura), no se muestran como eventos futuros generales
    if (filtro === "proximos") return false;
    return true;
  }

  const rec = extraerRecurrencia(descripcion, metadata, diasRecurrentesDirectos);
  const esRecurrente = Boolean(
    esRecurrenteDirecto ?? (rec.esRecurrente || metadata?.horario?.es_recurrente)
  );
  const ymdInicio = getFechaYMDDesdeISO(fechaInicioIso);
  const ymdFin = fechaFinIso ? getFechaYMDDesdeISO(fechaFinIso) : null;
  const hoyYMD = getFechaYMDColombia(now);

  // Fecha límite de vigencia de recurrencia (si fue explícitamente configurada)
  // NOTA CRÍTICA: En eventos recurrentes, un ymdFin igual o contiguo a ymdInicio (ymdFin <= ymdInicio + 1)
  // corresponde al horario de cierre de la primera jornada (ej: bar de 8pm a 2am),
  // y NUNCA a una caducidad de la experiencia. Solo un límite explícito o fecha a futuro lejano actúa como fin de vigencia.
  const metaHorario = metadata?.horario;
  const fechaLimiteVigencia =
    metaHorario?.fecha_limite_vigencia ||
    (esRecurrente && ymdFin && ymdFin > ymdInicio + 1 ? ymdFin : null);

  // Caso especial: Planes futuros más allá de la ventana inmediata de 7 días (>= hoy + 7 días)
  if (filtro === "proximos") {
    // La ventana inmediata actual de la cartelera cubre hoy (día 0) hasta hoy + 6 días (7 días en total).
    // Anclamos al mediodía de Colombia para total inmunidad a variaciones horarias o medianoche (UTC-5).
    const fechaNoon = new Date(`${hoyYMD}T12:00:00-05:00`);
    fechaNoon.setDate(fechaNoon.getDate() + 7);
    const limite7DiasYMD = getFechaYMDColombia(fechaNoon);

    // 1. Las actividades recurrentes semanales/diarias ya se muestran en la ventana inmediata de la cartelera.
    // Solo aparecen en "Próximamente" si su fecha ancla inicial aún no ha comenzado y arranca >= hoy + 7 días
    if (esRecurrente) {
      if (fechaLimiteVigencia && fechaLimiteVigencia < hoyYMD) return false;
      if (!fechaLimiteVigencia && ymdFin && ymdFin < hoyYMD) return false;
      return ymdInicio >= limite7DiasYMD;
    }

    // 2. Eventos no recurrentes (es_recurrente === false):
    // Inician en la fecha posterior a la ventana inmediata actual (>= hoy + 7 días)
    if (ymdInicio >= limite7DiasYMD) {
      return true;
    }

    // Eventos especiales de varios días (no recurrentes) vigentes en el futuro que se extienden más allá de la ventana inmediata
    if (ymdFin && ymdFin >= limite7DiasYMD && ymdFin >= hoyYMD) {
      return true;
    }

    return false;
  }

  if (filtro === "todos") {
    if (esRecurrente) {
      // 1. Si cuenta con fecha límite de vigencia explícita y ya expiró, no mostrar
      if (fechaLimiteVigencia && fechaLimiteVigencia < hoyYMD) {
        return false;
      }
      // 2. Si NO tiene fecha límite de vigencia pero su fecha_fin original en BD quedó en el pasado anterior a hoy, descartar
      if (!fechaLimiteVigencia && ymdFin && ymdFin < hoyYMD) {
        return false;
      }
      return true;
    }
    return ymdFin ? ymdFin >= hoyYMD : ymdInicio >= hoyYMD;
  }

  if (filtro === "fin_de_semana") {
    // Sábado y Domingo del fin de semana actual o más próximo evaluado en Colombia (UTC-5)
    const ymdHoy = getFechaYMDColombia(now);
    const diaHoy = getDayOfWeekColombia(ymdHoy); // 0=Dom, 1=Lun, ..., 6=Sáb

    let ymdSabado: string;
    let ymdDomingo: string;

    if (diaHoy === 0) {
      // Hoy es domingo (estamos en el fin de semana actual)
      const sabado = new Date(now);
      sabado.setDate(sabado.getDate() - 1);
      ymdSabado = getFechaYMDColombia(sabado);
      ymdDomingo = ymdHoy;
    } else if (diaHoy === 6) {
      // Hoy es sábado (estamos en el fin de semana actual)
      const domingo = new Date(now);
      domingo.setDate(domingo.getDate() + 1);
      ymdSabado = ymdHoy;
      ymdDomingo = getFechaYMDColombia(domingo);
    } else {
      // Lunes a Viernes: próximo fin de semana
      const diasHastaSabado = 6 - diaHoy;
      const sabado = new Date(now);
      sabado.setDate(sabado.getDate() + diasHastaSabado);
      const domingo = new Date(sabado);
      domingo.setDate(domingo.getDate() + 1);
      ymdSabado = getFechaYMDColombia(sabado);
      ymdDomingo = getFechaYMDColombia(domingo);
    }

    return (
      eventoCoincideConFiltroTiempo(
        fechaInicioIso,
        ymdSabado,
        now,
        fechaFinIso,
        descripcion,
        tipo,
        metadata,
        diasRecurrentesDirectos,
        esRecurrenteDirecto
      ) ||
      eventoCoincideConFiltroTiempo(
        fechaInicioIso,
        ymdDomingo,
        now,
        fechaFinIso,
        descripcion,
        tipo,
        metadata,
        diasRecurrentesDirectos,
        esRecurrenteDirecto
      )
    );
  }

  let ymdTarget = filtro;
  if (filtro === "hoy") {
    ymdTarget = getFechaYMDColombia(now);
  } else if (filtro === "manana") {
    const manana = new Date(now);
    manana.setDate(manana.getDate() + 1);
    ymdTarget = getFechaYMDColombia(manana);
  }

  // Caso 1: Evento recurrente (días específicos de la semana / permanente)
  if (rec.esRecurrente) {
    // 1. Si cuenta con fecha límite de vigencia explícita y ya expiró, no mostrar
    if (fechaLimiteVigencia && ymdTarget > fechaLimiteVigencia) return false;

    // 2. Si NO tiene fecha límite de vigencia pero su fecha_fin original en base de datos
    // quedó registrada con una fecha en el pasado anterior a hoy (por ejemplo un evento cerrado
    // antes de la migración), no lo interpretes como infinito: respeta esa caducidad y descártalo.
    if (!fechaLimiteVigencia && ymdFin && ymdFin < hoyYMD) {
      return false;
    }

    // 3. Debe ser igual o posterior a la fecha de inicio / ancla en Colombia
    if (ymdTarget < ymdInicio) return false;

    // 4. Coincide si el día de la semana coincide con los días programados en dias_recurrentes
    const diaSemana = getDayOfWeekColombia(ymdTarget);
    return rec.dias.includes(diaSemana);
  }

  // Caso 2: Rango continuo de fechas (ej: festival o curso de varios días consecutivos)
  if (ymdFin && ymdFin > ymdInicio) {
    return ymdTarget >= ymdInicio && ymdTarget <= ymdFin;
  }

  // Caso 3: Evento puntual de 1 solo día
  return ymdInicio === ymdTarget;
}

// ─── Precios ──────────────────────────────────────────────────────────────────

/**
 * Formatea un precio para mostrar en la UI.
 * Si precio es null o 0, retorna "Consultar" (precio no definido o a consultar).
 */
export function formatPrecio(
  precio: number | null,
  moneda: "COP" | "USD" = "COP"
): string {
  if (precio === null || precio === 0) return "Consultar";

  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: moneda,
    maximumFractionDigits: 0,
  }).format(precio);
}

/**
 * Calcula el precio con comisión de plataforma para boletería.
 * La comisión se suma al precio base y la absorbe el comprador.
 */
export function precioConComision(precioBase: number): number {
  return Math.ceil(precioBase * (1 + COMISION_BOLETERIA));
}

// ─── Texto ────────────────────────────────────────────────────────────────────

/** Trunca un texto a N caracteres y agrega "..." si fue truncado */
export function truncar(texto: string, maxChars: number): string {
  if (texto.length <= maxChars) return texto;
  return texto.slice(0, maxChars).trimEnd() + "…";
}

/** Genera el mensaje de WhatsApp predefinido al contactar un negocio */
export function mensajeWhatsApp(
  nombreEvento: string,
  _categoria?: CategoriaEvento
): string {
  return `Hola! Vi tu publicación "${nombreEvento}" en PaDónde. [Reserva PaDónde 🌿] Me interesa saber disponibilidad y cómo llegar.`;
}

// ─── Demografía y Origen de Turistas (QR) ────────────────────────────────────

export interface OrigenTurista {
  esExtranjero: boolean;
  etiqueta: string;
  pais: string;
  flag: string;
}

/**
 * Deduce si un escaneo QR proviene de un turista extranjero o nacional
 * analizando el idioma y región del sistema de su celular (ej: en-US, fr-FR, es-CO).
 */
export function parseOrigenTurista(rawLang?: string | null): OrigenTurista {
  if (!rawLang || !rawLang.trim()) {
    return { esExtranjero: false, etiqueta: "🇨🇴 Nacional", pais: "Colombia", flag: "🇨🇴" };
  }
  const clean = rawLang.split(",")[0].trim().toLowerCase();

  if (clean.startsWith("es-co")) {
    return { esExtranjero: false, etiqueta: "🇨🇴 Nacional", pais: "Colombia", flag: "🇨🇴" };
  }
  if (clean.startsWith("es-")) {
    return { esExtranjero: true, etiqueta: "🌎 Extranjero", pais: "Hispanoamérica / España", flag: "🌎" };
  }
  if (clean === "es") {
    return { esExtranjero: false, etiqueta: "🇨🇴 Nacional / Hispano", pais: "Colombia / Latam", flag: "🇨🇴" };
  }
  if (clean.startsWith("en")) {
    return { esExtranjero: true, etiqueta: "🇺🇸 Extranjero", pais: "Inglés (EE.UU. / UK)", flag: "🇺🇸" };
  }
  if (clean.startsWith("fr")) {
    return { esExtranjero: true, etiqueta: "🇫🇷 Extranjero", pais: "Francés (Francia / Canadá)", flag: "🇫🇷" };
  }
  if (clean.startsWith("de")) {
    return { esExtranjero: true, etiqueta: "🇩🇪 Extranjero", pais: "Alemán (Alemania / Suiza)", flag: "🇩🇪" };
  }
  if (clean.startsWith("it")) {
    return { esExtranjero: true, etiqueta: "🇮🇹 Extranjero", pais: "Italiano", flag: "🇮🇹" };
  }
  if (clean.startsWith("nl")) {
    return { esExtranjero: true, etiqueta: "🇳🇱 Extranjero", pais: "Holandés", flag: "🇳🇱" };
  }
  if (clean.startsWith("pt")) {
    return { esExtranjero: true, etiqueta: "🇧🇷 Extranjero", pais: "Portugués", flag: "🇧🇷" };
  }
  if (clean.startsWith("he") || clean.startsWith("iw")) {
    return { esExtranjero: true, etiqueta: "🇮🇱 Extranjero", pais: "Israel", flag: "🇮🇱" };
  }

  return { esExtranjero: true, etiqueta: "🌍 Extranjero", pais: clean.toUpperCase(), flag: "🌍" };
}

/**
 * Convierte cualquier enlace de Google Maps (con Place ID, CID o FIDs 0x...:0x...)
 * en la URL oficial directa para escribir una reseña con 5 estrellas:
 * https://search.google.com/local/writereview?placeid=...
 */
export function extraerGoogleReviewUrl(inputUrl?: string | null): string | null {
  if (!inputUrl) return null;
  const raw = inputUrl.trim();
  if (!raw) return null;

  // 1. Si ya es una URL directa de reseñas:
  if (raw.includes("search.google.com/local/writereview")) {
    return raw;
  }

  // 2. Si es un enlace corto g.page:
  if (raw.includes("g.page/r/")) {
    return raw.endsWith("/review") ? raw : `${raw.replace(/\/+$/, "")}/review`;
  }

  // 3. Si contiene placeid o place_id explícito:
  const matchPlaceId = raw.match(/[?&](?:placeid|place_id)=(ChIJ[a-zA-Z0-9_-]+)/i);
  if (matchPlaceId && matchPlaceId[1]) {
    return `https://search.google.com/local/writereview?placeid=${matchPlaceId[1]}`;
  }

  // 4. Si contiene un ChIJ suelto en el path:
  const matchChIJ = raw.match(/!(?:1s|3m[0-9]+!)?(ChIJ[a-zA-Z0-9_-]{20,35})/);
  if (matchChIJ && matchChIJ[1]) {
    return `https://search.google.com/local/writereview?placeid=${matchChIJ[1]}`;
  }

  // 5. Si contiene un CID numérico (?cid=123456789):
  const matchCid = raw.match(/[?&]cid=([0-9]+)/i);
  if (matchCid && matchCid[1]) {
    return `https://search.google.com/local/writereview?cid=${matchCid[1]}`;
  }

  // 6. Si contiene FIDs hexadecimales de Google Maps (!1s0x...:0x...):
  const matchFid = raw.match(/0x([0-9a-fA-F]+):0x([0-9a-fA-F]+)/);
  if (matchFid && matchFid[1] && matchFid[2]) {
    // Caso 6a: Si el primer FID es 0 o abreviado (ej: 0x0:0x21d1e000f0d3ca79), el segundo FID es el CID exacto
    if (matchFid[1] === "0" || matchFid[1].length < 8) {
      try {
        const cid = BigInt(`0x${matchFid[2]}`).toString();
        if (cid && cid !== "0") {
          return `https://search.google.com/local/writereview?cid=${cid}`;
        }
      } catch {
        // Fallback
      }
    }

    try {
      // Conversión matemática exacta de FIDs de Google Maps a Place ID oficial (ChIJ...)
      const bytes = new Uint8Array(20);
      bytes[0] = 0x0a;
      bytes[1] = 0x12;
      bytes[2] = 0x09;
      const h1 = matchFid[1].padStart(16, "0");
      for (let i = 0; i < 8; i++) {
        bytes[3 + i] = parseInt(h1.substring(14 - i * 2, 16 - i * 2), 16);
      }
      bytes[11] = 0x11;
      const h2 = matchFid[2].padStart(16, "0");
      for (let i = 0; i < 8; i++) {
        bytes[12 + i] = parseInt(h2.substring(14 - i * 2, 16 - i * 2), 16);
      }
      let binary = "";
      for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      const placeId = btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
      if (placeId && placeId.startsWith("ChIJ")) {
        return `https://search.google.com/local/writereview?placeid=${placeId}`;
      }
    } catch {
      // Fallback a CID decimal
      try {
        const cid = BigInt(`0x${matchFid[2]}`).toString();
        if (cid && cid !== "0") {
          return `https://search.google.com/local/writereview?cid=${cid}`;
        }
      } catch {
        // Ignorar
      }
    }
  }


  return null;
}

/**
 * Proyecta la fecha de un evento hacia la próxima ocurrencia semanal (UTC-5 Colombia).
 * - Si el evento ya ocurrió o es hoy, busca el próximo día coincidente (1 a 7 días adelante).
 * - Si el evento ya está programado en el futuro, le suma 7 días para proyectar la semana siguiente.
 * Preserva exactamente la hora de inicio y la duración original si tenía fecha_fin.
 */
export function proyectarProximaFechaEvento(
  fechaInicioIso: string,
  fechaFinIso?: string | null,
  descripcion?: string | null
): { fechaInicio: string; fechaFin: string | null } {
  try {
    const ahora = new Date();
    const hoyYMD = getFechaYMDColombia(ahora);
    const ymdInicio = getFechaYMDDesdeISO(fechaInicioIso);

    // Extraer hora y minutos originales en formato HH:mm en Colombia
    const fechaInicioObj = new Date(fechaInicioIso);
    const horaFormateador = new Intl.DateTimeFormat("en-GB", {
      timeZone: TIMEZONE_COLOMBIA,
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
    const horaStr = horaFormateador.format(fechaInicioObj);

    let targetYmd = "";

    // 1. Si el evento original es futuro respecto a hoy, avanzar exactamente 7 días
    if (ymdInicio > hoyYMD) {
      const [year, month, day] = ymdInicio.split("-").map(Number);
      const d = new Date(Date.UTC(year, month - 1, day + 7, 12, 0, 0));
      targetYmd = d.toISOString().slice(0, 10);
    } else {
      // 2. Si el evento ya pasó o es hoy, buscar el próximo día recurrente
      const rec = extraerRecurrencia(descripcion);
      const diaSemanaOriginal = getDayOfWeekColombia(ymdInicio);
      const diasObjetivo = rec.esRecurrente && rec.dias.length > 0 ? rec.dias : [diaSemanaOriginal];

      // Probar días hacia adelante desde mañana (1 a 7 días)
      for (let offset = 1; offset <= 7; offset++) {
        const candidate = new Date(ahora);
        candidate.setDate(candidate.getDate() + offset);
        const candidateYMD = getFechaYMDColombia(candidate);
        const candidateDay = getDayOfWeekColombia(candidateYMD);

        if (diasObjetivo.includes(candidateDay)) {
          targetYmd = candidateYMD;
          break;
        }
      }

      if (!targetYmd) {
        // Fallback: +7 días desde hoy
        const fallback = new Date(ahora);
        fallback.setDate(fallback.getDate() + 7);
        targetYmd = getFechaYMDColombia(fallback);
      }
    }

    const nuevaFechaInicio = parseLocalColombiaAISO(`${targetYmd}T${horaStr}`);

    let nuevaFechaFin: string | null = null;
    if (fechaFinIso) {
      const diffMs = new Date(fechaFinIso).getTime() - fechaInicioObj.getTime();
      if (diffMs > 0 && diffMs < 7 * 24 * 60 * 60 * 1000) {
        nuevaFechaFin = new Date(new Date(nuevaFechaInicio).getTime() + diffMs).toISOString();
      }
    }

    return {
      fechaInicio: nuevaFechaInicio,
      fechaFin: nuevaFechaFin,
    };
  } catch (err) {
    console.warn("Aviso en proyectarProximaFechaEvento:", err);
    return {
      fechaInicio: new Date().toISOString(),
      fechaFin: null,
    };
  }
}

/**
 * Determina la foto de portada a renderizar para una tarjeta de evento o ficha.
 * - Si ROTACION_PORTADAS_CONFIG.activa === false: retorna de inmediato la imagen principal fija (evento.imagen_url).
 * - Si ROTACION_PORTADAS_CONFIG.activa === true: rota deterministamente entre la imagen principal y las fotos
 *   de su galería según el intervalo de días configurado.
 */
export function obtenerFotoPortada(
  evento: {
    id: string;
    tipo?: string | null;
    categorias?: string[] | null;
    imagen_url: string | null;
    metadata_hospedaje?: any;
    galeria_fotos?: string[];
  },
  config: RotacionPortadasConfig = ROTACION_PORTADAS_CONFIG
): string | null {
  if (!evento.imagen_url) return null;

  // 1. Si la rotación está inactiva (por defecto en producción), retornar imagen fija
  if (!config.activa) {
    return evento.imagen_url;
  }

  // 2. No rotar hospedajes a menos que se configure explícitamente
  const esHospedaje =
    evento.tipo === "hospedaje" ||
    (evento.categorias?.length ? evento.categorias.includes("hospedaje") : false);

  if (esHospedaje && !config.incluirHospedajes) {
    return evento.imagen_url;
  }

  // 3. Obtener galería completa de fotos
  const todasLasFotos = [
    evento.imagen_url,
    ...(evento.metadata_hospedaje?.galeria_fotos || (evento as any)?.galeria_fotos || []),
  ].filter(Boolean) as string[];

  if (todasLasFotos.length <= 1) {
    return evento.imagen_url;
  }

  // 4. Calcular índice según el ciclo de días configurado
  const intervalo = Math.max(1, config.intervaloDias || 1);
  const diaDelAno = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24)
  );
  const cicloRotacion = Math.floor(diaDelAno / intervalo);
  const seed = evento.id.charCodeAt(0) || 0;
  const indiceFoto = (cicloRotacion + seed) % todasLasFotos.length;

  return todasLasFotos[indiceFoto] || evento.imagen_url;
}


