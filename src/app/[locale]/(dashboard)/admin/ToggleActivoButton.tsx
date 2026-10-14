"use client";

import { useState, useTransition } from "react";
import { useRouter } from "@/i18n/routing";
import { toggleEventoActivoAction } from "./actions";

export function ToggleActivoButton({
  eventoId,
  activoInicial,
}: {
  eventoId: string;
  activoInicial: boolean;
}) {
  const [activo, setActivo] = useState(activoInicial);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleToggle() {
    const nuevoEstado = !activo;
    // 1. Actualización optimista inmediata en la UI
    setActivo(nuevoEstado);

    // 2. Persistir en Supabase y refrescar datos
    startTransition(async () => {
      const res = await toggleEventoActivoAction(eventoId, nuevoEstado);
      if (!res.success) {
        // Revertir si hubo error
        setActivo(!nuevoEstado);
      } else {
        router.refresh();
      }
    });
  }

  return (
    <button
      onClick={handleToggle}
      disabled={isPending}
      className={[
        "px-2.5 py-1 rounded-full text-xs font-sans font-medium transition-all duration-150 cursor-pointer",
        activo
          ? "bg-green-100 text-green-800 hover:bg-green-200"
          : "bg-stone-light text-stone hover:bg-stone-200",
      ].join(" ")}
    >
      {isPending ? "..." : activo ? "● Publicado" : "○ Pausado"}
    </button>
  );
}
