"use client";

import { useMemo } from "react";
import type { ServicioEsencial } from "@/lib/types";
import { ModalMensajeWhatsApp, type OpcionPlantilla } from "@/components/admin/ModalMensajeWhatsApp";
import { calcularFechaEn15Dias } from "@/lib/whatsapp/dates";
import {
  generarMensajeRestaurante,
  generarMensajeComercio,
  generarMensajeDifusionRedes,
  type MensajeBaseParams,
} from "@/lib/whatsapp/templates";

export { calcularFechaEn15Dias };

export function generarMensajeRestauranteComercial(
  nombreComercial: string,
  zonaSlug: string = "mendihuaca",
  zonaNombre: string = "Mendihuaca",
  servicioId?: string
): string {
  const anchor = servicioId ? `#servicio-${servicioId}` : "";
  return generarMensajeRestaurante({
    negocioNombre: nombreComercial,
    zonaSlug,
    zonaNombre,
    enlacePersonalizado: `https://www.padonde.lat/es/${zonaSlug}?tab=servicios${anchor}`,
  });
}

export function generarMensajeComercioServicios(
  nombreComercial: string,
  zonaSlug: string = "mendihuaca",
  zonaNombre: string = "Mendihuaca",
  servicioId?: string
): string {
  const anchor = servicioId ? `#servicio-${servicioId}` : "";
  return generarMensajeComercio({
    negocioNombre: nombreComercial,
    zonaSlug,
    zonaNombre,
    enlacePersonalizado: `https://www.padonde.lat/es/${zonaSlug}?tab=servicios${anchor}`,
  });
}

export interface ModalNotificarAlianzaProps {
  servicio: ServicioEsencial | null;
  isOpen: boolean;
  onClose: () => void;
  zonaNombre?: string;
}

export function ModalNotificarAlianza({
  servicio,
  isOpen,
  onClose,
  zonaNombre,
}: ModalNotificarAlianzaProps) {
  if (!isOpen || !servicio) return null;

  const zonaSlug = servicio.zona_id === "zona-mendihuaca" ? "mendihuaca" : "minca";
  const destino = zonaNombre || (zonaSlug === "mendihuaca" ? "Mendihuaca" : "Minca");
  const urlPublicacion = `https://www.padonde.lat/es/${zonaSlug}?tab=servicios#servicio-${servicio.id}`;

  const plantillaInicial = useMemo<OpcionPlantilla>(() => {
    if (servicio.categoria === "comercio" || servicio.categoria === "transporte" || servicio.categoria === "efectivo" || servicio.categoria === "salud") {
      return "comercio";
    }
    return "restaurante";
  }, [servicio.categoria]);

  const params: MensajeBaseParams = {
    negocioNombre: servicio.nombre_comercial,
    whatsapp: servicio.whatsapp,
    zonaSlug,
    zonaNombre: destino,
    enlacePersonalizado: urlPublicacion,
  };

  return (
    <ModalMensajeWhatsApp
      isOpen={isOpen}
      onClose={onClose}
      params={params}
      plantillaInicial={plantillaInicial}
      plantillasPermitidas={["comercio", "restaurante", "difusion", "correccion"]}
    />
  );
}
