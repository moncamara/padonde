-- ==============================================================================
-- 🌿 PaDónde - Esquema de Base de Datos PostgreSQL (Supabase)
-- ==============================================================================
-- Diseñado para ser modular, escalable (Minca -> Tairona -> Santa Marta)
-- e hiper-eficiente para consultas con baja latencia en entornos móviles.
-- ==============================================================================

-- 1. Habilitar extensión UUID para identificadores universales únicos
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ------------------------------------------------------------------------------
-- 2. TABLA: Zonas Geográficas
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.zonas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre VARCHAR(100) NOT NULL,
    slug VARCHAR(50) UNIQUE NOT NULL, -- ej: 'minca', 'tairona', 'santa-marta'
    descripcion TEXT,
    imagen_url TEXT,
    activa BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ------------------------------------------------------------------------------
-- 3. TABLA: Negocios / Organizadores Locales
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.negocios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- Vinculado a Supabase Auth si tienen cuenta
    zona_id UUID REFERENCES public.zonas(id) ON DELETE RESTRICT NOT NULL,
    nombre VARCHAR(150) NOT NULL,
    descripcion TEXT,
    categoria VARCHAR(50) NOT NULL, -- ej: 'comida', 'bienestar', 'tours', 'musica'
    whatsapp VARCHAR(20) NOT NULL,  -- con código de país, ej: '573001234567'
    instagram VARCHAR(100),
    foto_url TEXT,
    plan VARCHAR(20) DEFAULT 'gratis' NOT NULL CHECK (plan IN ('gratis', 'pro', 'premium')),
    plan_expira_en TIMESTAMP WITH TIME ZONE,
    activo BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ------------------------------------------------------------------------------
-- 4. TABLA: Eventos / Publicaciones / Planes
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.eventos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    negocio_id UUID REFERENCES public.negocios(id) ON DELETE CASCADE NOT NULL,
    zona_id UUID REFERENCES public.zonas(id) ON DELETE RESTRICT NOT NULL,
    titulo VARCHAR(200) NOT NULL,
    descripcion TEXT,
    tipo VARCHAR(50) NOT NULL, -- 'musica', 'comida', 'bienestar', 'tours', 'arte', etc.
    precio NUMERIC(12, 2) DEFAULT NULL, -- NULL = 'Consultar', 0 = 'Gratis'
    precio_moneda VARCHAR(3) DEFAULT 'COP' NOT NULL CHECK (precio_moneda IN ('COP', 'USD')),
    fecha_inicio TIMESTAMP WITH TIME ZONE NOT NULL,
    fecha_fin TIMESTAMP WITH TIME ZONE,
    imagen_url TEXT,
    destacado BOOLEAN DEFAULT false NOT NULL, -- Planes de pago
    tiene_boleteria BOOLEAN DEFAULT false NOT NULL, -- Comisión por boletería
    activo BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ------------------------------------------------------------------------------
-- 5. TABLA: Boletos / Reservas (Monetización directa)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.boletos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    evento_id UUID REFERENCES public.eventos(id) ON DELETE RESTRICT NOT NULL,
    comprador_nombre VARCHAR(150) NOT NULL,
    comprador_email VARCHAR(150) NOT NULL,
    comprador_telefono VARCHAR(25),
    cantidad INT DEFAULT 1 NOT NULL CHECK (cantidad > 0),
    precio_unitario NUMERIC(12, 2) NOT NULL,
    total_pagado NUMERIC(12, 2) NOT NULL,
    comision_plataforma NUMERIC(12, 2) NOT NULL, -- ej: 10%
    estado VARCHAR(20) DEFAULT 'pendiente' NOT NULL CHECK (estado IN ('pendiente', 'aprobado', 'cancelado')),
    referencia_pago VARCHAR(100), -- Referencia Wompi / MercadoPago
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ------------------------------------------------------------------------------
-- 6. ÍNDICES DE RENDIMIENTO (Clave para búsquedas rápidas con señal baja)
-- ------------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_eventos_zona_fecha ON public.eventos(zona_id, fecha_inicio);
CREATE INDEX IF NOT EXISTS idx_eventos_tipo ON public.eventos(tipo);
CREATE INDEX IF NOT EXISTS idx_eventos_activo ON public.eventos(activo);
CREATE INDEX IF NOT EXISTS idx_negocios_zona ON public.negocios(zona_id);
CREATE INDEX IF NOT EXISTS idx_zonas_slug ON public.zonas(slug);

-- ------------------------------------------------------------------------------
-- 7. SEGURIDAD: Row Level Security (RLS)
-- ------------------------------------------------------------------------------
-- Habilitar RLS en todas las tablas públicas
ALTER TABLE public.zonas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.negocios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.eventos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.boletos ENABLE ROW LEVEL SECURITY;

-- POLÍTICAS:
-- 1. Zonas: Lectura pública para cualquier turista
CREATE POLICY "Zonas visibles para todos" 
    ON public.zonas FOR SELECT 
    USING (activa = true);

-- 2. Negocios: Lectura pública de negocios activos
CREATE POLICY "Negocios activos visibles para todos" 
    ON public.negocios FOR SELECT 
    USING (activo = true);

-- El negocio puede editar su propio perfil
CREATE POLICY "Dueño de negocio puede modificar su perfil" 
    ON public.negocios FOR ALL 
    TO authenticated 
    USING (auth.uid() = user_id);

-- 3. Eventos: Lectura pública de eventos activos
CREATE POLICY "Eventos activos visibles para todos" 
    ON public.eventos FOR SELECT 
    USING (activo = true);

-- El negocio puede crear/editar/eliminar sus propios eventos
CREATE POLICY "Negocio puede administrar sus eventos" 
    ON public.eventos FOR ALL 
    TO authenticated 
    USING (
        EXISTS (
            SELECT 1 FROM public.negocios 
            WHERE negocios.id = eventos.negocio_id 
            AND negocios.user_id = auth.uid()
        )
    );

-- 4. Boletos: Solo el comprador o el admin/negocio pueden ver boletos
CREATE POLICY "Negocio puede ver boletos de sus eventos" 
    ON public.boletos FOR SELECT 
    TO authenticated 
    USING (
        EXISTS (
            SELECT 1 FROM public.eventos 
            JOIN public.negocios ON eventos.negocio_id = negocios.id
            WHERE eventos.id = boletos.evento_id 
            AND negocios.user_id = auth.uid()
        )
    );

-- ------------------------------------------------------------------------------
-- 8. DATOS SEMILLA (Seed Data inicial para Minca)
-- ------------------------------------------------------------------------------
DO $$
DECLARE
    v_zona_minca UUID;
    v_neg_cafe UUID;
    v_neg_yoga UUID;
    v_neg_guias UUID;
    v_neg_cumbre UUID;
BEGIN
    -- Insertar Zona Minca
    INSERT INTO public.zonas (nombre, slug, descripcion, activa)
    VALUES ('Minca', 'minca', 'Pueblo de montaña en la Sierra Nevada de Santa Marta', true)
    ON CONFLICT (slug) DO UPDATE SET activa = true
    RETURNING id INTO v_zona_minca;

    -- Insertar Negocios
    INSERT INTO public.negocios (zona_id, nombre, descripcion, categoria, whatsapp, instagram, plan, activo)
    VALUES (v_zona_minca, 'Café Sierra', 'Café especial de altura y tour de plantaciones', 'comida', '573001234567', '@cafesierra', 'pro', true)
    RETURNING id INTO v_neg_cafe;

    INSERT INTO public.negocios (zona_id, nombre, descripcion, categoria, whatsapp, instagram, plan, activo)
    VALUES (v_zona_minca, 'Minca Yoga Retreat', 'Centro holístico con vista panorámica a la montaña', 'bienestar', '573009876543', '@mincayoga', 'gratis', true)
    RETURNING id INTO v_neg_yoga;

    INSERT INTO public.negocios (zona_id, nombre, descripcion, categoria, whatsapp, instagram, plan, activo)
    VALUES (v_zona_minca, 'Guías de la Sierra', 'Senderismo seguro a cascadas y avistamiento de aves', 'tours', '573005554433', NULL, 'gratis', true)
    RETURNING id INTO v_neg_guias;

    INSERT INTO public.negocios (zona_id, nombre, descripcion, categoria, whatsapp, instagram, plan, activo)
    VALUES (v_zona_minca, 'Hostal La Cumbre', 'Ambiente nocturno, pizza y música en vivo los fines de semana', 'musica', '573002221100', '@lacumbre.minca', 'pro', true)
    RETURNING id INTO v_neg_cumbre;

    -- Insertar Eventos Iniciales (con fechas dinámicas en relación a hoy)
    INSERT INTO public.eventos (negocio_id, zona_id, titulo, descripcion, tipo, precio, precio_moneda, fecha_inicio, fecha_fin, imagen_url, destacado, activo)
    VALUES 
    (v_neg_cafe, v_zona_minca, 'Cata de café de origen — Sierra Nevada', 'Recorre el proceso del café desde la mata hasta la taza con baristas locales.', 'comida', 35000, 'COP', now() + interval '2 hours', now() + interval '4 hours', 'https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=800&q=80', true, true),
    (v_neg_yoga, v_zona_minca, 'Yoga al amanecer en la montaña', 'Sesión de vinyasa flow con meditación sonora matutina.', 'bienestar', 25000, 'COP', now() + interval '1 day', now() + interval '1 day 2 hours', 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&q=80', false, true),
    (v_neg_guias, v_zona_minca, 'Tour cascadas El Pozo Azul y Marinka', 'Caminata guiada de medio día por senderos ecológicos.', 'tours', 45000, 'COP', now() + interval '1 day 4 hours', now() + interval '1 day 8 hours', 'https://images.unsplash.com/photo-1551632811-561732d1e306?w=800&q=80', false, true),
    (v_neg_cumbre, v_zona_minca, 'Noche de música en vivo — Cumbia y Jazz', 'Bandas en vivo, cócteles de la casa y vista a las luces de Santa Marta.', 'musica', 20000, 'COP', now() + interval '3 days', now() + interval '3 days 4 hours', 'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=800&q=80', true, true);
END $$;
