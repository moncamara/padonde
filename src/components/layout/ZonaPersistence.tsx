"use client";

import { useEffect } from "react";

interface ZonaPersistenceProps {
  zonaSlug: string;
}

/**
 * Componente cliente para persistencia de la última zona visitada
 * en localStorage y cookie, sin generar advertencias de renderizado en React / Next.js.
 */
export function ZonaPersistence({ zonaSlug }: ZonaPersistenceProps) {
  useEffect(() => {
    try {
      localStorage.setItem("padonde_zona", zonaSlug);
      document.cookie = `padonde_zona=${zonaSlug}; path=/; max-age=31536000; SameSite=Lax`;
    } catch {
      // Ignorar fallos de almacenamiento en modos restringidos
    }
  }, [zonaSlug]);

  return null;
}
