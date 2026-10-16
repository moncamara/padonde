#!/usr/bin/env node
// 🌿 PaDónde - Optimizador Automático de Fotos para Eventos y Aliados
// Lee imágenes desde ~/Downloads/fotosHoy, las convierte a WebP ultraligero
// y las deja listas en ~/Downloads/fotosHoy/optimizadas y en public/optimized_events

import fs from "fs";
import path from "path";
import os from "os";
import sharp from "sharp";

const HOME_DIR = os.homedir();
const INPUT_DIR = path.join(HOME_DIR, "Downloads", "fotosHoy");
const OUTPUT_DIR_DOWNLOADS = path.join(INPUT_DIR, "optimizadas");
const OUTPUT_DIR_PROJECT = path.join(process.cwd(), "public", "optimized_events");

// Extensiones de imagen soportadas
const VALID_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp", ".heic", ".tiff", ".bmp"]);

function limpiarNombreArchivo(nombreOriginal) {
  const sinExtension = path.parse(nombreOriginal).name;
  return sinExtension
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Quitar tildes
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-") // Reemplazar espacios y símbolos por guiones
    .replace(/^-+|-+$/g, ""); // Quitar guiones al inicio y final
}

function formatearBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

async function optimizarFotos() {
  console.log("\n🌿 ==========================================");
  console.log("   PaDónde — Optimizador Automático de Fotos");
  console.log("==========================================\n");

  // 1. Asegurar directorios
  if (!fs.existsSync(INPUT_DIR)) {
    fs.mkdirSync(INPUT_DIR, { recursive: true });
  }
  if (!fs.existsSync(OUTPUT_DIR_DOWNLOADS)) {
    fs.mkdirSync(OUTPUT_DIR_DOWNLOADS, { recursive: true });
  }
  if (!fs.existsSync(OUTPUT_DIR_PROJECT)) {
    fs.mkdirSync(OUTPUT_DIR_PROJECT, { recursive: true });
  }

  // 2. Leer archivos en fotosHoy
  const archivos = fs.readdirSync(INPUT_DIR).filter((archivo) => {
    const ext = path.extname(archivo).toLowerCase();
    const esArchivo = fs.statSync(path.join(INPUT_DIR, archivo)).isFile();
    return esArchivo && VALID_EXTENSIONS.has(ext);
  });

  if (archivos.length === 0) {
    console.log(`📁 La carpeta está lista en:`);
    console.log(`   ${INPUT_DIR}`);
    console.log("\n⚠️  No hay fotos para optimizar todavía.");
    console.log("👉 Guarda las fotos que te envíen los aliados allí y vuelve a correr:");
    console.log("   npm run optimizar-fotos\n");
    return;
  }

  console.log(`🔍 Se encontraron ${archivos.length} foto(s) en ~/Downloads/fotosHoy:\n`);

  let procesadas = 0;

  for (const archivo of archivos) {
    const rutaEntrada = path.join(INPUT_DIR, archivo);
    const nombreLimpio = limpiarNombreArchivo(archivo);
    const nombreWebp = `${nombreLimpio || "evento"}.webp`;
    const rutaSalidaDownloads = path.join(OUTPUT_DIR_DOWNLOADS, nombreWebp);
    const rutaSalidaProject = path.join(OUTPUT_DIR_PROJECT, nombreWebp);

    const statEntrada = fs.statSync(rutaEntrada);
    const tamanoOriginal = statEntrada.size;

    try {
      // Proceso con sharp: orientación auto, max 1200x900, WebP 80% calidad
      const bufferOptimizado = await sharp(rutaEntrada)
        .rotate() // Respeta orientación del celular
        .resize(1200, 900, {
          fit: "inside",
          withoutEnlargement: true,
        })
        .webp({ quality: 80, effort: 5 })
        .toBuffer();

      // Guardar en Downloads/fotosHoy/optimizadas
      fs.writeFileSync(rutaSalidaDownloads, bufferOptimizado);

      // Guardar copia directa en public/optimized_events del proyecto
      fs.writeFileSync(rutaSalidaProject, bufferOptimizado);

      const tamanoOptimizado = bufferOptimizado.length;
      const reduccion = (((tamanoOriginal - tamanoOptimizado) / tamanoOriginal) * 100).toFixed(1);

      console.log(`✅ [${archivo}]`);
      console.log(`   ➔ Nombre web:   ${nombreWebp}`);
      console.log(`   ➔ Peso inicial: ${formatearBytes(tamanoOriginal)}`);
      console.log(`   ➔ Peso optim:   ${formatearBytes(tamanoOptimizado)} (Ahorro del ${reduccion}%)`);
      console.log(`   ➔ Guardado en:  ~/Downloads/fotosHoy/optimizadas/${nombreWebp}`);
      console.log(`                   public/optimized_events/${nombreWebp}\n`);

      procesadas++;
    } catch (err) {
      console.error(`❌ Error al procesar "${archivo}":`, err.message, "\n");
    }
  }

  console.log("==========================================");
  console.log(`🎉 ¡Listo! ${procesadas} foto(s) optimizadas a formato WebP ultra-rápido.`);
  console.log("💡 Ya están listas para usar en la cartelera sin gastar créditos de IA.\n");
}

optimizarFotos().catch((err) => {
  console.error("Error fatal en el optimizador:", err);
});
