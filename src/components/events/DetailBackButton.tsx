"use client";

import { useRouter } from "next/navigation";

interface DetailBackButtonProps {
  fallbackUrl: string;
  ariaLabel?: string;
  eventoId?: string;
}

export function DetailBackButton({
  fallbackUrl,
  ariaLabel = "Atrás",
  eventoId,
}: DetailBackButtonProps) {
  const router = useRouter();

  const handleBack = (e: React.MouseEvent) => {
    e.preventDefault();

    if (typeof window !== "undefined") {
      try {
        sessionStorage.removeItem("padonde_detail_lang_switched");
        sessionStorage.setItem("padonde_tab_activa", "eventos");
        if (eventoId) {
          sessionStorage.setItem("padonde_last_card", `card-evento-${eventoId}`);
        }
      } catch {}
    }

    router.push(fallbackUrl, { scroll: false });
  };

  return (
    <button
      type="button"
      onClick={handleBack}
      className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-cream/90 backdrop-blur-md text-forest hover:bg-cream transition-all duration-150 shadow-sm active:scale-95 shrink-0 cursor-pointer"
      aria-label={ariaLabel}
    >
      <span className="text-lg">←</span>
    </button>
  );
}
