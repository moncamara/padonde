#!/usr/bin/env node
// 🌿 PaDónde - Procesador Editorial de Fotos para Hospedajes Rústicos & Bioconstrucción
// Diseñado para cabañas ecológicas y refugios off-grid en Minca / Sierra Nevada.
//
// Acciones que ejecuta:
// 1. Detección y recorte inteligente (elimina capturas de pantalla, pill '2/9' y ajusta a 4:3).
// 2. Corrección de luz y color editorial:
//    - CLAHE para recuperar follaje y selva en fondos quemados.
//    - Levantamiento sutil de sombras en madera, guadua y barro.
//    - Temperatura cálida acogedora y claridad en texturas rústicas.
// 3. Optimización web para móviles de montaña:
//    - Redimensión a 1200x900 (4:3) para ultrarrápida carga en redes 3G/4G.
//    - Exportación en WebP (85% calidad) y JPG compatible (85% mozjpeg).
//    - Copia directa en public/optimized_hospedajes/ para uso inmediato.

import fs from "fs";
import path from "path";
import sharp from "sharp";

const PROJECT_DIR = process.cwd();
const INPUT_DIR = path.join(PROJECT_DIR, "fotos_pendientes");
const OUTPUT_DIR = path.join(INPUT_DIR, "optimizadas");
const PUBLIC_DIR = path.join(PROJECT_DIR, "public", "optimized_hospedajes");

// Mapeo específico con encuadre editorial optimizado para las fotos de la cabaña
const FOTOS_ESPECIFICAS = {
  // 1. Habitación interior con cama y mosquitero
  "whatsapp image 2026-10-17 at 16.33.47.jpeg": {
    nombreSlug: "cabana-bioconstruccion-habitacion",
    cropTopOffsetPct: 0.11, // Recorta marco superior oscuro de la litera y equilibra piso de madera
  },
  // 2. Cocina rústica / estufa de barro
  "whatsapp image 2026-10-17 at 16.33.47 (1).jpeg": {
    nombreSlug: "cabana-bioconstruccion-cocina-rustica",
    cropTopOffsetPct: 0.10, // Mantiene la estufa de barro y camino de selva
  },
  // 3. Sala de estar en adobe con pared de botellas (Elimina badge '2/9' superior derecho)
  "whatsapp image 2026-10-17 at 16.33.47 (2).jpeg": {
    nombreSlug: "cabana-bioconstruccion-sala-adobe",
    cropTopOffsetPct: 0.13, // Elimina completamente el indicador de captura '2/9'
  },
  // 4. Fachada exterior con mural de sol
  "whatsapp image 2026-10-17 at 16.33.47 (3).jpeg": {
    nombreSlug: "cabana-bioconstruccion-fachada-mural",
    cropTopOffsetPct: 0.125, // Centra el mural de sol y el techo vegetal
  },
};

function formatearBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

async function procesarFotosHospedaje() {
  console.log("\n🌿 ========================================================");
  console.log("   PaDónde — Procesador Editorial de Fotos para Hospedajes");
  console.log("   Refugios Off-Grid & Cabañas en Bioconstrucción (Minca)");
  console.log("========================================================\n");

  if (!fs.existsSync(INPUT_DIR)) fs.mkdirSync(INPUT_DIR, { recursive: true });
  if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  if (!fs.existsSync(PUBLIC_DIR)) fs.mkdirSync(PUBLIC_DIR, { recursive: true });

  const archivos = fs.readdirSync(INPUT_DIR).filter((archivo) => {
    const ext = path.extname(archivo).toLowerCase();
    const filePath = path.join(INPUT_DIR, archivo);
    return fs.statSync(filePath).isFile() && [".jpg", ".jpeg", ".png", ".webp"].includes(ext);
  });

  if (archivos.length === 0) {
    console.log(`⚠️  No se encontraron fotos en: ${INPUT_DIR}`);
    return;
  }

  console.log(`📸 Encontradas ${archivos.length} foto(s) para tratamiento editorial...\n`);

  let count = 0;

  for (const archivo of archivos) {
    const rutaEntrada = path.join(INPUT_DIR, archivo);
    const key = archivo.toLowerCase();
    const config = FOTOS_ESPECIFICAS[key] || {
      nombreSlug: `hospedaje-${path.parse(archivo).name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
      cropTopOffsetPct: 0.10, // Por defecto corta 10% superior para quitar posibles status bars
    };

    try {
      const meta = await sharp(rutaEntrada).metadata();
      const origW = meta.width;
      const origH = meta.height;

      // Calcular encuadre a 4:3
      const targetRatio = 4 / 3;
      let cropW, cropH, cropLeft, cropTop;

      const currentRatio = origW / origH;
      if (currentRatio > targetRatio) {
        // La imagen es más ancha que 4:3 -> recortar lados
        cropH = origH;
        cropW = Math.round(origH * targetRatio);
        cropTop = 0;
        cropLeft = Math.round((origW - cropW) / 2);
      } else {
        // La imagen es más alta que 4:3 o cuadrada -> recortar arriba y abajo
        cropW = origW;
        cropH = Math.round(origW / targetRatio);
        cropLeft = 0;
        // Aplicar el offset superior para esquivar números de captura / techos redundantes
        const maxOffset = origH - cropH;
        const requestedOffset = Math.round(origH * config.cropTopOffsetPct);
        cropTop = Math.min(requestedOffset, maxOffset);
      }

      // Pipeline editorial de luz y color:
      // 1. Recorte inteligente
      // 2. Redimensionar a estándar web (1200 x 900)
      // 3. CLAHE: equilibrio dinámico entre follaje quemado y sombras de madera
      // 4. Modulate: sutil calidez (+2% brillo, +7% saturación terrosa)
      // 5. Sharpen: microcontraste orgánico para texturas de barro y guadua
      const pipelineBase = sharp(rutaEntrada)
        .rotate()
        .extract({ left: cropLeft, top: cropTop, width: cropW, height: cropH })
        .resize(1200, 900, { fit: "cover" })
        .clahe({ width: 80, height: 80, maxSlope: 2 })
        .modulate({ brightness: 1.02, saturation: 1.07 })
        .sharpen({ sigma: 1.0, m1: 0.8, m2: 2.0 });

      // Generar versión WebP (85% calidad)
      const bufferWebp = await pipelineBase.clone().webp({ quality: 85, effort: 6 }).toBuffer();
      // Generar versión JPG de alta compatibilidad (85% calidad)
      const bufferJpg = await pipelineBase.clone().jpeg({ quality: 85, mozjpeg: true }).toBuffer();

      // Guardar en fotos_pendientes/optimizadas/
      const outWebp = path.join(OUTPUT_DIR, `${config.nombreSlug}.webp`);
      const outJpg = path.join(OUTPUT_DIR, `${config.nombreSlug}.jpg`);
      fs.writeFileSync(outWebp, bufferWebp);
      fs.writeFileSync(outJpg, bufferJpg);

      // Guardar en public/optimized_hospedajes/ para uso web inmediato
      const pubWebp = path.join(PUBLIC_DIR, `${config.nombreSlug}.webp`);
      const pubJpg = path.join(PUBLIC_DIR, `${config.nombreSlug}.jpg`);
      fs.writeFileSync(pubWebp, bufferWebp);
      fs.writeFileSync(pubJpg, bufferJpg);

      const statOrig = fs.statSync(rutaEntrada);
      console.log(`✅ [${archivo}]`);
      console.log(`   ➔ Slug:          ${config.nombreSlug}`);
      console.log(`   ➔ Recorte:       ${cropW}x${cropH} (4:3, offset superior: ${cropTop}px)`);
      console.log(`   ➔ Peso original: ${formatearBytes(statOrig.size)}`);
      console.log(`   ➔ Peso WebP:     ${formatearBytes(bufferWebp.length)} (Carga ultrarrápida)`);
      console.log(`   ➔ Guardado en:   fotos_pendientes/optimizadas/${config.nombreSlug}.webp`);
      console.log(`                    public/optimized_hospedajes/${config.nombreSlug}.webp\n`);

      count++;
    } catch (err) {
      console.error(`❌ Error procesando ${archivo}:`, err.message);
    }
  }

  console.log("========================================================");
  console.log(`🎉 ¡Proceso finalizado! ${count} foto(s) tratadas con estética editorial.`);
  console.log("📁 Disponibles en WebP y JPG en:");
  console.log("   - fotos_pendientes/optimizadas/");
  console.log("   - public/optimized_hospedajes/\n");
}

procesarFotosHospedaje().catch(console.error);
