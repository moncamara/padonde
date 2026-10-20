-- ==============================================================================
-- 📱 TABLA: escaneos_qr (Auditoría Antifraude y Atribución Física de Códigos QR)
-- ==============================================================================
-- Registra cada escaneo de QR realizado por turistas en puntos físicos y promotores.
-- Valida si es la primera vez que el dispositivo móvil escanea el código y
-- verifica la permanencia real (>= 5 segundos) para evitar auto-escaneos fraudulentos.
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.escaneos_qr (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    punto_id VARCHAR(100) NOT NULL,              -- ej: 'promotor-estacion', 'hostal-rio-elemento'
    zona_slug VARCHAR(50) DEFAULT 'minca' NOT NULL, -- 'minca' | 'mendihuaca'
    dispositivo_id VARCHAR(100) NOT NULL,         -- UUID persistente en localStorage y Cookie
    es_primer_escaneo BOOLEAN DEFAULT true NOT NULL, -- True si es primera vez que este dispositivo escanea este punto
    es_valido BOOLEAN DEFAULT false NOT NULL,      -- True solo si permaneció >= 5s o interactuó con la cartelera
    dispositivo_tipo VARCHAR(20) DEFAULT 'otro',  -- 'iphone' | 'android' | 'desktop' | 'otro'
    user_agent TEXT,
    ip_hash VARCHAR(64),                          -- Hash anónimo unidireccional SHA256 para auditoría
    tiempo_permanencia_seg INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Índices de alto rendimiento para consultas inmediatas en el panel de control
CREATE INDEX IF NOT EXISTS idx_escaneos_qr_punto_dispositivo ON public.escaneos_qr(punto_id, dispositivo_id);
CREATE INDEX IF NOT EXISTS idx_escaneos_qr_punto_valido ON public.escaneos_qr(punto_id, es_valido);
CREATE INDEX IF NOT EXISTS idx_escaneos_qr_created_at ON public.escaneos_qr(created_at);

-- Habilitar Row Level Security (RLS)
ALTER TABLE public.escaneos_qr ENABLE ROW LEVEL SECURITY;

-- 1. Permitir registrar escaneos a cualquier visitante anónimo (INSERT)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'escaneos_qr' AND policyname = 'Permitir registrar escaneo a cualquiera'
    ) THEN
        CREATE POLICY "Permitir registrar escaneo a cualquiera"
            ON public.escaneos_qr FOR INSERT
            TO public
            WITH CHECK (true);
    END IF;
END $$;

-- 2. Permitir confirmar permanencia/validez al mismo registro (UPDATE)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'escaneos_qr' AND policyname = 'Permitir actualizar validacion de escaneo'
    ) THEN
        CREATE POLICY "Permitir actualizar validacion de escaneo"
            ON public.escaneos_qr FOR UPDATE
            TO public
            USING (true)
            WITH CHECK (true);
    END IF;
END $$;

-- 3. Permitir lectura de métricas para el panel de administración (SELECT)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'escaneos_qr' AND policyname = 'Permitir lectura de escaneos'
    ) THEN
        CREATE POLICY "Permitir lectura de escaneos"
            ON public.escaneos_qr FOR SELECT
            TO public
            USING (true);
    END IF;
END $$;
