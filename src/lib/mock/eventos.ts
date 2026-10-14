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

export function getMockEventos(): EventoConNegocio[] {
  const { hoy, manana, sabado } = getFechasMock();

  return [
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
  ];
}

