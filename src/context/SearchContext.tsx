"use client";

import { createContext, useContext, useState, useRef, useEffect } from "react";
import { useSearchParams, usePathname } from "next/navigation";

export type CriterioOrden = "recomendados" | "hora" | "precio";

interface SearchContextType {
  busqueda: string;
  setBusqueda: (q: string) => void;
  isSearchOpen: boolean;
  setIsSearchOpen: (open: boolean) => void;
  toggleSearch: () => void;
  inputRef: React.RefObject<HTMLInputElement | null>;
  filtroTiempo: string;
  setFiltroTiempo: (t: string) => void;
  criterioOrden: CriterioOrden;
  setCriterioOrden: (o: CriterioOrden) => void;
  isFilterMenuOpen: boolean;
  setIsFilterMenuOpen: (open: boolean) => void;
  toggleFilterMenu: () => void;
}

const SearchContext = createContext<SearchContextType | null>(null);

export function SearchProvider({ children }: { children: React.ReactNode }) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const inputRef = useRef<HTMLInputElement | null>(null);

  const [busqueda, setBusquedaState] = useState<string>(() => {
    return searchParams.get("q") || "";
  });

  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(() => {
    return !!searchParams.get("q");
  });

  const [filtroTiempo, setFiltroTiempoState] = useState<string>("hoy");
  const [criterioOrden, setCriterioOrdenState] = useState<CriterioOrden>("recomendados");
  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState<boolean>(false);

  useEffect(() => {
    try {
      const savedTiempo = sessionStorage.getItem("padonde_filtro_tiempo");
      if (savedTiempo) setFiltroTiempoState(savedTiempo);
      const savedOrden = sessionStorage.getItem("padonde_criterio_orden") as CriterioOrden;
      if (savedOrden) setCriterioOrdenState(savedOrden);
    } catch {}
  }, []);

  const setFiltroTiempo = (t: string) => {
    setFiltroTiempoState(t);
    try {
      sessionStorage.setItem("padonde_filtro_tiempo", t);
    } catch {}
  };

  const setCriterioOrden = (o: CriterioOrden) => {
    setCriterioOrdenState(o);
    try {
      sessionStorage.setItem("padonde_criterio_orden", o);
    } catch {}
  };

  const toggleFilterMenu = () => {
    setIsFilterMenuOpen((prev) => !prev);
  };

  const setBusqueda = (q: string) => {
    setBusquedaState(q);
    if (typeof window !== "undefined") {
      try {
        const params = new URLSearchParams(window.location.search);
        if (q.trim()) {
          params.set("q", q);
        } else {
          params.delete("q");
        }
        const newQuery = params.toString();
        const newUrl = newQuery ? `${pathname}?${newQuery}` : pathname;
        window.history.replaceState(null, "", newUrl);
      } catch {}
    }
  };

  const toggleSearch = () => {
    setIsSearchOpen((prev) => {
      const next = !prev;
      if (!next && busqueda) {
        setBusqueda("");
      }
      if (next) {
        setTimeout(() => {
          inputRef.current?.focus();
        }, 80);
      }
      return next;
    });
  };

  return (
    <SearchContext.Provider
      value={{
        busqueda,
        setBusqueda,
        isSearchOpen,
        setIsSearchOpen,
        toggleSearch,
        inputRef,
        filtroTiempo,
        setFiltroTiempo,
        criterioOrden,
        setCriterioOrden,
        isFilterMenuOpen,
        setIsFilterMenuOpen,
        toggleFilterMenu,
      }}
    >
      {children}
    </SearchContext.Provider>
  );
}

export function useZonaSearch() {
  const ctx = useContext(SearchContext);
  if (!ctx) {
    return {
      busqueda: "",
      setBusqueda: () => {},
      isSearchOpen: false,
      setIsSearchOpen: () => {},
      toggleSearch: () => {},
      inputRef: { current: null },
      filtroTiempo: "hoy",
      setFiltroTiempo: () => {},
      criterioOrden: "recomendados" as CriterioOrden,
      setCriterioOrden: () => {},
      isFilterMenuOpen: false,
      setIsFilterMenuOpen: () => {},
      toggleFilterMenu: () => {},
    };
  }
  return ctx;
}
