import type { GoogleReputacion } from "@/lib/types";

interface GoogleRatingBadgeProps {
  reputacion?: GoogleReputacion | null;
}

/**
 * Badge elegante y ligero que muestra las estrellas y calificación de Google Maps
 * con enlace directo para ver las opiniones reales de los viajeros. Cero costo de API.
 */
export function GoogleRatingBadge({ reputacion }: GoogleRatingBadgeProps) {
  if (!reputacion || !reputacion.rating) return null;

  return (
    <a
      href={reputacion.maps_url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 bg-white/95 border border-stone-light/80 px-2.5 py-1 rounded-full text-xs font-sans text-forest hover:bg-stone-light/30 transition-all shadow-2xs group"
      title="Ver reseñas verificadas en Google Maps"
    >
      <span className="text-amber-500 font-bold flex items-center gap-0.5">
        <span>★</span>
        <span>{reputacion.rating.toFixed(1)}</span>
      </span>
      <span className="text-stone text-[11px] group-hover:text-forest transition-colors">
        ({reputacion.total_reviews} en Google Maps ↗)
      </span>
    </a>
  );
}
