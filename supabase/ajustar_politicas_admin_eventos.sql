-- ==============================================================================
-- 🔒 PaDónde: Asignar Administradora a los 3 Aliados Nuevos
-- ==============================================================================
-- Solo actualiza el campo user_id de los 3 aliados recientes:
--   • El Bosque
--   • Canúmake
--   • La Veranda
-- 
-- NO borra nada (0 DROP), NO altera tablas, NO toca políticas.
-- ==============================================================================

UPDATE public.negocios
SET user_id = '7a301c13-229d-4b33-9d42-52442a919cde'
WHERE user_id IS NULL;
