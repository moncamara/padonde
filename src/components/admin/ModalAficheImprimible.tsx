"use client";

import { useState } from "react";

interface ModalAficheImprimibleProps {
  isOpen: boolean;
  onClose: () => void;
  puntoNombre: string;
  urlDestino: string;
  qrImageUrl: string;
  srcParam: string;
}

export function ModalAficheImprimible({
  isOpen,
  onClose,
  puntoNombre,
  urlDestino,
  qrImageUrl,
  srcParam,
}: ModalAficheImprimibleProps) {
  const [formato, setFormato] = useState<"pared" | "mesa">("pared");
  const [imprimiendo, setImprimiendo] = useState(false);

  if (!isOpen) return null;

  const nombreLugar = puntoNombre.trim();
  const displayUrl = urlDestino
    ? urlDestino.replace(/^https?:\/\/(www\.)?/, "")
    : `padonde.lat?src=${srcParam}`;

  function getAficheHTML() {
    const isPared = formato === "pared";
    // Dimensiones y tipografías grandes para aprovechar la hoja al máximo
    const maxWidth = isPared ? "720px" : "540px";
    const padding = isPared ? "36px 32px" : "26px 20px";
    const qrSize = isPared ? "280px" : "220px";
    const titleSize = isPared ? "38px" : "28px";
    const titleEnSize = isPared ? "22px" : "18px";
    const badgeBrandSize = isPared ? "18px" : "15px";

    return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <title>Afiche PaDónde - ${nombreLugar}</title>
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
      height: 10px;
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
      padding: 5px 18px;
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
      font-size: 13px;
      font-weight: 600;
      color: #8a7e6e;
    }
    .point-name {
      font-size: 13px;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      color: #8a7e6e;
      font-weight: 700;
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
      gap: 8px;
      max-width: 520px;
      margin: 10px auto 0 auto;
      font-size: 12px;
    }
    .lang-pill {
      background: #f7f4ee;
      border: 1.5px solid #e8e2d9;
      border-radius: 10px;
      padding: 6px 10px;
      text-align: center;
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
      top: -14px;
      left: 50%;
      transform: translateX(-50%);
      background: #1c3829;
      color: #ffffff;
      font-size: 11px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 1.2px;
      padding: 4px 16px;
      border-radius: 999px;
      white-space: nowrap;
      box-shadow: 0 2px 6px rgba(0,0,0,0.2);
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
      font-size: 11px;
      color: #8a7e6e;
      font-weight: 700;
      margin-top: 8px;
    }
    .categories-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
      margin-bottom: 14px;
    }
    .cat-card {
      background: #fbf9f6;
      border: 1.5px solid #e8e2d9;
      border-radius: 12px;
      padding: 8px 10px;
      text-align: center;
    }
    .cat-title {
      font-size: 13px;
      font-weight: 800;
      color: #1c3829;
    }
    .cat-sub {
      font-size: 11px;
      color: #8a7e6e;
      font-weight: 500;
      margin-top: 2px;
    }
    .footer-section {
      border-top: 1.5px solid #e8e2d9;
      padding-top: 10px;
      text-align: center;
    }
    .footer-features {
      display: flex;
      justify-content: center;
      gap: 14px;
      font-size: 12px;
      font-weight: 700;
      color: #1c3829;
      margin-bottom: 4px;
    }
    .footer-features .wa {
      color: #047857;
    }
    .footer-sub {
      font-size: 11px;
      color: #8a7e6e;
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
        <span class="sub">Cartelera en Vivo</span>
      </div>
      ${
        nombreLugar
          ? `<p class="point-name">PUNTO OFICIAL: <strong>${nombreLugar}</strong></p>`
          : ""
      }
    </div>

    <div class="titles-block">
      <h1 class="title-es">¿Qué hacer hoy?</h1>
      <p class="title-en">What to do today?</p>
      <div class="langs-grid">
        <div class="lang-pill">🇩🇪 Was geht heute?</div>
        <div class="lang-pill">🇫🇷 Que faire aujourd'hui ?</div>
      </div>
    </div>

    <div class="qr-stage">
      <div class="qr-wrapper">
        <div class="qr-badge-scan">📸 Escanear con tu cámara</div>
        <img
          src="${qrImageUrl}"
          alt="Código QR PaDónde"
          class="qr-image"
        />
        <p class="qr-link">${displayUrl}</p>
      </div>
    </div>

    <div class="categories-grid">
      <div class="cat-card">
        <p class="cat-title">🎵 Música & Atardeceres</p>
        <p class="cat-sub">Live Music · Nightlife</p>
      </div>
      <div class="cat-card">
        <p class="cat-title">🍽️ Gastronomía & Café</p>
        <p class="cat-sub">Food, Drinks & Local Flavors</p>
      </div>
      <div class="cat-card">
        <p class="cat-title">🏖️ Playas, Cascadas & Tours</p>
        <p class="cat-sub">Beaches, Nature & Tours</p>
      </div>
      <div class="cat-card">
        <p class="cat-title">🏡 Hospedaje, Cabañas & Relax</p>
        <p class="cat-sub">Hotels, Cabins & Wellness</p>
      </div>
    </div>

    <div class="footer-section">
      <div class="footer-features">
        <span>⚡ Sin descargar apps</span>
        <span>·</span>
        <span class="wa">💬 Reserva directa por WhatsApp</span>
      </div>
      <p class="footer-sub">
        Cartelera turística en vivo · Eventos, hospedajes y planes 🌿 <strong>www.padonde.lat</strong>
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
      let qrBase64 = qrImageUrl;
      try {
        const response = await fetch(qrImageUrl);
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

      const titleY = nombreLugar ? (isPared ? 155 : 130) : (isPared ? 135 : 115);
      const subTitleY = titleY + (isPared ? 34 : 26);
      const pillsY = subTitleY + (isPared ? 24 : 18);

      const qrBoxSize = isPared ? 280 : 210;
      const qrBoxH = qrBoxSize + (isPared ? 56 : 46);
      const qrY = pillsY + (isPared ? 35 : 28);

      const catY = qrY + qrBoxH + (isPared ? 26 : 20);
      const catW = (width - 70) / 2;
      const catH = isPared ? 62 : 48;

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
  <rect x="${cx - 130}" y="36" width="260" height="34" rx="17" ry="17" fill="#1c3829" fill-opacity="0.08" stroke="#1c3829" stroke-opacity="0.22" stroke-width="1.5" />
  <text x="${cx}" y="59" text-anchor="middle" fill="#1c3829" class="font-serif" font-size="16" font-weight="bold">🌿 PaDónde · <tspan class="font-sans" font-size="13" font-weight="600" fill="#8a7e6e">Cartelera en Vivo</tspan></text>

  <!-- Punto Oficial (opcional) -->
  ${
    nombreLugar
      ? `<text x="${cx}" y="94" text-anchor="middle" fill="#8a7e6e" class="font-sans" font-size="11" font-weight="700" letter-spacing="1">📍 PUNTO OFICIAL: <tspan fill="#1c3829">${nombreLugar.toUpperCase()}</tspan></text>`
      : ""
  }

  <!-- Títulos Principales Cuadrilingües -->
  <text x="${cx}" y="${titleY}" text-anchor="middle" fill="#1c3829" class="font-serif" font-size="${isPared ? 38 : 28}" font-weight="900">¿Qué hacer hoy?</text>
  <text x="${cx}" y="${subTitleY}" text-anchor="middle" fill="#c4622d" class="font-serif" font-style="italic" font-size="${isPared ? 22 : 17}" font-weight="bold">What to do today?</text>

  <!-- Pastillas Alemán / Francés -->
  <rect x="${cx - (isPared ? 230 : 175)}" y="${pillsY}" width="${isPared ? 220 : 170}" height="${isPared ? 28 : 24}" rx="8" ry="8" fill="#1c3829" fill-opacity="0.05" stroke="#1c3829" stroke-opacity="0.15" stroke-width="1" />
  <text x="${cx - (isPared ? 120 : 90)}" y="${pillsY + (isPared ? 19 : 16)}" text-anchor="middle" fill="#1c3829" class="font-sans" font-size="${isPared ? 12 : 10}" font-weight="600" font-style="italic">🇩🇪 Was geht heute?</text>

  <rect x="${cx + (isPared ? 10 : 5)}" y="${pillsY}" width="${isPared ? 220 : 170}" height="${isPared ? 28 : 24}" rx="8" ry="8" fill="#1c3829" fill-opacity="0.05" stroke="#1c3829" stroke-opacity="0.15" stroke-width="1" />
  <text x="${cx + (isPared ? 120 : 90)}" y="${pillsY + (isPared ? 19 : 16)}" text-anchor="middle" fill="#1c3829" class="font-sans" font-size="${isPared ? 12 : 10}" font-weight="600" font-style="italic">🇫🇷 Que faire aujourd'hui ?</text>

  <!-- Contenedor QR -->
  <rect x="${cx - qrBoxSize / 2}" y="${qrY}" width="${qrBoxSize}" height="${qrBoxH}" rx="20" ry="20" fill="#faf8f5" stroke="#1c3829" stroke-opacity="0.25" stroke-width="2" />

  <!-- Badge Escaneo -->
  <rect x="${cx - (isPared ? 100 : 85)}" y="${qrY - (isPared ? 13 : 11)}" width="${isPared ? 200 : 170}" height="${isPared ? 26 : 22}" rx="${isPared ? 13 : 11}" ry="${isPared ? 13 : 11}" fill="#1c3829" />
  <text x="${cx}" y="${qrY + (isPared ? 4 : 3)}" text-anchor="middle" fill="#ffffff" class="font-sans" font-size="${isPared ? 10 : 9}" font-weight="bold" letter-spacing="1">📸 ESCANEAR CON TU CÁMARA</text>

  <!-- Imagen QR -->
  <image href="${qrBase64}" x="${cx - (qrBoxSize - 36) / 2}" y="${qrY + 18}" width="${qrBoxSize - 36}" height="${qrBoxSize - 36}" preserveAspectRatio="xMidYMid meet" />

  <!-- Enlace debajo del QR -->
  <text x="${cx}" y="${qrY + qrBoxSize + (isPared ? 8 : 6)}" text-anchor="middle" fill="#8a7e6e" class="font-mono" font-size="${isPared ? 12 : 10}" font-weight="bold">${displayUrl}</text>

  <!-- Tarjetas de Categorías (2x2) -->
  <g>
    <!-- Cat 1 -->
    <rect x="25" y="${catY}" width="${catW}" height="${catH}" rx="12" ry="12" fill="#fcfbf9" stroke="#e5dfd5" stroke-width="1.5" />
    <text x="${25 + catW / 2}" y="${catY + (isPared ? 26 : 20)}" text-anchor="middle" fill="#1c3829" class="font-sans" font-size="${isPared ? 13 : 11}" font-weight="bold">🎵 Música &amp; Atardeceres</text>
    <text x="${25 + catW / 2}" y="${catY + (isPared ? 46 : 36)}" text-anchor="middle" fill="#8a7e6e" class="font-sans" font-size="${isPared ? 11 : 9}">Live Music · Nightlife</text>

    <!-- Cat 2 -->
    <rect x="${35 + catW}" y="${catY}" width="${catW}" height="${catH}" rx="12" ry="12" fill="#fcfbf9" stroke="#e5dfd5" stroke-width="1.5" />
    <text x="${35 + catW + catW / 2}" y="${catY + (isPared ? 26 : 20)}" text-anchor="middle" fill="#1c3829" class="font-sans" font-size="${isPared ? 13 : 11}" font-weight="bold">🍽️ Gastronomía &amp; Café</text>
    <text x="${35 + catW + catW / 2}" y="${catY + (isPared ? 46 : 36)}" text-anchor="middle" fill="#8a7e6e" class="font-sans" font-size="${isPared ? 11 : 9}">Food, Drinks &amp; Local Flavors</text>

    <!-- Cat 3 -->
    <rect x="25" y="${catY + catH + 10}" width="${catW}" height="${catH}" rx="12" ry="12" fill="#fcfbf9" stroke="#e5dfd5" stroke-width="1.5" />
    <text x="${25 + catW / 2}" y="${catY + catH + 10 + (isPared ? 26 : 20)}" text-anchor="middle" fill="#1c3829" class="font-sans" font-size="${isPared ? 13 : 11}" font-weight="bold">🏖️ Playas, Cascadas &amp; Tours</text>
    <text x="${25 + catW / 2}" y="${catY + catH + 10 + (isPared ? 46 : 36)}" text-anchor="middle" fill="#8a7e6e" class="font-sans" font-size="${isPared ? 11 : 9}">Beaches, Nature &amp; Tours</text>

    <!-- Cat 4 -->
    <rect x="${35 + catW}" y="${catY + catH + 10}" width="${catW}" height="${catH}" rx="12" ry="12" fill="#fcfbf9" stroke="#e5dfd5" stroke-width="1.5" />
    <text x="${35 + catW + catW / 2}" y="${catY + catH + 10 + (isPared ? 26 : 20)}" text-anchor="middle" fill="#1c3829" class="font-sans" font-size="${isPared ? 13 : 11}" font-weight="bold">🏡 Hospedaje, Cabañas &amp; Relax</text>
    <text x="${35 + catW + catW / 2}" y="${catY + catH + 10 + (isPared ? 46 : 36)}" text-anchor="middle" fill="#8a7e6e" class="font-sans" font-size="${isPared ? 11 : 9}">Hotels, Cabins &amp; Wellness</text>
  </g>

  <!-- Pie de Página -->
  <line x1="30" y1="${footerY - (isPared ? 26 : 20)}" x2="${width - 30}" y2="${footerY - (isPared ? 26 : 20)}" stroke="#e0ded9" stroke-width="1" />
  <text x="${cx}" y="${footerY - (isPared ? 8 : 6)}" text-anchor="middle" fill="#1c3829" class="font-sans" font-size="${isPared ? 12 : 10}" font-weight="bold">⚡ Sin descargar apps   ·   <tspan fill="#047857">💬 Reserva directa por WhatsApp</tspan></text>
  <text x="${cx}" y="${footerY + (isPared ? 16 : 12)}" text-anchor="middle" fill="#8a7e6e" class="font-sans" font-size="${isPared ? 10 : 8.5}">Cartelera turística en vivo · Eventos, hospedajes y planes 🌿 <tspan font-weight="bold" fill="#1c3829">www.padonde.lat</tspan></text>
</svg>`;

      const blob = new Blob([svgContent], { type: "image/svg+xml;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      const cleanName = (puntoNombre || "punto").toLowerCase().replace(/[^a-z0-9]+/g, "-");
      link.download = `afiche-padonde-${cleanName}-${formato}.svg`;
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
              Diseñado en <strong>4 idiomas (ES, EN, DE, FR)</strong> para imprimir en PDF o exportar en vector SVG.
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

            {/* Botón Descargar en SVG Vectorial */}
            <button
              type="button"
              onClick={handleDownloadSVG}
              disabled={imprimiendo}
              className="px-3.5 py-2 bg-indigo-700 hover:bg-indigo-800 disabled:opacity-60 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs cursor-pointer transition-all active:scale-95"
              title="Descargar archivo vectorial SVG (resolución infinita, ideal para litografías, imprentas o corte)"
            >
              <span>📐</span>
              <span>{imprimiendo ? "Generando..." : "Descargar SVG"}</span>
            </button>

            {/* Botón Imprimir / PDF */}
            <button
              type="button"
              onClick={handlePrint}
              disabled={imprimiendo}
              className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-60 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs cursor-pointer transition-all active:scale-95"
              title="Imprimir directamente o guardar en PDF tamaño carta/A4"
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
              <div className="inline-flex items-center gap-2 px-3 py-0.5 rounded-full bg-forest/5 border border-forest/15">
                <span className="text-base">🌿</span>
                <span className="font-serif text-base font-bold tracking-tight text-forest">
                  PaDónde <span className="font-sans font-medium text-xs text-stone">· Cartelera en Vivo</span>
                </span>
              </div>

              {nombreLugar && (
                <p className="text-xs text-stone uppercase tracking-widest font-sans font-semibold pt-0.5">
                  📍 Punto Oficial: <span className="text-forest font-bold">{nombreLugar}</span>
                </p>
              )}
            </div>

            {/* Gancho Cuadrilingüe con textos más grandes */}
            <div className="text-center space-y-2">
              <div className="space-y-0.5">
                <h1 className="font-serif text-2xl sm:text-3xl lg:text-4xl text-forest font-black tracking-tight leading-tight">
                  ¿Qué hacer hoy?
                </h1>
                <p className="font-serif italic text-base sm:text-xl text-terra font-bold">
                  What to do today?
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 max-w-sm mx-auto text-xs font-sans text-forest/90 pt-0.5">
                <div className="bg-forest/5 p-1.5 rounded-lg border border-forest/10 font-medium">
                  🇩🇪 <em>Was geht heute?</em>
                </div>
                <div className="bg-forest/5 p-1.5 rounded-lg border border-forest/10 font-medium">
                  🇫🇷 <em>Que faire aujourd&apos;hui ?</em>
                </div>
              </div>
            </div>

            {/* Código QR Central con mayor protagonismo */}
            <div className="flex flex-col items-center justify-center my-1">
              <div className="p-4 sm:p-5 bg-cream/60 rounded-3xl border-2 border-forest/25 shadow-xs flex flex-col items-center relative">
                <div className="absolute -top-3 px-3 py-0.5 bg-forest text-cream text-[10px] sm:text-xs font-sans font-bold uppercase tracking-wider rounded-full shadow-xs flex items-center gap-1">
                  <span>📸</span>
                  <span>Escanear con tu cámara</span>
                </div>

                <img
                  src={qrImageUrl}
                  alt={`Código QR ${nombreLugar}`}
                  className="w-52 h-52 sm:w-64 sm:h-64 object-contain rounded-xl"
                  style={{ imageRendering: "pixelated" }}
                />

                <p className="text-[11px] font-mono text-stone font-semibold mt-2">
                  {displayUrl}
                </p>
              </div>
            </div>

            {/* Categorías más amplias y legibles */}
            <div className="grid grid-cols-2 gap-2 text-center text-xs font-sans">
              <div className="p-2.5 rounded-xl bg-forest/5 border border-stone-light/80">
                <p className="font-bold text-forest text-xs sm:text-sm">🎵 Música & Atardeceres</p>
                <p className="text-[11px] text-stone">Live Music · Nightlife</p>
              </div>
              <div className="p-2.5 rounded-xl bg-forest/5 border border-stone-light/80">
                <p className="font-bold text-forest text-xs sm:text-sm">🍽️ Gastronomía & Café</p>
                <p className="text-[11px] text-stone">Food, Drinks & Local Flavors</p>
              </div>
              <div className="p-2.5 rounded-xl bg-forest/5 border border-stone-light/80">
                <p className="font-bold text-forest text-xs sm:text-sm">🏖️ Playas, Cascadas & Tours</p>
                <p className="text-[11px] text-stone">Beaches, Nature & Tours</p>
              </div>
              <div className="p-2.5 rounded-xl bg-forest/5 border border-stone-light/80">
                <p className="font-bold text-forest text-xs sm:text-sm">🏡 Hospedaje, Cabañas & Relax</p>
                <p className="text-[11px] text-stone">Hotels, Cabins & Wellness</p>
              </div>
            </div>

            {/* Pie de página */}
            <div className="pt-2.5 border-t border-stone-light/70 text-center space-y-1 font-sans">
              <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-0.5 text-[11px] sm:text-xs text-forest font-semibold">
                <span className="flex items-center gap-1">
                  <span>⚡</span> Sin descargar apps (Abre en tu navegador)
                </span>
                <span>·</span>
                <span className="flex items-center gap-1 text-emerald-800">
                  <span>💬</span> Reserva directa con anfitriones por WhatsApp
                </span>
              </div>
              <p className="text-[10px] text-stone">
                Cartelera turística en vivo · Eventos, hospedajes y planes 🌿 <strong>www.padonde.lat</strong>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
