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

  // Soporte para enlaces cortos y amigables de códigos QR (ej: /moto, /motos, /mototaxis)
  const pathnameClean = request.nextUrl.pathname.toLowerCase().replace(/^\/+|\/+$/g, "");
  if (
    pathnameClean === "moto" ||
    pathnameClean === "motos" ||
    pathnameClean === "mototaxi" ||
    pathnameClean === "mototaxis"
  ) {
    const url = request.nextUrl.clone();
    url.pathname = "/es/minca";
    url.searchParams.set("src", "mototaxis-minca");
    return NextResponse.redirect(url, 307);
  }

  if (pathnameClean.startsWith("qr/") || pathnameClean.startsWith("p/")) {
    const slugPunto = pathnameClean.split("/")[1] || "punto-fisico";
    const url = request.nextUrl.clone();
    url.pathname = "/es/minca";
    url.searchParams.set("src", slugPunto);
    return NextResponse.redirect(url, 307);
  }

  // 1. Manejar enrutamiento de idiomas
  const response = handleI18nRouting(request);

  // Asegurar que las redirecciones de idioma conserven siempre el query string completo
  // (evita que parámetros como ?moto o ?src= se pierdan al redirigir de / a /es/minca)
  if (response.status >= 300 && response.status < 400) {
    const loc = response.headers.get("location");
    if (loc && request.nextUrl.search && !loc.includes("?")) {
      response.headers.set("location", `${loc}${request.nextUrl.search}`);
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
