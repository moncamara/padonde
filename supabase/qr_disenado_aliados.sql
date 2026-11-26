-- ==============================================================================
-- 📱 PaDónde: Seguimiento de Diseño de QR por Aliado (/admin/aliados)
-- ==============================================================================
-- Ejecutar UNA vez en Supabase → SQL Editor.
-- ✔ No borra nada, no afecta rutas públicas.
-- ==============================================================================

ALTER TABLE public.negocios
    ADD COLUMN IF NOT EXISTS qr_disenado BOOLEAN NOT NULL DEFAULT false;
