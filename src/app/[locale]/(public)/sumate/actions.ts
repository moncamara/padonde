"use server";

import { headers } from "next/headers";
import { createHash } from "node:crypto";
import sharp from "sharp";
import { getPublicSupabaseClient } from "@/lib/supabase/public";

// ------------------------------------------------------------------
// Rate limit básico en memoria (por instancia serverless). El límite
// definitivo (3 registros/hora/IP) se aplica en la función SQL.
// ------------------------------------------------------------------
const ventanas = new Map<string, number[]>();

function excedeLimite(clave: string, max: number, ventanaMs: number): boolean {
  const ahora = Date.now();
  const lista = (ventanas.get(clave) || []).filter((t) => ahora - t < ventanaMs);
  if (lista.length >= max) {
    ventanas.set(clave, lista);
    return true;
  }
  lista.push(ahora);
  ventanas.set(clave, lista);
  if (ventanas.size > 5000) ventanas.clear();
  return false;
}

async function obtenerIpHash(): Promise<string> {
  const h = await headers();
  const ip =
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    h.get("x-real-ip") ||
    "desconocido";
  return createHash("sha256").update(`padonde-sumate:${ip}`).digest("hex").slice(0, 32);
}

const PREFIJO_STORAGE = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/eventos/registros/`;

function esUrlPropia(url: unknown): url is string {
  return typeof url === "string" && url.startsWith(PREFIJO_STORAGE) && url.length < 400;
}

// ------------------------------------------------------------------
// 1. Subida de foto individual → Sharp → WebP → Supabase Storage
// ------------------------------------------------------------------
export async function subirFotoRegistroAction(
  formData: FormData
): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    if (String(formData.get("website") || "").trim()) {
      return { success: false, error: "Solicitud no válida." };
    }

    const ipHash = await obtenerIpHash();
    if (excedeLimite(`foto:${ipHash}`, 60, 30 * 60 * 1000)) {
      return { success: false, error: "Demasiadas fotos en poco tiempo. Intenta en unos minutos." };
    }

    const file = formData.get("file");
    if (!(file instanceof File) || !file.type.startsWith("image/")) {
      return { success: false, error: "El archivo debe ser una imagen." };
    }
    if (file.size > 950 * 1024) {
      return { success: false, error: "La foto es muy pesada. Intenta con otra." };
    }

    const raw = Buffer.from(await file.arrayBuffer());
    let webp: Buffer;
    try {
      webp = await sharp(raw)
        .rotate()
        .resize({ width: 1280, withoutEnlargement: true })
        .webp({ quality: 82 })
        .toBuffer();
    } catch {
      return { success: false, error: "No pudimos procesar esa imagen. Prueba con otra foto." };
    }

    const hoy = new Date().toISOString().slice(0, 10);
    const ruta = `registros/${hoy}/${Date.now()}-${Math.random().toString(36).slice(2, 10)}.webp`;

    const supabase = getPublicSupabaseClient();
    const { error } = await supabase.storage.from("eventos").upload(ruta, webp, {
      contentType: "image/webp",
      cacheControl: "31536000",
      upsert: false,
    });

    if (error) {
      console.error("[sumate] Error subiendo foto:", error.message);
      return { success: false, error: "No se pudo subir la foto. Intenta de nuevo." };
    }

    const { data } = supabase.storage.from("eventos").getPublicUrl(ruta);
    return { success: true, url: data.publicUrl };
  } catch (err: any) {
    console.error("[sumate] Excepción subiendo foto:", err?.message);
    return { success: false, error: "Error inesperado al subir la foto." };
  }
}

// ------------------------------------------------------------------
// 2. Registro final (siempre inactivo / borrador)
// ------------------------------------------------------------------
export type TipoNegocioRegistro = "hospedaje" | "comida" | "tours" | "esencial";

export interface HabitacionRegistro {
  titulo: string;
  precio_noche_cop: number;
  capacidad_max: number;
  badges: string[];
  fotos: string[];
}

export interface RegistroAliadoInput {
  website?: string; // honeypot
  tipo: TipoNegocioRegistro;
  zonaSlug: string;
  nombre: string;
  whatsapp: string;
  instagram?: string;
  googleMapsUrl?: string;
  descripcion: string;
  habitaciones?: HabitacionRegistro[];
  fotoPrincipal?: string;
  galeria?: string[];
  horario?: string;
  datosClave?: string;
  precioReferencia?: number;
}

const ICONOS_BADGES: Record<string, string> = {
  "Baño privado": "🚿",
  "Vista montaña": "⛰️",
  WiFi: "📶",
  "Desayuno incluido": "🍳",
  Balcón: "🌅",
  "Aire/Ventilador": "🌀",
};

const ZONAS_VALIDAS = ["minca", "mendihuaca", "tayrona", "taganga"];
const TIPOS_VALIDOS: TipoNegocioRegistro[] = ["hospedaje", "comida", "tours", "esencial"];

function limpiar(txt: unknown, max: number): string {
  return typeof txt === "string" ? txt.trim().slice(0, max) : "";
}

export async function registrarAliadoPublicoAction(
  input: RegistroAliadoInput
): Promise<{ success: boolean; error?: string }> {
  try {
    // Honeypot: los bots llenan el campo oculto → respondemos "éxito" sin guardar
    if (limpiar(input?.website, 200)) {
      return { success: true };
    }

    const ipHash = await obtenerIpHash();
    if (excedeLimite(`registro:${ipHash}`, 3, 60 * 60 * 1000)) {
      return { success: false, error: "Ya recibimos varios registros desde esta conexión. Intenta más tarde." };
    }

    if (!TIPOS_VALIDOS.includes(input.tipo) || !ZONAS_VALIDAS.includes(input.zonaSlug)) {
      return { success: false, error: "Selecciona un tipo de negocio y una zona válidos." };
    }

    const nombre = limpiar(input.nombre, 150);
    if (nombre.length < 2) return { success: false, error: "Escribe el nombre de tu negocio." };

    let whatsapp = String(input.whatsapp || "").replace(/\D/g, "");
    if (whatsapp.length === 10 && whatsapp.startsWith("3")) whatsapp = `57${whatsapp}`;
    if (whatsapp.length < 10 || whatsapp.length > 15) {
      return { success: false, error: "El número de WhatsApp no parece válido." };
    }

    const descripcion = limpiar(input.descripcion, 1200);
    const instagram = limpiar(input.instagram, 80).replace(/^@+/, "");
    const mapsRaw = limpiar(input.googleMapsUrl, 500);
    const googleMapsUrl = /^https?:\/\//i.test(mapsRaw) ? mapsRaw : "";

    const metadata: Record<string, any> = {
      ultima_edicion: new Date().toISOString(),
      registro_publico: {
        origen: "sumate",
        tipo_negocio: input.tipo,
        fecha: new Date().toISOString(),
        estado: "pendiente_revision",
      },
    };

    let imagenUrl = "";
    let precio = 0;

    if (input.tipo === "hospedaje") {
      const habs = (Array.isArray(input.habitaciones) ? input.habitaciones : []).slice(0, 15);
      if (habs.length === 0) {
        return { success: false, error: "Agrega al menos una habitación." };
      }
      const habitaciones = habs.map((h, i) => ({
        id: `hab-${i + 1}`,
        titulo: limpiar(h.titulo, 120) || `Habitación #${i + 1}`,
        descripcion: "",
        precio_noche_cop: Math.max(0, Math.round(Number(h.precio_noche_cop) || 0)),
        capacidad_max: Math.min(30, Math.max(1, Math.round(Number(h.capacidad_max) || 1))),
        fotos: (Array.isArray(h.fotos) ? h.fotos : []).filter(esUrlPropia).slice(0, 5),
        badges: (Array.isArray(h.badges) ? h.badges : [])
          .filter((b) => typeof b === "string" && ICONOS_BADGES[b])
          .map((b) => ({ icono: ICONOS_BADGES[b], texto: b })),
      }));
      metadata.habitaciones = habitaciones;

      const precios = habitaciones.map((h) => h.precio_noche_cop).filter((p) => p > 0);
      precio = precios.length > 0 ? Math.min(...precios) : 0;
      metadata.precio_desde = precios.length > 1;

      const todasFotos = habitaciones.flatMap((h) => h.fotos);
      imagenUrl = todasFotos[0] || "";
      if (todasFotos.length > 1) metadata.galeria_fotos = todasFotos.slice(1, 13);
    } else {
      imagenUrl = esUrlPropia(input.fotoPrincipal) ? input.fotoPrincipal : "";
      const galeria = (Array.isArray(input.galeria) ? input.galeria : []).filter(esUrlPropia).slice(0, 4);
      if (galeria.length > 0) metadata.galeria_fotos = galeria;
      const horario = limpiar(input.horario, 200);
      const datosClave = limpiar(input.datosClave, 800);
      if (horario) metadata.horario_texto = horario;
      if (datosClave) metadata.datos_clave = datosClave;
      precio = Math.max(0, Math.round(Number(input.precioReferencia) || 0));
    }

    if (googleMapsUrl) {
      metadata.google_reputacion = { rating: 0, total_reviews: 0, maps_url: googleMapsUrl };
    }

    const supabase = getPublicSupabaseClient();
    const { error } = await supabase.rpc("registrar_aliado_publico", {
      p: {
        ip_hash: ipHash,
        nombre,
        whatsapp,
        instagram: instagram || null,
        google_maps_url: googleMapsUrl || null,
        descripcion,
        categoria: input.tipo,
        zona_slug: input.zonaSlug,
        precio,
        imagen_url: imagenUrl || null,
        metadata,
      },
    });

    if (error) {
      const msg = error.message || "";
      console.error("[sumate] Error RPC registro:", msg);
      if (msg.includes("rate_limit")) {
        return { success: false, error: "Ya recibimos varios registros desde esta conexión. Intenta en una hora." };
      }
      if (msg.includes("whatsapp_invalido")) return { success: false, error: "El número de WhatsApp no parece válido." };
      if (msg.includes("zona_invalida")) return { success: false, error: "La zona seleccionada no está disponible." };
      return { success: false, error: "No pudimos guardar tu registro. Escríbenos por WhatsApp y te ayudamos." };
    }

    return { success: true };
  } catch (err: any) {
    console.error("[sumate] Excepción registro:", err?.message);
    return { success: false, error: "Error inesperado. Intenta de nuevo en un momento." };
  }
}
