-- ==============================================================================
-- 🌿 PaDónde Minca: Nuevo Aliado y Evento — Canúmake (Nina & Samuel)
-- Tour por la Selva y Bosque de Cacao en Alemán, Suizo y Español
-- Teléfono: +57 310 5830722
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

    -- 2. Insertar o recuperar el Aliado Comercial
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
        'Canúmake Minca',
        'Tours vivenciales por fuentes de agua y bosque de cacao con cocina en leña, guiados en Alemán, Suizo y Español por Nina y Samuel.',
        'tours',
        '573105830722',
        null,
        'pro',
        NOW() + INTERVAL '30 days',
        true
    )
    ON CONFLICT DO NOTHING;

    SELECT id INTO v_negocio_id FROM public.negocios WHERE whatsapp = '573105830722' LIMIT 1;

    -- 3. Crear el Evento / Tour en la Cartelera
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
        destacado
    ) VALUES (
        v_evento_id,
        v_negocio_id,
        v_zona_minca,
        'Dschungeltour Canúmake — Tour por la Selva y Bosque de Cacao (🇨🇭🇩🇪🇨🇴)',
        'Tour guiado en Alemán, Suizo y Español a fuentes de agua y bosque de cacao en el corazón de Minca. Una experiencia mágica, salvaje y sanadora guiada por Nina y Samuel.

🌿 OPCIONES DE TOUR:
• Tour Corto (aprox. 3 horas): Incluye snack, limonada natural y café orgánico.
  - Adultos: $99.000 COP | Niños: $55.000 COP
  - Opción de almuerzo bio-vegetariano en leña (+ $33.000 COP, niños gratis).

• Tour Grande (aprox. 6 horas): Caminata profunda por antiguos caminos indígenas de piedra, lugares de energía y fuentes de agua. Incluye snack, limonada, café y almuerzo regional biológico vegetariano cocinado en leña.
  - Adultos: $188.000 COP | Niños: $88.000 COP

📍 CÓMO LLEGAR Y RESERVA:
• Ubicación: A 40 minutos caminando desde Minca pueblo, cruzando el río (experiencia 100% natural, sin acceso de vehículos).
• ⚠️ RESERVA OBLIGATORIA: Por favor reservar con mínimo 1 día de anticipación (para 1-2 personas) o 2 días (para grupos o tour grande) para preparar los alimentos frescos en leña.

<!--recurrente:0,1,2,3,4,5,6-->',
        'tours',
        99000,
        'COP',
        '2026-10-16 08:30:00-05',
        '2026-12-31 15:00:00-05',
        '/optimized_events/canumake-tour-selva.webp',
        true,
        true
    )
    ON CONFLICT (id) DO UPDATE SET
        titulo = EXCLUDED.titulo,
        descripcion = EXCLUDED.descripcion,
        precio = EXCLUDED.precio,
        imagen_url = EXCLUDED.imagen_url,
        activo = true,
        destacado = true;

    RAISE NOTICE '✅ Aliado Canúmake y Tour de Selva creados exitosamente en PaDónde.';
END $$;
