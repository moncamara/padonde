-- ==============================================================================
-- 🌊 PaDónde: Carga Inicial de Aliados y Planes Reales de Mendihuaca
-- ==============================================================================
-- Inserta a Casa Maya (con sus datos de contacto reales y verificados) y
-- 4 experiencias clave de playa, río, surf y sunset en Mendihuaca.
-- Es 100% independiente y NO toca ningún dato ni evento de Minca.
-- ==============================================================================

DO $$
DECLARE
    v_zona_mendihuaca UUID;
    v_neg_maya UUID;
    v_neg_surf UUID;
    v_neg_beach UUID;
    v_neg_rio UUID;
BEGIN
    -- 1. Obtener ID de la Zona Mendihuaca
    SELECT id INTO v_zona_mendihuaca FROM public.zonas WHERE slug = 'mendihuaca' LIMIT 1;
    IF v_zona_mendihuaca IS NULL THEN
        RAISE EXCEPTION 'Zona mendihuaca no encontrada. Corre primero crear_zona_mendihuaca.sql';
    END IF;

    -- 2. REGISTRAR NEGOCIOS / ALIADOS DE MENDIHUACA

    -- A. Casa Maya Mendihuaca (Anfitrión Principal)
    INSERT INTO public.negocios (zona_id, nombre, descripcion, categoria, whatsapp, instagram, plan, activo)
    VALUES (
        v_zona_mendihuaca,
        'Casa Maya Mendihuaca',
        'Guest house y refugio frente al mar en Playa Mendihuaca. A pasos del río y las mejores olas.',
        'hospedaje',
        '573124082342',
        '@casamaya_mendihuaca',
        'pro',
        true
    )
    ON CONFLICT DO NOTHING;
    SELECT id INTO v_neg_maya FROM public.negocios WHERE zona_id = v_zona_mendihuaca AND nombre = 'Casa Maya Mendihuaca' LIMIT 1;

    -- B. Moana Surf Club Mendihuaca
    INSERT INTO public.negocios (zona_id, nombre, descripcion, categoria, whatsapp, instagram, plan, activo)
    VALUES (
        v_zona_mendihuaca,
        'Moana Surf Club Mendihuaca',
        'Escuela de surf profesional, alquiler de tablas y guías de olas para todos los niveles.',
        'tours',
        '573124082342',
        '@moanasurf_mendihuaca',
        'pro',
        true
    )
    ON CONFLICT DO NOTHING;
    SELECT id INTO v_neg_surf FROM public.negocios WHERE zona_id = v_zona_mendihuaca AND nombre = 'Moana Surf Club Mendihuaca' LIMIT 1;

    -- C. Mendihuaca Beach Restobar
    INSERT INTO public.negocios (zona_id, nombre, descripcion, categoria, whatsapp, instagram, plan, activo)
    VALUES (
        v_zona_mendihuaca,
        'Mendihuaca Beach Restobar',
        'Cocina de mar fresca, cócteles tropicales y terraza con la mejor vista al atardecer caribeño.',
        'comida',
        '573124082342',
        '@mendihuacabeach',
        'gratis',
        true
    )
    ON CONFLICT DO NOTHING;
    SELECT id INTO v_neg_beach FROM public.negocios WHERE zona_id = v_zona_mendihuaca AND nombre = 'Mendihuaca Beach Restobar' LIMIT 1;

    -- D. Río Mendihuaca Ecotours
    INSERT INTO public.negocios (zona_id, nombre, descripcion, categoria, whatsapp, instagram, plan, activo)
    VALUES (
        v_zona_mendihuaca,
        'Río Mendihuaca Ecotours',
        'Experiencias acuáticas de tubbing, senderismo y naturaleza donde el río se une con el mar.',
        'tours',
        '573124082342',
        NULL,
        'gratis',
        true
    )
    ON CONFLICT DO NOTHING;
    SELECT id INTO v_neg_rio FROM public.negocios WHERE zona_id = v_zona_mendihuaca AND nombre = 'Río Mendihuaca Ecotours' LIMIT 1;


    -- 3. REGISTRAR LOS PLANES Y EXPERIENCIAS EN CARTELERA

    -- 1. Pasadía de Río y Mar en Casa Maya (Destacado)
    INSERT INTO public.eventos (negocio_id, zona_id, titulo, descripcion, tipo, precio, precio_moneda, fecha_inicio, fecha_fin, imagen_url, destacado, activo)
    VALUES (
        v_neg_maya,
        v_zona_mendihuaca,
        'Pasadía de Río y Mar en Casa Maya',
        'Ven a pasar el día frente al mar en una de las playas más hermosas del Caribe. Incluye acceso a zona de playa, hamacas con brisa marina, wifi, duchas de agua dulce y carta de bebidas y snacks. El valor del pasadía es 100% consumible. [RECURRENTE:Lun,Mar,Mie,Jue,Vie,Sab,Dom]',
        'hospedaje',
        35000,
        'COP',
        NOW()::date + interval '9 hours',
        NOW()::date + interval '30 days',
        'https://images.unsplash.com/photo-1540541338287-41700207dee6?w=1000&q=80',
        true,
        true
    );

    -- 2. Hospedaje & Desconexión Frente a las Olas
    INSERT INTO public.eventos (negocio_id, zona_id, titulo, descripcion, tipo, precio, precio_moneda, fecha_inicio, fecha_fin, imagen_url, destacado, activo)
    VALUES (
        v_neg_maya,
        v_zona_mendihuaca,
        'Hospedaje & Descanso Frente al Mar en Casa Maya',
        'Habitaciones privadas y cómodas a pocos pasos de la arena. Balcones con hamacas, cocina compartida, ambiente tranquilo y pet friendly. Reserva directa por WhatsApp sin comisiones ni intermediarios. [RECURRENTE:Lun,Mar,Mie,Jue,Vie,Sab,Dom]',
        'hospedaje',
        0,
        'COP',
        NOW()::date + interval '14 hours',
        NOW()::date + interval '30 days',
        'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=1000&q=80',
        true,
        true
    );

    -- 3. Clases de Surf en la Ola de Mendihuaca
    INSERT INTO public.eventos (negocio_id, zona_id, titulo, descripcion, tipo, precio, precio_moneda, fecha_inicio, fecha_fin, imagen_url, destacado, activo)
    VALUES (
        v_neg_surf,
        v_zona_mendihuaca,
        'Clases de Surf & Alquiler de Tablas en Mendihuaca',
        'Aprende a surfear en una de las olas más consistentes y divertidas de Colombia. Clases personalizadas de 1.5 horas con instructor certificado, teoría de seguridad, práctica en el agua y tabla incluida. También alquiler por horas o por día. [RECURRENTE:Lun,Mar,Mie,Jue,Vie,Sab,Dom]',
        'tours',
        80000,
        'COP',
        NOW()::date + interval '8 hours',
        NOW()::date + interval '30 days',
        'https://images.unsplash.com/photo-1502680390469-be75c86b636f?w=1000&q=80',
        false,
        true
    );

    -- 4. Sunset Session & Cócteles al Atardecer
    INSERT INTO public.eventos (negocio_id, zona_id, titulo, descripcion, tipo, precio, precio_moneda, fecha_inicio, fecha_fin, imagen_url, destacado, activo)
    VALUES (
        v_neg_beach,
        v_zona_mendihuaca,
        'Sunset Session: 2x1 en Cócteles Frente al Atardecer',
        'Disfruta la hora dorada en la playa con vista a la desembocadura. 2x1 en Gin Tonics y Margaritas tropicales, ceviche fresco de pesca artesanal y música playera relajante para despedir el sol. [RECURRENTE:Jue,Vie,Sab,Dom]',
        'comida',
        0,
        'COP',
        NOW()::date + interval '17 hours',
        NOW()::date + interval '30 days',
        'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1000&q=80',
        false,
        true
    );

    -- 5. Tubbing Ecológico por el Río Mendihuaca
    INSERT INTO public.eventos (negocio_id, zona_id, titulo, descripcion, tipo, precio, precio_moneda, fecha_inicio, fecha_fin, imagen_url, destacado, activo)
    VALUES (
        v_neg_rio,
        v_zona_mendihuaca,
        'Tubbing Ecológico por las Aguas Cristalinas del Río',
        'Un descenso suave y refrescante en neumático por el río Mendihuaca, rodeado de vegetación tropical, aves y árboles milenarios, hasta desembocar en el mar Caribe. Incluye flotador, chaleco salvavidas y guía local. [RECURRENTE:Lun,Mar,Mie,Jue,Vie,Sab,Dom]',
        'tours',
        40000,
        'COP',
        NOW()::date + interval '10 hours',
        NOW()::date + interval '30 days',
        'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=1000&q=80',
        false,
        true
    );

END $$;
