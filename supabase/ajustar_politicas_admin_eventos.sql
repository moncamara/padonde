-- ==============================================================================
-- 🛡️ PaDónde: Políticas RLS para Administración Completa de Eventos y Aliados
-- ==============================================================================
-- Garantiza que cualquier usuario autenticado en el panel /admin pueda
-- editar, activar o publicar eventos de cualquier negocio (incluso si user_id es NULL)
-- ==============================================================================

-- 1. EVENTOS: Permitir a administradores autenticados crear, editar y eliminar cualquier evento
DROP POLICY IF EXISTS "Negocio puede administrar sus eventos" ON public.eventos;
DROP POLICY IF EXISTS "Admin puede administrar todos los eventos" ON public.eventos;

CREATE POLICY "Admin puede administrar todos los eventos" 
    ON public.eventos FOR ALL 
    TO authenticated 
    USING (true) 
    WITH CHECK (true);

-- 2. NEGOCIOS: Permitir a administradores autenticados crear, editar y eliminar cualquier negocio
DROP POLICY IF EXISTS "Dueño de negocio puede modificar su perfil" ON public.negocios;
DROP POLICY IF EXISTS "Negocios editables por su dueno" ON public.negocios;
DROP POLICY IF EXISTS "Admin puede administrar todos los negocios" ON public.negocios;

CREATE POLICY "Admin puede administrar todos los negocios" 
    ON public.negocios FOR ALL 
    TO authenticated 
    USING (true) 
    WITH CHECK (true);

-- Mensaje de confirmación
DO $$
BEGIN
    RAISE NOTICE '✅ Políticas RLS de Administración actualizadas correctamente.';
END $$;
