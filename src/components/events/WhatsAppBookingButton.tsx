"use client";

import { Button } from "@/components/ui/Button";
import { trackWhatsAppClick } from "@/lib/analytics";

interface WhatsAppBookingButtonProps {
  href: string;
  label: string;
  eventoId: string;
  eventoTitulo: string;
  negocioNombre: string;
  precio?: number | null;
}

export function WhatsAppBookingButton({
  href,
  label,
  eventoId,
  eventoTitulo,
  negocioNombre,
  precio,
}: WhatsAppBookingButtonProps) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="flex-1 max-w-[240px]"
      onClick={() => {
        trackWhatsAppClick({
          eventoId,
          eventoTitulo,
          negocioNombre,
          ubicacion: "detalle",
          precio,
        });
      }}
    >
      <Button size="lg" className="w-full shadow-md font-semibold">
        <span>💬</span>
        <span>{label}</span>
      </Button>
    </a>
  );
}
