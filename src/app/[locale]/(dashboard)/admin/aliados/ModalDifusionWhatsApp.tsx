"use client";

import { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/Button";
import type { AliadoItem } from "./AdminAliadosList";

interface ModalDifusionWhatsAppProps {
  aliados: AliadoItem[];
}

type TipoCampana = "restaurantes" | "hospedajes" | "personalizado";

export function ModalDifusionWhatsApp({ aliados }: ModalDifusionWhatsAppProps) {
  const [abierto, setAbierto] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Filtros
  const [filtroZona, setFiltroZona] = useState<string>("todas");
  const [tipoCampana, setTipoCampana] = useState<TipoCampana>("restaurantes");
  const [busqueda, setBusqueda] = useState<string>("");

  // Registro de aliados contactados en la sesión (IDs)
  const [contactados, setContactados] = useState<Record<string, boolean>>({});

  // IDs de aliados seleccionados con checkbox
  const [seleccionados, setSeleccionados] = useState<Record<string, boolean>>({});

  // Feedback de copiado rápido
  const [copiadoId, setCopiadoId] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    // Cargar historial de contactados de sessionStorage
    try {
      const guardado = sessionStorage.getItem("padonde_difusion_contactados");
      if (guardado) {
        setContactados(JSON.parse(guardado));
      }
    } catch {}
  }, []);

  // Bloquear scroll de la página cuando el modal esté abierto
  useEffect(() => {
    if (abierto) {
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prevOverflow;
      };
    }
  }, [abierto]);

  // Cerrar con Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setAbierto(false);
    };
    if (abierto) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [abierto]);

  // Plantillas oficiales predefinidas
  const plantillasDefault: Record<TipoCampana, string> = {
    restaurantes: `🌿 *Hola {nombre}, ¡un saludo muy especial desde el equipo de PaDónde!*

Queremos contarte que a partir del *1 de noviembre* iniciamos el nuevo ciclo de suscripción trimestral de visibilidad en la cartelera turística de {zona} por un valor de *$125.000 COP el trimestre* (es decir, menos de $42.000 al mes), manteniendo a tu restaurante visible ante miles de viajeros y turistas que visitan la región buscando dónde comer y pasar un buen rato.

💡 *Tenemos una súper recomendación para potenciar tus ventas esta temporada:*

Habilitamos la opción de integrar tu *Menú Digital Interactivo* dentro de PaDónde con un beneficio doble:

📲 *1. El turista ve tu carta desde antes:* Los viajeros pueden antojarse y revisar tus platos, cócteles y fotos directamente desde su hostal o casa antes de salir.
🪑 *2. Menú y Calificaciones directas en mesa:* Te entregamos *stickers con código QR resistentes para tus mesas*. Cuando el comensal llega, solo escanea el QR con su celular y tiene el menú digital al instante.
⭐ *3. Reseñas 5 Estrellas en Google sin rodeos:* Al final del menú digital dejamos un botón directo que lleva al cliente a calificar tu restaurante en Google Maps en 1 solo clic, aumentando tus estrellas y reputación en internet en tiempo récord.

🔗 *Mira aquí cómo funciona el ejemplo real de Pepe Mojito Bar:*
👉 https://www.padonde.lat/es/mendihuaca/0274476c-aa64-42d9-9cbc-1e0a41940c2d
*(Entra al enlace, mira cómo se despliega la carta y prueba el botón que lleva directo a calificar).*

🎁 *¿Cuánto cuesta activar el Menú Digital?*
Es un único pago de *$50.000 COP* e incluye:
• Publicación y habilitación de tu carta en la plataforma (solo nos envías las fotos o archivo actual de tu menú por WhatsApp y nosotros te lo dejamos enlazado y visible).
• El paquete de stickers con código QR listos para colocar en tus mesas.
• El archivo digital en alta resolución del código QR por si más adelante deseas mandar a hacer habladores en madera, acrílico o piezas especiales para tu barra.

👉 *¿Te gustaría que te incluyamos el Menú Digital con tus stickers para arrancar este 1 de noviembre junto con tu trimestre?*

¡Quedamos muy atentos al envío del archivo o foto del menú! ✨🍽️`,

    hospedajes: `🌿 *Hola {nombre}, ¡un saludo muy especial desde el equipo de PaDónde!*

Queremos comunicarles que la propuesta de PaDónde ha escalado rápidamente y ya se encuentra abriendo mercado en Mendihuaca y próximamente Tairona. Para poder mantener esta iniciativa y trabajar para favorecer el turismo en el caso de ustedes la prueba *100% gratuita corre libre de costo hasta el 31 de Octubre*.

🌟 *El valor directo para {nombre}:*
• *0% de comisiones por reserva:* El huésped les escribe y cotiza directo a su WhatsApp (se ahorran el 18% al 20% que descuentan Booking o Airbnb).
• *Catálogo global en 4 idiomas:* Su hospedaje se presenta automáticamente en Español, Inglés, Francés y Alemán (ES / EN / FR / DE) para captar al viajero extranjero.
• *Presencia fija 24/7:* Indexados en la vitrina oficial recomendada de alojamientos de {zona}.

🗓️ *Reglas claras de activación:*
• Su periodo de cortesía corre libre de costo hasta el 31 de Octubre.
• A partir del 1 de Noviembre, formalizamos su presencia para toda la temporada con nuestro Plan Trimestral (asociado a su capacidad de habitaciones o cabañas):

*Los pagos son trimestrales de la siguiente forma:*
🏨 1 a 5 habitaciones: $125.000 COP (menos de $1.400 al día)
🏨 6 a 10 habitaciones: $200.000 COP
🏨 11 a 20 habitaciones: $300.000 COP
🏨 Más de 20 habitaciones: $400.000 COP

💡 *Con 1 sola noche de habitación reservada directo a su WhatsApp en los 3 meses, ya se ahorran más comisiones de Booking que el costo total de la plataforma.*

🎉 *Difusión de Eventos y Actividades:*
Si organizan noches acústicas, yoga, sunsets o eventos abiertos:
• 1 evento puntual: $30.000 COP (activo toda su semana de promoción).
• Agenda Semanal Completa (hasta 3 eventos en la semana): $50.000 COP.
*(Incluye flyer, fecha, horarios, fotos y botón directo a su WhatsApp).*

Por favor confírmanos por aquí el número de habitaciones de {nombre} para coordinar los datos de transferencia y asegurar su presencia destacada para toda la temporada alta. ¡Muchos éxitos en sus reservas! 🏡✨`,

    personalizado: `🌿 *Hola {nombre}, te escribimos del equipo de PaDónde ({zona}).*

A partir del 1 de noviembre iniciamos el ciclo de renovación trimestral para la temporada alta por valor de $125.000 COP.

¿Te gustaría que coordinemos los datos para mantener tu negocio visible ante los turistas? Quedamos muy atentos.`,
  };

  // Texto editable actual
  const [textoPlantilla, setTextoPlantilla] = useState<string>(plantillasDefault.restaurantes);

  // Al cambiar de tipo de campaña, actualizar el texto con la plantilla correspondiente
  const handleCambiarTipoCampana = (nuevoTipo: TipoCampana) => {
    setTipoCampana(nuevoTipo);
    setTextoPlantilla(plantillasDefault[nuevoTipo]);
  };

  // Clasificador de negocio por categoría
  const esRestaurante = (a: AliadoItem) => {
    const cat = (a.categoria || "").toLowerCase();
    const nom = (a.nombre || "").toLowerCase();
    return (
      cat.includes("comida") ||
      cat.includes("restaurante") ||
      cat.includes("bar") ||
      cat.includes("café") ||
      cat.includes("cafe") ||
      cat.includes("gastronom") ||
      nom.includes("restaurante") ||
      nom.includes("bar") ||
      nom.includes("cafe")
    );
  };

  const esHospedaje = (a: AliadoItem) => {
    const cat = (a.categoria || "").toLowerCase();
    const nom = (a.nombre || "").toLowerCase();
    return (
      cat.includes("hospedaje") ||
      cat.includes("hostal") ||
      cat.includes("hotel") ||
      cat.includes("glamping") ||
      cat.includes("cabaña") ||
      cat.includes("finca") ||
      nom.includes("hostel") ||
      nom.includes("hostal") ||
      nom.includes("hotel") ||
      nom.includes("finca") ||
      nom.includes("glamping") ||
      nom.includes("cabañas")
    );
  };

  // Filtrado de aliados aplicable a la campaña
  const aliadosFiltrados = useMemo(() => {
    return aliados.filter((a) => {
      // 1. Filtro por Zona
      if (filtroZona !== "todas" && (a.zonaSlug || "minca") !== filtroZona) {
        return false;
      }

      // 2. Filtro por Tipo de Campaña
      if (tipoCampana === "restaurantes" && !esRestaurante(a)) {
        return false;
      }
      if (tipoCampana === "hospedajes" && !esHospedaje(a)) {
        return false;
      }

      // 3. Filtro por búsqueda
      const q = busqueda.trim().toLowerCase();
      if (!q) return true;
      return (
        a.nombre.toLowerCase().includes(q) ||
        a.whatsapp.includes(q) ||
        (a.categoria || "").toLowerCase().includes(q)
      );
    });
  }, [aliados, filtroZona, tipoCampana, busqueda]);

  // Inicializar selección de checkboxes cuando cambie el filtro
  useEffect(() => {
    const nuevaSel: Record<string, boolean> = {};
    for (const a of aliadosFiltrados) {
      nuevaSel[a.id] = true;
    }
    setSeleccionados(nuevaSel);
  }, [aliadosFiltrados]);

  // Función para personalizar el mensaje para un aliado específico
  const compilarMensaje = (aliado: AliadoItem) => {
    const zonaNombre =
      aliado.zonaNombre || (aliado.zonaSlug === "mendihuaca" ? "Mendihuaca" : "Minca");
    return textoPlantilla
      .replace(/\{nombre\}/g, aliado.nombre.trim())
      .replace(/\{zona\}/g, zonaNombre)
      .replace(/\{whatsapp\}/g, aliado.whatsapp);
  };

  // Enviar por WhatsApp
  const handleEnviarWhatsApp = (aliado: AliadoItem) => {
    const cleanWa = aliado.whatsapp.replace(/\D/g, "");
    if (!cleanWa) {
      alert(`El aliado ${aliado.nombre} no tiene un número de WhatsApp válido registrado.`);
      return;
    }
    const fullWa = cleanWa.startsWith("57") ? cleanWa : `57${cleanWa}`;
    const mensaje = compilarMensaje(aliado);
    const url = `https://wa.me/${fullWa}?text=${encodeURIComponent(mensaje)}`;

    // Marcar como contactado
    const nuevosContactados = { ...contactados, [aliado.id]: true };
    setContactados(nuevosContactados);
    try {
      sessionStorage.setItem(
        "padonde_difusion_contactados",
        JSON.stringify(nuevosContactados)
      );
    } catch {}

    window.open(url, "_blank", "noopener,noreferrer");
  };

  // Copiar mensaje personalizado
  const handleCopiarMensaje = (aliado: AliadoItem) => {
    const mensaje = compilarMensaje(aliado);
    navigator.clipboard.writeText(mensaje).then(() => {
      setCopiadoId(aliado.id);
      setTimeout(() => setCopiadoId(null), 2000);
    });
  };

  // Alternar selección de todos
  const toggleSeleccionarTodos = () => {
    const todosSeleccionados = aliadosFiltrados.every((a) => seleccionados[a.id]);
    const nuevaSel: Record<string, boolean> = {};
    for (const a of aliadosFiltrados) {
      nuevaSel[a.id] = !todosSeleccionados;
    }
    setSeleccionados(nuevaSel);
  };

  // Conteo de seleccionados y contactados
  const totalEnLista = aliadosFiltrados.length;
  const totalSeleccionados = aliadosFiltrados.filter((a) => seleccionados[a.id]).length;
  const totalContactados = aliadosFiltrados.filter(
    (a) => seleccionados[a.id] && contactados[a.id]
  ).length;

  return (
    <>
      {/* Botón Disparador en el Panel */}
      <Button
        onClick={() => setAbierto(true)}
        className="w-full h-full bg-emerald-700 hover:bg-emerald-800 text-white font-semibold py-2 px-3 text-xs rounded-xl shadow-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-95 whitespace-nowrap"
      >
        <span>📢</span>
        <span>Difusión & Cobro</span>
        <span className="bg-white/20 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">
          1 Nov
        </span>
      </Button>

      {/* Modal Pantalla Completa / Drawer */}
      {abierto &&
        mounted &&
        createPortal(
          <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
            <div className="bg-white w-full max-w-5xl max-h-[92vh] rounded-2xl sm:rounded-3xl shadow-2xl border border-stone-light flex flex-col overflow-hidden">
              {/* Header del Modal */}
              <div className="p-4 sm:p-5 bg-stone-50 border-b border-stone-light/80 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center text-lg shrink-0">
                    📢
                  </div>
                  <div>
                    <h2 className="font-serif text-lg sm:text-xl text-forest font-bold leading-tight">
                      Centro de Difusión & Cobro Masivo por WhatsApp
                    </h2>
                    <p className="text-xs text-stone mt-0.5">
                      Envía mensajes personalizados a cada aliado con 1 solo clic sin riesgo de bloqueo
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setAbierto(false)}
                  className="w-8 h-8 rounded-full bg-stone-200/70 hover:bg-stone-300 text-stone-dark flex items-center justify-center text-sm font-bold cursor-pointer transition-colors"
                >
                  ✕
                </button>
              </div>

              {/* Contenido scrolleable */}
              <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1">
                {/* Paso 1: Filtros de Región y Tipo de Aliado */}
                <div className="bg-cream/50 p-3.5 sm:p-4 rounded-2xl border border-stone-light/80 space-y-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <span className="text-xs font-bold text-forest uppercase tracking-wider">
                      1. Filtra tu audiencia de aliados
                    </span>
                    <span className="text-xs text-stone">
                      Mostrando <strong>{totalEnLista}</strong> aliados encontrados
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Selector de Tipo de Campaña / Categoría */}
                    <div>
                      <label className="block text-[11px] font-bold text-stone mb-1 uppercase tracking-wide">
                        Tipo de Negocio
                      </label>
                      <div className="grid grid-cols-3 gap-1.5 bg-white p-1 rounded-xl border border-stone-light">
                        <button
                          type="button"
                          onClick={() => handleCambiarTipoCampana("restaurantes")}
                          className={`py-1.5 px-2 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                            tipoCampana === "restaurantes"
                              ? "bg-forest text-white shadow-xs"
                              : "text-stone hover:text-forest"
                          }`}
                        >
                          🍽️ Restaurantes
                        </button>
                        <button
                          type="button"
                          onClick={() => handleCambiarTipoCampana("hospedajes")}
                          className={`py-1.5 px-2 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                            tipoCampana === "hospedajes"
                              ? "bg-forest text-white shadow-xs"
                              : "text-stone hover:text-forest"
                          }`}
                        >
                          🏡 Hospedajes
                        </button>
                        <button
                          type="button"
                          onClick={() => handleCambiarTipoCampana("personalizado")}
                          className={`py-1.5 px-2 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                            tipoCampana === "personalizado"
                              ? "bg-forest text-white shadow-xs"
                              : "text-stone hover:text-forest"
                          }`}
                        >
                          📝 Todos / Libre
                        </button>
                      </div>
                    </div>

                    {/* Selector de Región */}
                    <div>
                      <label className="block text-[11px] font-bold text-stone mb-1 uppercase tracking-wide">
                        Región / Destino
                      </label>
                      <div className="grid grid-cols-3 gap-1.5 bg-white p-1 rounded-xl border border-stone-light">
                        <button
                          type="button"
                          onClick={() => setFiltroZona("todas")}
                          className={`py-1.5 px-2 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                            filtroZona === "todas"
                              ? "bg-forest text-white shadow-xs"
                              : "text-stone hover:text-forest"
                          }`}
                        >
                          🌐 Todas
                        </button>
                        <button
                          type="button"
                          onClick={() => setFiltroZona("minca")}
                          className={`py-1.5 px-2 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                            filtroZona === "minca"
                              ? "bg-forest text-white shadow-xs"
                              : "text-stone hover:text-forest"
                          }`}
                        >
                          🌿 Minca
                        </button>
                        <button
                          type="button"
                          onClick={() => setFiltroZona("mendihuaca")}
                          className={`py-1.5 px-2 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                            filtroZona === "mendihuaca"
                              ? "bg-forest text-white shadow-xs"
                              : "text-stone hover:text-forest"
                          }`}
                        >
                          🌊 Mendihuaca
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Buscador de texto en vivo */}
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-xs text-stone">🔍</span>
                    <input
                      type="text"
                      placeholder="Buscar por nombre de negocio o teléfono..."
                      value={busqueda}
                      onChange={(e) => setBusqueda(e.target.value)}
                      className="w-full pl-8 pr-3 py-2 bg-white text-xs rounded-xl border border-stone-light/90 focus:outline-none focus:border-forest/60"
                    />
                  </div>
                </div>

                {/* Paso 2: Plantilla del Mensaje (Editable con variables automáticas) */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-forest uppercase tracking-wider">
                        2. Plantilla de Mensaje
                      </span>
                      <span className="text-[10px] bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-full font-medium">
                        Variables: {"{nombre}"}, {"{zona}"}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setTextoPlantilla(plantillasDefault[tipoCampana])}
                      className="text-[11px] text-stone hover:text-forest underline cursor-pointer"
                    >
                      Restablecer texto original
                    </button>
                  </div>
                  <textarea
                    rows={6}
                    value={textoPlantilla}
                    onChange={(e) => setTextoPlantilla(e.target.value)}
                    className="w-full p-3 bg-stone-50 text-xs font-sans text-stone-dark rounded-xl border border-stone-light focus:outline-none focus:border-forest/60 focus:bg-white leading-relaxed resize-y"
                    placeholder="Escribe el mensaje..."
                  />
                  <p className="text-[11px] text-stone">
                    💡 Cada vez que toques en <strong>Enviar</strong>, el sistema reemplazará{" "}
                    <code>{"{nombre}"}</code> por el nombre real del negocio (ej: <em>Finca La Frecuencia</em>) y{" "}
                    <code>{"{zona}"}</code> por su destino.
                  </p>
                </div>

                {/* Paso 3: Lista de Aliados con Botón de Envío Directo */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between flex-wrap gap-2 pt-2 border-t border-stone-light">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={toggleSeleccionarTodos}
                        className="text-xs font-bold text-forest hover:underline cursor-pointer flex items-center gap-1.5"
                      >
                        <span className="text-sm">
                          {aliadosFiltrados.every((a) => seleccionados[a.id]) ? "☑" : "☐"}
                        </span>
                        <span>Seleccionar Todos ({totalEnLista})</span>
                      </button>
                      <span className="text-xs text-stone">|</span>
                      <span className="text-xs text-emerald-800 font-semibold">
                        {totalContactados} de {totalSeleccionados} contactados (
                        {totalSeleccionados > 0
                          ? Math.round((totalContactados / totalSeleccionados) * 100)
                          : 0}
                        %)
                      </span>
                    </div>

                    {/* Barra de progreso visual */}
                    <div className="w-32 sm:w-48 bg-stone-200 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-emerald-600 h-full transition-all duration-300"
                        style={{
                          width: `${
                            totalSeleccionados > 0
                              ? (totalContactados / totalSeleccionados) * 100
                              : 0
                          }%`,
                        }}
                      />
                    </div>
                  </div>

                  {/* Listado de Tarjetas de Aliados */}
                  {aliadosFiltrados.length === 0 ? (
                    <div className="p-8 text-center bg-stone-50 rounded-2xl border border-dashed border-stone-light">
                      <p className="text-sm text-stone font-sans">
                        No se encontraron aliados que coincidan con estos filtros.
                      </p>
                    </div>
                  ) : (
                    <div className="divide-y divide-stone-light/70 max-h-[380px] overflow-y-auto pr-1">
                      {aliadosFiltrados.map((aliado) => {
                        const fueContactado = Boolean(contactados[aliado.id]);
                        const estaSeleccionado = Boolean(seleccionados[aliado.id]);
                        const cleanWa = aliado.whatsapp.replace(/\D/g, "");

                        return (
                          <div
                            key={aliado.id}
                            className={`py-3 px-2 sm:px-3 flex items-center justify-between gap-3 transition-colors rounded-xl ${
                              fueContactado
                                ? "bg-emerald-50/50 hover:bg-emerald-50"
                                : "hover:bg-stone-50"
                            }`}
                          >
                            {/* Checkbox + Datos del Aliado */}
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                              <input
                                type="checkbox"
                                checked={estaSeleccionado}
                                onChange={(e) =>
                                  setSeleccionados({
                                    ...seleccionados,
                                    [aliado.id]: e.target.checked,
                                  })
                                }
                                className="w-4 h-4 rounded text-forest focus:ring-forest cursor-pointer shrink-0"
                              />
                              <div className="min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <p className="font-bold text-xs sm:text-sm text-forest truncate">
                                    {aliado.nombre}
                                  </p>
                                  <span className="text-[10px] bg-stone-100 text-stone-700 px-1.5 py-0.2 rounded font-medium">
                                    {aliado.categoria}
                                  </span>
                                  <span className="text-[10px] bg-emerald-50 text-emerald-800 px-1.5 py-0.2 rounded font-medium">
                                    {aliado.zonaSlug === "mendihuaca" ? "🌊 Mendihuaca" : "🌿 Minca"}
                                  </span>
                                </div>
                                <p className="text-[11px] text-stone mt-0.5 flex items-center gap-2">
                                  <span>📲 +{cleanWa}</span>
                                  {fueContactado && (
                                    <span className="text-emerald-700 font-bold text-[10px]">
                                      ✓ Contactado
                                    </span>
                                  )}
                                </p>
                              </div>
                            </div>

                            {/* Botones de Acción */}
                            <div className="flex items-center gap-1.5 shrink-0">
                              <button
                                type="button"
                                onClick={() => handleCopiarMensaje(aliado)}
                                title="Copiar mensaje personalizado"
                                className="p-2 text-xs rounded-lg border border-stone-light hover:bg-white text-stone hover:text-forest cursor-pointer transition-colors"
                              >
                                {copiadoId === aliado.id ? "✓ Copiado" : "📋 Copiar"}
                              </button>

                              <button
                                type="button"
                                onClick={() => handleEnviarWhatsApp(aliado)}
                                className={`py-1.5 px-3 text-xs font-semibold rounded-xl flex items-center gap-1.5 cursor-pointer shadow-2xs transition-all active:scale-95 ${
                                  fueContactado
                                    ? "bg-emerald-100 text-emerald-900 border border-emerald-300 hover:bg-emerald-200"
                                    : "bg-emerald-600 hover:bg-emerald-700 text-white"
                                }`}
                              >
                                <span>📲</span>
                                <span>
                                  {fueContactado ? "Volver a Enviar" : "Enviar WhatsApp"}
                                </span>
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Footer del Modal */}
              <div className="p-3.5 sm:p-4 bg-stone-50 border-t border-stone-light/80 flex items-center justify-between text-xs text-stone">
                <span>
                  Tip: Cada clic abre WhatsApp directamente listo para tocar &quot;Enviar&quot;.
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setAbierto(false)}
                  className="cursor-pointer"
                >
                  Cerrar
                </Button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
