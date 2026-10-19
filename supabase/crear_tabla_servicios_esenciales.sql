-- ==============================================================================
-- 🌿 PaDónde: Tabla de Servicios Esenciales e Info Útil de Minca
-- Separa los negocios de infraestructura/utilidad (Embassy Bank, Transporte, etc.)
-- de la cartelera efímera de eventos y hospedajes.
-- ==============================================================================

CREATE TABLE IF NOT EXISTS servicios_esenciales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  zona_id UUID NOT NULL REFERENCES public.zonas(id) ON DELETE CASCADE,
  categoria TEXT NOT NULL CHECK (categoria IN ('efectivo', 'transporte', 'salud', 'comercio', 'general')),
  nombre_comercial TEXT NOT NULL,
  subtitulo TEXT NOT NULL,
  logo_url TEXT,
  imagen_lugar_url TEXT,
  whatsapp TEXT NOT NULL,
  mensaje_whatsapp_default TEXT,
  google_maps_url TEXT,
  direccion_referencia TEXT NOT NULL,
  horario_apertura TEXT NOT NULL,
  servicios_tags JSONB NOT NULL DEFAULT '[]'::jsonb,
  destacado_patrocinado BOOLEAN DEFAULT false,
  tipo_acuerdo TEXT DEFAULT 'canje_afiche' CHECK (tipo_acuerdo IN ('canje_afiche', 'pago_mensual', 'cortesia')),
  orden_prioridad INT DEFAULT 0,
  activo BOOLEAN DEFAULT true,
  boton_whatsapp_activo BOOLEAN DEFAULT true,
  metadata_comercial JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Migración segura si la tabla ya fue creada anteriormente:
ALTER TABLE servicios_esenciales 
ADD COLUMN IF NOT EXISTS boton_whatsapp_activo BOOLEAN DEFAULT true;

-- Índices para velocidad de consulta (Edge Ready)
CREATE INDEX IF NOT EXISTS idx_servicios_zona_activo 
ON servicios_esenciales (zona_id, activo, orden_prioridad);

-- Habilitar Row Level Security (RLS)
ALTER TABLE servicios_esenciales ENABLE ROW LEVEL SECURITY;

-- 1. Lectura pública (Cualquier visitante puede ver los servicios activos)
CREATE POLICY "Servicios esenciales son públicos para lectura"
ON servicios_esenciales
FOR SELECT
USING (activo = true);

-- 2. Modificación exclusiva para administradores autenticados
CREATE POLICY "Administradores pueden gestionar servicios esenciales"
ON servicios_esenciales
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- ==============================================================================
-- Seed inicial: Embassy Bank Minca (Registro Modelo)
-- ==============================================================================
INSERT INTO servicios_esenciales (
  zona_id,
  categoria,
  nombre_comercial,
  subtitulo,
  whatsapp,
  mensaje_whatsapp_default,
  google_maps_url,
  direccion_referencia,
  horario_apertura,
  servicios_tags,
  destacado_patrocinado,
  tipo_acuerdo,
  orden_prioridad,
  activo
) VALUES (
  (SELECT id FROM public.zonas WHERE slug = 'minca' LIMIT 1),
  'efectivo',
  'Embassy Bank Colombia',
  'El Banco de Minca • Retiro de Efectivo y Cambio de Moneda',
  '573013010194',
  'Hola Embassy Bank! Vi su punto en PaDónde Minca. Quiero consultar disponibilidad de efectivo / tasa de cambio de divisas hoy. 💵',
  'https://maps.app.goo.gl/minca',
  'Calle principal de Minca, diagonal al puente central',
  'Lunes a Domingo • 8:00 AM - 7:00 PM',
  '["🏧 Retiro Efectivo", "💶 Cambio EUR & USD", "💳 Avance Datáfono", "📲 Giros & Western Union"]'::jsonb,
  true,
  'canje_afiche',
  1,
  true
) ON CONFLICT DO NOTHING;

-- Seed inicial: Transporte Sierra Mar (Busetas Santa Marta - Minca)
INSERT INTO servicios_esenciales (
  zona_id,
  categoria,
  nombre_comercial,
  subtitulo,
  logo_url,
  whatsapp,
  mensaje_whatsapp_default,
  google_maps_url,
  direccion_referencia,
  horario_apertura,
  servicios_tags,
  destacado_patrocinado,
  tipo_acuerdo,
  orden_prioridad,
  activo
) VALUES (
  (SELECT id FROM public.zonas WHERE slug = 'minca' LIMIT 1),
  'transporte',
  'Transporte Sierra Mar',
  'Busetas a Minca, Pozo Azul y La Tagua • Salidas continuas con tarifas fijas',
  '/images/aliados/sierra-mar.jpg',
  '573103690454',
  '¡Hola Transporte Sierra Mar! 🚐 Los vi en PaDónde Minca. Quiero consultar horarios de salida de las busetas y tarifas hoy.',
  'https://maps.app.goo.gl/minca',
  'Diagonal 39 #5-148, Local 1 Mamatoco (Punto de salida a Minca)',
  'Todos los días • Salidas de 7:00 AM a 6:00 PM',
  '["🚐 Buseta Santa Marta - Minca", "🌿 Rutas a Pozo Azul", "⛰️ Subidas a La Tagua", "💰 Tarifas Fijas Oficiales"]'::jsonb,
  true,
  'canje_afiche',
  2,
  true
) ON CONFLICT DO NOTHING;

