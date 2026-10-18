-- ==============================================================================
-- 🌿 PaDónde: Agregar columna de traducciones a eventos
-- ==============================================================================
-- Permite almacenar traducciones automáticas en formato JSONB (en, de, fr).
-- Es 100% retrocompatible y NO bloquea operaciones en producción.
-- ==============================================================================

ALTER TABLE public.eventos 
ADD COLUMN IF NOT EXISTS traducciones JSONB DEFAULT '{}'::jsonb;
