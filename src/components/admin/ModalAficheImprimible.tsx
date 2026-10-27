"use client";

import { useState } from "react";

interface ModalAficheImprimibleProps {
  isOpen: boolean;
  onClose: () => void;
  puntoNombre: string;
  urlDestino: string;
  qrImageUrl?: string;
  srcParam?: string;
  tipoContenido?: "general" | "menu_restaurante";
}

export function ModalAficheImprimible({
  isOpen,
  onClose,
  puntoNombre,
  urlDestino,
  qrImageUrl,
  srcParam = "punto-fisico",
  tipoContenido = "general",
}: ModalAficheImprimibleProps) {
  const [formato, setFormato] = useState<"pared" | "mesa">(
    tipoContenido === "menu_restaurante" ? "mesa" : "pared"
  );
  const [imprimiendo, setImprimiendo] = useState(false);

  if (!isOpen) return null;

  const nombreLugar = puntoNombre.trim();
  // Sanitizar siempre para garantizar que NUNCA aparezca localhost en afiches ni en los QR impresos
  const urlSeguraDestino = (urlDestino || `https://www.padonde.lat/es/minca?src=${srcParam || "punto-fisico"}`)
    .replace(/^https?:\/\/(localhost(:\d+)?|127\.0\.0\.1(:\d+)?)/, "https://www.padonde.lat");

  const qrImageUrlSegura =
    qrImageUrl && !qrImageUrl.includes("localhost") && !qrImageUrl.includes("127.0.0.1")
      ? qrImageUrl
      : `https://api.qrserver.com/v1/create-qr-code/?size=400x400&margin=12&data=${encodeURIComponent(
          urlSeguraDestino
        )}`;

  const displayUrl = urlSeguraDestino
    ? urlSeguraDestino.replace(/^https?:\/\/(www\.)?/, "")
    : `padonde.lat?src=${srcParam}`;

  function getAficheHTML() {
    const isPared = formato === "pared";
    const isMenu = tipoContenido === "menu_restaurante";
    // Dimensiones y tipografías grandes calibradas para máxima legibilidad a distancia (1 a 2 metros)
    const maxWidth = isPared ? "760px" : "580px";
    const padding = isPared ? "32px 30px" : "24px 20px";
    const qrSize = isPared ? "240px" : "195px";
    const titleSize = isPared ? "52px" : "40px";
    const titleEnSize = isPared ? "30px" : "23px";
    const badgeBrandSize = isPared ? "22px" : "18px";

    return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <title>${isMenu ? `Hablador de Mesa - ${nombreLugar}` : `Afiche PaDónde - ${nombreLugar}`}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,700&family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    @page {
      size: portrait;
      margin: 6mm;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    html, body {
      width: 100%;
      background: #ffffff !important;
      color: #1a2e1a;
      font-family: 'Inter', -apple-system, sans-serif;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    body {
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 8px;
    }
    .poster-box {
      width: 100%;
      max-width: ${maxWidth};
      background: #ffffff;
      border: 4px solid #1c3829;
      border-radius: 28px;
      padding: ${padding};
      position: relative;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      page-break-inside: avoid;
      break-inside: avoid;
    }
    .top-bar {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 12px;
      background: linear-gradient(90deg, #1c3829 0%, #c4622d 50%, #1c3829 100%);
    }
    .header-brand {
      text-align: center;
      margin-top: 4px;
      margin-bottom: 8px;
    }
    .badge-brand {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 7px 22px;
      background: rgba(28, 56, 41, 0.08);
      border: 1.5px solid rgba(28, 56, 41, 0.22);
      border-radius: 999px;
      font-family: 'Playfair Display', serif;
      font-size: ${badgeBrandSize};
      font-weight: 800;
      color: #1c3829;
    }
    .badge-brand span.sub {
      font-family: 'Inter', sans-serif;
      font-size: 15px;
      font-weight: 700;
      color: #8a7e6e;
    }
    .point-name {
      font-size: 16px;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      color: #8a7e6e;
      font-weight: 800;
      margin-top: 6px;
    }
    .point-name strong {
      color: #1c3829;
    }
    .titles-block {
      text-align: center;
      margin-bottom: 12px;
    }
    .title-es {
      font-family: 'Playfair Display', serif;
      font-size: ${titleSize};
      font-weight: 900;
      color: #1c3829;
      line-height: 1.1;
      letter-spacing: -0.5px;
    }
    .title-en {
      font-family: 'Playfair Display', serif;
      font-size: ${titleEnSize};
      font-style: italic;
      font-weight: 700;
      color: #c4622d;
      margin-top: 4px;
    }
    .langs-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      max-width: 580px;
      margin: 10px auto 0 auto;
    }
    .lang-pill {
      background: #f7f4ee;
      border: 1.5px solid #e8e2d9;
      border-radius: 14px;
      padding: 9px 16px;
      text-align: center;
      font-size: 18px;
      font-weight: 700;
      color: #2e4d36;
    }
    .qr-stage {
      display: flex;
      justify-content: center;
      margin: 12px 0 14px 0;
    }
    .qr-wrapper {
      background: #faf8f5;
      border: 3px solid #1c3829;
      border-radius: 24px;
      padding: 18px 22px 14px 22px;
      text-align: center;
      position: relative;
    }
    .qr-badge-scan {
      position: absolute;
      top: -16px;
      left: 50%;
      transform: translateX(-50%);
      background: #1c3829;
      color: #ffffff;
      font-size: 15px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 1.2px;
      padding: 6px 24px;
      border-radius: 999px;
      white-space: nowrap;
      box-shadow: 0 2px 8px rgba(0,0,0,0.25);
    }
    .qr-image {
      width: ${qrSize};
      height: ${qrSize};
      display: block;
      margin: 6px auto 0 auto;
      image-rendering: pixelated;
    }
    .qr-link {
      font-family: monospace;
      font-size: 14.5px;
      color: #8a7e6e;
      font-weight: 800;
      margin-top: 8px;
    }
    .categories-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      margin-bottom: 14px;
    }
    .cat-card {
      background: #fbf9f6;
      border: 2px solid #e8e2d9;
      border-radius: 16px;
      padding: 14px 16px;
      text-align: center;
    }
    .cat-title {
      font-size: 21px;
      font-weight: 800;
      color: #1c3829;
    }
    .cat-sub {
      font-size: 15.5px;
      color: #736655;
      font-weight: 600;
      margin-top: 4px;
    }
    .footer-section {
      border-top: 2px solid #e8e2d9;
      padding-top: 12px;
      text-align: center;
    }
    .footer-features {
      display: flex;
      justify-content: center;
      gap: 16px;
      font-size: 17px;
      font-weight: 800;
      color: #1c3829;
      margin-bottom: 5px;
    }
    .footer-features .wa {
      color: #047857;
    }
    .footer-sub {
      font-size: 14.5px;
      color: #8a7e6e;
      font-weight: 600;
    }
    .footer-sub strong {
      color: #1c3829;
    }
  </style>
</head>
<body>
  <div class="poster-box">
    <div class="top-bar"></div>

    <div class="header-brand">
      <div class="badge-brand">
        <span>🌿</span>
        <span>PaDónde</span>
        <span class="sub">${isMenu ? "Menú & Carta" : "Cartelera en Vivo"}</span>
      </div>
      ${
        nombreLugar
          ? `<p class="point-name">${isMenu ? "MESA OFICIAL:" : "PUNTO OFICIAL:"} <strong>${nombreLugar}</strong></p>`
          : ""
      }
    </div>

    <div class="titles-block">
      <h1 class="title-es">${isMenu ? "🍽️ Carta & Especialidades" : "¿Qué hacer hoy?"}</h1>
      <p class="title-en">${isMenu ? "Digital Menu & Local Flavors" : "What to do today?"}</p>
      <div class="langs-grid">
        <div class="lang-pill">${isMenu ? "📖 Ver carta en tu celular" : "🇩🇪 Was geht heute?"}</div>
        <div class="lang-pill">${isMenu ? "⭐ Califícanos con 5 estrellas" : "🇫🇷 Que faire aujourd'hui ?"}</div>
      </div>
    </div>

    <div class="qr-stage">
      <div class="qr-wrapper">
        <div class="qr-badge-scan">${isMenu ? "📸 Escanea desde tu mesa" : "📸 Escanear con tu cámara"}</div>
        <img
          src="${qrImageUrlSegura}"
          alt="Código QR PaDónde"
          class="qr-image"
        />
        <p class="qr-link">${displayUrl}</p>
      </div>
    </div>

    <div class="categories-grid">
      <div class="cat-card">
        <p class="cat-title">${isMenu ? "🍽️ Platos, Bebidas & Postres" : "🎵 Música & Atardeceres"}</p>
        <p class="cat-sub">${isMenu ? "Full Menu & Options" : "Live Music · Nightlife"}</p>
      </div>
      <div class="cat-card">
        <p class="cat-title">${isMenu ? "⭐ Califica tu Experiencia" : "🍽️ Gastronomía & Café"}</p>
        <p class="cat-sub">${isMenu ? "Google Reviews" : "Food, Drinks & Local Flavors"}</p>
      </div>
      <div class="cat-card">
        <p class="cat-title">${isMenu ? "🛵 Transporte & Motos" : "🏖️ Playas, Cascadas & Tours"}</p>
        <p class="cat-sub">${isMenu ? "Mototaxis · PaDónde" : "Beaches, Nature & Tours"}</p>
      </div>
      <div class="cat-card">
        <p class="cat-title">${isMenu ? "🌿 ¿Qué hacer en Minca hoy?" : "🏡 Hospedaje, Cabañas & Relax"}</p>
        <p class="cat-sub">${isMenu ? "Plans, Nature & Tours" : "Hotels, Cabins & Wellness"}</p>
      </div>
    </div>

    <div class="footer-section">
      <div class="footer-features">
        <span>⚡ ${isMenu ? "Sin descargar aplicaciones" : "Sin descargar apps"}</span>
        <span>·</span>
        <span class="wa">💬 ${isMenu ? "Pide a tu mesero o por WhatsApp" : "Reserva directa por WhatsApp"}</span>
      </div>
      <p class="footer-sub">
        ${isMenu ? `Alianza gastronómica ${nombreLugar} × PaDónde 🌿 <strong>www.padonde.lat</strong>` : `Cartelera turística en vivo · Eventos, hospedajes y planes 🌿 <strong>www.padonde.lat</strong>`}
      </p>
    </div>
  </div>
</body>
</html>`;
  }

  function handlePrint() {
    setImprimiendo(true);
    const printHtml = getAficheHTML();

    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "none";
    iframe.style.zIndex = "-9999";
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (!doc) {
      setImprimiendo(false);
      return;
    }

    doc.open();
    doc.write(printHtml);
    doc.close();

    setTimeout(() => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
      setImprimiendo(false);
      setTimeout(() => {
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe);
        }
      }, 1500);
    }, 450);
  }

  // Descarga en formato SVG vectorial (ideal para litografías, corte e imprenta profesional con resolución infinita)
  async function handleDownloadSVG() {
    setImprimiendo(true);
    try {
      // 1. Convertir el QR a Base64 para incrustarlo de forma 100% autónoma y offline en el SVG
      let qrBase64 = qrImageUrlSegura;
      try {
        const response = await fetch(qrImageUrlSegura);
        const blob = await response.blob();
        qrBase64 = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(blob);
        });
      } catch {
        // Fallback a URL original si fetch falla
      }

      const isPared = formato === "pared";
      const width = isPared ? 720 : 540;
      const height = isPared ? 1040 : 800;
      const cx = width / 2;

      const titleY = nombreLugar ? (isPared ? 152 : 128) : (isPared ? 134 : 112);
      const subTitleY = titleY + (isPared ? 38 : 28);
      const pillsY = subTitleY + (isPared ? 22 : 16);

      const qrBoxSize = isPared ? 240 : 190;
      const qrBoxH = qrBoxSize + (isPared ? 54 : 44);
      const qrY = pillsY + (isPared ? 48 : 36);

      const catY = qrY + qrBoxH + (isPared ? 26 : 20);
      const catW = (width - 66) / 2;
      const catH = isPared ? 76 : 58;

      const footerY = height - (isPared ? 55 : 42);

      const svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
  <defs>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,700&amp;family=Inter:wght@400;500;600;700;800&amp;display=swap');
      .font-serif { font-family: 'Playfair Display', Georgia, serif; }
      .font-sans { font-family: 'Inter', -apple-system, sans-serif; }
      .font-mono { font-family: monospace; }
    </style>
    <linearGradient id="topBarGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#1c3829" />
      <stop offset="50%" stop-color="#c4622d" />
      <stop offset="100%" stop-color="#1c3829" />
    </linearGradient>
  </defs>

  <!-- Fondo y Borde Principal -->
  <rect x="10" y="10" width="${width - 20}" height="${height - 20}" rx="28" ry="28" fill="#ffffff" stroke="#1c3829" stroke-width="4" />

  <!-- Barra Superior de Gradiente -->
  <rect x="12" y="12" width="${width - 24}" height="10" rx="4" ry="4" fill="url(#topBarGrad)" />

  <!-- Badge Marca -->
  <rect x="${cx - (isPared ? 150 : 120)}" y="32" width="${isPared ? 300 : 240}" height="${isPared ? 38 : 32}" rx="${isPared ? 19 : 16}" fill="#1c3829" fill-opacity="0.08" stroke="#1c3829" stroke-opacity="0.22" stroke-width="1.5" />
  <text x="${cx}" y="${isPared ? 57 : 53}" text-anchor="middle" fill="#1c3829" class="font-serif" font-size="${isPared ? 18 : 15}" font-weight="bold">🌿 PaDónde · <tspan class="font-sans" font-size="${isPared ? 14 : 12}" font-weight="600" fill="#8a7e6e">Cartelera en Vivo</tspan></text>

  <!-- Punto Oficial (opcional) -->
  ${
    nombreLugar
      ? `<text x="${cx}" y="${isPared ? 96 : 88}" text-anchor="middle" fill="#8a7e6e" class="font-sans" font-size="${isPared ? 14 : 11.5}" font-weight="800" letter-spacing="1.2">📍 PUNTO OFICIAL: <tspan fill="#1c3829">${nombreLugar.toUpperCase()}</tspan></text>`
      : ""
  }

  <!-- Títulos Principales Cuadrilingües -->
  <text x="${cx}" y="${titleY}" text-anchor="middle" fill="#1c3829" class="font-serif" font-size="${isPared ? 50 : 38}" font-weight="900">¿Qué hacer hoy?</text>
  <text x="${cx}" y="${subTitleY}" text-anchor="middle" fill="#c4622d" class="font-serif" font-style="italic" font-size="${isPared ? 30 : 22}" font-weight="bold">What to do today?</text>

  <!-- Pastillas Alemán / Francés -->
  <rect x="${cx - (isPared ? 240 : 180)}" y="${pillsY}" width="${isPared ? 230 : 175}" height="${isPared ? 36 : 28}" rx="${isPared ? 12 : 9}" fill="#1c3829" fill-opacity="0.05" stroke="#1c3829" stroke-opacity="0.15" stroke-width="1" />
  <text x="${cx - (isPared ? 125 : 92)}" y="${pillsY + (isPared ? 24 : 19)}" text-anchor="middle" fill="#1c3829" class="font-sans" font-size="${isPared ? 16 : 12}" font-weight="700">🇩🇪 Was geht heute?</text>

  <rect x="${cx + (isPared ? 10 : 5)}" y="${pillsY}" width="${isPared ? 230 : 175}" height="${isPared ? 36 : 28}" rx="${isPared ? 12 : 9}" fill="#1c3829" fill-opacity="0.05" stroke="#1c3829" stroke-opacity="0.15" stroke-width="1" />
  <text x="${cx + (isPared ? 125 : 92)}" y="${pillsY + (isPared ? 24 : 19)}" text-anchor="middle" fill="#1c3829" class="font-sans" font-size="${isPared ? 16 : 12}" font-weight="700">🇫🇷 Que faire aujourd'hui ?</text>

  <!-- Contenedor QR -->
  <rect x="${cx - qrBoxSize / 2}" y="${qrY}" width="${qrBoxSize}" height="${qrBoxH}" rx="22" ry="22" fill="#faf8f5" stroke="#1c3829" stroke-opacity="0.25" stroke-width="2.5" />

  <!-- Badge Escaneo -->
  <rect x="${cx - (isPared ? 125 : 100)}" y="${qrY - (isPared ? 16 : 13)}" width="${isPared ? 250 : 200}" height="${isPared ? 32 : 26}" rx="${isPared ? 16 : 13}" ry="${isPared ? 16 : 13}" fill="#1c3829" />
  <text x="${cx}" y="${qrY + (isPared ? 5 : 4)}" text-anchor="middle" fill="#ffffff" class="font-sans" font-size="${isPared ? 13.5 : 10.5}" font-weight="800" letter-spacing="1">📸 ESCANEAR CON TU CÁMARA</text>

  <!-- Imagen QR -->
  <image href="${qrBase64}" x="${cx - (qrBoxSize - 32) / 2}" y="${qrY + 18}" width="${qrBoxSize - 32}" height="${qrBoxSize - 32}" preserveAspectRatio="xMidYMid meet" />

  <!-- Enlace debajo del QR -->
  <text x="${cx}" y="${qrY + qrBoxSize + (isPared ? 12 : 9)}" text-anchor="middle" fill="#8a7e6e" class="font-mono" font-size="${isPared ? 14 : 11}" font-weight="800">${displayUrl}</text>

  <!-- Tarjetas de Categorías (2x2) -->
  <g>
    <!-- Cat 1 -->
    <rect x="24" y="${catY}" width="${catW}" height="${catH}" rx="14" ry="14" fill="#fcfbf9" stroke="#e5dfd5" stroke-width="1.5" />
    <text x="${24 + catW / 2}" y="${catY + (isPared ? 32 : 24)}" text-anchor="middle" fill="#1c3829" class="font-sans" font-size="${isPared ? 19 : 14.5}" font-weight="800">🎵 Música &amp; Atardeceres</text>
    <text x="${24 + catW / 2}" y="${catY + (isPared ? 56 : 42)}" text-anchor="middle" fill="#736655" class="font-sans" font-size="${isPared ? 14.5 : 11}" font-weight="600">Live Music · Nightlife</text>

    <!-- Cat 2 -->
    <rect x="${width - 24 - catW}" y="${catY}" width="${catW}" height="${catH}" rx="14" ry="14" fill="#fcfbf9" stroke="#e5dfd5" stroke-width="1.5" />
    <text x="${width - 24 - catW / 2}" y="${catY + (isPared ? 32 : 24)}" text-anchor="middle" fill="#1c3829" class="font-sans" font-size="${isPared ? 19 : 14.5}" font-weight="800">🍽️ Gastronomía &amp; Café</text>
    <text x="${width - 24 - catW / 2}" y="${catY + (isPared ? 56 : 42)}" text-anchor="middle" fill="#736655" class="font-sans" font-size="${isPared ? 14.5 : 11}" font-weight="600">Food, Drinks &amp; Local Flavors</text>

    <!-- Cat 3 -->
    <rect x="24" y="${catY + catH + 12}" width="${catW}" height="${catH}" rx="14" ry="14" fill="#fcfbf9" stroke="#e5dfd5" stroke-width="1.5" />
    <text x="${24 + catW / 2}" y="${catY + catH + 12 + (isPared ? 32 : 24)}" text-anchor="middle" fill="#1c3829" class="font-sans" font-size="${isPared ? 19 : 14.5}" font-weight="800">🏖️ Playas, Cascadas &amp; Tours</text>
    <text x="${24 + catW / 2}" y="${catY + catH + 12 + (isPared ? 56 : 42)}" text-anchor="middle" fill="#736655" class="font-sans" font-size="${isPared ? 14.5 : 11}" font-weight="600">Beaches, Nature &amp; Tours</text>

    <!-- Cat 4 -->
    <rect x="${width - 24 - catW}" y="${catY + catH + 12}" width="${catW}" height="${catH}" rx="14" ry="14" fill="#fcfbf9" stroke="#e5dfd5" stroke-width="1.5" />
    <text x="${width - 24 - catW / 2}" y="${catY + catH + 12 + (isPared ? 32 : 24)}" text-anchor="middle" fill="#1c3829" class="font-sans" font-size="${isPared ? 19 : 14.5}" font-weight="800">🏡 Hospedaje, Cabañas &amp; Relax</text>
    <text x="${width - 24 - catW / 2}" y="${catY + catH + 12 + (isPared ? 56 : 42)}" text-anchor="middle" fill="#736655" class="font-sans" font-size="${isPared ? 14.5 : 11}" font-weight="600">Hotels, Cabins &amp; Wellness</text>
  </g>

  <line x1="30" y1="${footerY - (isPared ? 26 : 20)}" x2="${width - 30}" y2="${footerY - (isPared ? 26 : 20)}" stroke="#e0ded9" stroke-width="1" />
  <text x="${cx}" y="${footerY - (isPared ? 6 : 4)}" text-anchor="middle" fill="#1c3829" class="font-sans" font-size="${isPared ? 16 : 12.5}" font-weight="800">⚡ Sin descargar apps   ·   <tspan fill="#047857">💬 Reserva directa por WhatsApp</tspan></text>
  <text x="${cx}" y="${footerY + (isPared ? 20 : 15)}" text-anchor="middle" fill="#8a7e6e" class="font-sans" font-size="${isPared ? 13.5 : 10.5}" font-weight="600">Cartelera turística en vivo · Eventos, hospedajes y planes 🌿 <tspan font-weight="bold" fill="#1c3829">www.padonde.lat</tspan></text>
</svg>`;

      const blob = new Blob([svgContent], { type: "image/svg+xml;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      const cleanName = (puntoNombre || "punto").toLowerCase().replace(/[^a-z0-9]+/g, "-");
      link.download = `afiche-completo-padonde-${cleanName}-${formato}.svg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Error al exportar SVG:", err);
    } finally {
      setImprimiendo(false);
    }
  }

  // Descarga únicamente el código QR en formato SVG vectorial independiente
  async function handleDownloadSoloQRSVG() {
    setImprimiendo(true);
    try {
      const targetUrl = urlSeguraDestino || `https://www.padonde.lat/es/minca?src=${srcParam}`;
      const svgQrUrl = `https://api.qrserver.com/v1/create-qr-code/?format=svg&margin=10&data=${encodeURIComponent(
        targetUrl
      )}`;
      const res = await fetch(svgQrUrl);
      const svgText = await res.text();
      const blob = new Blob([svgText], { type: "image/svg+xml;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      const cleanName = (puntoNombre || "punto").toLowerCase().replace(/[^a-z0-9]+/g, "-");
      link.download = `solo-qr-${cleanName}-${srcParam}.svg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Error al descargar solo QR SVG:", err);
    } finally {
      setImprimiendo(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6">
      {/* Contenedor Modal */}
      <div className="bg-cream rounded-3xl max-w-2xl w-full shadow-2xl border border-stone-light/80 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Barra superior de controles */}
        <div className="p-4 sm:p-5 bg-white border-b border-stone-light/70 flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl">📄</span>
              <h3 className="font-serif text-lg sm:text-xl text-forest font-bold">
                Afiche Turístico Multilingüe
              </h3>
            </div>
            <p className="text-xs text-stone font-sans mt-0.5">
              Genera el afiche completo o descarga solo el código QR por separado en <strong>vector SVG o PDF</strong>.
            </p>
          </div>

          <div className="flex items-center flex-wrap gap-2">
            {/* Selector de tamaño / formato */}
            <div className="flex items-center p-1 bg-stone-light/40 rounded-xl text-xs font-sans">
              <button
                type="button"
                onClick={() => setFormato("pared")}
                className={[
                  "px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer",
                  formato === "pared"
                    ? "bg-white text-forest shadow-2xs font-semibold"
                    : "text-stone hover:text-forest",
                ].join(" ")}
              >
                Póster Grande (Pared)
              </button>
              <button
                type="button"
                onClick={() => setFormato("mesa")}
                className={[
                  "px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer",
                  formato === "mesa"
                    ? "bg-white text-forest shadow-2xs font-semibold"
                    : "text-stone hover:text-forest",
                ].join(" ")}
              >
                Hablador (Mesa)
              </button>
            </div>

            {/* Botón Descargar TODO el Afiche en SVG */}
            <button
              type="button"
              onClick={handleDownloadSVG}
              disabled={imprimiendo}
              className="px-3.5 py-2 bg-indigo-700 hover:bg-indigo-800 disabled:opacity-60 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs cursor-pointer transition-all active:scale-95"
              title="Descargar TODO el afiche diseñado en vector SVG (afiche completo con títulos, categorías y QR)"
            >
              <span>📐</span>
              <span>{imprimiendo ? "Generando..." : "Afiche SVG"}</span>
            </button>

            {/* Botón Descargar SOLO el Código QR en SVG */}
            <button
              type="button"
              onClick={handleDownloadSoloQRSVG}
              disabled={imprimiendo}
              className="px-3 py-2 bg-slate-700 hover:bg-slate-800 disabled:opacity-60 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs cursor-pointer transition-all active:scale-95"
              title="Descargar ÚNICAMENTE el código QR en formato vectorial SVG independiente"
            >
              <span>🔲</span>
              <span>Solo QR SVG</span>
            </button>

            {/* Botón Imprimir / PDF */}
            <button
              type="button"
              onClick={handlePrint}
              disabled={imprimiendo}
              className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-60 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs cursor-pointer transition-all active:scale-95"
              title="Imprimir directamente o guardar el afiche completo en PDF"
            >
              <span>🖨️</span>
              <span>{imprimiendo ? "Preparando..." : "Imprimir / PDF"}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 text-stone hover:text-forest rounded-xl hover:bg-stone-light/40 cursor-pointer"
              title="Cerrar vista previa"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Área de Visualización en pantalla */}
        <div className="overflow-y-auto p-4 sm:p-8 flex items-center justify-center bg-stone-200/40">
          <div
            className={[
              "bg-white text-forest rounded-2xl sm:rounded-3xl shadow-xl border-2 border-forest/30 relative overflow-hidden flex flex-col justify-between transition-all",
              formato === "pared"
                ? "w-full max-w-[560px] p-6 sm:p-8 space-y-5"
                : "w-full max-w-[460px] p-5 sm:p-6 space-y-4",
            ].join(" ")}
          >
            {/* Barra superior decorativa */}
            <div className="absolute top-0 left-0 right-0 h-2.5 bg-gradient-to-r from-forest via-terra to-forest" />

            {/* Cabecera */}
            <div className="text-center space-y-1 pt-1">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-forest/5 border border-forest/15">
                <span className="text-base">🌿</span>
                <span className="font-serif text-base sm:text-lg font-bold tracking-tight text-forest">
                  PaDónde <span className="font-sans font-semibold text-xs sm:text-sm text-stone">· Cartelera en Vivo</span>
                </span>
              </div>

              {nombreLugar && (
                <p className="text-xs sm:text-sm text-stone uppercase tracking-widest font-sans font-bold pt-0.5">
                  📍 Punto Oficial: <span className="text-forest font-black">{nombreLugar}</span>
                </p>
              )}
            </div>

            {/* Gancho Cuadrilingüe con textos más grandes */}
            <div className="text-center space-y-2">
              <div className="space-y-0.5">
                <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl text-forest font-black tracking-tight leading-tight">
                  ¿Qué hacer hoy?
                </h1>
                <p className="font-serif italic text-xl sm:text-2xl text-terra font-bold">
                  What to do today?
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2.5 max-w-md mx-auto text-xs sm:text-sm font-sans text-forest/90 pt-0.5">
                <div className="bg-forest/5 py-2 px-3 rounded-xl border border-forest/15 font-bold">
                  🇩🇪 <em>Was geht heute?</em>
                </div>
                <div className="bg-forest/5 py-2 px-3 rounded-xl border border-forest/15 font-bold">
                  🇫🇷 <em>Que faire aujourd&apos;hui ?</em>
                </div>
              </div>
            </div>

            {/* Código QR Central con mayor protagonismo */}
            <div className="flex flex-col items-center justify-center my-0.5">
              <div className="p-4 sm:p-5 bg-cream/60 rounded-3xl border-2 border-forest/25 shadow-xs flex flex-col items-center relative">
                <div className="absolute -top-3.5 px-3.5 py-1 bg-forest text-cream text-xs font-sans font-bold uppercase tracking-wider rounded-full shadow-xs flex items-center gap-1.5">
                  <span>📸</span>
                  <span>Escanear con tu cámara</span>
                </div>

                <img
                  src={qrImageUrlSegura}
                  alt={`Código QR ${nombreLugar}`}
                  className="w-44 h-44 sm:w-52 sm:h-52 object-contain rounded-xl"
                  style={{ imageRendering: "pixelated" }}
                />

                <p className="text-xs sm:text-sm font-mono text-stone font-bold mt-2">
                  {displayUrl}
                </p>
              </div>
            </div>

            {/* Categorías más amplias y legibles */}
            <div className="grid grid-cols-2 gap-2.5 text-center font-sans">
              <div className="p-3 sm:p-3.5 rounded-2xl bg-forest/5 border border-forest/15 shadow-2xs">
                <p className="font-black text-forest text-sm sm:text-base">🎵 Música &amp; Atardeceres</p>
                <p className="text-xs sm:text-sm text-stone font-semibold mt-0.5">Live Music · Nightlife</p>
              </div>
              <div className="p-3 sm:p-3.5 rounded-2xl bg-forest/5 border border-forest/15 shadow-2xs">
                <p className="font-black text-forest text-sm sm:text-base">🍽️ Gastronomía &amp; Café</p>
                <p className="text-xs sm:text-sm text-stone font-semibold mt-0.5">Food, Drinks &amp; Local Flavors</p>
              </div>
              <div className="p-3 sm:p-3.5 rounded-2xl bg-forest/5 border border-forest/15 shadow-2xs">
                <p className="font-black text-forest text-sm sm:text-base">🏖️ Playas, Cascadas &amp; Tours</p>
                <p className="text-xs sm:text-sm text-stone font-semibold mt-0.5">Beaches, Nature &amp; Tours</p>
              </div>
              <div className="p-3 sm:p-3.5 rounded-2xl bg-forest/5 border border-forest/15 shadow-2xs">
                <p className="font-black text-forest text-sm sm:text-base">🏡 Hospedaje, Cabañas &amp; Relax</p>
                <p className="text-xs sm:text-sm text-stone font-semibold mt-0.5">Hotels, Cabins &amp; Wellness</p>
              </div>
            </div>

            {/* Pie de página */}
            <div className="pt-2.5 border-t border-stone-light/70 text-center space-y-1 font-sans">
              <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-0.5 text-xs sm:text-sm text-forest font-bold">
                <span className="flex items-center gap-1">
                  <span>⚡</span> Sin descargar apps (Abre en tu navegador)
                </span>
                <span>·</span>
                <span className="flex items-center gap-1 text-emerald-800">
                  <span>💬</span> Reserva directa por WhatsApp
                </span>
              </div>
              <p className="text-xs text-stone font-medium">
                Cartelera turística en vivo · Eventos, hospedajes y planes 🌿 <strong className="text-forest">www.padonde.lat</strong>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
