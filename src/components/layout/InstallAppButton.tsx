"use client";

export function InstallAppButton() {
  const handleClick = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("padonde_pwa_dismissed");
      window.dispatchEvent(new CustomEvent("padonde_open_install_prompt"));
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className="text-xs text-stone hover:text-forest underline underline-offset-2 transition-colors cursor-pointer font-sans inline-flex items-center gap-1.5 opacity-80 hover:opacity-100"
    >
      <span>📲</span>
      <span>Instalar PaDónde / Crear acceso directo</span>
    </button>
  );
}
