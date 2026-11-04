/**
 * Parser y Procesador Inteligente de Exportaciones CSV de Google Analytics 4 (GA4)
 * Diseñado específicamente para el informe "Páginas y Pantallas" de PaDónde.
 */

import type { MetricaHistoricaAliado } from "./constants/vistasAnalyticsHistoricas";

export interface ResultadoProcesamientoGA4 {
  exito: boolean;
  error?: string;
  fechaInicio?: string;
  fechaFin?: string;
  totalVistasCSV: number;
  totalUsuariosCSV: number;
  totalFilasProcesadas: number;
  aliadosCoincidentes: number;
  metricasPorAliado: Record<string, MetricaHistoricaAliado>;
  resumenAliados: {
    nombre: string;
    vistas: number;
    usuariosUnicos: number;
    idiomas: string[];
    paginasContadas: number;
  }[];
  paginasNoAsignadas: {
    titulo: string;
    vistas: number;
    usuarios: number;
  }[];
}

// Detectar idioma a partir de vocabulario y patrones de títulos de PaDónde
function detectarIdiomaTitulo(titulo: string): string {
  const t = titulo.toLowerCase();
  if (
    t.includes("dschungel") ||
    t.includes("urwald") ||
    t.includes("frühstück") ||
    t.includes("handgemachter") ||
    t.includes("vogelbeobachtung") ||
    t.includes("kakaowald") ||
    t.includes("was kann man") ||
    t.includes("kalender") ||
    t.includes("🇨🇭") ||
    t.includes("🇩🇪")
  ) {
    return "Alemán";
  }
  if (
    t.includes("que faire") ||
    t.includes("agenda touristique") ||
    t.includes("atelier") ||
    t.includes("fait main") ||
    t.includes("soirée") ||
    t.includes("saveurs et détente") ||
    t.includes("journée") ||
    t.includes("chocolat") ||
    t.includes("mercredis")
  ) {
    return "Francés";
  }
  if (
    t.includes("things to do") ||
    t.includes("live events") ||
    t.includes("workshop") ||
    t.includes("cocoa") ||
    t.includes("breakfast") ||
    t.includes("where to") ||
    t.includes("sunset session") ||
    t.includes("open wardrobe") ||
    t.includes("daily special") ||
    t.includes("sacred encounter")
  ) {
    return "Inglés";
  }
  return "Español";
}

// Función auxiliar para sanitizar cualquier texto antes de comparar (inmune a tildes, diacríticos Unicode NFD y mayúsculas)
export function sanitizar(texto: string): string {
  if (!texto) return "";
  return texto
    .normalize("NFD")                     // Descompone caracteres con tildes (ej: Ti\u0301tulo -> T + i + \u0301 + tulo)
    .replace(/[\u0300-\u036f]/g, "")     // Remueve todas las tildes y diacríticos
    .toLowerCase()
    .trim();
}

// Extraer el nombre de un aliado de un título de página de PaDónde
function extraerCandidatoNegocio(titulo: string): string {
  // Patrón común: "Evento — Nombre Negocio (Zona) | PaDónde"
  const partesGuionLargo = titulo.split("—");
  if (partesGuionLargo.length >= 2) {
    // Tomar la última parte antes de "| PaDónde"
    const ultimaParte = partesGuionLargo[partesGuionLargo.length - 1];
    const sinPipe = ultimaParte.split("|")[0].trim();
    // Quitar la zona entre paréntesis: "Restaurante Brisas (Mendihuaca)" -> "Restaurante Brisas"
    const sinZona = sinPipe.replace(/\s*\([^)]*\)\s*$/, "").trim();
    if (sinZona) return sinZona;
  }

  // Patrón con guion normal " - "
  const partesGuionCorto = titulo.split(" - ");
  if (partesGuionCorto.length >= 2) {
    const ultima = partesGuionCorto[partesGuionCorto.length - 1].split("|")[0].trim();
    const limpia = ultima.replace(/\s*\([^)]*\)\s*$/, "").trim();
    if (limpia) return limpia;
  }

  return titulo.split("|")[0].trim();
}

// Parsear una línea CSV respetando comillas y delimitadores (coma o punto y coma)
function parsearLineaCSV(linea: string, delimitador: string = ","): string[] {
  const columnas: string[] = [];
  let valorActual = "";
  let dentroDeComillas = false;

  for (let i = 0; i < linea.length; i++) {
    const char = linea[i];

    if (char === '"') {
      if (dentroDeComillas && linea[i + 1] === '"') {
        valorActual += '"';
        i++; // Saltar comilla escapada
      } else {
        dentroDeComillas = !dentroDeComillas;
      }
    } else if (char === delimitador && !dentroDeComillas) {
      columnas.push(valorActual.trim());
      valorActual = "";
    } else {
      valorActual += char;
    }
  }
  columnas.push(valorActual.trim());
  return columnas;
}

export function procesarCSVAnalytics(
  csvContenido: string,
  negociosRegistrados: { id: string; nombre: string }[]
): ResultadoProcesamientoGA4 {
  if (!csvContenido || typeof csvContenido !== "string") {
    return {
      exito: false,
      error: "El archivo o contenido CSV está vacío.",
      totalVistasCSV: 0,
      totalUsuariosCSV: 0,
      totalFilasProcesadas: 0,
      aliadosCoincidentes: 0,
      metricasPorAliado: {},
      resumenAliados: [],
      paginasNoAsignadas: [],
    };
  }

  // 1. Normalizar saltos de línea (\r\n -> \n, \r -> \n) y limpiar espacios
  const lineas = csvContenido
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  let fechaInicio: string | undefined;
  let fechaFin: string | undefined;
  let headerIndex = -1;
  let delimitador = ",";

  // 2. Extraer metadatos de fechas (pueden estar en cualquier línea inicial o comentarios #)
  for (let i = 0; i < Math.min(lineas.length, 60); i++) {
    const l = lineas[i];
    if (l.startsWith("#")) {
      const lSanitizada = sanitizar(l);
      if (lSanitizada.includes("fecha de inicio") || lSanitizada.includes("start date")) {
        const raw = l.split(":")[1]?.trim();
        if (raw && raw.length === 8 && /^\d{8}$/.test(raw)) {
          fechaInicio = `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}`;
        } else if (raw) {
          fechaInicio = raw;
        }
      }
      if (
        lSanitizada.includes("fecha de finalizacion") ||
        lSanitizada.includes("fecha de fin") ||
        lSanitizada.includes("end date")
      ) {
        const raw = l.split(":")[1]?.trim();
        if (raw && raw.length === 8 && /^\d{8}$/.test(raw)) {
          fechaFin = `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}`;
        } else if (raw) {
          fechaFin = raw;
        }
      }
    }
  }

  // 3. Encontrar la fila real de encabezados (ignorando líneas que empiezan con #)
  for (let i = 0; i < lineas.length; i++) {
    const lineaLimpia = lineas[i].trim();
    if (!lineaLimpia || lineaLimpia.startsWith("#")) continue;

    // Sanitizamos la línea completa para buscar 'titulo de pagina' y 'vistas' sin importar tildes ni Unicode NFD
    const lineaSanitizada = sanitizar(lineaLimpia);
    if (
      (lineaSanitizada.includes("titulo de pagina") ||
        lineaSanitizada.includes("page title") ||
        lineaSanitizada.includes("clase de pantalla") ||
        lineaSanitizada.includes("screen class") ||
        lineaSanitizada.includes("ruta de la pagina") ||
        lineaSanitizada.includes("page path")) &&
      (lineaSanitizada.includes("vistas") ||
        lineaSanitizada.includes("views") ||
        lineaSanitizada.includes("visualizaciones") ||
        lineaSanitizada.includes("usuarios") ||
        lineaSanitizada.includes("users"))
    ) {
      headerIndex = i;
      const comas = (lineaLimpia.match(/,/g) || []).length;
      const puntosYComas = (lineaLimpia.match(/;/g) || []).length;
      const tabs = (lineaLimpia.match(/\t/g) || []).length;
      if (puntosYComas > comas && puntosYComas > tabs) {
        delimitador = ";";
      } else if (tabs > comas && tabs > puntosYComas) {
        delimitador = "\t";
      } else {
        delimitador = ",";
      }
      break;
    }
  }

  // Si no se encontró por combinación estricta, buscar fila que contenga título o página
  if (headerIndex === -1) {
    for (let i = 0; i < lineas.length; i++) {
      const lineaLimpia = lineas[i].trim();
      if (!lineaLimpia || lineaLimpia.startsWith("#")) continue;
      const lSan = sanitizar(lineaLimpia);
      if (lSan.includes("titulo de pagina") || lSan.includes("page title") || lSan.includes("clase de pantalla")) {
        headerIndex = i;
        break;
      }
    }
  }

  if (headerIndex === -1) {
    return {
      exito: false,
      error: "El formato de columnas no contiene 'Título de página' o 'Vistas / Visualizaciones'.",
      totalVistasCSV: 0,
      totalUsuariosCSV: 0,
      totalFilasProcesadas: 0,
      aliadosCoincidentes: 0,
      metricasPorAliado: {},
      resumenAliados: [],
      paginasNoAsignadas: [],
    };
  }

  // 4. Mapear índices de columnas de forma tolerante y sanitizada
  const columnasRaw = parsearLineaCSV(lineas[headerIndex], delimitador);
  const columnas = columnasRaw.map((col) => sanitizar(col.replace(/^["']|["']$/g, "")));

  const idxTitulo = columnas.findIndex(
    (c) =>
      c.includes("titulo de pagina") ||
      c.includes("page title") ||
      c.includes("clase de pantalla") ||
      c.includes("screen class") ||
      c.includes("titulo") ||
      c.includes("title") ||
      c.includes("ruta de la pagina") ||
      c.includes("page path")
  );

  let idxVistas = columnas.findIndex(
    (c) => c === "vistas" || c === "views" || c === "visualizaciones" || c === "visitas"
  );
  if (idxVistas === -1) {
    idxVistas = columnas.findIndex(
      (c) =>
        (c.includes("vistas") || c.includes("views") || c.includes("visualiza") || c.includes("visitas")) &&
        !c.includes("usuario") &&
        !c.includes("user") &&
        !c.includes("por") &&
        !c.includes("per")
    );
  }
  if (idxVistas === -1) {
    idxVistas = columnas.findIndex(
      (c) => c.includes("vistas") || c.includes("views") || c.includes("visualiza") || c.includes("visitas")
    );
  }

  let idxUsuarios = columnas.findIndex(
    (c) => c === "usuarios" || c === "users" || c === "total users" || c === "usuarios activos" || c === "active users"
  );
  if (idxUsuarios === -1) {
    idxUsuarios = columnas.findIndex(
      (c) => (c.includes("usuario") || c.includes("user")) && !c.includes("nuevos") && !c.includes("new")
    );
  }
  if (idxUsuarios === -1) {
    idxUsuarios = columnas.findIndex(
      (c) => c.includes("usuario") || c.includes("user")
    );
  }

  if (idxTitulo === -1 || idxVistas === -1) {
    return {
      exito: false,
      error: "El formato de columnas no contiene 'Título de página' o 'Vistas / Visualizaciones'.",
      totalVistasCSV: 0,
      totalUsuariosCSV: 0,
      totalFilasProcesadas: 0,
      aliadosCoincidentes: 0,
      metricasPorAliado: {},
      resumenAliados: [],
      paginasNoAsignadas: [],
    };
  }

  // 3. Preparar estructuras de agregación
  interface AcumuladorAliado {
    nombreOficial: string;
    vistas: number;
    usuariosUnicos: number;
    idiomas: Set<string>;
    paginas: number;
  }

  const acumulador: Record<string, AcumuladorAliado> = {};
  const paginasNoAsignadas: { titulo: string; vistas: number; usuarios: number }[] = [];

  // Mapear nombres normalizados de negocios registrados
  const listaNormalizada = negociosRegistrados.map((n) => ({
    id: n.id,
    nombre: n.nombre,
    norm: sanitizar(n.nombre),
  }));

  let totalVistasCSV = 0;
  let totalUsuariosCSV = 0;
  let filasDatos = 0;

  // 4. Procesar cada fila de datos del CSV
  for (let i = headerIndex + 1; i < lineas.length; i++) {
    const linea = lineas[i];
    if (!linea || linea.startsWith("#")) continue;

    const cols = parsearLineaCSV(linea, delimitador);
    if (cols.length < 2) continue;

    const titulo = cols[idxTitulo] || "";
    // Limpiar separadores de miles y caracteres no numéricos
    const vistas = Number(cols[idxVistas]?.replace(/[^\d]/g, "")) || 0;
    const usuarios = idxUsuarios !== -1 ? Number(cols[idxUsuarios]?.replace(/[^\d]/g, "")) || 0 : Math.ceil(vistas * 0.6);

    if (!titulo || titulo === "(not set)") continue;

    totalVistasCSV += vistas;
    totalUsuariosCSV += usuarios;
    filasDatos++;

    // Descartar pantallas generales de la app (home, cartelera general, panel admin, cotizador)
    const tSanitizado = sanitizar(titulo);
    const esPantallaGeneral =
      tSanitizado.includes("cartelera de minca") ||
      tSanitizado.includes("cartelera de mendihuaca") ||
      tSanitizado.includes("panel de control") ||
      tSanitizado.includes("cotizador") ||
      tSanitizado.includes("aliados y planes") ||
      tSanitizado.includes("puntos qr") ||
      tSanitizado.includes("configuracion territorial") ||
      tSanitizado.includes("gestion de hospedajes") ||
      tSanitizado.includes("acceso administrador") ||
      tSanitizado.includes("info util");

    if (esPantallaGeneral) {
      continue;
    }

    const idioma = detectarIdiomaTitulo(titulo);
    const candidato = sanitizar(extraerCandidatoNegocio(titulo));

    // Buscar coincidencia con la lista de aliados registrados
    let aliadoMatch: { id: string; nombre: string } | null = null;

    // A. Coincidencia directa con candidato extraído
    for (const al of listaNormalizada) {
      if (
        candidato.includes(al.norm) ||
        al.norm.includes(candidato) ||
        tSanitizado.includes(al.norm)
      ) {
        aliadoMatch = al;
        break;
      }
    }

    // B. Heurística para casos especiales (nombres cortos o marcas conocidas, inmune a tildes)
    if (!aliadoMatch) {
      if (tSanitizado.includes("brisas del mar")) aliadoMatch = { id: "brisas", nombre: "Restaurante Brisas Del Mar" };
      else if (tSanitizado.includes("canumake")) aliadoMatch = { id: "canumake", nombre: "Canúmake Minca" };
      else if (tSanitizado.includes("jungle joe")) aliadoMatch = { id: "jungle-joe", nombre: "Jungle Joe Minca" };
      else if (tSanitizado.includes("casa maya")) aliadoMatch = { id: "casa-maya", nombre: "Casa Maya Mendihuaca" };
      else if (tSanitizado.includes("pepe mojito")) aliadoMatch = { id: "pepe-mojito", nombre: "Pepe Mojito Bar" };
      else if (tSanitizado.includes("amora")) aliadoMatch = { id: "amora", nombre: "Amora Cocina Saludable" };
      else if (tSanitizado.includes("silocibe") || tSanitizado.includes("cora fest")) aliadoMatch = { id: "silocibe", nombre: "Silocibe Gastrobar Y Mirador" };
      else if (tSanitizado.includes("casa cora")) aliadoMatch = { id: "casa-cora", nombre: "Casa Cora Minca" };
      else if (tSanitizado.includes("feeling bar")) aliadoMatch = { id: "feeling-bar", nombre: "Feeling Bar Minca" };
      else if (tSanitizado.includes("koko & chiqui") || tSanitizado.includes("pan artesanal")) aliadoMatch = { id: "koko", nombre: "Pan Artesanal Koko & Chiqui" };
      else if (tSanitizado.includes("rancho de la luna")) aliadoMatch = { id: "rancho-luna", nombre: "Rancho de la Luna Minca" };
      else if (tSanitizado.includes("setena")) aliadoMatch = { id: "setena", nombre: "SeTena Tierra Húmeda Ecolodge" };
      else if (tSanitizado.includes("jam birding")) aliadoMatch = { id: "jam-birding", nombre: "Jam Birding Minca" };
      else if (tSanitizado.includes("casa aney")) aliadoMatch = { id: "casa-aney", nombre: "Casa Aney Minca" };
      else if (tSanitizado.includes("minkanta")) aliadoMatch = { id: "minkanta", nombre: "Minkanta" };
      else if (tSanitizado.includes("puerto alto")) aliadoMatch = { id: "puerto-alto", nombre: "Puerto Alto" };
      else if (tSanitizado.includes("rancho de puiro")) aliadoMatch = { id: "rancho-puiro", nombre: "Restaurante Rancho de Puiro" };
      else if (tSanitizado.includes("nuevo sabor")) aliadoMatch = { id: "nuevo-sabor", nombre: "Pizza Nuevo Sabor" };
      else if (tSanitizado.includes("trekker glamping")) aliadoMatch = { id: "trekker", nombre: "Trekker Glamping" };
      else if (tSanitizado.includes("la miga")) aliadoMatch = { id: "la-miga", nombre: "La Miga Panadería" };
      else if (tSanitizado.includes("velero relax")) aliadoMatch = { id: "velero-relax", nombre: "Hostal Velero Relax" };
      else if (tSanitizado.includes("el bosque") || tSanitizado.includes("casa loma")) aliadoMatch = { id: "el-bosque", nombre: "El Bosque (antes Casa Loma)" };
      else if (tSanitizado.includes("arena beach")) aliadoMatch = { id: "arena-beach", nombre: "Arena Beach" };
      else if (tSanitizado.includes("la frecuencia")) aliadoMatch = { id: "la-frecuencia", nombre: "Finca La Frecuencia" };
      else if (tSanitizado.includes("duni cafe")) aliadoMatch = { id: "duni", nombre: "Duni Café Minca" };
      else if (tSanitizado.includes("la veranda")) aliadoMatch = { id: "veranda", nombre: "La Veranda Hotels" };
      else if (tSanitizado.includes("rio elemento")) aliadoMatch = { id: "rio-elemento", nombre: "Río Elemento Minca" };
      else if (tSanitizado.includes("astra mendihuaca") || tSanitizado.includes("astra")) aliadoMatch = { id: "astra", nombre: "Astra Mendihuaca Beach" };
      else if (tSanitizado.includes("tribu hostal") || tSanitizado.includes("tribu")) aliadoMatch = { id: "tribu", nombre: "Tribu Hostal Minca" };
      else if (tSanitizado.includes("mompe beach") || tSanitizado.includes("the mompe")) aliadoMatch = { id: "mompe", nombre: "The Mompe Beach hostal" };
      else if (tSanitizado.includes("dreams come true")) aliadoMatch = { id: "dreams-come-true", nombre: "Dreams Come True 44" };
      else if (tSanitizado.includes("la ilusion") || tSanitizado.includes("the illusion") || tSanitizado.includes("l'illusion") || tSanitizado.includes("die illusion")) aliadoMatch = { id: "la-ilusion", nombre: "La Ilusión" };
      else if (tSanitizado.includes("luma")) aliadoMatch = { id: "luma", nombre: "Luma Hostal" };
      else if (tSanitizado.includes("casa del mono")) aliadoMatch = { id: "casa-mono", nombre: "La Casa del Mono" };
      else if (tSanitizado.includes("entre rio y fuego")) aliadoMatch = { id: "rio-fuego", nombre: "Entre Río y Fuego Lodge" };
      else if (tSanitizado.includes("kakaw") || tSanitizado.includes("museo del cacao")) aliadoMatch = { id: "kakaw", nombre: "Kakaw — Museo del Cacao" };
      else if (tSanitizado.includes("moana surf")) aliadoMatch = { id: "moana", nombre: "Moana Surf Club Mendihuaca" };
      else if (tSanitizado.includes("bururake")) aliadoMatch = { id: "bururake", nombre: "Bururake" };
      else if (tSanitizado.includes("don samuel")) aliadoMatch = { id: "don-samuel", nombre: "Restaurante Don Samuel" };
      else if (tSanitizado.includes("bob marley")) aliadoMatch = { id: "bob-marley", nombre: "Bob Marley Beach Hostal" };
      else if (tSanitizado.includes("the sunset")) aliadoMatch = { id: "the-sunset", nombre: "Cabaña The Sunset Mendihuaca Beach" };
      else if (tSanitizado.includes("el almendron")) aliadoMatch = { id: "almendron", nombre: "El Almendrón" };
      else if (tSanitizado.includes("jac de minca") || tSanitizado.includes("comite cultural")) aliadoMatch = { id: "jac-minca", nombre: "JAC de Minca & Comité Cultural" };
      else if (tSanitizado.includes("cacao cultural")) aliadoMatch = { id: "cacao-cultural", nombre: "Cacao Cultural" };
      else if (tSanitizado.includes("la cumbre")) aliadoMatch = { id: "la-cumbre", nombre: "Hostal La Cumbre" };
      else if (tSanitizado.includes("dhamma gutti")) aliadoMatch = { id: "dhamma-gutti", nombre: "Dhamma Gutti (Vipassana)" };
      else if (tSanitizado.includes("las mulatas")) aliadoMatch = { id: "mulatas", nombre: "Las Mulatas Villa" };
      else if (tSanitizado.includes("aluna arte") || tSanitizado.includes("aluna")) aliadoMatch = { id: "aluna", nombre: "Aluna Arte Ancestral" };
      else if (tSanitizado.includes("aventura 4x4") || tSanitizado.includes("trochero")) aliadoMatch = { id: "aventura-4x4", nombre: "Trochero Aventura 4X4 Minca" };
      else if (tSanitizado.includes("cattleya")) aliadoMatch = { id: "cattleya", nombre: "Cattleya Fast Food & Souvenirs" };
      else if (tSanitizado.includes("juanda birder") || tSanitizado.includes("juanda")) aliadoMatch = { id: "juanda", nombre: "Juanda Birder Minca" };
      else if (tSanitizado.includes("gelato nevao") || tSanitizado.includes("gelato")) aliadoMatch = { id: "gelato", nombre: "Gelato Nevao" };
      else if (tSanitizado.includes("mi cielito")) aliadoMatch = { id: "mi-cielito", nombre: "Restaurante y Heladería Mi Cielito" };
      else if (tSanitizado.includes("mendihuaca beach restobar") || (tSanitizado.includes("sunset session") && tSanitizado.includes("mendihuaca"))) aliadoMatch = { id: "mendihuaca-restobar", nombre: "Mendihuaca Beach Restobar" };
      else if (tSanitizado.includes("zirumake")) aliadoMatch = { id: "zirumake", nombre: "Zirumake Tayrona" };
    }

    if (aliadoMatch) {
      const keyNorm = aliadoMatch.nombre.toLowerCase().trim();
      if (!acumulador[keyNorm]) {
        acumulador[keyNorm] = {
          nombreOficial: aliadoMatch.nombre,
          vistas: 0,
          usuariosUnicos: 0,
          idiomas: new Set<string>(),
          paginas: 0,
        };
      }

      acumulador[keyNorm].vistas += vistas;
      // Para usuarios únicos sumamos o ajustamos por páginas de idiomas
      acumulador[keyNorm].usuariosUnicos += usuarios;
      acumulador[keyNorm].idiomas.add(idioma);
      acumulador[keyNorm].paginas += 1;
    } else {
      paginasNoAsignadas.push({ titulo, vistas, usuarios });
    }
  }

  // 5. Construir mapa final y array de resumen
  const metricasPorAliado: Record<string, MetricaHistoricaAliado> = {};
  const resumenAliados = Object.values(acumulador).map((item) => {
    // Si se contaron múltiples páginas en diferentes idiomas para el mismo aliado,
    // calculamos un aproximado realista de usuarios únicos desduplicados
    const factorDesduplicacion = item.paginas > 1 ? 0.75 : 1.0;
    const usuariosEstimados = Math.max(1, Math.round(item.usuariosUnicos * factorDesduplicacion));

    const metrica: MetricaHistoricaAliado = {
      vistas: item.vistas,
      usuariosUnicos: usuariosEstimados,
      idiomasDetectados: Array.from(item.idiomas),
    };

    metricasPorAliado[item.nombreOficial.toLowerCase().trim()] = metrica;

    return {
      nombre: item.nombreOficial,
      vistas: item.vistas,
      usuariosUnicos: usuariosEstimados,
      idiomas: metrica.idiomasDetectados,
      paginasContadas: item.paginas,
    };
  });

  // Ordenar de mayor a menor visitas
  resumenAliados.sort((a, b) => b.vistas - a.vistas);

  return {
    exito: true,
    fechaInicio,
    fechaFin,
    totalVistasCSV,
    totalUsuariosCSV,
    totalFilasProcesadas: filasDatos,
    aliadosCoincidentes: resumenAliados.length,
    metricasPorAliado,
    resumenAliados,
    paginasNoAsignadas,
  };
}

/**
 * Algoritmo ligero e inmune a tildes (Unicode NFD) y retornos de carro
 * solicitado específicamente para extracción directa de filas y métricas de GA4.
 */
export function parseAnalyticsCSV(contenidoCSV: string) {
  // 1. Normalizar saltos de línea (\r\n -> \n, \r -> \n) y limpiar espacios
  const lineas = contenidoCSV.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");

  // 2. Extraer fechas del encabezado comentado (# Fecha de inicio: YYYYMMDD)
  let fechaInicio = "";
  let fechaFin = "";
  for (const l of lineas) {
    if (l.startsWith("#")) {
      const lSan = sanitizar(l);
      if (lSan.includes("fecha de inicio:")) fechaInicio = l.split(":")[1]?.trim() || "";
      if (lSan.includes("fecha de finalizacion:") || lSan.includes("fecha de fin:")) fechaFin = l.split(":")[1]?.trim() || "";
    }
  }

  // 3. Encontrar la fila real de encabezados (ignorando líneas que empiezan con #)
  let indiceEncabezado = -1;
  let columnas: string[] = [];

  for (let i = 0; i < lineas.length; i++) {
    const lineaLimpia = lineas[i].trim();
    if (!lineaLimpia || lineaLimpia.startsWith("#")) continue;

    // Sanitizamos la línea completa para buscar 'titulo de pagina' y 'vistas' sin importar tildes
    const lineaSanitizada = sanitizar(lineaLimpia);
    if (
      (lineaSanitizada.includes("titulo de pagina") || lineaSanitizada.includes("page title")) &&
      (lineaSanitizada.includes("vistas") || lineaSanitizada.includes("views") || lineaSanitizada.includes("visualizaciones"))
    ) {
      indiceEncabezado = i;
      columnas = lineas[i].split(",").map((col) => sanitizar(col.replace(/^["']|["']$/g, "")));
      break;
    }
  }

  if (indiceEncabezado === -1) {
    throw new Error("El formato de columnas no contiene 'Título de página' o 'Vistas / Visualizaciones'.");
  }

  // 4. Mapear índices de columnas de forma tolerante
  const idxTitulo = columnas.findIndex((c) => c.includes("titulo de pagina") || c.includes("page title"));
  const idxVistas = columnas.findIndex((c) => c.includes("vistas") || c.includes("views") || c.includes("visualizaciones"));
  const idxUsuarios = columnas.findIndex((c) => c.includes("usuarios") || c.includes("users"));

  // 5. Procesar filas de datos
  const resultados = [];
  for (let i = indiceEncabezado + 1; i < lineas.length; i++) {
    const linea = lineas[i].trim();
    if (!linea || linea.startsWith("#")) continue;

    // Parser CSV simple considerando comillas
    const matches = linea.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || linea.split(",");
    const valores = matches.map((m) => m.replace(/^"|"$/g, "").trim());

    const titulo = valores[idxTitulo];
    const vistas = parseInt(valores[idxVistas]?.replace(/\./g, "") || "0", 10);
    const usuarios = idxUsuarios !== -1 ? parseInt(valores[idxUsuarios]?.replace(/\./g, "") || "0", 10) : 0;

    if (titulo && !isNaN(vistas)) {
      resultados.push({ titulo, vistas, usuarios });
    }
  }

  return { fechaInicio, fechaFin, datos: resultados };
}
