"use client";

import { useState, useTransition } from "react";
import { useRouter } from "@/i18n/routing";
import {
  toggleEventoDestacadoAction,
  actualizarOrdenDestacadoAction,
} from "./actions";

export function ToggleDestacadoButton({
  eventoId,
  destacadoInicial,
  ordenInicial = 99,
}: {
  eventoId: string;
  destacadoInicial: boolean;
  ordenInicial?: number | null;
}) {
  const [destacado, setDestacado] = useState(destacadoInicial);
  const [orden, setOrden] = useState<number>(() => {
    const n = Number(ordenInicial);
    return [1, 2, 3].includes(n) ? n : 99;
  });
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleToggle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    const nuevoEstado = !destacado;
    setDestacado(nuevoEstado);

    startTransition(async () => {
      const res = await toggleEventoDestacadoAction(eventoId, nuevoEstado);
      if (!res.success) {
        setDestacado(!nuevoEstado);
      } else {
        router.refresh();
      }
    });
  }

  function handleOrdenChange(e: React.ChangeEvent<HTMLSelectElement>) {
    e.stopPropagation();
    const nuevoOrden = Number(e.target.value) || 99;
    const ordenAnterior = orden;
    setOrden(nuevoOrden);

    startTransition(async () => {
      const res = await actualizarOrdenDestacadoAction(eventoId, nuevoOrden);
      if (!res.success) {
        setOrden(ordenAnterior);
      } else {
        router.refresh();
      }
    });
  }

  return (
    <div
      className="inline-flex items-center gap-1 shrink-0"
      onClick={(e) => e.stopPropagation()}
    >
      <button
        type="button"
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
          {isPending ? "Guardando" : destacado ? "Destacado" : "Destacar"}
        </span>
      </button>

      {destacado && (
        <label
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 border border-amber-300 text-amber-900 text-[11px] font-sans font-semibold shadow-2xs"
          title="Definir posición manual (#1, #2, #3 o Auto) en la cartelera pública"
        >
          <span className="text-[10px] text-amber-800/80 hidden sm:inline">
            Posición:
          </span>
          <select
            value={orden}
            onChange={handleOrdenChange}
            disabled={isPending}
            className="bg-transparent text-amber-950 font-bold text-[11px] focus:outline-none cursor-pointer pr-0.5"
          >
            <option value={1}>#1</option>
            <option value={2}>#2</option>
            <option value={3}>#3</option>
            <option value={99}>Auto</option>
          </select>
        </label>
      )}
    </div>
  );
}
