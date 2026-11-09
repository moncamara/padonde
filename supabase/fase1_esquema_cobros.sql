-- ==============================================================================
-- 💳 FASE 1: Esquema de Base de Datos para Finanzas y Cobros a Aliados
-- ==============================================================================
-- Módulo: /admin/cobros (PaDónde)
-- Descripción:
--   1. Crea la tabla `public.acuerdos_comerciales` vinculada 1:1 con `negocios`.
--   2. Hereda automáticamente `created_at` del negocio como `fecha_registro_app`.
--   3. Establece valores predeterminados (15 días cortesía, $125.000 COP, trimestral).
--   4. Calcula automáticamente `proximo_cobro` mediante trigger.
--   5. Crea trigger para que nuevos aliados registrados tengan su acuerdo de inmediato.
--   6. Inicializa de forma segura los acuerdos para los aliados ya existentes en la BD.
--   7. Configura RLS y permisos seguros para administradores autenticados.
--   8. Crea la vista `public.vista_cobros_aliados` para consultas inmediatas en `/admin/cobros`.
-- 
-- 100% No-destructivo (Sin DROP TABLE ni DELETE). Seguro para ejecutar en Supabase.
-- ==============================================================================

-- 1. TABLA: acuerdos_comerciales
CREATE TABLE IF NOT EXISTS public.acuerdos_comerciales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    negocio_id UUID NOT NULL UNIQUE REFERENCES public.negocios(id) ON DELETE CASCADE,
    fecha_registro_app TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    fecha_primer_mensaje DATE DEFAULT CURRENT_DATE NOT NULL,
    dias_cortesia INTEGER DEFAULT 15 NOT NULL CHECK (dias_cortesia >= 0),
    tarifa_pactada_cop NUMERIC(12, 0) DEFAULT 125000 NOT NULL CHECK (tarifa_pactada_cop >= 0),
    modalidad VARCHAR(20) DEFAULT 'trimestral' NOT NULL CHECK (modalidad IN ('trimestral', 'mensual')),
    estado_pago VARCHAR(20) DEFAULT 'en_cortesia' NOT NULL CHECK (estado_pago IN ('en_cortesia', 'al_dia', 'por_vencer', 'vencido')),
    proximo_cobro DATE NOT NULL,
    notas_acuerdo TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. ÍNDICES DE RENDIMIENTO
CREATE INDEX IF NOT EXISTS idx_acuerdos_comerciales_negocio ON public.acuerdos_comerciales(negocio_id);
CREATE INDEX IF NOT EXISTS idx_acuerdos_comerciales_estado ON public.acuerdos_comerciales(estado_pago);
CREATE INDEX IF NOT EXISTS idx_acuerdos_comerciales_proximo_cobro ON public.acuerdos_comerciales(proximo_cobro);

-- 3. FUNCIÓN Y TRIGGER: Sincronizar fecha_registro_app y proximo_cobro por defecto
CREATE OR REPLACE FUNCTION public.fn_sync_acuerdo_comercial()
RETURNS TRIGGER AS $$
BEGIN
    -- Hereda created_at de negocios si no se envió
    IF NEW.fecha_registro_app IS NULL THEN
        SELECT created_at INTO NEW.fecha_registro_app 
        FROM public.negocios 
        WHERE id = NEW.negocio_id;
        
        IF NEW.fecha_registro_app IS NULL THEN
            NEW.fecha_registro_app := timezone('utc'::text, now());
        END IF;
    END IF;

    -- Calcula proximo_cobro inicial si viene vacío (fecha_primer_mensaje + días de cortesía)
    IF NEW.proximo_cobro IS NULL THEN
        NEW.proximo_cobro := NEW.fecha_primer_mensaje + (NEW.dias_cortesia || ' days')::INTERVAL;
    END IF;

    NEW.updated_at := timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger WHERE tgname = 'trg_sync_acuerdo_comercial'
    ) THEN
        CREATE TRIGGER trg_sync_acuerdo_comercial
            BEFORE INSERT OR UPDATE ON public.acuerdos_comerciales
            FOR EACH ROW
            EXECUTE FUNCTION public.fn_sync_acuerdo_comercial();
    END IF;
END $$;

-- 4. TRIGGER: Creación automática del acuerdo comercial al registrar un nuevo negocio
CREATE OR REPLACE FUNCTION public.fn_auto_crear_acuerdo_negocio()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.acuerdos_comerciales (
        negocio_id,
        fecha_registro_app,
        fecha_primer_mensaje,
        dias_cortesia,
        tarifa_pactada_cop,
        modalidad,
        estado_pago,
        proximo_cobro,
        notas_acuerdo
    )
    VALUES (
        NEW.id,
        NEW.created_at,
        CURRENT_DATE,
        15,
        125000,
        'trimestral',
        'en_cortesia',
        (CURRENT_DATE + INTERVAL '15 days')::DATE,
        'Acuerdo comercial inicial generado automáticamente'
    )
    ON CONFLICT (negocio_id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger WHERE tgname = 'trg_auto_crear_acuerdo_negocio'
    ) THEN
        CREATE TRIGGER trg_auto_crear_acuerdo_negocio
            AFTER INSERT ON public.negocios
            FOR EACH ROW
            EXECUTE FUNCTION public.fn_auto_crear_acuerdo_negocio();
    END IF;
END $$;

-- 5. MIGRACIÓN / INICIALIZACIÓN: Crear acuerdo inicial para aliados ya existentes en la BD
INSERT INTO public.acuerdos_comerciales (
    negocio_id,
    fecha_registro_app,
    fecha_primer_mensaje,
    dias_cortesia,
    tarifa_pactada_cop,
    modalidad,
    estado_pago,
    proximo_cobro,
    notas_acuerdo
)
SELECT 
    n.id AS negocio_id,
    n.created_at AS fecha_registro_app,
    CURRENT_DATE AS fecha_primer_mensaje,
    15 AS dias_cortesia,
    125000 AS tarifa_pactada_cop,
    'trimestral' AS modalidad,
    'en_cortesia' AS estado_pago,
    (CURRENT_DATE + INTERVAL '15 days')::DATE AS proximo_cobro,
    'Inicializado en Fase 1 de Finanzas' AS notas_acuerdo
FROM public.negocios n
ON CONFLICT (negocio_id) DO NOTHING;

-- 6. SEGURIDAD: Row Level Security (RLS) y Políticas
ALTER TABLE public.acuerdos_comerciales ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'acuerdos_comerciales' AND policyname = 'Permitir administracion completa de acuerdos'
    ) THEN
        CREATE POLICY "Permitir administracion completa de acuerdos"
            ON public.acuerdos_comerciales FOR ALL
            TO authenticated
            USING (true)
            WITH CHECK (true);
    END IF;
END $$;

-- Permisos explícitos para Data API
GRANT SELECT, INSERT, UPDATE, DELETE ON public.acuerdos_comerciales TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.acuerdos_comerciales TO service_role;

-- 7. VISTA CONSOLIDADA: Ideal para alimentar la tabla de /admin/cobros con 1 sola consulta
CREATE OR REPLACE VIEW public.vista_cobros_aliados AS
SELECT 
    n.id AS negocio_id,
    n.nombre AS negocio_nombre,
    n.whatsapp,
    n.instagram,
    n.plan,
    n.activo AS negocio_activo,
    z.nombre AS zona_nombre,
    z.slug AS zona_slug,
    ac.id AS acuerdo_id,
    COALESCE(ac.fecha_registro_app, n.created_at) AS fecha_registro_app,
    COALESCE(ac.fecha_primer_mensaje, CURRENT_DATE) AS fecha_primer_mensaje,
    COALESCE(ac.dias_cortesia, 15) AS dias_cortesia,
    COALESCE(ac.tarifa_pactada_cop, 125000) AS tarifa_pactada_cop,
    COALESCE(ac.modalidad, 'trimestral') AS modalidad,
    COALESCE(ac.estado_pago, 'en_cortesia') AS estado_pago,
    COALESCE(ac.proximo_cobro, (CURRENT_DATE + INTERVAL '15 days')::DATE) AS proximo_cobro,
    ac.notas_acuerdo,
    ac.updated_at
FROM public.negocios n
LEFT JOIN public.zonas z ON n.zona_id = z.id
LEFT JOIN public.acuerdos_comerciales ac ON n.id = ac.negocio_id;

GRANT SELECT ON public.vista_cobros_aliados TO authenticated;
GRANT SELECT ON public.vista_cobros_aliados TO service_role;

