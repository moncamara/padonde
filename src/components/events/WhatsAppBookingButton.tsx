"use client";

import { Button } from "@/components/ui/Button";
import { trackWhatsAppClick } from "@/lib/analytics";

interface WhatsAppBookingButtonProps {
  href: string;
  label: string;
  eventoId: string;
  eventoTitulo: string;
  negocioNombre: string;
  negocioId?: string;
  precio?: number | null;
  tipoCategoria?: string;
  seccionOrigen?: string;
  zonaSlug?: string;
}

export function WhatsAppBookingButton({
  href,
  label,
  eventoId,
  eventoTitulo,
  negocioNombre,
  negocioId,
  precio,
  tipoCategoria = "evento",
  seccionOrigen = "detalle_evento",
  zonaSlug,
}: WhatsAppBookingButtonProps) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="flex-1 max-w-[240px]"
      onClick={() => {
        trackWhatsAppClick({
          aliado_nombre: negocioNombre || "Organizador",
          tipo_categoria: tipoCategoria,
          seccion_origen: seccionOrigen,
          region_destino: zonaSlug,
          eventoId,
          eventoTitulo,
          negocioNombre,
          negocioId,
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
