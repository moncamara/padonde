-- ==============================================================================
-- MIGRACIÓN SEGURA: Mover Reputación de Google Maps al Aliado (Tabla 'negocios')
-- Sin tiempo de inactividad (Zero-Downtime) y 100% retrocompatible.
-- ==============================================================================

-- 1. Agregar columnas a 'negocios' (si no existen)
ALTER TABLE negocios 
ADD COLUMN IF NOT EXISTS google_rating NUMERIC(2, 1),
ADD COLUMN IF NOT EXISTS google_total_reviews INTEGER,
ADD COLUMN IF NOT EXISTS google_maps_url TEXT,
ADD COLUMN IF NOT EXISTS google_review_url TEXT;

-- 2. Backfill: Copiar datos existentes de 'eventos' hacia 'negocios'
-- Solo para los negocios que no tengan estos campos ya definidos
UPDATE negocios n
SET
  google_rating = COALESCE(n.google_rating, (e.metadata_hospedaje->'google_reputacion'->>'rating')::numeric),
  google_total_reviews = COALESCE(n.google_total_reviews, (e.metadata_hospedaje->'google_reputacion'->>'total_reviews')::integer),
  google_maps_url = COALESCE(n.google_maps_url, e.metadata_hospedaje->'google_reputacion'->>'maps_url'),
  google_review_url = COALESCE(n.google_review_url, e.metadata_hospedaje->>'google_review_url')
FROM eventos e
WHERE e.negocio_id = n.id
  AND (
    e.metadata_hospedaje->>'google_review_url' IS NOT NULL
    OR e.metadata_hospedaje->'google_reputacion'->>'maps_url' IS NOT NULL
  );

-- 3. Verificación de seguridad
SELECT id, nombre, google_rating, google_total_reviews, google_maps_url, google_review_url 
FROM negocios 
WHERE google_review_url IS NOT NULL OR google_maps_url IS NOT NULL;
