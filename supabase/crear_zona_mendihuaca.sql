-- ==============================================================================
-- 🌊 PaDónde: Insertar Zona Mendihuaca en Supabase
-- ==============================================================================
-- Inserta la zona 'mendihuaca' de forma 100% segura y no destructiva.
-- Si ya existe, simplemente asegura que quede activa.
-- ==============================================================================

INSERT INTO public.zonas (nombre, slug, descripcion, activa)
VALUES (
    'Mendihuaca',
    'mendihuaca',
    'Playas vírgenes, río, surf y descanso natural a los pies de la Sierra Nevada',
    true
)
ON CONFLICT (slug) DO UPDATE SET 
    nombre = EXCLUDED.nombre,
    descripcion = EXCLUDED.descripcion,
    activa = true;
