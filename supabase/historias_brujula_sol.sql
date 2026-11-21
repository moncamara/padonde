-- ==============================================================================
-- ☀️ PaDónde: Historias Efímeras con Mascota Animada ("Brújula-Sol")
-- ==============================================================================
-- Usa la tabla 'public.configuraciones' (clave = 'stories_brujula_sol')
-- para persistir { activa: boolean, version_id: string, slides: string[] }
-- sin alterar esquemas críticos y permitiendo lectura anónima SSG en Edge CDN.
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.configuraciones (
  clave TEXT PRIMARY KEY,
  valor JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.configuraciones ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'configuraciones' AND policyname = 'Lectura pública de configuraciones'
  ) THEN
    CREATE POLICY "Lectura pública de configuraciones"
      ON public.configuraciones FOR SELECT
      USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'configuraciones' AND policyname = 'Escritura admin de configuraciones'
  ) THEN
    CREATE POLICY "Escritura admin de configuraciones"
      ON public.configuraciones FOR ALL
      USING (auth.role() = 'authenticated')
      WITH CHECK (auth.role() = 'authenticated');
  END IF;
END $$;

INSERT INTO public.configuraciones (clave, valor)
VALUES (
  'stories_brujula_sol',
  jsonb_build_object(
    'activa', true,
    'version_id', 'demo-v2',
    'slides', jsonb_build_array(
      '/stories-demo/2.jpg',
      '/stories-demo/3.jpg',
      '/stories-demo/4.jpg',
      '/stories-demo/5.jpg',
      '/stories-demo/6.jpg'
    )
  )
)
ON CONFLICT (clave) DO NOTHING;
