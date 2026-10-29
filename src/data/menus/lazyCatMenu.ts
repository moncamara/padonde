import type { TemaMenuId } from "@/components/menu/menuThemes";

export type IdiomaCodigo = "es" | "en" | "fr" | "de";

export interface ItemMenu {
  id: string;
  nombres: Record<IdiomaCodigo, string>;
  ingredientes?: Record<IdiomaCodigo, string>;
  descripcion?: Record<IdiomaCodigo, string>;
  precio: number;
  preciosVariados?: { etiqueta: string; precio: number }[];
  insignia?: {
    es: string;
    en: string;
    fr: string;
    de: string;
  };
  etiquetas?: ("angus" | "vegetariano" | "chef" | "happy_hour" | "fines_de_semana")[];
  maridaje?: Record<IdiomaCodigo, string>;
  imagenUrl?: string;
}

export interface CategoriaMenu {
  id: string;
  icono: string;
  titulos: Record<IdiomaCodigo, string>;
  subtitulos?: Record<IdiomaCodigo, string>;
  items: ItemMenu[];
}

export interface MenuRestaurante {
  id: string;
  negocioNombre: string;
  subtitulo: Record<IdiomaCodigo, string>;
  zona: string;
  selloCalidad: Record<IdiomaCodigo, string>;
  pdfOriginalUrl: string;
  googleMapsUrl: string;
  /** Tema visual por defecto, escogido según la identidad real del lugar */
  tema?: TemaMenuId;
  whatsapp: string;
  telefono: string;
  email: string;
  horarioHappyHour: {
    inicio: string; // "17:00"
    fin: string; // "19:00"
    texto: Record<IdiomaCodigo, string>;
  };
  categorias: CategoriaMenu[];
}

export const LAZY_CAT_MENU: MenuRestaurante = {
  id: "lazy-cat-minca",
  negocioNombre: "Lazy Cat Bar & Restaurante",
  subtitulo: {
    es: "Cocina Fusión · Hamburguesas de Autor · Coctelería de Montaña",
    en: "Fusion Cuisine · Gourmet Burgers · Mountain Craft Cocktails",
    fr: "Cuisine Fusion · Burgers Gourmets · Cocktails Artisanaux de Montagne",
    de: "Fusionsküche · Gourmet-Burger · Handgemachte Bergcocktails",
  },
  zona: "Minca · Sierra Nevada",
  selloCalidad: {
    es: "Selección Gastronómica PaDónde · Excelencia Minca",
    en: "PaDónde Culinary Selection · Minca Excellence",
    fr: "Sélection Gastronomique PaDónde · Excellence Minca",
    de: "PaDónde Kulinarische Auswahl · Exzellenz Minca",
  },
  pdfOriginalUrl: "/menus/menu_lazy.pdf",
  googleMapsUrl: "https://maps.google.com/?q=The+Lazy+Cat+Minca",
  tema: "fogon",
  whatsapp: "573007482406",
  telefono: "+57 300 748 2406",
  email: "lazycatminca@gmail.com",
  horarioHappyHour: {
    inicio: "17:00",
    fin: "19:00",
    texto: {
      es: "Todos los días · 5:00 PM a 7:00 PM",
      en: "Every day · 5:00 PM to 7:00 PM",
      fr: "Tous les jours · 17h00 à 19h00",
      de: "Täglich · 17:00 bis 19:00 Uhr",
    },
  },
  categorias: [
    {
      id: "burgers_gourmet",
      icono: "🍔",
      titulos: {
        es: "Hamburguesas Gourmet & Sandwiches",
        en: "Gourmet Burgers & Sandwiches",
        fr: "Burgers Gourmets & Sandwiches",
        de: "Gourmet-Burger & Sandwiches",
      },
      subtitulos: {
        es: "Carne 100% seleccionada, panes artesanales y combinaciones de autor",
        en: "100% selected beef, artisanal buns, and signature combinations",
        fr: "Bœuf 100% sélectionné, pains artisanaux et recettes créatives",
        de: "100% ausgewähltes Rindfleisch, handgemachte Brötchen und Hauskreationen",
      },
      items: [
        {
          id: "big-blue",
          nombres: {
            es: "Big Blue Burger",
            en: "Big Blue Burger",
            fr: "Burger Big Blue",
            de: "Big Blue Burger",
          },
          ingredientes: {
            es: "Queso azul madurado, tomates cherry confitados, rúgula fresca y cebolla caramelizada.",
            en: "Aged blue cheese, candied cherry tomatoes, fresh arugula, and caramelized onions.",
            fr: "Fromage bleu affiné, tomates cerises confites, roquette fraîche et oignons caramélisés.",
            de: "Gereifter Blauschimmelkäse, Kirschtomaten, frischer Rucola und karamellisierte Zwiebeln.",
          },
          precio: 22000,
          insignia: {
            es: "⭐ Favorito del Chef",
            en: "⭐ Chef's Favorite",
            fr: "⭐ Coup de Cœur du Chef",
            de: "⭐ Favorit des Chefs",
          },
          etiquetas: ["chef"],
          maridaje: {
            es: "Maridaje perfecto: Cerveza artesanal Nevada Happy Toucan",
            en: "Perfect pairing: Happy Toucan local craft beer",
            fr: "Accord parfait : Bière artisanale locale Happy Toucan",
            de: "Perfekte Begleitung: Happy Toucan lokales Craft-Bier",
          },
        },
        {
          id: "lazy-cat-burger",
          nombres: {
            es: "Lazy Cat Burger",
            en: "Lazy Cat Burger",
            fr: "Burger Signature Lazy Cat",
            de: "Lazy Cat Haus-Burger",
          },
          ingredientes: {
            es: "Salsa cremosa de champiñones al vino, tocineta crocante, queso fundido y lechuga fresca.",
            en: "Creamy mushroom & wine sauce, crispy bacon, melted cheese, and fresh lettuce.",
            fr: "Sauce crémeuse aux champignons et vin, bacon croustillant, fromage fondu et laitue fraîche.",
            de: "Cremige Pilz-Wein-Sauce, knuspriger Speck, geschmolzener Käse und frischer Blattsalat.",
          },
          precio: 22000,
          insignia: {
            es: "👑 La Hamburguesa de la Casa",
            en: "👑 House Signature Burger",
            fr: "👑 Signature de la Maison",
            de: "👑 Aushängeschild des Hauses",
          },
          etiquetas: ["chef"],
          imagenUrl: "/menus/dishes/lazy_cat_burger.png",
        },
        {
          id: "maxi-burguer",
          nombres: {
            es: "Maxi Burguer Suprema",
            en: "Maxi Supreme Burger",
            fr: "Maxi Burger Suprême",
            de: "Maxi Burger Supreme",
          },
          ingredientes: {
            es: "Doble carne premium, doble queso americano, aros de cebolla crocantes y cebolla caramelizada.",
            en: "Double premium beef, double cheese, crispy onion rings, and caramelized onions.",
            fr: "Double viande de bœuf, double fromage, beignets d'oignons croustillants et oignons caramélisés.",
            de: "Doppeltes Premium-Rindfleisch, doppelter Käse, knusprige Zwiebelringe und karamellisierte Zwiebeln.",
          },
          precio: 30000,
          insignia: {
            es: "🔥 Gran Apetito",
            en: "🔥 Big Appetite",
            fr: "🔥 Pour les Grands Gourmands",
            de: "🔥 Großer Hunger",
          },
        },
        {
          id: "steak-sandwich",
          nombres: {
            es: "Steak Sandwich de Lomo Fino",
            en: "Tenderloin Steak Sandwich",
            fr: "Sandwich Steak Filet de Bœuf",
            de: "Rinderfilet Steak-Sandwich",
          },
          ingredientes: {
            es: "Lomo fino a la plancha, cebolla caramelizada, tomate cherry, pepinillos encurtidos, rúgula y mostaza dijon.",
            en: "Grilled beef tenderloin, caramelized onions, cherry tomatoes, pickles, arugula, and Dijon mustard.",
            fr: "Filet de bœuf grillé, oignons caramélisés, tomates cerises, cornichons, roquette et moutarde de Dijon.",
            de: "Gegrilltes Rinderfilet, karamellisierte Zwiebeln, Kirschtomaten, Essiggurken, Rucola und Dijonsenf.",
          },
          precio: 22000,
        },
        {
          id: "crunchy-chicken",
          nombres: {
            es: "Crunchy Chicken Burger",
            en: "Crunchy Chicken Burger",
            fr: "Burger Poulet Croustillant",
            de: "Knuspriges Hähnchen-Burger",
          },
          ingredientes: {
            es: "Pechuga de pollo apanada crocante, lechuga, tomates maduros, queso fundido y pesto artesanal de la casa.",
            en: "Crispy breaded chicken breast, lettuce, ripe tomatoes, melted cheese, and homemade basil pesto.",
            fr: "Filet de poulet pané croustillant, laitue, tomates, fromage fondu et pesto maison.",
            de: "Knusprig paniertes Hähnchenfilet, Blattsalat, Tomaten, geschmolzener Käse und hausgemachtes Pesto.",
          },
          precio: 20000,
        },
        {
          id: "veggie-burger",
          nombres: {
            es: "Veggie Burger de Falafel",
            en: "Artisanal Falafel Veggie Burger",
            fr: "Burger Végétarien au Falafel",
            de: "Vegetarischer Falafel-Burger",
          },
          ingredientes: {
            es: "Medallón casero de falafel con hierbas de Minca, queso, tomate, lechuga, pepinillos y salsa griega tzatziki.",
            en: "Homemade chickpea falafel with Minca herbs, cheese, tomato, lettuce, pickles, and Greek tzatziki sauce.",
            fr: "Galette de falafel maison aux herbes de Minca, fromage, tomate, salade, cornichons et sauce tzatzíki grecque.",
            de: "Hausgemachtes Kichererbsen-Falafel mit Kräutern aus Minca, Käse, Tomate, Salat, Essiggurken und Tzatziki.",
          },
          precio: 15000,
          insignia: {
            es: "🌱 100% Vegetariano",
            en: "🌱 100% Vegetarian",
            fr: "🌱 100% Végétarien",
            de: "🌱 100% Vegetarisch",
          },
          etiquetas: ["vegetariano"],
        },
        {
          id: "mexicana-burger",
          nombres: {
            es: "Hamburguesa Mexicana",
            en: "Mexican Style Burger",
            fr: "Burger Mexicain Épicé",
            de: "Mexikanischer Burger",
          },
          ingredientes: {
            es: "Carne artesanal, guacamole recién preparado, suero costeño, pico de gallo, jalapeños picantes y totopos Doritos.",
            en: "Artisanal beef, fresh guacamole, Caribbean sour cream, pico de gallo, spicy jalapeños, and crunchy tortilla chips.",
            fr: "Bœuf artisanal, guacamole frais, crème des Caraïbes, pico de gallo, piments jalapeños et chips tortillas.",
            de: "Hausgemachtes Rindfleisch, frische Guacamole, karibischer Sauerrahm, Pico de Gallo, Jalapeños und Tortilla-Chips.",
          },
          precio: 22000,
          imagenUrl: "/menus/dishes/mexicana_burger.png",
        },
        {
          id: "criolla-burger",
          nombres: {
            es: "Hamburguesa Criolla",
            en: "Colombian Criolla Burger",
            fr: "Burger Créole Colombien",
            de: "Kolumbianischer Criolla-Burger",
          },
          ingredientes: {
            es: "Queso fundido, huevo frito a la plancha, tocineta ahumada y salsa secreta de la casa.",
            en: "Melted cheese, sunny-side fried egg, smoked bacon, and house secret sauce.",
            fr: "Fromage fondu, œuf au plat, bacon fumé et sauce secrète du chef.",
            de: "Geschmolzener Käse, Spiegelei, geräucherter Speck und geheime Haussauce.",
          },
          precio: 20000,
        },
        {
          id: "cheese-burger",
          nombres: {
            es: "Classic Cheese Burger",
            en: "Classic Cheese Burger",
            fr: "Cheeseburger Classique",
            de: "Klassischer Cheeseburger",
          },
          ingredientes: {
            es: "Carne jugosa a la parrilla, queso cheddar americano, lechuga y tomate en pan brioche.",
            en: "Juicy grilled beef, melted cheddar cheese, fresh lettuce, and tomato on brioche bun.",
            fr: "Bœuf grillé juteux, cheddar fondant, laitue fraîche et tomate sur pain brioché.",
            de: "Saftiges gegrilltes Rindfleisch, Cheddarkäse, frischer Salat und Tomate im Brioche-Brötchen.",
          },
          precio: 15000,
        },
      ],
    },
    {
      id: "hotdogs_artesanales",
      icono: "🌭",
      titulos: {
        es: "Hot Dogs de Autor",
        en: "Gourmet Hot Dogs",
        fr: "Hot Dogs Gourmets",
        de: "Gourmet Hot Dogs",
      },
      subtitulos: {
        es: "Salchicha Frankfurt premium con aderezos y salsas exclusivas",
        en: "Premium Frankfurt sausage with signature dressings and sauces",
        fr: "Saucisse Francfort premium avec sauces et garnitures exclusives",
        de: "Premium-Frankfurter mit exklusiven Saucen und Toppings",
      },
      items: [
        {
          id: "lazy-dog",
          nombres: {
            es: "Lazy Dog Especial",
            en: "Lazy Dog Signature",
            fr: "Lazy Dog Signature",
            de: "Lazy Dog Haus-Spezial",
          },
          ingredientes: {
            es: "Salchicha Frankfurt, queso fundido, tocineta crujiente, champiñones salteados y papas fósforo.",
            en: "Frankfurt sausage, melted cheese, crispy bacon, sautéed mushrooms, and crushed potato crisps.",
            fr: "Saucisse Francfort, fromage fondu, bacon croustillant, champignons sautés et chips allumettes.",
            de: "Frankfurter Würstchen, geschmolzener Käse, knuspriger Speck, Champignons und Kartoffelsticks.",
          },
          precio: 15000,
          imagenUrl: "/menus/dishes/lazy_dog.png",
        },
        {
          id: "blue-dog",
          nombres: {
            es: "Blue Dog Gourmet",
            en: "Blue Cheese Dog",
            fr: "Hot Dog au Fromage Bleu",
            de: "Blauschimmelkäse Dog",
          },
          ingredientes: {
            es: "Queso azul madurado, tomates cherry, cebolla caramelizada y crocantes papas fósforo.",
            en: "Aged blue cheese, cherry tomatoes, caramelized onions, and crunchy potato crisps.",
            fr: "Fromage bleu affiné, tomates cerises, oignons caramélisés et chips allumettes.",
            de: "Gereifter Blauschimmelkäse, Kirschtomaten, karamellisierte Zwiebeln und Kartoffelsticks.",
          },
          precio: 16000,
        },
        {
          id: "lazy-chihuahua",
          nombres: {
            es: "Lazy Chihuahua",
            en: "Lazy Chihuahua (Tex-Mex)",
            fr: "Lazy Chihuahua Tex-Mex",
            de: "Lazy Chihuahua Tex-Mex",
          },
          ingredientes: {
            es: "Queso, guacamole fresco, totopos Doritos, pico de gallo, jalapeños y suero costeño.",
            en: "Cheese, fresh guacamole, Doritos chips, pico de gallo, jalapeños, and Caribbean sour cream.",
            fr: "Fromage, guacamole frais, chips Doritos, pico de gallo, jalapeños et crème des Caraïbes.",
            de: "Käse, frische Guacamole, Doritos, Pico de Gallo, Jalapeños und karibischer Sauerrahm.",
          },
          precio: 15000,
        },
        {
          id: "lazy-cachorro",
          nombres: {
            es: "Lazy Cachorro Tradicional",
            en: "Classic Lazy Cachorro",
            fr: "Lazy Cachorro Traditionnel",
            de: "Klassischer Lazy Cachorro",
          },
          ingredientes: {
            es: "Salchicha Frankfurt, doble queso y selección de salsas de la casa.",
            en: "Frankfurt sausage, melted cheese, and selection of signature house sauces.",
            fr: "Saucisse Francfort, double fromage fondu et sélection de sauces maison.",
            de: "Frankfurter Würstchen, doppelter Käse und hausgemachte Saucen.",
          },
          precio: 12000,
        },
        {
          id: "baby-dog",
          nombres: {
            es: "Baby Dog Infantil",
            en: "Baby Dog (Kids)",
            fr: "Baby Dog (Enfant)",
            de: "Baby Dog (Kinder)",
          },
          ingredientes: {
            es: "Versión sencilla y suave ideal para niños con queso y salsas suaves.",
            en: "Simple kid-friendly version with melted cheese and mild sauce.",
            fr: "Version simple pour enfants avec fromage fondu et sauces douces.",
            de: "Einfache kinderfreundliche Version mit Käse und milden Saucen.",
          },
          precio: 6000,
        },
      ],
    },
    {
      id: "parrilla_especiales",
      icono: "🥩",
      titulos: {
        es: "Parrilla & Ahumados de Alta Selección",
        en: "Grill & Smoked Prime Cuts",
        fr: "Grillades & Fumoirs de Haute Sélection",
        de: "Grill & Rauchfleisch-Spezialitäten",
      },
      subtitulos: {
        es: "Cortes madurados, sellados al fuego vivo con guarniciones campesinas",
        en: "Aged prime cuts, flame-seared with fresh farm-style sides",
        fr: "Pièces de bœuf maturées, saisies à la flamme et accompagnements du terroir",
        de: "Gereifte Premium-Fleischstücke, über offener Flamme gegrillt mit Beilagen",
      },
      items: [
        {
          id: "certified-angus-strip-loin",
          nombres: {
            es: "Certified Angus Beef® Strip Loin",
            en: "Certified Angus Beef® Strip Loin",
            fr: "Faux-Filet Certified Angus Beef®",
            de: "Certified Angus Beef® Rumpsteak",
          },
          ingredientes: {
            es: "Auténtico corte Certified Angus Beef importado, marmoleado excepcional a la parrilla con papas y ensalada fresca.",
            en: "Authentic imported Certified Angus Beef cut, exceptional marbling grilled to perfection with fries and fresh salad.",
            fr: "Véritable pièce de bœuf Angus certifiée, marbrage exceptionnel grillé avec frites et salade fraîche.",
            de: "Echtes Certified Angus Beef, hervorragende Marmorierung, perfekt gegrillt mit Pommes und Salat.",
          },
          precio: 35000,
          insignia: {
            es: "🥩 Certified Angus Beef® Original",
            en: "🥩 Certified Angus Beef® Prime",
            fr: "🥩 Bœuf Angus Certifié d'Origine",
            de: "🥩 Original Certified Angus Beef®",
          },
          etiquetas: ["angus", "chef"],
        },
        {
          id: "filete-mignon",
          nombres: {
            es: "Filete Mignon Especial (250g)",
            en: "Filet Mignon Signature (250g)",
            fr: "Filet Mignon au Poivre & Champignons (250g)",
            de: "Filet Mignon Spezial (250g)",
          },
          ingredientes: {
            es: "Lomo fino tierno de res (250g) envuelto en tocineta crocante, bañado en salsa de champiñones al vino con papas y ensalada.",
            en: "Tender beef tenderloin (250g) wrapped in crispy bacon, topped with wine & mushroom reduction, served with fries and salad.",
            fr: "Tendre filet de bœuf (250g) enrobé de bacon croustillant, nappé de sauce aux champignons et vin, frites et salade.",
            de: "Zartes Rinderfilet (250g) im Speckmantel, an feiner Pilz-Wein-Sauce, serviert mit Pommes und Salat.",
          },
          precio: 36000,
          insignia: {
            es: "⭐ Especialidad Lazy Cat",
            en: "⭐ Lazy Cat Specialty",
            fr: "⭐ Spécialité Lazy Cat",
            de: "⭐ Lazy Cat Spezialität",
          },
          etiquetas: ["chef"],
          imagenUrl: "/menus/dishes/filet_mignon.png",
        },
        {
          id: "baby-beef",
          nombres: {
            es: "Baby Beef de Lomo Fino (200g)",
            en: "Baby Beef Tenderloin (200g)",
            fr: "Baby Beef Filet de Bœuf (200g)",
            de: "Baby Beef Rinderfilet (200g)",
          },
          ingredientes: {
            es: "200 gramos de lomo fino corte mariposa a la brasa, acompañado de papas a la francesa y ensalada fresca de la huerta.",
            en: "200 grams of butterfly cut tenderloin grilled over embers, served with golden french fries and fresh garden salad.",
            fr: "200 grammes de filet de bœuf en papillon grillé aux braises, frites dorées et salade du potager.",
            de: "200 Gramm Schmetterlingsschnitt-Rinderfilet über Glut gegrillt, Pommes Frites und frischer Gartensalat.",
          },
          precio: 25000,
        },
        {
          id: "costillas-ahumadas",
          nombres: {
            es: "Costillas Ahumadas BBQ (Fines de Semana)",
            en: "Smoked BBQ Ribs (Weekends Only)",
            fr: "Travers de Porc Fumés BBQ (Week-ends)",
            de: "Geräucherte BBQ-Rippchen (Wochenende)",
          },
          ingredientes: {
            es: "Costillas de cerdo ahumadas a fuego lento durante horas con maderas aromáticas, glaseadas en salsa BBQ de la casa, papas y ensalada.",
            en: "Slow-smoked pork ribs over aromatic woods for hours, glazed in signature BBQ sauce, served with potatoes and house salad.",
            fr: "Travers de porc fumés lentement au bois aromatique, laqués à la sauce barbecue maison, pommes de terre et salade.",
            de: "Stundenlang über aromatischem Holz geräucherte Rippchen, glasiert mit BBQ-Haussauce, Kartoffeln und Salat.",
          },
          precio: 28000,
          insignia: {
            es: "🔥 Solo Fines de Semana",
            en: "🔥 Weekends Only",
            fr: "🔥 Seulement le Week-end",
            de: "🔥 Nur am Wochenende",
          },
          etiquetas: ["fines_de_semana", "chef"],
          imagenUrl: "/menus/dishes/costillas_ahumadas.png",
        },
        {
          id: "lomo-cerdo-tamarindo",
          nombres: {
            es: "Lomo de Cerdo en Salsa de Tamarindo (200g)",
            en: "Pork Tenderloin in Tamarind Glaze (200g)",
            fr: "Filet Mignon de Porc au Tamarin (200g)",
            de: "Schweinefilet in Tamarindensauce (200g)",
          },
          ingredientes: {
            es: "Medallones de cerdo jugosos bañados en reducción agridulce de tamarindo caribeño con papas y ensalada.",
            en: "Juicy pork tenderloin medallions glazed in Caribbean sweet and tangy tamarind reduction, with potatoes and salad.",
            fr: "Médaillons de porc juteux nappés d'une réduction aigre-douce de tamarin caribéen, pommes de terre et salade.",
            de: "Saftige Schweinefilet-Medaillons in karibischer süß-saurer Tamarindensauce, serviert mit Kartoffeln und Salat.",
          },
          precio: 22000,
        },
        {
          id: "pollo-plancha",
          nombres: {
            es: "Pechuga de Pollo a la Plancha",
            en: "Grilled Herb Chicken Breast",
            fr: "Blanc de Poulet Grillé aux Herbes",
            de: "Gegrillte Kräuter-Hähnchenbrust",
          },
          ingredientes: {
            es: "Pechuga marinada con hierbas de la Sierra, dorada a la plancha, papas y ensalada fresca.",
            en: "Chicken breast marinated in Sierra herbs, grilled golden, served with fries and salad.",
            fr: "Blanc de poulet mariné aux herbes de la Sierra, doré à la plancha, frites et salade.",
            de: "In Sierra-Kräutern marinierte Hähnchenbrust, goldbraun gegrillt, mit Pommes und Salat.",
          },
          precio: 20000,
        },
        {
          id: "picada-mixta",
          nombres: {
            es: "Gran Picada Mixta de la Sierra",
            en: "Grand Mixed Sierra Grill Platter",
            fr: "Plateau Gourmand de Grillades de la Sierra",
            de: "Große Gemischte Grillplatte der Sierra",
          },
          ingredientes: {
            es: "Combinación generosa de carne de res, costilla de cerdo, alitas picantes, papas, patacones y salsas.",
            en: "Generous combination of tender beef, pork ribs, spicy wings, potatoes, fried plantains, and dips.",
            fr: "Combinaison généreuse de bœuf, travers de porc, ailes piquantes, pommes de terre, bananes plantain et sauces.",
            de: "Üppige Platte mit Rindfleisch, Schweinerippchen, pikanten Wings, Kartoffeln, Kochbananen und Dips.",
          },
          precio: 30000,
          preciosVariados: [
            { etiqueta: "Personal (1p)", precio: 30000 },
            { etiqueta: "Mediana (2-3p)", precio: 50000 },
            { etiqueta: "Familiar (4-5p)", precio: 80000 },
          ],
        },
      ],
    },
    {
      id: "woks_arroz",
      icono: "🥢",
      titulos: {
        es: "Woks Orientales con Tallarines de Arroz",
        en: "Asian Rice Noodle Woks",
        fr: "Woks Asiatiques aux Nouilles de Riz",
        de: "Asiatische Reisnudel-Woks",
      },
      subtitulos: {
        es: "Salteados al fuego de wok con maní tostado, lima y vegetales crocantes",
        en: "Wok-tossed over high heat with roasted peanuts, fresh lime, and crisp vegetables",
        fr: "Sautés au wok à feu vif avec cacahuètes grillées, citron vert et légumes croquants",
        de: "Im Wok scharf angebraten mit gerösteten Erdnüssen, Limette und knackigem Gemüse",
      },
      items: [
        {
          id: "wok-lomo-fino",
          nombres: {
            es: "Wok de Lomo Fino & Vegetales",
            en: "Beef Tenderloin & Vegetable Wok",
            fr: "Wok Filet de Bœuf & Légumes Croquants",
            de: "Rinderfilet & Gemüse Wok",
          },
          ingredientes: {
            es: "Tiras tiernas de carne de res, brócoli, zanahoria, pimentón, cebolla, champiñones, tallarines de arroz, maní y limón.",
            en: "Tender beef strips, broccoli, carrot, bell peppers, onion, mushrooms, rice noodles, roasted peanuts, and lime.",
            fr: "Émincé de bœuf tendre, brocoli, carotte, poivron, oignon, champignons, nouilles de riz, cacahuètes et citron vert.",
            de: "Zarte Rindfleischstreifen, Brokkoli, Karotte, Paprika, Zwiebel, Champignons, Reisnudeln, Erdnüsse und Limette.",
          },
          precio: 22000,
          imagenUrl: "/menus/dishes/wok_arroz.png",
        },
        {
          id: "wok-vegetariano",
          nombres: {
            es: "Wok Vegetariano de la Huerta",
            en: "Garden Vegetarian Rice Noodle Wok",
            fr: "Wok Végétarien du Potager",
            de: "Vegetarischer Gartengemüse-Wok",
          },
          ingredientes: {
            es: "Brócoli, zanahoria, pimentón, cebolla, champiñones frescos salteados en salsa de soya aromatizada con maní y limón.",
            en: "Fresh broccoli, carrot, bell peppers, onion, mushrooms wok-tossed in seasoned soy sauce with peanuts and fresh lime.",
            fr: "Brocoli, carottes, poivrons, oignons, champignons frais sautés à la sauce soja parfumée, cacahuètes et citron vert.",
            de: "Brokkoli, Karotten, Paprika, Zwiebeln, frische Champignons in würziger Sojasauce mit Erdnüssen und Limette.",
          },
          precio: 18000,
          insignia: {
            es: "🌱 Opción Vegana",
            en: "🌱 Vegan Option",
            fr: "🌱 Option Végétalienne",
            de: "🌱 Vegane Option",
          },
          etiquetas: ["vegetariano"],
        },
        {
          id: "wok-pollo",
          nombres: {
            es: "Wok de Pollo & Vegetales",
            en: "Chicken & Vegetable Wok",
            fr: "Wok Poulet & Légumes",
            de: "Hähnchen & Gemüse Wok",
          },
          ingredientes: {
            es: "Pollo dorado al wok, brócoli, zanahoria, pimentón, cebolla, champiñones, tallarines de arroz con maní y toque cítrico.",
            en: "Wok-seared chicken, broccoli, carrot, bell peppers, onion, mushrooms, rice noodles with peanuts and citrus zest.",
            fr: "Poulet saisi au wok, brocoli, carotte, poivron, oignon, champignons, nouilles de riz aux cacahuètes et citron vert.",
            de: "Hähnchen im Wok angebraten, Brokkoli, Karotte, Paprika, Zwiebel, Champignons, Reisnudeln mit Erdnüssen und Zitrusnote.",
          },
          precio: 20000,
        },
      ],
    },
    {
      id: "entremeces_quesadillas",
      icono: "🌮",
      titulos: {
        es: "Entremeces, Quesadillas & Para Compartir",
        en: "Starters, Quesadillas & Sharing Plates",
        fr: "Entrées, Quesadillas & Plats à Partager",
        de: "Vorspeisen, Quesadillas & zum Teilen",
      },
      subtitulos: {
        es: "Entradas caribeñas y mexicanas ideales para acompañar con un cóctel",
        en: "Caribbean and Mexican starters perfect to pair with a cocktail",
        fr: "Entrées caribéennes et mexicaines idéales avec un cocktail",
        de: "Karibische und mexikanische Vorspeisen, ideal zum Cocktail",
      },
      items: [
        {
          id: "patacones-hogao",
          nombres: {
            es: "Patacones con Hogao Costeño",
            en: "Fried Plantains with Creole Hogao",
            fr: "Bananes Plantain & Hogao Créole",
            de: "Kochbananen mit kreolischer Hogao-Sauce",
          },
          ingredientes: {
            es: "Crocantes patacones de plátano verde con tradicional sofrito criollo de tomate, cebolla y especias.",
            en: "Crispy green plantain discs served with traditional Colombian slow-cooked tomato, onion, and herb creole sauce.",
            fr: "Bananes plantain vertes croustillantes servies avec la sauce créole traditionnelle tomate et oignons.",
            de: "Knusprige grüne Kochbananen mit traditioneller kolumbianischer Tomaten-Zwiebel-Hogao-Sauce.",
          },
          precio: 8000,
        },
        {
          id: "sopa-taco",
          nombres: {
            es: "Sopa de Taco Azteca",
            en: "Aztec Taco Soup",
            fr: "Soupe Mexicaine façon Taco",
            de: "Mexikanische Taco-Suppe",
          },
          ingredientes: {
            es: "Crema caliente de tomate especiada, jalapeños, queso fundido, aguacate fresco, tiras de tortilla y suero costeño.",
            en: "Warm spiced tomato cream soup, jalapeños, melted cheese, fresh avocado, tortilla chips, and sour cream.",
            fr: "Soupe onctueuse de tomates épicées, jalapeños, fromage fondu, avocat frais, tortillas croustillantes et crème.",
            de: "Würzige Tomatencremesuppe, Jalapeños, geschmolzener Käse, frische Avocado, Tortillastreifen und Sauerrahm.",
          },
          precio: 14000,
        },
        {
          id: "quesadilla-lomo",
          nombres: {
            es: "Quesadilla de Lomo Fino",
            en: "Tenderloin Steak Quesadilla",
            fr: "Quesadilla au Filet de Bœuf",
            de: "Rinderfilet Quesadilla",
          },
          ingredientes: {
            es: "Tortilla de trigo tostada, lomo fino a la plancha, champiñones, cebolla caramelizada y abundante queso fundido.",
            en: "Toasted flour tortilla, grilled beef tenderloin, mushrooms, caramelized onions, and melted cheese.",
            fr: "Tortilla de blé dorée, filet de bœuf grillé, champignons, oignons caramélisés et fromage fondu généreux.",
            de: "Getoastete Weizentortilla, gegrilltes Rinderfilet, Champignons, karamellisierte Zwiebeln und geschmolzener Käse.",
          },
          precio: 20000,
          imagenUrl: "/menus/dishes/quesadilla.png",
        },
        {
          id: "quesadilla-pollo-tocineta",
          nombres: {
            es: "Quesadilla de Pollo & Tocineta",
            en: "Chicken & Bacon Quesadilla",
            fr: "Quesadilla Poulet & Bacon",
            de: "Hähnchen & Speck Quesadilla",
          },
          ingredientes: {
            es: "Pechuga de pollo desmechada, tocineta ahumada crujiente y queso derretido con salsas mexicanas.",
            en: "Shredded chicken breast, crispy smoked bacon, and melted cheese with Mexican dips.",
            fr: "Éiloché de poulet, bacon fumé croustillant et fromage fondant accompagnés de sauces mexicaines.",
            de: "Hähnchenbrust, knuspriger geräucherter Speck und geschmolzener Käse mit mexikanischen Saucen.",
          },
          precio: 18000,
        },
        {
          id: "quesadilla-vegetariana",
          nombres: {
            es: "Quesadilla Vegetariana",
            en: "Garden Vegetarian Quesadilla",
            fr: "Quesadilla Végétarienne",
            de: "Vegetarische Gemüse-Quesadilla",
          },
          ingredientes: {
            es: "Brócoli, zucchini, champiñones frescos salteados, cebolla caramelizada y queso fundido.",
            en: "Sautéed broccoli, zucchini, fresh mushrooms, caramelized onions, and melted cheese.",
            fr: "Brocoli, courgette, champignons frais sautés, oignons caramélisés et fromage fondant.",
            de: "Sautierter Brokkoli, Zucchini, frische Champignons, karamellisierte Zwiebeln und geschmolzener Käse.",
          },
          precio: 16000,
          etiquetas: ["vegetariano"],
        },
        {
          id: "yucas-fritas",
          nombres: {
            es: "Yucas Fritas Doradas",
            en: "Golden Fried Yuca Sticks",
            fr: "Frites de Manioc Dorées",
            de: "Knusprige Yucca-Pommes",
          },
          ingredientes: {
            es: "Bastones de yuca campesina crocante por fuera y suave por dentro con salsa tártara.",
            en: "Crisp cassava root wedges, fluffy on the inside, served with tartar sauce.",
            fr: "Bâtonnets de manioc fermier croustillants à l'extérieur et moelleux à l'intérieur, sauce tartare.",
            de: "Knusprige Maniok-Ecken mit Sauce Tartare.",
          },
          precio: 5000,
        },
        {
          id: "anillos-cebolla",
          nombres: {
            es: "Aros de Cebolla Crocantes",
            en: "Crispy Golden Onion Rings",
            fr: "Beignets d'Oignons Croustillants",
            de: "Knusprige Zwiebelringe",
          },
          precio: 8000,
        },
      ],
    },
    {
      id: "happy_hour_promos",
      icono: "🔥",
      titulos: {
        es: "Happy Hour Especial (5 PM a 7 PM)",
        en: "Signature Happy Hour (5 PM to 7 PM)",
        fr: "Happy Hour Exclusif (17h à 19h)",
        de: "Happy Hour Spezial (17:00 bis 19:00 Uhr)",
      },
      subtitulos: {
        es: "Precios especiales todos los días para celebrar el atardecer en Minca",
        en: "Daily special pricing to celebrate the sunset in Minca",
        fr: "Tarifs doux tous les jours pour célébrer le coucher du soleil à Minca",
        de: "Täglich Spezialpreise zum Sonnenuntergang in Minca",
      },
      items: [
        {
          id: "hh-cheese-burger",
          nombres: {
            es: "Cheese Burger + Papas Fritas",
            en: "Cheese Burger + French Fries",
            fr: "Cheeseburger + Frites Dorées",
            de: "Cheeseburger + Pommes Frites",
          },
          precio: 12000,
          insignia: {
            es: "🔥 Precio Especial Happy Hour",
            en: "🔥 Happy Hour Deal",
            fr: "🔥 Offre Happy Hour",
            de: "🔥 Happy Hour Angebot",
          },
          etiquetas: ["happy_hour"],
        },
        {
          id: "hh-veggie-burger",
          nombres: {
            es: "Veggie Burger + Papas Fritas",
            en: "Veggie Burger + French Fries",
            fr: "Burger Végétarien + Frites",
            de: "Veggie-Burger + Pommes",
          },
          precio: 12000,
          etiquetas: ["happy_hour", "vegetariano"],
        },
        {
          id: "hh-cerveza-nevada",
          nombres: {
            es: "Cerveza Artesanal Nevada de Barril",
            en: "Nevada Mountain Craft Draft Beer",
            fr: "Bière Pression Artisanale Nevada",
            de: "Nevada Craft-Bier vom Fass",
          },
          ingredientes: {
            es: "Cerveza fresca tirada de barril elaborada en la Sierra Nevada de Santa Marta.",
            en: "Fresh draft beer brewed locally in the Sierra Nevada mountains.",
            fr: "Bière pression locale brassée dans la Sierra Nevada.",
            de: "Frisches Fassbier, gebraut in der Sierra Nevada.",
          },
          precio: 6000,
          insignia: {
            es: "🍺 De Barril Sierra Nevada",
            en: "🍺 Local Sierra Nevada Draft",
            fr: "🍺 Pression Locale de la Sierra",
            de: "🍺 Lokales Bier aus der Sierra",
          },
          etiquetas: ["happy_hour"],
        },
        {
          id: "hh-mojito-cubano",
          nombres: {
            es: "Mojito Cubano / Daiquiri Clásico",
            en: "Cuban Mojito / Classic Daiquiri",
            fr: "Mojito Cubain / Daiquiri Classique",
            de: "Kubanischer Mojito / Daiquiri",
          },
          ingredientes: {
            es: "Hierbabuena fresca macerada, ron blanco, azúcar de caña y limón natural.",
            en: "Fresh muddled mint, white rum, cane sugar, and fresh lime juice.",
            fr: "Menthe fraîche pilée, rhum blanc, sucre de canne et jus de citron vert.",
            de: "Frische Minze, weißer Rum, Rohrzucker und Limettensaft.",
          },
          precio: 8000,
          imagenUrl: "/menus/dishes/mojito.png",
          etiquetas: ["happy_hour"],
        },
        {
          id: "hh-cuba-libre",
          nombres: {
            es: "Cuba Libre & Daiquiri Limón",
            en: "Cuba Libre & Lime Daiquiri",
            fr: "Cuba Libre & Daiquiri Citron",
            de: "Cuba Libre & Limetten-Daiquiri",
          },
          precio: 8000,
          etiquetas: ["happy_hour"],
        },
        {
          id: "hh-vino-tinto",
          nombres: {
            es: "Copa de Vino Tinto de la Casa",
            en: "Glass of House Red Wine",
            fr: "Verre de Vin Rouge Maison",
            de: "Glas Hausrotwein",
          },
          precio: 6000,
          etiquetas: ["happy_hour"],
        },
      ],
    },
    {
      id: "cocteles_bebidas",
      icono: "🍸",
      titulos: {
        es: "Coctelería de Autor & Cervecería Sierra Nevada",
        en: "Signature Cocktails & Local Craft Beers",
        fr: "Cocktails Signatures & Bières Artisanales",
        de: "Haus-Cocktails & Lokales Craft-Bier",
      },
      subtitulos: {
        es: "Cocteles clásicos y tropicales, destilados premium y cervezas locales de barril",
        en: "Classic and tropical cocktails, premium spirits, and local draft brews",
        fr: "Cocktails classiques et tropicaux, alcools de qualité et bières locales",
        de: "Klassische und tropische Cocktails sowie lokales Fassbier",
      },
      items: [
        {
          id: "expresso-martini",
          nombres: {
            es: "Expresso Martini con Café de Minca",
            en: "Expresso Martini with Minca Coffee",
            fr: "Espresso Martini au Café de Minca",
            de: "Espresso Martini mit Kaffee aus Minca",
          },
          ingredientes: {
            es: "Shot de café orgánico de Minca recién extraído, vodka premium, licor de café y espuma sedosa.",
            en: "Freshly pulled shot of Minca organic espresso, premium vodka, coffee liqueur, and velvety crema.",
            fr: "Expresso biologique fraîchement extrait de Minca, vodka, liqueur de café et mousse soyeuse.",
            de: "Frisch zubereiteter Espresso aus Bio-Kaffee von Minca, Wodka, Kaffeelikör und samtige Crema.",
          },
          precio: 16000,
          insignia: {
            es: "☕ Con Café de la Sierra",
            en: "☕ With Local Sierra Coffee",
            fr: "☕ Au Café de la Sierra",
            de: "☕ Mit Kaffee aus der Sierra",
          },
          etiquetas: ["chef"],
        },
        {
          id: "mojito-frappe",
          nombres: {
            es: "Mojito Frappé Tropical",
            en: "Tropical Frappé Mojito",
            fr: "Mojito Frappé Tropical",
            de: "Tropischer Frappé-Mojito",
          },
          precio: 15000,
        },
        {
          id: "margarita",
          nombres: {
            es: "Margarita Clásica al Limón",
            en: "Classic Lime Margarita",
            fr: "Margarita Classique au Citron",
            de: "Klassische Limetten-Margarita",
          },
          precio: 16000,
        },
        {
          id: "pina-colada",
          nombres: {
            es: "Piña Colada Caribeña",
            en: "Caribbean Piña Colada",
            fr: "Piña Colada Caribéenne",
            de: "Karibische Piña Colada",
          },
          ingredientes: {
            es: "Ron, crema de coco natural y jugo de piña fresca batido con hielo frappé.",
            en: "Rum, natural coconut cream, and fresh pineapple juice blended with crushed ice.",
            fr: "Rhum, crème de coco naturelle et jus d'ananas frais mixés avec de la glace pilée.",
            de: "Rum, Kokoscreme und frischer Ananassaft auf Crushed Ice.",
          },
          precio: 16000,
        },
        {
          id: "cervezas-artesanales-barril",
          nombres: {
            es: "Cerveza Artesanal Nevada (Toucan / Nebbi / Coca / Colibrí)",
            en: "Nevada Craft Beers (Toucan, Nebbi, Coca, Colibri)",
            fr: "Bières de la Sierra (Toucan, Nebbi, Coca, Colibri)",
            de: "Sierra Craft-Biere (Toucan, Nebbi, Coca, Colibri)",
          },
          ingredientes: {
            es: "Cervezas artesanales inspiradas en la Sierra Nevada: Happy Toucan ($8.000), Happy Nebbi ($8.000), Happy Coca ($9.000), Happy Colibrí ($9.000).",
            en: "Mountain craft beers: Happy Toucan ($8.000), Happy Nebbi ($8.000), Happy Coca ($9.000), Happy Colibri ($9.000).",
            fr: "Bières de la montagne : Happy Toucan ($8.000), Happy Nebbi ($8.000), Happy Coca ($9.000), Happy Colibri ($9.000).",
            de: "Lokale Bergbiere: Happy Toucan ($8.000), Happy Nebbi ($8.000), Happy Coca ($9.000), Happy Colibri ($9.000).",
          },
          precio: 8000,
          preciosVariados: [
            { etiqueta: "Happy Toucan / Nebbi", precio: 8000 },
            { etiqueta: "Happy Coca / Colibrí", precio: 9000 },
          ],
        },
        {
          id: "kombucha-artesanal",
          nombres: {
            es: "Kombucha Artesanal Viva",
            en: "Live Artisanal Kombucha",
            fr: "Kombucha Vivant Artisanal",
            de: "Handgemachte Kombucha",
          },
          precio: 7000,
          etiquetas: ["vegetariano"],
        },
        {
          id: "limonada-coco",
          nombres: {
            es: "Limonada de Coco & Hierbabuena",
            en: "Coconut & Mint Lemonade",
            fr: "Limonade Coco & Menthe Fraîche",
            de: "Kokos-Minz-Limonade",
          },
          precio: 8000,
        },
      ],
    },
    {
      id: "postres_cafeteria",
      icono: "🍰",
      titulos: {
        es: "Postres de la Casa & Café de Origen Minca",
        en: "House Desserts & Minca Single-Origin Coffee",
        fr: "Desserts Maison & Café d'Origine de Minca",
        de: "Hausgemachte Desserts & Minca Herkunftskaffee",
      },
      subtitulos: {
        es: "Café sembrado en las montañas de Minca y dulces artesanales",
        en: "Coffee harvested in the Minca mountains and artisanal sweets",
        fr: "Café cultivé sur les pentes de Minca et douceurs maison",
        de: "Kaffee aus den Bergen von Minca und hausgemachte Süßspeisen",
      },
      items: [
        {
          id: "cheesecake-original",
          nombres: {
            es: "Cheesecake Receta Original de la Casa",
            en: "Original House Recipe Cheesecake",
            fr: "Cheesecake Recette Originale Maison",
            de: "Original Haus-Cheesecake",
          },
          ingredientes: {
            es: "Tarta cremosa de queso horneada con base crocante y coulis de frutos rojos.",
            en: "Creamy baked cheesecake with a crunchy buttery crust and red berry coulis.",
            fr: "Gâteau au fromage crémeux cuit sur base croustillante et coulis de fruits rouges.",
            de: "Cremiger gebackener Käsekuchen auf knusprigem Boden mit Beeren-Coulis.",
          },
          precio: 6000,
          imagenUrl: "/menus/dishes/cheesecake.png",
          insignia: {
            es: "⭐ Receta Original",
            en: "⭐ Original Recipe",
            fr: "⭐ Recette Originale",
            de: "⭐ Originalrezept",
          },
        },
        {
          id: "mudslide",
          nombres: {
            es: "Mudslide con Baileys & Helado",
            en: "Mudslide Baileys & Coffee Cocktail",
            fr: "Mudslide au Baileys & Café",
            de: "Mudslide mit Baileys & Eis",
          },
          ingredientes: {
            es: "Baileys Irish Cream, licor de café, vodka, helado de vainilla y salsa de chocolate fundido.",
            en: "Baileys Irish Cream, coffee liqueur, vodka, vanilla ice cream, and melted chocolate drizzle.",
            fr: "Baileys Irish Cream, liqueur de café, vodka, glace vanille et coulis de chocolat fondu.",
            de: "Baileys Irish Cream, Kaffeelikör, Wodka, Vanilleeis und geschmolzene Schokoladensauce.",
          },
          precio: 18000,
          imagenUrl: "/menus/dishes/mudslide.png",
        },
        {
          id: "malteada-oreo",
          nombres: {
            es: "Malteada Suprema de Oreo",
            en: "Supreme Oreo Milkshake",
            fr: "Milk-shake Suprême aux Oreo",
            de: "Supreme Oreo-Milchshake",
          },
          precio: 14000,
        },
        {
          id: "cafe-irlandes",
          nombres: {
            es: "Café Irlandés con Whisky & Crema",
            en: "Irish Coffee with Whiskey & Cream",
            fr: "Café Irlandais au Whisky & Crème",
            de: "Irish Coffee mit Whiskey & Sahne",
          },
          precio: 12000,
        },
        {
          id: "chocolate-con-queso",
          nombres: {
            es: "Chocolate Caliente Santafereño con Queso",
            en: "Hot Chocolate with Melting Cheese",
            fr: "Chocolat Chaud Traditionnel au Fromage",
            de: "Traditionelle Heiße Schokolade mit Käse",
          },
          precio: 7000,
        },
        {
          id: "cafe-americano",
          nombres: {
            es: "Café Americano de Origen Minca",
            en: "Minca Single-Origin Americano",
            fr: "Café Americano d'Origine Minca",
            de: "Minca Herkunftskaffee Americano",
          },
          precio: 3000,
        },
      ],
    },
  ],
};
