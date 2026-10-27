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

  // Sanitizar URL destino
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

  // Título grande en INGLÉS (para el turista internacional) y subtítulo sutil en español
  const mainTitleEN = isMenu ? "DIGITAL MENU" : "WHAT TO DO TODAY?";
  const subTitleES = isMenu ? "Carta & Precios" : "Guía local en vivo";

  // ─── 1. Plantilla HTML para Impresión Nativa / Guardar en PDF ───
  function getAficheHTML() {
    const isPared = formato === "pared";
    const maxWidth = isPared ? "580px" : "420px";
    const padding = isPared ? "36px 30px" : "26px 22px";
    const qrSize = isPared ? "270px" : "220px";

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>${isMenu ? `Menu - ${nombreLugar || "PaDónde"}` : `Guide - ${nombreLugar || "PaDónde"}`}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,600&family=Inter:wght@500;600;700;800&display=swap" rel="stylesheet">
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
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    body {
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 10px;
    }
    .poster-card {
      width: 100%;
      max-width: ${maxWidth};
      background: #ffffff;
      border: 2px solid #1c3829;
      border-radius: 26px;
      padding: ${padding};
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      page-break-inside: avoid;
      break-inside: avoid;
    }
    .brand-row {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-family: 'Playfair Display', Georgia, serif;
      font-size: 15px;
      font-weight: 700;
      color: #1c3829;
      margin-bottom: 2px;
    }
    .venue-name {
      font-size: 14px;
      font-weight: 800;
      color: #78716c;
      letter-spacing: 0.5px;
      margin-bottom: 14px;
    }
    .title-en {
      font-family: 'Playfair Display', Georgia, serif;
      font-size: ${isPared ? "44px" : "34px"};
      font-weight: 900;
      color: #1c3829;
      line-height: 1.05;
      letter-spacing: -0.5px;
      text-transform: uppercase;
    }
    .sub-es {
      font-family: 'Playfair Display', Georgia, serif;
      font-style: italic;
      font-size: ${isPared ? "22px" : "18px"};
      color: #c4622d;
      font-weight: 600;
      margin-top: 4px;
      margin-bottom: 16px;
    }
    .qr-container {
      background: #faf9f6;
      border: 1.5px solid #e7e5e0;
      border-radius: 20px;
      padding: 16px 20px 14px 20px;
      margin-bottom: 16px;
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
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 1px;
      padding: 4px 16px;
      border-radius: 999px;
      margin-bottom: 10px;
    }
    .qr-img {
      width: ${qrSize};
      height: ${qrSize};
      display: block;
      image-rendering: pixelated;
    }
    .instruction-text {
      font-size: 13px;
      font-weight: 600;
      color: #1c3829;
    }
    .instruction-sub {
      font-size: 11px;
      color: #78716c;
      margin-top: 2px;
    }
    .footer-divider {
      width: 100%;
      height: 1px;
      background: #e7e5e0;
      margin-top: 16px;
      margin-bottom: 10px;
    }
    .footer-url {
      font-size: 12px;
      font-weight: 700;
      color: #1c3829;
      letter-spacing: 0.5px;
    }
  </style>
</head>
<body>
  <div class="poster-card">
    <div class="brand-row">
      <span>🌿</span>
      <span>PaDónde</span>
    </div>

    ${nombreLugar ? `<p class="venue-name">${nombreLugar}</p>` : ""}

    <h1 class="title-en">${mainTitleEN}</h1>
    <p class="sub-es">${subTitleES}</p>

    <div class="qr-container">
      <div class="qr-badge">SCAN ME</div>
      <img src="${qrImageUrlSegura}" alt="QR" class="qr-img" />
    </div>

    <p class="instruction-text">📸 Scan with your camera · Escanea aquí</p>
    <p class="instruction-sub">Instant mobile access · Sin descargas</p>

    <div class="footer-divider"></div>

    <p class="footer-url">padonde.lat</p>
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

      // Marco exterior fino verde bosque (#1c3829)
      ctx.strokeStyle = "#1c3829";
      ctx.lineWidth = 10;
      const radius = 64;
      const m = 50;
      ctx.beginPath();
      ctx.roundRect(m, m, width - m * 2, height - m * 2, radius);
      ctx.stroke();

      // Marca PaDónde
      let curY = m + 130;
      ctx.fillStyle = "#1c3829";
      ctx.font = "bold 38px Georgia, serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("🌿 PaDónde", width / 2, curY);

      // Nombre del establecimiento (si existe, sin la palabra "Punto")
      curY += 60;
      if (nombreLugar) {
        ctx.fillStyle = "#78716c";
        ctx.font = "bold 30px -apple-system, BlinkMacSystemFont, sans-serif";
        ctx.fillText(nombreLugar, width / 2, curY);
        curY += 80;
      } else {
        curY += 40;
      }

      // TÍTULO GRANDE EN INGLÉS (PROTAGONISTA)
      ctx.fillStyle = "#1c3829";
      ctx.font = "bold 96px Georgia, serif";
      ctx.fillText(mainTitleEN, width / 2, curY);

      // SUBTÍTULO EN ESPAÑOL
      curY += 85;
      ctx.fillStyle = "#c4622d";
      ctx.font = "italic bold 48px Georgia, serif";
      ctx.fillText(subTitleES, width / 2, curY);

      // CONTENEDOR DEL CÓDIGO QR
      curY += 75;
      const qrBoxSize = 880;
      const qrBoxX = width / 2 - qrBoxSize / 2;
      ctx.fillStyle = "#faf9f6";
      ctx.strokeStyle = "#e7e5e0";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.roundRect(qrBoxX, curY, qrBoxSize, qrBoxSize + 70, 48);
      ctx.fill();
      ctx.stroke();

      // Badge SCAN ME
      ctx.fillStyle = "#1c3829";
      ctx.beginPath();
      ctx.roundRect(width / 2 - 180, curY - 26, 360, 52, 26);
      ctx.fill();

      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 24px -apple-system, BlinkMacSystemFont, sans-serif";
      ctx.fillText("SCAN ME", width / 2, curY);

      // Cargar y dibujar el código QR
      const qrImgSize = 780;
      const qrImgX = width / 2 - qrImgSize / 2;
      const qrImgY = curY + 45;

      const qrImageObj = new Image();
      qrImageObj.crossOrigin = "anonymous";

      await new Promise<void>((resolve, reject) => {
        qrImageObj.onload = () => resolve();
        qrImageObj.onerror = () => reject(new Error("Error cargando QR"));
        qrImageObj.src = `https://api.qrserver.com/v1/create-qr-code/?size=1000x1000&margin=8&data=${encodeURIComponent(
          urlSeguraDestino
        )}`;
      });

      ctx.drawImage(qrImageObj, qrImgX, qrImgY, qrImgSize, qrImgSize);

      // Instrucción concisa
      curY += qrBoxSize + 115;
      ctx.fillStyle = "#1c3829";
      ctx.font = "bold 38px -apple-system, BlinkMacSystemFont, sans-serif";
      ctx.fillText("📸 Scan with your camera · Escanea aquí", width / 2, curY);

      curY += 50;
      ctx.fillStyle = "#78716c";
      ctx.font = "500 28px -apple-system, BlinkMacSystemFont, sans-serif";
      ctx.fillText("Instant mobile access · Sin descargas", width / 2, curY);

      // Línea divisoria
      curY += 100;
      ctx.strokeStyle = "#e7e5e0";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(m + 120, curY);
      ctx.lineTo(width - m - 120, curY);
      ctx.stroke();

      // Footer padonde.lat
      curY += 60;
      ctx.fillStyle = "#1c3829";
      ctx.font = "bold 32px Georgia, serif";
      ctx.fillText("padonde.lat", width / 2, curY);

      // Descargar como archivo PNG
      canvas.toBlob((blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        const slugSafe = (nombreLugar || "padonde")
          .toLowerCase()
          .replace(/[^\w-]/g, "-");
        a.href = url;
        a.download = `qr-${isMenu ? "menu" : "guide"}-${slugSafe}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        setGenerando(false);
      }, "image/png");
    } catch (err) {
      console.error("Error generando PNG:", err);
      window.open(qrImageUrlSegura, "_blank");
      setGenerando(false);
    }
  }

  // ─── 4. Acción: Descargar Solo el Código QR en PNG ───
  function handleDownloadSoloQRPNG() {
    const a = document.createElement("a");
    const slugSafe = (nombreLugar || "padonde")
      .toLowerCase()
      .replace(/[^\w-]/g, "-");
    a.href = `https://api.qrserver.com/v1/create-qr-code/?size=1200x1200&margin=12&data=${encodeURIComponent(
      urlSeguraDestino
    )}`;
    a.target = "_blank";
    a.download = `solo-qr-${slugSafe}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      {/* Contenedor Modal */}
      <div className="bg-cream rounded-3xl max-w-xl w-full shadow-2xl border border-stone-light/80 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Barra superior de controles */}
        <div className="p-4 sm:p-5 bg-white border-b border-stone-light/70 flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl">{isMenu ? "🍽️" : "📄"}</span>
              <h3 className="font-serif text-lg sm:text-xl text-forest font-bold">
                {isMenu ? "Hablador QR de Mesa" : "Afiche QR Turístico"}
              </h3>
            </div>
            <p className="text-xs text-stone font-sans mt-0.5">
              Diseño ultra limpio en inglés y español.
            </p>
          </div>

          <div className="flex items-center flex-wrap gap-2">
            {/* Selector de tamaño */}
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
                Pared
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
                Mesa / Sticker
              </button>
            </div>

            {/* Descargar PNG */}
            <button
              type="button"
              onClick={handleDownloadPNG}
              disabled={generando}
              className="px-3.5 py-2 bg-indigo-700 hover:bg-indigo-800 disabled:opacity-60 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs cursor-pointer transition-all active:scale-95"
              title="Descargar imagen nítida en alta resolución (PNG)"
            >
              <span>🖼️</span>
              <span>{generando ? "Generando..." : "Descargar Imagen"}</span>
            </button>

            {/* Solo QR */}
            <button
              type="button"
              onClick={handleDownloadSoloQRPNG}
              disabled={generando}
              className="px-3 py-2 bg-slate-700 hover:bg-slate-800 disabled:opacity-60 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs cursor-pointer transition-all active:scale-95"
              title="Descargar únicamente el código QR cuadrado"
            >
              <span>🔲</span>
              <span>Solo QR</span>
            </button>

            {/* Imprimir / PDF */}
            <button
              type="button"
              onClick={handlePrint}
              disabled={generando}
              className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-60 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs cursor-pointer transition-all active:scale-95"
              title="Imprimir directamente o guardar en PDF"
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
                ? "w-full max-w-[440px] p-8 space-y-3"
                : "w-full max-w-[360px] p-6 space-y-2.5",
            ].join(" ")}
          >
            {/* Marca PaDónde */}
            <div className="flex items-center gap-1.5 text-forest font-serif font-bold text-sm">
              <span>🌿</span>
              <span>PaDónde</span>
            </div>

            {/* Nombre del local (limpio, sin prefijo 'Punto:') */}
            {nombreLugar && (
              <p className="text-xs font-sans font-bold text-stone uppercase tracking-wider">
                {nombreLugar}
              </p>
            )}

            {/* Título en INGLÉS (GRANDE Y PROTAGONISTA) */}
            <div className="pt-1">
              <h1 className="font-serif text-3xl sm:text-4xl text-forest font-black tracking-tight uppercase leading-none">
                {mainTitleEN}
              </h1>
              <p className="font-serif italic text-base sm:text-lg text-terra font-semibold mt-1">
                {subTitleES}
              </p>
            </div>

            {/* Código QR Central con badge SCAN ME */}
            <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 flex flex-col items-center my-1">
              <div className="px-3.5 py-0.5 bg-forest text-white text-[11px] font-sans font-extrabold uppercase tracking-wider rounded-full shadow-2xs mb-2.5">
                SCAN ME
              </div>

              <img
                src={qrImageUrlSegura}
                alt={`QR ${nombreLugar}`}
                className="w-44 h-44 sm:w-52 sm:h-52 object-contain"
                style={{ imageRendering: "pixelated" }}
              />
            </div>

            {/* Indicaciones ultra directas */}
            <p className="text-xs font-sans font-bold text-forest pt-1">
              📸 Scan with your camera · Escanea aquí
            </p>
            <p className="text-[11px] text-stone font-sans">
              Instant mobile access · Sin descargas
            </p>

            {/* Footer padonde.lat */}
            <div className="w-full pt-2.5 border-t border-stone-200">
              <p className="font-serif text-xs font-bold text-forest">
                padonde.lat
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
