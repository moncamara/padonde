import sharp from "sharp";
import { resolve } from "path";

const TASKS = [
  {
    src: resolve("public/iconos/Pa_Donde_180_C.png"),
    dest: resolve("public/apple-touch-icon.png"),
    name: "Apple Touch Icon (iOS Safari)",
  },
  {
    src: resolve("public/iconos/icon-192.png"),
    dest: resolve("public/icon-192x192.png"),
    name: "Icon 192x192 (Android PWA)",
  },
  {
    src: resolve("public/iconos/icon-192.png"),
    dest: resolve("public/icon-192.png"),
    name: "Icon 192 (Retrocompatibilidad)",
  },
  {
    src: resolve("public/iconos/icon-512.png"),
    dest: resolve("public/icon-512x512.png"),
    name: "Icon 512x512 (Android Splash / Maskable)",
  },
  {
    src: resolve("public/iconos/icon-512.png"),
    dest: resolve("public/icon-512.png"),
    name: "Icon 512 (Retrocompatibilidad)",
  },
];

async function main() {
  console.log("🌿 Sincronizando íconos oficiales desde /public/iconos hacia la raíz de /public...");

  for (const item of TASKS) {
    await sharp(item.src)
      .removeAlpha()
      .png({ compressionLevel: 9 })
      .toFile(item.dest);

    const meta = await sharp(item.dest).metadata();
    console.log(
      `✓ ${item.name} -> ${item.dest.split("/").pop()} [${meta.width}x${meta.height} px, canales: ${meta.channels}, hasAlpha: ${meta.hasAlpha}]`
    );
  }

  console.log("\n✨ Todos los íconos fueron sincronizados como PNGs RGB 100% opacos sin canal alfa.");
}

main().catch((err) => {
  console.error("Error sincronizando íconos:", err);
  process.exit(1);
});
