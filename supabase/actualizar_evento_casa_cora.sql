-- ==============================================================================
-- 🌿 PaDónde - Actualización Impecable: Coctelería de Autor en Casa Cora
-- ==============================================================================
-- Ejecutar en Supabase SQL Editor (https://supabase.com/dashboard/project/gvrroyncnrnjsaldlges/sql)
-- Reemplaza el folleto beige por la fotografía del cóctel en el río y texto profesional.
-- ==============================================================================

UPDATE public.eventos
SET 
    titulo = 'Escuela & Talleres de Coctelería de Autor — Casa Cora',
    descripcion = 'Aprende el arte de la mixología en el corazón de Minca. Casa Cora ofrece capacitaciones profesionales certificadas por niveles: desde Introducción a la Coctelería (1 semana, incluye insumos, herramientas y certificado), hasta Técnicas Avanzadas y Working Flair. También disponibles talleres vivenciales de Cerveza de Jengibre artesanal e Inglés para bartenders.',
    tipo = 'comida',
    precio = 333000,
    precio_moneda = 'COP',
    fecha_inicio = '2026-10-19 09:00:00-05',
    fecha_fin = '2026-10-20 23:59:59-05',
    imagen_url = 'https://gvrroyncnrnjsaldlges.supabase.co/storage/v1/object/public/eventos/eventos_reales/casa-cora-coctel-rio.webp',
    destacado = true,
    activo = true
WHERE id = 'e2e990d7-3e6b-4dd6-8db4-933059fc7f78' 
   OR (negocio_id = '0834b5de-8923-446c-919d-3f4a882e908f' AND titulo ILIKE '%Coctelería%');
