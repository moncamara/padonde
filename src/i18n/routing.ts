import { defineRouting } from "next-intl/routing";
import { createNavigation } from "next-intl/navigation";

export const routing = defineRouting({
  locales: ["es", "en", "fr", "de"],
  defaultLocale: "es",
  localePrefix: "always", // URLs tipo /es/minca, /en/minca, /fr/minca, /de/minca
  localeDetection: false, // El idioma base siempre es Español salvo que el usuario elija otro manualmente
});

export const { Link, redirect, usePathname, useRouter } = createNavigation(routing);
