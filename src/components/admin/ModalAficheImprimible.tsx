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

  function handlePrint() {
    setImprimiendo(true);
    const isPared = formato === "pared";
    const maxWidth = isPared ? "580px" : "460px";
    const padding = isPared ? "32px 28px" : "22px 18px";
    const qrSize = isPared ? "210px" : "175px";
    const titleSize = isPared ? "28px" : "23px";

    const printHtml = `<!DOCTYPE html>
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
      color: #1a2e1a;
      font-family: 'Inter', -apple-system, sans-serif;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    body {
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 10px;
    }
    .poster-box {
      width: 100%;
      max-width: ${maxWidth};
      background: #ffffff;
      border: 3px solid #1c3829;
      border-radius: 26px;
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
      height: 8px;
      background: linear-gradient(90deg, #1c3829 0%, #c4622d 50%, #1c3829 100%);
    }
    .header-brand {
      text-align: center;
      margin-top: 4px;
      margin-bottom: 10px;
    }
    .badge-brand {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 3px 14px;
      background: rgba(28, 56, 41, 0.06);
      border: 1px solid rgba(28, 56, 41, 0.18);
      border-radius: 999px;
      font-family: 'Playfair Display', serif;
      font-size: 15px;
      font-weight: 700;
      color: #1c3829;
    }
    .badge-brand span.sub {
      font-family: 'Inter', sans-serif;
      font-size: 11px;
      font-weight: 500;
      color: #8a7e6e;
    }
    .point-name {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      color: #8a7e6e;
      font-weight: 600;
      margin-top: 5px;
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
      line-height: 1.15;
    }
    .title-en {
      font-family: 'Playfair Display', serif;
      font-size: 17px;
      font-style: italic;
      font-weight: 700;
      color: #c4622d;
      margin-top: 2px;
    }
    .langs-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 6px;
      max-width: 400px;
      margin: 8px auto 0 auto;
      font-size: 10.5px;
    }
    .lang-pill {
      background: #f7f4ee;
      border: 1px solid #e8e2d9;
      border-radius: 8px;
      padding: 5px 8px;
      text-align: center;
      font-weight: 600;
      color: #2e4d36;
    }
    .qr-stage {
      display: flex;
      justify-content: center;
      margin: 8px 0 12px 0;
    }
    .qr-wrapper {
      background: #faf8f5;
      border: 2px solid #1c3829;
      border-radius: 20px;
      padding: 14px 18px 12px 18px;
      text-align: center;
      position: relative;
    }
    .qr-badge-scan {
      position: absolute;
      top: -11px;
      left: 50%;
      transform: translateX(-50%);
      background: #1c3829;
      color: #ffffff;
      font-size: 9.5px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1px;
      padding: 3px 12px;
      border-radius: 999px;
      white-space: nowrap;
    }
    .qr-image {
      width: ${qrSize};
      height: ${qrSize};
      display: block;
      margin: 4px auto 0 auto;
      image-rendering: pixelated;
    }
    .qr-link {
      font-family: monospace;
      font-size: 9.5px;
      color: #8a7e6e;
      font-weight: 600;
      margin-top: 6px;
    }
    .categories-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 6px;
      margin-bottom: 12px;
    }
    .cat-card {
      background: #fbf9f6;
      border: 1px solid #e8e2d9;
      border-radius: 10px;
      padding: 6px 8px;
      text-align: center;
    }
    .cat-title {
      font-size: 11px;
      font-weight: 700;
      color: #1c3829;
    }
    .cat-sub {
      font-size: 9.5px;
      color: #8a7e6e;
      margin-top: 1px;
    }
    .footer-section {
      border-top: 1px solid #e8e2d9;
      padding-top: 8px;
      text-align: center;
    }
    .footer-features {
      display: flex;
      justify-content: center;
      gap: 10px;
      font-size: 10.5px;
      font-weight: 600;
      color: #1c3829;
      margin-bottom: 3px;
    }
    .footer-features .wa {
      color: #047857;
    }
    .footer-sub {
      font-size: 9.5px;
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
        <span>PaDónde <span class="sub">Minca</span></span>
      </div>
      ${nombreLugar ? `<p class="point-name">📍 Punto Oficial: <strong>${nombreLugar}</strong></p>` : ""}
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
        <div class="qr-badge-scan">📸 Escanea con tu cámara · Scan here</div>
        <img src="${qrImageUrl}" alt="Código QR" class="qr-image" />
        <p class="qr-link">padonde.lat/es/minca?src=${srcParam}</p>
      </div>
    </div>

    <div class="categories-grid">
      <div class="cat-card">
        <div class="cat-title">🎵 Música & Atardeceres</div>
        <div class="cat-sub">Live Music · Live-Musik</div>
      </div>
      <div class="cat-card">
        <div class="cat-title">🍫 Cacao & Café de Origen</div>
        <div class="cat-sub">Cacao & Coffee Tours</div>
      </div>
      <div class="cat-card">
        <div class="cat-title">🦜 Cascadas & Aves</div>
        <div class="cat-sub">Birding · Waterfalls</div>
      </div>
      <div class="cat-card">
        <div class="cat-title">🧘 Yoga & Bienestar</div>
        <div class="cat-sub">Sauna · Soundbath · Wellness</div>
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

    // Esperar a que renderice la fuente y la imagen del QR
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
                Afiche Turístico Multilingüe (Listo para Imprimir)
              </h3>
            </div>
            <p className="text-xs text-stone font-sans mt-0.5">
              Diseñado en <strong>4 idiomas (ES, EN, DE, FR)</strong> para que cualquier turista lo escanee en hostales o mesas.
            </p>
          </div>

          <div className="flex items-center gap-2">
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
                Póster de Pared (A4 / Carta)
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

            <button
              type="button"
              onClick={handlePrint}
              disabled={imprimiendo}
              className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-60 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs cursor-pointer transition-all active:scale-95"
            >
              <span>🖨️</span>
              <span>{imprimiendo ? "Preparando..." : "Imprimir / Guardar PDF"}</span>
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
                ? "w-full max-w-[500px] p-6 sm:p-8 space-y-5"
                : "w-full max-w-[420px] p-5 sm:p-6 space-y-3.5",
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
                <p className="text-[11px] text-stone uppercase tracking-widest font-sans font-semibold pt-0.5">
                  📍 Punto Oficial: <span className="text-forest font-bold">{nombreLugar}</span>
                </p>
              )}
            </div>

            {/* Gancho Cuadrilingüe */}
            <div className="text-center space-y-2">
              <div className="space-y-0.5">
                <h1 className="font-serif text-2xl sm:text-3xl text-forest font-black tracking-tight leading-tight">
                  ¿Qué hacer hoy en Minca?
                </h1>
                <p className="font-serif italic text-base sm:text-lg text-terra font-bold">
                  What to do today in Minca?
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 max-w-sm mx-auto text-[11px] font-sans text-forest/80 pt-0.5">
                <div className="bg-forest/5 p-1.5 rounded-lg border border-forest/10 font-medium">
                  🇩🇪 <em>Was geht heute in Minca?</em>
                </div>
                <div className="bg-forest/5 p-1.5 rounded-lg border border-forest/10 font-medium">
                  🇫🇷 <em>Que faire aujourd&apos;hui à Minca ?</em>
                </div>
              </div>
            </div>

            {/* Código QR Central */}
            <div className="flex flex-col items-center justify-center my-1">
              <div className="p-4 bg-cream/60 rounded-3xl border-2 border-forest/20 shadow-xs flex flex-col items-center relative">
                <div className="absolute -top-3 px-3 py-0.5 bg-forest text-cream text-[10px] font-sans font-bold uppercase tracking-wider rounded-full shadow-xs flex items-center gap-1">
                  <span>📸</span>
                  <span>Escanear con tu cámara</span>
                </div>

                <img
                  src={qrImageUrl}
                  alt={`Código QR ${nombreLugar}`}
                  className="w-44 h-44 sm:w-52 sm:h-52 object-contain rounded-xl"
                  style={{ imageRendering: "pixelated" }}
                />

                <p className="text-[10px] font-mono text-stone font-semibold mt-2">
                  padonde.lat/es/minca?src={srcParam}
                </p>
              </div>
            </div>

            {/* Categorías */}
            <div className="grid grid-cols-2 gap-2 text-center text-xs font-sans">
              <div className="p-2 rounded-xl bg-forest/5 border border-stone-light/80">
                <p className="font-bold text-forest text-xs">🎵 Música & Atardeceres</p>
                <p className="text-[10px] text-stone">Live Music · Live-Musik</p>
              </div>
              <div className="p-2 rounded-xl bg-forest/5 border border-stone-light/80">
                <p className="font-bold text-forest text-xs">🍫 Cacao & Café de Origen</p>
                <p className="text-[10px] text-stone">Cacao Tours · Kakao & Café</p>
              </div>
              <div className="p-2 rounded-xl bg-forest/5 border border-stone-light/80">
                <p className="font-bold text-forest text-xs">🦜 Cascadas & Aves</p>
                <p className="text-[10px] text-stone">Birding · Waterfalls</p>
              </div>
              <div className="p-2 rounded-xl bg-forest/5 border border-stone-light/80">
                <p className="font-bold text-forest text-xs">🧘 Yoga & Bienestar</p>
                <p className="text-[10px] text-stone">Sauna · Soundbath · Wellness</p>
              </div>
            </div>

            {/* Pie de página */}
            <div className="pt-2.5 border-t border-stone-light/70 text-center space-y-1 font-sans">
              <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-0.5 text-[10.5px] text-forest font-semibold">
                <span className="flex items-center gap-1">
                  <span>⚡</span> Sin descargar apps (Abre en tu navegador)
                </span>
                <span>·</span>
                <span className="flex items-center gap-1 text-emerald-800">
                  <span>💬</span> Reserva directa con anfitriones por WhatsApp
                </span>
              </div>
              <p className="text-[9.5px] text-stone">
                Cartelera turística comunitaria de Minca, Sierra Nevada de Santa Marta 🌿 <strong>www.padonde.lat</strong>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
