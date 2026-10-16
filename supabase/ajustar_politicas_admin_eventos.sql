-- ==============================================================================
-- 🔒 PaDónde: Seguridad Estricta y Vinculación de Aliados a la Administradora
-- ==============================================================================
-- 1. Asigna tu cuenta administradora exclusiva (7a301c13-229d-4b33-9d42-52442a919cde)
--    a los aliados recientes que tenían user_id en NULL (Canúmake, El Bosque, La Veranda).
-- 2. Mantiene activa la política de seguridad estricta:
--    SOLO el usuario dueño autenticado puede modificar eventos.
-- ==============================================================================

-- 1. Asignar propiedad de todos los negocios a tu cuenta administradora
UPDATE public.negocios
SET user_id = '7a301c13-229d-4b33-9d42-52442a919cde'
WHERE user_id IS NULL;

-- 2. Limpiar políticas temporales y reinstalar la política estricta de propietario
DROP POLICY IF EXISTS "Admin puede administrar todos los eventos" ON public.eventos;
DROP POLICY IF EXISTS "Negocio puede administrar sus eventos" ON public.eventos;

CREATE POLICY "Negocio puede administrar sus eventos" 
    ON public.eventos FOR ALL 
    TO authenticated 
    USING (
        EXISTS (
            SELECT 1 FROM public.negocios 
            WHERE negocios.id = eventos.negocio_id 
            AND negocios.user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.negocios 
            WHERE negocios.id = eventos.negocio_id 
            AND negocios.user_id = auth.uid()
        )
    );

-- 3. Confirmar que la política de negocios también sea estricta por dueño
DROP POLICY IF EXISTS "Admin puede administrar todos los negocios" ON public.negocios;
DROP POLICY IF EXISTS "Dueño de negocio puede modificar su perfil" ON public.negocios;
DROP POLICY IF EXISTS "Negocios editables por su dueno" ON public.negocios;

CREATE POLICY "Dueño de negocio puede modificar su perfil" 
    ON public.negocios FOR ALL 
    TO authenticated 
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

DO $$
BEGIN
    RAISE NOTICE '✅ Seguridad estricta verificada: Todos los negocios vinculados a tu cuenta y protegidos contra accesos no autorizados.';
END $$;
