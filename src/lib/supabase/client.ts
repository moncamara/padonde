import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

/**
 * Cliente de Supabase para Client Components y operaciones públicas.
 * Utiliza la clave anónima (pública) y respeta las políticas RLS.
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
