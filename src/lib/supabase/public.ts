import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Cliente público de Supabase para consultas de lectura en rutas públicas.
 * NO utiliza cookies de sesión, lo que permite a Next.js y Vercel
 * generar páginas estáticas con ISR y servirlas desde el Edge CDN
 * sin levantar funciones Serverless en cada visita.
 */
let publicClient: SupabaseClient<any> | null = null;

export function getPublicSupabaseClient(): SupabaseClient<any> {
  if (!publicClient) {
    publicClient = createClient<any>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      }
    );
  }
  return publicClient;
}
