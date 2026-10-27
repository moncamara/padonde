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

-- 4. Sembrar configuración inicial de botones y mensajes CTA por categoría
INSERT INTO public.configuraciones (clave, valor)
VALUES ('config_cta_categorias', '{
  "artesanias": {
    "icon": "🛍️",
    "boton": {
      "es": "Consultar catálogo",
      "en": "View Catalog",
      "fr": "Consulter le catalogue",
      "de": "Katalog ansehen"
    },
    "mensaje": {
      "es": "¡Hola! Vi tus artesanías \"{titulo}\" en PaDónde 🌿 Me gustaría consultar el catálogo y precios disponibles.",
      "en": "Hello! I saw your crafts \"{titulo}\" on PaDónde 🌿 I would like to see the catalog and available prices.",
      "fr": "Bonjour ! J'ai vu vos créations \"{titulo}\" sur PaDónde 🌿 J'aimerais consulter le catalogue et les prix disponibles.",
      "de": "Hallo! Ich habe Ihr Handwerk \"{titulo}\" auf PaDónde gesehen 🌿 Ich möchte den Katalog und die Preise ansehen."
    }
  },
  "comida": {
    "icon": "🍽️",
    "boton": {
      "es": "Consultar Menú - Reservar",
      "en": "View Menu - Reserve",
      "fr": "Consulter le menu - Réserver",
      "de": "Menü ansehen - Reservieren"
    },
    "mensaje": {
      "es": "¡Hola! Vi \"{titulo}\" en PaDónde 🌿 Me gustaría consultar la carta y reservar una mesa.",
      "en": "Hello! I saw \"{titulo}\" on PaDónde 🌿 I would like to check the menu and reserve a table.",
      "fr": "Bonjour ! J'ai vu \"{titulo}\" sur PaDónde 🌿 J'aimerais consulter le menu et réserver une table.",
      "de": "Hallo! Ich habe \"{titulo}\" auf PaDónde gesehen 🌿 Ich möchte das Menü einsehen und einen Tisch reservieren."
    }
  },
  "tours": {
    "icon": "🌿",
    "boton": {
      "es": "Consultar Cupos",
      "en": "Check Availability",
      "fr": "Vérifier les places",
      "de": "Freie Plätze prüfen"
    },
    "mensaje": {
      "es": "¡Hola! Vi el plan \"{titulo}\" en PaDónde 🌿 Me gustaría consultar la disponibilidad de cupos y horarios.",
      "en": "Hello! I saw the activity \"{titulo}\" on PaDónde 🌿 I would like to check available spots and schedules.",
      "fr": "Bonjour ! J'ai vu l'activité \"{titulo}\" sur PaDónde 🌿 J'aimerais vérifier les places disponibles et les horaires.",
      "de": "Hallo! Ich habe das Angebot \"{titulo}\" auf PaDónde gesehen 🌿 Ich möchte freie Plätze und Uhrzeiten anfragen."
    }
  },
  "transporte": {
    "icon": "🚐",
    "boton": {
      "es": "Solicitar Servicio",
      "en": "Request Service",
      "fr": "Demander le service",
      "de": "Fahrt anfragen"
    },
    "mensaje": {
      "es": "¡Hola! Vi su servicio de transporte \"{titulo}\" en PaDónde 🌿 Me gustaría consultar disponibilidad y cotizar una ruta.",
      "en": "Hello! I saw your transport service \"{titulo}\" on PaDónde 🌿 I would like to check availability and get a route quote.",
      "fr": "Bonjour ! J'ai vu votre service de transport \"{titulo}\" sur PaDónde 🌿 J'aimerais vérifier la disponibilidad et obtenir un devis.",
      "de": "Hallo! Ich habe Ihren Fahrservice \"{titulo}\" auf PaDónde gesehen 🌿 Ich möchte die Verfügbarkeit prüfen und eine Route anfragen."
    }
  },
  "hospedaje": {
    "icon": "💬",
    "boton": {
      "es": "Reservar por WhatsApp",
      "en": "Book via WhatsApp",
      "fr": "Réserver via WhatsApp",
      "de": "Über WhatsApp buchen"
    },
    "mensaje": {
      "es": "¡Hola! Vi \"{titulo}\" en PaDónde. [Reserva PaDónde 🌿] Me interesa saber disponibilidad y reservar.",
      "en": "Hello! I saw \"{titulo}\" on PaDónde. [PaDónde Booking 🌿] I am interested in availability and booking.",
      "fr": "Bonjour ! J'ai vu \"{titulo}\" sur PaDónde. [Réservation PaDónde 🌿] Je voudrais connaître la disponibilité et réserver.",
      "de": "Hallo! Ich habe \"{titulo}\" auf PaDónde gesehen. [PaDónde Buchung 🌿] Ich interessiere mich für Verfügbarkeit und Reservierung."
    }
  },
  "default": {
    "icon": "💬",
    "boton": {
      "es": "Reservar por WhatsApp",
      "en": "Book via WhatsApp",
      "fr": "Réserver via WhatsApp",
      "de": "Über WhatsApp buchen"
    },
    "mensaje": {
      "es": "¡Hola! Vi tu publicación \"{titulo}\" en PaDónde. [Reserva PaDónde 🌿] Me interesa saber disponibilidad y cómo llegar.",
      "en": "Hello! I saw your post \"{titulo}\" on PaDónde. [PaDónde Booking 🌿] I am interested in availability and how to get there.",
      "fr": "Bonjour ! J'ai vu votre publication \"{titulo}\" sur PaDónde. [Réservation PaDónde 🌿] Je voudrais connaître la disponibilité et comment arriver.",
      "de": "Hallo! Ich habe Ihren Beitrag \"{titulo}\" auf PaDónde gesehen. [PaDónde Buchung 🌿] Ich interessiere mich für Verfügbarkeit und Wegbeschreibung."
    }
  }
}'::jsonb)
ON CONFLICT (clave) DO NOTHING;

