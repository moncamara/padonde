"use client";

import { EventUpsertForm } from "./EventUpsertForm";
import type { EventoAdminItem } from "./AdminEventList";

export interface ModalEditarEventoProps {
  evento: EventoAdminItem;
  negocios: { id: string; nombre: string }[];
  onClose: () => void;
  onSaved: (eventoActualizado: Partial<EventoAdminItem>) => void;
  onDeleted: (eventoId: string) => void;
}

export function ModalEditarEvento({
  evento,
  negocios,
  onClose,
  onSaved,
  onDeleted,
}: ModalEditarEventoProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-stone-light/80 overflow-hidden">
        <div className="overflow-y-auto p-5 sm:p-6 text-left flex-1">
          <EventUpsertForm
            mode="editar"
            initialEvento={evento}
            negocios={negocios}
            isModal={true}
            onClose={onClose}
            onSuccess={onSaved}
            onDeleted={onDeleted}
          />
        </div>
      </div>
    </div>
  );
}
