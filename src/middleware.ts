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

  // 1. Manejar enrutamiento de idiomas
  const response = handleI18nRouting(request);

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
