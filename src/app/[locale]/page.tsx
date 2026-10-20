import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { ZONAS } from "@/constants";

export default async function LocalePage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { locale } = await params;
  const sParams = (await searchParams) || {};
  const query = new URLSearchParams();
  for (const [k, v] of Object.entries(sParams)) {
    if (typeof v === "string") query.set(k, v);
    else if (Array.isArray(v)) v.forEach((val) => query.append(k, val));
  }
  const queryString = query.toString() ? `?${query.toString()}` : "";

  const cookieStore = await cookies();
  const lastZona = cookieStore.get("padonde_zona")?.value;
  const zonaValida = ZONAS.find((z) => z.slug === lastZona && z.activa);
  const targetZona = zonaValida ? zonaValida.slug : "minca";

  redirect(`/${locale}/${targetZona}${queryString}`);
}
