-- ==============================================================================
-- ACTUALIZACIÓN MASIVA: Reputación y Enlaces de Google Maps para Aliados de Minca
-- Ejecuta este script en el SQL Editor de Supabase (1 solo clic).
-- ==============================================================================

-- 1. Amora Cocina Saludable (★ 4.9 · 840 reseñas)
UPDATE negocios
SET
  google_rating = 4.9,
  google_total_reviews = 840,
  google_maps_url = 'https://www.google.com/maps/search/?api=1&query=Amora+Cocina+Saludable+Minca'
WHERE id = '35bb66b0-8f37-4136-a0ee-5f23404e1756';

-- 2. La Miga Panadería (★ 4.7 · 893 reseñas)
UPDATE negocios
SET
  google_rating = 4.7,
  google_total_reviews = 893,
  google_maps_url = 'https://www.google.com/maps/search/?api=1&query=La+Miga+Panaderia+Minca'
WHERE id = 'f8f65b24-446d-4c6e-8b51-3f03f5a9125e';

-- 3. Duni Café Minca (★ 4.7 · 450 reseñas)
UPDATE negocios
SET
  google_rating = 4.7,
  google_total_reviews = 450,
  google_maps_url = 'https://www.google.com/maps/search/?api=1&query=Duni+Cafe+Minca'
WHERE id = '7aa3a60f-e67b-499a-9371-70f599e08996';

-- 4. El Bosque (antes Casa Loma) (★ 4.4 · 685 reseñas)
UPDATE negocios
SET
  google_rating = 4.4,
  google_total_reviews = 685,
  google_maps_url = 'https://www.google.com/maps/search/?api=1&query=Hostal+Casa+Loma+Minca'
WHERE id = '60901a43-ac30-43d3-a88e-7388ed63e295';

-- 5. Río Elemento Minca (★ 4.4 · 615 reseñas)
UPDATE negocios
SET
  google_rating = 4.4,
  google_total_reviews = 615,
  google_maps_url = 'https://www.google.com/maps/search/?api=1&query=Minca+Rio+Elemento'
WHERE id = '4c5aba1f-8159-4c16-a088-b090a9d2f2a3';

-- 6. La Veranda Hotels (★ 4.8 · 220 reseñas)
UPDATE negocios
SET
  google_rating = 4.8,
  google_total_reviews = 220,
  google_maps_url = 'https://www.google.com/maps/search/?api=1&query=La+Veranda+Hotel+Minca'
WHERE id = 'ff6466a4-147b-47fd-adf0-21af320aea45';

-- 7. Kakaw — Museo del Cacao (★ 4.5 · 210 reseñas)
UPDATE negocios
SET
  google_rating = 4.5,
  google_total_reviews = 210,
  google_maps_url = 'https://www.google.com/maps/search/?api=1&query=Museo+del+Cacao+Minca'
WHERE id = '7a3d1509-4a86-4fcc-8bb6-a4e6cfbf34b4';

-- 8. La Casa del Mono (★ 4.9 · 180 reseñas)
UPDATE negocios
SET
  google_rating = 4.9,
  google_total_reviews = 180,
  google_maps_url = 'https://www.google.com/maps/search/?api=1&query=La+Casa+del+Mono+Minca'
WHERE id = 'c638a78d-0249-4645-838c-631781154608';

-- 9. Silocibe Gastrobar (★ 4.7 · 140 reseñas)
UPDATE negocios
SET
  google_rating = 4.7,
  google_total_reviews = 140,
  google_maps_url = 'https://www.google.com/maps/search/?api=1&query=Silocibe+Bar+Minca'
WHERE id = 'c410a2de-0bd3-4ce3-84cc-526c536daf50';

-- 10. Minkanta Central (★ 4.2 · 125 reseñas)
UPDATE negocios
SET
  google_rating = 4.2,
  google_total_reviews = 125,
  google_maps_url = 'https://www.google.com/maps/search/?api=1&query=Minkanta+Central+Hostel+Minca'
WHERE id = '3fc7e3e6-8ade-4c31-8e53-67bfc96cb331';

-- 11. Tribu Hostal Minca (★ 4.8 · 45 reseñas)
UPDATE negocios
SET
  google_rating = 4.8,
  google_total_reviews = 45,
  google_maps_url = 'https://www.google.com/maps/search/?api=1&query=Tribu+Hostal+Minca'
WHERE id = '40fa26db-a390-4714-971a-ac1610bd82af';

-- 12. Casa Cora Minca (Ubicación en Google Maps)
UPDATE negocios
SET
  google_maps_url = 'https://www.google.com/maps/search/?api=1&query=Casa+Cora+Minca'
WHERE id = '0834b5de-8923-446c-919d-3f4a882e908f';

-- 13. Pan Artesanal Koko & Chiqui (Ubicación en Google Maps)
UPDATE negocios
SET
  google_maps_url = 'https://www.google.com/maps/search/?api=1&query=Minca+Centro'
WHERE id = '470fdcda-e4a8-4fa9-831c-f1b5a003ce99';

-- Verificación final
SELECT id, nombre, google_rating, google_total_reviews, google_maps_url 
FROM negocios 
WHERE zona_id = (SELECT id FROM zonas WHERE slug = 'minca')
ORDER BY google_total_reviews DESC NULLS LAST;
