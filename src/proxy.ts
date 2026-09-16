import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { isComingSoonEnabled, previewCookieName, previewToken } from "@/lib/coming-soon";
import { getSupabaseConfig } from "@/lib/env";
import type { Database } from "@/lib/types";

/**
 * Пътища, които работят и при заключен сайт: админът, за да може собственикът да
 * влиза и да пише; бизнес порталът и екраните на телевизорите (кафето работи
 * независимо от това дали сайтът е отворен); /api, защото оттам минава връзката с
 * приложението за заявки и заключването би спряло каталога и поръчките; самата
 * покана; шрифтовете; и файловете, които търсачката чете, за да разбере, че сайтът
 * е затворен.
 */
const openWhileClosed = [
  "/admin",
  "/business",
  "/display",
  "/api",
  "/coming-soon",
  "/fonts",
  "/robots.txt",
  "/sitemap.xml",
  "/icon.svg"
];

/** Адреси без език в пътя: не се пренаписват към /bg. */
const localeFree = ["/en", "/api", "/business", "/display", "/fonts", "/coming-soon", "/sitemap.xml", "/robots.txt", "/icon.svg"];

/** Сесията на Supabase се опреснява само там, където има вход. */
const sessionPaths = ["/admin", "/business"];

function matchesPath(pathname: string, paths: string[]) {
  return paths.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

/**
 * QR менюто на заведение работи и при заключен сайт: гостът го сканира на
 * масата, независимо дали Bansko NOW вече е отворен. Профилът остава заключен.
 */
const qrMenuPattern = /^\/(?:en\/)?places\/[^/]+\/menu\/?$/;

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
  if (matchesPath(pathname, openWhileClosed) || qrMenuPattern.test(pathname)) {
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

  if (!matchesPath(pathname, sessionPaths)) {
    if (matchesPath(pathname, localeFree)) {
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
    "/business/:path*",
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2|woff|ttf|mp4|webm)$).*)"
  ]
};
