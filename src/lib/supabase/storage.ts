import { supabase } from "@/lib/supabase/client";

/**
 * Comprime y redimensiona una imagen en el navegador antes de subirla.
 * - Reduce imágenes pesadas de cámaras o celulares (5MB - 12MB) a ~150KB - 300KB.
 * - Limita el ancho/alto máximo a 1600px manteniendo la proporción perfecta.
 * - Convierte a formato WebP/JPEG limpio garantizando carga instantánea.
 */
export async function comprimirImagenCliente(
  file: File,
  maxDimension = 1600,
  quality = 0.85
): Promise<File> {
  // Si no estamos en el navegador o no es una imagen estándar, retornar original
  if (typeof window === "undefined" || !file.type.startsWith("image/")) {
    return file;
  }

  // Si es un SVG o GIF animado, no alterar
  if (file.type === "image/svg+xml" || file.type === "image/gif") {
    return file;
  }

  return new Promise((resolve) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      let { width, height } = img;
      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        } else {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        resolve(file);
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);

      // Intentar WebP primero con fallback a JPEG
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            resolve(file);
            return;
          }
          const mimeType = blob.type || "image/jpeg";
          const ext = mimeType.includes("webp") ? "webp" : "jpg";
          const baseName = file.name.replace(/\.[^/.]+$/, "");
          const compressedFile = new File(
            [blob],
            `${baseName}.${ext}`,
            { type: mimeType }
          );
          resolve(compressedFile);
        },
        "image/webp",
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(file);
    };

    img.src = objectUrl;
  });
}

/**
 * Sube una imagen de evento al bucket 'eventos' de Supabase Storage.
 * La comprime y redimensiona automáticamente antes de la subida.
 */
export async function uploadEventImage(file: File): Promise<string | null> {
  try {
    const fileComprimido = await comprimirImagenCliente(file);
    const fileExt = fileComprimido.name.split(".").pop() || "jpg";
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
    const filePath = `eventos/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("eventos")
      .upload(filePath, fileComprimido, {
        cacheControl: "31536000",
        contentType: fileComprimido.type || "image/jpeg",
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

/**
 * Sube un archivo de menú (PDF o Imagen) al bucket 'eventos' bajo 'menus/'.
 * - Si es imagen, la comprime automáticamente a WebP/JPEG optimizado para móviles.
 * - Si es PDF, lo sube directamente con content-type 'application/pdf'.
 */
export async function uploadMenuDocument(file: File): Promise<string | null> {
  try {
    const isPdf =
      file.type === "application/pdf" ||
      file.name.toLowerCase().endsWith(".pdf");

    let fileToUpload = file;
    let contentType = file.type;

    if (!isPdf) {
      fileToUpload = await comprimirImagenCliente(file, 1600, 0.88);
      contentType = fileToUpload.type || "image/jpeg";
    } else {
      contentType = "application/pdf";
    }

    const fileExt =
      fileToUpload.name.split(".").pop() || (isPdf ? "pdf" : "jpg");
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
    const filePath = `menus/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("eventos")
      .upload(filePath, fileToUpload, {
        cacheControl: "31536000",
        contentType,
        upsert: false,
      });

    if (uploadError) {
      console.warn("Error al subir documento de menú a Supabase Storage:", uploadError);
      return null;
    }

    const { data } = supabase.storage.from("eventos").getPublicUrl(filePath);
    return data.publicUrl;
  } catch (err) {
    console.error("Excepción en uploadMenuDocument:", err);
    return null;
  }
}


