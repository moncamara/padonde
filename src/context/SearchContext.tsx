"use client";

import { createContext, useContext, useState, useRef, useEffect } from "react";
import { useSearchParams, usePathname } from "next/navigation";

interface SearchContextType {
  busqueda: string;
  setBusqueda: (q: string) => void;
  isSearchOpen: boolean;
  setIsSearchOpen: (open: boolean) => void;
  toggleSearch: () => void;
  inputRef: React.RefObject<HTMLInputElement | null>;
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
    };
  }
  return ctx;
}
