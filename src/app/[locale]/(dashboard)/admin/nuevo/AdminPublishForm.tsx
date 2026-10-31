"use client";

import { EventUpsertForm, type AliadoResumen } from "../EventUpsertForm";

export type { AliadoResumen };

export interface AdminPublishFormProps {
  defaultZona?: string;
  initialNegocio?: {
    id?: string;
    nombre: string;
    whatsapp: string;
    instagram?: string | null;
    categoria?: string;
    zonaSlug?: string;
  };
  aliados?: AliadoResumen[];
}

export function AdminPublishForm({
  defaultZona = "minca",
  initialNegocio,
  aliados = [],
}: AdminPublishFormProps) {
  return (
    <EventUpsertForm
      mode="crear"
      defaultZona={defaultZona}
      initialNegocio={initialNegocio}
      aliados={aliados}
      isModal={false}
    />
  );
}
