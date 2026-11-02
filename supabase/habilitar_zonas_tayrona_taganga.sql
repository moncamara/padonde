-- ==============================================================================
-- 🌴 PaDónde: Habilitar Zonas Tayrona y Taganga en Modo Borrador (activa = false)
-- ==============================================================================
-- 1. Inserta o actualiza las zonas 'tayrona' y 'taganga' en la base de datos Supabase.
--    Estado inicial: activa = false (invisibles para los turistas en la cartelera pública).
-- 2. Agrega una política RLS para que el panel /admin (usuarios autenticados) pueda
--    LEER también las zonas inactivas. Sin esto, la política pública
--    "Zonas visibles para todos" (USING activa = true) las oculta incluso al admin
--    y no aparecen en los selectores de Hospedajes / Servicios Esenciales.
--    Los turistas (rol anon) siguen viendo únicamente las zonas activas.
-- ==============================================================================

INSERT INTO public.zonas (nombre, slug, descripcion, activa)
VALUES 
    (
        'Tayrona',
        'tayrona',
        'Parque Nacional Natural Tayrona, playas vírgenes, senderos ecológicos y naturaleza tropical',
        false
    ),
    (
        'Taganga',
        'taganga',
        'Bahía de pescadores, buceo en arrecifes y atardeceres mágicos en el Caribe',
        false
    )
ON CONFLICT (slug) DO UPDATE SET 
    nombre = EXCLUDED.nombre,
    descripcion = EXCLUDED.descripcion;

-- Lectura de TODAS las zonas (activas e inactivas) solo para sesiones autenticadas (/admin)
DROP POLICY IF EXISTS "Admin puede leer todas las zonas" ON public.zonas;
CREATE POLICY "Admin puede leer todas las zonas"
    ON public.zonas FOR SELECT
    TO authenticated
    USING (true);

-- Verificación rápida
SELECT slug, nombre, activa FROM public.zonas ORDER BY activa DESC, nombre;
