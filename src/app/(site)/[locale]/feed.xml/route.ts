import { getArticlePath, getPublishedArticles, getSiteSettings } from "@/lib/content";
import { isLocale, localeUrl } from "@/lib/i18n";

function escapeXml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

type Context = { params: Promise<{ locale: string }> };

export async function GET(_request: Request, { params }: Context) {
  const { locale: rawLocale } = await params;
  const locale = isLocale(rawLocale) ? rawLocale : "bg";
  const [settings, articles] = await Promise.all([getSiteSettings(locale), getPublishedArticles({ limit: 30, locale })]);
  const items = articles
    .map((article) => {
      const url = localeUrl(locale, getArticlePath(article));
      return `
        <item>
          <title>${escapeXml(article.title)}</title>
          <link>${url}</link>
          <guid>${url}</guid>
          <description>${escapeXml(article.excerpt || "")}</description>
          <pubDate>${new Date(article.published_at || article.created_at).toUTCString()}</pubDate>
        </item>`;
    })
    .join("");

  const xml = `<?xml version="1.0" encoding="UTF-8" ?>
    <rss version="2.0">
      <channel>
        <title>Bansko NOW</title>
        <link>${localeUrl(locale)}</link>
        <language>${locale === "en" ? "en-GB" : "bg-BG"}</language>
        <description>${escapeXml(settings.site_description || (locale === "en" ? "Events, culture, nature, people and stories from Bansko and Pirin." : "Събития, култура, природа, хора и истории от Банско и Пирин."))}</description>
        ${items}
      </channel>
    </rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=3600"
    }
  });
}
