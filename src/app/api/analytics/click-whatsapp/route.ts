import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendTelegramNotification } from "@/lib/telegram";

export async function POST(request: NextRequest) {
  try {
    // 1. Filtro Anti-Admin: Si el dispositivo está marcado como admin o tiene sesión activa,
    // respondemos exitosamente pero omitimos la inserción y alerta para no contaminar métricas reales.
    const isAdminCookie = request.cookies.get("padonde_admin_device")?.value === "true";
    if (isAdminCookie) {
      return NextResponse.json({ success: true, recorded: false, reason: "admin_cookie" });
    }

    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      return NextResponse.json({ success: true, recorded: false, reason: "admin_session" });
    }

    const body = await request.json().catch(() => ({}));
    const {
      eventoId,
      negocioId: inputNegocioId,
      ubicacion = "tarjeta",
      aliado_nombre,
      tipo_categoria,
      eventoTitulo,
      precio,
      detalles,
    } = body;

    let negocioId = inputNegocioId;
    let resolvedAliado = aliado_nombre;
    let resolvedTitulo = eventoTitulo;

    // Si no vino el negocioId directamente pero sí el eventoId, lo resolvemos
    if ((!negocioId || !resolvedAliado || !resolvedTitulo) && eventoId) {
      const { data: ev } = await supabase
        .from("eventos")
        .select("negocio_id, titulo, negocio:negocios(nombre)")
        .eq("id", eventoId)
        .maybeSingle();

      if (ev) {
        if (!negocioId && ev.negocio_id) negocioId = ev.negocio_id;
        if (!resolvedTitulo && ev.titulo) resolvedTitulo = ev.titulo;
        if (!resolvedAliado && (ev.negocio as any)?.nombre) resolvedAliado = (ev.negocio as any).nombre;
      }
    }

    if (!resolvedAliado && negocioId) {
      const { data: neg } = await supabase
        .from("negocios")
        .select("nombre")
        .eq("id", negocioId)
        .maybeSingle();
      if (neg?.nombre) resolvedAliado = neg.nombre;
    }

    // 2. Insertar en la tabla de clics_whatsapp
    const { error: insertError } = await supabase
      .from("clics_whatsapp")
      .insert({
        evento_id: eventoId || null,
        negocio_id: negocioId || null,
        ubicacion: typeof ubicacion === "string" ? ubicacion.slice(0, 30) : "tarjeta",
      });

    if (insertError) {
      console.warn("Métricas WhatsApp (clics_whatsapp insert fallback):", insertError.message);
    }

    // 3. Despachar alerta instantánea a Telegram en segundo plano (no bloqueante)
    try {
      const isHospedaje = tipo_categoria === "hospedaje" || ubicacion === "cotizador_hospedaje";
      const isServicio = tipo_categoria === "servicio_esencial" || ubicacion === "servicios_esenciales";

      let lines: string[] = [];

      if (isHospedaje) {
        const habitacion = detalles?.habitacion || "Habitación";
        const noches = detalles?.noches ? `${detalles.noches} noche${detalles.noches > 1 ? "s" : ""}` : "";
        const personas = detalles?.huespedes ? `${detalles.huespedes} persona${detalles.huespedes > 1 ? "s" : ""}` : "";
        const estadia = [noches, personas].filter(Boolean).join(" • ");
        const precioTotalVal = precio || detalles?.precioTotal;
        const precioFormatted = (precioTotalVal && Number(precioTotalVal) > 0)
          ? `$${Number(precioTotalVal).toLocaleString("es-CO")} COP`
          : "";

        lines = [
          `🏡 <b>¡Nueva Consulta de Hospedaje!</b>`,
          `📍 <b>Lugar:</b> ${resolvedAliado || "Hospedaje PaDónde"}`,
          `🛏️ <b>Acomodación:</b> ${habitacion}`,
        ];
        if (estadia) lines.push(`🗓️ <b>Estadía:</b> ${estadia}`);
        if (precioFormatted) lines.push(`💰 <b>Cotización:</b> ${precioFormatted}`);
        lines.push(`🔗 <b>Origen:</b> Cotizador Web`);
      } else if (isServicio) {
        lines = [
          `💡 <b>¡Contacto a Servicio Esencial!</b>`,
          `🏥 <b>Punto:</b> ${resolvedAliado || "Servicio Esencial"}`,
        ];
        if (resolvedTitulo) lines.push(`📌 <b>Detalle:</b> ${resolvedTitulo}`);
        lines.push(`🔗 <b>Origen:</b> Directorio de Servicios Esenciales`);
      } else {
        const origenDesc =
          ubicacion === "tarjeta" || ubicacion === "tarjeta_feed"
            ? "Cartelera principal (tarjeta)"
            : ubicacion === "detalle" || ubicacion === "detalle_evento"
            ? "Página de detalle del plan"
            : ubicacion;

        lines = [
          `🌿 <b>¡Nueva Reserva en PaDónde!</b>`,
          `🎉 <b>Plan:</b> ${resolvedTitulo || "Evento / Experiencia"}`,
          `📍 <b>Aliado:</b> ${resolvedAliado || "Organizador"}`,
        ];
        if (precio && Number(precio) > 0) {
          lines.push(`💰 <b>Valor ref:</b> $${Number(precio).toLocaleString("es-CO")} COP`);
        }
        lines.push(`🔗 <b>Origen:</b> ${origenDesc}`);
      }

      // Disparar Telegram en segundo plano (fire-and-forget)
      void sendTelegramNotification(lines.join("\n")).catch((err) => {
        console.warn("Aviso al despachar notificación Telegram:", err);
      });
    } catch (notifErr) {
      console.warn("Error formateando notificación Telegram:", notifErr);
    }

    return NextResponse.json({ success: true, recorded: !insertError });
  } catch (err: any) {
    console.warn("Excepción al registrar clic WhatsApp:", err?.message || err);
    return NextResponse.json({ success: true, recorded: false });
  }
}

