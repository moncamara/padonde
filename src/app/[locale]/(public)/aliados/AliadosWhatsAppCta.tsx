"use client";

import type { ReactNode } from "react";
import { trackWhatsAppClick } from "@/lib/analytics";

interface AliadosWhatsAppCtaProps {
  href: string;
  section: string;
  modality?: string;
  className?: string;
  children: ReactNode;
}

export function AliadosWhatsAppCta({
  href,
  section,
  modality = "general_b2b",
  className = "",
  children,
}: AliadosWhatsAppCtaProps) {
  function handleClick() {
    try {
      trackWhatsAppClick({
        aliado_nombre: "PaDónde Captación Aliados",
        tipo_categoria: modality,
        seccion_origen: section,
        eventoTitulo: `Landing Aliados (${section})`,
      });
    } catch {
      // Silencioso: nunca bloquear la apertura de WhatsApp
    }
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={handleClick}
      className={className}
    >
      {children}
    </a>
  );
}

