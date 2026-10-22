-- ==============================================================================
-- 🌿 PaDónde - Soporte para Videos y Reels en Eventos y Hospedajes
-- ==============================================================================
-- Añade la columna 'video_url' a la tabla 'eventos' (la cual también aloja
-- hospedajes con tipo = 'hospedaje').
-- ==============================================================================

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = 'eventos' 
          AND column_name = 'video_url'
    ) THEN
        ALTER TABLE public.eventos ADD COLUMN video_url TEXT;
        COMMENT ON COLUMN public.eventos.video_url IS 'URL pública del video/reel MP4 alojado en Supabase Storage';
    END IF;
END $$;
