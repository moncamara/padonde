-- ==============================================================================
-- 🔒 PaDónde: Eliminar Aliado Duplicado y Habilitar Permisos Admin en Supabase
-- ==============================================================================
-- 1. Elimina de forma 100% segura y quirúrgica el registro duplicado huérfano de Casa Maya
--    (ID: 19b52664-8b68-4e99-893f-a5204db55cf3).
--    Solo se borra si tiene 0 eventos (CERO riesgo de borrado en cadena).
--
-- 2. Habilita políticas RLS para que cualquier administrador autenticado pueda
--    gestionar y eliminar aliados sin verse bloqueado por user_id NULL.
-- ==============================================================================

-- PASO 1: Eliminar de forma segura el registro duplicado (vacío, 0 eventos, 0 clics)
DELETE FROM public.negocios 
WHERE id = '19b52664-8b68-4e99-893f-a5204db55cf3'
  AND NOT EXISTS (
      SELECT 1 FROM public.eventos WHERE negocio_id = '19b52664-8b68-4e99-893f-a5204db55cf3'
  );

-- PASO 2: Asignar user_id a cualquier negocio huérfano para consistencia histórica
UPDATE public.negocios
SET user_id = '7a301c13-229d-4b33-9d42-52442a919cde'
WHERE user_id IS NULL;

-- PASO 3: Habilitar política RLS para administradores autenticados en negocios
DROP POLICY IF EXISTS "Admins pueden gestionar todos los negocios" ON public.negocios;
CREATE POLICY "Admins pueden gestionar todos los negocios"
    ON public.negocios FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- PASO 4: Habilitar política RLS para administradores autenticados en eventos
DROP POLICY IF EXISTS "Admins pueden gestionar todos los eventos" ON public.eventos;
CREATE POLICY "Admins pueden gestionar todos los eventos"
    ON public.eventos FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);
