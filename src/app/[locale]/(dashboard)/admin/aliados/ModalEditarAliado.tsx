"use client";

import { useState, useTransition } from "react";
import { useRouter } from "@/i18n/routing";
import { editarAliadoCompletoAction, type EditarAliadoInput } from "../actions";
import type { AliadoItem } from "./AdminAliadosList";
import type { CategoriaEvento, PlanNegocio } from "@/lib/types";

interface ModalEditarAliadoProps {
  aliado: AliadoItem;
  isOpen: boolean;
  onClose: () => void;
}

const CATEGORIAS: { id: CategoriaEvento; label: string; icon: string }[] = [
  { id: "comida", label: "Comida & Café", icon: "🥑" },
  { id: "musica", label: "Música & Noche", icon: "🎵" },
  { id: "bienestar", label: "Bienestar & Yoga", icon: "🧘" },
  { id: "tours", label: "Tours & Guías", icon: "🦅" },
  { id: "arte", label: "Arte & Talleres", icon: "🎨" },
  { id: "hospedaje", label: "Hospedaje", icon: "🏡" },
  { id: "transporte", label: "Transporte", icon: "🛵" },
  { id: "artesanias", label: "Artesanías", icon: "🧵" },
];

export function ModalEditarAliado({ aliado, isOpen, onClose }: ModalEditarAliadoProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Campos de formulario
  const [nombre, setNombre] = useState(aliado.nombre);
  const [categoria, setCategoria] = useState<CategoriaEvento>(
    (aliado.categoria as CategoriaEvento) || "comida"
  );
  const [whatsapp, setWhatsapp] = useState(aliado.whatsapp);
  const [instagram, setInstagram] = useState(aliado.instagram ? aliado.instagram.replace(/^@/, "") : "");
  const [descripcion, setDescripcion] = useState(aliado.descripcion || "");
  const [activo, setActivo] = useState(aliado.activo);
  const [sincronizarPublicaciones, setSincronizarPublicaciones] = useState(true);

  // Plan y Vigencia
  const [plan, setPlan] = useState<PlanNegocio>(aliado.plan);
  const [diasVigencia, setDiasVigencia] = useState<number>(30);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!nombre.trim()) {
      setErrorMsg("El nombre del negocio es obligatorio.");
      return;
    }

    startTransition(async () => {
      const input: EditarAliadoInput = {
        id: aliado.id,
        nombre: nombre.trim(),
        categoria,
        whatsapp: whatsapp.trim(),
        instagram: instagram.trim() ? instagram.trim() : null,
        descripcion: descripcion.trim() ? descripcion.trim() : null,
        activo,
        plan,
        diasVigencia: plan === "gratis" ? 0 : diasVigencia,
        sincronizarPublicaciones,
      };

      const res = await editarAliadoCompletoAction(input);

      if (!res.success) {
        setErrorMsg(res.error || "Error al guardar cambios del aliado.");
      } else {
        router.refresh();
        onClose();
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-stone-light/80 my-8 overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-stone-light/70 bg-stone-light/20 flex items-center justify-between shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl">🏛️</span>
              <h2 className="font-serif text-lg sm:text-xl font-bold text-forest">
                Editar Aliado Comercial
              </h2>
            </div>
            <p className="text-xs text-stone font-sans mt-0.5">
              Actualiza la información comercial, contacto y estado de este aliado.
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={isPending}
            className="w-8 h-8 rounded-full bg-stone-light/40 hover:bg-stone-light text-stone hover:text-forest flex items-center justify-center text-sm transition-all cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Formulario con scroll si es necesario */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 overflow-y-auto space-y-5 text-xs font-sans">
          {errorMsg && (
            <div className="p-3 bg-red-50 text-red-700 rounded-xl border border-red-200 text-xs flex items-center gap-2">
              <span>⚠️</span>
              <span>{errorMsg}</span>
            </div>
          )}

          {/* 1. Nombre Comercial */}
          <div className="space-y-1.5">
            <label className="font-semibold text-forest flex items-center gap-1">
              <span>Nombre del Comercio / Aliado</span>
              <span className="text-terra">*</span>
            </label>
            <input
              type="text"
              required
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej: Jam Birding Minca, Duni Gourmet..."
              className="w-full px-3.5 py-2.5 bg-stone-light/20 border border-stone-light rounded-xl focus:outline-none focus:ring-1 focus:ring-forest text-forest placeholder:text-stone/50 font-medium"
            />
          </div>

          {/* 2. Categoría */}
          <div className="space-y-1.5">
            <label className="font-semibold text-forest">Categoría de Experiencia</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              {CATEGORIAS.map((cat) => {
                const selected = categoria === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategoria(cat.id)}
                    className={[
                      "p-2 rounded-xl text-left border transition-all cursor-pointer flex items-center gap-1.5",
                      selected
                        ? "bg-forest text-cream border-forest font-semibold shadow-2xs"
                        : "bg-white text-stone border-stone-light hover:border-forest/40 hover:text-forest",
                    ].join(" ")}
                  >
                    <span>{cat.icon}</span>
                    <span className="truncate text-[11px]">{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Contacto: WhatsApp e Instagram */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="font-semibold text-forest flex items-center gap-1">
                <span>💬 WhatsApp</span>
                <span className="text-terra">*</span>
              </label>
              <input
                type="text"
                required
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                placeholder="573001234567"
                className="w-full px-3.5 py-2.5 bg-stone-light/20 border border-stone-light rounded-xl focus:outline-none focus:ring-1 focus:ring-forest text-forest font-mono text-[11px]"
              />
              <span className="text-[10px] text-stone">Con código de país (ej: 57 para Colombia).</span>
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-forest">📸 Instagram (Opcional)</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone/60 font-mono">@</span>
                <input
                  type="text"
                  value={instagram}
                  onChange={(e) => setInstagram(e.target.value.replace(/^@/, ""))}
                  placeholder="usuario_minca"
                  className="w-full pl-7 pr-3.5 py-2.5 bg-stone-light/20 border border-stone-light rounded-xl focus:outline-none focus:ring-1 focus:ring-forest text-forest font-mono text-[11px]"
                />
              </div>
              <span className="text-[10px] text-stone">Sin el @</span>
            </div>
          </div>

          {/* 4. Descripción del Aliado */}
          <div className="space-y-1.5">
            <label className="font-semibold text-forest">Descripción / Propuesta de Valor</label>
            <textarea
              rows={2}
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Breve reseña sobre este comercio o guía en Minca..."
              className="w-full px-3.5 py-2 bg-stone-light/20 border border-stone-light rounded-xl focus:outline-none focus:ring-1 focus:ring-forest text-forest placeholder:text-stone/50 text-xs"
            />
          </div>

          {/* 5. Estado Activo / Inactivo */}
          <div className="p-3.5 rounded-2xl bg-stone-light/20 border border-stone-light/80 space-y-2.5">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-forest text-xs flex items-center gap-1.5">
                  <span>{activo ? "🟢" : "⏸️"}</span>
                  <span>Estado del Aliado: {activo ? "Activo en Cartelera" : "Pausado / Inactivo"}</span>
                </p>
                <p className="text-[11px] text-stone mt-0.5">
                  {activo
                    ? "El aliado está visible y sus eventos activos se muestran en el feed."
                    : "El aliado está pausado y sus publicaciones están ocultas para turistas."}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setActivo(!activo)}
                className={[
                  "relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer",
                  activo ? "bg-forest" : "bg-stone-300",
                ].join(" ")}
              >
                <span
                  className={[
                    "inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-xs",
                    activo ? "translate-x-6" : "translate-x-1",
                  ].join(" ")}
                />
              </button>
            </div>

            {/* Checkbox de sincronización de publicaciones */}
            <label className="flex items-start gap-2 pt-1 border-t border-stone-light/60 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={sincronizarPublicaciones}
                onChange={(e) => setSincronizarPublicaciones(e.target.checked)}
                className="mt-0.5 rounded text-forest focus:ring-forest"
              />
              <span className="text-[11px] text-stone leading-tight">
                Sincronizar automáticamente sus publicaciones (
                <strong>{aliado.totalEventos} total</strong>, {aliado.eventosActivos} activas).
              </span>
            </label>
          </div>

          {/* 6. Plan Comercial y Renovación */}
          <div className="p-3.5 rounded-2xl bg-amber-50/50 border border-amber-200/60 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-amber-950 text-xs">⭐ Plan de Monetización</span>
              <span className="text-[10px] text-amber-800 font-medium">Acuerdo Comercial</span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {(["gratis", "pro", "premium"] as PlanNegocio[]).map((p) => {
                const selected = plan === p;
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPlan(p)}
                    className={[
                      "py-2 px-1 rounded-xl font-sans text-xs font-semibold capitalize border transition-all cursor-pointer text-center",
                      selected
                        ? p === "premium"
                          ? "bg-terra text-white border-terra shadow-2xs"
                          : p === "pro"
                          ? "bg-emerald-700 text-white border-emerald-700 shadow-2xs"
                          : "bg-stone-700 text-white border-stone-700 shadow-2xs"
                        : "bg-white text-stone border-stone-light hover:border-stone",
                    ].join(" ")}
                  >
                    {p}
                  </button>
                );
              })}
            </div>

            {plan !== "gratis" && (
              <div className="pt-2 border-t border-amber-200/50 space-y-2">
                <label className="text-[11px] text-amber-900 font-medium block">
                  Extender vigencia a partir de hoy:
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {[
                    { dias: 30, label: "1 Mes" },
                    { dias: 60, label: "2 Meses" },
                    { dias: 90, label: "3 Meses" },
                    { dias: 365, label: "1 Año" },
                  ].map((opt) => (
                    <button
                      key={opt.dias}
                      type="button"
                      onClick={() => setDiasVigencia(opt.dias)}
                      className={[
                        "py-1.5 rounded-lg text-[10px] font-semibold border transition-all cursor-pointer",
                        diasVigencia === opt.dias
                          ? "bg-amber-800 text-white border-amber-800"
                          : "bg-white text-amber-900 border-amber-200 hover:bg-amber-100/50",
                      ].join(" ")}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer Botones */}
          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="px-4 py-2.5 rounded-xl border border-stone-light text-stone hover:text-forest hover:bg-stone-50 font-medium transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="px-5 py-2.5 rounded-xl bg-forest text-cream font-semibold shadow-xs hover:bg-forest/90 active:scale-95 transition-all cursor-pointer flex items-center gap-1.5"
            >
              {isPending ? (
                <>
                  <span className="animate-spin">⏳</span>
                  <span>Guardando...</span>
                </>
              ) : (
                <>
                  <span>💾</span>
                  <span>Guardar Aliado</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
