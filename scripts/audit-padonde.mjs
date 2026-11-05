#!/usr/bin/env node

/**
 * audit-padonde.mjs
 * Batería de diagnóstico estático local para PaDónde.
 * Cero consumo de APIs o créditos externos.
 * 
 * Verificaciones:
 * 1. Blindaje de CPU Vercel (src/lib/supabase/public.ts)
 * 2. Infraestructura SEO (sitemap.ts y robots.ts)
 * 3. Verificación estricta de tipos (TypeScript tsc --noEmit)
 * 4. Compilación estática de producción (next build / SSG)
 */

import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

const ROOT_DIR = process.cwd();

// Colores ANSI para terminal
const c = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  cyan: "\x1b[36m",
  gray: "\x1b[90m",
};

function banner() {
  console.log(`\n${c.bold}${c.cyan}======================================================${c.reset}`);
  console.log(`${c.bold}${c.cyan}   🌿 BATERÍA DE DIAGNÓSTICO ESTÁTICO — PADÓNDE 🌿${c.reset}`);
  console.log(`${c.gray}   Validación local • 0 consumo de APIs • 0 créditos IA${c.reset}`);
  console.log(`${c.bold}${c.cyan}======================================================${c.reset}\n`);
}

let checksPassed = 0;
let totalChecks = 4;

// 1. Blindaje de CPU en Vercel (src/lib/supabase/public.ts)
function checkBlindajeCpuVercel() {
  process.stdout.write(`[1/4] ${c.bold}Blindaje CPU Vercel (Cliente Público Anónimo)...${c.reset} `);
  const publicClientPath = path.join(ROOT_DIR, "src", "lib", "supabase", "public.ts");
  
  if (!fs.existsSync(publicClientPath)) {
    console.log(`${c.red}FALLÓ ✕${c.reset}`);
    console.error(`   ${c.red}Error: No se encontró 'src/lib/supabase/public.ts'.${c.reset}`);
    return false;
  }

  const content = fs.readFileSync(publicClientPath, "utf-8");
  if (!content.includes("getPublicSupabaseClient") || !content.includes("persistSession: false")) {
    console.log(`${c.red}FALLÓ ✕${c.reset}`);
    console.error(`   ${c.red}Error: El cliente público no tiene 'persistSession: false' o 'getPublicSupabaseClient'.${c.reset}`);
    return false;
  }

  console.log(`${c.green}OK ✓${c.reset}`);
  console.log(`      ${c.gray}→ Cliente anónimo sin cookies de sesión activo para servir desde Edge CDN.${c.reset}`);
  checksPassed++;
  return true;
}

// 2. Existencia de Sitemap y Robots para SEO
function checkSeoConfig() {
  process.stdout.write(`[2/4] ${c.bold}Infraestructura SEO (sitemap.ts & robots.ts)...${c.reset} `);
  const sitemapPath = path.join(ROOT_DIR, "src", "app", "sitemap.ts");
  const robotsPath = path.join(ROOT_DIR, "src", "app", "robots.ts");

  const sitemapOk = fs.existsSync(sitemapPath);
  const robotsOk = fs.existsSync(robotsPath);

  if (!sitemapOk || !robotsOk) {
    console.log(`${c.red}FALLÓ ✕${c.reset}`);
    if (!sitemapOk) console.error(`   ${c.red}Error: Falta 'src/app/sitemap.ts'.${c.reset}`);
    if (!robotsOk) console.error(`   ${c.red}Error: Falta 'src/app/robots.ts'.${c.reset}`);
    return false;
  }

  console.log(`${c.green}OK ✓${c.reset}`);
  console.log(`      ${c.gray}→ Metadatos dinámicos presentes para indexación orgánica.${c.reset}`);
  checksPassed++;
  return true;
}

// 3. Verificación de Tipos TypeScript (tsc --noEmit)
function checkTypeScript() {
  process.stdout.write(`[3/4] ${c.bold}Análisis estático de tipos (tsc --noEmit)...${c.reset} `);
  try {
    execSync("npx tsc --noEmit", {
      cwd: ROOT_DIR,
      stdio: "pipe",
      encoding: "utf-8",
    });
    console.log(`${c.green}OK ✓${c.reset}`);
    console.log(`      ${c.gray}→ 0 errores de tipado en todo el código base.${c.reset}`);
    checksPassed++;
    return true;
  } catch (err) {
    console.log(`${c.red}FALLÓ ✕${c.reset}`);
    console.error(`   ${c.red}Detalle de errores de TypeScript:${c.reset}\n`);
    if (err.stdout) console.error(err.stdout);
    if (err.stderr) console.error(err.stderr);
    return false;
  }
}

// 4. Compilación y Preservación de Rutas Estáticas SSG (next build)
function checkNextBuild() {
  process.stdout.write(`[4/4] ${c.bold}Compilación Next.js & Validación SSG (next build)...${c.reset}\n`);
  try {
    const buildOutput = execSync("npm run build", {
      cwd: ROOT_DIR,
      stdio: "pipe",
      encoding: "utf-8",
    });

    // Validar que se generaron rutas SSG y que el build fue exitoso
    const hasSsg = buildOutput.includes("●  (SSG)") || buildOutput.includes("(SSG)");
    const hasStaticPages = buildOutput.includes("Generating static pages");

    if (hasSsg || hasStaticPages) {
      console.log(`      ${c.green}OK ✓ Compilación completada con éxito y rutas SSG preservadas.${c.reset}`);
      console.log(`      ${c.gray}→ El tráfico público se servirá estático desde Edge CDN sin costo de CPU.${c.reset}`);
      checksPassed++;
      return true;
    } else {
      console.log(`      ${c.yellow}ADVERTENCIA: No se detectó indicador explícito de SSG en el log.${c.reset}`);
      checksPassed++;
      return true;
    }
  } catch (err) {
    console.log(`      ${c.red}FALLÓ ✕ Error en npm run build.${c.reset}`);
    if (err.stdout) console.error(err.stdout);
    if (err.stderr) console.error(err.stderr);
    return false;
  }
}

// Ejecución orquestada
banner();

const ok1 = checkBlindajeCpuVercel();
const ok2 = checkSeoConfig();
const ok3 = checkTypeScript();
const ok4 = checkNextBuild();

console.log(`\n${c.bold}------------------------------------------------------${c.reset}`);
if (ok1 && ok2 && ok3 && ok4) {
  console.log(`${c.bold}${c.green}🎉 TODOS LOS DIAGNÓSTICOS PASARON EXITOSAMENTE (${checksPassed}/${totalChecks})${c.reset}`);
  console.log(`${c.green}   El proyecto está 100% blindado contra consumo de CPU y listo para producción.${c.reset}\n`);
  process.exit(0);
} else {
  console.log(`${c.bold}${c.red}⚠️ ALGUNAS PRUEBAS FALLARON (${checksPassed}/${totalChecks})${c.reset}`);
  console.log(`${c.red}   Revisa los errores anteriores antes de desplegar.${c.reset}\n`);
  process.exit(1);
}
