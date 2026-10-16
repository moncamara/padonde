-- ==============================================================================
-- 📊 TABLA: clics_whatsapp (Métricas y Conversión en PaDónde)
-- ==============================================================================
-- Registra cada intención de reserva vía WhatsApp iniciada por visitantes.
-- Diseñada para alto rendimiento, consultas instantáneas y riesgo cero en producción.
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.clics_whatsapp (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    evento_id UUID REFERENCES public.eventos(id) ON DELETE SET NULL,
    negocio_id UUID REFERENCES public.negocios(id) ON DELETE SET NULL,
    ubicacion VARCHAR(30) DEFAULT 'tarjeta', -- 'tarjeta' | 'detalle'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Índices de alto rendimiento para consultas inmediatas en el panel de control
CREATE INDEX IF NOT EXISTS idx_clics_whatsapp_negocio ON public.clics_whatsapp(negocio_id);
CREATE INDEX IF NOT EXISTS idx_clics_whatsapp_evento ON public.clics_whatsapp(evento_id);
CREATE INDEX IF NOT EXISTS idx_clics_whatsapp_created_at ON public.clics_whatsapp(created_at);

-- Habilitar Row Level Security (RLS)
ALTER TABLE public.clics_whatsapp ENABLE ROW LEVEL SECURITY;

-- 1. Permitir que cualquier visitante registre un clic de reserva (público / anónimo)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'clics_whatsapp' AND policyname = 'Permitir registrar clic a cualquiera'
    ) THEN
        CREATE POLICY "Permitir registrar clic a cualquiera"
            ON public.clics_whatsapp FOR INSERT
            TO public
            WITH CHECK (true);
    END IF;
END $$;

-- 2. Permitir lectura de métricas para el panel de administración
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'clics_whatsapp' AND policyname = 'Permitir lectura de clics'
    ) THEN
        CREATE POLICY "Permitir lectura de clics"
            ON public.clics_whatsapp FOR SELECT
            TO public
            USING (true);
    END IF;
END $$;
