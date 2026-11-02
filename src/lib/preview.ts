/**
 * 👁️ Vista previa LOCAL de destinos en preparación (ej. Tayrona, Taganga).
 *
 * Permite abrir /es/tayrona o /es/taganga en `npm run dev` antes del lanzamiento oficial,
 * sin que estas zonas sean visibles para los turistas en producción.
 *
 * Triple candado:
 *  1. Solo funciona en modo desarrollo (`next dev`). En `next build` / Vercel siempre es false,
 *     así que la arquitectura estática ISR (● SSG) de producción no se altera.
 *  2. Requiere la variable `PREVIEW_ZONAS=tayrona,taganga` en `.env.local` (no se sube a Vercel).
 *  3. Los datos de zonas inactivas se leen con la sesión de admin (RLS "authenticated"),
 *     por lo que debes haber iniciado sesión en /admin en el mismo navegador.
 */
export function esZonaEnPreview(slug: string): boolean {
  if (process.env.NODE_ENV !== "development") return false;
  if (process.env.VERCEL_ENV) return false;

  const lista = (process.env.PREVIEW_ZONAS || "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);

  const normalizado = slug === "tairona" ? "tayrona" : slug;
  return lista.includes(normalizado);
}
