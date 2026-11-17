-- ==============================================================================
-- 🍽️ PaDónde: Carta Digital Interactiva para MAMO Hostel Restaurante Bar (Minca)
-- ==============================================================================
-- Evento ID (existente): 379566b8-036e-4b39-aaad-7a9fb8b7ae8e
-- Negocio ID (existente): bfa8f047-06fd-406c-8023-575b4a9b4e1d  · WhatsApp 573006534095
--
-- Limpieza: 0 miniaturas externas antiguas (imagenUrl: null en 42 ítems)
-- Fotos HQ Supabase Storage: 7 platos estrella con fotografía .webp en alta calidad
-- Carta: 9 categorías · 49 productos · ES / EN / FR / DE
-- ==============================================================================

UPDATE public.eventos
SET metadata_hospedaje = COALESCE(metadata_hospedaje, '{}'::jsonb) || jsonb_build_object(
  'menu_interactivo', true,
  'menu_tema', 'fogon',
  'ultima_edicion', to_jsonb(now()),
  'menu_data', $menu${
  "id": "mamo-hostel-restaurante-bar",
  "negocioNombre": "MAMO Hostel Restaurante Bar",
  "subtitulo": {
    "es": "Parrilla · Pescados & Mariscos · Pastas · Cócteles en Minca",
    "en": "Grill · Fresh Fish & Seafood · Pasta · Cocktails in Minca",
    "fr": "Grillades · Poissons & Fruits de Mer · Pâtes · Cocktails à Minca",
    "de": "Grillgerichte · Fisch & Meeresfrüchte · Pasta · Cocktails in Minca"
  },
  "zona": "Minca · Sierra Nevada",
  "selloCalidad": {
    "es": "Selección Gastronómica PaDónde · Sabor Auténtico en Minca",
    "en": "PaDónde Culinary Selection · Authentic Flavor in Minca",
    "fr": "Sélection Gastronomique PaDónde · Saveur Authentique à Minca",
    "de": "PaDónde Kulinarische Auswahl · Authentischer Geschmack in Minca"
  },
  "pdfOriginalUrl": "https://mamo.ola.click/",
  "googleMapsUrl": "https://search.google.com/local/writereview?placeid=ChIJjSNaqonx9I4RdLlrzzt3aBs",
  "tema": "fogon",
  "whatsapp": "573006534095",
  "telefono": "+57 300 653 4095",
  "email": "",
  "horarioHappyHour": {
    "inicio": "16:00",
    "fin": "19:00",
    "texto": {
      "es": "Todos los días · Cocina abierta & Cócteles",
      "en": "Every day · Open kitchen & Cocktails",
      "fr": "Tous les jours · Cuisine ouverte & Cocktails",
      "de": "Täglich · Offene Küche & Cocktails"
    }
  },
  "categorias": [
    {
      "id": "entradas",
      "icono": "🍤",
      "titulos": {
        "es": "Entradas",
        "en": "Starters",
        "fr": "Entrées",
        "de": "Vorspeisen"
      },
      "subtitulos": {
        "es": "Ideales para compartir y abrir el apetito",
        "en": "Ideal for sharing and whetting your appetite",
        "fr": "Idéales à partager pour ouvrir l'appétit",
        "de": "Ideal zum Teilen als perfekter Start"
      },
      "items": [
        {
          "id": "camarones-al-ajillo",
          "nombres": {
            "es": "Camarones al Ajillo",
            "en": "Garlic Shrimp (Camarones al Ajillo)",
            "fr": "Crevettes à l'Ail",
            "de": "Knoblauchgarnelen"
          },
          "descripcion": {
            "es": "Salteados con mantequilla, ajo, aceite de oliva y perejil.",
            "en": "Sautéed with butter, garlic, olive oil, and fresh parsley.",
            "fr": "Sautées au beurre, à l'ail, à l'huile d'olive et au persil frais.",
            "de": "In Butter, Knoblauch, Olivenöl und frischer Petersilie gebraten."
          },
          "precio": 30000,
          "etiquetas": [
            "chef"
          ],
          "imagenUrl": null
        },
        {
          "id": "patacones-con-queso",
          "nombres": {
            "es": "Patacones con Queso",
            "en": "Crispy Plantains with Coastal Cheese",
            "fr": "Patacones au Fromage Costeño",
            "de": "Knusprige Kochbananen mit Küstenkäse"
          },
          "descripcion": {
            "es": "Crujientes patacones acompañados de queso costeño.",
            "en": "Crispy twice-fried green plantains served with traditional coastal cheese.",
            "fr": "Bananes plantains vertes croustillantes accompagnées de fromage côtier traditionnel.",
            "de": "Knusprig gebackene grüne Kochbananen mit traditionellem kolumbianischem Küstenkäse."
          },
          "precio": 25000,
          "etiquetas": [
            "vegetariano"
          ],
          "imagenUrl": null
        },
        {
          "id": "chorizos",
          "nombres": {
            "es": "Chorizos",
            "en": "Grilled Chorizos",
            "fr": "Chorizos Grillés",
            "de": "Gegrillte Chorizos"
          },
          "descripcion": {
            "es": "Acompañados con yuca cocida y ensalada fresca.",
            "en": "Served with boiled cassava (yuca) and fresh salad.",
            "fr": "Accompagnés de manioc cuit et d'une salade fraîche.",
            "de": "Serviert mit gekochtem Maniok (Yuca) und frischem Salat."
          },
          "precio": 25000,
          "imagenUrl": null
        },
        {
          "id": "chicharron-mamo",
          "nombres": {
            "es": "Chicharrón MAMO",
            "en": "MAMO Crispy Pork Belly (Chicharrón)",
            "fr": "Chicharrón Croustillant MAMO",
            "de": "Knuspriger Schweinebauch MAMO (Chicharrón)"
          },
          "descripcion": {
            "es": "Chicharrón crocante acompañado con patacones y ensalada.",
            "en": "Crispy pork belly served with fried green plantains and fresh salad.",
            "fr": "Poitrine de porc croustillante accompagnée de patacones et de salade fraîche.",
            "de": "Knuspriger Schweinebauch, serviert mit gebackenen Kochbananen und Salat."
          },
          "precio": 30000,
          "etiquetas": [
            "chef"
          ],
          "insignia": {
            "es": "Recomendado",
            "en": "House Favorite",
            "fr": "Spécialité",
            "de": "Empfehlung"
          },
          "imagenUrl": "https://gvrroyncnrnjsaldlges.supabase.co/storage/v1/object/public/eventos/eventos/1794923753213-g525dtx.webp"
        }
      ]
    },
    {
      "id": "desayunos",
      "icono": "🍳",
      "titulos": {
        "es": "Desayunos",
        "en": "Breakfasts",
        "fr": "Petits-déjeuners",
        "de": "Frühstück"
      },
      "subtitulos": {
        "es": "Para empezar la mañana en la montaña",
        "en": "To start your morning in the mountains",
        "fr": "Pour bien commencer la matinée à la montagne",
        "de": "Für einen guten Start in den Bergmorgen"
      },
      "items": [
        {
          "id": "huevos-al-gusto",
          "nombres": {
            "es": "Huevos al Gusto",
            "en": "Eggs Any Style",
            "fr": "Œufs au Choix",
            "de": "Eier nach Wunsch"
          },
          "descripcion": {
            "es": "Desayuno clásico preparado a tu elección.",
            "en": "Classic breakfast with eggs prepared to your liking.",
            "fr": "Petit-déjeuner classique avec œufs préparés selon votre préférence.",
            "de": "Klassisches Frühstück mit Eiern ganz nach Ihrer Wahl zubereitet."
          },
          "precio": 15000,
          "etiquetas": [
            "vegetariano"
          ],
          "imagenUrl": null
        }
      ]
    },
    {
      "id": "pastas",
      "icono": "🍝",
      "titulos": {
        "es": "Pastas",
        "en": "Pasta",
        "fr": "Pâtes",
        "de": "Pasta"
      },
      "subtitulos": {
        "es": "Pastas al dente con salsas cremosas y mariscos",
        "en": "Al dente pasta with creamy sauces and fresh seafood",
        "fr": "Pâtes al dente aux sauces crémeuses et fruits de mer",
        "de": "Pasta al dente mit cremigen Saucen und Meeresfrüchten"
      },
      "items": [
        {
          "id": "pasta-alfredo-pollo",
          "nombres": {
            "es": "Pasta Alfredo Pollo",
            "en": "Chicken Alfredo Pasta",
            "fr": "Pâtes Alfredo au Poulet",
            "de": "Pasta Alfredo mit Hähnchen"
          },
          "descripcion": {
            "es": "Pasta al dente con pollo, mantequilla y queso parmesano en cremosa salsa Alfredo.",
            "en": "Al dente pasta with chicken, butter, and Parmesan cheese in a creamy Alfredo sauce.",
            "fr": "Pâtes al dente au poulet, beurre et parmesan dans une sauce Alfredo crémeuse.",
            "de": "Pasta al dente mit Hähnchen, Butter und Parmesankäse in cremiger Alfredo-Sauce."
          },
          "precio": 50000,
          "imagenUrl": null
        },
        {
          "id": "pasta-alfredo-camaron",
          "nombres": {
            "es": "Pasta Alfredo Camarón",
            "en": "Shrimp Alfredo Pasta",
            "fr": "Pâtes Alfredo aux Crevettes",
            "de": "Pasta Alfredo mit Garnelen"
          },
          "descripcion": {
            "es": "Pasta al dente con camarones en salsa Alfredo cremosa y toque de albahaca fresca.",
            "en": "Al dente pasta with shrimp in a creamy Alfredo sauce with a touch of fresh basil.",
            "fr": "Pâtes al dente aux crevettes dans une sauce Alfredo crémeuse et une touche de basilic frais.",
            "de": "Pasta al dente mit Garnelen in cremiger Alfredo-Sauce und einem Hauch frischem Basilikum."
          },
          "precio": 55000,
          "imagenUrl": null
        },
        {
          "id": "pasta-frutti-di-mare",
          "nombres": {
            "es": "Pasta Frutti di Mare",
            "en": "Frutti di Mare Seafood Pasta",
            "fr": "Pâtes Frutti di Mare",
            "de": "Pasta Frutti di Mare"
          },
          "descripcion": {
            "es": "Pasta con selección de mariscos: camarones, cangrejo, almejas, mejillones y calamares.",
            "en": "Pasta with a rich seafood selection: shrimp, crab, clams, mussels, and calamari.",
            "fr": "Pâtes avec sélection de fruits de mer : crevettes, crabe, palourdes, moules et calamars.",
            "de": "Pasta mit erlesenen Meeresfrüchten: Garnelen, Krabben, Venusmuscheln, Miesmuscheln und Tintenfisch."
          },
          "precio": 55000,
          "etiquetas": [
            "chef"
          ],
          "imagenUrl": "https://gvrroyncnrnjsaldlges.supabase.co/storage/v1/object/public/eventos/eventos/1794923755257-dttoyz3.webp"
        }
      ]
    },
    {
      "id": "asados-parrilla",
      "icono": "🥩",
      "titulos": {
        "es": "Asados & Parrilla",
        "en": "Grill",
        "fr": "Grillades",
        "de": "Grillgerichte"
      },
      "subtitulos": {
        "es": "Cortes jugosos a la parrilla con guarnición tradicional",
        "en": "Juicy grilled cuts served with traditional sides",
        "fr": "Pièces juteuses grillées servies avec accompagnements traditionnels",
        "de": "Saftige Grillspezialitäten mit traditionellen Beilagen"
      },
      "items": [
        {
          "id": "carne-asada",
          "nombres": {
            "es": "Carne Asada",
            "en": "Grilled Beef Steak",
            "fr": "Bœuf Grillé",
            "de": "Gegrilltes Rindersteak"
          },
          "descripcion": {
            "es": "Corte de res a la parrilla acompañado de ensalada y patacones.",
            "en": "Grilled beef cut served with fresh salad and crispy plantains (patacones).",
            "fr": "Pièce de bœuf grillée accompagnée de salade fraîche et de patacones.",
            "de": "Gegrilltes Rindfleisch, serviert mit frischem Salat und knusprigen Kochbananen."
          },
          "precio": 35000,
          "imagenUrl": null
        },
        {
          "id": "pechuga-asada",
          "nombres": {
            "es": "Pechuga Asada",
            "en": "Grilled Chicken Breast",
            "fr": "Blanc de Poulet Grillé",
            "de": "Gegrillte Hähnchenbrust"
          },
          "descripcion": {
            "es": "Pechuga de pollo a la parrilla acompañada con ensalada y patacones.",
            "en": "Grilled chicken breast served with fresh salad and crispy plantains.",
            "fr": "Blanc de poulet grillé accompagné de salade fraîche et de patacones.",
            "de": "Gegrillte Hähnchenbrust mit frischem Salat und knusprigen Kochbananen."
          },
          "precio": 35000,
          "imagenUrl": null
        },
        {
          "id": "cerdo-asado",
          "nombres": {
            "es": "Cerdo Asado",
            "en": "Grilled Pork Cut",
            "fr": "Porc Grillé",
            "de": "Gegrilltes Schweinefleisch"
          },
          "descripcion": {
            "es": "Corte de cerdo a la parrilla servido con ensalada y patacones.",
            "en": "Grilled pork cut served with fresh salad and crispy plantains.",
            "fr": "Pièce de porc grillée servie avec salade fraîche et patacones.",
            "de": "Gegrilltes Schweinefleisch, serviert mit Salat und knusprigen Kochbananen."
          },
          "precio": 35000,
          "imagenUrl": null
        },
        {
          "id": "parrillada-mamo",
          "nombres": {
            "es": "Parrillada MAMO",
            "en": "MAMO Mixed Grill Platter",
            "fr": "Assiette Grillades Mixtes MAMO",
            "de": "MAMO Gemischte Grillplatte"
          },
          "descripcion": {
            "es": "Cortes mixtos de carne, pollo, cerdo y chorizo acompañados con patacones y ensalada.",
            "en": "Mixed grilled cuts of beef, chicken, pork, and chorizo served with crispy plantains and salad.",
            "fr": "Assortiment grillé de bœuf, poulet, porc et chorizo accompagné de patacones et salade.",
            "de": "Gemischte Grillplatte mit Rind, Hähnchen, Schwein und Chorizo, dazu Kochbananen und Salat."
          },
          "precio": 80000,
          "etiquetas": [
            "chef"
          ],
          "insignia": {
            "es": "Especialidad de la Casa",
            "en": "House Specialty",
            "fr": "Spécialité Maison",
            "de": "Hausspezialität"
          },
          "imagenUrl": "https://gvrroyncnrnjsaldlges.supabase.co/storage/v1/object/public/eventos/eventos/1794923754913-tj278zj.webp"
        }
      ]
    },
    {
      "id": "pescados-mariscos",
      "icono": "🐟",
      "titulos": {
        "es": "Pescados & Mariscos",
        "en": "Fish & Seafood",
        "fr": "Poissons & Fruits de mer",
        "de": "Fisch & Meeresfrüchte"
      },
      "subtitulos": {
        "es": "Sabores frescos del Caribe y recetas de la casa",
        "en": "Fresh Caribbean flavors and signature seafood recipes",
        "fr": "Saveurs fraîches des Caraïbes et recettes maison",
        "de": "Frische karibische Aromen und hausgemachte Fischgerichte"
      },
      "items": [
        {
          "id": "mojarra-roja",
          "nombres": {
            "es": "Mojarra Roja",
            "en": "Whole Fried Red Tilapia (Mojarra Roja)",
            "fr": "Mojarra Rouge Frite Entière",
            "de": "Ganze Gebratene Rote Tilapia (Mojarra)"
          },
          "descripcion": {
            "es": "Mojarra frita acompañada con ensalada, arroz blanco y patacón.",
            "en": "Whole fried red mojarra served with fresh salad, white rice, and crispy plantain.",
            "fr": "Mojarra frite accompagnée de salade fraîche, riz blanc et patacón.",
            "de": "Knusprig gebratene Mojarra mit frischem Salat, weißem Reis und Kochbanane."
          },
          "precio": 30000,
          "imagenUrl": null
        },
        {
          "id": "salmon-al-ajillo",
          "nombres": {
            "es": "Salmón al Ajillo",
            "en": "Garlic Butter Salmon",
            "fr": "Saumon à l'Ail",
            "de": "Lachsfilet in Knoblauchsauce"
          },
          "descripcion": {
            "es": "Filete de salmón al ajillo acompañado con puré de papas.",
            "en": "Salmon fillet in garlic butter sauce served with creamy mashed potatoes.",
            "fr": "Filet de saumon à l'ail accompagné de purée de pommes de terre.",
            "de": "Lachsfilet mit Knoblauchbutter, serviert mit cremigem Kartoffelpüree."
          },
          "precio": 45000,
          "imagenUrl": null
        },
        {
          "id": "salmon-a-la-camaronera",
          "nombres": {
            "es": "Salmón a la Camaronera",
            "en": "Salmon in Creamy Shrimp Sauce",
            "fr": "Saumon Sauce aux Crevettes",
            "de": "Lachsfilet in Garnelensauce"
          },
          "descripcion": {
            "es": "Filete de salmón bañado en salsa de camarones con puré de papas.",
            "en": "Salmon fillet topped with savory shrimp sauce, served with mashed potatoes.",
            "fr": "Filet de saumon nappé d'une sauce aux crevettes avec purée de pommes de terre.",
            "de": "Lachsfilet in herzhafter Garnelensauce, serviert mit Kartoffelpüree."
          },
          "precio": 55000,
          "etiquetas": [
            "chef"
          ],
          "imagenUrl": "https://gvrroyncnrnjsaldlges.supabase.co/storage/v1/object/public/eventos/eventos/1794923828941-wj55ru8.webp"
        },
        {
          "id": "arroz-cremoso-de-mariscos",
          "nombres": {
            "es": "Arroz Cremoso de Mariscos",
            "en": "Creamy Seafood Rice",
            "fr": "Riz Crémeux aux Fruits de Mer",
            "de": "Cremiger Meeresfrüchte-Reis"
          },
          "descripcion": {
            "es": "Arroz cremoso con camarones, cangrejo, almejas, mejillones y calamares.",
            "en": "Creamy rice loaded with shrimp, crab, clams, mussels, and calamari.",
            "fr": "Riz crémeux aux crevettes, crabe, palourdes, moules et calamars.",
            "de": "Cremiger Reis mit Garnelen, Krabben, Venusmuscheln, Miesmuscheln und Tintenfisch."
          },
          "precio": 60000,
          "etiquetas": [
            "chef"
          ],
          "imagenUrl": "https://gvrroyncnrnjsaldlges.supabase.co/storage/v1/object/public/eventos/eventos/1794923752219-e6dv5sj.webp"
        },
        {
          "id": "ceviche-de-camaron",
          "nombres": {
            "es": "Ceviche de Camarón",
            "en": "Shrimp Ceviche",
            "fr": "Ceviche de Crevettes",
            "de": "Garnelen-Ceviche"
          },
          "descripcion": {
            "es": "Camarones marinados con pico de gallo, guacamole y chips de plátano.",
            "en": "Marinated shrimp with pico de gallo, guacamole, and crispy plantain chips.",
            "fr": "Crevettes marinées avec pico de gallo, guacamole et chips de plantain.",
            "de": "Marinierte Garnelen mit Pico de Gallo, Guacamole und knusprigen Kochbananen-Chips."
          },
          "precio": 35000,
          "imagenUrl": null
        },
        {
          "id": "ceviche-de-chicharron",
          "nombres": {
            "es": "Ceviche de Chicharrón",
            "en": "Crispy Pork Belly Ceviche",
            "fr": "Ceviche de Chicharrón Croustillant",
            "de": "Knuspriges Chicharrón-Ceviche"
          },
          "descripcion": {
            "es": "Ceviche crocante de chicharrón preparado al estilo de la casa.",
            "en": "Crunchy pork belly ceviche prepared house-style with fresh citrus.",
            "fr": "Ceviche croustillant de poitrine de porc préparé à la façon de la maison.",
            "de": "Knuspriges Schweinebauch-Ceviche nach Art des Hauses zubereitet."
          },
          "precio": 35000,
          "imagenUrl": null
        }
      ]
    },
    {
      "id": "comida-rapida",
      "icono": "🍔",
      "titulos": {
        "es": "Comida Rápida",
        "en": "Fast Food",
        "fr": "Restauration rapide",
        "de": "Fast Food"
      },
      "subtitulos": {
        "es": "Hamburguesas, salchipapas y clásicos para compartir",
        "en": "Burgers, loaded fries, and casual favorites",
        "fr": "Burgers, salchipapas et classiques gourmands",
        "de": "Burger, Salchipapas und herzhafte Klassiker"
      },
      "items": [
        {
          "id": "burger-house",
          "nombres": {
            "es": "Burger House",
            "en": "Burger House",
            "fr": "Burger House",
            "de": "Burger House"
          },
          "descripcion": {
            "es": "Carne de res a la parrilla, queso frito, lechuga, tomate, cebolla morada y salsa de la casa en pan brioche con papas a la francesa.",
            "en": "Grilled beef patty, fried coastal cheese, lettuce, tomato, red onion, and house sauce on a brioche bun with French fries.",
            "fr": "Steak de bœuf grillé, fromage frit, laitue, tomate, oignon rouge et sauce maison dans un pain brioché avec frites.",
            "de": "Gegrilltes Rindfleisch-Patty, gebratener Käse, Salat, Tomate, rote Zwiebel und Haussauce im Brioche-Brötchen mit Pommes frites."
          },
          "precio": 25000,
          "etiquetas": [
            "chef"
          ],
          "imagenUrl": "https://gvrroyncnrnjsaldlges.supabase.co/storage/v1/object/public/eventos/eventos/1794923754389-12syw2c.webp"
        },
        {
          "id": "chicken-crispy",
          "nombres": {
            "es": "Chicken Crispy",
            "en": "Chicken Crispy Burger",
            "fr": "Burger Chicken Crispy",
            "de": "Chicken Crispy Burger"
          },
          "descripcion": {
            "es": "Filete de pechuga apanado crujiente, queso frito en pan suave con papas a la francesa.",
            "en": "Crispy breaded chicken breast fillet and fried cheese on a soft bun, served with French fries.",
            "fr": "Filet de poulet pané croustillant et fromage frit dans un pain moelleux, servi avec frites.",
            "de": "Knusprig paniertes Hähnchenbrustfilet und gebratener Käse im weichen Brötchen mit Pommes frites."
          },
          "precio": 25000,
          "imagenUrl": null
        },
        {
          "id": "salchipapa-tradicional",
          "nombres": {
            "es": "Salchipapa Tradicional",
            "en": "Traditional Salchipapa",
            "fr": "Salchipapa Traditionnelle",
            "de": "Traditionelle Salchipapa"
          },
          "descripcion": {
            "es": "Papas a la francesa con salchicha de la casa, queso costeño, papa ripio, lechuga y salsa de la casa.",
            "en": "French fries topped with house sausage, coastal cheese, crispy potato sticks, lettuce, and house sauce.",
            "fr": "Frites garnies de saucisse maison, fromage côtier, pommes paille croustillantes, laitue et sauce maison.",
            "de": "Pommes frites mit Hauswurst, Küstenkäse, knusprigen Kartoffelstiften, Salat und Haussauce."
          },
          "precio": 25000,
          "imagenUrl": null
        },
        {
          "id": "salchipapa-de-pollo",
          "nombres": {
            "es": "Salchipapa de Pollo",
            "en": "Chicken Salchipapa",
            "fr": "Salchipapa au Poulet",
            "de": "Hähnchen-Salchipapa"
          },
          "descripcion": {
            "es": "Papas con pollo a la parrilla, salchicha de la casa, queso costeño, papa ripio, lechuga y salsa de la casa.",
            "en": "French fries with grilled chicken, house sausage, coastal cheese, crispy potato sticks, lettuce, and house sauce.",
            "fr": "Frites avec poulet grillé, saucisse maison, fromage côtier, pommes paille, laitue et sauce maison.",
            "de": "Pommes frites mit gegrilltem Hähnchen, Hauswurst, Küstenkäse, Kartoffelstiften, Salat und Haussauce."
          },
          "precio": 35000,
          "imagenUrl": null
        },
        {
          "id": "salvajada",
          "nombres": {
            "es": "Salvajada",
            "en": "La Salvajada (Loaded Mixed Meat Fries)",
            "fr": "La Salvajada (Maxi Frites aux Viandes Grillées)",
            "de": "La Salvajada (Große Grillfleisch-Pommes-Platte)"
          },
          "descripcion": {
            "es": "Papas a la francesa con pollo, carne y cerdo a la parrilla, tocineta, queso costeño, lechuga, papa ripio y salsa de la casa.",
            "en": "French fries loaded with grilled chicken, beef, and pork, bacon, coastal cheese, lettuce, potato sticks, and house sauce.",
            "fr": "Frites garnies de poulet, bœuf et porc grillés, bacon, fromage côtier, laitue, pommes paille et sauce maison.",
            "de": "Pommes frites beladen mit gegrilltem Hähnchen, Rind und Schwein, Speck, Küstenkäse, Salat, Kartoffelstiften und Haussauce."
          },
          "precio": 50000,
          "etiquetas": [
            "chef"
          ],
          "imagenUrl": null
        },
        {
          "id": "perro-americano",
          "nombres": {
            "es": "Perro Americano",
            "en": "Colombian-Style American Hot Dog",
            "fr": "Hot-Dog Américain à la Colombienne",
            "de": "Kolumbianischer Hot Dog"
          },
          "descripcion": {
            "es": "Salchicha americana, queso costeño, papa ripio y salsa de la casa.",
            "en": "American sausage topped with coastal cheese, crunchy potato sticks, and house sauce.",
            "fr": "Saucisse américaine garnie de fromage côtier, pommes paille croustillantes et sauce maison.",
            "de": "Amerikanisches Würstchen mit Küstenkäse, knusprigen Kartoffelstiften und Haussauce."
          },
          "precio": 10000,
          "imagenUrl": null
        }
      ]
    },
    {
      "id": "platos-infantiles",
      "icono": "🍟",
      "titulos": {
        "es": "Platos Infantiles",
        "en": "Kids Menu",
        "fr": "Menu Enfant",
        "de": "Kindergerichte"
      },
      "subtitulos": {
        "es": "Porciones pensadas para los más pequeños",
        "en": "Portions crafted for little explorers",
        "fr": "Portions pensées pour les plus petits",
        "de": "Portionen speziell für unsere kleinen Gäste"
      },
      "items": [
        {
          "id": "tender-de-pollo",
          "nombres": {
            "es": "Tender de Pollo",
            "en": "Chicken Tenders with Fries",
            "fr": "Tenders de Poulet & Frites",
            "de": "Hähnchen-Tenders mit Pommes"
          },
          "descripcion": {
            "es": "Pechuga de pollo apanada acompañada con papas a la francesa.",
            "en": "Breaded chicken breast strips served with French fries.",
            "fr": "Aiguillettes de blanc de poulet panées accompagnées de frites.",
            "de": "Panierte Hähnchenbruststreifen, serviert mit Pommes frites."
          },
          "precio": 30000,
          "imagenUrl": null
        },
        {
          "id": "pechuga-infantil",
          "nombres": {
            "es": "Pechuga Infantil",
            "en": "Kids Grilled Chicken Breast",
            "fr": "Blanc de Poulet Enfant",
            "de": "Kinder-Hähnchenbrust vom Grill"
          },
          "descripcion": {
            "es": "Pechuga a la plancha con papas a la francesa y salsa de tomate.",
            "en": "Grilled chicken breast served with French fries and ketchup.",
            "fr": "Blanc de poulet à la plancha avec frites et ketchup.",
            "de": "Gegrillte Hähnchenbrust mit Pommes frites und Ketchup."
          },
          "precio": 20000,
          "imagenUrl": null
        }
      ]
    },
    {
      "id": "cocteles",
      "icono": "🍸",
      "titulos": {
        "es": "Cócteles",
        "en": "Cocktails",
        "fr": "Cocktails",
        "de": "Cocktails"
      },
      "subtitulos": {
        "es": "Coctelería clásica y destilados para brindar en Minca",
        "en": "Classic cocktails and spirits to toast in Minca",
        "fr": "Cocktails classiques et spiritueux pour trinquer à Minca",
        "de": "Klassische Cocktails und Spirituosen zum Anstoßen in Minca"
      },
      "items": [
        {
          "id": "daiquiri",
          "nombres": {
            "es": "Daiquiri",
            "en": "Daiquiri",
            "fr": "Daiquiri",
            "de": "Daiquiri"
          },
          "descripcion": {
            "es": "Cóctel clásico refrescante a base de ron blanco y cítricos.",
            "en": "Refreshing classic white rum and citrus cocktail.",
            "fr": "Cocktail classique rafraîchissant au rhum blanc et agrumes.",
            "de": "Erfrischender klassischer Cocktail mit weißem Rum und Zitrusnote."
          },
          "precio": 25000,
          "imagenUrl": null
        },
        {
          "id": "vodka-tonic",
          "nombres": {
            "es": "Vodka Tonic",
            "en": "Vodka Tonic",
            "fr": "Vodka Tonic",
            "de": "Vodka Tonic"
          },
          "descripcion": {
            "es": "Vodka servido con agua tónica bien fría y hielo.",
            "en": "Vodka served over ice with chilled tonic water.",
            "fr": "Vodka servie sur glace avec eau tonique bien fraîche.",
            "de": "Wodka auf Eis mit gut gekühltem Tonic Water."
          },
          "precio": 25000,
          "imagenUrl": null
        },
        {
          "id": "gin-tonic",
          "nombres": {
            "es": "Gin Tonic",
            "en": "Gin & Tonic",
            "fr": "Gin Tonic",
            "de": "Gin Tonic"
          },
          "descripcion": {
            "es": "Ginebra, agua tónica fría, hielo y rodaja de limón.",
            "en": "Gin, chilled tonic water, ice, and a fresh slice of lime.",
            "fr": "Gin, eau tonique fraîche, glace et rondelle de citron vert.",
            "de": "Gin, gekühltes Tonic Water, Eis und eine frische Limettenscheibe."
          },
          "precio": 25000,
          "imagenUrl": null
        },
        {
          "id": "cuba-libre",
          "nombres": {
            "es": "Cuba Libre",
            "en": "Cuba Libre",
            "fr": "Cuba Libre",
            "de": "Cuba Libre"
          },
          "descripcion": {
            "es": "Ron añejo, bebida de cola y limón.",
            "en": "Aged rum, cola, and fresh lime.",
            "fr": "Rhum ambré, cola et citron vert.",
            "de": "Gereifter Rum, Cola und frische Limette."
          },
          "precio": 25000,
          "imagenUrl": null
        },
        {
          "id": "long-island",
          "nombres": {
            "es": "Long Island",
            "en": "Long Island Iced Tea",
            "fr": "Long Island Iced Tea",
            "de": "Long Island Iced Tea"
          },
          "descripcion": {
            "es": "Vodka, ron blanco, ginebra, tequila blanco, triple seco y Cointreau.",
            "en": "Vodka, white rum, gin, blanco tequila, triple sec, and Cointreau.",
            "fr": "Vodka, rhum blanc, gin, tequila blanche, triple sec et Cointreau.",
            "de": "Wodka, weißer Rum, Gin, weißer Tequila, Triple Sec und Cointreau."
          },
          "precio": 45000,
          "imagenUrl": "https://gvrroyncnrnjsaldlges.supabase.co/storage/v1/object/public/eventos/eventos/1794923753779-5501mwy.webp"
        },
        {
          "id": "shot-de-ron-medellin",
          "nombres": {
            "es": "Shot de Ron Medellín",
            "en": "Ron Medellín Shot",
            "fr": "Shot de Rhum Medellín",
            "de": "Shot Ron Medellín"
          },
          "descripcion": {
            "es": "1.5 oz de Ron Medellín 3 años.",
            "en": "1.5 oz of 3-year aged Ron Medellín.",
            "fr": "4,5 cl (1.5 oz) de Rhum Medellín 3 ans d'âge.",
            "de": "4,5 cl (1.5 oz) 3 Jahre gereifter Ron Medellín."
          },
          "precio": 20000,
          "imagenUrl": null
        }
      ]
    },
    {
      "id": "bebidas-cervezas",
      "icono": "🍺",
      "titulos": {
        "es": "Bebidas & Cervezas",
        "en": "Drinks & Beers",
        "fr": "Boissons & Bières",
        "de": "Getränke & Biere"
      },
      "subtitulos": {
        "es": "Cervezas artesanales, nacionales y bebidas refrescantes",
        "en": "Craft beers, local lagers, and cold refreshments",
        "fr": "Bières artisanales, bières locales et boissons fraîches",
        "de": "Craft-Biere, kolumbianische Biere und kalte Erfrischungen"
      },
      "items": [
        {
          "id": "cerveza-artesanal-7-olas",
          "nombres": {
            "es": "Cerveza Artesanal 7 Olas",
            "en": "7 Olas Craft Beer",
            "fr": "Bière Artisanale 7 Olas",
            "de": "7 Olas Craft-Bier"
          },
          "precio": 15000,
          "imagenUrl": null
        },
        {
          "id": "cerveza-coronita",
          "nombres": {
            "es": "Cerveza Coronita",
            "en": "Coronita Beer",
            "fr": "Bière Coronita",
            "de": "Coronita Bier"
          },
          "precio": 12000,
          "imagenUrl": null
        },
        {
          "id": "cerveza-aguila-original",
          "nombres": {
            "es": "Cerveza Águila Original",
            "en": "Águila Original Beer",
            "fr": "Bière Águila Original",
            "de": "Águila Original Bier"
          },
          "precio": 9000,
          "imagenUrl": null
        },
        {
          "id": "cerveza-club-colombia",
          "nombres": {
            "es": "Cerveza Club Colombia",
            "en": "Club Colombia Beer",
            "fr": "Bière Club Colombia",
            "de": "Club Colombia Bier"
          },
          "precio": 9000,
          "imagenUrl": null
        },
        {
          "id": "cerveza-poker",
          "nombres": {
            "es": "Cerveza Poker",
            "en": "Poker Beer",
            "fr": "Bière Poker",
            "de": "Poker Bier"
          },
          "precio": 8000,
          "imagenUrl": null
        },
        {
          "id": "cerveza-costena",
          "nombres": {
            "es": "Cerveza Costeña",
            "en": "Costeña Beer",
            "fr": "Bière Costeña",
            "de": "Costeña Bier"
          },
          "precio": 8000,
          "imagenUrl": null
        },
        {
          "id": "gatorade",
          "nombres": {
            "es": "Gatorade",
            "en": "Gatorade",
            "fr": "Gatorade",
            "de": "Gatorade"
          },
          "precio": 9000,
          "imagenUrl": null
        },
        {
          "id": "coca-cola-original",
          "nombres": {
            "es": "Coca-Cola Original",
            "en": "Coca-Cola Original",
            "fr": "Coca-Cola Original",
            "de": "Coca-Cola Original"
          },
          "precio": 8000,
          "imagenUrl": null
        },
        {
          "id": "coca-cola-zero",
          "nombres": {
            "es": "Coca-Cola Zero",
            "en": "Coca-Cola Zero",
            "fr": "Coca-Cola Zéro",
            "de": "Coca-Cola Zero"
          },
          "precio": 8000,
          "imagenUrl": null
        },
        {
          "id": "powerade",
          "nombres": {
            "es": "Powerade",
            "en": "Powerade",
            "fr": "Powerade",
            "de": "Powerade"
          },
          "precio": 8000,
          "imagenUrl": null
        },
        {
          "id": "kola-roman",
          "nombres": {
            "es": "Kola Román",
            "en": "Kola Román (Traditional Caribbean Soda)",
            "fr": "Kola Román (Soda Traditionnel des Caraïbes)",
            "de": "Kola Román (Traditionelle Karibik-Limonade)"
          },
          "precio": 7000,
          "imagenUrl": null
        },
        {
          "id": "cola-y-pola",
          "nombres": {
            "es": "Cola & Pola",
            "en": "Cola & Pola (Shandy)",
            "fr": "Cola & Pola (Panaché Colombien)",
            "de": "Cola & Pola (Kolumbianisches Radler)"
          },
          "precio": 7000,
          "imagenUrl": null
        },
        {
          "id": "postobon-personal",
          "nombres": {
            "es": "Postobón Personal",
            "en": "Postobón Soda",
            "fr": "Soda Postobón",
            "de": "Postobón Limonade"
          },
          "precio": 7000,
          "imagenUrl": null
        },
        {
          "id": "soda-bretana",
          "nombres": {
            "es": "Soda Bretaña",
            "en": "Bretaña Club Soda (Sparkling Water)",
            "fr": "Eau Gazeuse Bretaña",
            "de": "Bretaña Sodawasser"
          },
          "precio": 7000,
          "imagenUrl": null
        },
        {
          "id": "agua",
          "nombres": {
            "es": "Agua",
            "en": "Bottled Water",
            "fr": "Eau Minérale",
            "de": "Wasser"
          },
          "precio": 6000,
          "imagenUrl": null
        },
        {
          "id": "jugo-del-valle",
          "nombres": {
            "es": "Jugo del Valle",
            "en": "Del Valle Fruit Juice",
            "fr": "Jus de Fruits Del Valle",
            "de": "Del Valle Fruchtsaft"
          },
          "precio": 6000,
          "imagenUrl": null
        },
        {
          "id": "pony-malta",
          "nombres": {
            "es": "Pony Malta",
            "en": "Pony Malta (Non-Alcoholic Malt Beverage)",
            "fr": "Pony Malta (Boisson au Malt Sans Alcool)",
            "de": "Pony Malta (Alkoholfreies Malzgetränk)"
          },
          "precio": 5000,
          "imagenUrl": null
        }
      ]
    }
  ]
}$menu$::jsonb
)
WHERE id = '379566b8-036e-4b39-aaad-7a9fb8b7ae8e';

-- Datos maestros del aliado (Instagram)
UPDATE public.negocios
SET instagram = 'mamominca'
WHERE id = 'bfa8f047-06fd-406c-8023-575b4a9b4e1d';

-- Verificación
SELECT id, titulo,
       metadata_hospedaje->>'menu_interactivo' AS interactivo,
       metadata_hospedaje->>'menu_tema' AS tema,
       jsonb_array_length(metadata_hospedaje->'menu_data'->'categorias') AS categorias,
       (SELECT SUM(jsonb_array_length(c->'items'))
          FROM jsonb_array_elements(metadata_hospedaje->'menu_data'->'categorias') c) AS productos
FROM public.eventos
WHERE id = '379566b8-036e-4b39-aaad-7a9fb8b7ae8e';
