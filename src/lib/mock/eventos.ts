import type { EventoConNegocio } from "@/lib/types";
import { getFechaYMDColombia } from "@/lib/utils";

/**
 * Datos mock para desarrollo local antes de conectar Supabase.
 * Las fechas se calculan al momento de la llamada (no en módulo-nivel)
 * para evitar que Next.js PPR congele una fecha estática en el prerender.
 *
 * REEMPLAZAR con queries reales a Supabase al conectar la BD.
 */

function getFechasMock() {
  const hoy = new Date();
  const manana = new Date(hoy);
  manana.setDate(hoy.getDate() + 1);
  const sabado = new Date(hoy);
  while (sabado.getDay() !== 6) sabado.setDate(sabado.getDate() + 1);
  return { hoy, manana, sabado };
}

function toISO(fecha: Date, hora: number, minuto = 0): string {
  const ymd = getFechaYMDColombia(fecha);
  const h = hora.toString().padStart(2, "0");
  const m = minuto.toString().padStart(2, "0");
  return new Date(`${ymd}T${h}:${m}:00-05:00`).toISOString();
}

export function getMockEventos(zonaSlug?: string): EventoConNegocio[] {
  const { hoy, manana, sabado } = getFechasMock();

  const todos: EventoConNegocio[] = [
    {
      id: "evt-001",
      negocio_id: "neg-001",
      zona_id: "zona-minca",
      titulo: "Cata de café de origen — Sierra Nevada",
      descripcion: "Recorre el proceso del café desde la mata hasta la taza con el mejor café de la Sierra Nevada.",
      tipo: "comida",
      precio: 35000,
      precio_moneda: "COP",
      fecha_inicio: toISO(hoy, 9, 0),
      fecha_fin: toISO(hoy, 11, 0),
      imagen_url: "https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=800&q=80",
      destacado: true,
      tiene_boleteria: false,
      activo: true,
      created_at: new Date().toISOString(),
      metadata_hospedaje: {
        google_reputacion: {
          rating: 4.9,
          total_reviews: 184,
          maps_url: "https://maps.app.goo.gl/minca",
        },
        google_review_url: "https://search.google.com/local/writereview?placeid=ChIJplaceholder",
        menu_url: "https://www.padonde.lat",
        menu_fotos: [
          "https://images.unsplash.com/photo-1544025162-d76694265947?w=1200&q=80",
          "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1200&q=80",
        ],
      },
      negocio: {
        nombre: "Café Sierra",
        whatsapp: "573001234567",
        instagram: "@cafesierra",
      },
    },
    {
      id: "evt-002",
      negocio_id: "neg-002",
      zona_id: "zona-minca",
      titulo: "Yoga al amanecer en la montaña",
      descripcion: "Sesión de yoga vinyasa con vista a la Sierra Nevada. Todos los niveles bienvenidos.",
      tipo: "bienestar",
      precio: 25000,
      precio_moneda: "COP",
      fecha_inicio: toISO(hoy, 6, 30),
      fecha_fin: toISO(hoy, 8, 0),
      imagen_url: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&q=80",
      destacado: false,
      tiene_boleteria: false,
      activo: true,
      created_at: new Date().toISOString(),
      negocio: {
        nombre: "Minca Yoga Retreat",
        whatsapp: "573009876543",
        instagram: "@mincayoga",
      },
    },
    {
      id: "evt-003",
      negocio_id: "neg-003",
      zona_id: "zona-minca",
      titulo: "Tour cascadas El Pozo Azul",
      descripcion: "Caminata guiada de 3h hasta las cascadas más hermosas de Minca. Incluye guía local.",
      tipo: "tours",
      precio: 45000,
      precio_moneda: "COP",
      fecha_inicio: toISO(manana, 8, 0),
      fecha_fin: toISO(manana, 12, 0),
      imagen_url: "https://images.unsplash.com/photo-1551632811-561732d1e306?w=800&q=80",
      destacado: false,
      tiene_boleteria: false,
      activo: true,
      created_at: new Date().toISOString(),
      negocio: {
        nombre: "Guías de la Sierra",
        whatsapp: "573005554433",
        instagram: null,
      },
    },
    {
      id: "evt-004",
      negocio_id: "neg-004",
      zona_id: "zona-minca",
      titulo: "Noche de música en vivo — Cumbia y Jazz",
      descripcion: "Dos bandas en vivo, cocteles artesanales y la mejor vibra de la montaña.",
      tipo: "musica",
      precio: 20000,
      precio_moneda: "COP",
      fecha_inicio: toISO(sabado, 20, 0),
      fecha_fin: null,
      imagen_url: "https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=800&q=80",
      destacado: true,
      tiene_boleteria: false,
      activo: true,
      created_at: new Date().toISOString(),
      negocio: {
        nombre: "Hostal La Cumbre",
        whatsapp: "573002221100",
        instagram: "@lacumbre.minca",
      },
    },
    {
      id: "evt-005",
      negocio_id: "neg-004",
      zona_id: "zona-minca",
      titulo: "Eco-Habitaciones & Cabañas en la Sierra",
      descripcion: "Descansa entre las nubes en Minca. Despierta con el canto de los tucanes, vista panorámica al valle y restaurante orgánico propio.",
      tipo: "hospedaje",
      precio: 65000,
      precio_moneda: "COP",
      fecha_inicio: toISO(hoy, 15, 0),
      fecha_fin: null,
      imagen_url: "https://images.unsplash.com/photo-1587061949409-02df41d5e562?w=800&q=80",
      destacado: true,
      tiene_boleteria: false,
      activo: true,
      created_at: new Date().toISOString(),
      metadata_hospedaje: {
        check_in_hora: "15:00",
        check_out_hora: "11:00",
        google_reputacion: {
          rating: 4.8,
          total_reviews: 284,
          maps_url: "https://maps.google.com/?q=Minca+Sierra+Nevada",
        },
        habitaciones: [
          {
            id: "hab-dorm",
            titulo: "Cama en Dormitorio Vista Selva",
            descripcion: "Dormitorio amplio de 4 camas con lockers individuales, cortina de privacidad y enchufe.",
            precio_noche_cop: 65000,
            capacidad_max: 1,
            fotos: [
              "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=800&q=80",
              "https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800&q=80",
            ],
            badges: [
              { icono: "👥", texto: "1 persona" },
              { icono: "🚿", texto: "Baño compartido" },
              { icono: "🔒", texto: "Locker individual" },
              { icono: "🍳", texto: "Desayuno incluido" },
            ],
          },
          {
            id: "hab-priv-doble",
            titulo: "Habitación Privada con Balcón",
            descripcion: "Cama queen, balcón privado con hamaca y vista al atardecer sobre Santa Marta.",
            precio_noche_cop: 180000,
            capacidad_max: 2,
            fotos: [
              "https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800&q=80",
              "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&q=80",
            ],
            badges: [
              { icono: "👥", texto: "Hasta 2 personas" },
              { icono: "🚿", texto: "Baño privado" },
              { icono: "🌿", texto: "Balcón con hamaca" },
              { icono: "🍳", texto: "Desayuno incluido" },
            ],
          },
          {
            id: "hab-cabana-familiar",
            titulo: "Cabaña Panorámica del Bosque",
            descripcion: "Cabaña de dos niveles para grupos o parejas que buscan máxima privacidad y contacto con la naturaleza.",
            precio_noche_cop: 320000,
            capacidad_max: 4,
            fotos: [
              "https://images.unsplash.com/photo-1587061949409-02df41d5e562?w=800&q=80",
              "https://images.unsplash.com/photo-1540518614846-7ede433c4ef7?w=800&q=80",
            ],
            badges: [
              { icono: "👥", texto: "Hasta 4 personas" },
              { icono: "🚿", texto: "Baño privado con tina" },
              { icono: "🌄", texto: "Vista 360°" },
              { icono: "🍳", texto: "Desayuno gourmet" },
            ],
          },
        ],
      },
      negocio: {
        nombre: "Hostal La Cumbre",
        whatsapp: "573002221100",
        instagram: "@lacumbre.minca",
      },
    },
    {
      id: "evt-casa-maya-mendihuaca",
      negocio_id: "neg-casa-maya",
      zona_id: "zona-mendihuaca",
      titulo: "Casa Maya Mendihuaca — Hospedaje & Refugio Frente al Mar",
      descripcion: `Casa Maya Mendihuaca está ubicada en Playa Mendiguaca, a pocos pasos de la desembocadura del río y de las mejores olas del Caribe colombiano.

Disfruta de habitaciones privadas frente a la playa con balcón y hamacas, jardín tropical, acceso a playa privada, wifi gratis, cocina compartida y salón de uso común.

🌊 Destacados de Casa Maya:
• Salida directa a la playa y sonido de las olas 24/7.
• Balcones privados con hamaca y vista al mar y al jardín.
• Ambiente tranquilo, seguro, natural y pet friendly.
• A pocos pasos de clases de surf y paseos por el río.
• Ubicación con puntuación 9,6/10 por parejas y viajeros internacionales.

📲 Cotiza tu habitación en el calculador interactivo abajo o contáctanos por WhatsApp para reservar directo sin comisiones de intermediarios.`,
      tipo: "hospedaje",
      precio: 240000,
      precio_moneda: "COP",
      fecha_inicio: toISO(hoy, 15, 0),
      fecha_fin: null,
      imagen_url: "/images/hospedajes/casa-maya/foto_hotel_5.jpg",
      destacado: true,
      tiene_boleteria: false,
      activo: true,
      created_at: new Date().toISOString(),
      metadata_hospedaje: {
        check_in_hora: "15:00",
        check_out_hora: "11:00",
        google_reputacion: {
          rating: 4.9,
          total_reviews: 128,
          maps_url: "https://maps.app.goo.gl/mendihuaca",
        },
        habitaciones: [
          {
            id: "hab-deluxe-mar",
            titulo: "Habitación Doble Deluxe con Balcón y Vista al Mar",
            descripcion: "Cama doble, balcón privado con hamaca frente al mar, baño privado con artículos de aseo y vista panorámica al Caribe.",
            precio_noche_cop: 280000,
            capacidad_max: 2,
            fotos: [
              "/images/hospedajes/casa-maya/foto_hotel_5.jpg",
              "/images/hospedajes/casa-maya/foto_hotel_7.jpg",
              "/images/hospedajes/casa-maya/foto_hotel_2.jpg",
            ],
            badges: [
              { icono: "🌊", texto: "Vista al mar" },
              { icono: "🌄", texto: "Balcón con hamaca" },
              { icono: "🚿", texto: "Baño privado" },
              { icono: "📶", texto: "Wi-Fi gratis" },
            ],
          },
          {
            id: "hab-doble-jardin",
            titulo: "Habitación Doble con Vista al Jardín Tropical",
            descripcion: "Cama doble y sofá cama, ambiente fresco rodeado de palmeras y naturaleza, baño privado y salida directa a la playa.",
            precio_noche_cop: 240000,
            capacidad_max: 3,
            fotos: [
              "/images/hospedajes/casa-maya/foto_hotel_3.jpg",
              "/images/hospedajes/casa-maya/foto_hotel_4.jpg",
              "/images/hospedajes/casa-maya/foto_hotel_6.jpg",
            ],
            badges: [
              { icono: "🌿", texto: "Vista al jardín" },
              { icono: "🚿", texto: "Baño privado" },
              { icono: "📶", texto: "Wi-Fi gratis" },
              { icono: "🌀", texto: "Ventilador" },
            ],
          },
          {
            id: "hab-familiar-mar",
            titulo: "Habitación Familiar Frente a la Playa",
            descripcion: "Ideal para familias o grupos de amigos. Amplia, luminosa, a pasos de la arena y con acceso a cocina compartida y terraza.",
            precio_noche_cop: 350000,
            capacidad_max: 4,
            fotos: [
              "/images/hospedajes/casa-maya/foto_hotel_8.jpg",
              "/images/hospedajes/casa-maya/foto_hotel_9.jpg",
              "/images/hospedajes/casa-maya/foto_hotel_11.jpg",
            ],
            badges: [
              { icono: "🏖️", texto: "Frente a la playa" },
              { icono: "👨‍👩‍👧‍👦", texto: "Familiar" },
              { icono: "🚿", texto: "Baño privado" },
              { icono: "🍳", texto: "Cocina compartida" },
            ],
          },
        ],
      },
      negocio: {
        nombre: "Casa Maya Mendihuaca",
        whatsapp: "573124082342",
        instagram: "@casamaya_mendihuaca",
      },
    },
    {
      id: "evt-pepe-mojito-mendihuaca",
      negocio_id: "neg-pepe-mojito",
      zona_id: "zona-mendihuaca",
      titulo: "🍹 Sunsets, Mojitos & Sabores del Mar — Pepe Mojito Bar",
      descripcion: `Frente al mar en Playa Mendihuaca. Ven a disfrutar de la mejor coctelería caribeña, mojitos de autor, mariscos frescos, hamburguesas de angus y pizzas al horno con la mejor vista al atardecer caribeño.
      
Buena vibra, buena comida y buenos momentos a orillas del mar. Consulta nuestra carta digital completa o escanea en mesa para ordenar directo.`,
      tipo: "comida",
      precio: 35000,
      precio_moneda: "COP",
      fecha_inicio: toISO(hoy, 12, 0),
      fecha_fin: toISO(hoy, 23, 0),
      imagen_url: "/menus/menupepe1.jpeg",
      destacado: true,
      tiene_boleteria: false,
      activo: true,
      created_at: new Date().toISOString(),
      metadata_hospedaje: {
        google_reputacion: {
          rating: 4.8,
          total_reviews: 145,
          maps_url: "https://maps.google.com/?cid=12401671911910625244",
        },
        google_review_url: "https://search.google.com/local/writereview?placeid=ChIJiQTfKLuV9I4R3E86eG2jG6w",
        menu_url: "/menus/menupepe1.jpeg",
        menu_fotos: [
          "/menus/menupepe1.jpeg",
          "/menus/menupepe2.jpeg",
        ],
      },
      negocio: {
        nombre: "Pepe Mojito Bar",
        whatsapp: "573145678901",
        instagram: "@pepemojitobar",
      },
    },
  ];

  if (!zonaSlug) return todos;
  if (zonaSlug === "mendihuaca") {
    return todos.filter((e) => e.zona_id === "zona-mendihuaca");
  }
  if (zonaSlug === "minca") {
    return todos.filter((e) => e.zona_id === "zona-minca");
  }
  return todos.filter((e) => e.zona_id === `zona-${zonaSlug}`);
}

