import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { isComingSoonEnabled, previewCookieName, previewToken } from "@/lib/coming-soon";
import { getSupabaseConfig } from "@/lib/env";
import type { Database } from "@/lib/types";

/**
 * Пътища, които работят и при заключен сайт: админът, за да може собственикът да
 * влиза и да пише; /api, защото оттам минава връзката с приложението за заявки и
 * заключването би спряло каталога и поръчките; самата покана; и файловете, които
 * търсачката чете, за да разбере, че сайтът е затворен.
 */
const openWhileClosed = ["/admin", "/api", "/coming-soon", "/robots.txt", "/sitemap.xml", "/icon.svg"];

/**
 * Заключването е тук, а не в страниците, защото трябва да спре изчертаването
 * изобщо. Наслагване върху сайта не върши работа: Google пак вижда цялото
 * съдържание, а любопитен посетител го стига с две кликвания.
 */
async function comingSoonRewrite(request: NextRequest) {
  if (!isComingSoonEnabled()) {
    return null;
  }

  const { pathname } = request.nextUrl;
  if (openWhileClosed.some((path) => pathname === path || pathname.startsWith(`${path}/`))) {
    return null;
  }

  const cookie = request.cookies.get(previewCookieName)?.value;
  if (cookie && cookie === (await previewToken())) {
    return null;
  }

  /* Пренаписване, а не пренасочване: адресът остава непокътнат, затова след
     отключване същият линк отваря страницата, която човекът е искал. */
  const response = NextResponse.rewrite(new URL("/coming-soon", request.url));
  response.headers.set("X-Robots-Tag", "noindex, nofollow");
  /* Поканата не се складира по чужди адреси: иначе отключен посетител може да
     получи от кеша страница, останала от заключено състояние. */
  response.headers.set("Cache-Control", "no-store");
  return response;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const closed = await comingSoonRewrite(request);
  if (closed) {
    return closed;
  }

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
      pathname === "/coming-soon" ||
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
