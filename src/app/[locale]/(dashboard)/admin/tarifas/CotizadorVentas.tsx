"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/Button";

type CategoriaNegocio =
  | "hospedaje"
  | "gastronomia"
  | "tours"
  | "servicios"
  | "cultural";

type RangoHabitaciones = "hasta_5" | "6_a_10" | "11_a_20" | "mas_20";
type TipoGastro = "cafe" | "restaurante_bar";
type TipoServicio = "privado" | "comunitario";

export function CotizadorVentas() {
  // Estado principal de navegación
  const [categoria, setCategoria] = useState<CategoriaNegocio>("hospedaje");
  const [vistaTabla, setVistaTabla] = useState(false);

  // Estados específicos para Hospedajes
  const [rangoHabs, setRangoHabs] = useState<RangoHabitaciones>("hasta_5");
  const [esHibrido, setEsHibrido] = useState(false);
  const [precioNocheSimulador, setPrecioNocheSimulador] = useState(80000);

  // Estados específicos para Gastronomía
  const [tipoGastro, setTipoGastro] = useState<TipoGastro>("restaurante_bar");

  // Estados específicos para Servicios
  const [tipoServicio, setTipoServicio] = useState<TipoServicio>("privado");

  // Estados para envío por WhatsApp
  const [nombreNegocio, setNombreNegocio] = useState("");
  const [nombreContacto, setNombreContacto] = useState("");
  const [telefonoWhatsApp, setTelefonoWhatsApp] = useState("");
  const [copiado, setCopiado] = useState(false);

  // Cálculo de Precios y Detalles del Plan Seleccionado
  const planInfo = useMemo(() => {
    if (categoria === "hospedaje") {
      let mensual = 50000;
      let trimestral = 125000;
      let ahorro = 25000;
      let subtitulo = "Hasta 5 habitaciones";

      if (rangoHabs === "6_a_10") {
        mensual = 80000;
        trimestral = 200000;
        ahorro = 40000;
        subtitulo = "De 6 a 10 habitaciones";
      } else if (rangoHabs === "11_a_20") {
        mensual = 120000;
        trimestral = 300000;
        ahorro = 60000;
        subtitulo = "De 11 a 20 habitaciones";
      } else if (rangoHabs === "mas_20") {
        mensual = 160000;
        trimestral = 400000;
        ahorro = 80000;
        subtitulo = "Más de 20 habitaciones";
      }

      if (esHibrido) {
        mensual += 40000;
        trimestral += 100000;
        ahorro += 20000;
        subtitulo += " + Módulo de Eventos/Bar Activo (Combo)";
      }

      const comisionBookingPorNoche = precioNocheSimulador * 0.18;
      const nochesParaPagarSuscripcion = Math.max(
        1,
        Math.ceil(mensual / comisionBookingPorNoche)
      );

      return {
        titulo: "Hospedaje & Hostales",
        subtitulo,
        mensual,
        trimestral,
        ahorro,
        pitch: `Booking y Airbnb te quitan entre el 15% y 18% de comisión en CADA noche. Con apenas ${nochesParaPagarSuscripcion} noche(s) directa(s) al mes por nuestro WhatsApp, la plataforma se paga sola y todo lo demás es ganancia limpia para ti.`,
        beneficios: [
          "Ficha multihabitación completa con fotos, amenidades y video/reel",
          "Pre-cotizador interactivo de noches y huéspedes en tiempo real",
          "Botón de reserva directa a tu WhatsApp (0% comisión a intermediarios)",
          "Ubicación en el mapa de Minca y catálogo de hospedajes",
          esHibrido
            ? "Módulo de EVENTOS ILIMITADOS en la cartelera diaria (música, DJ sets, catas)"
            : "Opción de sumar eventos con tarifa preferencial",
        ],
        roiText: `Si una noche en tu hostal vale $${precioNocheSimulador.toLocaleString("es-CO")} COP, Booking te quita $${Math.round(comisionBookingPorNoche).toLocaleString("es-CO")} COP de comisión por noche. Con solo ${nochesParaPagarSuscripcion} noche(s) directa(s) al mes ahorras $${Math.round(comisionBookingPorNoche * nochesParaPagarSuscripcion).toLocaleString("es-CO")} COP. ¡La suscripción de $${mensual.toLocaleString("es-CO")} COP se paga sola!`,
      };
    }

    if (categoria === "gastronomia") {
      if (tipoGastro === "cafe") {
        return {
          titulo: "Café de Especialidad / Tienda Local",
          subtitulo: "Cafés, repostería y locales boutique",
          mensual: 35000,
          trimestral: 90000,
          ahorro: 15000,
          pitch:
            "El turista que camina por Minca buscando buen café, postre o wifi te encuentra al instante con fotos, menú y ubicación. Menos de $1.200 COP al día.",
          beneficios: [
            "Ficha destacada en la app con fotos WebP y video reel",
            "Enlace directo a tu Menú Digital o catálogo de especialidades",
            "Botón directo de WhatsApp para pedidos o preguntas",
            "Enlace a tu Instagram oficial",
            "Ubicación exacta y horarios de atención actualizados",
          ],
          roiText:
            "Con la venta de apenas 3 o 4 cafés o un postre al mes, ya cubres la mensualidad completa.",
        };
      }

      return {
        titulo: "Restaurante / Bar / Gastrobar (Con Eventos)",
        subtitulo: "Comida, cócteles y eventos nocturnos",
        mensual: 50000,
        trimestral: 125000,
        ahorro: 25000,
        pitch:
          "El turista que llega a Minca a las 6:00 PM no sabe dónde cenar ni qué bar tiene ambiente hoy. Con una sola mesa de 2 personas que venga por vernos en la app, ya libraste la mensualidad.",
        beneficios: [
          "Ficha completa de restaurante con fotos, menú y ubicación",
          "Publicación de EVENTOS ILIMITADOS en la cartelera diaria de Minca",
          "Soporte para videos y reels verticales de tus eventos o ambiente",
          "Insignia destacada en la sección de gastronomía",
          "Botón de reservas directas a tu WhatsApp",
        ],
        roiText:
          "Una cuenta promedio de 2 platos o 4 cócteles deja más de $50.000 COP de margen. Una sola visita te paga el mes entero.",
      };
    }

    if (categoria === "tours") {
      return {
        titulo: "Tours, Guías & Experiencias",
        subtitulo: "Cacao, café, aves, cascadas y aventura",
        mensual: 50000,
        trimestral: 125000,
        ahorro: 25000,
        pitch:
          "Las agencias de Santa Marta te quitan el 20% al 30% por mandarte turistas. En Pa' Donde el contacto va directo a tu WhatsApp sin intermediarios. Con 1 solo cliente que te compre un tour al mes, ya tienes ganancia limpia.",
        beneficios: [
          "Ficha de experiencia con fotos, videos/reels y qué incluye",
          "Botón de cotización y reserva directa al WhatsApp del guía",
          "Sin comisiones por turista (tú cobras el 100% de tus tours)",
          "Publicación destacada en la cartelera de actividades semanales",
          "Respaldo como guía o experiencia verificada en Minca",
        ],
        roiText:
          "Si tu tour vale entre $60.000 y $120.000 COP por persona, un solo turista que te escriba directo cubre la mensualidad y te deja ganancia.",
      };
    }

    if (categoria === "servicios") {
      if (tipoServicio === "comunitario") {
        return {
          titulo: "Servicios Públicos / Emergencias / Salud",
          subtitulo: "Puesto de salud, policía, cajeros, bomberos",
          mensual: 0,
          trimestral: 0,
          ahorro: 0,
          pitch:
            "Es un servicio 100% gratuito por vocación comunitaria para que el turista tenga la seguridad y tranquilidad de viajar a Minca.",
          beneficios: [
            "Presencia permanente en la sección de Servicios Esenciales",
            "Teléfono de contacto de emergencia con llamada a 1 toque",
            "Ubicación en el mapa para turistas",
            "Cero costo de afiliación o mantenimiento",
          ],
          roiText: "Servicio comunitario sin costo comercial.",
        };
      }

      return {
        titulo: "Comercio Local / Transporte Privado",
        subtitulo: "Lavanderías, moto-taxis, tiendas, farmacias",
        mensual: 25000,
        trimestral: 60000,
        ahorro: 15000,
        pitch:
          "Cuesta menos de $1.000 COP al día. Cada vez que un turista en Minca necesita una moto para subir a las cascadas, lavar su ropa o comprar en farmacia, te encuentra de primero en su celular.",
        beneficios: [
          "Ficha en la sección de Servicios Esenciales de Minca",
          "Botón directo de llamada telefónica y WhatsApp",
          "Horarios de atención y ubicación clara para el viajero",
          "Presencia garantizada en la app sin importar la temporada",
        ],
        roiText:
          "Una sola carrera de moto o un servicio de lavandería ($25.000 COP) paga el mes completo de publicidad.",
      };
    }

    // Cultural / Social
    return {
      titulo: "Aliado Cultural & Comunitario",
      subtitulo: "Cine comunitario, talleres libres, ecología",
      mensual: 0,
      trimestral: 0,
      ahorro: 0,
      pitch:
        "Apoyamos el arte, la cultura y la conservación de la Sierra Nevada. Publicamos tus actividades comunitarias sin costo comercial a cambio de alianza y visibilidad mutua.",
      beneficios: [
        "Publicación gratuita de eventos culturales y proyecciones",
        "Ficha como Aliado Cultural oficial de Minca",
        "Contraprestación: Colocar sticker/placa con código QR en tu espacio",
      ],
      roiText: "100% Gratuito mediante alianza de difusión cultural.",
    };
  }, [
    categoria,
    rangoHabs,
    esHibrido,
    precioNocheSimulador,
    tipoGastro,
    tipoServicio,
  ]);

  // Mensaje generado para enviar por WhatsApp
  const mensajeWhatsApp = useMemo(() => {
    const saludo = nombreContacto ? `Hola ${nombreContacto}` : "Hola";
    const negocio = nombreNegocio ? ` para *${nombreNegocio}*` : "";

    if (planInfo.mensual === 0) {
      return (
        `🌿 *Alianza Cultural y Comunitaria — Pa' Donde Minca* 🌿\n\n` +
        `${saludo}, qué gusto saludarte.\n\n` +
        `Te comparto la propuesta que conversamos${negocio}:\n\n` +
        `🤝 *Plan:* ${planInfo.titulo}\n` +
        `💰 *Tarifa:* $0 COP (100% Gratuito por Alianza)\n\n` +
        `✨ *Beneficios incluidos:*\n` +
        planInfo.beneficios.map((b) => `• ${b}`).join("\n") +
        `\n\n📲 Conoce la plataforma en vivo: https://www.padonde.lat/minca\n\n` +
        `¡Quedamos atentos para activar tu espacio en la app! 🚀`
      );
    }

    return (
      `🌿 *Propuesta Especial Pa' Donde Minca* 🌿\n\n` +
      `${saludo}, qué gusto saludarte.\n\n` +
      `Te comparto la propuesta que conversamos${negocio}:\n\n` +
      `📋 *Plan:* ${planInfo.titulo} (${planInfo.subtitulo})\n` +
      `💰 *Tarifa Mensual:* $${planInfo.mensual.toLocaleString("es-CO")} COP\n` +
      `⭐ *Pago Trimestral:* $${planInfo.trimestral.toLocaleString("es-CO")} COP *(Ahorras $${planInfo.ahorro.toLocaleString("es-CO")} COP)*\n\n` +
      `✨ *Beneficios incluidos:*\n` +
      planInfo.beneficios.map((b) => `• ${b}`).join("\n") +
      `\n\n🎯 *¿Por qué te conviene?*\n` +
      `${planInfo.pitch}\n\n` +
      `📲 Mira cómo se ve en vivo en Minca: https://www.padonde.lat/minca\n\n` +
      `¡Avísame y te dejamos activa tu ficha hoy mismo! 🚀`
    );
  }, [planInfo, nombreContacto, nombreNegocio]);

  const handleCopiarMensaje = () => {
    navigator.clipboard.writeText(mensajeWhatsApp);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2500);
  };

  const handleEnviarWhatsApp = () => {
    const encoded = encodeURIComponent(mensajeWhatsApp);
    const cleanedNumber = telefonoWhatsApp.replace(/\D/g, "");
    if (cleanedNumber) {
      const fullNumber = cleanedNumber.startsWith("57")
        ? cleanedNumber
        : `57${cleanedNumber}`;
      window.open(`https://wa.me/${fullNumber}?text=${encoded}`, "_blank");
    } else {
      window.open(`https://wa.me/?text=${encoded}`, "_blank");
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Encabezado Principal */}
      <div className="bg-white/80 backdrop-blur-md rounded-3xl p-5 sm:p-7 border border-stone-light/80 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">💼</span>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-forest">
              Cotizador & Argumentario de Ventas
            </h1>
          </div>
          <p className="font-sans text-xs sm:text-sm text-stone mt-1">
            Herramienta de bolsillo para visitar aliados en Minca. Selecciona el tipo de negocio y obtén la tarifa exacta con el pitch de cierre.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setVistaTabla((prev) => !prev)}
          className="px-3.5 py-2 rounded-xl border border-forest/20 text-forest bg-forest/5 hover:bg-forest/10 font-sans text-xs font-semibold flex items-center gap-1.5 transition-colors self-stretch sm:self-auto justify-center"
        >
          <span>{vistaTabla ? "🔍 Volver al Simulador" : "📊 Ver Tabla General"}</span>
        </button>
      </div>

      {/* VISTA 1: TABLA GENERAL RESUMIDA */}
      {vistaTabla ? (
        <div className="bg-white rounded-3xl p-5 sm:p-7 border border-stone-light shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-xl font-bold text-forest">
              Matriz Completa de Tarifas Pa' Donde (Minca)
            </h2>
            <span className="text-xs bg-terra/10 text-terra px-3 py-1 rounded-full font-semibold">
              Valores Oficiales 2026
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-sans border-collapse">
              <thead>
                <tr className="border-b border-stone-200 bg-cream/60 text-forest">
                  <th className="p-3 font-bold">Tipo de Negocio</th>
                  <th className="p-3 font-bold">Detalle / Capacidad</th>
                  <th className="p-3 font-bold">Tarifa Mensual</th>
                  <th className="p-3 font-bold">Pago Trimestral</th>
                  <th className="p-3 font-bold">Retorno / Justificación</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                <tr className="hover:bg-cream/30">
                  <td className="p-3 font-semibold text-forest">🏨 Hospedaje</td>
                  <td className="p-3 text-stone">Hasta 5 habitaciones</td>
                  <td className="p-3 font-bold text-forest">$50.000 COP</td>
                  <td className="p-3 text-terra font-semibold">$125.000 COP <span className="text-[10px] text-stone">(Ahorra $25k)</span></td>
                  <td className="p-3 text-stone">Con menos de 1 noche cubre la suscripción. Ahorran 18% de Booking.</td>
                </tr>
                <tr className="hover:bg-cream/30">
                  <td className="p-3 font-semibold text-forest">🏨 Hospedaje</td>
                  <td className="p-3 text-stone">6 a 10 habitaciones</td>
                  <td className="p-3 font-bold text-forest">$80.000 COP</td>
                  <td className="p-3 text-terra font-semibold">$200.000 COP <span className="text-[10px] text-stone">(Ahorra $40k)</span></td>
                  <td className="p-3 text-stone">Hasta 10 tipos de habitaciones en el cotizador directo.</td>
                </tr>
                <tr className="hover:bg-cream/30">
                  <td className="p-3 font-semibold text-forest">🏨 Hospedaje</td>
                  <td className="p-3 text-stone">11 a 20 habitaciones</td>
                  <td className="p-3 font-bold text-forest">$120.000 COP</td>
                  <td className="p-3 text-terra font-semibold">$300.000 COP <span className="text-[10px] text-stone">(Ahorra $60k)</span></td>
                  <td className="p-3 text-stone">Alto volumen de consultas. Tarifa marginal frente a ahorro en comisiones.</td>
                </tr>
                <tr className="hover:bg-cream/30">
                  <td className="p-3 font-semibold text-forest">🏨 Hospedaje</td>
                  <td className="p-3 text-stone">Más de 20 habitaciones</td>
                  <td className="p-3 font-bold text-forest">$160.000 COP</td>
                  <td className="p-3 text-terra font-semibold">$400.000 COP <span className="text-[10px] text-stone">(Ahorra $80k)</span></td>
                  <td className="p-3 text-stone">Ficha ilimitada, actualización de temporadas y máxima visibilidad.</td>
                </tr>
                <tr className="bg-terra/5 hover:bg-terra/10">
                  <td className="p-3 font-semibold text-terra">🌟 Hostal Híbrido</td>
                  <td className="p-3 text-stone">Hospedaje + Bar/Eventos Activo</td>
                  <td className="p-3 font-bold text-terra">Tarifa habs + $40.000 COP</td>
                  <td className="p-3 text-terra font-semibold">Descuento de combo</td>
                  <td className="p-3 text-stone">Doble presencia: en sección Hospedaje y en Cartelera diaria.</td>
                </tr>
                <tr className="hover:bg-cream/30">
                  <td className="p-3 font-semibold text-forest">☕ Gastronomía</td>
                  <td className="p-3 text-stone">Café / Tienda Pequeña</td>
                  <td className="p-3 font-bold text-forest">$35.000 COP</td>
                  <td className="p-3 text-terra font-semibold">$90.000 COP <span className="text-[10px] text-stone">(Ahorra $15k)</span></td>
                  <td className="p-3 text-stone">Ficha con fotos, menú digital y WhatsApp. Menos de $1.200 COP al día.</td>
                </tr>
                <tr className="hover:bg-cream/30">
                  <td className="p-3 font-semibold text-forest">🍽️ Gastronomía</td>
                  <td className="p-3 text-stone">Restaurante / Bar con Eventos</td>
                  <td className="p-3 font-bold text-forest">$50.000 COP</td>
                  <td className="p-3 text-terra font-semibold">$125.000 COP <span className="text-[10px] text-stone">(Ahorra $25k)</span></td>
                  <td className="p-3 text-stone">Eventos ilimitados en cartelera. Una sola mesa paga el mes entero.</td>
                </tr>
                <tr className="hover:bg-cream/30">
                  <td className="p-3 font-semibold text-forest">🧭 Tours & Guías</td>
                  <td className="p-3 text-stone">Cacao, Café, Aves, Aventura</td>
                  <td className="p-3 font-bold text-forest">$50.000 COP</td>
                  <td className="p-3 text-terra font-semibold">$125.000 COP <span className="text-[10px] text-stone">(Ahorra $25k)</span></td>
                  <td className="p-3 text-stone">Sin comisión de agencias (25%). Con 1 turista recuperan la inversión.</td>
                </tr>
                <tr className="hover:bg-cream/30">
                  <td className="p-3 font-semibold text-forest">🛵 Comercio / Servicios</td>
                  <td className="p-3 text-stone">Lavanderías, Mototaxis, Tiendas</td>
                  <td className="p-3 font-bold text-forest">$25.000 COP</td>
                  <td className="p-3 text-terra font-semibold">$60.000 COP <span className="text-[10px] text-stone">(Ahorra $15k)</span></td>
                  <td className="p-3 text-stone">Menos de $1.000 COP al día en el directorio que todo turista consulta.</td>
                </tr>
                <tr className="hover:bg-cream/30">
                  <td className="p-3 font-semibold text-forest">🌿 Alianza Cultural / Pública</td>
                  <td className="p-3 text-stone">Cine comunitario, salud, cajero</td>
                  <td className="p-3 font-bold text-emerald-700">$0 COP (Gratis)</td>
                  <td className="p-3 text-emerald-700 font-semibold">$0 COP</td>
                  <td className="p-3 text-stone">Alianza comunitaria y apoyo al turismo consciente en Minca.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* VISTA 2: COTIZADOR INTERACTIVO DE BOLSILLO */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* COLUMNA IZQUIERDA: CONFIGURADOR DEL NEGOCIO (7 cols) */}
          <div className="lg:col-span-7 space-y-5">
            {/* 1. Selector de Categoría Principal */}
            <div className="bg-white rounded-3xl p-5 sm:p-6 border border-stone-light/80 shadow-xs space-y-3">
              <label className="text-xs font-bold text-forest font-sans uppercase tracking-wider block">
                Paso 1: ¿Qué tipo de negocio es?
              </label>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {[
                  { id: "hospedaje", label: "Hospedaje", emoji: "🏨" },
                  { id: "gastronomia", label: "Restaurante / Bar", emoji: "☕" },
                  { id: "tours", label: "Tours / Aventura", emoji: "🧭" },
                  { id: "servicios", label: "Servicios / Tienda", emoji: "🛵" },
                  { id: "cultural", label: "Social / Cultural", emoji: "🌿" },
                ].map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategoria(cat.id as CategoriaNegocio)}
                    className={[
                      "p-3 rounded-2xl flex flex-col items-center justify-center gap-1.5 transition-all text-xs font-sans font-medium text-center border cursor-pointer",
                      categoria === cat.id
                        ? "bg-forest text-white border-forest shadow-md scale-[1.02]"
                        : "bg-cream/60 text-stone hover:text-forest border-stone-light/60 hover:bg-cream",
                    ].join(" ")}
                  >
                    <span className="text-2xl">{cat.emoji}</span>
                    <span>{cat.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Opciones específicas de la categoría */}
            <div className="bg-white rounded-3xl p-5 sm:p-6 border border-stone-light/80 shadow-xs space-y-4">
              <label className="text-xs font-bold text-forest font-sans uppercase tracking-wider block">
                Paso 2: Ajustar tamaño o modalidad
              </label>

              {/* OPCIONES DE HOSPEDAJE */}
              {categoria === "hospedaje" && (
                <div className="space-y-4">
                  <div>
                    <span className="text-xs text-stone font-medium block mb-2">
                      Capacidad de habitaciones:
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {[
                        { id: "hasta_5", label: "Hasta 5 habs" },
                        { id: "6_a_10", label: "6 a 10 habs" },
                        { id: "11_a_20", label: "11 a 20 habs" },
                        { id: "mas_20", label: "Más de 20" },
                      ].map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setRangoHabs(item.id as RangoHabitaciones)}
                          className={[
                            "p-2.5 rounded-xl text-xs font-sans font-semibold border transition-all text-center",
                            rangoHabs === item.id
                              ? "bg-terra text-white border-terra shadow-xs"
                              : "bg-stone-50 text-stone hover:text-forest border-stone-light",
                          ].join(" ")}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Switch Hostal Híbrido */}
                  <label className="flex items-center justify-between p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200 cursor-pointer">
                    <div className="flex items-center gap-2.5">
                      <span className="text-xl">🌟</span>
                      <div>
                        <p className="font-sans text-xs font-bold text-forest">
                          Hostal Híbrido (+Bar / Fiestas / Eventos Activos)
                        </p>
                        <p className="text-[11px] text-stone">
                          Ej. Río Elemento. Suma módulo de eventos diarios por +$40k/mes.
                        </p>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={esHibrido}
                      onChange={(e) => setEsHibrido(e.target.checked)}
                      className="w-5 h-5 text-terra rounded border-stone-light focus:ring-terra"
                    />
                  </label>

                  {/* Micro-simulador de ROI vs Booking */}
                  <div className="p-4 rounded-2xl bg-forest/5 border border-forest/15 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-forest">
                        Tarifa promedio por noche en este hostal:
                      </span>
                      <span className="text-xs font-bold text-forest font-mono">
                        ${precioNocheSimulador.toLocaleString("es-CO")} COP
                      </span>
                    </div>
                    <input
                      type="range"
                      min="40000"
                      max="300000"
                      step="10000"
                      value={precioNocheSimulador}
                      onChange={(e) => setPrecioNocheSimulador(Number(e.target.value))}
                      className="w-full accent-forest cursor-pointer"
                    />
                    <p className="text-[11px] text-forest/80 font-sans leading-relaxed">
                      💡 <strong>Argumento matemático:</strong> Booking se queda con el 18% (${Math.round(precioNocheSimulador * 0.18).toLocaleString("es-CO")} COP por noche). Con solo <strong>{Math.max(1, Math.ceil(planInfo.mensual / (precioNocheSimulador * 0.18)))} reserva(s) directa(s)</strong> que te entren por Pa' Donde al mes, ¡el plan se paga solo!
                    </p>
                  </div>
                </div>
              )}

              {/* OPCIONES DE GASTRONOMÍA */}
              {categoria === "gastronomia" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setTipoGastro("cafe")}
                    className={[
                      "p-3.5 rounded-2xl text-left border transition-all flex flex-col justify-between",
                      tipoGastro === "cafe"
                        ? "bg-forest text-white border-forest shadow-sm"
                        : "bg-stone-50 border-stone-light text-stone hover:text-forest",
                    ].join(" ")}
                  >
                    <div>
                      <p className="font-bold text-xs">☕ Café / Tienda Pequeña</p>
                      <p className="text-[11px] opacity-80 mt-1">
                        Café de especialidad, postres y menú digital sin eventos nocturnos.
                      </p>
                    </div>
                    <span className="text-sm font-bold mt-3">
                      $35.000 COP / mes
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTipoGastro("restaurante_bar")}
                    className={[
                      "p-3.5 rounded-2xl text-left border transition-all flex flex-col justify-between",
                      tipoGastro === "restaurante_bar"
                        ? "bg-forest text-white border-forest shadow-sm"
                        : "bg-stone-50 border-stone-light text-stone hover:text-forest",
                    ].join(" ")}
                  >
                    <div>
                      <p className="font-bold text-xs">🍽️ Restaurante / Bar / Fiesta</p>
                      <p className="text-[11px] opacity-80 mt-1">
                        Incluye publicación ilimitada de eventos, música en vivo y reels.
                      </p>
                    </div>
                    <span className="text-sm font-bold mt-3">
                      $50.000 COP / mes
                    </span>
                  </button>
                </div>
              )}

              {/* OPCIONES DE TOURS */}
              {categoria === "tours" && (
                <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200 text-xs text-stone space-y-1">
                  <p className="font-bold text-forest">
                    🧭 Tarifa Estándar de Experiencias y Tours:
                  </p>
                  <p>
                    $50.000 COP mensual ($125.000 trimestral). Aplica para tours de cacao, café, avistamiento de aves, senderismo y aventura.
                  </p>
                </div>
              )}

              {/* OPCIONES DE SERVICIOS */}
              {categoria === "servicios" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setTipoServicio("privado")}
                    className={[
                      "p-3.5 rounded-2xl text-left border transition-all",
                      tipoServicio === "privado"
                        ? "bg-forest text-white border-forest shadow-sm"
                        : "bg-stone-50 border-stone-light text-stone hover:text-forest",
                    ].join(" ")}
                  >
                    <p className="font-bold text-xs">🛵 Comercio / Transporte Privado</p>
                    <p className="text-[11px] opacity-80 mt-1">
                      Lavanderías, mototaxis, tiendas de conveniencia, farmacias.
                    </p>
                    <p className="text-sm font-bold mt-2">$25.000 COP / mes</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTipoServicio("comunitario")}
                    className={[
                      "p-3.5 rounded-2xl text-left border transition-all",
                      tipoServicio === "comunitario"
                        ? "bg-forest text-white border-forest shadow-sm"
                        : "bg-stone-50 border-stone-light text-stone hover:text-forest",
                    ].join(" ")}
                  >
                    <p className="font-bold text-xs">🏥 Servicio Público / Emergencia</p>
                    <p className="text-[11px] opacity-80 mt-1">
                      Puesto de salud, policía, cajero automático, bomberos.
                    </p>
                    <p className="text-sm font-bold text-emerald-600 mt-2">
                      $0 COP (Gratis)
                    </p>
                  </button>
                </div>
              )}

              {/* OPCIONES CULTURALES */}
              {categoria === "cultural" && (
                <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 space-y-1">
                  <p className="font-bold">🌿 Alianza Comunitaria y Cultural</p>
                  <p>
                    100% gratuito para iniciativas de conservación, cine comunitario y talleres libres. Solo les pedimos colocar el código QR de Pa' Donde en su espacio.
                  </p>
                </div>
              )}
            </div>

            {/* 3. Datos del Negocio para Enviar Propuesta */}
            <div className="bg-white rounded-3xl p-5 sm:p-6 border border-stone-light/80 shadow-xs space-y-3">
              <label className="text-xs font-bold text-forest font-sans uppercase tracking-wider block">
                Paso 3: Personalizar mensaje para el dueño
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-stone block mb-1">
                    Nombre del Negocio:
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. Casa Maya"
                    value={nombreNegocio}
                    onChange={(e) => setNombreNegocio(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-light bg-cream text-forest text-xs font-sans focus:outline-none focus:border-forest"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-stone block mb-1">
                    Nombre del Contacto:
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. Carlos"
                    value={nombreContacto}
                    onChange={(e) => setNombreContacto(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-light bg-cream text-forest text-xs font-sans focus:outline-none focus:border-forest"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-stone block mb-1">
                    WhatsApp (Opcional):
                  </label>
                  <input
                    type="tel"
                    placeholder="Ej. 3001234567"
                    value={telefonoWhatsApp}
                    onChange={(e) => setTelefonoWhatsApp(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-light bg-cream text-forest text-xs font-sans focus:outline-none focus:border-forest"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* COLUMNA DERECHA: TARJETA DE CIERRE Y PITCH (5 cols) */}
          <div className="lg:col-span-5 space-y-5">
            {/* Tarjeta de Precio y Propuesta */}
            <div className="bg-gradient-to-br from-forest to-forest-dark text-white rounded-3xl p-6 sm:p-7 shadow-xl border border-white/10 space-y-5">
              <div>
                <span className="text-xs uppercase tracking-wider text-white/70 font-semibold font-sans">
                  Propuesta Recomendada
                </span>
                <h3 className="font-serif text-2xl font-bold mt-1 text-cream">
                  {planInfo.titulo}
                </h3>
                <p className="text-xs text-white/80 font-sans mt-0.5">
                  {planInfo.subtitulo}
                </p>
              </div>

              {/* Precios Mensual vs Trimestral */}
              {planInfo.mensual > 0 ? (
                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-white/15">
                  <div className="bg-white/10 backdrop-blur-md p-3.5 rounded-2xl border border-white/15">
                    <span className="text-[11px] text-white/70 block">
                      Tarifa Mensual
                    </span>
                    <p className="font-serif text-xl sm:text-2xl font-bold text-white mt-0.5">
                      ${planInfo.mensual.toLocaleString("es-CO")}
                    </p>
                    <span className="text-[10px] text-white/60">COP / mes</span>
                  </div>

                  <div className="bg-terra/30 backdrop-blur-md p-3.5 rounded-2xl border border-terra/40 relative overflow-hidden">
                    <span className="absolute top-1.5 right-2 text-[9px] bg-terra text-white px-1.5 py-0.5 rounded-full font-bold">
                      Ahorra ${planInfo.ahorro.toLocaleString("es-CO")}
                    </span>
                    <span className="text-[11px] text-amber-200 block">
                      Pago Trimestral
                    </span>
                    <p className="font-serif text-xl sm:text-2xl font-bold text-amber-300 mt-0.5">
                      ${planInfo.trimestral.toLocaleString("es-CO")}
                    </p>
                    <span className="text-[10px] text-amber-200/70">
                      3 meses de visibilidad
                    </span>
                  </div>
                </div>
              ) : (
                <div className="bg-emerald-500/20 border border-emerald-400/30 p-4 rounded-2xl">
                  <p className="text-sm font-bold text-emerald-300">
                    Alianza Gratuita ($0 COP)
                  </p>
                  <p className="text-xs text-white/80 mt-1">
                    Sin cobros mensuales. Respaldo mutuo para la comunidad de Minca.
                  </p>
                </div>
              )}

              {/* Pitch de 10 segundos para el vendedor */}
              <div className="bg-black/30 backdrop-blur-md p-4 rounded-2xl border border-white/10 space-y-1.5">
                <p className="text-xs font-bold text-amber-300 flex items-center gap-1.5 uppercase tracking-wider">
                  <span>📣</span> Pitch de 10 segundos:
                </p>
                <p className="text-xs text-white/90 leading-relaxed italic">
                  "{planInfo.pitch}"
                </p>
              </div>

              {/* Checklist de lo que incluye */}
              <div className="space-y-2 pt-1 border-t border-white/15">
                <p className="text-xs font-bold text-white uppercase tracking-wider font-sans">
                  Lo que incluye su membresía:
                </p>
                <ul className="space-y-1.5 text-xs text-white/90 font-sans">
                  {planInfo.beneficios.map((b, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-emerald-400 font-bold shrink-0">✓</span>
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Botones de Acción para Enviar por WhatsApp */}
              <div className="pt-2 space-y-2">
                <Button
                  onClick={handleEnviarWhatsApp}
                  size="lg"
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 shadow-lg flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>📲</span>
                  <span>Abrir en WhatsApp y Enviar</span>
                </Button>

                <button
                  type="button"
                  onClick={handleCopiarMensaje}
                  className="w-full py-2.5 rounded-xl border border-white/20 bg-white/10 hover:bg-white/20 text-white font-sans text-xs font-medium transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>{copiado ? "✓ ¡Copiado al Portapapeles!" : "📋 Copiar Texto de la Propuesta"}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
