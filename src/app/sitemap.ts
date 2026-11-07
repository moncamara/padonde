import type { MetadataRoute } from "next";
import { getPublicSupabaseClient } from "@/lib/supabase/public";
import { routing } from "@/i18n/routing";
import { ZONAS, getZona } from "@/constants";
import { esEventoVigente } from "@/lib/utils";
import { getMockEventos } from "@/lib/mock/eventos";

// Revalidar sitemap cada 1 hora en Edge CDN sin costo de CPU en Vercel
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://padonde.lat";
  const now = new Date();

  const entries: MetadataRoute.Sitemap = [];

  // 1. Home / Raíz con enlaces cruzados exactos para los 4 idiomas activos
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
        de: `${baseUrl}/de`,
      },
    },
  });

  // 2. Carteleras principales de Minca y Mendihuaca en los 4 idiomas (prioridad 1.0, daily)
  const zonasActivas = ZONAS.filter((z) => z.activa);
  for (const zona of zonasActivas) {
    for (const locale of routing.locales) {
      entries.push({
        url: `${baseUrl}/${locale}/${zona.slug}`,
        lastModified: now,
        changeFrequency: "daily",
        priority: 1.0,
        alternates: {
          languages: Object.fromEntries(
            routing.locales.map((l) => [l, `${baseUrl}/${l}/${zona.slug}`])
          ),
        },
      });
    }
  }

  // 3. Fichas individuales públicas (hospedajes, comercios y eventos vigentes)
  try {
    const supabase = getPublicSupabaseClient();
    const { data: eventos, error } = await supabase
      .from("eventos")
      .select(`
        id,
        tipo,
        fecha_inicio,
        fecha_fin,
        descripcion,
        metadata_hospedaje,
        dias_recurrentes,
        es_recurrente,
        fecha_limite_vigencia,
        created_at,
        updated_at,
        activo,
        zona_id,
        zonas (slug, activa),
        negocio:negocios (activo)
      `)
      .eq("activo", true);

    const eventosAProcesar =
      !error && eventos && eventos.length > 0
        ? eventos
        : (getMockEventos() as any[]);

    for (const ev of eventosAProcesar) {
      // Descartar si el evento o su negocio están inactivos
      if (ev.activo === false) continue;
      if (ev.negocio && ev.negocio.activo === false) continue;

      const zonaSlug =
        (ev.zonas as any)?.slug ||
        (ev.zona_id === "zona-mendihuaca" ? "mendihuaca" : "minca");

      // Validar que la zona esté activa para turistas
      const zonaConfig = getZona(zonaSlug);
      if (!zonaConfig || !zonaConfig.activa) continue;

      // Descartar eventos ya vencidos (hospedajes y experiencias recurrentes siempre vigentes)
      const vigente = esEventoVigente(ev, now);
      if (!vigente) continue;

      const lastModifiedDate = ev.updated_at
        ? new Date(ev.updated_at)
        : ev.created_at
        ? new Date(ev.created_at)
        : now;

      for (const locale of routing.locales) {
        entries.push({
          url: `${baseUrl}/${locale}/${zonaSlug}/${ev.id}`,
          lastModified: lastModifiedDate,
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
  } catch (err) {
    console.warn("[sitemap] No se pudieron cargar eventos dinámicos para el sitemap:", err);
  }

  return entries;
}
