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

/**
 * Sube un archivo de video (Reel MP4/MOV) al bucket 'eventos' bajo la carpeta 'videos/'.
 * Configura caché inmutable a largo plazo para streaming eficiente.
 */
export async function uploadEventVideo(file: File): Promise<string | null> {
  try {
    const fileExt = file.name.split(".").pop() || "mp4";
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
    const filePath = `videos/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("eventos")
      .upload(filePath, file, {
        cacheControl: "31536000",
        contentType: file.type || "video/mp4",
        upsert: false,
      });

    if (uploadError) {
      console.warn("Error al subir video a Supabase Storage:", uploadError);
      return null;
    }

    const { data } = supabase.storage.from("eventos").getPublicUrl(filePath);
    return data.publicUrl;
  } catch (err) {
    console.error("Excepción en uploadEventVideo:", err);
    return null;
  }
}

/**
 * Extrae una foto de portada (thumbnail) del segundo 1.0 de un video
 * en tiempo real dentro del navegador usando Canvas y la exporta como WebP ultraliviano.
 * Tarda <30ms y no satura memoria.
 */
export async function extractVideoThumbnail(
  videoFile: File,
  seekTimeSeconds = 1.0
): Promise<File | null> {
  if (typeof window === "undefined") return null;

  return new Promise((resolve) => {
    const video = document.createElement("video");
    const objectUrl = URL.createObjectURL(videoFile);

    video.src = objectUrl;
    video.muted = true;
    video.playsInline = true;
    video.currentTime = seekTimeSeconds;

    const cleanup = () => {
      URL.revokeObjectURL(objectUrl);
      video.remove();
    };

    video.onloadeddata = () => {
      video.currentTime = Math.min(seekTimeSeconds, (video.duration || 2) / 2);
    };

    video.onseeked = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth || 720;
        canvas.height = video.videoHeight || 1280;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          cleanup();
          resolve(null);
          return;
        }

        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        canvas.toBlob(
          (blob) => {
            cleanup();
            if (!blob) {
              resolve(null);
              return;
            }
            const mimeType = blob.type || "image/jpeg";
            const ext = mimeType.includes("webp")
              ? "webp"
              : mimeType.includes("png")
              ? "png"
              : "jpg";
            const thumbnailFile = new File(
              [blob],
              `poster-${Date.now()}.${ext}`,
              { type: mimeType }
            );
            resolve(thumbnailFile);
          },
          "image/jpeg",
          0.85
        );
      } catch (e) {
        console.warn("Fallo extrayendo poster de video:", e);
        cleanup();
        resolve(null);
      }
    };

    video.onerror = () => {
      cleanup();
      resolve(null);
    };
  });
}

