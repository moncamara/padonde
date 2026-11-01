import { redirect } from "next/navigation";
import { routing } from "@/i18n/routing";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

/**
 * Redirección estática ultra liviana a la zona principal (Minca).
 * La persistencia entre destinos se maneja en el cliente sin levantar funciones Serverless.
 */
export default async function LocalePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  redirect(`/${locale}/minca`);
}
