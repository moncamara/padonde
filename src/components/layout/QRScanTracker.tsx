"use client";

import { useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";

interface QRScanTrackerProps {
  zonaSlug: string;
}

export function QRScanTracker({ zonaSlug }: QRScanTrackerProps) {
  const searchParams = useSearchParams();
  const trackedRef = useRef<boolean>(false);

  useEffect(() => {
    const src = searchParams.get("src");
    if (!src || trackedRef.current) return;

    // Evitar registrar dos veces en la misma sesión de pestaña
    const sessionKey = `padonde_qr_session_${src}`;
    if (sessionStorage.getItem(sessionKey)) return;

    trackedRef.current = true;
    sessionStorage.setItem(sessionKey, "1");

    // 1. Obtener o crear Device ID persistente (localStorage + Cookie de 6 meses)
    let deviceId = "";
    try {
      deviceId = localStorage.getItem("padonde_dev_id") || "";
      if (!deviceId) {
        deviceId = `did_${Math.random().toString(36).slice(2, 11)}_${Date.now().toString(36)}`;
        localStorage.setItem("padonde_dev_id", deviceId);
      }
      // Cookie de respaldo por 180 días
      document.cookie = `padonde_did=${deviceId}; path=/; max-age=15552000; SameSite=Lax`;
    } catch {
      deviceId = `anon_${Date.now()}`;
    }

    // 2. Registrar escaneo inicial
    const startTime = Date.now();
    let scanId: string | null = null;
    let confirmed = false;

    fetch("/api/analytics/track-qr", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        puntoId: src,
        zonaSlug,
        dispositivoId: deviceId,
        idioma: typeof navigator !== "undefined" ? (navigator.language || "") : "",
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data?.scanId) {
          scanId = data.scanId;
        }
      })
      .catch(() => {});

    // 3. Antifraude: Validación de permanencia mínima (5 segundos)
    // El promotor no puede inflar números abriendo y cerrando la app en 1 segundo.
    const confirmValidation = () => {
      if (confirmed || !scanId) return;
      const elapsedSec = Math.floor((Date.now() - startTime) / 1000);
      if (elapsedSec < 4) return;

      confirmed = true;
      fetch("/api/analytics/confirm-qr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scanId,
          tiempoPermanenciaSeg: Math.max(elapsedSec, 5),
        }),
      }).catch(() => {});
    };

    // Temporizador automático a los 5 segundos
    const timer = setTimeout(() => {
      confirmValidation();
    }, 5200);

    // O al interactuar tras al menos 4 segundos (scroll / click)
    const handleInteraction = () => {
      const elapsedSec = (Date.now() - startTime) / 1000;
      if (elapsedSec >= 4) {
        confirmValidation();
        window.removeEventListener("scroll", handleInteraction);
        window.removeEventListener("click", handleInteraction);
      }
    };

    window.addEventListener("scroll", handleInteraction, { passive: true });
    window.addEventListener("click", handleInteraction, { passive: true });

    return () => {
      clearTimeout(timer);
      window.removeEventListener("scroll", handleInteraction);
      window.removeEventListener("click", handleInteraction);
    };
  }, [searchParams, zonaSlug]);

  return null;
}
