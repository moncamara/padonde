"use client";

import { useRef } from "react";
import { useRouter } from "@/i18n/routing";

interface AdminSecretTriggerProps {
  children: React.ReactNode;
}

/**
 * Envoltorio para el logo/título que detecta 3 toques/clics rápidos en menos de 1 segundo
 * y redirige automáticamente al panel de administración sin exponer botones a los turistas.
 */
export function AdminSecretTrigger({ children }: AdminSecretTriggerProps) {
  const router = useRouter();
  const clicksRef = useRef<number[]>([]);

  const handleTrigger = () => {
    const now = Date.now();
    // Conservar solo los clics hechos en los últimos 900ms
    clicksRef.current = [...clicksRef.current.filter((time) => now - time < 900), now];

    if (clicksRef.current.length >= 3) {
      clicksRef.current = [];
      router.push("/admin");
    }
  };

  return (
    <div
      onClick={handleTrigger}
      className="cursor-pointer select-none active:opacity-85 transition-opacity"
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter") handleTrigger();
      }}
    >
      {children}
    </div>
  );
}
