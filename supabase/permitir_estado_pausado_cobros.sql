-- ==============================================================================
-- ⏸️ PaDónde: Permitir estados 'pausado' y 'cancelado' en acuerdos_comerciales
-- ==============================================================================
-- Permite clasificar aliados que no aceptaron la propuesta comercial o están en pausa.
-- 100% seguro y no destructivo.
-- ==============================================================================

DO $$
BEGIN
    ALTER TABLE public.acuerdos_comerciales
        DROP CONSTRAINT IF EXISTS acuerdos_comerciales_estado_pago_check;

    ALTER TABLE public.acuerdos_comerciales
        ADD CONSTRAINT acuerdos_comerciales_estado_pago_check
        CHECK (estado_pago IN ('en_cortesia', 'al_dia', 'por_vencer', 'vencido', 'pausado', 'cancelado'));
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Constraint no pudo ser alterado: %', SQLERRM;
END $$;

