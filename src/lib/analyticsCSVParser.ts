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

  const lineas = csvContenido.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);

  let fechaInicio: string | undefined;
  let fechaFin: string | undefined;
  let headerIndex = -1;
  let delimitador = ",";

  // 1. Extraer metadatos de fechas (pueden estar en cualquier línea inicial o comentarios #)
  for (let i = 0; i < Math.min(lineas.length, 60); i++) {
    const l = lineas[i];
    if (l.includes("Fecha de inicio:") || l.includes("Start date:")) {
      const raw = l.split(":")[1]?.trim();
      if (raw && raw.length === 8 && /^\d{8}$/.test(raw)) {
        fechaInicio = `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}`;
      } else if (raw) {
        fechaInicio = raw;
      }
    }
    if (
      l.includes("Fecha de finalización:") ||
      l.includes("Fecha de fin:") ||
      l.includes("End date:")
    ) {
      const raw = l.split(":")[1]?.trim();
      if (raw && raw.length === 8 && /^\d{8}$/.test(raw)) {
        fechaFin = `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}`;
      } else if (raw) {
        fechaFin = raw;
      }
    }
  }

  // 2. Ubicar la fila de títulos de columna (omitiendo comentarios #)
  for (let i = 0; i < Math.min(lineas.length, 60); i++) {
    const l = lineas[i];
    // CRÍTICO: Las líneas de metadatos de GA4 comienzan con '#' -> Omitir al buscar la fila de encabezados
    if (l.startsWith("#")) continue;

    // Detectar fila de encabezados (soporte en español e inglés)
    const lLower = l.toLowerCase();
    if (
      lLower.includes("título de página") ||
      lLower.includes("titulo de pagina") ||
      lLower.includes("page title") ||
      lLower.includes("clase de pantalla") ||
      lLower.includes("screen class") ||
      lLower.includes("ruta de la página") ||
      lLower.includes("page path")
    ) {
      headerIndex = i;
      const comas = (l.match(/,/g) || []).length;
      const puntosYComas = (l.match(/;/g) || []).length;
      const tabs = (l.match(/\t/g) || []).length;
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

  if (headerIndex === -1) {
    return {
      exito: false,
      error: "No se encontró el encabezado de 'Título de página' en el archivo CSV de Google Analytics.",
      totalVistasCSV: 0,
      totalUsuariosCSV: 0,
      totalFilasProcesadas: 0,
      aliadosCoincidentes: 0,
      metricasPorAliado: {},
      resumenAliados: [],
      paginasNoAsignadas: [],
    };
  }

  // 2. Índices de columnas
  const encabezados = parsearLineaCSV(lineas[headerIndex], delimitador).map((h) =>
    h.toLowerCase().trim()
  );

  // Columna de título / pantalla / página
  let idxTitulo = encabezados.findIndex(
    (h) => (h.includes("título") || h.includes("titulo") || h.includes("title")) && (h.includes("página") || h.includes("pagina") || h.includes("page") || h.includes("pantalla") || h.includes("screen"))
  );
  if (idxTitulo === -1) {
    idxTitulo = encabezados.findIndex(
      (h) => h.includes("título") || h.includes("titulo") || h.includes("title") || h.includes("pantalla") || h.includes("screen") || h.includes("página") || h.includes("pagina") || h.includes("page") || h.includes("ruta") || h.includes("path")
    );
  }

  // Columna de vistas / visualizaciones (en GA4 en español es "Visualizaciones")
  let idxVistas = encabezados.findIndex(
    (h) => h === "visualizaciones" || h === "vistas" || h === "views" || h === "visitas"
  );
  if (idxVistas === -1) {
    idxVistas = encabezados.findIndex(
      (h) =>
        (h.includes("visualiza") || h.includes("vistas") || h.includes("views") || h.includes("visitas")) &&
        !h.includes("usuario") &&
        !h.includes("user") &&
        !h.includes("por") &&
        !h.includes("per")
    );
  }
  if (idxVistas === -1) {
    idxVistas = encabezados.findIndex(
      (h) => h.includes("visualiza") || h.includes("vistas") || h.includes("views") || h.includes("visitas")
    );
  }

  // Columna de usuarios
  let idxUsuarios = encabezados.findIndex(
    (h) => h === "usuarios" || h === "users" || h === "total users" || h === "usuarios activos" || h === "active users"
  );
  if (idxUsuarios === -1) {
    idxUsuarios = encabezados.findIndex(
      (h) => (h.includes("usuarios") || h.includes("users") || h.includes("visitantes")) && !h.includes("nuevos") && !h.includes("new")
    );
  }
  if (idxUsuarios === -1) {
    idxUsuarios = encabezados.findIndex(
      (h) => h.includes("usuarios") || h.includes("users") || h.includes("visitantes")
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
    norm: n.nombre.toLowerCase().trim(),
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
    const tLower = titulo.toLowerCase();
    const esPantallaGeneral =
      tLower.includes("cartelera de minca") ||
      tLower.includes("cartelera de mendihuaca") ||
      tLower.includes("panel de control") ||
      tLower.includes("cotizador") ||
      tLower.includes("aliados y planes") ||
      tLower.includes("puntos qr") ||
      tLower.includes("configuración territorial") ||
      tLower.includes("gestión de hospedajes") ||
      tLower.includes("acceso administrador") ||
      tLower.includes("info útil & servicios");

    if (esPantallaGeneral) {
      continue;
    }

    const idioma = detectarIdiomaTitulo(titulo);
    const candidato = extraerCandidatoNegocio(titulo).toLowerCase().trim();

    // Buscar coincidencia con la lista de aliados registrados
    let aliadoMatch: { id: string; nombre: string } | null = null;

    // A. Coincidencia directa con candidato extraído
    for (const al of listaNormalizada) {
      if (
        candidato.includes(al.norm) ||
        al.norm.includes(candidato) ||
        tLower.includes(al.norm)
      ) {
        aliadoMatch = al;
        break;
      }
    }

    // B. Heurística para casos especiales (nombres cortos o marcas conocidas)
    if (!aliadoMatch) {
      if (tLower.includes("brisas del mar")) aliadoMatch = { id: "brisas", nombre: "Restaurante Brisas Del Mar" };
      else if (tLower.includes("canúmake") || tLower.includes("canumake")) aliadoMatch = { id: "canumake", nombre: "Canúmake Minca" };
      else if (tLower.includes("jungle joe")) aliadoMatch = { id: "jungle-joe", nombre: "Jungle Joe Minca" };
      else if (tLower.includes("casa maya")) aliadoMatch = { id: "casa-maya", nombre: "Casa Maya Mendihuaca" };
      else if (tLower.includes("pepe mojito")) aliadoMatch = { id: "pepe-mojito", nombre: "Pepe Mojito Bar" };
      else if (tLower.includes("amora")) aliadoMatch = { id: "amora", nombre: "Amora Cocina Saludable" };
      else if (tLower.includes("silocibe") || tLower.includes("cora fest")) aliadoMatch = { id: "silocibe", nombre: "Silocibe Gastrobar Y Mirador" };
      else if (tLower.includes("casa cora")) aliadoMatch = { id: "casa-cora", nombre: "Casa Cora Minca" };
      else if (tLower.includes("feeling bar")) aliadoMatch = { id: "feeling-bar", nombre: "Feeling Bar Minca" };
      else if (tLower.includes("koko & chiqui") || tLower.includes("pan artesanal")) aliadoMatch = { id: "koko", nombre: "Pan Artesanal Koko & Chiqui" };
      else if (tLower.includes("rancho de la luna")) aliadoMatch = { id: "rancho-luna", nombre: "Rancho de la Luna Minca" };
      else if (tLower.includes("setena")) aliadoMatch = { id: "setena", nombre: "SeTena Tierra Húmeda Ecolodge" };
      else if (tLower.includes("jam birding")) aliadoMatch = { id: "jam-birding", nombre: "Jam Birding Minca" };
      else if (tLower.includes("casa aney")) aliadoMatch = { id: "casa-aney", nombre: "Casa Aney Minca" };
      else if (tLower.includes("minkanta")) aliadoMatch = { id: "minkanta", nombre: "Minkanta" };
      else if (tLower.includes("puerto alto")) aliadoMatch = { id: "puerto-alto", nombre: "Puerto Alto" };
      else if (tLower.includes("rancho de puiro")) aliadoMatch = { id: "rancho-puiro", nombre: "Restaurante Rancho de Puiro" };
      else if (tLower.includes("nuevo sabor")) aliadoMatch = { id: "nuevo-sabor", nombre: "Pizza Nuevo Sabor" };
      else if (tLower.includes("trekker glamping")) aliadoMatch = { id: "trekker", nombre: "Trekker Glamping" };
      else if (tLower.includes("la miga")) aliadoMatch = { id: "la-miga", nombre: "La Miga Panadería" };
      else if (tLower.includes("velero relax")) aliadoMatch = { id: "velero-relax", nombre: "Hostal Velero Relax" };
      else if (tLower.includes("el bosque") || tLower.includes("casa loma")) aliadoMatch = { id: "el-bosque", nombre: "El Bosque (antes Casa Loma)" };
      else if (tLower.includes("arena beach")) aliadoMatch = { id: "arena-beach", nombre: "Arena Beach" };
      else if (tLower.includes("la frecuencia")) aliadoMatch = { id: "la-frecuencia", nombre: "Finca La Frecuencia" };
      else if (tLower.includes("duni café") || tLower.includes("duni cafe")) aliadoMatch = { id: "duni", nombre: "Duni Café Minca" };
      else if (tLower.includes("la veranda")) aliadoMatch = { id: "veranda", nombre: "La Veranda Hotels" };
      else if (tLower.includes("río elemento") || tLower.includes("rio elemento")) aliadoMatch = { id: "rio-elemento", nombre: "Río Elemento Minca" };
      else if (tLower.includes("astra mendihuaca") || tLower.includes("astra")) aliadoMatch = { id: "astra", nombre: "Astra Mendihuaca Beach" };
      else if (tLower.includes("tribu hostal") || tLower.includes("tribu")) aliadoMatch = { id: "tribu", nombre: "Tribu Hostal Minca" };
      else if (tLower.includes("mompe beach") || tLower.includes("the mompe")) aliadoMatch = { id: "mompe", nombre: "The Mompe Beach hostal" };
      else if (tLower.includes("dreams come true")) aliadoMatch = { id: "dreams-come-true", nombre: "Dreams Come True 44" };
      else if (tLower.includes("la ilusión") || tLower.includes("la ilusion") || tLower.includes("the illusion") || tLower.includes("l'illusion") || tLower.includes("die illusion")) aliadoMatch = { id: "la-ilusion", nombre: "La Ilusión" };
      else if (tLower.includes("luma")) aliadoMatch = { id: "luma", nombre: "Luma Hostal" };
      else if (tLower.includes("casa del mono")) aliadoMatch = { id: "casa-mono", nombre: "La Casa del Mono" };
      else if (tLower.includes("entre río y fuego") || tLower.includes("entre rio y fuego")) aliadoMatch = { id: "rio-fuego", nombre: "Entre Río y Fuego Lodge" };
      else if (tLower.includes("kakaw") || tLower.includes("museo del cacao")) aliadoMatch = { id: "kakaw", nombre: "Kakaw — Museo del Cacao" };
      else if (tLower.includes("moana surf")) aliadoMatch = { id: "moana", nombre: "Moana Surf Club Mendihuaca" };
      else if (tLower.includes("bururake")) aliadoMatch = { id: "bururake", nombre: "Bururake" };
      else if (tLower.includes("don samuel")) aliadoMatch = { id: "don-samuel", nombre: "Restaurante Don Samuel" };
      else if (tLower.includes("bob marley")) aliadoMatch = { id: "bob-marley", nombre: "Bob Marley Beach Hostal" };
      else if (tLower.includes("the sunset")) aliadoMatch = { id: "the-sunset", nombre: "Cabaña The Sunset Mendihuaca Beach" };
      else if (tLower.includes("el almendrón") || tLower.includes("el almendron")) aliadoMatch = { id: "almendron", nombre: "El Almendrón" };
      else if (tLower.includes("jac de minca") || tLower.includes("comité cultural")) aliadoMatch = { id: "jac-minca", nombre: "JAC de Minca & Comité Cultural" };
      else if (tLower.includes("cacao cultural")) aliadoMatch = { id: "cacao-cultural", nombre: "Cacao Cultural" };
      else if (tLower.includes("la cumbre")) aliadoMatch = { id: "la-cumbre", nombre: "Hostal La Cumbre" };
      else if (tLower.includes("dhamma gutti")) aliadoMatch = { id: "dhamma-gutti", nombre: "Dhamma Gutti (Vipassana)" };
      else if (tLower.includes("las mulatas")) aliadoMatch = { id: "mulatas", nombre: "Las Mulatas Villa" };
      else if (tLower.includes("aluna arte") || tLower.includes("aluna")) aliadoMatch = { id: "aluna", nombre: "Aluna Arte Ancestral" };
      else if (tLower.includes("aventura 4x4") || tLower.includes("trochero")) aliadoMatch = { id: "aventura-4x4", nombre: "Trochero Aventura 4X4 Minca" };
      else if (tLower.includes("cattleya")) aliadoMatch = { id: "cattleya", nombre: "Cattleya Fast Food & Souvenirs" };
      else if (tLower.includes("juanda birder") || tLower.includes("juanda")) aliadoMatch = { id: "juanda", nombre: "Juanda Birder Minca" };
      else if (tLower.includes("gelato nevao") || tLower.includes("gelato")) aliadoMatch = { id: "gelato", nombre: "Gelato Nevao" };
      else if (tLower.includes("mi cielito")) aliadoMatch = { id: "mi-cielito", nombre: "Restaurante y Heladería Mi Cielito" };
      else if (tLower.includes("mendihuaca beach restobar") || (tLower.includes("sunset session") && tLower.includes("mendihuaca"))) aliadoMatch = { id: "mendihuaca-restobar", nombre: "Mendihuaca Beach Restobar" };
      else if (tLower.includes("zirumake")) aliadoMatch = { id: "zirumake", nombre: "Zirumake Tayrona" };
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
