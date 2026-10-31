"use client";

import { useState, useEffect, useMemo } from "react";
import {
  buildWhatsAppUrl,
  copyToClipboard,
  formatVisualPhone,
} from "@/lib/whatsapp/url";
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

export type OpcionPlantilla =
  | "restaurante"
  | "hospedaje"
  | "tours"
  | "comercio"
  | "difusion"
  | "correccion"
  | "revision"
  | "personalizado";

export interface ModalMensajeWhatsAppProps {
  isOpen: boolean;
  onClose: () => void;
  params: MensajeBaseParams;
  plantillaInicial?: OpcionPlantilla;
  plantillasPermitidas?: OpcionPlantilla[];
  onContactado?: (negocioId?: string) => void;
}

const NOMBRES_PESTAÑAS: Record<OpcionPlantilla, { label: string; icon: string }> = {
  restaurante: { label: "Restaurante", icon: "🍽️" },
  hospedaje: { label: "Hospedaje", icon: "🏡" },
  tours: { label: "Tours & Guías", icon: "🎒" },
  comercio: { label: "Comercio", icon: "🛍️" },
  difusion: { label: "Difusión Redes", icon: "📣" },
  correccion: { label: "Ajuste Listo", icon: "✅" },
  revision: { label: "Revisar Ficha", icon: "🔍" },
  personalizado: { label: "Libre", icon: "✍️" },
};

export function ModalMensajeWhatsApp({
  isOpen,
  onClose,
  params,
  plantillaInicial = "restaurante",
  plantillasPermitidas,
  onContactado,
}: ModalMensajeWhatsAppProps) {
  const [tipoSeleccionado, setTipoSeleccionado] = useState<OpcionPlantilla>(plantillaInicial);
  const [mensajeEditado, setMensajeEditado] = useState<string>("");
  const [copiado, setCopiado] = useState<boolean>(false);
  const [telefonoEditable, setTelefonoEditable] = useState<string>(params.whatsapp || "");

  // Lista de pestañas a mostrar
  const pestanas = useMemo<OpcionPlantilla[]>(() => {
    if (plantillasPermitidas && plantillasPermitidas.length > 0) {
      return plantillasPermitidas;
    }
    return ["restaurante", "hospedaje", "tours", "comercio", "difusion", "correccion"];
  }, [plantillasPermitidas]);

  // Generar mensaje inicial al cambiar de plantilla o de parámetros
  useEffect(() => {
    if (!isOpen) return;

    let texto = "";
    switch (tipoSeleccionado) {
      case "restaurante":
        texto = generarMensajeRestaurante(params);
        break;
      case "hospedaje":
        texto = generarMensajeHospedaje(params);
        break;
      case "tours":
        texto = generarMensajeTours(params);
        break;
      case "comercio":
        texto = generarMensajeComercio(params);
        break;
      case "difusion":
        texto = generarMensajeDifusionRedes(params);
        break;
      case "correccion":
        texto = generarMensajeCorreccion(params);
        break;
      case "revision":
        texto = generarMensajeRevision(params);
        break;
      case "personalizado":
      default:
        texto = mensajeEditado || `Hola ${params.negocioNombre}, te escribimos de PaDónde.`;
        break;
    }
    setMensajeEditado(texto);
    setTelefonoEditable(params.whatsapp || "");
  }, [tipoSeleccionado, params, isOpen]);

  // Bloquear scroll de la página de fondo
  useEffect(() => {
    if (isOpen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [isOpen]);

  // Cerrar con Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const urlWhatsApp = buildWhatsAppUrl({
    phone: telefonoEditable,
    message: mensajeEditado,
  });

  const handleCopiar = async () => {
    const ok = await copyToClipboard(mensajeEditado);
    if (ok) {
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2500);
    }
  };

  const handleAbrirWhatsApp = () => {
    // 1. Copiar al portapapeles automáticamente como respaldo
    copyToClipboard(mensajeEditado);
    setCopiado(true);

    // 2. Notificar callback de contactado si aplica
    if (onContactado) {
      onContactado(params.eventoId);
    }

    // 3. Abrir WhatsApp de forma segura
    window.open(urlWhatsApp, "_blank", "noopener,noreferrer");
  };

  const telefonoVisual = formatVisualPhone(telefonoEditable);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-stone-light/80 overflow-hidden font-sans">
        {/* Cabecera del Modal */}
        <div className="px-5 sm:px-6 py-4 border-b border-stone-light/70 flex items-center justify-between bg-cream/50">
          <div>
            <h3 className="font-serif text-lg sm:text-xl text-forest font-bold flex items-center gap-2">
              <span>📲</span> Notificar a {params.negocioNombre}
            </h3>
            <p className="text-[11px] sm:text-xs text-stone mt-0.5">
              Destino: <strong className="text-forest capitalize">{params.zonaSlug || "minca"}</strong> •{" "}
              {telefonoVisual || "Sin teléfono registrado"}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-stone-light/40 hover:bg-stone-light text-stone hover:text-forest flex items-center justify-center text-sm font-bold transition-colors cursor-pointer"
            title="Cerrar"
          >
            ✕
          </button>
        </div>

        {/* Pestañas de Plantillas Canónicas */}
        <div className="px-5 sm:px-6 pt-3.5 pb-2 bg-stone-light/20 border-b border-stone-light/60 flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
          <span className="text-[11px] font-bold text-forest uppercase tracking-wider mr-1 shrink-0">
            Plantilla:
          </span>
          {pestanas.map((p) => {
            const meta = NOMBRES_PESTAÑAS[p] || { label: p, icon: "📄" };
            const isActive = tipoSeleccionado === p;
            return (
              <button
                key={p}
                type="button"
                onClick={() => setTipoSeleccionado(p)}
                className={`py-1.5 px-3 rounded-xl text-xs font-medium transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
                  isActive
                    ? "bg-forest text-cream shadow-xs font-semibold"
                    : "bg-white/80 text-stone hover:text-forest hover:bg-white border border-stone-light/60"
                }`}
              >
                <span>{meta.icon}</span>
                <span>{meta.label}</span>
              </button>
            );
          })}
        </div>

        {/* Contenido: Editor de Mensaje y Datos Telefónicos */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4 flex-1">
          {/* Teléfono de Destino */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-2xl bg-stone-light/20 border border-stone-light/60">
            <div className="flex items-center gap-2">
              <span className="text-lg">💬</span>
              <div>
                <span className="text-xs font-bold text-forest block">Número de WhatsApp Destino</span>
                <span className="text-[11px] text-stone">
                  {telefonoVisual ? `Formato internacional: ${telefonoVisual}` : "Ingresa el número con prefijo (ej: 57301...)"}
                </span>
              </div>
            </div>

            <input
              type="tel"
              value={telefonoEditable}
              onChange={(e) => setTelefonoEditable(e.target.value)}
              placeholder="573001234567"
              className="px-3 py-1.5 text-xs bg-white rounded-xl border border-stone-light text-forest font-mono outline-none focus:ring-1 focus:ring-forest w-full sm:w-44"
            />
          </div>

          {/* Área de Texto Editable */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-forest flex items-center gap-1.5">
                <span>📝</span> Mensaje preparado para WhatsApp
              </label>
              <span className="text-[11px] text-stone font-mono">
                {mensajeEditado.length} caracteres
              </span>
            </div>

            <textarea
              rows={12}
              value={mensajeEditado}
              onChange={(e) => setMensajeEditado(e.target.value)}
              className="w-full p-3.5 text-xs bg-white rounded-2xl border border-stone-light/80 text-forest font-sans leading-relaxed outline-none focus:ring-1 focus:ring-forest resize-none shadow-2xs"
            />
          </div>

          {/* Tips comerciales */}
          <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-[11px] space-y-1">
            <p className="font-bold flex items-center gap-1">
              <span>💡</span> Recomendación comercial PaDónde:
            </p>
            <p className="leading-relaxed">
              Al tocar en <strong>&ldquo;Abrir en WhatsApp&rdquo;</strong>, el mensaje también se copia automáticamente a tu portapapeles. Si WhatsApp Web o la app no cargan el texto por algún bloqueo del navegador, simplemente presiona <strong>Pegar (Ctrl+V o Cmd+V)</strong> en la conversación.
            </p>
          </div>
        </div>

        {/* Footer de Acciones */}
        <div className="px-5 sm:px-6 py-4 border-t border-stone-light/70 bg-cream/40 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
          <button
            type="button"
            onClick={handleCopiar}
            className={`py-2 px-4 rounded-xl text-xs font-semibold border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              copiado
                ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                : "bg-white text-forest border-stone-light hover:bg-stone-50"
            }`}
          >
            <span>{copiado ? "✓" : "📋"}</span>
            <span>{copiado ? "¡Mensaje Copiado!" : "Copiar Texto"}</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="py-2 px-4 rounded-xl text-xs font-medium text-stone hover:text-forest border border-stone-light bg-white cursor-pointer"
            >
              Cerrar
            </button>

            <button
              type="button"
              onClick={handleAbrirWhatsApp}
              className="py-2.5 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <span>💬</span>
              <span>Abrir en WhatsApp</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
