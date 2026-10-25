"use client";

import Image from "next/image";

interface ModalAlertaDuplicadoProps {
  coincidencia: any;
  nombreIngresado: string;
  telefonoIngresado: string;
  onEditarExistente: () => void;
  onContinuarCreando: () => void;
  onCancelar: () => void;
}

export function ModalAlertaDuplicado({
  coincidencia,
  nombreIngresado,
  telefonoIngresado,
  onEditarExistente,
  onContinuarCreando,
  onCancelar,
}: ModalAlertaDuplicadoProps) {
  const zonaNombre = coincidencia.zonas?.nombre || "Minca";
  const nombreExistente = coincidencia.negocio?.nombre || coincidencia.titulo;
  const whatsappExistente = coincidencia.negocio?.whatsapp || "";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="w-full max-w-lg bg-cream text-forest rounded-3xl p-6 sm:p-7 shadow-2xl border border-amber-300 space-y-5 animate-in fade-in zoom-in-95 duration-200">
        {/* Cabecera de Alerta */}
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-100 border border-amber-300 flex items-center justify-center text-xl shrink-0 text-amber-700">
            ⚠️
          </div>
          <div className="flex-1">
            <span className="text-[10px] uppercase font-bold tracking-wider text-amber-800 bg-amber-100/80 px-2 py-0.5 rounded-full inline-block mb-1">
              Posible Duplicado Detectado
            </span>
            <h3 className="font-serif text-lg font-bold text-forest leading-tight">
              ¿Seguro que deseas crear este hospedaje?
            </h3>
            <p className="font-sans text-xs text-stone mt-1">
              Encontramos una coincidencia con un hospedaje que ya está registrado en tu directorio.
            </p>
          </div>
        </div>

        {/* Comparativa Visual */}
        <div className="space-y-3 font-sans text-xs">
          {/* Lo que intentas ingresar */}
          <div className="p-3 rounded-2xl bg-white/80 border border-stone-light/80 space-y-1">
            <span className="text-[10px] font-bold text-stone uppercase block">
              Datos que acabas de ingresar:
            </span>
            <div className="font-medium text-forest flex items-center gap-2">
              <span className="font-bold">"{nombreIngresado}"</span>
              {telefonoIngresado && (
                <span className="text-stone">({telefonoIngresado})</span>
              )}
            </div>
          </div>

          {/* El que ya existe en la base de datos */}
          <div className="p-3.5 rounded-2xl bg-amber-50/80 border-2 border-amber-400/60 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-amber-900 uppercase">
                Hospedaje ya registrado en PaDónde:
              </span>
              <span className="text-[10px] font-semibold text-terra bg-terra/10 px-2 py-0.5 rounded-full">
                📍 {zonaNombre}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-forest/10 overflow-hidden relative shrink-0 border border-stone-light/60 flex items-center justify-center">
                {coincidencia.imagen_url ? (
                  <Image
                    src={coincidencia.imagen_url}
                    alt={nombreExistente}
                    fill
                    className="object-cover"
                    sizes="48px"
                  />
                ) : (
                  <span className="text-xl">🏡</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-forest text-sm truncate">
                  {coincidencia.titulo}
                </h4>
                <p className="text-stone text-[11px] truncate">
                  Aliado: {nombreExistente}
                </p>
                {whatsappExistente && (
                  <p className="text-forest text-[11px] font-mono font-medium">
                    WhatsApp: +{whatsappExistente}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Botones de Acción */}
        <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2.5 font-sans">
          <button
            type="button"
            onClick={onCancelar}
            className="px-4 py-2.5 text-xs text-stone hover:text-forest transition-colors rounded-xl text-center cursor-pointer order-3 sm:order-1"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={onContinuarCreando}
            className="px-4 py-2.5 text-xs font-semibold text-stone-dark hover:text-forest bg-stone-light/40 hover:bg-stone-light/70 rounded-2xl transition-all text-center cursor-pointer order-2"
          >
            ➕ Crear de todos modos
          </button>

          <button
            type="button"
            onClick={onEditarExistente}
            className="px-4 py-2.5 text-xs font-bold text-white bg-forest hover:bg-forest-dark active:scale-95 transition-all rounded-2xl shadow-md flex items-center justify-center gap-1.5 cursor-pointer order-1 sm:order-3 ring-2 ring-forest/20"
          >
            <span>✏️</span>
            <span>Abrir y Editar el Existente</span>
          </button>
        </div>
      </div>
    </div>
  );
}
