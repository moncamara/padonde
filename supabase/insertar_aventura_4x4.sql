-- ==============================================================================
-- 🚙 PaDónde: Insertar / Actualizar Servicio Esencial Aventura 4X4 Minca
-- Vincula automáticamente el tarifario oficial de 69 rutas (Sierra Alta, Locales y Expresos)
-- ==============================================================================

DO $$
DECLARE
  v_zona_id UUID;
BEGIN
  -- 1. Obtener el ID de la zona Minca
  SELECT id INTO v_zona_id FROM public.zonas WHERE slug = 'minca' LIMIT 1;

  IF v_zona_id IS NULL THEN
    RAISE NOTICE 'No se encontró la zona Minca con slug minca';
    RETURN;
  END IF;

  -- 2. Asegurar que las columnas opcionales existan en la tabla
  ALTER TABLE servicios_esenciales 
  ADD COLUMN IF NOT EXISTS boton_whatsapp_activo BOOLEAN DEFAULT true;

  ALTER TABLE servicios_esenciales 
  ADD COLUMN IF NOT EXISTS metadata_comercial JSONB DEFAULT '{}'::jsonb;

  -- 3. Si ya existe un registro con nombre Aventura 4X4, actualizarlo
  IF EXISTS (
    SELECT 1 FROM servicios_esenciales 
    WHERE zona_id = v_zona_id AND LOWER(nombre_comercial) LIKE '%aventura 4x4%'
  ) THEN
    UPDATE servicios_esenciales
    SET
      categoria = 'transporte',
      nombre_comercial = 'Aventura 4X4 Minca',
      subtitulo = 'Camperos 4x4 encapsulados (1-4 personas) • Expresos, Cerro Kennedy y Sierra Alta',
      whatsapp = '573113790239',
      mensaje_whatsapp_default = 'Hola Aventura 4X4, vi sus tarifas en PaDónde y solicito transporte para 4 personas.',
      google_maps_url = 'https://maps.app.goo.gl/minca',
      direccion_referencia = 'Estación de camperos 4x4 frente al puente central de Minca',
      horario_apertura = 'Todos los días • Salidas programadas y expresos 24/7',
      servicios_tags = '["🚙 Camperos 4x4 Encapsulados", "⛰️ Cerro Kennedy & Sierra Alta", "✈️ Expresos a Santa Marta & Aeropuerto", "📋 Tarifario Oficial Fijo (1-4 personas)"]'::jsonb,
      destacado_patrocinado = true,
      tipo_acuerdo = 'canje_afiche',
      orden_prioridad = 2,
      activo = true,
      boton_whatsapp_activo = true,
      metadata_comercial = jsonb_set(
        COALESCE(metadata_comercial, '{}'::jsonb),
        '{tarifario_id}',
        '"transporte-aventura-4x4-minca"'::jsonb
      )
    WHERE zona_id = v_zona_id AND LOWER(nombre_comercial) LIKE '%aventura 4x4%';

    RAISE NOTICE 'Servicio Aventura 4X4 Minca actualizado con éxito.';
  ELSE
    -- 4. Si no existe, insertarlo
    INSERT INTO servicios_esenciales (
      zona_id,
      categoria,
      nombre_comercial,
      subtitulo,
      whatsapp,
      mensaje_whatsapp_default,
      google_maps_url,
      direccion_referencia,
      horario_apertura,
      servicios_tags,
      destacado_patrocinado,
      tipo_acuerdo,
      orden_prioridad,
      activo,
      boton_whatsapp_activo,
      metadata_comercial
    ) VALUES (
      v_zona_id,
      'transporte',
      'Aventura 4X4 Minca',
      'Camperos 4x4 encapsulados (1-4 personas) • Expresos, Cerro Kennedy y Sierra Alta',
      '573113790239',
      'Hola Aventura 4X4, vi sus tarifas en PaDónde y solicito transporte para 4 personas.',
      'https://maps.app.goo.gl/minca',
      'Estación de camperos 4x4 frente al puente central de Minca',
      'Todos los días • Salidas programadas y expresos 24/7',
      '["🚙 Camperos 4x4 Encapsulados", "⛰️ Cerro Kennedy & Sierra Alta", "✈️ Expresos a Santa Marta & Aeropuerto", "📋 Tarifario Oficial Fijo (1-4 personas)"]'::jsonb,
      true,
      'canje_afiche',
      2,
      true,
      true,
      '{"tarifario_id": "transporte-aventura-4x4-minca"}'::jsonb
    );

    RAISE NOTICE 'Servicio Aventura 4X4 Minca insertado con éxito.';
  END IF;
END $$;
