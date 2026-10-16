-- ==============================================================================
-- 🍽️ PaDónde Minca: Actualización del Menú del Día de Feeling Bar
-- ==============================================================================
-- Menú del día:
--   • Rollitos de repollo rellenos de carne molida 
--   • Papas cocidas o arroz
--   • Ensalada fresca
--   • Sopa de frijoles negros
--   • Limonada natural
--   • Precio: $20.000 COP
--   • Foto: https://gvrroyncnrnjsaldlges.supabase.co/storage/v1/object/public/eventos/eventos_reales/feeling-menu-rollitos.webp
-- ==============================================================================

DO $$
DECLARE
    v_evento_id UUID := '8b580b88-be89-4dda-8e33-6211e598c818';
    v_negocio_id UUID := 'd1b26014-3013-49de-b57e-673aa5d882d9';
BEGIN
    UPDATE public.eventos
    SET 
        titulo = 'Menú del Día en Feeling Bar — Rollitos de Repollo',
        precio = 20000,
        precio_moneda = 'COP',
        tipo = 'comida',
        activo = true,
        destacado = false,
        -- Almuerzos desde las 12:00 PM hora Colombia (UTC-5)
        fecha_inicio = '2026-10-16 12:00:00-05',
        fecha_fin = '2026-11-30 16:30:00-05',
        imagen_url = 'https://gvrroyncnrnjsaldlges.supabase.co/storage/v1/object/public/eventos/eventos_reales/feeling-menu-rollitos.webp',
        descripcion = '🌿🍽️ ¡Hoy en Feeling – Menú del Día! 😋

🥬 Rollitos de repollo rellenos de carne molida 
🥔 Papas cocidas o arroz
🥗 Ensalada fresca
🍲 Sopa de frijoles negros
🍋 Limonada natural

💰 ¡Todo por solo $20.000 COP!

❤️ Comida casera, fresca y llena de sabor, preparada con amor.

📍 ¡Te esperamos en Feeling, Minca! 🌴✨
(📸 Imagen de referencia - la realidad es más rica)

📲 Escríbenos y haz tu pedido o reserva tu mesa.

<!--recurrente:1,2,3,4,5,6,0-->'
    WHERE id = v_evento_id OR negocio_id = v_negocio_id;

    -- Asegurar que el negocio esté activo
    UPDATE public.negocios
    SET activo = true
    WHERE id = v_negocio_id;

    RAISE NOTICE '✅ Menú de Feeling Bar actualizado con éxito (Rollitos de repollo, $20.000 COP).';
END $$;
