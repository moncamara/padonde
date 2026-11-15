"use client";

import { useEffect, useMemo, useState } from "react";
import { extraerRecurrencia, normalizarTextoBusqueda } from "@/lib/utils";
import { cleanPhoneNumber, copyToClipboard } from "@/lib/whatsapp/url";
import { obtenerMetricasGA4Aliado, type MetricaHistoricaAliado } from "@/lib/constants/vistasAnalyticsHistoricas";
import type { AliadoItem } from "./AdminAliadosList";

interface ModalFichaJsonAliadoProps {
  aliado: AliadoItem;
  locale: string;
  metricasDinamicas?: Record<string, MetricaHistoricaAliado> | null;
  onClose: () => void;
}

function slugifyNombre(nombre: string): string {
  const base = normalizarTextoBusqueda(nombre)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return base || "aliado-padonde";
}

export function ModalFichaJsonAliado({
  aliado,
  locale,
  metricasDinamicas = null,
  onClose,
}: ModalFichaJsonAliadoProps) {
  const [copiado, setCopiado] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const slugAliado = useMemo(() => slugifyNombre(aliado.nombre), [aliado.nombre]);

  const { payloadJson } = useMemo(() => {
    const zonaSlug = aliado.zonaSlug || "minca";
    const metricasGA4 = obtenerMetricasGA4Aliado(
      aliado.nombre,
      metricasDinamicas
    );

    const publicacionesVinculadas = (aliado.eventos || []).map((ev) => {
      const rec = extraerRecurrencia(ev.descripcion, ev.metadata_hospedaje);
      const precioDesde = (ev.metadata_hospedaje as Record<string, unknown> | null | undefined)?.precio_desde !== false;

      return {
        id: ev.id,
        titulo: ev.titulo,
        tipo: ev.tipo,
        precio: ev.precio,
        precioMoneda: ev.precio_moneda || "COP",
        precioDesde,
        esRecurrente: rec.esRecurrente,
        diasRecurrentes: rec.dias,
        fechaInicio: ev.fecha_inicio,
        fechaFin: ev.fecha_fin ?? null,
        destacado: ev.destacado,
        activo: ev.activo,
        imagenUrl: ev.imagen_url ?? null,
        videoUrl: ev.video_url ?? null,
        urlPublica: `https://padonde.lat/${locale}/${zonaSlug}/${ev.id}`,
        metadataHospedaje: ev.metadata_hospedaje ?? null,
      };
    });

    const data = {
      generadoEn: new Date().toISOString(),
      aliado: {
        id: aliado.id,
        nombreNegocio: aliado.nombre,
        slug: slugAliado,
        descripcion: aliado.descripcion ?? null,
        zonaId: aliado.zona_id ?? null,
        zonaSlug,
        zonaNombre: aliado.zonaNombre ?? null,
        categoria: aliado.categoria,
        whatsapp: aliado.whatsapp,
        whatsappLimpio: cleanPhoneNumber(aliado.whatsapp),
        instagram: aliado.instagram ?? null,
        plan: aliado.plan,
        planExpiraEn: aliado.plan_expira_en ?? null,
        activo: aliado.activo,
        createdAt: aliado.created_at,
      },
      ubicacionYReputacion: {
        googleMapsUrl: aliado.google_maps_url ?? null,
        googleRating: aliado.google_rating ?? null,
        googleReviewsCount: aliado.google_total_reviews ?? null,
        googleReviewUrl: aliado.google_review_url ?? null,
      },
      metricasResumen: {
        totalPublicaciones: aliado.totalEventos,
        publicacionesActivas: aliado.eventosActivos,
        clicsWhatsappHistoricos: aliado.totalClics ?? 0,
        clicsWhatsapp7Dias: aliado.clics7Dias ?? 0,
        vistasGA4: metricasGA4.vistas,
      },
      publicacionesVinculadas,
      plantillaIngesta: {
        negocioId: aliado.id,
        nombreNegocio: aliado.nombre,
        zonaId: aliado.zona_id ?? null,
        zonaSlug,
        categoria: aliado.categoria,
        whatsapp: aliado.whatsapp,
        instagram: aliado.instagram ?? null,
        descripcionNegocio: aliado.descripcion ?? null,
        googleMapsUrl: aliado.google_maps_url ?? null,
        googleRating: aliado.google_rating ?? null,
        googleTotalReviews: aliado.google_total_reviews ?? null,
        googleReviewUrl: aliado.google_review_url ?? null,
        precioDesde: true,
        precioMoneda: "COP",
      },
    };

    return {
      payloadJson: JSON.stringify(data, null, 2),
    };
  }, [aliado, locale, metricasDinamicas, slugAliado]);

  async function handleCopiar() {
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(payloadJson);
      } else {
        await copyToClipboard(payloadJson);
      }
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      await copyToClipboard(payloadJson);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    }
  }

  function handleDescargar() {
    const blob = new Blob([payloadJson], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${slugAliado}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl bg-cream border border-stone-light rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        style={{ backgroundColor: "#FBF9F5" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="px-6 py-4 bg-forest text-cream flex items-center justify-between gap-4"
          style={{ backgroundColor: "#1B382B", color: "#FBF9F5" }}
        >
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-white/15 text-cream">
                {"{ }"} JSON
              </span>
              <h3 className="font-serif text-lg font-bold truncate text-cream">
                Ficha Estandarizada — {aliado.nombre}
              </h3>
            </div>
            <p className="text-[11px] font-sans text-cream/80 mt-0.5 truncate">
              {slugAliado}.json · {aliado.eventos?.length || 0} publicaciones vinculadas · 100% Client-Side
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="shrink-0 w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 text-cream flex items-center justify-center text-sm transition-colors cursor-pointer"
            title="Cerrar"
          >
            ✕
          </button>
        </div>

        {/* Barra de acciones */}
        <div className="px-6 py-3 border-b border-stone-light/70 bg-white flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs font-sans text-stone">
            Incluye datos maestros, ubicación/Google, métricas, publicaciones y{" "}
            <code className="font-mono text-[11px] bg-stone-100 px-1.5 py-0.5 rounded text-forest font-semibold">
              plantillaIngesta
            </code>
          </span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopiar}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-sans font-semibold transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs ${
                copiado
                  ? "bg-emerald-600 text-white"
                  : "bg-forest hover:bg-forest/90 text-cream"
              }`}
              style={copiado ? undefined : { backgroundColor: "#1B382B", color: "#FBF9F5" }}
            >
              <span>{copiado ? "✅ ¡JSON Copiado!" : "📋 Copiar JSON"}</span>
            </button>

            <button
              type="button"
              onClick={handleDescargar}
              className="px-3.5 py-1.5 rounded-xl text-xs font-sans font-semibold bg-white hover:bg-stone-50 text-forest border border-stone-light transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
            >
              <span>⬇️ Descargar .json</span>
            </button>
          </div>
        </div>

        {/* Vista previa JSON */}
        <div className="p-5 overflow-auto flex-1 bg-cream" style={{ backgroundColor: "#FBF9F5" }}>
          <pre
            className="p-4 rounded-2xl bg-forest text-cream text-xs font-mono leading-relaxed overflow-auto max-h-[55vh] shadow-inner border border-stone-light/30"
            style={{ backgroundColor: "#1B382B", color: "#FBF9F5" }}
          >
            <code>{payloadJson}</code>
          </pre>
        </div>
      </div>
    </div>
  );
}
