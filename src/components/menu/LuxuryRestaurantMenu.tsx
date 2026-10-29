"use client";

import { useState, useEffect, useMemo, useRef, type CSSProperties } from "react";
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

const TASA_CAMBIO_USD = 4000; // 1 USD = 4,000 COP referencial

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

  // Moneda: COP o USD
  const [moneda, setMoneda] = useState<"COP" | "USD">("COP");

  // Categoría activa para scroll suave
  const [categoriaActiva, setCategoriaActiva] = useState<string>(
    menu.categorias[0]?.id || ""
  );

  // Búsqueda o filtro dietario
  const [busqueda, setBusqueda] = useState<string>("");
  const [filtroVeggie, setFiltroVeggie] = useState<boolean>(false);
  const [filtroChef, setFiltroChef] = useState<boolean>(false);

  // Happy Hour en vivo (Colombia UTC-5)
  const [esHappyHourActivo, setEsHappyHourActivo] = useState<boolean>(false);

  const categoryRefs = useRef<Record<string, HTMLElement | null>>({});
  const originalBgRef = useRef<string | null>(null);

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
    if (moneda === "USD") {
      const usd = valorCop / TASA_CAMBIO_USD;
      return `$${usd.toFixed(2)} USD`;
    }
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
    const telefono = menu.whatsapp.replace(/\D/g, "");
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
      happyHourActivo: "¡HAPPY HOUR ACTIVO AHORA!",
      happyHourInactivo: "HAPPY HOUR DIARIO",
      horarioHh: "5:00 PM – 7:00 PM",
      verPdf: "Ver Menú Original (PDF)",
      consultarMesa: "Reservar Mesa",
      calificarGoogle: "Calificar en Google",
      calificarCorto: "Calificar",
      precioNota: "Precios en pesos colombianos (COP). Servicio voluntario.",
      hechoPor: "Carta Inteligente & Traductor · PaDónde Minca",
      avisoEnMesa: "💡 ¿Estás en la mesa? Muestra este menú al mesero para ordenar rápido en tu idioma.",
      opcion: "opción",
      opciones: "opciones",
    },
    en: {
      volver: "← Back to Live Board",
      buscarPlato: "Search dishes or ingredients...",
      soloVeggie: "🌱 Vegetarian Only",
      soloChef: "⭐ Chef's Favorites",
      happyHourActivo: "HAPPY HOUR IS ACTIVE NOW!",
      happyHourInactivo: "DAILY HAPPY HOUR",
      horarioHh: "5:00 PM – 7:00 PM",
      verPdf: "View Original Printed Menu (PDF)",
      consultarMesa: "Reserve Table",
      calificarGoogle: "Rate on Google",
      calificarCorto: "Rate",
      precioNota: "Prices in Colombian Pesos (COP). Gratuity is voluntary.",
      hechoPor: "Smart Table Menu & Translator · PaDónde Minca",
      avisoEnMesa: "💡 At the table? Show this screen to your server to order easily in your language.",
      opcion: "option",
      opciones: "options",
    },
    fr: {
      volver: "← Retour à l'Agenda",
      buscarPlato: "Rechercher un plat ou ingrédient...",
      soloVeggie: "🌱 Végétarien Uniquement",
      soloChef: "⭐ Coups de Cœur du Chef",
      happyHourActivo: "HAPPY HOUR EN COURS MAINTENANT !",
      happyHourInactivo: "HAPPY HOUR QUOTIDIEN",
      horarioHh: "17h00 – 19h00",
      verPdf: "Voir le Menu Imprimé Original (PDF)",
      consultarMesa: "Réserver une Table",
      calificarGoogle: "Noter sur Google",
      calificarCorto: "Noter",
      precioNota: "Prix en pesos colombiens (COP). Pourboire facultatif.",
      hechoPor: "Menu Intelligent & Traducteur de Table · PaDónde Minca",
      avisoEnMesa: "💡 À table ? Montrez cet écran à votre serveur pour commander facilement dans votre langue.",
      opcion: "option",
      opciones: "options",
    },
    de: {
      volver: "← Zurück zur Übersicht",
      buscarPlato: "Gericht oder Zutat suchen...",
      soloVeggie: "🌱 Nur Vegetarisch",
      soloChef: "⭐ Empfehlungen des Chefs",
      happyHourActivo: "HAPPY HOUR JETZT AKTIV!",
      happyHourInactivo: "TÄGLICHE HAPPY HOUR",
      horarioHh: "17:00 – 19:00 Uhr",
      verPdf: "Original gedruckte Speisekarte (PDF)",
      consultarMesa: "Tisch anfragen",
      calificarGoogle: "Auf Google bewerten",
      calificarCorto: "Bewerten",
      precioNota: "Preise in kolumbianischen Pesos (COP). Bedienungsgeld freiwillig.",
      hechoPor: "Smarte Speisekarte & Übersetzer · PaDónde Minca",
      avisoEnMesa: "💡 Am Tisch? Zeigen Sie diese Karte der Bedienung, um entspannt in Ihrer Sprache zu bestellen.",
      opcion: "Option",
      opciones: "Optionen",
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
    textoOscuro: string,
    textoClaro: string
  ): CSSProperties => ({
    fontSize: "0.75rem",
    padding: "0.45rem 0.85rem",
    borderRadius: "0.75rem",
    border: activo ? `1px solid ${colorBorde}` : `1px solid ${th.border}`,
    backgroundColor: activo ? `${colorBorde}26` : th.inputBg,
    color: activo ? (th.isDark ? textoOscuro : textoClaro) : th.textSoft,
    fontWeight: activo ? 600 : "normal",
    cursor: "pointer",
  });

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

          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <div style={chipGroup}>
              <button
                type="button"
                onClick={() => setMoneda("COP")}
                style={{ ...chip(moneda === "COP"), fontFamily: "monospace" }}
              >
                COP
              </button>
              <button
                type="button"
                onClick={() => setMoneda("USD")}
                style={{ ...chip(moneda === "USD"), fontFamily: "monospace" }}
              >
                USD
              </button>
            </div>

            <div style={chipGroup}>
              {(
                [
                  { code: "es", label: "ES", flag: "🇪🇸" },
                  { code: "en", label: "EN", flag: "🇬🇧" },
                  { code: "fr", label: "FR", flag: "🇫🇷" },
                  { code: "de", label: "DE", flag: "🇩🇪" },
                ] as const
              ).map((lang) => (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => setIdioma(lang.code)}
                  style={chip(idioma === lang.code)}
                  title={lang.label}
                >
                  <span>{lang.flag}</span>
                  <span className="hidden sm:inline">{lang.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* ─── CABECERA DEL RESTAURANTE ─── */}
      <section
        style={{
          position: "relative",
          zIndex: 10,
          padding: "1.75rem 1rem 1.25rem",
          textAlign: "center",
          maxWidth: "48rem",
          margin: "0 auto",
        }}
      >
        <div
          className="luxury-gold-badge"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.5rem",
            padding: "0.3rem 0.85rem",
            borderRadius: "9999px",
            marginBottom: "0.85rem",
          }}
        >
          <span style={{ fontSize: "0.75rem" }}>{th.emoji}</span>
          <span
            style={{
              fontSize: "0.65rem",
              fontFamily: "var(--font-playfair), Georgia, serif",
              textTransform: "uppercase",
              letterSpacing: "0.15em",
              fontWeight: 600,
            }}
          >
            {menu.selloCalidad[idioma]}
          </span>
        </div>

        <h1
          className="luxury-gold-title"
          style={{
            fontSize: "clamp(2rem, 5vw, 3.25rem)",
            fontWeight: 800,
            lineHeight: 1.15,
            margin: "0 0 0.5rem",
          }}
        >
          {menu.negocioNombre}
        </h1>

        <p
          className="luxury-gold-subtitle"
          style={{
            fontSize: "0.95rem",
            margin: "0 auto",
            maxWidth: "34rem",
            fontStyle: "italic",
          }}
        >
          {menu.subtitulo[idioma]}
        </p>

        {/* Divisor ornamental */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.75rem",
            margin: "1rem 0",
          }}
        >
          <div
            style={{
              width: "4rem",
              height: "1px",
              background: `linear-gradient(90deg, transparent, ${th.borderStrong})`,
            }}
          />
          <span style={{ color: th.accent, fontSize: "0.7rem" }}>◆</span>
          <div
            style={{
              width: "4rem",
              height: "1px",
              background: `linear-gradient(270deg, transparent, ${th.borderStrong})`,
            }}
          />
        </div>

        {/* Happy Hour en vivo */}
        <div style={{ display: "inline-block" }}>
          <div
            style={{
              padding: "0.45rem 1.1rem",
              borderRadius: "1rem",
              border: esHappyHourActivo
                ? "1px solid rgba(16, 185, 129, 0.6)"
                : `1px solid ${th.borderStrong}`,
              backgroundColor: esHappyHourActivo
                ? "rgba(16, 185, 129, 0.15)"
                : th.surface,
              color: esHappyHourActivo
                ? th.isDark
                  ? "#A7F3D0"
                  : "#047857"
                : th.heading,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.5rem",
              boxShadow: th.cardShadow,
            }}
          >
            <span style={{ fontSize: "0.85rem" }}>
              {esHappyHourActivo ? "🟢" : "⏰"}
            </span>
            <span
              style={{
                fontSize: "0.75rem",
                fontWeight: 600,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
              }}
            >
              {esHappyHourActivo
                ? t.happyHourActivo
                : `${t.happyHourInactivo} · ${t.horarioHh}`}
            </span>
          </div>
        </div>

        <p
          style={{
            fontSize: "0.72rem",
            color: th.textMuted,
            maxWidth: "28rem",
            margin: "0.75rem auto 0",
            fontStyle: "italic",
          }}
        >
          {t.avisoEnMesa}
        </p>
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

          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <button
              type="button"
              onClick={() => setFiltroVeggie(!filtroVeggie)}
              style={filtroBtn(filtroVeggie, "#10B981", "#A7F3D0", "#047857")}
            >
              {t.soloVeggie}
            </button>
            <button
              type="button"
              onClick={() => setFiltroChef(!filtroChef)}
              style={filtroBtn(filtroChef, "#F59E0B", "#FDE68A", "#B45309")}
            >
              {t.soloChef}
            </button>
          </div>
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
          {menu.categorias.map((cat) => {
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
        {menu.categorias.map((cat) => {
          const itemsFiltrados = cat.items.filter((item) => {
            if (filtroVeggie && !item.etiquetas?.includes("vegetariano")) {
              return false;
            }
            if (filtroChef && !item.etiquetas?.includes("chef")) {
              return false;
            }
            if (busqueda.trim()) {
              const q = busqueda.toLowerCase();
              const nombre = (item.nombres[idioma] || "").toLowerCase();
              const ing = (item.ingredientes?.[idioma] || "").toLowerCase();
              return nombre.includes(q) || ing.includes(q);
            }
            return true;
          });

          if (itemsFiltrados.length === 0) return null;

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
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <span style={{ fontSize: "1.35rem" }}>{cat.icono}</span>
                    <h2
                      style={{
                        fontFamily: th.fontTitle,
                        fontSize: "clamp(1.2rem, 3vw, 1.6rem)",
                        fontWeight: 700,
                        color: th.heading,
                        margin: 0,
                      }}
                    >
                      {cat.titulos[idioma]}
                    </h2>
                  </div>
                  {cat.subtitulos?.[idioma] && (
                    <p
                      style={{
                        fontSize: "0.75rem",
                        color: th.textMuted,
                        margin: "0.25rem 0 0",
                        fontStyle: "italic",
                        fontFamily: "var(--font-playfair), Georgia, serif",
                      }}
                    >
                      {cat.subtitulos[idioma]}
                    </p>
                  )}
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

              {/* Tarjetas editoriales (sin carrito de compras) */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(290px, 1fr))",
                  gap: "1rem",
                }}
              >
                {itemsFiltrados.map((item) => (
                  <article
                    key={item.id}
                    className="luxury-dish-card"
                    style={{
                      padding: "1rem",
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.65rem",
                    }}
                  >
                    {item.imagenUrl && (
                      <div
                        style={{
                          position: "relative",
                          width: "100%",
                          height: "175px",
                          borderRadius: "0.85rem",
                          overflow: "hidden",
                          border: `1px solid ${th.border}`,
                          backgroundColor: th.imageBg,
                        }}
                      >
                        <img
                          src={item.imagenUrl}
                          alt={item.nombres[idioma]}
                          style={{ width: "100%", height: "100%", objectFit: "cover" }}
                          loading="lazy"
                        />
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
                          {item.nombres[idioma]}
                        </h3>
                        <span className="luxury-price-gold">
                          {formatearPrecio(item.precio)}
                        </span>
                      </div>

                      {item.ingredientes?.[idioma] && (
                        <p
                          style={{
                            fontSize: "0.78rem",
                            color: th.textSoft,
                            margin: "0.4rem 0 0",
                            lineHeight: 1.5,
                          }}
                        >
                          {item.ingredientes[idioma]}
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
          padding: "0.75rem 1rem",
          boxShadow: th.isDark
            ? "0 -8px 28px rgba(0, 0, 0, 0.7)"
            : "0 -6px 20px rgba(0, 0, 0, 0.06)",
        }}
      >
        <div
          style={{
            maxWidth: "56rem",
            margin: "0 auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "0.75rem",
          }}
        >
          <div style={{ minWidth: 0 }}>
            <p
              style={{
                fontSize: "0.78rem",
                fontFamily: th.fontTitle,
                fontWeight: 700,
                color: th.heading,
                margin: 0,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {menu.negocioNombre}
            </p>
            <p style={{ fontSize: "0.68rem", color: th.textMuted, margin: "2px 0 0" }}>
              {menu.zona}
            </p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="luxury-btn-gold"
              style={{
                padding: "0.6rem 1rem",
                fontSize: "0.8rem",
                textDecoration: "none",
                display: "flex",
                alignItems: "center",
                gap: "0.35rem",
                whiteSpace: "nowrap",
              }}
            >
              <span>💬</span>
              <span>{t.consultarMesa}</span>
            </a>

            <a
              href={menu.googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                padding: "0.6rem 0.85rem",
                fontSize: "0.8rem",
                textDecoration: "none",
                display: "flex",
                alignItems: "center",
                gap: "0.35rem",
                whiteSpace: "nowrap",
                borderRadius: "0.85rem",
                backgroundColor: th.secondaryBg,
                border: `1px solid ${th.secondaryBorder}`,
                color: th.secondaryText,
                fontWeight: 600,
              }}
            >
              <span>⭐</span>
              <span className="hidden sm:inline">{t.calificarGoogle}</span>
              <span className="sm:hidden">{t.calificarCorto}</span>
            </a>
          </div>
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
    </div>
  );
}
