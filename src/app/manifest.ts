import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "PaDónde — Qué hacer hoy",
    short_name: "PaDónde",
    description: "Cartelera viva de eventos, tours, experiencias y planes en Minca y la Sierra Nevada.",
    start_url: "/",
    display: "standalone",
    background_color: "#F4F1EA",
    theme_color: "#2C3E2D",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
