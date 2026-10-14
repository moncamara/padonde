"use client";

import { useState, useTransition } from "react";
import { useRouter } from "@/i18n/routing";
import { toggleEventoDestacadoAction } from "./actions";

export function ToggleDestacadoButton({
  eventoId,
  destacadoInicial,
}: {
  eventoId: string;
  destacadoInicial: boolean;
}) {
  const [destacado, setDestacado] = useState(destacadoInicial);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleToggle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    const nuevoEstado = !destacado;
    // 1. Actualización optimista inmediata
    setDestacado(nuevoEstado);

    // 2. Persistir en Supabase
    startTransition(async () => {
      const res = await toggleEventoDestacadoAction(eventoId, nuevoEstado);
      if (!res.success) {
        setDestacado(!nuevoEstado);
      } else {
        router.refresh();
      }
    });
  }

  return (
    <button
      onClick={handleToggle}
      disabled={isPending}
      title={
        destacado
          ? "Clic para retirar de la sección destacada"
          : "Clic para promover a destacado (máxima visibilidad)"
      }
      className={[
        "px-2.5 py-1 rounded-full text-xs font-sans font-medium transition-all duration-150 cursor-pointer flex items-center gap-1 shrink-0",
        destacado
          ? "bg-terra text-white hover:bg-terra-dark shadow-2xs font-semibold"
          : "bg-white text-stone border border-stone-light hover:border-forest/40 hover:text-forest",
      ].join(" ")}
    >
      <span>{isPending ? "..." : destacado ? "⭐" : "☆"}</span>
      <span className="text-[11px]">
        {isPending
          ? "Guardando"
          : destacado
          ? "Destacado"
          : "Destacar"}
      </span>
    </button>
  );
}
