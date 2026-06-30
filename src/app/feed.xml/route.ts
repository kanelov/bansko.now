import { getArticlePath, getPublishedArticles, getSiteSettings } from "@/lib/content";
import { siteUrl } from "@/lib/env";

function escapeXml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

export async function GET() {
  const [settings, articles] = await Promise.all([getSiteSettings(), getPublishedArticles({ limit: 30 })]);
  const items = articles
    .map((article) => {
      const url = `${siteUrl}${getArticlePath(article)}`;
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
        <link>${siteUrl}</link>
        <description>${escapeXml(settings.site_description || "Събития, култура, природа, хора и истории от Банско и Пирин.")}</description>
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
