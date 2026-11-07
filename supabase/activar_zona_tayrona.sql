-- ==============================================================================
-- 🌴 PaDónde: Activar Oficialmente la Zona Tayrona en Producción
-- ==============================================================================
-- Actualiza la fila de la zona 'tayrona' para que 'activa = true'
-- y sea visible de inmediato para turistas (rol anon) y Googlebot.
-- ==============================================================================

UPDATE public.zonas 
SET activa = true 
WHERE slug IN ('tayrona', 'tairona');

-- En caso de no existir previamente bajo el slug, asegurar inserción limpia
INSERT INTO public.zonas (nombre, slug, descripcion, activa)
VALUES (
    'Parque Tayrona',
    'tayrona',
    'Parque Nacional Natural Tayrona, playas vírgenes y naturaleza',
    true
)
ON CONFLICT (slug) DO UPDATE SET 
    activa = true,
    nombre = EXCLUDED.nombre,
    descripcion = EXCLUDED.descripcion;

-- Verificación de estado activo de las 3 zonas públicas
SELECT id, nombre, slug, activa 
FROM public.zonas 
WHERE slug IN ('minca', 'mendihuaca', 'tayrona')
ORDER BY nombre;

