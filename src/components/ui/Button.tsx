import { type ButtonHTMLAttributes } from "react";

type Variant = "primary" | "ghost" | "outline";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

const styles: Record<Variant, string> = {
  primary: "bg-terra text-white hover:bg-terra-dark active:scale-95",
  ghost:   "bg-transparent text-forest hover:bg-stone-light",
  outline: "border border-forest text-forest hover:bg-forest hover:text-white",
};

const sizes: Record<Size, string> = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-5 py-2.5 text-sm",
  lg: "px-6 py-3 text-base",
};

/**
 * Botón base reutilizable con variantes de la marca PaDónde.
 * Variantes: primary (terracota), ghost (transparente), outline (borde verde).
 */
export function Button({
  variant = "primary",
  size = "md",
  className = "",
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={[
        "inline-flex items-center justify-center gap-2 rounded-full font-sans font-medium",
        "transition-all duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed",
        styles[variant],
        sizes[size],
        className,
      ].join(" ")}
      {...props}
    >
      {children}
    </button>
  );
}
