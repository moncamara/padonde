-- ==============================================================================
-- 🌿 PaDónde - Carga de Eventos y Aliados Reales de Minca (Octubre 2026)
-- ==============================================================================
-- Ejecutar en Supabase SQL Editor (https://supabase.com/dashboard/project/gvrroyncnrnjsaldlges/sql)
-- Todas las imágenes ya están optimizadas en WebP y alojadas en Supabase Storage.
-- ==============================================================================

DO $$
DECLARE
    v_zona_minca UUID;
    v_neg_cacao UUID;
    v_neg_jam UUID;
    v_neg_feeling UUID;
    v_neg_frecuencia UUID;
    v_neg_cora UUID;
    v_neg_dhamma UUID;
BEGIN
    -- 1. Obtener ID de la Zona Minca
    SELECT id INTO v_zona_minca FROM public.zonas WHERE slug = 'minca' LIMIT 1;
    IF v_zona_minca IS NULL THEN
        RAISE EXCEPTION 'Zona minca no encontrada';
    END IF;

    -- 2. REGISTRAR NEGOCIOS / ALIADOS (Si ya existen, se actualizan)
    
    -- A. Cacao Cultural / Cine 40
    INSERT INTO public.negocios (zona_id, nombre, descripcion, categoria, whatsapp, instagram, plan, activo)
    VALUES (
        v_zona_minca,
        'Cacao Cultural',
        'Espacio de encuentro, cine comunitario, creatividad y cultura en Minca',
        'arte',
        '573013010194',
        '@cacaocultural',
        'pro',
        true
    )
    ON CONFLICT DO NOTHING;
    SELECT id INTO v_neg_cacao FROM public.negocios WHERE zona_id = v_zona_minca AND nombre = 'Cacao Cultural' LIMIT 1;

    -- B. Jam Birding Minca
    INSERT INTO public.negocios (zona_id, nombre, descripcion, categoria, whatsapp, instagram, plan, activo)
    VALUES (
        v_zona_minca,
        'Jam Birding Minca',
        'Avistamiento de aves en la Sierra Nevada con guía especializado Jam',
        'tours',
        '573005554433',
        '@jambirding',
        'pro',
        true
    )
    ON CONFLICT DO NOTHING;
    SELECT id INTO v_neg_jam FROM public.negocios WHERE zona_id = v_zona_minca AND nombre = 'Jam Birding Minca' LIMIT 1;

    -- C. Feeling Bar Minca
    INSERT INTO public.negocios (zona_id, nombre, descripcion, categoria, whatsapp, instagram, plan, activo)
    VALUES (
        v_zona_minca,
        'Feeling Bar Minca',
        'Restaurante y bar con sabores frescos, menú del día y coctelería en el centro de Minca',
        'comida',
        '573013010194',
        '@feelingbarminca',
        'gratis',
        true
    )
    ON CONFLICT DO NOTHING;
    SELECT id INTO v_neg_feeling FROM public.negocios WHERE zona_id = v_zona_minca AND nombre = 'Feeling Bar Minca' LIMIT 1;

    -- D. Finca La Frecuencia
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
    ON CONFLICT DO NOTHING;
    SELECT id INTO v_neg_frecuencia FROM public.negocios WHERE zona_id = v_zona_minca AND nombre = 'Finca La Frecuencia' LIMIT 1;

    -- E. Casa Cora Minca
    INSERT INTO public.negocios (zona_id, nombre, descripcion, categoria, whatsapp, instagram, plan, activo)
    VALUES (
        v_zona_minca,
        'Casa Cora Minca',
        'Capacitaciones profesionales de coctelería, mixología y talleres en Minca',
        'comida',
        '573107276072',
        '@casa_cora_minca',
        'gratis',
        true
    )
    ON CONFLICT DO NOTHING;
    SELECT id INTO v_neg_cora FROM public.negocios WHERE zona_id = v_zona_minca AND nombre = 'Casa Cora Minca' LIMIT 1;

    -- F. Dhamma Gutti (Vipassana)
    INSERT INTO public.negocios (zona_id, nombre, descripcion, categoria, whatsapp, instagram, plan, activo)
    VALUES (
        v_zona_minca,
        'Dhamma Gutti (Vipassana)',
        'Centro de meditación y cursos de Vipassana y Anapana en Colombia',
        'bienestar',
        '573045252997',
        NULL,
        'gratis',
        true
    )
    ON CONFLICT DO NOTHING;
    SELECT id INTO v_neg_dhamma FROM public.negocios WHERE zona_id = v_zona_minca AND nombre = 'Dhamma Gutti (Vipassana)' LIMIT 1;


    -- 3. REGISTRAR LOS EVENTOS EN CARTELERA

    -- 1. Cine 40: Páramos II - El Origen (HOY Jueves 15 Octubre 7 PM)
    INSERT INTO public.eventos (negocio_id, zona_id, titulo, descripcion, tipo, precio, precio_moneda, fecha_inicio, fecha_fin, imagen_url, destacado, activo)
    VALUES (
        v_neg_cacao,
        v_zona_minca,
        'Velada Especial Cine 40: Páramos II — El Origen',
        'Proyección simultánea nacional y documental ambiental sobre los páramos de Colombia. Una película, muchos territorios, un mismo momento.',
        'arte',
        0,
        'COP',
        '2026-10-15 19:00:00-05',
        '2026-10-15 21:00:00-05',
        'https://gvrroyncnrnjsaldlges.supabase.co/storage/v1/object/public/eventos/eventos_reales/cine40-paramos.webp',
        true,
        true
    );

    -- 2. La Hora del Río: Conversatorio comunitario en Cine 40 (HOY Jueves 15 Octubre 7 PM)
    INSERT INTO public.eventos (negocio_id, zona_id, titulo, descripcion, tipo, precio, precio_moneda, fecha_inicio, fecha_fin, imagen_url, destacado, activo)
    VALUES (
        v_neg_cacao,
        v_zona_minca,
        'La Hora del Río — Conversatorio en Cine 40',
        'Un espacio de reflexión en comunidad para aportar al cuidado, conservación y futuro de nuestro río Minca.',
        'comunidad',
        0,
        'COP',
        '2026-10-15 19:00:00-05',
        '2026-10-15 21:30:00-05',
        'https://gvrroyncnrnjsaldlges.supabase.co/storage/v1/object/public/eventos/eventos_reales/la-hora-del-rio.webp',
        false,
        true
    );

    -- 3. Jam Birding: Tours Matutinos de Avistamiento de Aves (Todos los días 6:00 AM)
    INSERT INTO public.eventos (negocio_id, zona_id, titulo, descripcion, tipo, precio, precio_moneda, fecha_inicio, fecha_fin, imagen_url, destacado, activo)
    VALUES (
        v_neg_jam,
        v_zona_minca,
        'Tour Matutino de Avistamiento de Aves (6:00 AM)',
        'Caminata de 150 minutos alrededor de Minca con guía de avistamiento Jam. Observación de aves: Turpiales, Tórtolas, Espigueros, Tucanes y Colibríes. Visita a plataforma Torre del Sol vía San Rafael. Binoculares incluidos.',
        'tours',
        75000,
        'COP',
        '2026-10-16 06:00:00-05',
        '2026-10-16 08:30:00-05',
        'https://gvrroyncnrnjsaldlges.supabase.co/storage/v1/object/public/eventos/eventos_reales/jam-birding.webp',
        true,
        true
    );

    -- 4. Feeling Bar: Menú del Día y Almuerzos en Minca
    INSERT INTO public.eventos (negocio_id, zona_id, titulo, descripcion, tipo, precio, precio_moneda, fecha_inicio, fecha_fin, imagen_url, destacado, activo)
    VALUES (
        v_neg_feeling,
        v_zona_minca,
        'Menú del Día y Almuerzos en Feeling Bar',
        'Pasta penne en pesto de la casa, cerdo a la plancha en salsa de maracuyá, lentejas, ensalada fresca y jugo del día natural. Sabores frescos con mucho amor.',
        'comida',
        20000,
        'COP',
        '2026-10-15 12:00:00-05',
        '2026-10-15 16:00:00-05',
        'https://gvrroyncnrnjsaldlges.supabase.co/storage/v1/object/public/eventos/eventos_reales/feeling-bar-almuerzo.webp',
        false,
        true
    );

    -- 5. Meditación Anapana para Niñ@s (Sábado 17 Octubre 9 AM)
    INSERT INTO public.eventos (negocio_id, zona_id, titulo, descripcion, tipo, precio, precio_moneda, fecha_inicio, fecha_fin, imagen_url, destacado, activo)
    VALUES (
        v_neg_dhamma,
        v_zona_minca,
        'Meditación Anapana para Niñ@s (8 a 12 años)',
        'Taller de meditación y respiración consciente para niños de 8 a 12 años. Lugar: Colegio de Minca "I.E.D Técnica de Minca". Inscripción previa por WhatsApp.',
        'bienestar',
        0,
        'COP',
        '2026-10-17 09:00:00-05',
        '2026-10-17 12:00:00-05',
        'https://gvrroyncnrnjsaldlges.supabase.co/storage/v1/object/public/eventos/eventos_reales/meditacion-anapana-ninos.webp',
        false,
        true
    );

    -- 6. Capacitaciones de Coctelería en Casa Cora
    INSERT INTO public.eventos (negocio_id, zona_id, titulo, descripcion, tipo, precio, precio_moneda, fecha_inicio, fecha_fin, imagen_url, destacado, activo)
    VALUES (
        v_neg_cora,
        v_zona_minca,
        'Capacitaciones y Talleres de Coctelería — Casa Cora',
        'Cursos desde Introducción a la Coctelería (Nivel 1), Técnicas y Presentación (Nivel 2), hasta Working Flair (Nivel 3). Talleres complementarios: Cerveza de Jengibre e Inglés de servicio.',
        'comida',
        333000,
        'COP',
        '2026-10-19 09:00:00-05',
        '2026-10-23 13:00:00-05',
        'https://gvrroyncnrnjsaldlges.supabase.co/storage/v1/object/public/eventos/eventos_reales/casa-cora-cocteleria.webp',
        false,
        true
    );

    -- 7. Finca La Frecuencia: Bounce y Acupuntura Comunitaria (Sábado 24 Octubre)
    INSERT INTO public.eventos (negocio_id, zona_id, titulo, descripcion, tipo, precio, precio_moneda, fecha_inicio, fecha_fin, imagen_url, destacado, activo)
    VALUES (
        v_neg_frecuencia,
        v_zona_minca,
        'Bounce & Acupuntura Comunitaria — Finca La Frecuencia',
        'Si el tai chi, sound healing y ecstatic dance tuvieran un hijo, sería Bounce. Explora el cuerpo con respiración y movimiento. Luego, sesión grupal de acupuntura.',
        'bienestar',
        NULL,
        'COP',
        '2026-10-24 10:00:00-05',
        '2026-10-24 16:00:00-05',
        'https://gvrroyncnrnjsaldlges.supabase.co/storage/v1/object/public/eventos/eventos_reales/finca-la-frecuencia.webp',
        true,
        true
    );

    -- 8. Finca La Frecuencia: Sauna de Leña y Baño de Sonido (Domingo 25 Octubre)
    INSERT INTO public.eventos (negocio_id, zona_id, titulo, descripcion, tipo, precio, precio_moneda, fecha_inicio, fecha_fin, imagen_url, destacado, activo)
    VALUES (
        v_neg_frecuencia,
        v_zona_minca,
        'Sauna de Leña & Baño de Sonido — Finca La Frecuencia',
        'Para habitar la presencia y la escucha interior. Sauna de leña acompañado de exploración vocal de sonido y vibración, círculo de cantos sagrados y meditación.',
        'bienestar',
        NULL,
        'COP',
        '2026-10-25 10:00:00-05',
        '2026-10-25 14:00:00-05',
        'https://gvrroyncnrnjsaldlges.supabase.co/storage/v1/object/public/eventos/eventos_reales/finca-la-frecuencia.webp',
        true,
        true
    );

    -- 9. Finca La Frecuencia: Cacao Sensorial & Ecstatic Dance (Sábado 31 Octubre)
    INSERT INTO public.eventos (negocio_id, zona_id, titulo, descripcion, tipo, precio, precio_moneda, fecha_inicio, fecha_fin, imagen_url, destacado, activo)
    VALUES (
        v_neg_frecuencia,
        v_zona_minca,
        'Cacao Sensorial & Ecstatic Dance en Disfraces',
        'Un viaje musical para depurar y regular activamente el sistema nervioso. Cacao, DJ en vivo, baile, ojos vendados y visualización para sacudir lo estancado.',
        'bienestar',
        NULL,
        'COP',
        '2026-10-31 10:00:00-05',
        '2026-10-31 14:00:00-05',
        'https://gvrroyncnrnjsaldlges.supabase.co/storage/v1/object/public/eventos/eventos_reales/finca-la-frecuencia.webp',
        true,
        true
    );

END $$;
