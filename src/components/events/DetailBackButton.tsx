"use client";

import { useRouter } from "next/navigation";

interface DetailBackButtonProps {
  fallbackUrl: string;
  ariaLabel?: string;
}

export function DetailBackButton({
  fallbackUrl,
  ariaLabel = "Atrás",
}: DetailBackButtonProps) {
  const router = useRouter();

  const handleBack = (e: React.MouseEvent) => {
    e.preventDefault();

    const navigate = () => {
      if (typeof window !== "undefined" && window.history.length > 1) {
        router.back();
      } else {
        router.push(fallbackUrl);
      }
    };

    if (typeof document !== "undefined") {
      const wrapper = document.getElementById("detail-page-wrapper");
      if (wrapper) {
        wrapper.classList.remove("animate-slide-in-right");
        wrapper.classList.add("animate-slide-out-right");
        setTimeout(navigate, 230);
        return;
      }
    }

    navigate();
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
