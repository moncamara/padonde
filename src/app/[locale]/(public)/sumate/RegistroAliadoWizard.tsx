"use client";

import { useRef, useState } from "react";
import { comprimirImagenCliente } from "@/lib/supabase/storage";
import { WHATSAPP_CONTACTO, whatsappLink } from "@/constants";
import {
  subirFotoRegistroAction,
  registrarAliadoPublicoAction,
  type TipoNegocioRegistro,
} from "./actions";

const TIPOS: Array<{ id: TipoNegocioRegistro; label: string; emoji: string; hint: string }> = [
  { id: "hospedaje", label: "Hospedaje", emoji: "🏡", hint: "Hostal, eco-lodge, cabañas" },
  { id: "comida", label: "Gastronomía / Bar", emoji: "🍽️", hint: "Restaurante, café, bar" },
  { id: "tours", label: "Tour / Experiencia", emoji: "🌿", hint: "Guías, avistamiento, surf" },
  { id: "esencial", label: "Servicio Esencial", emoji: "🛵", hint: "Transporte, farmacia, tienda" },
];

const ZONAS = [
  { id: "minca", label: "Minca", emoji: "🌿" },
  { id: "mendihuaca", label: "Mendihuaca", emoji: "🌊" },
  { id: "tayrona", label: "Tayrona", emoji: "🌴" },
  { id: "taganga", label: "Taganga", emoji: "🤿" },
];

const BADGES = ["Baño privado", "Vista montaña", "WiFi", "Desayuno incluido", "Balcón", "Aire/Ventilador"];

interface HabitacionForm {
  key: string;
  titulo: string;
  precio: string;
  capacidad: string;
  badges: string[];
  fotos: string[];
}

function nuevaHabitacion(n: number): HabitacionForm {
  return {
    key: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    titulo: `Habitación #${n}`,
    precio: "",
    capacidad: "2",
    badges: [],
    fotos: [],
  };
}

const inputCls =
  "w-full px-3.5 py-3 text-[15px] bg-white rounded-2xl border border-stone-light text-[#1B382B] placeholder:text-stone/50 outline-none focus:ring-2 focus:ring-[#1B382B]/30";

export function RegistroAliadoWizard() {
  const [paso, setPaso] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [subiendo, setSubiendo] = useState(0);
  const [honeypot, setHoneypot] = useState("");

  // Paso 1
  const [tipo, setTipo] = useState<TipoNegocioRegistro | null>(null);
  const [zona, setZona] = useState<string | null>(null);

  // Paso 2
  const [nombre, setNombre] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [instagram, setInstagram] = useState("");
  const [mapsUrl, setMapsUrl] = useState("");
  const [descripcion, setDescripcion] = useState("");

  // Paso 3 — Hospedaje
  const [habitaciones, setHabitaciones] = useState<HabitacionForm[]>([nuevaHabitacion(1)]);
  const [modoHosp, setModoHosp] = useState<"habitaciones_con_fotos" | "galeria_y_lista_precios">(
    "habitaciones_con_fotos"
  );
  const [galeriaHosp, setGaleriaHosp] = useState<string[]>([]);

  // Paso 3 — Otras categorías
  const [fotoPrincipal, setFotoPrincipal] = useState<string>("");
  const [galeria, setGaleria] = useState<string[]>([]);
  const [horario, setHorario] = useState("");
  const [datosClave, setDatosClave] = useState("");
  const [precioRef, setPrecioRef] = useState("");

  const topRef = useRef<HTMLDivElement>(null);

  const irA = (p: number) => {
    setError(null);
    setPaso(p);
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  async function subirArchivos(files: FileList | null, max: number): Promise<string[]> {
    if (!files || files.length === 0 || max <= 0) return [];
    const lista = Array.from(files).slice(0, max);
    setError(null);
    setSubiendo((n) => n + lista.length);
    const urls: string[] = [];
    for (const f of lista) {
      try {
        const comprimida = await comprimirImagenCliente(f, 1600, 0.82);
        const fd = new FormData();
        fd.append("file", comprimida);
        fd.append("website", honeypot);
        const res = await subirFotoRegistroAction(fd);
        if (res.success && res.url) urls.push(res.url);
        else setError(res.error || "No se pudo subir una foto.");
      } catch {
        setError("No se pudo subir una foto. Intenta de nuevo.");
      } finally {
        setSubiendo((n) => Math.max(0, n - 1));
      }
    }
    return urls;
  }

  const actualizarHab = (key: string, cambios: Partial<HabitacionForm>) =>
    setHabitaciones((prev) => prev.map((h) => (h.key === key ? { ...h, ...cambios } : h)));

  function validarPaso2(): string | null {
    if (nombre.trim().length < 2) return "Escribe el nombre comercial de tu negocio.";
    const wa = whatsapp.replace(/\D/g, "");
    if (wa.length < 10) return "Escribe un WhatsApp válido (ej: 300 123 4567).";
    if (descripcion.trim().length < 15) return "Cuéntanos un poco más de tu propuesta (mínimo 15 caracteres).";
    return null;
  }

  function validarPaso3(): string | null {
    if (subiendo > 0) return "Espera a que terminen de subir las fotos.";
    if (tipo === "hospedaje") {
      for (const [i, h] of habitaciones.entries()) {
        if (!h.titulo.trim()) return `Ponle nombre a la habitación #${i + 1}.`;
        if (!(Number(h.precio) > 0)) return `Indica el precio por noche de "${h.titulo || `Habitación #${i + 1}`}".`;
      }
      if (modoHosp === "galeria_y_lista_precios") {
        if (galeriaHosp.length === 0) return "Sube al menos una foto a la galería general.";
      } else if (!habitaciones.some((h) => h.fotos.length > 0)) {
        return "Sube al menos una foto de tus habitaciones.";
      }
    } else if (!fotoPrincipal) {
      return "Sube la foto principal de tu negocio.";
    }
    return null;
  }

  async function enviar() {
    const err = validarPaso3();
    if (err) {
      setError(err);
      return;
    }
    if (!tipo || !zona) return;
    setEnviando(true);
    setError(null);
    const res = await registrarAliadoPublicoAction({
      website: honeypot,
      tipo,
      zonaSlug: zona,
      nombre,
      whatsapp,
      instagram,
      googleMapsUrl: mapsUrl,
      descripcion,
      habitaciones:
        tipo === "hospedaje"
          ? habitaciones.map((h) => ({
              titulo: h.titulo,
              precio_noche_cop: Number(h.precio) || 0,
              capacidad_max: Number(h.capacidad) || 1,
              badges: h.badges,
              fotos: modoHosp === "galeria_y_lista_precios" ? [] : h.fotos,
            }))
          : undefined,
      modoVisualizacion: tipo === "hospedaje" ? modoHosp : undefined,
      galeriaHospedaje:
        tipo === "hospedaje" && modoHosp === "galeria_y_lista_precios" ? galeriaHosp : undefined,
      fotoPrincipal: tipo !== "hospedaje" ? fotoPrincipal : undefined,
      galeria: tipo !== "hospedaje" ? galeria : undefined,
      horario,
      datosClave,
      precioReferencia: Number(precioRef) || 0,
    });
    setEnviando(false);
    if (!res.success) {
      setError(res.error || "No pudimos guardar tu registro.");
      return;
    }
    irA(4);
  }

  const zonaNombre = ZONAS.find((z) => z.id === zona)?.label || "";
  const tipoNombre = TIPOS.find((t) => t.id === tipo)?.label || "";
  const waAdmin = whatsappLink(
    WHATSAPP_CONTACTO,
    `¡Hola PaDónde! 🌿 Acabo de registrar mi negocio *${nombre.trim()}* (${tipoNombre} en ${zonaNombre}) desde el formulario Súmate. Quedo atento a la activación de mi vitrina.`
  );

  return (
    <div ref={topRef} className="space-y-5 scroll-mt-20">
      {/* Honeypot invisible anti-spam */}
      <div aria-hidden="true" className="absolute -left-[9999px] w-px h-px overflow-hidden">
        <label>
          Sitio web
          <input
            type="text"
            tabIndex={-1}
            autoComplete="off"
            value={honeypot}
            onChange={(e) => setHoneypot(e.target.value)}
            name="website"
          />
        </label>
      </div>

      {paso < 4 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold">
            <span>Paso {paso} de 3</span>
            <span className="text-stone">
              {paso === 1 ? "Tipo y zona" : paso === 2 ? "Datos de contacto" : tipo === "hospedaje" ? "Habitaciones" : "Fotos y horarios"}
            </span>
          </div>
          <div className="h-2 rounded-full bg-stone-light/60 overflow-hidden">
            <div
              className="h-full bg-[#1B382B] rounded-full transition-all duration-500"
              style={{ width: `${(paso / 3) * 100}%` }}
            />
          </div>
        </div>
      )}

      {error && (
        <div role="alert" className="p-3 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-sm flex gap-2">
          <span>⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {/* PASO 1 */}
      {paso === 1 && (
        <section className="space-y-6">
          <div>
            <h1 className="font-serif text-2xl font-bold leading-tight">Súmate a PaDónde 🌿</h1>
            <p className="text-sm text-stone mt-1">
              Carga tu ficha en 3 minutos. Sin contraseñas, sin costo. Nuestro equipo la revisa y la publica en 4 idiomas.
            </p>
          </div>

          <div className="space-y-2.5">
            <h2 className="text-sm font-bold">¿Qué tipo de negocio tienes?</h2>
            <div className="grid grid-cols-2 gap-2.5">
              {TIPOS.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTipo(t.id)}
                  aria-pressed={tipo === t.id}
                  className={[
                    "p-4 rounded-3xl border-2 text-left transition-all active:scale-[0.98] cursor-pointer min-h-[120px] flex flex-col justify-between",
                    tipo === t.id
                      ? "border-[#1B382B] bg-[#1B382B] text-[#FBF9F5] shadow-md"
                      : "border-stone-light bg-white hover:border-[#1B382B]/40",
                  ].join(" ")}
                >
                  <span className="text-3xl">{t.emoji}</span>
                  <span>
                    <span className="block font-bold text-sm leading-tight">{t.label}</span>
                    <span className={`block text-[11px] mt-0.5 ${tipo === t.id ? "text-[#FBF9F5]/80" : "text-stone"}`}>
                      {t.hint}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2.5">
            <h2 className="text-sm font-bold">¿Dónde está ubicado?</h2>
            <div className="grid grid-cols-2 gap-2.5">
              {ZONAS.map((z) => (
                <button
                  key={z.id}
                  type="button"
                  onClick={() => setZona(z.id)}
                  aria-pressed={zona === z.id}
                  className={[
                    "py-4 px-3 rounded-3xl border-2 font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98] cursor-pointer",
                    zona === z.id
                      ? "border-[#1B382B] bg-[#1B382B] text-[#FBF9F5] shadow-md"
                      : "border-stone-light bg-white hover:border-[#1B382B]/40",
                  ].join(" ")}
                >
                  <span className="text-xl">{z.emoji}</span>
                  {z.label}
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            disabled={!tipo || !zona}
            onClick={() => irA(2)}
            className="w-full py-4 rounded-2xl bg-[#1B382B] text-[#FBF9F5] font-bold text-[15px] shadow-md disabled:opacity-40 cursor-pointer active:scale-[0.99]"
          >
            Continuar →
          </button>
        </section>
      )}

      {/* PASO 2 */}
      {paso === 2 && (
        <section className="space-y-4">
          <h1 className="font-serif text-2xl font-bold">Datos de contacto</h1>

          <label className="block space-y-1.5">
            <span className="text-sm font-bold">Nombre comercial *</span>
            <input className={inputCls} value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Ej: Eco-Hostal Río Elemento" maxLength={150} />
          </label>

          <label className="block space-y-1.5">
            <span className="text-sm font-bold">WhatsApp de reservas *</span>
            <input className={inputCls} type="tel" inputMode="tel" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="300 123 4567" maxLength={20} />
            <span className="text-[11px] text-stone">Aquí te escribirán los viajeros para reservar.</span>
          </label>

          <label className="block space-y-1.5">
            <span className="text-sm font-bold">Instagram <span className="font-normal text-stone">(opcional)</span></span>
            <input className={inputCls} value={instagram} onChange={(e) => setInstagram(e.target.value)} placeholder="@tu_negocio" maxLength={80} autoCapitalize="none" />
          </label>

          <label className="block space-y-1.5">
            <span className="text-sm font-bold">Enlace de Google Maps <span className="font-normal text-stone">(opcional)</span></span>
            <input className={inputCls} type="url" inputMode="url" value={mapsUrl} onChange={(e) => setMapsUrl(e.target.value)} placeholder="https://maps.app.goo.gl/..." maxLength={500} autoCapitalize="none" />
          </label>

          <label className="block space-y-1.5">
            <span className="text-sm font-bold">Describe tu propuesta *</span>
            <textarea className={`${inputCls} min-h-[110px]`} value={descripcion} onChange={(e) => setDescripcion(e.target.value)} placeholder="¿Qué hace especial tu lugar? Vista, comida, ambiente, experiencias..." maxLength={1200} />
            <span className="text-[11px] text-stone text-right block">{descripcion.length}/1200</span>
          </label>

          <div className="flex gap-2.5 pt-1">
            <button type="button" onClick={() => irA(1)} className="px-5 py-4 rounded-2xl border border-stone-light bg-white font-semibold cursor-pointer">
              ←
            </button>
            <button
              type="button"
              onClick={() => {
                const err = validarPaso2();
                if (err) setError(err);
                else irA(3);
              }}
              className="flex-1 py-4 rounded-2xl bg-[#1B382B] text-[#FBF9F5] font-bold text-[15px] shadow-md cursor-pointer active:scale-[0.99]"
            >
              Continuar →
            </button>
          </div>
        </section>
      )}

      {/* PASO 3 — HOSPEDAJE */}
      {paso === 3 && tipo === "hospedaje" && (
        <section className="space-y-4">
          <div>
            <h1 className="font-serif text-2xl font-bold">Tus habitaciones</h1>
            <p className="text-sm text-stone mt-1">Agrega cada tipo de habitación con su precio y comodidades.</p>
          </div>

          <div className="space-y-2">
            <h2 className="text-sm font-bold">¿Cómo quieres mostrar tus fotos?</h2>
            <div className="grid grid-cols-1 gap-2.5">
              {(
                [
                  {
                    id: "habitaciones_con_fotos",
                    emoji: "🛏️",
                    titulo: "Cada habitación tiene sus propias fotos",
                    desc: "Hasta 5 fotos dentro de cada habitación.",
                  },
                  {
                    id: "galeria_y_lista_precios",
                    emoji: "🖼️",
                    titulo: "Galería general arriba + lista de habitaciones y precios abajo",
                    desc: "Una sola galería (máx. 6 fotos). Más rápido desde el celular.",
                  },
                ] as const
              ).map((op) => (
                <button
                  key={op.id}
                  type="button"
                  onClick={() => setModoHosp(op.id)}
                  aria-pressed={modoHosp === op.id}
                  className={[
                    "p-4 rounded-3xl border-2 text-left flex items-start gap-3 transition-all active:scale-[0.99] cursor-pointer",
                    modoHosp === op.id
                      ? "border-[#1B382B] bg-[#1B382B] text-[#FBF9F5] shadow-md"
                      : "border-stone-light bg-white hover:border-[#1B382B]/40",
                  ].join(" ")}
                >
                  <span className="text-2xl">{op.emoji}</span>
                  <span>
                    <span className="block font-bold text-sm leading-tight">{op.titulo}</span>
                    <span className={`block text-[11px] mt-0.5 ${modoHosp === op.id ? "text-[#FBF9F5]/80" : "text-stone"}`}>
                      {op.desc}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          </div>

          {modoHosp === "galeria_y_lista_precios" && (
            <div className="bg-white rounded-3xl border border-stone-light p-4">
              <FotosPicker
                fotos={galeriaHosp}
                max={6}
                etiqueta="Galería general del hospedaje *"
                onAgregar={async (files) => {
                  const urls = await subirArchivos(files, 6 - galeriaHosp.length);
                  if (urls.length) setGaleriaHosp((prev) => [...prev, ...urls].slice(0, 6));
                }}
                onQuitar={(url) => setGaleriaHosp((prev) => prev.filter((f) => f !== url))}
              />
            </div>
          )}

          {habitaciones.map((h, idx) => (
            <div key={h.key} className="bg-white rounded-3xl border border-stone-light p-4 space-y-3.5 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-stone">🛏️ Habitación #{idx + 1}</span>
                {habitaciones.length > 1 && (
                  <button
                    type="button"
                    onClick={() => setHabitaciones((prev) => prev.filter((x) => x.key !== h.key))}
                    className="text-xs font-semibold text-red-700 px-2.5 py-1 rounded-full bg-red-50 cursor-pointer"
                  >
                    Eliminar
                  </button>
                )}
              </div>

              <input className={inputCls} value={h.titulo} onChange={(e) => actualizarHab(h.key, { titulo: e.target.value })} placeholder="Nombre (ej: Cabaña doble con vista)" maxLength={120} />

              <div className="grid grid-cols-2 gap-2.5">
                <label className="space-y-1">
                  <span className="text-xs font-bold">Precio / noche (COP)</span>
                  <input className={inputCls} type="number" inputMode="numeric" min={0} value={h.precio} onChange={(e) => actualizarHab(h.key, { precio: e.target.value })} placeholder="120000" />
                </label>
                <label className="space-y-1">
                  <span className="text-xs font-bold">Capacidad máx.</span>
                  <input className={inputCls} type="number" inputMode="numeric" min={1} max={30} value={h.capacidad} onChange={(e) => actualizarHab(h.key, { capacidad: e.target.value })} />
                </label>
              </div>

              <div className="space-y-1.5">
                <span className="text-xs font-bold">Comodidades</span>
                <div className="flex flex-wrap gap-2">
                  {BADGES.map((b) => {
                    const on = h.badges.includes(b);
                    return (
                      <button
                        key={b}
                        type="button"
                        aria-pressed={on}
                        onClick={() =>
                          actualizarHab(h.key, { badges: on ? h.badges.filter((x) => x !== b) : [...h.badges, b] })
                        }
                        className={[
                          "px-3 py-2 rounded-full text-xs font-semibold border transition-colors cursor-pointer",
                          on ? "bg-[#1B382B] text-[#FBF9F5] border-[#1B382B]" : "bg-white border-stone-light text-[#1B382B]",
                        ].join(" ")}
                      >
                        {on ? "✓ " : ""}
                        {b}
                      </button>
                    );
                  })}
                </div>
              </div>

              {modoHosp === "habitaciones_con_fotos" && (
              <FotosPicker
                fotos={h.fotos}
                max={5}
                etiqueta="Fotos de la habitación"
                onAgregar={async (files) => {
                  const urls = await subirArchivos(files, 5 - h.fotos.length);
                  if (urls.length) {
                    setHabitaciones((prev) =>
                      prev.map((x) => (x.key === h.key ? { ...x, fotos: [...x.fotos, ...urls].slice(0, 5) } : x))
                    );
                  }
                }}
                onQuitar={(url) => actualizarHab(h.key, { fotos: h.fotos.filter((f) => f !== url) })}
              />
              )}
            </div>
          ))}

          {habitaciones.length < 15 && (
            <button
              type="button"
              onClick={() => setHabitaciones((prev) => [...prev, nuevaHabitacion(prev.length + 1)])}
              className="w-full py-3.5 rounded-2xl border-2 border-dashed border-[#1B382B]/40 text-[#1B382B] font-bold text-sm cursor-pointer bg-white/60"
            >
              + Agregar otra habitación
            </button>
          )}

          <PasoFinalBotones subiendo={subiendo} enviando={enviando} onAtras={() => irA(2)} onEnviar={enviar} />
        </section>
      )}

      {/* PASO 3 — OTRAS CATEGORÍAS */}
      {paso === 3 && tipo !== "hospedaje" && (
        <section className="space-y-4">
          <div>
            <h1 className="font-serif text-2xl font-bold">Fotos y horarios</h1>
            <p className="text-sm text-stone mt-1">Una buena foto principal hace toda la diferencia.</p>
          </div>

          <div className="bg-white rounded-3xl border border-stone-light p-4 space-y-4">
            <FotosPicker
              fotos={fotoPrincipal ? [fotoPrincipal] : []}
              max={1}
              etiqueta="Foto principal *"
              onAgregar={async (files) => {
                const urls = await subirArchivos(files, 1);
                if (urls[0]) setFotoPrincipal(urls[0]);
              }}
              onQuitar={() => setFotoPrincipal("")}
            />
            <FotosPicker
              fotos={galeria}
              max={4}
              etiqueta="Galería (hasta 4 fotos)"
              onAgregar={async (files) => {
                const urls = await subirArchivos(files, 4 - galeria.length);
                if (urls.length) setGaleria((prev) => [...prev, ...urls].slice(0, 4));
              }}
              onQuitar={(url) => setGaleria((prev) => prev.filter((f) => f !== url))}
            />
          </div>

          <label className="block space-y-1.5">
            <span className="text-sm font-bold">Horario de atención</span>
            <input className={inputCls} value={horario} onChange={(e) => setHorario(e.target.value)} placeholder="Ej: Lunes a domingo · 8:00 AM - 9:00 PM" maxLength={200} />
          </label>

          <label className="block space-y-1.5">
            <span className="text-sm font-bold">Precio de referencia (COP) <span className="font-normal text-stone">(opcional)</span></span>
            <input className={inputCls} type="number" inputMode="numeric" min={0} value={precioRef} onChange={(e) => setPrecioRef(e.target.value)} placeholder="Ej: 45000" />
          </label>

          <label className="block space-y-1.5">
            <span className="text-sm font-bold">Datos clave <span className="font-normal text-stone">(opcional)</span></span>
            <textarea className={`${inputCls} min-h-[90px]`} value={datosClave} onChange={(e) => setDatosClave(e.target.value)} placeholder="Platos estrella, duración del tour, qué incluye, punto de encuentro, pet friendly..." maxLength={800} />
          </label>

          <PasoFinalBotones subiendo={subiendo} enviando={enviando} onAtras={() => irA(2)} onEnviar={enviar} />
        </section>
      )}

      {/* PASO 4 — ÉXITO */}
      {paso === 4 && (
        <section className="text-center space-y-5 pt-6">
          <div className="w-20 h-20 rounded-full bg-[#1B382B] text-[#FBF9F5] flex items-center justify-center text-4xl mx-auto shadow-lg">
            🌿
          </div>
          <div className="space-y-2">
            <h1 className="font-serif text-2xl font-bold">¡Gracias, {nombre.trim() || "aliado"}!</h1>
            <p className="text-sm text-stone leading-relaxed max-w-sm mx-auto">
              Recibimos tu registro. El equipo de PaDónde revisará tu información y activará tu vitrina en
              <strong className="text-[#1B382B]"> español, inglés, francés y alemán</strong> muy pronto.
            </p>
          </div>
          <a
            href={waAdmin}
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-center gap-2 w-full py-4 rounded-2xl bg-emerald-600 text-white font-bold text-[15px] shadow-md hover:bg-emerald-700"
          >
            <span>💬</span> Avisar a PaDónde por WhatsApp
          </a>
          <p className="text-[11px] text-stone">Así agilizamos la revisión de tu ficha.</p>
        </section>
      )}
    </div>
  );
}

function PasoFinalBotones({
  subiendo,
  enviando,
  onAtras,
  onEnviar,
}: {
  subiendo: number;
  enviando: boolean;
  onAtras: () => void;
  onEnviar: () => void;
}) {
  return (
    <div className="flex gap-2.5 pt-1">
      <button type="button" onClick={onAtras} disabled={enviando} className="px-5 py-4 rounded-2xl border border-stone-light bg-white font-semibold cursor-pointer">
        ←
      </button>
      <button
        type="button"
        onClick={onEnviar}
        disabled={enviando || subiendo > 0}
        className="flex-1 py-4 rounded-2xl bg-[#C2622D] text-white font-bold text-[15px] shadow-md disabled:opacity-50 cursor-pointer active:scale-[0.99]"
      >
        {enviando ? "Enviando..." : subiendo > 0 ? `Subiendo fotos (${subiendo})...` : "Enviar registro ✓"}
      </button>
    </div>
  );
}

function FotosPicker({
  fotos,
  max,
  etiqueta,
  onAgregar,
  onQuitar,
}: {
  fotos: string[];
  max: number;
  etiqueta: string;
  onAgregar: (files: FileList | null) => Promise<void>;
  onQuitar: (url: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [cargando, setCargando] = useState(false);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold">{etiqueta}</span>
        <span className="text-[11px] text-stone">
          {fotos.length}/{max}
        </span>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {fotos.map((url) => (
          <div key={url} className="relative aspect-square rounded-2xl overflow-hidden bg-stone-100 border border-stone-light">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt="" className="w-full h-full object-cover" loading="lazy" />
            <button
              type="button"
              onClick={() => onQuitar(url)}
              aria-label="Quitar foto"
              className="absolute top-1 right-1 w-7 h-7 rounded-full bg-black/60 text-white text-xs flex items-center justify-center cursor-pointer"
            >
              ✕
            </button>
          </div>
        ))}
        {fotos.length < max && (
          <button
            type="button"
            disabled={cargando}
            onClick={() => inputRef.current?.click()}
            className="aspect-square rounded-2xl border-2 border-dashed border-stone-light bg-cream/40 flex flex-col items-center justify-center text-stone text-xs font-semibold gap-1 cursor-pointer disabled:opacity-60"
          >
            {cargando ? (
              <span className="animate-pulse">Subiendo...</span>
            ) : (
              <>
                <span className="text-2xl">📷</span>
                <span>Agregar</span>
              </>
            )}
          </button>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple={max > 1}
        className="hidden"
        onChange={async (e) => {
          const files = e.target.files;
          setCargando(true);
          await onAgregar(files);
          setCargando(false);
          e.target.value = "";
        }}
      />
    </div>
  );
}
