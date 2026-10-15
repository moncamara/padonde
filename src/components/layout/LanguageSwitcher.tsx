"use client";

import { useLocale } from "next-intl";
import { useRouter, usePathname } from "@/i18n/routing";

const IDIOMAS = [
  { code: "es", label: "ES", flag: "🇨🇴" },
  { code: "en", label: "EN", flag: "🇬🇧" },
  { code: "fr", label: "FR", flag: "🇫🇷" },
  { code: "de", label: "DE", flag: "🇩🇪" },
];

export function LanguageSwitcher() {
  const currentLocale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  function switchLocale(nextLocale: string) {
    if (nextLocale === currentLocale) return;
    router.replace(pathname, { locale: nextLocale });
  }

  return (
    <div className="flex items-center gap-1 bg-stone-light/60 p-1 rounded-full text-xs font-sans">
      {IDIOMAS.map(({ code, label }) => {
        const isActive = currentLocale === code;
        return (
          <button
            key={code}
            onClick={() => switchLocale(code)}
            className={[
              "px-2.5 py-1 rounded-full transition-all duration-150 font-medium",
              isActive
                ? "bg-forest text-white shadow-sm"
                : "text-stone hover:text-forest",
            ].join(" ")}
            aria-label={`Cambiar a ${label}`}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
