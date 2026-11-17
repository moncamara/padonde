-- ==============================================================================
-- ⭐ PaDónde: Soporte de Posición Manual de Destacados (orden_destacado)
-- ==============================================================================
-- Migración idempotente (opcional, ya que el código también respalda y lee
-- metadata_hospedaje->>'orden_destacado' con fallback automático a 99).
-- ==============================================================================

ALTER TABLE public.eventos
ADD COLUMN IF NOT EXISTS orden_destacado INTEGER DEFAULT 99;

