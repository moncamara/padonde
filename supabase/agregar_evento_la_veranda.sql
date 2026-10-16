-- ==============================================================================
-- 🏡 PaDónde Minca: Registro de La Veranda Hotels y Promoción de Octubre (3x2)
-- ==============================================================================
-- Negocio: La Veranda Hotels
-- Promoción: "Reserva 2 noches y recibe la tercera GRATIS en octubre"
-- Foto optimizada en Supabase Storage:
--   https://gvrroyncnrnjsaldlges.supabase.co/storage/v1/object/public/eventos/eventos_reales/laveranda.webp
-- ==============================================================================

DO $$
DECLARE
    v_zona_minca UUID;
    v_negocio_id UUID;
    v_evento_id UUID;
    -- ⚠️ WhatsApp de contacto directo de La Veranda Hotels (con indicativo 57 sin +)
    -- Si tienes el número exacto, reemplázalo aquí antes de ejecutar:
    v_whatsapp TEXT := '573000000000'; 
    v_instagram TEXT := '@laverandahotels';
BEGIN
    -- 1. Obtener ID de la zona Minca
    SELECT id INTO v_zona_minca FROM public.zonas WHERE slug = 'minca' LIMIT 1;
    IF v_zona_minca IS NULL THEN
        RAISE EXCEPTION 'Zona minca no encontrada en la base de datos.';
    END IF;

    -- 2. Registrar o Actualizar el Negocio Aliado: La Veranda Hotels
    SELECT id INTO v_negocio_id 
    FROM public.negocios 
    WHERE zona_id = v_zona_minca AND nombre ILIKE '%La Veranda%' 
    LIMIT 1;

    IF v_negocio_id IS NULL THEN
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
            'La Veranda Hotels',
            'Hotel boutique y descanso en Minca. Naturaleza, piscina y desconexión total en la Sierra Nevada.',
            'hospedaje',
            v_whatsapp,
            v_instagram,
            'gratis',
            true
        ) RETURNING id INTO v_negocio_id;

        RAISE NOTICE '✅ Negocio creado: La Veranda Hotels (ID: %)', v_negocio_id;
    ELSE
        UPDATE public.negocios
        SET 
            nombre = 'La Veranda Hotels',
            descripcion = 'Hotel boutique y descanso en Minca. Naturaleza, piscina y desconexión total en la Sierra Nevada.',
            categoria = 'hospedaje',
            instagram = v_instagram,
            activo = true,
            -- Solo actualiza el WhatsApp si no es el placeholder genérico
            whatsapp = CASE WHEN v_whatsapp <> '573000000000' THEN v_whatsapp ELSE whatsapp END
        WHERE id = v_negocio_id;

        RAISE NOTICE '✅ Negocio actualizado: La Veranda Hotels (ID: %)', v_negocio_id;
    END IF;

    -- 3. Registrar o Actualizar la Promoción de Octubre
    SELECT id INTO v_evento_id
    FROM public.eventos
    WHERE negocio_id = v_negocio_id AND titulo ILIKE '%La Veranda%'
    LIMIT 1;

    IF v_evento_id IS NULL THEN
        INSERT INTO public.eventos (
            zona_id,
            negocio_id,
            titulo,
            descripcion,
            tipo,
            precio,
            precio_moneda,
            fecha_inicio,
            fecha_fin,
            imagen_url,
            destacado,
            tiene_boleteria,
            activo
        ) VALUES (
            v_zona_minca,
            v_negocio_id,
            'Escápate a Minca en Octubre — 3x2 en La Veranda Hotels',
            '✨ ¡Escápate a Minca en octubre! ✨

🏡 Reserva 2 noches y recibe la tercera GRATIS en La Veranda Hotels.

💦 Descanso, naturaleza y piscina te esperan en la Sierra Nevada.

📲 ¡Escríbenos y reserva directamente con nosotros!

#LaVerandaExperience #Minca #SantaMarta

<!--recurrente:1,2,3,4,5,6,0-->',
            'hospedaje',
            NULL,
            'COP',
            '2026-10-16 09:00:00-05',
            '2026-10-31 23:59:00-05',
            'https://gvrroyncnrnjsaldlges.supabase.co/storage/v1/object/public/eventos/eventos_reales/laveranda.webp',
            false,
            false,
            true
        ) RETURNING id INTO v_evento_id;

        RAISE NOTICE '✅ Publicación creada: Escápate a Minca en Octubre (ID: %)', v_evento_id;
    ELSE
        UPDATE public.eventos
        SET 
            titulo = 'Escápate a Minca en Octubre — 3x2 en La Veranda Hotels',
            descripcion = '✨ ¡Escápate a Minca en octubre! ✨

🏡 Reserva 2 noches y recibe la tercera GRATIS en La Veranda Hotels.

💦 Descanso, naturaleza y piscina te esperan en la Sierra Nevada.

📲 ¡Escríbenos y reserva directamente con nosotros!

#LaVerandaExperience #Minca #SantaMarta

<!--recurrente:1,2,3,4,5,6,0-->',
            tipo = 'hospedaje',
            precio = NULL,
            precio_moneda = 'COP',
            fecha_inicio = '2026-10-16 09:00:00-05',
            fecha_fin = '2026-10-31 23:59:00-05',
            imagen_url = 'https://gvrroyncnrnjsaldlges.supabase.co/storage/v1/object/public/eventos/eventos_reales/laveranda.webp',
            activo = true
        WHERE id = v_evento_id;

        RAISE NOTICE '✅ Publicación actualizada: Escápate a Minca en Octubre (ID: %)', v_evento_id;
    END IF;

END $$;
