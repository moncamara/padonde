-- ==============================================================================
-- 🤿 PaDónde: Insertar Zona Taganga en Supabase
-- ==============================================================================
-- Inserta la zona 'taganga' de forma 100% segura y no destructiva.
-- Por defecto se inserta en estado activa = false (Pronto) para prospección.
-- Cuando esté lista para lanzamiento, se puede cambiar a true.
-- ==============================================================================

INSERT INTO public.zonas (nombre, slug, descripcion, activa)
VALUES (
    'Taganga',
    'taganga',
    'Bahía de pescadores, buceo en arrecifes y atardeceres mágicos en el Caribe',
    false
)
ON CONFLICT (slug) DO UPDATE SET 
    nombre = EXCLUDED.nombre,
    descripcion = EXCLUDED.descripcion;
