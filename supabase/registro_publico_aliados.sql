-- ==============================================================================
-- 🌿 PaDónde: Auto-registro público de aliados (/es/sumate)
-- ==============================================================================
-- Ejecutar UNA vez en Supabase → SQL Editor.
--
-- ✔ NO borra nada (0 DROP TABLE), NO modifica columnas existentes.
-- ✔ Los registros entran SIEMPRE inactivos (negocios.activo = false y
--   eventos.activo = false). Nunca se publican sin revisión manual en /admin.
-- ✔ Rate limit en base de datos: máx. 3 registros por hora por IP (hash).
-- ✔ Storage: el rol anónimo solo puede SUBIR archivos .webp dentro de
--   eventos/registros/ (no puede listar, sobrescribir ni borrar).
-- ==============================================================================

-- 1. Bitácora mínima para rate limit (solo hash de IP, sin datos personales)
CREATE TABLE IF NOT EXISTS public.registros_aliados_log (
    id BIGSERIAL PRIMARY KEY,
    ip_hash TEXT NOT NULL,
    negocio_id UUID,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS registros_aliados_log_ip_idx
    ON public.registros_aliados_log (ip_hash, created_at DESC);

ALTER TABLE public.registros_aliados_log ENABLE ROW LEVEL SECURITY;
-- (Sin políticas: solo accesible vía la función SECURITY DEFINER de abajo)

-- 2. Función segura de registro (inserta negocio + publicación en borrador)
CREATE OR REPLACE FUNCTION public.registrar_aliado_publico(p JSONB)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_zona_id UUID;
    v_negocio_id UUID;
    v_evento_id UUID;
    v_ip_hash TEXT := COALESCE(p->>'ip_hash', 'desconocido');
    v_intentos INT;
    v_nombre TEXT := btrim(COALESCE(p->>'nombre', ''));
    v_whatsapp TEXT := regexp_replace(COALESCE(p->>'whatsapp', ''), '\D', '', 'g');
    v_categoria TEXT := COALESCE(p->>'categoria', '');
BEGIN
    -- Rate limit: 3 registros por hora por IP
    SELECT COUNT(*) INTO v_intentos
      FROM public.registros_aliados_log
     WHERE ip_hash = v_ip_hash
       AND created_at > now() - INTERVAL '1 hour';
    IF v_intentos >= 3 THEN
        RAISE EXCEPTION 'rate_limit';
    END IF;

    -- Validaciones básicas
    IF length(v_nombre) < 2 OR length(v_nombre) > 150 THEN
        RAISE EXCEPTION 'nombre_invalido';
    END IF;
    IF length(v_whatsapp) < 10 OR length(v_whatsapp) > 15 THEN
        RAISE EXCEPTION 'whatsapp_invalido';
    END IF;
    IF v_categoria NOT IN ('hospedaje', 'comida', 'tours', 'esencial') THEN
        RAISE EXCEPTION 'categoria_invalida';
    END IF;

    SELECT id INTO v_zona_id
      FROM public.zonas
     WHERE slug = p->>'zona_slug'
     LIMIT 1;
    IF v_zona_id IS NULL THEN
        RAISE EXCEPTION 'zona_invalida';
    END IF;

    -- Negocio SIEMPRE inactivo
    INSERT INTO public.negocios (
        zona_id, user_id, nombre, descripcion, categoria, whatsapp,
        instagram, google_maps_url, plan, activo
    ) VALUES (
        v_zona_id,
        NULL,
        v_nombre,
        NULLIF(left(btrim(COALESCE(p->>'descripcion', '')), 1200), ''),
        v_categoria,
        v_whatsapp,
        NULLIF(left(btrim(COALESCE(p->>'instagram', '')), 80), ''),
        NULLIF(left(btrim(COALESCE(p->>'google_maps_url', '')), 500), ''),
        'gratis',
        false
    )
    RETURNING id INTO v_negocio_id;

    -- Publicación SIEMPRE inactiva (borrador para revisión)
    INSERT INTO public.eventos (
        negocio_id, zona_id, titulo, descripcion, tipo, categorias,
        precio, precio_moneda, fecha_inicio, imagen_url,
        destacado, tiene_boleteria, activo, metadata_hospedaje
    ) VALUES (
        v_negocio_id,
        v_zona_id,
        left(v_nombre, 200),
        NULLIF(left(btrim(COALESCE(p->>'descripcion', '')), 1200), ''),
        v_categoria,
        ARRAY[v_categoria],
        GREATEST(COALESCE((p->>'precio')::NUMERIC, 0), 0),
        'COP',
        now(),
        NULLIF(p->>'imagen_url', ''),
        false,
        false,
        false,
        COALESCE(p->'metadata', '{}'::JSONB)
    )
    RETURNING id INTO v_evento_id;

    INSERT INTO public.registros_aliados_log (ip_hash, negocio_id)
    VALUES (v_ip_hash, v_negocio_id);

    RETURN jsonb_build_object('negocio_id', v_negocio_id, 'evento_id', v_evento_id);
END;
$$;

REVOKE ALL ON FUNCTION public.registrar_aliado_publico(JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.registrar_aliado_publico(JSONB) TO anon, authenticated;

-- 3. Storage: permitir al rol anónimo SOLO subir .webp en eventos/registros/
DROP POLICY IF EXISTS "Registro publico sube fotos webp" ON storage.objects;
CREATE POLICY "Registro publico sube fotos webp"
    ON storage.objects FOR INSERT
    TO anon
    WITH CHECK (
        bucket_id = 'eventos'
        AND name LIKE 'registros/%'
        AND lower(name) LIKE '%.webp'
    );
