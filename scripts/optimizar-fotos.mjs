#!/usr/bin/env node
// 🌿 PaDónde - Optimizador Automático de Fotos para Eventos y Aliados
// Lee imágenes prioritariamente desde ./fotos_pendientes (dentro del proyecto)
// o desde ~/Downloads/fotosHoy (retrocompatible), las convierte a WebP ultraligero
// y las deja listas en fotos_pendientes/optimizadas y en public/optimized_events

import fs from "fs";
import path from "path";
import os from "os";
import { execSync } from "child_process";
import sharp from "sharp";

const HOME_DIR = os.homedir();
const PROJECT_DIR = process.cwd();

// Directorio principal (dentro del proyecto, sin permisos externos de macOS)
const LOCAL_INPUT_DIR = path.join(PROJECT_DIR, "fotos_pendientes");
const LOCAL_OUTPUT_DIR = path.join(LOCAL_INPUT_DIR, "optimizadas");

// Directorio secundario / retrocompatible en Descargas
const DOWNLOADS_INPUT_DIR = path.join(HOME_DIR, "Downloads", "fotosHoy");
const DOWNLOADS_OUTPUT_DIR = path.join(DOWNLOADS_INPUT_DIR, "optimizadas");

// Destino web listo para producción
const PUBLIC_EVENTS_DIR = path.join(PROJECT_DIR, "public", "optimized_events");

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

function obtenerArchivosValidos(dir) {
  if (!fs.existsSync(dir)) return [];
  try {
    return fs.readdirSync(dir).filter((archivo) => {
      const ext = path.extname(archivo).toLowerCase();
      const rutaCompleta = path.join(dir, archivo);
      try {
        const esArchivo = fs.statSync(rutaCompleta).isFile();
        return esArchivo && VALID_EXTENSIONS.has(ext);
      } catch {
        return false;
      }
    });
  } catch {
    return [];
  }
}

async function optimizarFotos() {
  console.log("\n🌿 ==========================================");
  console.log("   PaDónde — Optimizador Automático de Fotos");
  console.log("==========================================\n");

  // 1. Asegurar directorios
  if (!fs.existsSync(LOCAL_INPUT_DIR)) fs.mkdirSync(LOCAL_INPUT_DIR, { recursive: true });
  if (!fs.existsSync(LOCAL_OUTPUT_DIR)) fs.mkdirSync(LOCAL_OUTPUT_DIR, { recursive: true });
  if (!fs.existsSync(PUBLIC_EVENTS_DIR)) fs.mkdirSync(PUBLIC_EVENTS_DIR, { recursive: true });

  // 2. Buscar fotos primero en fotos_pendientes (local)
  const archivosLocales = obtenerArchivosValidos(LOCAL_INPUT_DIR);
  const archivosDownloads = obtenerArchivosValidos(DOWNLOADS_INPUT_DIR);

  const tareas = [];
  for (const archivo of archivosLocales) {
    tareas.push({
      archivo,
      rutaEntrada: path.join(LOCAL_INPUT_DIR, archivo),
      salidaCopia: path.join(LOCAL_OUTPUT_DIR, `${limpiarNombreArchivo(archivo) || "evento"}.webp`),
      origen: "fotos_pendientes (local)",
    });
  }

  for (const archivo of archivosDownloads) {
    // Evitar procesar duplicados si ya está en local
    if (!tareas.some((t) => t.archivo === archivo)) {
      tareas.push({
        archivo,
        rutaEntrada: path.join(DOWNLOADS_INPUT_DIR, archivo),
        salidaCopia: path.join(DOWNLOADS_OUTPUT_DIR, `${limpiarNombreArchivo(archivo) || "evento"}.webp`),
        origen: "~/Downloads/fotosHoy",
      });
    }
  }

  if (tareas.length === 0) {
    console.log(`📁 Carpeta local lista en el proyecto:`);
    console.log(`   ${LOCAL_INPUT_DIR}\n`);
    console.log("⚠️  No hay fotos para optimizar todavía.");
    console.log("👉 Guarda las fotos en 'fotos_pendientes' y vuelve a correr:");
    console.log("   npm run optimizar-fotos\n");
    return;
  }

  console.log(`🔍 Se encontraron ${tareas.length} foto(s) para optimizar:\n`);

  let procesadas = 0;

  for (const { archivo, rutaEntrada, salidaCopia, origen } of tareas) {
    const nombreLimpio = limpiarNombreArchivo(archivo);
    const nombreWebp = `${nombreLimpio || "evento"}.webp`;
    const rutaSalidaProject = path.join(PUBLIC_EVENTS_DIR, nombreWebp);

    const statEntrada = fs.statSync(rutaEntrada);
    const tamanoOriginal = statEntrada.size;

    let rutaParaSharp = rutaEntrada;
    let tempJpgParaBorrar = null;

    try {
      const ext = path.extname(archivo).toLowerCase();
      if (ext === ".heic") {
        tempJpgParaBorrar = path.join(os.tmpdir(), `temp_${Date.now()}_${nombreLimpio}.jpg`);
        execSync(`sips -s format jpeg "${rutaEntrada}" --out "${tempJpgParaBorrar}"`, {
          stdio: "ignore",
        });
        rutaParaSharp = tempJpgParaBorrar;
      }

      // Proceso con sharp: orientación auto, max 1200x900, WebP 80% calidad
      const bufferOptimizado = await sharp(rutaParaSharp)
        .rotate() // Respeta orientación del celular
        .resize(1200, 900, {
          fit: "inside",
          withoutEnlargement: true,
        })
        .webp({ quality: 80, effort: 5 })
        .toBuffer();

      // Guardar copia en la carpeta de optimizadas correspondiente
      const dirSalidaCopia = path.dirname(salidaCopia);
      if (!fs.existsSync(dirSalidaCopia)) fs.mkdirSync(dirSalidaCopia, { recursive: true });
      fs.writeFileSync(salidaCopia, bufferOptimizado);

      // Guardar copia directa en public/optimized_events del proyecto
      fs.writeFileSync(rutaSalidaProject, bufferOptimizado);

      const tamanoOptimizado = bufferOptimizado.length;
      const reduccion = (((tamanoOriginal - tamanoOptimizado) / tamanoOriginal) * 100).toFixed(1);

      console.log(`✅ [${archivo}] (de ${origen})`);
      console.log(`   ➔ Nombre web:   ${nombreWebp}`);
      console.log(`   ➔ Peso inicial: ${formatearBytes(tamanoOriginal)}`);
      console.log(`   ➔ Peso optim:   ${formatearBytes(tamanoOptimizado)} (Ahorro del ${reduccion}%)`);
      console.log(`   ➔ Guardado en:  ${salidaCopia}`);
      console.log(`                   public/optimized_events/${nombreWebp}\n`);

      procesadas++;
    } catch (err) {
      console.error(`❌ Error al procesar "${archivo}":`, err.message, "\n");
    } finally {
      if (tempJpgParaBorrar && fs.existsSync(tempJpgParaBorrar)) {
        try {
          fs.unlinkSync(tempJpgParaBorrar);
        } catch {}
      }
    }
  }

  console.log("==========================================");
  console.log(`🎉 ¡Listo! ${procesadas} foto(s) optimizadas a formato WebP ultra-rápido.`);
  console.log("💡 Ya están listas para usar en la cartelera sin gastar créditos de IA.\n");
}

optimizarFotos().catch((err) => {
  console.error("Error fatal en el optimizador:", err);
});
