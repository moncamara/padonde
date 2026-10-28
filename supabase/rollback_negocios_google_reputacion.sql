-- ==============================================================================
-- ROLLBACK DE EMERGENCIA: Revertir columnas de Google Reputation en 'negocios'
-- NOTA: Este script solo se ejecuta en caso de requerir un rollback total.
-- Los datos originales en 'eventos.metadata_hospedaje' NUNCA fueron borrados,
-- por lo que el sistema funciona sin pérdidas en cualquier escenario.
-- ==============================================================================

-- Eliminar columnas agregadas a 'negocios'
ALTER TABLE negocios 
DROP COLUMN IF EXISTS google_rating,
DROP COLUMN IF EXISTS google_total_reviews,
DROP COLUMN IF EXISTS google_maps_url,
DROP COLUMN IF EXISTS google_review_url;
