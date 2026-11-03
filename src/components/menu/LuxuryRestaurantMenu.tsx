"use client";

import { useState, useEffect, useMemo, useRef, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import {
  LAZY_CAT_MENU,
  type MenuRestaurante,
  type IdiomaCodigo,
} from "@/data/menus/lazyCatMenu";
import { TEMAS_MENU, LISTA_TEMAS, type TemaMenuId } from "./menuThemes";
import "./luxury-menu.css";

interface LuxuryRestaurantMenuProps {
  initialLocale?: string;
  menu?: MenuRestaurante;
  /** Tema inicial. Si no se pasa, usa el tema definido en el menú o "sierra". */
  tema?: TemaMenuId;
  /** Muestra un selector flotante de temas (solo para demos internas). */
  mostrarSelectorTema?: boolean;
  /** Modo incrustado (iframe del admin): oculta el enlace de volver. */
  embebido?: boolean;
}


export function LuxuryRestaurantMenu({
  initialLocale = "es",
  menu = LAZY_CAT_MENU,
  tema,
  mostrarSelectorTema = false,
  embebido = false,
}: LuxuryRestaurantMenuProps) {
  // Idioma activo: soporta ES, EN, FR, DE
  const [idioma, setIdioma] = useState<IdiomaCodigo>(() => {
    const valid: IdiomaCodigo[] = ["es", "en", "fr", "de"];
    return valid.includes(initialLocale as IdiomaCodigo)
      ? (initialLocale as IdiomaCodigo)
      : "es";
  });

  // Tema visual activo
  const [temaId, setTemaId] = useState<TemaMenuId>(
    tema ?? menu.tema ?? "sierra"
  );

  // Sincronizar si cambia el tema desde props (ej. selector en panel admin)
  useEffect(() => {
    if (tema) {
      setTemaId(tema);
    }
  }, [tema]);

  const th = TEMAS_MENU[temaId];


  // Categoría activa para scroll suave
  const [categoriaActiva, setCategoriaActiva] = useState<string>(
    menu.categorias[0]?.id || ""
  );

  // Búsqueda o filtro dietario (mutuamente excluyentes para evitar conflicto visual)
  const [busqueda, setBusqueda] = useState<string>("");
  const [filtroEspecial, setFiltroEspecial] = useState<"ninguno" | "veggie" | "chef">("ninguno");

  // Happy Hour en vivo (Colombia UTC-5)
  const [esHappyHourActivo, setEsHappyHourActivo] = useState<boolean>(false);

  // Botón flotante para volver arriba (menú largo en móvil)
  const [mostrarScrollArriba, setMostrarScrollArriba] = useState<boolean>(false);

  // Estado para visor modal de fotos de platos (Lightbox superpuesto)
  const [mounted, setMounted] = useState<boolean>(false);
  const [fotoModal, setFotoModal] = useState<{
    url: string;
    titulo: string;
    subtitulo?: string;
    descripcion?: string;
    precio?: number;
    insignia?: string;
  } | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Bloquear scroll de la página y escuchar tecla Escape cuando el visor de foto esté abierto
  useEffect(() => {
    if (fotoModal) {
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          setFotoModal(null);
        }
      };
      window.addEventListener("keydown", handleKeyDown);
      return () => {
        document.body.style.overflow = prevOverflow;
        window.removeEventListener("keydown", handleKeyDown);
      };
    }
  }, [fotoModal]);

  const categoryRefs = useRef<Record<string, HTMLElement | null>>({});
  const originalBgRef = useRef<string | null>(null);

  // Detectar scroll para mostrar el botón de volver arriba
  useEffect(() => {
    const handleScroll = () => {
      setMostrarScrollArriba(window.scrollY > 350);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const irArriba = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Pintar el fondo de toda la ventana con el color del tema
  // (sobrescribe el crema global de PaDónde mientras la carta está montada, excepto si está embebido en admin)
  useEffect(() => {
    if (embebido) return;

    if (originalBgRef.current === null) {
      originalBgRef.current = document.body.style.backgroundColor || "#F4F1EA";
    }

    document.documentElement.classList.add("luxury-menu-active");
    document.body.classList.add("luxury-menu-active");
    document.body.style.backgroundColor = th.bg;
    document.documentElement.style.backgroundColor = th.bg;
  }, [th.bg, embebido]);

  useEffect(() => {
    return () => {
      if (originalBgRef.current !== null) {
        document.documentElement.classList.remove("luxury-menu-active");
        document.body.classList.remove("luxury-menu-active");
        document.body.style.backgroundColor = originalBgRef.current;
        document.documentElement.style.backgroundColor = originalBgRef.current;
      }
    };
  }, []);

  useEffect(() => {
    const verificarHappyHour = () => {
      const ahoraBogota = new Date(
        new Date().toLocaleString("en-US", { timeZone: "America/Bogota" })
      );
      const hora = ahoraBogota.getHours();
      setEsHappyHourActivo(hora >= 17 && hora < 19);
    };

    verificarHappyHour();
    const interval = setInterval(verificarHappyHour, 60000);
    return () => clearInterval(interval);
  }, []);

  const formatearPrecio = (valorCop: number) => {
    return `$${valorCop.toLocaleString("es-CO")} COP`;
  };

  const scrollToCategory = (catId: string) => {
    setCategoriaActiva(catId);
    const el = categoryRefs.current[catId];
    if (el) {
      const yOffset = -100;
      const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: "smooth" });
    }
  };

  // Mensaje directo y realista hacia WhatsApp (consulta de mesa / disponibilidad)
  const whatsappUrl = useMemo(() => {
    const rawNumber = menu.whatsapp || "573218507204";
    const telefono = rawNumber.replace(/\D/g, "");
    let mensaje = "";

    if (idioma === "en") {
      mensaje = `Hello ${menu.negocioNombre}! I saw your menu on PaDónde and would like to check table availability for today.`;
    } else if (idioma === "fr") {
      mensaje = `Bonjour ${menu.negocioNombre} ! J'ai vu votre carte sur PaDónde et j'aimerais vérifier la disponibilité d'une table pour aujourd'hui.`;
    } else if (idioma === "de") {
      mensaje = `Hallo ${menu.negocioNombre}! Ich habe Ihre Speisekarte auf PaDónde gesehen und möchte die Tischverfügbarkeit für heute anfragen.`;
    } else {
      mensaje = `¡Hola ${menu.negocioNombre}! Vi su carta en PaDónde y quisiera consultar disponibilidad de mesa / horario para hoy.`;
    }

    return `https://wa.me/${telefono}?text=${encodeURIComponent(mensaje)}`;
  }, [menu, idioma]);

  const t = {
    es: {
      volver: "← Volver a la Cartelera",
      buscarPlato: "Buscar plato o ingrediente...",
      soloVeggie: "🌱 Solo Vegetarianos",
      soloChef: "⭐ Favoritos del Chef",
      happyHourTitulo: "Happy Hour Diario",
      happyHourHorario: "5:00 PM – 7:00 PM",
      enCurso: "En curso",
      verPdf: "Ver Menú Original (PDF)",
      consultarMesa: "Reservar Mesa",
      calificarGoogle: "Calificar en Google",
      calificarCorto: "Calificar",
      precioNota: "Precios en pesos colombianos (COP). Servicio voluntario.",
      hechoPor: "Carta Inteligente & Traductor · PaDónde Minca",
      avisoEnMesa: "💡 ¿Estás en la mesa? Muestra este menú al mesero para ordenar rápido en tu idioma.",
      opcion: "opción",
      opciones: "opciones",
      irArriba: "Subir al inicio",
      limpiarFiltros: "Limpiar filtros",
    },
    en: {
      volver: "← Back to Live Board",
      buscarPlato: "Search dishes or ingredients...",
      soloVeggie: "🌱 Vegetarian Only",
      soloChef: "⭐ Chef's Favorites",
      happyHourTitulo: "Daily Happy Hour",
      happyHourHorario: "5:00 PM – 7:00 PM",
      enCurso: "Active now",
      verPdf: "View Original Printed Menu (PDF)",
      consultarMesa: "Reserve Table",
      calificarGoogle: "Rate on Google",
      calificarCorto: "Rate",
      precioNota: "Prices in Colombian Pesos (COP). Gratuity is voluntary.",
      hechoPor: "Smart Table Menu & Translator · PaDónde Minca",
      avisoEnMesa: "💡 At the table? Show this screen to your server to order easily in your language.",
      opcion: "option",
      opciones: "options",
      irArriba: "Back to top",
      limpiarFiltros: "Clear filters",
    },
    fr: {
      volver: "← Retour à l'Agenda",
      buscarPlato: "Rechercher un plat ou ingrédient...",
      soloVeggie: "🌱 Végétarien Uniquement",
      soloChef: "⭐ Coups de Cœur du Chef",
      happyHourTitulo: "Happy Hour Quotidien",
      happyHourHorario: "17h00 – 19h00",
      enCurso: "En cours",
      verPdf: "Voir le Menu Imprimé Original (PDF)",
      consultarMesa: "Réserver une Table",
      calificarGoogle: "Noter sur Google",
      calificarCorto: "Noter",
      precioNota: "Prix en pesos colombiens (COP). Pourboire facultatif.",
      hechoPor: "Menu Intelligent & Traducteur de Table · PaDónde Minca",
      avisoEnMesa: "💡 À table ? Montrez cet écran à votre serveur pour commander facilement dans votre langue.",
      opcion: "option",
      opciones: "options",
      irArriba: "Haut de page",
      limpiarFiltros: "Effacer les filtres",
    },
    de: {
      volver: "← Zurück zur Übersicht",
      buscarPlato: "Gericht oder Zutat suchen...",
      soloVeggie: "🌱 Nur Vegetarisch",
      soloChef: "⭐ Empfehlungen des Chefs",
      happyHourTitulo: "Tägliche Happy Hour",
      happyHourHorario: "17:00 – 19:00 Uhr",
      enCurso: "Jetzt aktiv",
      verPdf: "Original gedruckte Speisekarte (PDF)",
      consultarMesa: "Tisch anfragen",
      calificarGoogle: "Auf Google bewerten",
      calificarCorto: "Bewerten",
      precioNota: "Preise in kolumbianischen Pesos (COP). Bedienungsgeld freiwillig.",
      hechoPor: "Smarte Speisekarte & Übersetzer · PaDónde Minca",
      avisoEnMesa: "💡 Am Tisch? Zeigen Sie diese Karte der Bedienung, um entspannt in Ihrer Sprache zu bestellen.",
      opcion: "Option",
      opciones: "Optionen",
      irArriba: "Nach oben",
      limpiarFiltros: "Filter zurücksetzen",
    },
  }[idioma];

  // Variables CSS del tema activo (consumidas por luxury-menu.css)
  const cssVars = {
    "--lx-bg": th.bg,
    "--lx-text": th.text,
    "--lx-text-muted": th.textMuted,
    "--lx-text-soft": th.textSoft,
    "--lx-border": th.border,
    "--lx-border-strong": th.borderStrong,
    "--lx-font-title": th.fontTitle,
    "--lx-card-from": th.cardFrom,
    "--lx-card-to": th.cardTo,
    "--lx-card-shadow": th.cardShadow,
    "--lx-card-hover-shadow": th.cardHoverShadow,
    "--lx-input-bg": th.inputBg,
    "--lx-input-text": th.inputText,
    "--lx-nav-bg": th.navBg,
    "--lx-title-gradient": th.titleGradient,
    "--lx-price-gradient": th.priceGradient,
    "--lx-btn-gradient": th.btnGradient,
    "--lx-btn-text": th.btnText,
    "--lx-btn-shadow": th.btnShadow,
    "--lx-pill-bg": th.pillBg,
    "--lx-pill-text": th.pillText,
    "--lx-pill-active-gradient": th.pillActiveGradient,
    "--lx-pill-active-text": th.pillActiveText,
    "--lx-badge-bg": th.badgeBg,
    "--lx-badge-border": th.badgeBorder,
    "--lx-badge-text": th.badgeText,
  } as CSSProperties;

  const chipGroup: CSSProperties = {
    display: "flex",
    alignItems: "center",
    backgroundColor: th.chipBg,
    borderRadius: "9999px",
    padding: "2px",
    border: `1px solid ${th.border}`,
  };

  const chip = (activo: boolean): CSSProperties => ({
    fontSize: "10px",
    fontWeight: "bold",
    padding: "2px 8px",
    borderRadius: "9999px",
    cursor: "pointer",
    border: "none",
    backgroundColor: activo ? th.chipActiveBg : "transparent",
    color: activo ? th.chipActiveText : th.chipText,
    display: "flex",
    alignItems: "center",
    gap: "2px",
  });

  const filtroBtn = (
    activo: boolean,
    colorBorde: string,
    colorBg: string,
    colorTexto: string
  ): CSSProperties => ({
    flex: 1,
    fontSize: "0.78rem",
    padding: "0.5rem 0.75rem",
    borderRadius: "0.75rem",
    border: activo ? `1.5px solid ${colorBorde}` : `1px solid ${th.border}`,
    backgroundColor: activo ? colorBg : th.inputBg,
    color: activo ? colorTexto : th.textMuted,
    fontWeight: activo ? 700 : 500,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "0.35rem",
    transition: "all 0.2s ease",
    boxShadow: activo ? `0 2px 10px ${colorBorde}33` : "none",
  });

  // Normalizador para búsqueda insensible a mayúsculas, minúsculas y tildes
  const normalizar = (texto: string) =>
    (texto || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim();

  // Obtener descripción de un plato soportando descripcion / descripciones / ingredientes
  const getDescripcionPlato = (item: any, idm: IdiomaCodigo): string | null => {
    const d = item.descripcion ?? item.descripciones ?? item.ingredientes;
    if (!d) return null;
    if (typeof d === "string") return d;
    return d[idm] || d.es || d.en || Object.values(d)[0] || null;
  };

  // Obtener nombre de un plato soportando nombres / nombre / titulo
  const getNombrePlato = (item: any, idm: IdiomaCodigo): string => {
    const n = item.nombres ?? item.nombre ?? item.titulo;
    if (!n) return "Plato";
    if (typeof n === "string") return n;
    return n[idm] || n.es || n.en || Object.values(n)[0] || "Plato";
  };

  const tienePlatosVeggie = useMemo(() => {
    return menu.categorias.some((cat) =>
      cat.items?.some((i) => {
        const et = (i.etiquetas as string[]) || [];
        return et.includes("vegetariano") || et.includes("veggie") || et.includes("vegano");
      })
    );
  }, [menu]);

  const tienePlatosChef = useMemo(() => {
    return menu.categorias.some((cat) =>
      cat.items?.some((i) => {
        const et = (i.etiquetas as string[]) || [];
        return et.includes("chef") || et.includes("favorito") || et.includes("recomendado");
      })
    );
  }, [menu]);

  // Filtrado de platos con búsqueda inteligente multilingüe y sin tildes
  const categoriasConPlatos = useMemo(() => {
    const q = normalizar(busqueda);

    return menu.categorias.map((cat) => {
      // Coincidencia por nombre de categoría (ej: "cervezas", "hamburguesa", "postres", "cocteles")
      const catCoincide = q
        ? normalizar(cat.titulos[idioma] || "").includes(q) ||
          normalizar(cat.titulos.es || "").includes(q) ||
          normalizar(cat.titulos.en || "").includes(q)
        : false;

      const itemsFiltrados = cat.items.filter((item) => {
        const itemEts = (item.etiquetas as string[]) || [];
        // Filtro especial dietario o de recomendación
        if (
          filtroEspecial === "veggie" &&
          !itemEts.includes("vegetariano") &&
          !itemEts.includes("veggie") &&
          !itemEts.includes("vegano")
        ) {
          return false;
        }
        if (
          filtroEspecial === "chef" &&
          !itemEts.includes("chef") &&
          !itemEts.includes("favorito") &&
          !itemEts.includes("recomendado")
        ) {
          return false;
        }

        if (!q) return true;
        if (catCoincide) return true;

        // Búsqueda en nombre
        const nomActual = normalizar(getNombrePlato(item, idioma));
        const nomEs = normalizar(getNombrePlato(item, "es"));
        const nomEn = normalizar(getNombrePlato(item, "en"));

        // Búsqueda en descripción o ingredientes
        const descActual = normalizar(getDescripcionPlato(item, idioma) || "");
        const descEs = normalizar(getDescripcionPlato(item, "es") || "");
        const descEn = normalizar(getDescripcionPlato(item, "en") || "");

        // Búsqueda en insignias o notas
        const insignia = normalizar(item.insignia?.[idioma] || item.insignia?.es || "");

        return (
          nomActual.includes(q) ||
          nomEs.includes(q) ||
          nomEn.includes(q) ||
          descActual.includes(q) ||
          descEs.includes(q) ||
          descEn.includes(q) ||
          insignia.includes(q)
        );
      });

      return {
        ...cat,
        itemsFiltrados,
      };
    });
  }, [menu, busqueda, filtroEspecial, idioma]);

  const categoriasVisibles = useMemo(() => {
    return categoriasConPlatos.filter((cat) => cat.itemsFiltrados.length > 0);
  }, [categoriasConPlatos]);

  const totalResultados = useMemo(() => {
    return categoriasVisibles.reduce(
      (acc, cat) => acc + cat.itemsFiltrados.length,
      0
    );
  }, [categoriasVisibles]);

  return (
    <div
      key={temaId}
      className={`luxury-menu-wrapper theme-${temaId}`}
      style={{
        backgroundColor: th.bg,
        color: th.text,
        minHeight: "100vh",
        paddingBottom: "6.5rem",
        transition: "background-color 0.3s ease, color 0.3s ease",
      }}
    >
      {/* ─── FONDO DECORATIVO CON HALOS DEL TEMA ─── */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          pointerEvents: "none",
          overflow: "hidden",
          zIndex: 0,
        }}
      >
        <div
          style={{
            position: "absolute",
            top: "-150px",
            left: "50%",
            transform: "translateX(-50%)",
            width: "700px",
            height: "700px",
            background: `radial-gradient(circle, ${th.halo1} 0%, transparent 70%)`,
            borderRadius: "9999px",
            filter: "blur(60px)",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: "40%",
            right: "-100px",
            width: "450px",
            height: "450px",
            background: `radial-gradient(circle, ${th.halo2} 0%, transparent 70%)`,
            borderRadius: "9999px",
            filter: "blur(50px)",
          }}
        />
      </div>

      {/* ─── BARRA SUPERIOR: VOLVER + MONEDA + IDIOMA ─── */}
      <header
        className="luxury-nav-sticky"
        style={{
          position: "sticky",
          top: 0,
          zIndex: 40,
          borderBottom: `1px solid ${th.border}`,
          padding: "0.65rem 1rem",
        }}
      >
        <div
          style={{
            maxWidth: "56rem",
            margin: "0 auto",
            display: "flex",
            alignItems: "center",
            justifyContent: embebido ? "flex-end" : "space-between",
            gap: "0.75rem",
          }}
        >
          {!embebido && (
            <Link
              href={`/${idioma}/minca`}
              style={{
                fontSize: "0.75rem",
                fontFamily: "var(--font-playfair), Georgia, serif",
                color: th.accent,
                textDecoration: "none",
                display: "flex",
                alignItems: "center",
                gap: "0.25rem",
              }}
            >
              <span>{t.volver}</span>
            </Link>
          )}

          <div style={{ display: "flex", alignItems: "center" }}>
            <div style={chipGroup}>
              {(
                [
                  { code: "es", label: "ES" },
                  { code: "en", label: "EN" },
                  { code: "fr", label: "FR" },
                  { code: "de", label: "DE" },
                ] as const
              ).map((lang) => {
                const isActive = idioma === lang.code;
                return (
                  <button
                    key={lang.code}
                    type="button"
                    onClick={() => setIdioma(lang.code)}
                    style={{
                      fontSize: "0.72rem",
                      fontWeight: isActive ? 700 : 500,
                      padding: "3px 9px",
                      borderRadius: "9999px",
                      cursor: "pointer",
                      border: "none",
                      backgroundColor: isActive ? th.chipActiveBg : "transparent",
                      color: isActive ? th.chipActiveText : th.chipText,
                      transition: "all 0.15s ease",
                      letterSpacing: "0.04em",
                    }}
                    aria-label={`Cambiar a ${lang.label}`}
                  >
                    {lang.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </header>

      {/* ─── CABECERA DEL RESTAURANTE (OPTIMIZADA PARA MÓVIL) ─── */}
      <section
        style={{
          position: "relative",
          zIndex: 10,
          padding: "1.15rem 1rem 0.65rem",
          textAlign: "center",
          maxWidth: "48rem",
          margin: "0 auto",
        }}
      >
        <h1
          className="luxury-gold-title"
          style={{
            fontSize: "clamp(1.5rem, 4.5vw, 2.35rem)",
            fontWeight: 800,
            lineHeight: 1.15,
            margin: "0 0 0.25rem",
          }}
        >
          {menu.negocioNombre}
        </h1>

        <p
          className="luxury-gold-subtitle"
          style={{
            fontSize: "0.85rem",
            margin: "0 auto 0.65rem",
            maxWidth: "30rem",
            fontStyle: "italic",
            lineHeight: 1.35,
          }}
        >
          {menu.subtitulo[idioma]}
        </p>

        {/* Happy Hour: ÚNICAMENTE si el restaurante lo tiene configurado en su JSON */}
        {Boolean((menu as any).happyHour) && (
          <div style={{ display: "inline-block" }}>
            <div
              style={{
                padding: "0.25rem 0.75rem",
                borderRadius: "9999px",
                border: esHappyHourActivo
                  ? "1px solid rgba(16, 185, 129, 0.6)"
                  : `1px solid ${th.borderStrong}`,
                backgroundColor: esHappyHourActivo
                  ? "rgba(16, 185, 129, 0.12)"
                  : th.surface,
                color: esHappyHourActivo
                  ? th.isDark
                    ? "#A7F3D0"
                    : "#047857"
                  : th.heading,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.35rem",
                boxShadow: th.cardShadow,
              }}
            >
              <span style={{ fontSize: "0.75rem" }}>
                {esHappyHourActivo ? "🟢" : "⏰"}
              </span>
              <span
                style={{
                  fontSize: "0.7rem",
                  fontWeight: 700,
                  letterSpacing: "0.04em",
                  textTransform: "uppercase",
                }}
              >
                {t.happyHourTitulo} · {t.happyHourHorario}
              </span>
              {esHappyHourActivo && (
                <span
                  style={{
                    fontSize: "0.62rem",
                    fontWeight: 700,
                    backgroundColor: "rgba(16, 185, 129, 0.25)",
                    color: th.isDark ? "#6EE7B7" : "#065F46",
                    padding: "0.08rem 0.4rem",
                    borderRadius: "9999px",
                    border: "1px solid rgba(16, 185, 129, 0.4)",
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                  }}
                >
                  ● {t.enCurso}
                </span>
              )}
            </div>
          </div>
        )}
      </section>

      {/* ─── BUSCADOR Y FILTROS ─── */}
      <section
        style={{
          position: "relative",
          zIndex: 10,
          padding: "0 1rem",
          maxWidth: "56rem",
          margin: "0 auto 1.25rem",
        }}
      >
        <div
          style={{
            backgroundColor: th.surface,
            border: `1px solid ${th.border}`,
            borderRadius: "1rem",
            padding: "0.75rem",
            boxShadow: th.cardShadow,
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            gap: "0.75rem",
          }}
        >
          <div style={{ position: "relative", flex: 1, minWidth: "220px" }}>
            <span
              style={{
                position: "absolute",
                left: "0.85rem",
                top: "50%",
                transform: "translateY(-50%)",
                fontSize: "0.85rem",
              }}
            >
              🔍
            </span>
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder={t.buscarPlato}
              className="luxury-input"
              style={{
                width: "100%",
                padding: "0.55rem 2rem 0.55rem 2.25rem",
                fontSize: "0.8rem",
              }}
            />
            {busqueda && (
              <button
                type="button"
                onClick={() => setBusqueda("")}
                style={{
                  position: "absolute",
                  right: "0.75rem",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "transparent",
                  border: "none",
                  color: th.accent,
                  cursor: "pointer",
                  fontSize: "0.75rem",
                }}
              >
                ✕
              </button>
            )}
          </div>

          {(tienePlatosVeggie || tienePlatosChef) && (
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              {tienePlatosVeggie && (
                <button
                  type="button"
                  onClick={() =>
                    setFiltroEspecial(filtroEspecial === "veggie" ? "ninguno" : "veggie")
                  }
                  style={filtroBtn(
                    filtroEspecial === "veggie",
                    "#10B981",
                    "rgba(16, 185, 129, 0.16)",
                    "#34D399"
                  )}
                >
                  <span>{filtroEspecial === "veggie" ? "✓" : "🌱"}</span>
                  <span>{t.soloVeggie.replace(/^🌱\s*/, "")}</span>
                </button>
              )}
              {tienePlatosChef && (
                <button
                  type="button"
                  onClick={() =>
                    setFiltroEspecial(filtroEspecial === "chef" ? "ninguno" : "chef")
                  }
                  style={filtroBtn(
                    filtroEspecial === "chef",
                    "#F59E0B",
                    "rgba(245, 158, 11, 0.16)",
                    "#FBBF24"
                  )}
                >
                  <span>{filtroEspecial === "chef" ? "✓" : "⭐"}</span>
                  <span>{t.soloChef.replace(/^⭐\s*/, "")}</span>
                </button>
              )}
            </div>
          )}

          {/* Indicador de resultados activos cuando hay búsqueda o filtro */}
          {(busqueda.trim() || filtroEspecial !== "ninguno") && (
            <div
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "0.75rem",
                fontSize: "0.74rem",
                color: th.textMuted,
                paddingTop: "0.45rem",
                marginTop: "0.15rem",
                borderTop: `1px solid ${th.border}`,
              }}
            >
              <span style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem" }}>
                <span style={{ color: th.accent, fontSize: "0.65rem" }}>●</span>
                <span>
                  {totalResultados === 1
                    ? `1 ${t.opcion} encontrada`
                    : `${totalResultados} ${t.opciones} encontradas`}
                  {busqueda && ` para "${busqueda}"`}
                </span>
              </span>
              <button
                type="button"
                onClick={() => {
                  setBusqueda("");
                  setFiltroEspecial("ninguno");
                }}
                style={{
                  background: th.isDark ? "rgba(255, 255, 255, 0.06)" : "rgba(0, 0, 0, 0.04)",
                  border: `1px solid ${th.border}`,
                  borderRadius: "9999px",
                  color: th.accent,
                  cursor: "pointer",
                  fontSize: "0.7rem",
                  padding: "0.22rem 0.65rem",
                  fontWeight: 600,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.3rem",
                  whiteSpace: "nowrap",
                  transition: "all 0.15s ease",
                }}
              >
                <span>✕</span>
                <span>{t.limpiarFiltros}</span>
              </button>
            </div>
          )}
        </div>
      </section>

      {/* ─── PESTAÑAS DE CATEGORÍAS ─── */}
      <nav
        className="luxury-nav-sticky"
        style={{
          position: "sticky",
          top: "46px",
          zIndex: 30,
          borderTop: `1px solid ${th.border}`,
          borderBottom: `1px solid ${th.border}`,
          padding: "0.6rem 0.75rem",
          overflowX: "auto",
        }}
      >
        <div
          style={{
            maxWidth: "56rem",
            margin: "0 auto",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            width: "max-content",
          }}
        >
          {categoriasVisibles.map((cat) => {
            const esActiva = categoriaActiva === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => scrollToCategory(cat.id)}
                className={
                  esActiva
                    ? "luxury-category-pill-active"
                    : "luxury-category-pill"
                }
                style={{
                  fontSize: "0.75rem",
                  padding: "0.4rem 0.9rem",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.35rem",
                  whiteSpace: "nowrap",
                }}
              >
                <span>{cat.icono}</span>
                <span>{cat.titulos[idioma]}</span>
                {(busqueda.trim() || filtroEspecial !== "ninguno") && (
                  <span
                    style={{
                      fontSize: "0.68rem",
                      opacity: 0.75,
                      marginLeft: "0.15rem",
                      fontWeight: 700,
                    }}
                  >
                    ({cat.itemsFiltrados.length})
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </nav>

      {/* ─── CATEGORÍAS Y PLATOS ─── */}
      <main
        style={{
          position: "relative",
          zIndex: 10,
          maxWidth: "56rem",
          margin: "0 auto",
          padding: "1.5rem 1rem 0",
          display: "flex",
          flexDirection: "column",
          gap: "2.75rem",
        }}
      >
        {/* Estado Vacío si ningún plato coincide con la búsqueda */}
        {categoriasVisibles.length === 0 && (
          <div
            style={{
              textAlign: "center",
              padding: "3.5rem 1.5rem",
              backgroundColor: th.surface,
              borderRadius: "1.25rem",
              border: `1px dashed ${th.border}`,
              maxWidth: "32rem",
              margin: "1rem auto 2rem",
            }}
          >
            <div style={{ fontSize: "2.5rem", marginBottom: "0.75rem" }}>🍽️</div>
            <h3
              style={{
                fontFamily: th.fontTitle,
                color: th.heading,
                fontSize: "1.15rem",
                margin: "0 0 0.5rem",
              }}
            >
              No encontramos platos para &ldquo;{busqueda}&rdquo;
            </h3>
            {filtroEspecial !== "ninguno" && (
              <p style={{ fontSize: "0.8rem", color: th.textMuted, margin: "0 0 1rem" }}>
                {filtroEspecial === "veggie"
                  ? "Tienes activo el filtro 🌱 Solo Vegetarianos. Prueba desactivándolo para ver todas las opciones."
                  : "Tienes activo el filtro ⭐ Favoritos del Chef. Prueba desactivándolo para ver todas las opciones."}
              </p>
            )}
            <button
              type="button"
              onClick={() => {
                setBusqueda("");
                setFiltroEspecial("ninguno");
              }}
              className="luxury-btn-gold"
              style={{
                padding: "0.6rem 1.35rem",
                fontSize: "0.82rem",
                borderRadius: "0.85rem",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "0.45rem",
                fontWeight: 700,
              }}
            >
              <span>✕</span>
              <span>Ver toda la carta</span>
            </button>
          </div>
        )}

        {categoriasVisibles.map((cat) => {
          const itemsFiltrados = cat.itemsFiltrados;

          return (
            <section
              key={cat.id}
              id={cat.id}
              ref={(el) => {
                categoryRefs.current[cat.id] = el;
              }}
              style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
            >
              <div
                style={{
                  borderBottom: `1px solid ${th.borderStrong}`,
                  paddingBottom: "0.75rem",
                  display: "flex",
                  alignItems: "flex-end",
                  justifyContent: "space-between",
                  gap: "0.75rem",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <span style={{ fontSize: "1.35rem" }}>{cat.icono}</span>
                  <h2
                    style={{
                      fontFamily: th.fontTitle,
                      fontSize: "clamp(1.15rem, 3vw, 1.45rem)",
                      fontWeight: 700,
                      color: th.heading,
                      margin: 0,
                    }}
                  >
                    {cat.titulos[idioma]}
                  </h2>
                </div>
                <span
                  style={{
                    fontSize: "0.65rem",
                    fontFamily: "monospace",
                    color: th.accentMuted,
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                    whiteSpace: "nowrap",
                  }}
                >
                  {itemsFiltrados.length}{" "}
                  {itemsFiltrados.length === 1 ? t.opcion : t.opciones}
                </span>
              </div>

              {/* Banner Destacado de Categoría (Visual Appetite Appeal) */}
              {cat.imagenPortada && (
                <div
                  onClick={() =>
                    setFotoModal({
                      url: cat.imagenPortada!,
                      titulo: cat.titulos[idioma] || cat.titulos.es,
                      subtitulo: cat.subtitulos?.[idioma] || cat.titulos[idioma],
                    })
                  }
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setFotoModal({
                        url: cat.imagenPortada!,
                        titulo: cat.titulos[idioma] || cat.titulos.es,
                        subtitulo: cat.subtitulos?.[idioma] || cat.titulos[idioma],
                      });
                    }
                  }}
                  aria-label={`Ver foto completa de ${cat.titulos[idioma] || cat.titulos.es}`}
                  className="relative w-full overflow-hidden rounded-2xl group h-36 sm:h-44 aspect-[16/9] shadow-md border cursor-pointer select-none"
                  style={{
                    borderColor: th.border,
                    backgroundColor: th.surface,
                  }}
                >
                  <img
                    src={cat.imagenPortada}
                    alt={cat.titulos[idioma] || cat.titulos.es}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 select-none"
                    loading="lazy"
                  />
                  {/* Badge flotante: Toca para ver completa */}
                  <div
                    style={{
                      position: "absolute",
                      top: "0.65rem",
                      right: "0.65rem",
                      zIndex: 2,
                      padding: "4px 10px",
                      borderRadius: "9999px",
                      backgroundColor: "rgba(0,0,0,0.65)",
                      backdropFilter: "blur(8px)",
                      WebkitBackdropFilter: "blur(8px)",
                      border: "1px solid rgba(255, 255, 255, 0.25)",
                      color: "#FFFFFF",
                      fontSize: "0.68rem",
                      fontWeight: 600,
                      display: "flex",
                      alignItems: "center",
                      gap: "0.3rem",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.4)",
                      pointerEvents: "none",
                    }}
                  >
                    <span>🔍</span>
                    <span>
                      {idioma === "en"
                        ? "Tap to expand"
                        : idioma === "fr"
                        ? "Agrandir"
                        : idioma === "de"
                        ? "Vergrößern"
                        : "Toca para ampliar"}
                    </span>
                  </div>
                  {/* Gradiente protector para contraste y toque editorial */}
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      background: "linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.15) 50%, transparent 100%)",
                      pointerEvents: "none",
                      display: "flex",
                      alignItems: "flex-end",
                      padding: "0.85rem 1rem",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
                      <span
                        style={{
                          fontFamily: th.fontTitle,
                          fontSize: "0.95rem",
                          fontWeight: 700,
                          color: "#FFFFFF",
                          textShadow: "0 2px 6px rgba(0,0,0,0.8)",
                        }}
                      >
                        {cat.subtitulos?.[idioma] || cat.titulos[idioma]}
                      </span>
                      <span
                        style={{
                          fontSize: "0.68rem",
                          fontFamily: "monospace",
                          fontWeight: 700,
                          padding: "0.2rem 0.55rem",
                          borderRadius: "9999px",
                          backgroundColor: "rgba(0,0,0,0.6)",
                          backdropFilter: "blur(6px)",
                          color: th.accent,
                          border: `1px solid ${th.border}`,
                        }}
                      >
                        {itemsFiltrados.length} {itemsFiltrados.length === 1 ? t.opcion : t.opciones}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Tarjetas editoriales (sin carrito de compras) */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                  gap: "0.85rem",
                }}
              >
                {itemsFiltrados.map((item) => (
                  <article
                    key={item.id}
                    className="luxury-dish-card"
                    style={{
                      padding: "0.85rem",
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.55rem",
                    }}
                  >
                    {item.imagenUrl && (
                      <div
                        onClick={() =>
                          setFotoModal({
                            url: item.imagenUrl!,
                            titulo: getNombrePlato(item, idioma),
                            descripcion: getDescripcionPlato(item, idioma) || undefined,
                            precio: item.precio,
                            insignia: item.insignia?.[idioma],
                          })
                        }
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            setFotoModal({
                              url: item.imagenUrl!,
                              titulo: getNombrePlato(item, idioma),
                              descripcion: getDescripcionPlato(item, idioma) || undefined,
                              precio: item.precio,
                              insignia: item.insignia?.[idioma],
                            });
                          }
                        }}
                        aria-label={`Ver foto completa de ${getNombrePlato(item, idioma)}`}
                        className="group/img cursor-pointer select-none"
                        style={{
                          position: "relative",
                          width: "100%",
                          height: "165px",
                          borderRadius: "0.75rem",
                          overflow: "hidden",
                          border: `1px solid ${th.border}`,
                          backgroundColor: th.imageBg,
                        }}
                      >
                        <img
                          src={item.imagenUrl}
                          alt={getNombrePlato(item, idioma)}
                          width={320}
                          height={165}
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                            transition: "transform 0.45s ease",
                          }}
                          className="group-hover/img:scale-105"
                          loading="lazy"
                          decoding="async"
                        />
                        {/* Indicador de Toca para ampliar */}
                        <div
                          style={{
                            position: "absolute",
                            bottom: "0.5rem",
                            right: "0.5rem",
                            padding: "3px 8px",
                            borderRadius: "9999px",
                            backgroundColor: "rgba(0, 0, 0, 0.7)",
                            backdropFilter: "blur(6px)",
                            WebkitBackdropFilter: "blur(6px)",
                            border: "1px solid rgba(255, 255, 255, 0.2)",
                            color: "#FFFFFF",
                            fontSize: "0.62rem",
                            fontWeight: 600,
                            display: "flex",
                            alignItems: "center",
                            gap: "0.25rem",
                            boxShadow: "0 2px 6px rgba(0,0,0,0.35)",
                            pointerEvents: "none",
                          }}
                        >
                          <span>🔍</span>
                          <span>
                            {idioma === "en"
                              ? "Expand"
                              : idioma === "fr"
                              ? "Agrandir"
                              : idioma === "de"
                              ? "Vergrößern"
                              : "Ampliar"}
                          </span>
                        </div>
                        {item.insignia && (
                          <span
                            style={{
                              position: "absolute",
                              top: "0.5rem",
                              left: "0.5rem",
                              fontSize: "0.62rem",
                              fontWeight: 700,
                              letterSpacing: "0.03em",
                              padding: "2px 8px",
                              borderRadius: "9999px",
                              backgroundColor: th.isDark
                                ? "rgba(0, 0, 0, 0.75)"
                                : "rgba(255, 255, 255, 0.92)",
                              backdropFilter: "blur(6px)",
                              border: `1px solid ${th.badgeBorder}`,
                              color: th.isDark ? th.badgeText : th.heading,
                              boxShadow: "0 2px 8px rgba(0,0,0,0.25)",
                              pointerEvents: "none",
                            }}
                          >
                            {item.insignia[idioma]}
                          </span>
                        )}
                      </div>
                    )}

                    {!item.imagenUrl && item.insignia && (
                      <div style={{ alignSelf: "flex-start" }}>
                        <span
                          style={{
                            fontSize: "0.65rem",
                            fontWeight: 600,
                            letterSpacing: "0.03em",
                            padding: "2px 8px",
                            borderRadius: "9999px",
                            background: th.badgeBg,
                            border: `1px solid ${th.badgeBorder}`,
                            color: th.badgeText,
                          }}
                        >
                          {item.insignia[idioma]}
                        </span>
                      </div>
                    )}

                    <div>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "baseline",
                          justifyContent: "space-between",
                          gap: "0.5rem",
                        }}
                      >
                        <h3
                          style={{
                            fontFamily: th.fontTitle,
                            fontSize: "1.05rem",
                            fontWeight: 700,
                            color: th.dishTitle,
                            margin: 0,
                          }}
                        >
                          {getNombrePlato(item, idioma)}
                        </h3>
                        <span className="luxury-price-gold">
                          {formatearPrecio(item.precio)}
                        </span>
                      </div>

                      {getDescripcionPlato(item, idioma) && (
                        <p
                          style={{
                            fontSize: "0.78rem",
                            color: th.textSoft,
                            margin: "0.4rem 0 0",
                            lineHeight: 1.5,
                          }}
                        >
                          {getDescripcionPlato(item, idioma)}
                        </p>
                      )}

                      {item.preciosVariados && item.preciosVariados.length > 0 && (
                        <div
                          style={{
                            display: "flex",
                            flexWrap: "wrap",
                            gap: "0.4rem",
                            marginTop: "0.5rem",
                            paddingTop: "0.5rem",
                            borderTop: `1px solid ${th.border}`,
                          }}
                        >
                          {item.preciosVariados.map((v, i) => (
                            <span
                              key={i}
                              style={{
                                fontSize: "0.65rem",
                                fontFamily: "monospace",
                                padding: "2px 6px",
                                borderRadius: "6px",
                                backgroundColor: th.inputBg,
                                border: `1px solid ${th.border}`,
                                color: th.accent,
                              }}
                            >
                              {v.etiqueta}: {formatearPrecio(v.precio)}
                            </span>
                          ))}
                        </div>
                      )}

                      {item.maridaje?.[idioma] && (
                        <div
                          style={{
                            marginTop: "0.45rem",
                            display: "flex",
                            alignItems: "center",
                            gap: "0.35rem",
                            fontSize: "0.7rem",
                            color: th.accentMuted,
                            fontStyle: "italic",
                            fontFamily: "var(--font-playfair), Georgia, serif",
                          }}
                        >
                          <span>🍺</span>
                          <span>{item.maridaje[idioma]}</span>
                        </div>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            </section>
          );
        })}

        {/* Pie: PDF, nota de precios y crédito */}
        <div
          style={{
            textAlign: "center",
            paddingTop: "2rem",
            borderTop: `1px solid ${th.border}`,
            display: "flex",
            flexDirection: "column",
            gap: "0.5rem",
          }}
        >
          {menu.pdfOriginalUrl && (
            <div>
              <a
                href={menu.pdfOriginalUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.35rem",
                  fontSize: "0.75rem",
                  color: th.accent,
                  textDecoration: "underline",
                  textUnderlineOffset: "3px",
                }}
              >
                <span>📄</span>
                <span>{t.verPdf}</span>
              </a>
            </div>
          )}
          <p
            style={{
              fontSize: "0.75rem",
              color: th.textMuted,
              fontStyle: "italic",
              fontFamily: "var(--font-playfair), Georgia, serif",
              margin: 0,
            }}
          >
            {t.precioNota}
          </p>
          <p
            style={{
              fontSize: "0.68rem",
              fontFamily: "monospace",
              color: th.textMuted,
              margin: 0,
            }}
          >
            {t.hechoPor}
          </p>
        </div>
      </main>

      {/* ─── BOTÓN FLOTANTE "VOLVER ARRIBA" (SCROLL TO TOP) ─── */}
      {mostrarScrollArriba && (
        <button
          type="button"
          onClick={irArriba}
          aria-label={t.irArriba}
          title={t.irArriba}
          className="luxury-scroll-top-btn"
          style={{
            position: "fixed",
            bottom: "5.15rem",
            right: "1.25rem",
            zIndex: 45,
            width: "44px",
            height: "44px",
            borderRadius: "9999px",
            backgroundColor: th.surface,
            border: `1.5px solid ${th.borderStrong}`,
            color: th.accent,
            boxShadow: th.isDark
              ? "0 6px 20px rgba(0, 0, 0, 0.7), 0 0 14px rgba(52, 211, 153, 0.25)"
              : "0 6px 18px rgba(0, 0, 0, 0.12)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            transition: "all 0.25s ease",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
          }}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="18 15 12 9 6 15" />
          </svg>
        </button>
      )}

      {/* ─── BARRA INFERIOR: RESERVAR + CALIFICAR ─── */}
      <footer
        className="luxury-footer-sticky"
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 50,
          borderTop: `1px solid ${th.borderStrong}`,
          padding: "0.65rem 1rem max(0.65rem, env(safe-area-inset-bottom))",
          boxShadow: th.isDark
            ? "0 -8px 28px rgba(0, 0, 0, 0.7)"
            : "0 -6px 20px rgba(0, 0, 0, 0.06)",
        }}
      >
        <div
          style={{
            maxWidth: "32rem",
            margin: "0 auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.65rem",
            width: "100%",
          }}
        >
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="luxury-btn-gold"
            style={{
              flex: 1,
              padding: "0.7rem 0.85rem",
              fontSize: "0.82rem",
              textDecoration: "none",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.4rem",
              whiteSpace: "nowrap",
              fontWeight: 700,
              minHeight: "44px",
            }}
          >
            <span style={{ fontSize: "0.95rem" }}>💬</span>
            <span>{t.consultarMesa}</span>
          </a>

          <a
            href={menu.googleMapsUrl || "https://search.google.com/local/writereview?placeid=ChIJKy680-Lx9I4Rk89-h79nh9s"}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              flex: 1,
              padding: "0.7rem 0.85rem",
              fontSize: "0.82rem",
              textDecoration: "none",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.4rem",
              whiteSpace: "nowrap",
              borderRadius: "0.85rem",
              backgroundColor: th.secondaryBg,
              border: `1px solid ${th.secondaryBorder}`,
              color: th.secondaryText,
              fontWeight: 700,
              minHeight: "44px",
            }}
          >
            <span style={{ fontSize: "0.95rem" }}>⭐</span>
            <span>{t.calificarGoogle}</span>
          </a>
        </div>
      </footer>

      {/* ─── SELECTOR DE TEMAS (solo demo interna) ─── */}
      {mostrarSelectorTema && (
        <div
          style={{
            position: "fixed",
            top: "4.25rem",
            right: "0.75rem",
            zIndex: 60,
            display: "flex",
            flexDirection: "column",
            gap: "0.35rem",
            padding: "0.5rem",
            borderRadius: "1rem",
            backgroundColor: "rgba(20, 20, 20, 0.85)",
            backdropFilter: "blur(10px)",
            border: "1px solid rgba(255, 255, 255, 0.15)",
            boxShadow: "0 8px 24px rgba(0,0,0,0.35)",
          }}
        >
          <span
            style={{
              fontSize: "9px",
              color: "rgba(255,255,255,0.6)",
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              textAlign: "center",
            }}
          >
            Tema demo
          </span>
          {LISTA_TEMAS.map((tm) => (
            <button
              key={tm.id}
              type="button"
              onClick={() => setTemaId(tm.id)}
              style={{
                fontSize: "11px",
                fontWeight: 600,
                padding: "4px 10px",
                borderRadius: "9999px",
                cursor: "pointer",
                border: "none",
                textAlign: "left",
                backgroundColor: temaId === tm.id ? "#FFFFFF" : "transparent",
                color: temaId === tm.id ? "#111" : "rgba(255,255,255,0.85)",
              }}
            >
              {tm.emoji} {tm.nombre}
            </button>
          ))}
        </div>
      )}
      {/* ─── MODAL VISOR DE FOTO COMPLETA (LIGHTBOX CON PORTAL) ─── */}
      {mounted &&
        fotoModal &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            aria-label={fotoModal.titulo}
            onClick={() => setFotoModal(null)}
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 99999,
              backgroundColor: "rgba(0, 0, 0, 0.88)",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "1rem",
              animation: "luxuryFadeIn 0.22s ease-out forwards",
              cursor: "zoom-out",
            }}
          >
            {/* Botón flotante para cerrar */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setFotoModal(null);
              }}
              aria-label={
                idioma === "en"
                  ? "Close full picture"
                  : idioma === "fr"
                  ? "Fermer l'image"
                  : idioma === "de"
                  ? "Schließen"
                  : "Cerrar foto"
              }
              style={{
                position: "fixed",
                top: "1.25rem",
                right: "1.25rem",
                zIndex: 100000,
                width: "2.75rem",
                height: "2.75rem",
                borderRadius: "9999px",
                backgroundColor: "rgba(255, 255, 255, 0.15)",
                backdropFilter: "blur(8px)",
                WebkitBackdropFilter: "blur(8px)",
                border: "1px solid rgba(255, 255, 255, 0.25)",
                color: "#FFFFFF",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                fontSize: "1.25rem",
                fontWeight: 300,
                transition: "all 0.2s ease",
                boxShadow: "0 4px 14px rgba(0, 0, 0, 0.5)",
              }}
            >
              ✕
            </button>

            {/* Contenedor central con tarjeta de la foto completa */}
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                position: "relative",
                maxWidth: "min(94vw, 680px)",
                maxHeight: "92vh",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                cursor: "default",
                animation: "luxuryZoomIn 0.24s cubic-bezier(0.16, 1, 0.3, 1) forwards",
              }}
            >
              {/* Contenedor de la Imagen completa */}
              <div
                style={{
                  position: "relative",
                  width: "100%",
                  maxHeight: "68vh",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  borderRadius: "1.25rem",
                  overflow: "hidden",
                  boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.75), 0 0 0 1px rgba(255, 255, 255, 0.12)",
                  backgroundColor: "#0C0A09",
                }}
              >
                <img
                  src={fotoModal.url}
                  alt={fotoModal.titulo}
                  style={{
                    width: "auto",
                    height: "auto",
                    maxWidth: "100%",
                    maxHeight: "66vh",
                    objectFit: "contain",
                    display: "block",
                    userSelect: "none",
                  }}
                />

                {/* Insignia / Badge si existe */}
                {fotoModal.insignia && (
                  <span
                    style={{
                      position: "absolute",
                      top: "0.85rem",
                      left: "0.85rem",
                      fontSize: "0.75rem",
                      fontWeight: 700,
                      padding: "4px 12px",
                      borderRadius: "9999px",
                      backgroundColor: "rgba(0, 0, 0, 0.78)",
                      backdropFilter: "blur(8px)",
                      WebkitBackdropFilter: "blur(8px)",
                      border: "1px solid rgba(255, 215, 0, 0.4)",
                      color: "#F6C343",
                      boxShadow: "0 4px 12px rgba(0, 0, 0, 0.5)",
                    }}
                  >
                    {fotoModal.insignia}
                  </span>
                )}
              </div>

              {/* Ficha editorial con el nombre, precio y descripción */}
              <div
                style={{
                  width: "100%",
                  marginTop: "0.75rem",
                  padding: "0.85rem 1.15rem",
                  borderRadius: "1rem",
                  backgroundColor: "rgba(23, 20, 18, 0.92)",
                  backdropFilter: "blur(14px)",
                  WebkitBackdropFilter: "blur(14px)",
                  border: "1px solid rgba(255, 255, 255, 0.14)",
                  boxShadow: "0 10px 30px rgba(0, 0, 0, 0.6)",
                  color: "#FFFFFF",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "0.75rem",
                    flexWrap: "wrap",
                  }}
                >
                  <h3
                    style={{
                      fontFamily: th.fontTitle,
                      fontSize: "1.2rem",
                      fontWeight: 700,
                      color: "#FFFFFF",
                      margin: 0,
                      lineHeight: 1.25,
                    }}
                  >
                    {fotoModal.titulo}
                  </h3>

                  {fotoModal.precio !== undefined && (
                    <span
                      style={{
                        fontFamily: "monospace",
                        fontWeight: 700,
                        fontSize: "1.05rem",
                        color: th.accent,
                        padding: "0.2rem 0.65rem",
                        borderRadius: "9999px",
                        backgroundColor: "rgba(255, 255, 255, 0.08)",
                        border: `1px solid ${th.border}`,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {formatearPrecio(fotoModal.precio)}
                    </span>
                  )}
                </div>

                {fotoModal.subtitulo && (
                  <p
                    style={{
                      margin: "0.25rem 0 0",
                      fontSize: "0.82rem",
                      color: "rgba(255, 255, 255, 0.72)",
                      fontStyle: "italic",
                    }}
                  >
                    {fotoModal.subtitulo}
                  </p>
                )}

                {fotoModal.descripcion && (
                  <p
                    style={{
                      margin: "0.35rem 0 0",
                      fontSize: "0.85rem",
                      lineHeight: 1.4,
                      color: "rgba(255, 255, 255, 0.85)",
                    }}
                  >
                    {fotoModal.descripcion}
                  </p>
                )}

                <div
                  style={{
                    marginTop: "0.55rem",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    fontSize: "0.7rem",
                    color: "rgba(255, 255, 255, 0.5)",
                    borderTop: "1px solid rgba(255, 255, 255, 0.08)",
                    paddingTop: "0.45rem",
                  }}
                >
                  <span>
                    {idioma === "en"
                      ? "Tap outside or ✕ to close"
                      : idioma === "fr"
                      ? "Touchez l'extérieur ou ✕ pour fermer"
                      : idioma === "de"
                      ? "Zum Schließen daneben tippen oder ✕"
                      : "Toca fuera de la foto o ✕ para cerrar"}
                  </span>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem" }}>
                    🔍 {idioma === "en" ? "HD photo preview" : "Fotografía en alta definición"}
                  </span>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
