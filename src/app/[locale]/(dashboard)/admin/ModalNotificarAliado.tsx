"use client";

import { useMemo } from "react";
import { ModalMensajeWhatsApp, type OpcionPlantilla } from "@/components/admin/ModalMensajeWhatsApp";
import {
  formatVisualPhone,
  cleanPhoneNumber,
  buildWhatsAppUrl,
  copyToClipboard,
} from "@/lib/whatsapp/url";
import {
  calcularFechaLimite,
  calcularFechaEn15Dias,
} from "@/lib/whatsapp/dates";
import {
  generarMensajeRestaurante,
  generarMensajeHospedaje,
  generarMensajeTours,
  generarMensajeComercio,
  generarMensajeDifusionRedes,
  generarMensajeCorreccion,
  generarMensajeRevision,
  type MensajeBaseParams,
} from "@/lib/whatsapp/templates";

// Exportar utilidades canónicas para retrocompatibilidad
export {
  formatVisualPhone as formatearTelefonoVisual,
  cleanPhoneNumber,
  buildWhatsAppUrl,
  copyToClipboard,
  calcularFechaLimite,
  calcularFechaEn15Dias,
};

// Aliases retrocompatibles para generadores de mensajes
export const generarMensajeRestauranteAliado = (
  negocioNombre: string,
  tituloEvento: string,
  eventoId: string,
  zonaSlug?: string,
  zonaNombre?: string,
  whatsapp?: string
) =>
  generarMensajeRestaurante({
    negocioNombre,
    eventoId,
    zonaSlug,
    zonaNombre,
    whatsapp,
  });

export const generarMensajeHospedajeAliado = (
  negocioNombre: string,
  tituloEvento: string,
  eventoId: string,
  zonaSlug?: string,
  zonaNombre?: string,
  whatsapp?: string
) =>
  generarMensajeHospedaje({
    negocioNombre,
    eventoId,
    zonaSlug,
    zonaNombre,
    whatsapp,
  });

export const generarMensajeToursAliado = (
  negocioNombre: string,
  tituloEvento: string,
  eventoId: string,
  zonaSlug?: string,
  zonaNombre?: string,
  whatsapp?: string
) =>
  generarMensajeTours({
    negocioNombre,
    eventoId,
    zonaSlug,
    zonaNombre,
    whatsapp,
  });

export const generarMensajeComercioAliado = (
  negocioNombre: string,
  tituloEvento: string,
  eventoId: string,
  zonaSlug?: string,
  zonaNombre?: string,
  whatsapp?: string
) =>
  generarMensajeComercio({
    negocioNombre,
    eventoId,
    zonaSlug,
    zonaNombre,
    whatsapp,
  });

export const generarMensajeDifusionRedesAliado = (
  negocioNombre: string,
  tituloEvento: string,
  eventoId: string,
  zonaSlug?: string,
  zonaNombre?: string,
  whatsapp?: string
) =>
  generarMensajeDifusionRedes({
    negocioNombre,
    eventoId,
    zonaSlug,
    zonaNombre,
    whatsapp,
  });

export const generarMensajeCorreccionAliado = (
  negocioNombre: string,
  tituloEvento: string,
  eventoId: string,
  zonaSlug?: string,
  zonaNombre?: string,
  whatsapp?: string
) =>
  generarMensajeCorreccion({
    negocioNombre,
    eventoId,
    zonaSlug,
    zonaNombre,
    whatsapp,
  });

export const generarMensajeRevisionAliado = (
  negocioNombre: string,
  tituloEvento: string,
  eventoId: string,
  zonaSlug?: string,
  zonaNombre?: string,
  whatsapp?: string
) =>
  generarMensajeRevision({
    negocioNombre,
    eventoId,
    zonaSlug,
    zonaNombre,
    whatsapp,
  });

export interface EventoNotificarData {
  id: string;
  titulo: string;
  negocioNombre: string;
  whatsapp: string;
  zonaSlug?: string;
  zonaNombre?: string;
  tipoCategoria?: string;
  esPrimerEvento?: boolean;
}

export interface ModalNotificarAliadoProps {
  evento: EventoNotificarData | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ModalNotificarAliado({
  evento,
  isOpen,
  onClose,
}: ModalNotificarAliadoProps) {
  if (!isOpen || !evento) return null;

  const plantillaInicial = useMemo<OpcionPlantilla>(() => {
    const cat = (evento.tipoCategoria || "").toLowerCase();
    if (cat.includes("hospedaje") || cat.includes("hotel") || cat.includes("hostal")) {
      return "hospedaje";
    }
    if (cat.includes("tour") || cat.includes("guia") || cat.includes("aventura")) {
      return "tours";
    }
    if (cat.includes("comercio") || cat.includes("tienda") || cat.includes("artesania")) {
      return "comercio";
    }
    return "restaurante";
  }, [evento.tipoCategoria]);

  const params: MensajeBaseParams = {
    negocioNombre: evento.negocioNombre,
    eventoId: evento.id,
    whatsapp: evento.whatsapp,
    zonaSlug: evento.zonaSlug || "minca",
    zonaNombre: evento.zonaNombre,
  };

  return (
    <ModalMensajeWhatsApp
      isOpen={isOpen}
      onClose={onClose}
      params={params}
      plantillaInicial={plantillaInicial}
      plantillasPermitidas={[
        "restaurante",
        "hospedaje",
        "tours",
        "comercio",
        "difusion",
        "correccion",
        "revision",
      ]}
    />
  );
}
