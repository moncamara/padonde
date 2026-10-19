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

  const nombreLugar = puntoNombre.trim() || "Minca & Sierra Nevada";

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
        <span class="sub">Minca & Sierra Nevada</span>
      </div>
      ${
        nombreLugar
          ? `<p class="point-name">PUNTO OFICIAL: <strong>${nombreLugar}</strong></p>`
          : ""
      }
    </div>

    <div class="titles-block">
      <h1 class="title-es">¿Qué hacer hoy en Minca?</h1>
      <p class="title-en">What to do today in Minca?</p>
      <div class="langs-grid">
        <div class="lang-pill">🇩🇪 Was geht heute in Minca?</div>
        <div class="lang-pill">🇫🇷 Que faire aujourd'hui à Minca ?</div>
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
        <p class="qr-link">padonde.lat/es/minca?src=${srcParam}</p>
      </div>
    </div>

    <div class="categories-grid">
      <div class="cat-card">
        <p class="cat-title">🎵 Música & Atardeceres</p>
        <p class="cat-sub">Live Music · Live-Musik</p>
      </div>
      <div class="cat-card">
        <p class="cat-title">🍫 Cacao & Café de Origen</p>
        <p class="cat-sub">Cacao Tours · Kakao & Café</p>
      </div>
      <div class="cat-card">
        <p class="cat-title">🦜 Cascadas & Aves</p>
        <p class="cat-sub">Birding · Waterfalls</p>
      </div>
      <div class="cat-card">
        <p class="cat-title">🧘 Yoga, Cabañas & Bienestar</p>
        <p class="cat-sub">Eco-Lodge · Sauna · Wellness</p>
      </div>
    </div>

    <div class="footer-section">
      <div class="footer-features">
        <span>⚡ Sin descargar apps</span>
        <span>·</span>
        <span class="wa">💬 Reserva directa por WhatsApp</span>
      </div>
      <p class="footer-sub">
        Cartelera turística comunitaria de Minca, Sierra Nevada de Santa Marta 🌿 <strong>www.padonde.lat</strong>
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

  // Descarga directa en archivo .doc compatible con Microsoft Word y Google Docs
  async function handleDownloadWord() {
    setImprimiendo(true);
    try {
      // 1. Descargar la imagen del QR y convertirla a Base64 para incrustarla directamente en el Word
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
      // Dimensiones calibradas para encajar exactamente en 1 sola hoja carta sin desborde
      const qrPixelSize = isPared ? 250 : 190;
      const titlePt = isPared ? "24pt" : "19pt";
      const subPt = isPared ? "14pt" : "12pt";

      // Plantilla optimizada en formato HTML/Word con tablas (compatible 100% con Microsoft Word y Google Docs)
      const wordHtml = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
<head>
  <!--[if gte mso 9]>
  <xml>
    <w:WordDocument>
      <w:View>Print</w:View>
      <w:Zoom>100</w:Zoom>
      <w:DoNotOptimizeForBrowser/>
    </w:WordDocument>
  </xml>
  <![endif]-->
  <meta charset='utf-8'>
  <title>Afiche PaDónde - ${nombreLugar}</title>
  <style>
    @page {
      size: letter portrait;
      margin: 0.35in;
    }
    body {
      font-family: 'Helvetica Neue', Arial, sans-serif;
      color: #1c3829;
      background: #ffffff;
      margin: 0;
      padding: 0;
    }
    table.poster-table {
      width: 100%;
      max-width: 580px;
      margin: 0 auto;
      border: 3px solid #1c3829;
      border-collapse: separate;
      background-color: #ffffff;
      page-break-inside: avoid;
      break-inside: avoid;
    }
    td.header-cell {
      padding: 10px 16px 6px 16px;
      text-align: center;
      background-color: #fcfbf9;
      border-bottom: 2px solid #1c3829;
    }
    .badge-brand {
      font-size: 13pt;
      font-weight: bold;
      color: #1c3829;
      margin-bottom: 2px;
    }
    .badge-point {
      font-size: 9pt;
      text-transform: uppercase;
      color: #8a7e6e;
      letter-spacing: 1px;
    }
    td.title-cell {
      padding: 10px 16px 6px 16px;
      text-align: center;
    }
    .title-es {
      font-size: ${titlePt};
      font-weight: 900;
      color: #1c3829;
      line-height: 1.1;
      margin: 0 0 2px 0;
    }
    .title-en {
      font-size: ${subPt};
      font-weight: bold;
      font-style: italic;
      color: #c4622d;
      margin: 0 0 6px 0;
    }
    td.qr-cell {
      padding: 8px 16px;
      text-align: center;
      background-color: #f7f5f0;
    }
    .scan-badge {
      display: inline-block;
      background-color: #1c3829;
      color: #ffffff;
      font-size: 9pt;
      font-weight: bold;
      text-transform: uppercase;
      padding: 3px 14px;
      margin-bottom: 6px;
    }
    .qr-img {
      width: ${qrPixelSize}px;
      height: ${qrPixelSize}px;
      border: 1px solid #1c3829;
      display: block;
      margin: 0 auto;
    }
    .qr-url {
      font-family: monospace;
      font-size: 9pt;
      color: #8a7e6e;
      font-weight: bold;
      margin-top: 6px;
    }
    td.cats-cell {
      padding: 8px 16px;
    }
    table.cats-table {
      width: 100%;
      border-collapse: separate;
    }
    td.cat-item {
      width: 50%;
      padding: 6px 8px;
      background-color: #f9f8f5;
      border: 1px solid #e0ded9;
      text-align: center;
      font-size: 9pt;
    }
    td.footer-cell {
      padding: 8px 16px;
      text-align: center;
      background-color: #fcfbf9;
      border-top: 1px solid #e0ded9;
      font-size: 8.5pt;
      color: #8a7e6e;
    }
  </style>
</head>
<body>
  <table class="poster-table" align="center" cellpadding="0" cellspacing="0">
    <tr>
      <td class="header-cell">
        <div class="badge-brand">🌿 PaDónde · Minca & Sierra Nevada</div>
        ${
          nombreLugar
            ? `<div class="badge-point">PUNTO OFICIAL: <strong>${nombreLugar.toUpperCase()}</strong></div>`
            : ""
        }
      </td>
    </tr>
    <tr>
      <td class="title-cell">
        <div class="title-es">¿Qué hacer hoy en Minca?</div>
        <div class="title-en">What to do today in Minca?</div>
        <div style="font-size: 9pt; color: #2e4d36; font-weight: bold;">
          🇩🇪 Was geht heute in Minca? &nbsp;|&nbsp; 🇫🇷 Que faire aujourd'hui à Minca ?
        </div>
      </td>
    </tr>
    <tr>
      <td class="qr-cell">
        <div class="scan-badge">📸 ESCANEAR CON TU CÁMARA</div>
        <br/>
        <img src="${qrBase64}" width="${qrPixelSize}" height="${qrPixelSize}" class="qr-img" alt="QR PaDónde" />
        <div class="qr-url">padonde.lat/es/minca?src=${srcParam}</div>
      </td>
    </tr>
    <tr>
      <td class="cats-cell">
        <table class="cats-table" cellpadding="3" cellspacing="4">
          <tr>
            <td class="cat-item">
              <strong style="color: #1c3829;">🎵 Música & Atardeceres</strong><br/>
              <span style="color: #8a7e6e; font-size: 8.5pt;">Live Music · Live-Musik</span>
            </td>
            <td class="cat-item">
              <strong style="color: #1c3829;">🍫 Cacao & Café de Origen</strong><br/>
              <span style="color: #8a7e6e; font-size: 8.5pt;">Cacao Tours · Kakao & Café</span>
            </td>
          </tr>
          <tr>
            <td class="cat-item">
              <strong style="color: #1c3829;">🦜 Cascadas & Aves</strong><br/>
              <span style="color: #8a7e6e; font-size: 8.5pt;">Birding · Waterfalls</span>
            </td>
            <td class="cat-item">
              <strong style="color: #1c3829;">🧘 Yoga, Cabañas & Bienestar</strong><br/>
              <span style="color: #8a7e6e; font-size: 8.5pt;">Eco-Lodge · Sauna · Wellness</span>
            </td>
          </tr>
        </table>
      </td>
    </tr>
    <tr>
      <td class="footer-cell">
        <strong style="color: #1c3829;">⚡ Sin descargar apps</strong> &nbsp;·&nbsp;
        <strong style="color: #047857;">💬 Reserva directa por WhatsApp</strong>
        <br/><br/>
        Cartelera turística comunitaria de Minca, Sierra Nevada de Santa Marta 🌿 <strong>www.padonde.lat</strong>
      </td>
    </tr>
  </table>
</body>
</html>`;

      const blob = new Blob(["\ufeff" + wordHtml], {
        type: "application/msword;charset=utf-8",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      const cleanName = (puntoNombre || "minca")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-");
      link.download = `afiche-padonde-${cleanName}-${formato}.doc`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Error al exportar Word:", err);
    } finally {
      setImprimiendo(false);
    }
  }

  // Descarga directa en imagen JPG de Alta Resolución (300 DPI aprox, para imprenta o compartir)
  async function handleDownloadJpg() {
    setImprimiendo(true);
    try {
      const isPared = formato === "pared";
      // Dimensiones de alta resolución (Póster A4/Carta: 2400 x 3200 px | Hablador Mesa: 1800 x 2400 px)
      const canvasWidth = isPared ? 2400 : 1800;
      const canvasHeight = isPared ? 3200 : 2400;

      const canvas = document.createElement("canvas");
      canvas.width = canvasWidth;
      canvas.height = canvasHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // 1. Obtener imagen QR de alta resolución en Base64 para evitar taint en canvas
      let qrBase64 = qrImageUrl;
      try {
        const highResQrUrl = qrImageUrl.includes("size=")
          ? qrImageUrl.replace(/size=\d+x\d+/, "size=1200x1200")
          : qrImageUrl;
        const res = await fetch(highResQrUrl);
        const blob = await res.blob();
        qrBase64 = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(blob);
        });
      } catch {
        // Fallback si fetch falla
      }

      const qrImage = new window.Image();
      await new Promise<void>((resolve, reject) => {
        qrImage.onload = () => resolve();
        qrImage.onerror = () => reject();
        qrImage.src = qrBase64;
      });

      // Factor de escala entre 'pared' y 'mesa'
      const scale = isPared ? 1 : 0.75;
      const margin = 80 * scale;

      // 2. Fondo Blanco Nítido
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);

      // 3. Borde exterior elegante Verde Bosque
      const radius = 50 * scale;
      ctx.lineWidth = 14 * scale;
      ctx.strokeStyle = "#1c3829";
      ctx.beginPath();
      ctx.roundRect(margin, margin, canvasWidth - margin * 2, canvasHeight - margin * 2, radius);
      ctx.stroke();

      // 4. Barra superior tricolor
      const grad = ctx.createLinearGradient(margin, margin, canvasWidth - margin, margin);
      grad.addColorStop(0, "#1c3829");
      grad.addColorStop(0.5, "#c4622d");
      grad.addColorStop(1, "#1c3829");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.roundRect(margin + 20 * scale, margin + 8 * scale, canvasWidth - (margin + 20 * scale) * 2, 24 * scale, 12 * scale);
      ctx.fill();

      // 5. Encabezado de Marca
      ctx.textAlign = "center";

      // Badge PaDónde
      const badgeY = margin + 110 * scale;
      ctx.fillStyle = "#1c3829";
      ctx.font = `bold ${Math.round(54 * scale)}px 'Playfair Display', Georgia, serif`;
      ctx.fillText("🌿 PaDónde · Minca & Sierra Nevada", canvasWidth / 2, badgeY);

      // Punto Oficial
      if (nombreLugar) {
        ctx.fillStyle = "#8a7e6e";
        ctx.font = `bold ${Math.round(34 * scale)}px 'Inter', -apple-system, sans-serif`;
        ctx.fillText(`📍 PUNTO OFICIAL: ${nombreLugar.toUpperCase()}`, canvasWidth / 2, badgeY + 60 * scale);
      }

      // 6. Títulos Principales en Español e Inglés
      const titleY = badgeY + (nombreLugar ? 160 : 120) * scale;
      ctx.fillStyle = "#1c3829";
      ctx.font = `900 ${Math.round(96 * scale)}px 'Playfair Display', Georgia, serif`;
      ctx.fillText("¿Qué hacer hoy en Minca?", canvasWidth / 2, titleY);

      ctx.fillStyle = "#c4622d";
      ctx.font = `italic bold ${Math.round(56 * scale)}px 'Playfair Display', Georgia, serif`;
      ctx.fillText("What to do today in Minca?", canvasWidth / 2, titleY + 75 * scale);

      // Pastillas Alemán y Francés
      const pillsY = titleY + 120 * scale;
      const pillW = (canvasWidth - margin * 2 - 120 * scale) / 2;
      const pillH = 65 * scale;
      const pillYPos = pillsY;

      // Pastilla Alemán
      const pill1X = margin + 40 * scale;
      ctx.fillStyle = "rgba(28, 56, 41, 0.05)";
      ctx.beginPath();
      ctx.roundRect(pill1X, pillYPos, pillW, pillH, 18 * scale);
      ctx.fill();
      ctx.lineWidth = 2 * scale;
      ctx.strokeStyle = "rgba(28, 56, 41, 0.15)";
      ctx.stroke();

      ctx.fillStyle = "#1c3829";
      ctx.font = `italic 600 ${Math.round(32 * scale)}px 'Inter', sans-serif`;
      ctx.fillText("🇩🇪 Was geht heute in Minca?", pill1X + pillW / 2, pillYPos + 44 * scale);

      // Pastilla Francés
      const pill2X = pill1X + pillW + 40 * scale;
      ctx.fillStyle = "rgba(28, 56, 41, 0.05)";
      ctx.beginPath();
      ctx.roundRect(pill2X, pillYPos, pillW, pillH, 18 * scale);
      ctx.fill();
      ctx.strokeStyle = "rgba(28, 56, 41, 0.15)";
      ctx.stroke();

      ctx.fillStyle = "#1c3829";
      ctx.fillText("🇫🇷 Que faire aujourd'hui à Minca ?", pill2X + pillW / 2, pillYPos + 44 * scale);

      // 7. Contenedor del Código QR Central
      const qrBoxSize = isPared ? 1120 : 840;
      const qrX = (canvasWidth - qrBoxSize) / 2;
      const qrY = pillYPos + pillH + 45 * scale;
      const qrContainerH = qrBoxSize + 110 * scale;

      // Caja contenedor
      ctx.fillStyle = "#faf8f5";
      ctx.beginPath();
      ctx.roundRect(qrX, qrY, qrBoxSize, qrContainerH, 40 * scale);
      ctx.fill();
      ctx.lineWidth = 6 * scale;
      ctx.strokeStyle = "rgba(28, 56, 41, 0.3)";
      ctx.stroke();

      // Badge superior: Escanear con tu cámara
      const scanBadgeW = 560 * scale;
      const scanBadgeH = 55 * scale;
      ctx.fillStyle = "#1c3829";
      ctx.beginPath();
      ctx.roundRect(canvasWidth / 2 - scanBadgeW / 2, qrY - scanBadgeH / 2, scanBadgeW, scanBadgeH, scanBadgeH / 2);
      ctx.fill();

      ctx.fillStyle = "#ffffff";
      ctx.font = `bold ${Math.round(28 * scale)}px 'Inter', sans-serif`;
      ctx.fillText("📸 ESCANEAR CON TU CÁMARA", canvasWidth / 2, qrY + 8 * scale);

      // Dibujo del QR
      const qrImgPadding = 60 * scale;
      const qrImgSize = qrBoxSize - qrImgPadding * 2;
      ctx.drawImage(qrImage, qrX + qrImgPadding, qrY + 45 * scale, qrImgSize, qrImgSize);

      // Enlace web debajo del QR
      ctx.fillStyle = "#8a7e6e";
      ctx.font = `bold ${Math.round(32 * scale)}px monospace`;
      ctx.fillText(`padonde.lat/es/minca?src=${srcParam}`, canvasWidth / 2, qrY + qrBoxSize + 70 * scale);

      // 8. Cuadrícula de Categorías (4 tarjetas 2x2)
      const catY = qrY + qrContainerH + 40 * scale;
      const catW = (canvasWidth - margin * 2 - 80 * scale) / 2;
      const catH = 145 * scale;

      const categorias = [
        { t: "🎵 Música & Atardeceres", s: "Live Music · Live-Musik" },
        { t: "🍫 Cacao & Café de Origen", s: "Cacao Tours · Kakao & Café" },
        { t: "🦜 Cascadas & Aves", s: "Birding · Waterfalls" },
        { t: "🧘 Yoga, Cabañas & Bienestar", s: "Eco-Lodge · Sauna · Wellness" },
      ];

      categorias.forEach((c, i) => {
        const col = i % 2;
        const row = Math.floor(i / 2);
        const bx = margin + 30 * scale + col * (catW + 20 * scale);
        const by = catY + row * (catH + 20 * scale);

        ctx.fillStyle = "#fcfbf9";
        ctx.beginPath();
        ctx.roundRect(bx, by, catW, catH, 20 * scale);
        ctx.fill();
        ctx.lineWidth = 3 * scale;
        ctx.strokeStyle = "#e5dfd5";
        ctx.stroke();

        ctx.fillStyle = "#1c3829";
        ctx.font = `bold ${Math.round(38 * scale)}px 'Inter', sans-serif`;
        ctx.fillText(c.t, bx + catW / 2, by + 58 * scale);

        ctx.fillStyle = "#8a7e6e";
        ctx.font = `${Math.round(29 * scale)}px 'Inter', sans-serif`;
        ctx.fillText(c.s, bx + catW / 2, by + 105 * scale);
      });

      // 9. Pie de Página
      const footerY = canvasHeight - margin - 100 * scale;
      ctx.fillStyle = "#1c3829";
      ctx.font = `bold ${Math.round(34 * scale)}px 'Inter', sans-serif`;
      ctx.fillText("⚡ Sin descargar apps   ·   💬 Reserva directa con anfitriones por WhatsApp", canvasWidth / 2, footerY);

      ctx.fillStyle = "#8a7e6e";
      ctx.font = `${Math.round(27 * scale)}px 'Inter', sans-serif`;
      ctx.fillText("Cartelera turística comunitaria de Minca, Sierra Nevada de Santa Marta 🌿 www.padonde.lat", canvasWidth / 2, footerY + 45 * scale);

      // 10. Descargar archivo JPG
      const jpgData = canvas.toDataURL("image/jpeg", 0.95);
      const link = document.createElement("a");
      link.href = jpgData;
      const cleanName = (puntoNombre || "minca").toLowerCase().replace(/[^a-z0-9]+/g, "-");
      link.download = `afiche-padonde-${cleanName}-${formato}-alta-resolucion.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error("Error al exportar JPG:", err);
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
              Diseñado en <strong>4 idiomas (ES, EN, DE, FR)</strong> para imprimir o descargar en alta resolución.
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

            {/* Botón Descargar en JPG Alta Resolución */}
            <button
              type="button"
              onClick={handleDownloadJpg}
              disabled={imprimiendo}
              className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-60 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs cursor-pointer transition-all active:scale-95"
              title="Descargar imagen JPG nítida de alta resolución (300 DPI)"
            >
              <span>🖼️</span>
              <span>JPG Alta Calidad</span>
            </button>

            {/* Botón Descargar en Word */}
            <button
              type="button"
              onClick={handleDownloadWord}
              disabled={imprimiendo}
              className="px-3.5 py-2 bg-blue-700 hover:bg-blue-800 disabled:opacity-60 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs cursor-pointer transition-all active:scale-95"
              title="Descargar editable en formato Microsoft Word (.doc)"
            >
              <span>📝</span>
              <span>Word (.doc)</span>
            </button>

            {/* Botón Imprimir / PDF */}
            <button
              type="button"
              onClick={handlePrint}
              disabled={imprimiendo}
              className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-60 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs cursor-pointer transition-all active:scale-95"
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
                  PaDónde <span className="font-sans font-light text-xs text-stone">Minca</span>
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
                  ¿Qué hacer hoy en Minca?
                </h1>
                <p className="font-serif italic text-base sm:text-xl text-terra font-bold">
                  What to do today in Minca?
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 max-w-sm mx-auto text-xs font-sans text-forest/90 pt-0.5">
                <div className="bg-forest/5 p-1.5 rounded-lg border border-forest/10 font-medium">
                  🇩🇪 <em>Was geht heute in Minca?</em>
                </div>
                <div className="bg-forest/5 p-1.5 rounded-lg border border-forest/10 font-medium">
                  🇫🇷 <em>Que faire aujourd&apos;hui à Minca ?</em>
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
                  padonde.lat/es/minca?src={srcParam}
                </p>
              </div>
            </div>

            {/* Categorías más amplias y legibles */}
            <div className="grid grid-cols-2 gap-2 text-center text-xs font-sans">
              <div className="p-2.5 rounded-xl bg-forest/5 border border-stone-light/80">
                <p className="font-bold text-forest text-xs sm:text-sm">🎵 Música & Atardeceres</p>
                <p className="text-[11px] text-stone">Live Music · Live-Musik</p>
              </div>
              <div className="p-2.5 rounded-xl bg-forest/5 border border-stone-light/80">
                <p className="font-bold text-forest text-xs sm:text-sm">🍫 Cacao & Café de Origen</p>
                <p className="text-[11px] text-stone">Cacao Tours · Kakao & Café</p>
              </div>
              <div className="p-2.5 rounded-xl bg-forest/5 border border-stone-light/80">
                <p className="font-bold text-forest text-xs sm:text-sm">🦜 Cascadas & Aves</p>
                <p className="text-[11px] text-stone">Birding · Waterfalls</p>
              </div>
              <div className="p-2.5 rounded-xl bg-forest/5 border border-stone-light/80">
                <p className="font-bold text-forest text-xs sm:text-sm">🧘 Yoga, Cabañas & Bienestar</p>
                <p className="text-[11px] text-stone">Eco-Lodge · Sauna · Wellness</p>
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
                Cartelera turística comunitaria de Minca, Sierra Nevada de Santa Marta 🌿 <strong>www.padonde.lat</strong>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
