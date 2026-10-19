"use client";

import { useState, useEffect, useTransition } from "react";
import type { CategoriaServicioEsencial, ServicioEsencial } from "@/lib/types";
import { guardarServicioEsencialAction } from "../actions";

interface ModalEditarEsencialProps {
  servicio: ServicioEsencial | null; // null si es nuevo
  isOpen: boolean;
  onClose: () => void;
  onSaved?: (servicio: ServicioEsencial) => void;
  zonas: Array<{ id: string; nombre: string; slug: string }>;
}

const CATEGORIAS_OPCIONES: Array<{
  id: CategoriaServicioEsencial;
  label: string;
  emoji: string;
}> = [
  { id: "efectivo", label: "Efectivo & Divisas", emoji: "🏧" },
  { id: "transporte", label: "Motos & Transporte", emoji: "🛵" },
  { id: "salud", label: "Farmacia & Salud", emoji: "💊" },
  { id: "comercio", label: "Tiendas & Souvenirs", emoji: "🛍️" },
  { id: "general", label: "Servicios Generales", emoji: "ℹ️" },
];

export function ModalEditarEsencial({
  servicio,
  isOpen,
  onClose,
  onSaved,
  zonas,
}: ModalEditarEsencialProps) {
  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form states
  const [zonaSlug, setZonaSlug] = useState(
    servicio?.zona_id === "zona-mendihuaca" ? "mendihuaca" : "minca"
  );
  const [categoria, setCategoria] = useState<CategoriaServicioEsencial>(
    servicio?.categoria || "efectivo"
  );
  const [nombreComercial, setNombreComercial] = useState(
    servicio?.nombre_comercial || ""
  );
  const [subtitulo, setSubtitulo] = useState(servicio?.subtitulo || "");
  const [whatsapp, setWhatsapp] = useState(servicio?.whatsapp || "57");
  const [mensajeWhatsapp, setMensajeWhatsapp] = useState(
    servicio?.mensaje_whatsapp_default || ""
  );
  const [direccion, setDireccion] = useState(
    servicio?.direccion_referencia || ""
  );
  const [mapsUrl, setMapsUrl] = useState(servicio?.google_maps_url || "");
  const [horario, setHorario] = useState(
    servicio?.horario_apertura || "Lunes a Domingo • 8:00 AM - 7:00 PM"
  );
  const [tagsStr, setTagsStr] = useState(
    servicio?.servicios_tags?.join(", ") || ""
  );
  const [tipoAcuerdo, setTipoAcuerdo] = useState<
    "canje_afiche" | "pago_mensual" | "cortesia"
  >(servicio?.tipo_acuerdo || "canje_afiche");
  const [destacado, setDestacado] = useState(
    Boolean(servicio?.destacado_patrocinado)
  );
  const [orden, setOrden] = useState(Number(servicio?.orden_prioridad ?? 1));
  const [activo, setActivo] = useState(servicio?.activo ?? true);
  const [botonWhatsappActivo, setBotonWhatsappActivo] = useState(
    servicio?.boton_whatsapp_activo ?? true
  );

  useEffect(() => {
    if (servicio) {
      setZonaSlug(
        servicio.zona_id === "zona-mendihuaca" ? "mendihuaca" : "minca"
      );
      setCategoria(servicio.categoria || "efectivo");
      setNombreComercial(servicio.nombre_comercial || "");
      setSubtitulo(servicio.subtitulo || "");
      setWhatsapp(servicio.whatsapp || "57");
      setMensajeWhatsapp(servicio.mensaje_whatsapp_default || "");
      setDireccion(servicio.direccion_referencia || "");
      setMapsUrl(servicio.google_maps_url || "");
      setHorario(servicio.horario_apertura || "Lunes a Domingo • 8:00 AM - 7:00 PM");
      setTagsStr(servicio.servicios_tags?.join(", ") || "");
      setTipoAcuerdo(servicio.tipo_acuerdo || "canje_afiche");
      setDestacado(Boolean(servicio.destacado_patrocinado));
      setOrden(Number(servicio.orden_prioridad ?? 1));
      setActivo(servicio.activo ?? true);
      setBotonWhatsappActivo(servicio.boton_whatsapp_activo ?? true);
    } else {
      setZonaSlug("minca");
      setCategoria("efectivo");
      setNombreComercial("");
      setSubtitulo("");
      setWhatsapp("57");
      setMensajeWhatsapp("");
      setDireccion("");
      setMapsUrl("");
      setHorario("Lunes a Domingo • 8:00 AM - 7:00 PM");
      setTagsStr("");
      setTipoAcuerdo("canje_afiche");
      setDestacado(false);
      setOrden(10);
      setActivo(true);
      setBotonWhatsappActivo(true);
    }
  }, [servicio, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!nombreComercial.trim()) {
      setErrorMsg("El nombre comercial es obligatorio.");
      return;
    }
    if (!whatsapp.trim()) {
      setErrorMsg("El número de WhatsApp es obligatorio.");
      return;
    }

    const tagsArray = tagsStr
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    startTransition(async () => {
      const res = await guardarServicioEsencialAction({
        id: servicio?.id,
        zonaSlug,
        categoria,
        nombreComercial,
        subtitulo,
        whatsapp,
        mensajeWhatsappDefault: mensajeWhatsapp || null,
        direccionReferencia: direccion,
        googleMapsUrl: mapsUrl || null,
        horarioApertura: horario,
        serviciosTags: tagsArray,
        destacadoPatrocinado: destacado,
        tipoAcuerdo,
        ordenPrioridad: orden,
        activo,
        botonWhatsappActivo,
      });

      if (!res.success) {
        setErrorMsg(res.error || "Ocurrió un error al guardar.");
      } else {
        if (res.servicio) {
          onSaved?.(res.servicio);
        }
        onClose();
      }
    });
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150"
    >
      <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-stone-light/80 my-8 overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col max-h-[92vh]">
        {/* Encabezado */}
        <div className="p-4 sm:p-6 border-b border-stone-light/70 bg-stone-light/20 flex items-center justify-between shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl">
                {CATEGORIAS_OPCIONES.find((c) => c.id === categoria)?.emoji || "💡"}
              </span>
              <h2 className="font-serif text-lg sm:text-xl font-bold text-forest">
                {servicio ? "Editar Servicio Esencial" : "Nuevo Servicio Esencial"}
              </h2>
            </div>
            <p className="text-xs text-stone font-sans mt-0.5">
              Gestiona presencia, horarios, enlaces de Maps y WhatsApp del aliado fijo.
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-stone-light/40 hover:bg-stone-light text-stone hover:text-forest flex items-center justify-center text-sm transition-all cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Formulario con scroll suave */}
        <form
          onSubmit={handleSubmit}
          className="p-4 sm:p-6 overflow-y-auto space-y-4 font-sans text-xs flex-1"
        >
          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs">
              ⚠️ {errorMsg}
            </div>
          )}

          {/* Fila 1: Zona y Categoría */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-forest block mb-1">
                Destino / Zona:
              </label>
              <select
                value={zonaSlug}
                onChange={(e) => setZonaSlug(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-stone-light bg-stone-light/10 text-forest text-xs focus:ring-2 focus:ring-forest/20 outline-none"
              >
                {zonas.map((z) => (
                  <option key={z.id} value={z.slug}>
                    {z.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-semibold text-forest block mb-1">
                Categoría:
              </label>
              <select
                value={categoria}
                onChange={(e) =>
                  setCategoria(e.target.value as CategoriaServicioEsencial)
                }
                className="w-full p-2.5 rounded-xl border border-stone-light bg-stone-light/10 text-forest text-xs focus:ring-2 focus:ring-forest/20 outline-none"
              >
                {CATEGORIAS_OPCIONES.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.emoji} {c.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Nombre Comercial */}
          <div>
            <label className="font-semibold text-forest block mb-1">
              Nombre Comercial:
            </label>
            <input
              type="text"
              value={nombreComercial}
              onChange={(e) => setNombreComercial(e.target.value)}
              placeholder="Ej: Embassy Bank Colombia"
              required
              className="w-full p-2.5 rounded-xl border border-stone-light bg-stone-light/10 text-forest text-xs focus:ring-2 focus:ring-forest/20 outline-none"
            />
          </div>

          {/* Subtítulo descriptivo */}
          <div>
            <label className="font-semibold text-forest block mb-1">
              Subtítulo / Especialidad:
            </label>
            <input
              type="text"
              value={subtitulo}
              onChange={(e) => setSubtitulo(e.target.value)}
              placeholder="Ej: El Banco de Minca • Retiro de Efectivo y Cambio de Moneda"
              className="w-full p-2.5 rounded-xl border border-stone-light bg-stone-light/10 text-forest text-xs focus:ring-2 focus:ring-forest/20 outline-none"
            />
          </div>

          {/* WhatsApp y Mensaje Default */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-forest block mb-1">
                WhatsApp:
              </label>
              <input
                type="text"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                placeholder="573013010194"
                required
                className="w-full p-2.5 rounded-xl border border-stone-light bg-stone-light/10 text-forest text-xs focus:ring-2 focus:ring-forest/20 outline-none"
              />
            </div>

            <div>
              <label className="font-semibold text-forest block mb-1">
                Horario de Atención:
              </label>
              <input
                type="text"
                value={horario}
                onChange={(e) => setHorario(e.target.value)}
                placeholder="Lunes a Domingo • 8:00 AM - 7:00 PM"
                className="w-full p-2.5 rounded-xl border border-stone-light bg-stone-light/10 text-forest text-xs focus:ring-2 focus:ring-forest/20 outline-none"
              />
            </div>
          </div>

          {/* Mensaje WhatsApp predeterminado */}
          <div>
            <label className="font-semibold text-forest block mb-1">
              Mensaje WhatsApp Predeterminado:
            </label>
            <textarea
              value={mensajeWhatsapp}
              onChange={(e) => setMensajeWhatsapp(e.target.value)}
              rows={2}
              placeholder="¡Hola! Vi su punto en PaDónde Minca..."
              className="w-full p-2.5 rounded-xl border border-stone-light bg-stone-light/10 text-forest text-xs focus:ring-2 focus:ring-forest/20 outline-none resize-none"
            />
          </div>

          {/* Dirección y Google Maps */}
          <div>
            <label className="font-semibold text-forest block mb-1">
              Dirección o Referencia Local:
            </label>
            <input
              type="text"
              value={direccion}
              onChange={(e) => setDireccion(e.target.value)}
              placeholder="Calle principal de Minca, diagonal al puente central"
              className="w-full p-2.5 rounded-xl border border-stone-light bg-stone-light/10 text-forest text-xs focus:ring-2 focus:ring-forest/20 outline-none"
            />
          </div>

          <div>
            <label className="font-semibold text-forest block mb-1">
              Enlace de Google Maps:
            </label>
            <input
              type="url"
              value={mapsUrl}
              onChange={(e) => setMapsUrl(e.target.value)}
              placeholder="https://maps.app.goo.gl/..."
              className="w-full p-2.5 rounded-xl border border-stone-light bg-stone-light/10 text-forest text-xs focus:ring-2 focus:ring-forest/20 outline-none"
            />
          </div>

          {/* Tags de Servicios */}
          <div>
            <label className="font-semibold text-forest block mb-1">
              Servicios o Características (separados por coma):
            </label>
            <input
              type="text"
              value={tagsStr}
              onChange={(e) => setTagsStr(e.target.value)}
              placeholder="🏧 Retiro Efectivo, 💶 Cambio EUR & USD, 💳 Datáfono"
              className="w-full p-2.5 rounded-xl border border-stone-light bg-stone-light/10 text-forest text-xs focus:ring-2 focus:ring-forest/20 outline-none"
            />
          </div>

          {/* Fila Modelo de Negocio / Acuerdo y Prioridad */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-stone-light/60">
            <div>
              <label className="font-semibold text-forest block mb-1">
                Tipo de Acuerdo:
              </label>
              <select
                value={tipoAcuerdo}
                onChange={(e) =>
                  setTipoAcuerdo(
                    e.target.value as "canje_afiche" | "pago_mensual" | "cortesia"
                  )
                }
                className="w-full p-2.5 rounded-xl border border-stone-light bg-stone-light/10 text-forest text-xs focus:ring-2 focus:ring-forest/20 outline-none"
              >
                <option value="canje_afiche">
                  🤝 Canje por Afiche / Talker QR
                </option>
                <option value="pago_mensual">💎 Pago Mensual Pauta</option>
                <option value="cortesia">🎁 Cortesía / Alianza</option>
              </select>
            </div>

            <div>
              <label className="font-semibold text-forest block mb-1">
                Orden de Prioridad (menor = primero):
              </label>
              <input
                type="number"
                min="1"
                max="99"
                value={orden}
                onChange={(e) => setOrden(Number(e.target.value))}
                className="w-full p-2.5 rounded-xl border border-stone-light bg-stone-light/10 text-forest text-xs focus:ring-2 focus:ring-forest/20 outline-none"
              />
            </div>
          </div>

          {/* Checkboxes de Destacado y Activo */}
          <div className="flex flex-wrap items-center gap-6 pt-2">
            <label className="flex items-center gap-2 cursor-pointer font-semibold text-forest">
              <input
                type="checkbox"
                checked={destacado}
                onChange={(e) => setDestacado(e.target.checked)}
                className="w-4 h-4 rounded text-forest focus:ring-forest/20"
              />
              <span>★ Destacado / Patrocinado</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer font-semibold text-forest">
              <input
                type="checkbox"
                checked={activo}
                onChange={(e) => setActivo(e.target.checked)}
                className="w-4 h-4 rounded text-forest focus:ring-forest/20"
              />
              <span>🟢 Activo en la App</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer font-semibold text-forest">
              <input
                type="checkbox"
                checked={botonWhatsappActivo}
                onChange={(e) => setBotonWhatsappActivo(e.target.checked)}
                className="w-4 h-4 rounded text-forest focus:ring-forest/20"
              />
              <span>💬 Botón WhatsApp Público (Plan de Conversión Activo)</span>
            </label>
          </div>

          {/* Footer de Acciones */}
          <div className="pt-4 border-t border-stone-light/70 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="px-4 py-2.5 rounded-xl border border-stone-light/80 hover:bg-stone-light/30 text-stone font-semibold transition-all cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="px-5 py-2.5 rounded-xl bg-forest hover:bg-forest/90 text-cream font-semibold transition-all shadow-md active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              {isPending ? "Guardando..." : "Guardar Servicio"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
