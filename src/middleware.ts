import { NextResponse, type NextRequest } from "next/server";
import createMiddleware from "next-intl/middleware";
import { createServerClient } from "@supabase/ssr";
import { routing } from "@/i18n/routing";

const handleI18nRouting = createMiddleware(routing);

export default async function middleware(request: NextRequest) {
  // Las rutas de API internas no requieren redirección de idiomas
  if (request.nextUrl.pathname.startsWith("/api")) {
    return NextResponse.next();
  }

  // Soporte para enlaces cortos y amigables de códigos QR (ej: /moto, /es/moto, /qr/punto)
  const pathnameClean = request.nextUrl.pathname.toLowerCase().replace(/^\/+|\/+$/g, "");
  const pathSinLocale = pathnameClean.replace(/^(es|en|fr|de)\//, "");

  if (
    pathSinLocale === "moto" ||
    pathSinLocale === "motos" ||
    pathSinLocale === "mototaxi" ||
    pathSinLocale === "mototaxis"
  ) {
    const url = request.nextUrl.clone();
    url.pathname = "/es/minca";
    url.searchParams.set("src", "mototaxis-minca");
    return NextResponse.redirect(url, 307);
  }

  if (pathSinLocale.startsWith("qr/") || pathSinLocale.startsWith("p/")) {
    const slugPunto = pathSinLocale.split("/")[1] || "punto-fisico";
    const url = request.nextUrl.clone();
    url.pathname = "/es/minca";
    url.searchParams.set("src", slugPunto);
    return NextResponse.redirect(url, 307);
  }

  // Si trae cualquier variación del parámetro moto (?moto, ?src=moto, ?ref=moto), normalizar a mototaxis-minca
  const searchLower = request.nextUrl.search.toLowerCase();
  const tieneMoto =
    request.nextUrl.searchParams.has("moto") ||
    request.nextUrl.searchParams.get("src") === "moto" ||
    request.nextUrl.searchParams.get("ref") === "moto" ||
    request.nextUrl.searchParams.get("punto") === "moto" ||
    searchLower.includes("moto");

  const hasLocale = /^\/(es|en|fr|de)(\/|$)/.test(request.nextUrl.pathname);

  if (tieneMoto && !hasLocale) {
    const url = request.nextUrl.clone();
    const p = url.pathname.replace(/^\/+|\/+$/g, "");
    url.pathname = `/es/${p || "minca"}`;
    if (url.searchParams.has("moto")) url.searchParams.delete("moto");
    url.searchParams.set("src", "mototaxis-minca");
    return NextResponse.redirect(url, 307);
  }

  // Si la petición trae query params pero no tiene prefijo de idioma (/minca?src=... o /?src=...)
  // redirigir directamente preservando la URL y params intactos sin depender de next-intl
  if (!hasLocale && request.nextUrl.search) {
    const url = request.nextUrl.clone();
    const p = url.pathname.replace(/^\/+|\/+$/g, "");
    url.pathname = `/es/${p || "minca"}`;
    return NextResponse.redirect(url, 307);
  }

  // 1. Manejar enrutamiento de idiomas
  const response = handleI18nRouting(request);

  // Asegurar que las redirecciones de idioma conserven siempre el query string completo
  // (evita que parámetros como ?moto o ?src= se pierdan al redirigir de / a /es/minca)
  if (response.status >= 300 && response.status < 400) {
    const loc = response.headers.get("location");
    if (loc && request.nextUrl.search) {
      try {
        const redirectTarget = new URL(loc, request.url);
        let updated = false;

        request.nextUrl.searchParams.forEach((v, k) => {
          if (!redirectTarget.searchParams.has(k)) {
            redirectTarget.searchParams.set(k, v);
            updated = true;
          }
        });

        if (!redirectTarget.search && request.nextUrl.search) {
          redirectTarget.search = request.nextUrl.search;
          updated = true;
        }

        if (updated) {
          const newRedirect = NextResponse.redirect(redirectTarget, response.status as 307 | 308);
          response.cookies.getAll().forEach((c) => newRedirect.cookies.set(c));
          return newRedirect;
        }
      } catch {}
    }
  }

  // 2. Refrescar sesión de Supabase Auth en las cookies
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Esto refresca el token JWT del usuario si está por expirar
  await supabase.auth.getUser();

  return response;
}

export const config = {
  matcher: ["/", "/(es|en|de|fr)/:path*", "/((?!api|_next|_vercel|.*\\..*).*)"],
};
