import sharp from "sharp";
import { resolve } from "path";

const SOURCE_ICON = resolve("public/iconos/Pa_Donde_512_C.png");
const BACKGROUND_COLOR = "#1B382B"; // Verde bosque profundo oficial de PaDónde

async function generateOpaqueIcon({ size, targetPercent = 0.74, outputPath }) {
  const innerSize = Math.round(size * targetPercent);

  // 1. Recortar bordes transparentes y redimensionar isotipo al porcentaje objetivo (área segura)
  const trimmedArtwork = await sharp(SOURCE_ICON)
    .trim()
    .resize(innerSize, innerSize, { fit: "contain" })
    .toBuffer();

  // 2. Crear lienzo sólido cuadrado RGB (sin canal alfa)
  const solidBg = await sharp({
    create: {
      width: size,
      height: size,
      channels: 3,
      background: BACKGROUND_COLOR,
    },
  })
    .png()
    .toBuffer();

  // 3. Superponer isotipo centrado, aplanar contra el color de fondo y remover canal alfa
  await sharp(solidBg)
    .composite([
      {
        input: trimmedArtwork,
        gravity: "center",
      },
    ])
    .flatten({ background: BACKGROUND_COLOR })
    .removeAlpha()
    .png({ compressionLevel: 9 })
    .toFile(outputPath);

  const meta = await sharp(outputPath).metadata();
  console.log(`✓ Generado: ${outputPath}`);
  console.log(`  Dimensiones: ${meta.width}x${meta.height} px | Canales: ${meta.channels} (hasAlpha: ${meta.hasAlpha}) | Color: ${meta.space}`);
}

async function main() {
  console.log("🌿 Generando íconos PWA opacos oficiales (RGB sin canal alfa)...");

  // 1. Apple Touch Icon para iOS (180x180 px - 100% opaco para evitar esquinas negras en iPhone)
  await generateOpaqueIcon({
    size: 180,
    targetPercent: 0.74, // ~133px dentro de 180px (respeta safe-zone del squircle de iOS)
    outputPath: resolve("public/apple-touch-icon.png"),
  });

  // 2. Ícono 192x192 px (Android PWA + retrocompatibilidad)
  await generateOpaqueIcon({
    size: 192,
    targetPercent: 0.74, // ~142px dentro de 192px (apto para maskable & any)
    outputPath: resolve("public/icon-192x192.png"),
  });

  await generateOpaqueIcon({
    size: 192,
    targetPercent: 0.74,
    outputPath: resolve("public/icon-192.png"),
  });

  // 3. Ícono 512x512 px (Android PWA / Splash / Maskable + retrocompatibilidad)
  await generateOpaqueIcon({
    size: 512,
    targetPercent: 0.74, // ~380px dentro de 512px
    outputPath: resolve("public/icon-512x512.png"),
  });

  await generateOpaqueIcon({
    size: 512,
    targetPercent: 0.74,
    outputPath: resolve("public/icon-512.png"),
  });

  console.log("\n✨ Todos los íconos PWA fueron regenerados y optimizados con éxito.");
}

main().catch((err) => {
  console.error("Error al generar íconos:", err);
  process.exit(1);
});
