-- ==============================================================================
-- 📡 PaDónde: Radar Diario y Seguimiento de Aliados (/admin/seguimiento)
-- ==============================================================================
-- Ejecutar UNA vez en Supabase → SQL Editor.
-- ✔ No modifica ni elimina tablas existentes.
-- ✔ Tabla interna administrativa con RLS para usuarios autenticados.
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.seguimiento_aliados (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    negocio_id UUID NOT NULL REFERENCES public.negocios(id) ON DELETE CASCADE,
    fecha DATE NOT NULL DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'America/Bogota')::DATE,
    revisado_redes BOOLEAN NOT NULL DEFAULT false,
    publicado_hoy BOOLEAN NOT NULL DEFAULT false,
    interactuado_ig BOOLEAN NOT NULL DEFAULT false,
    comentario TEXT,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT seguimiento_aliados_negocio_fecha_unique UNIQUE (negocio_id, fecha)
);

CREATE INDEX IF NOT EXISTS seguimiento_aliados_fecha_negocio_idx
    ON public.seguimiento_aliados (fecha DESC, negocio_id);

ALTER TABLE public.seguimiento_aliados ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin autenticado gestiona seguimiento_aliados" ON public.seguimiento_aliados;
CREATE POLICY "Admin autenticado gestiona seguimiento_aliados"
    ON public.seguimiento_aliados
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);
