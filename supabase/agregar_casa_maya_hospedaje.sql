-- ==============================================================================
-- 🌊 PaDónde: Carga y Activación de Hospedaje "Casa Maya Mendihuaca"
-- ==============================================================================
-- Configura a Casa Maya como el hospedaje estrella de Mendihuaca con:
-- 1. Aliado pro verificado (@casamaya_mendihuaca, WhatsApp directo).
-- 2. Publicación de Hospedaje con fotos reales de la carpeta fotos_pendientes.
-- 3. Cotizador interactivo de habitaciones (Deluxe Mar, Doble Jardín, Familiar).
-- 4. Reputación de Booking / Google (Puntuación 9,6/10).
-- ==============================================================================

DO $$
DECLARE
    v_zona_mendihuaca UUID;
    v_neg_maya UUID;
    v_ev_hospedaje UUID;
BEGIN
    -- 1. Obtener o crear Zona Mendihuaca
    SELECT id INTO v_zona_mendihuaca FROM public.zonas WHERE slug = 'mendihuaca' LIMIT 1;
    IF v_zona_mendihuaca IS NULL THEN
        INSERT INTO public.zonas (nombre, slug, descripcion, activa)
        VALUES (
            'Mendihuaca',
            'mendihuaca',
            'Playas vírgenes, río, surf y naturaleza a los pies de la Sierra Nevada',
            true
        )
        RETURNING id INTO v_zona_mendihuaca;
    END IF;

    -- 2. Crear o Actualizar Negocio Aliado: Casa Maya Mendihuaca
    SELECT id INTO v_neg_maya FROM public.negocios 
    WHERE zona_id = v_zona_mendihuaca AND nombre ILIKE '%Casa Maya%' LIMIT 1;

    IF v_neg_maya IS NULL THEN
        INSERT INTO public.negocios (
            zona_id,
            nombre,
            descripcion,
            categoria,
            whatsapp,
            instagram,
            plan,
            activo
        ) VALUES (
            v_zona_mendihuaca,
            'Casa Maya Mendihuaca',
            'Guest house y refugio frente al mar en Playa Mendihuaca. A pasos del río y las mejores olas.',
            'hospedaje',
            '573124082342',
            '@casamaya_mendihuaca',
            'pro',
            true
        )
        RETURNING id INTO v_neg_maya;
    ELSE
        UPDATE public.negocios
        SET whatsapp = '573124082342',
            instagram = '@casamaya_mendihuaca',
            plan = 'pro',
            activo = true
        WHERE id = v_neg_maya;
    END IF;

    -- 3. Crear o Actualizar Evento Tipo 'hospedaje' con Cotizador y Habitaciones
    SELECT id INTO v_ev_hospedaje FROM public.eventos 
    WHERE negocio_id = v_neg_maya AND tipo = 'hospedaje' LIMIT 1;

    IF v_ev_hospedaje IS NOT NULL THEN
        UPDATE public.eventos
        SET titulo = 'Casa Maya Mendihuaca — Hospedaje & Refugio Frente al Mar',
            descripcion = 'Casa Maya Mendihuaca está ubicada en Playa Mendiguaca, a pocos pasos de la desembocadura del río y de las mejores olas del Caribe colombiano. 

Disfruta de habitaciones privadas frente a la playa con balcón y hamacas, jardín tropical, acceso a playa privada, wifi gratis, cocina compartida y salón de uso común.

🌊 Destacados de Casa Maya:
• Salida directa a la playa y sonido de las olas 24/7.
• Balcones privados con hamaca y vista al mar y al jardín.
• Ambiente tranquilo, seguro, natural y pet friendly.
• A pocos pasos de clases de surf y paseos por el río.
• Ubicación con puntuación 9,6/10 por parejas y viajeros internacionales.

📲 Cotiza tu habitación en el calculador interactivo abajo o contáctanos por WhatsApp para reservar directo sin comisiones de intermediarios.',
            tipo = 'hospedaje',
            precio = 240000,
            precio_moneda = 'COP',
            fecha_inicio = NOW(),
            fecha_fin = NOW() + interval '365 days',
            imagen_url = '/images/hospedajes/casa-maya/foto_hotel_5.jpg',
            destacado = true,
            activo = true,
            metadata_hospedaje = '{
                "check_in_hora": "15:00",
                "check_out_hora": "11:00",
                "google_reputacion": {
                    "rating": 4.9,
                    "total_reviews": 128,
                    "maps_url": "https://maps.app.goo.gl/mendihuaca"
                },
                "habitaciones": [
                    {
                        "id": "hab-deluxe-mar",
                        "titulo": "Habitación Doble Deluxe con Balcón y Vista al Mar",
                        "descripcion": "Cama doble, balcón privado con hamaca frente al mar, baño privado con artículos de aseo y vista panorámica al Caribe.",
                        "precio_noche_cop": 280000,
                        "capacidad_max": 2,
                        "fotos": [
                            "/images/hospedajes/casa-maya/foto_hotel_5.jpg",
                            "/images/hospedajes/casa-maya/foto_hotel_7.jpg",
                            "/images/hospedajes/casa-maya/foto_hotel_2.jpg"
                        ],
                        "badges": [
                            { "icono": "🌊", "texto": "Vista al mar" },
                            { "icono": "🌄", "texto": "Balcón con hamaca" },
                            { "icono": "🚿", "texto": "Baño privado" },
                            { "icono": "📶", "texto": "Wi-Fi gratis" }
                        ]
                    },
                    {
                        "id": "hab-doble-jardin",
                        "titulo": "Habitación Doble con Vista al Jardín Tropical",
                        "descripcion": "Cama doble y sofá cama, ambiente fresco rodeado de palmeras y naturaleza, baño privado y salida directa a la playa.",
                        "precio_noche_cop": 240000,
                        "capacidad_max": 3,
                        "fotos": [
                            "/images/hospedajes/casa-maya/foto_hotel_3.jpg",
                            "/images/hospedajes/casa-maya/foto_hotel_4.jpg",
                            "/images/hospedajes/casa-maya/foto_hotel_6.jpg"
                        ],
                        "badges": [
                            { "icono": "🌿", "texto": "Vista al jardín" },
                            { "icono": "🚿", "texto": "Baño privado" },
                            { "icono": "📶", "texto": "Wi-Fi gratis" },
                            { "icono": "🌀", "texto": "Ventilador" }
                        ]
                    },
                    {
                        "id": "hab-familiar-mar",
                        "titulo": "Habitación Familiar Frente a la Playa",
                        "descripcion": "Ideal para familias o grupos de amigos. Amplia, luminosa, a pasos de la arena y con acceso a cocina compartida y terraza.",
                        "precio_noche_cop": 350000,
                        "capacidad_max": 4,
                        "fotos": [
                            "/images/hospedajes/casa-maya/foto_hotel_8.jpg",
                            "/images/hospedajes/casa-maya/foto_hotel_9.jpg",
                            "/images/hospedajes/casa-maya/foto_hotel_11.jpg"
                        ],
                        "badges": [
                            { "icono": "🏖️", "texto": "Frente a la playa" },
                            { "icono": "👨‍👩‍👧‍👦", "texto": "Familiar" },
                            { "icono": "🚿", "texto": "Baño privado" },
                            { "icono": "🍳", "texto": "Cocina compartida" }
                        ]
                    }
                ]
            }'::jsonb
        WHERE id = v_ev_hospedaje;
    ELSE
        INSERT INTO public.eventos (
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
            destacado,
            activo,
            metadata_hospedaje
        ) VALUES (
            v_neg_maya,
            v_zona_mendihuaca,
            'Casa Maya Mendihuaca — Hospedaje & Refugio Frente al Mar',
            'Casa Maya Mendihuaca está ubicada en Playa Mendiguaca, a pocos pasos de la desembocadura del río y de las mejores olas del Caribe colombiano. 

Disfruta de habitaciones privadas frente a la playa con balcón y hamacas, jardín tropical, acceso a playa privada, wifi gratis, cocina compartida y salón de uso común.

🌊 Destacados de Casa Maya:
• Salida directa a la playa y sonido de las olas 24/7.
• Balcones privados con hamaca y vista al mar y al jardín.
• Ambiente tranquilo, seguro, natural y pet friendly.
• A pocos pasos de clases de surf y paseos por el río.
• Ubicación con puntuación 9,6/10 por parejas y viajeros internacionales.

📲 Cotiza tu habitación en el calculador interactivo abajo o contáctanos por WhatsApp para reservar directo sin comisiones de intermediarios.',
            'hospedaje',
            240000,
            'COP',
            NOW(),
            NOW() + interval '365 days',
            '/images/hospedajes/casa-maya/foto_hotel_5.jpg',
            true,
            true,
            '{
                "check_in_hora": "15:00",
                "check_out_hora": "11:00",
                "google_reputacion": {
                    "rating": 4.9,
                    "total_reviews": 128,
                    "maps_url": "https://maps.app.goo.gl/mendihuaca"
                },
                "habitaciones": [
                    {
                        "id": "hab-deluxe-mar",
                        "titulo": "Habitación Doble Deluxe con Balcón y Vista al Mar",
                        "descripcion": "Cama doble, balcón privado con hamaca frente al mar, baño privado con artículos de aseo y vista panorámica al Caribe.",
                        "precio_noche_cop": 280000,
                        "capacidad_max": 2,
                        "fotos": [
                            "/images/hospedajes/casa-maya/foto_hotel_5.jpg",
                            "/images/hospedajes/casa-maya/foto_hotel_7.jpg",
                            "/images/hospedajes/casa-maya/foto_hotel_2.jpg"
                        ],
                        "badges": [
                            { "icono": "🌊", "texto": "Vista al mar" },
                            { "icono": "🌄", "texto": "Balcón con hamaca" },
                            { "icono": "🚿", "texto": "Baño privado" },
                            { "icono": "📶", "texto": "Wi-Fi gratis" }
                        ]
                    },
                    {
                        "id": "hab-doble-jardin",
                        "titulo": "Habitación Doble con Vista al Jardín Tropical",
                        "descripcion": "Cama doble y sofá cama, ambiente fresco rodeado de palmeras y naturaleza, baño privado y salida directa a la playa.",
                        "precio_noche_cop": 240000,
                        "capacidad_max": 3,
                        "fotos": [
                            "/images/hospedajes/casa-maya/foto_hotel_3.jpg",
                            "/images/hospedajes/casa-maya/foto_hotel_4.jpg",
                            "/images/hospedajes/casa-maya/foto_hotel_6.jpg"
                        ],
                        "badges": [
                            { "icono": "🌿", "texto": "Vista al jardín" },
                            { "icono": "🚿", "texto": "Baño privado" },
                            { "icono": "📶", "texto": "Wi-Fi gratis" },
                            { "icono": "🌀", "texto": "Ventilador" }
                        ]
                    },
                    {
                        "id": "hab-familiar-mar",
                        "titulo": "Habitación Familiar Frente a la Playa",
                        "descripcion": "Ideal para familias o grupos de amigos. Amplia, luminosa, a pasos de la arena y con acceso a cocina compartida y terraza.",
                        "precio_noche_cop": 350000,
                        "capacidad_max": 4,
                        "fotos": [
                            "/images/hospedajes/casa-maya/foto_hotel_8.jpg",
                            "/images/hospedajes/casa-maya/foto_hotel_9.jpg",
                            "/images/hospedajes/casa-maya/foto_hotel_11.jpg"
                        ],
                        "badges": [
                            { "icono": "🏖️", "texto": "Frente a la playa" },
                            { "icono": "👨‍👩‍👧‍👦", "texto": "Familiar" },
                            { "icono": "🚿", "texto": "Baño privado" },
                            { "icono": "🍳", "texto": "Cocina compartida" }
                        ]
                    }
                ]
            }'::jsonb
        );
    END IF;

    RAISE NOTICE 'Casa Maya Mendihuaca cargada con éxito con sus 3 habitaciones y fotos.';
END $$;
