import type { MetadataRoute } from "next";
import { supabase } from "@/lib/supabase/client";
import { routing } from "@/i18n/routing";
import { ZONAS } from "@/constants";

export const revalidate = 3600; // Revalidar sitemap cada 1 hora

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://www.padonde.lat";
  const now = new Date();

  const entries: MetadataRoute.Sitemap = [];

  // 1. Home / Raíz con alternates de idioma
  entries.push({
    url: `${baseUrl}/es`,
    lastModified: now,
    changeFrequency: "daily",
    priority: 1.0,
    alternates: {
      languages: {
        es: `${baseUrl}/es`,
        en: `${baseUrl}/en`,
        fr: `${baseUrl}/fr`,
      },
    },
  });

  // 2. Páginas de Zonas (Minca, etc.)
  for (const zona of ZONAS.filter((z) => z.activa)) {
    for (const locale of routing.locales) {
      entries.push({
        url: `${baseUrl}/${locale}/${zona.slug}`,
        lastModified: now,
        changeFrequency: "hourly",
        priority: 0.9,
        alternates: {
          languages: Object.fromEntries(
            routing.locales.map((l) => [l, `${baseUrl}/${l}/${zona.slug}`])
          ),
        },
      });
    }
  }

  // 3. Eventos individuales activos en Supabase
  try {
    const { data: eventos } = await supabase
      .from("eventos")
      .select(`
        id,
        created_at,
        zona:zonas (slug)
      `)
      .eq("activo", true);

    if (eventos && eventos.length > 0) {
      for (const ev of eventos) {
        const zonaSlug = (ev.zona as any)?.slug || "minca";
        for (const locale of routing.locales) {
          entries.push({
            url: `${baseUrl}/${locale}/${zonaSlug}/${ev.id}`,
            lastModified: ev.created_at ? new Date(ev.created_at) : now,
            changeFrequency: "daily",
            priority: 0.8,
            alternates: {
              languages: Object.fromEntries(
                routing.locales.map((l) => [l, `${baseUrl}/${l}/${zonaSlug}/${ev.id}`])
              ),
            },
          });
        }
      }
    }
  } catch (err) {
    console.warn("No se pudieron cargar eventos dinámicos para el sitemap:", err);
  }

  return entries;
}
