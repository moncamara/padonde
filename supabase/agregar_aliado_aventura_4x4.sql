-- ==============================================================================
-- 🌿 PaDónde Minca: Nuevo Aliado & Evento Destacado — Aventura 4X4 Minca
-- Categoría: 'tours' (🌿 Tours & Naturaleza)
-- Vincula el Tarifario Oficial de 69 rutas en la Cartelera Principal y Detalle
-- ==============================================================================

DO $$
DECLARE
    v_zona_minca UUID;
    v_negocio_id UUID;
    v_evento_id UUID := gen_random_uuid();
BEGIN
    -- 1. Obtener la zona de Minca
    SELECT id INTO v_zona_minca FROM public.zonas WHERE slug = 'minca' LIMIT 1;
    IF v_zona_minca IS NULL THEN
        SELECT id INTO v_zona_minca FROM public.zonas LIMIT 1;
    END IF;

    -- 2. Insertar o actualizar el Aliado Comercial en la tabla negocios
    IF EXISTS (SELECT 1 FROM public.negocios WHERE whatsapp = '573113790239') THEN
        UPDATE public.negocios
        SET
            nombre = 'Aventura 4X4 Minca',
            descripcion = 'Servicio oficial de expediciones, tours y transporte 4x4 en camperos encapsulados hacia Cerro Kennedy, cascadas, reservas naturales y Sierra Alta.',
            categoria = 'tours',
            plan = 'pro',
            activo = true
        WHERE whatsapp = '573113790239';
        
        SELECT id INTO v_negocio_id FROM public.negocios WHERE whatsapp = '573113790239' LIMIT 1;
    ELSE
        INSERT INTO public.negocios (
            zona_id,
            nombre,
            descripcion,
            categoria,
            whatsapp,
            instagram,
            plan,
            plan_expira_en,
            activo
        ) VALUES (
            v_zona_minca,
            'Aventura 4X4 Minca',
            'Servicio oficial de expediciones, tours y transporte 4x4 en camperos encapsulados hacia Cerro Kennedy, cascadas, reservas naturales y Sierra Alta.',
            'tours',
            '573113790239',
            'aventura4x4minca',
            'pro',
            NOW() + INTERVAL '365 days',
            true
        )
        RETURNING id INTO v_negocio_id;
    END IF;

    -- 3. Insertar o actualizar el Evento / Tour Destacado en la Cartelera Principal
    IF EXISTS (
        SELECT 1 FROM public.eventos 
        WHERE negocio_id = v_negocio_id AND LOWER(titulo) LIKE '%aventura 4x4%'
    ) THEN
        UPDATE public.eventos
        SET
            titulo = '🚙 Expediciones 4x4, Cerro Kennedy & Rutas Sierra Alta — Aventura 4X4',
            descripcion = 'Conoce los rincones más espectaculares de la Sierra Nevada de Santa Marta con la flotilla oficial de camperos 4x4 encapsulados (capacidad de 1 a 4 personas).

⛰️ EXPEDICIONES & TOURS DESTACADOS:
• Amanecer en Cerro Kennedy & San Rafael: Vista 360° a los picos nevados Colón y Bolívar.
• Circuito de Cascadas: Marinka, Pozo Azul, Oído del Mundo y Cascada Escondida.
• Reserva Natural El Dorado (ProAves): El paraíso mundial del avistamiento de aves endémicas.
• Circuito Nubes: Hostales de altura, senderos de café y bosque de niebla.
• Expresos directos: Santa Marta, Rodadero, Aeropuerto Simón Bolívar y Parque Tayrona.

📋 TARIFAS TRANSPARENTES:
Contamos con tarifario oficial unificado de 69 rutas. Consulta destinos, hostales y cotiza directamente por WhatsApp.

<!--recurrente:0,1,2,3,4,5,6-->',
            tipo = 'tours',
            precio = 0,
            precio_moneda = 'COP',
            activo = true,
            destacado = false,
            metadata_hospedaje = jsonb_build_object(
                'tarifario_id', 'transporte-aventura-4x4-minca'
            )
        WHERE negocio_id = v_negocio_id AND LOWER(titulo) LIKE '%aventura 4x4%';
    ELSE
        INSERT INTO public.eventos (
            id,
            negocio_id,
            zona_id,
            titulo,
            descripcion,
            tipo,
            precio,
            precio_moneda,
            fecha_inicio,
            fecha_fin,
            imagen_url,
            activo,
            destacado,
            metadata_hospedaje
        ) VALUES (
            v_evento_id,
            v_negocio_id,
            v_zona_minca,
            '🚙 Expediciones 4x4, Cerro Kennedy & Rutas Sierra Alta — Aventura 4X4',
            'Conoce los rincones más espectaculares de la Sierra Nevada de Santa Marta con la flotilla oficial de camperos 4x4 encapsulados (capacidad de 1 a 4 personas).

⛰️ EXPEDICIONES & TOURS DESTACADOS:
• Amanecer en Cerro Kennedy & San Rafael: Vista 360° a los picos nevados Colón y Bolívar.
• Circuito de Cascadas: Marinka, Pozo Azul, Oído del Mundo y Cascada Escondida.
• Reserva Natural El Dorado (ProAves): El paraíso mundial del avistamiento de aves endémicas.
• Circuito Nubes: Hostales de altura, senderos de café y bosque de niebla.
• Expresos directos: Santa Marta, Rodadero, Aeropuerto Simón Bolívar y Parque Tayrona.

📋 TARIFAS TRANSPARENTES:
Contamos con tarifario oficial unificado de 69 rutas. Consulta destinos, hostales y cotiza directamente por WhatsApp.

<!--recurrente:0,1,2,3,4,5,6-->',
            'tours',
            0,
            'COP',
            NOW(),
            NOW() + INTERVAL '365 days',
            'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=1200&q=80',
            true,
            false,
            jsonb_build_object(
                'tarifario_id', 'transporte-aventura-4x4-minca'
            )
        );
    END IF;

    RAISE NOTICE 'Aliado y Evento Aventura 4X4 guardados exitosamente como Destacado en Cartelera.';
END $$;
