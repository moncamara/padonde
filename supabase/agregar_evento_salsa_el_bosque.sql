-- ==============================================================================
-- 🌿 PaDónde - Agregar Evento: Noche de Salsa en Línea en El Bosque
-- ==============================================================================
-- Ejecutar en Supabase SQL Editor (https://supabase.com/dashboard/project/gvrroyncnrnjsaldlges/sql)
-- ==============================================================================

DO $$
DECLARE
    v_zona_minca UUID;
    v_neg_bosque UUID;
    v_ev_salsa UUID;
BEGIN
    -- 1. Obtener ID de la Zona Minca
    SELECT id INTO v_zona_minca FROM public.zonas WHERE slug = 'minca' LIMIT 1;
    IF v_zona_minca IS NULL THEN
        RAISE EXCEPTION 'Zona minca no encontrada';
    END IF;

    -- 2. Obtener o crear Aliado: El Bosque (antes Casa Loma)
    SELECT id INTO v_neg_bosque FROM public.negocios 
    WHERE zona_id = v_zona_minca AND (nombre ILIKE '%El Bosque%' OR nombre ILIKE '%Casa Loma%') 
    LIMIT 1;

    IF v_neg_bosque IS NULL THEN
        INSERT INTO public.negocios (zona_id, nombre, descripcion, categoria, whatsapp, instagram, plan, activo)
        VALUES (
            v_zona_minca,
            'El Bosque (antes Casa Loma)',
            'Espacio cultural, restaurante, bar y hostal en lo alto de Minca con vista panorámica y noches de baile.',
            'musica',
            '573013010194', -- Puedes editar el WhatsApp en cualquier momento desde /admin/aliados
            '@elbosqueminca',
            'pro',
            true
        )
        RETURNING id INTO v_neg_bosque;
    END IF;

    -- 3. Insertar o actualizar el evento de Salsa en Línea para HOY
    SELECT id INTO v_ev_salsa FROM public.eventos 
    WHERE negocio_id = v_neg_bosque AND titulo ILIKE '%Salsa%' 
    LIMIT 1;

    IF v_ev_salsa IS NOT NULL THEN
        UPDATE public.eventos
        SET titulo = 'Noche de Salsa en Línea — El Bosque',
            descripcion = '¡Hoy la noche se enciende con el mejor sabor y ritmo en Minca! Ven a disfrutar de una noche de Salsa en Línea en El Bosque (antes Casa Loma). Música, baile social, cócteles y la mejor vibra en la montaña. ¡Corre la voz y ven a bailar!',
            tipo = 'musica',
            precio = 0,
            precio_moneda = 'COP',
            fecha_inicio = '2026-10-15 19:30:00-05',
            fecha_fin = '2026-10-16 01:00:00-05',
            imagen_url = 'https://gvrroyncnrnjsaldlges.supabase.co/storage/v1/object/public/eventos/eventos_reales/salsa-el-bosque.webp',
            destacado = true,
            activo = true
        WHERE id = v_ev_salsa;
    ELSE
        INSERT INTO public.eventos (negocio_id, zona_id, titulo, descripcion, tipo, precio, precio_moneda, fecha_inicio, fecha_fin, imagen_url, destacado, activo)
        VALUES (
            v_neg_bosque,
            v_zona_minca,
            'Noche de Salsa en Línea — El Bosque',
            '¡Hoy la noche se enciende con el mejor sabor y ritmo en Minca! Ven a disfrutar de una noche de Salsa en Línea en El Bosque (antes Casa Loma). Música, baile social, cócteles y la mejor vibra en la montaña. ¡Corre la voz y ven a bailar!',
            'musica',
            0,
            'COP',
            '2026-10-15 19:30:00-05',
            '2026-10-16 01:00:00-05',
            'https://gvrroyncnrnjsaldlges.supabase.co/storage/v1/object/public/eventos/eventos_reales/salsa-el-bosque.webp',
            true,
            true
        );
    END IF;

END $$;
