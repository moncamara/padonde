import type { Metadata, Viewport } from "next";
import { Playfair_Display, Inter } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import GoogleAnalytics from "@/components/analytics/GoogleAnalytics";
import { ServiceWorkerRegister } from "@/components/layout/ServiceWorkerRegister";
import { OfflineBanner } from "@/components/layout/OfflineBanner";
import "../globals.css";

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#1C3829" },
    { media: "(prefers-color-scheme: dark)", color: "#1C3829" },
  ],
};

export const metadata: Metadata = {
  metadataBase: new URL("https://www.padonde.lat"),
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "PaDónde",
  },
  title: {
    default: "PaDónde — Qué hacer hoy en Minca & Santa Marta",
    template: "%s | PaDónde",
  },
  description:
    "Cartelera viva de eventos, tours, experiencias, comida y música en Minca y la Sierra Nevada de Santa Marta. Planes del día para turistas y viajeros en Colombia.",
  keywords: [
    "Minca",
    "Minca Colombia",
    "qué hacer en Minca",
    "qué hacer hoy en Minca",
    "things to do in Minca",
    "Minca events",
    "tours Minca",
    "avistamiento de aves Minca",
    "Sierra Nevada de Santa Marta",
    "Santa Marta turismo",
    "planes Minca",
    "restaurantes Minca",
    "hostales Minca",
  ],
  authors: [{ name: "PaDónde" }],
  creator: "PaDónde",
  publisher: "PaDónde",
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  alternates: {
    canonical: "./",
    languages: {
      es: "/es",
      en: "/en",
      fr: "/fr",
      de: "/de",
    },
  },
  openGraph: {
    siteName: "PaDónde",
    title: "PaDónde 🌿 Cartelera de Minca | Live Events & Tours",
    description:
      "Qué hacer hoy en Minca: eventos, música en vivo, talleres y tours. / Live tourist board: daily events, live music, workshops, wellness & local dining.",
    url: "https://www.padonde.lat",
    type: "website",
    locale: "es_CO",
    images: [
      {
        url: "https://www.padonde.lat/og_minca.jpg",
        width: 1200,
        height: 630,
        alt: "PaDónde — Cartelera Turística de Minca",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "PaDónde — Qué hacer hoy en Minca",
    description:
      "Cartelera viva de eventos, tours y experiencias en Minca y la Sierra Nevada.",
    images: ["https://www.padonde.lat/og_minca.jpg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as any)) {
    notFound();
  }

  setRequestLocale(locale);
  const messages = await getMessages();

  return (
    <html
      lang={locale}
      className={`${playfair.variable} ${inter.variable} h-full bg-cream`}
      style={{ backgroundColor: "#F4F1EA" }}
    >
      <body
        className="min-h-full flex flex-col antialiased bg-cream text-stone-dark"
        style={{ backgroundColor: "#F4F1EA" }}
      >
        <GoogleAnalytics />
        <NextIntlClientProvider messages={messages}>
          <ServiceWorkerRegister />
          <OfflineBanner />
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
