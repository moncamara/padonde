#!/usr/bin/env node
// 🌿 PaDónde — Clasificador Automático de Fotos de Hospedajes con Gemini Vision
// Diseñado para clasificar, desempatar y asignar fotos masivas de Booking / Airbnb
// a sus respectivas habitaciones y áreas comunes con Inteligencia Artificial Multimodal.

import fs from "fs";
import path from "path";
import sharp from "sharp";

const PROJECT_DIR = process.cwd();
const FOTOS_DIR = path.join(PROJECT_DIR, "fotos_pendientes");

// 1. Cargar GEMINI_API_KEY desde .env.local
function obtenerGeminiKey() {
  if (process.env.GEMINI_API_KEY) return process.env.GEMINI_API_KEY;
  const envPath = path.join(PROJECT_DIR, ".env.local");
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, "utf8");
    const match = envContent.match(/GEMINI_API_KEY=([^\r\n]+)/);
    if (match) return match[1].replace(/["']/g, "").trim();
  }
  return null;
}

function slugify(text) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

function formatearBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

// 2. Crear miniatura ligera (512px) en memoria para enviar a Gemini Vision
async function generarMiniaturaBase64(rutaArchivo) {
  const buffer = await sharp(rutaArchivo)
    .rotate()
    .resize(512, 512, { fit: "inside", withoutEnlargement: true })
    .jpeg({ quality: 65 })
    .toBuffer();
  return buffer.toString("base64");
}

// 3. Procesar imagen original con pipeline editorial de PaDónde (Corte 4:3, CLAHE, 1200x900 WebP)
async function procesarImagenEditorial(rutaEntrada, rutaSalidaWebp, rutaSalidaJpg) {
  const meta = await sharp(rutaEntrada).metadata();
  const origW = meta.width || 1200;
  const origH = meta.height || 900;

  const targetRatio = 4 / 3;
  let cropW, cropH, cropLeft, cropTop;
  const currentRatio = origW / origH;

  if (currentRatio > targetRatio) {
    cropH = origH;
    cropW = Math.round(origH * targetRatio);
    cropTop = 0;
    cropLeft = Math.round((origW - cropW) / 2);
  } else {
    cropW = origW;
    cropH = Math.round(origW / targetRatio);
    cropLeft = 0;
    const maxOffset = origH - cropH;
    cropTop = Math.min(Math.round(origH * 0.08), maxOffset); // 8% offset superior
  }

  const pipeline = sharp(rutaEntrada)
    .rotate()
    .extract({ left: cropLeft, top: cropTop, width: cropW, height: cropH })
    .resize(1200, 900, { fit: "cover" })
    .clahe({ width: 80, height: 80, maxSlope: 2 })
    .modulate({ brightness: 1.02, saturation: 1.06 })
    .sharpen({ sigma: 1.0, m1: 0.8, m2: 2.0 });

  const bufferWebp = await pipeline.clone().webp({ quality: 85, effort: 6 }).toBuffer();
  const bufferJpg = await pipeline.clone().jpeg({ quality: 85, mozjpeg: true }).toBuffer();

  fs.mkdirSync(path.dirname(rutaSalidaWebp), { recursive: true });
  fs.writeFileSync(rutaSalidaWebp, bufferWebp);
  fs.writeFileSync(rutaSalidaJpg, bufferJpg);

  return { sizeWebp: bufferWebp.length, sizeJpg: bufferJpg.length };
}

// 4. Función Principal
async function main() {
  console.log("\n========================================================");
  console.log("   PaDónde — Clasificador Inteligente con Gemini Vision");
  console.log("   Asignación Automática de Fotos de Habitaciones");
  console.log("========================================================\n");

  const apiKey = obtenerGeminiKey();
  if (!apiKey) {
    console.error("❌ ERROR: No se encontró GEMINI_API_KEY en .env.local");
    process.exit(1);
  }

  // Detectar carpeta de trabajo (permite pasar argumento: npm run clasificar-fotos -- ruta-o-carpeta)
  const argCarpeta = process.argv[2];
  let carpetaOrigen = FOTOS_DIR;
  if (argCarpeta) {
    if (fs.existsSync(argCarpeta)) {
      carpetaOrigen = path.resolve(argCarpeta);
    } else if (fs.existsSync(path.resolve(FOTOS_DIR, argCarpeta))) {
      carpetaOrigen = path.resolve(FOTOS_DIR, argCarpeta);
    } else {
      carpetaOrigen = path.resolve(argCarpeta);
    }
  }

  if (!fs.existsSync(carpetaOrigen)) {
    console.error(`❌ La carpeta especificada no existe: ${carpetaOrigen}`);
    process.exit(1);
  }

  // Buscar archivos de imagen válidos
  const archivos = fs.readdirSync(carpetaOrigen).filter((f) => {
    const ext = path.extname(f).toLowerCase();
    const full = path.join(carpetaOrigen, f);
    return fs.statSync(full).isFile() && [".jpg", ".jpeg", ".png", ".webp"].includes(ext);
  });

  if (archivos.length === 0) {
    console.log(`ℹ️  No se encontraron imágenes en: ${carpetaOrigen}`);
    console.log(`💡 Coloca las fotos descargadas de Booking/Airbnb en la carpeta "fotos_pendientes/"`);
    console.log(`   y opcionalmente agrega un archivo "hospedaje.txt" con la descripción y habitaciones.`);
    return;
  }

  console.log(`📸 Encontradas ${archivos.length} fotos en: ${path.relative(PROJECT_DIR, carpetaOrigen)}`);

  // Buscar contexto textual (hospedaje.txt o descripcion.txt)
  let textoContexto = "";
  const posiblesTextos = ["hospedaje.txt", "descripcion.txt", "texto.txt", "booking.txt"];
  for (const t of posiblesTextos) {
    const rutaT = path.join(carpetaOrigen, t);
    if (fs.existsSync(rutaT)) {
      textoContexto = fs.readFileSync(rutaT, "utf8");
      console.log(`📄 Contexto cargado desde: ${t}`);
      break;
    }
  }

  if (!textoContexto) {
    console.log("⚠️  No se encontró archivo de texto descriptivo. Se usará clasificación heurística por defecto.");
    textoContexto = "Hospedaje ecológico en la Sierra Nevada con habitaciones privadas y áreas comunes.";
  }

  console.log("\n⚡ Generando miniaturas en memoria para análisis de visión...");
  const imagenesParaGemini = [];
  for (let i = 0; i < archivos.length; i++) {
    const nombre = archivos[i];
    const ruta = path.join(carpetaOrigen, nombre);
    try {
      const b64 = await generarMiniaturaBase64(ruta);
      imagenesParaGemini.push({
        nombre,
        b64,
        indice: i + 1,
      });
      process.stdout.write(`  [${i + 1}/${archivos.length}] Minimizada: ${nombre}\r`);
    } catch (e) {
      console.warn(`\n  ⚠️  No se pudo leer la miniatura de ${nombre}:`, e.message);
    }
  }
  console.log(`\n✅ ${imagenesParaGemini.length} miniaturas listas.`);

  console.log("\n🧠 Analizando fotos con Google Gemini Vision (gemini-3.5-flash-lite)...");

  const promptTexto = `Eres el editor visual y fotógrafo de arquitectura hotelera de "PaDónde", plataforma de hospedajes en la Sierra Nevada de Santa Marta (Minca y Mendihuaca, Colombia).

A continuación tienes un lote de ${imagenesParaGemini.length} fotos correspondientes a un hospedaje.
Contexto descriptivo y habitaciones del hospedaje:
"""
${textoContexto}
"""

Instrucciones de clasificación determinística:
1. Analiza minuciosamente cada foto numerada (por su número de índice):
   - ¿Es "area_comun" (fachada, piscina, restaurante, recepción, jardín, colibríes, sendero, vista panorámica)?
   - ¿O es "habitacion" (muestra una cama, baño de habitación, balcón privado, camarote, litera)?
2. Si es "area_comun":
   - Indica qué tipo específico es (piscina, fachada, restaurante, jardin, vista, etc.).
   - Evalúa si es la mejor candidata para ser la "portada_principal" del hospedaje (debe ser muy atractiva, luminosa, representativa).
3. Si es "habitacion":
   - Determina con exactitud a qué habitación corresponde según el texto suministrado (ej: "Habitación Deluxe Vista al Mar", "Habitación Doble Estándar", "Cabaña Familiar").
   - Explica brevemente la razón visual (ej: "Muestra cama king con balcón de madera y vista a la bahía").
   - Asigna un orden_visual (1 = foto principal de esa habitación, 2 = detalle/baño, etc.).
4. Responde ÚNICAMENTE en JSON válido sin texto adicional:
{
  "nombre_hospedaje": "Nombre del lugar",
  "portada_sugerida": "nombre_de_archivo.jpg",
  "areas_comunes": [
    {
      "archivo": "nombre_de_archivo.jpg",
      "tipo": "piscina" | "fachada" | "restaurante" | "jardin" | "vista" | "otro",
      "descripcion": "Breve descripción visual",
      "es_portada": false
    }
  ],
  "habitaciones": [
    {
      "habitacion_nombre": "Nombre de la habitación",
      "habitacion_slug": "slug-identificador",
      "fotos": [
        {
          "archivo": "nombre_de_archivo.jpg",
          "orden_visual": 1,
          "razon_visual": "Cama doble con ventana a la selva"
        }
      ]
    }
  ]
}`;

  const parts = [{ text: promptTexto }];
  for (const img of imagenesParaGemini) {
    parts.push({ text: `\n[FOTO ${img.indice}: ${img.nombre}]` });
    parts.push({
      inline_data: {
        mime_type: "image/jpeg",
        data: img.b64,
      },
    });
  }

  const resGemini = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts }],
        generationConfig: {
          response_mime_type: "application/json",
        },
      }),
    }
  );

  if (!resGemini.ok) {
    const errText = await resGemini.text();
    console.error("❌ Error de API Gemini:", errText);
    process.exit(1);
  }

  const dataGemini = await resGemini.json();
  const rawJson = dataGemini?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!rawJson) {
    console.error("❌ Respuesta vacía de Gemini Vision.");
    process.exit(1);
  }

  let clasificacion;
  try {
    clasificacion = JSON.parse(rawJson);
  } catch (e) {
    console.error("❌ No se pudo parsear el JSON de Gemini:", rawJson);
    process.exit(1);
  }

  console.log("\n🎉 ¡Clasificación visual completada con éxito!");
  console.log(`🏨 Hospedaje detectado: ${clasificacion.nombre_hospedaje || "Hospedaje"}`);
  console.log(`🌟 Portada sugerida:    ${clasificacion.portada_sugerida}`);
  console.log(`🌿 Áreas comunes:       ${clasificacion.areas_comunes?.length || 0} fotos`);
  console.log(`🛌 Habitaciones:        ${clasificacion.habitaciones?.length || 0} tipos detectados:`);

  clasificacion.habitaciones?.forEach((hab) => {
    console.log(`   • ${hab.habitacion_nombre}: ${hab.fotos?.length || 0} fotos asignadas`);
    hab.fotos?.forEach((f) => {
      console.log(`     - [${f.archivo}] ➔ ${f.razon_visual}`);
    });
  });

  // 5. Aplicar Pipeline Editorial y guardar organizadas
  console.log("\n🎨 Procesando imágenes con Sharp (Corte 4:3, CLAHE, WebP 1200x900)...");
  const hospedajeSlug = slugify(clasificacion.nombre_hospedaje || "hospedaje");
  const carpetaSalidaBase = path.join(FOTOS_DIR, "organizadas", hospedajeSlug);
  const carpetaPublic = path.join(PROJECT_DIR, "public", "optimized_hospedajes", hospedajeSlug);

  const fotosMapeadas = {
    hospedaje: clasificacion.nombre_hospedaje,
    portada_url: "",
    habitaciones: [],
  };

  // Portada y Áreas Comunes
  if (clasificacion.portada_sugerida) {
    const rutaIn = path.join(carpetaOrigen, clasificacion.portada_sugerida);
    if (fs.existsSync(rutaIn)) {
      const outWebp = path.join(carpetaSalidaBase, "portada", "portada-principal.webp");
      const outJpg = path.join(carpetaSalidaBase, "portada", "portada-principal.jpg");
      const pubWebp = path.join(carpetaPublic, "portada-principal.webp");
      const pubJpg = path.join(carpetaPublic, "portada-principal.jpg");

      await procesarImagenEditorial(rutaIn, outWebp, outJpg);
      await procesarImagenEditorial(rutaIn, pubWebp, pubJpg);
      fotosMapeadas.portada_url = `/optimized_hospedajes/${hospedajeSlug}/portada-principal.webp`;
      console.log(`  🌟 Portada optimizada: ${clasificacion.portada_sugerida} ➔ portada-principal.webp`);
    }
  }

  // Áreas comunes
  for (const ac of clasificacion.areas_comunes || []) {
    const rutaIn = path.join(carpetaOrigen, ac.archivo);
    if (fs.existsSync(rutaIn)) {
      const slugFoto = slugify(`${ac.tipo}-${path.parse(ac.archivo).name}`);
      const outWebp = path.join(carpetaSalidaBase, "areas_comunes", `${slugFoto}.webp`);
      const outJpg = path.join(carpetaSalidaBase, "areas_comunes", `${slugFoto}.jpg`);
      const pubWebp = path.join(carpetaPublic, "areas_comunes", `${slugFoto}.webp`);
      const pubJpg = path.join(carpetaPublic, "areas_comunes", `${slugFoto}.jpg`);

      await procesarImagenEditorial(rutaIn, outWebp, outJpg);
      await procesarImagenEditorial(rutaIn, pubWebp, pubJpg);
      console.log(`  🌿 Área común (${ac.tipo}): ${ac.archivo} ➔ ${slugFoto}.webp`);
    }
  }

  // Habitaciones
  for (const hab of clasificacion.habitaciones || []) {
    const habSlug = slugify(hab.habitacion_nombre || "habitacion");
    const listaUrls = [];

    for (let fIdx = 0; fIdx < (hab.fotos || []).length; fIdx++) {
      const foto = hab.fotos[fIdx];
      const rutaIn = path.join(carpetaOrigen, foto.archivo);
      if (fs.existsSync(rutaIn)) {
        const slugFoto = `${habSlug}-${fIdx + 1}`;
        const outWebp = path.join(carpetaSalidaBase, "habitaciones", habSlug, `${slugFoto}.webp`);
        const outJpg = path.join(carpetaSalidaBase, "habitaciones", habSlug, `${slugFoto}.jpg`);
        const pubWebp = path.join(carpetaPublic, "habitaciones", habSlug, `${slugFoto}.webp`);
        const pubJpg = path.join(carpetaPublic, "habitaciones", habSlug, `${slugFoto}.jpg`);

        await procesarImagenEditorial(rutaIn, outWebp, outJpg);
        await procesarImagenEditorial(rutaIn, pubWebp, pubJpg);

        const urlWeb = `/optimized_hospedajes/${hospedajeSlug}/habitaciones/${habSlug}/${slugFoto}.webp`;
        listaUrls.push(urlWeb);
        console.log(`  🛌 [${hab.habitacion_nombre}]: ${foto.archivo} ➔ ${slugFoto}.webp`);
      }
    }

    fotosMapeadas.habitaciones.push({
      titulo: hab.habitacion_nombre,
      slug: habSlug,
      fotos: listaUrls,
    });
  }

  // Guardar archivo JSON estructurado para el Admin de PaDónde
  const rutaJson = path.join(carpetaSalidaBase, "metadata_fotos_asignadas.json");
  fs.writeFileSync(rutaJson, JSON.stringify(fotosMapeadas, null, 2), "utf8");

  console.log("\n========================================================");
  console.log("✅ PROCESO COMPLETADO AL 100%");
  console.log("========================================================");
  console.log(`📂 Fotos organizadas en:  ${path.relative(PROJECT_DIR, carpetaSalidaBase)}`);
  console.log(`🌐 Fotos públicas listas: ${path.relative(PROJECT_DIR, carpetaPublic)}`);
  console.log(`📋 JSON de mapeo:         ${path.relative(PROJECT_DIR, rutaJson)}`);
  console.log("========================================================\n");
}

main().catch((err) => {
  console.error("❌ Error inesperado durante la ejecución:", err);
  process.exit(1);
});
