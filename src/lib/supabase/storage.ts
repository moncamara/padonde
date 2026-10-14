import { supabase } from "@/lib/supabase/client";

/**
 * Sube una imagen de evento al bucket 'eventos' de Supabase Storage.
 * Si el bucket no existe o falla la subida, retorna null para permitir
 * continuar con un fallback o imagen por defecto.
 */
export async function uploadEventImage(file: File): Promise<string | null> {
  try {
    const fileExt = file.name.split(".").pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
    const filePath = `eventos/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("eventos")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      console.warn("Storage upload error (se usará placeholder si no está configurado el bucket):", uploadError);
      return null;
    }

    const { data } = supabase.storage.from("eventos").getPublicUrl(filePath);
    return data.publicUrl;
  } catch (err) {
    console.error("Excepción en uploadEventImage:", err);
    return null;
  }
}
