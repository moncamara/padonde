-- ==============================================================================
-- 🌿 PaDónde: Carga y Activación de Hospedaje "Rancho de la Luna Minca"
-- ==============================================================================
-- Refugio rústico y holístico en la montaña de Minca (Sierra Nevada de Santa Marta):
-- 1. Aliado pro verificado (WhatsApp directo: +57 316 352 7025).
-- 2. Publicación de Hospedaje con fotos reales de images_reales en WebP.
-- 3. Cotizador interactivo de habitaciones (Cabaña Luna Llena & Dormitorio Sol Naciente).
-- 4. Experiencias holísticas: Sanación Reiki con Nelson & Centro Cultural con Laura.
-- ==============================================================================

DO $$
DECLARE
    v_zona_minca UUID;
    v_neg_rancho UUID;
    v_ev_hospedaje UUID;
BEGIN
    -- 1. Obtener Zona Minca
    SELECT id INTO v_zona_minca FROM public.zonas WHERE slug = 'minca' LIMIT 1;

    -- 2. Crear o Actualizar Negocio Aliado: Rancho de la Luna
    SELECT id INTO v_neg_rancho FROM public.negocios 
    WHERE zona_id = v_zona_minca AND (nombre ILIKE '%Rancho de la Luna%' OR nombre ILIKE '%Rancho Luna%') LIMIT 1;

    IF v_neg_rancho IS NULL THEN
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
            v_zona_minca,
            'Rancho de la Luna Minca',
            'Refugio holístico y rústico en la montaña de Minca. Cabañas en bahareque, sanación Reiki con Nelson y centro cultural con arte y danza por Laura.',
            'hospedaje',
            '573163527025',
            '@ranchodelalunaminca',
            'pro',
            true
        )
        RETURNING id INTO v_neg_rancho;
    ELSE
        UPDATE public.negocios
        SET whatsapp = '573163527025',
            instagram = '@ranchodelalunaminca',
            plan = 'pro',
            activo = true
        WHERE id = v_neg_rancho;
    END IF;

    -- 3. Crear o Actualizar Evento Tipo 'hospedaje' con Cotizador y Habitaciones
    SELECT id INTO v_ev_hospedaje FROM public.eventos 
    WHERE negocio_id = v_neg_rancho AND tipo = 'hospedaje' LIMIT 1;

    IF v_ev_hospedaje IS NOT NULL THEN
        UPDATE public.eventos
        SET titulo = 'Rancho de la Luna — Refugio Holístico, Sanación Reiki & Cabañas en Bahareque',
            descripcion = '🌿 Donde la montaña se convierte en hogar y sanación...

A solo 20 minutos caminando del pueblo de Minca por un sendero natural de montaña, Rancho de la Luna es un refugio rústico y holístico levantado en bahareque tradicional, bambú y piedra viva. 🛖✨

Un espacio pensado para descansar profundo, respirar aire puro y reconectar con el cuerpo y la tierra.

✨ Lo que hace único a Rancho de la Luna:
• 🛖 Bioconstrucción auténtica: Muros térmicos en bahareque, techos frescos y ventilación natural.
• 🌅 Mirador "Vista Wao": Vistas panorámicas privilegiadas sobre la Sierra Nevada y atardeceres mágicos.
• 🧘 Sesiones de Sanación Reiki y masajes terapéuticos de montaña guiados por Nelson.
• 🎨 Centro Cultural: Arte vivo, diseño artesanal y movimiento consciente con Laura.
• 🦜 Naturaleza viva: Árboles frutales, café serrano, nacedero de agua pura y avistamiento de aves endémicas.
• 🍳 Cocina compartida rústica y terrazas con hamacas.

📲 Cotiza tu estancia abajo o comunícate directamente a nuestro WhatsApp para reservar sin comisiones de intermediarios.',
            tipo = 'hospedaje',
            precio = 60000,
            precio_moneda = 'COP',
            fecha_inicio = NOW(),
            fecha_fin = NOW() + interval '365 days',
            imagen_url = '/images/hospedajes/rancho-de-la-luna/vista_wao.webp',
            destacado = true,
            activo = true,
            metadata_hospedaje = '{
                "check_in_hora": "14:00",
                "check_out_hora": "11:00",
                "google_reputacion": {
                    "rating": 4.9,
                    "total_reviews": 64,
                    "maps_url": "https://maps.app.goo.gl/minca"
                },
                "habitaciones": [
                    {
                        "id": "cabanita-luna-llena",
                        "titulo": "Cabaña Privada \"Luna Llena\"",
                        "descripcion": "Bohío rústico y acogedor en bahareque y vigas de bambú con cama doble, balcón privado con vista a la montaña y espacio para mochileros.",
                        "precio_noche_cop": 120000,
                        "capacidad_max": 2,
                        "fotos": [
                            "/images/hospedajes/rancho-de-la-luna/bohio.webp",
                            "/images/hospedajes/rancho-de-la-luna/bohio2.webp",
                            "/images/hospedajes/rancho-de-la-luna/vista_wao.webp"
                        ],
                        "badges": [
                            { "icono": "🌄", "texto": "Balcón con Vista" },
                            { "icono": "🛖", "texto": "Bahareque & Bambú" },
                            { "icono": "🛏️", "texto": "Cama Doble" },
                            { "icono": "🎒", "texto": "Espacio Mochilero" }
                        ]
                    },
                    {
                        "id": "dormitorio-sol-naciente",
                        "titulo": "Dormitorio Compartido \"Sol Naciente\"",
                        "descripcion": "Camas individuales estilo hostal rústico de montaña. Ideal para mochileros y amantes de la comunidad, con acceso a cocina, mirador y hamacas.",
                        "precio_noche_cop": 60000,
                        "capacidad_max": 1,
                        "fotos": [
                            "/images/hospedajes/rancho-de-la-luna/compartido.webp",
                            "/images/hospedajes/rancho-de-la-luna/casa.webp",
                            "/images/hospedajes/rancho-de-la-luna/bano.webp"
                        ],
                        "badges": [
                            { "icono": "👥", "texto": "Ambiente Social" },
                            { "icono": "🍳", "texto": "Cocina Abierta" },
                            { "icono": "🌅", "texto": "Acceso al Mirador" },
                            { "icono": "💧", "texto": "Agua de Nacedero" }
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
            v_neg_rancho,
            v_zona_minca,
            'Rancho de la Luna — Refugio Holístico, Sanación Reiki & Cabañas en Bahareque',
            '🌿 Donde la montaña se convierte en hogar y sanación...

A solo 20 minutos caminando del pueblo de Minca por un sendero natural de montaña, Rancho de la Luna es un refugio rústico y holístico levantado en bahareque tradicional, bambú y piedra viva. 🛖✨

Un espacio pensado para descansar profundo, respirar aire puro y reconectar con el cuerpo y la tierra.

✨ Lo que hace único a Rancho de la Luna:
• 🛖 Bioconstrucción auténtica: Muros térmicos en bahareque, techos frescos y ventilación natural.
• 🌅 Mirador "Vista Wao": Vistas panorámicas privilegiadas sobre la Sierra Nevada y atardeceres mágicos.
• 🧘 Sesiones de Sanación Reiki y masajes terapéuticos de montaña guiados por Nelson.
• 🎨 Centro Cultural: Arte vivo, diseño artesanal y movimiento consciente con Laura.
• 🦜 Naturaleza viva: Árboles frutales, café serrano, nacedero de agua pura y avistamiento de aves endémicas.
• 🍳 Cocina compartida rústica y terrazas con hamacas.

📲 Cotiza tu estancia abajo o comunícate directamente a nuestro WhatsApp para reservar sin comisiones de intermediarios.',
            'hospedaje',
            60000,
            'COP',
            NOW(),
            NOW() + interval '365 days',
            '/images/hospedajes/rancho-de-la-luna/vista_wao.webp',
            true,
            true,
            '{
                "check_in_hora": "14:00",
                "check_out_hora": "11:00",
                "google_reputacion": {
                    "rating": 4.9,
                    "total_reviews": 64,
                    "maps_url": "https://maps.app.goo.gl/minca"
                },
                "habitaciones": [
                    {
                        "id": "cabanita-luna-llena",
                        "titulo": "Cabaña Privada \"Luna Llena\"",
                        "descripcion": "Bohío rústico y acogedor en bahareque y vigas de bambú con cama doble, balcón privado con vista a la montaña y espacio para mochileros.",
                        "precio_noche_cop": 120000,
                        "capacidad_max": 2,
                        "fotos": [
                            "/images/hospedajes/rancho-de-la-luna/bohio.webp",
                            "/images/hospedajes/rancho-de-la-luna/bohio2.webp",
                            "/images/hospedajes/rancho-de-la-luna/vista_wao.webp"
                        ],
                        "badges": [
                            { "icono": "🌄", "texto": "Balcón con Vista" },
                            { "icono": "🛖", "texto": "Bahareque & Bambú" },
                            { "icono": "🛏️", "texto": "Cama Doble" },
                            { "icono": "🎒", "texto": "Espacio Mochilero" }
                        ]
                    },
                    {
                        "id": "dormitorio-sol-naciente",
                        "titulo": "Dormitorio Compartido \"Sol Naciente\"",
                        "descripcion": "Camas individuales estilo hostal rústico de montaña. Ideal para mochileros y amantes de la comunidad, con acceso a cocina, mirador y hamacas.",
                        "precio_noche_cop": 60000,
                        "capacidad_max": 1,
                        "fotos": [
                            "/images/hospedajes/rancho-de-la-luna/compartido.webp",
                            "/images/hospedajes/rancho-de-la-luna/casa.webp",
                            "/images/hospedajes/rancho-de-la-luna/bano.webp"
                        ],
                        "badges": [
                            { "icono": "👥", "texto": "Ambiente Social" },
                            { "icono": "🍳", "texto": "Cocina Abierta" },
                            { "icono": "🌅", "texto": "Acceso al Mirador" },
                            { "icono": "💧", "texto": "Agua de Nacedero" }
                        ]
                    }
                ]
            }'::jsonb
        );
    END IF;

    RAISE NOTICE '✅ Rancho de la Luna Minca configurado exitosamente como Hospedaje en PaDónde.';
END $$;
