"use client";

import { useEffect, useRef, useState } from "react";
import type { CategoriaEvento } from "@/lib/types";

interface UseSwipeCategoryNavParams {
  categorias: (CategoriaEvento | null)[];
  categoriaActiva: CategoriaEvento | null;
  onCategoriaChange: (categoria: CategoriaEvento | null) => void;
}

/**
 * Hook para navegación táctil (Mobile Touch) y de arrastre con cursor (Desktop Mouse)
 * entre las categorías del feed de PaDónde.
 * 
 * Diseñado con el estándar de Swiper/Instagram:
 * 1. Mobile First: Escucha touchstart/touchmove/touchend nativos para iOS Safari y Android Chrome.
 * 2. Desktop Fallback: Escucha mousedown/mousemove/mouseup para permitir pruebas con mouse/trackpad.
 * 3. Cancelación de click: Si se ejecutó un swipe, neutraliza el evento click para no abrir la tarjeta.
 * 4. Detección angular: Si el usuario hace scroll vertical, se cancela el swipe de inmediato sin lag.
 */
export function useSwipeCategoryNav({
  categorias,
  categoriaActiva,
  onCategoriaChange,
}: UseSwipeCategoryNavParams) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [animClass, setAnimClass] = useState<string>("");

  const startCoordRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const isTrackingRef = useRef(false);
  const hasDeterminedAxisRef = useRef(false);
  const isHorizontalSwipeRef = useRef(false);
  const justSwipedRef = useRef(false);

  const categoriasRef = useRef(categorias);
  categoriasRef.current = categorias;

  const categoriaActivaRef = useRef(categoriaActiva);
  categoriaActivaRef.current = categoriaActiva;

  const onCategoriaChangeRef = useRef(onCategoriaChange);
  onCategoriaChangeRef.current = onCategoriaChange;

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    function triggerSwipe(deltaX: number) {
      const cats = categoriasRef.current;
      const currentCat = categoriaActivaRef.current;
      const currentIndex = cats.findIndex((c) => c === currentCat);

      if (currentIndex === -1) return;

      // Deslizar hacia la izquierda (dedo se mueve a la izquierda, deltaX < 0) ➔ Siguiente categoría
      if (deltaX < 0 && currentIndex < cats.length - 1) {
        const nextCat = cats[currentIndex + 1];
        setAnimClass("swipe-slide-left");
        onCategoriaChangeRef.current(nextCat);
        centrarBotonCategoria(nextCat);
      }
      // Deslizar hacia la derecha (dedo se mueve a la derecha, deltaX > 0) ➔ Categoría anterior
      else if (deltaX > 0 && currentIndex > 0) {
        const prevCat = cats[currentIndex - 1];
        setAnimClass("swipe-slide-right");
        onCategoriaChangeRef.current(prevCat);
        centrarBotonCategoria(prevCat);
      }
    }

    // ─── 1. MANEJO TÁCTIL MÓVIL (iOS Safari & Android Chrome) ─────────────────
    function handleTouchStart(e: TouchEvent) {
      if (e.touches.length !== 1) {
        isTrackingRef.current = false;
        return;
      }

      const touch = e.touches[0];
      const startX = touch.clientX;
      const startY = touch.clientY;
      const windowW = window.innerWidth;

      // Zona muerta en bordes para no chocar con el "swipe-to-back" de iOS
      if (startX < 20 || startX > windowW - 20) {
        isTrackingRef.current = false;
        return;
      }

      // Omitir si se tocó un elemento con scroll horizontal interno o botón
      const target = e.target as HTMLElement | null;
      if (target?.closest('.overflow-x-auto, [data-prevent-swipe="true"], button')) {
        isTrackingRef.current = false;
        return;
      }

      startCoordRef.current = { x: startX, y: startY, time: Date.now() };
      isTrackingRef.current = true;
      hasDeterminedAxisRef.current = false;
      isHorizontalSwipeRef.current = false;
    }

    function handleTouchMove(e: TouchEvent) {
      if (!isTrackingRef.current || !startCoordRef.current) return;

      const touch = e.touches[0];
      const deltaX = touch.clientX - startCoordRef.current.x;
      const deltaY = touch.clientY - startCoordRef.current.y;
      const absX = Math.abs(deltaX);
      const absY = Math.abs(deltaY);

      if (!hasDeterminedAxisRef.current) {
        if (absX > 7 || absY > 7) {
          hasDeterminedAxisRef.current = true;
          // Si el movimiento vertical predomina, es scroll vertical: cancelar swipe inmediatamente
          if (absY >= absX) {
            isTrackingRef.current = false;
            isHorizontalSwipeRef.current = false;
            return;
          } else {
            isHorizontalSwipeRef.current = true;
          }
        }
      }
    }

    function handleTouchEnd(e: TouchEvent) {
      if (!isTrackingRef.current || !startCoordRef.current || !isHorizontalSwipeRef.current) {
        isTrackingRef.current = false;
        startCoordRef.current = null;
        return;
      }

      const touch = e.changedTouches[0];
      const deltaX = touch.clientX - startCoordRef.current.x;
      const deltaY = touch.clientY - startCoordRef.current.y;
      const elapsed = Date.now() - startCoordRef.current.time;

      isTrackingRef.current = false;
      startCoordRef.current = null;

      const absX = Math.abs(deltaX);
      const absY = Math.abs(deltaY);

      // Umbrales táctiles: mínimo 40px, más horizontal que vertical, máx 600ms
      if (elapsed <= 600 && absX >= 40 && absX > absY * 1.1) {
        justSwipedRef.current = true;
        setTimeout(() => {
          justSwipedRef.current = false;
        }, 350);
        triggerSwipe(deltaX);
      }
    }

    // ─── 2. MANEJO CON MOUSE / ESCRITORIO (Click sostenido y arrastre) ─────────
    function handleMouseDown(e: MouseEvent) {
      if (e.button !== 0) return; // Solo click izquierdo

      const target = e.target as HTMLElement | null;
      if (target?.closest('.overflow-x-auto, [data-prevent-swipe="true"], button')) {
        return;
      }

      startCoordRef.current = { x: e.clientX, y: e.clientY, time: Date.now() };
      isTrackingRef.current = true;
      hasDeterminedAxisRef.current = false;
      isHorizontalSwipeRef.current = false;
    }

    function handleMouseMove(e: MouseEvent) {
      if (!isTrackingRef.current || !startCoordRef.current) return;

      const deltaX = e.clientX - startCoordRef.current.x;
      const deltaY = e.clientY - startCoordRef.current.y;
      const absX = Math.abs(deltaX);
      const absY = Math.abs(deltaY);

      if (!hasDeterminedAxisRef.current) {
        if (absX > 8 || absY > 8) {
          hasDeterminedAxisRef.current = true;
          if (absY >= absX) {
            isTrackingRef.current = false;
            isHorizontalSwipeRef.current = false;
            return;
          } else {
            isHorizontalSwipeRef.current = true;
          }
        }
      }
    }

    function handleMouseUp(e: MouseEvent) {
      if (!isTrackingRef.current || !startCoordRef.current || !isHorizontalSwipeRef.current) {
        isTrackingRef.current = false;
        startCoordRef.current = null;
        return;
      }

      const deltaX = e.clientX - startCoordRef.current.x;
      const deltaY = e.clientY - startCoordRef.current.y;
      const elapsed = Date.now() - startCoordRef.current.time;

      isTrackingRef.current = false;
      startCoordRef.current = null;

      const absX = Math.abs(deltaX);
      const absY = Math.abs(deltaY);

      if (elapsed <= 600 && absX >= 40 && absX > absY * 1.1) {
        justSwipedRef.current = true;
        setTimeout(() => {
          justSwipedRef.current = false;
        }, 350);
        triggerSwipe(deltaX);
      }
    }

    // Neutralizar click si se acaba de hacer un arrastre
    function handleClickCapture(e: MouseEvent) {
      if (justSwipedRef.current) {
        e.preventDefault();
        e.stopPropagation();
      }
    }

    // Registrar listeners táctiles
    el.addEventListener("touchstart", handleTouchStart, { passive: true });
    el.addEventListener("touchmove", handleTouchMove, { passive: true });
    el.addEventListener("touchend", handleTouchEnd, { passive: true });

    // Registrar listeners de mouse
    el.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    // Interceptor de click en fase de captura
    el.addEventListener("click", handleClickCapture, { capture: true });

    return () => {
      el.removeEventListener("touchstart", handleTouchStart);
      el.removeEventListener("touchmove", handleTouchMove);
      el.removeEventListener("touchend", handleTouchEnd);
      el.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      el.removeEventListener("click", handleClickCapture, { capture: true });
    };
  }, []);

  // Limpiar clase de animación
  useEffect(() => {
    if (!animClass) return;
    const timer = setTimeout(() => {
      setAnimClass("");
    }, 200);
    return () => clearTimeout(timer);
  }, [animClass]);

  return {
    containerRef,
    animClass,
  };
}

/**
 * Centra suavemente en la pantalla del móvil el botón de la categoría activa
 */
export function centrarBotonCategoria(categoria: CategoriaEvento | null) {
  if (typeof window === "undefined") return;
  const buttonId = categoria === null ? "btn-cat-all" : `btn-cat-${categoria}`;
  const btn = document.getElementById(buttonId);
  if (btn) {
    btn.scrollIntoView({
      behavior: "smooth",
      inline: "center",
      block: "nearest",
    });
  }
}
