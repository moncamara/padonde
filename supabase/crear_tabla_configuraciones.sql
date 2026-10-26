-- ==============================================================================
-- ⚙️ TABLA: configuraciones (Configuraciones dinámicas de la aplicación)
-- ==============================================================================
-- Permite guardar ajustes como el orden de categorías por región (config_territorial)
-- de forma persistente en la nube (Vercel + Supabase) sin tocar las tablas de eventos,
-- negocios ni zonas.
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.configuraciones (
    clave VARCHAR(100) PRIMARY KEY,
    valor JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar Row Level Security (RLS)
ALTER TABLE public.configuraciones ENABLE ROW LEVEL SECURITY;

-- 1. Permitir lectura pública para que el feed y el panel carguen al instante
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'configuraciones' AND policyname = 'Permitir lectura publica de configuraciones'
    ) THEN
        CREATE POLICY "Permitir lectura publica de configuraciones"
            ON public.configuraciones FOR SELECT
            TO public
            USING (true);
    END IF;
END $$;

-- 2. Permitir guardar y actualizar configuraciones
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'configuraciones' AND policyname = 'Permitir guardar configuraciones'
    ) THEN
        CREATE POLICY "Permitir guardar configuraciones"
            ON public.configuraciones FOR ALL
            TO public
            USING (true)
            WITH CHECK (true);
    END IF;
END $$;

-- 2b. Concesión explícita de permisos para Data API (Requerido por Supabase desde Oct 30)
GRANT SELECT ON public.configuraciones TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.configuraciones TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.configuraciones TO service_role;

-- 3. Sembrar la configuración inicial desde el archivo JSON de respaldo
INSERT INTO public.configuraciones (clave, valor)
VALUES ('config_territorial', '{
  "minca": {
    "ordenCategorias": ["rumba", "comida", "bienestar", "tours", "arte", "hospedaje", "artesanias"],
    "criterioOrdenFeed": "agenda_primero"
  },
  "mendihuaca": {
    "ordenCategorias": ["hospedaje", "tours", "rumba", "comida", "bienestar", "arte", "artesanias"],
    "criterioOrdenFeed": "hospedaje_primero"
  },
  "palomino": {
    "ordenCategorias": ["hospedaje", "rumba", "comida", "tours", "bienestar", "arte", "artesanias"],
    "criterioOrdenFeed": "hospedaje_primero"
  },
  "tairona": {
    "ordenCategorias": ["tours", "hospedaje", "comida", "bienestar", "arte", "rumba", "artesanias"],
    "criterioOrdenFeed": "agenda_primero"
  }
}'::jsonb)
ON CONFLICT (clave) DO NOTHING;
