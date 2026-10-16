-- ==============================================================================
-- 🦜 PaDónde Minca: Actualización del Tour de Jam Birding Minca
-- Basado en la confirmación directa del guía Jam:
--   • Salidas casi a diario: 6:00 AM
--   • Punto de encuentro: Puente de Minca
--   • Destino: Torre del Sol (vía San Rafael)
--   • Duración: 3 horas y media (antes decía 150 min = 2.5h)
--   • Precio: $75.000 COP por persona (con binoculares incluidos)
--   • Recurrencia: Diario (<!--recurrente:0,1,2,3,4,5,6-->)
-- ==============================================================================

DO $$
DECLARE
    v_evento_id UUID := 'ff30154d-3839-490c-bc32-1c7db39999ee';
    v_negocio_id UUID := 'c0ef56ce-3c8e-40e6-8408-be2b92a3b558';
BEGIN
    -- 1. Actualizar el evento con la información exacta confirmada
    UPDATE public.eventos
    SET 
        titulo = 'Tour Matutino de Avistamiento de Aves (6:00 AM)',
        precio = 75000,
        precio_moneda = 'COP',
        tipo = 'tours',
        activo = true,
        destacado = true,
        -- Inicio hoy a las 6:00 AM hora Colombia (UTC-5)
        fecha_inicio = '2026-10-16 06:00:00-05',
        -- Fin de vigencia diaria hasta fin de año para que aparezca activo cada día
        fecha_fin = '2026-12-31 09:30:00-05',
        descripcion = 'Avistamiento de aves en Minca con el guía especializado Jam. Salidas casi a diario a las 6:00 AM desde el puente de Minca hacia la plataforma de observación Torre del Sol (vía San Rafael).

• Duración: 3 horas y media de caminata ecológica.
• Avistamiento: Turpiales, Tórtolas, Espigueros, Tucanes y variedad de Colibríes de la Sierra Nevada.
• Incluye: Acompañamiento de guía local experto y uso de binoculares.
• Punto de encuentro: Puente de Minca (6:00 AM).
• Valor: $75.000 COP por persona.

<!--recurrente:0,1,2,3,4,5,6-->'
    WHERE id = v_evento_id OR negocio_id = v_negocio_id;

    -- 2. Asegurar que el negocio Jam Birding Minca esté activo en Plan Pro
    UPDATE public.negocios
    SET 
        activo = true,
        categoria = 'tours',
        descripcion = 'Avistamiento de aves en la Sierra Nevada con el guía especializado Jam'
    WHERE id = v_negocio_id;

    RAISE NOTICE '✅ Tour de Jam Birding Minca actualizado con éxito (3.5 horas, $75.000 COP, salidas 6 AM puente de Minca).';
END $$;
