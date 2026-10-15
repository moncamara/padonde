-- ==============================================================================
-- 🌿 PaDónde - Actualización de los 5 Eventos de Finca La Frecuencia
-- ==============================================================================
-- Ejecutar en Supabase SQL Editor (https://supabase.com/dashboard/project/gvrroyncnrnjsaldlges/sql)
-- ==============================================================================

DO $$
DECLARE
    v_zona_minca UUID;
    v_neg_frecuencia UUID;
    v_ev_bounce UUID;
    v_ev_sauna UUID;
    v_ev_ecstatic UUID;
BEGIN
    -- 1. Obtener ID de la Zona Minca
    SELECT id INTO v_zona_minca FROM public.zonas WHERE slug = 'minca' LIMIT 1;
    IF v_zona_minca IS NULL THEN
        RAISE EXCEPTION 'Zona minca no encontrada';
    END IF;

    -- 2. Obtener o crear Aliado Finca La Frecuencia
    SELECT id INTO v_neg_frecuencia FROM public.negocios WHERE zona_id = v_zona_minca AND nombre ILIKE '%Finca La Frecuencia%' LIMIT 1;
    IF v_neg_frecuencia IS NULL THEN
        INSERT INTO public.negocios (zona_id, nombre, descripcion, categoria, whatsapp, instagram, plan, activo)
        VALUES (
            v_zona_minca,
            'Finca La Frecuencia',
            'Espacio de bienestar holístico, sauna de leña, meditación, cacao sensorial y movimiento',
            'bienestar',
            '573126040206',
            '@fincalafrecuencia',
            'pro',
            true
        )
        RETURNING id INTO v_neg_frecuencia;
    END IF;

    -- 3. ACTUALIZAR O INSERTAR LOS 5 EVENTOS INDIVIDUALES CON SUS IMÁGENES WEBP

    -- EVENTO 1: Cacao Sensorial & Sound Bath (Sábado 10 Octubre)
    IF EXISTS (SELECT 1 FROM public.eventos WHERE negocio_id = v_neg_frecuencia AND titulo ILIKE '%Cacao Sensorial & Sound%') THEN
        UPDATE public.eventos
        SET titulo = 'Cacao Sensorial & Sound Bath',
            descripcion = 'Para bajar de la mente al cuerpo y activar tu poder creador. Cacao, música, movimiento, ojos vendados y visualización para crear desde el corazón. Cerramos con un exquisito baño de sonido para integrar.',
            tipo = 'bienestar',
            precio = 0,
            precio_moneda = 'COP',
            fecha_inicio = '2026-10-10 10:00:00-05',
            fecha_fin = '2026-10-10 14:00:00-05',
            imagen_url = 'https://gvrroyncnrnjsaldlges.supabase.co/storage/v1/object/public/eventos/eventos_reales/cacao-sensorial.webp',
            destacado = true,
            activo = true
        WHERE negocio_id = v_neg_frecuencia AND titulo ILIKE '%Cacao Sensorial & Sound%';
    ELSE
        INSERT INTO public.eventos (negocio_id, zona_id, titulo, descripcion, tipo, precio, precio_moneda, fecha_inicio, fecha_fin, imagen_url, destacado, activo)
        VALUES (
            v_neg_frecuencia,
            v_zona_minca,
            'Cacao Sensorial & Sound Bath',
            'Para bajar de la mente al cuerpo y activar tu poder creador. Cacao, música, movimiento, ojos vendados y visualización para crear desde el corazón. Cerramos con un exquisito baño de sonido para integrar.',
            'bienestar',
            0,
            'COP',
            '2026-10-10 10:00:00-05',
            '2026-10-10 14:00:00-05',
            'https://gvrroyncnrnjsaldlges.supabase.co/storage/v1/object/public/eventos/eventos_reales/cacao-sensorial.webp',
            true,
            true
        );
    END IF;

    -- EVENTO 2: Caminata en Silencio — Meditación Activa (Lunes 12 Octubre Festivo)
    IF EXISTS (SELECT 1 FROM public.eventos WHERE negocio_id = v_neg_frecuencia AND titulo ILIKE '%Caminata en Silencio%') THEN
        UPDATE public.eventos
        SET titulo = 'Caminata en Silencio — Meditación Activa',
            descripcion = 'La montaña tiene un mensaje para ti. Explora el poder del silencio en esta meditación activa diseñada para enraizarnos con la Madre Tierra y cultivar nuestras cualidades yin de receptividad. Guiada por Jesse Blazo.',
            tipo = 'bienestar',
            precio = 0,
            precio_moneda = 'COP',
            fecha_inicio = '2026-10-12 09:30:00-05',
            fecha_fin = '2026-10-12 11:30:00-05',
            imagen_url = 'https://gvrroyncnrnjsaldlges.supabase.co/storage/v1/object/public/eventos/eventos_reales/caminata.webp',
            destacado = true,
            activo = true
        WHERE negocio_id = v_neg_frecuencia AND titulo ILIKE '%Caminata en Silencio%';
    ELSE
        INSERT INTO public.eventos (negocio_id, zona_id, titulo, descripcion, tipo, precio, precio_moneda, fecha_inicio, fecha_fin, imagen_url, destacado, activo)
        VALUES (
            v_neg_frecuencia,
            v_zona_minca,
            'Caminata en Silencio — Meditación Activa',
            'La montaña tiene un mensaje para ti. Explora el poder del silencio en esta meditación activa diseñada para enraizarnos con la Madre Tierra y cultivar nuestras cualidades yin de receptividad. Guiada por Jesse Blazo.',
            'bienestar',
            0,
            'COP',
            '2026-10-12 09:30:00-05',
            '2026-10-12 11:30:00-05',
            'https://gvrroyncnrnjsaldlges.supabase.co/storage/v1/object/public/eventos/eventos_reales/caminata.webp',
            true,
            true
        );
    END IF;

    -- EVENTO 3: Bounce & Acupuntura Comunitaria (Sábado 24 Octubre)
    SELECT id INTO v_ev_bounce FROM public.eventos WHERE negocio_id = v_neg_frecuencia AND titulo ILIKE '%Bounce%' LIMIT 1;
    IF v_ev_bounce IS NOT NULL THEN
        UPDATE public.eventos
        SET titulo = 'Bounce & Acupuntura Comunitaria',
            descripcion = 'Si el tai chi, el sound healing y el ecstatic dance tuvieran un hijo, sería Bounce. Explora nuevas formas de habitar el cuerpo con la respiración, el sonido y el movimiento. Luego, quédate para una sesión comunitaria de acupuntura.',
            tipo = 'bienestar',
            precio = 0,
            precio_moneda = 'COP',
            fecha_inicio = '2026-10-24 10:00:00-05',
            fecha_fin = '2026-10-24 16:00:00-05',
            imagen_url = 'https://gvrroyncnrnjsaldlges.supabase.co/storage/v1/object/public/eventos/eventos_reales/acupuntura.webp',
            destacado = true,
            activo = true
        WHERE id = v_ev_bounce;
    ELSE
        INSERT INTO public.eventos (negocio_id, zona_id, titulo, descripcion, tipo, precio, precio_moneda, fecha_inicio, fecha_fin, imagen_url, destacado, activo)
        VALUES (
            v_neg_frecuencia,
            v_zona_minca,
            'Bounce & Acupuntura Comunitaria',
            'Si el tai chi, el sound healing y el ecstatic dance tuvieran un hijo, sería Bounce. Explora nuevas formas de habitar el cuerpo con la respiración, el sonido y el movimiento. Luego, quédate para una sesión comunitaria de acupuntura.',
            'bienestar',
            0,
            'COP',
            '2026-10-24 10:00:00-05',
            '2026-10-24 16:00:00-05',
            'https://gvrroyncnrnjsaldlges.supabase.co/storage/v1/object/public/eventos/eventos_reales/acupuntura.webp',
            true,
            true
        );
    END IF;

    -- EVENTO 4: Sauna de Leña & Sonido (Domingos 11 y 25 Octubre)
    SELECT id INTO v_ev_sauna FROM public.eventos WHERE negocio_id = v_neg_frecuencia AND titulo ILIKE '%Sauna%' LIMIT 1;
    IF v_ev_sauna IS NOT NULL THEN
        UPDATE public.eventos
        SET titulo = 'Sauna de Leña & Sonido',
            descripcion = 'Para habitar la presencia y la escucha interior. Nuestro sauna de leña acompañado de una exploración vocal de sonido y vibración. Abrimos con un círculo de cantos sagrados. Cerramos en silencio y meditación.',
            tipo = 'bienestar',
            precio = 0,
            precio_moneda = 'COP',
            fecha_inicio = '2026-10-25 10:00:00-05',
            fecha_fin = '2026-10-25 14:00:00-05',
            imagen_url = 'https://gvrroyncnrnjsaldlges.supabase.co/storage/v1/object/public/eventos/eventos_reales/sauna.webp',
            destacado = true,
            activo = true
        WHERE id = v_ev_sauna;
    ELSE
        INSERT INTO public.eventos (negocio_id, zona_id, titulo, descripcion, tipo, precio, precio_moneda, fecha_inicio, fecha_fin, imagen_url, destacado, activo)
        VALUES (
            v_neg_frecuencia,
            v_zona_minca,
            'Sauna de Leña & Sonido',
            'Para habitar la presencia y la escucha interior. Nuestro sauna de leña acompañado de una exploración vocal de sonido y vibración. Abrimos con un círculo de cantos sagrados. Cerramos en silencio y meditación.',
            'bienestar',
            0,
            'COP',
            '2026-10-25 10:00:00-05',
            '2026-10-25 14:00:00-05',
            'https://gvrroyncnrnjsaldlges.supabase.co/storage/v1/object/public/eventos/eventos_reales/sauna.webp',
            true,
            true
        );
    END IF;

    -- EVENTO 5: Cacao Sensorial & Ecstatic Dance en Disfraces (Sábado 31 Octubre)
    SELECT id INTO v_ev_ecstatic FROM public.eventos WHERE negocio_id = v_neg_frecuencia AND titulo ILIKE '%Ecstatic%' LIMIT 1;
    IF v_ev_ecstatic IS NOT NULL THEN
        UPDATE public.eventos
        SET titulo = 'Cacao Sensorial & Ecstatic Dance en Disfraces',
            descripcion = 'Un viaje musical para depurar y regular activamente el sistema nervioso. Cacao, DJ en vivo, baile, ojos vendados y visualización para sacudir lo estancado, liberar emociones y entregarte a la catarsis somática.',
            tipo = 'bienestar',
            precio = 0,
            precio_moneda = 'COP',
            fecha_inicio = '2026-10-31 10:00:00-05',
            fecha_fin = '2026-10-31 14:00:00-05',
            imagen_url = 'https://gvrroyncnrnjsaldlges.supabase.co/storage/v1/object/public/eventos/eventos_reales/cacao-danza.webp',
            destacado = true,
            activo = true
        WHERE id = v_ev_ecstatic;
    ELSE
        INSERT INTO public.eventos (negocio_id, zona_id, titulo, descripcion, tipo, precio, precio_moneda, fecha_inicio, fecha_fin, imagen_url, destacado, activo)
        VALUES (
            v_neg_frecuencia,
            v_zona_minca,
            'Cacao Sensorial & Ecstatic Dance en Disfraces',
            'Un viaje musical para depurar y regular activamente el sistema nervioso. Cacao, DJ en vivo, baile, ojos vendados y visualización para sacudir lo estancado, liberar emociones y entregarte a la catarsis somática.',
            'bienestar',
            0,
            'COP',
            '2026-10-31 10:00:00-05',
            '2026-10-31 14:00:00-05',
            'https://gvrroyncnrnjsaldlges.supabase.co/storage/v1/object/public/eventos/eventos_reales/cacao-danza.webp',
            true,
            true
        );
    END IF;

END $$;
