-- ==============================================================================
-- 🔗 PaDónde — Migración No Destructiva: Unificación de Aliados Multi-Vertical
-- ==============================================================================
-- Objetivo:
--   1. Permitir que `servicios_esenciales` también se vincule opcionalmente a un
--      registro único en `public.negocios` (al igual que `eventos` y hospedajes).
--   2. Zero-Downtime: 100% aditivo, nullable, sin DROP ni modificación de datos.
-- ==============================================================================

-- 1. Vincular servicios_esenciales con la tabla maestra `negocios`
ALTER TABLE public.servicios_esenciales
ADD COLUMN IF NOT EXISTS negocio_id UUID REFERENCES public.negocios(id) ON DELETE SET NULL;

-- 2. Índice para joins y conteo de verticales por aliado
CREATE INDEX IF NOT EXISTS idx_servicios_negocio
ON public.servicios_esenciales (negocio_id);

-- 3. (Opcional / Diagnóstico) Detectar posibles aliados duplicados por teléfono o nombre
-- Ejecuta estos SELECT en Supabase SQL Editor para auditar duplicados antes de fusionar:
/*
-- 3A. Duplicados por teléfono (últimos 10 dígitos)
SELECT
  RIGHT(regexp_replace(whatsapp, '\D', '', 'g'), 10) AS telefono_10,
  COUNT(*) AS total_registros,
  ARRAY_AGG(id ORDER BY created_at ASC) AS negocio_ids,
  ARRAY_AGG(nombre ORDER BY created_at ASC) AS nombres
FROM public.negocios
WHERE whatsapp IS NOT NULL AND trim(whatsapp) <> ''
GROUP BY 1
HAVING COUNT(*) > 1;

-- 3B. Duplicados por nombre normalizado similar
SELECT
  LOWER(TRIM(nombre)) AS nombre_normalizado,
  COUNT(*) AS total_registros,
  ARRAY_AGG(id ORDER BY created_at ASC) AS negocio_ids,
  ARRAY_AGG(whatsapp ORDER BY created_at ASC) AS whatsapps,
  ARRAY_AGG(categoria ORDER BY created_at ASC) AS categorias
FROM public.negocios
WHERE nombre IS NOT NULL AND trim(nombre) <> ''
GROUP BY 1
HAVING COUNT(*) > 1;
*/
