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
  const isTouchRef = useRef(false);

  const registerTap = () => {
    const now = Date.now();
    // En móviles, ventana de 1500ms (1.5s) para los 3 toques
    clicksRef.current = [...clicksRef.current.filter((time) => now - time < 1500), now];

    if (clicksRef.current.length >= 3) {
      clicksRef.current = [];
      window.location.href = "/admin";
    }
  };

  return (
    <div
      onClick={() => {
        // En desktop usa el click normal; en táctil ya lo capturó touchStart
        if (!isTouchRef.current) {
          registerTap();
        }
      }}
      onTouchStart={() => {
        isTouchRef.current = true;
        registerTap();
      }}
      className="cursor-pointer select-none active:opacity-70 transition-opacity touch-manipulation"
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter") registerTap();
      }}
    >
      {children}
    </div>
  );
}
