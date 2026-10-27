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
  const [generando, setGenerando] = useState(false);

  if (!isOpen) return null;

  const nombreLugar = puntoNombre.trim();
  const isMenu = tipoContenido === "menu_restaurante";

  // Sanitizar URL destino para evitar localhost
  const urlSeguraDestino = (
    urlDestino ||
    `https://www.padonde.lat/es/minca?src=${srcParam || "punto-fisico"}`
  ).replace(
    /^https?:\/\/(localhost(:\d+)?|127\.0\.0\.1(:\d+)?)/,
    "https://www.padonde.lat"
  );

  const qrImageUrlSegura =
    qrImageUrl &&
    !qrImageUrl.includes("localhost") &&
    !qrImageUrl.includes("127.0.0.1")
      ? qrImageUrl
      : `https://api.qrserver.com/v1/create-qr-code/?size=800x800&margin=10&data=${encodeURIComponent(
          urlSeguraDestino
        )}`;

  const displayUrl = urlSeguraDestino
    ? urlSeguraDestino.replace(/^https?:\/\/(www\.)?/, "")
    : `padonde.lat?src=${srcParam}`;

  // ─── 1. Plantilla HTML Ultralimpia para Impresión Nativa / Guardar en PDF ───
  function getAficheHTML() {
    const isPared = formato === "pared";
    const maxWidth = isPared ? "680px" : "480px";
    const padding = isPared ? "36px 32px" : "28px 24px";
    const qrSize = isPared ? "250px" : "200px";

    const tituloEs = isMenu ? "Carta & Menú Digital" : "¿Qué hacer hoy?";
    const tituloEn = isMenu
      ? "Digital Menu & Local Specials"
      : "Your Live Local Guide";
    const subtituloEs = isMenu
      ? "Platos, bebidas y recomendaciones de la casa"
      : "Planes del día, dónde comer y atardeceres";
    const callToActionEs = isMenu
      ? "Apunta con tu cámara para ver la carta"
      : "Apunta con tu cámara para explorar la zona";
    const callToActionEn = isMenu
      ? "Scan to view menu, photos & specials"
      : "Scan to discover what's happening around you";
    const featuresEs = isMenu
      ? "Precios actualizados · Fotos · Calificar en Google"
      : "Cartelera en vivo · Guía 100% gratuita · Sin descargar apps";

    return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <title>${isMenu ? `Hablador de Mesa - ${nombreLugar || "Restaurante"}` : `Afiche Turístico - ${nombreLugar || "PaDónde"}`}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,600;0,700;0,800;1,600&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    @page {
      size: portrait;
      margin: 8mm;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    html, body {
      width: 100%;
      height: 100%;
      background: #ffffff !important;
      color: #1c3829;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    body {
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 12px;
    }
    .poster-card {
      width: 100%;
      max-width: ${maxWidth};
      background: #ffffff;
      border: 2px solid #1c3829;
      border-radius: 28px;
      padding: ${padding};
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      page-break-inside: avoid;
      break-inside: avoid;
    }
    .top-accent {
      width: 48px;
      height: 4px;
      background: #c4622d;
      border-radius: 999px;
      margin-bottom: 16px;
    }
    .brand-pill {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 6px 18px;
      background: rgba(28, 56, 41, 0.05);
      border: 1px solid rgba(28, 56, 41, 0.15);
      border-radius: 999px;
      font-family: 'Playfair Display', Georgia, serif;
      font-size: 15px;
      font-weight: 700;
      color: #1c3829;
    }
    .place-name {
      font-size: 13px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1.2px;
      color: #78716c;
      margin-top: 8px;
    }
    .place-name strong {
      color: #1c3829;
    }
    .titles-wrap {
      margin-top: 14px;
      margin-bottom: 16px;
    }
    .title-main {
      font-family: 'Playfair Display', Georgia, serif;
      font-size: ${isPared ? "38px" : "30px"};
      font-weight: 800;
      color: #1c3829;
      line-height: 1.15;
      letter-spacing: -0.5px;
    }
    .title-sub {
      font-family: 'Playfair Display', Georgia, serif;
      font-style: italic;
      font-size: ${isPared ? "21px" : "18px"};
      color: #c4622d;
      font-weight: 600;
      margin-top: 4px;
    }
    .text-helper {
      font-size: 13px;
      color: #78716c;
      margin-top: 6px;
      font-weight: 500;
    }
    .qr-container {
      background: #faf9f6;
      border: 1.5px solid #e7e5e0;
      border-radius: 22px;
      padding: 16px 20px 14px 20px;
      margin: 10px 0 16px 0;
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    .qr-badge {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      background: #1c3829;
      color: #ffffff;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1px;
      padding: 4px 14px;
      border-radius: 999px;
      margin-bottom: 10px;
    }
    .qr-img {
      width: ${qrSize};
      height: ${qrSize};
      display: block;
      image-rendering: pixelated;
    }
    .cta-block {
      margin-top: 4px;
      margin-bottom: 16px;
    }
    .cta-es {
      font-size: 14px;
      font-weight: 700;
      color: #1c3829;
    }
    .cta-en {
      font-size: 12.5px;
      font-style: italic;
      color: #78716c;
      margin-top: 2px;
    }
    .features-pill {
      font-size: 11.5px;
      font-weight: 600;
      color: #1c3829;
      background: #f4f2ed;
      padding: 6px 14px;
      border-radius: 999px;
      margin-top: 8px;
    }
    .footer-divider {
      width: 100%;
      height: 1px;
      background: #e7e5e0;
      margin-top: 14px;
      margin-bottom: 12px;
    }
    .footer-url {
      font-size: 12px;
      font-weight: 700;
      color: #1c3829;
      letter-spacing: 0.5px;
    }
    .footer-sub {
      font-size: 10.5px;
      color: #78716c;
      margin-top: 2px;
    }
  </style>
</head>
<body>
  <div class="poster-card">
    <div class="top-accent"></div>

    <div class="brand-pill">
      <span>🌿</span>
      <span>PaDónde</span>
    </div>

    ${nombreLugar ? `<p class="place-name">${isMenu ? "Mesa:" : "Punto:"} <strong>${nombreLugar}</strong></p>` : ""}

    <div class="titles-wrap">
      <h1 class="title-main">${tituloEs}</h1>
      <p class="title-sub">${tituloEn}</p>
      <p class="text-helper">${subtituloEs}</p>
    </div>

    <div class="qr-container">
      <div class="qr-badge">📸 ${callToActionEs}</div>
      <img src="${qrImageUrlSegura}" alt="Código QR" class="qr-img" />
    </div>

    <div class="cta-block">
      <p class="cta-en">${callToActionEn}</p>
      <div class="features-pill">${featuresEs}</div>
    </div>

    <div class="footer-divider"></div>

    <p class="footer-url">padonde.lat</p>
    <p class="footer-sub">Abre al instante en tu celular · Sin descargas</p>
  </div>
</body>
</html>`;
  }

  // ─── 2. Acción: Imprimir o Guardar en PDF Vectorial ───
  function handlePrint() {
    setGenerando(true);
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
      setGenerando(false);
      return;
    }

    doc.open();
    doc.write(printHtml);
    doc.close();

    setTimeout(() => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
      setGenerando(false);
      setTimeout(() => {
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe);
        }
      }, 1500);
    }, 450);
  }

  // ─── 3. Acción: Descargar Imagen PNG Ultra HD (300 DPI, 1600 × 2400 px) ───
  async function handleDownloadPNG() {
    setGenerando(true);
    try {
      // Dimensiones de impresión nítida (proporción 2:3 vertical)
      const width = 1600;
      const height = 2400;
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("No canvas context");

      // Fondo blanco puro
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, width, height);

      // Marco exterior fino y elegante verde bosque (#1c3829)
      ctx.strokeStyle = "#1c3829";
      ctx.lineWidth = 10;
      const radius = 64;
      const m = 50; // Margen
      ctx.beginPath();
      ctx.roundRect(m, m, width - m * 2, height - m * 2, radius);
      ctx.stroke();

      // Pequeño acento terracota superior
      ctx.fillStyle = "#c4622d";
      ctx.beginPath();
      ctx.roundRect(width / 2 - 50, m + 40, 100, 10, 5);
      ctx.fill();

      // Píldora de marca PaDónde
      const pillY = m + 90;
      ctx.fillStyle = "rgba(28, 56, 41, 0.05)";
      ctx.strokeStyle = "rgba(28, 56, 41, 0.18)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.roundRect(width / 2 - 160, pillY, 320, 60, 30);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = "#1c3829";
      ctx.font = "bold 32px Georgia, serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("🌿 PaDónde", width / 2, pillY + 30);

      // Nombre del punto/mesa
      let curY = pillY + 110;
      if (nombreLugar) {
        ctx.fillStyle = "#78716c";
        ctx.font = "bold 24px -apple-system, BlinkMacSystemFont, sans-serif";
        ctx.fillText(
          `${isMenu ? "MESA OFICIAL:" : "PUNTO:"} ${nombreLugar.toUpperCase()}`,
          width / 2,
          curY
        );
        curY += 70;
      } else {
        curY += 30;
      }

      // Título Principal
      ctx.fillStyle = "#1c3829";
      ctx.font = "bold 78px Georgia, serif";
      const tituloEs = isMenu ? "Carta & Menú Digital" : "¿Qué hacer hoy?";
      ctx.fillText(tituloEs, width / 2, curY);

      // Subtítulo en Inglés
      curY += 75;
      ctx.fillStyle = "#c4622d";
      ctx.font = "italic bold 44px Georgia, serif";
      const tituloEn = isMenu
        ? "Digital Menu & Local Specials"
        : "Your Live Local Guide";
      ctx.fillText(tituloEn, width / 2, curY);

      // Texto de ayuda
      curY += 55;
      ctx.fillStyle = "#78716c";
      ctx.font = "500 28px -apple-system, BlinkMacSystemFont, sans-serif";
      const subtituloEs = isMenu
        ? "Platos, bebidas y recomendaciones de la casa"
        : "Planes del día, dónde comer y atardeceres";
      ctx.fillText(subtituloEs, width / 2, curY);

      // Contenedor del Código QR
      curY += 60;
      const qrBoxSize = 780;
      const qrBoxX = width / 2 - qrBoxSize / 2;
      ctx.fillStyle = "#faf9f6";
      ctx.strokeStyle = "#e7e5e0";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.roundRect(qrBoxX, curY, qrBoxSize, qrBoxSize + 70, 48);
      ctx.fill();
      ctx.stroke();

      // Badge superior del QR
      ctx.fillStyle = "#1c3829";
      ctx.beginPath();
      ctx.roundRect(width / 2 - 260, curY - 26, 520, 52, 26);
      ctx.fill();

      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 22px -apple-system, BlinkMacSystemFont, sans-serif";
      ctx.fillText(
        isMenu ? "📸 APUNTA CON TU CÁMARA" : "📸 ESCANEA CON TU CÁMARA",
        width / 2,
        curY
      );

      // Dibujar la imagen del código QR
      const qrImgSize = 680;
      const qrImgX = width / 2 - qrImgSize / 2;
      const qrImgY = curY + 45;

      const qrImageObj = new Image();
      qrImageObj.crossOrigin = "anonymous";

      await new Promise<void>((resolve, reject) => {
        qrImageObj.onload = () => resolve();
        qrImageObj.onerror = () => reject(new Error("Error cargando QR"));
        // Cargar QR en alta resolución
        qrImageObj.src = `https://api.qrserver.com/v1/create-qr-code/?size=1000x1000&margin=8&data=${encodeURIComponent(
          urlSeguraDestino
        )}`;
      });

      ctx.drawImage(qrImageObj, qrImgX, qrImgY, qrImgSize, qrImgSize);

      // Llamado a la acción inferior
      curY += qrBoxSize + 110;
      ctx.fillStyle = "#1c3829";
      ctx.font = "bold 34px -apple-system, BlinkMacSystemFont, sans-serif";
      const callToActionEs = isMenu
        ? "Precios actualizados · Fotos de platos · Calificar en Google"
        : "Eventos en vivo · Dónde comer · Cascadas & Tours";
      ctx.fillText(callToActionEs, width / 2, curY);

      curY += 50;
      ctx.fillStyle = "#78716c";
      ctx.font = "italic 28px Georgia, serif";
      const callToActionEn = isMenu
        ? "Point your camera to explore the full menu"
        : "Scan to discover what's happening around you";
      ctx.fillText(callToActionEn, width / 2, curY);

      // Píldora de soporte
      curY += 55;
      ctx.fillStyle = "#f4f2ed";
      ctx.beginPath();
      ctx.roundRect(width / 2 - 340, curY, 680, 52, 26);
      ctx.fill();

      ctx.fillStyle = "#1c3829";
      ctx.font = "600 24px -apple-system, BlinkMacSystemFont, sans-serif";
      ctx.fillText("⚡ Sin descargar aplicaciones · Abre en tu navegador", width / 2, curY + 26);

      // Línea divisoria
      curY += 100;
      ctx.strokeStyle = "#e7e5e0";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(m + 80, curY);
      ctx.lineTo(width - m - 80, curY);
      ctx.stroke();

      // Pie de página
      curY += 55;
      ctx.fillStyle = "#1c3829";
      ctx.font = "bold 30px Georgia, serif";
      ctx.fillText("padonde.lat", width / 2, curY);

      curY += 38;
      ctx.fillStyle = "#78716c";
      ctx.font = "500 22px -apple-system, BlinkMacSystemFont, sans-serif";
      ctx.fillText("Tu guía local en la Sierra Nevada y el Caribe", width / 2, curY);

      // Descargar como PNG
      canvas.toBlob((blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        const slugSafe = (nombreLugar || "padonde")
          .toLowerCase()
          .replace(/[^\w-]/g, "-");
        a.href = url;
        a.download = `afiche-${isMenu ? "menu" : "turismo"}-${slugSafe}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        setGenerando(false);
      }, "image/png");
    } catch (err) {
      console.error("Error generando PNG:", err);
      // Fallback: abrir imagen del QR
      window.open(qrImageUrlSegura, "_blank");
      setGenerando(false);
    }
  }

  // ─── 4. Acción: Descargar Solo el Código QR en PNG Ultra HD ───
  function handleDownloadSoloQRPNG() {
    const a = document.createElement("a");
    const slugSafe = (nombreLugar || "padonde")
      .toLowerCase()
      .replace(/[^\w-]/g, "-");
    a.href = `https://api.qrserver.com/v1/create-qr-code/?size=1200x1200&margin=12&data=${encodeURIComponent(
      urlSeguraDestino
    )}`;
    a.target = "_blank";
    a.download = `qr-${isMenu ? "menu" : "punto"}-${slugSafe}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  const tituloEs = isMenu ? "Carta & Menú Digital" : "¿Qué hacer hoy?";
  const tituloEn = isMenu
    ? "Digital Menu & Local Specials"
    : "Your Live Local Guide";
  const subtituloEs = isMenu
    ? "Platos, bebidas y recomendaciones de la casa"
    : "Planes del día, dónde comer y atardeceres";
  const callToActionEs = isMenu
    ? "Apunta con tu cámara para ver la carta"
    : "Apunta con tu cámara para explorar la zona";
  const callToActionEn = isMenu
    ? "Scan to view menu, photos & specials"
    : "Scan to discover what's happening around you";
  const featuresEs = isMenu
    ? "Precios actualizados · Fotos · Calificar en Google"
    : "Cartelera en vivo · Guía 100% gratuita · Sin descargar apps";

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      {/* Contenedor Modal */}
      <div className="bg-cream rounded-3xl max-w-2xl w-full shadow-2xl border border-stone-light/80 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Barra superior de controles */}
        <div className="p-4 sm:p-5 bg-white border-b border-stone-light/70 flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl">{isMenu ? "🍽️" : "📄"}</span>
              <h3 className="font-serif text-lg sm:text-xl text-forest font-bold">
                {isMenu ? "Hablador de Mesa QR" : "Afiche Turístico QR"}
              </h3>
            </div>
            <p className="text-xs text-stone font-sans mt-0.5">
              Diseño minimalista y limpio listo para imprimir o enviar al local.
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
                Pared / Recepción
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
                Hablador de Mesa
              </button>
            </div>

            {/* Botón Descargar Afiche Completo en Imagen PNG HD */}
            <button
              type="button"
              onClick={handleDownloadPNG}
              disabled={generando}
              className="px-3.5 py-2 bg-indigo-700 hover:bg-indigo-800 disabled:opacity-60 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs cursor-pointer transition-all active:scale-95"
              title="Descargar imagen nítida en alta resolución (PNG) para compartir por WhatsApp o mandar a imprenta"
            >
              <span>🖼️</span>
              <span>{generando ? "Generando..." : "Descargar Imagen (PNG)"}</span>
            </button>

            {/* Botón Descargar Solo QR PNG */}
            <button
              type="button"
              onClick={handleDownloadSoloQRPNG}
              disabled={generando}
              className="px-3 py-2 bg-slate-700 hover:bg-slate-800 disabled:opacity-60 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs cursor-pointer transition-all active:scale-95"
              title="Descargar únicamente el código QR nítido en PNG"
            >
              <span>🔲</span>
              <span>Solo QR</span>
            </button>

            {/* Botón Imprimir / PDF */}
            <button
              type="button"
              onClick={handlePrint}
              disabled={generando}
              className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-60 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs cursor-pointer transition-all active:scale-95"
              title="Imprimir directamente o guardar en PDF vectorial"
            >
              <span>📄</span>
              <span>{generando ? "Preparando..." : "Imprimir / PDF"}</span>
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

        {/* Área de Visualización previa en pantalla */}
        <div className="overflow-y-auto p-4 sm:p-8 flex items-center justify-center bg-stone-200/50">
          <div
            className={[
              "bg-white text-forest rounded-3xl shadow-xl border-2 border-forest/30 flex flex-col items-center text-center transition-all",
              formato === "pared"
                ? "w-full max-w-[500px] p-8 space-y-4"
                : "w-full max-w-[420px] p-6 space-y-3.5",
            ].join(" ")}
          >
            {/* Acento superior minimalista */}
            <div className="w-12 h-1 bg-terra rounded-full" />

            {/* Cabecera sutil */}
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-4 py-1 rounded-full bg-forest/5 border border-forest/15">
                <span className="text-sm">🌿</span>
                <span className="font-serif text-base font-bold text-forest">
                  PaDónde
                </span>
              </div>

              {nombreLugar && (
                <p className="text-xs text-stone font-sans uppercase tracking-wider font-bold pt-1">
                  {isMenu ? "Mesa:" : "Punto:"}{" "}
                  <strong className="text-forest">{nombreLugar}</strong>
                </p>
              )}
            </div>

            {/* Bloque de Títulos limpio */}
            <div className="space-y-1">
              <h1 className="font-serif text-2xl sm:text-3xl text-forest font-bold tracking-tight">
                {tituloEs}
              </h1>
              <p className="font-serif italic text-base sm:text-lg text-terra font-semibold">
                {tituloEn}
              </p>
              <p className="text-xs text-stone font-sans pt-0.5">
                {subtituloEs}
              </p>
            </div>

            {/* Código QR Central con respiración */}
            <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 flex flex-col items-center">
              <div className="px-3 py-1 bg-forest text-white text-[11px] font-sans font-bold uppercase tracking-wider rounded-full shadow-2xs mb-3">
                📸 {callToActionEs}
              </div>

              <img
                src={qrImageUrlSegura}
                alt={`Código QR ${nombreLugar}`}
                className="w-44 h-44 sm:w-52 sm:h-52 object-contain"
                style={{ imageRendering: "pixelated" }}
              />
            </div>

            {/* Ayuda y características */}
            <div className="space-y-2 pt-1">
              <p className="text-xs italic text-stone font-serif">
                {callToActionEn}
              </p>
              <p className="text-[11px] font-sans font-semibold text-forest bg-stone-100 px-3 py-1 rounded-full inline-block">
                {featuresEs}
              </p>
            </div>

            {/* Pie de página */}
            <div className="w-full pt-3 border-t border-stone-200 space-y-0.5">
              <p className="font-serif text-xs font-bold text-forest">
                padonde.lat
              </p>
              <p className="text-[10px] text-stone font-sans">
                Abre al instante en tu celular · Sin descargar aplicaciones
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
