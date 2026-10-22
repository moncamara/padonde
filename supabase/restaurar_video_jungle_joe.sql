-- ==============================================================================
-- Restaurar el video/reel vertical de Jungle Joe
-- Evento: Tour de Cacao, Café y Avistamiento en Jungle Joe (Minca)
-- ID: 6817d5de-d00a-4514-b505-fa2c10608749
-- ==============================================================================

UPDATE public.eventos
SET video_url = 'https://gvrroyncnrnjsaldlges.supabase.co/storage/v1/object/public/eventos/videos/1792684308424-m681hcn.mp4'
WHERE id = '6817d5de-d00a-4514-b505-fa2c10608749';

-- Confirmar resultado
SELECT id, titulo, video_url, imagen_url 
FROM public.eventos 
WHERE id = '6817d5de-d00a-4514-b505-fa2c10608749';
