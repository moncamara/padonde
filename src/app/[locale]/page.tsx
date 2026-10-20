import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { ZONAS } from "@/constants";

export default async function LocalePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const cookieStore = await cookies();
  const lastZona = cookieStore.get("padonde_zona")?.value;
  const zonaValida = ZONAS.find((z) => z.slug === lastZona && z.activa);
  const targetZona = zonaValida ? zonaValida.slug : "minca";

  redirect(`/${locale}/${targetZona}`);
}
