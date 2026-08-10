import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { getSupabaseConfig } from "@/lib/env";
import type { Database } from "@/lib/types";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === "/bg" || pathname.startsWith("/bg/")) {
    const url = request.nextUrl.clone();
    url.pathname = pathname.replace(/^\/bg(?=\/|$)/, "") || "/";
    return NextResponse.redirect(url, 308);
  }

  if (!pathname.startsWith("/admin")) {
    if (
      pathname === "/en" ||
      pathname.startsWith("/en/") ||
      pathname.startsWith("/api") ||
      pathname === "/sitemap.xml" ||
      pathname === "/robots.txt" ||
      pathname === "/icon.svg"
    ) {
      return NextResponse.next({ request });
    }

    const url = request.nextUrl.clone();
    url.pathname = `/bg${pathname === "/" ? "" : pathname}`;
    return NextResponse.rewrite(url);
  }

  const config = getSupabaseConfig();

  if (!config) {
    return NextResponse.next({ request });
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient<Database>(config.url, config.anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      }
    }
  });

  await supabase.auth.getClaims();

  return response;
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"
  ]
};
